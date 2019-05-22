/* --- require() Definitions and Functions --- */
const cssParser = require('css');
const common = require("../common.js");

const fs = common.fs;
const glob = common.glob;
const path = common.path;

const expect = common.expect;
const isArray = common.isArray;

const escapeHTML = common.escapeHTML;
const determineFileDir = common.determineFileDir;
const getDirectories = common.getDirectories;

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

function main(title, variables, statement, errorMessage, hints) {

	var cssFiles = null, found = false;

	var cssPath = variables['CSS_PATH'];
	var property = variables['PROPERTY'];
	var selector = (variables['SELECTOR'] != null) ? variables['SELECTOR'] : null;
	var value = (variables['VALUE'] != null) ? variables['VALUE'] : null;

	var exists = (variables['EXISTS'] != null) ? variables['EXISTS'] : true;
	var itStatement = (statement.length != 0) ? statement : (exists) ? 'Expect CSS declaration to exist' : 'Expect CSS declaration to NOT exist';
	var errorStatement = (errorMessage.length != 0) ? errorMessage : (exists) ? "CSS declaration doesn't exist when it should!" : "CSS declaration exists when it shouldn't!";
	var hintsStatement = (hints && hints.length > 0) ? hints : '';

	describe(title, function () {

		//var startTime, endTime;

		before(function(done) {
			//startTime = new Date();
			getCSSFiles(cssPath, files=>{
				if (files instanceof Error) {
					found = false;
					errorStatement = "Error retrieving all files";
					if (hintsStatement.length == 0) {
						hintsStatement = '- Check that all CSS files are present within the correct directory\n- Make sure file names are not mispelled or that files are named incorrectly';
					}
					done();
				} else if (files.length == 0) {
					found = false;
					errorStatement = "No files found within the given directory"
					if (hintsStatement.length == 0) {
						hintsStatement = '- Check that all CSS files are present within the correct directory\n- Make sure file names are not mispelled or that files are named incorrectly';
					}
					done();
				} else {
					var contents, parsed, rules;
					var loop = function(index, array, res, callback) {
						if (!res && index < array.length) {
							file = array[index];
							contents = fs.readFileSync(file, 'utf8');
							parsed = cssParser.parse(contents);
							rules = parsed['stylesheet']['rules'];
							findCSS(rules,property,selector,value,res,newRes=>{
								//res MUST be a boolean either true or false
								res = res || newRes;
								loop(index+1,array,res,callback);
							});
						}
						else callback(res);
					}
					loop(0,files,false,res=>{
						found = res;
						done();
					});
				}
			});
		});

		it(itStatement, function(done) {
			if (!found && hintsStatement.length == 0) {
				hintsStatement = "CSS files found, but necessary CSS missing.\n- Make sure your CSS doesn't contain CSS errors, if possible\n- Check for typos and incorrect values";
			}
			expect(found, errorStatement).to.equal(exists);
			done();
		});

		afterEach(function(done) {
			//endTime = new Date();
			//console.log(endTime - startTime);
			if (found != exists && hintsStatement && hintsStatement.length > 0) this.currentTest.context = {'title':'Hints','value':hintsStatement};
			done();
		});

	});
}

exports.main = main;
