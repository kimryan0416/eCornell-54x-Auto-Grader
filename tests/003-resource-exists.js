const exec = require('child_process').exec;
const cheerio = require('cheerio');
const common = require('../common.js');

const fs = common.fs;
const path = common.path;
const isArray = common.isArray;
const escapeHTML = common.escapeHTML;

function main(name, custom_title, custom_message, variables, done) {

	var testTitle = (custom_title) ? escapeHTML(custom_title) : 'Expect all resources to be present and loaded properly';
	var testMessage = (custom_message) ? escapeHTML(custom_message) : '';

	var dirPath = variables['DIR_PATH'] + '/';
	var files = (variables['FILES'] && isArray(variables['FILES']) ) ? variables['FILES'] : ['index.html'];
	var selector = variables['SELECTOR'];
	var found;

	var file, filePath, fileContents, $, command, child, results, successes=0, total = 0, passed = 0;
	var successCount = 0;

	Promise.all(files.map(file => {
		return new Promise((resolve,reject)=>{
			filePath = path.normalize(dirPath+file);
			fileContents = fs.readFileSync(filePath, 'utf-8');
			$ = cheerio.load(fileContents);
			if ( $(selector).length == 0 && !custom_message) {
				testMessage += '- Necessary HTML elements do not exist!\n';
				resolve();
			}
			else {
				command = "env SELECTOR=\""+selector+"\" FILE=\""+file+"\" testcafe \"chrome:headless\" .guides/cis54x/tests/003-testCafe-runner.js --app \"http-server "+dirPath+" -s\" --selector-timeout 20000 --assertion-timeout 20000 --reporter json";
				//command = "env SELECTOR=\""+selector+"\" FILE=\""+file+"\" testcafe \"chrome:headless\" ./tests/003-testCafe-runner.js --app \"http-server "+dirPath+" -s\" --selector-timeout 20000 --assertion-timeout 20000 --reporter json";
				exec(command,(error,stdout,stderr)=>{
					results = JSON.parse(stdout);
					total = results['total'];
					passed = results['passed'];
					if (passed == total) successes++;
					else if (!custom_message) testMessage += 'Necessary resources did not load... Some common mistakes tend to be:\n- The "src" attribute does not link to a proper file\n- A resource file is missing or does not exist\n- There is at least one HTML error present';
					resolve();
				});
			}
		})
	})).then((res)=>{
		done({
			name: name,
			title: testTitle,
			success: successes == files.length,
			message: testMessage,
			console_message: testMessage
		});
	});

}

exports.main = main;
