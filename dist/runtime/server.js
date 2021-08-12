"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SandboxServer = exports.createDir = void 0;
const path_1 = require("path");
const http = __importStar(require("http"));
const temp_dir_1 = __importDefault(require("temp-dir"));
const fs_1 = require("fs");
const utils_1 = require("./utils");
// @ts-ignore
const portCheck = __importStar(require("node-port-check"));
const pure_uuid_1 = __importDefault(require("pure-uuid"));
function createDir() {
    return path_1.join(temp_dir_1.default, "sandbox", (new pure_uuid_1.default(4).toString()));
}
exports.createDir = createDir;
const pollData = JSON.stringify({
    jsonrpc: "2.0",
    id: "dontcare",
    method: "block",
    params: { finality: "final" },
});
function pingServer(port) {
    const options = {
        hostname: `0.0.0.0`,
        port,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(pollData),
        },
    };
    return new Promise((resolve, _) => {
        const req = http.request(options, (res) => {
            if (res.statusCode == 200) {
                resolve(true);
            }
            else {
                utils_1.debug(`Sandbox running but got non-200 response: ${JSON.stringify(res)}`);
                resolve(false);
            }
        });
        req.on('error', (e) => {
            utils_1.debug(e.toString());
            resolve(false);
        });
        // Write data to request body
        req.write(pollData);
        utils_1.debug(`polling server at port ${options.port}`);
        req.end();
    });
}
async function sandboxStarted(port, timeout = 20000) {
    const checkUntil = Date.now() + timeout + 250;
    do {
        if (await pingServer(port))
            return;
        await new Promise(res => setTimeout(() => res(true), 250));
    } while (Date.now() < checkUntil);
    throw new Error(`Sandbox Server with port: ${port} failed to start after ${timeout}ms`);
}
function initalPort() {
    return Math.max(1024, Math.floor(Math.random() * 10000));
}
class SandboxServer {
    // TODO: split SandboxServer config & Runtime config
    constructor(config) {
        this.readyToDie = false;
        this.config = config;
    }
    get homeDir() {
        return this.config.homeDir;
    }
    get port() {
        return this.config.port;
    }
    get rpcAddr() {
        return `http://localhost:${this.port}`;
    }
    get internalRpcAddr() {
        return `0.0.0.0:${this.port}`;
    }
    static async init(config) {
        await utils_1.ensureBinary();
        const server = new SandboxServer(config);
        if (server.config.refDir) {
            await utils_1.rm(server.homeDir);
            await utils_1.copyDir(server.config.refDir, server.config.homeDir);
        }
        if ((await utils_1.exists(server.homeDir)) && server.config.init) {
            await utils_1.rm(server.homeDir);
        }
        if (server.config.init) {
            try {
                let { stderr, code } = await server.spawn("init");
                utils_1.debug(stderr);
                if (code && code < 0) {
                    throw new Error("Failed to spawn sandbox server");
                }
            }
            catch (e) {
                // TODO: should this throw?
                console.error(e);
            }
        }
        utils_1.debug("created " + server.homeDir);
        return server;
    }
    async spawn(command) {
        return utils_1.asyncSpawn("--home", this.homeDir, command);
    }
    async start() {
        const args = [
            "--home",
            this.homeDir,
            "run",
            "--rpc-addr",
            this.internalRpcAddr,
        ];
        utils_1.debug(`sending args, ${args.join(" ")}`);
        const options = {
            stdio: ['ignore', 'ignore', 'ignore']
        };
        if (process.env["NEAR_RUNNER_DEBUG"]) {
            const filePath = path_1.join(this.homeDir, 'sandboxServer.log');
            utils_1.debug(`near-sandbox logs writing to file: ${filePath}`);
            options.stdio[2] = fs_1.openSync(filePath, 'a');
            options.env = { RUST_BACKTRACE: 'full' };
        }
        this.subprocess = utils_1.spawn(utils_1.sandboxBinary(), args, options);
        this.subprocess.on("exit", () => {
            utils_1.debug(`Server with port ${this.port}: Died ${this.readyToDie ? "gracefully" : "horribly"}`);
        });
        await sandboxStarted(this.port);
        utils_1.debug(`Connected to server at ${this.internalRpcAddr}`);
        return this;
    }
    close() {
        this.readyToDie = true;
        if (!this.subprocess.kill("SIGINT")) {
            console.error(`Failed to kill child process with PID: ${this.subprocess.pid}`);
        }
        if (this.config.rm) {
            utils_1.rm(this.homeDir);
        }
    }
    static async nextPort() {
        this.lastPort = await portCheck.nextAvailable(this.lastPort + 1, "0.0.0.0");
        return this.lastPort;
    }
}
exports.SandboxServer = SandboxServer;
SandboxServer.lastPort = initalPort();
//# sourceMappingURL=server.js.map