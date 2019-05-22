const exec = require('child_process').exec;
const common = require('../common.js');

const expect = common.expect;
const path = common.path;
const forceUnicodeEncoding = common.forceUnicodeEncoding;
const escapeHTML = common.escapeHTML;
const vnuPath = common.vnuPath;

/* --- Main test runs via this function --- */
function main(name, custom_title, custom_message, variables, custom_hints=null) {

	var htmlPath = variables['HTML_PATH'];	// gets path of either HTML file or directory that contains HTML files
	var suppress = ( variables['SUPPRESS'] != null ) ? variables['SUPPRESS'] : false;	// should we filter out errors like 'expected doctype' and 'missing title'?
	
	var testTitle = (custom_title) ? escapeHTML(custom_title) : 'Expecting no HTML errors';	// Stated conditions for success, unless specified via 'tests.json'
	//var testMessage = {};	// error message if failure, predefined, not modifyable by user
	// NO custom hints allowed - hints take the form of errors returned by the validator

	/* --- STEP 1: wraps 001 Unit Test within wrapper 'describe' - uses 'title' specified within 'tests.json' --- */
	describe(name, function () {

		var messages;	// global array that refers to all errors returned by validator

		/* --- STEP 2: 'before()' retrieves all errors using vnu.jar via child process, and filters out all 'expected doctype' and 'missing title' errors if specified by 'tests.json' --- */
		before(function(done) {

			this.timeout(20000);	// set timeout of test to 20,000 milliseconds (20 seconds)
			
			/* --- STEP 2.1: child process executes java command to find HTML errors --- */
			var child = exec('java -jar '+vnuPath+' --skip-non-html --format json --errors-only '+ htmlPath, function (error, stdout, stderr){
				/* --- STEP 2.2: first parse errors as JSON, then filter out 'expected doctype' and 'missing title' errors if necessary - Use 'messages' global variable to refer to returned errors --- */
				var parsedErrors = JSON.parse(stderr);
				/*
				messages = (suppress) ? parsedErrors.messages.filter(mes=>{
					var newMes = mes.message.toLowerCase().replace(/[^a-zA-Z ]/g, '');
					if ( (newMes.indexOf('expected doctype html') == -1) && (newMes.indexOf('element head is missing a required instance of child element title') == -1) ) return mes;
				}) : parsedErrors.messages;
				done();
				*/
				messages = parsedErrors.messages.reduce(function(filtered,error){
					//var newMessage = "<pre><code>"+escapeHTML(error.extract.replace(/\s/g,''))+"</code></pre>\n"+escapeHTML(error.message);
					//var newMessage = "<code style='display:inline-block;font-family:Verdana,Arial,sans-serif;margin-bottom:5px;'>- [Line "+error.lastLine+"] "+escapeHTML(error.message)+"</code>";
					var newMessage = '- [Line '+error.lastLine+'] '+escapeHTML(error.message);
					var testMessage = error.message.toLowerCase().replace(/[^a-zA-Z ]/g,'');
					if (!suppress || (testMessage.indexOf('expected doctype html') == -1 && testMessage.indexOf('element head is missing a required instance of child element title') == -1)) {
						var thisURL = path.basename(error.url.replace(process.cwd(), '').replace('file:/',''));
						filtered[thisURL] = filtered[thisURL] || '';
						filtered[thisURL] += newMessage + '\n';
					}
					return filtered;
				},{});
				/*
				if (Object.keys(messages).length > 0) {
					
					for (var url in messages) {
						testMessage += 
							'<div style="font-size:12px;margin-bottom:15px;">'+
								'<span style="display:block;margin-bottom:5px;font-family:monospace;">['+url+']</span>'+
								'<pre style="margin:0;font-size:10px;font-family:Verdana,Arial,sans-serif;padding-left:15px;word-wrap:break-word;overflow-wrap:break-word;white-space:pre-wrap;">';
						messages[url].forEach(mes=>{
							testMessage += mes+'\n';
						});
						testMessage += '</pre></div>';
					}
					
					for (var url in messages) {
						var m = {
							subtitle: url,
							submessage: ''
						};
						messages[url].forEach(mes=>{
							m.submessage += mes+'\n';
						});
						testMessage[url] = ;
					}
				}
				*/
				done();
			});
		});

		/* --- STEP 3: IT statement performs test - pretty self-explanatory --- */
		it(testTitle, function(done) {
			expect(Object.keys(messages).length, JSON.stringify(messages)).to.equal(0);
			done();
		});

		/* --- STEP 4: AfterEach() posts out HTML errors found by validator as hints, if any errors WERE found --- */
		/*
		afterEach(function(done) {
			if (messages.length > 0) {
				
				var parsedMessages = {}, errors = '';
				// parsedMessages = object storing each file's errors, compiled into a string per file
				// errors = string to be printed to mochawesome, compiles all errors into one single string

				// --- STEP 4.1: Reduce all errors per file into a string, and saves new object of strings into 'parsedMessages' --- 
				messages.forEach(mes=>{
					var thisURL = mes.url.replace(process.cwd(), '').replace('file:/','');
					parsedMessages[thisURL] = (typeof parsedMessages[thisURL] === 'undefined') ? '' : parsedMessages[thisURL];
					parsedMessages[thisURL] += '- ' + forceUnicodeEncoding('[Line '+mes.lastLine+']: '+ mes.message) + '\n';
					return;
				});

				// --- STEP 4.2: Reduce 'parsedMessages' into one string, 'errors' --- 
				Object.keys(parsedMessages).forEach(file => {	errors += 'FILE: "'+file+'"\n' + parsedMessages[file];	});

				// --- STEP 4.3: send errors to mochawesome as CONTEXT for this test --- 
				this.currentTest.context = {'title':'Error Messages','value':errors};
			}
			done();
		});
		*/

		/* --- FINISHED WITH 001 --- */
    });

}

/* --- Allows for this unit test to be used within 'runner.js' --- */
exports.main = main;