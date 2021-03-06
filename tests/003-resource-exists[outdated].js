const exec = require('child_process').exec;
const cheerio = require('cheerio');
const common = require('../common.js');

const fs = common.fs;
const path = common.path;
const isArray = common.isArray;
const escapeHTML = common.escapeHTML;

function main(name, custom_title, custom_message, variables, done) {

	var testTitle = (custom_title != null) ? escapeHTML(custom_title) : 'Expect all resources to be present and loaded properly.';
	var testMessage = (custom_message != null) ? escapeHTML(custom_message) : {};

	var dirPath = variables['DIR_PATH'] + '/';
	var files = (variables['FILES'] && isArray(variables['FILES']) ) ? variables['FILES'] : ['index.html'];
	var selector = variables['SELECTOR'];
	var runnerPath = path.normalize(variables['abs_dir']+"tests/003-testCafe-runner.js");
	var found;

	var file, filePath, fileContents, $, command, child, results, successes=0, total = 0, passed = 0;
	var successCount = 0;

	Promise.all(files.map(file => {
		return new Promise((resolve,reject)=>{
			filePath = path.normalize(dirPath+file);
			fileContents = fs.readFileSync(filePath, 'utf-8');
			$ = cheerio.load(fileContents);
			if ( $(selector).length == 0 && !custom_message) {
				testMessage[file] = 'The necessary HTML elements that need to be checked do not exist.';
				resolve();
			}
			else {
				//command = "env SELECTOR=\""+selector+"\" FILE=\""+file+"\" testcafe \"chrome:headless\" .guides/cis54x/tests/003-testCafe-runner.js --app \"http-server "+dirPath+" -s\" --selector-timeout 20000 --assertion-timeout 20000 --reporter json";
				command = "env SELECTOR=\""+selector+"\" FILE=\""+file+"\" testcafe \"chrome:headless\" "+runnerPath+" --app \"http-server "+dirPath+" -s\" --selector-timeout 20000 --assertion-timeout 20000 --reporter json";
				exec(command,(error,stdout,stderr)=>{
					results = JSON.parse(stdout);
					total = results['total'];
					passed = results['passed'];
					if (passed == total) successes++;
					else if (custom_message == null) {
						var errTests = results['fixtures'][0]['tests'];
						errTests.forEach(errTest=>{
							var errMessage = errTest['errs'][0];
							if (errMessage != null) {
								var actualErrMessage = errMessage.substring(
									errMessage.indexOf("AssertionError: ")+("AssertionError: ".length),
									errMessage.indexOf(': expected')
								);
								try {
									let actualErrMessageParsed = JSON.parse(actualErrMessage);
									testMessage[errTest['name']] = actualErrMessageParsed.reduce((filtered,src)=>{
										if (parseInt(src.res) != 200 && filtered.indexOf(String(src.src)) == -1) filtered.push(String(src.src));
										return filtered;
									},[]);
									testMessage[errTest['name']] = testMessage[errTest['name']].reduce((filtered,f)=>{return filtered += '\n- '+f;},'The following properties have not been rendered as expected:');
								} catch(e) {
									testMessage[errTest['name']] = actualErrMessage;
								}
							}
						});
					}
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
			console_message: JSON.stringify(testMessage)
		});
	});

}

exports.main = main;
