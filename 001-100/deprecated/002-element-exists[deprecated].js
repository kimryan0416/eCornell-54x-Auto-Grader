var cheerio = require('cheerio');

const common = require("../common.js");
const fs = common.fs;
const assert = common.assert;
const expect = common.expect;
const should = common.should;
const escaepHTML = common.escapeHTML;

function filterSelector(sel, callback) {
	if (sel.match(/:contains/)) {
		var spl = sel.split(":");
		var regExp = /\(\"([^)]+)\"\)/
		var matches = regExp.exec(spl[1]);
		callback({"title":spl[0],"selector":spl[0],"contains":matches[1]});
	} else {
		callback({"title":sel,"selector":sel,"contains":null});
	}
}


function main(title, variables) {

	var htmlPath, selector, found;
	var testTitle = "", el = null;
	var $;


	before(function(done) {
		htmlPath = variables['HTML_PATH'];
		selector = variables['SELECTOR'];
		$ = cheerio.load(fs.readFileSync(htmlPath));

		filterSelector(selector, res=>{	
			testTitle = res['title'];
			try {
				if (res['contains'] != null) {
					el = $(res['selector']).filter(function() {
						return $(this).text().trim() === res['contains'];
					});
				} else {
					el = $(res['selector']);
				}
				if (el.length > 0) found = true;
				else found = false;
			} catch(e) {
				found = false;
			}
			done();
		});
	});

	it("Should return \"true\" if HTML element was found", function(done) {
		expect(found, "Element Wasn't Found!").to.be.true;
		done(); 
	});

}

exports.main = main;



