# Validate HTML and CSS

This module allows for an application to parse through all HTML and CSS files within a directory and check for validation errors and indentation (aka Best Practices).

## Dependencies:

This module requires the following dependencies:
* **node-html-parser** [Link to Page](https://www.npmjs.com/package/node-html-parser)
* **css** [Link to Page](https://github.com/reworkcss/css)

This module also requires the following additional files:
* **vnu.jar:** a Java-based program that validates HTML and CSS files
	* This is necessary for checking for errors and warnings in HTML and CSS
	* Full documentation of the vnu.jar file: [Link to Page](https://validator.github.io/validator/)
	* The **vnu.jar** file can be operated via Bash Terminal - refer to the documentation linked above to determine how

---

## Maintenance & Usage

#### 'vnu.jar' Relative Pathway

Within this module contains the following variable:

> var vnuPath = "vnu.jar";

This variable is the relative pathway to the 'vnu.jar' file. By default, this file is in the same root directory as 'validate.js'.
In the case where the 'vnu.jar' file needs to be moved, you must alter this relative path to reflect the reshuffling of files

#### Usage

To use this module, you must include the following code within your Node.JS application:

> 	
> 	const validate = require("./path/to/validate.js");
> 	

From there, you can call and initialize the functions exported by this module. For example:

> 	
> 	const validate = require("./validate/validate.js");
> 	
> 	validate.validateHTMLFiles("path/to/directory/with/HTML/files/", conditions, (res) => {
>     console.log(res);
> 	}
> 	

You can also directly access the 'validate.js' file from your Terminal via Node.JS:

> 	
> 	$ path/to/validate.js
> 	

---

## Functions

This module comes with six main functions that can be used outside of the module as exports:

#### validateHTMLFiles(url, conditions, callback): Searches all HTML files within a given directory for validation errors

* **url:** The path to the directory that contains HTML files
* **conditions:** A JS object list that contains the conditions necessary for testing (i.e. whether toggle is activated, or even if HTML validation toggle is activated)
* **callback:** The callback function

This function also makes use of the 'vnuPath' variable, so please make sure that variable is set properly prior to use

Here is an example of what the **conditions** parameter would look like:

> 	
> 	{
> 		'toggle':true,
> 		'html':true	
> 	}
> 	
> 	// The toggle to activate ALL validation checking (aka both HTML and CSS validation); 'false' => no validation at all
> 	// The toggle to activate particularly HTML checking; 'false' => no HTML validation will occur
> 	

An example of the returned value by this function is like so:

> 	
> 	{
> 		'totals':{
> 			'error':1,
> 			'info':0,
> 			'files':['index,html']
> 		},
> 		'index.html':{
> 			'error':[
> 				{
> 					"type":"error",
> 					"url":"file:index.html",
> 					"lastLine":8,
> 					"lastColumn":12,
> 					"firstColumn":3,
> 					"message":"A slash was not immediately followed by “>”.",
> 					"extract":"\t<body>\n\t\t<pHello</p>\n\t</b",
> 					"hiliteStart":10,
> 					"hiliteLength":10
> 			],
> 			'info':[]
> 		}
> 	}
> 	


#### validateCSSFiles(url, conditions, callback): Searches all CSS files within a given directory for validation errors

* **url:** The path to the directory that contains CSS files
* **conditions:** A JS object list that contains the conditions necessary for testing (i.e. whether toggle is activated, or even if CSS validation toggle is activated)
* **callback:** The callback function

This function also makes use of the 'vnuPath' variable, so please make sure that variable is set properly prior to use

Here is an example of what the **conditions** parameter would look like:

> 	
> 	{
> 		'toggle':true,
> 		'css':true	
> 	}
> 	
> 	// The toggle to activate ALL validation checking (aka both HTML and CSS validation); 'false' => no validation at all
> 	// The toggle to activate particularly CSS checking; 'false' => no CSS validation will occur
> 	

The returned value from this function is similar to that provided above in the 'validateHTMLFiles()' description


#### validateHTMLText(content, callback): Takes in HTML plain text (i.e. a portion of HTML), and returns any validation errors

* **content:** The HTML plain text
	* The content provided can either contain all HTML tags (i.e. &ls;!DOCTYPE html&gt;&ls;html lang='en'&gt;...) or portions (i.e. &ls;p&gt;&ls;/p&gt;)
* **callback:** The callback function

While very similar to 'validateHTMLFiles()', it only checks HTML as plain text. If you wish to check a file, you must run it through 'validateHTMLFiles()' instead.

The purpose of this function is only to check for HTML errors in short bursts or in situations where HTML portions need to be checked only without the use of a file.

An example of the returned value by this function is shown below:

> 	
> 	{
> 		'totals':{
> 			error: 1,
> 			info: 0,
> 			files: [ undefined ] 
> 		},
> 		'undefined':[
> 			'error':{
> 				type: 'error',
> 				lastLine: 1,
> 				lastColumn: 54,
> 				firstColumn: 48,
> 				message: 'Element “head” is missing a required instance of child element “title”.',
> 				extract: 'set=utf-8></head><body>',
> 				chiliteStart: 10,
> 				hiliteLength: 7 
> 			},
> 			'info':[]
> 		]
> 	}
> 	

_Note that instead of a file being provided, the errors returned are listed under "undefined"._


#### validateCSSText(content, callback): Takes in CSS plain text and returns any validation errors

* **content:** The CSS plain text
* **callback:** The callback function

While very similar to 'validateCSSFiles()', it only checks CSS as plain text. If you wish to check a file, you must run it through 'validateCSSFiles()' instead.

The purpose of this function is only to check for CSS errors in short bursts or in situations where CSS portions need to be checked only without the use of a file.

An example of the returned alue by this function is similar to that shown in the description for 'validateHTMLText()', so please refer to that.


#### detectIndentHTML(files, conditions, callback): Check for Indentation within HTML files

* **files:** An array of files
	* Can contain files other than HTML - only the HTML files are parsed through anyways
	* **MUST** contain HTML files that **HAVE BEEN VALIDATED AND HAVE NO ERRORS** - otherwise, the function will not work properly
* **conditions:** A JS object list that contains toggles for whether if the function should run upon being called
* **callback:** The callback function

Here is an example of what the **conditions** parameter would look like:

> 	
> 	{
> 		'toggle':true,
> 		'html':true	
> 	}
> 	
> 	// The toggle to activate ALL indentation checking (aka both HTML and CSS indentation checking); 'false' => no checking at all
> 	// The toggle to activate particularly HTML checking; 'false' => no HTML indentation checking will occur
> 	

Here is an example of what the function will return:

> 	
> 	{
> 		'total':2,
> 		'total_html_files':['index.html','about.html'],
> 		'errors':[
> 			'file':'index.html',
> 			'error_type':0,
> 			'errors':[
> 				{ 
> 					'line':5,
> 					'message':'Closing tag of parent element is indented beyond that of the child',
> 					'raw':...
> 				},
> 				{
> 					'line':22,
> 					'message':'Parent indentation on this line is greater than that of its first child',
> 					'raw':...
> 				}
> 			],
> 			'total_errors':2
> 		]
> 	}
> 	

_For a full description of how this function works, please refer to the "detectIndentHTMLDocumentation.md" file provided..._


#### detectIndentCSS(files, conditions, callback): Check for Indentation within CSS files

* **files:** An array of files
	* Can contain files other than CSS files - only the CSS files are parsed through anyways
	* **MUST** contain CSS files that **HAVE BEEN VALIDATED AND HAVE NO ERRORS** - otherwise, the function will not work properly
* **conditions:** A JS object list that contains toggles for whether if the function should run upon being called
* **callback:** The callback function

Here is an example of what the **conditions** parameter would look like:

> 	
> 	{
> 		'toggle':true,
> 		'css':true	
> 	}
> 	
> 	// The toggle to activate ALL indentation checking (aka both HTML and CSS indentation checking); 'false' => no checking at all
> 	// The toggle to activate particularly CSS checking; 'false' => no CSS indentation checking will occur
> 	

The output returned by the function is similar to that in the example above.

