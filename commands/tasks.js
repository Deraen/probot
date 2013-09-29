// var async = require('async');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var optimist = require('optimist');
var moment = require('moment');
var exec = require('child_process').exec;
var async = require('async');

var config = require('../config');
var lib = require('../lib');
var say = require('../say');

// Add help message
var help = require('./help');
help.register(
  '!add [--users user1[,user2]] [--date DD.MM.YYYY] [' + _.map(_.pairs(config.categories), function (c) { return c[0]; }).join(',')  + '] KESTO Ja loppuun kuvaus.',
  'Kategoriat: ' + _.map(_.pairs(config.categories), function (c) { return c[0] + ': ' + c[1]; }).join(', '),
  'Kesto: Kesto tunteina. Voi olla liukuluku.');

// Implement command
var tasksBuffer = [];
var run = function (cmd) {
  return function (cb) {
    exec(cmd, {cwd: path.resolve(__dirname, config.repo)}, cb);
  };
};
var addFile = function (task, cb) {
  fs.appendFile(config.repo + '/hours.tsv', task.date + '\t' + task.duration + '\t' + task.category + '\t' + task.participants.join(',') + '\t' + task.summary + '\n', cb);
};

// Write tasks once a minute from buffer to git
setInterval(function () {
  // Fetch latest git version
  async.series([
    run('git fetch'),
    run('git reset --hard origin/master')
  ], function () {
    // Add each new task from buffer
    async.each(tasksBuffer, addFile, function () {
      // After all tasks are writter to file, commit tasks to git
      async.series([
        run('git add hours.tsv'),
        run('git commit -m Task.'),
        // run('git push')
      ], function () {
        // If all commands are run successfully, clear buffer
        // In theory if any git command returns error (eg. no network -> push fails)
        // buffer is not cleared
        tasksBuffer.length = 0;
      });
    });
  });
}, 60 /* sec */ * 1000);

module.exports = function (from, msg) {
  var args = optimist.parse(msg);
  var errors = [];

  console.log(args);

  // Users arg
  var participants = args.users ? args.users.split(',') : [from];
  participants = _.map(participants, lib.applyAliases);

  _.each(participants, function (name) {
    if (!_.has(config.users, name)) {
      errors.push('Tuntematon käyttäjä: ' + name);
    }
  });

  // Date arg
  var date = args.date ? args.date : moment().format('D.M.YYYY');

  // Category arg
  var category = (_.first(args._) || '').toUpperCase();
  args._ = _.rest(args._);

  if (!category || !_.has(config.categories, category)) {
    errors.push('Tuntematon kategoria: ' + category);
  }

  // Duration
  var duration = parseFloat(_.first(args._));
  args._ = _.rest(args._);
  if (!duration || !_.isNumber(duration)) {
    errors.push('Virheellinen kesto');
  }

  // Summary
  var summary = args._.join(' ').replace(/�/g, 'ö').replace(/�/g, 'ä').replace(/�/g, 'Ä').replace(/�/g, 'Ö');
  if (summary.length <= 0) {
    errors.push('Ei kuvausta');
  }

  if (errors.length === 0) {
    say('++ ' + date + ' - ' + duration + ' tuntia. Kategoria ' + category + '. Osallisina ' + participants.join(', ') + '. Viesti: ' + summary);

    tasksBuffer.push({date: date, duration: duration, category: category, participants: participants, summary: summary});
  } else {
    say('Virhe. ' + errors.join('. '));
  }
};

