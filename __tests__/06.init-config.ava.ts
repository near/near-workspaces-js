import {Workspace} from 'near-workspaces';
import anyTest, {TestFn} from 'ava';

const test = anyTest as TestFn<{workspace: Workspace}>;
test.before(async t => {
  t.context.workspace = await Workspace.init({
    network: 'testnet',
    rootAccount: 'meta',
  });
});

test('Inspecting an account on testnet', async t => {
  await t.context.workspace.fork(async ({root}) => {
    t.is(root.accountId, 'meta');
    t.assert(await root.exists());
  });
});
