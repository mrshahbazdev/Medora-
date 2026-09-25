const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const crypto = require('crypto');
const { app, ipcMain, BrowserWindow } = require('electron');

// LAN host mode: this PC runs Medora as the server. Other laptops/PCs on the
// same WiFi open http://<this-ip>:47071 in any browser and use the same app —
// every read/write lands on THIS machine's store file.
const HOST_PORT = 47071;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.webp': 'image/webp'
};

function docPath() { return path.join(app.getPath('userData'), 'medora.json'); }
function histDir() { return path.join(app.getPath('userData'), 'history'); }

function atomicWrite(file, text) {
  const tmp = `${file}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  fs.writeFileSync(tmp, text, 'utf8');
  fs.renameSync(tmp, file);
}

function distDir() {
  const candidates = [
    path.join(app.getAppPath(), 'dist'),
    path.join(__dirname, '..', '..', 'dist'),
    path.join(process.resourcesPath || '', 'app.asar', 'dist')
  ];
  return candidates.find(d => { try { return fs.existsSync(path.join(d, 'index.html')); } catch { return false; } });
}

function lanUrls() {
  const urls = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.family === 'IPv4' && !a.internal) urls.push(`http://${a.address}:${HOST_PORT}`);
    }
  }
  return urls;
}

function registerHostIPC() {
  let lastApplyAt = 0;
  const pushToHostRenderer = doc => {
    const at = doc.updatedAt || 0;
    if (at <= lastApplyAt) return;
    lastApplyAt = at;
    const w = BrowserWindow.getAllWindows()[0];
    if (w) w.webContents.send('medora:sync-apply', doc);
  };

  const server = http.createServer((req, res) => {
    const url = (req.url || '/').split('?')[0];
    try {
      if (url === '/api/store') {
        if (req.method === 'GET') {
          try { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(fs.readFileSync(docPath(), 'utf8')); }
          catch { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('null'); }
          return;
        }
        if (req.method === 'POST') {
          let body = '';
          req.on('data', c => { body += c; if (body.length > 50 * 1024 * 1024) req.destroy(); });
          req.on('end', () => {
            try {
              const doc = JSON.parse(body);
              if (!doc || !Array.isArray(doc.patients)) { res.writeHead(400); res.end('bad doc'); return; }
              atomicWrite(docPath(), JSON.stringify(doc));
              pushToHostRenderer(doc);
              res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"ok":true}');
            } catch (e) { res.writeHead(500); res.end(String(e)); }
          });
          return;
        }
      }
      if (url === '/api/snapshot' && req.method === 'POST') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
          try {
            const { doc, label } = JSON.parse(body || '{}');
            fs.mkdirSync(histDir(), { recursive: true });
            const id = `${new Date().toISOString().replace(/[:.]/g, '-')}_${crypto.randomBytes(3).toString('hex')}`;
            atomicWrite(path.join(histDir(), `${id}.json`), JSON.stringify({ id, label: label || 'remote', at: new Date().toISOString(), doc }));
            res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"ok":true}');
          } catch (e) { res.writeHead(500); res.end(String(e)); }
        });
        return;
      }
      if (url === '/api/ping') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"ok":true,"app":"medora"}'); return; }

      // Static app files + SPA fallback so any route (?tv=1, ?kiosk=1) loads the UI.
      const dist = distDir();
      if (!dist) { res.writeHead(503); res.end('app bundle not found'); return; }
      let fp = path.join(dist, decodeURIComponent(url === '/' ? '/index.html' : url));
      if (!fp.startsWith(dist) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) fp = path.join(dist, 'index.html');
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(fp).pipe(res);
    } catch (e) { try { res.writeHead(500); res.end(String(e)); } catch {} }
  });
  server.on('error', () => {});
  try { server.listen(HOST_PORT, '0.0.0.0'); } catch { /* port busy */ }

  ipcMain.handle('host:info', () => ({ ok: true, port: HOST_PORT, urls: lanUrls() }));
}

module.exports = { registerHostIPC };
