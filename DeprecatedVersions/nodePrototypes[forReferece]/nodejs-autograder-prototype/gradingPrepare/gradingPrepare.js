/* Required Dependencies: */
const fs = require('fs');
const htmlParser = require('node-html-parser');
const cssParser = require('css');

/* 
// readJSON: a function that simply reads a JSON file and exports its contents, regardless of content type 
// Paramters:
//		- 'file': the path to the JSON file, must include the json file itself within the path
//		- 'callback': the callback function
*/
function readJSON(file, callback) {
	var obj = JSON.parse(fs.readFileSync(file, 'utf8'));
	callback(obj);
}

/*
// parseThroughDataSync: a function specifically for the purpose of reading through an assignment details file
// Paramters:
//		- data: the content derived from our 'assignment_detail.json' file
//		- url: the path to our sample submission directory
//		- callback: the callback function
// Basically, our 'assignment_details.json' file contains two particular values for each of the files it lists as necessary:
//		1) 'contains': EITHER an array of elements that must be present within that file in a student's submission, or a path to a file containing those elements
//		2) 'notContains': the same as 'contains', except it contains materials that we deem should NOT be present within a student submission
// Because we left it such that both of the above can be either a pathway or an array, we have to standardize either into an array of elements if they are paths and not arrays already
// For example, if 'contains' for a file is a path to an 'index.html' inside our 'url' and not an array, we have to look at 'index.html' and parse through it to get the elements
// We return a copied, modified version of the original 'data' assignment details that has the updated 'contains' and 'notContains' for each file listed
*/
function parseThroughDataSync (data, url, callback) {
	/* We make a copy of our file data from 'data' to prevent mutation, and create a new 'newFileArray' array we can store the new changes in */
	var copyFileData = JSON.parse(JSON.stringify(data['files']));
	var newFileArray = [];

	/* Initializing some essential variables */
	var thisFile, thisFileURL;

	/* Looping through our file data provided by 'data', checking that both 'contains' and 'notContains' in each are arrays */
	var loopThroughData = function(index) {
		if (index < copyFileData.length) {
			/* Make a copy of our current file to prevent mutation */
			thisFile = JSON.parse(JSON.stringify(copyFileData[index]));
			thisFileURL = (thisFile['directory'] != null || thisFile['directory'] != '') ? url + thisFile['directory'] + thisFile['fileName'] : url + thisFile['fileName'];

			/* The functions 'parseContains' returns an array of elements for both 'contains' and 'notContains' */
			parseContains(thisFile['contains'], thisFileURL, thisFile['fileType'], newContains=>{
				parseContains(thisFile['notContains'], thisFileURL, thisFile['fileType'], newNotContains=>{
					/* assign our new 'contains' and 'notContains' to our copied version of the current file */
					thisFile['contains'] = newContains;
					thisFile['notContains'] = newNotContains;

					/* push the new version of 'thisFile' (that contains the new 'contains' and 'notContains') into our 'newFileArray' */
					newFileArray.push(thisFile);

					/* loop to the next file */
					loopThroughData(index+1);
				});
			});
		} else {
			/* When all files inside 'data' are looped, we return a new JS object list, which is essentially the same except with 'newFileArray' replacing the old 'files' array provided by 'data' */
			callback({
				'details':data['details'],
				'files':newFileArray
			});
			return;
		}
	}
	loopThroughData(0);

}

/*
// parseContains() = a function that looks at the given value (either 'contains' or 'notContains', doesn't matter) and returns an array or NULL if it wasn't initialized inside 'data'
// Paramters:
//		- d: our 'contains'/'notContains' value, can be either NULL, a pathway (aka string), or an Array
//		- file: our path to the file we're looking at
//		- fileType: the fileType of our current file - necessary so that we parse through the provided 'file' properly if needed
//		- callback: the callback function, returns an Array or NULL
*/
function parseContains (d, file, fileType, callback) {
	/* If the provided 'contains' or 'notContains' is NULL (aka it wasn't stated inside our file data from 'data'), we return a NULL in return */
	if (typeof d === 'undefined') callback(null);
	/* If our provided 'contains' or 'notContains' is a string, aka a pathway, we have to grab our data from that file and parse its contents into an array */
	else if (typeof d === 'string') {
		/* Read the file */
		fs.readFile(file, 'utf8', (err, contents)=>{
			/* All items we want to treat as separate elements must be separated by TWO newlines, otherwise we'll think they're parts of the same element */
			var contentsArray = contents.split("\n\n");
			/* We initialize some global variables */
			var curContent, newCurContent;
			/* We loop through each of the items of 'contentsArray', parsing as per determined by 'fileType', and saving the new contents */
			var loopThroughContents = function(index) {
				if (index < contentsArray.length) {
					curContent = contentsArray[index];
					if (fileType == 'html') {
						newCurContent = htmlParser.parse(curContent);
						newCurContent = newCurContent['childNodes'];
					} else if (fileType == 'css') {
						newCurContent = cssParser.parse(curContent);
						newCurContent = newCurContent;
					} else {
						newCurContent = curContent;
					}
					contentsArray[index] = newCurContent;
					loopThroughContents(index+1);
				} else {
					/* We return the new, modified 'contentsArray' */
					callback(contentsArray);
				}
			}
			loopThroughContents(0);
		});
	/* If our provided 'contains' or 'notContains' is already an array, we parse it using the appropriate fileType */
	} else if (typeof d === 'object') {
		var contentsArray = d;
		var loopThroughContents = function(index) {
			if (index < contentsArray.length) {
				curContent = contentsArray[index];
				if (fileType == 'html') {
					newCurContent = htmlParser.parse(curContent);
				} else if (fileType == 'css') {
					newCurContent = cssParser.parse(curContent);
				} else {
					newCurContent = curContent;
				}
				contentsArray[index] = newCurContent;
				loopThroughContents(index+1);
			} else {
				/* When all is said and done, we return the modified 'contentsArray' */
				callback(contentsArray);
			}
		}
		loopThroughContents(0);
	} else {
		callback(null);
	}
}

module.exports.readJSON = readJSON;
module.exports.parseAssignmentDetails = parseThroughDataSync;

