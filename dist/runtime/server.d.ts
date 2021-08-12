import { Config } from './runtime';
export declare function getHomeDir(p?: number): string;
export declare class SandboxServer {
    private subprocess;
    private static lastPort;
    private readyToDie;
    private config;
    static nextPort(): number;
    private constructor();
    get homeDir(): string;
    get port(): number;
    get rpcAddr(): string;
    private get internalRpcAddr();
    static init(config: Config): Promise<SandboxServer>;
    private spawn;
    start(): Promise<SandboxServer>;
    close(): void;
}
