/**
 * This test demonstrates basic behavior of near-runner, making simple
 * function calls and view calls to the contract from
 * https://github.com/near-examples/rust-status-message
 *
 * Note that the same tests will be run on both a local sandbox environment and
 * on testnet by using the `test:sandbox` and `test:testnet` scripts in
 * package.json.
 */
import path from 'path';
import {Runner} from 'near-runner-ava';

const runner = Runner.create(async ({root}) => ({
  contract: await root.createAndDeploy(
    'status-message',
    path.join(__dirname, 'build', 'debug', 'status_message.wasm'),
  ),
  ali: await root.createAccount('ali'),
}));

runner.test('Root gets null status', async (t, {contract, root}) => {
  const result = await contract.view('get_status', {
    account_id: root,
  });
  t.is(result, null);
});

runner.test('Ali sets then gets status', async (t, {contract, ali}) => {
  await ali.call(contract, 'set_status', {message: 'hello'});
  const result: string = await contract.view('get_status', {
    account_id: ali,
  });
  t.is(result, 'hello');
});

runner.test('Root and Ali have different statuses', async (t, {contract, root, ali}) => {
  await root.call(contract, 'set_status', {message: 'world'});
  const rootStatus: string = await contract.view('get_status', {
    account_id: root,
  });
  t.is(rootStatus, 'world');

  const aliStatus = await contract.view('get_status', {
    account_id: ali,
  });
  t.is(aliStatus, null);
});
