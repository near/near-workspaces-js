import {Buffer} from 'buffer';
import {env} from 'process';
import {mock} from 'node:test';
import test, {type ExecutionContext} from 'ava';
import {Account} from '../src/account/account';
import {type AccountManager, ManagedTransaction} from '../src/account/account-manager';
import {TransactionResult} from '../src/transaction-result';
import {type FinalExecutionOutcome, type NamedAccount} from '../src/types';

function captureLogs(t: ExecutionContext): unknown[][] {
  const oldValue = env.NEAR_WORKSPACES_NO_LOGS;
  Reflect.deleteProperty(env, 'NEAR_WORKSPACES_NO_LOGS');
  const calls: unknown[][] = [];
  const logger = mock.method(console, 'log', (...args: unknown[]) => {
    calls.push(args);
  });
  t.teardown(() => {
    logger.mock.restore();
    if (oldValue === undefined) {
      Reflect.deleteProperty(env, 'NEAR_WORKSPACES_NO_LOGS');
    } else {
      env.NEAR_WORKSPACES_NO_LOGS = oldValue;
    }
  });
  return calls;
}

function managerWithLogs(logs: string[], failed = false): AccountManager {
  const status = failed
    ? {Failure: {error_message: 'contract failed', error_type: 'FunctionCallError'}}
    : {SuccessValue: Buffer.from('true').toString('base64')};
  const outcome = {
    status,
    transaction_outcome: {outcome: {logs: []}},
    receipts_outcome: [{outcome: {logs, status}}],
  } as unknown as FinalExecutionOutcome;
  const result = new TransactionResult(outcome, 0, 1, {
    network: 'sandbox', rpcAddr: 'http://127.0.0.1',
  });
  const manager = {
    async executeTransaction() {
      return result;
    },
    batch(sender: NamedAccount | string, receiver: NamedAccount | string) {
      return new ManagedTransaction(manager, sender, receiver);
    },
  } as unknown as AccountManager;
  return manager;
}

test.serial('batch transactions print all receipt logs', async t => {
  const calls = captureLogs(t);
  const manager = managerWithLogs(['EVENT_JSON:first', 'EVENT_JSON:second']);
  const result = await manager.batch('alice', 'contract')
    .functionCall('first', {})
    .functionCall('second', {})
    .transact();
  t.deepEqual(calls, [['Contract logs from contract transaction:', result.logs]]);
});

test.serial('the high-level call prints logs once', async t => {
  const calls = captureLogs(t);
  const account = new Account('alice', managerWithLogs(['EVENT_JSON:one']));
  t.true(await account.call('contract', 'run', {}));
  t.is(calls.length, 1);
});

test.serial('failed batch transactions print receipt logs', async t => {
  const calls = captureLogs(t);
  const result = await managerWithLogs(['before panic'], true)
    .batch('alice', 'contract').transact();
  t.true(result.failed);
  t.deepEqual(calls, [['Contract logs from contract transaction:', ['before panic']]]);
});

test.serial('NEAR_WORKSPACES_NO_LOGS suppresses batch logs', async t => {
  const calls = captureLogs(t);
  env.NEAR_WORKSPACES_NO_LOGS = '1';
  await managerWithLogs(['hidden']).batch('alice', 'contract').transact();
  t.deepEqual(calls, []);
});

test.serial('transactions without receipt logs do not print', async t => {
  const calls = captureLogs(t);
  await managerWithLogs([]).batch('alice', 'contract').transact();
  t.deepEqual(calls, []);
});
