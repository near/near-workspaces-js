import {NearAccount, Worker} from 'near-workspaces';
import anyTest, {TestFn} from 'ava';

const test = anyTest as TestFn<{
  worker: Worker;
  accounts: Record<string, NearAccount>;
}>;

test.beforeEach(async t => {
  t.context.worker = await Worker.init({
    network: 'testnet',
    rootAccountId: 'meta',
  });
});

test.afterEach(async t => {
  await t.context.worker.tearDown().catch(error => {
    console.log('Failed to stop the Sandbox:', error);
  });
});

test('Inspecting an account on testnet', async t => {
  const root = t.context.worker.rootAccount;
  t.is(root.accountId, 'meta');
  t.assert(await root.exists());
});
