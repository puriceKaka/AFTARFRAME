import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const npmExec = process.execPath;
let vite;
let ownsVite = false;
let electron;
let ready = false;
for (let attempt = 0; attempt < 100; attempt += 1) {
  try { const response = await fetch('http://127.0.0.1:5173/'); if (response.ok) { ready = true; break; } } catch { /* Start Vite below when no local dev server is available. */ }
  if (!vite) { vite = spawn(npmExec, [path.join(root, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--strictPort'], { cwd: root, stdio: 'inherit', windowsHide: true }); ownsVite = true; }
  if (vite.exitCode !== null) throw new Error('Vite exited before the desktop window started.');
  await delay(300);
}
if (!ready) { if (ownsVite) vite.kill(); throw new Error('Timed out waiting for the local Vite server.'); }
const electronEnv = { ...process.env, AFTERFRAME_DEV_URL: 'http://127.0.0.1:5173' };
delete electronEnv.ELECTRON_RUN_AS_NODE;
electron = spawn(npmExec, [path.join(root, 'node_modules/electron/cli.js'), '.'], { cwd: root, stdio: 'inherit', windowsHide: false, env: electronEnv });
const stop = () => { if (electron && electron.exitCode === null) electron.kill(); if (ownsVite && vite?.exitCode === null) vite.kill(); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
electron.on('exit', (code) => { if (ownsVite && vite?.exitCode === null) vite.kill(); process.exitCode = code || 0; });
