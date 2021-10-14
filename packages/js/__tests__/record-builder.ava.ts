import path from 'path';
import {NEAR} from 'near-units';
import {ava as test} from '../../ava';
import {Workspace} from '..';
import {RecordBuilder} from '../dist/record';

if (Workspace.networkIsSandbox()) {
  const workspace = Workspace.init(async ({root}) => {
    const contract = await root.createAndDeploy(
      'status-message',
      path.join(__dirname, '..', '..', '..', '__tests__', 'build', 'debug', 'status_message.wasm'),
    );
    const ali = await root.createAccount('ali');
    return {contract, ali};
  });

  test('Patch Account', async t => {
    await workspace.clone(async ({root, ali, contract}) => {
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
} else {
  test('skipping; not using sandbox', t => {
    t.true(true);
    // Ava requires a test in each file
  });
}
