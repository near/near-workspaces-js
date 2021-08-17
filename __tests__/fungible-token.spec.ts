import { Runner, BN, Account } from "..";

const STORAGE_BYTE_COST = "10000000000000000000";

async function init(ft: Account, owner: Account, supply: BN | string = "10000") {
  await ft.call(ft, "new_default_meta", {
    owner_id: owner,
    total_supply: supply,
  });
}

async function registerUser(ft: Account, user: Account) {
  await user.call(
    ft,
    "storage_deposit",
    { account_id: user },
    // Deposit pulled from ported sim test
    { attachedDeposit: new BN(STORAGE_BYTE_COST).mul(new BN(125)) }
  );
}

describe(`Running on ${Runner.getNetworkFromEnv()}`, () => {
  let runner: Runner;
  jest.setTimeout(60000);

  beforeAll(async () => {
    runner = await Runner.create(async ({ runtime }) => ({
      ft: await runtime.createAndDeploy(
        "fungible-token",
        `${__dirname}/build/debug/fungible_token.wasm`
      ),
      defi: await runtime.createAndDeploy(
        "defi",
        `${__dirname}/build/debug/defi.wasm`
      ),
      ali: await runtime.createAccount("ali"),
    }));
  });

  test("Total supply", async () => {
    await runner.run(async ({ ft, ali }) => {
      await init(ft, ali, "1000");

      const totalSupply: string = await ft.view("ft_total_supply");
      expect(totalSupply).toEqual("1000");
    });
  });

  test("Simple transfer", async () => {
    await runner.run(async ({ ft, ali, root }) => {
      const initialAmount = new BN("10000");
      const transferAmount = new BN("100");
      await init(ft, root, initialAmount);

      // Register by prepaying for storage.
      await registerUser(ft, ali);

      await root.call(
        ft,
        "ft_transfer",
        {
          receiver_id: ali,
          amount: transferAmount,
        },
        { attachedDeposit: "1" }
      );

      const rootBalance: string = await ft.view("ft_balance_of", {
        account_id: root.accountId,
      });
      const aliBalance: string = await ft.view("ft_balance_of", {
        account_id: ali.accountId,
      });
      expect(new BN(rootBalance)).toEqual(initialAmount.sub(transferAmount));
      expect(new BN(aliBalance)).toEqual(transferAmount);
    });
  });

  test("Can close empty balance account", async () => {
    await runner.run(async ({ ft, ali, root }) => {
      await init(ft, root);

      await registerUser(ft, ali);

      const result: boolean = await ali.call(
        ft,
        "storage_unregister",
        {},
        { attachedDeposit: "1" }
      );

      expect(result).toBeTruthy();
    });
  });

  test("Can force close non-empty balance account", async () => {
    await runner.run(async ({ ft, root }) => {
      await init(ft, root, "100");
      const unregister = async () =>
        root.call(ft, "storage_unregister", {}, { attachedDeposit: "1" });

      await expect(unregister).rejects.toThrow();

      const result = await root.call_raw(
        ft,
        "storage_unregister",
        { force: true },
        { attachedDeposit: "1" }
      );

      expect(result.receipts_outcome[0].outcome.logs[0]).toEqual(
        "Closed @" + root.accountId + " with 100"
      );
    });
  });
});