/**
 * This test demonstrates basic behavior of near-runner, making simple
 * function calls and view calls to the contract from
 * https://github.com/near-examples/rust-status-message
 *
 * Note that the same tests will be run on both a local sandbox environment and
 * on testnet by using the `test:sandbox` and `test:testnet` scripts in
 * package.json.
 */
import {ava as test, Runner} from 'near-runner-ava';

test('using runner', async t => {
  await Runner.open({rootAccount: 'meta'}, async ({root}) => {
    t.is(root.accountId, 'meta');
    t.assert(await root.exists());
  });
});
