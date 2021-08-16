import {promises as fs} from 'node:fs';
import {join, dirname} from 'node:path';
import * as os from 'node:os';
import BN from 'bn.js';
import * as nearAPI from 'near-api-js';
import {toYocto} from '../utils';
import {KeyPair} from '../types';
import {Account} from './account';
import {SandboxServer, createDir} from './server';
import {debug} from './utils';

interface RuntimeArg {
  runtime: Runtime;
}

export type ReturnedAccounts = Record<string, Account>;

export interface AccountArgs extends ReturnedAccounts {
  root: Account;
}

export type CreateRunnerFn = (args: RuntimeArg) => Promise<ReturnedAccounts>;
export type RunnerFn = (args: AccountArgs, runtime: Runtime) => Promise<void>;
type AccountShortName = string;
type AccountId = string;
type UserPropName = string;
type SerializedReturnedAccounts = Map<UserPropName, AccountShortName>;

const DEFAULT_INITIAL_DEPOSIT: string = toYocto('10');

function randomAccountId(): string {
  // Create random number with at least 7 digits
  const randomNumber = Math.floor((Math.random() * (9_999_999 - 1_000_000)) + 1_000_000);
  return `dev-${Date.now()}-${randomNumber}`;
}

async function getKeyFromFile(filePath: string, create = true): Promise<KeyPair> {
  try {
    const keyFile = require(filePath);
    return nearAPI.utils.KeyPair.fromString(
      keyFile.secret_key || keyFile.private_key,
    );
  } catch (error: unknown) {
    if (!create) {
      throw error;
    }

    debug('about to write to ', filePath);
    const keyPair = nearAPI.utils.KeyPairEd25519.fromRandom();
    await fs.writeFile(filePath, JSON.stringify({
      secret_key: keyPair.toString(),
    }));
    debug('wrote to file ', filePath);
    return keyPair;
  }
}

export interface Config {
  homeDir: string;
  port: number;
  init: boolean;
  rm: boolean;
  refDir: string | null;
  network: 'sandbox' | 'testnet';
  masterAccount?: string;
  rpcAddr: string;
  helperUrl?: string;
  explorerUrl?: string;
  initialBalance?: string;
  walletUrl?: string;
  initFn?: CreateRunnerFn;
}

export abstract class Runtime {
  config: Config; // Should be protected?
  resultArgs?: SerializedReturnedAccounts;

  protected root!: Account;
  protected near!: nearAPI.Near;
  protected masterKey!: KeyPair;
  protected keyStore!: nearAPI.keyStores.KeyStore;
  protected accountsCreated: Map<AccountId, AccountShortName> = new Map();

  constructor(config: Config, resultArgs?: SerializedReturnedAccounts) {
    this.config = config;
    this.resultArgs = resultArgs;
  }

  static async create(config: Partial<Config>, f?: CreateRunnerFn): Promise<Runtime> {
    switch (config.network) {
      case 'testnet': {
        if (f) {
          debug('Skipping initialization function for testnet; will run before each `runner.run`');
        }

        return TestnetRuntime.createRuntime(config);
      }

      case 'sandbox': {
        const runtime = await SandboxRuntime.createRuntime(config);
        if (f) {
          debug('Running initialization function to set up sandbox for all future calls to `runner.run`');
          const args = await runtime.createRun(f);
          runtime.serializeAccountArgs(args);
          return runtime;
        }

        return runtime;
      }

      default:
        throw new Error(
          `config.network = '${config.network!}' invalid; `
          + 'must be \'testnet\' or \'sandbox\' (the default)',
        );
    }
  }

  serializeAccountArgs(args: ReturnedAccounts): void {
    this.resultArgs = new Map(
      Object.entries(args).map(([argName, account]) => [
        argName, this.accountsCreated.get(account.accountId)!,
      ]),
    );
  }

  deserializeAccountArgs(args?: SerializedReturnedAccounts): AccountArgs {
    const returnValue = {root: this.getRoot()};

    if (!args && this.resultArgs === undefined) {
      return returnValue;
    }

    const encodedArgs = args ?? this.resultArgs;
    return {
      ...returnValue,
      ...Object.fromEntries(
        [...encodedArgs!.entries()].map(
          ([argName, accountShortName]) => [
            argName,
            this.getAccount(accountShortName),
          ],
        ),
      ),
    };
  }

  async getMasterKey(): Promise<KeyPair> {
    debug('reading key from file', this.keyFilePath);
    return getKeyFromFile(this.keyFilePath);
  }

