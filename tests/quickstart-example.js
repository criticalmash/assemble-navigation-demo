var assemble = require('assemble');
var extname = require('gulp-extname');
//var get = require('get-value');
var browserSync = require('browser-sync').create();
var watch = require('base-watch');
var midden = require('assemble-midden');
var minimist = require('minimist');

var chai = require('chai');
var expect = chai.expect;

var Navigation = require('assemble-navigation');

var app = assemble();

describe('quick start', function () {
  var navi;
  beforeEach(function () {
    navi = new Navigation();
    app = assemble();
    if (!app.pages) {
      app.create('pages');
    }
    app.pages.onLoad(/\.hbs$|\.md$/, navi.onLoad());
    app.pages.preRender(/\.hbs$|\.md$/, navi.preRender());
  });

  it('should create menu items for each page', function () {
    app.pages('src/examples/quickstart/**/*.{md,hbs}');
    
    console.log(JSON.stringify(navi.menus, null, '\t'));
  });
});