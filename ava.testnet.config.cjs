module.exports = {
  ...require('near-runner-ava/ava.testnet.config.cjs'),
  ...require('./ava.config.cjs'),
};

module.exports.files.push(
  '!__tests__/02*',
);
