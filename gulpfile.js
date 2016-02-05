var fs = require('fs');
var path = require('path');

var gulp = require('gulp');

// Load all gulp plugins automatically
// and attach them to the `plugins` object
var plugins = require('gulp-load-plugins')();

// Temporary solution until gulp 4
// https://github.com/gulpjs/gulp/issues/355
var runSequence = require('run-sequence');

var pkg = require('./package.json');
var dirs = pkg['h5bp-configs'].directories;

var responsive = require('gulp-responsive-images');

// ---------------------------------------------------------------------
// | Helper tasks                                                      |
// ---------------------------------------------------------------------

gulp.task('archive:create_archive_dir', function () {
    fs.mkdirSync(path.resolve(dirs.archive), '0755');
});

gulp.task('archive:zip', function (done) {

    var archiveName = path.resolve(dirs.archive, pkg.name + '_v' + pkg.version + '.zip');
    var archiver = require('archiver')('zip');
    var files = require('glob').sync('**/*.*', {
        'cwd': dirs.dist,
        'dot': true // include hidden files
    });
    var output = fs.createWriteStream(archiveName);

    archiver.on('error', function (error) {
        done();
        throw error;
    });

    output.on('close', done);

    files.forEach(function (file) {

        var filePath = path.resolve(dirs.dist, file);

        // `archiver.bulk` does not maintain the file
        // permissions, so we need to add files individually
        archiver.append(fs.createReadStream(filePath), {
            'name': file,
            'mode': fs.statSync(filePath)
        });

    });

    archiver.pipe(output);
    archiver.finalize();

});

gulp.task('clean', function (done) {
    require('del')([
        dirs.archive,
        dirs.dist
    ], done);
});

gulp.task('copy', [
    'copy:.htaccess',
    'copy:index.html',
    'copy:jquery',
    'copy:license',
    'copy:main.css',
    'copy:images',
    'copy:misc',
    'copy:normalize'
]);

gulp.task('copy:.htaccess', function () {
    return gulp.src('node_modules/apache-server-configs/dist/.htaccess')
               .pipe(plugins.replace(/# ErrorDocument/g, 'ErrorDocument'))
               .pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:index.html', function () {
    return gulp.src(dirs.src + '/index.html')
               .pipe(plugins.replace(/{{JQUERY_VERSION}}/g, pkg.devDependencies.jquery))
               .pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:jquery', function () {
    return gulp.src(['node_modules/jquery/dist/jquery.min.js'])
               .pipe(plugins.rename('jquery-' + pkg.devDependencies.jquery + '.min.js'))
               .pipe(gulp.dest(dirs.dist + '/js/vendor'));
});

gulp.task('copy:license', function () {
    return gulp.src('LICENSE.txt')
               .pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:main.css', function () {

    var banner = '/*! HTML5 Boilerplate v' + pkg.version +
                    ' | ' + pkg.license.type + ' License' +
                    ' | ' + pkg.homepage + ' */\n\n';

    return gulp.src(dirs.src + '/css/main.css')
               .pipe(plugins.header(banner))
               .pipe(plugins.autoprefixer({
                   browsers: ['last 2 versions', 'ie >= 8', '> 1%'],
                   cascade: false
               }))
               .pipe(gulp.dest(dirs.dist + '/css'));
});

gulp.task('copy:images', function () {
    var qualityPref = 75;
    var settingsArrayFull = [
        {
            width: 480,
            suffix: '-small_1x',
            quality: qualityPref
        },
        {
            width: 480 * 2,
            suffix: '-small_2x',
            quality: qualityPref
        },
        {
            width: 800,
            suffix: '-medium_1x',
            quality: qualityPref
        },
        {
            width: 800 * 2,
            suffix: '-medium_2x',
            quality: qualityPref
        },
        {
            width: 1280,
            suffix: '-large_1x',
            quality: qualityPref
        },
        {
            width: 1280 * 2,
            suffix: '-large_2x',
            quality: qualityPref
        },
        {
            width: 1920,
            suffix: '-xlarge_1x',
            quality: qualityPref
        },
        {
            width: 1920 * 2,
            suffix: '-xlarge_2x',
            quality: qualityPref
        }
    ];
    var settingsArray200 = [{
        width: 200,
        suffix: '_1x',
        quality: qualityPref
    }, {
        width: 200 * 2,
        suffix: '_2x',
        quality: qualityPref
    }];
    var settingsArray640 = [{
        width: 640,
        suffix: '_1x',
        quality: qualityPref
    }, {
        width: 640 * 2,
        suffix: '_2x',
        quality: qualityPref
    }];
    var settingsArray640Only1x = [{
        width: 640,
        suffix: '_1x',
        quality: qualityPref
    }];

    return gulp.src(dirs.src + '/img/*')
        .pipe(responsive({
            'resistencia-wallpaper.jpg': settingsArrayFull,
            'madre-wallpaper.jpg': settingsArrayFull,
            'thoughts-masters-house-p1.jpg': settingsArrayFull,
            'thoughts-masters-house-p2.jpg': settingsArrayFull,
            'look-over-here.jpg': settingsArrayFull,
            'on-sale.jpg': settingsArrayFull,
            'diploma.jpg': settingsArrayFull,
            'bay.jpg': settingsArrayFull,
            'oil-runs-thicker-morgan.png': settingsArrayFull,
            'power-rose.jpg': settingsArray200,
            'antz.jpg': settingsArray640,
            'darkmatter.jpg': settingsArray640Only1x,
            'ellas-song.jpg': settingsArray640Only1x,
            'get-equal.jpg': settingsArray640Only1x,
            'king-kunta.jpg': settingsArray640Only1x,
            'luke-nephew.jpg': settingsArray640Only1x,
            'nelini-stamp.jpg': settingsArray640Only1x,
            'rockaway-wildfire.jpg': settingsArray640Only1x,
            'umi-selah.jpg': settingsArray640Only1x
        }))
        .pipe(gulp.dest(dirs.dist + '/img'));
});

gulp.task('copy:misc', function () {
    return gulp.src([

        // Copy all files
        dirs.src + '/**/*',

        // Exclude the following files
        // (other tasks will handle the copying of these files)
        '!' + dirs.src + '/css/main.css',
        '!' + dirs.src + '/index.html',
        '!' + dirs.src + '/img/!(*@(.gitignore|ant-tunnel-invert-crop.svg|pipe-4.jpg))'

    ], {

        // Include hidden files by default
        dot: true

    }).pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:normalize', function () {
    return gulp.src('node_modules/normalize.css/normalize.css')
               .pipe(gulp.dest(dirs.dist + '/css'));
});

gulp.task('lint:js', function () {
    return gulp.src([
        'gulpfile.js',
        dirs.src + '/js/*.js',
        dirs.test + '/*.js'
    ]).pipe(plugins.jscs())
      .pipe(plugins.jshint())
      .pipe(plugins.jshint.reporter('jshint-stylish'))
      .pipe(plugins.jshint.reporter('fail'));
});


// ---------------------------------------------------------------------
// | Main tasks                                                        |
// ---------------------------------------------------------------------

gulp.task('archive', function (done) {
    runSequence(
        'build',
        'archive:create_archive_dir',
        'archive:zip',
    done);
});

gulp.task('build', function (done) {
    runSequence(
        ['clean', 'lint:js'],
        'copy',
    done);
});

gulp.task('default', ['build']);
