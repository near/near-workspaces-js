import {type Buffer} from 'buffer';
import * as fs from 'fs/promises';
import {type URL} from 'url';
import {type TransactionResult} from './transaction-result';
import {
  type Action,
  PublicKey,
  type AccessKey,
  fullAccessKey,
  addKey,
  createAccount,
  deleteAccount,
  deleteKey,
  deployContract,
  functionCall,
  stake,
  transfer,
  DEFAULT_FUNCTION_CALL_GAS,
  type KeyPair,
  type NamedAccount,
} from './types';
import {findFile, isPathLike} from './internal-utils';
import {NO_DEPOSIT} from './utils';

export abstract class Transaction {
  readonly receiverId: string;
  readonly senderId: string;
  readonly actions: Action[] = [];
  private accountToBeCreated = false;
  private _transferAmount?: bigint;

  constructor(sender: NamedAccount | string, receiver: NamedAccount | string) {
    this.senderId = typeof sender === 'string' ? sender : sender.accountId;
    this.receiverId = typeof receiver === 'string' ? receiver : receiver.accountId;
  }

  addKey(publicKey: string | PublicKey, accessKey: AccessKey = fullAccessKey()): this {
    this.actions.push(addKey(PublicKey.from(publicKey), accessKey));
    return this;
  }

  createAccount(): this {
    this.accountToBeCreated = true;
    this.actions.push(createAccount());
    return this;
  }

  deleteAccount(beneficiaryId: string): this {
    this.actions.push(deleteAccount(beneficiaryId));
    return this;
  }

  deleteKey(publicKey: string | PublicKey): this {
    this.actions.push(deleteKey(PublicKey.from(publicKey)));
    return this;
  }

  /**
   * Deploy given Wasm file to the account.
   *
   * @param code path or data of contract binary. If given an absolute path (such as one created with 'path.join(__dirname, …)') will use it directly. If given a relative path such as `res/contract.wasm`, will resolve it from the project root (meaning the location of the package.json file).
   */
  async deployContractFile(code: string | URL | Uint8Array | Buffer): Promise<Transaction> {
    return this.deployContract(isPathLike(code)
      ? await fs.readFile(
        code.toString().startsWith('/') ? code : await findFile(code.toString()),
      )
      : code,
    );
  }

  deployContract(code: Uint8Array | Buffer): this {
    this.actions.push(deployContract(new Uint8Array(code)));
    return this;
  }

  functionCall(
    methodName: string,
    args: Record<string, unknown> | Uint8Array,
    {
      gas = DEFAULT_FUNCTION_CALL_GAS,
      attachedDeposit = NO_DEPOSIT,
    }: {gas?: bigint; attachedDeposit?: bigint} = {},
  ): this {
    this.actions.push(
      functionCall(methodName, args, gas, attachedDeposit),
    );
    return this;
  }

  stake(amount: bigint, publicKey: PublicKey | string): this {
    this.actions.push(stake(amount, PublicKey.from(publicKey)));
    return this;
  }

  transfer(amount: bigint): this {
    this._transferAmount = amount;
    this.actions.push(transfer(this._transferAmount));
    return this;
  }

  get accountCreated(): boolean {
    return this.accountToBeCreated;
  }

  get transferAmount(): bigint {
    return this._transferAmount ?? BigInt('0');
  }

  abstract transact(keyPair?: KeyPair): Promise<TransactionResult>;
}
