import * as process from 'process';
import * as fs from 'fs/promises';
import {join, parse} from 'path';

import {KeyPair, NearAccount, Runner, TransactionResult} from '..';

const runtime = Runner.create({network: 'testnet'});

const pattern = new RegExp(process.argv.length > 2 ? process.argv[2] : '');

async function deleteAccount(accountId: string, root: NearAccount, key?: KeyPair): Promise<TransactionResult | null> {
  const account = root.getFullAccount(accountId);
  try {
    if (!await account.exists()) {
      console.log(`${accountId} ------- Doesn't Exists Deleting`);
      // @ts-expect-error private method
      await account.manager.deleteKey(accountId);
      console.log(`${accountId} deleted!`);
      return null;
    }

    const txResult = await account.delete('meta', key);
    if (txResult.failed && key) {
      return await deleteAccount(accountId, root);
    }

    console.log(`${accountId} deleted!`);

    return txResult;
  } catch {
    if (key) {
      return deleteAccount(accountId, root);
    }
  }

  return null;
}

async function pMap<I, O=I>(array: I[], fn: (i: I) => Promise<O>): Promise<O[]> {
  return Promise.all(array.map(fn));
}

runtime.run(async ({root}) => {
  const accounts = (await fs.readdir(join(process.cwd(), '.near-credentials', 'runner', 'testnet')))
    .map(s => parse(s).name);
  const originalMap: Map<string, string[]> = new Map();
  originalMap.set(root.accountId, []);
  const accountMap: Map<string, string[]> = accounts.reduce((acc, accountId) => {
    if (!pattern.test(accountId)) {
      return acc;
    }

    const parts = accountId.split('.');
    const rootId = parts.pop()!;
    if (!acc.has(rootId)) {
      acc.set(rootId, []);
    }

    if (parts.length > 0) {
      acc.get(rootId)!.push(accountId);
    }

    return acc;
  }, originalMap);

  await Promise.all([...accountMap.entries()].map(async ([rootAccountId, subaccounts]) => {
    const rootAccount = root.getFullAccount(rootAccountId);
    const key = await rootAccount.getKey() ?? undefined;
    const txs = await pMap(subaccounts, async account => deleteAccount(account, rootAccount, key));
    const errors = txs.filter(tx => tx?.failed).map(tx => tx?.summary());
    if (errors.length > 0) {
      console.log(errors);
    }

    await deleteAccount(rootAccountId, rootAccount);
  }));
});

