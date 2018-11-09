var cheerio = require('cheerio');
var htmlParser = require('node-html-parser');

const common = require("../common.js");
const fs = common.fs;
const assert = common.assert;
const expect = common.expect;
const should = common.should;
const escaepHTML = common.escapeHTML;

function filterSelector(sel, cheer, callback) {
	var thisTitle = sel, thisSelector = sel, modSelector = sel, thisContains = null, thisAttributes = null;
	var regExp, matches, attrs, keys;
	if (sel.match(/:contains/)) {
		var spl = sel.split(":");
		regExp = /\(\"([^)]+)\"\)/
		matches = regExp.exec(spl[1]);

		thisTitle = spl[0];
		thisSelector = spl[0];
		thisContains = matches[1];
	}

	if (sel.match(/\[.*?\]/)) {
		regExp = /(.*?)(\[(.*?)\])/;
		matches = regExp.exec(thisSelector);
		modSelector = matches[1];

		matches = sel.match(/\[.*?\]/g);
		thisAttributes = matches.map(function(match) { return match.slice(1,-1).trim().toLowerCase().replace(/[^\w\s]/gi, '').replace(/["']/g, '"'); });

	} else {
		modSelector = thisSelector;
		thisAttributes = null;
	}
	
	callback({"title":thisTitle,"selector":thisSelector,"modSelector":modSelector,"contains":thisContains,"attributes":thisAttributes});
}


function main(title, variables) {

	var htmlPath = variables['HTML_PATH'];
	var selector= variables['SELECTOR'];
	var exists, itTitle, itMessage; 

	if (variables['EXISTS'] != null) {
		exists = variables['EXISTS'];
		if (exists) {
			itTitle = "";
			itMessage = "Element doesn't exist when it should!";
		}
		else {
			itTitle = "NOT ";
			itMessage = "Element does exist when it shouldn't!";
		}
	} else {
		exists = true;
		itTitle = "";
		itMessage = "Element doesn't exist when it should!";
	}

	var fileContents, htmlRoot, found;
	var testTitle = "", el = null, useCheerio = false;
	var $, body;

	describe(title, function () {

		before(function(done) {
			fileContents = fs.readFileSync(htmlPath, 'utf-8');

			htmlRoot = htmlParser.parse(fileContents);
			$ = cheerio.load(fileContents);

			filterSelector(selector, $, res=>{
				testTitle = res['title'];
				try {
					if (res['contains'] != null) {
						useCheerio = true;
						el = $(res['selector']).filter(function() {
							return $(this).text().trim().toLowerCase().replace(/[^\w\s]/gi, '').replace(/["']/g, '"') === res['contains'].toLowerCase().replace(/[^\w\s]/gi, '').replace(/["']/g, '"');
						});
					} else if (res['attributes'] != null) {
						var loop = true, attrArray, reconstructed, newFileContents;
						while(loop) {
							el = htmlRoot.querySelector(res['modSelector']);
							if (el == null) loop = false;
							else {
								attrArray = el['rawAttrs'].trim().toLowerCase().replace(/[^\w\s]/gi, '').replace(/["']/g, '"').split(' ');
								if (res['attributes'].every(function(val) { return attrArray.indexOf(val) >= 0; })) loop = false;
								else {
									reconstructed = el.toString();
									newFileContents.replace(reconstructed, "");
									htmlRoot = htmlParser.parse(newFileContents);
								}
							}
						}
					} else {
						el = htmlRoot.querySelector(res['selector']);
					}
					if ( useCheerio ) {
						if (el.length > 0) found = true;
						else found = false;
					} else {
						if (el != null) found = true;
						else found = false;
					}
				} catch(e) {
					found = false;
				}
				done();
			});
		});

		it("Expect element to "+itTitle+"exist", function(done) {
			expect(found, itMessage).to.equal(exists);
			done(); 
		});

	});

}

exports.main = main;



