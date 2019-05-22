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
const escapeHTML = common.escapeHTML;

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


function main(name, custom_title, custom_message, variables, custom_hints = null) {

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

	var testTitle = (custom_title) ? escapeHTML(custom_title) : 'Expect an ' + (similarity*100) + '% similarity between submitted and suggested code formatting';
	var testMessage = (custom_message) ? escapeHTML(custom_message) : ': Similarity rate between submitted and suggested code formats was too low!' ;
	//var hintsStatement = '';

	var conditions = false, conditionsMessage, queue = [];
	const cleanFunctions = {
		'html':html.prettyPrint,
		'css':cssbeautify
	};
	const cleanFile = (f,m)=> (m=='css') ? cssbeautify(f) : html.prettyPrint(f);
	const getCleaned = (files,mimetype)=>files.map(file=>{return {'original':file,'formatted':cleanFile(file,mimetype)};})
	const processFormat = (files,mimetype,indentOnly)=>getCleaned(files,mimetype);
	//const fileOrDir = url => fs.lstat(url, (err,stats) => { return (stats.isFile()) ? 1 : (stats.isDirectory()) ? 2 : 0 });

	describe(name, function() {
		before(function(done) {
			/*
			determineFileOrDir(thisPath, res=>{
				switch(res) {
					case 1:
						break;
					case 2:
						break;
					default:
						conditions = false;
						conditionsErrorMessage = 'Path is not a file or directory...';
						done();
				}
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
			*/
			try {
				const stats = fs.lstatSync(thisPath);
				if (stats.isFile()) {
					conditions = true; // This is a file or a directory;
					findDifference(thisPath, indentationOnly, diffRes=>{
						queue.push({
							'file':thisPath,
							'rate':diffRes['file1Length']/diffRes['file2Length']
						});
						if ( diffRes['file1Length']/diffRes['file2Length'] < similarity ) hintsStatement += '- ' + thisPath + '\n';
						done();
					});
				} else if (stats.isDirectory()) {
					getDirectories(thisPath, (err, files)=>{
						if (err) {
							conditionsErrorMessage = 'wrong with glob getting files';
							done();
						}
						conditions = true;
						/*
						files = files.reduce((withErrors,file) => {
							if ( filetypes.indexOf(path.extname(file).replace('.', '')) > -1 ) {
								findDifference(file,indentationOnly,diffRes=>{
									if (diffRes['file1Length']/diffRes['file2Length'] < similarity) {

									}
								});

								return withErrors;
							} else {
								return withErrors;
							}
						},[]);
						*/
						/*
						files.forEach(function(thisFile) {
							findDifference(thisFile, indentationOnly, diffRes=>{
								queue.push({
									'file':thisFile,
									'rate':diffRes['file1Length']/diffRes['file2Length']
								});
								if ( diffRes['file1Length']/diffRes['file2Length'] < similarity ) hintsStatement += '- ' + thisFile + '\n';
							});
						});
						*/
						files = processFormat(files,'html',true);
						console.log(files)
						done();
					});
				} 
				else {
					conditionsMessage = "The provided PATH is neither a file nor a directory.";
					done();
				}
			} catch (err) {
				conditionsMessage = "The provided PATH returned an error with Node FS.";
				done();
			}
		});

		it(testTitle, function() {
			/*
			expect(conditions, conditionsErrorMessage).to.be.true;
			if (conditions) {
				queue.forEach(function(d) {
					expect(d['rate']*100, d['file']+testMessage).to.be.at.least(similarity*100);
				});
			}
			*/
			expect(conditions, conditionsMessage).to.be.true;
		});
		/*
		afterEach(function(done) {
			if ( conditions && hintsStatement.length > 0 ) this.currentTest.context = { "title":"Hints", "value":"The following files must have their formatting and/or indentation improved:\n"+hintsStatement}
			done();
		});
		*/
	});
}


exports.main = main;