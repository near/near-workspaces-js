"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findCallerFile = void 0;
const path_1 = require("path");
const utils_1 = require("../runtime/utils");
function findCallerFile() {
    const sites = utils_1.callsites();
    const files = sites.filter(s => s.getFileName()).map(s => s.getFileName());
    const thisDir = __dirname;
    const parentDir = path_1.dirname(__dirname);
    utils_1.debug(`looking through ${files.join(', ')}, thisDir: ${thisDir}, parentDir:${parentDir}`);
    const i = files.findIndex(file => !file.startsWith(parentDir));
    return files[i];
}
exports.findCallerFile = findCallerFile;
//# sourceMappingURL=utils.js.map