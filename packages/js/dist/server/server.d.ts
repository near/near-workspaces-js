import { Config } from '../types';
export declare class SandboxServer {
    private static lastPort;
    private static binPath;
    private subprocess;
    private readyToDie;
    private readonly config;
    private constructor();
    static nextPort(): Promise<number>;
    static lockfilePath(filename: string): string;
    static randomHomeDir(): string;
    static init(config: Config): Promise<SandboxServer>;
    get homeDir(): string;
    get port(): number;
    get rpcAddr(): string;
    start(): Promise<SandboxServer>;
    close(): Promise<void>;
    private spawn;
}
//# sourceMappingURL=server.d.ts.map