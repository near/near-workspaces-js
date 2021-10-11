require('util').inspect.defaultOptions.depth = 5; // Increase AVA's printing depth

module.exports = {
  timeout: '60000',
  files: ['**/*.ava.ts', '**/*.ava.js'],
  extensions: [
    'ts',
    'js',
  ],
  require: [
    'ts-node/register',
  ],
};
