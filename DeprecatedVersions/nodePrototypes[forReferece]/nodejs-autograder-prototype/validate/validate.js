/* --- require() Definitions --- */
const exec = require('child_process').exec;
const path = require('path');
const fs = require('fs');
const glob = require("glob");
const getDirectories = (src, callback) => {
	glob(src + "/**/*", callback);
}
const parser_html = require('node-html-parser');
const parser_css = require('css');


/* --- All Functions For Validation --- */

/* Be careful, we must determine the path to our vnu.jar file if not in the same directory as this module file */
var vnuPath = "vnu.jar";

/*
// validateHTMLFile() = a function that looks at a directory path and returns any errors present within the HTML files there
// Parameters:
//		- url = the path to the directory that contains HTML files
//		- conditions = a JS object list that contains the conditions necessary for testing (i.e. whether toggle is activated, or even if HTML validation toggle is activated)
//		- callback = our callback function
// We also require a direct link to our vnu.jar, which should be present within the same directory as this file by default
// 		- otherwise, you must specify the path to our vnu.jar file via the 'vnuPath' variable above
*/
function validateHTMLFiles(url, conditions, callback) {
	// Return null if either rubric["validation"]["toggle"] or rubric["validation"]["html"] is false
	if ( !conditions["toggle"] || !conditions["html"] ) {
		callback(null);
		return;
	}
	var child = exec('java -jar '+vnuPath+' --skip-non-html --format json '+ url, function (error, stdout, stderr){
		parseErrors(JSON.parse(stderr), (res)=>{
			callback(res);
		});
		/*
		if(error !== null){
			parseErrors(JSON.parse(stderr), (res)=>{
				callback(res);
			});
		} else {
			callback(null);
		}
		*/
	});
}

/*
// validateHTMLText() = a function that looks at plain HTML text and returns any errors present
// Parameters:
//		- content = the HTML plain text
//		- callback = our callback function
// We also require a direct link to our vnu.jar, which should be present within the same directory as this file by default
// 		- otherwise, you must specify the path to our vnu.jar file via the 'vnuPath' variable above
*/
function validateHTMLText(content, callback) {
	if (content == null) {
		callback('content inputted is NULL', null);
		return;
	}
	var insertText;
	var html_parsed = content.split("\n");
	var firstCharIndex = html_parsed[0].search(/\S|$/);
	var firstLineSub = html_parsed[0].substring(firstCharIndex, firstCharIndex+5);
	if ( firstLineSub.toLowerCase() != "<!doc" && firstLineSub.toLowerCase() != "<html" ) insertText = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>test5 Submission</title><style>span {color:blue;}</style></head><body>'+content+'</body></html>';
	else insertText = content;
	var child = exec( 'echo \"' + insertText + '\" | java -jar '+vnuPath+' --format json -', (error, stdout, stderr)=>{
		if(error !== null){
			parseErrors(JSON.parse(stderr), (res)=>{
				callback(null, res);
			});
			return;
		} else {
			callback(null, null);
			return;
		}
	});
}

/*
// validateCSSFile() = a function that looks at a directory path and returns any errors present within the CSS files there
// Parameters:
//		- url = the path to the directory that contains CSS files
//		- conditions = a JS object list that contains the conditions necessary for testing (i.e. whether toggle is activated, or even if HTML validation toggle is activated)
//		- callback = our callback function
// We also require a direct link to our vnu.jar, which should be present within the same directory as this file by default
// 		- otherwise, you must specify the path to our vnu.jar file via the 'vnuPath' variable above
*/
function validateCSSFiles(url, conditions, callback) {
	// Return null if either rubric["validation"]["toggle"] or rubric["validation"]["html"] is false
	if ( !conditions["toggle"] || !conditions["css"] ) {
		callback(null);
		return;
	}
	var child = exec('java -jar '+vnuPath+' --skip-non-css --format json '+url, function (error, stdout, stderr){
		parseErrors(JSON.parse(stderr), (res)=>{
			callback(res);
		});
		/*
		if(error !== null){
			parseErrors(JSON.parse(stderr), (res)=>{
				callback(res);
				return;
			});
			return;
		} else {
			callback(null);
		}
		*/
	});
}

