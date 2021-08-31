/// <reference types="node" />
import { PathLike } from 'fs';
import { spawn as _spawn } from 'child_process';
import { URL } from 'url';
import { ChildProcessPromise } from './types';
export declare const rm: (arg1: string) => Promise<void>;
export declare const sandboxBinary: () => string;
export declare function exists(d: PathLike): Promise<boolean>;
export declare function asyncSpawn(...args: string[]): ChildProcessPromise;
export { _spawn as spawn };
export declare function debug(...args: any[]): void;
export declare function txDebug(tx: string): void;
export declare const copyDir: (arg1: string, arg2: string) => Promise<void>;
export declare function ensureBinary(): Promise<void>;
export declare function isPathLike(something: any): something is URL | string;
