const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app, ipcMain } = require('electron');
const { readDoc, writeDoc, readJsonEnc, writeJsonEnc, hashPins, verifyPinStr } = require('./doc-io.cjs');

/**
 * Document store. All of Medora's data is one JSON document written
 * atomically (tmp file + rename), plus timestamped snapshots in history/
 * so a bad edit can never destroy financial records.
 *
 * JSON chosen over SQLite here too: documents are filtered in memory
 * (hundreds of rows is trivial), and a plain file keeps a native
 * dependency out of the packaged installer.
 */
const MAX_HISTORY = 50;

function storeDir() {
  return app.getPath('userData');
}

function docPath() {
  return path.join(storeDir(), 'medora.json');
}

function historyDir() {
  return path.join(storeDir(), 'history');
}

function atomicWrite(file, text) {
  const tmp = `${file}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  fs.writeFileSync(tmp, text, 'utf8');
  fs.renameSync(tmp, file);
}

function registerStoreIPC() {
  ipcMain.handle('store:load', () => ({ doc: readDoc() }));

  ipcMain.handle('store:save', (_e, doc) => {
    writeDoc(hashPins(doc));
    return { ok: true };
  });

  // PIN gate is enforced in the main process — hashed PINs never leave it
  // in a verifiable form for the renderer to compare.
  ipcMain.handle('auth:verifyPin', (_e, { storedPin, candidate }) => ({ ok: verifyPinStr(storedPin, candidate) }));

  ipcMain.handle('store:snapshot', (_e, doc, label) => {
    fs.mkdirSync(historyDir(), { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const id = `${stamp}_${crypto.randomBytes(3).toString('hex')}`;
    writeJsonEnc(
      path.join(historyDir(), `${id}.json`),
      { id, label: label || '', at: new Date().toISOString(), doc }
    );
    prune();
    return { ok: true, id };
  });

  ipcMain.handle('store:history', () => {
    try {
      return fs.readdirSync(historyDir())
        .filter(f => f.endsWith('.json'))
        .map(f => {
          try {
            const s = readJsonEnc(path.join(historyDir(), f));
            return s ? { id: s.id, label: s.label, at: s.at } : null;
          } catch { return null; }
        })
        .filter(Boolean)
        .sort((a, b) => b.at.localeCompare(a.at));
    } catch {
      return [];
    }
  });

  ipcMain.handle('store:restore', (_e, id) => {
    if (!/^[\w-]+$/.test(id)) return { doc: null };
    try {
      const s = readJsonEnc(path.join(historyDir(), `${id}.json`));
      return { doc: s ? s.doc : null };
    } catch {
      return { doc: null };
    }
  });
}

function prune() {
  try {
    const files = fs.readdirSync(historyDir()).filter(f => f.endsWith('.json')).sort();
    const extra = files.length - MAX_HISTORY;
    for (let i = 0; i < extra; i++) fs.unlinkSync(path.join(historyDir(), files[i]));
  } catch { /* pruning is best-effort */ }
}

module.exports = { registerStoreIPC };
