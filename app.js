const fs = require('fs');
const path = require('path');

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
	var SILENT,CONSOLE_SILENT,SAVEHTML,SAVEJSON,SAVEWITHASSIGN,SAVEDIR,SAVENAME,TIMEOUT_TIME;

	function suitePrepare() {
		processPath = process.env.TESTS;
		reportDir = path.dirname(processPath);
		testContents = JSON.parse(fs.readFileSync(processPath,'utf-8'));
		suiteName = (testContents.name != null) ? testContents.name : "CIS54x Autograder";
		suiteTests = testContents.tests;
		if (testContents.options) {
			SILENT = (testContents.options.silent != null) ? (typeof testContents.options.silent === 'boolean') ? testContents.options.silent : ( Object.keys(optionMaps).indexOf(testContents.options.silent) > -1 ) ? optionMaps[testContents.options.silent] : false : false;
			CONSOLE_SILENT = (testContents.options.console_silent != null) ? (typeof testContents.options.console_silent === 'boolean') ? testContents.options.console_silent : ( Object.keys(optionMaps).indexOf(testContents.options.console_silent) > -1 ) ? optionMaps[testContents.options.console_silent] : false : false;
			SAVEHTML = (testContents.options.savehtml != null) ? (typeof testContents.options.savehtml === 'boolean') ? testContents.options.savehtml : ( Object.keys(optionMaps).indexOf(testContents.options.savehtml) > -1 ) ? optionMaps[testContents.options.savehtml] : true : true;
			SAVEJSON = (testContents.options.savejson != null) ? (typeof testContents.options.savejson === 'boolean') ? testContents.options.savejson : ( Object.keys(optionMaps).indexOf(testContents.options.savejson) > -1 ) ? optionMaps[testContents.options.savejson] : true : true;
			SAVEWITHASSIGN = (testContents.options.saveWithAssigment != null) ? (typeof testContents.options.saveWithAssigment  === 'boolean') ? testContents.options.saveWithAssigment  : ( Object.keys(optionMaps).indexOf(testContents.options.saveWithAssigment ) > -1 ) ? optionMaps[testContents.options.saveWithAssigment] : true : true;
			SAVEDIR = (testContents.options.savedir != null) ? (testContents.options.savedir.charAt(testContents.options.savedir.length-1) != '/') ? testContents.options.savedir+'/' : testContents.options.savedir : "testReport/";
			SAVENAME = (testContents.options.savename != null) ? testContents.options.savename : "report";
			TIMEOUT_TIME = (testContents.options.timeout != null) ? parseInt(testContents.options.timeout) : 20000;
		} else {
			SILENT=false;
			CONSOLE_SILENT=false;
			SAVEHTML=true;
			SAVEJSON=true;
			SAVEWITHASSIGN=true;
			SAVEDIR='testReport/';
			SAVENAME='report';
			TIMEOUT_TIME=20000;
		}
		if (!CONSOLE_SILENT) console.log('\n\x1b[4m%s\x1b[0m\n','Preparation of Suite Complete');
	}
	function suiteStart(ts) {
		if (!CONSOLE_SILENT) console.log('\x1b[4m%s\x1b[0m','Starting Suite Testing...');

		timeout = setTimeout(function() {
			process.stdout.write('Process killed timeout at ' + TIMEOUT_TIME + '\n');
			process.exit(1);
		},TIMEOUT_TIME);

		return Promise.all(ts.map((t,i)=>testWrapper(t,i)));
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
			out += '<p style="margin:0;border-bottom:1px solid rgb(230,230,230);font-size:12px;"><span style="font-weight:bold;">&#x2714;</span> '+pass.title+'</p>';
			return out;
		}
		function failFilter(out,fail) {
			var outputMessage = '', toggable = false;
			var outputReplacements = {
				'{{pre}}':'margin-top:0;margin-bottom:15px;font-size:12px;word-wrap:break-word;overflow-wrap:break-word;white-space:pre-wrap;',
				'{{code}}':'display:block;width:100%;box-sizing:border-box;padding:5px;margin-bottom:10px;border-radius:0;font-size:10px;line-height:15px;',
				'{{subtitle}}':'border:1px solid #c7d5f6;background-color:#f7f9fc;',
				'{{submessage}}':'border:none;background-color:transparent;font-family:Verdana,Arial,sans-serif;'
			}
			if (typeof fail.message === 'object') {
				Object.keys(fail.message).forEach((subtitle)=>{
					outputMessage += '<pre style="{{pre}}"><code style="{{code}} {{subtitle}}">'+subtitle+'</code><code style="{{code}} {{submessage}}">'+fail.message[subtitle]+'</code></pre>';
					toggable = toggable || fail.message[subtitle].length > 0;
				});			
			} else {
				outputMessage = '<pre style="{{pre}}"><code style="{{code}} {{submessage}}">'+fail.message+'</code></pre>';
				toggable = fail.message.length > 0;
			}
			outputMessage = outputMessage.replace(/{{.*?}}/g, function(match){ return outputReplacements[match] });
			var replace = {
				'{{title}}':fail.title,
				'{{p}}':'margin:0;padding-top:2px;padding-bottom:2px;font-size:12px;line-height:15px;border-bottom:1px solid rgb(230,230,230);',
				'{{message}}':outputMessage
			};
			var output = (toggable) ? "<div style='margin-bottom:30px;'><p style='{{p}}'><span style='font-weight:bold;'>&#33;</span> {{title}}</p><div style='box-sizing:border-box;padding-left:5px;padding-top:5px;border-left:1px solid rgb(230,230,230);margin-bottom:15px;'>{{message}}</div></div>" : "<div style='margin-bottom:60px;'><p style='{{p}}'><span class='bold'>&#33;</span> {{title}}</p><div class='test_content'>{{message}}</div></div>";
			var newOut = output.replace(/{{.*?}}/g, function(match){
				return replace[match];
			});
			return out += newOut;
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

		var template = fs.readFileSync(".guides/cis54x/cis54xReporter_TEMPLATE.html", "utf8");
		//var template = fs.readFileSync('./cis54xReporter_TEMPLATE.html', 'utf8')
		var passOutput = (passes.length > 0) ? passes.reduce(passFilter,'') : '<p><span style="font-weight:bold;">[&#33;]</span> No tests passed.</p>';
	    var failOutput = (failures.length > 0 ) ? failures.reduce(failFilter,'') : '<p style="margin:0;width:100%;">No tests failed. Congratulations!</p>';
		var replacements = {
				"{{NUM_PASSES}}": passes.length,
				"{{NUM_TOTAL}}": passes.length+failures.length,
				"{{PASS_OUTPUT}}": passOutput,
				"{{FAIL_OUTPUT}}": failOutput
			};
		var body = template.replace(/{{.*?}}/g, function(match){ return replacements[match] });

		if (SAVEHTML) {
			var html = '<!DOCTYPE html><html lang="en"><head><title>"Mocha Test"</title><meta charset="UTF-8">'+
        	//'<meta http-equiv="refresh" content="20">'+
        	'<style type="text/css">html,body{margin:0;padding:0;}</style></head><body>{{BODY}}</body></html>';
	        html = html.replace(/{{BODY}}/g, body);

	        filepath = (SAVEWITHASSIGN) ? './'+reportDir+'/'+SAVEDIR+'/'+SAVENAME+'.html' : './'+SAVEDIR+'/'+SAVENAME+'.html';
			filepath = path.normalize(filepath);
			try {
				createFile(filepath, html);
			} catch(err) {
				if (!CONSOLE_SILENT) console.log(err);
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
			filepath = (SAVEWITHASSIGN) ? './'+reportDir+'/'+SAVEDIR+'/'+SAVENAME+'.json' : './'+SAVEDIR+'/'+SAVENAME+'.json';
			filepath = path.normalize(filepath);
			try {
				createFile(filepath, JSON.stringify(jsOut));
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
			testStart = require(t.test).main;
		}
		function testEnd(res) {
			res.index = testIndex;
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
