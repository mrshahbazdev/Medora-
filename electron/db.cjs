const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app, safeStorage } = require('electron');
const Database = require('better-sqlite3-multiple-ciphers');
const { readDoc, hashPins } = require('./ipc/doc-io.cjs');

/**
 * SQLite document store (better-sqlite3-multiple-ciphers → SQLCipher).
 * - clinory.db lives in userData, encrypted with a random key (the key itself is
 *   wrapped by OS safeStorage / DPAPI and kept in db.key next to the database).
 * - WAL + foreign keys on; every write is record-level inside one transaction.
 * - mergeSave diffs the client's doc against the doc that client last loaded
 *   (tracked by rev) and applies ONLY the rows that client changed — so a
 *   receptionist and a doctor on different PCs no longer overwrite each other.
 * - Never put clinory.db on a network share: SMB locking corrupts SQLite. The
 *   multi-PC path stays host + HTTP.
 */

const TABLES = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT);
CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT, role TEXT, pin TEXT, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS patients (id TEXT PRIMARY KEY, mrn TEXT, name TEXT, data TEXT NOT NULL, updated TEXT);
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(mrn);
CREATE TABLE IF NOT EXISTS visits (id TEXT PRIMARY KEY, patient_id TEXT, date TEXT, data TEXT NOT NULL, updated TEXT);
CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patient_id);
CREATE TABLE IF NOT EXISTS visit_items (id TEXT PRIMARY KEY, visit_id TEXT REFERENCES visits(id) ON DELETE CASCADE, ord INTEGER, data TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_vi_visit ON visit_items(visit_id);
CREATE TABLE IF NOT EXISTS medicines (id TEXT PRIMARY KEY, name TEXT, stock REAL, data TEXT NOT NULL, updated TEXT);
CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT, user TEXT, action TEXT, entity TEXT, entity_id TEXT, data TEXT);
CREATE TABLE IF NOT EXISTS records (collection TEXT, id TEXT, data TEXT NOT NULL, updated TEXT, PRIMARY KEY (collection, id));
`;

// Collections with dedicated tables; everything else lands in `records`.
const DEDICATED = new Set(['patients', 'visits', 'medicines']);

let db = null;
let lastDoc = null;          // doc as last assembled/saved by THIS process
const revDocs = new Map();   // rev → doc the client based its edit on
let revCounter = 0;

function keyForDb() {
  const kf = path.join(app.getPath('userData'), 'db.key');
  try {
    const raw = fs.readFileSync(kf, 'utf8').trim();
    if (raw) {
      try { return safeStorage.decryptString(Buffer.from(raw, 'base64')); } catch { return raw; }
    }
  } catch {}
  const key = crypto.randomBytes(32).toString('hex');
  try {
    const wrapped = safeStorage.isEncryptionAvailable()
      ? safeStorage.encryptString(key).toString('base64')
      : key; // dev machines only — packaged builds refuse above
    fs.writeFileSync(kf, wrapped, 'utf8');
  } catch {}
  return key;
}

function openDb() {
  if (db) return db;
  // Packaged builds refuse to run without OS-level key wrapping — patient data
  // must never sit on disk protected by a plaintext key file.
  if (app.isPackaged && !safeStorage.isEncryptionAvailable()) {
    throw new Error('OS encryption unavailable — cannot open encrypted patient database');
  }
  // Rebrand migration: adopt the old medora.db (+ sidecar files) if the new
  // clinory.db hasn't been created yet.
  const dir = app.getPath('userData');
  const newDb = path.join(dir, 'clinory.db');
  const oldDb = path.join(dir, 'medora.db');
  if (!fs.existsSync(newDb) && fs.existsSync(oldDb)) {
    for (const f of ['medora.db', 'medora.db-wal', 'medora.db-shm', 'medora.db-journal']) {
      try { fs.renameSync(path.join(dir, f), path.join(dir, f.replace('medora', 'clinory'))); } catch {}
    }
  }
  db = new Database(newDb);
  db.pragma(`key='${keyForDb()}'`);
  db.exec(TABLES);
  revCounter = Number((db.prepare(`SELECT v FROM meta WHERE k='rev'`).get() || {}).v || 0);
  migrateFromJson();
  return db;
}

// ---- migration: one-shot import of the legacy clinory.json ----
function migrateFromJson() {
  const done = (db.prepare(`SELECT v FROM meta WHERE k='migrated'`).get() || {}).v;
  if (done) return;
  const doc = readDoc();
  if (doc && Array.isArray(doc.patients)) {
    const base = { version: 1, patients: [], settings: { users: [] } };
    applyChanges(diffDocs(base, doc), 'migration');
    saveSettings(doc.settings || {}, 'migration');
    if (doc.updatedAt) db.prepare(`INSERT OR REPLACE INTO meta (k, v) VALUES ('updatedAt', ?)`).run(String(doc.updatedAt));
    try {
      fs.renameSync(
        path.join(app.getPath('userData'), 'clinory.json'),
        path.join(app.getPath('userData'), 'clinory.json.migrated')
      );
    } catch {}
  }
  db.prepare(`INSERT OR REPLACE INTO meta (k, v) VALUES ('migrated', '1')`).run();
}

// ---- doc <-> rows ----
function loadDoc() {
  openDb();
  const doc = { version: 1 };
  doc.patients = db.prepare(`SELECT data FROM patients`).all().map(r => JSON.parse(r.data));
  const itemsByVisit = {};
  for (const it of db.prepare(`SELECT visit_id, ord, data FROM visit_items ORDER BY ord`).all()) {
    (itemsByVisit[it.visit_id] = itemsByVisit[it.visit_id] || []).push(JSON.parse(it.data));
  }
  doc.visits = db.prepare(`SELECT data FROM visits`).all().map(r => {
    const v = JSON.parse(r.data);
    if (itemsByVisit[v.id]) v.items = itemsByVisit[v.id];
    return v;
  });
  doc.medicines = db.prepare(`SELECT data FROM medicines`).all().map(r => JSON.parse(r.data));
  const s = db.prepare(`SELECT data FROM settings WHERE id = 1`).get();
  doc.settings = s ? JSON.parse(s.data) : {};
  // PIN hashes never leave this process — clients get an 's:x' marker only.
  // PIN verification happens in the main process (auth:verifyUserPin / /api/verify-pin).
  doc.settings.users = db.prepare(`SELECT data FROM users`).all().map(r => {
    const u = JSON.parse(r.data);
    return { ...u, pin: u.pin ? 's:x' : '' };
  });
  for (const r of db.prepare(`SELECT collection, data FROM records`).all()) {
    (doc[r.collection] = doc[r.collection] || []).push(JSON.parse(r.data));
  }
  doc.updatedAt = (db.prepare(`SELECT v FROM meta WHERE k='updatedAt'`).get() || {}).v || doc.updatedAt;
  return doc;
}

// Diff two docs → { collection: { upserts:[row], deletes:[id] } } (+ settings).
function diffDocs(base, next) {
  const changes = {};
  const cols = new Set([...Object.keys(base || {}), ...Object.keys(next || {})]);
  for (const k of cols) {
    if (k === 'settings' || k === 'version' || k === 'updatedAt') continue;
    if (!Array.isArray(next[k]) && !Array.isArray(base && base[k])) continue;
    const oldRows = new Map(((base || {})[k] || []).map(r => [r.id, r]));
    const newRows = new Map((next[k] || []).map(r => [r.id || (r.id = 'x' + crypto.randomBytes(6).toString('hex')), r]));
    const upserts = [];
    const deletes = [];
    for (const [id, row] of newRows) {
      const old = oldRows.get(id);
      if (!old || JSON.stringify(old) !== JSON.stringify(row)) upserts.push(row);
    }
    for (const id of oldRows.keys()) if (!newRows.has(id)) deletes.push(id);
    if (upserts.length || deletes.length) changes[k] = { upserts, deletes };
  }
  return changes;
}

function rowCols(collection, row) {
  switch (collection) {
    case 'patients': return [row.id, row.mrn || '', row.name || '', JSON.stringify(row), row.updatedAt || ''];
    case 'visits': return [row.id, row.mrn || row.patientMrn || '', row.date || row.at || '', JSON.stringify(row), ''];
    case 'medicines': return [row.id, row.name || '', row.stock ?? null, JSON.stringify(row), ''];
    default: return [collection, row.id, JSON.stringify(row), ''];
  }
}

function applyChanges(changes, actor) {
  const now = new Date().toISOString();
  const audit = db.prepare(`INSERT INTO audit_log (at, user, action, entity, entity_id, data) VALUES (?,?,?,?,?,?)`);
  let writes = 0;
  const txn = db.transaction(() => {
    for (const [col, c] of Object.entries(changes)) {
      for (const row of c.upserts) {
        if (col === 'visits') {
          const { items, ...v } = row;
          db.prepare(`INSERT OR REPLACE INTO visits (id, patient_id, date, data, updated) VALUES (?,?,?,?,?)`)
            .run(v.id, v.mrn || v.patientMrn || '', v.date || v.at || '', JSON.stringify(v), now);
          if (Array.isArray(items)) {
            db.prepare(`DELETE FROM visit_items WHERE visit_id = ?`).run(v.id);
            items.forEach((it, i) => db.prepare(`INSERT INTO visit_items (id, visit_id, ord, data) VALUES (?,?,?,?)`)
              .run(it.id || ('vi' + crypto.randomBytes(5).toString('hex')), v.id, i, JSON.stringify(it)));
          }
        } else if (col === 'patients' || col === 'medicines') {
          db.prepare(`INSERT OR REPLACE INTO ${col} (id, ${col === 'patients' ? 'mrn, name' : 'name, stock'}, data, updated) VALUES (?,?,?,?,?)`)
            .run(...rowCols(col, { ...row, updatedAt: now }));
        } else {
          db.prepare(`INSERT OR REPLACE INTO records (collection, id, data, updated) VALUES (?,?,?,?)`)
            .run(col, row.id, JSON.stringify(row), now);
        }
        writes++;
      }
      for (const id of c.deletes) {
        if (col === 'patients' || col === 'visits' || col === 'medicines') db.prepare(`DELETE FROM ${col} WHERE id = ?`).run(id);
        else db.prepare(`DELETE FROM records WHERE collection = ? AND id = ?`).run(col, id);
        writes++;
      }
    }
    if (writes) {
      audit.run(now, actor || 'app', 'save', '', '', JSON.stringify(Object.fromEntries(Object.entries(changes).map(([k, c]) => [k, { u: c.upserts.length, d: c.deletes.length }]))));
      revCounter++;
      db.prepare(`INSERT OR REPLACE INTO meta (k, v) VALUES ('rev', ?)`).run(String(revCounter));
    }
  });
  txn();
  return writes;
}

function saveSettings(settings, actor) {
  const { users, ...rest } = settings || {};
  const prev = db.prepare(`SELECT data FROM settings WHERE id = 1`).get();
  if (!prev || prev.data !== JSON.stringify(rest)) {
    db.prepare(`INSERT OR REPLACE INTO settings (id, data) VALUES (1, ?)`).run(JSON.stringify(rest));
    auditRow(actor, 'settings');
  }
  // users table is authoritative for the pin column (hash happens here)
  const oldUsers = new Map(db.prepare(`SELECT id, data FROM users`).all().map(r => [r.id, JSON.parse(r.data)]));
  const newIds = new Set();
  for (const u of (users || [])) {
    newIds.add(u.id);
    const old = oldUsers.get(u.id);
    // 's:x' is the client-side marker for an existing PIN — keep the stored hash.
    const merged = { ...u, pin: (u.pin === 's:x' || (old && u.pin === old.pin)) ? (old ? old.pin : '') : u.pin };
    if (!old || JSON.stringify(old) !== JSON.stringify(merged)) {
      const hashed = hashPins({ settings: { users: [merged] } }).settings.users[0];
      db.prepare(`INSERT OR REPLACE INTO users (id, name, role, pin, data) VALUES (?,?,?,?,?)`)
        .run(u.id, u.name || '', u.role || '', hashed.pin || '', JSON.stringify(hashed));
      auditRow(actor, 'users', u.id);
    }
  }
  for (const id of oldUsers.keys()) if (!newIds.has(id)) db.prepare(`DELETE FROM users WHERE id = ?`).run(id);
}

function auditRow(actor, entity, entityId) {
  db.prepare(`INSERT INTO audit_log (at, user, action, entity, entity_id, data) VALUES (?,?,?,?,?,?)`)
    .run(new Date().toISOString(), actor || 'app', 'write', entity, entityId || '', '{}');
}

/**
 * Merge a client's doc into the DB. baseline = the doc that client last loaded
 * (looked up by baseRev); without one we diff against the last doc this process
 * produced. Only the client's own row-level changes are applied — rows other
 * clients touched in between are preserved.
 */
function mergeSave(clientDoc, { actor = 'app', baseRev } = {}) {
  openDb();
  const baseline = (baseRev && revDocs.get(baseRev)) || lastDoc || { version: 1, patients: [], settings: {} };
  const changes = diffDocs(baseline, clientDoc);
  const txn = db.transaction(() => {
    const writes = applyChanges(changes, actor);
    const cur = db.prepare(`SELECT data FROM settings WHERE id = 1`).get();
    const curSettings = cur ? { ...JSON.parse(cur.data), users: db.prepare(`SELECT data FROM users`).all().map(r => JSON.parse(r.data)) } : { users: [] };
    if (JSON.stringify(stripUsers(curSettings)) !== JSON.stringify(stripUsers(clientDoc.settings || {})) ||
        JSON.stringify(usersOf(curSettings)) !== JSON.stringify(usersOf(clientDoc.settings || {}))) {
      saveSettings(clientDoc.settings, actor);
    }
    if (clientDoc.updatedAt !== (db.prepare(`SELECT v FROM meta WHERE k='updatedAt'`).get() || {}).v) {
      db.prepare(`INSERT OR REPLACE INTO meta (k, v) VALUES ('updatedAt', ?)`).run(String(clientDoc.updatedAt || ''));
    }
    return writes;
  });
  const writes = txn();
  const saved = loadDoc();
  lastDoc = saved;
  revDocs.set(revCounter, saved);
  if (revDocs.size > 30) revDocs.delete(revDocs.keys().next().value);
  return { ok: true, rev: revCounter, writes };
}

function stripUsers(s) { const { users, ...r } = s || {}; return r; }
// Compare users in marker form — real hashes must never travel to clients.
function usersOf(s) { return ((s && s.users) || []).map(u => ({ ...u, pin: u.pin ? 's:x' : '' })); }

function serveDoc() {
  const doc = loadDoc();
  lastDoc = doc;
  revDocs.set(revCounter, doc);   // the baseline this client will edit from
  if (revDocs.size > 30) revDocs.delete(revDocs.keys().next().value);
  return { doc, rev: revCounter };
}

// record-level API used by host.cjs
function listRows(collection, q) {
  openDb();
  if (DEDICATED.has(collection)) {
    const rows = db.prepare(`SELECT data FROM ${collection}`).all().map(r => JSON.parse(r.data));
    if (collection === 'visits') for (const v of rows) {
      v.items = db.prepare(`SELECT data FROM visit_items WHERE visit_id = ? ORDER BY ord`).all(v.id).map(x => JSON.parse(x.data));
    }
    return filterRows(collection, rows, q);
  }
  const rows = db.prepare(`SELECT data FROM records WHERE collection = ?`).all(collection).map(r => JSON.parse(r.data));
  return filterRows(collection, rows, q);
}
function filterRows(collection, rows, q) {
  if (!q) return rows;
  const needle = String(q).toLowerCase();
  return rows.filter(r => JSON.stringify(r).toLowerCase().includes(needle));
}
function getRow(collection, id) {
  openDb();
  const r = DEDICATED.has(collection)
    ? db.prepare(`SELECT data FROM ${collection} WHERE id = ?`).get(id)
    : db.prepare(`SELECT data FROM records WHERE collection = ? AND id = ?`).get(collection, id);
  if (!r) return null;
  const row = JSON.parse(r.data);
  if (collection === 'visits') {
    row.items = db.prepare(`SELECT data FROM visit_items WHERE visit_id = ? ORDER BY ord`).all(id).map(x => JSON.parse(x.data));
  }
  return row;
}
function putRow(collection, row, actor) {
  openDb();
  if (!row || !row.id) row.id = 'x' + crypto.randomBytes(6).toString('hex');
  applyChanges({ [collection]: { upserts: [row], deletes: [] } }, actor);
  return { ok: true, id: row.id, rev: revCounter };
}
function patchRow(collection, id, patch, actor) {
  const cur = getRow(collection, id);
  if (!cur) return { ok: false, error: 'not found' };
  return putRow(collection, { ...cur, ...patch, id }, actor);
}
function deleteRow(collection, id, actor) {
  openDb();
  applyChanges({ [collection]: { upserts: [], deletes: [id] } }, actor);
  return { ok: true, rev: revCounter };
}

function currentRev() { openDb(); return revCounter; }

module.exports = { openDb, loadDoc, serveDoc, mergeSave, listRows, getRow, putRow, patchRow, deleteRow, currentRev };
