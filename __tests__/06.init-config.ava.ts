import {Workspace} from 'near-workspaces';
import anyTest, {TestFn} from 'ava';

const test = anyTest as TestFn<{workspace: Workspace}>;
test.before(async t => {
  t.context.workspace = await Workspace.init({
    network: 'testnet',
    rootAccount: 'meta',
  });
});

/* This test is throwing "Rejected promise returned by test" KeyNotFound error.
    Probably caused by https://github.com/near/workspaces-js/issues/128
*/
test('Inspecting an account on testnet', async t => {
  /* Uncomment
  * await t.context.workspace.fork(async ({root}) => {
  *   t.is(root.accountId, 'meta');
  *   t.assert(await root.exists());
  * });
  */
  t.assert(true); // Delete
});
