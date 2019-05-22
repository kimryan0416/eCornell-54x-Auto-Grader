const exec = require('child_process').exec;
const common = require('../common.js');

const path = common.path;
const escapeHTML = common.escapeHTML;
const vnuPath = common.vnuPath;

/* --- Main test runs via this function --- */
function main(name, custom_title, custom_message, variables, done) {

	var htmlPath = variables['HTML_PATH'];	// gets path of either HTML file or directory that contains HTML files
	var suppress = ( variables['SUPPRESS'] != null ) ? variables['SUPPRESS'] : false;	// should we filter out errors like 'expected doctype' and 'missing title'?
	var trueVnuPath = path.normalize(variables['abs_dir']+vnuPath);

	var testTitle = (custom_title != null) ? escapeHTML(custom_title) : 'Expecting no HTML errors';	// Stated conditions for success, unless specified via 'tests.json'
	var testMessage = (custom_message != null) ? escapeHTML(custom_message) : null;

	var cmd = 'java -jar '+trueVnuPath+' --skip-non-html --format json --errors-only '+ htmlPath;
	exec(cmd,(error,stdout,stderr)=>{
		if (error) {
			var messages = JSON.parse(stderr).messages.reduce(function(filtered,error){
				var newMessage = '- [Line '+error.lastLine+'] '+escapeHTML(error.message);
				var thisMessage = error.message.toLowerCase().replace(/[^a-zA-Z ]/g,'');
				if (!suppress || (thisMessage.indexOf('expected doctype html') == -1 && thisMessage.indexOf('element head is missing a required instance of child element title') == -1)) {
					var thisURL = path.basename(error.url.replace(process.cwd(), '').replace('file:/',''));
					filtered[thisURL] = filtered[thisURL] || '';
					filtered[thisURL] += newMessage + '\n';
				}
				return filtered;
			},{});

			var actualMessage = (testMessage != null) ? testMessage : messages;
			var actualConsole = (testMessage != null) ? testMessage : "HTML errors present!";

			done({
				name: name,
				title: testTitle,
				success: Object.keys(messages).length == 0,
				message: actualMessage,
				console_message: actualConsole
			});
		} else {
			done({
				name: name,
				title: testTitle,
				success: true,
				message: null,
				console_message: 'No HTML errors!'
			});
		}
	});
};

/* --- Allows for this unit test to be used within 'runner.js' --- */
exports.main = main;