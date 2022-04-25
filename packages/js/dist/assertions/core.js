"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toChangeNearBalance = exports.expect = void 0;
const near_units_1 = require("near-units");
async function expect(action, ...assertions) {
    const before = await Promise.all(assertions.map(a => a.before()));
    await action();
    const after = await Promise.all(assertions.map(a => a.after()));
    const expected = assertions.map(a => a.expected());
    const actual = assertions.map((a, i) => a.actual(before[i], after[i]));
    return { before, after, expected, actual };
}
exports.expect = expect;
function toChangeNearBalance(account, amount, precision = '1 N') {
    const value = near_units_1.NEAR.parse(amount);
    const p = near_units_1.NEAR.parse(precision);
    const description = `${account.accountId} NEAR balance changed by `;
    return {
        // Name: `${this.name}(${account.accountId},${value.toString()})`,
        before: async () => account.availableBalance(),
        after: async () => account.availableBalance(),
        expected: () => `${description}${value.divRound(p).mul(p).toString()}`,
        actual: (before, after) => `${description}${after.sub(before).divRound(p).mul(p).toString()}`,
    };
}
exports.toChangeNearBalance = toChangeNearBalance;
//# sourceMappingURL=core.js.map