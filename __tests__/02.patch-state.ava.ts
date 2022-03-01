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
 * testnet. That's why they're wrapped with `if (Workspace.networkIsSandbox())`.
 */

/* eslint-disable @typescript-eslint/no-extraneous-class, @typescript-eslint/no-unsafe-member-access */
import * as borsh from 'borsh';
import {Workspace, getNetworkFromEnv} from 'near-workspaces';
import {NEAR} from 'near-units';
import anyTest, {TestFn} from 'ava';

if (getNetworkFromEnv() === 'sandbox') {
  const test = anyTest as TestFn<{workspace: Workspace}>;
  test.before(async t => {
    t.context.workspace = await Workspace.init(async ({root}) => {
      const contract = await root.createAndDeploy(
        'status-message',
        '__tests__/build/debug/status_message.wasm',
      );
      const ali = await root.createAccount('ali');
      return {contract, ali};
    });
  });

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

  test('View state', async t => {
    await t.context.workspace.fork(async ({contract, ali}) => {
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

      t.deepEqual(statusMessage.records[0],
        new Record({k: ali.accountId, v: 'hello'}),
      );
    });
  });

  test('Patch state', async t => {
    await t.context.workspace.fork(async ({contract, ali}) => {
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
      t.is(result, 'hello world');
    });
  });

  test('Patch Account', async t => {
    await t.context.workspace.fork(async ({root, contract, ali}) => {
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
      t.deepEqual(balance, BOB_BALANCE);
      await ali.call(bob, 'set_status', {message: 'hello'});
      const result = await bob.view('get_status', {
        account_id: ali.accountId,
      });
      t.is(result, 'hello');
    });
  });
}
