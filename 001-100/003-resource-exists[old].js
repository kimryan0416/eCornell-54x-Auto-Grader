const cheerio = require('cheerio');
const path = require('path');
//const spawn = require('child_process').spawn;

const common = require("../common.js");

const fs = common.fs;
const assert = common.assert;
const expect = common.expect;
const should = common.should;
const escaepHTML = common.escapeHTML;

/*
function getAbsoluteFilePath(relativePath) {
  return "file://" + fs.workingDirectory + '/' + relativePath;
};
*/

function checkIfExists(files, parent, callback) {
	returned = {'success':false,'passed':[],'failed':[]};
	var commonPath = path.dirname(parent);

	var loop = function(index, next) {
		if (index < files.length) {
			var curFile = files[index];
			var curPath = path.resolve(commonPath, curFile);
			fs.access(curPath, err=>{
				if(err) returned['failed'].push(curFile);
				else returned['passed'].push(curFile);
				loop(index+1, next);
			});
		} else {
			returned['success'] = (returned['failed'].length > 0) ? false : true;
			next(returned);
		}
	}
	loop(0, res=>{
		callback(res);
	});

}

/*
function filterSelector(sel, callback) {
	var thisTitle = sel, thisSelector = sel, modSelector = sel, thisContains = null, thisAttributes = null;
	var regExp, matches;
	if (sel.match(/:contains/)) {
		var spl = sel.split(":");
		regExp = /\(\"([^)]+)\"\)/
		matches = regExp.exec(spl[1]);

		thisTitle = spl[0];
		thisSelector = spl[0];
		thisContains = matches[1];
	}
	if (sel.match(/\[.*?\]/)) {
		regExp = /(.*?)\[(.*?)\]/;
		matches = regExp.exec(thisSelector);
		modSelector = matches[1];
		thisAttributes = matches[2];
	}
	
	callback({"title":thisTitle,"selector":thisSelector,"modSelector":modSelector,"contains":thisContains,"attributes":thisAttributes});
}
*/

function main(title, variables) {

	var htmlPath = variables['HTML_PATH'];
	var selector = variables['SELECTOR'];
	var fileContents = fs.readFileSync(htmlPath, 'utf-8');
	var $ = cheerio.load(fileContents);

	var found = false, srcs = [], results = {'success':false,'passed':[],'failed':[]};

	before(function(done) {
		var tempSel = $(selector);
		if (tempSel.length == 0) {
			results['success'] = false;
			done();
		} else if (typeof tempSel.attr('src') === 'undefined') {
			results['success'] = false;
			done();
		} else if ($(tempSel).length >= 1) {
			/*
			//src = selector.replace(/"/g, '\"');
			//console.log(src.replace(/"/g, '\"'));
			//var child = spawn('casperjs', ['001-100/003-casper-runner.js', htmlPath, src]);
			//child.stdout.setEncoding('utf-8');
			//child.stdout.on('data', function(data) {
			//	var str = data.toString().trim();
			//	console.log(str);
			//	found = true;
			//});
			//child.on('exit', function (code) {
			//    done();
			//});
			*/
			$(selector).each(function() {
				if ($(this).attr('src') != null) srcs.push($(this).attr('src'));
			});
			checkIfExists(srcs, htmlPath, res=>{
				results = res;
				done();
			});
		} else {
			results['success'] = false;
			done();
		}
		
	});

	it("should return \"true\" if all resources exist", function() {
		expect(results['success']).to.be.true;
	});

}

exports.main = main;