  async connect(): Promise<void> {
    this.near = await nearAPI.connect({
      deps: {
        keyStore: this.keyStore,
      },
      keyPath: this.keyFilePath,
      networkId: this.config.network,
      nodeUrl: this.rpcAddr,
      walletUrl: this.config.walletUrl,
      masterAccount: this.config.masterAccount,
      initialBalance: this.config.initialBalance,
    });
    this.root = new Account(new nearAPI.Account(
      this.near.connection,
      this.masterAccount,
    ));
  }

  async run(fn: RunnerFn, args?: SerializedReturnedAccounts): Promise<void> {
    debug('About to runtime.run with config', this.config);
    try {
      this.keyStore = await this.getKeyStore();
      debug('About to call beforeConnect');
      await this.beforeConnect();
      debug('About to call connect');
      await this.connect();
      debug('About to call afterConnect');
      await this.afterConnect();
      if (args) {
        debug(`Passing ${Object.getOwnPropertyNames(args).join(', ')}`);
      }

      await fn(
        this.deserializeAccountArgs(args),
        this,
      );
    } catch (error: unknown) {
      console.error(error);
      throw error; // Figure out better error handling
    } finally {
      // Do any needed teardown
      await this.afterRun();
    }
  }

  async createRun(fn: CreateRunnerFn): Promise<ReturnedAccounts> {
    debug('About to runtime.createRun with config', this.config);
    try {
      this.keyStore = await this.getKeyStore();
      debug('About to call beforeConnect');
      await this.beforeConnect();
      debug('About to call connect');
      await this.connect();
      debug('About to call afterConnect');
      await this.afterConnect();
      return await fn({runtime: this});
    } catch (error: unknown) {
      console.error(error);
      throw error; // Figure out better error handling
    } finally {
      // Do any needed teardown
      await this.afterRun();
    }
  }

  get homeDir(): string {
    return this.config.homeDir;
  }

  get init(): boolean {
    return this.config.init;
  }

  get rpcAddr(): string {
    return this.config.rpcAddr;
  }

  get network(): string {
    return this.config.network;
  }

  get masterAccount(): string {
    return this.config.masterAccount!;
  }

  async createAccount(name: string, keyPair?: nearAPI.utils.key_pair.KeyPair): Promise<Account> {
    const accountId = this.makeSubAccount(name);
    const pubKey = await this.addKey(accountId, keyPair);
    await this.root.najAccount.createAccount(
      accountId,
      pubKey,
      new BN(this.config.initialBalance!),
    );
    const account = this.getAccount(name);
    this.accountsCreated.set(accountId, name);
    return account;
  }

  async createAndDeploy(
    name: string,
    wasm: string,
  ): Promise<Account> {
    const account = await this.createAccount(name);
    const contractData = await fs.readFile(wasm);
    const result = await account.najAccount.deployContract(contractData);
    debug(`deployed contract ${wasm} to account ${name} with result ${JSON.stringify(result)} `);
    this.accountsCreated.set(account.accountId, name);
    return account;
  }

  getRoot(): Account {
    return this.root;
  }

  getAccount(name: string, addSubaccountPrefix = true): Account {
    const accountId = addSubaccountPrefix ? this.makeSubAccount(name) : name;
    return new Account(this.near.account(accountId));
  }

  isSandbox(): boolean {
    return this.config.network === 'sandbox';
  }

  isTestnet(): boolean {
    return this.config.network === 'testnet';
  }

  protected async addKey(name: string, keyPair?: KeyPair): Promise<nearAPI.utils.PublicKey> {
    let pubKey: nearAPI.utils.key_pair.PublicKey;
    if (keyPair) {
      const key = await nearAPI.InMemorySigner.fromKeyPair(this.network, name, keyPair);
      pubKey = await key.getPublicKey();
    } else {
      pubKey = await this.near.connection.signer.createKey(
        name,
        this.config.network,
      );
    }

    return pubKey;
  }

  protected async addMasterAccountKey(): Promise<void> {
    const mainKey = await this.getMasterKey();
    await this.keyStore.setKey(
      this.config.network,
      this.masterAccount,
      mainKey,
    );
  }

  private makeSubAccount(name: string): string {
    return `${name}.${this.masterAccount}`;
  }

  abstract get keyFilePath(): string;
  abstract afterRun(): Promise<void>;
  abstract getKeyStore(): Promise<nearAPI.keyStores.KeyStore>;
  abstract beforeConnect(): Promise<void>;
  abstract afterConnect(): Promise<void>;
}

export class TestnetRuntime extends Runtime {
  private accountArgs?: ReturnedAccounts;

  static createRuntime(config: Partial<Config>, resultArgs?: SerializedReturnedAccounts): TestnetRuntime {
    return new TestnetRuntime({...this.defaultConfig, ...config}, resultArgs);
  }

