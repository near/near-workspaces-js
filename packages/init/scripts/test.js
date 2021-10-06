#!/usr/bin/env node

/**
 * This script is meant to run on CI environments where we can test that
 * `near-runner-init` works for the expected range of NodeJS versions and that
 * it correctly installs all dependencies and runs tests. It does not run as
 * part of the normal test workflow (see __tests__/no-install.ava.ts for that),
 * and is not meant to be included in the `files` list in package.json.
 */

const {join} = require('path');
const {spawnSync} = require('child_process');
const {pathExists, removeSync, mkdirSync} = require('fs-extra');

/**
 * Unlike the no-install.ava.ts test, this creates the new project outside the
 * monorepo, which means it cannot rely on Node finding the monorepo's
 * dependencies for the `near-runner-ava` lookup. This is a truer test that
 * everything works as expected.
 */
const TEST_PROJECT = join(process.cwd(), '../test-near-runner-init');

(async () => {
  if (await pathExists(TEST_PROJECT)) {
    console.log(`Removing project ${TEST_PROJECT}`);
    removeSync(TEST_PROJECT);
  }

  console.log(`Creating new project ${TEST_PROJECT}`);
  mkdirSync(TEST_PROJECT);

  console.log('Running `near-runner-init`');
  spawnSync('node', [join(__dirname, './cli.js')], {
    cwd: TEST_PROJECT,
    stdio: ['inherit', 'inherit', 'inherit'],
  });

  console.log('\nRunning `yarn test --verbose`');
  const testRun = spawnSync('yarn', [
    'test',
    '--verbose',
  ], {
    cwd: join(TEST_PROJECT, 'near-runner'),
    stdio: ['inherit', 'inherit', 'inherit'],
  });

  const {status} = testRun;
  if (status !== 0) {
    console.error(`"npm run test" failed with exit code ${status}`);
    process.exit(status);
  }

  console.log(`\nIt worked! Removing ${TEST_PROJECT}`);
  removeSync(TEST_PROJECT);
})();
