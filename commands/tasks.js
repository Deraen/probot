var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var optimist = require('optimist');
var moment = require('moment');

var config = require('../config');
var lib = require('../lib');
var git = require('../services/git');

// Add help message
var help = require('./help');
help.register(
  '!add [--users user1[,user2]] [--date DD.MM.YYYY] [' + _.map(_.pairs(config.categories), function (c) { return c[0]; }).join(',')  + '] KESTO Ja loppuun kuvaus.',
  'Kategoriat: ' + _.map(_.pairs(config.categories), function (c) { return c[0] + ': ' + c[1]; }).join(', '),
  'Kesto: Kesto tunteina. Voi olla liukuluku.');

module.exports = function (from, msg, cb) {
  var args = optimist.parse(msg);

  // Users arg
  var participants = args.users ? args.users.split(',') : [from];
  participants = _.map(participants, lib.applyAliases);

  _.each(participants, function (name) {
    if (!_.has(config.users, name)) {
      cb('Tuntematon käyttäjä: ' + name);
    }
  });

  // Date arg
  var date = args.date ? args.date : moment().format('D.M.YYYY');

  // Category arg
  var category = (_.first(args._) || '').toUpperCase();
  args._ = _.rest(args._);

  if (!category || !_.has(config.categories, category)) {
    cb('Tuntematon kategoria: ' + category);
  }

  // Duration
  var duration = parseFloat(_.first(args._));
  args._ = _.rest(args._);
  if (!duration || !_.isNumber(duration)) {
    cb('Virheellinen kesto');
  }

  // Summary
  var summary = lib.fixCharsetFuckUps(args._.join(' '));
  if (summary.length <= 0) {
    cb('Ei kuvausta');
  }

  git.append('hours.tsv', date + '\t' + duration + '\t' + category + '\t' + participants.join(',') + '\t' + summary + '\n');

  cb(null, '++ ' + date + ' - ' + duration + ' tuntia. Kategoria ' + category + '. Osallisina ' + participants.join(', ') + '. Viesti: ' + summary);
};

