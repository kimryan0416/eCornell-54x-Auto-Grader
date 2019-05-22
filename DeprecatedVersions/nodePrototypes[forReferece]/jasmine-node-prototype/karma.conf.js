module.exports = function(config) {
  config.set({
    files: [
      {pattern: 'tests/tests.js',watched:true,served:true,included:true},
      {pattern: 'styles/*.css',watched:false,included:true},
      {pattern: 'scripts/*.js',watched:false,included:true}
    ],
    //load karma-mocha-reporter and karma-html
    reporters: ['mocha','karmaHTML'],
    //load karma-jasmine-dom and karma-jasmine
    frameworks: ['jasmine-dom','jasmine'],
    //load karma-chrome-launcher
    browsers: ['Chrome'],
    client: {
      //If false, Karma will not remove iframes upon the completion of running the tests
      clearContext:false,
      //karma-html configuration
      karmaHTML: {
        source: [
          //indicate 'index.html' file that will be loaded in the browser
          //the 'index' tag will be used to get the access to the Document object of 'index.html'
          {src:'./index.html', tag:'index'},
          {src:'./calls.html', tag:'calls'}
        ],
        auto: true
      }
    }
  });
};