  static get defaultConfig(): Config {
    return {
      homeDir: 'ignored',
      port: 3030,
      init: true,
      rm: false,
      refDir: null,
      network: 'testnet',
      rpcAddr: 'https://rpc.testnet.near.org',
      walletUrl: 'https://wallet.testnet.near.org',
      helperUrl: 'https://helper.testnet.near.org',
      explorerUrl: 'https://explorer.testnet.near.org',
      initialBalance: DEFAULT_INITIAL_DEPOSIT,
    };
  }

  get keyFilePath(): string {
    return join(os.homedir(), '.near-credentials', 'testnet', `${this.masterAccount}.json`);
  }

  async getKeyStore(): Promise<nearAPI.keyStores.KeyStore> {
    const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(
      join(os.homedir(), '.near-credentials'),
    );
    return keyStore;
  }

  serializeAccountArgs(args: ReturnedAccounts): void {
    this.accountArgs = args;
  }

  deserializeAccountArgs(_args?: SerializedReturnedAccounts): AccountArgs {
    return {root: this.getRoot(), ...this.accountArgs};
  }

  async beforeConnect(): Promise<void> {
    await this.ensureKeyFileFolder();
    const accountCreator = new nearAPI.accountCreator.UrlAccountCreator(
      ({} as any), // ignored
      this.config.helperUrl!,
    );
    if (this.config.masterAccount) {
      throw new Error('custom masterAccount not yet supported on testnet ' + this.config.masterAccount);
      // Create sub-accounts of it with random IDs
      // this.config.masterAccount = `${randomAccountId()}.something`;
    } else {
      // Create new `dev-deploy`-style account (or reuse existing)
      this.config.masterAccount = randomAccountId();
    }

    await this.addMasterAccountKey();
    await accountCreator.createAccount(
      this.masterAccount,
      (await this.getMasterKey()).getPublicKey(),
    );
    debug(`Added masterAccount ${this.config.masterAccount
    } with keyStore ${JSON.stringify(this.keyStore)
    } and publicKey ${(await this.keyStore.getKey(
      this.config.network,
      this.masterAccount,
    )).getPublicKey().toString()
    }
      https://explorer.testnet.near.org/accounts/${this.masterAccount}`);
  }

  async afterConnect(): Promise<void> {
    if (this.config.initFn) {
      debug('About to run initFn');
      this.serializeAccountArgs(await this.config.initFn({runtime: this}));
    }
  }

  // Delete any accounts created
  async afterRun(): Promise<void> {} // eslint-disable-line @typescript-eslint/no-empty-function

  // TODO: create temp account and track to be deleted
  async createAccount(name: string, keyPair?: KeyPair): Promise<Account> {
    // TODO: subaccount done twice
    const account = await super.createAccount(name, keyPair);
    debug(`New Account: https://explorer.testnet.near.org/accounts/${account.accountId
    }`);
    return account;
  }

  async createAndDeploy(
    name: string,
    wasm: string,
  ): Promise<Account> {
    // TODO: dev deploy!!
    const account = await super.createAndDeploy(name, wasm);
    debug(`Deployed new account: ${this.config.explorerUrl!}/accounts/${account.accountId}`);
    return account;
  }

  private async ensureKeyFileFolder(): Promise<void> {
    const keyFolder = dirname(this.keyFilePath);
    try {
      await fs.mkdir(keyFolder, {recursive: true});
    } catch {
      // TODO: check error
    }
  }
}

class SandboxRuntime extends Runtime {
  private server!: SandboxServer;

  static async defaultConfig(): Promise<Config> {
    const port = await SandboxServer.nextPort();
    return {
      homeDir: createDir(),
      port,
      init: true,
      rm: false,
      refDir: null,
      network: 'sandbox',
      masterAccount: 'test.near',
      rpcAddr: `http://localhost:${port}`,
      initialBalance: toYocto('100'),
    };
  }

  static async createRuntime(config: Partial<Config>, resultArgs?: SerializedReturnedAccounts) {
    const defaultConfig = await this.defaultConfig();
    return new SandboxRuntime({...defaultConfig, ...config}, resultArgs);
  }

  get keyFilePath(): string {
    return join(this.homeDir, 'validator_key.json');
  }

  async getKeyStore(): Promise<nearAPI.keyStores.KeyStore> {
    const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(
      this.homeDir,
    );
    return keyStore;
  }

  get rpcAddr(): string {
    return `http://localhost:${this.config.port}`;
  }

  async beforeConnect(): Promise<void> {
    this.server = await SandboxServer.init(this.config);
    if (this.init) {
      await this.addMasterAccountKey();
    }

    await this.server.start();
  }

  async afterConnect(): Promise<void> {} // eslint-disable-line @typescript-eslint/no-empty-function

  async afterRun(): Promise<void> {
    debug(`Closing server with port ${this.config.port}`);
    await this.server.close();
  }
}
