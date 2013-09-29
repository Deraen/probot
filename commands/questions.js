var _ = require('lodash');
var optimist = require('optimist');
var fs = require('fs');

var git = require('../services/git');
var config = require('../config');
var lib = require('../lib');

// Add help message
var help = require('./help');
help.register(
  '!ask Kysymys'
);
help.register(
  '!answer ID Vastaus.'
);

var q_id = 0;
fs.readFile(config.repo + '/questions.tsv', {encoding: 'UTF-8'}, function (err, data) {
  if (err || !data) data = '';
  var lines = data.split('\n');
  lines = _.map(lines, function (l) { return l.split('\t'); });
  q_id = _.reduce(lines, function (result, val) {
    if (parseInt(val[1]) >= result) result = parseInt(val[1]);
    return result;
  }, q_id);
});

exports.ask = function (from, msg, cb) {
  var args = optimist.parse(msg);

  var id = ++q_id;
  var question = lib.fixCharsetFuckUps(args._.join(' '));
  if (question.length <= 0) {
    return cb('Ei kysymystä');
  }

  git.append('questions.tsv', 'ask\t' + id + '\t' + question + '\n');

  cb(null, '?? ' + id + ': ' + question);
};

exports.answer = function (from, msg, cb) {
  var args = optimist.parse(msg);

  var id = _.first(args._);
  args._ = _.rest(args._);

  var answer = lib.fixCharsetFuckUps(args._.join(' '));
  if (answer.length <= 0) {
    return cb('Ei vastausta.');
  }

  git.append('questions.tsv', 'ans\t' + id + '\t' + answer + '\n');

  cb(null, '== ' + answer);
};