/*
// validateCSSText() = a function that looks at plain CSS text and returns any errors present
// Parameters:
//		- content = the CSS plain text
//		- callback = our callback function
// We also require a direct link to our vnu.jar, which should be present within the same directory as this file by default
// 		- otherwise, you must specify the path to our vnu.jar file via the 'vnuPath' variable above
// Also, note that in order for this to work properly, we must create a temporary file named "css_input_test.css" and store our CSS text inside
// This is because vnu.jar, by default, parses through code as HTML always if provided standard text and not files
// We create this file, vnu.jar parses through it while treating it as proper CSS, then removes the file upon completion of parsing
// We then parse through errors like normal
*/
function validateCSSText(content, callback) {
	fs.writeFileSync("css_input_test.css", content, 'utf-8');
	var child = exec( 'java -jar '+vnuPath+' --css --format json css_input_test.css', (error, stdout, stderr)=>{
		fs.unlinkSync("css_input_test.css");
		if(error !== null){
			parseErrors(JSON.parse(stderr), callback);
			return;
		} else {
			callback(null);
			return;
		}
	});
}

/*
// parseErrors() = a function that parses through errors given by vnu.jar - used by both HTML and CSS validation
// Paramters:
//		- errors = the errors message returned by vnu.jar
//		- callback = our callback function, whatever that may be
*/
function parseErrors(errors, callback) {
	if (errors == null) {
		callback(null);
		return;
	}
	var errors_sorted = {
		"totals":{
			"error":0,
			"info":0,
			'files':[]
		}
	};
	var loopThroughErrors = function(index) {
		if ( index < Object.keys(errors["messages"]).length ) {
			var error = errors["messages"][index];
			if ( typeof errors_sorted[error["url"]] === "undefined" ) {
				errors_sorted[error["url"]] = {
					"error":[],
					"info":[]
				}
			}
			errors_sorted[error["url"]][error["type"]].push(error);
			errors_sorted["totals"][error["type"]] += 1;
			if ( errors_sorted['totals']['files'].indexOf(error['url']) == -1 ) errors_sorted['totals']['files'].push(error['url']);
			loopThroughErrors(index+1);
		} else {
			callback(errors_sorted);
		}
	} 
	loopThroughErrors(0);
}


/* --- All Functions For HTML Indentation Checking --- */

/*
// detectIndentHTML: detect indentation errors within HTML files
// Parameters:
// 		- files = an array of files, can be mixed with other types since only the HTML files are parsed through
// 		- conditions = a JS object list that contains toggles for whether if the function should run upon being called
//		- callback = our callback function
*/
function detectIndentHTML(files, conditions, callback) {
	/* If the condition toggle is false or we specifically turned off html indentation checking, we return 0 errors */
	if ( conditions['toggle'] != true || conditions['html'] != true ) {
		callback({'total':0});
		return;
	}
	/*
	// We initialize several variables that we'll need:
	// indent_errors: an array containing all of our indentation errors accumulated across all HTML files
	// total_indent_errors = our count for how many indentation errors we've accumulated across all HTML files
	*/
	var indent_errors = [], total_indent_errors = 0;
	var errorRatio = ( conditions['errorRatio'] != null ) ? conditions['errorRatio'] : 0.5;

	/* We filter through our array of provided files to filter out any files that aren't HTML */
	var html_files = files.filter(function(d) {
		if (path.extname(d) == ".html") return d;
	});

	/*
	// We initialize a synchronous loop that looks at each file and attempts to read each file
	// If it cannot read it, it returns an error for that file in its entirety
	// If it CAN read it, we need to parse through it (description continued within the loop)
	*/
	var loopThroughFiles = function(index) {
		if (index < html_files.length) {
			var file = html_files[index];
			if (path.extname(file) == ".html") {
				fs.readFile(file, 'utf8', function(err, html) {
					if (err) {
						/* We found that we cannot read through our HTML file - we return an error for that file */
						indent_errors.push({
							"file":file,
							"error_type":1,
							"error_message":"Could not parse through HTML file to check indentation",
							'total_errors':1
						});
						total_indent_errors += 1;
						loopThroughFiles(index+1);
					} 
					else {
						/* We splice the HTML by newline - we don't need to worry about blank lines because this removes them by default */
						var html_array = html.split("\n");
						var numLines = html_array.length;

						/* We get the index, or line, where "<html" starts inside our html file */
						parseHTMLForBeginning(html_array, (beginning_index)=>{

							/* If the returned index is -1, we just default to 0 */
							if (beginning_index == -1) {
								beginning_index = 0;
							}
							numLines = numLines - (beginning_index+1);

							/* We parse through our HTML 2 lines at a time, checking for indentation errors */
							parseHTML(html_array, beginning_index, (res)=>{
								if ( (res.length) > 0 && (res.length/numLines >= errorRatio) ) {
									total_indent_errors += res.length;
									indent_errors.push({
										'file':file,
										'error_type':0,
										'errors':res,
										'total_errors':res.length
									});
								}
								loopThroughFiles(index+1);
							});
						});
					}
				});
			} 
			else loopThroughFiles(index+1);
		} else {
			callback({'total':total_indent_errors,'total_html_files':html_files,'errors':indent_errors});
		}
	}
	loopThroughFiles(0);
}

