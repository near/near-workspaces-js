#!/usr/bin/env node

const {join} =  require('path');

if (!process.argv.includes('--config')) {
  process.argv.push('--config', join(__dirname, '..', 'jest.config.js'));
}

require('jest-cli/bin/jest');
