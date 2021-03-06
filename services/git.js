var async = require('async');
var path = require('path');
var exec = require('child_process').exec;
var fs = require('fs');

var config = require('../config');

var buffer = [];

function run(cmd) {
  return function (cb) {
    exec(cmd, {cwd: path.resolve(__dirname, '..', config.repo)}, cb);
  };
}

setInterval(function () {
  // Fetch latest git version
  async.series([
    run('git fetch'),
    run('git reset --hard origin/master')
  ], function () {
    // Add each new task from buffer
    async.series(buffer, function () {
      // After all tasks are writter to file, commit tasks to git
      async.series([
        run('git commit -am "ProjectBot"'),
        run('git push')
      ], function () {
        // If all commands are run successfully, clear buffer
        // In theory if any git command returns error (eg. no network -> push fails)
        // buffer is not cleared
        buffer.length = 0;
      });
    });
  });
}, 60 /* sec */ * 1000);

exports.append = function (filename, content) {
  buffer.push(function (cb) {
    fs.appendFile(config.repo + '/' + filename, content, {encoding: 'UTF-8'}, cb);
  });
};
