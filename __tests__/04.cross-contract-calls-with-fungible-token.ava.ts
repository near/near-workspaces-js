/**
 * This tests the behavior of the standard FT contract at
 * https://github.com/near/near-sdk-rs/tree/master/examples/fungible-token
 *
 * Some advanced features of near-workspaces this shows off:
 *
 * - Cross-Contract Calls: the "defi" contract implements basic features that
 *   might be used by a marketplace contract. You can see its source code at the
 *   near-sdk-rs link above. Several FT methods make cross-contract calls, and
 *   these are tested below using this "defi" contract.
 *
 * - Complex transactions: to exercise certain edge cases of the FT standard,
 *   tests below initiate chains of transactions using near-workspaces's transaction
 *   builder. Search for `createTransaction` below.
 */
import {Worker, NearAccount, captureError, BN} from 'near-workspaces';
import anyTest, {TestFn} from 'ava';

const STORAGE_BYTE_COST = '1.5 mN';

async function init_ft(
  ft: NearAccount,
  owner: NearAccount,
  supply: BN | string = '10000',
) {
  await ft.call(ft, 'new_default_meta', {
    owner_id: owner,
    total_supply: supply,
  });
}

async function init_defi(defi: NearAccount, ft: NearAccount) {
  await defi.call(defi, 'new', {
    fungible_token_account_id: ft,
  });
}

async function registerUser(ft: NearAccount, user: NearAccount) {
  await user.call(
    ft,
    'storage_deposit',
    {account_id: user},
    // Deposit pulled from ported sim test
    {attachedDeposit: STORAGE_BYTE_COST},
  );
}

async function ft_balance_of(ft: NearAccount, user: NearAccount): Promise<BN> {
  return new BN(await ft.view('ft_balance_of', {
    account_id: user,
  }));
}

const test = anyTest as TestFn<{worker: Worker}>;
test.before(async t => {
  t.context.worker = await Worker.init(async ({root}) => ({
    ft: await root.createAndDeploy(
      'fungible-token',
      '__tests__/build/debug/fungible_token.wasm',
    ),
    defi: await root.createAndDeploy(
      'defi',
      '__tests__/build/debug/defi.wasm',
    ),
    ali: await root.createSubAccount('ali'),
  }));
});

test('Total supply', async t => {
  await t.context.worker.fork(async ({ft, ali}) => {
    await init_ft(ft, ali, '1000');

    const totalSupply: string = await ft.view('ft_total_supply');
    t.is(totalSupply, '1000');
  });
});

test('Simple transfer', async t => {
  await t.context.worker.fork(async ({ft, ali, root}) => {
    const initialAmount = new BN('10000');
    const transferAmount = new BN('100');
    await init_ft(ft, root, initialAmount);

    // Register by prepaying for storage.
    await registerUser(ft, ali);

    await root.call(
      ft,
      'ft_transfer',
      {
        receiver_id: ali,
        amount: transferAmount,
      },
      {attachedDeposit: '1'},
    );

    const rootBalance = await ft_balance_of(ft, root);
    const aliBalance = await ft_balance_of(ft, ali);

    t.deepEqual(new BN(rootBalance), initialAmount.sub(transferAmount));
    t.deepEqual(new BN(aliBalance), transferAmount);
  });
});

test('Can close empty balance account', async t => {
  await t.context.worker.fork(async ({ft, ali, root}) => {
    await init_ft(ft, root);

    await registerUser(ft, ali);

    const result = await ali.call(
      ft,
      'storage_unregister',
      {},
      {attachedDeposit: '1'},
    );

    t.is(result, true);
  });
});

test('Can force close non-empty balance account', async t => {
  await t.context.worker.fork(async ({ft, root}) => {
    await init_ft(ft, root, '100');
    const errorString = await captureError(async () =>
      root.call(ft, 'storage_unregister', {}, {attachedDeposit: '1'}));

    t.regex(errorString, /Can't unregister the account with the positive balance without force/);

    const result = await root.call_raw(
      ft,
      'storage_unregister',
      {force: true},
      {attachedDeposit: '1'},
    );

    t.is(result.logs[0],
      `Closed @${root.accountId} with 100`,
    );
  });
});

test('Transfer call with burned amount', async t => {
  await t.context.worker.fork(async ({ft, defi, root}) => {
    const initialAmount = new BN(10_000);
    const transferAmount = new BN(100);
    const burnAmount = new BN(10);
    await init_ft(ft, root, initialAmount);
    await init_defi(defi, ft);

    await registerUser(ft, defi);

    const result = await root
      .createTransaction(ft)
      .functionCall(
        'ft_transfer_call',
        {
          receiver_id: defi,
          amount: transferAmount,
          msg: burnAmount,
        },
        {attachedDeposit: '1', gas: '150 Tgas'},
      )
      .functionCall(
        'storage_unregister',
        {force: true},
        {attachedDeposit: '1', gas: '150 Tgas'},
      )
      .transact();

    t.true(result.logs.includes(
      `Closed @${root.accountId} with ${
        (initialAmount.sub(transferAmount)).toString()}`,
    ));

    t.is(result.parseResult(), true);

    t.true(result.logs.includes(
      'The account of the sender was deleted',
    ));
    t.true(result.logs.includes(
      `Account @${root.accountId} burned ${burnAmount.toString()}`,
    ));

    // Help: this index is diff from sim, we have 10 len when they have 4
    const callbackOutcome = result.receipts_outcomes[5];

    t.is(callbackOutcome.parseResult(), transferAmount.toString());
    const expectedAmount = transferAmount.sub(burnAmount);

    const totalSupply: string = await ft.view('ft_total_supply');
    t.is(totalSupply, expectedAmount.toString());

    const defiBalance = await ft_balance_of(ft, defi);
    t.deepEqual(defiBalance, expectedAmount);
  });
});

test('Transfer call immediate return no refund', async t => {
  await t.context.worker.fork(async ({ft, defi, root}) => {
    const initialAmount = new BN(10_000);
    const transferAmount = new BN(100);
    await init_ft(ft, root, initialAmount);
    await init_defi(defi, ft);

    await registerUser(ft, defi);

    await root.call(
      ft,
      'ft_transfer_call',
      {
        receiver_id: defi,
        amount: transferAmount,
        memo: null,
        msg: 'take-my-money',
      },
      {attachedDeposit: '1', gas: '150 Tgas'},
    );

    const rootBalance = await ft_balance_of(ft, root);
    const defiBalance = await ft_balance_of(ft, defi);

    t.deepEqual(rootBalance, initialAmount.sub(transferAmount));
    t.deepEqual(defiBalance, transferAmount);
  });
});

test('Transfer call promise panics for a full refund', async t => {
  await t.context.worker.fork(async ({ft, defi, root}) => {
    const initialAmount = new BN(10_000);
    const transferAmount = new BN(100);
    await init_ft(ft, root, initialAmount);
    await init_defi(defi, ft);

    await registerUser(ft, defi);

    const result = await root.call_raw(
      ft,
      'ft_transfer_call',
      {
        receiver_id: defi,
        amount: transferAmount,
        memo: null,
        msg: 'this won\'t parse as an integer',
      },
      {attachedDeposit: '1', gas: '150 Tgas'},
    );
    t.regex(result.promiseErrorMessages.join('\n'), /ParseIntError/);

    const rootBalance = await ft_balance_of(ft, root);
    const defiBalance = await ft_balance_of(ft, defi);

    t.deepEqual(rootBalance, initialAmount);
    t.assert(defiBalance.isZero(), `Expected zero got ${defiBalance.toJSON()}`);
  });
});
