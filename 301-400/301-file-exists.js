const common = require('../common.js');

const fs = common.fs;
const expect = common.expect;

function main(title, variables, statement, errorMessage, hints) {
	var thisPath = variables['PATH'];

	var itStatement = (statement.length > 0) ? statement : 'Expect path/file to exist';
	var errorStatement = (errorMessage.length > 0) ? errorMessage : "Path/file does not exist!";
	var hintsStatement = (hints != null) ? (hints && hints.length > 0) ? hints : null : "- Make sure all files/directories are not misplaced\n- Make sure all files/directories are not misnamed and/or mispelled";

	var res = null;

	describe(title, function() {

		before(function(done) {
			fs.access(thisPath, err=>{
				res = (err) ? false : true;
				done();
			});
		});

		it(itStatement, function(done) {
			expect(res, errorStatement).to.be.true;
			done();
		});

		afterEach(function(done) {
			if (!res && hintsStatement) this.currentTest.context = {"title":"Hints","value":hintsStatement}
			done();
		});

	});

}

exports.main = main;