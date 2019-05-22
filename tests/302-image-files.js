const common = require("../common.js");
const isImage = require('is-image');

const fs = common.fs;
const path = common.path;
const getDirectories = common.getDirectories;
const getDirectoriesAsync = common.getDirectoriesAsync;
const escapeHTML = common.escapeHTML;

function main(name, custom_title, custom_message, variables, done) {
	var rootDir = path.normalize(variables['ROOT_DIR']);
	if ( rootDir.charAt(rootDir.length-1) != '/' ) rootDir += '/';
	var imagesDir = (variables['IMAGES_DIR']) ? path.normalize(variables['IMAGES_DIR']) : '';
	if (imagesDir && imagesDir.charAt(imagesDir.length-1) == '/') imagesDir = imagesDir.substring(0,imagesDir.length-1);

	var testTitle = (custom_title) ? escapeHTML(custom_title): 'Expect all images are in an image directory.';
	var testMessage = (custom_message) ? escapeHTML(custom_message) : (imagesDir.length > 0) ? "All images aren't in the \""+imagesDir+"\" directory." : "All images aren't in the same directory.";

	var combinedRootPath = rootDir+imagesDir, files = [], images = [], cPath;

	const splitStrings = (a, sep = '/') => a.map(i => i.split(sep));	// Given an array of strings, return an array of arrays, containing the strings split at the given separator | @param {!Array<!string>} a | @param {string} sep | @returns {!Array<!Array<string>>}
	const elAt = i => a => a[i];	// Given an index number, return a function that takes an array and returns the element at the given index | @param {number} i | @return {function(!Array<*>): *}
	const rotate = a => a[0].map((e, i) => a.map(elAt(i)));		// Transpose an array of arrays. Example: [['a', 'b', 'c'], ['A', 'B', 'C'], [1, 2, 3]] -> [['a', 'A', 1], ['b', 'B', 2], ['c', 'C', 3]] | @param {!Array<!Array<*>>} a | @return {!Array<!Array<*>>}
	const allElementsEqual = arr => arr.every(e => e === arr[0]);	// Checks of all the elements in the array are the same. | @param {!Array<*>} arr | @return {boolean}
	const commonPath = (input, sep = '/') => rotate(splitStrings(input, sep)).filter(allElementsEqual).map(elAt(0)).join(sep);

	getDirectories(rootDir,(err,files)=>{
		if (err) {
			done({
				name: name,
				title: testTitle,
				success: false,
				message: err,
				console_message: err
			});
		} else {
			images = files.filter(file => {
				return isImage(file);
			});
			if(images.length == 0) {
				done({
					name: name,
					title: testTitle,
					success: true,
					message: "No images detected.",
					console_message: "no images detected."
				})
			} else {
				cPath = commonPath(images);
				done({
					name: name,
					title: testTitle,
					success: cPath.indexOf(combinedRootPath) > -1,
					message: testMessage,
					console_message: testMessage
				});
			}
		}
	});


}

exports.main = main;