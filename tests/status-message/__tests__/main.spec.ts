import { strict as assert } from "assert";
import { Runner, Runtime } from "../../../src";
import * as borsh from "borsh";

jest.setTimeout(30000)

const ALI = "ali";
const BOB = "bob";
const CONTRACT = "status-message";

let runner: Runner

describe(`Running on ${process.env.NEAR_RUNNER_NETWORK || 'sandbox'}`, () => {
  beforeAll(async () => {
    runner = await Runner.create(async (runtime: Runtime) => {
      await runtime.createAndDeploy(
        CONTRACT,
        `${__dirname}/../build/debug/status_message.wasm`
      );
      await runtime.createAccount(ALI);
      await runtime.createAccount(BOB);
    })
  })

  test('Ali sets then gets status', async () => {
    await runner.run(async (runtime: Runtime) => {
      const ali = runtime.getAccount(ALI);
      const contract = runtime.getContractAccount(CONTRACT);
      await ali.call(contract, "set_status", { message: "hello" })
      const result = await contract.view("get_status", { account_id: ali.accountId })
      assert.equal(result, "hello");
    })
  });

  test('Bob gets null status', async () => {
    await runner.run(async (runtime: Runtime) => {
      const contract = runtime.getContractAccount(CONTRACT);
      const result = await contract.view("get_status", { account_id: BOB })
      assert.equal(result, null)
    })
  });

  test('Bob and Ali have different statuses', async () => {
    await runner.run(async (runtime: Runtime) => {
      const bob = runtime.getAccount(BOB);
      const contract = runtime.getContractAccount(CONTRACT);
      await bob.call(contract, "set_status", { message: "world" })
      const bobStatus = await contract.view(
        "get_status",
        { account_id: bob.accountId }
      )
      assert.equal(bobStatus, "world");

      const ali = runtime.getAccount(ALI);

      const aliStatus = await contract.view(
        "get_status",
        { account_id: ali.accountId }
      )
      assert.equal(aliStatus, null)
    })
  });

  if ('sandbox' === Runner.getNetworkFromEnv()) {
    class Assignable {
      [key: string]: any;
      constructor(properties: any) {
        Object.keys(properties).map((key) => {
          this[key] = properties[key];
        });
      }
    }

    class StatusMessage extends Assignable { }

    class Record extends Assignable { }

    const schema = new Map([
      [StatusMessage, { kind: "struct", fields: [["records", [Record]]] }],
      [
        Record,
        {
          kind: "struct",
          fields: [
            ["k", "string"],
            ["v", "string"],
          ],
        },
      ],
    ]);

    test(`View state${process.env.NEAR_RUNNER_NETWORK !== 'testnet' ? '' : '(skipping on testnet)'}`, async () => {
      await runner.runSandbox(async (runtime: Runtime) => {
        const ali = runtime.getAccount(ALI);
        const contract = runtime.getContractAccount(CONTRACT);
        await ali.call(contract, "set_status", { message: "hello" })

        const state = await contract.viewState();

        // Get raw value
        let data = state.get_raw("STATE");

        // deserialize from borsh
        const statusMessage: StatusMessage = borsh.deserialize(schema, StatusMessage, data);

        expect(statusMessage.records[0]).toStrictEqual(
          new Record({ k: ali.accountId, v: 'hello' })
        )
      });
    });


    test(`Patch state${process.env.NEAR_RUNNER_NETWORK !== 'testnet' ? '' : ' (skipping on testnet)'}`, async () => {
      await runner.runSandbox(async (runtime: Runtime) => {
        const ali = runtime.getAccount(ALI);
        const contract = runtime.getContractAccount(CONTRACT);
        // contract must have some state for viewState & patchState to work
        await ali.call(contract, "set_status", { message: "hello" })
        // Get state
        const state = await contract.viewState();
        // Get raw value
        let statusMessage = state.get("STATE", { schema, type: StatusMessage });

        // update contract state
        statusMessage.records.push(new Record({ k: "alice.near", v: "hello world" }));

        // serialize and patch state back to runtime
        await contract.patchState("STATE", borsh.serialize(schema, statusMessage));

        // Check again that the update worked
        const result = await contract.view("get_status", { account_id: "alice.near" })
        expect(result).toBe("hello world");

        // Can also get value by passing the schema
        const data = (await contract.viewState()).get("STATE", { schema, type: StatusMessage });
        expect(data).toStrictEqual(statusMessage);
      })
    });
  }
})