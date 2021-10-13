import {Gas, NEAR, NearAccount, Runner, captureError} from 'near-runner-ava';

const REF_FINANCE_ACCOUNT = 'v2.ref-finance.near';

const DEFAULT_BLOCK_HEIGHT = 45_800_000;

const INIT_SHARES_SUPPLY = '1000000000000000000000000';

const runner = Runner.create();

if (Runner.networkIsSandbox()) {
  runner.test('using `withData` for contracts > 50kB fails', async (test, {root}) => {
    test.regex(
      await captureError(async () => {
        await root.createAccountFrom({
          mainnetContract: REF_FINANCE_ACCOUNT,
          withData: true,
          block_id: 50_000_000,
        });
      }),
      new RegExp(`State of contract ${REF_FINANCE_ACCOUNT} is too large to be viewed`),
    );
  });

  runner.test('if skipping `withData`, fetches only contract Wasm bytes', async (test, {root}) => {
    const refFinance = await root.createAccountFrom({
      mainnetContract: REF_FINANCE_ACCOUNT,
      block_id: DEFAULT_BLOCK_HEIGHT,
    });
    test.regex(
      await captureError(async () => refFinance.view('version')),
      /The contract is not initialized/,
    );
  });

  runner.test('integrate own FT with Ref.Finance', async (test, {root}) => {
    const [ft, refFinance, wNEAR] = await Promise.all([
      root.createAndDeploy('ft', '__tests__/build/debug/fungible_token.wasm', {
        method: 'new_default_meta',
        args: {
          owner_id: root,
          total_supply: NEAR.parse('1,000,000,000 N'),
        },
      }),
      createRef(root),
      createWNEAR(root),
    ]);
    const pool_id = await createPoolWithLiquidity(root, refFinance, {
      [ft.accountId]: NEAR.parse('5 N').toJSON(),
      [wNEAR.accountId]: NEAR.parse('10 N').toJSON(),
    });
    await depositTokens(root, refFinance, {
      [ft.accountId]: NEAR.parse('100 N').toJSON(),
      [wNEAR.accountId]: NEAR.parse('100 N').toJSON(),
    });
    await depositTokens(root, refFinance, {});
    test.is(
      await refFinance.view('get_deposit', {account_id: root, token_id: ft}),
      NEAR.parse('100 N').toJSON(),
    );
    test.is(
      await refFinance.view('get_deposit', {account_id: root, token_id: wNEAR}),
      NEAR.parse('100 N').toJSON(),
    );
    test.is(
      await refFinance.view('get_pool_total_shares', {pool_id}),
      INIT_SHARES_SUPPLY,
    );

    // Get price from pool :0 1 -> 2 tokens.
    const expectedOut = await refFinance.view('get_return', {
      pool_id,
      token_in: ft,
      amount_in: NEAR.parse('1 N'),
      token_out: wNEAR,
    });
    test.is(expectedOut, '1662497915624478906119726');
    const amountOut: string = await root.call(refFinance, 'swap', {actions: [{
      pool_id,
      token_in: ft,
      amount_in: NEAR.parse('1 N'),
      token_out: wNEAR,
      min_amount_out: '1',
    }]}, {
      attachedDeposit: '1',
    });
    test.is(amountOut, expectedOut);
    test.is(
      await refFinance.view('get_deposit', {account_id: root, token_id: ft}),
      NEAR.parse('99 N').toJSON(),
    );
  });
} else {
  runner.test('skipping; not on sandbox network');
}

// Contract: https://github.com/near/core-contracts/blob/master/w-near
async function createWNEAR(
  creator: NearAccount,
  /// block_id = DEFAULT_BLOCK_HEIGHT,
): Promise<NearAccount> {
  const wNEAR = await creator.createAccountFrom({
    mainnetContract: 'wrap.near',
    /// block_id
  });
  await creator.call(wNEAR, 'new', {
    owner_id: creator,
    total_supply: NEAR.parse('1,000,000,000 N'),
  });
  await creator.call(wNEAR, 'storage_deposit', {}, {
    attachedDeposit: NEAR.parse('0.008 N'),
  });
  await creator.call(wNEAR, 'near_deposit', {}, {
    attachedDeposit: NEAR.parse('200 N'),
  });
  return wNEAR;
}

// Contract: https://github.com/ref-finance/ref-contracts/
async function createRef(
  creator: NearAccount,
  /// block_id = DEFAULT_BLOCK_HEIGHT,
): Promise<NearAccount> {
  const refFinance = await creator.createAccountFrom({
    mainnetContract: REF_FINANCE_ACCOUNT,
    /// block_id,
    initialBalance: NEAR.parse('1000 N').toJSON(),
  });
  await creator.call(
    refFinance,
    'new',
    {
      owner_id: creator,
      exchange_fee: 4,
      referral_fee: 1,
    },
  );
  await creator.call(refFinance, 'storage_deposit', {}, {
    attachedDeposit: NEAR.parse('30 mN'),
  });
  return refFinance;
}

type AccountID = string;

async function createPoolWithLiquidity(
  root: NearAccount,
  refFinance: NearAccount,
  tokenAmounts: Record<AccountID, string>,
): Promise<string> {
  const tokens = Object.keys(tokenAmounts);
  await root.call(refFinance, 'extend_whitelisted_tokens', {tokens});
  const pool_id: string = await root.call(refFinance, 'add_simple_pool', {tokens, fee: 25}, {
    attachedDeposit: NEAR.parse('3mN'),
  });
  await root.call(refFinance, 'register_tokens', {token_ids: tokens}, {
    attachedDeposit: '1',
  });
  await depositTokens(root, refFinance, tokenAmounts);
  await root.call(refFinance, 'add_liquidity', {
    pool_id,
    amounts: Object.values(tokenAmounts),
  }, {
    attachedDeposit: NEAR.parse('1N'),
  });
  return pool_id;
}

async function depositTokens(
  root: NearAccount,
  refFinance: NearAccount,
  tokenAmounts: Record<AccountID, string>,
): Promise<void> {
  await Promise.all(Object.entries(tokenAmounts).map(async ([accountId, amount]) => {
    await refFinance.call(accountId, 'storage_deposit', {registration_only: true}, {
      attachedDeposit: NEAR.parse('1N'),
    });
    await root.call(accountId, 'ft_transfer_call', {
      receiver_id: refFinance,
      amount,
      msg: '',
    }, {
      attachedDeposit: '1',
      gas: Gas.parse('200Tgas'),
    });
  }));
}
