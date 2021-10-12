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
 * testnet. That's why they're wrapped with `if (Runner.networkIsSandbox())`.
 */

/* eslint-disable @typescript-eslint/no-extraneous-class, @typescript-eslint/no-unsafe-member-access */
import * as borsh from 'borsh';
import {Runner, NEAR} from 'near-runner-ava';

const runner = Runner.create(async ({root}) => {
  const contract = await root.createAndDeploy(
    'status-message',
    '__tests__/build/debug/status_message.wasm',
  );
  const ali = await root.createAccount('ali');
  return {contract, ali};
});

if (Runner.networkIsSandbox()) {
  class Assignable {
    [key: string]: any;
    constructor(properties: any) {
      for (const key of Object.keys(properties)) {
        this[key] = properties[key];
      }
    }
  }

  class StatusMessage extends Assignable {}

  class Record extends Assignable {}

  const schema = new Map([
    [StatusMessage, {kind: 'struct', fields: [['records', [Record]]]}],
    [
      Record,
      {
        kind: 'struct',
        fields: [
          ['k', 'string'],
          ['v', 'string'],
        ],
      },
    ],
  ]);

  runner.test('View state', async (test, {contract, ali}) => {
    await ali.call(contract, 'set_status', {message: 'hello'});

    const state = await contract.viewState();

    // Get raw value
    const data = state.get_raw('STATE');

    // Deserialize from borsh
    const statusMessage: StatusMessage = borsh.deserialize(
      schema,
      StatusMessage,
      data,
    );

    test.deepEqual(statusMessage.records[0],
      new Record({k: ali.accountId, v: 'hello'}),
    );
  });

  runner.test('Patch state', async (test, {contract, ali}) => {
    // Contract must have some state for viewState & patchState to work
    await ali.call(contract, 'set_status', {message: 'hello'});
    // Get state
    const state = await contract.viewState();
    // Get raw value
    const statusMessage = state.get('STATE', {schema, type: StatusMessage});

    // Update contract state
    statusMessage.records.push(
      new Record({k: 'alice.near', v: 'hello world'}),
    );

    // Serialize and patch state back to runtime
    await contract.patchState(
      'STATE',
      borsh.serialize(schema, statusMessage),
    );

    // Check again that the update worked
    const result = await contract.view('get_status', {
      account_id: 'alice.near',
    });
    test.is(result, 'hello world');
  });

  runner.test('Patch Account', async (test, {root, ali, contract}) => {
    const bob = root.getFullAccount('bob');
    const public_key = await bob.setKey();
    const {code_hash} = await contract.accountView();
    const BOB_BALANCE = NEAR.parse('100 N');

    await bob.updateAccount({
      amount: BOB_BALANCE.toString(),
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
    test.deepEqual(balance, BOB_BALANCE);
    await ali.call(bob, 'set_status', {message: 'hello'});
    const result = await bob.view('get_status', {
      account_id: ali.accountId,
    });
    test.is(result, 'hello');
  });
} else {
  runner.test('skipping; not on sandbox');
}
