// Browser-mode shim: when Clinory is opened from another PC's browser
// (http://<host>:47071) there is no Electron preload api — provide the same
// surface over fetch so the whole app works and data lives on the host PC.
export function installWebApi() {
  if (window.api) return;

  // Access code: arrives as ?token=CODE in the link copied from the main PC,
  // or is entered once on the connect screen — then kept in localStorage.
  const qs = new URLSearchParams(location.search);
  if (qs.get('token')) {
    localStorage.setItem('clinory_token', qs.get('token'));
    localStorage.removeItem('medora_token');
    qs.delete('token');
    history.replaceState(null, '', location.pathname + (qs.toString() ? '?' + qs : ''));
  }
  const token = () => localStorage.getItem('clinory_token') || localStorage.getItem('medora_token') || '';

  let gateShown = false;
  const showGate = () => {
    if (gateShown) return;
    gateShown = true;
    document.body.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0c1c33;font-family:system-ui">
      <form id="g" style="background:#fff;padding:32px;border-radius:14px;width:320px;box-shadow:0 20px 60px #0004">
        <div style="font-weight:800;font-size:18px;color:#0d1f3c">Clinory — connect</div>
        <div style="font-size:12.5px;color:#64748b;margin:6px 0 14px">Enter the access code shown on the main computer (Settings → Local connection).</div>
        <input id="c" placeholder="Access code" autocomplete="off" style="width:100%;padding:10px;border:1px solid #dbe3ee;border-radius:8px;font-size:15px;letter-spacing:2px;text-transform:uppercase"/>
        <button style="width:100%;margin-top:10px;padding:10px;border:0;border-radius:8px;background:#2563eb;color:#fff;font-weight:700">Connect</button>
        <div id="e" style="color:#dc2626;font-size:12px;margin-top:8px;display:none">Wrong code — check the main computer's screen.</div>
      </form></div>`;
    document.getElementById('g').onsubmit = ev => {
      ev.preventDefault();
      const v = document.getElementById('c').value.trim().toUpperCase();
      fetch('/api/ping', { headers: { 'x-clinory-ping': '1' } }).then(() => {
        return fetch('/api/store', { headers: { 'x-clinory-token': v } });
      }).then(r => {
        if (r.status === 401) { document.getElementById('e').style.display = 'block'; return; }
        localStorage.setItem('clinory_token', v);
        location.reload();
      }).catch(() => { document.getElementById('e').textContent = 'Cannot reach the main PC — check the link/WiFi.'; document.getElementById('e').style.display = 'block'; });
    };
  };

  const apiFetch = (url, opts = {}) => fetch(url, {
    ...opts,
    headers: { ...(opts.headers || {}), 'x-clinory-token': token() }
  }).then(r => { if (r.status === 401) { showGate(); throw new Error('auth'); } return r; });

  const dl = (text, name) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/octet-stream' }));
    a.download = name || 'download';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  const printHtml = ({ html }) => {
    const w = window.open('about:blank', '_blank');
    if (!w) { alert('Popup blocked — allow popups for this page to print.'); return; }
    w.document.write(html);
    w.document.close();
    setTimeout(() => { try { w.print(); } catch {} }, 350);
  };

  const pickFile = ({ filters } = {}) => new Promise(resolve => {
    const inp = document.createElement('input');
    inp.type = 'file';
    const exts = (filters || []).flatMap(f => f.extensions || []).map(e => '.' + e).join(',');
    if (exts) inp.accept = exts;
    inp.onchange = () => {
      const f = inp.files[0];
      if (!f) return resolve(null);
      const img = /image|png|jpe?g|webp|gif/i.test(f.type) || /\.(png|jpe?g|webp|gif)$/i.test(f.name);
      const r = new FileReader();
      r.onload = () => resolve(img
        ? { path: f.name, name: f.name, dataUrl: r.result }
        : { path: f.name, name: f.name, text: r.result });
      r.onerror = () => resolve(null);
      if (img) r.readAsDataURL(f); else r.readAsText(f);
    };
    inp.click();
  });

  let lastRev = null;   // the doc revision this client based its edits on

  window.api = {
    store: {
      load: async () => {
        try {
          const r = await apiFetch('/api/store');
          const payload = await r.json();
          if (payload && payload.doc) { lastRev = payload.rev; return { doc: payload.doc }; }
          return { doc: payload };
        } catch { return { doc: null }; }
      },
      save: async doc => {
        try {
          const r = await apiFetch('/api/store', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ doc, baseRev: lastRev }) });
          const out = await r.json();
          if (out && out.rev != null) lastRev = out.rev;
        } catch {}
        return { ok: true };
      },
      snapshot: async (doc, label) => {
        try { await apiFetch('/api/snapshot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ doc, label }) }); } catch {}
        return { ok: true };
      },
      history: async () => [],
      restore: async () => false
    },
    export: {
      print: printHtml,
      pdf: printHtml,
      text: ({ text, suggestedName }) => dl(text, suggestedName),
      json: ({ json, suggestedName }) => dl(json, suggestedName),
      binary: ({ base64, suggestedName }) => {
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        dl(bytes, suggestedName);
      },
      toFolder: async () => ({ ok: false }),
      readFromFolder: async () => ({ ok: false })
    },
    sync: {
      publish: async () => ({ ok: true }),
      status: async () => ({ ok: true }),
      onApply: cb => {
        let lastRevSeen = -1;
        setInterval(async () => {
          try {
            const r = await apiFetch('/api/store');
            const payload = await r.json();
            const doc = payload && payload.doc ? payload.doc : payload;
            if (!doc || !Array.isArray(doc.patients)) return;
            const rev = (payload && payload.rev) ?? -1;
            if (lastRevSeen < 0) { lastRevSeen = rev; return; } // baseline — never stomp local edits on first load
            if (rev > lastRevSeen) { lastRevSeen = rev; lastRev = rev; cb(doc); }
          } catch { /* host unreachable — try again */ }
        }, 4000);
      }
    },
    auth: {
      verifyPin: async (userId, candidate) => {
        try {
          const r = await apiFetch('/api/verify-pin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, pin: candidate }) });
          return (await r.json()).ok;
        } catch { return false; }
      }
    },
    host: {
      info: async () => ({ ok: true, port: Number(location.port || 80), urls: [location.origin], remote: true })
    },
    app: {
      version: async () => 'web-client',
      openFile: pickFile,
      openUserData: async () => {}
    }
  };
}
