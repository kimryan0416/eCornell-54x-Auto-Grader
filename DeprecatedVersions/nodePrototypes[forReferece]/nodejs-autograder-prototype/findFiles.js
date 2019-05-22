const path = require('path');
const fs = require('fs');
const htmlParser = require('node-html-parser');
const cssParser = require('css');

/*
// findNecessaryFiles = a function that searches a student's submission to check if they contain the necessary files for the assignment
//		- files = an array of files present within the student's submission - MUST be provided
// 		- list = a JS object list that contains 2 values: 1) the toggle, and 2) an array containing all the necessary files for this assignment - MUST be provided
// 		- callback = the function that is called at the end of the function - MUST be provided
// If multiple files with the same file name are found, it prioritizes the one closest to the root directory
//
// * How this function works: *
// We have to consider the possibility that some students can have the necessary files present... but they may just misplace them where they aren't supposed to
// In such scenarios, we have to take into account that these students DID the right thing and the wrong thing at the same time
// As such, this function will proceed with 3 steps:
// 1) look at the basename of each of our necessary files defined within 'list'
// 2) check if any of the files within 'files' has that same basename
// 3.1) if there is a match, we compare extensions - if their extensions are the same, then we've located the correct match - if we don't, then the file is misplaced
// 3.2) if there is no match, then the student is missing that file completely
*/
function findNecessaryFiles(files, list, callback) {
	var present = [], missing = [], misplaced = [];

	if (list['toggle'] == false) {
		callback(1, "Toggle is off - no checking for necessary files performed", null, null, null);
		return;
	}

	/*
	// present = the array that stores all the necessary files that were appropriately found
	// missing = the array that stores all the necessary files that WEREN'T found
	// misplaced = the array that stores all the necessary files that were appropriately found but are simply located incorrectly within the student's directory
	*/

	/*
	// Under the test condition, we have the following variables:
	// ---
	// files = ['index.html', 'styles/homepage/style.css', 'styles/test.css', 'homepage/all.css', 'homepage/index.html'];
	// list = ['index.html', 'styles/all.css'];
	// ---
	//
	// Otherwise, files and list will be defined when they're initialized elsewhere
	*/

	
	var loopThroughList = function(index) {
		if (index < list['necessary_files_list'].length) {
			var necFile = list['necessary_files_list'][index];				// get the current necessary file we're looking at
			var basename = path.basename(necFile);		// get the basename (i.e. with a file 'styles/all.css', we get 'all.css' )
			var dirname = path.dirname(necFile)		// get the directory path (i.e. with a file 'styles/all.css', we get 'styles')
			var found = false, mispl = false;		// booleans to check if this necessary file was found or misplaced, respectively


			// We parse through the files submitted by the student
			// In each loop, we check 1) if there is a file with the same basename, 2) if there is, then is the dirname the same
			var loopThroughSubmissionFiles = function(inner_index) {
				if (inner_index < files.length) {
					var thisFile = files[inner_index];
					var thisBasename = path.basename(thisFile);
					var thisDirname = path.dirname(thisFile);

					if ( (found && mispl) || (!found) ) {
						if (thisBasename.toLowerCase() == basename.toLowerCase()) {
							found = true;	// If thisBasename == basename, then a match was found
							// We need to check if their dirnames are the same or not - if they are not, then we've found a misplaced file
							// There is a toggle within the rubric asking if we care for directory location or not - if 'care_about_directory' is on, then we care about directory location, otherwise we don't
							
							if (list['care_about_directory'] == true) {
								if (thisDirname.toLowerCase() != dirname.toLowerCase()) {
									mispl = true;
								} else {
									mispl = false;
								}
							} else {
								mispl = false;
							}
						}
					}
					loopThroughSubmissionFiles(inner_index+1);
				}
			}
			loopThroughSubmissionFiles(0);

			if (found) {
				if (mispl) misplaced.push(necFile);
				else present.push(necFile);
			}
			else missing.push(necFile);
			loopThroughList(index+1);
		}
	}
	loopThroughList(0);
	
	callback(null, null, present, missing, misplaced);
}


