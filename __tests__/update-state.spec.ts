import { Runner } from "..";

describe(`Running on ${Runner.getNetworkFromEnv()}`, () => {
  let runner: Runner;
  jest.setTimeout(60000);

  beforeAll(async () => {
    runner = await Runner.create(async ({ root }) => ({
      contract: await root.createAndDeploy(
        "status-message",
        `${__dirname}/build/debug/status_message.wasm`
      ),
      ali: await root.createAccount("ali"),
    }));
  });

  test("Root gets null status", async () => {
    await runner.run(async ({ contract, root }) => {
      const result = await contract.view("get_status", {
        account_id: root.accountId,
      });
      expect(result).toBeNull();
    });
  });

  test("Ali sets then gets status", async () => {
    await runner.run(async ({ contract, ali }) => {
      await ali.call(contract, "set_status", { message: "hello" });
      const result = await contract.view("get_status", {
        account_id: ali.accountId,
      });
      expect(result).toBe("hello");
    });
  });

  test("Root and Ali have different statuses", async () => {
    await runner.run(async ({ contract, root, ali }) => {
      await root.call(contract, "set_status", { message: "world" });
      const rootStatus = await contract.view("get_status", {
        account_id: root.accountId,
      });
      expect(rootStatus).toBe("world");

      const aliStatus = await contract.view("get_status", {
        account_id: ali.accountId,
      });
      expect(aliStatus).toBeNull();
    });
  });
});
