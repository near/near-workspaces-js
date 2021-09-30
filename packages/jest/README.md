DEPRECATED
==========

This package has been deprecated in favor of [near-runner-ava](https://www.npmjs.com/package/near-runner-ava), since [Jest's concurrency is unreliable](https://github.com/near/runner-js/pull/63).

If you are interested in resurrecting and maintaining this package, please get in touch with the maintainers of [near-runner](https://github.com/near/runner-js).


near-runner + Jest
------------------

A thin wrapper around [near-runner] to make it easier to use with [Jest] and [TypeScript]. If you don't want Jest, use near-runner directly.

Write tests once, run them both on [NEAR TestNet](https://docs.near.org/docs/concepts/networks) and a controlled [NEAR Sandbox](https://github.com/near/sandbox) local environment.


  [near-runner]: https://github.com/near/runner-js
  [Jest]: https://jestjs.io/
  [TypeScript]: https://www.typescriptlang.org/

Quick Start
-----------

`near-runner-jest --bootstrap` is a one-time command to quickly initialize a project with near-runner-jest. You will need [NodeJS] installed. Then:

    npx near-runner-jest --bootstrap

It will:

* Add a `near-runner` directory to the folder where you ran the command. This directory contains all the configuration needed to get you started with near-runner-jest, and a `__tests__` subfolder with a well-commented example test file.
* Create `test.sh` and `test.bat` scripts in the folder where you ran the command. These can be used to quickly run the tests in `near-runner`. Feel free to integrate test-running into your project in a way that makes more sense for you, and then remove these scripts.
* Install `near-runner-jest` as a dependency using `npm install --save-dev` (most of the output you see when running the command comes from this step).

  [NodeJS]: https://nodejs.dev/

Manual Install
--------------

1. Install.

   ```bash
   npm install --save-dev near-runner-jest # npm
   yarn add --dev near-runner-jest         # yarn
   ```

2. Configure.

   You can use the `near-runner-jest` script to run `jest` using a [custom configuration file](./jest.config.js). You can add this to your `test` script in your `package.json`:

       "test": "near-runner-jest"

   Now you can run tests with `npm run test` or `yarn test`.

   If you want to write tests with TypeScript (recommended), you can add a `tsconfig.json` to your project root with the following contents:

       {"extends": "near-runner-jest/tsconfig.jest.json"}

   If you already have TypeScript set up and you don't want to extend the config from `near-runner-jest`, feel free to just copy the settings you want from [tsconfig.jest.json](./tsconfig.jest.json).

2. Initialize.

   Make a `__tests__` folder, make your first test file. Call your first test file `main.spec.ts` if you're not sure what else to call it.

   (near-runner-jest uses [Jest's default test matcher](https://jestjs.io/docs/configuration#testmatch-arraystring), which will find any `*.ts` or `*.js` files in the `__tests__` directory and any files project-wide with a `*.(spec|test).(ts|js)` suffix. "Project-wide" here means "the directory in which you run `near-runner-jest`.")

   In `main.spec.ts`, set up a `runner` with NEAR accounts, contracts, and state that will be used in all of your tests.

   ```ts
   import path from 'path';
   import {Runner} from 'near-runner-jest';

   const runner = Runner.create(async ({root}) => {
      const alice = await root.createAccount('alice');
      const contract = await root.createAndDeploy(
        'contract-account-name',
        path.join(__dirname, '..', 'path', 'to', 'compiled.wasm'),
      );

      // make other contract calls that you want as a starting point for all tests

      return {alice, contract};
   });

   describe('my contract', () => {
     // tests go here
   });
   ```

   `describe` is [from Jest](https://jestjs.io/docs/setup-teardown) and is optional.

4. Write tests.

   ```ts
   describe('my contract', () => {
     runner.test('does something', async ({alice, contract}) => {
       await alice.call(
         contract,
         'some_update_function',
         {some_string_argument: 'cool', some_number_argument: 42}
       );
       const result = await contract.view(
         'some_view_function',
         {account_id: alice}
       );
       expect(result).toBe('whatever');
     });

     runner.test('does something else', async ({alice, contract}) => {
       const result = await contract.view(
         'some_view_function',
         {account_id: alice}
       );
       expect(result).toBe('some default');
     });
   });
   ```

   `runner.test` is added to `near-runner` by `near-runner-jest`, and is shorthand for:

   ```ts
   test.concurrent('does something', async () => {
     await runner.run(async ({…}) => {
       // tests go here
     });
   });
   ```

   Where `test.concurrent` comes [from Jest](https://jestjs.io/docs/api#testconcurrentname-fn-timeout) and `runner.run` comes [from near-runner](https://github.com/near/runner-js#how-it-works).

See the [`__tests__`](https://github.com/near/runner-js/tree/main/__tests__) directory in near-runner-js for more examples. Remember that you can replace the nested `test.concurrent`…`await runner.run` sequences with `runner.test`.

Configuring Jest
----------------

By default, near-runner-jest includes a minimal [jest.config.js](./jest.config.js). To override or extend these settings, add your own `jest.config.js` to the root of your project and import near-runner-jest's as a starting point. For example, to set `testMatch` back to [Jest's default](https://jestjs.io/docs/configuration#testmatch-arraystring):

```js
const config = require('near-runner-jest/jest.config');

module.exports = {
  ...config,
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)"
  ]
}
```

If you want to put this `jest.config.js` somewhere other than your project root, you may need to update your `test` script in `package.json`:

```diff
- "test": "near-runner-jest"
+ "test": "near-runner-jest --config ./jest.config.js"
```

Note that command-line flags other than `--bootstrap` get passed along to the `jest` command; see [Jest's CLI options](https://jestjs.io/docs/cli) for possibilities.