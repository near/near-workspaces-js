import {Buffer} from 'buffer';
import * as fs from 'fs/promises';
import {URL} from 'url';
import {NEAR} from 'near-units';
import {TransactionResult} from './transaction-result';
import {
  Action,
  PublicKey,
  AccessKey,
  fullAccessKey,
  addKey,
  createAccount,
  deleteAccount,
  deleteKey,
  deployContract,
  functionCall,
  stake,
  transfer,
  BN,
  DEFAULT_FUNCTION_CALL_GAS,
  KeyPair,
  NamedAccount,
} from './types';
import {isPathLike} from './internal-utils';
import {NO_DEPOSIT} from './utils';

export abstract class Transaction {
  readonly receiverId: string;
  readonly senderId: string;
  readonly actions: Action[] = [];
  private accountToBeCreated = false;
  private _transferAmount?: NEAR;

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

  async deployContractFile(code: string | URL | Uint8Array | Buffer): Promise<Transaction> {
    return this.deployContract(isPathLike(code) ? await fs.readFile(code) : code);
  }

  deployContract(code: Uint8Array | Buffer): this {
    this.actions.push(deployContract(code));
    return this;
  }

  functionCall(
    methodName: string,
    args: Record<string, unknown> | Uint8Array,
    {
      gas = DEFAULT_FUNCTION_CALL_GAS,
      attachedDeposit = NO_DEPOSIT,
    }: {gas?: BN | string; attachedDeposit?: BN | string} = {},
  ): this {
    this.actions.push(
      functionCall(methodName, args, new BN(gas.toString()), new BN(attachedDeposit.toString())),
    );
    return this;
  }

  stake(amount: BN | string, publicKey: PublicKey | string): this {
    this.actions.push(stake(new BN(amount), PublicKey.from(publicKey)));
    return this;
  }

  transfer(amount: string | BN): this {
    this._transferAmount = NEAR.from(amount);
    this.actions.push(transfer(new BN(amount.toString())));
    return this;
  }

  get accountCreated(): boolean {
    return this.accountToBeCreated;
  }

  get transferAmount(): NEAR {
    return this._transferAmount ?? NEAR.from('0');
  }

  abstract signAndSend(keyPair?: KeyPair): Promise<TransactionResult>;
}
