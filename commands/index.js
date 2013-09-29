
module.exports = {
  add: require('./tasks'),
  help: require('./help'),
  ask: require('./questions.js').ask,
  answer: require('./questions.js').answer,
};
