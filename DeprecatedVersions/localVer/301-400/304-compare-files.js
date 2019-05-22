const common = require('../common.js');
var jsdiff = require('diff');
//require('colors');
//var textDiff = require('text-diff');

const fs = common.fs;
const path = common.path;
const getDirectories = common.getDirectories;
const determineIfFile = common.determineFileDir;

const expect = common.expect;

function findDifference(file1, file2, contentOnly, callback) {
	var results = {
		"file1":file1,
		'file2':file2,
		'file1Length':0,
		'file2Length':0
	}
	var file1Contents, file2Contents, diff;

	file1Contents = fs.readFileSync(file1, 'utf-8');
    file2Contents = fs.readFileSync(file2, 'utf-8');

	diff = jsdiff.diffChars(file1Contents, file2Contents);
	
	var thisCount, num;
	diff.forEach(function(part) {
		if ( contentOnly ) {
			num = (part['value'].match(/\r?\n/g)||'').length;
			thisCount = part['count'] - num;
		} 
		else thisCount = part['count'];
		if (part['added']) results['file2Length'] += thisCount;
		else if (part['removed']) results['file2Length'] -= thisCount;
		else {
			results['file1Length'] += thisCount;
			results['file2Length'] += thisCount;
		}
	});
	//process.stdout.write(results['file1Length']);
	results['data'] = diff;
	//console.log(results);
	callback(results);
}

function main(title, variables, statement, errorMessage, hints) {

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

	var errorStatement = (errorMessage.length > 0) ? errorMessage : ': Similarity rate between two file contents was too low!' ;
	var itStatement = (statement.length > 0) ? statement : 'Expect an ' + (similarity*100) + '% similarity between two file contents';
	var hintsStatement = '';

	var conditions = true, conditionsErrorMessage, queue = [];

	describe(title, function() {
		before(function(done) {
			determineIfFile(file1, res1=>{
				if (res1 == 0) {
					conditions = false;
					conditionsErrorMessage = 'File 1 is not a file...';
					done();
				}
				else if (res1 == 1) {
					determineIfFile(file2, res2=>{
						if (res2 == 0) {
							conditions = false;
							conditionsErrorMessage = 'File 2 is not a file...';
							done();
						}
						else if (res2 == 1) {
							findDifference(file1, file2, contentOnly, diffRes=>{
								queue.push({
									'file':file1,
									'rate':diffRes['file1Length']/diffRes['file2Length']
								});
								if ( diffRes['file1Length']/diffRes['file2Length'] < similarity ) hintsStatement += 'Similarity Rate: ' + (diffRes['file1Length']/diffRes['file2Length']) + '\nExpected Similarity Minimum: ' + similarity;
								done();
							});
						} else {
							conditions = false;
							conditionsErrorMessage = 'determineIfFile() for File 2 never returned anything';
							done();
						}
					});
				} else {
					conditions = false;
					conditionsErrorMessage = 'determineIfFile() for File 1 never returned anything';
					done();
				}
			});
		});

		it(itStatement, function() {
			expect(conditions, conditionsErrorMessage).to.be.true;
			if (conditions) {
				queue.forEach(function(d) {
					expect(d['rate']*100, d['file']+errorStatement).to.be.at.least(similarity*100);
					//console.log(d['rate']);
					//console.log(similarity)
				});
			}
		});

		afterEach(function(done) {
			if ( conditions && hintsStatement.length > 0 ) this.currentTest.context = { "title":"Hints", "value":"The similarity rate between the two files is too low:\n"+hintsStatement}
			done();
		});
	});
}


exports.main = main;