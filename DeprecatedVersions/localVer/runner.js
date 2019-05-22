const fs = require('fs');
const path = require('path');

if (process.env.TESTS == null) {
	process.stdout.write("TESTS environment variable not set");
	process.exit(1);
}

var json = JSON.parse(fs.readFileSync(process.env.TESTS, 'utf-8'));
var tests = json['tests'];
var dirToTest = ( process.env.DIR && typeof process.env.DIR === "string" ) ? process.env.DIR : path.dirname(process.env.TESTS); 
// the directory of the submission we're testing

function importTest(p) {
	var thisTest = require(p.test);
    thisTest.main(p.title, p.variables, p.statement, p.errorMessage, p.dirToTest, p.hints);
}

tests.forEach(function(test) {
	var thisStatement = (test.statement != null) ? test.statement : '';
	var thisError = (test.error_message != null) ? test.error_message : '';
	var thisHints = (test.hints != null) ? test.hints : null;
	importTest({
		'title' : test.title,
		'test' : test.test,
		'variables' : test.variables,
		'dirToTest' : dirToTest,
		'statement' : thisStatement,
		'errorMessage' : thisError,
		'hints' : thisHints
	});
});