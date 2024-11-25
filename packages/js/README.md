<div align="center">
  <h1>NEAR Workspaces (TypeScript/JavaScript Edition)</h1>

[![Project license](https://img.shields.io/badge/license-Apache2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Project license](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Discord](https://img.shields.io/discord/490367152054992913?label=discord)](https://discord.gg/Vyp7ETM)
[![NPM version](https://img.shields.io/npm/v/near-workspaces.svg?style=flat-square)](https://npmjs.com/near-workspaces)
[![Size on NPM](https://img.shields.io/bundlephobia/minzip/near-workspaces.svg?style=flat-square)](https://npmjs.com/near-workspaces)

</div>

`NEAR Workspaces` is a library for automating workflows and writing tests for NEAR smart contracts. It can be used standalone or integrated with test runners like AVA, Jest, or Mocha. If you don't have a preference, we recommend AVA.

## Quick Start (without testing frameworks)

### 1. Initialize a `Worker`.

```ts
const worker = await Worker.init();
const root = worker.rootAccount;

const alice = await root.createSubAccount("alice");
const contract = await root.devDeploy("path/to/compiled.wasm");
```

#### Step-by-Step Explanation

**_1. Worker Initialization:_**

- `Worker.init` initializes a new `SandboxWorker` or `TestnetWorker` depending on the config. `SandboxWorker` contains [NEAR Sandbox](https://github.com/near/sandbox), which is essentially a local mini-NEAR blockchain. You can create one `Worker` per test to get its own data directory and port (for Sandbox) or root account (for Testnet), so that tests can run in parallel without race conditions in accessing states.
- If there's no state intervention. you can also reuse the `Worker` to speedup the tests.

**_2. Root Account:_**

- The worker has a `root` account. For `SandboxWorker`, it's `test.near`. For `TestnetWorker`, it creates a unique account. The following accounts are created as subaccounts of the root account. The name of the account will change from different runs, so you should not refer to them by hard coded account name. You can access them via the account object, such as `root`, `alice` and `contract` above.

**_3. Creating Subaccounts:_**

- `root.createSubAccount` creates a new subaccount of `root` with the given name, for example `alice.<root-account-name>`.

**_4. Deploying Contracts:_**

- `root.devDeploy` creates an account with random name, then deploys the specified Wasm file to it.

**_5. Path Resolution:_**

- `path/to/compiled.wasm` will resolve relative to your project root. That is, the nearest directory with a `package.json` file, or your current working directory if no `package.json` is found. To construct a path relative to your test file, you can use `path.join(__dirname, '../etc/etc.wasm')` ([more info](https://nodejs.org/api/path.html#path_path_join_paths)).

**_6. Data Directory:_**

- `worker` contains a reference to this data directory, so that multiple tests can use it as a starting point.

**_7. Test Framework Integration:_**

- If you're using a test framework, you can save the `worker` object and account objects `root`, `alice`, `contract` to test context to reuse them in subsequent tests.

**_8. Tearing Down:_**

- At the end of test, call `await worker.tearDown()` to shuts down the Worker. It gracefully shuts down the Sandbox instance it ran in the background. However, it keeps the data directory around. That's what stores the state of the two accounts that were created (`alice` and `contract-account-name` with its deployed contract).

### 2. Writing Tests.

`near-workspaces` is designed for concurrency. Here's a simple way to get concurrent runs using plain JS:

```ts
import { strict as assert } from "assert";

await Promise.all([
  async () => {
    await alice.call(contract, "some_update_function", {
      some_string_argument: "cool",
      some_number_argument: 42,
    });
    const result = await contract.view("some_view_function", {
      account_id: alice,
    });
    assert.equal(result, "whatever");
  },
  async () => {
    const result = await contract.view("some_view_function", {
      account_id: alice,
    });
    /* Note that we expect the value returned from `some_view_function` to be
    a default here, because this `fork` runs *at the same time* as the
    previous, in a separate local blockchain */
    assert.equal(result, "some default");
  },
]);
```

#### Step-by-Step Explanation

**_1. Worker and Accounts:_**

- `worker` and accounts such as`alice` are created before.

**_2. Calling Contract Functions:_**

- `call` syntax mirrors [near-cli](https://github.com/near/near-cli) and either returns the successful return value of the given function or throws the encountered error. If you want to inspect a full transaction and/or avoid the `throw` behavior, you can use `callRaw` instead.

**_3. Viewing Contract Functions::_**

- While `call` is invoked on the account _doing the call_ (`alice.call(contract, …)`), `view` is invoked on the account _being viewed_ (`contract.view(…)`). This is because the caller of a view is irrelevant and ignored.

More info in our main [README](https://github.com/near/near-workspaces-js/blob/main/README.md)
