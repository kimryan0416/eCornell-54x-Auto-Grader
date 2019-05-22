/* --- require() Definitions --- */
const gradingPrepare = require("./gradingPrepare/gradingPrepare.js");		/* gets the readJSON function that returns the contents of a JSON file */
const validate = require("./validate/validate.js");			/* contains the validator functions that checks whether if a file, HTML or CSS, is validated */
const findFiles = require("./findFiles.js");		/* contains the functions that check if certain files that are necessary are present or not */
const inline = require('./inline.js');

const fs = require("fs");							/* file interpretation is required */
const util = require('util');							/* required to write grades to our "grades.json" file */
const glob = require("glob");							/* glob function that is used to detect all files inside each student's submission */
const path = require('path');
const ncp = require('ncp');
const emptyFolder = require('empty-folder');

/* --- We define certain constants and variables - in this case, the URL's that lead to important directories and/or files --- */
var assignment_url, studentSubmissions, testSubmissionLocation, sampleSubmissionLocation, assignment_details_url;
const config_url = "logistics/config.json";
const students_url = "logistics/students.json";

/* --- Misc. Function Declaration --- */
const getDirectories = (src, callback) => {
	glob(src + "/**/*", callback);
}


/* 
// ------------------------------------------------------------
// Step 2: Prepare to Grade Each Student
// 	Once we've gotten our 3 important files, we need to initialize the grading of students
//	To do so, we must do several things:
//		1) create a 'grades' array that'll contain all of our grades for our students for this assignment
//		2) create an 'errorStudents' array that'll contain students whose submissions couldn't make it through the whole round of grading and must be looked at by the teacher/TA
// 		3) initialize a 'student' var that'll contain our student's info for each round of the loop
//		4) initialize a 'studentSubmissionURL' that'll contain the submission url for each student - changes every time we move our files to the 'testSubmission' folder
//		4) Run through the loop - each iteration of the loop runs through the function 'gradeStudent()'
// Required functions/dependencies:
//		- none
// ------------------------------------------------------------
*/
function prepareGrades(students, config, details, callback) {
	console.log ("\x1b[34m%s\x1b[0m","Allocating initial point values to each student's grades...");
	console.log("");
	
	/*
	// ------------------------------
	// Step 2.1-3: Define our Variables
	// ------------------------------
	*/
	var grades = [];
	var errorStudents = [];
	var student, studentSubmissionURL;
	
	/*
	// ------------------------------
	// Step 2.4: Commence our Loop
	// ------------------------------
	// We'll be using another synchronous loop here!
	// Each iteration of the loop runs through 'gradeStudent()', which is a function that grades each student
	*/
	var initializeStudentGrade = function(index) {
			if (index < students.length) {
				var student = students[index];
				/* This is where Step 3 comes into play */
				gradeStudent(student, config, details, (err, message, grade = null)=>{
					if (err) {
						if (err == 1 || err == 2) {
							return console.log(message);
						} else if (err == 3) {
							errorStudents.push(student);
							console.log("Student "+student['id']+" sent to Error log - must be checked");
							initializeStudentGrade(index+1);
						}
					} else {
						console.log("Student "+student['id']+ " Grade:");
						console.log(grade);
						initializeStudentGrade(index+1);
					}
				});
			} else {
				callback();
			}
	}
	initializeStudentGrade(0);
}


