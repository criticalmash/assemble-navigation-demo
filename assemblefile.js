'use strict';

/**
 * Demo and test for Assemble Navigation plugin
 */

var assemble = require('assemble');
var extname = require('gulp-extname');
var get = require('get-value');

// var midden = require('assemble-midden');
var Navigation = require('assemble-navigation');

var through = require('through2');

/**
 * Create an instance of assemble
 */

var app = assemble();

app.data({
  site: {
    title: 'Demo',
    list: [
      {name: 'item 1'},
      {name: 'item 2'}
    ]
  }
});

/**
 * declare helpers
 */
// app.helper('midden', midden(true));

// app.helper('helpers', require('handlebars-helpers')());
app.helper('get', function (prop) {
  return JSON.stringify(get(this.context, prop), null, '\t');
});

/**
 * Create instance of Navigation and attach middleware
 */
var navigation = new Navigation();

app.pages.onLoad(/\.hbs$|\.md$/, navigation.onLoad());
app.pages.onLoad(/\.hbs$|\.md$/, navigation.preRender());

app.pages.onLoad(/\.hbs$/, function (view, next) {
  // do something with `view`
  view.data.something = 'here is something';
  console.log('view data', view.data);
  next();
});

/**
 * Create tasks
 */

/**
 * Load templates
 */
app.task('load', function (cb) {
  app.layouts('src/templates/layouts/**/*.hbs');
  app.partials('src/templates/partials/**/*.hbs');
  cb();
});

app.option('layout', 'default');

app.task('content', ['load'], function () {
  app.pages('src/content/**/*.{md,hbs}');
  return app.toStream('pages')
    .pipe(app.renderFile())
    .on('err', console.error)
    .pipe(extname())
    .pipe(streamReader())
    .pipe(app.dest('build'));
});



// build site, serve then watch for edits
app.task('default', ['content']);

var streamReader = function () {
  console.log('calling streaminspector');

  return through.obj(function (file, enc, next) {
    console.log('relative path: ', file.relative);
    console.log('File context: ', file.context());
    // console.log('File data: ', file.data);
    // console.log('Contents: \n', file.contents.toString());

    
    next(null, file);
  });
};

/**
 * Expose the assemble instance
 */

module.exports = app;
