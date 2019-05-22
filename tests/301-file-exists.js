const util = require('util');
const access = require('fs').access;
const common = require('../common.js');

const escapeHTML = common.escapeHTML;

function main(name, custom_title, custom_message, variables, done) {
	var paths = (variables['PATHS'] != null) ? (typeof variables['PATHS'] === 'object') ? variables['PATHS'] : [variables['PATHS']] : ['index.html'];
	var exists = (variables['EXISTS'] != null && typeof variables['EXISTS'] === 'boolean') ? variables['EXISTS'] : true;

	var testTitle = (custom_title != null) ? escapeHTML(custom_title) : 'Expect path/file to exist';
	var testMessage = (custom_message != null) ? escapeHTML(custom_message) : (exists == true) ? {"The following paths do not exist:":""} : {"The following paths still exist:":""};

	var promises = Promise.all(paths.map(f=>{
		return new Promise(resolve=>{
			access(f,err=>{
				var res = (err) ? false : true;
				resolve({
					file:f,
					res:res==exists
				});
			});
		})
	}))
	promises.then(results=>{
		var failures = [];
		results.forEach(f=>{
			if (!f.res) {
				failures.push(f);
				if (custom_message==null) {
					if (exists == true) testMessage["The following paths do not exist:"] += "- "+f.file+"\n";
					else testMessage["The following paths still exist:"] += "- "+f.file+"\n";
				}
			}
		});
		done({
			name: name,
			title: testTitle,
			success: failures.length == 0,
			message: testMessage,
			console_message: testMessage
		});
	});
	/*
	access(thisPath,err=>{
		var res = (err) ? false : true;
		done({
			name: name,
			title: testTitle,
			success: res == exists,
			message: testMessage,
			console_message: testMessage
		});
	});
	*/
}

exports.main = main;