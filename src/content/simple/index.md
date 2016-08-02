---
title: Assemble-Navigation Quick Start
menu-title: Quick Start
---


## Install and Configure

Begin by installing `assemble-navigation` into your assemble project and require it in your assemblefile.

```sh
npm i assemble-navigation --save
```

```js
var Navigation = require('assemble-navigation');
```

You then create an instance of the navigation object and configure it for use by assemble.

```js
var navigation = new Navigation();

app.pages.onLoad(/\.hbs$|\.md$/, navigation.onLoad());
app.pages.preRender(/\.hbs$|\.md$/, navigation.preRender());
```

Navigation contains two [middleware](https://github.com/assemble/assemble/blob/master/support/docs/src/content/api/middleware.md) functions. The first runs during `onLoad` events, when a page is loaded into the app. The second runs during 'preRender' events, where Assemble prepares the page to be rendered with a template.

The `onLoad` handler creates a menu item for each page based on what it knows about that page and adds that item to the menu.

The `preRender` handler will then customize the menu on a page-by-page basis and adds that custom menu to each pages `data` store. This makes all the site's menus available to the templating system as a local variable.

Assemble use of streams means that it can start writing out rendered HTML files to the destination directory before all the source files have been read in. So we need to pause streaming until all the files are loaded and we have a complete navigation.

We'll do this by altering the standard `content` task.

```javascript
app.task('load', function (cb) {
  app.layouts('src/templates/layouts/**/*.hbs');
  app.partials('src/templates/partials/**/*.hbs');
  cb();
});

app.task('content', ['load'], function () {
  navigation.clearMenus();
  app.pages('src/content/**/*.{md,hbs}');
  return app.toStream('pages')
    .pipe(app.renderFile())
    .on('err', console.error)
    .pipe(extname())
    .pipe(app.dest('build'))
    .pipe(browserSync.stream());
});
```

The `content` task above begins by telling navigation to clear out old navigation data by calling it's `clearMenus()` method. This is important if you're running assemble in a development mode and are adding/editing pages. Without `clearMenus` you might see multiple copies of the same menu item and other artifacts.

Next, we load our content into the `pages` collection synchronously, waiting for all pages to load before restarting our stream on the next line.

## Defining Front Matter
Navigation uses the `title` attribute as defined in a page's front matter as the menu item's label. If you would like to use an alternative title you can specify it using the `menu-title` attribute.

In addition, any other values defined in the front matter will be available on the menu items `data` attribute which can be quite useful in creating more sophisticated menus.

## Building a Simple Header Menu
Let's imagine we have a simple site with a few pages organized as one level of navigation. We'd like to display these pages as a horizontal list of links at the top of each page. In our source directory, the pages might look like this.

```sh
$ ls
about.md contact.md index.md products.md
```
If we use the `assemblefile.js` as configured above, the unlocalized main menu would look something like this...

```json
"main": {
  "items": [
      {
        "title": "Home",
        "url": "/index.html",
        "linkId": "index",
        "isCurrentPage": false,
        "isActive": false,
        "data": {
          "title": "Home"
        },
        "items": [],
        "menuPath": ["."],
        "basename": "index"
      },
      {
        "title": "About",
        "url": "/about.html",
        "linkId": "about",
        "isCurrentPage": false,
        "isActive": false,
        "data": {
          "title": "About"
        },
        "items": [],
        "menuPath": [".", "about"],
        "basename": "about"
      },
      {
        "title": "Contact",
        "url": "/contact.html",
        "linkId": "contact",
        "isCurrentPage": false,
        "isActive": false,
        "data": {
          "title": "Contact"
        },
        "items": [],
        "menuPath": [".", "contact"],
        "basename": "contact"
      },
      {
        "title": "Products",
        "url": "/products.html",
        "linkId": "products",
        "isCurrentPage": false,
        "isActive": false,
        "data": {
          "title": "Products"
        },
        "items": [],
        "menuPath": [".", "products"],
        "basename": "products"
      }
    ]
  }
}
```

As you can see, the menu is just a simple array of objects, each of which represents a link to your site's pages. Among other properties, each menu item has a title and URL.

## Styling your menu
