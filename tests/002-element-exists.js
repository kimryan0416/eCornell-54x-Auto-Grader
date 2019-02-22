const cheerio = require('cheerio');
var htmlParser = require('node-html-parser');
const common = require('../common.js');

const fs = common.fs;
const escapeHTML = common.escapeHTML;

/* --- Helper function, grabs the particular selector specified within 'tests.json' and returns a breakdown of it in object form --- */
/*
// This function is necessary only in the case where we're looking for the tag <html>
// The only attributes we usually find with the <html> tag is "lang" and "manifest"... though "manifest is now deprecated"
// For now' we just separate the 'html' part of the selector with any possible reference to the ':lang()', which is used to determine the 'lang' attribute in '<html lang="__">'
*/
function filterSelector(sel) {
	var thisSelector = sel, thisLang = null;
	if (thisSelector.match(/:lang/)) {
		var spl = thisSelector.split(':');
		regExp = /\(["']([^)]+)["']\)/
		matches = regExp.exec(spl[1]);

		thisSelector = spl[0];
		thisLang = 'lang="'+matches[1].toLowerCase()+'"';
	}
	return {selector:thisSelector,lang:thisLang};
}

/* --- Main test runs via this function --- */
function main(name, custom_title, custom_message, variables, done) {

	var htmlPath = variables['HTML_PATH'];	// gets path of a particular HTML file
	var selector= variables['SELECTOR'];	// the CSS selector for the HTML element we're looking for
	var exists = (variables['EXISTS'] != null) ? variables['EXISTS'] : true;	// should the element we're looking for exist or not? - optionally specified via 'tests.json'
	
	var testTitle = (custom_title) ? escapeHTML(custom_title) : (exists) ? 'Expect element to exist' : 'Expect element to NOT exist';	// stated conditions for success, unless specified via 'tests.json'
	var testMessage = (custom_message) ? escapeHTML(custom_message) : '- Check for any mispelled tags\n- Make sure that the necessary HTML elements are present (or not) based on instructions';	// error message if failure, unless specified via 'tests.json'

	var fileContents, 		// getting the contents of the HTML file we're looking at
		selectorSplit,		// the selector, split by " ", useful to determine if cheerio or nodehtmlparser is needed
		sel_filtered,		// filtered selector
		root, 				// root of file, if using htmlParser
		tempFound = exists,	// temporary boolean, used only to track if "html" tag exists
		$,					// variable for Cheerio
		rootHTML,			// html of file, if using htmlParser
		found = false;		// boolean, used as a global delimiter to detect if an HTML element that fits the selector was found
			
	try {
		fileContents = fs.readFileSync(htmlPath, 'utf-8');
	} catch(error) {
		done({
			name: name,
			title: testTitle,
			success: false,
			message: 'HTML file contents could not be retrieved.',
			console_message: 'HTML file contents could not be retrieved.'
		});
	}

	root = htmlParser.parse(fileContents);
	selectorSplit = selector.split(' ');

	if (selectorSplit.indexOf('html') > -1) {
		// Use node-html-parser to first check if html exists
		sel_filtered = filterSelector(selectorSplit[selectorSplit.indexOf('html')]);
		rootHTML= root.querySelector('html');
		tempFound = (rootHTML != null)
	}
	if (selectorSplit.indexOf('head') > -1) {
		// Use node-html-parser to first check if html exists
		sel_filtered = filterSelector(selectorSplit[selectorSplit.indexOf('head')]);
		rootHTML= root.querySelector('head');
		tempFound = (rootHTML != null)
	}
	if (selectorSplit.indexOf('body') > -1) {
		// Use node-html-parser to first check if html exists
		sel_filtered = filterSelector(selectorSplit[selectorSplit.indexOf('body')]);
		rootHTML= root.querySelector('body');
		tempFound = (rootHTML != null)
	}
	
	if (tempFound != exists) {
		done({
			name: name,
			title: testTitle,
			success: false,
			message: testMessage,
			console_message: testMessage
		});
	} else {
		$ = cheerio.load(fileContents);
		found = ( $(selector).length > 0 );

		done({
			name: name,
			title: testTitle,
			success: found == exists,
			message: testMessage,
			console_message: testMessage
		});
	}

}

/* --- Allows for this unit test to be used within 'runner.js' --- */
exports.main = main;