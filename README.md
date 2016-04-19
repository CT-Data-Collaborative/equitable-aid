# CT State-to-Town Equitable Aid Calculator

Table, graphics and algorithm for implementing aid calculator as specified in Federal Reserve Bank of Boston New England
Public Policy Center's [Working Paper 11-2: Designing Formulas for Distributing Reductions in State Aid](http://www.bostonfed.org/economic/neppc/wp/2011/neppcwp112.pdf)

### Includes:
- gulp tasks for compiling sass and building angular project file from modularized file structure
- mobile-friendly sliding sidebar menu
- fixed header and footer


### Getting started

NPM is used to manage front-end dependencies.

```npm install``` will do the trick

There are a few basic gulp commands specified for getting started.

```gulp js``` and ```gulp sass``` will build/compile the angular and sass files respectively.

The default gulp command ```gulp``` will launch a local dev server that will serve ```index.html```
up at ```localhost:8080``` or ```0.0.0.0:8080```. It will also watch your ```sass``` and ```js```
directories and will recompile/rebuild files as needed.
