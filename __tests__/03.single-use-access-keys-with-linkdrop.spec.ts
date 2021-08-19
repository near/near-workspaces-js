/**
 * This test verifies the functionality of the contract at
 * https://github.com/near/near-linkdrop
 *
 * An interesting feature of this contract: when someone first visits a linkdrop
 * page, they don't yet have a NEAR account. But they still make a call to the
 * contract! How? From the contract's perspective, it _calls itself_ (see
 * `linkdrop.call(linkdrop, …)` below) using a Function Call access key, which
 * can only call one function (`create_account_and_claim`) and which is only
 * good for one use.
 *
 * You can see this functionality in action below using `signWithKey`.
 */
import path from 'path';
import {Runner, toYocto, createKeyPair, BN, tGas} from '..';

/* Contract API for reference
impl Linkdrop {
  pub fn create_account(new_account_id: &str, new_public_key: &str){}
  pub fn get_key_balance(public_key: &str){}
  pub fn send(public_key: &str){}
  pub fn create_account_and_claim(new_account_id: &str, new_public_key: &str){}
  pub fn on_account_created(predecessor_account_id: &str, amount: &str){}
  pub fn on_account_created_and_claimed(amount: &str){}
  pub fn claim(account_id: &str){}
}
*/

describe(`Running on ${Runner.getNetworkFromEnv()}`, () => {
  jest.setTimeout(60_000);
  let runner: Runner;

  beforeAll(async () => {
    runner = await Runner.create(async ({root}) => ({
      linkdrop: await root.createAndDeploy(
        'linkdrop',
        path.join(__dirname, 'build', 'debug', 'linkdrop.wasm'),
      ),
    }));
  });

  test('Use `create_account_and_claim` to create a new account', async () => {
    await runner.run(async ({root, linkdrop}) => {
      // Create temporary keys for access key on linkdrop
      const senderKey = createKeyPair();
      const public_key = senderKey.getPublicKey().toString();

      // This adds the key as a function access key on `create_account_and_claim`
      await root.call(
        linkdrop,
        'send',
        {
          public_key,
        },
        {
          attachedDeposit: toYocto('2'),
        },
      );
      const new_account_id = `bob.${linkdrop.accountId}`;
      const actualKey = createKeyPair();
      const new_public_key = actualKey.getPublicKey().toString();

      await linkdrop.call_raw(
        linkdrop,
        'create_account_and_claim',
        {
          new_account_id,
          new_public_key,
        },
        {
          signWithKey: senderKey,
          gas: tGas('50'),
        },
      );
      const bob = root.getAccount(new_account_id);
      const balance = await bob.balance();
      expect(balance.available).toBe('998180000000000000000000');

      console.log(
        `Account ${new_account_id} claim and has ${balance.available} yoctoNear`,
      );
    });
  });

  test('Use `claim` to transfer to an existing account', async () => {
    await runner.run(async ({root, linkdrop}) => {
      const bob = await root.createAccount('bob');
      const originalBalance = await bob.balance();
      // Create temporary keys for access key on linkdrop
      const senderKey = createKeyPair();
      const public_key = senderKey.getPublicKey().toString();

      // This adds the key as a function access key on `create_account_and_claim`
      await root.call(
        linkdrop,
        'send',
        {
          public_key,
        },
        {
          attachedDeposit: toYocto('2'),
        },
      );
      // Can only create subaccounts

      await linkdrop.call_raw(
        linkdrop,
        'claim',
        {
          account_id: bob.accountId,
        },
        {
          signWithKey: senderKey,
          gas: tGas('50'),
        },
      );

      const newBalance = await bob.balance();
      const originalAvaiable = new BN(originalBalance.available);
      const newAvaiable = new BN(newBalance.available);
      expect(originalAvaiable.lt(newAvaiable)).toBeTruthy();

      console.log(
        `${bob.accountId} claimed ${newAvaiable
          .sub(originalAvaiable)
          .toString()} yoctoNear`,
      );
    });
  });
});
