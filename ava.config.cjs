module.exports = require('near-workspaces-ava/ava.config.cjs');

module.exports.files.push(
  '!packages/init/bootstrap-starter/**/*',
  '!test-near-workspaces-init/**/*',
  '!packages/init/__tests__/install.ava.ts',
);
