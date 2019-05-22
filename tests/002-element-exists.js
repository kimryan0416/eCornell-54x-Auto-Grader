const cheerio = require('cheerio');
var htmlParser = require('node-html-parser');
const common = require('../common.js');

const fs = common.fs;
const escapeHTML = common.escapeHTML;
const isArray = common.isArray;

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

function findSelector(s,r,c) {

	var originalSelector,				// the original selector inputted						
		sSplit,							// the selector, split by " ", useful to determine if cheerio or nodehtmlparser is needed
		exists,
		selFiltered,					// filtered selector
		rootHTML,						// html of file, if using htmlParser
		tempFound;						// temporary boolean, used only to track if "html" tag exists

	if (typeof s === 'object') {
		originalSelector = s.selector;
		sSplit = originalSelector.split(' ');
		exists = (s.exists != null && typeof s.exists === 'boolean') ? s.exists : true;
	} else {
		originalSelector = s;
		sSplit = originalSelector.split(' ');
		exists = true;
	}
	tempFound = exists;

	if (sSplit.indexOf('html') > -1) {
		// Use node-html-parser to first check if html exists
		selFiltered = filterSelector(sSplit[sSplit.indexOf('html')]);
		rootHTML= r.querySelector('html');
		tempFound = (rootHTML != null);
	}
	if (sSplit.indexOf('head') > -1) {
		// Use node-html-parser to first check if html exists
		selFiltered = filterSelector(sSplit[sSplit.indexOf('head')]);
		rootHTML= r.querySelector('head');
		tempFound = (rootHTML != null);
	}
	if (sSplit.indexOf('body') > -1) {
		// Use node-html-parser to first check if html exists
		selFiltered = filterSelector(sSplit[sSplit.indexOf('body')]);
		rootHTML= r.querySelector('body');
		tempFound = (rootHTML != null);
	}
	
	if (tempFound != exists) return {success:false,selector:originalSelector,should:exists};
	else {
		var found = c(originalSelector).length > 0 ;
		return {success:found==exists,selector:originalSelector,should:exists};
	}
}

/* --- Main test runs via this function --- */
function main(name, custom_title, custom_message, variables, done) {

	var htmlPath = variables['HTML_PATH'];	// gets path of a particular HTML file
	var selectors = (isArray(variables['SELECTORS'])) ? variables['SELECTORS'] : [ variables['SELECTORS'] ];	// the CSS selector for the HTML element we're looking for
	
	var testTitle = (custom_title != null) ? escapeHTML(custom_title) : (exists) ? 'Expect element to exist' : 'Expect element to NOT exist';	// stated conditions for success, unless specified via 'tests.json'
	var testMessage = (custom_message != null) ? escapeHTML(custom_message) : "";	// error message if failure, unless specified via 'tests.json'
			
	try {
		var fileContents = fs.readFileSync(htmlPath, 'utf-8');	// getting the contents of the HTML file we're looking at
		var root = htmlParser.parse(fileContents);				// root of file, if using htmlParser
		var $ = cheerio.load(fileContents);						// variable for Cheerio

		var promises = Promise.all(selectors.map(sel=>{
			return new Promise(resolve=>{
				resolve(findSelector(sel,root,$));
			});
		}));
		promises.then(res=>{
			var success = res.reduce((filtered,r)=>{
				filtered = filtered && r.success;
				return filtered;
			},true);
			if (custom_message == null) {
				var testMessagePrototype = res.reduce((filtered,r)=>{
					if (r.success == false) {
						/*
						if (r.should) filtered["The following selectors should exist but couldn't be found:"] = (filtered["The following selectors should exist but couldn't be found:"]) ? filtered["The following selectors should exist but couldn't be found:"] + "\n- " + String(r.selector) : "- " + String(r.selector);
						else filtered["The following selectors shouldn't exist but were found:"] = (filtered["The following selectors shouldn't exist but were found:"]) ? filtered["The following selectors shouldn't exist but were found:"] + "\n- " + String(r.selector) : "- " + String(r.selector);
						*/
						if (r.should) filtered["true"] = (filtered["true"]) ? filtered["true"] + "\n- " + String(r.selector) : "\n- " + String(r.selector);
						else filtered["false"] = (filtered["false"]) ? filtered["false"] + "\n- " + String(r.selector) : "\n- " + String(r.selector);
					}
					return filtered;
				},{});
				if (testMessagePrototype["true"] && testMessagePrototype["true"].length > 0) {
					testMessage += "The following selectors should exist but couldn't be found:\n" + testMessagePrototype["true"];
				}
				if (testMessagePrototype["false"] && testMessagePrototype["false"].length > 0) {
					if (testMessage.length > 0) {
						testMessage += "\n\n";
					}
					testMessage += "The following selectors shouldn't exist but were found:\n" + testMessagePrototype["false"];
				}
			}
			done({
				name: name,
				title: testTitle,
				success: success,
				message: testMessage,
				console_message: testMessage
			});
		});
	} catch(error) {
		done({
			name: name,
			title: testTitle,
			success: false,
			message: 'HTML file contents could not be retrieved.',
			console_message: 'HTML file contents could not be retrieved.'
		});
	}
}

/* --- Allows for this unit test to be used within 'runner.js' --- */
exports.main = main;