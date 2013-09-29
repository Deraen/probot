var irc = require('irc');
var _ = require('lodash');
var config = require('./config.js');

var client = new irc.Client(config.server, config.nick, {
  channels: [config.channel]
});
require('./say').setClient(client);

var commands = require('./commands');

client.addListener('message' + config.channel, function (from, message) {
  console.log(message);

  var split = message.replace(/[\s\n\r]+/g, ' ').split(' ');
  var cmd = _.first(split);
  if (cmd.length > 0 && cmd[0] == '!' && _.has(commands, cmd.substr(1))) {
    commands[cmd.substr(1)](from, _.rest(split));
  }
});