/*
// parseHTMLForBeginning() = a function that looks at an HTML text divided by newlines and looks for where <html> starts
// Returns the index (the line - 1) of where the <html> tag is located
// Parameters:
// 		- html = an array consisting of each line of our HTML plain text
// 		- callback = our callback function
*/
function parseHTMLForBeginning(html, callback) {
	var trimmed;
	var loopThroughHTML = function(index) {
		if (index < html.length) {
			trimmed = html[index].replace(/\s/g,'');
			if (trimmed.substring(0, 5) == '<html') callback(index);
			else loopThroughHTML(index+1);
		} else {
			callback(-1);
		}
	}
	loopThroughHTML(0);
}

/*
// parseHTML = parse through an array of HTML lines, starting from 'beginning', and check for indentation inconsistencies
// Parameters:
// 		- html_array: our array of HTML lines
// 		- beginning: the index where we start within our html_array
// 		- callback: our callback function
*/
function parseHTML(html_array, beginning, callback) {
	/* Initialize variables */
	var line1, line2;
	var indent1, newIndent1;
	var indent2, newIndent2;
	var combRoot_array, combRoot_string;
	var root, childrenOfRoot, numChildren;
	var numResults = 0, results = [], lineErrors = [], errorLine;

	var loopThroughHTMLArray = function(index) {
		/* we go with html_array.length - 1 because if we reach </html>, then there's nothing left and we'll return an error */
		if (index < html_array.length - 1) {
			errorLine = null;
			newIndent1 = null;
			newIndent2 = null;
			combRoot_array = null;
			combRoot_string = null;

			/* Parse through the two lines we're looking at, while removing \t characters to prevent errors */
			line1 = html_array[index].replace(/\t/g, '    ');
			line2 = html_array[index+1].replace(/\t/g, '    ');

			/* Search for length of indent prior to first character of each string */
			/* either the length of whitespace before first instance of character, or end of input*/
			indent1 = line1.substring(0,line1.search(/\S|$/));
			indent2 = line2.substring(0,line2.search(/\S|$/));

			combRoot_string = line1 + '\n' + line2;
			root = parser_html.parse(combRoot_string);

			/* Clean up root, get only relevant data from root basically */
			childrenOfRoot = root['childNodes'];
			
			/* if numChildren == 1, then parent-child / if == 2, then else case / if == 3, then siblings */
			numChildren = childrenOfRoot.length;

			/* We look at our cases and check for indentation appropriately */
			if (numChildren == 1) {

				/* Parent-Sibling case */
				/* Exception case: (look at Exception Case #2 inside 'detectIndentHMTLDocumentation.md' for reference) */
				if ( childrenOfRoot[0]['nodeType'] == 3 ) {
					if (indent2.length > indent1.length) {
						errorLine = index + 2;
						if ( lineErrors.indexOf(errorLine) == -1 ) {
							results.push({
								'line':errorLine,
								'message':'Closing tag of parent element is indented beyond that of the child',
								'raw':combRoot_string
							});
							lineErrors.push(index+1);
							lineErrors.push(index+2);
							lineErrors.push(index+3);
							numResults += 1;
						}
					} else {
						newIndent1 = indent1.replace(indent2, '');
						if (newIndent1.length == 0) {
							errorLine = index + 1;
							if ( lineErrors.indexOf(errorLine) == -1 ) {
								results.push({
									'line':errorLine,
									'message':'This child element is on the same line as its parent',
									'raw':combRoot_string
								});
								lineErrors.push(index+1);
								lineErrors.push(index+2);
								lineErrors.push(index+3);
								numResults += 1;
							}
						}
					}
				} else if ( childrenOfRoot[0]['nodeType'] == 1 ) {

					/* Not exception cases - these are parent-sibling cases */
					if (indent1.length > indent2.length) {
						errorLine = index + 1;
						if ( lineErrors.indexOf(errorLine) == -1 ) {
							results.push({
								'line':errorLine,
								'message':'Parent indentation on this line is greater than that of its first child',
								'raw':combRoot_string
							});
							lineErrors.push(index+1);
							lineErrors.push(index+2);
							lineErrors.push(index+3);
							numResults += 1;
						}
					} else {
						newIndent2 = indent2.replace(indent1, '');
						if (newIndent2.length == 0) {
							errorLine = index + 2;
							if ( lineErrors.indexOf(errorLine) == -1 ) {
								results.push({
									'line':errorLine,
									'message':'This child element is on the same line as its parent',
									'raw':combRoot_string
								});
								lineErrors.push(index+1);
								lineErrors.push(index+2);
								lineErrors.push(index+3);
								numResults += 1;
							}
						}
					}
				}
			} else if (numChildren == 2) {
				
				/* Else Case */
				/* Exception Case (look at Exception Case #1 for reference) */
				if ( childrenOfRoot[0]['nodeType'] == 3 && indent1.length != indent2.length) {
					errorLine = index + 1;
					if ( lineErrors.indexOf(errorLine) == -1 ) {
						results.push({
							'line':errorLine,
							'message':'This element and its sibling do not have the same indentation',
							'raw':combRoot_string
						});
						lineErrors.push(index+1);
						lineErrors.push(index+2);
						lineErrors.push(index+3);
						numResults += 1;
					}
				} else if ( childrenOfRoot[0]['nodeType'] == 1 ) {

					/* Not exception cases - these are Else cases */
					if (indent2.length > indent1.length) {
						errorLine = index + 2;
						if ( lineErrors.indexOf(errorLine) == -1 ) {
							results.push({
								'line':errorLine,
								'message':'Closing tag of parent element is indented beyond that of the child',
								'raw':combRoot_string
							});
							lineErrors.push(index+1);
							lineErrors.push(index+2);
							lineErrors.push(index+3);
							numResults += 1;
						}
					} else {
						newIndent1 = indent1.replace(indent2, '');
						if (newIndent1.length == 0) {
							errorLine = index + 1;
							if ( lineErrors.indexOf(errorLine) == -1 ) {
								results.push({
									'line':errorLine,
									'message':'This child element is on the same line as its parent',
									'raw':combRoot_string
								});
								lineErrors.push(index+1);
								lineErrors.push(index+2);
								lineErrors.push(index+3);
								numResults += 1;
							}
						}
					}
				}
			} else if (numChildren == 3) {

				/* sibling case - check if indent1 and indent2 have the same length */
				if (indent1.length > indent2.length) {
					errorLine = index + 2;
					if ( lineErrors.indexOf(errorLine) == -1 ) {
						results.push({
							'line':errorLine,
							'message':'This element has less indentation than its sibling on the previous line',
							'raw':combRoot_string
						});
						lineErrors.push(index+1);
						lineErrors.push(index+2);
						lineErrors.push(index+3);
						numResults += 1;
					}
				} else if (indent1.length < indent2.length) {
					errorLine = index + 2;
					if ( lineErrors.indexOf(errorLine) == -1 ) {
						results.push({
							'line':errorLine,
							'message':'This element has less indentation than its sibling on the next line',
							'raw':combRoot_string
						});
						lineErrors.push(index+1);
						lineErrors.push(index+2);
						lineErrors.push(index+3);
						numResults += 1;
					}
				}
			}
			loopThroughHTMLArray(index+1);
		} else {
			return callback(results);
		}
	}
	loopThroughHTMLArray(beginning);
}






