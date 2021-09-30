import process from 'process';
import {join} from 'path';
import {spawnSync} from 'child_process';
import {pathExists, removeSync, mkdirSync} from 'fs-extra';
import test from 'ava';

const TEST_PROJECT = join(process.cwd(), '../test-near-runner-ava-bootstrap');

test.before(async () => {
  if (await pathExists(TEST_PROJECT)) {
    throw new Error(`${TEST_PROJECT} already exists! Aborting.`);
  }

  mkdirSync(TEST_PROJECT);

  spawnSync('node', [
    join(__dirname, '../scripts/cli.js'),
    '--bootstrap',
    '--no-install',
  ], {
    cwd: TEST_PROJECT,
  });
});

test.after.always(() => {
  removeSync(TEST_PROJECT);
});

for (const file of [
  'near-runner/.gitignore',
  'near-runner/README.md',
  'near-runner/__tests__/main.ava.ts',
  'near-runner/ava.config.cjs',
  'near-runner/package.json',
  'near-runner/tsconfig.json',
  'test.bat',
  'test.sh',
]) {
  test(`bootstrapped project includes '${file}'`, async t => {
    t.assert(await pathExists(`${TEST_PROJECT}/${file}`));
  });
}

test('using --no-install skips installing node_modules', async t => {
  t.assert(!await pathExists(`${TEST_PROJECT}/near-runner/node_modules`));
});

test('package.json includes correct version of near-runner-ava', t => {
  const {version} = require(join(__dirname, '../package.json')); // eslint-disable-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const packageJson = require(join(TEST_PROJECT, 'near-runner/package.json')); // eslint-disable-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  t.is(packageJson.devDependencies!['near-runner-ava'], version); // eslint-disable-line @typescript-eslint/no-unsafe-member-access
});
