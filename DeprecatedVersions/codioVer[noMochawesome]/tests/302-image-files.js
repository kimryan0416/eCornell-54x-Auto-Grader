const common = require("../common.js");
const isImage = require('is-image');

const fs = common.fs;
const path = common.path;
const getDirectories = common.getDirectories;
const escapeHTML = common.escapeHTML;
const expect = common.expect;

function main(name, custom_title, custom_message, variables, custom_hints = null) {
	var rootDir = path.normalize(variables['ROOT_DIR']);
	if ( rootDir.charAt(rootDir.length-1) != '/' ) rootDir += '/';
	var imagesDir = (variables['IMAGES_DIR']) ? path.normalize(variables['IMAGES_DIR']) : '';
	if (imagesDir && imagesDir.charAt(imagesDir.length-1) == '/') imagesDir = imagesDir.substring(0,imagesDir.length-1);

	var testTitle = (custom_title) ? escapeHTML(custom_title): 'Expect all images are in an image directory';
	var testMessage = (custom_message) ? escapeHTML(custom_message) : (imagesDir.length > 0) ? "All images aren't in the \""+imagesDir+"\" directory" : "All images aren't in the same directory!";
	//var testHints = (custom_hints != null) ? (custom_hints && custom_hints.length > 0) ? custom_hints : null : "Make sure ALL images within your website are contained within the same base directory.";

	var combinedRootPath = rootDir+imagesDir, images = [];

	const splitStrings = (a, sep = '/') => a.map(i => i.split(sep));	// Given an array of strings, return an array of arrays, containing the strings split at the given separator | @param {!Array<!string>} a | @param {string} sep | @returns {!Array<!Array<string>>}
	const elAt = i => a => a[i];	// Given an index number, return a function that takes an array and returns the element at the given index | @param {number} i | @return {function(!Array<*>): *}
	const rotate = a => a[0].map((e, i) => a.map(elAt(i)));		// Transpose an array of arrays. Example: [['a', 'b', 'c'], ['A', 'B', 'C'], [1, 2, 3]] -> [['a', 'A', 1], ['b', 'B', 2], ['c', 'C', 3]] | @param {!Array<!Array<*>>} a | @return {!Array<!Array<*>>}
	const allElementsEqual = arr => arr.every(e => e === arr[0]);	// Checks of all the elements in the array are the same. | @param {!Array<*>} arr | @return {boolean}
	const commonPath = (input, sep = '/') => rotate(splitStrings(input, sep)).filter(allElementsEqual).map(elAt(0)).join(sep);

	describe(name, function() {

		before(function(done) {
			getDirectories(rootDir, (err, files)=>{ 
				//if (err) console.log(err);
				images = files.filter(function(file) {
					if (isImage(file)) return file;
				});
				done();
			});
		});

		it(testTitle, function(done) {
			var cPath = commonPath(images);
			var common = cPath.indexOf(combinedRootPath) > -1;
			expect(common, testMessage).to.be.true;
			done();
		});
		/*
		afterEach(function(done) {
			if (!common && testHints && testHints.length > 0) this.currentTest.context = {"title":"Hints","value":"Make sure ALL images within your website are contained within the same base directory."}
			done();
		});
		*/
	});
}

exports.main = main;