function find(files, pointer, callback) {
	if (pointer == null || files == null) return callback(null);

	var found = false, misplaced = false, closestToPointer = null, howDeep;
	var pointerBasename = path.basename(pointer);
	var pointerDirname = path.dirname(pointer);

	var loopThroughFiles = function(index) {
		if (index < files.length && ( !found || (found && misplaced) ) ) {
			var thisFile = files[index];
			var thisBasename = path.basename(thisFile);	
			var thisDirname = path.dirname(thisFile);
			var thisHowDeep = thisDirname.split(path.sep);
			
			if ( (found && misplaced) || (!found) ) {
				if ( thisBasename.toLowerCase() == pointerBasename.toLowerCase() ) {
					found = true;
					if ( thisDirname.toLowerCase() != pointerDirname.toLowerCase() ) { 
						misplaced = true;
						if ( (howDeep == null) || (howDeep > thisHowDeep.length ) ) {
							closestToPointer = thisFile;
							howDeep = thisHowDeep.length;
						}
					}
					else {
						misplaced = false;
						closestToPointer = thisFile;
						howDeep = thisHowDeep.length;
					}
				}
			}
			loopThroughFiles(index+1);
		} else {
			callback(closestToPointer);
		}
	}
	loopThroughFiles(0);
}

function findNecessary(files, necFiles, directory, callback) {
	var present = [], missing = [], misplaced = [];

	if (necFiles == null || necFiles.length == 0) {
		callback(null, present, misplaced, missing);
	}

	var loopThroughNecFiles = function(index) {
		if (index < necFiles.length) {
			var necFile = necFiles[index];
			var necFileName = necFile['fileName'];
			var necFileDirectory = ( path.dirname(necFileName) != '.' ) ? path.dirname(necFileName) : '';
			var basename = path.basename(necFileName);
			var dirname;
			if (necFile['careAboutDirectory']) {
				dirname = ( necFile['directory'] != null ) ? directory + necFile['directory'] + necFileDirectory : directory + necFileDirectory;
			} else {
				dirname = directory + necFileDirectory;
			}
			var thisFileFinalURL;
			var found = false, mispl = false;

			var loopThroughFiles = function(inner_index) {
				if (inner_index < files.length) {
					var thisFile = files[inner_index];
					var thisBasename = path.basename(thisFile);
					var thisDirname = path.dirname(thisFile);

					if ( (found && mispl) || (!found) ) {
						if (thisBasename.toLowerCase() == basename.toLowerCase()) {
							found = true;	// If thisBasename == basename, then a match was found
							// We need to check if their dirnames are the same or not - if they are not, then we've found a misplaced file
							// There is a toggle within the rubric asking if we care for directory location or not - if 'care_about_directory' is on, then we care about directory location, otherwise we don't
							
							if (necFile['careAboutDirectory']) {
								if (thisDirname.toLowerCase() != dirname.toLowerCase()) {
									mispl = true;
									thisFileFinalURL = thisDirname + '/' + basename;
								} else {
									mispl = false;
									thisFileFinalURL = dirname + '/' + basename;
								}
							} else {
								mispl = false;
								thisFileFinalURL = thisDirname + '/' + basename;

							}
						}
					}
					loopThroughFiles(inner_index+1);
				}
			}
			loopThroughFiles(0);

			if (found) {
				if (mispl) misplaced.push({ "currentFile":thisFileFinalURL, "necFile":necFile});
				else present.push({ "currentFile":thisFileFinalURL, "necFile":necFile});
			}
			else missing.push({ "currentFile":thisFileFinalURL, "necFile":necFile});
			loopThroughNecFiles(index+1);
		} else {
			return;
		}
	}
	loopThroughNecFiles(0);
	parseThroughNecessary(null, present, misplaced, missing, callback);
}

