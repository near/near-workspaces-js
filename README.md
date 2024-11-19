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

For more examples, see the [tests directory](https://github.com/near/workspaces-js/tree/main/__tests__) in this project.

# Quick Start with AVA

Since `near-workspaces` is designed for concurrency, AVA is a great fit, because it runs tests concurrently by default.

#### 1. Start with the basic setup described [here](https://github.com/avajs/ava).

#### 2. Add custom script for running tests on Testnet (if needed). Check instructions in `"Running on Testnet"` section.

#### 3. Write your tests following this example:

```ts
import { Worker } from "near-workspaces";
import anyTest, { TestFn } from "ava";

const test = anyTest as TestFn<{
  worker: Worker;
  accounts: Record<string, NearAccount>;
}>;

/* If using `test.before`, each test is reusing the same worker;
If you'd like to make a copy of the worker, use `beforeEach` after `afterEach`,
which allows you to isolate the state for each test */
test.before(async (t) => {
  const worker = await Worker.init();
  const root = worker.rootAccount;
  const contract = await root.devDeploy("path/to/contract/file.wasm");
  /* Account that you will be able to use in your tests */
  const ali = await root.createSubAccount("ali");
  t.context.worker = worker;
  t.context.accounts = { root, contract, ali };
});

test("Test name", async (t) => {
  const { ali, contract } = t.context.accounts;
  await ali.call(contract, "set_status", { message: "hello" });
  const result: string = await contract.view("get_status", { account_id: ali });
  t.is(result, "hello");
});

test.after(async (t) => {
  // Stop Sandbox server
  await t.context.worker.tearDown().catch((error) => {
    console.log("Failed to tear down the worker:", error);
  });
});
```

# "Spooning" Contracts from Testnet and Mainnet

[Spooning a blockchain](https://coinmarketcap.com/alexandria/glossary/spoon-blockchain) is copying the data from one network into a different network. `near-workspaces` makes it easy to copy data from Mainnet or Testnet contracts into your local Sandbox environment:

```ts
const refFinance = await root.importContract({
  mainnetContract: "v2.ref-finance.near",
  blockId: 50_000_000,
  withData: true,
});
```

This would copy the Wasm bytes and contract state from [v2.ref-finance.near](https://explorer.near.org/accounts/v2.ref-finance.near) to your local blockchain as it existed at block `50_000_000`. This makes use of Sandbox's special [patch state](#patch-state-on-the-fly) feature to keep the contract name the same, even though the top level account might not exist locally (note that this means it only works in Sandbox testing mode). You can then interact with the contract in a deterministic way the same way you interact with all other accounts created with `near-workspaces`.

Note: `withData` will only work out-of-the-box if the contract's data is `50kB` or less. This is due to the default configuration of RPC servers, see the ["Heads Up" note here](https://docs.near.org/api/rpc/contracts#view-contract-state).

For an example of spooning contracts, see the [spooning example](https://github.com/near/workspaces-js/blob/main/__tests__/05.spoon-contract-to-sandbox.ava.ts) contracts.

# Running on Testnet

`near-workspaces` is designed so that you can write tests once and run them against either a local Sandbox node or the [NEAR TestNet](https://docs.near.org/concepts/basics/networks).

**_Reasons to Use Testnet:_**

- Higher confidence in contract behavior.

- Test against deployed Testnet contracts.

- Compare Sandbox mode with Testnet if discrepancies arise.

In order to use Workspaces JS in testnet mode you will need to have a testnet account. You can create one [here](https://wallet.testnet.near.org/).

## Steps to Use Workspaces JS in Testnet Mode:

### 1. Set Network to `testnet`:

```ts
const worker = await Worker.init({
  network: "testnet",
  testnetMasterAccountId: "<yourAccountName>",
});
```

### 2. Use Environment Variables when running your tests:

```bash
NEAR_WORKSPACES_NETWORK=testnet TESTNET_MASTER_ACCOUNT_ID=<your master account Id> node test.js
```

If you set this environment variables and pass `{network: 'testnet', testnetMasterAccountId: <masterAccountId>}` to `Worker.init`, the config object takes precedence.

### 3. Custom Config File (`near-workspaces` with AVA):

Create a `ava.testnet.config.cjs` in the same directory as your `package.json`:

```js
module.exports = {
  ...require("near-workspaces/ava.testnet.config.cjs"),
  ...require("./ava.config.cjs"),
};
module.exports.environmentVariables = {
  TESTNET_MASTER_ACCOUNT_ID: "<masterAccountId>",
};
```

The [near-workspaces/ava.testnet.config.cjs](https://github.com/near/workspaces-js/blob/main/ava.testnet.config.cjs) import sets the `NEAR_WORKSPACES_NETWORK` environment variable for you. A benefit of this approach is that you can then easily ignore files that should only run in Sandbox mode.

Add a `test:testnet` script to your `package.json`:

```diff
 "scripts": {
   "test": "ava",
+  "test:testnet": "ava --config ./ava.testnet.config.cjs"
 }
```

## Example of Testnet Usage

### 1. Create a `Worker`.

```ts
const worker = await Worker.init();
```

`Worker.init` creates a unique testnet account as root account.

### 2. Write tests.

```ts
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
    assert.equal(result, "some default");
  },
]);
```

Note: Sometimes account creation rate limits are reached on `testnet`, simply wait a little while and try again.

## Running tests only in Sandbox

If some of your runs take advantage of Sandbox-specific features, you can skip these on testnet in two ways:

#### 1. You can skip entire sections of your files by checking `getNetworkFromEnv() === 'sandbox'`.

```ts
let worker = Worker.init();
// things make sense to any network
const root = worker.rootAccount;
const alice = await root.createSubAccount("alice");

if (getNetworkFromEnv() === "sandbox") {
  // thing that only makes sense with sandbox
}
```

#### 2. Use a separate `testnet` config file, as described under the `"Running on Testnet"` heading above. Specify test files to include and exclude in config file.

# Patch State on the Fly

In Sandbox-mode, you can add or modify any contract state, contract code, account or access key with `patchState`.

You cannot perform arbitrary mutation on contract state with transactions since transactions can only include contract calls that mutate state in a contract-programmed way. For example, with an NFT contract, you can perform some operation with NFTs you have ownership of, but you cannot manipulate NFTs that are owned by other accounts since the smart contract is coded with checks to reject that. This is the expected behavior of the NFT contract. However, you may want to change another person's NFT for a test setup. This is called "arbitrary mutation on contract state" and can be done with `patchState`. Alternatively you can stop the node, dump state at genesis, edit genesis, and restart the node. The later approach is more complicated to do and also cannot be performed without restarting the node.

It is true that you can alter contract code, accounts, and access keys using normal transactions via the `DeployContract`, `CreateAccount`, and `AddKey` [actions](https://nomicon.io/RuntimeSpec/Actions.html?highlight=actions#actions). But this limits you to altering your own account or sub-account. `patchState` allows you to perform these operations on any account.

To see an example of how to do this, see the [patch-state test](https://github.com/near/workspaces-js/blob/main/__tests__/02.patch-state.ava.ts).

# Time Traveling

In Sandbox-mode, you can forward time-related state (the block height, timestamp and epoch height) with `fastForward`.

This means contracts which require time sensitive data do not need to sit and wait the same amount of time for blocks on the sandbox to be produced.
We can simply just call the api to get us further in time.

For an example, see the [fast-forward test](./__tests__/08.fast-forward.ava.ts)

Note: `fastForward` does not speed up an in-flight transactions.

# Pro Tips

- `NEAR_WORKSPACES_DEBUG=true` – run tests with this environment variable set to get copious debug output and a full log file for each Sandbox instance.

- `Worker.init` [config](https://github.com/near/workspaces-js/blob/main/packages/js/src/interfaces.ts) – you can pass a config object as the first argument to `Worker.init`. This lets you do things like:

  - skip initialization if specified data directory already exists (the default behavior)

    ```ts
    Worker.init({ rm: false, homeDir: "./test-data/alice-owns-an-nft" });
    ```

  - always recreate such data directory instead with `rm: true`

  - specify which port to run on

  - and more!

# Env variables

```text
NEAR_CLI_MAINNET_RPC_SERVER_URL
NEAR_CLI_TESTNET_RPC_SERVER_URL
```

Clear them in case you want to get back to the default RPC server.

Example:

```shell
export NEAR_CLI_MAINNET_RPC_SERVER_URL=<put_your_rpc_server_url_here>
```

here is a testcase: [jsonrpc.ava.js](./packages/js/__tests__/jsonrpc.ava.js)

## Example for `near-workspaces-js` with `near-sdk-js`.

This guide will walk you through setting up and running `tests` for your `NEAR` contracts using `near-workspaces-js` in a `near-sdk-js` project. We will use the `benchmark` package from `near-sdk-js`, which includes scripts for building contracts, running tests, and generating reports.

`near-sdk-js` utilizes `ava` package for testing, so we will use it for the example:

1. Set up - Make sure `ava` and `near-workspaces` are added in your project.

2. Worker instance - import and Initialize a `Worker`.

3. Root account - set the `.rootAccount` from the `Worker`.

4. Create the sub accounts, command is - `.createSubAccount`.

5. Deploy the contracts, the commands are - `root.devDeploy` or `.deploy`

6. Test framework integration - in our case `ava` contains a `test.context`, in there a data can be saved and reused in the other tests.

7. Tearing down - At the end of test, call `await worker.tearDown()` to shut down the `Worker` if needed.

#### Example test structure:

```ts
/** Set up */
import { Worker } from "near-workspaces";
import test from "ava";
import { generateGasObject, logTestResults } from "./util.js";
import { addTestResults } from "./results-store.js";

test.before(async (t) => {
  /** Worker instance */
  const worker = await Worker.init();
  /** Root account */
  const root = worker.rootAccount;

  /** Create the sub accounts */
  const callerContract = await root.createSubAccount("caller", {
    initialBalance: "1000N",
  });
  /** Deploy the contracts */
  await callerContract.deploy("build/deploy-contract.wasm");

  const callerContractRs = await root.createSubAccount("callrs", {
    initialBalance: "1000N",
  });
  await callerContractRs.deploy("res/deploy_contract.wasm");

  const ali = await root.createSubAccount("ali");
  const bob = await root.createSubAccount("bob");
  const carl = await root.createSubAccount("carl");

  /** Test framework integration */
  t.context.worker = worker;
  t.context.accounts = {
    root,
    callerContract,
    ali,
    bob,
    carl,
    callerContractRs,
  };
});

test("JS promise batch deploy contract and call", async (t) => {
  const { bob, callerContract } = t.context.accounts;

  let r = await bob.callRaw(callerContract, "deploy_contract", "", {
    gas: "300 Tgas",
  });

  let deployed = callerContract.getSubAccount("a");

  t.deepEqual(JSON.parse(Buffer.from(r.result.status.SuccessValue, "base64")), {
    currentAccountId: deployed.accountId,
    signerAccountId: bob.accountId,
    predecessorAccountId: callerContract.accountId,
    input: "abc",
  });

  logTestResults(r);
  const gasObject = generateGasObject(r);
  addTestResults("JS_promise_batch_deploy_contract_and_call", gasObject);
});
```
