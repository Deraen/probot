var _ = require('lodash');

var config = require('../config');

var helps = [];

var print = function (from, msg, cb) {
  cb(null, helps);
};

print.register = function (main) {
  var extra = _.rest(arguments);
  helps.push(main);
  _.each(_.map(extra, function (v) { return '    ' + v; }), function (v) { helps.push(v); });
};

print.register('!help', 'Näytä ohjeet komennoille.');

module.exports = print;
