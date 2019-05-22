const common = require('../common.js');
var jsdiff = require('diff');

const fs = common.fs;
const path = common.path;
const escapeHTML = common.escapeHTML;

function commentRemoval(c,bS,eS,call) {
	var eS_length = eS.length;
	var inComment = false;
	var curIndex = 0;
	var commentIndex = 0;
	var returnC = "";
	var tempC = c;

	while (curIndex < tempC.length - eS_length) {
		if (!inComment) {
			commentIndex = tempC.indexOf(bS);
			inComment = commentIndex > -1;
			if (!inComment) {
				returnC += tempC;
				curIndex = tempC.length;
			} else {
				returnC += tempC.substring(curIndex,commentIndex);
				tempC = tempC.substring(commentIndex);
				curIndex = 0;
			}
		}
		else {
			commentIndex = tempC.indexOf(eS);
			inComment = commentIndex > -1;
			if (!inComment) {
				curIndex = tempC.length;
			} else {
				tempC = tempC.substring(commentIndex+eS_length);
				curIndex = 0;
				inComment = false;
			}
		}
	}
	call(returnC);
}

function doTheComparison(c1,c2,call) {
	
	var orLength = 0, 
		solLength = 0,
		data = jsdiff.diffChars(c1, c2);

	data.forEach(function(part) {
		let thisCount = part['count'];
		if (part['added']) solLength += thisCount;
		else if (part['removed']) solLength -= thisCount;
		else {
			orLength += thisCount;
			solLength += thisCount;
		}
	});
	var diff = (orLength > solLength) ? solLength/orLength : orLength/solLength;
	call(diff);
}

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
	var removeComments = ( variables["REMOVE_COMMENTS"] != null && typeof variables["REMOVE_COMMENTS"] === "boolean" ) ? variables["REMOVE_COMMENTS"] : false;
	var capitalization = ( variables["CAPITALIZATION"] != null && typeof variables["CAPITALIZATION"] === "boolean" ) ? variables["CAPITALIZATION"] : false;

	var testTitle = (custom_title != null) ? escapeHTML(custom_title) : 'Expect an ' + (similarity*100) + '% similarity between submitted and suggested code formatting';
	var testMessage = (custom_message != null) ? escapeHTML(custom_message) : {};

	var stats1, stats2, original_code, solution_code;
	
	try {
		stats1 = fs.lstatSync(file1);
		stats2 = fs.lstatSync(file2);
		if (!stats1.isFile() || !stats2.isFile()) {
			throw new Error('One or both of the provided filepaths are not files.');
		}
		original_code = fs.readFileSync(file1,'utf-8');
		solution_code = fs.readFileSync(file2,'utf-8');

		if (contentOnly) {
			/* original_code = original_code.replace(/\n\r\t/g,'');	solution_code = solution_code.replace(/\n\r\t/g,''); */
			original_code = original_code.replace(/\s+/g,'');
			solution_code = solution_code.replace(/\s+/g,'');
		}
		if (!capitalization) {
			original_code = original_code.toLowerCase();
			solution_code = solution_code.toLowerCase();
		}
		if (removeComments) {
			var extType = path.extname(file1);
			var beginCommentString = "", endCommentString = "";
			switch (extType) {
				case(".html"):
					beginCommentString = "<!--";
					endCommentString = "-->";
					break;
				default:
					beginCommentString = "/*";
					endCommentString = "*/";
					original_code = original_code.replace(/\/\/(.*?)/g,'');
					solution_code = solution_code.replace(/\/\/(.*?)/g,'');
			}
			var pr = new Promise((resolve)=>{
				commentRemoval(original_code,beginCommentString,endCommentString,(r1)=>{
					original_code = r1;
					commentRemoval(solution_code,beginCommentString,endCommentString,(r2)=>{
						solution_code = r2;
						resolve();
					});
				});
			});
			pr.then(()=>{
				doTheComparison(original_code, solution_code,diff=>{
					if (diff < similarity && custom_message == null) {
						var key = "Similarity rate: "+(Math.round(diff*100))+"%";
						testMessage[key] = "- Similarity rate between submitted and solution code formats was too low!\n- Check to make sure instructions have been followed\n- Check for validation errors";
					} else {
					testMessage = testMessage.replace(/{{RATERAW}}/g,Math.round(diff*100)/100);
					testMessage = testMessage.replace(/{{RATE}}/g,Math.round(diff*100));
				}
					done({
						name: name,
						title: testTitle,
						success: (diff*100) >= (similarity*100),
						message: testMessage,
						console_message: JSON.stringify(testMessage)
					});
				});
			});
			/*
			switch ( extType ) {
				case ( ".html" ):
					results.original_code = results.original_code.replace(/<!--(.*?)-->/gm,'');
					results.solution_code = results.solution_code.replace(/<!--(.*?)-->/gm,'');
					break;
				case ( ".css" ):
					results.original_code = results.original_code.replace(/[/*](.*?)[/]/gm,'');
					results.solution_code = results.solution_code.replace(/[/*](.*?)[/]/gm,'');
					break;
				default:
					while (results.original_code.indexOf("/*") > -1) {
						let tempOriginalIndex = 0;
						let tempBeginCommentIndex = -1;
						let afterCode = "";
						let newOriginalCode = "";
						while (tempOriginalIndex < results.original_code.length) {
							tempBeginCommentIndex = results.original_code.indexOf("/*");
							newOriginalCode += results.original_code.substring(tempOriginalIndex,tempBeginCommentIndex);
							tempOriginalIndex = tempBeginCommentIndex;
							for (let k = 0; k + )
						}

						let tempOriginalCodeArray = results.original_code.split("/*");
						let newTempOriginalCodeArray = [tempOriginalCodeArray[0]];
						let inComment = true;
						newTempOriginalCodeArray = tempOriginalCodeArray.reduce((f,i)=>{
							if (inComment) {

							} else {
								if
								f.push(i);
							}
							return f;
						},newTempOriginalCodeArray);
						// First object should be normal text. 2nd object should be text after the first /*
						// In this 2nd object, we should check if it contains "/". If it doesn't, then we just delete it entirely and move onto the next array item.
					}
						if (results.original_code.indexOf("/") > -1) {

						}
					}
					results.original_code = results.original_code.replace(/[/*](.*?)[/]/gm,'');
					results.solution_code = results.solution_code.replace(/[/*](.*?)[/]/gm,'');
			}
			*/
		} else {
			doTheComparison(original_code, solution_code, diff=>{
				if (diff < similarity && custom_message == null) {
					var key = "Similarity rate: "+(Math.round(diff*100));
					testMessage[key] = "- Similarity rate between submitted and solution code formats was too low!\n- Check to make sure instructions have been followed\n- Check for validation errors";
				} else {
					testMessage = testMessage.replace(/{{RATERAW}}/g,Math.round(diff*100)/100);
					testMessage = testMessage.replace(/{{RATE}}/g,Math.round(diff*100));
				}
				done({
					name: name,
					title: testTitle,
					success: (diff*100) >= (similarity*100),
					message: testMessage,
					console_message: JSON.stringify(testMessage)
				});
			});
		}
	} catch (err) {
		if (custom_message == null) testMessage = err;
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