# detectIndentHTML() Documentation

This document will go over the intricacies of how the function 'detectIndentHTML()' works

## Premise:

**Parameters:**
* **files:** An array of files
	* Can contain files other than HTML - only the HTML files are parsed through anyways
	* **MUST** contain HTML files that **HAVE BEEN VALIDATED AND HAVE NO ERRORS** - otherwise, the function will not work properly
* **conditions:** A JS object list that contains toggles for whether if the function should run upon being called
* **callback:** The callback function

What this function essentially does is look at an array of files, filter out all the non-HTML files, and parse through each file to detect indentation errors.

There is no particular dependency that can reliably look at indentation errors within an HTML file due to how varies HTML files can be organized. There are linters out there, but they all operate on a standard that may not fit that required by the user.

Other dependencies out there can help clear up HTML files by making them look cleaner... but that is not what we're trying to do. We're trying to look at an HTML file line-by-line and determine if the indentation works.

The only dependency that does this remotely closely is [detect-Indent](https://github.com/sindresorhus/detect-indent), a Node.JS dependency that is able to detect indentation within a wide variety of coding files. However, this dependency mainly only detects
1) The most common type of indentation used, and 
2) The average amount of the aforementioned most common type of indentation used to delimite whether the next line is indented

While this is very powerful, it does not serve our purposes because it only looks at averages - there may be situations where HTML code can contain both spaces and tabs for indentation, for example.

