const exec = require('child_process').exec;
const fs = require('fs');

var tests = process.env.TESTS;
var command = "env TESTS="+tests+" mocha --opts .guides/cis54x/mocha.opts .guides/cis54x/runner.js";

var child = exec(command, (error, stdout, stderr)=>{
	if (error) {
		var output = '<iframe src=".guides/testReport/report.html" style="display:block;width:100%;margin:auto;min-height:600px;border:none;"></iframe>';
		process.stdout.write(output);
		process.exit(1);
	} else {
		process.stdout.write("Well Done!");
		process.exit(0);
	}
});
