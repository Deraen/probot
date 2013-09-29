var _ = require('lodash');
var config = require('./config');

exports.applyAliases = function (name) {
  for (var real in config.users) {
    if (_.indexOf(config.users[real], name) !== -1) {
      return real;
    }
  }
  return name;
};
