import {ChildProcess} from 'child_process';
import {Buffer} from 'buffer';
import process from 'process';
import {open} from 'fs/promises';
import {join} from 'path';
import * as http from 'http';
import tmpDir from 'temp-dir';
import * as portCheck from 'node-port-check';
import UUID from 'pure-uuid';
import {Config} from '../interfaces';
import {
  debug,
  asyncSpawn,
  exists,
  rm,
  spawn,
  copyDir,
  ensureBinary,
} from '../internal-utils';
import {ChildProcessPromise} from '../types';

const pollData = JSON.stringify({
  jsonrpc: '2.0',
  id: 'dontcare',
  method: 'block',
  params: {finality: 'final'},
});

async function pingServer(port: number): Promise<boolean> {
  const options = {
    hostname: '0.0.0.0',
    port,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(pollData),
    },
  };
  return new Promise(resolve => {
    const request = http.request(options, result => {
      if (result.statusCode === 200) {
        resolve(true);
      } else {
        debug(`Sandbox running but got non-200 response: ${JSON.stringify(result)}`);
        resolve(false);
      }
    });
    request.on('error', _ => {
      resolve(false);
    });

    // Write data to request body
    request.write(pollData);
    request.end();
  });
}

async function sandboxStarted(port: number, timeout = 20_000): Promise<void> {
  const checkUntil = Date.now() + timeout + 250;
  do {
    if (await pingServer(port)) { // eslint-disable-line no-await-in-loop
      return;
    }

    await new Promise(resolve => { // eslint-disable-line no-await-in-loop
      setTimeout(() => resolve(true), 250); // eslint-disable-line @typescript-eslint/no-confusing-void-expression
    });
  } while (Date.now() < checkUntil);

  throw new Error(`Sandbox Server with port: ${port} failed to start after ${timeout}ms`);
}

function initialPort(): number {
  return Math.max(1024, Math.floor(Math.random() * 10_000));
}

export class SandboxServer {
  private static lastPort: number = initialPort();
  private static binPath: string;

  private subprocess!: ChildProcess;
  private readyToDie = false;
  private readonly config: Config;

  private constructor(config: Config) {
    this.config = config;
  }

  static async nextPort(): Promise<number> {
    this.lastPort = await portCheck.nextAvailable(this.lastPort + 1, '0.0.0.0');
    return this.lastPort;
  }

  static randomHomeDir(): string {
    return join(tmpDir, 'sandbox', (new UUID(4).toString()));
  }

  static async init(config: Config): Promise<SandboxServer> {
    this.binPath = await ensureBinary();
    const server = new SandboxServer(config);
    if (server.config.refDir) {
      await rm(server.homeDir);
      await copyDir(server.config.refDir, server.config.homeDir);
    }

    if ((await exists(server.homeDir)) && server.config.init) {
      await rm(server.homeDir);
    }

    if (server.config.init) {
      const {stderr, code} = await server.spawn('init');
      if (code && code < 0) {
        debug(stderr);
        throw new Error('Failed to spawn sandbox server');
      }
    }

    return server;
  }

  get homeDir(): string {
    return this.config.homeDir;
  }

  get port(): number {
    return this.config.port;
  }

  get rpcAddr(): string {
    return `http://localhost:${this.port}`;
  }

  async start(): Promise<SandboxServer> {
    const args = [
      '--home',
      this.homeDir,
      'run',
      '--rpc-addr',
      this.internalRpcAddr,
    ];
    if (process.env.NEAR_RUNNER_DEBUG) {
      const filePath = join(this.homeDir, 'sandboxServer.log');
      debug(`near-sandbox logs writing to file: ${filePath}`);
      const fd = await open(filePath, 'a');
      this.subprocess = spawn(SandboxServer.binPath, args, {
        env: {RUST_BACKTRACE: 'full'},
        // @ts-expect-error FileHandle not assignable to Stream | IOType
        stdio: ['ignore', 'ignore', fd],
      });
      this.subprocess.on('exit', async () => {
        await fd.close();
      });
    } else {
      this.subprocess = spawn(SandboxServer.binPath, args, {
        stdio: ['ignore', 'ignore', 'ignore'],
      });
    }

    this.subprocess.on('exit', () => {
      if (!this.readyToDie) {
        debug(`Server with port ${this.port}: died horribly`);
      }
    });
    await sandboxStarted(this.port);
    return this;
  }

  async close(): Promise<void> {
    this.readyToDie = true;
    if (!this.subprocess.kill('SIGINT')) {
      console.error(
        `Failed to kill child process with PID: ${this.subprocess.pid ?? 'undefined'}`,
      );
    }

    if (this.config.rm) {
      await rm(this.homeDir);
    }
  }

  private get internalRpcAddr(): string {
    return `0.0.0.0:${this.port}`;
  }

  private async spawn(command: string): ChildProcessPromise {
    return asyncSpawn(SandboxServer.binPath, '--home', this.homeDir, command);
  }
}
