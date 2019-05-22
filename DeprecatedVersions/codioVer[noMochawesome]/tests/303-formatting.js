const common = require('../common.js');
var jsdiff = require('diff');
var html = require('html');
var indent = require('indent.js');
//require('colors');
//var textDiff = require('text-diff');

const fs = common.fs;
const path = common.path;
const getDirectories = common.getDirectories;
const determineFileOrDir = common.determineFileOrDir;
const escapeHTML = common.escapeHTML;

const expect = common.expect;

/*
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
*/

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
	var filetypes = ( variables['FILETYPES'] != null ) ? ( variables['FILETYPES'].constructor === Array ) ? variables['FILETYPES'] : ( typeof variables['FILETYPES'] === 'string' ) ?  new Array(variables['FILETYPES']) : ["html","css","js"] : ["html","css","js"];

	var testTitle = (custom_title) ? escapeHTML(custom_title) : 'Expect an ' + (similarity*100) + '% similarity between submitted and suggested code formatting';
	var testMessage = (custom_message) ? escapeHTML(custom_message) : {} ;
	//var hintsStatement = '';

	var conditions = false, conditionsMessage, queue;
	//const fileOrDir = url => fs.lstat(url, (err,stats) => { return (stats.isFile()) ? 1 : (stats.isDirectory()) ? 2 : 0 });

	function filter(filtered,file) {
		var extension = path.extname(file).substring(1);
		if ( filetypes.indexOf(extension) > -1 ) {
			var res = {
				'file':file,
				'extension':extension,
				'code':null,
				'formatted':null,
				'data':null,
				'c_length':0,
				'f_length':0,
				'diff':null,
				'message':null
			};
			try {
				res.code = fs.readFileSync(file,'utf-8');
				switch(extension) {
					case 'html':
						res.formatted = indent.html(res.code);
						break;
					case 'css':
						res.formatted = indent.css(res.code);
						break;
					case 'js':
						res.formatted = indent.js(res.code);
						break;
					default:
						res.message = 'Filetype nonexistent';
				}
				if (indentationOnly) {
					res.code = res.code.replace(/[\n\r]/g,'');
					res.formatted = res.formatted.replace(/[\n\r]/g,'');
				}
				else res.code = res.code.replace(/(?:\r|\n)/g,'\r\n');
				res.code = res.code.replace(/\t/g,'    ');
				res.formatted = res.formatted.replace(/\t/g,'    ');
				res.data = jsdiff.diffChars(res.code, res.formatted);
				res.data.forEach(function(part) {
					let thisCount = part['count'];
					if (part['added']) res.f_length += thisCount;
					else if (part['removed']) res.f_length -= thisCount;
					else {
						res.c_length += thisCount;
						res.f_length += thisCount;
					}
				});
				res.diff = (res.c_length>res.f_length) ? res.f_length/res.c_length : res.c_length/res.f_length;
				if (res.diff < similarity && typeof testMessage === 'object') {
					res.message = "Similarity rate: "+(Math.round(res.diff*100))+"%\n- Similarity rate between submitted and suggested code formats was too low!\n- Check for HTML errors";
					testMessage[res.file] = res.message;
				}
			} catch(err) {
				res.message = 'Could not read file';
			}
			filtered.push(res);
		}
		return filtered;
	}

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
					var files = [thisPath];
					queue = files.reduce(filter,[]);
					done();
				} else if (stats.isDirectory()) {
					getDirectories(thisPath, (err, files)=>{
						if (err) {
							conditionsErrorMessage = 'wrong with glob getting files';
							done();
						}
						conditions = true;
						queue = files.reduce(filter,[]);
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
			expect(conditions, conditionsMessage).to.be.true;
			if (conditions) {
				testMessage = (typeof testMessage === 'object') ? JSON.stringify(testMessage) : testMessage;
				queue.forEach(function(d) {
					expect(d.diff*100, testMessage).to.be.at.least(similarity*100);
				});
			}
		});
	});
}


exports.main = main;