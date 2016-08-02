'use strict';

/**
 * Demo and test for Assemble Navigation plugin
 */

var assemble = require('assemble');
var extname = require('gulp-extname');
//var get = require('get-value');
var browserSync = require('browser-sync').create();
var watch = require('base-watch');
var midden = require('assemble-midden');
var minimist = require('minimist');

// var midden = require('assemble-midden');
var Navigation = require('assemble-navigation');
var markdownMid = require('assemble-middleware-md');

//var through = require('through2');

var hljs = require('highlight.js');

/** Stylesheet packages */
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');

/** Client-side js packages */
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var buffer = require('gulp-buffer');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');

/**
 * Setup some global variables
 */
var options = minimist(process.argv.slice(2));
var environment = options.environment || 'development';

/**
 * Create an instance of assemble
 */

var app = assemble();

/**
 * Load Plugins
 */

app.use(watch());

app.data({
  site: {
    title: 'Assemble-Navigation Demo',
    timestamp: new Date()
  }
});

app.data('./package.json', {namespace: true});

/**
 * declare helpers
 */
app.helper('midden', midden(true));

app.helper('helpers', require('handlebars-helpers')());

app.helpers(require('navigation-helpers'));

/**
 * Create instance of Navigation and attach middleware
 */
var navigation = new Navigation();

app.pages.onLoad(/\.hbs$|\.md$/, navigation.onLoad());
app.pages.preRender(/\.hbs$|\.md$/, navigation.preRender());


function highlight(code, lang) {
  try {
    try {
      return hljs.highlight(lang, code).value;
    } catch (err) {
      if (!/Unknown language/i.test(err.message)) {
        throw err;
      }
      return hljs.highlightAuto(code).value;
    }
  } catch (err) {
    return code;
  }
}
app.pages.onLoad(/\.md$/, markdownMid({highlight: highlight}));

/**
 * A quick&dirty middleware to add a pages original path to
 * the data attribute.
 * Using this to build links to the source page on github.
 */
function setOrig() {
  return function (view, next) {
    if (typeof next !== 'function') {
      throw new TypeError('expected a callback function');
    }
    if (view.options && view.options.orig) {
      view.data.orig = view.options.orig;
    }
    next(null, view);
  };
}
app.pages.onLoad(/\.hbs$|\.md$/, setOrig());

/*************************************************
 * Create tasks
 *************************************************/

/**
 * Process Stylesheets
 * These work just like in gulp. They just use `app.task` instead of `gulp.task`
 */
var styleIncludes = [
  'node_modules/foundation-sites/scss/',
  'node_modules/midden/dist/styles/',
  'node_modules/highlight.js/styles/'
];
app.task('css', function () {
  return app.src('src/foundation/app.scss')
    .pipe(sass({includePaths: styleIncludes}).on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(app.dest('build/css'))
    .pipe(browserSync.stream());
});

/**
 * Process javascript
 */
app.task('scripts', function () {
  return browserify('src/js/app.js')
    .transform(babelify)
    .bundle().on('error', console.error)
    .pipe(source('app.js')) // turn browserify stream into vinyl/gulp stream
    .pipe(environment === 'production' ? buffer() : gutil.noop())
    .pipe(environment === 'production' ? uglify() : gutil.noop())
    .pipe(app.dest('build/js'))
    .pipe(browserSync.stream());
});

/**
 * Load templates
 */
app.task('load', function (cb) {
  app.layouts('src/templates/layouts/**/*.hbs');
  app.partials('src/templates/partials/**/*.hbs');
  cb();
});

app.option('layout', 'default');

app.task('links', function (cb) {
  navigation.clearMenus();
  cb();
});

app.task('content', ['load', 'links'], function () {
  app.pages('src/content/**/*.{md,hbs}');
  return app.toStream('pages')
    .pipe(app.renderFile())
    .on('err', console.error)
    .pipe(extname())
    .pipe(app.dest('build'))
    .pipe(browserSync.stream());
});


/**
 * Serve and watch assets
 */
app.task('serve', function () {
  browserSync.init({
    port: 8000,
    startPath: 'index.html',
    server: {
      baseDir: 'build'
    }
  });
});

app.task('watch', function () {
  app.watch('src/content/**/*.{md,hbs}', ['content']);
  app.watch('src/templates/**/*.{md,hbs}', ['content']);
  app.watch('src/foundation/**/*.scss', ['css']);
});


// build site, serve then watch for edits
app.task('default', ['css', 'scripts', 'content'], app.parallel(['serve', 'watch']));


/**
 * Expose the assemble instance
 */

module.exports = app;
