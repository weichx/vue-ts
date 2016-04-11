const gulp = require('gulp');
const jasmine = require('gulp-jasmine');

gulp.task('default', function () {
    gulp.src('built/spec/**_spec.js').pipe(jasmine({
        includeStackTrace: true,
        verbose: true
    }));
});