/* --- All Functions For CSS Indentation Checking --- */
function detectIndentCSS(files, conditions, callback) {
	if ( conditions['toggle'] != true || conditions['css'] != true ) {
		callback({'total':0});
		return;
	}
	var indent_errors = [], total_indent_errors = 0;
	var errorRatio = ( conditions['errorRatio'] != null ) ? conditions['errorRatio'] : 0.5;

	var css_files = files.filter(function(d) {
		if (path.extname(d) == ".css") return d;
	});

	var loopThroughFiles = function(index) {
		if (index < css_files.length) {
			var file = css_files[index];
			fs.readFile(file, 'utf8', function(err, css) {
				if (err) {
					indent_errors.push({
						"file":file,
						"error_type":1,
						"error_message":"Could not parse through CSS file to check indentation",
						'total_errors':1
					});
					total_indent_errors += 1;
					loopThroughFiles(index+1);
				} else {
					var results = parser_css.parse(css);
					var stylesheet = results['stylesheet'];
					var rules = stylesheet['rules'];
					var all_objects = null;
					// 'rules' is our list of CSS lines
					var loopThroughRules = function(rules_index) {
						if (rules_index < rules.length) {
							var curObject = rules[rules_index];
							var sib_pos = null;
							if (rules_index > 0) sib_pos = rules[rules_index-1]['position']['start'];
							parseCSS(curObject, all_objects, null, sib_pos, true, (res)=>{
								all_objects = res;
								loopThroughRules(rules_index+1);
							});
						} else {
							checkCSS(file, all_objects, (res)=>{
								if (res['total'] > 0 && (res['total']/all_objects.length >= errorRatio) ) {
									total_indent_errors += res['total'];
									indent_errors.push({
										"file":file,
										"error_type":0,
										"errors":res['errors'],
										'total_errors':res['total']
									});
								}
								loopThroughFiles(index+1);
							});
						}
					};
					loopThroughRules(0);
				}
			});
		} else {
			callback({'total':total_indent_errors,'total_css_files':css_files,'errors':indent_errors});
		}
	}
	loopThroughFiles(0);
}
function parseCSS(obj, objects_list = null, parent_position = null, prev_sibling_position = null, must_be_next_line = true, callback) {
	var objects_list = (objects_list != null) ? objects_list : [];
	var start_position = obj['position']['start'];
	var parent_position = (parent_position != null) ? parent_position : {'line':0,'column':0};
	var sibling_position = (prev_sibling_position != null) ? prev_sibling_position : parent_position; 
	var type = obj['type'];
	var children = null;
	var must = must_be_next_line;
	
	var foundArray;
	var object_keys = Object.keys(obj);

	var loopThroughObject = function(index) {
		if (index < object_keys.length && !foundArray) {
			var attr = obj[object_keys[index]];
			if ( (Array.isArray(attr)) && (typeof attr[0] === 'object') ) {
				foundArray = true;
				children = attr;
			}
			loopThroughObject(index+1);
		} else {
			objects_list.push({
				'start':start_position,
				'parent':parent_position,
				'prev_sibling':sibling_position,
				'must_be_next_line':must,
				'type':type
			});
			if (foundArray) {
				var numChildren = children.length;
				var must_be_next_line = true;
				if (numChildren <= 2) must_be_next_line = false;
				var loopThroughObjectChildren = function(index2) {
					if (index2 < children.length ) {
						var child = children[index2];
						var sib_pos = null;
						if (index2 > 0) sib_pos = children[index2-1]['position']['start'];
						parseCSS(child, objects_list, start_position, sib_pos, must_be_next_line, (res)=>{
							objects_list = res;
						});
						loopThroughObjectChildren(index2 + 1)
					} else {
						callback(objects_list);
					}
				}
				loopThroughObjectChildren(0);
			} else {
				callback(objects_list);
			}
		}
	}
	loopThroughObject(0);
}
/*
// parser_css.parse(your CSS code) details:
// The CSS code that you insert into the parse() function MUST be valid CSS, or else it'll return an error and stop the app from functioning
// Inside the returned data, you'll find the following info:
// 		1) Each piece of code in the CSS has certain types and children, and all elements have starting and ending positions
//		2) If an element has a 'name', then it's a custom CSS declaration 
//			for example, -0-keyframes _____ returns the following info:
//				"type":"keyframes",
//				"name":"fadeEdit",
//				"vendor":"-o-",
//				"keyframes":[...]
//			However, here's an example of a simple CSS:
//				html, body {
//					margin:0;
//					padding:0;
//					height:100%;
//					width:100%;
//					font-family: Arial;
//				}
//			This will return the following parse data:
//				"type":"rule",
//				"selectors":["html","body"],
//				"declarations":[
//					{ ... },
//					{ ... },
//					{ ... },
//					{ ... },
//					{ ... }
//				],
//				"position":{
//					"start":{"line":12,"column":1},
//					"end":{"line":18,"column":2}
//				}
//			Inside the 'declarations' array are object lists that pertain to each of the attributes (i.e. for 'margin:0':)
//				"type":"declaration",
//				"property":"margin",
//				"value":"0",
//				"position":{
//					"start":{"line":13,"column":2},
//					"end":{"line":13,"column":10}
//				}
//		3)	Therefore, we have the following details:
//				- If an element has an array as a value, then we have a parent of some kind
//				- If we don't have an array as a value, then we have a child of some kind
//				- All we need to make sure is that children and parents have different starting lines and that the child has a greater starting column than the parent
//				- The parser gives starting positions for each line, so that's great
//				- Since the parser doesn't keep track of if an element has a parent, we will have to do that manually
//				- I think we can let it slide that if a parent only has one child, they can be on the same line
*/
function checkCSS(file, objects, callback) {
	var results = {
		'total':0,
		'errors':[]
	};
	var loopThroughCSSObjects = function(index) {
		if (index < objects.length) {
			var obj = objects[index];
			var start_position = obj['start'];
			var parent_position = obj['parent'];
			var sibling_position = obj['prev_sibling'];
			var must_be_next_line = obj['must_be_next_line'];
			if (obj['type'] != 'comment') {
				if ( must_be_next_line && start_position['line'] == parent_position['line'] ) {
					results['total'] += 1;
					results['errors'].push({
						'file':file,
						'error':1,
						'message':'This CSS element is on the same line as its parent when it is not supposed to',
						'line':start_position['line'],
						'column':start_position['column'],
						'elementType':obj['type']
					});
				} else if ( start_position['column'] <= parent_position['column'] ) {
					results['total'] += 1;
					results['errors'].push({
						'file':file,
						'error':2,
						'message':'This CSS element is either on the same column or before its parent',
						'line':start_position['line'],
						'column':start_position['column'],
						'elementType':obj['type']
					});
				} else if ( start_position['column'] < sibling_position['column'] ) {
					results['total'] += 1;
					results['errors'].push({
						'file':file,
						'error':3,
						'message':'This CSS element starts on a column less than that of its previous sibling',
						'line':start_position['line'],
						'column':start_position['column'],
						'elementType':obj['type']
					});
				}
			}
			loopThroughCSSObjects(index+1);
		} else {
			return callback(results);
		}
	}
	loopThroughCSSObjects(0);
}


module.exports.validateHTMLFiles = validateHTMLFiles;
module.exports.validateCSSFiles = validateCSSFiles;
module.exports.validateHTMLText = validateHTMLText;
module.exports.validateCSSText = validateCSSText;
module.exports.detectIndentHTML = detectIndentHTML;
module.exports.detectIndentCSS = detectIndentCSS;


