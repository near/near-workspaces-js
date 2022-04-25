import {NEAR} from 'near-units';
import {NearAccount} from '../account';

export async function expect(action: () => Promise<any>, ...assertions: Assertion[]) {
  const before = await Promise.all(assertions.map(a => a.before()));

  await action();

  const after = await Promise.all(assertions.map(a => a.after()));

  const expected = assertions.map(a => a.expected());
  const actual = assertions.map((a, i) => a.actual(before[i], after[i]));
  return {before, after, expected, actual};
}

type Assertion = {
  // Name: string;
  before: () => any;
  after: () => any;
  expected: () => any;
  actual: (before: any, after: any) => any;
};

export function toChangeNearBalance(account: NearAccount, amount: string, precision = '1 N'): Assertion {
  const value = NEAR.parse(amount);
  const p = NEAR.parse(precision);
  const description = `${account.accountId} NEAR balance changed by `;

  return {
    // Name: `${this.name}(${account.accountId},${value.toString()})`,
    before: async () => account.availableBalance(),
    after: async () => account.availableBalance(),
    expected: () => `${description}${value.divRound(p).mul(p).toString()}`, // Replace with toHuman when units-js updates
    actual: (before: NEAR, after: NEAR) => `${description}${after.sub(before).divRound(p).mul(p).toString()}`,
  };
}
