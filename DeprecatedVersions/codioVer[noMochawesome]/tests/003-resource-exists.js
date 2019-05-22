const cheerio = require('cheerio');
const path = require('path');
const exec = require('child_process').exec;
const common = require('../common.js');

const fs = common.fs;
const isArray = common.isArray;
const expect = common.expect;
const escapeHTML = common.escapeHTML;

function main(name, custom_title, custom_message, variables, custom_hints = null) {

	var testTitle = (custom_title) ? escapeHTML(custom_title) : 'Expect all resources to be present and loaded properly';
	var testMessage = (custom_message) ? escapeHTML(custom_message) : '';

	var dirPath = variables['DIR_PATH'] + '/';
	var files = (variables['FILES'] && isArray(variables['FILES']) ) ? variables['FILES'] : ['index.html'];
	var selector = variables['SELECTOR'];
	var found;

	describe(name, function () {

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
						if (!custom_message) testMessage += '- Necessary HTML elements do not exist!\n';
						loop(index+1,array,successes,callback);
					}
					else {
						command = "env SELECTOR=\""+selector+"\" FILE=\""+file+"\" testcafe \"chrome:headless\" ./tests/003-testCafe-runner.js --app \"http-server "+dirPath+" -s\" --selector-timeout 20000 --assertion-timeout 20000 --reporter json";
						child = exec(command, function(error, stdout, stderr) {
							results = JSON.parse(stdout);
							total = results['total'];
							passed = results['passed'];
							if (passed == total) successes += 1;
							else if (!custom_message) testMessage += 'Necessary resources did not load... Some common mistakes tend to be:\n- The "src" attribute does not link to a proper file\n- A resource file is missing or does not exist\n- There is at least one HTML error present';
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

		it(testTitle, function() {
			expect(found, testMessage).to.be.true;
		});

		/*
		afterEach(function(done) {
			if (!found && testHints && testHints.length > 0) this.currentTest.context = {"title":"Hints","value":testHints};
			done();
		});
		*/

	});

}

exports.main = main;
