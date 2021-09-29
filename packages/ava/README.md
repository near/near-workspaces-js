near-runner + AVA
==================

A thin wrapper around [near-runner] to make it easier to use with [AVA] and [TypeScript]. If you don't want AVA, use near-runner directly.

Write tests once, run them both on [NEAR TestNet](https://docs.near.org/docs/concepts/networks) and a controlled [NEAR Sandbox](https://github.com/near/sandbox) local environment.


  [near-runner]: https://github.com/near/runner-js
  [AVA]: https://github.com/avajs/ava
  [TypeScript]: https://www.typescriptlang.org/

Quick Start
===========

`near-runner-ava --bootstrap` is a one-time command to quickly initialize a project with `near-runner-ava`. You will need [NodeJS] installed. Then:

    npx near-runner-ava --bootstrap

It will:

* Add a `near-runner` directory to the folder where you ran the command. This directory contains all the configuration needed to get you started with near-runner-ava, and a `__tests__` subfolder with a well-commented example test file.
* Create `test.sh` and `test.bat` scripts in the folder where you ran the command. These can be used to quickly run the tests in `near-runner`. Feel free to integrate test-running into your project in a way that makes more sense for you, and then remove these scripts.
* Install NPM dependencies using `npm install`. Most of the output you see when running the command comes from this step. You can skip this: `npx near-runner-ava --bootstrap --no-install`.

  [NodeJS]: https://nodejs.dev/

Manual Install
==============

1. Install.

   ```bash
   npm install --save-dev near-runner-ava # npm
   yarn add --dev near-runner-ava         # yarn
   ```

2. Configure.

   AVA [currently requires](https://github.com/avajs/ava/issues/2285) that your project have its own [AVA config file](https://github.com/avajs/ava/blob/main/docs/06-configuration.md). Add a file called `ava.config.cjs` next to your `package.json` with the following contents:

   ```js
   module.exports = require('near-runner-ava/ava.config.cjs');
   ```

   We also recommend using the `near-runner-ava` script to run your tests. This is mostly an alias for `ava`, and passes CLI arguments other than `--bootstrap` right through.

       "test": "near-runner-ava"

   Now you can run tests with `npm run test` or `yarn test`.

   If you want to write tests with TypeScript (recommended), you can add a `tsconfig.json` to your project root with the following contents:

       {"extends": "near-runner-ava/tsconfig.ava.json"}

   If you already have TypeScript set up and you don't want to extend the config from `near-runner-ava`, feel free to just copy the settings you want from [tsconfig.ava.json](./tsconfig.ava.json).

2. Initialize.

   Make a `__tests__` folder, make your first test file. Call it `main.ava.ts` if you're not sure what else to call it. The AVA config you extended above will find files that match the `*.ava.(ts|js)` suffix.

   In `main.ava.ts`, set up a `runner` with NEAR accounts, contracts, and state that will be used in all of your tests.

   ```ts
   import {Runner} from 'near-runner-ava';

   const runner = Runner.create(async ({root}) => {
      const alice = await root.createAccount('alice');
      const contract = await root.createAndDeploy(
        'contract-account-name',
        'path/to/compiled.wasm'
      );

      // make other contract calls that you want as a starting point for all tests

      return {alice, contract};
   });
   ```

4. Write tests.

   ```ts
    runner.test("does something", async (t, { alice, contract }) => {
      await alice.call(contract, "some_update_function", {
        some_string_argument: "cool",
        some_number_argument: 42,
      });
      const result = await contract.view("some_view_function", {
        account_id: alice,
      });
      // When --verbose option is used this will print neatly underneath the test in the output.
      t.log(result)
      t.is(result, "whatever");
    });

    runner.test("does something else", async (t, { alice, contract }) => {
      const result = await contract.view("some_view_function", {
        account_id: alice,
      });
      t.is(result, "some default");
    });
    ```

    `runner.test` is added to `near-runner` by `near-runner-ava`, and is shorthand for:

    ```ts
    import test from 'ava';

    test('does something', async (t) => {
      await runner.run(async ({…}) => {
        // tests go here
      });
    });
   ```

   Where [`test`](https://github.com/avajs/ava/blob/main/docs/01-writing-tests.md) and [`t`](https://github.com/avajs/ava/blob/main/docs/03-assertions.md) come from AVA and [`runner.run`](https://github.com/near/runner-js#how-it-works) comes from near-runner.

See the [`__tests__`](https://github.com/near/runner-js/tree/main/__tests__) directory for more examples.
