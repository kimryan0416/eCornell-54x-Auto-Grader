const exec = require('child_process').exec;
const common = require('../common.js');

const fs = common.fs;
const path = common.path;
const isArray = common.isArray;
const escapeHTML = common.escapeHTML;
const hexToRgb = common.hexToRgb;

function main(name, custom_title, custom_message, variables, done) {

	var testTitle = (custom_title) ? escapeHTML(custom_title) : 'Expect CSS to be rendered properly';
	var testMessage = (custom_message) ? escapeHTML(custom_message) : {};

	var dirPath = variables['DIR_PATH'] + '/';
	var file = (variables['FILE'] != null) ? variables['FILE'] : 'index.html';
	var selectors = variables['SELECTORS'];
	var runnerPath = path.normalize(variables['abs_dir']+"tests/103-testCafe-css.js");
	var found;

	var file, filePath, fileContents, newSelectors, selectorsString, command, child, results, successes=0, total = 0, passed = 0;
	var successCount = 0;

	try {
		newSelectors = Object.keys(selectors).reduce((filtered,selector)=>{
			var curData = selectors[selector];
			var newData = Object.keys(curData).reduce((fixedData,property)=>{
				//var thisData = (typeof curData[property] === 'string') ? {"expected":curData[property],"unexpected"} : curData[property];

				var receivedExpected = (typeof curData[property] === 'object')? // null/{} || anything else (string, boolean, undeclared, etc.)
					(curData[property] != null)? // {} || null
						(typeof curData[property]['expected'] !== 'undefined')? // anything else || undeclared
							(curData[property]['expected'] != null)? // anything else | null
								curData[property]['expected']
								:null //'NULLED'
							:null
						:null //'NULLED'
					:(typeof curData[property] !== 'undefined')? // anything else (string, boolean, etc.) || undeclared
						curData[property]
						:null;
				var receivedUnexpected = (typeof curData[property] === 'object')? // null/{} || anything else (string, boolean, undeclared, etc)
					(curData[property] != null)? // {} || null
						(typeof curData[property]['unexpected'] !== 'undefined')? // anything else || undeclared
							(curData[property]['unexpected'] != null)?	// anything else || null
								curData[property]['unexpected']
								:null //'NULLED'
							:null
						:null
					:null;
				var receivedIncluding = (typeof curData[property] === 'object')? // null/{} || anything else (string, boolean, undeclared, etc.)
					(curData[property] != null)? // {} || null
						(typeof curData[property]['including'] !== 'undefined')? // anything else || undeclared
							(curData[property]['including'] != null)? // anything else | null
								curData[property]['including']
								:null //'NULLED'
							:null
						:null //'NULLED'
					:null;
				var receivedExcluding = (typeof curData[property] === 'object')? // null/{} || anything else (string, boolean, undeclared, etc.)
					(curData[property] != null)? // {} || null
						(typeof curData[property]['excluding'] !== 'undefined')? // anything else || undeclared
							(curData[property]['excluding'] != null)? // anything else | null
								curData[property]['excluding']
								:null //'NULLED'
							:null
						:null //'NULLED'
					:null;
				//var receivedUnexpected = (typeof curData[property] !== 'string') ? (typeof curData[property] !== 'undefined') ? (typeof curData[property]['unexpected'] !== 'string') ? (typeof curData[property]['unexpected'] !== 'undefined') ? curData[property]['unexpected'] : undefined : curData[property]['unexpected'] : undefined : undefined;
				
				var fixedExpected, fixedUnexpected, fixedIncluding, fixedExcluding;
				try {
					fixedExpected = hexToRgb(receivedExpected,false);
				} catch(e) {
					fixedExpected = receivedExpected;
				}
				try {
					fixedUnexpected = hexToRgb(receivedUnexpected,false);
				} catch(e) {
					fixedUnexpected = receivedUnexpected;
				}
				fixedIncluding = receivedIncluding;
				fixedExcluding = receivedExcluding;

				fixedData[property] = {
					"expected":fixedExpected,
					"unexpected":fixedUnexpected,
					"including":fixedIncluding,
					"excluding":fixedExcluding
				};
				return fixedData;
			},{});
			filtered[selector] = newData;
			return filtered;
		},{});
		selectorsString = JSON.stringify(newSelectors);
		selectorsString = selectorsString.replace(/"/g, "'");
	} catch(e) {
		done({
			name: name,
			title: testTitle,
			success: false,
			message: e,
			console_message: e
		});
	}

	//command = "env SELECTORS=\""+selectorsString+"\" FILE=\""+file+"\" testcafe \"chrome:headless\" .guides/cis54x/tests/103-testCafe-css.js --app \"http-server "+dirPath+" -s\" --selector-timeout 20000 --assertion-timeout 20000 --reporter json";
  command = "unset TZ; env SELECTORS=\""+selectorsString+"\" FILE=\""+file+"\" testcafe \"chrome:headless\" "+runnerPath+" --app \"http-server "+dirPath+" -s\" --selector-timeout 20000 --assertion-timeout 20000 --reporter json";
	exec(command,(error,stdout,stderr)=>{
		//console.log(stdout);
		results = JSON.parse(stdout);
		total = results['total'];
		passed = results['passed'];
		if (passed != total && !custom_message) {
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
		            testMessage[errTest['name']] = Object.keys(actualErrMessageParsed).reduce((filtered,prop)=>{
		              //if (!actualErrMessageParsed[prop]['found']) filtered += (actualErrMessageParsed[prop]['expected'] != null) ? "The property \""+prop+"\" was rendered as \""+actualErrMessageParsed[prop]['actual']+"\", not as \""+actualErrMessageParsed[prop]['expected']+"\".\n" : "The property \""+prop+"\" was unexpectedly rendered as \""+actualErrMessageParsed[prop]['actual']+"\".\n";
		              if (!actualErrMessageParsed[prop]['found']) filtered +=  "\n- "+String(prop);
		              return filtered;
		            },'The following properties have not been rendered as expected:');
		            //testMessage[errTest['name']] += "Please make sure that:\n- There are no CSS errors\n- Your stylesheet file is not missing and is properly linked\n- Your CSS follows the instructions\n- Your HTML contains the required elements";
		          } catch(e) {
		            testMessage[errTest['name']] = actualErrMessage;
		          }
		        }
			});
		}
		done({
			name: name,
			title: testTitle,
			success: passed == total,
			message: testMessage,
			console_message: JSON.stringify(testMessage)
		});
	});
	/*
	Promise.all(files.map(file => {
			return new Promise((resolve,reject)=>{
				try {
					value = hexToRgb(value);
				} catch(e) {}
				//command = "env SELECTOR=\""+selector+"\" PROPERTY=\""+property+"\" VALUE=\""+value+"\" FILE=\""+file+"\" testcafe \"chrome:headless\" .guides/cis54x/tests/103-testCafe-css.js --app \"http-server "+dirPath+" -s\" --selector-timeout 20000 --assertion-timeout 20000 --reporter json";
				command = "env SELECTOR=\""+selector+"\" PROPERTY=\""+property+"\" VALUE=\""+value+"\" FILE=\""+file+"\" testcafe \"chrome:headless\" ./tests/103-testCafe-css.js --app \"http-server "+dirPath+" -s\" --selector-timeout 20000 --assertion-timeout 20000 --reporter json";
				exec(command,(error,stdout,stderr)=>{
					console.log(stdout);
					results = JSON.parse(stdout);
					total = results['total'];
					passed = results['passed'];
					if (passed == total) successes++;
					else if (!custom_message) testMessage += 'Necessary styling did not load... Some common mistakes tend to be:\n- CSS errors in your stylesheet\n- A stylesheet file is missing or does not exist\n- There is at least one HTML error present';
					resolve();
				});
			});
		})).then((res)=>{
			done({
				name: name,
				title: testTitle,
				success: successes == files.length,
				message: testMessage,
				console_message: testMessage
			});
		});
	*/
}

exports.main = main;
