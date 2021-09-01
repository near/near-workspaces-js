import * as fs from 'fs/promises';
import {join, parse} from 'path';

import {KeyPair, NearAccount, Runner, TransactionResult} from '..';

const runtime = Runner.create({network: 'testnet'});

const pattern = process.argv.length > 2 ? new RegExp(process.argv[2]) : /.*/;

async function deleteAccount(accountId: string, root: NearAccount, key?: KeyPair): Promise<TransactionResult | null> {
  const account = root.getFullAccount(accountId);
  try {
    if (!await account.exists()) {
      console.log(`${accountId} ------- Doesn't Exists`);
      return null;
    }

    const res = await account.delete('meta', key);
    if (res.failed && key) {
      return await deleteAccount(accountId, root);
    }

    console.log(`${accountId} deleted!`);

    return res;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`account ${accountId} failed to be deleted.\n${error.message}`);
      console.error(`${accountId} ${(await account.getKey())?.getPublicKey().toString()}`);
    }

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
  const accounts = (await fs.readdir(join(__dirname, '..', '.near-credentials', 'runner', 'testnet')))
    .map(s => parse(s).name);
  const originalMap = new Map();
  originalMap.set(root.accountId, []);
  const accountMap: Map<string, string[]> = accounts.reduce((acc, accountId) => {
    if (!pattern.test(accountId)) {
      return acc;
    }

    const parts = accountId.split('.');
    const root = parts.pop();
    if (!acc.has(root)) {
      acc.set(root, []);
    }

    if (parts.length > 0) {
      acc.get(root).push(accountId);
    }

    return acc;
  }, originalMap);

  console.log(accountMap);

  await Promise.all([...accountMap.entries()].map(async ([rootAccountId, subaccounts]) => {
    const rootAccount = root.getFullAccount(rootAccountId);
    const key = await rootAccount.getKey() ?? undefined;
    const txs = await pMap(subaccounts, async account => deleteAccount(account, rootAccount, key));
    const errors = txs.filter(tx => tx !== null && tx.failed).map(tx => tx.summary());
    if (errors.length > 0) {
      console.log(errors);
    }

    await deleteAccount(rootAccountId, rootAccount);
    console.log(`${rootAccountId} deleted`);
  }));
});

