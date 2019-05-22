const parser_html = require('node-html-parser');
const path = require('path');
const fs = require('fs');


function checkInline(files, conditions, callback) {
	if ( !conditions["toggle"] ) {
		callback("Toggle for inline checking is off", null);
		return;
	}
	// loop through all html files for inline css
	var file_data = [];
	var loopThroughFiles = function(index) {
		if ( index < files.length ) {
			var file = files[index];
			file_data[index] = {
				"file":file,
				"css":[],
				"js":[],
				"error":0,
				"message":""
			};
			var ext = path.extname(file);
			if (ext == ".html") {
				fs.readFile(file, 'utf8', function(err, html) {
					if (err) {
						console.log(err)
						file_data[index]['css'] = null;
						file_data[index]['js'] = null;
						file_data[index]['error'] = 1;
						file_data[index]['message'] = "unable to read through HTML file";
						loopThroughFiles(index+1);
					}
					parseHTML(html, conditions["css"], conditions["js"], (err, css_detected, js_detected)=>{
						if (err) {
							console.log(err);
							file_data[index]['css'] = null;
							file_data[index]['js'] = null;
							file_data[index]['error'] = 2;
							file_data[index]['message'] = "unable to parse through text within HTML file";
						} else {
							file_data[index]['css'] = css_detected;
							file_data[index]['js'] = js_detected;
							file_data[index]['error'] = 0;
							file_data[index]['message'] = "";
						}
						loopThroughFiles(index+1);
					});
				});
			} else {
				loopThroughFiles(index+1);
			}
		} else {
			callback(false, file_data)
		}
	}
	loopThroughFiles(0);
}


/*
// Parses through HTML to check for CSS and Javascript
// arguments:
// - test = if you're running this file via node to check for functions, you must pass this as true - otherwise, it won't run the test script
// - html = the html text that you want to parse through - received from the function "checkInline()" as part of checking for inline CSS and JS
// - callback = the callback function, must pass 2 arguments: an array of detected CSS inlines, and an array of detected JS inlines - otherwise, callback is defaulted to null
*/
function parseHTML(html = null, css_toggle = true, js_toggle = true, callback = null) {
	/*
	// If 'test' == true, then we run a tests on a few kinds of HTML text
	// Test 1: the HTML contains no inline CSS and JS - should return both as null in the console log
	// Test 2: The HTML contains no inline CSS but contains inline JS (in the form of a <script> tag without a "src" attribute) - The first console.log returns null, while the 2nd returns an object
	// Test 3: The HTML contains inline CSS (in the form of <style> tag) but no inline JS - the first console.log returns an object, while the 2nd returns null
	// Test 4: The HTML contains both inline JS (in the form of a <script> tag) and inline CSS (both in the form of <style> and style="") - both console.logs should return objects
	*/

	/*
	// How HTML is parsed through in general:
	// to initiate the parse, you must run the 'parse()' function - this is under the 'parser_html' constant, so you must execute the function like so: var ____ = parser_html.parse(____);
	// the argument inside parse() is your HTML text - it can take in portions of HTML or a whole HTML document's text, as long as it is in text form.
	// 
	*/

	/*
	// How we look through the parsed HTML for JavaScript:
	// the function 'querySelectorAll' looks for all instances of a tag - this function is under the object that is returned by parser_html.parse();
	// What this function spits out is an array of all instances where <script> was used inside our HTML text
	// All JS in an HTML document uses the <script> - what differentiates inline JS with one from an external source is the presence of the "src" attribute
	// Therefore, we must parse through each of the items within the array returned to make sure if that <script> tag contains the "src" attribute
	// We can do this by accessing the "attributes()" function - this function looks at an item within our array and spits out all the attributes used, in a JavaScript object
	// All we need to do then is check if "src" is one of the keys given in that JavaScript object, and if there isn't then it's inline JS
	// We essentially use a "filter" function (which is synchronous) to parse out all the tags that do have the "src" attribute - if the remaining array contains an element, then we know there's inline JS present
	// 
	*/

	/*
	// How we look through the parsed HTML for CSS:
	// We essentially do many of the same things as the parsing for JavaScript, except that we're looking for 2 cases:
	// 1) If an element contains a "style=" attribute, or 2) if the <style> tag is used
	// The 2nd one isn't too hard - we simply do the same thing as querySelectorAll('style') and if the array is NOT empty then there's inline styling
	// The 1st one is hard because we have to parse through our parsed HTML - we need to use a function with a callback of its own to look at EVERY element within the HTML and check
	// This function, findObjectByAttribute(), will look through our HTML, even its children, to check if any HTML element contains the "style" attribute - it'll return an array of all HTML elements with "style=" as an attribute
	*/

	var root, inlineCSS, allScripts, inlineJS; 

	if (html == null || html == '' || typeof html === 'undefined') {
		callback('HTML could not be processed', null, null);
		return;
	} 

	else {
		root = parser_html.parse(html);

		if ( css_toggle ) {
			inlineCSS = root.querySelectorAll('style');
			findObjectByAttribute(root, 'style', inlineCSS, (res)=>{
				inlineCSS = res;
			});
		} else {
			inlineCSS = [];
		}
		
		if ( js_toggle ) {
			allScripts = root.querySelectorAll('script');
			inlineJS = allScripts.filter(function(d) {
				if (!d.attributes.hasOwnProperty('src')) return d;
			});
		} else {
			inlineJS = [];
		}

		callback(false, inlineCSS, inlineJS)
		return;
	}
}

