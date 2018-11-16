const fs = require('fs');
const glob = require('glob');
const path = require('path');

const assert = require('chai').assert;
const expect = require('chai').expect;
const should = require('chai').should();

var vnuPath = "vnu.jar";

function escapeHTML(text) {
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '“': '&quot;',
    '”': '&quot;',
    '"': '&quot;',
    "'": '&#039;',
    "‘": '&#039;',
    "’": '&#039;'
  };

  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function forceUnicodeEncoding(string) {
  //return unescape(encodeURIComponent(string));
  return decodeURIComponent(string.replace(/\\x/g,"%"));
}


function determineValid(url, callback) {
	fs.lstat(url, (err, stats)=>{
		if ( err ) callback(new Error(err));
		else {
			if (stats.isFile()) callback(1);
			else callback(0);
		}
	});
}

function determineFileOrDir(url, callback) {
  fs.lstat(url, (err, stats)=>{
    if ( err ) callback(new Error(err));
    else {
      if (stats.isFile()) callback(1);
      else if (stats.isDirectory()) callback(2);
      else callback(0);
    }
  });
}

const getDirectories = (src, callback) => {
	glob(src + "/**/*", callback);
}

function isArray(a) { return Object.prototype.toString.call(a) === "[object Array]";  }


exports.fs = fs;
exports.glob = glob;
exports.path = path;

exports.assert = assert;
exports.expect = expect;
exports.should = should;

exports.escapeHTML = escapeHTML;
exports.determineFileDir = determineValid;
exports.determineFileOrDir = determineFileOrDir;
exports.getDirectories = getDirectories;
exports.forceUnicodeEncoding = forceUnicodeEncoding;
exports.isArray = isArray;

exports.vnuPath = vnuPath;