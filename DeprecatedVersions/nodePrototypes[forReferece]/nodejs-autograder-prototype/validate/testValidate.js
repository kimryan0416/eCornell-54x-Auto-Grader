const fs = require('fs');

const validate = require("./validate.js");
const glob = require("glob");
const getDirectories = (src, callback) => {
	glob(src + "/**/*", callback);
}


function testFullHTML(inputs = null, callback) {
	console.log("\x1b[37m%s\x1b[0m", "\n*** Begin Testing Validating & Indentation Checking HTML! ***");
	var tests = (inputs != null) ? inputs : [
		{
			'input':'./validate/tests/fullHTML/1/',
			'message':'Expect NULL response from validateHTMLFiles()\nExpect 0 errors for Indentation Checking'
		},
		{
			'input':'./validate/tests/fullHTML/2/',
			'message':'Expect NULL response from validateHTMLFiles()\nExpect 0 errors for Indentation Checking'
		},
		{
			'input':'./validate/tests/fullHTML/3/',
			'message':'Expect 1 Error from validateHTMLFiles() with \"about.html\"\nExpect 0 errors for Indentation Checking'
		},
		{
			'input':'./validate/tests/fullHTML/4/',
			'message':'Expect 1 Validation error with \"about.html\" and \"extras/clean.html\"\nExpect at least 2 errors for Indentation Checking from \"extras/clean.html\"'
		}
	];
	var test = null;
	var loopThroughTests = function(index) {
		if (index < tests.length) {
			test = tests[index];
			console.log("\x1b[34m%s\x1b[0m","\n-- Test #" + (index+1));
			console.log("\x1b[36m%s\x1b[0m",test['message']);
			validate.validateHTMLFiles(test['input'], {'toggle':true,'html':true}, (results1)=>{
				console.log(results1);
				if (results1 != null) fs.writeFileSync(test['input']+"validateHTMLFilesResults.json", JSON.stringify(results1) , 'utf-8');
				console.log("-----")
				getDirectories(test['input'], (err, files)=>{
					if (err) console.log("error: " + err);
					else {
						validate.detectIndentHTML(files, {'toggle':true,'html':true}, (results2)=>{
							console.log(results2);
							if (results2 != null) fs.writeFileSync(test['input']+"indentDetectHTMLResults.json", JSON.stringify(results2) , 'utf-8');
							loopThroughTests(index+1);
						});
					}
				});
			});
		} else {
			console.log("\x1b[37m%s\x1b[0m", "\n*** Testing Validating & Indentation Checking HTML Ended! ***\n");
			callback();
		}
	}
	loopThroughTests(0);
}

