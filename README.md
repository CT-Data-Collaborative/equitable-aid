# Angular Template for CTData Projects

### Includes:
- gulp tasks for compiling sass and building angular project file from modularized file structure
- mobile-friendly sliding sidebar menu
- fixed header and footer


### Getting started

First install the local node dependencies which we need for managing serving, sass compilation
and building the final app.js file

```npm install``` will do the trick

Then install the front-end dependencies using bower.

```bower install``` will do the trick.

The front-end files will end up in the ```static/dist/bower_components``` directory.

There are a few basic gulp commands specified for getting started.

```gulp js``` and ```gulp sass``` will build/compile the angular and sass files respectively.

The default gulp command ```gulp``` will launch a local dev server that will serve ```index.html```
up at ```localhost:8080``` or ```0.0.0.0:8080```. It will also watch your ```sass``` and ```js```
directories and will recompile/rebuild files as needed.
