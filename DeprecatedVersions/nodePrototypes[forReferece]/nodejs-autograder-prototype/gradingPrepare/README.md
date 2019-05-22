# Grading Prepare

This module contains functions necessary for the preparation of grading for assignments. In particular, this module is used to:
1) Read JSON files
2) Parse through assignment details

More of the above are explained below.

## Dependencies:

This module requires the following dependencies not available in the default Node.JS library:
* **node-html-parser** [Link to Page](https://www.npmjs.com/package/node-html-parser)
* **css** [Link to Page](https://github.com/reworkcss/css)

---

## Maintenance & Usage

#### Usage

To use this module, you must include the following code within your Node.JS application like so:

> 	
> 	const gradePrepare = require('./path/to/gradePrepare.js');
> 	

From there, you can call and initialize the functions exported by this module. For example:

> 	
> 	const gradePrepare = require('./gradePrepare/gradePrepare.js');
> 	
> 	gradingPrepare.readJSON(config_url, (config)=>{
>     console.log(config);
> 	});
> 	

You can also directly access the 'gradePrepare.js' file from your Terminal via Node.JS, if needed, like so:

> 	
> 	$ path/to/validate.js
> 	

---

## Functions

This module comes with **THREE** main functions, **2** of which that can be used outside of the module as exports.

#### readJSON (file, callback): Reads a JSON file, returns its contents regardless of content type

_This function is exported as "readJSON"_

* **file:** The path to the JSON file you wish to read
* **callback:** The callback function

An example of how to use this function is like so:

> 	
> 	const gradePrepare = require('./gradePrepare/gradePrepare.js');
> 	
> 	gradePrepare.readJSON('logistics/config.json', (config)=>{
> 		console.log(config);
> 	});
> 	



#### parseThroughDataSync (data, url, callback): A function specifically for the purpose of reading through an assignment details file

_This function is exported as "parseAssignmentDetails"_

Parameters:
* **data:** The content derived from our 'assignment_detail.json' file
* **url:** The path to our sample submission directory
* **callback:** the callback function

Our 'assignment_details.json' file contains two particular values for each of the files it lists as necessary:

1. _'contains':_ EITHER an array of elements that must be present within that file in a student's submission, or a path to a file containing those elements
2. _'notContains':_ The same as 'contains', except it contains materials that we deem should NOT be present within a student submission

Because we left it such that both of the above can be either a pathway or an array, we have to standardize either into an array of elements if they are paths and not arrays already.
For example, if 'contains' for a file is a path to an 'index.html' inside our 'url' and not an array, we have to look at 'index.html' and parse through it to get the elements.

We return a copied, modified version of the original 'data' assignment details that has the updated 'contains' and 'notContains' for each file listed

An example of how to use this function is like so:

> 	
> 	const gradeParser = require('./gradePrepare/gradePrepare.js');
> 	
> 	/* We grab our assignment details first */
> 	gradeParser.readJSON('grading/labs/1/assignment_details.json', details => {
> 		console.log(details);
> 		
> 		/*
> 		// We modified 'details'
> 		// NOTE: this function is utilized in external apps as 'parseAssignmentDetails()':
> 		gradeParser.parseAssignmentDetails(config, 'grading/labs/1/sampleSubmission/', newDetails => {
> 			
> 			console.log(newDetails);
> 		
> 		})
> 	});
> 	


#### parseContains (d, file, fileType, callback): Looks at the given value (either 'contains' or 'notContains') and returns an array or NULL

_NOTE: this function is NOT exported and is not intended to be used as such - it is merely a function called by **'parseThroughDataSync'**_

Parameters:
* **d:** Our 'contains'/'notContains' value, can be either NULL, a pathway (aka string), or an Array
* **file:** Our path to the file we're looking at
* **fileType:** The fileType of our current file - necessary so that we parse through the provided 'file' properly if needed
* **callback:** the callback function, returns an Array or NULL

This function is a helper function that parses through a given 'contains' or 'notContains' and returns an Array.
This array contains items parsed under 'node-html-parser' or 'css', depending on the 'fileType' provided within the parameters.



