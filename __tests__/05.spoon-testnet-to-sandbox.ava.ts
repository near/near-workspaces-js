import {NEAR, Gas, NearAccount, Runner, captureError} from 'near-runner-ava';

const REF_FINANCE_ACCOUNT = 'v2.ref-finance.near';

const DEFAULT_ATTACHED_DEPOSIT = NEAR.parse('1.25 mN');

const DEFAULT_BLOCK_HEIGHT = 45_800_000;

async function spoonContract(
  root: NearAccount,
  mainnetContract: string,
  blockId = DEFAULT_BLOCK_HEIGHT,
  rest: any = {},
): Promise<NearAccount> {
  return root.spoonAccount({
    mainnetContract,
    blockId,
    ...rest,
  });
}

async function registerFT(account: NearAccount, token: NearAccount, attachedDeposit = DEFAULT_ATTACHED_DEPOSIT): Promise<void> {
  await account.call_raw(
    token,
    'storage_deposit',
    {account_id: account},
    {attachedDeposit},
  );
}

// Contract: https://github.com/ref-finance/ref-contracts/
async function createRef(
  root: NearAccount,
  blockId = DEFAULT_BLOCK_HEIGHT,
): Promise<NearAccount> {
  return spoonContract(root, REF_FINANCE_ACCOUNT, blockId, {initialBalance: NEAR.parse('1000 N')});
}

// Contract: https://github.com/near/core-contracts/blob/master/w-near
async function createFT(
  root: NearAccount,
  tokenAccount: string,
  blockId = DEFAULT_BLOCK_HEIGHT,
  attachedDeposit: NEAR = DEFAULT_ATTACHED_DEPOSIT,
): Promise<NearAccount> {
  const account = await spoonContract(
    root,
    tokenAccount,
    blockId,
  );
  await registerFT(root, account, attachedDeposit);
  return account;
}

const runner = Runner.create();

if (Runner.networkIsSandbox()) {
  // From https://github.com/ref-finance/ref-contracts/blob/e96a6b5e3b403a3ba5271b6a03843a50b3e54a4f/ref-exchange/src/views.rs#L34-L45
  interface Pool {
    pool_kind: string; // Pool kind
    token_account_ids: string[]; // List of tokens in the pool
    amounts: string[]; // How much NEAR this contract has; U128 array
    total_fee: number; // Fee charged for swap
    shares_total_supply: string; // Total number of shares
  }

  runner.test('Ref.Finance default contract state too large', async (test, {root}) => {
    test.regex(
      await captureError(async () =>
        root.spoonAccount({
          testnetContract: REF_FINANCE_ACCOUNT,
        }),
      ),
      /State of contract ref-finance.testnet is too large to be viewed/,
    );
  });

  runner.test('create local Ref.Finance', async (test, {root}) => {
    const refFinance = await createRef(root);
    console.log(await refFinance.view('version'));
    console.log(await refFinance.view('get_number_of_pools'));
    let pools: Pool[] = await refFinance.view('get_pools', {
      from_index: 0,
      limit: 12,
    });
    console.log(pools);
    test.deepEqual(
      await refFinance.view('get_pool_fee', {pool_id: 0}),
      pools[0].total_fee,
    );
    let tokens: string[] = await refFinance.view('get_whitelisted_tokens');
    // Const tokenAccounts = Promises.all(tokens.map(await createFT(token, root)))

    console.log(tokens);

    test.assert(tokens.includes('wrap.testnet'));
    test.is(await refFinance.view('version'), '0.2.1');
    test.is(await refFinance.view('get_number_of_pools'), 12);
    pools = await refFinance.view('get_pools', {
      from_index: 0,
      limit: 12,
    })!;
    test.is(pools.length, 12);
    test.deepEqual(
      await refFinance.view('get_pool', {pool_id: 0}),
      pools[0],
    );
    test.deepEqual(
      await refFinance.view('get_pool_fee', {pool_id: 0}),
      pools[0].total_fee,
    );
    tokens = await refFinance.view('get_whitelisted_tokens');

    console.log(tokens);
    test.assert(tokens.includes('wrap.testnet'));
  });

  runner.test('swap wNear for nDai', async (test, {root}) => {
    const pool_id = 2;
    const refFinance = await createRef(root);
    const wNear = await createFT(root, 'wrap.near', DEFAULT_BLOCK_HEIGHT - 15_000_000);
    await root.call(
      wNear,
      'near_deposit',
      {},
      {attachedDeposit: NEAR.parse('2 N')},
    );
    const nDai = await createFT(root, '6b175474e89094c44da98b954eedeac495271d0f.factory.bridge.near', DEFAULT_BLOCK_HEIGHT - 10_000_000, NEAR.parse('1 N'));
    await registerFT(refFinance, wNear);
    await registerFT(refFinance, nDai, NEAR.parse('1 N'));
    const tx = root.createTransaction(refFinance);
    await tx.functionCall('storage_deposit', {account_id: root, registration_only: false},
      {
        attachedDeposit: NEAR.parse('0.008 N'),
      }).signAndSend();
    await root.call(wNear, 'ft_transfer_call', {receiver_id: refFinance, amount: NEAR.parse('1 N'), msg: ''}, {attachedDeposit: NEAR.from(1), gas: Gas.parse('300 TGas')});
    const swapTx = await root.createTransaction(refFinance).functionCall('swap', {
      force: {},
      actions: [
        {
          pool_id,
          token_in: wNear,
          token_out: nDai,
          amount_in: NEAR.parse('1 N'),
          min_amount_out: '1',
        },
      ],
    },
    {attachedDeposit: NEAR.parse('0.008 N')},
    )
      .signAndSend();
      // .signAndSend((await refFinance.getKey())!);
    console.log(swapTx.succeeded);
    console.log(await wNear.view('ft_balance_of', {account_id: root}));
    console.log((await refFinance.availableBalance()).toHuman());
    await root.createTransaction(refFinance).transfer(NEAR.parse('100 N')).signAndSend();
    await root.call(refFinance, 'withdraw', {token_id: nDai, amount: '10'}, {attachedDeposit: '1', gas: Gas.parse('300 TGas')});
    console.log(await nDai.view('ft_balance_of', {account_id: root}));

    // Console.log(JSON.stringify(await root.createTransaction(refFinance).functionCall('swap', {
    //      actions: [
    //       {
    //         pool_id,
    //         token_in: wNear,
    //         token_out: banana.toString(),
    //         amount_in: NEAR.parse('1 N'),
    //         min_amount_out: '23108498937256336000',
    //       },
    //     ],
    // }).signAndSend(), null, 4))
  });
} else {
  runner.test('skipping; not on sandbox network', async () => {});
}
