const exec = require('child_process').exec;
const common = require('../common.js');

const expect = common.expect;
const forceUnicodeEncoding = common.forceUnicodeEncoding;
const escapeHTML = common.escapeHTML;
const vnuPath = common.vnuPath;

function main(name, custom_title, custom_message, variables, custom_hints=null) {

	var testTitle = (custom_title) ? escapeHTML(custom_title) : 'Expecting no CSS errors';
	//var testMessage = {};

	describe(name, function () {

		var messages;

		before(function(done) {
			this.timeout(20000);
			var cssPath = variables['CSS_PATH'];

			var child = exec('java -jar '+vnuPath+' --skip-non-css --format json --errors-only '+ cssPath, function (error, stdout, stderr){
				var parsedErrors = JSON.parse(stderr);
				messages = parsedErrors.messages.reduce(function(filtered,error){
					//var newMessage = "<pre><code>"+escapeHTML(error.extract.replace(/\s/g,''))+"</code></pre>\n"+escapeHTML(error.message);
					//var newMessage = "<code style='display:inline-block;font-family:Verdana,Arial,sans-serif;margin-bottom:5px;'>- [Line "+error.lastLine+"] "+escapeHTML(error.message)+"</code>";
					var newMessage = '- [Line '+error.lastLine+'] '+escapeHTML(error.message);
					var testMessage = error.message.toLowerCase().replace(/[^a-zA-Z ]/g,'');
					var thisURL = error.url.replace(process.cwd(), '').replace('file:/','');
					filtered[thisURL] = filtered[thisURL] || '';
					filtered[thisURL] += newMessage + '\n';
					return filtered;
				},{});
				done();
			});
		});

		it(testTitle, function(done) {
			expect(Object.keys(messages).length, JSON.stringify(messages)).to.equal(0);
			done();
		});

		/*
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
		*/
	});

}

exports.main = main;