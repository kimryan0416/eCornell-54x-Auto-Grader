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

  var waitTime = data.waitTime;
  var submitSelector = data.submitSelector;
  var attempts = data.attempts;

  attempts.forEach(d=>{
    var formSelector = d.form_selector
    var testInputs = d.inputs;
    var testResults = d.results;
    var testName = (typeof d.attempt_name !== 'undefined') ? d.attempt_name : formSelector; 

    test(testName, async t => {
      var formElement = Selector(formSelector);
      var formElementCount = await formElement.count;
      await t.expect(formElementCount).gt(0, "No form that corresponds to what the autograder is testing exists.");

      var submitElement = Selector(formSelector + " " + submitSelector);
      var submitElementCount = await submitElement.count;
      await t.expect(submitElementCount).gt(0, "No submit button for the form the autograder is testing for exists.");

      if (formElementCount > 0 && submitElementCount > 0) {
        var chosenForm = formElement.nth(0);
        var chosenSubmit = submitElement.nth(0);

        for (let i = 0; i < testInputs.length; i++) {
          var thisTestInput = testInputs[i];
          var inputSelector = formSelector + " " + thisTestInput.input_selector;
          var inputType = thisTestInput.type;
          var inputContent = thisTestInput.content;

          var thisInput = Selector(inputSelector);
          var thisInputExists = await thisInput.exists;
          var waitAfterInput = (thisTestInput.wait != null && typeof thisTestInput.wait === "number") ? thisTestInput.wait : 100;
          
          if (!thisInputExists) continue;
          
          switch(inputType) {
            case("click"):
              await t
                .click(thisInput)
                .wait(waitAfterInput);
              break;
            case("text"):
              await t
                .typeText(thisInput, inputContent)
                .wait(waitAfterInput);
              break;
            case("select"):
              await t
                .click(thisInput)
                .wait(waitAfterInput)
                .click(Selector(inputContent))
                .wait(waitAfterInput);
              break;
            case("upload"):
              await t
                .setFilesToUpload(thisInput, inputContent)
                .wait(waitAfterInput);
              break;
          }
        }

        await t.click(chosenSubmit).wait(waitTime);

        // Since "result" is an array, we should loop through them
        for (let i = 0; i < testResults.length; i++) {
          var curResult = testResults[i];
          var endSelector = await Selector(curResult.end_selector);
          var endSelectorCount = await endSelector.count;

          var success = false;
            
          switch(curResult.type) {
            case('innerText'):
              for (let j = 0; j < endSelectorCount && success == false; j++) {
                var endText = await endSelector.nth(j).innerText;
                if (curResult.expected != null) {
                  success = endText === curResult.expected;
                  if (curResult.unexpected != null) success = success && endText !== curResult.unexpected;
                } 
                else if (curResult.unexpected != null) success = endText !== curResult.unexpected;
              }
              await t.expect(success).eql(true);
              break;
            case('css'):
              for (let j = 0; j < endSelectorCount && success == false; j++) {
                var endStyle = await endSelector.nth(j).getStyleProperty(curResult.property);
                if (curResult.expected != null) {
                  success = endStyle === curResult.expected;
                  if (curResult.unexpected != null) success = success && endStyle !== curResult.unexpected;
                } 
                else if (curResult.unexpected != null) success = endStyle !== curResult.unexpected;
              }
              await t.expect(success).eql(true);
              break;
            case('has_class'):
              for (let j = 0; j < endSelectorCount && success == false; j++) {
                var endClasses = await endSelector.nth(j).classNames;
                if (curResult.expected != null) {
                  success = endClasses.indexOf(curResult.expected) > -1;
                  if (curResult.unexpected != null) success = success && endClasses.indexOf(curResult.unexpected) == -1;
                } 
                else if (curResult.unexpected != null) success = endClasses.indexOf(curResult.unexpected) == -1;
              }
              await t.expect(success).eql(true);
              break;
            case('redirect'):
              for (let j = 0; j < endSelectorCount && success == false; j++) {
                if (curResult.expected != null) {
                  success = getPageUrl() === curResult.expected;
                  if (curResult.unexpected != null) success = success && getPageUrl() !== curResult.unexpected;
                } 
                else if (curResult.unexpected != null) success = getPageUrl() !== curResult.unexpected;
              }
              await t.expect(success).eql(true);
              break;
          }
        }
      }
    });
  });