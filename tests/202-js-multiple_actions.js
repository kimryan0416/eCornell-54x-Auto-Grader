const common = require('../common.js');
const exec = require('child_process').exec;

const isArray = common.isArray;
const escapeHTML= common.escapeHTML;
const path = common.path;
const fs = common.fs;

function main(name, custom_title, custom_message, variables, done) {

	var file = (variables['FILE'] != null) ? variables['FILE'] : 'index.html';
	var actions = variables['ACTIONS'];
	var dirPath = path.normalize(variables['DIR_PATH'] + '/');
	var runnerPath = path.normalize(variables['abs_dir']+"/"+"tests/202-testCafe-multiple_actions.js");

	var testTitle = (custom_title != null) ? escapeHTML(custom_title) : 'Expecting JavaScript to properly click ';
	var testMessage = (custom_message != null) ? escapeHTML(custom_message) : {};

	var actionsList = ["click","hover","dbl-click","click-sequence"];

	try {
		var parsedActions = actions.reduce((filtered,a)=>{
			var newA = {};
			if (actionsList.indexOf(a['type']) > -1) {
				newA['action_name'] = a['action_name'];
				newA['type'] = a['type'];
				newA['start_selector'] = a['start_selector'];
				newA['wait'] = (typeof a['wait'] === 'number') ? a['wait'] : (typeof a['wait'] === 'string') ? parseInt(a['wait']) : 1000;
				newA['result'] = (typeof a['result'] !== 'undefined' && isArray(a['result'])) 
					? a['result'].reduce((f,r)=>{
							var finR = r;
							if (typeof finR.expected === 'undefined') finR.expected = null;
							if (typeof finR.unexpected === 'undefined') finR.unexpected = null;
							f.push(finR);
							return f;
						},[]) 
					: null;
		      	filtered.push(newA);
			}
			return filtered;
		},[]);
		var tmpDataPath = path.normalize(variables['abs_dir'] + "/tmpFiles/" + "mc_tmp.json");
		fs.writeFile(tmpDataPath, JSON.stringify(parsedActions),function(err){
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
								testMessage["Manipulating the following elements did not return the expected results:"] = testMessage["Manipulating the following elements did not return the expected results:"] || "";
								testMessage["Manipulating the following elements did not return the expected results:"] += '- ' + tName + '\n';
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

exports.main = main;