function parseThroughNecessary(err, present, misplaced, missing, callback) {
	var curFile, curNecFile;
	var newContent = [];

	var loopThroughPresentAndMisplaced = function(index, list, callback2) {
		if (index == 0) newContent = [];
		if (index < list.length) {
			curFile = list[index]['currentFile'];
			curNecFile = list[index]['necFile'];
			parseThroughFile(curFile, curNecFile, (newItem)=>{
				newContent.push(newItem);
				loopThroughPresentAndMisplaced(index+1, list, callback2);
			});
		} else {
			callback2(newContent);
			return;
		}
	}
	loopThroughPresentAndMisplaced(0, present, (pres)=>{
		loopThroughPresentAndMisplaced(0, misplaced, (misp)=>{
			callback(null, pres, misp, missing);
		});
	});
}

function parseThroughFile(file, compareFile, callback) {
	var compareFileType = compareFile['fileType'];
	var compareFileContains = ( compareFile['contains'] != null ) ? compareFile['contains'] : [];
	var compareFileNotContains = ( compareFile['notContains'] != null ) ? compareFile['notContains'] : [];
	var containsMatchesSuccesses = [], containsMatchesFailures = [], notContainsMatchesSuccesses = [], notContainsMatchesFailures = [];
	var thisCompareFileContains, thisCompareFileNotContains, toCompareContains, toCompareNotContains;

	fs.readFile(file, 'utf8', (err, content)=>{
		var fileContentsHTML, fileContentsCSS;
		if (compareFileType == 'html') {
			fileContentsHTML = htmlParser.parse(content);
			
			//var thisCompareFileContains, thisCompareFileNotContains, toCompareContains, toCompareNotContains;
			var loopThroughCompareFileContains = function(index, containsCallback) {
				if (index < compareFileContains.length) {
					thisCompareFileContains = compareFileContains[index];
					if (Array.isArray(thisCompareFileContains)) toCompareContains = thisCompareFileContains[0];
					else toCompareContains = thisCompareFileContains;
					parseInnerFileContentsHTML(fileContentsHTML, toCompareContains, (match)=>{
						if (match) containsMatchesSuccesses.push(toCompareContains.toString());
						else containsMatchesFailures.push(toCompareContains.toString());
						loopThroughCompareFileContains(index+1, containsCallback);
					});
				} else {
					containsCallback(containsMatchesSuccesses, containsMatchesFailures);
					return;
				}
			}
			var loopThroughCompareFileNotContains = function(index, notContainsCallback) {
				if (index < compareFileNotContains.length) {
					thisCompareFileNotContains = compareFileNotContains[index];
					if (Array.isArray(thisCompareFileNotContains)) toCompareNotContains = thisCompareFileNotContains[0];
					else toCompareNotContains = thisCompareFileNotContains;
					parseInnerFileContentsHTML(fileContentsHTML, toCompareNotContains, (match)=>{
						if (!match) notContainsMatchesSuccesses.push(toCompareNotContains.toString());
						else notContainsMatchesFailures.push(toCompareNotContains.toString());
						loopThroughCompareFileNotContains(index+1, notContainsCallback);
					});
				} else {
					notContainsCallback(notContainsMatchesSuccesses, notContainsMatchesFailures);
					return;
				}
			}
			loopThroughCompareFileContains(0, (contSucc, contFail)=>{
				loopThroughCompareFileNotContains(0, (notContSucc, notContFail)=>{
					callback({
						'file':file,
						"contains":compareFileContains.length,
						'notContains':compareFileNotContains.length,
						"containsSuccesses":contSucc,
						"containsFailures":contFail,
						"notContainsSuccesses":notContSucc,
						"notContainsFailures":notContFail
					});
				});
			});
		} else if (compareFileType == 'css') {
			fileContentsCSS = cssParser.parse(content);
			var fileContentCSSRules = fileContentsCSS['stylesheet']['rules'];
			reorganizeCSSFile(fileContentCSSRules, null, (newRules)=>{
				var loopThroughCompareFileContains = function(index, containsCallback) {
					if (index < compareFileContains.length) {
						thisCompareFileContains = compareFileContains[index];
						//if (Array.isArray(thisCompareFileContains)) toCompareContains = thisCompareFileContains[0];
						//else toCompareContains = thisCompareFileContains;
						toCompareContains = thisCompareFileContains;
						parseInnerFileContentsCSS(newRules, toCompareContains['stylesheet']['rules'], (match)=>{
							if (match) containsMatchesSuccesses.push(cssParser.stringify(toCompareContains));
							else containsMatchesFailures.push(cssParser.stringify(toCompareContains));
							loopThroughCompareFileContains(index+1, containsCallback);
						});
					} else {
						containsCallback(containsMatchesSuccesses, containsMatchesFailures);
						return;
					}
				}
				var loopThroughCompareFileNotContains = function(index, notContainsCallback) {
					if (index < compareFileNotContains.length) {
						thisCompareFileNotContains = compareFileNotContains[index];
						//if (Array.isArray(thisCompareFileNotContains)) toCompareNotContains = thisCompareFileNotContains[0];
						//else toCompareNotContains = thisCompareFileNotContains;
						toCompareNotContains = thisCompareFileNotContains;
						parseInnerFileContentsCSS(newRules, toCompareNotContains['stylesheet']['rules'], (match)=>{
							if (!match) notContainsMatchesSuccesses.push(cssParser.stringify(toCompareNotContains));
							else notContainsMatchesFailures.push(cssParser.stringify(toCompareNotContains));
							loopThroughCompareFileNotContains(index+1, notContainsCallback);
						});
					} else {
						notContainsCallback(notContainsMatchesSuccesses, notContainsMatchesFailures);
						return;
					}
				}
				loopThroughCompareFileContains(0, (contSucc, contFail)=>{
					loopThroughCompareFileNotContains(0, (notContSucc, notContFail)=>{
						callback({
							'file':file,
							"contains":compareFileContains.length,
							'notContains':compareFileNotContains.length,
							"containsSuccesses":contSucc,
							"containsFailures":contFail,
							"notContainsSuccesses":notContSucc,
							"notContainsFailures":notContFail
						});
					});
				});
			});
		} else {
			callback(null);
		}
	});
}

