import { Runner } from "../src";
import * as borsh from "borsh";

describe("view state & patch state", () => {
  if (!Runner.networkIsSandbox()) {
    test("skipping; not using sandbox", () => {});
  } else {
    let runner: Runner;
    jest.setTimeout(60000);

    beforeAll(async () => {
      runner = await Runner.create(async ({ runtime }) => {
        const contract = await runtime.createAndDeploy(
          "status-message",
          `${__dirname}/build/debug/status_message.wasm`
        );
        const ali = await runtime.createAccount("ali");
        return { contract, ali };
      });
    });

    class Assignable {
      [key: string]: any;
      constructor(properties: any) {
        Object.keys(properties).map((key) => {
          this[key] = properties[key];
        });
      }
    }

    class StatusMessage extends Assignable {}

    class Record extends Assignable {}

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

    test(`View state${
      process.env.NEAR_RUNNER_NETWORK !== "testnet"
        ? ""
        : "(skipping on testnet)"
    }`, async () => {
      await runner.runSandbox(async ({ contract, ali }) => {
        await ali.call(contract, "set_status", { message: "hello" });

        const state = await contract.viewState();

        // Get raw value
        let data = state.get_raw("STATE");

        // deserialize from borsh
        const statusMessage: StatusMessage = borsh.deserialize(
          schema,
          StatusMessage,
          data
        );

        expect(statusMessage.records[0]).toStrictEqual(
          new Record({ k: ali.accountId, v: "hello" })
        );
      });
    });

    test(`Patch state${
      process.env.NEAR_RUNNER_NETWORK !== "testnet"
        ? ""
        : " (skipping on testnet)"
    }`, async () => {
      await runner.runSandbox(async ({ contract, ali }) => {
        // contract must have some state for viewState & patchState to work
        await ali.call(contract, "set_status", { message: "hello" });
        // Get state
        const state = await contract.viewState();
        // Get raw value
        let statusMessage = state.get("STATE", { schema, type: StatusMessage });

        // update contract state
        statusMessage.records.push(
          new Record({ k: "alice.near", v: "hello world" })
        );

        // serialize and patch state back to runtime
        await contract.patchState(
          "STATE",
          borsh.serialize(schema, statusMessage)
        );

        // Check again that the update worked
        const result = await contract.view("get_status", {
          account_id: "alice.near",
        });
        expect(result).toBe("hello world");

        // Can also get value by passing the schema
        const data = (await contract.viewState()).get("STATE", {
          schema,
          type: StatusMessage,
        });
        expect(data).toStrictEqual(statusMessage);
      });
    });
  }
});
