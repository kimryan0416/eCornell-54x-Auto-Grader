const common = require("../common.js");
const isImage = require('is-image');

const fs = common.fs;
const path = common.path;
const getDirectories = common.getDirectories;

const expect = common.expect;

function getAbsoluteFilePath(relativePath) {
  return fs.workingDirectory + '/' + relativePath;
};

function findCommon(paths, rootDir, imagesDir, callback) {
	var same = true, commonBase = [], tempCommonPath, i, commonBaseString;

	var separated = paths.map(function(d) {
		return path.dirname(d).split(path.sep);
	});
	
	separated.forEach(function(thisPath, index) {
		if (index == 0) commonBase = thisPath;
		else {
			tempCommonPath = [];
			var greaterLength = ( commonBase.length > thisPath.length ) ? commonBase.length : thisPath.length;
			for (i = 0; i < greaterLength; i++) {
				if (commonBase[i] == thisPath[i]) tempCommonPath.push(commonBase[i]);
				else break;
			}
			commonBase = tempCommonPath;
		}
	});

	commonBaseString = commonBase.join(path.sep);
	if (rootDir.includes(commonBaseString)) same = false;
	else {
		var tempCommonBaseString = commonBaseString.replace(rootDir, '');
		var tempCommonBase = tempCommonBaseString.split(path.sep);
		if ( imagesDir != null && tempCommonBase[0] != imagesDir ) same = false;
	}
	
	callback(same, commonBaseString);
}

function main(title, variables, statement, errorMessage, hints) {
	var rootDir = ( variables['ROOT_DIR'].substr(variables['ROOT_DIR'].length - 1) != path.sep ) ? variables['ROOT_DIR'] + path.sep : variables['ROOT_DIR'];
	var imagesDir = ( variables['IMAGES_DIR'] != null ) ? ( variables['IMAGES_DIR'].substr(variables['IMAGES_DIR'].length - 1) != path.sep ) ? variables['IMAGES_DIR'] : variables['IMAGES_DIR'].substring(0, variables['IMAGES_DIR'].length - 1) : null;

	var itStatement = (statement.length > 0) ? statement : 'Expect all images are in an image directory';
	var errorStatement = (errorMessage.length > 0) ? errorMessage : (variables['IMAGES_DIR'] != null) ? "All images aren't in the \""+variables['IMAGES_DIR']+"\" directory" : "All images aren't in the same directory!";
	var hintsStatement = (hints != null) ? (hints && hints.length > 0) ? hints : null : "Make sure ALL images within your website are contained within the same base directory.";

	var images = [], indexDirectory = '', common = true;

	describe(title, function() {

		before(function(done) {
			getDirectories(rootDir, (err, files)=>{ 
				images = files.filter(function(file) {
					if (isImage(file)) return file;
				});

				findCommon(images, rootDir, imagesDir, (same, base)=>{
					common = same;
					done();
				});

			});
		});

		it(itStatement, function(done) {
			expect(common, errorStatement).to.be.true;
			done();
		});

		afterEach(function(done) {
			if (!common && hintsStatement && hintsStatement.length > 0) this.currentTest.context = {"title":"Hints","value":"Make sure ALL images within your website are contained within the same base directory."}
			done();
		});
	});
}

exports.main = main;