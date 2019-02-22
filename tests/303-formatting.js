const common = require('../common.js');
var jsdiff = require('diff');
var html = require('html');
var indent = require('indent.js');

const fs = common.fs;
const path = common.path;
const getDirectories = common.getDirectories;
const determineFileOrDir = common.determineFileOrDir;
const escapeHTML = common.escapeHTML;

function main(name, custom_title, custom_message, variables, done) {

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

	var conditions = false, conditionsMessage, stats, files, queue, res;

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

	try {
		stats = fs.lstatSync(thisPath);
	} catch (err) {
		done({
			name: name,
			title: testTitle,
			success: false,
			message: "The provided PATH returned an error with Node FS.",
			console_message: "The provided PATH returned an error with Node FS."
		})
	}

	var promise = new Promise((resolve,reject)=>{
		if (stats.isFile()) {
			conditions = true; // This is a file or a directory;
			files = [thisPath];
			queue = files.reduce(filter,[]);
			resolve();
		} else if (stats.isDirectory()) {
			getDirectories(thisPath,(err,files)=>{
				if (err) conditionsErrorMessage = 'wrong with glob getting files';
				else {
					conditions = true;
					queue = files.reduce(filter,[]);
				}
				resolve();
			});
		} 
		else {
			conditionsMessage = "The provided PATH is neither a file nor a directory.";
			resolve();
		}
	});

	promise.then(()=>{
		if (!conditions) {
			done({
				name: name,
				title: testTitle,
				success: false,
				message: conditionsMessage,
				console_message: conditionsMessage
			});
		} else {
			var res = queue.reduce((f,d)=>{
				f = (f) ? (d.diff*100) >= (similarity*100) : f;
				return f;
			},true)
			done({
				name: name,
				title: testTitle,
				success: res,
				message: testMessage,
				console_message: testMessage
			});
		}
	});
}


exports.main = main;