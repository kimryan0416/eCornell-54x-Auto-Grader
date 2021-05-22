const common = require('../common.js');

const fs = common.fs
const path = common.path;
const escapeHTML = common.escapeHTML;
const getDirectories = common.getDirectories;
const vnuPath = common.vnuPath;

const { JSHINT } = require('jshint');

function getFiles(url,callback) {
	fs.lstat(url, (err, stats)=>{
		if (err) callback(err);
		else if (stats.isDirectory()) {
			getDirectories(url, (errs, dirs)=>{
				var files = dirs.filter(function(file) {
					if (path.extname(file) == '.js' && file.indexOf('jquery-') == -1) return file;
				});
				callback(files);
			});
		} 
		else if (stats.isFile()) {
			if (path.extname(url) == '.js' && url.indexOf('jquery-') == -1) callback([url]);
			else callback(new Error ('Not a JS file'));
		}
		else callback(new Error('Error retrieving all files'));
	});
}

/* --- Main test runs via this function --- */
function main(name, custom_title, custom_message, variables, done) {

	var jsPath = variables['JS_PATH'];	// gets path of either HTML file or directory that contains HTML files
	var jQuery = (typeof variables['jQuery'] === 'boolean') ? variables['jQuery'] : true;

	var testTitle = (custom_title != null) ? escapeHTML(custom_title) : 'Expecting no HTML errors';	// Stated conditions for success, unless specified via 'tests.json'
	var testMessage = (custom_message != null) ? escapeHTML(custom_message) : null;

	var source = null,
		options = {undef: true},
		predef = (jQuery) ? {
			"$": true,
			"document": true,
			"jquery": true
		} : {},
		stdout = null, 
		errors = {},
		errorsRaw = {};

	// NEED TO DO:
	// 2) Make so that it recursively checks all JS files in given directory, if jsPath is directory
	// Add to all code in 545 code activities

	getFiles(jsPath, files=>{
		if (files instanceof Error || files.length == 0) {
			testMessage = "Error retrieving all JavaScript files\n- Check that all JS files are present within the correct directory\n- Make sure file names are not mispelled or that files are named incorrectly";
			done({
				name: name,
				title: testTitle,
				success: false,
				message: testMessage,
				console_message: files
			});
		} else {
			files.forEach(f=>{
				try {
					source = fs.readFileSync(f, "utf-8");
					JSHINT(source, options, predef);
					var stdout = JSHINT.data();
					if (typeof stdout.errors !== 'undefined') {
						errors[f] = '';
						errorsRaw[f] = [];
						stdout.errors.forEach(e=>{
							if (e.id == '(error)') {
								let location = 'Line ' + e.line + ':' + e.character;
								let reason = e.reason;
								errors[f] += '\n- ' + location + " - " + reason;
								errorsRaw[f].push(e);
							}
						});
					}
				} catch(e) {
					errors[f] = "Could not read the following JavaScript file";
					errorsRaw[f] = null;
				}
			});

			var printMessage, conMessage;
			if (testMessage != null) {
				var newMessage = testMessage.replace(/{{NUM_ERRORS}}/g, Object.keys(errorsRaw).reduce((filtered,f)=>{
					filtered += errorsRaw[f].length;
					return filtered;
				},0));
				newMessage = newMessage.replace(/{{ERRORS}}/g,JSON.stringify(errors));

				printMessage = newMessage;
				conMessage = newMessage;
			} else {
				printMessage = errors;
				conMessage = JSON.stringify(errors);
			}

			done({
				name: name,
				title: testTitle,
				success: Object.keys(errors).length == 0,
				message: printMessage,
				console_message: conMessage
			});
		}
	});

	
};

/* --- Allows for this unit test to be used within 'runner.js' --- */
exports.main = main;