module.exports = {
  timeout: '60000',
  files: ['**/*.ava.ts', '**/*.ava.js'],
  extensions: [
    'ts',
    'js',
  ],
  require: [
    'ts-node/register',
    './setup.js',
  ],
};
