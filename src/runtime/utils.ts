import process from 'process';
import * as fs from 'fs/promises';
import {PathLike} from 'fs';
import {promisify} from 'util';
import {ChildProcess, spawn as _spawn} from 'child_process';
import {URL} from 'url';
import {spawn as _asyncSpawn, Output} from 'promisify-child-process';
import rimraf from 'rimraf';
// @ts-expect-error no typings
import getBinary from 'near-sandbox/getBinary';
import fs_extra from 'fs-extra';
import {CallSite} from 'callsites';
import {KeyPair, KeyPairEd25519} from '../types';
import {KeyFile} from './types';

export const rm = promisify(rimraf);
export const sandboxBinary: () => string = () => getBinary().binaryPath; // eslint-disable-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return

export async function exists(d: PathLike): Promise<boolean> {
  let file: fs.FileHandle | undefined;
  try {
    file = await fs.open(d, 'r');
  } catch {
    return false;
  } finally {
    await file?.close();
  }

  return true;
}

export type ChildProcessPromise = Promise<ChildProcess & Promise<Output>>;

export async function asyncSpawn(...args: string[]): ChildProcessPromise {
  debug(`spawning \`${sandboxBinary()} ${args.join(' ')}\``);
  return _asyncSpawn(sandboxBinary(), args, {encoding: 'utf8'});
}

async function install(): Promise<void> {
  const runPath = require.resolve('near-sandbox/install');
  try {
    debug(`spawning \`node ${runPath}\``);
    await _asyncSpawn('node', [runPath]);
  } catch (error: unknown) {
    console.error(error);
    throw new Error('Failed to install binary');
  }
}

export {_spawn as spawn};

export function debug(...args: any[]): void {
  if (process.env.NEAR_RUNNER_DEBUG) {
    console.error(...args);
  }
}

export const copyDir = promisify(fs_extra.copy);

export async function ensureBinary(): Promise<void> {
  const binPath = sandboxBinary();
  if (!await exists(binPath)) {
    debug(`binPath=${binPath} doesn't yet exist; installing`);
    await install();
  }
}

export function isPathLike(something: any): something is URL | string {
  return typeof something === 'string' || something instanceof URL;
}

export {CallSite};

export function callsites(): CallSite[] {
  const _prepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const stack = new Error().stack!.slice(1); // eslint-disable-line unicorn/error-message
  Error.prepareStackTrace = _prepareStackTrace;
  return stack as unknown as CallSite[];
}

export async function getKeyFromFile(filePath: string, create = true): Promise<KeyPair> {
  try {
    const keyFile = require(filePath) as KeyFile; // eslint-disable-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    return KeyPair.fromString(
      // @ts-expect-error `x` does not exist on KeyFile
      keyFile.secret_key ?? keyFile.private_key,
    );
  } catch (error: unknown) {
    if (!create) {
      throw error;
    }

    debug('about to write to ', filePath);
    const keyPair = KeyPairEd25519.fromRandom();
    await fs.writeFile(filePath, JSON.stringify({
      secret_key: keyPair.toString(),
    }));
    debug('wrote to file ', filePath);
    return keyPair;
  }
}
