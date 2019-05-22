const common = require('../common.js');
var jsdiff = require('diff');

const fs = common.fs;
const path = common.path;
const getDirectories = common.getDirectories;
const determineFileOrDir = common.determineFileOrDir;
const escapeHTML = common.escapeHTML;

const expect = common.expect;

function main(name, custom_title, custom_message, variables, custom_hints = null) {

	var file1 = variables['CHECK_PATH'];
	var file2 = variables['TRUE_PATH'];
	var similarity;
	if ( variables['SIMILARITY'] != null ) {
		if ( typeof variables['SIMILARITY'] === 'number' || typeof variables['SIMILARITY'] === 'string' ) {
			if ( typeof variables['SIMILARITY'] === 'number' ) {
				if ( parseInt(variables['SIMILARITY']) == 0 ) similarity = variables['SIMILARITY'];
				else similarity = variables['SIMILARITY'] / 100;
			} else {
				if ( variables['SIMILARITY'].includes('%') )  {
					var temp = variables['SIMILARITY'].replace('%','');
					// If the given string is NOT a digit-based value, we default once again
					similarity = ( /^[0-9.]+$/.test(temp) ) ? Number(variables['SIMILARITY'].replace('%','')) / 100 : 0.75;
				}
				else {
					if ( /^[0-9.]+$/.test(variables['SIMILARITY']) ) similarity = ( parseInt(Number(variables['SIMILARITY'])) == 0 ) ? Number(variables['SIMILARITY']) : Number(variables['SIMILARITY'])/100;
					else similarity = 0.75;	// If the given string is NOT a digit-based value, we default once again
				}
			}
		} 
		else similarity = 0.75;	// Default to 0.75 if the given "SIMILARITY" parameter is neither an number or string;
	} 
	else similarity = 0.75;	// Default to 0.75 if no "SIMILARITY" parameter was given
	var contentOnly = ( variables['CONTENT_ONLY'] != null && typeof variables['CONTENT_ONLY'] === 'boolean' ) ? variables['CONTENT_ONLY'] : false;

	var testTitle = (custom_title) ? escapeHTML(custom_title) : 'Expect an ' + (similarity*100) + '% similarity between submitted and suggested code formatting';
	var testMessage = (custom_message) ? escapeHTML(custom_message) : null ;

	var conditions = false, conditionsMessage;
	var results = {
		'original':file1,
		'solution':file2,
		'original_code':null,
		'solution_code':null,
		'data':null,
		'original_length':0,
		'solution_length':0,
		'diff':null
	};;

	describe(name, function() {
		before(function(done) {
			try {
				const stats1 = fs.lstatSync(file1);
				const stats2 = fs.lstatSync(file2);

				if (stats1.isFile() && stats2.isFile()) {
					conditions = true; // This is a file or a directory;
					try {
						results.original_code = fs.readFileSync(results.original,'utf-8');
						results.solution_code = fs.readFileSync(results.solution,'utf-8');
				
						if (contentOnly) {
							results.original_code = results.original_code.replace(/[\n\r\t]/g,'');
							results.solution_code = results.solution_code.replace(/[\n\r\t]/g,'');
						}

						results.data = jsdiff.diffChars(results.original_code, results.solution_code);
						results.data.forEach(function(part) {
							let thisCount = part['count'];
							if (part['added']) results.solution_length += thisCount;
							else if (part['removed']) results.solution_length -= thisCount;
							else {
								results.original_length += thisCount;
								results.solution_length += thisCount;
							}
						});
						results.diff = (results.original_length>results.solution_length) ? results.solution_length/results.original_length : results.original_length/results.solution_length;
						if (results.diff < similarity && !testMessage) testMessage = "Similarity rate: "+(Math.round(results.diff*100))+"%\n- Similarity rate between submitted and solution code formats was too low!\n- Check to make sure instructions have been followed\n- Check for HTML errors";
					} catch(err) {
						if (!testMessage) testMessage = 'Could not read either original or solution file';
					}
				} 
				else conditionsMessage = "One or both of the provided filepaths are not files.";
			} catch (err) {
				conditionsMessage = "The provided filepaths returned error(s) with Node FS.";
			}
			done();
		});

		it(testTitle, function() {
			expect(conditions, conditionsMessage).to.be.true;
			if (conditions) {
				expect(results.diff*100, testMessage).to.be.at.least(similarity*100);
			}
		});
	});
}


exports.main = main;