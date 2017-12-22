import gulp from "gulp";
import {spawn} from "child_process";
import hugoBin from "hugo-bin";
import gutil from "gulp-util";
import autoprefix from "gulp-autoprefixer";
import browsersync from "browser-sync";
import cssnano from "gulp-cssnano";
import runSequence from "run-sequence";
import sass from "gulp-sass";
import sourcemaps from "gulp-sourcemaps";
import download from "gulp-download-stream";
import BrowserSync from "browser-sync";
import webpack from "webpack";
import webpackConfig from "./webpack.conf";

const browserSync = BrowserSync.create();

// Hugo arguments
const hugoArgsDefault = ["-d", "../dist", "-s", "site", "-v"];
const hugoArgsPreview = ["--buildDrafts", "--buildFuture"];

// Development tasks
gulp.task("hugo", (cb) => buildSite(cb));
gulp.task("hugo-preview", (cb) => buildSite(cb, hugoArgsPreview));

// Build/production tasks
gulp.task("build", ["styles-dev", "js"], (cb) => buildSite(cb, [], "production"));
gulp.task("build-preview", ["styles-dev", "js"], (cb) => buildSite(cb, hugoArgsPreview, "production"));

gulp.task("sync-tokens", () => {
  download({
    file: "_style-params.scss",
    url: "https://projects.invisionapp.com/dsm-export/demers-designs/star-fun-theater-camp/_style-params.scss?key=Syuyy08zG"
  })
    .pipe(gulp.dest("./src/css/"));
});

// Tasks
gulp.task("styles-dev", () => {
  gulp.src("./src/css/style.scss")
    //.pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: "expanded",
      errLogToConsole: true
    }))
    //.pipe(autoprefix())
    //.pipe(sourcemaps.write())
    .pipe(gulp.dest("./dist/css/"))
    .pipe(browserSync.stream({match: "**/*.css"}));
});


// gulp.task('styles-dist', function() {
//   return gulp.src("./source/modal-nodes.scss")
//     .pipe(sourcemaps.init())
//     .pipe(sass({
//       outputStyle: 'compressed',
//       errLogToConsole: true
//     }))
//     .pipe(autoprefix())
//     .pipe(cssnano({
//       discardComments: {removeAll: true}
//     }))
//     .pipe(gulp.dest("./dist"))
// });

// Compile Javascript
gulp.task("js", (cb) => {
  const myConfig = Object.assign({}, webpackConfig);

  webpack(myConfig, (err, stats) => {
    if (err) throw new gutil.PluginError("webpack", err);
    gutil.log("[webpack]", stats.toString({
      colors: true,
      progress: true
    }));
    browserSync.reload();
    cb();
  });
});

// Development server with browsersync
gulp.task("server", ["hugo", "styles-dev", "js"], () => {
  browserSync.init({
    server: {
      baseDir: "./dist"
    }
  });
  gulp.watch("./src/js/**/*.js", ["js"]);
  gulp.watch("./src/css/**/*.scss", ["styles-dev"]);
  gulp.watch("./site/**/*", ["hugo"]);
});

/**
 * Run hugo and build the site
 */
function buildSite(cb, options, environment = "development") {
  const args = options ? hugoArgsDefault.concat(options) : hugoArgsDefault;

  process.env.NODE_ENV = environment;

  return spawn(hugoBin, args, {stdio: "inherit"}).on("close", (code) => {
    if (code === 0) {
      browserSync.reload();
      cb();
    } else {
      browserSync.notify("Hugo build failed :(");
      cb("Hugo build failed");
    }
  });
}
