var _ = require('lodash');

var config = require('../config');
var say = require('../say');

var helps = [];

var print = function () {
  say('Ohjeet:');
  _.each(helps, say);
};

print.register = function (main) {
  var extra = _.rest(arguments);
  helps.push(main);
  _.each(_.map(extra, function (v) { return '    ' + v; }), function (v) { helps.push(v); });
};

print.register('!help', 'Näytä ohjeet komennoille.');

module.exports = print;
