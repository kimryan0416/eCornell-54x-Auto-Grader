//describe, beforeAll, it, expext - are the Jasmine default methods
//karmaHTML is the karma-html package object with the access to all its features

/*
describe("The index.html iframe document",function(){
  
  beforeAll(function(done){
    //load DOM custom matchers from karma-jasmine-dom package
    jasmine.addMatchers(DOMCustomMatchers);
    
    //lets open our 'index.html' file in the browser by 'index' tag as you specified in 'karma.conf.js'
    karmaHTML.index.open();
    
    //karmaHTML.index.onstatechange fires when the Document is loaded
    //now the tests can be executed on the DOM
    karmaHTML.index.onstatechange = function(ready){
      //if the #Document is ready, fire tests
      //the done() callback is the jasmine native async-support function
      if(ready) done();
    };
  });
  
  it("should be a real Document object",function(){
    var _document = karmaHTML.index.document;
    expect(_document.constructor.name).toEqual('HTMLDocument');
  });
  
  it("should contain paragraph and header that are the siblings",function(){
    //karmaHTML.index.document gives the access to the Document object of 'index.html' file
    var _document = karmaHTML.index.document;
    //use all document javascript native methods on it
    var header = _document.getElementById('header');
    var paragraph = _document.getElementById('paragraph');
    
    //these are the karma-jasmine-dom custom matchers
    expect(paragraph).toBeNextSiblingOf(header);
    expect(header).toBePreviousSiblingOf(paragraph);
  });

  it('should have its header be underlined',function() {
    var _document = karmaHTML.index.document;
    var header = _document.getElementById('header');
    expect(header).toHaveComputedStyle("text-decoration","underline solid rgb(0, 0, 0)");
  });

});
*/


describe("Testing html files!", function() {
  beforeAll(function(done){
    jasmine.addMatchers(DOMCustomMatchers);

    var run_index_tests = function() {
    
      it("should be a real Document object",function(){
        var _document = karmaHTML.index.document;
        expect(_document.constructor.name).toEqual('HTMLDocument');
      });
      
      it("should contain paragraph and header that are the siblings",function(){
        //karmaHTML.index.document gives the access to the Document object of 'index.html' file
        var _document = karmaHTML.index.document;
        //use all document javascript native methods on it
        var header = _document.getElementById('header');
        var paragraph = _document.getElementById('paragraph');
        
        //these are the karma-jasmine-dom custom matchers
        expect(paragraph).toBeNextSiblingOf(header);
        expect(header).toBePreviousSiblingOf(paragraph);
      });

      it('should have its header be underlined',function() {
        var _document = karmaHTML.index.document;
        var header = _document.getElementById('header');
        expect(header).toHaveComputedStyle("text-decoration","underline solid rgb(0, 0, 0)");
      });
    }

    var run_calls_tests = function() {
      it("should be a real Document object",function(){
        _document = karmaHTML.calls.document;
        expect(_document.constructor.name).toEqual('HTMLDocument');
      });

      it("should contain paragraph and header that are the siblings",function(){
        //karmaHTML.index.document gives the access to the Document object of 'index.html' file
        _document = karmaHTML.calls.document;
        //use all document javascript native methods on it
        _header = _document.getElementById('header');
        var paragraph = _document.getElementById('paragraph');
        
        //these are the karma-jasmine-dom custom matchers
        expect(paragraph).toBeNextSiblingOf(_header);
        expect(_header).toBePreviousSiblingOf(paragraph);
      });

      it("has a header with a different font size",function() {
        _document = karmaHTML.calls.document;
        _header = _document.getElementById('header');

        //_header = _document.getElementById('header');
        //beforeEach(function() {
        //  $(header).click();
        //});
        //expect(header).toHaveEvent('click');
        expect(_header).toHaveComputedStyle('font-size','30px');
      });
    }

    karmaHTML.index.onstatechange = function(ready){
        //if the #Document is ready, fire tests
        //the done() callback is the jasmine native async-support function
        if(ready) {
          run_index_tests();
          //this.close();
          this._root.calls.open();
        }
      };

      karmaHTML.calls.onstatechange = function(ready) {
        if (ready) {
          run_calls_tests();
          //this.close();
        }
    }

    karmaHTML.index.open();
  });
})

