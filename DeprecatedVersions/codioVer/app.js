const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');

var processPath = process.env.TESTS;
var testContents = JSON.parse(fs.readFileSync(processPath));

var absolutePath = path.dirname(processPath);
var name = testContents.name;
var tests = testContents.tests;

var reporter = ".guides/cis54x/node_modules/mochawesome/dist/mochawesome.js";
var reporter_options = "showPending=false,enableCode=false,reportDir="+absolutePath+"/testReport/,reportFilename=report,charts=false";
var timeout = 20000;

var command = "env TESTS="+processPath+" mocha --reporter "+reporter+" --reporter-options "+reporter_options+" --timeout "+timeout+" .guides/cis54x/runner.js";

var child = exec(command, (error, stdout, stderr)=>{
	if (error) {
		var output = '<iframe src="'+absolutePath+'/testReport/report.html" style="display:block;width:100%;margin:auto;min-height:600px;border:none;"></iframe>';
		process.stdout.write(output);
		process.exit(1);
	} else {
		process.stdout.write("Well Done!");
		process.exit(0);
	}
});