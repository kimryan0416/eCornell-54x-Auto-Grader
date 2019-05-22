const common = require('../common.js');
const exec = require('child_process').exec;

const isArray = common.isArray;
const escapeHTML= common.escapeHTML;
const path = common.path;
const fs = common.fs;

function main(name, custom_title, custom_message, variables, done) {

	/*
	This is the list of variables we're looking for:
	PATH: to file
	SUBMIT_SELECTOR: selector for submit button to form
	WAIT_TIME: time for waiting until page responds for submit
	ATTEMPTS: array of objects - each requires a separate test
	[
		{
			"attempt_name":"",
			"form_selector":"",
			"inputs":[
				{
					"input_selector":"",
					"type":"click"/"text"/"select"/"upload/",
					"content":"",
					"wait": int or null
				}
			],
			"results":[
				{
					"end_selector":"",
					"type":"",
					"expected/undexpected":""
				}
			]
		}
	]
	*/
	var dirPath = variables["DIR_PATH"];
	var file = (variables['FILE'] != null) ? path.normalize(variables['FILE']) : 'index.html';
	var submit_selector = variables["SUBMIT_SELECTOR"];
	var waitTime = (variables["WAIT_TIME"] != null) 
		? (typeof variables["WAIT_TIME"] === "string") 
			? parseInt(variables["WAIT_TIME"]) 
			: (typeof variables["WAIT_TIME"] === "number") 
				? variables["WAIT_TIME"] 
				: 2000
		: 2000;
	var attempts = variables["ATTEMPTS"];
	var runnerPath = path.normalize(variables['abs_dir']+"/tests/203-testCafe-form-validation.js");

	const inputTypes = ["click","text","select","upload"];

	var testTitle = (custom_title != null) ? escapeHTML(custom_title) : 'Expecting form to properly check for all constraints';
	var testMessage = (custom_message != null) ? escapeHTML(custom_message) : {};

	if (!isArray(attempts)) {
		done({
			name: name,
			title: testTitle,
			success: false,
			message: err,
			console_message: err
		});
	} else if (submit_selector == null) {
		done({
			name: name,
			title: testTitle,
			success: false,
			message: "A selector to detect the form has not been declared.",
			console_message: "A selector to detect the form has not been declared."
		});
	} else {
		try {
			var parsedAttempts = attempts.reduce((filtered,a)=>{
				var newA = {};
				newA['attempt_name'] = a['attempt_name'];
				newA['form_selector'] = a["form_selector"];
				newA["inputs"] = a["inputs"].filter(input=>{
					return inputTypes.indexOf(input["type"]) > -1;
				});
				newA['results'] = a['results'].reduce((f,r)=>{
					var finR = r;
					if (typeof finR.expected === 'undefined') finR.expected = null;
					if (typeof finR.unexpected === 'undefined') finR.unexpected = null;
					f.push(finR);
					return f;
				},[]);
				filtered.push(newA);
				return filtered;
			},[]);

			var pushToTmp = {
				"submitSelector": submit_selector,
				"waitTime": waitTime,
				"attempts": parsedAttempts
			};
			var tmpDataPath = path.normalize(variables['abs_dir'] + "/tmpFiles/" + "mc_tmp_203.json");
			fs.writeFile(tmpDataPath, JSON.stringify(pushToTmp),function(err){
				if (err) {
					done({
						name: name,
						title: testTitle,
						success: false,
						message: err,
						console_message: err
					});
				} else {
					var command = "unset TZ; env FILE=\""+file+"\" DATAPATH=\""+tmpDataPath+"\" testcafe \"chrome:headless\" "+runnerPath+" --app \"http-server "+dirPath+" -p 8080 -s\" --selector-timeout 20000 --assertion-timeout 20000 --reporter json";
					exec(command,(error,stdout,stderr)=>{
						try {
							fs.unlinkSync(tmpDataPath);
						} catch(deleteErr) {}
						//console.log(stdout);
						var results = JSON.parse(stdout);
						var total = results['total'];
						var passed = results['passed'];
						if (total != passed && custom_message == null) {
							var returnedTests = results["fixtures"][0]["tests"];
							returnedTests.forEach(t=>{
								if (t['errs'].length > 0) {
									var tName = t['name'];
									testMessage["The following attempts at submitting the form did not return the expected outcomes:"] = testMessage["The following attempts at submitting the form did not return the expected outcomes:"] || "";
									testMessage["The following attempts at submitting the form did not return the expected outcomes:"] += '- ' + tName + '\n';
								}
							});
						}
						done({
							name: name,
							title: testTitle,
							success: passed == total,
							message: testMessage,
							console_message: testMessage
						});
					});
				}
			})
		} catch(e) {
			done({
				name: name,
				title: testTitle,
				success: false,
				message: e,
				console_message: e
			});
		}
	}

}

exports.main = main;