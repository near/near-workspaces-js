/**
 * This test demonstrates basic behavior of near-workspaces, making simple
 * function calls and view calls to the contract from
 * https://github.com/near-examples/rust-status-message
 *
 * Note that the same tests will be run on both a local sandbox environment and
 * on testnet by using the `test:sandbox` and `test:testnet` scripts in
 * package.json.
 */
import {Worker} from 'near-workspaces';
import anyTest, {TestFn} from 'ava';

const test = anyTest as TestFn<{worker: Worker}>;
test.before(async t => {
  t.context.worker = await Worker.init(async ({root}) => ({
    contract: await root.createAndDeploy(
      'status-message',
      '__tests__/build/debug/status_message.wasm',
    ),
    ali: await root.createSubAccount('ali'),
  }));
});

test('Root gets null status', async t => {
  await t.context.worker.fork(async ({contract, root}) => {
    const result: null = await contract.view('get_status', {
      account_id: root,
    });
    t.is(result, null);
  });
});

test('Ali sets then gets status', async t => {
  await t.context.worker.fork(async ({contract, ali}) => {
    await ali.call(contract, 'set_status', {message: 'hello'});
    const result: string = await contract.view('get_status', {
      account_id: ali,
    });
    t.is(result, 'hello');
  });
});

test('Root and Ali have different statuses', async t => {
  await t.context.worker.fork(async ({contract, root, ali}) => {
    await root.call(contract, 'set_status', {message: 'world'});
    const rootStatus: string = await contract.view('get_status', {
      account_id: root,
    });
    t.is(rootStatus, 'world');

    const aliStatus: null = await contract.view('get_status', {
      account_id: ali,
    });
    t.is(aliStatus, null);
  });
});
