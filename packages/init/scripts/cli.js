#!/usr/bin/env node

const {join} =  require('path');
const {existsSync} = require('fs');
const {spawnSync} = require('child_process');
const {copySync, writeJsonSync} = require('fs-extra');

const HELP = `Bootstrap a project with near-runner-ava. Examples:

    near-runner-init             # Bootstrap a project with near-runner-ava
    near-runner-init -h, --help  # Print this (for AVA's help, use 'ava --help')`;

if (process.argv.includes('-h') || process.argv.includes('--help')) {
  console.log(HELP);
  process.exit(0);
}

if (existsSync(join(process.cwd(), 'near-runner'))) {
  console.log(
    'near-runner directory exists; perhaps you already bootstrapped?'
  );
  process.exit(1);
}

try {
  copySync(
    join(__dirname, '..', 'bootstrap-starter', 'near-runner'),
    join(process.cwd(), 'near-runner')
  );
  copySync(
    join(__dirname, '..', 'bootstrap-starter', 'test.sh'),
    join(process.cwd(), 'test.sh')
  );
  copySync(
    join(__dirname, '..', 'bootstrap-starter', 'test.bat'),
    join(process.cwd(), 'test.bat')
  );
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exit(1);
}

const packageJsonFile = join(process.cwd(), 'near-runner/package.json');
const version = require(join(__dirname, '../package.json')).version;
const packageJson = require(packageJsonFile);
packageJson.devDependencies['near-runner-ava'] = version;
writeJsonSync(packageJsonFile, packageJson, { spaces: 2 });

if (!process.argv.includes('--no-install')) {
  const install = spawnSync('npm', ['install'], {
    cwd: join(process.cwd(), 'near-runner'),
    stdio: 'inherit',
  });

  if (install.error) {
    if (install.error instanceof Error) {
      console.error(install.error.message);
    } else {
      console.error(install.error);
    }
    process.exit(1);
  }
}