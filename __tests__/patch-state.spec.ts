/* eslint-disable @typescript-eslint/no-extraneous-class, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import path from 'path';
import * as borsh from 'borsh';
import {Runner} from '..';

describe('view state & patch state', () => {
  if (Runner.networkIsSandbox()) {
    let runner: Runner;
    jest.setTimeout(60_000);

    beforeAll(async () => {
      runner = await Runner.create(async ({root}) => {
        const contract = await root.createAndDeploy(
          'status-message',
          path.join(__dirname, 'build', 'debug', 'status_message.wasm'),
        );
        const ali = await root.createAccount('ali');
        return {contract, ali};
      });
    });

    class Assignable {
      [key: string]: any;
      constructor(properties: any) {
        for (const key of Object.keys(properties)) {
          this[key] = properties[key];
        }
      }
    }

    class StatusMessage extends Assignable {}

    class Record extends Assignable {}

    const schema = new Map([
      [StatusMessage, {kind: 'struct', fields: [['records', [Record]]]}],
      [
        Record,
        {
          kind: 'struct',
          fields: [
            ['k', 'string'],
            ['v', 'string'],
          ],
        },
      ],
    ]);

    test('View state', async () => {
      await runner.runSandbox(async ({contract, ali}) => {
        await ali.call(contract, 'set_status', {message: 'hello'});

        const state = await contract.viewState();

        // Get raw value
        const data = state.get_raw('STATE');

        // Deserialize from borsh
        const statusMessage: StatusMessage = borsh.deserialize(
          schema,
          StatusMessage,
          data,
        );

        expect(statusMessage.records[0]).toStrictEqual(
          new Record({k: ali.accountId, v: 'hello'}),
        );
      });
    });

    test('Patch state', async () => {
      await runner.runSandbox(async ({contract, ali}) => {
        // Contract must have some state for viewState & patchState to work
        await ali.call(contract, 'set_status', {message: 'hello'});
        // Get state
        const state = await contract.viewState();
        // Get raw value
        const statusMessage = state.get('STATE', {schema, type: StatusMessage});

        // Update contract state
        statusMessage.records.push(
          new Record({k: 'alice.near', v: 'hello world'}),
        );

        // Serialize and patch state back to runtime
        await contract.patchState(
          'STATE',
          borsh.serialize(schema, statusMessage),
        );

        // Check again that the update worked
        const result = await contract.view('get_status', {
          account_id: 'alice.near',
        });
        expect(result).toBe('hello world');

        // Can also get value by passing the schema
        const data = (await contract.viewState()).get('STATE', {
          schema,
          type: StatusMessage,
        });
        expect(data).toStrictEqual(statusMessage);
      });
    });
  } else {
    test('skipping; not using sandbox', () => {
      // Jest requires a test in each file
    });
  }
});
