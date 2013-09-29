var config = require('./config');

var client = null;

var say = function (msg) {
  client.say(config.channel, msg);
};
say.setClient = function (c) {
  client = c;
};

module.exports = say;

