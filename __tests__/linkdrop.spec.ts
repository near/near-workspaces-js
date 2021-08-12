import { Runner, toYocto, createKeyPair } from "../src";

describe(`Running on ${Runner.getNetworkFromEnv()}`, () => {
    jest.setTimeout(60000);
    let runner: Runner;
  
    beforeAll(async () => {
      runner = await Runner.create(async ({ runtime }) => ({
        linkdrop: await runtime.createAndDeploy(
          "linkdrop",
          `${__dirname}/build/debug/linkdrop.wasm`
        ),
      }));
    });
  
    test("call myself", async () => {
      await runner.run(async ({ root, linkdrop }) => {
  
        const senderKeys = createKeyPair();
        const public_key = senderKeys.getPublicKey().toString()
  
        await root.call(linkdrop, "send",  {
          public_key
        },
        {
          attachedDeposit: toYocto("2")
        })
        // can only create subaccounts
        const new_account_id = `bob.${linkdrop.accountId}`;
        const actualKey = createKeyPair();
        const new_public_key = actualKey.getPublicKey().toString();
        
        let res = await linkdrop.call_raw(linkdrop, "create_account_and_claim", {
          new_account_id,
          new_public_key
        },
        {
          signWithKey: senderKeys,
          gas: "50" + "0".repeat(12)
        });
        // @ts-ignore
        console.log(res.receipts_outcome.map(o => o.outcome.logs).filter(x => x.length > 0)[0]);
      });
    });
});
