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
import {Gas, NEAR} from 'near-units';
import {Runner, createKeyPair} from 'near-runner-jest';

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
  const runner = Runner.create(async ({root}) => ({
    linkdrop: await root.createAndDeploy(
      'linkdrop',
      path.join(__dirname, 'build', 'debug', 'linkdrop.wasm'),
    ),
  }));

  runner.test('Use `create_account_and_claim` to create a new account', async ({root, linkdrop}) => {
    // Create temporary keys for access key on linkdrop
    const senderKey = createKeyPair();
    const public_key = senderKey.getPublicKey().toString();
    const attachedDeposit = NEAR.parse('2');

    // This adds the key as a function access key on `create_account_and_claim`
    await root.call(linkdrop, 'send', {public_key}, {attachedDeposit});

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
        gas: Gas.parse('50 TGas'),
      },
    );
    const bob = root.getAccount(new_account_id);
    const balance = await bob.availableBalance();
    console.log(balance.toHuman());
    expect(balance).toStrictEqual(NEAR.parse('0.99818'));

    console.log(
      `Account ${new_account_id} claim and has ${balance.toHuman()} available`,
    );
  });

  runner.test('Use `claim` to transfer to an existing account', async ({root, linkdrop}) => {
    const bob = await root.createAccount('bob');
    const originalBalance = await bob.availableBalance();
    // Create temporary keys for access key on linkdrop
    const senderKey = createKeyPair();
    const public_key = senderKey.getPublicKey().toString();
    const attachedDeposit = NEAR.parse('2');

    // This adds the key as a function access key on `create_account_and_claim`
    await root.call(linkdrop, 'send', {public_key}, {attachedDeposit});
    // Can only create subaccounts

    await linkdrop.call_raw(
      linkdrop,
      'claim',
      {
        account_id: bob,
      },
      {
        signWithKey: senderKey,
        gas: Gas.parse('50 TGas'),
      },
    );

    const newBalance = await bob.availableBalance();
    expect(originalBalance.toBigInt()).toBeLessThan(newBalance.toBigInt());

    console.log(
      `${bob.accountId} claimed ${newBalance
        .sub(originalBalance).toHuman()}`,
    );
  });
});
