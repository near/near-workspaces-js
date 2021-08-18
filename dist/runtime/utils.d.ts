/// <reference types="node" />
import { PathLike } from 'fs';
import { ChildProcess, spawn as _spawn } from 'child_process';
import { URL } from 'url';
import { Output } from 'promisify-child-process';
export declare const rm: (arg1: string) => Promise<void>;
export declare const sandboxBinary: () => string;
export declare function exists(d: PathLike): Promise<boolean>;
export declare type ChildProcessPromise = Promise<ChildProcess & Promise<Output>>;
export declare function asyncSpawn(...args: string[]): ChildProcessPromise;
export { _spawn as spawn };
export declare function debug(...args: any[]): void;
export declare const copyDir: (arg1: string, arg2: string) => Promise<void>;
export declare function ensureBinary(): Promise<void>;
export declare function isError(something: any): something is Error;
export declare function isPathLike(something: any): something is URL | string;
