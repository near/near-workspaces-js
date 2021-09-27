#!/usr/bin/env node
const cli = require('ava/lib/cli.js'); // eslint-disable-line import/extensions


const {join} =  require('path');

if (!process.argv.includes('--config')) {
  process.argv.push('--config', join(__dirname, '..', 'ava.config.cjs'));
}

cli.run();
