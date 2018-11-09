const exec = require('child_process').exec;
const common = require('../common.js');

const expect = common.expect;
const forceUnicodeEncoding = common.forceUnicodeEncoding;
const vnuPath = common.vnuPath;

function main(title, variables, statement, errorMessage, hints=null) {

	var itStatement = (statement.length != 0) ? statement : 'Expecting no CSS errors';
	var errorStatement = (errorMessage.length != 0) ? errorMessage : 'Errors found! Click to see more.';

	describe(title, function () {

		var messages;

		before(function(done) {
			this.timeout(20000);
			var cssPath = variables['CSS_PATH'];

			var child = exec('java -jar '+vnuPath+' --skip-non-css --format json --errors-only '+ cssPath, function (error, stdout, stderr){
				var parsedErrors = JSON.parse(stderr);
				messages = parsedErrors.messages;
				done();
			});
		});

		it(itStatement, function(done) {
			expect(messages.length, errorStatement).to.equal(0);
			done();
		});

		afterEach(function(done) {
			if (messages.length > 0) {
				var parsedMessages = {}, errors = '';
				messages.forEach(mes=>{
					var thisURL = mes.url.replace(process.cwd(), '').replace('file:/','');
					parsedMessages[thisURL] = (typeof parsedMessages[thisURL] === 'undefined') ? '' : parsedMessages[thisURL];
					parsedMessages[thisURL] += '- ' + forceUnicodeEncoding('[Line '+mes.lastLine+']: '+ mes.message) + '\n';
					return;
				});
				Object.keys(parsedMessages).forEach(file => {	errors += 'FILE: "'+file+'"\n' + parsedMessages[file];	});
				this.currentTest.context = {'title':'Error Messages','value':errors};
			}
			done();
		});

	});

}

exports.main = main;