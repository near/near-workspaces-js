module.exports = require('near-runner-ava/ava.config.cjs');

module.exports.files.push(
  '!packages/init/bootstrap-starter/**/*',
  '!test-near-runner-init/**/*',
  '!packages/init/__tests__/install.ava.ts',
);