function findObjectByAttribute (obj, attr, collected = null, callback) {
	// collected = the list of objects that have inline styling - we pass this on every time we recursively iterate through children HTML elements
	// if collected == null (which is only the first time this function is called), then we set it to be an empty array at first
	// Otherwise, we store all the elements inside 'arr' and we pass this array along constantly as we recursively iterate
	// At the end, we return 'arr' via the callback method
	
	// Step 1: set 'arr' to either be an empty array or the array of elements collected so far (aka 'collected');
	var arr = collected != null ? collected : [];	

	// Step 2: we search this HTML element to see if it contains any attributes and, if so, if the "style" attribute is among them
	// If the 'if()' statement below returns true, we add this HTML element to our collection
	if ( (obj.attributes != null) && (obj.attributes.hasOwnProperty(attr)) ) arr.push(obj);

	// Step 3: if there's any children, we recursively iterate
	if (obj.childNodes.length > 0) {
		var children = obj.childNodes;
		var loopThroughChildren = function(index) {
			if ( index < children.length ) {
				var child = children[index];
				// The neat thing about the callback is that upon first initialization (i.e. when called by parseHTML()), we have defined 'callback' to be one thing inside parseHTML().
				// however, for here, we can set the callback to make 'arr' = 'res' if we're recursing through children - any children that are run through findObjectByAttribute() go to a callback that's comletely different from that inside parseHTML();
				findObjectByAttribute(child, 'style', arr, (res)=>{
					arr = res;
					loopThroughChildren(index+1);
				});
			}
		}
		loopThroughChildren(0);
	}

	// Step 4: return our collection via callback, whatever that callback is
	callback(arr);
};


/*
// If you wish to test the function 'parseHTML()', then you must uncomment the appropriate function way below to initialize testing
// The function basically takes 4 cases as a default, each with different outcomes, and spits out the results in the console
// If you wish to test your own, then you can provide an array within the argument for 'parseHTML_test()' initialization below
// However, you must provide it in the appropriate format as so:
//		Each item within 'arr' must be a JS object list with the following values:
//			'message' = the message you want to spit out to the console for each test
//			'content' = your plain text HTML test code - leaving this as 'null' will return an error from parseHTML();
*/
function parseHTML_test(arr = null) {

	/*
	// Test 1: the HTML contains no inline CSS and JS - should return both as null in the console log
	// Test 2: The HTML contains no inline CSS but contains inline JS (in the form of a <script> tag without a "src" attribute) - The first console.log returns null, while the 2nd returns an object
	// Test 3: The HTML contains inline CSS (in the form of <style> tag) but no inline JS - the first console.log returns an object, while the 2nd returns null
	// Test 4: The HTML contains both inline JS (in the form of a <script> tag) and inline CSS (both in the form of <style> and style="") - both console.logs should return objects
	*/
	var test_array = (arr != null) ? arr : [
		{
			'message':'- Test 1: HTML contains no inline CSS and JS - returns both empty arrays -',
			'content':'<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>Test</title></head><body><ul id="list"><li>Hello World</li></ul></body></html>'
		},{
			'message':'- Test 2: HTML contains no inline CSS but contains inline JS (<script> tag without "src" attribute) - First log returns empty, Second log returns filled -',
			'content':'<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>Test</title><script>alert("This should be detected");</script></head><body><ul id="list"><li>Hello World</li></ul></body></html>'
		},{
			'message':'- Test 3: HTML contains inline CSS (<style> tag) but no inline JS - First log returns filled, Second log returns empty -',
			'content':'<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>Test</title><script type="text/javascript" src="jquery-example.js"></script></head><body><ul id="list" style="list-style-type:none;"><li>Hello World</li></ul></body></html>'
		},{
			'message':'- Test 4: HTML contains inline JS (<script> tag) AND inline CSS (<style> and style="") - Both logs should return filled -',
			'content':'<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>Test</title><script type="text/javascript" src="jquery-example.js"></script><script>alert("This should be detected");</script><style>html:{color:blue;}</style></head><body><ul id="list" style="list-style-type:none;"><li>Hello World</li></ul></body></html>'
		}
	];
	console.log ("\x1b[43m%s\x1b[0m"," *** ParseHTML() Testing *** ");
	var testParseHtmlLoop = function(index) {
		if (index < test_array.length) {
			var thisTest = test_array[index];
			console.log("\x1b[34m%s\x1b[0m",thisTest['message']);
			parseHTML(thisTest['content'], true, true, (err, css_detected, js_detected)=>{
				if (err) {
					console.log(err);
					console.log('Unable to parse through text within HTML file');
				} else {
					console.log("Inline CSS for Test "+(index+1)+": " + css_detected.length + " CSS");
					//console.log(css_detected);
					console.log("Inline JS for Test "+(index+1)+": " + js_detected.length + " JS");
					//console.log(js_detected);
				}
				testParseHtmlLoop(index+1);
			});
		}
	}
	testParseHtmlLoop(0);
	console.log ("\x1b[43m%s\x1b[0m"," --- parseHTML() test Complete ---");
}



/*
// Testing parseHTML()...
// If you wish to test parseHTML(), simply uncomment the var 'temp' and the function below
// You can provide the default test case by leaving 'temp' as null, otherwise you must follow the syntax rules defined below:
// var 'temp' MUST be an array of js object lists
//		Each JS object list has the following values:
//			'message' = the message you want to spit out to the console for each test
//			'content' = your plain text HTML test code - leaving this as 'null' will return an error from parseHTML();
var temp;
parseHTML_test(temp);
*/



module.exports.checkInline = checkInline;
module.exports.parseHTML = parseHTML;

