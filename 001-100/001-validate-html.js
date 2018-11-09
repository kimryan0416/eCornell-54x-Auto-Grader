const exec = require('child_process').exec;
const common = require('../common.js');

const expect = common.expect;
const forceUnicodeEncoding = common.forceUnicodeEncoding;
const vnuPath = common.vnuPath;

/* --- Main test runs via this function --- */
function main(title, variables, statement, errorMessage, hints=null) {

	/*
	// itStatement = conditions for success, unless specified via 'tests.json'
	// errorStatement = error message if failure, unless specified via 'tests.json'
	// NO custom hints allowed - hints take the form of errors returned by the validator
	*/
	var itStatement = (statement.length != 0) ? statement : 'Expecting no HTML errors';
	var errorStatement = (errorMessage.length != 0) ? errorMessage : 'Errors found! Click to see more.';

	/* --- STEP 1: wraps 001 Unit Test within wrapper 'describe' - uses 'title' specified within 'tests.json' --- */
	describe(title, function () {

		/*
		// messages = array that refers to all errors returned by validator
		// - outside of 'before()' because 'messages' must act as a 'global' variable to all components within the test
		*/
		var messages;

		/*
		// STEP 2: 'before()' retrieves all errors using vnu.jar via child process, and 
		// 		filters out all 'expected doctype' and 'missing title' errors if specified by 'tests.json'
		*/
		before(function(done) {
			/*
			// set timeout of test to 20,000 milliseconds (20 seconds)
			// htmlPath = gets path of either HTML file or directory that contains HTML files
			// suppress = should we filter out errors like 'expected doctype' and 'missing title'?
			*/
			this.timeout(20000);
			var htmlPath = variables['HTML_PATH'];
			var suppress = ( variables['SUPPRESS'] != null ) ? variables['SUPPRESS'] : false;
			
			/* --- STEP 2.1: child process executes java command to find HTML errors --- */
			var child = exec('java -jar '+vnuPath+' --skip-non-html --format json --errors-only '+ htmlPath, function (error, stdout, stderr){
				/*
				// STEP 2.2: first parse errors as JSON...
				// 		Then filter out 'expected doctype' and 'missing title' errors if necessary
				// 		Use 'messages' global variable to refer to returned errors
				// 		done()
				*/
				var parsedErrors = JSON.parse(stderr);
				messages = (suppress) ? parsedErrors.messages.filter(mes=>{
					var newMes = mes.message.toLowerCase().replace(/[^a-zA-Z ]/g, '');
					if ( (newMes.indexOf('expected doctype html') == -1) && (newMes.indexOf('element head is missing a required instance of child element title') == -1) ) return mes;
				}) : parsedErrors.messages;
				done();
			});
		});

		/* --- STEP 3: IT statement performs test - pretty self-explanatory --- */
		it(itStatement, function(done) {
			expect(messages.length, errorStatement).to.equal(0);
			done();
		});

		/* --- STEP 4: AfterEach() posts out HTML errors found by validator as hints, if any errors WERE found --- */
		afterEach(function(done) {
			if (messages.length > 0) {
				/*
				// parsedMessages = object storing each file's errors, compiled into a string per file
				// errors = string to be printed to mochawesome, compiles all errors into one single string
				*/
				var parsedMessages = {}, errors = '';

				/* --- STEP 4.1: Reduce all errors per file into a string, and saves new object of strings into 'parsedMessages' --- */
				messages.forEach(mes=>{
					var thisURL = mes.url.replace(process.cwd(), '').replace('file:/','');
					parsedMessages[thisURL] = (typeof parsedMessages[thisURL] === 'undefined') ? '' : parsedMessages[thisURL];
					parsedMessages[thisURL] += '- ' + forceUnicodeEncoding('[Line '+mes.lastLine+']: '+ mes.message) + '\n';
					return;
				});

				/* --- STEP 4.2: Reduce 'parsedMessages' into one string, 'errors' --- */
				Object.keys(parsedMessages).forEach(file => {	errors += 'FILE: "'+file+'"\n' + parsedMessages[file];	});

				/* --- STEP 4.3: send errors to mochawesome as CONTEXT for this test --- */
				this.currentTest.context = {'title':'Error Messages','value':errors};
			}
			done();
		});

		/* --- FINISHED WITH 001 --- */
    });

}

/* --- Allows for this unit test to be used within 'runner.js' --- */
exports.main = main;