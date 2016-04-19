var gulp = require('gulp')
var concat = require('gulp-concat')
var sass = require('gulp-sass')
var sourcemaps = require('gulp-sourcemaps')
var uglify = require('gulp-uglify')
var ngAnnotate = require('gulp-ng-annotate')
var connect = require('gulp-connect')

gulp.task('js', function() {
    gulp.src(['static/js/**/module.js', 'static/js/**/*/*.js'])
     .pipe(sourcemaps.init())
      .pipe(concat('app.js'))
      //.pipe(ngAnnotate())
      //.pipe(uglify())
     //.pipe(sourcemaps.write())
     .pipe(gulp.dest('static/dist/js/'))
});


gulp.task('sass', function() {
    gulp.src('./static/sass/project.scss')
     .pipe(sass().on('error', sass.logError))
     .pipe(gulp.dest('./static/dist/css'));
});

// will server on localhost:8080 or 0.0.0.0:8080
gulp.task('webserver', function() {
  connect.server()
});

gulp.task('serve', function () {
  // will server on localhost:8080 or 0.0.0.0:8080
  connect.server(),
  gulp.watch('static/js/**/*.js', ['js']),
  gulp.watch('static/sass/**/*.scss', ['sass'])
});

gulp.task('default', ['js', 'sass']);

