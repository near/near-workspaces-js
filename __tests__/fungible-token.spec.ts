import { Runner, BN, Account } from "..";

const STORAGE_BYTE_COST = "10000000000000000000";

async function init(ft: Account, owner: string, supply: BN | string) {
  await ft.call(ft, "new_default_meta", {
    owner_id: owner,
    total_supply: supply,
  });
}

async function registerUser(ft: Account, user: Account) {
  await user.call(
    ft,
    "storage_deposit",
    { account_id: user.accountId },
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
      await init(ft, ali.accountId, "1000");

      let totalSupply: string = await ft.view("ft_total_supply");
      expect(totalSupply).toEqual("1000");
    });
  });

  test("Simple transfer", async () => {
    await runner.run(async ({ ft, ali, root }) => {
      let initialAmount = "10000";
      let transferAmount = "100";
      await init(ft, root.accountId, initialAmount);

      // Register by prepaying for storage.
      await registerUser(ft, ali);

      await root.call(
        ft.accountId,
        "ft_transfer",
        {
          receiver_id: ali.accountId,
          amount: transferAmount,
        },
        { attachedDeposit: "1" }
      );

      let rootBalance: string = await ft.view("ft_balance_of", {
        account_id: root.accountId,
      });
      let aliBalance: string = await ft.view("ft_balance_of", {
        account_id: ali.accountId,
      });
      expect(rootBalance).toEqual(
        new BN(initialAmount).sub(new BN(transferAmount)).toString()
      );
      expect(aliBalance).toEqual(transferAmount);
    });
  });

});
