import {dirname} from 'path';
import {CallSite, callsites, debug} from '../runtime/utils';

export function findCallerFile(): string {
  const sites: CallSite[] = callsites();
  const files: string[] = sites.filter(s => s.getFileName()).map(s => s.getFileName()!);
  const thisDir = __dirname;
  const parentDir = dirname(__dirname);
  debug(`looking through ${files.join(', ')}, thisDir: ${thisDir}, parentDir:${parentDir}`);
  const i = files.findIndex(file => !file.startsWith(parentDir));
  return files[i];
}
