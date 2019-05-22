const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');

const optionMaps = {
	'true':true,
	'1':true,
	'false':false,
	'0':false
};

var processPath = process.env.TESTS;
var testContents;

try {
	testContents = JSON.parse(fs.readFileSync(processPath));
} catch(err) {
	process.stdout.write(err);
	process.exit(1);
}

const pathToTests = path.dirname(processPath);
const name = (testContents.name != null) ? testContents.name : 'CIS54x Autograder';
const tests = testContents.tests;
const options = (testContents.options != null) ? testContents.options : {};

const reporter = (options.reporter != null) ? options.reporter : ".guides/cis54x/myReporter.js";
const silent = (options.silent != null) ? (typeof options.silent === 'boolean') ? options.silent : ( Object.keys(optionMaps).indexOf(options.silent) > -1 ) ? optionMaps[options.silent] : false : false;
const consoleSilent = (options.consolesilent != null) ? (typeof options.consolesilent === 'boolean') ? options.consolesilent : ( Object.keys(optionMaps).indexOf(options.consolesilent) > -1 ) ? optionMaps[options.consolesilent] : false : false;
const htmlToggle = (options.savehtml != null) ? (typeof options.savehtml === 'boolean') ? options.savehtml : ( Object.keys(optionMaps).indexOf(options.savehtml) > -1 ) ? optionMaps[options.savehtml] : true : true;
const jsonToggle = (options.savejson != null) ? (typeof options.savejson === 'boolean') ? options.savejson : ( Object.keys(optionMaps).indexOf(options.savejson) > -1 ) ? optionMaps[options.savejson] : true : true;
const saveDir = (options.savedir != null) ? options.savedir+'/' : 'testReport/';
const saveName = (options.savename != null) ? options.savename : 'report';
const timeout = (options.timeout != null) ? parseInt(options.timeout) : 20000;

const reportDir = path.normalize(pathToTests+'/'+saveDir+'/');
const reporter_options_string = 'name="'+String(name)+'",silent='+silent+',consoleSilent='+consoleSilent+',savehtml='+htmlToggle+',savejson='+jsonToggle+',reportDir="'+reportDir+'",reportName="'+saveName+'"';

var command = "env TESTS="+processPath+" mocha --reporter "+reporter+" --timeout "+timeout+" --reporter-options "+reporter_options_string+" .guides/cis54x/runner.js";
var child = exec(command, (error, stdout, stderr)=>{
	if (!silent) process.stdout.write(stdout);
	if (stderr) process.exit(1);
	else process.exit(0);
});