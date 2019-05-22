import { Selector, ClientFunction } from 'testcafe';

var thisFile = process.env.FILE;
var selectors = process.env.SELECTORS;
var selectorsReplaced = selectors = selectors.replace(/'/g, '"');
var selectorsParsed = JSON.parse(selectorsReplaced);

const getWindowInnerWidth = ClientFunction(() => window.innerWidth);
const getWindowInnerHeight = ClientFunction(() => window.innerHeight);

fixture (`fixture`)
	.page('http://localhost:8080/'+thisFile);

Object.keys(selectorsParsed).forEach(selector=>{
	test(selector, async t => {

		// Getting the elements that match the selector provided
		var elements = Selector(selector);
		var count = await elements.count;

		// Preparing "styles" object for testing
		var selectorProperties = selectorsParsed[selector];
		var styles = Object.keys(selectorProperties).reduce((filtered,prop)=>{
			filtered[prop] = {
				'found':false,
				'actual':null,
				'expected':selectorProperties[prop]['expected'],
				'unexpected':selectorProperties[prop]['unexpected'],
				'including':selectorProperties[prop]['including'],
				'excluding':selectorProperties[prop]['excluding']
			}
			return filtered;
		},{});

		// loop through each of our properties
		for (var property in selectorProperties) {	// loop through each of the properties we're looking for
			for (var i = 0; i < count; i++) {	// loop through each of the selected elements
				if (styles[property]['found'] == true) break;	// If the indicated property has already been discovered in one of the elements, we just break
				var style = await elements.nth(i).getStyleProperty(property);
				styles[property]['actual'] = style;

				if (styles[property]['expected'] != null) {
					if (styles[property]['expected'].indexOf('%') > -1) {
						let parentStyle = await elements.nth(i).parent().getStyleProperty(property);
						styles[property]['expected'] = (typeof parentStyle !== 'undefined') ? (parseInt(parentStyle) * (parseInt(styles[property]['expected'])/100)) + 'px' : style;
					} else if (styles[property]['expected'].indexOf('vw') > -1 && (property == 'width' || property == 'height')) {
						let parentStyle = (property == 'width') ? await getWindowInnerWidth() : await getWindowInnerHeight();
						styles[property]['expected'] = (typeof parentStyle !== 'undefined') ? parseInt(parentStyle)+'px' : style;
					}
					styles[property]['found'] = (style != null) && (style.toLowerCase().replace(/[^a-z0-9]/gi,'') == styles[property]['expected'].toLowerCase().replace(/[^a-z0-9]/gi,''));
				}
				else styles[property]['found'] = style != null;

				if (styles[property]['unexpected'] != null) {
					if (styles[property]['unexpected'].indexOf('%') > -1) {
						let parentStyle = await elements.nth(i).parent().getStyleProperty(property);
						styles[property]['unexpected'] = (typeof parentStyle !== 'undefined') ? (parseInt(parentStyle) * (parseInt(styles[property]['unexpected'])/100)) + 'px' : style;
					} else if (styles[property]['unexpected'].indexOf('vw') > -1 && (property == 'width' || property == 'height')) {
						let parentStyle = (property == 'width') ? await getWindowInnerWidth() : await getWindowInnerHeight();
						styles[property]['unexpected'] = (typeof parentStyle !== 'undefined') ? parseInt(parentStyle)+'px' : style;
					}
					styles[property]['found'] = styles[property]['found'] && (style != null) && (style.toLowerCase().replace(/[^a-z0-9]/gi,'') != styles[property]['unexpected'].toLowerCase().replace(/[^a-z0-9]/gi,''));
				}

				if (styles[property]['including'] != null && typeof styles[property]['including'] === 'string') {
					styles[property]['found'] = styles[property]['found'] && (style != null) && (style.toLowerCase().indexOf(styles[property]['including'].toLowerCase()) > -1);
				}

				if (styles[property]['excluding'] != null && typeof styles[property]['excluding'] === 'string') {
					styles[property]['found'] = styles[property]['found'] && (style != null) && (style.toLowerCase().indexOf(styles[property]['excluding'].toLowerCase()) == -1);
				}
			}
		}

		// finally test
		await t.expect(count).gt(0,"Selector \""+selector+"\" does not match any elements"); // we expect at least one element to match the provided selector
		for (const style in styles) 
			await t.expect(styles[style]['found']).eql(true, JSON.stringify(styles));
	})
});