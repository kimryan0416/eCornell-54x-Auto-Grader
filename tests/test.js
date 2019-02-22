const common = require('../common.js');

const expect = common.expect;
const forceUnicodeEncoding = common.forceUnicodeEncoding;
const vnuPath = common.vnuPath;

/* --- Main test runs via this function --- */
function main(title, variables, statement, errorMessage, hints=null) {

	var htmlPath = variables['HTML_PATH'];	// gets path of either HTML file or directory that contains HTML files
	var suppress = ( variables['SUPPRESS'] != null ) ? variables['SUPPRESS'] : false;	// should we filter out errors like 'expected doctype' and 'missing title'?
	
	var itStatement = (statement.length != 0) ? statement : 'Expecting no HTML errors';	// Stated conditions for success, unless specified via 'tests.json'
	var errorStatement = (errorMessage.length != 0) ? errorMessage : 'Errors found! Click to see more.';	// error message if failure, unless specified via 'tests.json'
	// NO custom hints allowed - hints take the form of errors returned by the validator

	var prop;

	/* --- STEP 1: wraps 001 Unit Test within wrapper 'describe' - uses 'title' specified within 'tests.json' --- */
	describe(title, function () {

		var messages;	// global array that refers to all errors returned by validator

		/* --- STEP 3: IT statement performs test - pretty self-explanatory --- */
		it(itStatement, function(done) {
			expect(messages.length, errorStatement).to.equal(0);
			prop = 'hello';
			done();
		});

		/* --- STEP 4: AfterEach() posts out HTML errors found by validator as hints, if any errors WERE found --- */
		afterEach(function(done) {
			console.log(prop);
			done();
		});

		/* --- FINISHED WITH 001 --- */
    });

}

/* --- Allows for this unit test to be used within 'runner.js' --- */
exports.main = main;