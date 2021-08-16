import {Buffer} from 'node:buffer';
import process from 'node:process';
import * as fs from 'node:fs/promises';
import {PathLike} from 'node:fs';
import {promisify} from 'node:util';
import {ChildProcess, spawn as _spawn} from 'node:child_process';
import {spawn as _asyncSpawn, Output} from 'promisify-child-process';
import rimraf from 'rimraf';
// @ts-expect-error no typings
import getBinary from 'near-sandbox/getBinary';
// @ts-expect-error no typings
import runPath from 'near-sandbox/install';
import fs_extra from 'fs-extra';

export const rm = promisify(rimraf);
export const sandboxBinary: () => string = () => getBinary().binaryPath; // eslint-disable-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call

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
  debug(`Sandbox Binary found: ${sandboxBinary()}`);
  return _asyncSpawn(sandboxBinary(), args, {encoding: 'utf8'});
}

async function install(): Promise<void> {
  try {
    await _asyncSpawn('node', [runPath]);
  } catch (error: unknown) {
    console.error(error);
    throw new Error('Failed to install binary');
  }
}

export {_spawn as spawn};

export function debug(s: string | Buffer | null | undefined, ...args: any[]): void {
  if (process.env.NEAR_RUNNER_DEBUG) {
    console.error(s, ...args);
  }
}

export const copyDir = promisify(fs_extra.copy);

export async function ensureBinary(): Promise<void> {
  const binPath = sandboxBinary();
  if (!await exists(binPath)) {
    await install();
  }
}