function parseInnerFileContentsHTML(contents, toMatchContent, callback) {
	if (toMatchContent['nodeType'] == 1) {
		/* a nodeType of 1 is a tag, like <title> or <div> - in this case we use querySelectorAll*/
		var toMatchID = ( toMatchContent['id'] != null && toMatchContent['id'] != '' ) ? '#'+toMatchContent['id'] : '';
		var toMatchClass = ( toMatchContent['classNames'] != null && toMatchContent['classNames'].length > 0 ) ? '.' + toMatchContent['classNames'].join('.') : '';
		var toMatchType = toMatchContent['tagName'];
		var toMatchChildren = ( toMatchContent['childNodes'] != null && toMatchContent['childNodes'].length > 0 ) ? toMatchContent['childNodes'].filter(d=>{
			if (d['nodeType'] == 1) return d;
			else if (d['nodeType'] == 3) {
				var newRawText = d['rawText'].replace(/\s/g, '');
				if (newRawText.length > 0) return d;
			}
		}) : [];

		/* 
		// We need this because we need to filter out all the parts where children nodes are just newlines or just tabs
		// Otherwise, we would be iterating through loops where 'toMatchContent' are just newlines or tabs...
		*/

		var toMatchQuery = toMatchType + toMatchID + toMatchClass;
		
		/* Attepting to find match for 'toMatchQuery' - bottom will return an empty array if cannot be found, otherwise we go deeper into comparison if necessary */
		var matchedContent = contents.querySelectorAll(toMatchQuery);
		/* if matchedContent's length == 0 (aka we didn't find any matches), we return a false because no elements matched */
		if (matchedContent.length == 0) callback(false);

		/* if matchedContent's length == 1 (aka we found 1 match), we have to check if that content contains any childNodes or not */
		else if (matchedContent.length == 1) {	
			
			/* if our content we're looking for DOESN'T has any children content, we return true because we found a match */
			if ( toMatchChildren == null || toMatchChildren.length == 0) callback(true);

			else {
				/* our toMatchContent has children... we need to go deeper */
				var allChildrenFoundCount = 0;
				var loopThroughChildrenOfToMatchContent = function(index) {
					if (index < toMatchChildren.length) {
						var thisChild = toMatchChildren[index];
						parseInnerFileContentsHTML(matchedContent[0], thisChild, (childFound)=>{
							if (childFound == true) allChildrenFoundCount += 1;
							loopThroughChildrenOfToMatchContent(index+1);
						});
					} else {
						if (allChildrenFoundCount == toMatchChildren.length) callback(true);
						else callback(false);
					}
				}
				loopThroughChildrenOfToMatchContent(0);
			}
		} else {
			/*
			// If matchedContent's length > 1 (aka we found more than 1 match), we have to commence a loop, checking the multitude of matches we found 
			// The only way we can do that is to compare the children of each loop...
			// 'thisMatchedContent' = every time we loop through our matched content, this variable stores the current element we're comparing WITH
			// 'foundMatch' = a boolean, tracks if we found an element that matches our 'toMatchContent' down to all the children below it
			// 		if this ends up being 'false', then we never found a match, meaning none of our matched content matches toMatchContent in the end - we callback FALSE
			// 		if this ends up being 'true', then we found a match at some point among our matched content - we callback TRUE
			*/

			var thisMatchedContent, foundMatch;
			var allChildrenFoundCount, thisChild;
			var loopThroughMatchedContent = function(index) {
				if (index < matchedContent.length && foundMatch != true) {
					thisMatchedContent = matchedContent[index];
					allChildrenFoundCount = 0;
					var loopThroughChildrenOfToMatchContent = function(index2) {
						if (index2 < toMatchChildren.length) {
							thisChild = toMatchChildren[index2];
							parseInnerFileContentsHTML(thisMatchedContent, thisChild, (childFound)=>{
								if (childFound == true) allChildrenFoundCount += 1;
								loopThroughChildrenOfToMatchContent(index2+1);
							});
						} else {
							if (allChildrenFoundCount == toMatchChildren.length) foundMatch = true;
							loopThroughMatchedContent(index+1);
						}
					}
					loopThroughChildrenOfToMatchContent(0);
				} else {
					callback(foundMatch);
				}
			}
			loopThroughMatchedContent(0);
		}
	} else if (toMatchContent['nodeType'] == 3) {

		/*
		// This is a text type - Normally these don't have children, and their only significant identifiers are 'nodeType' and 'rawText'
		// Therefore, we just need to loop through content's foremost level and check if there's a nodetype of type 3 and with the same 'rawText' as toMatchContent's
		// If 'toMatchContent''s 'rawText' is BLANK, then we assume any match is fine and we just return callback(true) regardless
		// Otherwise, we really do have to check if there is a textnode that contains the same 'rawText' as our toMatchContent's 'rawText';
		*/

		var toMatchRawText = toMatchContent['rawText'].replace(/\s/g, '');

		if (toMatchRawText == '') callback(true);
		else {
			var contentRawText = contents['rawText'].replace(/\s/g, '');
			callback( contentRawText.toLowerCase() == toMatchRawText.toLowerCase() );
		}
	} else {
		callback(null);
	}
}

