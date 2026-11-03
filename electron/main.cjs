// Desktop shell: the same static game of the web version in its own window. No Node in the page
// and nothing remote: the only thing this process does is serve the files of dist/.
const { app, BrowserWindow, Menu, net, protocol, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const SCHEME = 'noesis';
const ROOT = path.join(__dirname, '..', 'dist');

// a fixed secure origin keeps localStorage, and so every session, across updates
protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

function serve(req) {
  const file = path.join(ROOT, decodeURIComponent(new URL(req.url).pathname));
  const rel = path.relative(ROOT, file);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel))
    return new Response(null, { status: 400 });
  return net.fetch(pathToFileURL(file).toString());
}

function openWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    show: false,
    backgroundColor: '#070613',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
  });
  // a link to the web opens in the browser; the window itself never leaves the game
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(`${SCHEME}://`)) e.preventDefault();
  });
  win.loadURL(`${SCHEME}://game/index.html`);
  return win;
}

// two copies writing the same saves could lose progress: the second one focuses the first
if (!app.requestSingleInstanceLock()) app.quit();
else {
  let win = null;
  app.on('second-instance', () => {
    if (win?.isMinimized()) win.restore();
    win?.focus();
  });
  app.whenReady().then(() => {
    if (process.platform !== 'darwin') Menu.setApplicationMenu(null);
    protocol.handle(SCHEME, serve);
    win = openWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) win = openWindow();
    });
  });
  app.on('window-all-closed', () => app.quit());
}
