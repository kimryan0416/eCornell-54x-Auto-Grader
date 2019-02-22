const exec = require('child_process').exec;
const common = require('../common.js');

const path = common.path;
const escapeHTML = common.escapeHTML;
const vnuPath = common.vnuPath;

function main(name, custom_title, custom_message, variables, done) {

	var cssPath = variables['CSS_PATH'];
	var testTitle = (custom_title) ? escapeHTML(custom_title) : 'Expecting no CSS errors';

	var cmd = 'java -jar '+vnuPath+' --skip-non-css --format json --errors-only '+ cssPath;
	exec(cmd,(error, stdout, stderr)=>{
		if (error) {
			var messages = JSON.parse(stderr).messages.reduce(function(filtered,error){
				var newMessage = '- [Line '+error.lastLine+'] '+escapeHTML(error.message);
				var testMessage = error.message.toLowerCase().replace(/[^a-zA-Z ]/g,'');
				var thisURL = error.url.replace(process.cwd(), '').replace('file:/','');
				filtered[thisURL] = filtered[thisURL] || '';
				filtered[thisURL] += newMessage + '\n';
				return filtered;
			},{});

			done({
				name: name,
				title: testTitle,
				success: Object.keys(messages).length == 0,
				message: messages,
				console_message: 'CSS errors present!'
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