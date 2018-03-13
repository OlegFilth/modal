'use strict'

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV == 'development';

const gulp = require('gulp'),
  browserSync = require('browser-sync').create(),
  gulpIf = require('gulp-if'),
  newer = require('gulp-newer'),
  svgstore = require('gulp-svgstore'),
  svgmin = require('gulp-svgmin'),
  cheerio = require('gulp-cheerio'),
  image = require('gulp-imagemin'),
  imageJpegRecompress = require('imagemin-jpeg-recompress'),
  imagePngquant = require('imagemin-pngquant'),
  browserify = require('browserify'),
  streamify = require('gulp-streamify'),
  source = require('vinyl-source-stream'),
  jshint = require('gulp-jshint'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglifyes'),
  sourcemaps = require('gulp-sourcemaps'),
  sass = require('gulp-sass'),
  rename = require('gulp-rename'),
  postcss = require('gulp-postcss'),
  assets = require('postcss-assets'),
  autoprefixer = require('autoprefixer'),
  cssnano = require('cssnano'),

  root = '../',
	scss = root + 'sass/',
	js = root + 'js/',
	img = root + 'images/',
  languages = root + 'languages/';

gulp.task('svgstore', () => {
  return gulp.src('../images/svgstore/nofilled/**/*.svg')
    .pipe(svgmin())
    .pipe(cheerio({
      run: function ($) {
          $('[fill]').removeAttr('fill');
      },
      parserOptions: { xmlMode: true }
    }))
    .pipe(svgstore())
    .pipe(rename({basename: 'sprite'}))
    .pipe(gulp.dest(img))
});

gulp.task('svgstore-filled', () => {
  return gulp.src('../images/svgstore/filled/**/*.svg')
    .pipe(svgmin())
    .pipe(svgstore())
    .pipe(rename({basename: 'sprite-filled'}))
    .pipe(gulp.dest(img))
});

// CSS via Sass and PostCSS
  gulp.task('css', () => {

    let processorsDev = [
      assets({
        loadPaths: [scss + '**'],
        relativeTo: root
      }),
      autoprefixer('last 2 versions', '> 1%')
    ]

    let processors = [
      assets({
        loadPaths: [scss + '**'],
        relativeTo: root
      }),
      autoprefixer('last 2 versions', '> 1%'),
      cssnano
    ]

    return gulp.src(scss + 'main.scss')
    .pipe(gulpIf(isDevelopment, sourcemaps.init()))
    .pipe(sass({
      outputStyle: 'expanded',
      indentType: 'space',
      indentWidth: '2'
    }).on('error', sass.logError))
    .pipe(gulpIf(!isDevelopment, postcss(processors)))
    .pipe(gulpIf(isDevelopment, postcss(processorsDev)))
    .pipe(rename('style.css'))
    .pipe(gulpIf(isDevelopment, sourcemaps.write()))
    .pipe(gulp.dest(root))
  });

// Optimize images through gulp-image
  gulp.task('images', () => {
    return gulp.src(img + 'RAW/**/*.{jpg,JPG,png}')
    .pipe(newer(img))
    .pipe(image([
      imageJpegRecompress({
        progressive: true,
        max: 75,
        min: 70
      }),
      imagePngquant({quality: '75'}),
      image.svgo({plugins: [{removeViewBox: true}]})
    ]))
    .pipe(gulp.dest(img));
  });
// JavaScript

gulp.task('javascript', () => {
  return gulp.src(['../js/**/*.js', '!../gulp-dev/**', '!../js/_minjs/**/*.js', '!../js/main.js', '!../js/bundle.js' ])
	.pipe(jshint({esnext: true}))
  .pipe(jshint.reporter('default'))
  .pipe(uglify())
  .pipe(rename({suffix: '.min'}))
	.pipe(gulp.dest(js + '_min.js'));
});

gulp.task('jsbundle', () => {
  return browserify('../js/main')
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest(js));
});

// Watch everything
gulp.task('watch', () => {
	browserSync.init({
    open: 'external',
    server: {
      baseDir: "../../popUp",
      directory: true
  },
		//proxy: 'http://project.develop/',
    port: 8888,
    reloadDelay: 1000
  });
  gulp.watch([ img + 'svgstore/**/*' ], gulp.series('svgstore'));
  gulp.watch([ img + 'svgstore/**/*' ], gulp.series('svgstore-filled'));
  gulp.watch([ scss + '**/*.scss' ], gulp.series('css'));
  gulp.watch(['../js/main.js' ], gulp.series('jsbundle'));
	gulp.watch(['../**/*.js', '!../gulp-dev/**','!../js/_min.js/**/*.js', '!../js/bundle.js' ], gulp.series('javascript'));
  gulp.watch(img + 'RAW/**/*.{jpg,JPG,png}', gulp.series('images'));
	gulp.watch(root + '**/*').on('change', browserSync.reload);
});

gulp.task('default', gulp.series('watch'));