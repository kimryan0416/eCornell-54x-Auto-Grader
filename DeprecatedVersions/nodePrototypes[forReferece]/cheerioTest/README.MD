# Cheerio HTML Parsing Tester

This prototype is an example of how CODIO utilizes HTML tests.

The Cheerio dependency ([Link Here](https://github.com/cheeriojs/cheerio)) is a "Fast, flexible & lean implementation of core jQuery designed specifically for the server." What this means is that Cheerio is able to utilize jQuery-type server programming inside Node.JS applications. This is incredibly useful for testing for HTML tags. For anybody who is adept at jQuery, we can create jQuery-based tests; this approach is how CODIO implements HTML tests inside its sample courses.

## Benefits and Limitations

### Benefits:

The benefit of Cheerio is that it does not require a headless browser dependency such as PhantomJS and CasperJS in order to parse through data. Cheerio contains functionality to load HTML files directly and inspect the code directly.

### Limitations:

The core limitation of Cheerio is that it is not a headless browser on its own - this means **CSS and JavaScript does not load in Cheerio, and DOM tesing cannot be performed.** Cheerio is only useful for testing for HTML tags and code.

## How to use Cheerio

This is an example of how Cheerio is initialized within a Node.JS application:

		
	var cheerio = require('cheerio');
	var fs = require('fs');
		// 'fs' is required to read HTML files
		
	var $ = cheerio.load(fs.readFileSync(path/to/HTML/file));
		
	if ($('title').length <= 0) {
        console.log("There is no title in the page");
	}
		

The example above shows that we can implement HTML tests via jQuery-esque code. Please note that this does not test DOM properties, CSS files, or JavaScript DOM manipulation - headless browsers like PhantomJS would be more useful in that department.


