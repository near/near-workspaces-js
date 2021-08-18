import {ChildProcess} from 'child_process';
import {Buffer} from 'buffer';
import process from 'process';
import {open} from 'fs/promises';
import {join} from 'path';
import * as http from 'http';
import tmpDir from 'temp-dir';
import * as portCheck from 'node-port-check';
import UUID from 'pure-uuid';
import {Config} from './runtime'; // eslint-disable-line import/no-cycle
import {
  debug,
  asyncSpawn,
  ChildProcessPromise,
  exists,
  rm,
  spawn,
  copyDir,
  sandboxBinary,
  ensureBinary,
} from './utils';

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
    request.on('error', error => {
      debug(JSON.stringify(error));
      resolve(false);
    });

    // Write data to request body
    request.write(pollData);
    debug(`polling server at port ${options.port}`);
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
    await ensureBinary();
    const server = new SandboxServer(config);
    if (server.config.refDir) {
      await rm(server.homeDir);
      await copyDir(server.config.refDir, server.config.homeDir);
    }

    if ((await exists(server.homeDir)) && server.config.init) {
      await rm(server.homeDir);
    }

    if (server.config.init) {
      try {
        const {stderr, code} = await server.spawn('init');
        debug(stderr);
        if (code && code < 0) {
          throw new Error('Failed to spawn sandbox server');
        }
      } catch (error: unknown) {
        debug(JSON.stringify(error));
        throw error;
      }
    }

    debug('created ' + server.homeDir);
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
    debug(`sending args, ${args.join(' ')}`);
    if (process.env.NEAR_RUNNER_DEBUG) {
      const filePath = join(this.homeDir, 'sandboxServer.log');
      debug(`near-sandbox logs writing to file: ${filePath}`);
      this.subprocess = spawn(sandboxBinary(), args, {
        env: {RUST_BACKTRACE: 'full'},
        // @ts-expect-error FileHandle not assignable to Stream | IOType
        stdio: ['ignore', 'ignore', await open(filePath, 'a')],
      });
    } else {
      this.subprocess = spawn(sandboxBinary(), args, {
        stdio: ['ignore', 'ignore', 'ignore'],
      });
    }

    this.subprocess.on('exit', () => {
      debug(
        `Server with port ${this.port}: Died ${this.readyToDie ? 'gracefully' : 'horribly'
        }`,
      );
    });
    await sandboxStarted(this.port);
    debug(`Connected to server at ${this.internalRpcAddr}`);
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
    return asyncSpawn('--home', this.homeDir, command);
  }
}
