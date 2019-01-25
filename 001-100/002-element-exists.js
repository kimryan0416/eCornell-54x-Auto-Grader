var cheerio = require('cheerio');
var htmlParser = require('node-html-parser');
const common = require('../common.js');

const fs = common.fs;
const expect = common.expect;

/* --- Helper function, grabs the particular selector specified within 'tests.json' and returns a breakdown of it in object form --- */
/*
// This function is necessary only in the case where we're looking for the tag <html>
// The only attributes we usually find with the <html> tag is "lang" and "manifest"... though "manifest is now deprecated"
// For now' we just separate the 'html' part of the selector with any possible reference to the ':lang()', which is used to determine the 'lang' attribute in '<html lang="__">'
*/
function filterSelector(sel, callback) {
	var thisSelector = sel, thisLang = null;
	if (thisSelector.match(/:lang/)) {
		var spl = thisSelector.split(':');
		regExp = /\(["']([^)]+)["']\)/
		matches = regExp.exec(spl[1]);

		thisSelector = spl[0];
		thisLang = 'lang="'+matches[1].toLowerCase()+'"';
	}
	callback({selector:thisSelector,lang:thisLang});
}

/* --- Main test runs via this function --- */
function main(title, variables, statement, errorMessage, testDirectory, hints) {

	var htmlPath = testDirectory + '/' + variables['HTML_PATH'];	// gets path of a particular HTML file
	var selector= variables['SELECTOR'];	// the CSS selector for the HTML element we're looking for

	var exists = (variables['EXISTS'] != null) ? variables['EXISTS'] : true;	// should the element we're looking for exist or not? - optionally specified via 'tests.json'
	var itStatement = (statement.length != 0) ? statement : (exists) ? 'Expect element to exist' : 'Expect element to NOT exist';	// stated conditions for success, unless specified via 'tests.json'
	var errorStatement = (errorMessage.length != 0) ? errorMessage : (exists) ? 'Element does not exist when it should!' : 'Element exists when it should not!';	// error message if failure, unless specified via 'tests.json'
	var hintsStatement = (hints && hints.length > 0) ? hints : '';	// hints for getting a successful test, unless specified via 'tests.json'

	var fileContents = null;	// getting the contents of the HTML file we're looking at
	var found;	// boolean, used as a global delimiter to detect if an HTML element that fits the selector was found
	
	/* --- STEP 1: wraps 002 Unit Test within wrapper 'describe' - uses 'title' specified within 'tests.json' --- */
	describe(title, function () {

		// el = global variable used to store the element(s) that match the selector, if any
		//var el = null;

		/*
		// STEP 2: 'before()' gets selector components via 'filterSelector', determines if we should use 'Cheerio' or 'node-html-parser', returns any elements that match the selector
		// We MUST use 'node-html-parser' in the case of <html> - this is because by default, DOM parsers like 'Cheerio' automatically wrap all contents of an HTML with an <html> tag if it's missing
		//		- this makes it very hard to actually check if we have the <html> tag within student code or not, which is necessary for some cases.
		*/
		before(function(done) {
			
			try {
				fileContents = fs.readFileSync(htmlPath, 'utf-8');

				/* --- Step 2.1: determine if we should use 'Cheerio' or 'node_html_parser' --- */
				if ( selector.toLowerCase().indexOf('html') == 0 && selector.substring(4,5) != ' ' ) {
					// In this situation, our selector IS just an HTML tag and just that - in this case, we must use 'node_html_parser';
					// We first grab the parsed version of our 'fileContents', and from that extract the first item, which SHOULD be an object 
					// 		representing <html> if there is an <html> tag within student code
					// We then first check if that first object we just extracted matches that of our selector ('html'), then if we have to check the 'lang' attribute we check that as well.
					// Then, done
					var root = htmlParser.parse(fileContents);
					var rootHTML = root['childNodes'][0];
					filterSelector(selector, res=>{
						found = (rootHTML['tagName'].toLowerCase() == res['selector'].toLowerCase());
						if (res.lang != null) found = found && (rootHTML['rawAttrs'].toLowerCase().replace(/["']/g, '"') == res['lang'].toLowerCase().replace(/["']/g, '"'));
						done();
					});
				} else if ( (selector.toLowerCase().indexOf('head') == 0 || selector.toLowerCase().indexOf('body') == 0) && selector.substring(4,5) != ' ' ) {
					var root = htmlParser.parse(fileContents);
					var rootHTML = root['childNodes'][0];
					filterSelector(selector, res=>{
						//found = (rootHTML['tagName'].toLowerCase() == res['selector'].toLowerCase());
						found = rootHTML.querySelector(res['selector']) != null;
						done();
					});
				} else {
					/*
					// In this situation, our selector is not an HTML tag - in this case, we must use 'Cheerio':
					// We first grab the parsed version of our 'fileContents' and that, use the jQuery syntax to find any elements based on our selector
					// Then, done;
					*/
					var $ = cheerio.load(fileContents);
					//el = $(selector);
					found = ( $(selector).length > 0 );
					done();
				}
			} catch(error) {
				done();
			}

		});

		/* --- STEP 3: IT statement performs our test - self-explanatory */
		it(itStatement, function(done) {
			if ( (found != exists) && (hintsStatement.length == 0) ) {
				hintsStatement = '- Check for any mispelled tags\n';
				hintsStatement += '- Make sure that the necessary HTML elements are present based on instructions';
			}
			expect(fileContents,'HTML file contents could not be retrieved.').to.not.be.null;
			expect(found, errorStatement).to.equal(exists);
			done(); 
		});

		/* --- STEP 4: If the test fails, we must print out the hints into Mochawesome --- */
		afterEach(function(done) {
			if (hintsStatement.length > 0 && found != exists)	this.currentTest.context = {'title':'Hints','value':hintsStatement};
			done();
		});

	});

	/* --- 002 UNIT TEST FINISHED --- */

}

/* --- Allows for this unit test to be used within 'runner.js' --- */
exports.main = main;