/* 
// ------------------------------------------------------------
// Step 3: GRADE Each Student
//	We'll now iterate through each student
//	We need to do some things first:
//		1) Empty the 'testSubmission' folder to prevent overlap in submissions
//				- If the 'testSubmission' folder couldn't be emptied properly, we'll return an error and end grading prematurely until it is solved
//		2) Copy the student's submission to a test folder 'testSubmission' within our own root folder
//				- If a student's submission folder is missing, we'll create a new folder
//				- If the student's submission couldn't be moved to 'testSubmission', we push the student into 'errorStudents' and move onto the next student
//				- If the 'testSubmission' folder is empty after moving all the files.... then we got a person with 0 as their grade
//		3) Glob all of the student's files to find out what the student has submitted
//		4) Detect where the root of the student's web files are
//		5) Find Necessary Files
//
// Required functions/dependencies:
//		- ncp: a dependency that makes it easy to mass-move files around
//		- emptyFolder: a dependency that makes it easy to empty folders, particularly our 'teestSubmission' folder every time we grade a new student
// ------------------------------------------------------------
*/
function gradeStudent(student, config, details, callback) {
	var rootDirectory = null;
	var rootDirectoryFile = ( (details['details']['rootFile'] == null) || (details['details']['rootFile'] == '') ) ? null : details['details']['rootFile'];
	var foundDirectory = null;

	console.log("\x1b[37m%s\x1b[0m","Grading Student " + student["id"]);

	/*
	// ------------------------------
	// Step 3.1: Empty the 'testSubmission' Folder
	// ------------------------------
	// Errors are returned and grading ends prematurely if the folder couldn't be emptied properly...
	*/
	emptyFolder(testSubmissionLocation, false, (emptied)=>{
		if (emptied.error) return callback(1, "'"+testSubmissionLocation+"' could not be emptied - ending grading prematurely...");
		else if (emptied.failed.length > 0) return callback(2, "Some files could not be emptied within '"+testSubmissionLocation+"' - ending grading prematurely...");

		/*
		// ------------------------------
		// Step 3.2: Populate the 'testSubmission Folder' with a copy of the student's submission
		// ------------------------------
		// If a student doesn't have a submission folder, we create one for him/her
		// If we couldn't move a student's submission for some reason, we push the student into 'errorStudents' and move to the next student
		*/
		fs.exists(studentSubmissions+student['id']+"/", (exists)=>{
			if (!exists) fs.mkdirSync(studentSubmissions+student['id']+"/");

			ncp(studentSubmissions+student['id']+"/", testSubmissionLocation, err=>{
				if (err) return callback(3, "Student "+student['id']+" submission could not be moved!");

				/*
				// ------------------------------
				// Step 3.3: Glob
				// ------------------------------
				// If we couldn't glob the student's submission, we return an error
				*/
				getDirectories(testSubmissionLocation, (err, files)=>{
					if (err) return callback(3, "Student "+student['id']+" submission could not be globbed!");
					else if (files.length == 0) return callback(null, "Student "+student['id']+ " did not submit any files!", null);

					/*
					// ------------------------------
					// Step 3.4: Root folder detection
					// ------------------------------
					// Students sometimes separate their website files and non-website files by putting their webfiles into a subdirectory
					// That means if we try to look for 'styles/all.css' and the student actually has it under 'website/styles/all.css', then we might get a false positive
					// In our 'details', we defined a particular value called 'RootFile' - this value tells us which file we should consider to be located inside our 'root'
					// If this value is set to null or '', or if the 'rootFile' could not be detected, then we assume 'testSubmission' is the root instead - we tell that by setting it to null (for a very particular reason);
					*/
					findFiles.findWebRoot(files, rootDirectoryFile, (found)=>{
						if (found == null) rootDirectory = '';	/* If the find() function couldn't locate the root file inside the submission, it defaults to '' */
						else {
							/* We get the 'rootDirectory' by getting the found root file's directory and getting rid of the 'testSubmissionLocation' part of it, since all paths are absolute*/
							rootDirectory = path.dirname(found) + "/";
							//rootDirectory = foundDirectory.replace(testSubmissionLocation, '');
						}
						//console.log("Student " + student['id'] + "'s root directory is:\n\"" + rootDirectory + "\"");

						/*
						// ------------------------------
						// Step 3.5: Find necessary files
						// ------------------------------
						// If we find an instance of misplaced files, we will record them
						// If any of the necessary files we find are missing any necessary parts, we'll have to record that too
						// If any of the necessary files we find contain any parts that we deemed that they SHOULDN'T have contained, we also record that
						*/
						findFiles.findNecessary(files, details['files'], rootDirectory, (err, present, misplaced, missing)=>{
							if (err) return callback(3, "Student "+student['id']+ ' submission could not be checked for necessary files');
							console.log("Present Files:");
							console.log(present);
							console.log("Misplaced Files:");
							console.log(misplaced);
							console.log("Missing Files:");
							console.log(missing);

					
							validate.validateHTMLFiles(testSubmissionLocation+rootDirectory, config['validation'], (html_val_errors)=>{

								console.log("HTML Validation Errors:");
								console.log(html_val_errors);

								validate.detectIndentHTML(files, config['best_practices'], (html_indent_errors)=>{

									console.log("HTML Indentation Errors");
									console.log(html_indent_errors);

									validate.validateCSSFiles(testSubmissionLocation+rootDirectory, config['validation'], css_val_errors=>{
										
										console.log("CSS Validation Errors:");
										console.log(css_val_errors);

										validate.detectIndentCSS(files, config['best_practices'], css_indent_errors=>{

											console.log("CSS Indentation Errors");
											console.log(css_indent_errors);

											inline.checkInline(files, config['inline'], (inline_err, inline_errors)=>{

												console.log("Inline checking:");
												console.log(inline_errors);

												return callback(null, null, null);
											});
										});
									});
								});
							});
						});
					});
				});
			});
		});
	});
}




