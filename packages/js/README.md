near-runner for TypeScript/JavaScript
=====================================

Write tests once, run them both on [NEAR TestNet](https://docs.near.org/docs/concepts/networks) and a controlled [NEAR Sandbox](https://github.com/near/sandbox) local environment

This software is in early beta and feedback is appreciated.


Quick Start with AVA
====================

[near-runner-ava](../ava) is a thin wrapper around near-runner-js designed to get you up and running as quickly as possible, with minimal configuration and power-boosts like [TypeScript](https://www.typescriptlang.org/). You can install it with one command. You will need [NodeJS](https://nodejs.dev/) installed. Then:

    npx near-runner-init

This command will:

* Add a `near-runner` directory to the folder where you ran the command. This directory contains all the configuration needed to get you started with near-runner-ava, and a `__tests__` subfolder with a well-commented example test file.
* Create `test.sh` and `test.bat` scripts in the folder where you ran the command. These can be used to quickly run the tests in `near-runner`. Feel free to integrate test-running into your project in a way that makes more sense for you, and then remove these scripts.
* Install NPM dependencies using `npm install`. Most of the output you see when running the command comes from this step. You can skip this: `npx near-runner-init --no-install`.

If you want to install near-runner-ava manually, see [its README](../ava).

How It Works
============

Let's look at some code that focuses on near-runner itself, without any AVA or other testing logic.

1. Creating a `Runner`.

   ```ts
   const runner = Runner.create(async ({root}) => {
     const alice = await root.createAccount('alice');
     const contract = await root.createAndDeploy(
       'contract-account-name',
       'path/to/compiled.wasm'
     );
     return {alice, contract};
   });
   ```

   Let's step through this.

   1. `Runner.create` initializes a new [NEAR Sandbox](https://docs.near.org/docs/develop/contracts/sandbox) node/instance. This is essentially a mini-NEAR blockchain created just for this test. Each of these Sandbox instances gets its own data directory and port, so that tests can run in parallel.
   2. `root.createAccount` creates a new account with the given name.
   3. `root.createAndDeploy` creates a new account with the given name, then deploys the specified Wasm file to it.
   4. `path/to/compiled.wasm` will resolve relative to your project root. That is, the nearest directory with a `package.json` file, or your current working directory if no `package.json` is found. To construct a path relative to your test file, you can use `path.join(__dirname, '../etc/etc.wasm')` ([more info](https://nodejs.org/api/path.html#path_path_join_paths)).
   5. After `Runner.create` finishes running the function passed into it, it gracefully shuts down the Sandbox instance it ran in the background. However, it keeps the data directory around. That's what stores the state of the two accounts that were created (`alice` and `contract-account-name` with its deployed contract).
   6. `runner` contains a reference to this data directory, so that multiple tests can use it as a starting point.
   7. The object returned, `{alice, contract}`, will be passed along to subsequent tests.

2. Writing tests.

   near-runner is designed for concurrency (which is why it's a great fit for AVA, which runs tests concurrently by default). Here's a simple way to get concurrent runs using plain JS (for a working example, see [near-examples/rust-status-message](https://github.com/near-examples/rust-status-message/pull/68)):

   ```ts
   await Promise.all([
     runner.run(async ({alice, contract}) => {
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
     }),
     runner.run(async ({alice, contract}) => {
       const result = await contract.view(
         'some_view_function',
         {account_id: alice}
       );
       assert.equal(result, 'some default');
     });
   ]);
   ```

   Let's step through this.

   1. Like the earlier call to `Runner.create`, each call to `runner.run` sets up its own Sandbox instance. Each will copy the data directory set up earlier as the starting point for its tests. Each will use a unique port so that tests can be safely run in parallel.
   2. `call` syntax mirrors [near-cli](https://github.com/near/near-cli) and either returns the successful return value of the given function or throws the encountered error. If you want to inspect a full transaction and/or avoid the `throw` behavior, you can use `call_raw` instead.
   3. While `call` is invoked on the account _doing the call_ (`alice.call(contract, …)`), `view` is invoked on the account _being viewed_ (`contract.view(…)`). This is because the caller of a view is irrelevant and ignored.
   4. Gotcha: the full account names may or may not match the strings passed to `createAccount` and `createAndDeploy`, which is why you must write `alice.call(contract, …)` rather than `alice.call('contract-account-name', …)`. But! The `Account` class overrides `toJSON` so that you can pass `{account_id: alice}` in arguments rather than `{account_id: alice.accountId}`. If you need the generated account ID in some other circumstance, remember to use `alice.accountId`.


See the [\_\_tests__](./__tests__) directory in this project for more examples.

Running on Testnet
==================

near-runner is set up so that you can write tests once and run them against a local Sandbox node (the default behavior) or against [NEAR TestNet](https://docs.near.org/docs/concepts/networks). Some reasons this might be helpful:

* Gives higher confidence that your contracts work as expected
* You can test against deployed testnet contracts
* If something seems off in Sandbox mode, you can compare it to testnet
* Until we have a full-featured dev environment that includes Explorer, Wallet, etc, you can write full end-to-end tests using a tool like [Cypress](https://www.cypress.io/)

You can run in testnet mode in two ways.

1. When creating your Runner, pass a config object as the first argument:

   ```ts
   const runner = Runner.create(
     {network: 'testnet'},
     async ({root}) => { … }
   )
   ```

2. Set the `NEAR_RUNNER_NETWORK` environment variable when running your tests:

   ```bash
   NEAR_RUNNER_NETWORK=testnet node test.js
   ```

If you set both, the config object takes precedence.


Stepping through a testnet example
----------------------------------

Let's revisit a shortened version of the example from How It Works above, describing what will happen in Testnet.

1. Create a `Runner`.

   ```ts
   const runner = Runner.create(async ({root}) => {
     await root.createAccount('alice');
     await root.createAndDeploy(
       'contract-account-name',
       'path/to/compiled.wasm'
     );
   });
   ```

   Let's step through this.

   1. `Runner.create` does not interact with Testnet at all yet. Instead, the function runs at the beginning of each subsequent call to `runner.run`. This matches the semantics of the sandbox that all subsequent calls to `run` have the same starting point, however, testnet requires that each call have its own account. In fact `Runner.create` creates a unique testnet account and each test is a unique sub-account.

2. Write tests.

   ```ts
   await Promise.all([
     runner.run(async ({alice, contract}) => {
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
     }),
     runner.run(async ({alice, contract}) => {
       const result = await contract.view(
         'some_view_function',
         {account_id: alice}
       );
       assert.equal(result, 'some default');
     });
   ]);
   ```

   Each call to `runner.run` will:

   - Get or create its own sub-account on testnet account, e.g. `t.rdsq0289478`. If creating the account the keys will be stored at `$PWD/.near-credentials/runner/testnet/t.rdsq0289478.json`.
   - Run the `initFn` passed to `Runner.create`
   - Create sub-accounts for each `createAccount` and `createAndDeploy`, such as `alice.t.rdsq0289478`
   - If the test account runs out of funds to create accounts it will request a transfer from the root account.
   - After the test is finished each account created is deleted and the funds sent back to the test account.

Note: Since the testnet accounts are cached, if account creation rate limits are reached simply wait a little while and try again.

Skipping Sandbox-specific tests
-------------------------------

If some of your runs take advantage of Sandbox-specific features, you can skip these on testnet in a couple ways:

1. `runSandbox`: Instead of `runner.run`, you can use `runner.runSandbox`:

   ```ts
   await Promise.all([
     runner.run(async ({…}) => {
       // runs on any network, sandbox or testnet
     }),
     runner.runSandbox(async ({…}) => {
       // only runs on sandbox network
     });
   ]);
   ```

2. `Runner.networkIsSandbox`: You can also skip entire sections of your files by checking `Runner.networkIsSandbox` (`Runner.networkIsTestnet` and `Runner.getNetworkFromEnv` are also available).

   ```ts
   let runner = Runner.create(async ({root}) => ({ // note the implicit return
     contract: await root.createAndDeploy(
       'contract-account-name',
       'path/to/compiled.wasm'
     )
   }));
   runner.run('thing that makes sense on any network', async ({…}) => {
     // logic using basic contract & account interactions
   });
   if (Runner.networkIsSandbox) {
     runner.run('thing that only makes sense with sandbox', async ({…}) => {
       // logic using patch-state, fast-forwarding, etc
     });
   }
   ```

Patch State on the Fly
======================

In Sandbox-mode tests, you can add or modify any contract state, contract code, account or access key with `patchState`.

You cannot perform arbitrary mutation on contract state with transactions since transactions can only include contract calls that mutate state in a contract-programmed way. For example, with an NFT contract, you can perform some operation with NFTs you have ownership of, but you cannot manipulate NFTs that are owned by other accounts since the smart contract is coded with checks to reject that. This is the expected behavior of the NFT contract. However, you may want to change another person's NFT for a test setup. This is called "arbitrary mutation on contract state" and can be done with `patchState`. Alternatively you can stop the node, dump state at genesis, edit genesis, and restart the node. The later approach is more complicated to do and also cannot be performed without restarting the node.

It is true that you can alter contract code, accounts, and access keys using normal transactions via the `DeployContract`, `CreateAccount`, and `AddKey` [actions](https://nomicon.io/RuntimeSpec/Actions.html?highlight=actions#actions). But this limits you to altering your own account or sub-account. `patchState` allows you to perform these operations on any account.

To see an example of how to do this, see the [patch-state test](__tests__/02.patch-state.spec.ts).

near-runner will support expanded patchState-based functionality in the future:

* [Allow bootstrapping sandbox environment from testnet/mainnet contracts & state](#39)
* [Allow replaying all transactions from testnet/mainnet](#40)
* [Support time-travel / fast-forwarding](#1)


Pro Tips
========

* `NEAR_RUNNER_DEBUG=true` – run tests with this environment variable set to get copious debug output and a full log file for each Sandbox instance.

* `Runner.create` [config](https://github.com/near/runner/blob/9ab25a74ba47740a1064aebea02b642b51bb50d4/src/runtime/runtime.ts#L11-L20) – you can pass a config object as the first argument to `Runner.create`. This lets you do things like:

  * skip initialization if specified data directory already exists

    ```ts
    Runner.create(
      { init: false, homeDir: './test-data/alice-owns-an-nft' },
      async ({root}) => { … }
    )
    ```

  * always recreate such data directory instead (the default behavior)

  * specify which port to run on

  * and more!
