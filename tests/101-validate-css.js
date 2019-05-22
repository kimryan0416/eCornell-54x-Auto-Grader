const exec = require('child_process').exec;
const common = require('../common.js');

const path = common.path;
const escapeHTML = common.escapeHTML;
const vnuPath = common.vnuPath;

function main(name, custom_title, custom_message, variables, done) {

	var cssPath = variables['CSS_PATH'];
	var testTitle = (custom_title != null) ? escapeHTML(custom_title) : 'Expecting no CSS errors';
	var testMessage = (custom_message != null) ? escapeHTML(custom_message) : null;
	var trueVnuPath = path.normalize(variables['abs_dir']+vnuPath);

	var cmd = 'java -jar '+trueVnuPath+' --skip-non-css --format json --errors-only '+ cssPath;
	exec(cmd,(error, stdout, stderr)=>{
		if (error) {
			var messages = JSON.parse(stderr).messages.reduce(function(filtered,error){
				var newMessage = '- [Line '+error.lastLine+'] '+escapeHTML(error.message);
				var thisMessage = error.message.toLowerCase().replace(/[^a-zA-Z ]/g,'');
				var thisURL = error.url.replace(process.cwd(), '').replace('file:/','');
				filtered[thisURL] = filtered[thisURL] || '';
				filtered[thisURL] += newMessage + '\n';
				return filtered;
			},{});

			var actualMessage = (testMessage != null) ? testMessage : messages;
			var actualConsole = (testMessage != null) ? testMessage : "CSS errors present!";

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
				console_message: 'No CSS errors!'
			});
		}
	});
	
		
}

exports.main = main;