In order to solve this issue, we require the use of **1** dependencies: [node-html-parser](https://www.npmjs.com/package/node-html-parser). This dependency is able to parse through HTML files and provide a very detailed but simplified DOM tree. An example of what this dependency outputs is provided in the file 'parseHTML_sample.json' given alongside this markdown file.


## Order of Operations:

#### Initialize the process

To access the function, you must call 'detectIndentHTML(files, conditions, callback)'.

1. If the condition toggle is false or we specifically turned off html indentation checking, we return 0 errors
2. We initialize several variables that we'll need:
	* **indent_errors:** An array containing all of our indentation errors accumulated across all HTML files
	* **total_indent_errors:** Our count for how many indentation errors we've accumulated across all HTML files
3. We filter through our array of provided files to filter out any files that aren't HTML
4. We initialize a synchronous loop that looks at each file and attempts to read each file
5. If it cannot read it, it returns an error for that file in its entirety
6. If it CAN read it, we need to parse through it that file
7. We splice the HTML plain text by newline into an array of lines
	* We don't need to worry about blank lines because this removes them by default within our function
8. We get the index, or line, where "&lt;html&gt;" starts inside our html file
	* This is where **"parseHTMLForBeginning()"** is called
9. We parse through our HTML text array 2 lines at a time, checking for indentation errors
	* This is where **"parseHTML()"** is called

#### Parse through our HTML Line by Line

The parseHTML() function is where most of the work is performed. The function takes in several parameters:
* **html_array:** The array of HTML plain text lines derived in Step # 7 above
* **beginning:** The index where "&lt;html&gt;" is inside our html_array
* **callback:** The callback function

This is how the function works, in a general sense:
1. We loop through html_array, starting with beginning_index
2. For every loop:
	1. We first check if beginning_index-1 >= 0 - if not, then we assume '', else we get that indent amount
	2. We then run our current line and the next line via parser_html as a combined string
	3. We check if the current line and the next line are parent-child, siblings, or else
		1. If parent-child, we need that first line's indent (which we got via 'detectIndent'), remove the 1st line's indent from the 2nd line's indent, then compare if anything remains
			* if something remains, then the child is indented properly
 			* if nothing remains, or if the 1st indent is longer than the 2nd indent... we got a problem, and we return an error
 		2. If siblings, we need that first line's indent (which we got via 'detectIndent') and compare if the 1st indent and 2nd indent are the same
 			* if the same, then the siblings are properly indented
 			* if not, then we got a problem, and we return an error
 		3. If else, then we might be in a situation where we're closing a parent and the 1st line is the child
 			* In this scenario, we have to compare if the 1st line's indent is longer than the 2nd line's indent
 			* To do so, we do the same as 3.1, but we cut the 2nd line's indent from the 1st
			* if the 1st line's remaining indent has something, we are golden
			* else, we have a problem, and we report the error
3. Once we complete the loop, we return 'indent_errors', which is an array of objects, each object representing the file, number of errors, and each specific error

#### How We Interpret Relationships Between Lines

How we detect if the 2 lines are a parent-child, sibling, or else relationship:

1. A **'Parent-Child'** relationship will appear like the following in the result from our 'parser_html':

> 	
> 	{
> 		"classNames":[],
> 		"nodeType":1,
> 		"tagName":null,
> 		"rawAttrs":"",
> 		"childNodes":[
> 			{
> 				"classNames":[],
> 				"nodeType":1,
> 				"tagName":"head",
> 				"rawAttrs":"",
> 				"childNodes":[
> 					{
> 						"childNodes":[],
> 						"nodeType":3,
> 						"rawText":"    "
> 					},{
> 						"childNodes":[],
> 						"classNames":[],
> 						"nodeType":1,
> 						"tagName":"meta",
> 						"rawAttrs":"charset=\"UTF-8\" "
> 					}
> 				]
> 			}
> 		]
> 	}
> 	
> 	// This was derived from the following 2 lines:
> 		<head>
> 			<meta charset="UTF-8" />
> 	

Notice how the first childNodes array has only a single child, and that child element has 2 children of its own?
This is an indicator that the &lt;head&gt; is an element that has 2 children: an indent, and the &lt;meta&gt;
We just check if the &lt;head&gt; line's indent is less than that of the &lt;meta&gt; line

2. A **'Sibling'** relationship will appear like the following in the result from our 'parser_html':

> 	
> 	{	
> 		"classNames":[],
> 		"nodeType":1,
> 		"tagName":null,
> 		"rawAttrs":"",
> 		"childNodes":[
> 			{
> 				"childNodes":[],
> 				"classNames":[],
> 				"nodeType":1,
> 				"tagName":"meta",
> 				"rawAttrs":"charset=\"UTF-8\" "
> 			},{
> 				"childNodes":[],
> 				"nodeType":3,
> 				"rawText":"    "
> 			},{
> 				"classNames":[],
> 				"nodeType":1,
> 				"tagName":"title",
> 				"rawAttrs":"",
> 				"childNodes":[
> 					{
> 						"childNodes":[],
> 						"nodeType":3,
> 						"rawText":" ... Jane Instructor b7f91e ... "
> 					}
> 				]
> 			}
> 		]
> 	}
> 	
> 	// This was derived from the following two lines:
> 		<meta charset="UTF-8" />
> 		<title> ... Jane Instructor b7f91e ... </title>
> 	

Notice how the 1st childNode array has 3 children: the &lt;meta&gt; element, and indent, and the &lt;title&gt;?
This is an indicator that the two lines are siblings because they're both children of the 1st childNodes array
In this case, we just check if their indents are the same or not

3. An **'Else'** relationship will appear like the following in the result from our 'parser_html':

> 	
> 	{
> 		"classNames":[],
> 		"nodeType":1,
> 		"tagName":null,
> 		"rawAttrs":"",
> 		"childNodes":[
> 			{
> 				"classNames":[],
> 				"nodeType":1,
> 				"tagName":"title",
> 				"rawAttrs":"",
> 				"childNodes":[
> 					{
> 						"childNodes":[],
> 						"nodeType":3,
> 						"rawText":" ... Jane Instructor b7f91e ... "
> 					}
> 				]
> 			},{
> 				"childNodes":[],
> 				"nodeType":3,
> 				"rawText":"  "
> 			}
> 		]
> 	}
> 	
> 	//	This was derived from the following 2 lines:
> 			<title> ... Jane Instructor b7f91e ... </title>
> 		</head>
> 	

In this scenario, if there are two children inside the 1st childNodes array, then that means 'parser_html' could not detect the &lt;/head&gt; element
This is a pretty clear indicator that we're closing a parent tag
In this case, we just check if the indent for the &lt;title&gt; line is greater than that of the &lt;/head&gt; line

#### Exception Cases:

1. EXCEPTION CASE #1: There are instances where we might get something... unknown. For example:

> 	
> 		</head>
> 		<body>
> 	

The 'parser_html' function will output this:

> 	{
> 		"classNames":[],
> 		"nodeType":1,
> 		"tagName":null,
> 		"rawAttrs":"",
> 		"childNodes":[
> 			{
> 				"childNodes":[],
> 				"nodeType":3,
> 				"rawText":"\n  "
> 			},{
> 				"childNodes":[],
> 				"classNames":[],
> 				"nodeType":1,
> 				"tagName":"body",
> 				"rawAttrs":""
> 			}
> 		]
> 	}
> 	

Under normal situations, this will actually lead to a False Positive where the function will believe that this is an **'Else'** relationship where the "parent" (aka the &lt;body&gt;) is misaligned with its "child" (aka &lt;/head&gt;)

To counter this, we look at the first child: if the first child has a nodeType of 3, then we know that a tag has ended and another sibling is beginning
In such as scenario, we don't return an error
However, if we get a scenario where the first child's nodeType is 1, then we DO have an error

2. EXCEPTION CASE #2: There are instances where we might also get the following:

> 	
> 		</body>
> 	</html>
> 	

This will produce the folliwng from 'parser_html':

> 	{
> 		"classNames":[],
> 		"nodeType":1,
> 		"tagName":null,
> 		"rawAttrs":"",
> 		"childNodes":[
> 			{
> 				"childNodes":[],
> 				"nodeType":3,
> 				"rawText":"\n"
> 			}
> 		]
> 	}
> 	

As you can see, the there is only 1 child node that is type 3
Under this scenario, we should treat it as an else case, not a parent-sibling case

