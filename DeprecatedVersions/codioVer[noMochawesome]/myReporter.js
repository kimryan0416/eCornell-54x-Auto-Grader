// myReporter.js
var mocha = require('mocha');
var fs = require('fs');
var path = require('path');
var getDirName = require('path').dirname;
var mkdirp = require('mkdirp');

module.exports = MyReporter;

function createFile(path, contents, callback) {
	mkdirp(getDirName(path), function (err) { 
		if (err) callback(err);
		else fs.writeFile(path, contents, 'utf8', callback); 
	});
}

function passFilter(out,pass) {
	out += '<p style="margin:0;border-bottom:1px solid rgb(230,230,230);font-size:12px;padding-top:2px;padding-bottom:2px;"><span style="font-weight:bold;">&#x2714;</span> '+pass+'</p>';
	return out;
}

function failFilter(out,fail) {
	var outputMessage = '', toggable = false;
	var outputReplacements = {
		'{{pre}}':'margin-bottom:15px;font-size:12px;word-wrap:break-word;overflow-wrap:break-word;white-space:pre-wrap;',
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
	var output = (toggable) ? "<div style='margin-bottom:60px;'><p style='{{p}}'><span style='font-weight:bold;'>&#33;</span> {{title}}</p><div style='box-sizing: border-box;padding-left:5px;border-left:1px solid rgb(230,230,230);margin-bottom:15px;'>{{message}}</div></div>" : "<div style='margin-bottom:60px;'><p style='{{p}}'><span class='bold'>&#33;</span> {{title}}</p><div class='test_content'>{{message}}</div></div>";
	var newOut = output.replace(/{{.*?}}/g, function(match){
		return replace[match];
	});
	return out += newOut;
}

function MyReporter(runner, runnerOptions) {

    mocha.reporters.Base.call(this, runner);

    // all are defaulted to true
    const optionMaps = {
    	'true':true,
    	'1':true,
    	'false':false,
    	'0':false
    };
    
    const OPTIONS = (runnerOptions.reporterOptions != null) ? runnerOptions.reporterOptions : {};
    
    const NAME = (OPTIONS.name != null) ? OPTIONS.name : "CIS54x Autograder";
    const SILENT = (OPTIONS.silent != null) ? (typeof OPTIONS.silent === 'boolean') ? OPTIONS.silent : ( Object.keys(optionMaps).indexOf(OPTIONS.silent) > -1 ) ? optionMaps[OPTIONS.silent] : false : false;
    const CONSOLE_SILENT = (OPTIONS.consoleSilent != null) ? (typeof OPTIONS.consoleSilent === 'boolean') ? OPTIONS.consoleSilent : ( Object.keys(optionMaps).indexOf(OPTIONS.consoleSilent) > -1 ) ? optionMaps[OPTIONS.consoleSilent] : false : false;
    const SAVEHTML = (OPTIONS.savehtml != null) ? (typeof OPTIONS.savehtml === 'boolean') ? OPTIONS.savehtml : ( Object.keys(optionMaps).indexOf(OPTIONS.savehtml) > -1 ) ? optionMaps[OPTIONS.savehtml] : true : true;
    const SAVEJSON = (OPTIONS.savejson != null) ? (typeof OPTIONS.savejson === 'boolean') ? OPTIONS.savejson : ( Object.keys(optionMaps).indexOf(OPTIONS.savejson) > -1 ) ? optionMaps[OPTIONS.savejson] : true : true;
    const REPORTDIR = (OPTIONS.reportDir != null) ? OPTIONS.reportDir+'/' : './testReport/';
    const REPORTNAME = (OPTIONS.reportName != null) ? OPTIONS.reportName : "report";

    var tests = [];
    var passes = [];
    var failures = [];

    runner.on('start',function() {
    	if (!CONSOLE_SILENT) process.stdout.write('\n=== \"'+NAME+'\": Test Results: ===\n\n');
    });
    
    runner.on('pass', function(test) {
      passes.push(test.title);
      tests.push(test);

      if (!CONSOLE_SILENT) process.stdout.write('PASS: '+test.title+'\n\n');
    });
    runner.on('fail', function(test, err) {
      var f = {
        title: test.title
      };
      var subMes = err.message.substring(0,err.message.lastIndexOf(':'));
      try {
        f.message = JSON.parse(subMes);
      } catch(e) {
        f.message = subMes;
      }
      failures.push(f);
      tests.push(test);

      if (!CONSOLE_SILENT) process.stdout.write('FAIL: '+test.title+'\n'+subMes+'\n\n');
    });

    runner.on('end', function() {

      if (!CONSOLE_SILENT) {
        var tot = passes.length + failures.length;
        process.stdout.write('=== TEST END: '+passes.length+'/'+tot+' ===\n');
      }
 
      var template = fs.readFileSync(".guides/cis54x/myReporter_TEMPLATE.html", "utf8");
      var passOutput = (passes.length > 0) ? passes.reduce(passFilter,'') : '<p><span style="font-weight:bold;">[&#33;]</span> No tests passed.</p>';
      var failOutput = (failures.length > 0 ) ? failures.reduce(failFilter,'') : '<p style="margin:0;width:100%;text-align:center;">No tests failed. Congratulations!</p>';
      var replacements = {
        "{{NUM_PASSES}}": passes.length,
        "{{NUM_TOTAL}}": passes.length+failures.length,
        "{{PASS_OUTPUT}}": passOutput,
        "{{FAIL_OUTPUT}}": failOutput
      };
      var body = template.replace(/{{.*?}}/g, function(match){ return replacements[match] });
      if (!SILENT) process.stdout.write(body);

      if (SAVEHTML) {
        var html = '<!DOCTYPE html><html lang="en"><head><title>"Mocha Test"</title><meta charset="UTF-8">'+
            //'<meta http-equiv="refresh" content="20">'+
            '<style type="text/css">html,body{margin:0;padding:0;}</style></head><body>{{BODY}}</body></html>';
            html = html.replace(/{{BODY}}/g, body);

            var htmlPath = path.normalize(REPORTDIR+'/'+REPORTNAME+'.html');
            createFile(htmlPath, html, (err)=>{ if (err) process.stdout.write(err); });
      }

      if (SAVEJSON) {
        var jsOut = {
          num_passes: passes.length,
          fail_passes: failures.length,
          passes: passes,
          failures: failures
        };
        var jsPath = path.normalize(REPORTDIR+'/'+REPORTNAME+'.json');
        createFile(jsPath, JSON.stringify(jsOut), (err)=>{ if (err) console.log(err); });
      }

    
      if (failures.length > 0) process.stderr.write('Error');

    });

}