/*
// Testing validateHTMLText();
// The function below, 'testValidateHTMLTest()', runs through the function 'validateHTMLText()' based on the following inputs:
//		- if 'input' is null, then we run a test HTML script of our own - this returns no errors
//		- if 'input' is a file (aka has a path), then we read through the file, determine if it has the proper HTML headings, add if missing, then run through the validator
//		- if 'input' is HTML text (aka isn't a path), then we determine if it has proper HTML headings, add if missing, then run through validator
// To simulate, just call this function
*/
function testValidateHTMLText(inputs = null, callback) {
	console.log("\x1b[37m%s\x1b[0m", "\n*** Begin validateHTMLText() Testing! ***");
	var tests = (inputs != null) ? inputs : [
		{
			'input':'<p>Test</p>',
			'message':'We expect a NULL result'
		},
		{
			'input':'<!DOCTYPE html><html><head><meta charset="UTF-8"><title>test5 Submission</title><style>span {color:blue;}</style></head><body><h1>Testing validateHTMLText()</h1><p>This is a test to determine if this function works</p></body></html>',
			'message':'We expect a NULL result'
		},
		{
			'input':'<!DOCTYPE html>\n<html>\n\t<head>\n\t\t<meta charset="UTF-8">\n\t\t<title>test5 Submission</title>\n\t\t<style>\n\t\t\tspan {\n\t\t\t\tcolor:blue;\n\t\t\t}\n\t\t</style>\n\t</head>\n\t<body>\n\t\t<h1>Testing validateHTMLText()</h1>\n\t\t<p>This is a test to determine if this function works</p>\n\t</body>\n</html>',
			'message':'We expect a NULL result'
		},
		{
			'input':'<p>Error Test 1</p',
			'message':'We expect at least 1 error pertaining to end of <p> tag not being correct'
		},
		{
			'input':'<p>Error Test 1</p><img src="" alt="">',
			'message':'We expect at least 1 error pertaining to the lack of text inside the "alt" attribute in the <img> tag'
		},
		{
			'input':'<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><h2>Test for info</h2></body></html>',
			'message':'We expect 1 error for missing <title> tag'
		}
	];
	var test = null;
	var loopThroughTests = function(index) {
		if (index < tests.length) {
			test = tests[index];
			console.log("\x1b[34m%s\x1b[0m","\n-- Testing validateHTMLText() - Test #" + (index+1));
			console.log("\x1b[36m%s\x1b[0m",test['message']);
			validate.validateHTMLText(test['input'], (err, results)=>{
				if (err) console.log("\x1b[31m%s\x1b[0m", err);
				else {
					if (results != null) {
						console.log(results['totals']);
						console.log(results['undefined']['error'])
						console.log(results['undefined']['info']);
						fs.writeFileSync("./validate/tests/validateHTMLText/html_input_test_results_"+(index+1)+".json", JSON.stringify(results) , 'utf-8');
					} else {
						console.log("\x1b[32m%s\x1b[0m", "NULL returned!");
					}
				}
				loopThroughTests(index+1);
			});
		} else {
			console.log("\x1b[37m%s\x1b[0m", "\n*** validateHTMLText() Testing Ended! ***\n");
			callback();
		}
	}
	loopThroughTests(0);
}

/*
// Testing validateCSSText();
// var css_input_test = our CSS test text that should return *3* errors
// Our errors will be present within a file called "css_input_test_results.json" if there were errors present
//		- if 'input' is null, then we run a test CSS script of our own - this returns no errors
//		- if 'input' is a file (aka has a path), then we read through the file and run through the validator
//		- if 'input' is CSS text (aka isn't a path), then we run through validator
// To simulate, just call this function
*/
function testValidateCSSText(inputs = null, callback) {
	console.log("\x1b[37m%s\x1b[0m", "\n*** Begin validateCSSText() Testing! ***");
	var tests = (inputs != null) ? inputs : [
		{
			'input':'html, body {margin:0;padding:0;} span {display:block;}',
			'message':'We expect a NULL result'
		},
		{
			'input':'html:body {margin:0;padding:0;} span {display:block;}',
			'message':'We expect at least 1 error about the use of \":\" instead of \",\"'
		}
	];
	var test = null;
	var loopThroughTests = function(index) {
		if (index < tests.length) {
			test = tests[index];
			console.log("\x1b[34m%s\x1b[0m","\n-- Testing validateCSSText() - Test #" + (index+1));
			console.log("\x1b[36m%s\x1b[0m",test['message']);
			validate.validateCSSText(test['input'], (results)=>{
				if (results != null) {
					console.log(results['totals']);
					var test_file = results['totals']['files'][0];
					console.log(results[test_file]['error'])
					console.log(results[test_file]['info']);
					fs.writeFileSync("./validate/tests/validateCSSText/css_input_test_results_"+(index+1)+".json", JSON.stringify(results) , 'utf-8');
				} else {
					console.log("\x1b[32m%s\x1b[0m", "NULL returned!");
				}
				loopThroughTests(index+1);
			});
		} else {
			console.log("\x1b[37m%s\x1b[0m", "\n*** validateCSSText() Testing Ended! ***\n");
			callback();
		}
	}
	loopThroughTests(0);
}



function main() {
	console.log("\x1b[35m%s\x1b[0m","Testing Validation Files");
	testFullHTML(null, ()=>{
		testValidateHTMLText(null, ()=>{
			testValidateCSSText(null, () => {
				console.log("\x1b[35m%s\x1b[0m","Ending Testing Validation Files");
			});
		});
	});
}

main();


