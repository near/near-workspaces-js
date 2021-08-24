/**
 * This tests the behavior of the standard FT contract at
 * https://github.com/near/near-sdk-rs/tree/master/examples/fungible-token
 *
 * Some advanced features of near-runner this shows off:
 *
 * - Cross-Contract Calls: the "defi" contract implements basic features that
 *   might be used by a marketplace contract. You can see its source code at the
 *   near-sdk-rs link above. Several FT methods make cross-contract calls, and
 *   these are tested below using this "defi" contract.
 *
 * - Complex transactions: to exercise certain edge cases of the FT standard,
 *   tests below initiate chains of transactions using near-runner's transaction
 *   builder. Search for `createTransaction` below.
 */
import path from 'path';
import {Buffer} from 'buffer';
import {Runner, BN, Account} from '..';

const STORAGE_BYTE_COST = '10000000000000000000';

async function init_ft(
  ft: Account,
  owner: Account,
  supply: BN | string = '10000',
) {
  await ft.call(ft, 'new_default_meta', {
    owner_id: owner,
    total_supply: supply,
  });
}

async function init_defi(defi: Account, ft: Account) {
  await defi.call(defi, 'new', {
    fungible_token_account_id: ft,
  });
}

async function registerUser(ft: Account, user: Account) {
  await user.call(
    ft,
    'storage_deposit',
    {account_id: user},
    // Deposit pulled from ported sim test
    {attachedDeposit: new BN(STORAGE_BYTE_COST).mul(new BN(125))},
  );
}

describe(`Running on ${Runner.getNetworkFromEnv()}`, () => {
  let runner: Runner;
  jest.setTimeout(60_000);

  beforeAll(async () => {
    runner = await Runner.create(async ({root}) => ({
      ft: await root.createAndDeploy(
        'fungible-token',
        path.join(__dirname, 'build', 'debug', 'fungible_token.wasm'),
      ),
      defi: await root.createAndDeploy(
        'defi',
        path.join(__dirname, 'build', 'debug', 'defi.wasm'),
      ),
      ali: await root.createAccount('ali'),
    }));
  });

  test('Total supply', async () => {
    await runner.run(async ({ft, ali}) => {
      await init_ft(ft, ali, '1000');

      const totalSupply: string = await ft.view('ft_total_supply');
      expect(totalSupply).toEqual('1000');
    });
  });

  test('Simple transfer', async () => {
    await runner.run(async ({ft, ali, root}) => {
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

      const rootBalance: string = await ft.view('ft_balance_of', {
        account_id: root,
      });
      const aliBalance: string = await ft.view('ft_balance_of', {
        account_id: ali,
      });
      expect(new BN(rootBalance)).toEqual(initialAmount.sub(transferAmount));
      expect(new BN(aliBalance)).toEqual(transferAmount);
    });
  });

  test('Can close empty balance account', async () => {
    await runner.run(async ({ft, ali, root}) => {
      await init_ft(ft, root);

      await registerUser(ft, ali);

      const result: boolean = await ali.call(
        ft,
        'storage_unregister',
        {},
        {attachedDeposit: '1'},
      );

      expect(result).toStrictEqual(true);
    });
  });

  test('Can force close non-empty balance account', async () => {
    await runner.run(async ({ft, root}) => {
      await init_ft(ft, root, '100');

      await expect(async () =>
        root.call(ft, 'storage_unregister', {}, {attachedDeposit: '1'})).rejects.toThrow();

      const result = await root.call_raw(
        ft,
        'storage_unregister',
        {force: true},
        {attachedDeposit: '1'},
      );

      expect(result.receipts_outcome[0].outcome.logs[0]).toEqual(
        `Closed @${root.accountId} with 100`,
      );
    });
  });

  test('Transfer call with burned amount', async () => {
    await runner.run(async ({ft, defi, root}) => {
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
          {attachedDeposit: '1', gas: '150000000000000'},
        )
        .functionCall(
          'storage_unregister',
          {force: true},
          {attachedDeposit: '1', gas: '150000000000000'},
        )
        .signAndSend();

      expect(result.receipts_outcome[0].outcome.logs[1]).toEqual(
        `Closed @${root.accountId} with ${
          (initialAmount.sub(transferAmount)).toString()}`,
      );

      // Help: would be nice to have an API to avoid doing this
      if (
        typeof result.status === 'object'
        && typeof result.status.SuccessValue === 'string'
      ) {
        const value = Buffer.from(
          result.status.SuccessValue,
          'base64',
        ).toString();
        expect(JSON.parse(value)).toStrictEqual(true);
      } else {
        throw new TypeError('unexpected result');
      }

      // Help: this index is diff from sim, we have 10 len when they have 4
      const callbackOutcome = result.receipts_outcome[5].outcome;
      expect(callbackOutcome.logs[0]).toEqual(
        'The account of the sender was deleted',
      );
      expect(callbackOutcome.logs[1]).toEqual(
        `Account @${root.accountId} burned ${burnAmount.toString()}`,
      );

      // Check that outcome response was the transfer amount
      if (
        typeof callbackOutcome.status === 'object'
        && typeof callbackOutcome.status.SuccessValue === 'string'
      ) {
        const value = Buffer.from(
          callbackOutcome.status.SuccessValue,
          'base64',
        ).toString();
        expect(JSON.parse(value)).toEqual(transferAmount.toString());
      } else {
        throw new TypeError('unexpected result');
      }

      const expectedAmount = transferAmount.sub(burnAmount).toString();

      const totalSupply: string = await ft.view('ft_total_supply');
      expect(totalSupply).toEqual(expectedAmount);

      const defiBalance: string = await ft.view('ft_balance_of', {
        account_id: defi,
      });
      expect(defiBalance).toEqual(expectedAmount);
    });
  });

  test('Transfer call immediate return no refund', async () => {
    await runner.run(async ({ft, defi, root}) => {
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
        {attachedDeposit: '1', gas: '150000000000000'},
      );

      const rootBalance: string = await ft.view('ft_balance_of', {
        account_id: root,
      });
      const defiBalance: string = await ft.view('ft_balance_of', {
        account_id: defi,
      });
      expect(new BN(rootBalance)).toEqual(initialAmount.sub(transferAmount));
      expect(new BN(defiBalance)).toEqual(transferAmount);
    });
  });

  test('Transfer call promise panics for a full refund', async () => {
    await runner.run(async ({ft, defi, root}) => {
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
        {attachedDeposit: '1', gas: '150000000000000'},
      );

      const promiseOutcome = result.receipts_outcome[2].outcome;
      if (
        typeof promiseOutcome.status === 'object'
        && typeof promiseOutcome.status.Failure === 'object'
      ) {
        // Help: update the API so hacky solutions like this aren't required
        expect(JSON.stringify(promiseOutcome.status.Failure)).toContain(
          'ParseIntError',
        );
      } else {
        throw new TypeError('unexpected promise outcome');
      }

      const rootBalance: string = await ft.view('ft_balance_of', {
        account_id: root,
      });
      const defiBalance: string = await ft.view('ft_balance_of', {
        account_id: defi,
      });
      expect(new BN(rootBalance)).toEqual(initialAmount);
      expect(new BN(defiBalance)).toEqual(new BN(0));
    });
  });
});
