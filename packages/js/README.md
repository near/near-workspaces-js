<div align="center">

  <h1>NEAR Workspaces (TypeScript/JavaScript Edition)</h1>

  [![Project license](https://img.shields.io/badge/license-Apache2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
  [![Project license](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Discord](https://img.shields.io/discord/490367152054992913?label=discord)](https://discord.gg/Vyp7ETM)
  [![NPM version](https://img.shields.io/npm/v/near-workspaces.svg?style=flat-square)](https://npmjs.com/near-workspaces)
  [![Size on NPM](https://img.shields.io/bundlephobia/minzip/near-workspaces.svg?style=flat-square)](https://npmjs.com/near-workspaces)

</div>

`NEAR Workspaces` is a library for automating workflows and writing tests for NEAR smart contracts. You can use it as is or integrate with test runner of your choise (AVA, Jest, Mocha, etc.). If you don't have a preference, we suggest you to use AVA.

Quick Start (without testing frameworks)
===========
To get started with `Near Workspaces` you need to do only two things:

1. Initialize a `Worker`.

    ```ts
    const worker = await Worker.init();
    const root = worker.rootAccount;

    const alice = await root.createSubAccount('alice');
    const contract = await root.devDeploy('path/to/compiled.wasm');
    ```

2. Writing tests.

   `near-workspaces` is designed for concurrency. Here's a simple way to get concurrent runs using plain JS:

   ```ts
   import {strict as assert} from 'assert';

   await Promise.all([
     async () => {
       await alice.call(
         contract,
         'some_update_function',
         {some_string_argument: 'cool', some_number_argument: 42}
       );
       const result = await contract.view(
         'some_view_function',
         {account_id: alice}
       );
       assert.equal(result, 'whatever');
     },
     async () => {
       const result = await contract.view(
         'some_view_function',
         {account_id: alice}
       );
       /* Note that we expect the value returned from `some_view_function` to be
       a default here, because this `fork` runs *at the same time* as the
       previous, in a separate local blockchain */
       assert.equal(result, 'some default');
     }
   ]);
   ```
    ```

More info in our main README: https://github.com/near/workspaces-js
