const common = require("../common.js");
const fs = require('fs');
const path = require('path');

const escapeHTML = common.escapeHTML;
const getDirectories = common.getDirectories;
const isArray = common.isArray;

function getFiles(url, callback) {
	fs.lstat(url, (err, stats)=>{
		if (err) callback(err);
		else if (stats.isDirectory()) {
			getDirectories(url, (errs, dirs)=>{
				callback(dirs);
			});
		} 
		else if (stats.isFile()) {
			callback([url]);
		}
		else callback(new Error('Error retrieving all files'));
	});
}

function main(name, custom_title, custom_message, variables, done) {
	var dir_path = variables['DIR_PATH'];
	var extensions = (typeof variables["EXTENSIONS"] === "string") ? [variables["EXTENSIONS"]] : (isArray(variables["EXTENSIONS"])) ? variables["EXTENSIONS"] : null;
	var exists = (variables["EXISTS"] != null && typeof variables["EXISTS"] === "boolean") ? variables["EXISTS"] : true;
	var exceptions = (variables["EXCEPTIONS"] != null && isArray(variables["EXCEPTIONS"])) ? variables["EXCEPTIONS"] : [];
	var deep_search = (variables["DEEP_SEARCH"] != null && typeof variables["DEEP_SEARCH"] === "boolean") ? variables["DEEP_SEARCH"] : true;

	var testTitle = (custom_title != null) ? escapeHTML(custom_title) : 'Expect extensions to exist.';
	var testMessage = (custom_message != null) ? escapeHTML(custom_message) : (exists == true) ? "There are no files with the expected extensions." : "There are files with extensions that aren't meant to exist.";

	if (dir_path == null) {
		done({
			name: name,
			title: testTitle,
			success: false,
			message: "The provided directory path that must be checked has not been provided.",
			console_message: "The provided directory path that must be checked has not been provided."
		});
	} else if (extensions == null || extensions.length == 0) {
		done({
			name: name,
			title: testTitle,
			success: false,
			message: "The extensions that must be checked have not been provided.",
			console_message: "The extensions that must be checked have not been provided."
		});
	} else {
		extensions = extensions.map(e=>{
			let thisE = (e.charAt(0) != '.') ? '.'+e : e;
			return thisE;
		});
		exceptions = exceptions.map(e=>{
			let newE = (e.indexOf(dir_path) > -1) ? e : path.normalize(dir_path + "/" + e);
			return newE;
		});
		getFiles(dir_path,files=>{
			if (files instanceof Error) {
				done({
					name: name,
					title: testTitle,
					success: false,
					message: files,
					console_message: files
				});
			} else if (files.length == 0) {
				done({
					name: name,
					title: testTitle,
					success: false,
					message: "The provided directory path doesn't provide any files.",
					console_message: "The provided directory path doesn't provide any files."
				});
			} else {
				var filesFiltered = (deep_search == true) ? files : files.filter(f=>{
					let thisDir = path.dirname(f);
					if (dir_path.charAt(dir_path.length-1) == "/" && thisDir.charAt(thisDir.length-1) != "/") thisDir += "/";
					if (thisDir == dir_path) return true;
					else return false
				});
				if (filesFiltered.length == 0) {
					done({
						name: name,
						title: testTitle,
						success: false,
						message: "The provided directory path is empty, except for files that were already expected to exist.",
						console_message: "The provided directory path is empty, except for files that were already expected to exist."
					});
				} else {
					var processedFiles = filesFiltered.filter(f=>{
						if (exceptions.indexOf(f) == -1) {
							let thisExt = path.extname(f);
							if (extensions.indexOf(thisExt) > -1) return true;
							else return false;
						}
						else return false;
					});

					done({
						name: name,
						title: testTitle,
						success: processedFiles.length > 0,
						message: testMessage,
						console_message: testMessage
					});
				}
			}
		})
	}
}

exports.main = main;