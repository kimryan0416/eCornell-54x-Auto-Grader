const common = require('../common.js');
var jsdiff = require('diff');

const fs = common.fs;
const path = common.path;
const escapeHTML = common.escapeHTML;

function main(name, custom_title, custom_message, variables, done) {

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

	var stats1, stats2, conditionsMessage;
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

	try {
		stats1 = fs.lstatSync(file1);
		stats2 = fs.lstatSync(file2);
		if (!stats1.isFile() || !stats2.isFile()) {
			throw new Error('One or both of the provided filepaths are not files.');
		}
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

		done({
			name: name,
			title: testTitle,
			success: (results.diff*100) >= (similarity*100),
			message: testMessage,
			console_message: testMessage
		});

	} catch (err) {
		if (!testMessage) testMessage = err;
		done({
			name: name,
			title: testTitle,
			success: false,
			message: testMessage,
			console_message: testMessage
		});
	}

}

exports.main = main;