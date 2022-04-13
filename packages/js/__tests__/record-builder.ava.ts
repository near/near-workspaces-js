import path from 'path';
import anyTest, {TestFn} from 'ava';
import {NEAR} from 'near-units';
import {getNetworkFromEnv, Workspace} from '..';
import {RecordBuilder} from '../dist/record';

const test = anyTest as TestFn<{workspace: Workspace}>;

if (getNetworkFromEnv() === 'sandbox') {
  const workspacePromise = Workspace.init(async ({root}) => {
    const contract = await root.createAndDeploy(
      'status-message',
      path.join(__dirname, '..', '..', '..', '__tests__', 'build', 'debug', 'status_message.wasm'),
    );
    const ali = await root.createAccount('ali');
    return {contract, ali};
  });

  // eslint-disable-next-line promise/prefer-await-to-then
  void workspacePromise.then(workspace => {
    test('Patch Account', async t => {
      await workspace.fork(async ({root, ali, contract}) => {
        const bob = root.getFullAccount('bob');
        const public_key = await bob.setKey();
        const {code_hash} = await contract.accountView();
        const BOB_BALANCE = NEAR.parse('100 N');
        const rb = RecordBuilder.fromAccount(bob)
          .account({
            amount: BOB_BALANCE.toString(),
            code_hash,
          }).accessKey(
            public_key,
            {
              nonce: 0,
              permission: 'FullAccess',
            },
          )
          .contract(await contract.viewCode());
        await bob.sandbox_patch_state(rb);
        const balance = await bob.availableBalance();
        t.deepEqual(balance, BOB_BALANCE);
        await ali.call(bob, 'set_status', {message: 'hello'});
        const result = await bob.view('get_status', {
          account_id: ali.accountId,
        });
        t.is(result, 'hello');
      });
    });
  });
} else {
  test('skipping; not using sandbox', t => {
    t.true(true);
    // Ava requires a test in each file
  });
}
