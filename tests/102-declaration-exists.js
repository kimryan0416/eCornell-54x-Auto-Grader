/* --- require() Definitions and Functions --- */
const cssParser = require('css');
const common = require("../common.js");

const fs = common.fs;
const glob = common.glob;
const path = common.path;

const isArray = common.isArray;
const escapeHTML = common.escapeHTML;
const determineFileDir = common.determineFileDir;
const determineFileDirAsync = common.determineFileDirAsync;
const getDirectories = common.getDirectories;
const getDirectoriesAsync = common.getDirectoriesAsync;

function getCSSFiles(url, callback) {
	determineFileDir(url, stat=>{
		if (stat instanceof Error) callback(stat);
		else if (stat == 0) {
			getDirectories(url, (errs, dirs)=>{
				var files = dirs.filter(function(file) {
					if (path.extname(file) == '.css') return file;
				});
				callback(files);
			});
		} 
		else if (stat == 1) {
			if (path.extname(url) == '.css') callback([url]);
			else callback(new Error ('Not a CSS file'));
		}
		else callback(new Error('Error retrieving all files'));
	});

}

function findCSS(rule, property, selector, value, found, callback) {
	var thisFound = found;
	if (!thisFound) {
		if (isArray(rule)) {
			var loop = function(index,array,res,next) {
				if (!res && index < array.length) {
					findCSS(array[index],property,selector,value,res,thisNext=>{
						res = res || thisNext;
						loop(index+1,array,res,next);
					});
				}
				else next(res);
			}
			loop(0,rule,thisFound,res=>{
				thisFound = thisFound || res;
				callback(thisFound);
			});
		}
		else {
			if (rule.type == 'rule') {
				if ( selector == null || (rule.selectors.indexOf(selector) > -1) ) {
					findCSS(rule.declarations,property,selector,value,thisFound,res=>{
						thisFound = thisFound || res;
						callback(thisFound);
					});
				} 
				else callback(thisFound);
			}
			else if (rule.type == 'declaration') {
				thisFound = thisFound || rule.property == property;
				thisFound = ( value != null ) ? (thisFound && rule.value == value) : thisFound;
				callback(thisFound);
			}
			else callback(thisFound);
		}
	}
	else callback(thisFound);
}

function main(name, custom_title, custom_message, variables, done) {

	var cssFiles = null, found = false;
	var contents, parsed, rules;

	var cssPath = variables['CSS_PATH'];
	var property = variables['PROPERTY'];
	var selector = (variables['SELECTOR'] != null) ? variables['SELECTOR'] : null;
	var value = (variables['VALUE'] != null) ? variables['VALUE'] : null;

	var exists = (variables['EXISTS'] != null) ? variables['EXISTS'] : true;
	var testTitle = (custom_title) ? escapeHTML(custom_title) : (exists) ? 'Expect CSS declaration to exist' : 'Expect CSS declaration to NOT exist';
	var testMessage = (custom_message) ? escapeHTML(custom_message) : (exists) ? "CSS declaration doesn't exist when it should!" : "CSS declaration exists when it shouldn't!";

	getCSSFiles(cssPath, files=>{
		if (files instanceof Error || files.length == 0) {
			if (!custom_message) testMessage = "Error retrieving all files\n- Check that all CSS files are present within the correct directory\n- Make sure file names are not mispelled or that files are named incorrectly";
			done({
				name: name,
				title: testTitle,
				success: false,
				message: testMessage,
				console_message: files
			});
		} else {
			Promise.all(files.map(file=>{
				return new Promise((resolve,reject)=>{
					try {
						contents = fs.readFileSync(file, 'utf8');
						parsed = cssParser.parse(contents);
						rules = parsed['stylesheet']['rules'];
						findCSS(rules,property,selector,value,found,f=>{
							found = found || f;
							resolve();
						});
					} catch(err) {
						if (!custom_message) testMessage = err;
						resolve();
					}
				});
			})).then(()=>{
				if (!found && !custom_message) testMessage = "CSS files found, but necessary CSS missing.\n- Make sure your CSS doesn't contain CSS errors, if possible\n- Check for typos and incorrect values";
				done({
					name: name,
					title: testTitle,
					success: found,
					message: testMessage,
					console_message: testMessage
				});
			});

		}
	});

}

exports.main = main;
