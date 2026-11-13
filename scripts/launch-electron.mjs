import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const electron = spawn(process.execPath, [path.join(root, 'node_modules/electron/cli.js'), '.'], { cwd: root, stdio: 'inherit', windowsHide: false, env });
electron.on('exit', (code) => { process.exitCode = code || 0; });
