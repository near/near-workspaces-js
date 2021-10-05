import process from 'process';
import {join} from 'path';
import {spawnSync} from 'child_process';
import {pathExists, removeSync, mkdirSync} from 'fs-extra';
import test from 'ava';

// Note that TEST_PROJECT is nested within the `near-runner` monorepo, so it has
// access to monorepo's dependencies. This makes it easy to check that tests
// pass in the newly-created project without wasting time on an `npm install`,
// but it could also lead to mismatches between this test and real-world uses
// of `near-runner-init`.
const TEST_PROJECT = join(process.cwd(), 'test-near-runner-init');

test.before(async () => {
  if (await pathExists(TEST_PROJECT)) {
    removeSync(TEST_PROJECT);
  }

  mkdirSync(TEST_PROJECT);

  spawnSync('node', [
    join(__dirname, '../scripts/cli.js'),
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

test('tests pass in new project', t => {
  const testRun = spawnSync('yarn', [
    'test',
    '--verbose',
  ], {
    cwd: join(TEST_PROJECT, 'near-runner'),
  });

  const {status} = testRun;
  const stderr = testRun.stderr.toString();
  const stdout = testRun.stdout.toString();
  t.log(stdout);
  t.log(stderr);

  if (status === 0) {
    t.regex(stdout, /tests passed/);
  } else {
    t.fail(`"npm run test" failed with exit code ${status}`);
  }
});
