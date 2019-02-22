const util = require('util');
const access = require('fs').access;
const common = require('../common.js');

const escapeHTML = common.escapeHTML;

function main(name, custom_title, custom_message, variables, done) {
	var thisPath = variables['PATH'];

	var testTitle = (custom_title) ? escapeHTML(custom_title) : 'Expect path/file to exist';
	var testMessage = (custom_message) ? escapeHTML(custom_message) : "Path/file does not exist!\n- Make sure all files/directories are not misplaced\n- Make sure all files/directories are not misnamed and/or mispelled";

	access(thisPath,err=>{
		var res = (err) ? false : true;
		done({
			name: name,
			title: testTitle,
			success: res,
			message: testMessage,
			console_message: testMessage
		});
	});
}

exports.main = main;