#!/usr/bin/env node

const HELP = `Run near-runner-ava tests. Examples:

    near-runner-ava             # Run tests using 'ava'
    near-runner-ava --verbose   # All other flags get passed to the 'ava' CLI
    near-runner-ava -h, --help  # Print this (for AVA's help, use 'ava --help')`;

if (process.argv.includes('-h') || process.argv.includes('--help')) {
  console.log(HELP);
} else {
  require('ava/lib/cli.js').run(); // eslint-disable-line import/extensions
}