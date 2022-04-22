/**
 * This test demonstrates basic behavior of near-workspaces, making simple
 * function calls and view calls to the contract from
 * https://github.com/near-examples/rust-status-message
 *
 * Note that the same tests will be run on both a local sandbox environment and
 * on testnet by using the `test:sandbox` and `test:testnet` scripts in
 * package.json.
 */
import {Worker, NEAR} from 'near-workspaces';
import anyTest, {TestFn} from 'ava';

const test = anyTest as TestFn<{worker: Worker}>;

test('Root gets null status', async t => {
  const worker = await Worker.init();
  const root = worker.rootAccount;
  const contract = await root.createAndDeploy(
    root.getSubAccount('status-message').accountId,
    '__tests__/build/debug/status_message.wasm',
    {initialBalance: NEAR.parse('3 N').toJSON()},
  );
  const ali = await root.createSubAccount('ali', {initialBalance: NEAR.parse('3 N').toJSON()});
  await ali.call(contract, 'set_status', {message: 'hello'});
  const result = await contract.view('get_status', {account_id: ali});
  t.is(result, 'hello');
  await worker.tearDown();
});

// TD: restore other files from this test
