near-runner for TypeScript/JavaScript
=====================================

Write tests once, run them both on [NEAR TestNet](https://docs.near.org/docs/concepts/networks) and a controlled [NEAR Sandbox](https://github.com/near/sandbox) local environment

This software is in early beta.


Quick Start
===========

1. Install.

       npm install --save-dev near-runner

   or

       yarn add --dev near-runner

2. Import.

       import { Runner } from 'near-runner'

3. Create a `Runner`.

   ```ts
   const runner = await Runner.create(async ({ runtime }) => {
     const alice = await runtime.createAccount('alice')
     const contract = await runtime.createAndDeploy(
       'contract-account-name',
       './path/to/compiled.wasm'
     )
     return { alice, contract }
   })
   ```

   Let's step through this.

   1. `Runner.create` initializes a new [NEAR Sandbox](https://docs.near.org/docs/develop/contracts/sandbox) node/instance. This is essentially a mini-NEAR blockchain created just for this test. Each of these Sandbox instances gets its own data directory and port, so that tests can run in parallel.
   2. `runtime.createAccount` creates a new account with the given name.
   3. `runtime.createAndDeploy` creates a new account with the given name, then deploys the specified Wasm file to it.
   4. After `Runner.create` finishes running the function passed into it, it gracefully shuts down the Sandbox instance it ran in the background. However, it keeps the data directory around. That's what stores the state of the two accounts that were created (`alice` and `contract-account-name` with its deployed contract).
   5. `runner` contains a reference to this data directory, so that multiple tests can use it as a starting point.
   6. The object returned, `{ alice, contract } `, will be passed along to subsequent tests.

4. Write tests.

   ```ts
   await Promise.all([
     runner.run(async ({ alice, contract }) => {
       await alice.call(
         contract,
         'some_update_function',
         { some_string_argument: 'cool', some_number_argument: 42 }
       )
       const result = await contract.view(
         'some_view_function',
         { account_id: alice.accountId }
       )
       assert.equal(result, 'whatever')
     }),
     runner.run(async ({ alice, contract }) => {
       const result = await contract.view(
         'some_view_function',
         { account_id: alice.accountId }
       )
       assert.equal(result, 'some default')
     })
   ])
   ```

   Let's step through this.

   1. For this high-level example, we show tests being run in parallel by using `Promise.all`. In most real tests, your test runner will probably take care of this for you. For examples using [Jest](https://jestjs.io/), check out [the `__tests__` directory here](./__tests__).
   2. Like the earlier call to `Runner.create`, each call to `runner.run` sets up its own Sandbox instance. Each will copy the data directory set up earlier as the starting point for its tests. Each will use a unique port so that tests can be safely run in parallel.
   3. `runtime.getAccount` and `runtime.getContractAccount` get the accounts that were initialized in `Runner.create`.
   4. `call` syntax mirrors [near-cli](https://github.com/near/near-cli) and either returns the successful return value of the given function or throws the encountered error. If you want to inspect a full transaction and/or avoid the `throw` behavior, you can use `call_raw` instead.
   5. While `call` is invoked on the account _doing the call_ (`alice.call(contract, …)`), `view` is invoked on the account _being viewed_ (`contract.view(…)`). This is because the caller of a view is irrelevant and ignored.
   6. Gotcha: the full account names may or may not match the strings passed to `createAccount` and `createAndDeploy`, which is why you must write `alice.call(contract, …)` and `alice.accountId` rather than `alice.call('contract-account-name', …)` and `'alice'`
   7. `assert` comes from [Node's `assert` library](https://nodejs.org/api/assert.html), imported with `import { strict as assert } from "assert"`. In most real tests, your test runner will include its own assertion library. For examples using [Jest](https://jestjs.io/), check out [the `__tests__` directory here](./__tests__).


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
   const runner = await Runner.create(
     { network: 'testnet' },
     async ({ runtime }) => { … }
   )
   ```

2. Set the `NEAR_RUNNER_NETWORK` environment variable when running your tests:

   ```bash
   NEAR_RUNNER_NETWORK=testnet node test.js
   ```

If you set both, the config object takes precedence.


Stepping through a testnet example
----------------------------------

Let's revisit a shortened version of the example from the Quick Start above, describing what will happen in Testnet.

3. Create a `Runner`.

   ```ts
   const runner = await Runner.create(async ({ runtime }) => {
     await runtime.createAccount('alice')
     await runtime.createAndDeploy(
       'contract-account-name',
       './path/to/compiled.wasm'
     )
   })
   ```

   Let's step through this.

   1. `Runner.create` does not interact with Testnet at all yet. Instead, it stores the passed-in function to an internal `initFn` variable, which it then runs at the beginning of each subsequent call to `runner.run`. This is to match sandbox-mode's behavior of allowing the same starting point for many tests, but testnet's requirement of having separate test accounts for each test.

4. Write tests.

   ```ts
   await Promise.all([
     runner.run(async ({ alice, contract }) => {
       await alice.call(
         contract,
         'some_update_function',
         { some_string_argument: 'cool', some_number_argument: 42 }
       )
       const result = await contract.view(
         'some_view_function',
         { account_id: alice.accountId }
       )
       assert.equal(result, 'whatever')
     }),
     runner.run(async ({ alice, contract }) => {
       const result = await contract.view(
         'some_view_function',
         { account_id: alice.accountId }
       )
       assert.equal(result, 'some default')
     })
   ])
   ```

   Each call to `runner.run` will:

   * Get its own testnet account with a name similar to the ones created by the `dev-deploy` command from `near-cli`, like `dev-1628609955486-8075070`
   * Run the `initFn` passed to `Runner.create`
   * Create sub-accounts of this `dev-*` account on calls to `createAccount` and `createAndDeploy`, such as `alice.dev-1628609955486-8075070`
   * Store keys for these accounts in the `.near-credentials` folder inside your home folder, to match the behavior of near-cli


Skipping Sandbox-specific tests
-------------------------------

If some of your tests take advantage of Sandbox-specific features, you can skip these on testnet runs in a couple ways:

1. `runSandbox`: Instead of `runner.run`, you can use `runner.runSandbox`:

   ```ts
   await Promise.all([
     runner.run(async ({ … }) => {
       // runs on any network, sandbox or testnet
     }),
     runner.runSandbox(async ({ … }) => {
       // only runs on sandbox network
     })
   ])
   ```

2. `Runner.getNetworkFromEnv`: Given that the above approach can result in empty test definitions, you can instead skip entire sections of your test files by checking the `Runner.getNetworkFromConfig`. Using Jest syntax:

   ```ts
   describe(`Running on ${Runner.getNetworkFromEnv()}`, () => {
     let runner: Runner // leave off `Runner` typing in plain JS
     beforeAll(() => {
       runner = await Runner.create(async ({ runtime }) => ({ // note the implicit return
         contract: await runtime.createAndDeploy(
           'contract-account-name',
           './path/to/compiled.wasm'
         )
       }))
     })
     test('thing that makes sense on any network', async () => {
       // test basic contract & account interactions
     })
     if ('sandbox' === Runner.getNetworkFromEnv()) {
       test('thing that only makes sense with sandbox', async () => {
         // test with patch-state, fast-forwarding, etc
       })
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
      async ({ runtime }) => { … }
    )
    ```

  * always recreate such data directory instead (the default behavior)

  * specify which port to run on

  * and more!

* escape hatch to `near-api-js` – the `Account` & `ContractAccount` types returned by `getAccount` and `getContractAccount` contain a **`najAccount`** property. This returns an [`Account` type from `near-api-js`](https://near.github.io/near-api-js/classes/account.account-1.html). If you need functionality that `near-runner` doesn't yet provide, this may give you a way to do it. (But please do send a Pull Request adding the functionality directly to `near-runner`!)
