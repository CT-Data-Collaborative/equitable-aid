var gulp = require('gulp')
var concat = require('gulp-concat')
var sass = require('gulp-sass')
var sourcemaps = require('gulp-sourcemaps')
var uglify = require('gulp-uglify')
var ngAnnotate = require('gulp-ng-annotate')
var connect = require('gulp-connect')


gulp.task('js_dependencies', function() {
    gulp.src([
        'node_modules/angular/angular.min.js',
        'node_modules/angular-animate/angular-animate.min.js',
        'node_modules/angular-ui-bootstrap/dist/ui-bootstrap.js',
        'node_modules/d3/d3.min.js',
        'node_modules/d3-jetpack/d3-jetpack.js',
        'node_modules/ng-lodash/build/ng-lodash.min.js'
    ]).pipe(gulp.dest('dist/js/libs'));
});

gulp.task('css_dependencies', function() {
   gulp.src([
       'node_modules/angular-ui-bootstrap/dist/ui-bootstrap-csp.css'
   ]).pipe(gulp.dest('dist/css'));
});

gulp.task('js', function() {
    gulp.src(['src/static/js/**/module.js', 'src/static/js/**/*/*.js'])
     .pipe(sourcemaps.init())
      .pipe(concat('app.js'))
      //.pipe(ngAnnotate())
      //.pipe(uglify())
     //.pipe(sourcemaps.write())
     .pipe(gulp.dest('./dist/js/'))
});

gulp.task('sass', function() {
    gulp.src('src/static/sass/project.scss')
     .pipe(sass().on('error', sass.logError))
     .pipe(gulp.dest('./dist/css'));
});

// will server on localhost:8080 or 0.0.0.0:8080
gulp.task('webserver', function() {
  connect.server()
});

gulp.task('serve', function () {
  // will server on localhost:8080 or 0.0.0.0:8080
  connect.server({
      root: 'dist/'
  }),
  gulp.watch('static/js/**/*.js', ['build']),
  gulp.watch('static/sass/**/*.scss', ['build'])
});

gulp.task('build', ['js', 'js_dependencies', 'css_dependencies', 'sass'], function() {
    gulp.src(['src/data/*.json']).pipe(gulp.dest('dist/data/'));
    gulp.src(['src/index.html']).pipe(gulp.dest('dist/'));
});

gulp.task('default', function() {
    gulp.run('build');
});

