var cheerio = require('cheerio');
var htmlParser = require('node-html-parser');
const common = require('../common.js');

const fs = common.fs;
const expect = common.expect;

// --- Helper function, grabs the particular selector specified within 'tests.json' and returns a breakdown of it in object form ---
// This function is necessary only in the case where we're looking for the tag <html>
// The only attributes we usually find with the <html> tag is "lang" and "manifest"... though "manifest is now deprecated"
// For now' we just separate the 'html' part of the selector with any possible reference to the ':lang()', which is used to determine the 'lang' attribute in '<html lang="__">'

function filterSelector(sel) {
	var thisSelector = sel, thisLang = null, thisContains = null;
	if (thisSelector.match(/:lang/)) {
		var spl = thisSelector.split(':');
		regExp = /\(["']([^)]+)["']\)/
		matches = regExp.exec(spl[1]);

		thisSelector = spl[0];
		thisLang = 'lang="'+matches[1].toLowerCase()+'"';
	} else if (thisSelector.match(/:contains/)) {
		var spl = thisSelector.split(':');
		regExp = /\(["']([^)]+)["']\)/
		matches = regExp.exec(spl[1]);

		thisSelector = spl[0];
		thisContains = 'contains("'+matches[1]+'")';
	}
	callback({selector:thisSelector,lang:thisLang,contains:thisContains});
}
function validateChildrenNew($, selector, children, callback) {
	var parentInfo = [];
	var el = $(selector);
	var orderValid = false;	// boolean, tells if we found an instance where the order defined in "children" matches

	el.each(function() {
		// We are now looking at all the children of our parent selector
		if (orderValid) return false;
		var validChildren = [];
		var notValidChildren = [];
		var thisChildrenIndex = -1;
		var thisObj = $(this);

		// We loop through our given list of selectors
		children.forEach(function(globalChildSelector) {
			var tempGlobalChildSelector = (typeof globalChildSelector === 'object') ? globalChildSelector['PARENT'] : globalChildSelector;

			// If any immediate descendents match the selector provided, then we'll know by length
			var findings = thisObj.children(tempGlobalChildSelector);

			if (findings.length > 0) {
				var currentlyFound = false;
				// We'll have to iterate through each of our findings and check their indexes - if there are any indexes that ...
				// ... happen to be greater than or equal to our current "thisChildrenIndex" value, then we'll know that we're on the right path
				findings.each(function(){
					var find = $(this);
					if ( !currentlyFound && find.index() > thisChildrenIndex ) {
						thisChildrenIndex = find.index();
						if (typeof globalChildSelector === 'object') {
							validateChildrenNew($,selector + ' ' + globalChildSelector['PARENT'],globalChildSelector['CHILDREN'], (res)=>{
								if(res == true) {
									validChildren.push(globalChildSelector);
									currentlyFound = true;
								} else {
									notValidChildren.push(globalChildSelector);
								}
							});
						} else {
							validChildren.push(globalChildSelector);
							currentlyFound = true;
						}
					}
				});
				if (!currentlyFound) {
					notValidChildren.push(globalChildSelector);
				}
			}
			else {
				notValidChildren.push(globalChildSelector);
			}
		});

		orderValid = orderValid || (validChildren.length == children.length);
	});

	callback(orderValid);
}


/* --- Main test runs via this function --- */
function main(title, variables, statement, errorMessage, testDirectory, hints) {
	var htmlPath = testDirectory + '/' + variables['HTML_PATH'];	//gets path of a particular HTML file
	var order = variables['ORDER'];

	var itStatement = (statement.length != 0) ? statement : 'Expecting the order of elements to follow what is specified by the instructions';	// conditions for success, unless specified via 'tests.json'
	var errorStatement = (errorMessage.length != 0) ? errorMessage : 'HTML elements were not in the expected order.'; // error message if failure, unless specified via 'tests.json'
	var hintsStatement = (hints && hints.length > 0) ? hints : ''; // hints for getting a successful test, unless specified via 'tests.json'

	var startingParent = (order['PARENT']) ? order['PARENT'] : 'html body';
	var startingChildren = (order['CHILDREN']) ? order['CHILDREN'] : [];
	
	var fileContents = null;	// getting the contents of the HTML file we're looking at
	var $ = null;	// Cheerio
	var parentFound = false;	// boolean: is there an html element found using 'selector' variable? - if false, found = false by default
	var found = false;	// boolean, used as a global delimiter to detect if an HTML element that fits the selector was found


	// --- STEP 1: wraps 004 Unit Test within wrapper 'describe' - uses 'title' specified within 'tests.json' ---
	describe(title, function () {
		
		// var el = null;	// local variable used to detect 

		before( function(done) {

			try {
				fileContents = fs.readFileSync(htmlPath, 'utf-8');
				$ = cheerio.load(fileContents);
				if ( startingParent.toLowerCase().indexOf('html') == 0 && startingParent.substring(4,5) != ' ' ) {
					var root = htmlParser.parse(fileContents);
					var rootHTML = root['childNodes'][0];
					filterSelector(startingParent,parentAttributes=>{
						parentFound = (rootHTML['tagName'].toLowerCase() == parentAttributes['selector'].toLowerCase());
						done();
					});
				} 
				else {
					parentFound = ( $(startingParent).length > 0 );
					done();
				}
			} catch(error) {
				done();
			}
		});

		/* --- STEP 3: IT statement performs our test - self-explanatory */
		it(itStatement, function(done) {
			validateChildrenNew($, startingParent, startingChildren, res=>{
				found = res;
				if ( (!parentFound || !found) && hintsStatement.length == 0) {
					hintsStatement = 'Your code has some elements either misplaced or missing:\n';
					hintsStatement += '- Check for any mispelled tags\n';
					hintsStatement += '- Make sure that HTML elements are properly ordered based on instructions\n';
					hintsStatement += '- Make sure that any elements that are nested are inside the proper parent elements';
				}

				expect(fileContents, 'HTML file contents could not be retrieved.').to.not.be.null;
				expect(parentFound, 'Starting Parent Selector could not be found.').to.equal(true);
				expect(found, errorStatement).to.equal(true);
				done();
			});
		});

		/* --- STEP 4: If the test fails, we must print out the hints into Mochawesome --- */
		afterEach(function(done) {
			if (hintsStatement.length > 0 && !found)	this.currentTest.context = {'title':'Hints','value':hintsStatement};
			done();
		});
	});

	/* --- 004 UNIT TEST FINISHED --- */

}

/* --- Allows for this unit test to be used within 'runner.js' --- */
exports.main = main;