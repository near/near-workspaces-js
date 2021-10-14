import test from 'ava';
import {Workspace} from '..';

test('Inspecting an account on testnet', async t => {
  await Workspace.open({network: 'testnet', rootAccount: 'meta'}, async ({root}) => {
    t.is(root.accountId, 'meta');
    t.assert(await root.exists());
  });
});
