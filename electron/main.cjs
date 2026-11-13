const { app, BrowserWindow, dialog, ipcMain, protocol } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { Readable } = require('node:stream');

protocol.registerSchemesAsPrivileged([{ scheme: 'afterframe', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);

const mediaTokens = new Map();
const videoMime = new Map([
  ['.mp4', 'video/mp4'], ['.m4v', 'video/mp4'], ['.webm', 'video/webm'], ['.ogv', 'video/ogg'], ['.ogg', 'video/ogg'],
  ['.mov', 'video/quicktime'], ['.mkv', 'video/x-matroska'], ['.avi', 'video/x-msvideo'], ['.mpg', 'video/mpeg'],
  ['.mpeg', 'video/mpeg'], ['.3gp', 'video/3gpp'], ['.ts', 'video/mp2t'],
]);
const libraryPath = () => path.join(app.getPath('userData'), 'local-video-library.json');

function readLibrary() {
  try { return JSON.parse(fs.readFileSync(libraryPath(), 'utf8')); } catch { return []; }
}
function writeLibrary(rows) {
  fs.mkdirSync(path.dirname(libraryPath()), { recursive: true });
  fs.writeFileSync(libraryPath(), JSON.stringify(rows.slice(0, 200)), 'utf8');
}
function authorizePath(filePath) {
  const id = randomUUID();
  mediaTokens.set(id, filePath);
  return `afterframe://media/${id}`;
}
function publicVideo(filePath) {
  const stat = fs.statSync(filePath);
  return { path: filePath, name: path.basename(filePath), size: stat.size, lastModified: stat.mtimeMs, src: authorizePath(filePath) };
}

async function createWindow() {
  const window = new BrowserWindow({
    width: 1480,
    height: 900,
    minWidth: 760,
    minHeight: 480,
    backgroundColor: '#070808',
    title: 'AFTERFRAME Player',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  const devUrl = process.env.AFTERFRAME_DEV_URL;
  if (devUrl) await window.loadURL(devUrl);
  else await window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(async () => {
  protocol.handle('afterframe', async (request) => {
    const id = new URL(request.url).pathname.slice(1);
    const filePath = mediaTokens.get(id);
    if (!filePath) return new Response('Not found', { status: 404 });
    let stat;
    try { stat = await fs.promises.stat(filePath); } catch { return new Response('Not found', { status: 404 }); }
    const range = request.headers.get('range');
    let start = 0;
    let end = stat.size - 1;
    let status = 200;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${stat.size}` } });
      if (match[1]) start = Number(match[1]);
      if (match[2]) end = Math.min(Number(match[2]), stat.size - 1);
      if (!match[1] && match[2]) start = Math.max(0, stat.size - Number(match[2]));
      if (start > end || start >= stat.size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${stat.size}` } });
      status = 206;
    }
    const headers = new Headers({
      'Accept-Ranges': 'bytes',
      'Content-Length': String(end - start + 1),
      'Content-Type': videoMime.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    if (status === 206) headers.set('Content-Range', `bytes ${start}-${end}/${stat.size}`);
    if (request.method === 'HEAD') return new Response(null, { status, headers });
    const stream = fs.createReadStream(filePath, { start, end });
    return new Response(Readable.toWeb(stream), { status, headers });
  });

  ipcMain.handle('afterframe:open-videos', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Open video',
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Video files', extensions: ['mp4', 'm4v', 'webm', 'ogv', 'ogg', 'mov', 'mkv', 'avi', 'mpg', 'mpeg', '3gp', 'ts'] }],
    });
    if (result.canceled) return [];
    const saved = new Map(readLibrary().map((item) => [item.path, item]));
    const output = result.filePaths.map((filePath) => {
      const stat = fs.statSync(filePath);
      saved.set(filePath, { path: filePath, name: path.basename(filePath), size: stat.size, lastModified: stat.mtimeMs, lastOpened: Date.now() });
      return publicVideo(filePath);
    });
    writeLibrary([...saved.values()].sort((a, b) => b.lastOpened - a.lastOpened));
    return output;
  });
  ipcMain.handle('afterframe:get-library', () => readLibrary());
  ipcMain.handle('afterframe:restore-video', async (_event, requestedPath) => {
    if (typeof requestedPath !== 'string' || !readLibrary().some((item) => item.path === requestedPath)) throw new Error('This path is not in the local AFTERFRAME library.');
    const filePath = path.resolve(requestedPath);
    const stat = await fs.promises.stat(filePath);
    if (!stat.isFile()) throw new Error('The selected library item is not a file.');
    const rows = readLibrary().map((item) => item.path === requestedPath ? { ...item, lastOpened: Date.now() } : item);
    writeLibrary(rows);
    return publicVideo(filePath);
  });
  ipcMain.handle('afterframe:forget-video', (_event, requestedPath) => {
    if (typeof requestedPath !== 'string') return;
    writeLibrary(readLibrary().filter((item) => item.path !== requestedPath));
  });

  await createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
