// Browser-mode shim: when Medora is opened from another PC's browser
// (http://<host>:47071) there is no Electron preload api — provide the same
// surface over fetch so the whole app works and data lives on the host PC.
export function installWebApi() {
  if (window.api) return;

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

  window.api = {
    store: {
      load: async () => {
        try { const r = await fetch('/api/store'); return { doc: await r.json() }; }
        catch { return { doc: null }; }
      },
      save: async doc => {
        try { await fetch('/api/store', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(doc) }); } catch {}
        return { ok: true };
      },
      snapshot: async (doc, label) => {
        try { await fetch('/api/snapshot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ doc, label }) }); } catch {}
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
        let lastAt = 0, lastText = '';
        setInterval(async () => {
          try {
            const r = await fetch('/api/store');
            const text = await r.text();
            const doc = JSON.parse(text);
            if (!doc || !Array.isArray(doc.patients)) return;
            const at = doc.updatedAt || 0;
            if (lastAt === 0) { lastAt = at; lastText = text; return; } // baseline — never stomp local edits on first load
            if (at > lastAt && text !== lastText) { lastAt = at; lastText = text; cb(doc); }
          } catch { /* host unreachable — try again */ }
        }, 4000);
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
