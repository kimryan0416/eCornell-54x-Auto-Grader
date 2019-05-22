const fs = require('fs');
const path = require('path');
const cssParser = require('css');
const cheerio = require('cheerio');

const optionMaps = {
	'true':true,
	'1':true,
	'false':false,
	'0':false
};

function main(){

	var tests = [];
	var passes = [];
	var failures = [];

	var processPath,testContents,reportDir,suiteName,suiteTests,timeout;
	var SILENT,CONSOLE_SILENT,INLINE_STYLING,SAVEHTML,SAVEJSON,SAVEWITHASSIGN,SAVEDIR,SAVENAME,TIMEOUT_TIME,SYNCHRONOUS,ABS_DIR,GRADE;

	function suitePrepare() {
		processPath = process.env.TESTS;
		reportDir = path.dirname(processPath);
		testContents = JSON.parse(fs.readFileSync(processPath,'utf-8'));
		suiteName = (testContents.name != null) ? testContents.name : "CIS54x Autograder";
		suiteTests = testContents.tests;
		if (testContents.options) {
			SILENT = (testContents.options.silent != null) ? (typeof testContents.options.silent === 'boolean') ? testContents.options.silent : ( Object.keys(optionMaps).indexOf(testContents.options.silent) > -1 ) ? optionMaps[testContents.options.silent] : false : false;
			CONSOLE_SILENT = (testContents.options.console_silent != null) ? (typeof testContents.options.console_silent === 'boolean') ? testContents.options.console_silent : ( Object.keys(optionMaps).indexOf(testContents.options.console_silent) > -1 ) ? optionMaps[testContents.options.console_silent] : false : false;
			INLINE_STYLING = (testContents.options.inline_styling != null) ? (typeof testContents.options.inline_styling === 'boolean') ? testContents.options.inline_styling : (typeof testContents.options.inline_styling === 'string') ? ( Object.keys(optionMaps).indexOf(testContents.options.inline_styling) > -1 ) ? optionMaps[testContents.options.inline_styling] : path.normalize(testContents.options.inline_styling) : true : true;
			SAVEHTML = (testContents.options.save_html != null) ? (typeof testContents.options.save_html === 'boolean') ? testContents.options.save_html : ( Object.keys(optionMaps).indexOf(testContents.options.save_html) > -1 ) ? optionMaps[testContents.options.save_html] : true : true;
			SAVEJSON = (testContents.options.save_json != null) ? (typeof testContents.options.save_json === 'boolean') ? testContents.options.save_json : ( Object.keys(optionMaps).indexOf(testContents.options.save_json) > -1 ) ? optionMaps[testContents.options.save_json] : true : true;
			SAVEWITHASSIGN = (testContents.options.save_with_assignment != null) ? (typeof testContents.options.save_with_assignment  === 'boolean') ? testContents.options.save_with_assignment  : ( Object.keys(optionMaps).indexOf(testContents.options.save_with_assignment ) > -1 ) ? optionMaps[testContents.options.save_with_assignment] : true : true;
			SAVEDIR = (testContents.options.save_dir != null) ? (testContents.options.save_dir.charAt(testContents.options.save_dir.length-1) != '/') ? testContents.options.save_dir+'/' : testContents.options.save_dir : "testReport/";
			SAVENAME = (testContents.options.savename != null) ? testContents.options.savename : "report";
			TIMEOUT_TIME = (testContents.options.timeout != null) ? parseInt(testContents.options.timeout) : 20000;
			SYNCHRONOUS = (testContents.options.synchronous != null) ? (typeof testContents.options.synchronous === 'boolean') ? testContents.options.synchronous : ( Object.keys(optionMaps).indexOf(testContents.options.synchronous) > -1 ) ? optionMaps[testContents.options.synchronous] : false : false;
			ABS_DIR = (testContents.options.abs_dir != null) ? (testContents.options.abs_dir.charAt(testContents.options.abs_dir.length-1) != '/') ? testContents.options.abs_dir+'/' : testContents.options.abs_dir : "./";
			GRADE = (testContents.options.grade != null) ? (typeof testContents.options.grade  === 'boolean') ? testContents.options.grade : ( Object.keys(optionMaps).indexOf(testContents.options.grade ) > -1 ) ? optionMaps[testContents.options.grade] : false : false;
		} else {
			SILENT=false;
			CONSOLE_SILENT=false;
			INLINE_STYLING=true;
			SAVEHTML=true;
			SAVEJSON=true;
			SAVEWITHASSIGN=true;
			SAVEDIR='testReport/';
			SAVENAME='report';
			TIMEOUT_TIME=20000;
			SYNCHRONOUS = false;
			ABS_DIR = './';
			GRADE = false;
		}
		if (!CONSOLE_SILENT) console.log('\n\x1b[4m%s\x1b[0m\n','Preparation of Suite Complete');
	}
	function suiteStart(ts) {
		if (!CONSOLE_SILENT) console.log('\x1b[4m%s\x1b[0m','Starting Suite Testing...');

		timeout = setTimeout(function() {
			process.stdout.write('Process killed timeout at ' + TIMEOUT_TIME + '\n');
			process.exit(1);
		},TIMEOUT_TIME);

		if (!SYNCHRONOUS) return Promise.all(ts.map((t,i)=>testWrapper(t,i)));
		else {
			return ts.reduce(function(p, t, i) {
				return p.then(function() {
					return testWrapper(t,i);
				});
			},Promise.resolve());
		}
	};
	function suiteEnd() {
		function sortTests(a,b) {
			if (a.index > b.index) return 1;
			if (b.index > a.index) return -1;
			return 0;
		}

		function createFile(filepath, contents) {
			try {
				fs.mkdirSync(path.dirname(filepath));
			} catch (err) {
				if (err.code !== 'EEXIST') throw err;
			}
			try {
				fs.writeFileSync(filepath, contents, 'utf8');
			} catch(err) {
				if (err.code !== 'EEXIST') throw err;
			}
		}

		function passFilter(out,pass) {
			out += '<p class="cis54x-passTest-title"><span class="cis54x-bolded">&#x2714;</span> '+pass.title+'</p>';
			return out;
		}
		function failFilter(out,fail) {
			var outputMessage = '';
			if (typeof fail.message === 'object') {
				Object.keys(fail.message).forEach((subtitle)=>{
					outputMessage += '<pre class="cis54x-failTest-message"><code class="cis54x-failTest-code cis54x-failTest-subtitle">'+subtitle+'</code><code class="cis54x-failTest-code cis54x-failTest-submessage">'+fail.message[subtitle]+'</code></pre>' ;
				});
			} else {
				outputMessage = '<pre class="cis54x-failTest-message"><code class="cis54x-failTest-code cis54x-failTest-submessage">'+fail.message+'</code></pre>' ;
			}
			var output = "<div class='cis54x-failTest-container'><p class='cis54x-failTest-title'><span class='cis54x-bolded'>&#33;</span> "+fail.title+"</p><div class='cis54x-failTest-messageBox'>"+outputMessage+"</div></div>";
			return out += output;
		}

		if (!CONSOLE_SILENT) {
			console.log('\x1b[4m%s\x1b[0m','Ending Suite Testing');
			var tot = passes.length + failures.length;
			console.log('\t['+passes.length+'/'+tot+'] tests passed\n');
		}

		var filepath;

		tests.sort(sortTests);
		passes.sort(sortTests);
		failures.sort(sortTests);

		//var template = fs.readFileSync(".guides/cis54x/cis54x-template.html", "utf8");
		var template = fs.readFileSync(path.normalize(ABS_DIR+'cis54x-template.html'), 'utf8');
		var $ = cheerio.load(template);

	    var passOutput = (passes.length > 0) ? passes.reduce(passFilter,'') : '<p><span class="cis54x-bolded">[&#33;]</span> No tests passed.</p>';
	    var failOutput = (failures.length > 0 ) ? failures.reduce(failFilter,'') : '<p class="cis54x-passTest-title">No tests failed. Congratulations!</p>' ;
		
	    $('#cis54x-headerh1').text(passes.length + '/' + (passes.length+failures.length) + ' tests passed!');
	    if (passes.length == tests.length && failures.length == 0) {
	    	$('.cis54x-header').addClass("success");
	    } else {
	    	$(".cis54x-header").addClass("failure");
	    }
	    $('#cis54x-boxPasses').html(passOutput);
	    $("#cis54x-boxFailures").html(failOutput);

		if (INLINE_STYLING) {
			var cssReplacements = {};
			var cssPath = (typeof INLINE_STYLING === 'string') ? INLINE_STYLING : path.normalize(ABS_DIR+'cis54x-styles.css');
			try {
				// We initialize this by getting the CSS for all inline styling - we'll eventually add to "replacements near the end of the test"
				var cssContents = fs.readFileSync(cssPath,'utf-8');
				var cssParsed = cssParser.parse(cssContents);
				var cssInnerContents = cssParsed['stylesheet']['rules'];
				cssReplacements = cssInnerContents.reduce((filtered,rule)=>{
					let thisSelector = rule['selectors'][0];
					filtered[thisSelector] = rule['declarations'].reduce((newObject,declaration)=>{
						newObject[declaration.property] = declaration.value;
						return newObject;
					},{});
					return filtered;
				},cssReplacements);
			} catch(e) {
				if (!CONSOLE_SILENT) console.log('Unable to parse through CSS file, using default inline-styling');
				cssReplacements = {
					".cis54x-bolded":{
						"font-weight": 		"bold"
					},
					".cis54x-mainContainer":{
						"width": 			"100%",
						"font-size": 		"0",
						"font-family": 		"'Open Sans',Helvetica,Arial,sans-serif"
					},
					".cis54x-header":{
						"font-size": 	 	"12px",
						"width": 		 	"100%",
						"margin-bottom": 	"30px",
						"background-color": "#B31B1B",
						"color": 			"#FFFFFF",
						"box-sizing": 		"border-box",
						"padding": 			"15px",
						"box-shadow": 		"0px 0px 5px 2px rgba(0,0,0,0.5)"
					},
					".cis54x-header.failure":{
						"background-color": "#B31B1B"
					},
					".cis54x-header.success":{
						"background-color": "#005f3c"
					},
					".cis54x-headerh1":{
						"margin": 			"0",
						"font-size": 		"1.5em",
						"color": 			"white!important"
					},
					".cis54x-body":{
						"font-size": 		"12px",
						"box-sizing": 		"border-box",
						"padding-left": 	"15px",
						"padding-right": 	"15px"
					},
					".cis54x-box":{
						"margin-bottom": 	"45px"
					},
					".cis54x-boxTitle":{
						"font-size": 		"20px !important",
						"margin-top": 		"15px !important",
						"margin-bottom": 	"15px !important",
						"border-bottom": 	"1px solid rgb(230,230,230)",
						"color": 			"rgb(0,0,0)"
					},
					".cis54x-boxContents":{
						"text-align": 		"left",
						"box-sizing": 		"border-box"
					},
					".cis54x-passTest-title":{
						"margin": 			"0",
						"border-bottom": 	"1px solid rgb(230,230,230)",
						"font-size": 		"16px",
						"line-height": 		"24px",
						"color": 			"rgb(0,95,60)"
					},
					".cis54x-failTest-container":{
						"margin-bottom": 	"30px"
					},
					".cis54x-failTest-title":{
						"margin": 			"0",
						"padding-top": 		"2px",
						"padding-bottom": 	"2px",
						"font-size": 		"16px",
						"line-height": 		"24px",
						"border-bottom": 	"1px solid rgb(230,230,230)",
						"color": 			"rgb(255,65,45)"
					},
					".cis54x-failTest-messageBox":{
						"box-sizing": 		"border-box",
						"padding-left": 	"5px",
						"padding-top": 		"5px",
						"border-left": 		"1px solid rgb(230,230,230)",
						"margin-bottom": 	"15px"
					},
					".cis54x-failTest-message":{
						"margin-top": 		"0",
						"margin-bottom": 	"15px",
						"font-size": 		"12px",
						"word-wrap": 		"break-word",
						"overflow-wrap": 	"break-word",
						"white-space": 		"pre-wrap"
					},
					".cis54x-failTest-code":{
						"display": 			"block",
						"width": 			"100%",
						"box-sizing": 		"border-box",
						"padding": 			"5px",
						"margin-bottom": 	"10px",
						"border-radius": 	"0",
						"font-size": 		"10px",
						"line-height": 		"15px"
					},
					".cis54x-failTest-subtitle":{
						"border": 			"1px solid #c7d5f6",
						"background-color": "#f7f9fc"
					},
					".cis54x-failTest-submessage":{
						"border": 			"none",
						"background-color": "transparent",
						"font-family": 		"'Open Sans',Helvetica,Arial,sans-serif",
						"font-size": 		"14px"
					}
				}
			}
			for(var sel in cssReplacements) {
				$(sel).css(cssReplacements[sel]);
				//if (sel == ".cis54x-header.failure") console.log("FAILURES");
				//else if (sel == ".cis54x-header.failure")
			}
		}

		var body = $("body").html();

		if (SAVEHTML) {
			var html = '<!DOCTYPE html><html lang="en"><head><title>"cis54x Autograder Test"</title><meta charset="UTF-8"><meta http-equiv="refresh" content="20"><style type="text/css">html,body{margin:0;padding:0;}</style></head><body>'+body+'</body></html>';
	        filepath = (SAVEWITHASSIGN) ? './'+reportDir+'/'+SAVEDIR+'/'+SAVENAME+'-'+suiteName+'.html' : './'+SAVEDIR+'/'+SAVENAME+'-'+suiteName+'.html';
			filepath = path.normalize(filepath);
			try {
				createFile(filepath, html);
			} catch(err) {
				console.log(err);
			}
		}

		if (SAVEJSON) {
			var jsOut = {
				num_tests: tests.length,
				num_passes: passes.length,
				fail_passes: failures.length,
				tests: tests,
				passes: passes,
				failures: failures
			};
			filepath = (SAVEWITHASSIGN) ? './'+reportDir+'/'+SAVEDIR+'/'+SAVENAME+'-'+suiteName+'.json' : './'+SAVEDIR+'/'+SAVENAME+'-'+suiteName+'.json';
			filepath = path.normalize(filepath);
			try {
				createFile(filepath, JSON.stringify(jsOut,null,'\t'));
			} catch(err) {
				console.log(err);
			}
		}

		if (GRADE) {
			var gradeJSON;
			var gradeFilepath = path.normalize(ABS_DIR + '/' + SAVEDIR + '/' + 'gradeReport.json');
			try {
				gradeJSON = JSON.parse(fs.readFileSync(gradeFilepath,'utf8'));
				gradeJSON['last_submission'] = new Date();
				gradeJSON['total_tests'] = (gradeJSON['total_tests'] != null && typeof gradeJSON['total_tests'] === 'number') ? gradeJSON['total_tests'] : 0;
				gradeJSON['passed_tests'] = (gradeJSON['passed_tests'] != null && typeof gradeJSON['passed_tests'] === 'number') ? gradeJSON['passed_tests'] : 0;
				gradeJSON['failed_tests'] = (gradeJSON['failed_tests'] != null && typeof gradeJSON['failed_tests'] === 'number') ? gradeJSON['failed_tests'] : 0;
				gradeJSON['total_points'] = (gradeJSON['total_points'] != null && typeof gradeJSON['total_points'] === 'number') ? gradeJSON['total_points'] : 0;
				gradeJSON['points'] = (gradeJSON['points'] != null && typeof gradeJSON['points'] === 'number') ? gradeJSON['points'] : 0;
				gradeJSON['tests'] = (gradeJSON['tests'] != null) ? gradeJSON['tests'] : {};
			} catch(e) {
				gradeJSON = {
					'last_submission': new Date(),
					'total_tests': 0,
					'passed_tests': 0,
					'failed_tests': 0,
					'tests':{},
					'total_points': 0,
					'points': 0
				}
			}
			if (gradeJSON['tests'][suiteName] != null) {
				gradeJSON['tests'][suiteName].forEach(t=>{
					gradeJSON['total_tests'] = (gradeJSON['total_tests'] > 0) ? gradeJSON['total_tests'] - 1 : 0;
					gradeJSON['total_points'] = (gradeJSON['total_points'] > 0) ? gradeJSON['total_points'] - t.points : 0;
					if (t.success) {
						gradeJSON['passed_tests'] = (gradeJSON['passed_tests'] > 0) ? gradeJSON['passed_tests'] - 1 : 0;
						gradeJSON['points'] = (gradeJSON['points'] > 0) ? gradeJSON['points'] - t.points : 0;
					} else 
						gradeJSON['failed_tests'] = (gradeJSON['failed_tests'] > 0) ? gradeJSON['failed_tests'] - 1 : 0;
				});
			}
			gradeJSON['total_tests'] += tests.length;
			gradeJSON['passed_tests'] += passes.length;
			gradeJSON['failed_tests'] += failures.length;
			gradeJSON['total_points'] = tests.reduce((tPoints,t)=>{
				tPoints += t.points;
				return tPoints;
			},gradeJSON['total_points']);
			gradeJSON['points'] = passes.reduce((passPoints,t)=>{
				passPoints += t.points;
				return passPoints;
			},gradeJSON['points']);
			gradeJSON['tests'][suiteName] = tests;

			try {
				createFile(gradeFilepath, JSON.stringify(gradeJSON,null,'\t'));
			} catch(err) {
				if (!CONSOLE_SILENT) console.log(err);
			}
		}

		if (failures.length == 0) {
			return Promise.resolve(body);
		} else return Promise.reject(body);

	}

	function testWrapper(test, index) {
		var testIndex, testName, testTitle, testMessage, testVariables, testStart, testResults;
		function testPrepare(t){
			testIndex = index;
			testName = t.name;
			testTitle = (t.title != null) ? t.title : null;
			testMessage = (t.message != null) ? t.message : null;
			testVariables = t.variables;
			testVariables['abs_dir'] = ABS_DIR;
			testPoints = (t.points != null && typeof t.points === 'number') ? t.points : 10;
			testStart = require(t.test).main;
		}
		function testEnd(res) {
			res.index = testIndex;
			res.points = testPoints;
			tests.push(res);
			if (res.success) {
				passes.push(res);
				if (!CONSOLE_SILENT) console.log('- PASS: '+res.title+'\n\n');
			}
			else {
				failures.push(res);
				if (!CONSOLE_SILENT) console.log('- \x1b[31mFAIL:\x1b[0m %s\n\x1b[2m%s\x1b[0m\n',res.title,res.console_message);
			}
		};

		testPrepare(test);
		testResults = new Promise((resolve,reject)=>{
			testStart(testName, testTitle, testMessage, testVariables, testRes=>{
				resolve(testRes);
			});
		});
		return testResults.then((res)=>{
			testEnd(res);
			return res;
		});
	}

	suitePrepare();
	var suitePromises = suiteStart(suiteTests);
	var suiteEndPromise = suitePromises.then((suiteResults)=>{
		clearTimeout(timeout);
		return suiteEnd();
	});
	suiteEndPromise.then((body)=>{
		if (!SILENT) process.stdout.write(body+'\n');
		process.exit(0);
	},(body)=>{
		if (!SILENT) process.stdout.write(body+'\n')
		process.exit(1);
	});
}

main();
