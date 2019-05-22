import { Selector, ClientFunction } from 'testcafe';
const fs = require('fs');

var file = process.env.FILE;
var dataPath = process.env.DATAPATH;
var dataRaw = fs.readFileSync(dataPath, "utf8");
var data = JSON.parse(dataRaw);

const getWindowInnerWidth = ClientFunction(() => window.innerWidth);
const getWindowInnerHeight = ClientFunction(() => window.innerHeight);

const getPageUrl = ClientFunction(() => window.location.href);

fixture (`fixture`)
	.page('http://localhost:8080/'+file);

  data.forEach(d=>{
    var startSelector = d['start_selector'];
    var waitTime = d['wait'];
    var actionType = d['type'];
    var result = d['result'];
    var testName = (typeof d.action_name !== 'undefined') ? d.action_name : d.start_selector + ' [action: ' + actionType + ']';;
    test(testName, async t => {
      var elements;
      if (typeof startSelector === 'object') {
        var firstKey = Object.keys(startSelector)[0];
        elements = Selector(startSelector[firstKey]);
      } else {
        elements = Selector(startSelector);
      }
      var count = await elements.count;
      await t.expect(count).gt(0,"Starting Selector \""+startSelector+"\" does not match any elements"); // we expect at least one element to match the provided selector

      if (count > 0) {
        var startAt = elements.nth(0);

        switch(actionType) {
          case('click'):
            await t
              .click(startAt)
              .wait(waitTime);
            break;
          case('hover'):
            await t
              .hover(startAt)
              .wait(waitTime);
            break;
          case('dbl-click'):
            await t
              .doubleClick(startAt)
              .wait(waitTime);
            break;
          case('click-sequence'):
            await t.expect(Object.values(d['start_selector']).length).gt(0,"Starting selector sequence not defined - must provide a list of elements to click");
            for(let s = 0; s < d['start_selector'].length; s++) {
              elements = Selector(d['start_selector'][s]);
              startAt = elements.nth(0);
              await t
                .click(startAt)
                .wait(waitTime);
            }
            break;
        }

        if (result == null || result.length == 0) {
          await t.expect(true).eql(true);
        } else {
          // Since "result" is an array, we should loop through them
          for (let i = 0; i < result.length; i++) {
            var curResult = result[i];
            var endSelector, endSelectorCount;
            if (curResult.end_selector == null) {
              endSelector = startAt;
              endSelectorCount = 1;
            } else {
              endSelector = await Selector(curResult.end_selector);
              endSelectorCount = await endSelector.count;
            }
            var success = false;
            var errorMessage;
            
            switch(curResult.type) {
              case('innerText'):
                errorMessage = (curResult.expected == null && curResult.unexpected == null) ? "No comparison for resulting text provided: please provide a comparison text inside test parameters" : (curResult.error_message != null) ? String(curResult.error_message) : "The selector \""+curResult.end_selector+"\" does not contain the expected text";
                for (let j = 0; j < endSelectorCount && success == false; j++) {
                  var endText = await endSelector.nth(j).innerText;
                  if (curResult.expected != null) {
                    success = endText === curResult.expected;
                    if (curResult.unexpected != null) success = success && endText !== curResult.unexpected;
                  } 
                  else if (curResult.unexpected != null) success = endText !== curResult.unexpected;
                }
                await t.expect(success).eql(true,errorMessage);
                break;
              case('css'):
                errorMessage = (curResult.expected == null && curResult.unexpected == null) ? "No comparison for resulting styling provided: please provide a comparison styling inside test parameters" : (curResult.error_message != null) ? String(curResult.error_message) : "The selector \""+curResult.end_selector+"\" does not render the expected css";
                for (let j = 0; j < endSelectorCount && success == false; j++) {
                  var endStyle = await endSelector.nth(j).getStyleProperty(curResult.property);
                  if (curResult.expected != null) {
                    success = endStyle === curResult.expected;
                    if (curResult.unexpected != null) success = success && endStyle !== curResult.unexpected;
                  } 
                  else if (curResult.unexpected != null) success = endStyle !== curResult.unexpected;
                }
                await t.expect(success).eql(true,errorMessage);
                break;
              case('has_class'):
                errorMessage = (curResult.expected == null && curResult.unexpected == null) ? "No comparison for resulting class provided: please provide a comparison class inside test parameters" : (curResult.error_message != null) ? String(curResult.error_message) : "The selector \""+curResult.end_selector+"\" does not have the expected class";
                for (let j = 0; j < endSelectorCount && success == false; j++) {
                  var endClasses = await endSelector.nth(j).classNames;
                  if (curResult.expected != null) {
                    success = endClasses.indexOf(curResult.expected) > -1;
                    if (curResult.unexpected != null) success = success && endClasses.indexOf(curResult.unexpected) == -1;
                  } 
                  else if (curResult.unexpected != null) success = endClasses.indexOf(curResult.unexpected) == -1;
                }
                await t.expect(success).eql(true,errorMessage);
                break;
              case('redirect'):
                errorMessage = (curResult.expected == null && curResult.unexpected == null) ? "No URL for resulting redirection provided: please provide an expected URL inside test parameters" : (curResult.error_message != null) ? String(curResult.error_message) : "Redirecting to a new page by selector \""+curResult.end_selector+"\" failed";
                for (let j = 0; j < endSelectorCount && success == false; j++) {
                  if (curResult.expected != null) {
                    success = getPageUrl() === curResult.expected;
                    if (curResult.unexpected != null) success = success && getPageUrl() !== curResult.unexpected;
                  } 
                  else if (curResult.unexpected != null) success = getPageUrl() !== curResult.unexpected;
                }
                await t.expect(success).eql(true,errorMessage);
                break;
              default:
                errorMessage = (curResult.error_message != null) ? String(curResult.error_message) : "The selector \""+curResult.end_selector+"\" does not exist";
                success = true;
                await t.expect(success).eql(true,errorMessage);
            }
          }
        }
      }
    });
  });