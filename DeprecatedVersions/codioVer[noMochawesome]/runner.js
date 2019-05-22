const fs = require('fs');

if (process.env.TESTS == null) {
	process.stdout.write("TESTS environment variable not set");
	process.exit(1);
}

var json = JSON.parse(fs.readFileSync(process.env.TESTS, 'utf-8'));
var tests = json['tests'];

function importTest(p) {
	var thisTest = require(p.test);
    thisTest.main(p.name, p.title, p.message, p.variables, p.hints);
}

tests.forEach(function(test) {
	var title = (test.title != null) ? test.title : null;
	var message = (test.message != null) ? test.message : null;
	var hints = (test.hints != null) ? test.hints : null;
	importTest({
		'name' : test.name,
		'test' : test.test,
		'title' : title,
		'message' : message,
		'variables' : test.variables,
		'hints' : hints
	});
});