function reorganizeCSSFile(rules, allObjects = null, callback) {
	/* We're going to create a new array of rules, where every declaration, keyframe, etc. inside a CSS file is an object within this array */
	var newRules = (allObjects != null) ? allObjects : [];

	var thisRule, thisRuleAttributes, thisChild;;
	var loopThroughRules = function(index, rulesCallback) {
		if (index < rules.length) {
			/* We grab our current rule , and auto-insert it into */
			thisRule = rules[index];
			thisRuleAttributes = Object.keys(thisRule);
			newRules.push(thisRule);

			/* We check if this particular rule has children */
			var foundArray = false, children = null;
			var lookForChildren = function(innerIndex, childrenCallback) {
				if (innerIndex < thisRuleAttributes.length && !foundArray) {
					thisChild = thisRule[thisRuleAttributes[innerIndex]];
					if ( (Array.isArray(thisChild)) && (typeof thisChild[0] === 'object') ) {
						foundArray = true;
						children = thisChild;
					}
					lookForChildren(innerIndex+1, childrenCallback);
				} else {
					childrenCallback(foundArray, children);
				}
			}
			lookForChildren(0, (ifFound, ifChildren)=>{
				if (ifFound) {
					reorganizeCSSFile(ifChildren, newRules, (childrenResults)=>{
						newRules = childrenResults;
						loopThroughRules(index+1, rulesCallback);
					})
				} else {
					loopThroughRules(index+1, rulesCallback);
				}
			});
		} else {
			rulesCallback(newRules);
		}
	}
	loopThroughRules(0, (res)=>{
		callback(res);
	})
}

