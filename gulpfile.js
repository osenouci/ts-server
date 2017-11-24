const gulp = require('gulp');
const ts = require('gulp-typescript');
const JSON_FILES = ['src/*.json', 'src/**/*.json'];
const del = require('del');

// pull in the project TypeScript config
const tsProject = ts.createProject('tsconfig.json');

gulp.task('scripts', () => {
  const tsResult = tsProject.src()
  .pipe(tsProject());
  return tsResult.js.pipe(gulp.dest('dist'));
});

gulp.task('watch', ['scripts'], () => {
  gulp.watch('src/**/*.ts', ['scripts']);
});

gulp.task('assets', function() {
  return gulp.src(JSON_FILES)
  .pipe(gulp.dest('dist'));
});

gulp.task('cleanBeforeCopy', function(){
  return del('dist/local', {force:true});
});

gulp.task('copy', ['cleanBeforeCopy'], function() {
  return gulp.src('src/local/**/*', {base: 'src'})
  .pipe(gulp.dest('dist'));
});

gulp.task('default', ['watch', 'assets', 'copy']);
