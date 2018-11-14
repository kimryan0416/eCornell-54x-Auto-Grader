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

function validateChildrenOrder($, selector, order, callback) {
	var parentInfo = [];
	var el = $(selector);
	var orderValid = false;

	el.each((i,obj)=>{

		if (orderValid) return false;

		var validChildren = [];
		var notValidChildren = [];

		var children = el.children();
		var currentKey = 0;
		order.forEach(sel=>{
			var curValid = false;
			for(currentKey; currentKey < children.length; currentKey++) {
				if ( children[currentKey].name.trim().toLowerCase() == sel.trim().toLowerCase() ) {
					currentKey += 1;
					curValid = true;
					break;
				}
			}
			if (curValid) validChildren.push(sel);
			else notValidChildren.push(sel);
		});

		parentInfo.push({
			valid:validChildren,
			notValid:notValidChildren
		});

		orderValid = (validChildren.length == order.length);

	});

	callback(orderValid, parentInfo);
}

/* --- Main test runs via this function --- */
function main(title, variables, statement, errorMessage, hints) {

	/*
	// htmlPath = gets path of a particular HTML file
	// selector = the CSS selector for the HTML element we're looking for
	// itStatement = conditions for success, unless specified via 'tests.json'
	// errorStatement = error message if failure, unless specified via 'tests.json'
	// hintsStatement = hints for getting a successful test, unless specified via 'tests.json'
	*/
	var htmlPath = variables['HTML_PATH'];
	var selector = variables['SELECTOR'];
	var order = (variables['ORDER']) ? variables['ORDER'] : [];
	var itStatement = (statement.length != 0) ? statement : 'Expect parent element that matches ['+selector+'] to contain children in the order of [' + order.join(', ') + ']';
	var errorStatement = (errorMessage.length != 0) ? errorMessage : 'Parent element does not exist when it should!';
	var hintsStatement = '';

	/* --- STEP 1: wraps 002 Unit Test within wrapper 'describe' - uses 'title' specified within 'tests.json' --- */
	describe(title, function () {

		/*
		// found = boolean, used as a global delimiter to detect if an HTML element that fits the selector was found
		// parentFound = boolean: is there an html element found using 'selector' variable? - if false, found = false by default
		// el = global variable used to store the element(s) that match the selector, if any
		// useCheerio = boolean, tells the unit test if they should use 'Cheerio' or 'node-html-parser' as their HTML parser
		*/
		var found = false;
		var parentFound = false;

		var el = null;

		/*
		// STEP 2: 'before()' gets selector components via 'filterSelector', determines if we should use 'Cheerio' or 'node-html-parser', returns any elements that match the selector
		// We MUST use 'node-html-parser' in the case of <html> - this is because by default, DOM parsers like 'Cheerio' automatically wrap all contents of an HTML with an <html> tag if it's missing
		//		- this makes it very hard to actually check if we have the <html> tag within student code or not, which is necessary for some cases.
		*/
		before(function(done) {

			/*
			// fileCOntents = getting the contents of the HTML file we're looking at
			*/
			var fileContents = fs.readFileSync(htmlPath, 'utf-8');

			/* --- Step 2.1: determine if we should use 'Cheerio' or 'node_html_parser' --- */
			if ( selector.toLowerCase().indexOf('html') == 0 && selector.substring(4,5) != ' ' ) {
				/*
				// In this situation, our selector IS just an HTML tag and just that - in this case, we must use 'node_html_parser';
				// We first grab the parsed version of our 'fileContents', and from that extract the first item, which SHOULD be an object 
				// 		representing <html> if there is an <html> tag within student code
				// We then first check if that first object we just extracted matches that of our selector ('html'), then if we have to check the 'lang' attribute we check that as well.
				// Then, done
				*/
				var root = htmlParser.parse(fileContents);
				var rootHTML = root['childNodes'][0];
				filterSelector(selector, res=>{
					parentFound = (rootHTML['tagName'].toLowerCase() == res['selector'].toLowerCase());
					if (res.lang != null) parentFound = parentFound && (rootHTML['rawAttrs'].toLowerCase().replace(/["']/g, '"') == res['lang'].toLowerCase().replace(/["']/g, '"'));
					if (parentFound) {
						validateChildrenOrder(cheerio.load(fileContents), selector, order, (orderValid, parentInfo) => {
							found = orderValid;
							if (!orderValid) {
								errorStatement = (errorMessage.length != 0) ? errorMessage : 'Parent element found, but order of children is incorrect!';
								hintsStatement = 
									'The expected order of the children inside [' + selector + '] was:\n- ' 
									+ order.join('\n- ');
								parentInfo.forEach(info=>{
									hintsStatement += '\n----------\nA portion of your code that matches the selector [' + selector + '] has this order:\n- ' + info.valid.join('\n- '); 
									hintsStatement += '\nThis portion has the following elements misplaced:\n- ' + info.notValid.join('\n- ');
								});
								hintsStatement += '\n\nPlease make sure these elements are ordered properly within your code.';
							}
							done();
						});
					} else {
						done();
					}
				});
			} else {
				/*
				// In this situation, our selector is not an HTML tag - in this case, we must use 'Cheerio':
				// We first grab the parsed version of our 'fileContents' and that, use the jQuery syntax to find any elements based on our selector
				// Then, done;
				*/
				var $ = cheerio.load(fileContents);
				el = $(selector);
				parentFound = ( el.length > 0 );
				if (parentFound) {
					validateChildrenOrder($, selector, order, (orderValid, parentInfo) => {
						found = orderValid;
						if (!orderValid) {
							errorStatement = (errorMessage.length != 0) ? errorMessage : 'Parent element found, but order of children is incorrect!';
							hintsStatement = 
								'The expected order of the children inside [' + selector + '] was:\n- ' 
								+ order.join('\n- ');
							parentInfo.forEach(info=>{
								hintsStatement += '\n----------\nA portion of your code that matches the selector [' + selector + '] has this order:\n- ' + info.valid.join('\n- '); 
								hintsStatement += '\nThis portion has the following elements misplaced:\n- ' + info.notValid.join('\n- ');
							});
							hintsStatement += '\n\nPlease make sure these elements are ordered properly within your code.';
						}
						done();
					});
				} else {
					done();
				}
			}
		});

		/* --- STEP 3: IT statement performs our test - self-explanatory */
		it(itStatement, function(done) {
			expect(found, errorStatement).to.equal(true)
			done(); 
		});

		/* --- STEP 4: If the test fails, we must print out the hints into Mochawesome --- */
		afterEach(function(done) {
			if (hintsStatement != null && found != true)	this.currentTest.context = {'title':'Hints','value':hintsStatement};
			done();
		});

	});

	/* --- 002 UNIT TEST FINISHED --- */

}

/* --- Allows for this unit test to be used within 'runner.js' --- */
exports.main = main;