const fs = require('fs');
const css = require('css');

var cssContents = fs.readFileSync('tests/101-200/102-declaration-exists/style/all.css', 'utf-8');
var cssParsed = css.parse(cssContents);
fs.writeFileSync('cssParseTest.json',JSON.stringify(cssParsed),'utf-8');