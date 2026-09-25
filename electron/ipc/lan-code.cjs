const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');

// One access code per install, shown in Settings → Local connection.
// LAN host + peer sync both authenticate with it; a second PC pairs by
// entering this code there.
function codePath() { return path.join(app.getPath('userData'), 'lan-code.txt'); }

function lanCode() {
  try { const t = fs.readFileSync(codePath(), 'utf8').trim(); if (t) return t; } catch {}
  const t = crypto.randomBytes(4).toString('hex').toUpperCase();
  try { fs.writeFileSync(codePath(), t, 'utf8'); } catch {}
  return t;
}

module.exports = { lanCode };
