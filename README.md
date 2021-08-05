near-runner
===========

Write tests in TypeScript/JavaScript to run in a controlled [NEAR Sandbox](https://github.com/near/sandbox) local environment.

This software is in early beta.


Demo & Visioning
================

Click below for an intro & discussion of this library from 2021-08-03. As mentioned, feedback very welcome! Please create Issues on GitHub or otherwise get in touch with anything you'd like to see improved with this library.

[![discussion on YouTube](http://img.youtube.com/vi/7QWhURvNODI/0.jpg)](https://youtu.be/7QWhURvNODI)


Quick Start
===========

1. Install.

       npm install --save-dev near-runner

   or

       yarn add --dev near-runner

2. Import.

       // if using JavaScript, skip the SandboxRuntime and SandboxRunner type imports
       import { createSandbox, SandboxRuntime, SandboxRunner } from 'near-runner'

3. Create a `SandboxRuntime`.


   With TypeScript:

   ```ts
   const withSandbox: SandboxRuntime = await createSandbox(async (sandbox: SandboxRunner) => {
     await sandbox.createAccount('alice')
     await sandbox.createAndDeploy(
       'contract-account-name',
       './path/to/compiled.wasm'
     )
   })
   ```

   With JavaScript:

   ```js
   const withSandbox = await createSandbox(async sandbox => {
     await sandbox.createAccount('alice')
     await sandbox.createAndDeploy(
       'contract-account-name',
       './path/to/compiled.wasm'
     )
   })
   ```

   Let's step through this.

   1. `createSandbox` initializes a new [NEAR Sandbox](https://docs.near.org/docs/develop/contracts/sandbox) node/instance. This is essentially a mini-NEAR blockchain created just for this test. Each of these Sandbox instances gets its own data directory and port, so that tests can run in parallel.
   2. `sandbox.createAccount` creates a new account with the given name.
   3. `sandbox.createAndDeploy` creates a new account with the given name, then deploys the specified Wasm file to it.
   4. After `createSandbox` finishes running the function passed into it, it gracefully shuts down the Sandbox instance it ran in the background. However, it keeps the data directory around. That's what stores the state of the two accounts that were created (`alice` and `contract-account-name` with its deployed contract).
   5. `withSandbox` is a test runner function (a `SandboxRuntime`) that contains a reference to this data directory, so that multiple tests can use it as a starting point.

4. Write tests.

   With TypeScript (JS version now left as an exercise for the reader):

   ```ts
   await Promise.all([
     withSandbox(async (sandbox: SandboxRuntime) => {
       const alice = sandbox.getAccount('alice')
       const contract = sandbox.getContractAccount('contract-account-name')
       await alice.call(
         'contract-account-name',
         'some_update_function',
         { some_string_argument: 'cool', some_number_argument: 42 }
       )
       const result = await contract.view(
         'some_view_function',
         { account_id: 'alice' }
       )
       assert.equal(result, 'whatever')
     }),
     withSandbox(async (sandbox: SandboxRuntime) => {
       const contract = sandbox.getContractAccount('contract-account-name')
       const result = await contract.view(
         'some_view_function',
         { account_id: 'alice' }
       )
       assert.equal(result, 'some default')
     })
   ])
   ```

   Let's step through this.

   1. For this high-level example, we show tests being run in parallel by using `Promise.all`. In most real tests, your test runner will probably take care of this for you. For examples using [Jest](https://jestjs.io/), check out [the `tests` directory here](./tests).
   2. Like the earlier call to `createSandbox`, each call to `withSandbox` sets up its own Sandbox instance. Each will copy the data directory set up earlier as the starting point for its tests. Each will use a unique port so that tests can be safely run in parallel.
   3. `sandbox.getAccount` and `sandbox.getContractAccount` get the accounts that were initialized in `createSandbox`.
   4. `call` syntax mirrors [near-cli](https://github.com/near/near-cli) and either returns the successful return value of the given function or throws the encountered error. If you want to inspect a full transaction and/or avoid the `throw` behavior, you can use `call_raw` instead.
   5. While `call` is invoked on the account _doing the call_ (`alice.call('other', …)`), `view` is invoked on the account _being viewed_ (`other.view(…)`). This is because the caller of a view is irrelevant and ignored.
   6. `assert` comes from [Node's `assert` library](https://nodejs.org/api/assert.html), imported with `import { strict as assert } from "assert"`. In most real tests, your test runner will include its own assertion library. For examples using [Jest](https://jestjs.io/), check out [the `tests` directory here](./tests).


Pro Tips
========

* `SANDBOX_DEBUG=true` – run tests with this environment variable set to get copious debug output and a full log file for each Sandbox instance.
* `createSandbox` config – you can pass _[**2021-08-05 edit**: will be able to pass]_ a config object as the first argument to `createSandbox`. This lets you _[will let you]_ do things like:
  * skip initialization if specified data directory already exists
  * always recreate such data directory instead (the default behavior)
  * specify which port to run on
  * and more!
* escape hatch to `near-api-js` – the `Account` & `ContractAccount` types returned by `getAccount` and `getContractAccount` contain a **`najAccount`** property. This returns an [`Account` type from `near-api-js`](https://near.github.io/near-api-js/classes/account.account-1.html). If you need functionality that `near-runner` doesn't yet provide, this may give you a way to do it. (But please do send a Pull Request adding the functionality directly to `near-runner`!)
