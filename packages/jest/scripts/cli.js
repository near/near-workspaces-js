#!/usr/bin/env node

const HELP = `Run near-runner-jest tests, or bootstrap a project. Examples:

    near-runner-jest --bootstrap # Bootstrap a project with near-runner-jest.
    near-runner-jest             # Run tests using 'jest', using custom config.
    near-runner-jest --verbose   # All other flags get passed to the 'jest' CLI.
    near-runner-jest -h, --help  # Print this. For Jest's help, use 'jest -h'.`;

if (process.argv.includes('-h') || process.argv.includes('--help')) {
  console.log(HELP);
} else if (process.argv.includes('--bootstrap')) {
  require('./bootstrap');
} else {
  require('./jest');
}