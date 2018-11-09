
const fs = require('fs');
const htmlParser =  require('node-html-parser');

var htmlPath = 'tests/001-100/002/index.html';
var fileContents = fs.readFileSync(htmlPath, 'utf-8');
var htmlRoot = htmlParser.parse(fileContents);

fs.writeFileSync('testNodeHtmlParser.json',JSON.stringify(htmlRoot),'utf-8');

/*
function filterSelector(sel, callback) {
	var thisSelector = sel, thisLang = null;
	if (thisSelector.match(/:lang/)) {
		var spl = thisSelector.split(':');
		regExp = /\(["']([^)]+)["']\)/
		matches = regExp.exec(spl[1]);

		thisSelector = spl[0];
		thisLang = 'lang="'+matches[1]+'"';
	}
	callback({selector:thisSelector,lang:thisLang})
}

var selector = 'html:lang("en")';
if ( selector.toLowerCase().indexOf('html') == 0 && selector.substring(4,5) != ' ' ) {
	filterSelector(selector, res=>{
		console.log(res);
	});
} else {
	console.log(selector);
}
*/