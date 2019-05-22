//const {expect} = require('chai').use(require('chai-style'))

/*
var input = [
  {
    "title":"Home Page",
    "file":'./index.html',
    "tests":[
      {
        "testTitle":'It should have an element in DOM',
        "wrapper":'#left',
        "wrapperFunction":"wait",
        "test":function () {'#left'.should.be.inDOM; }
      },
      {
        "testTitle":'It should not be in the DOM',
        "test":function () {'#right'.should.not.be.inDom;}
      },
      {
        "testTitle":'It should not have text',
        "wrapper":'title',
        "wrapperFunction":"wait",
        "test":function() {'title'.should.not.have.text(/tester!/i);}
      },
      {
        "testTitle":"It should have a 'block' style with 'display'",
        "wrapper":'#left',
        "test":function() { '#left'.to.have.style('display','inline'); }
      },
      {
        'testTitle':"It should have new appended style",
        "wrapper":"#left",
        "test":function() { '#left'.to.have.attr("name","display:inline;"); }
      }
    ]
  }
];
*/



function main() {

  describe('index.html setup', function() {
    before(function() {
      casper.start('./index.html');
    });

    it("should have its css loaded", function(){
      'all.css'.should.be.loaded
    });
      
    it("'#right' should not be in the DOM", function() {
      expect('#right').to.not.be.inDOM;
    });

    it("'title' should not have text", function() {
      casper.waitForSelector('title', function() {
        expect('title').to.not.have.text(/tester!/i);
      });
    });

    it("'#left' be an element in DOM", function() {
      casper.waitForSelector('#left', function() {
        expect('#left').to.be.inDOM; 
        //expect('#left').to.have.style('font-color');
        expect('#left').to.have.attr("style","display:inline-block;");
      });
    });

    it("'#left' to have a click event", function() {
      casper.thenClick("#left", function() {
        expect("#left").to.have.attr("class").that.contains('clickOn');
      });
    })
  });
  

    
  

        /*
          var curFile, curTest;
  var loop = function(index) {
    if (index < inputForMain.length) {
      curFile = inputForMain[index];
      describe(curFile.title, function() {
        before(function() {
          casper.start(curFile.file);
        });

        it('it should not be in the DOM', function() {

          expect('#right').to.not.be.inDOM;
        });

        it('It should not have text', function() {
          casper.waitForSelector('title', function() {
            expect('title').to.not.have.text(/tester!/i);
          });
        });

        it('It should have an element in DOM', function() {
          casper.waitForSelector('#left', function() {
            expect('#left').to.be.inDOM; 
            //expect('#left').to.have.style('font-color');
            expect('#left').to.have.attr("style","display:inline-block;");
          });
        });
        var innerLoop = function(innerIndex) {
          if (innerIndex < curFile.tests.length) {
            curTest = curFile.tests[innerIndex];
            if (curTest.wrapper != null) {
              it(curTest.testTitle, function() {
                if (curTest.wrapperFunction == "wait") {
                  casper.waitForSelector(curTest.wrapper, curTest.test); 
                }
              });
            } else {
              it(curTest.testTitle, curTest.test);
            }
            innerLoop(innerIndex+1);
          } else {
            loop(index+1);
          }
        }
        innerLoop(0);
        */
    /*}
  }
  loop(0);
  */
}

/*

describe('Home Page', function() {
  before(function() {
    casper.start('./index.html');
  });

  it('should have an element in DOM', function(){
    casper.waitForSelector('#left', function() {
      '#left'.should.be.inDOM;
    });
  });

  it('should not be in the DOM', function() {
    '#right'.should.not.be.inDom;
  });

  it('should not have text', function() {
    casper.waitForSelector('title', function() {
      'title'.should.not.have.text(/tester!/i);
    });
  });
});

*/

main();









/*
describe('Home Page', function() {
// Before script for each test

before(function() {
casper.start('./index.html');
});

it('should have an element in DOM', function(){
casper.waitForSelector('#left', function() {
'#left'.should.be.inDOM;
});
});
*/
// *** Test 1 ***
// Is the Google search page accessible?
/*
it('should have return HTTP 200', function() {
expect(casper.currentHTTPStatus).to.equal(200);
});
*/

/*
// *** Test 2 ***
// Is the search function able to return a list of result?
it('should be able to search', function() {
// Wait for the search form
casper.waitForSelector('form[action="/search"]', function() {
'form[action="/search"]'.should.be.inDOM;
});

// Fill in the form and submit
casper.then(function() {
this.fill('form[action="/search"]', { q: 'Boatswain' }, true);
});

// Check if the result set contains text "Boatswain"
casper.waitForSelector('h3.r a', function() {
'h3.r a'.should.be.inDOM;
expect('h3.r a').to.contain.text(/Boatswain/);
});
});
*/
//});
