import process from 'process';
import {join} from 'path';
import {spawnSync} from 'child_process';
import * as fs from 'fs/promises';
import {mkdirSync, pathExists, removeSync} from 'fs-extra';
import test from 'ava';

export const TEST_PROJECT = join(process.cwd(), 'test-near-workspaces-init');

test.before(async () => {
  if (await pathExists(TEST_PROJECT)) {
    removeSync(TEST_PROJECT);
  }

  mkdirSync(TEST_PROJECT);

  spawnSync('node', [join(__dirname, '../scripts/cli.js'), '--no-install'], {
    cwd: TEST_PROJECT,
  });
});

for (const file of [
  'near-workspaces/.gitignore',
  'near-workspaces/README.md',
  'near-workspaces/__tests__/main.ava.ts',
  'near-workspaces/ava.config.cjs',
  'near-workspaces/package.json',
  'near-workspaces/tsconfig.json',
  'test.bat',
  'test.sh',
]) {
  test(`bootstrapped project includes '${file}'`, async t => {
    t.assert(await pathExists(`${TEST_PROJECT}/${file}`));
  });
}

test('using --no-install skips installing node_modules', async t => {
  t.assert(!await pathExists(`${TEST_PROJECT}/near-workspaces/node_modules`));
});

test('package.json includes correct version of near-workspaces-ava', t => {
  const {version} = require(join(__dirname, '../package.json')); // eslint-disable-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const packageJson = require(join(TEST_PROJECT, 'near-workspaces/package.json')); // eslint-disable-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  t.is(packageJson.devDependencies!['near-workspaces-ava'], version); // eslint-disable-line @typescript-eslint/no-unsafe-member-access
});

test('package.json is well-formatted with line breaks', async t => {
  t.regex(
    (await fs.readFile(join(TEST_PROJECT, 'near-workspaces/package.json'))).toString(),
    /{\n/,
    'expected first line of file to only contain an opening bracket',
  );
});

test('tests pass in new project since it is nested in monorepo and has access to monorepo dependencies', t => {
  const testRun = spawnSync('yarn', [
    'test',
    '--verbose',
  ], {
    cwd: join(TEST_PROJECT, 'near-workspaces'),
  });

  const {status} = testRun;
  const stderr = testRun.stderr?.toString();
  const stdout = testRun.stdout?.toString();
  t.log('stdout:', stdout);
  t.log('stderr:', stderr);

  if (status === 0) {
    t.regex(stdout, /tests passed/);
  } else {
    t.fail(`"npm run test" failed with exit code ${String(status)}`);
  }
});
