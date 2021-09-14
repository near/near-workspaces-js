import path from 'path';
import {NEAR} from 'near-units';
import {Runner} from '../../src';
import {RecordBuilder} from '../../src/record';

describe('view state & patch state', () => {
  if (Runner.networkIsSandbox()) {
    const runner = Runner.create(async ({root}) => {
      const contract = await root.createAndDeploy(
        'status-message',
        path.join(__dirname, '..', 'build', 'debug', 'status_message.wasm'),
      );
      const ali = await root.createAccount('ali');
      return {contract, ali};
    });

    test.concurrent('Patch Account', async () => {
      await runner.run(async ({root, ali, contract}) => {
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
        expect(balance).toStrictEqual(BOB_BALANCE);
        await ali.call(bob, 'set_status', {message: 'hello'});
        const result = await bob.view('get_status', {
          account_id: ali.accountId,
        });
        expect(result).toBe('hello');
      });
    });
  } else {
    test('skipping; not using sandbox', () => {
      // Jest requires a test in each file
    });
  }
});