/* 
// ------------------------------------------------------------
// Step 1: Get All Necessary Logistical Files
// We need to check for 3 important files/directories:
//		1) ./logistics/config.json : this file contains info on how points should be removed, whether to go with certain tests, etc.
//		2) ./logistics/students.json : this file contains info on all students taking the course
//		3) ./(assignment url)/assignment_details.json : this file contains pretty important information - will be explained later
// 		4) ./(assignment url)/testSubmission/ : this directory is necessary because we'll be moving our files to and from this directory for each student
// Required functions/dependencies:
//		- jsonReader.readJSON()
// ------------------------------------------------------------
*/

/*
// ------------------------------
// Step 1.1: Get our Config File - 'config_url' is defined above
// ------------------------------
*/
gradingPrepare.readJSON(config_url, (config)=>{
	console.log("");
	/* We error-check to make sure that we're actually getting the config file */
	if (config == null) {
		console.log("\x1b[31m%s\x1b[0m","--- The url \"" + config_url + "\" does not lead to a JSON file - please correct and try again ---");
		return;
	}
	console.log ("\x1b[34m%s\x1b[0m","--- Rubric found at \"" + config_url + "\"! ---");
	/*
	// Step 1.2: Set Important Variables - setting up our important variables
	*/
	assignment_url = config['gradingDirectory'];
	studentSubmissions = assignment_url + 'submissions/';
	testSubmissionLocation = assignment_url + "testSubmission/";
	sampleSubmissionLocation = assignment_url + "sampleSubmission/";
	assignment_details_url = assignment_url + "assignment_details.json";

	/*
	// ------------------------------
	// Step 1.3: Get our List of Students - 'students_url' is defined above
	// ------------------------------
	*/
	gradingPrepare.readJSON(students_url, (students)=>{
		/* We error-check to make sure that we're actually getting the file containing our list of students */
		if (students == null) {
			console.log("\x1b[31m%s\x1b[0m","--- The url \"" + students_url + "\" does not lead to the students file - please correct and try again ---");
			return;
		}
		console.log ("\x1b[34m%s\x1b[0m","--- List of Students found at \"" + students_url + "\"! ---");
		
		/*
		// ------------------------------
		// Step 1.4: Get our Assignment Details - 'assignment_details_url' is defined above
		// ------------------------------
		// This is important because the assignment_details.json file tells us several important things:
		// 1) Which files we are expecting to see within each student's submission
		// 2) What kinds of content we're expecting to see within each of those files, if applicable (i.e. 'all.css' must contain...)
		// 3) What kinds of content we're expecting to NOT see within each of those files, if applicable (i.e. the <title> must not contain...)
		// 4) From which file we should consider the "root" - i.e. if the student's core 'index.html' file is located in a subfolder within the submission, we need to make sure we don't forget to consider that when looking for necessary files
		// 5) For each file, should we consider things such as if the location inside the root matters, if we should validate them or not, etc.
		//
		// We do have to go through an additional step: parse through the 'files' array inside our newly-acquired 'details' JS object and make sure that our 'contains' and 'notContains' for each file are arrays of content
		// This is because when we check for necessary files, we also check if those files (if they're found) contain those necessary parts
		// To do so, we have to compare what the student submitted in that file and what the 'details' 'contains' and 'notContains' says not to contain and not contain
		// The easiest to do that is to check for that here, when we're processing the 'details' json object.
		*/
		gradingPrepare.readJSON(assignment_details_url, (details)=>{
			/* We error-check to make sure that we're actually getting the assignment details file */
			if (details == null) {
				console.log("\x1b[31m%s\x1b[0m","--- The url \"" + assignment_details_url + "\" does not lead to the assignment details file - please correct and try again ---");
				return;
			}
			console.log ("\x1b[34m%s\x1b[0m","--- Assignment details found at \"" + assignment_details_url + "\"! ---");

			/* parse through our details 'files' array to make sure 'contains' and 'notContains' for each file is an array or null */
			gradingPrepare.parseAssignmentDetails(details, sampleSubmissionLocation, (newDetails)=>{
				details = newDetails;
				console.log ("\x1b[34m%s\x1b[0m","--- Assignment details parsed through and corrected! ---");

				/*
				// ------------------------------
				// Step 1.5: Check for existence of "testSubmission/" directory
				// ------------------------------
				// If it doesn't exist for some reason, we create it for you!
				*/
				fs.exists(testSubmissionLocation, (exists)=>{
					if (!exists) fs.mkdirSync(testSubmissionLocation);
					
					/*
					// ------------------------------
					// Step 1.6: Initialize Grading
					// ------------------------------
					// 'prepareGrades()' initiates the grading of students by iterating through each student and performing the necessary...
					// ... grading protocols defined within "config" file
					*/
					prepareGrades(students, config, details, (grades)=>{
						console.log(grades);
					});
				});
			});
		});
	});
});

