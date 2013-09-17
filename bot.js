var fs = require('fs');
var path = require('path');
var irc = require('irc');
var _ = require('lodash');
var optimist = require('optimist');
var moment = require('moment');
var exec = require('child_process').exec;
var config = require('./config.js');

// --

var buffer = [];
setInterval(function () {
  var cb = _.after(buffer.length, function () {
    exec('git add hours.tsv', opts, function () {
      exec('git commit -m Task.', opts, function () {
        exec('git push', opts, function () {
        });
      });
    });
    buffer.length = 0;
  });

  var opts = {cwd: path.resolve(__dirname, config.repo)};
  exec('git fetch', opts, function () {
    exec('git reset --hard origin/master', opts, function () {
      buffer.forEach(function (foo) {
        fs.appendFile(config.repo + '/hours.tsv', foo.date + '\t' + foo.duration + '\t' + foo.category + '\t' + foo.participants.join(',') + '\t' + foo.summary + '\n', cb);
      });
    });
  });
}, 60 /* sec */ * 1000);

var client = new irc.Client(config.server, config.nick, {
  channels: [config.channel]
});
var say = function (msg) {
  client.say(config.channel, msg);
};

var commands = {
  'add': function (from, msg) {
    var args = optimist.parse(msg);
    var errors = [];

    // Users arg
    var participants = [from];
    if (args.users) {
      participants = args.users.split(',');
    }

    participants = _.map(participants, function (name) {
      for (var real in config.users) {
        if (_.indexOf(config.users[real], name) !== -1) {
          return real;
        }
      }
      return name;
    });

    _.each(participants, function (name) {
      if (!_.has(config.users, name)) {
        errors.push('Tuntematon käyttäjä: ' + name);
      }
    });

    // Date arg
    var date = moment().format('D.M.YYYY');
    if (args.date) {
      date = args.date;
    }

    // Category arg
    var category = (_.first(args._) || '').toUpperCase();
    args._ = _.rest(args._);

    if (_.indexOf(config.categories, category) === -1) {
      errors.push('Tuntematon kategoria: ' + category);
    }

    // Duration
    var duration = parseFloat(_.first(args._));
    args._ = _.rest(args._);
    if (!_.isNumber(duration)) {
      errors.push('Virheellinen kesto');
    }

    // Summary
    var summary = args._.join(' ').replace(/�/g, 'ö').replace(/�/g, 'ä').replace(/�/g, 'Ä').replace(/�/g, 'Ö');
    if (summary.length <= 0) {
      errors.push('Ei kuvausta');
    }

    if (errors.length === 0) {
      say('++ ' + date + ' - ' + duration + ' tuntia. Kategoria ' + category + '. Osallisina ' + participants.join(', ') + '. Viesti: ' + summary + '.');

      buffer.push({date: date, duration: duration, category: category, participants: participants, summary: summary});
    } else {
      say('Virhe. ' + errors.join('. '));
    }
  },
  'help': function () {
    say(
'HELP: \n' +
'DURATION: Kesto tunteina. Voi olla liukuluku. Perään voi merkitä h. esim. 2, 3.5h, 10, 15h\n' +
'Kategoriat: Documentation (DOC), Requirements gathering (REQ), Design (DES), Implementation (IMP), Testing (TEST), Meetings (MEET), Teaching (TEA), and Other (OTH)\n' +
'!add [--users user1[,user2]] [--date DD.MM.YYYY] [' + config.categories.join('|') + '] DURATION And a summary for a task.\n')
  }
};

client.addListener('message' + config.channel, function (from, message) {
  var split = message.replace(/[\s\n\r]+/g, ' ').split(' ');
  for (var command in commands) {
    if ('!' + command === _.first(split)) {
      commands[command](from, _.rest(split));
    }
  }
});
