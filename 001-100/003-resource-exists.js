const cheerio = require('cheerio');
const path = require('path');
const exec = require('child_process').exec;
const common = require('../common.js');

const fs = common.fs;
const isArray = common.isArray;
const expect = common.expect;

function main(title, variables, statement, errorMessage, hints) {

	var itStatement = (statement.length > 0) ? statement : 'Expect all resources to be present and loaded properly';
	var errorStatement = (errorMessage.length > 0) ? errorMessage : "Some or all resources haven't loaded!";
	var hintsStatement = (hints != null) ? (hints && hints.length > 0) ? hints : null : '';

	var dirPath = (variables['DIR_PATH'].substr(variables['DIR_PATH'].length - 1) == '/') ? variables['DIR_PATH'] : variables['DIR_PATH'] + '/';
	var files = (variables['FILES'] && isArray(variables['FILES']) ) ? variables['FILES'] : ['index.html'];
	var selector = variables['SELECTOR'];
	var found;

	describe(title, function () {

		before(function(done) {
			this.timeout(20000);
			var file, filePath, fileContents, $, command, child, results, total = 0, passed = 0;
			var successCount = 0;
			var loop = function(index,array,successes,callback) {
				if (index < array.length) {
					file = array[index];
					filePath = dirPath + file;
					fileContents = fs.readFileSync(filePath, 'utf-8');
					$ = cheerio.load(fileContents);
					if ( $(selector).length == 0 ) {
						if (hintsStatement != null) hintsStatement += '['+file+'] -- HTML elements do not exist!\n- Make sure you have added the necessary HTML elements into the code.';
						loop(index+1,array,successes,callback);
					}
					else {
						command = "env SELECTOR=\""+selector+"\" FILE=\""+file+"\" testcafe \"chrome:headless\" 001-100/003-testCafe-runner.js --app \"http-server "+dirPath+" -s\" --selector-timeout 20000 --assertion-timeout 20000 --reporter json";
						child = exec(command, function(error, stdout, stderr) {
							results = JSON.parse(stdout);
							total = results['total'];
							passed = results['passed'];
							if (passed == total) successes += 1;
							else if (hintsStatement != null) {
								hintsStatement += '['+file+'] -- Some resources did not load... Some common mistakes tend to be:\n';
								hintsStatement += '- The "src" attribute does not link to a proper file\n';
								hintsStatement += '- A resource file is missing or does not exist\n';
								hintsStatement += '- There is at least one HTML error present\n';
							}
							loop(index+1,array,successes,callback);
						});
					}
				}
				else callback(successes);
			}
			loop(0,files,0,count=>{
				found = (count == files.length);
				done();
			});
		});

		it(itStatement, function() {
			expect(found, errorStatement).to.be.true;
		});

		afterEach(function(done) {
			if (!found && hintsStatement && hintsStatement.length > 0) this.currentTest.context = {"title":"Hints","value":hintsStatement};
			done();
		});

	});

}

exports.main = main;
