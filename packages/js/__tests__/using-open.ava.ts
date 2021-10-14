import test from 'ava';
import {Runner} from '..';

test('Inspecting an account on testnet', async t => {
  await Runner.open({network: 'testnet', rootAccount: 'meta'}, async ({root}) => {
    t.is(root.accountId, 'meta');
    t.assert(await root.exists());
  });
});
