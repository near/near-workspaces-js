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
  return root.createAccountFrom({
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
        root.createAccountFrom({
          testnetContract: REF_FINANCE_ACCOUNT,
          withData: true,
        }),
      ),
      /State of contract ref-finance.testnet is too large to be viewed/,
    );
  });

  runner.test('default createAccountFrom does not include account state', async (test, {root}) => {
    test.fail('todo');
  });

  runner.test('integrate own FT with Ref.Finance', async (test, {root}) => {
    test.fail('todo');
  });
} else {
  runner.test('skipping; not on sandbox network', async () => {});
}
