import * as fs from 'fs/promises';
import {dirname} from 'path';
import {CallSite} from 'callsites';
import {debug} from '../utils';
import {KeyPair, KeyPairEd25519} from '../types';

export function findCallerFile(): string {
  const sites: CallSite[] = callsites();
  const files: string[] = sites.filter(s => s.getFileName()).map(s => s.getFileName()!);
  const thisDir = __dirname;
  const parentDir = dirname(__dirname);
  debug(`looking through ${files.join(', ')}, thisDir: ${thisDir}, parentDir:${parentDir}`);
  const i = files.findIndex(file => !file.startsWith(parentDir));
  return files[i];
}

export function callsites(): CallSite[] {
  const _prepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const stack = new Error().stack!.slice(1); // eslint-disable-line unicorn/error-message
  Error.prepareStackTrace = _prepareStackTrace;
  return stack as unknown as CallSite[];
}

export interface KeyFilePrivate {
  private_key: string;
}

export interface KeyFileSecret {
  secret_key: string;
}

export type KeyFile = KeyFilePrivate | KeyFileSecret;

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
