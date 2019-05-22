var fs = require('fs');
var cheerio = require('cheerio');

var errors = [];
var path = './index.html'

if (!fs.existsSync(path)) {
    errors.push("challenge.html doesnt exist")
} 
else {
    var $ = cheerio.load(fs.readFileSync(path));

    if ($('title').length <= 0) {
        errors.push("There is no title in the page");
    }
    
    if ($('title').text().length == 0) {
        errors.push("The title tag (<title>) is not supposed to be empty");
    }

    if ($('p').length != 1) {
        errors.push("There must only be one <p> tag inside this file; there are " + $('p').length + " <p> tags present");
    }
    
}

if( errors.length <= 0 ) {
    process.stdout.write('Well done!\n\n')
    process.exit(0);
}
else {
    process.stdout.write(errors.join("\n")+'\n\n');
    process.exit(1);
}
