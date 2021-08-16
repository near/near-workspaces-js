import {
  ChildProcessWithoutNullStreams,
  SpawnOptionsWithStdioTuple,
  StdioNull,
  StdioPipe,
} from 'node:child_process';
import {join} from 'node:path';
import process from 'node:process';
import * as http from 'node:http';
import {openSync} from 'node:fs';
import {Buffer} from 'node:buffer';
import tmpDir from 'temp-dir';
import * as portCheck from 'node-port-check';
import UUID from 'pure-uuid';
import {Config} from './runtime';
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

export function createDir(): string {
  return join(tmpDir, 'sandbox', (new UUID(4).toString()));
}

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
    const request = http.request(options, response => {
      if (response.statusCode === 200) {
        resolve(true);
      } else {
        debug(`Sandbox running but got non-200 response: ${JSON.stringify(response)}`);
        resolve(false);
      }
    });
    request.on('error', error => {
      debug(error.message);
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
  private subprocess!: ChildProcessWithoutNullStreams;
  private readyToDie = false;
  private readonly config: Config;

  private constructor(config: Config) {
    this.config = config;
  }

  static async nextPort(): Promise<number> {
    this.lastPort = await portCheck.nextAvailable(this.lastPort + 1, '0.0.0.0');
    return this.lastPort;
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
        console.error(error);
      }
    }

    debug('created ' + server.homeDir);
    return server;
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
    const options: SpawnOptionsWithStdioTuple<StdioNull, StdioNull, StdioNull | StdioPipe> = {
      stdio: ['ignore', 'ignore', 'ignore'],
    };
    if (process.env.NEAR_RUNNER_DEBUG) {
      const filePath = join(this.homeDir, 'sandboxServer.log');
      debug(`near-sandbox logs writing to file: ${filePath}`);
      options.stdio[2] = openSync(filePath, 'a');
      options.env = {RUST_BACKTRACE: 'full'};
    }

    this.subprocess = spawn(sandboxBinary(), args, options);
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
        `Failed to kill child process with PID: ${this.subprocess.pid ?? 'unknown'}`,
      );
    }

    if (this.config.rm) {
      await rm(this.homeDir);
    }
  }

  private async spawn(command: string): ChildProcessPromise {
    return asyncSpawn('--home', this.homeDir, command);
  }

  private get internalRpcAddr(): string {
    return `0.0.0.0:${this.port}`;
  }
}
