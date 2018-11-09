const common = require('../common.js');
var jsdiff = require('diff');
var cssbeautify = require('cssbeautify');
var html = require('html');
//require('colors');
//var textDiff = require('text-diff');

const fs = common.fs;
const path = common.path;
const getDirectories = common.getDirectories;
const determineFileOrDir = common.determineFileOrDir;

const expect = common.expect;

function findDifference(file, indBool, callback) {
	var results = {
		"file":file,
		'file1Length':0,
		'file2Length':0
	}
	var child, file1, file2, diff;
	var ext = path.extname(file);

	file1 = fs.readFileSync(file, 'utf-8');
	if (ext == '.html') file2 = html.prettyPrint(file1);
    else if (ext == '.css') file2 = cssbeautify(file1);
    else file2 = file1;

	diff = jsdiff.diffChars(file1, file2);
	//var diff = jsdiff.diffLines(html1, html2, {'ignoreWhitespace':false,'newlineIsToken':true});
	//diff.forEach(function(part){
		// green for additions, red for deletions
		// grey for common parts
	//	var color = part.added ? 'green' :
	//	part.removed ? 'red' : 'grey';
	//	process.stderr.write(part.value[color]);
	//});
	//var diff = new textDiff(); // options may be passed to constructor; see below
	//var newTextDiff = diff.main(html1, html2); // produces diff array
	//diff.cleanupSemantic(newTextDiff);
	//var levenshtein = diff.levenshtein(newTextDiff);
	var thisCount, num;
	diff.forEach(function(part) {
		if ( indBool ) {
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
	results['data'] = diff;
	callback(results);
}

function main(title, variables, statement, errorMessage, hints) {

	var thisPath = variables['PATH'];
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
	var indentationOnly = ( variables['INDENTATION_ONLY'] != null && typeof variables['INDENTATION_ONLY'] === 'boolean' ) ? variables['INDENTATION_ONLY'] : false;
	var filetypes = ( variables['FILETYPES'] != null ) ? ( variables['FILETYPES'].constructor === Array ) ? variables['FILETYPES'] : ( typeof variables['FILETYPES'] === 'string' ) ?  new Array(variables['FILETYPES']) : ["html","css"] : ["html","css"];

	var errorStatement = (errorMessage.length > 0) ? errorMessage : ': Similarity rate between submitted and suggested code formats was too low!' ;
	var itStatement = (statement.length > 0) ? statement : 'Expect an ' + (similarity*100) + '% similarity between submitted and suggested code formatting';
	var hintsStatement = '';

	var conditions = true, conditionsErrorMessage, queue = [];

	describe(title, function() {
		before(function(done) {
			determineFileOrDir(thisPath, res=>{
				if (res == 0) {
					conditions = false;
					conditionsErrorMessage = 'Path is not a file or directory...';
					done();
				}
				if (res == 2) {
					getDirectories(thisPath, (err, files)=>{
						if (err) {
							conditions = false;
							conditionsErrorMessage = 'wrong with glob getting files';
							done();
						}
						files = files.filter(function(file) {
							if ( filetypes.indexOf(path.extname(file).replace('.', '')) > -1 ) return file;
						});

						files.forEach(function(thisFile) {
							findDifference(thisFile, indentationOnly, diffRes=>{
								queue.push({
									'file':thisFile,
									'rate':diffRes['file1Length']/diffRes['file2Length']
								});
								if ( diffRes['file1Length']/diffRes['file2Length'] < similarity ) hintsStatement += '- ' + thisFile + '\n';
							});
						});
						conditions = true;
						done();
					});
				} else if (res == 1) {
					findDifference(thisPath, indentationOnly, diffRes=>{
						queue.push({
							'file':thisPath,
							'rate':diffRes['file1Length']/diffRes['file2Length']
						});
						if ( diffRes['file1Length']/diffRes['file2Length'] < similarity ) hintsStatement += '- ' + thisPath + '\n';
						done();
					});
				} else {
					conditions = false;
					conditionsErrorMessage = 'determineFileOrDir never returned anything';
					done();
				}
			});
		});

		it(itStatement, function() {
			expect(conditions, conditionsErrorMessage).to.be.true;
			if (conditions) {
				queue.forEach(function(d) {
					expect(d['rate']*100, d['file']+errorStatement).to.be.at.least(similarity*100);
				});
			}
		});

		afterEach(function(done) {
			if ( conditions && hintsStatement.length > 0 ) this.currentTest.context = { "title":"Hints", "value":"The following files must have their formatting and/or indentation improved:\n"+hintsStatement}
			done();
		});
	});
}


exports.main = main;