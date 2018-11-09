const fs = require('fs');
var casper = require('casper').create();

function getAbsoluteFilePath(relativePath) {
  return "file://" + fs.workingDirectory + '/' + relativePath;
};

var htmlPath = casper.cli.get(0);
var selector = casper.cli.get(1);
var found = '';

casper.start(getAbsoluteFilePath(htmlPath)); 
casper.then(function() {
	var element = this.getElementInfo(selector);
	this.waitForSelector(selector, function() {
		if (element && element.attributes && casper.resourceExists(function(resource){
			return resource.url.match(element.attributes.src) 
				&& 
				//&& resource.status < 400;
	        })) {
			found = 'true';
		} else {
			found = 'false';
		}
	}, function() {
		found = 'false';
	});

	//this.waitForSelector(selector, function() {
		//found = (this.resourceExists(element.attributes.src)) ? 'true' : 'false';
	//}, function() {
		//found = 'false';
	//});
	//found = element.attributes.src;
});

casper.run(function() {
	this.echo(found).exit();
})

