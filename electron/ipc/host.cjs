const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const crypto = require('crypto');
const { app, ipcMain, BrowserWindow } = require('electron');
const { lanCode } = require('./lan-code.cjs');
const { readDoc, writeDoc, writeJsonEnc, hashPins, verifyPinStr, atomicWrite } = require('./doc-io.cjs');

// LAN host mode (OPT-IN): when enabled in Settings, this PC serves Medora to
// other devices on the same WiFi. Every /api call requires the access code
// shown on this PC — without it the patient database stays private.
const HOST_PORT = 47071;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.webp': 'image/webp'
};

function histDir() { return path.join(app.getPath('userData'), 'history'); }

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
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.family === 'IPv4' && !a.internal) urls.push(`http://${a.address}:${HOST_PORT}`);
    }
  }
  return urls;
}

let server = null;
let serverError = null;

function startServer() {
  if (server) return;
  serverError = null;
  server = http.createServer((req, res) => {
    const parsed = new URL(req.url || '/', 'http://x');
    const url = parsed.pathname;
    try {
      if (url === '/api/ping') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"ok":true,"app":"medora"}'); return; }

      if (url.startsWith('/api/')) {
        const tok = parsed.searchParams.get('token') || req.headers['x-medora-token'] || '';
        if (tok !== lanCode()) { res.writeHead(401, { 'Content-Type': 'application/json' }); res.end('{"error":"invalid access code"}'); return; }

        if (url === '/api/store') {
          if (req.method === 'GET') {
            const doc = readDoc();
            res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(doc));
            return;
          }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', c => { body += c; if (body.length > 50 * 1024 * 1024) req.destroy(); });
            req.on('end', () => {
              try {
                const doc = JSON.parse(body);
                // Refuse to wipe the clinic's record remotely: a POST must carry
                // real structure, never an emptied patients array.
                if (!doc || !Array.isArray(doc.patients) || !doc.settings || (doc.patients.length === 0 && !doc.updatedAt)) {
                  res.writeHead(400); res.end('bad doc'); return;
                }
                writeDoc(hashPins(doc));
                const w = BrowserWindow.getAllWindows()[0];
                if (w) w.webContents.send('medora:sync-apply', doc);
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
              writeJsonEnc(path.join(histDir(), `${id}.json`), { id, label: label || 'remote', at: new Date().toISOString(), doc });
              res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"ok":true}');
            } catch (e) { res.writeHead(500); res.end(String(e)); }
          });
          return;
        }
        if (url === '/api/verify-pin' && req.method === 'POST') {
          let body = '';
          req.on('data', c => body += c);
          req.on('end', () => {
            try {
              const { storedPin, candidate } = JSON.parse(body || '{}');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: verifyPinStr(storedPin, candidate) }));
            } catch (e) { res.writeHead(500); res.end(String(e)); }
          });
          return;
        }
        res.writeHead(404); res.end('not found'); return;
      }

      // Static app files + SPA fallback (no auth — carries no patient data).
      const dist = distDir();
      if (!dist) { res.writeHead(503); res.end('app bundle not found'); return; }
      let fp = path.join(dist, decodeURIComponent(url === '/' ? '/index.html' : url));
      if (!fp.startsWith(dist) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) fp = path.join(dist, 'index.html');
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(fp).pipe(res);
    } catch (e) { try { res.writeHead(500); res.end(String(e)); } catch {} }
  });
  server.on('error', e => {
    serverError = String(e && e.code === 'EADDRINUSE' ? `Port ${HOST_PORT} is already in use` : e);
    try { server.close(); } catch {}
    server = null;
  });
  try { server.listen(HOST_PORT, '0.0.0.0'); } catch (e) { serverError = String(e); server = null; }
}

function stopServer() {
  if (!server) return;
  try { server.close(); } catch {}
  server = null;
}

function registerHostIPC() {
  ipcMain.handle('host:info', () => ({ ok: true, enabled: !!server, error: serverError, port: HOST_PORT, token: lanCode(), urls: lanUrls() }));
  ipcMain.handle('host:set', (_e, { enabled }) => {
    if (enabled) startServer(); else stopServer();
    return { ok: true, enabled: !!server, error: serverError };
  });
}

module.exports = { registerHostIPC };
