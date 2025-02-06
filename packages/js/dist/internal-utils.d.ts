/// <reference types="node" />
import { type PathLike } from 'fs';
import { URL } from 'url';
import { type Binary } from 'near-sandbox';
import { type ChildProcessPromise } from './types';
export declare const rm: (arg1: string) => Promise<void>;
export declare const sandboxBinary: () => Promise<Binary>;
export declare function exists(d: PathLike): Promise<boolean>;
export declare function asyncSpawn(bin: string, ...args: string[]): ChildProcessPromise;
export { spawn } from 'child_process';
export declare function debug(...args: unknown[]): void;
export declare function txDebug(tx: string): void;
export declare const copyDirection: (arg1: string, arg2: string) => Promise<void>;
export declare function ensureBinary(): Promise<string>;
export declare function isPathLike(something: any): something is URL | string;
/**
 * Attempts to construct an absolute path to a file given a path relative to a
 * package.json. Searches through `module.paths` (Node's resolution search
 * paths) as described in https://stackoverflow.com/a/18721515/249801, then
 * falls back to using process.cwd() if still not found. Throws an acceptable
 * user-facing error if no file found.
 */
export declare function findFile(relativePath: string): Promise<string>;
//# sourceMappingURL=internal-utils.d.ts.map