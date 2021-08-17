import process from 'process';
import * as fs from 'fs/promises';
import {PathLike} from 'fs';
import {promisify} from 'util';
import {ChildProcess, spawn as _spawn} from 'child_process';
import {URL} from 'url'; // eslint-disable-line node/prefer-global/url
import {spawn as _asyncSpawn, Output} from 'promisify-child-process';
import rimraf from 'rimraf';
// @ts-expect-error no typings
import getBinary from 'near-sandbox/getBinary';
import fs_extra from 'fs-extra';

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
  const runPath = require.resolve('near-sandbox/install'); // eslint-disable-line unicorn/prefer-module
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
