import { CallSite } from 'callsites';
import { KeyPair } from '../types';
export declare function findCallerFile(): string;
export declare function callsites(): CallSite[];
export interface KeyFilePrivate {
    private_key: string;
}
export interface KeyFileSecret {
    secret_key: string;
}
export declare type KeyFile = KeyFilePrivate | KeyFileSecret;
export declare function getKeyFromFile(filePath: string, create?: boolean): Promise<KeyPair>;
