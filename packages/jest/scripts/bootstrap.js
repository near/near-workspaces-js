#!/usr/bin/env node

const {join} =  require('path');
const {existsSync} = require('fs');
const {spawnSync} = require('child_process');
const {copySync} = require('fs-extra');

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

const install = spawnSync('npm', [
  'install',
  '--save-dev',
  'near-runner-jest'
], {
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