const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');


const isDirectory = source => fs.lstatSync(source).isDirectory()
const getChildrenDirectories = source =>
  fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory)

/*
This application takes *3* environmental variables:
1. TESTS* = the file path to the .json file that contains all of our tests - NECESSARY
2. SINGLEDIR = the directory path to where the tests should look at - used only if looking at 1 submission, overwritten if SUBMISSIONS is set
3. SUBMISSIONS = the directory containing all the submissions the tests should look at 
	- overwrites TESTDIR if used, as SUBMISSIONS is meant for multiple submissions
*/

var tests = process.env.TESTS;
var singleDirectory = ( process.env.SINGLEDIR && typeof process.env.SINGLEDIR === "string" ) ? process.env.SINGLEDIR : false;
var submissionsDirectory = ( process.env.SUBMISSIONS && typeof process.env.SUBMISSIONS === "string" ) ? process.env.SUBMISSIONS : false;

/* ---------------------------- */
/* --- Helper Functions --- */

function createCommand(tests,directoryToTest) {
	var directoryToTest = (directoryToTest) ? directoryToTest + '/' : path.dirname(tests) + '/' ;
	// directoryToTest = the location of our test submission; If 'directoryToTest' is not given, we use the same location as 'tests' as our test location
	var cmdString = "env TESTS="+tests+" DIR="+directoryToTest+" mocha --timeout 20000 --reporter node_modules/mochawesome/dist/mochawesome.js --reporter-options showPending=false,enableCode=false,reportDir="+directoryToTest+"/testReport/,reportFilename=report,charts=false runner.js"
	// the command line to execute for our test - the results of our test are put inside 'directoryToTest'
	var cmd = {
		dir: directoryToTest,
		command: cmdString
	};
	return cmd;
}

function test(cmd) {
	return new Promise(resolve=>{
		var child = exec(cmd.command, (error, stdout, stderr)=>{
			if (error) resolve({ testDir: cmd.dir, result: false });
			else resolve({ testDir: cmd.dir, result: true });
		});
	});
}

async function performTests(cmds) {
	await Promise.all(cmds.map(test))
		.then(results => {
			var finalResults = {
				successes:[],
				failures:[]
			}
			results.forEach(res=>{
				if (res.result) finalResults.successes.push(res.testDir)
				else finalResults.failures.push(res.testDir);
			})
			console.log(finalResults);
		})
		.catch(e => {console.log(e)});
}

/* ---------------------------- */
/*
How the process works:
If SUBMISSIONS is set, then we'll need to look at a bunch of submissions - otherwise, we're looking at a single submission
In the case of a single submission (aka submissionsDirectory == false), we just run a single command
	this single command must pay attention to whether singleDirectory is set or not
	if set, then we use that - otherwise, we use the directory of 'tests.json' by default
In the case of multiple submissions, we have a more complicated set of processes:
	1) we push the immediate children directories of whatever directory is defined by submissionsDirectory into commandQueue
	2) We perform tests on each of those children directories
	3) END PROCESS 0
*/

if (submissionsDirectory) {
	var dirs = getChildrenDirectories(submissionsDirectory);
	if (dirs.length == 0) {
		console.log('No submissions detected within the directory path given by SUBMISSIONS');
		process.exit(0);
	} else {
		var commandQueue = dirs.map(dir => { return createCommand(tests,dir); });
		performTests(commandQueue).then(()=>{
			console.log('* All Tests Completed *');
			process.exit(0);
		});
	}
} else {
	var singleCommand = (singleDirectory) ? createCommand(tests,singleDirectory) : createCommand(tests);
	var child = exec(singleCommand.command, (error, stdout, stderr)=>{
		if (error) {
			console.log("\nErrors detected\n");
			console.log(error);
			process.exit(1);
			
		} else {
			console.log("\nWell Done!\n");
			process.exit(0);
		}
	});
}