import { NearAccount } from '../account';
export declare function expect(action: () => Promise<any>, ...assertions: Assertion[]): Promise<{
    before: any[];
    after: any[];
    expected: any[];
    actual: any[];
}>;
declare type Assertion = {
    before: () => any;
    after: () => any;
    expected: () => any;
    actual: (before: any, after: any) => any;
};
export declare function toChangeNearBalance(account: NearAccount, amount: string, precision?: string): Assertion;
export {};
//# sourceMappingURL=core.d.ts.map