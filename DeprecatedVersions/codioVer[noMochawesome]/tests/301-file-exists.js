const common = require('../common.js');

const fs = common.fs;
const expect = common.expect;
const escapeHTML = common.escapeHTML;

function main(name, custom_title, custom_message, variables, custom_hints) {
	var thisPath = variables['PATH'];

	var testTitle = (custom_message) ? escapeHTML(custom_message) : 'Expect path/file to exist';
	var testMessage = (custom_message) ? escapeHTML(custom_message) : "Path/file does not exist!\n- Make sure all files/directories are not misplaced\n- Make sure all files/directories are not misnamed and/or mispelled";
	//var hintsStatement = (hints != null) ? (hints && hints.length > 0) ? hints : null : "- Make sure all files/directories are not misplaced\n- Make sure all files/directories are not misnamed and/or mispelled";

	var res = null;

	describe(name, function() {

		it(testTitle, function(done) {
			fs.access(thisPath, err=>{
				res = (err) ? false : true;
				expect(res, testMessage).to.be.true;
				done();
			});
		});

		/*
		afterEach(function(done) {
			if (!res && hintsStatement) this.currentTest.context = {"title":"Hints","value":hintsStatement}
			done();
		});
		*/
	});

}

exports.main = main;