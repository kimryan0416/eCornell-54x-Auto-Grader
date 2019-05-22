/* --- require() Definitions and Functions --- */
const cssParser = require('css');
const common = require("../common.js");

const fs = common.fs;
const glob = common.glob;
const path = common.path;

const isArray = common.isArray;
const escapeHTML = common.escapeHTML;
const getDirectories = common.getDirectories;

function getCSSFiles(url, callback) {
	fs.lstat(url, (err, stats)=>{
		if (err) callback(err);
		else if (stats.isDirectory()) {
			getDirectories(url, (errs, dirs)=>{
				var files = dirs.filter(function(file) {
					if (path.extname(file) == '.css') return file;
				});
				callback(files);
			});
		} 
		else if (stats.isFile()) {
			if (path.extname(url) == '.css') callback([url]);
			else callback(new Error ('Not a CSS file'));
		}
		else callback(new Error('Error retrieving all files'));
	});
}

function filterRules(filtered,rule) {
	// If the current item is a RULE, we do the following:
	// 1) for each selector associated with that rule:
	// 2) create a new variable called "filteredDeclarations", which is equal to a reduced version of the array of declarations associated with the original rule
	// 3) the array of declarations we're reducing will reduce down to an Object: keys = declaration property (i.e. "display"), value = declaration value (i.e. "block")
	// In other words, "filteredDeclarations" is turned into an Object wherein the keys are the properties and the values are the properties's values
	// 4) if "filteredDeclarations" is not empty, we add it to filtered, which represents the end result of "filteredRules"
	// The purpose of checking if filtered[sel] is not undefined is because we need to confirm if it exists yet
	// if it still exists, we need to initialize it before we start adding to it with Object.assign()
	// What is ultimately returned to "filteredRules" is an Object where the keys are the selectors and their values are also Objects where the keys are the declaration properties and their values are the declaration values
	// 5) If we happen to run into a media query, then we must parse through the media query as well
	switch(rule.type) {
		case('media'):
			// media queries have their own system of rules and declarations
			// mediaRules therefore is an object in of itself - 
			// 		its keys are selectors, and its values are arrays containing declarations
			// Before we append this to the actual "filtered" value, we have to do something first: 
			// 		add a new "media" value to each declaration, that corresponds with the media query
			var mediaRules = rule.rules.reduce(filterRules,{});
			if (Object.keys(mediaRules).length > 0) {
				Object.keys(mediaRules).forEach(sel=>{
					let tempDeclarations = mediaRules[sel];
					tempDeclarations.forEach((dec,index)=>{
						let tempDec = dec;
						tempDec.media = rule.media.toLowerCase().replace(/\s/g,'');
						this[index] = tempDec;
					},tempDeclarations);
					filtered[sel] = (typeof filtered[sel] !== 'undefined') ? filtered[sel] : [];
					filtered[sel] = filtered[sel].concat(tempDeclarations);
				});
			}
			break;
		case('rule'):
			rule.selectors.forEach(sel=>{
				// Filter so that comments are removed
				var filteredDeclarations = rule.declarations.filter(declaration => { 
					return declaration.type == 'declaration';
				});
				// If "filteredDeclarations" is not empty, append it to filtered
				if (filteredDeclarations.length > 0) {
					filtered[sel] = (typeof filtered[sel] !== 'undefined') ? filtered[sel] : [];
					filtered[sel] = filtered[sel].concat(filteredDeclarations);
					//filtered[sel] = Object.assign(filtered[sel],filteredDeclarations);
				}
			});
			break;
	}
	return filtered;
}

function main(name, custom_title, custom_message, variables, done) {

	var cssFiles = null, found = false;
	var contents, parsed, rules, filteredRules;

	var cssPath = variables['CSS_PATH'];
	var property = variables['PROPERTY'];
	var selector = (variables['SELECTOR'] != null) ? variables['SELECTOR'] : null;
	var value = (variables['VALUE'] != null) ? variables['VALUE'] : null;
	var media = (variables['MEDIA'] != null && typeof variables['MEDIA'] === 'object') ? variables['MEDIA'] : null; 
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
						// Filter through rules extracted from the stylesheet
						filteredRules = rules.reduce(filterRules,{});
						found = Object.keys(filteredRules).reduce((found,sel)=>{
							var declarations = filteredRules[sel];
							if (!found) {
								let tempFound = declarations.reduce((f,d)=>{
									f = f || d.property.toLowerCase() == property.toLowerCase();
									return f;
								},false)
								found = found || tempFound;
								if (found && selector != null) found = (selector == sel);
								if (found && value != null) {
									found = declarations.reduce((f,d)=>{
										f = f || value.toLowerCase() == d.value.toLowerCase();
										return f;
									},false);
								}
								if (found && media != null) {
									found = declarations.reduce((f,d)=>{
										f = f || (d.media != null && media.reduce((f2,m)=>{
											f2 = f2 || d.media.indexOf(m.toLowerCase().replace(/\s/g,'')) > -1;
											return f2;
										},false));
										return f;
									},false);
								}
							}
							return found;
						},found);
						resolve();
					} catch(err) {
						if (!custom_message) testMessage = err;
						resolve();
					}
				});
			})).then(()=>{
				if (found != exists && !custom_message) testMessage = {"CSS files found, but necessary CSS missing":"- Make sure your CSS doesn't contain CSS errors, if possible\n- Check for typos and incorrect values"};
				done({
					name: name,
					title: testTitle,
					success: found == exists,
					message: testMessage,
					console_message: testMessage
				});
			});

		}
	});

}

exports.main = main;
