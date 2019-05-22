const Nightmare = require('nightmare');
const assert = require('assert');
const fs = require('fs');

describe('Load a Page', function() {
      // Recommended: 5s locally, 10s to remote server, 30s from airplane ¯\_(ツ)_/¯
      this.timeout('30s')

      let nightmare = null
      beforeEach(() => {
        nightmare = new Nightmare()
      })

      describe('/ (Home Page)', () => {
        it('should load without error', done => {
          // your actual testing urls will likely be `http://localhost:port/path`
          nightmare.goto('file://index.html')
            .end()
            .then(function (result) { done() })
            .catch(done)
        });
      });
    });