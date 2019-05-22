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

function findDeclarations(filtered,rule) {
	if (typeof rule === 'object') {
		if (isArray(rule)) {
			var newFiltered = rule.reduce(findDeclarations,[]);
			var tempFiltered = newFiltered.filter(f=>{return f.type == 'declaration';});
			tempFiltered.forEach(t=>{filtered.push(t);});
		}
		switch(rule.type) {
			case('declaration'):
				filtered.push(rule);
				break;
			default:
				if (typeof rule.declarations !== 'undefined' && isArray(rule.declarations) && rule.declarations.length > 0) {
					var tempFiltered = rule.declarations.filter(d=>{return d.type == 'declaration';});
					tempFiltered.forEach(d=>{filtered.push(d);});
				}
				else {
					var arraysParsed = Object.keys(rule).reduce((kT,k)=>{
						let val = rule[k];
						if (isArray(val)) val.forEach(v=>{kT.push(v)});
						return kT;
					},[]);
					if (arraysParsed.length > 0) {
						var tempFiltered = arraysParsed.reduce(findDeclarations,[]);
						tempFiltered.forEach(t=>{filtered.push(t);});
					}
				}
		}
	}
	return filtered;
}

function main(name, custom_title, custom_message, variables, done) {

	var cssFiles = null, found = false, propertiesFound = false;
	var contents, parsed, rules, filteredRules;

	var cssPath = variables['CSS_PATH'];
	var type = variables['TYPE'];
	var properties = (variables['PROPERTIES'] != null) ? variables['PROPERTIES'] : {};
	var exists = (variables['EXISTS'] != null && typeof variables['EXISTS'] === 'boolean') ? variables['EXISTS'] : true;

	var testTitle = (custom_title) ? escapeHTML(custom_title) : (exists) ? 'Expect CSS type to exist' : 'Expect CSS type to NOT exist';
	var testMessage = (custom_message) ? escapeHTML(custom_message) : (exists) ? "CSS type doesn't exist when it should!" : "CSS type exists when it shouldn't!";

	getCSSFiles(cssPath, files=>{
		if (typeof properties !== 'object') {
			testMessage = "Retrieved PROPERTIES value in tests.json is not an Object - check that PROPERTIES is an object";
			done({
				name: name,
				title: testTitle,
				success: false,
				message: testMessage,
				console_message: testMessage
			});
		} else if (isArray(properties)) {
			testMessage = "Retrieved PROPERTIES value in tests.json is an array, not an Object - check that PROPERTIES is an object";
			done({
				name: name,
				title: testTitle,
				success: false,
				message: testMessage,
				console_message: testMessage
			});
		} else if (files instanceof Error || files.length == 0) {
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
						if (!found) {
							contents = fs.readFileSync(file, 'utf8');
							parsed = cssParser.parse(contents);
							rules = parsed['stylesheet']['rules'];
							var filteredRules;
							// Filter through rules extracted from the stylesheet

							switch(type.toLowerCase()) {
								case('keyframe'):
									filteredRules = rules.reduce((filtered,r)=>{
										if (r.type == 'keyframes')
											filtered.concat(r.keyframes);
										return filtered;
									},[]);
									break;
								case('declaration'):
									filteredRules = rules.reduce(findDeclarations,[]);
									break;
								default:
									filteredRules = rules.filter(r=>{
										return r.type == type.toLowerCase();
									});
							}
							found = filteredRules.reduce((f,i)=>{
								//console.log(i);
								f = f || i.type == type.toLowerCase();
								if (properties != null && propertiesFound == false) {
									var total = Object.keys(properties).length;
									var count = 0;
									Object.keys(properties).forEach(p=>{
										if (
											Object.keys(i).indexOf(p.toLowerCase()) > -1 
											&& 
											i[p.toLowerCase()].toLowerCase().replace(/\s/g,'').indexOf(properties[p].toLowerCase().replace(/\s/g,'')) > -1
										) count++;
										
										//fP = fP || (Object.keys(i).indexOf(p.toLowerCase()) > -1 && i[p.toLowerCase()].toLowerCase().trim() == properties[p].toLowerCase().trim());
										//console.log(fP);
										//return fP;
									});
									propertiesFound = total == count;
									f = f && propertiesFound;
								} else {
									propertiesFound = true;
								}
								return f;
							},false);
						}
						resolve();
					} catch(err) {
						if (!custom_message) testMessage = err;
						resolve();
					}
				});
			})).then(()=>{
				if (found != exists && !custom_message) testMessage = {"CSS files found, but necessary CSS missing.":"- Make sure your CSS doesn't contain CSS errors, if possible\n- Check for typos and incorrect values"};
				done({
					name: name,
					title: testTitle,
					success: found == exists && propertiesFound == true,
					message: testMessage,
					console_message: testMessage
				});
			});

		}
	});

}

exports.main = main;
