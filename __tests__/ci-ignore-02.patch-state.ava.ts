/**
 * This test demonstrates patchState behavior, using the contract from
 * https://github.com/near-examples/rust-status-message
 *
 * If you want to make arbitrary modifications to a contract that wouldn't be
 * possible with ordinary function calls, you can use patchState. In a
 * test below, this is used to set the status of an account that is never
 * created within the testing environment, `alice.near`.
 *
 * patchState is a Sandbox-specific feature, so these tests can't be run on
 * testnet. That's why they're wrapped with `if (getNetworkFromEnv() === 'sandbox')`.
 */

import anyTest, {type TestFn} from 'ava';
import * as borsh from 'borsh';
import {
  Worker, getNetworkFromEnv, parseNEAR, type NearAccount,
} from 'near-workspaces';

if (getNetworkFromEnv() === 'sandbox') {
  const test = anyTest as TestFn<{
    worker: Worker;
    accounts: Record<string, NearAccount>;
  }>;

  test.beforeEach(async t => {
    const worker = await Worker.init();
    const root = worker.rootAccount;
    const contract = await root.devDeploy('__tests__/build/debug/status_message.wasm');
    const ali = await root.createSubAccount('ali');

    t.context.worker = worker;
    t.context.accounts = {root, contract, ali};
  });

  test.afterEach.always(async t => {
    await t.context.worker.tearDown().catch((error: unknown) => {
      console.log('Failed to tear down the worker:', error);
    });
  });

  const statusMessageSchema: borsh.Schema = {
    map: {
      key: 'string',
      value: 'string',
    },
  };

  test('View state', async t => {
    const {contract, ali} = t.context.accounts;
    await ali.call(contract, 'set_status', {message: 'hello'});
    const state = await contract.viewState();
    // Get raw value
    const data = state.getRaw('STATE');
    // Deserialize from borsh
    const statusMessage = borsh.deserialize(
      statusMessageSchema,
      new Uint8Array(data),
    ) as Map<string, string>;
    const [key, value] = statusMessage.entries().next().value ?? [];
    t.deepEqual(
      {k: key, v: value},
      {k: ali.accountId, v: 'hello'},
    );
  });

  test('Patch state', async t => {
    const {contract, ali} = t.context.accounts;
    // Contract must have some state for viewState & patchState to work
    await ali.call(contract, 'set_status', {message: 'hello'});
    // Get state
    const state = await contract.viewState();
    // Get raw value
    const statusMessage = state.get('STATE', statusMessageSchema) as Map<string, string>;
    // Update contract state
    statusMessage.set(
      'alice.near',
      'hello world',
    );
    // Serialize and patch state back to runtime
    await contract.patchState(
      'STATE',
      borsh.serialize(statusMessageSchema, statusMessage),
    );
    // Check again that the update worked
    const result = await contract.view('get_status', {
      account_id: 'alice.near',
    });
    t.is(result, 'hello world');
  });

  test('Patch Account', async t => {
    const {root, contract, ali} = t.context.accounts;
    const bob = root.getAccount('bob');
    const public_key = await bob.setKey();
    const {code_hash} = await contract.accountView();
    const BOB_BALANCE = parseNEAR('100');

    await bob.updateAccount({
      amount: BOB_BALANCE,
      code_hash,
    });

    await bob.updateAccessKey(
      public_key,
      {
        nonce: 0,
        permission: 'FullAccess',
      },
    );

    await bob.updateContract(await contract.viewCode());
    const balance = await bob.availableBalance();
    t.deepEqual(balance, BigInt(BOB_BALANCE));
    await ali.call(bob, 'set_status', {message: 'hello'});
    const result = await bob.view('get_status', {
      account_id: ali.accountId,
    });

    t.is(result, 'hello');
  });
}
