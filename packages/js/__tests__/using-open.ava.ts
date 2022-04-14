import test from 'ava';
import {getNetworkFromEnv, Workspace} from '..';

if (getNetworkFromEnv() === 'sandbox') {
  test('Inspecting an account on testnet', async t => {
    await Workspace.open({network: 'testnet', rootAccount: 'meta'}, async ({root}) => {
      t.is(root.accountId, 'meta');
      t.assert(await root.exists());
    });
  });
} else {
  test('skipping on ' + getNetworkFromEnv(), t => {
    t.true(true);
  });
}