function parseInnerFileContentsCSS(content, toMatchContent, callback) {
	/*
	// because the structure of CSS is pretty straightforward, unlike HTML, all we're really going to be doing is checking...
	// ... if there's a rule that contains the same or more declarations as that mentioned in our 'toMatchContent'
	// content = the CSS contents of the student's submission file - it has been reorganized such that...
	// ... all the rules, declarations, etc. are all in one array. That means we simply need to loop through content and find a match on the first layer
	// Then, if there's any children within toMatchContent, we have to go deeper by 1 layer with both the matching content and the toMatchContent
	// Note that 'toMatchContent' must contain ONLY rules, declarations, etc. and NOT 'stylesheet' or 'rules'
	// We're comparing 'type', 'selectors', 'property', and 'value' upon iterating through 'content' - if there's children within 'toMatchContent', we'll perform a recursive loop.
	// If a given value inside 'toMatchContent' is just blank (i.e. inside our sample CSS file, we have a declaration like 'font-family:;'), we automatically return 'true' because we're assuming anything goes
	// ...  we still check if the other comparisons hold true though
	*/

	/* STEP 1) get our content based on if it's inside an array or if it's its own object list */
	var toMatch = ( Array.isArray(toMatchContent) ) ? toMatchContent[0] : toMatchContent;

	/* STEP 2) Get the necessary data from 'toMatch'*/
	var toMatchType = toMatch['type'];
	var toMatchSelectors = toMatch['selectors'];
	var toMatchProperty = toMatch['property'];
	var toMatchValue = toMatch['value'];
	var toMatchKeys = Object.keys(toMatch);

	/* STEP 3) Set up and initialize necessary variables for this function */
	/*
	// 	- 'toMatchChildren' = our array of children in 'toMatch', if 'toMatch' HAS children (i.e. declarations)
	//	- 'toMatchChildrenFound' = our boolean/integer - if 'toMatch' has children, it'll contain the key that contains the children inside 'toMatch', or else it'll contain FALSE
	// 	- 'curContent', 'curContentType', 'curContentSelectors'... = when we're looping through our 'content', we use these to store essential values about each item in 'content'
	// 	- 'compareType', 'compareSelectors', ... = boolean values, determines if the respective attributes about 'toMatch' and the current item we're looking at inside 'content' are the same
	*/
	var toMatchChildren;
	var toMatchChildrenFound = false;
	var curContent, curContentType, curContentSelectors, curContentProperty, curContentValue, curContentChildren;
	var compareType, compareSelectors, compareProperty, compareValue, compareChildren;

	/* (Step 4 is below near the end of the function... just FYI) */

	/* A looping function to determine if an object has children or not - used multiple times within one iteration of this whole function, so it's set to be used in various situations */
	var searchForChildren = function(index, object, childrenCallback) {
		/* If this is the first iteration of the loop, we just make sure we set ourselves up properly by re-initializing values to their defaults */
		if (index == 0) toMatchChildrenFound = false;
		if (index < Object.keys(object).length && toMatchChildrenFound == false) {
			/* 'curChild' = the current value of our object (i.e. '['body']', or 'declaration' (aka the actual value)) */
			var curChild = object[Object.keys(object)[index]];
			/* We check if 'curChild' is an array that contains objects - this is an indication that 'curChild' is a list of children, aka our 'object' has children */
			if ( (Array.isArray(curChild)) && (typeof curChild[0] === 'object') ) {
				toMatchChildrenFound = Object.keys(object)[index];
			}
			/* Loop to the next child value inside 'object' */
			searchForChildren(index+1, object, childrenCallback);
		} else {
			childrenCallback(toMatchChildrenFound);
		}
	}

	/* Our main looping function to look inside 'content' */
	var loopThroughContent = function(index, contentCallback) {
		if (index < content.length) {

			/* Setting up the important data of the content item we're looking at right now */
			curContent = content[index];
			curContentType = curContent['type'];
			curContentSelectors = curContent['selectors'];
			curContentProperty = curContent['property'];
			curContentValue = curContent['value'];

			/* We use 'searchForChildren' again to determine if this content item has children or not */
			searchForChildren(0, curContent, (contentChildrenFound)=>{
				if (!contentChildrenFound) curContentChildren = null;
				else {
					/* We have to do this because every CSS element retrived by cssParser also contains a 'position' attribute that we want to ignore, so we map() to remove that from our children */
					curContentChildren = curContent[contentChildrenFound].map((d)=>{
						return {
							'type':d['type'],
							'selectors':d['selectors'],
							'property':d['property'],
							'value':d['value']
						}
					});
				}

				/* We get our comparisons */
				compareType = toMatchType === curContentType;
				compareProperty = toMatchProperty === curContentProperty;
				compareValue = toMatchValue === curContentValue;
				/* We have to do this crazy stuff for 'compareSelectors' because comparing arrays in JS isn't the same as comparing things like strings */
				compareSelectors = ( toMatchSelectors != null && curContentSelectors != null) ? (toMatchSelectors.length == curContentSelectors.length && toMatchSelectors.every(d=>{ return curContentSelectors.includes(d); }) ) : toMatchSelectors === curContentSelectors;

				/* The below if() will be true if we're finding a potential match - note that we don't compare their 'type' JUST yet (we will eventually though) */
				if ( compareType && compareSelectors && compareProperty ) {
					/* We've found a potential match! */
		
					/* If our toMatchChildren has children, we run through a recursion to check that we have matching children */
					if (toMatchChildren != null) {
						/* We just make sure that if the current content item has children or not - if not, then we return false by default (because inside this conditional sitaution, 'toMatch' has children) */
						if (curContentChildren == null || !Array.isArray(curContentChildren)) return contentCallback(false);
						
						/*
						// 'toMatchChildrenCount' = our counter for how many children of 'toMatch' are found inside our current content item
						// If all of 'toMatch''s children are found inside our current content item, then 'toMatchChildrenCount' must equal 'toMatch''s # of children
						// if not... then we don't have a match
						*/
						var toMatchChildrenCount = 0;

						/* We loop through our 'toMatch''s children, looking if each child can also be found among our current content item's children */
						var loopThroughChildren = function(childIndex, childCallback) {
							if (childIndex < toMatchChildren.length) {
								var curChild = toMatchChildren[childIndex];
								/* recursion! */
								parseInnerFileContentsCSS(curContentChildren, curChild, (childMatchFound)=>{
									/* if returned true, then one of 'toMatch''s children can be found, so we +1 the counter and loop again */
									if (childMatchFound) toMatchChildrenCount += 1;
									loopThroughChildren(childIndex+1, childCallback);
								});
							} else {
								/* At the end of it all, if all of 'toMatch''s children could be found, we return TRUE!... else we return FALSE */
								if (toMatchChildrenCount == toMatchChildren.length) return childCallback(true);
								else return childCallback(false);
							}
						}
						loopThroughChildren(0, (foundMatchingChildren)=>{
							/* If the loop above returned TRUE, then that means our children match... if not, we just loop to the next content item and consider this a failure */
							if (foundMatchingChildren) {
								/* 
								// Recall that we didn't compare Values yet? Here we compare as well
								// if 'toMatchValue' is an empty string, we defaultly return TRUE because that means anything can fit within that
								// else if our Values do match, then we return true.
								// Otherwise, we return false.
								*/
								if (toMatchValue == '') return contentCallback(true);
								else if (compareValue) return contentCallback(true);
								else return contentCallback(false);
							}
							else loopThroughContent(index+1, contentCallback);
						});
					} else {
						/* In the case that  */
						if (toMatchValue == '') return contentCallback(true);
						else if (compareValue) return contentCallback(true);
						else return contentCallback(false);

					}
				} else {
					loopThroughContent(index+1, contentCallback);
				}
			});
		} else {
			contentCallback(false);
		}
	}
	
	/* STEP 4: Find if 'toMatch' has children by initiating a loop through 'toMatch' to look for an array of objects! */
	searchForChildren(0, toMatch, (found)=>{
		/* If we found children within 'toMatch', we set 'toMatchChildren' to our children, mapped with map() to remove 'position' from each child */
		if (!found) toMatchChildren = null;
		else toMatchChildren = toMatch[found].map((d)=>{
			return {
				'type':d['type'],
				'selectors':d['selectors'],
				'property':d['property'],
				'value':d['value']
			}
		});

		/* Reinitialize all the below to their defaults */
		curContent = null;
		curContentType = null;
		curContentSelectors = null;
		curContentProperty = null;
		curContentValue = null;
		curContentChildren = null;

		compareType = null;
		compareSelectors = null;
		compareProperty = null;
		compareValue = null;
		compareChildren = null;

		/* STEP 5: Initialize the loop through each content item - returns TRUE if we found a match, otherwise we return FALSE */
		loopThroughContent(0, (foundMatch)=>{
			callback(foundMatch);
		});
	});
}

/*
// Testing findNecessaryFiles()...
// this test contains the situation where ALL necessary files ARE present, but there are duplicates everywhere (i.e. homepage/all.css, and styles/all.css)
// this test determines whether if findNecessaryFiles() can correctly determine that all the necessary files are present despite this.
findNecessaryFiles(['index.html', 'styles/homepage/style.css', 'styles/test.css', 'homepage/all.css', 'homepage/index.html', 'styles/all.css'], {'toggle':true,'necessary_files_list':['index.html', 'styles/all.css']}, (err, mes, pres, miss, mispl)=>{
	console.log(" *** findNecessaryFiles() Function Test! *** ")
	if (err) {
		console.log(mes);
	} else {
		console.log("- The following necessary files were found and not misplaced:");
		console.log(pres);
		console.log("- The following necessary files were found but they were misplaced");
		console.log(mispl),
		console.log("- The following necessary files were not found");
		console.log(miss);
	}
	console.log(" --- findNecessaryFiles() Function Test End --- ");
});
// End Testing findNecessaryFiles()...
*/


module.exports.findNecessaryFiles = findNecessaryFiles;
module.exports.findWebRoot = find;
module.exports.findNecessary = findNecessary;



