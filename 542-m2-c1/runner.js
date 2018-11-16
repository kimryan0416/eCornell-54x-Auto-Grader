const fs = require('fs');

if (process.env.TESTS == null) {
	process.stdout.write("TESTS environment variable not set");
	process.exit(1);
}

var json = JSON.parse(fs.readFileSync(process.env.TESTS, 'utf-8'));
var tests = json['tests'];

function importTest(p) {
	var thisTest = require(p.test);
    thisTest.main(p.title, p.variables, p.statement, p.errorMessage, p.hints);
}

tests.forEach(function(test) {
	var thisStatement = (test.statement != null) ? test.statement : '';
	var thisError = (test.error_message != null) ? test.error_message : '';
	var thisHints = (test.hints != null) ? test.hints : null;
	importTest({
		'title' : test.title,
		'test' : test.test,
		'variables' : test.variables,
		'statement' : thisStatement,
		'errorMessage' : thisError,
		'hints' : thisHints
	});
});