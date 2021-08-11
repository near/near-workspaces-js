import * as fs from "fs/promises";
import { PathLike } from "fs";
import { promisify } from "util";
import {ChildProcess, spawn as _spawn} from "child_process";

import { spawn as _asyncSpawn, Output }  from "promisify-child-process";
import rimraf from "rimraf";
// @ts-ignore
import getBinary from "near-sandbox/getBinary";
import fs_extra from "fs-extra";
// @ts-ignore
import installSandbox from "near-sandbox/install";

export const rm = promisify(rimraf);

export const sandboxBinary: () => string = () => getBinary().binaryPath;

export async function exists(d: PathLike): Promise<boolean> {
  let file: fs.FileHandle | undefined;
  try { 
    file = await fs.open(d, 'r');
  } catch (e) {
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
  const runPath = require.resolve("near-sandbox/install");
  try {
    await _asyncSpawn("node", [runPath]);
  } catch(e){
    console.error(e);
    throw new Error("Failed to install binary");
  }
  return;
}

export {_spawn as spawn}

export function debug(s: string | Buffer | null | undefined, ...args: any[]): void {
  if (process.env["NEAR_RUNNER_DEBUG"]) {
    console.error(s, ...args);
  }
}

export const copyDir = promisify(fs_extra.copy);

export function toYocto(amount: string): string {
  return amount + "0".repeat(24);
}

export async function ensureBinary(): Promise<void> {
  const binPath = sandboxBinary();
  if (!await exists(binPath)) {
    await install();
  }
}
