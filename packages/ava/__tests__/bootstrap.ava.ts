import process from 'node:process';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {removeSync} from 'fs-extra';
import test from 'ava';

const TEST_PROJECT = join(process.cwd(), '../test-near-runner-ava-bootstrap');

test.before(() => {
  if (existsSync(TEST_PROJECT)) {
    throw new Error(`${TEST_PROJECT} already exists! Aborting.`);
  }

  spawnSync('mkdir', [TEST_PROJECT]);
});

test.after(() => {
  removeSync(TEST_PROJECT);
});

test('can bootstrap a project with `npx near-runner-ava --bootstrap`', t => {
  spawnSync('node', [
    join(__dirname, '../scripts/cli.js'),
    '--bootstrap',
  ], {
    cwd: TEST_PROJECT,
  });
  t.assert(existsSync(`${TEST_PROJECT}/near-runner`));
  t.assert(existsSync(`${TEST_PROJECT}/near-runner/package.json`));
  t.assert(existsSync(`${TEST_PROJECT}/near-runner/node_modules`));
  t.assert(existsSync(`${TEST_PROJECT}/near-runner/__tests__/main.ava.ts`));
  t.assert(existsSync(`${TEST_PROJECT}/near-runner/.gitignore`));
  t.assert(existsSync(`${TEST_PROJECT}/near-runner/ava.config.cjs`));
  t.assert(existsSync(`${TEST_PROJECT}/near-runner/README.md`));
  t.assert(existsSync(`${TEST_PROJECT}/near-runner/tsconfig.json`));
  t.assert(existsSync(`${TEST_PROJECT}/test.bat`));
  t.assert(existsSync(`${TEST_PROJECT}/test.sh`));
});
