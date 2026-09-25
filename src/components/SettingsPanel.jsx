import React, { useEffect, useState } from 'react';

function LanConnect({ st, mut }) {
  const [info, setInfo] = useState(null);
  const refresh = () => window.api.host?.info().then(setInfo).catch(() => {});
  useEffect(() => { refresh(); }, []);
  if (!info) return null;
  if (info.remote) return (
    <div className="pcard" style={{ marginBottom: 14, fontSize: 13 }}>
      ✅ Connected to the main PC at <b>{info.urls[0]}</b> — everything you enter here saves on the main PC.
    </div>
  );
  return (
    <div className="pcard" style={{ marginBottom: 14, fontSize: 13, lineHeight: 1.7 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
        <input type="checkbox" checked={!!info.enabled} onChange={async e => {
          const r = await window.api.host.set(e.target.checked);
          setInfo({ ...info, enabled: r.enabled, error: r.error });
          refresh();
        }} />
        Share Medora on this WiFi — other PCs/laptops open it in a browser; all data saves on THIS computer
      </label>
      {info.error && <div style={{ color: '#dc2626', marginTop: 6 }}>⚠ Could not start sharing: {info.error}</div>}
      {info.enabled && (<>
        <div style={{ marginTop: 8 }}>On the other device open Chrome/Edge and type one of these links (access code is built in):</div>
        {(info.urls || []).map(u => (
          <div key={u} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <code style={{ fontSize: 14, fontWeight: 700, background: '#eef4ff', padding: '3px 10px', borderRadius: 6 }}>{u}?token={info.token}</code>
            <button className="btn small ghost" onClick={() => navigator.clipboard?.writeText(`${u}?token=${info.token}`)}>Copy</button>
          </div>
        ))}
        <div style={{ marginTop: 8 }}>Access code: <code style={{ fontSize: 15, fontWeight: 800, background: '#fef3c7', padding: '2px 10px', borderRadius: 6, letterSpacing: 2 }}>{info.token}</code>
          <span className="muted"> — without this code no one on the WiFi can read or change the patient data.</span></div>
      </>)}
      {!info.enabled && <div className="muted" style={{ marginTop: 6 }}>Off — the patient database is not reachable from any other device. Access code for pairing: <code style={{ fontWeight: 700 }}>{info.token}</code></div>}
      <label className="lbl" style={{ display: 'block', marginTop: 10 }}>Pair code (for app-to-app sync): if THIS PC is the second computer, enter the main PC's access code here
        <input className="in" value={st.syncCode || ''} placeholder="e.g. A1B2C3D4" onChange={e => mut(x => x.syncCode = e.target.value.trim().toUpperCase())} /></label>
    </div>
  );
}

export default function SettingsPanel({ store, update, setStore }) {
  const [history, setHistory] = useState(null);
  const st = store.settings;
  const mut = (fn) => update(s => fn(s.settings));

  const loadHistory = async () => setHistory(await window.api.store.history());
  const restore = async (id) => {
    const { doc } = await window.api.store.restore(id);
    if (doc && confirm('Replace current data with this snapshot? (current state is snapshotted first)')) {
      await window.api.store.snapshot(store, 'before restore');
      setStore(doc);
      setHistory(null);
    }
  };

  return (
    <div className="panel">
      <h2 className="ptitle">Prescription pad header</h2>
      <div className="form" style={{ marginBottom: 16 }}>
        <div className="frow">
          <input className="in" value={st.doctorName} placeholder="Doctor name" onChange={e => mut(x => x.doctorName = e.target.value)} />
          <input className="in" value={st.qualifications} placeholder="MBBS, FCPS…" onChange={e => mut(x => x.qualifications = e.target.value)} />
          <input className="in" value={st.licenseNo} placeholder="PMDC / license no." onChange={e => mut(x => x.licenseNo = e.target.value)} />
        </div>
        <div className="frow">
          <input className="in" value={st.clinicName} placeholder="Clinic name" onChange={e => mut(x => x.clinicName = e.target.value)} />
          <input className="in" style={{ flex: 1 }} value={st.clinicAddress} placeholder="Clinic address" onChange={e => mut(x => x.clinicAddress = e.target.value)} />
        </div>
        <div className="frow">
          <input className="in" value={st.clinicPhone} placeholder="Phone" onChange={e => mut(x => x.clinicPhone = e.target.value)} />
          <input className="in" style={{ flex: 1 }} value={st.clinicTimings} placeholder="Timings, e.g. Mon–Sat 5–9 PM" onChange={e => mut(x => x.clinicTimings = e.target.value)} />
        </div>
        <div className="frow">
          <button className="btn small ghost" onClick={async () => {
            const f = await window.api.app.openFile({ filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }] });
            if (f?.dataUrl) mut(x => x.signatureDataUrl = f.dataUrl);
          }}>{st.signatureDataUrl ? 'Change signature' : 'Upload signature image'}</button>
          {st.signatureDataUrl && <img src={st.signatureDataUrl} alt="signature" style={{ height: 34, background: '#fff', padding: 4, border: '1px solid var(--line)', borderRadius: 6 }} />}
          {st.signatureDataUrl && <button className="icon" onClick={() => mut(x => x.signatureDataUrl = '')} aria-label="Remove signature">✕</button>}
          <span className="muted">Signs every prescription, certificate and referral automatically</span>
        </div>
      </div>

      <h2 className="ptitle">Doctors & rooms</h2>
      <table className="grid" style={{ marginBottom: 10 }}>
        <thead><tr><th>Doctor</th><th>Qualifications</th><th>Shift / roster</th><th>Fee share %</th><th>Room</th><th></th></tr></thead>
        <tbody>
          {(st.doctors || []).map(d => (
            <tr key={d.id}>
              <td><input className="in" value={d.name} onChange={e => mut(x => { const dd = x.doctors.find(z => z.id === d.id); dd.name = e.target.value; })} /></td>
              <td><input className="in" value={d.qualifications || ''} onChange={e => mut(x => { const dd = x.doctors.find(z => z.id === d.id); dd.qualifications = e.target.value; })} /></td>
              <td><input className="in" style={{ width: 110 }} value={d.shift || ''} placeholder="5–9 PM" title="Shift / roster" onChange={e => mut(x => { const dd = x.doctors.find(z => z.id === d.id); dd.shift = e.target.value; })} /></td>
              <td><input className="in num" style={{ width: 64 }} type="number" min="0" max="100" value={d.share ?? ''} placeholder="%" title="Fee share %" onChange={e => mut(x => { const dd = x.doctors.find(z => z.id === d.id); dd.share = Number(e.target.value) || 0; })} /></td>
              <td>
                <select className="in" value={d.room || ''} onChange={e => mut(x => { const dd = x.doctors.find(z => z.id === d.id); dd.room = e.target.value; })}>
                  <option value="">—</option>
                  {(st.rooms || []).map(r => <option key={r}>{r}</option>)}
                </select>
              </td>
              <td><button className="icon" onClick={() => mut(x => x.doctors = x.doctors.filter(z => z.id !== d.id))} aria-label="Remove doctor">✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="frow" style={{ marginBottom: 14 }}>
        <button className="btn small ghost" onClick={() => mut(x => { x.doctors = x.doctors || []; x.doctors.push({ id: 'd' + Date.now(), name: 'Dr. …', qualifications: '', room: '' }); })}>+ Doctor</button>
        <label className="lbl" style={{ flex: 1 }}>Rooms (comma separated)
          <input className="in" value={(st.rooms || []).join(', ')} onChange={e => mut(x => x.rooms = e.target.value.split(',').map(r => r.trim()).filter(Boolean))} /></label>
      </div>
      <p className="muted">Queue tokens carry the doctor & room; the selected doctor's name prints on that visit's prescription.</p>

      <h2 className="ptitle">Access &amp; display</h2>
      <div className="frow" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 8 }}>
        <label className="chk"><input type="checkbox" checked={!!st.receptionMode} onChange={e => mut(x => x.receptionMode = e.target.checked)} /> Receptionist mode — show only Token queue &amp; Day book</label>
        <label className="chk"><input type="checkbox" checked={!!st.rxUrdu} onChange={e => mut(x => x.rxUrdu = e.target.checked)} /> Urdu-only prescription pad (advice + dosage instructions in Urdu)</label>
        <label className="chk"><input type="checkbox" checked={!!st.uiUrdu} onChange={e => mut(x => x.uiUrdu = e.target.checked)} /> Urdu interface (right-to-left navigation)</label>
        <label className="lbl" style={{ width: '100%' }}>Backup folder path (for USB/cloud sync reminder)
          <input className="in" value={st.backupFolder || ''} placeholder="e.g. D:\Medora Backups" onChange={e => mut(x => x.backupFolder = e.target.value)} /></label>
      </div>

      <h2 className="ptitle">Wards &amp; branches</h2>
      <div className="frow" style={{ marginBottom: 12 }}>
        <label className="lbl" style={{ flex: 1 }}>Wards (comma separated)
          <input className="in" value={(st.wards || []).join(', ')} onChange={e => mut(x => x.wards = e.target.value.split(',').map(r => r.trim()).filter(Boolean))} /></label>
      </div>
      <table className="grid" style={{ marginBottom: 14 }}>
        <thead><tr><th>Branch / clinic location</th><th></th></tr></thead>
        <tbody>
          {(st.branches || []).map(b => (
            <tr key={b.id}>
              <td><input className="in" value={b.name} onChange={e => mut(x => { x.branches.find(z => z.id === b.id).name = e.target.value; })} /></td>
              <td><button className="icon" onClick={() => mut(x => x.branches = x.branches.filter(z => z.id !== b.id))} aria-label="Remove branch">✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="frow" style={{ marginBottom: 14 }}>
        <button className="btn small ghost" onClick={() => mut(x => { x.branches = x.branches || []; x.branches.push({ id: 'b' + Date.now(), name: 'Branch …' }); })}>+ Branch</button>
      </div>

      <h2 className="ptitle">Users &amp; PIN login</h2>
      <p className="muted" style={{ marginTop: 0 }}>Add users to lock the app. Roles: <b>admin</b> (everything), <b>doctor</b> (no staff/settings), <b>reception</b> (only token queue + day book). Leave empty for no login.</p>
      <table className="grid" style={{ marginBottom: 10 }}>
        <thead><tr><th>Name</th><th>Role</th><th>PIN (4-6 digits)</th><th></th></tr></thead>
        <tbody>
          {(st.users || []).map(u => (
            <tr key={u.id}>
              <td><input className="in" value={u.name} onChange={e => mut(x => { x.users.find(z => z.id === u.id).name = e.target.value; })} /></td>
              <td><select className="in" value={u.role} onChange={e => mut(x => { x.users.find(z => z.id === u.id).role = e.target.value; })}>
                <option value="admin">admin</option><option value="doctor">doctor</option><option value="reception">reception</option></select></td>
              <td><input className="in" value={String(u.pin || '').startsWith('s:') ? '' : u.pin} placeholder={String(u.pin || '').startsWith('s:') ? '•••• (saved)' : '4-6 digits'} onChange={e => mut(x => { x.users.find(z => z.id === u.id).pin = e.target.value.replace(/\D/g, '').slice(0, 6); })} /></td>
              <td><button className="icon" onClick={() => mut(x => x.users = x.users.filter(z => z.id !== u.id))}>✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="frow" style={{ marginBottom: 14 }}>
        <button className="btn small ghost" onClick={() => mut(x => { x.users = x.users || []; x.users.push({ id: 'u' + Date.now(), name: 'Dr. / staff', role: 'doctor', pin: '0000' }); })}>+ User</button>
      </div>

      <h2 className="ptitle">Local connection — use Medora on other PCs</h2>
      <LanConnect st={st} mut={mut} />

      <h2 className="ptitle">Sync folder (LAN / USB)</h2>
      <div className="frow" style={{ marginBottom: 8 }}>
        <label className="lbl" style={{ flex: 1 }}>Shared folder path — app writes <code>medora-sync.json</code> here on every save; same folder path set on every PC keeps them in sync automatically
          <input className="in" value={st.syncFolder || ''} placeholder="e.g. \\RECEPTION-PC\shared  ya  D:\shared" onChange={e => mut(x => x.syncFolder = e.target.value)} /></label>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 13 }}>
        <input type="checkbox" checked={st.syncAuto !== false} onChange={e => mut(x => x.syncAuto = e.target.checked)} />
        Auto-sync every 5 seconds — changes made on other PCs on the same WiFi/LAN appear here automatically
      </label>

      <h2 className="ptitle">Audit log (last 30)</h2>
      <div className="row" style={{ marginBottom: 8 }}>
        <button className="btn small ghost" onClick={() => {
          const esc = x => String(x ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
          const rows = (store.auditLog || []).slice().reverse().map(a => `<tr><td>${esc((a.at || '').replace('T', ' ').slice(0, 19))}</td><td>${esc(a.user)}</td><td>${esc(a.what)}</td></tr>`).join('');
          window.api.export.print({ html: `<!doctype html><html><head><style>@page{size:A4;margin:14mm}body{font:10pt 'Segoe UI',sans-serif}table{width:100%;border-collapse:collapse}td{border:1px solid #e2e8f0;padding:3px 6px}th{text-align:left;background:#0d9488;color:#fff;padding:4px 6px}</style></head><body><h2>Medora — audit log</h2><table><thead><tr><th>Time</th><th>User</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></body></html>` });
        }}>Print audit report</button>
        <button className="btn small" style={{ background: '#dc2626' }} onClick={() => {
          if (!confirm('Saara data delete ho jayega (snapshot backup le liya jayega). Continue?')) return;
          window.api.store.snapshot && window.api.store.snapshot();
          update(s => { Object.keys(s).forEach(k => delete s[k]); Object.assign(s, emptyStore(), { settings: defaultSettings() }); });
        }}>Reset — delete all data</button>
      </div>
      <div style={{ maxHeight: 180, overflowY: 'auto', background: '#f8fafc', borderRadius: 8, padding: 8, marginBottom: 14, fontSize: 12 }}>
        {(store.auditLog || []).slice(-30).reverse().map((a, i) => (
          <div key={i} className="muted" style={{ padding: '2px 0', borderBottom: '1px solid #eef2f7' }}>{a.at?.replace('T', ' ').slice(0, 19)} — <b>{a.user}</b> — {a.what}</div>
        ))}
        {!(store.auditLog || []).length && <span className="muted">No entries yet.</span>}
      </div>

      <h2 className="ptitle">Insurance panel &amp; SMS templates</h2>
      <table className="grid" style={{ marginBottom: 10 }}>
        <tbody>
          {(st.insurers || store.insurers || []).length === 0 && (store.insurers || []).length === 0 && null}
          {(store.insurers || []).map(i => (
            <tr key={i.id}>
              <td><input className="in" value={i.name} onChange={e => update(s => { s.insurers.find(x => x.id === i.id).name = e.target.value; })} /></td>
              <td><input className="in" placeholder="Contact" value={i.contact || ''} onChange={e => update(s => { s.insurers.find(x => x.id === i.id).contact = e.target.value; })} /></td>
              <td><button className="icon" onClick={() => update(s => s.insurers = s.insurers.filter(x => x.id !== i.id))}>✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="frow" style={{ marginBottom: 14 }}>
        <button className="btn small ghost" onClick={() => update(s => { s.insurers = s.insurers || []; s.insurers.push({ id: 'i' + Date.now(), name: 'Panel company…', contact: '' }); })}>+ Insurance / panel company</button>
      </div>
      <table className="grid" style={{ marginBottom: 10 }}>
        <thead><tr><th>SMS template name</th><th>Text ({'{name} {date} {clinic} {doctor}'} placeholders)</th><th></th></tr></thead>
        <tbody>
          {(st.smsTemplates || []).map(t => (
            <tr key={t.id}>
              <td><input className="in" value={t.name} onChange={e => update(s => { const x = s.settings.smsTemplates.find(y => y.id === t.id); x.name = e.target.value; })} /></td>
              <td><input className="in" value={t.text} onChange={e => update(s => { const x = s.settings.smsTemplates.find(y => y.id === t.id); x.text = e.target.value; })} /></td>
              <td><button className="icon" onClick={() => update(s => s.settings.smsTemplates = s.settings.smsTemplates.filter(y => y.id !== t.id))}>✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="frow" style={{ marginBottom: 14 }}>
        <button className="btn small ghost" onClick={() => update(s => { s.settings.smsTemplates = s.settings.smsTemplates || []; s.settings.smsTemplates.push({ id: 's' + Date.now(), name: 'New template', text: '{name}, … — {clinic}' }); })}>+ SMS template</button>
      </div>

      <h2 className="ptitle">Letterhead designer</h2>
      <div className="frow" style={{ marginBottom: 14 }}>
        <div>
          <label className="lbl">Clinic logo (prints on Rx header)</label>
          <input className="in" type="file" accept="image/*" onChange={e => {
            const f = e.target.files[0]; if (!f) return;
            const r = new FileReader(); r.onload = () => mut(x => { x.letterhead = x.letterhead || {}; x.letterhead.logoDataUrl = r.result; }); r.readAsDataURL(f);
          }} />
        </div>
        <label className="lbl">Accent color
          <input className="in" type="color" style={{ width: 60, height: 38, padding: 2 }} value={(st.letterhead && st.letterhead.accent) || '#0d9488'} onChange={e => mut(x => { x.letterhead = x.letterhead || {}; x.letterhead.accent = e.target.value; })} /></label>
        {st.letterhead?.logoDataUrl && <img src={st.letterhead.logoDataUrl} style={{ height: 44, objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: 6, padding: 2 }} />}
        <input className="in" style={{ width: 130 }} value={st.padWatermark || ''} placeholder="Watermark (e.g. COPY)" onChange={e => mut(x => x.padWatermark = e.target.value)} />
        <input className="in" style={{ flex: 1 }} value={st.padThirdLine || ''} placeholder="Footer line on pad (e.g. Pashto / regional language note)" onChange={e => mut(x => x.padThirdLine = e.target.value)} />
      </div>

      <h2 className="ptitle">Drug database</h2>
      <div className="frow" style={{ marginBottom: 14 }}>
        <button className="btn small ghost" onClick={async () => {
          const f = await window.api.app.openFile({ filters: [{ name: 'CSV', extensions: ['csv'] }] });
          if (!f || !f.text) return;
          const lines = f.text.split(/\r?\n/).slice(1);
          let n = 0;
          update(s => lines.forEach(l => {
            const [name, generic, form, strength, freq, days, stock, price] = l.split(',').map(x => x.trim());
            if (name && !s.medicines.some(m => m.name.toLowerCase() === name.toLowerCase())) {
              s.medicines.push({ id: 'm' + Date.now() + n, name, generic, form: form || 'Tab', strength, freq: freq || 'BD', days: Number(days) || 7, stock: stock ? Number(stock) : '', price: price ? Number(price) : '', expiry: '' }); n++;
            }
          }));
          alert('Imported ' + lines.length + ' rows from ' + f.name);
        }}>Import medicines CSV (name,generic,form,strength,freq,days,stock,price)</button>
      </div>

      <h2 className="ptitle">Prescription</h2>
      <div className="frow">
        <label className="lbl">Pad style
          <select className="in" value={st.padStyle || 'letter'} onChange={e => mut(x => x.padStyle = e.target.value)}>
            <option value="letter">Letter pad (A5/A4)</option>
            <option value="label">Sticker label (80mm)</option>
          </select></label>
        <label className="lbl">Paper size
          <select className="in" value={st.paperSize} onChange={e => mut(x => x.paperSize = e.target.value)}>
            <option value="a5">A5 pad (half A4)</option>
            <option value="a4">A4 full page</option>
          </select></label>
        <label className="lbl">Template
          <select className="in" value={st.template} onChange={e => mut(x => x.template = e.target.value)}>
            <option value="classic">Classic (navy)</option>
            <option value="modern">Modern (teal)</option>
          </select></label>
        <label className="chk"><input type="checkbox" checked={st.bilingual} onChange={e => mut(x => x.bilingual = e.target.checked)} /> Bilingual (Urdu instructions on Rx)</label>
        <label className="chk"><input type="checkbox" checked={st.showVitals} onChange={e => mut(x => x.showVitals = e.target.checked)} /> Show vitals row</label>
        <label className="chk"><input type="checkbox" checked={st.showFee} onChange={e => mut(x => x.showFee = e.target.checked)} /> Print fee on Rx</label>
      </div>
      <p className="muted">Urdu advice/instructions print best when Jameel Noori Nastaleeq is installed on Windows; otherwise Urdu Typesetting is used.</p>

      <h2 className="ptitle">Data</h2>
      <div className="frow">
        <button className="btn small ghost" onClick={loadHistory}>Snapshot history…</button>
        <button className="btn small ghost" onClick={async () => {
          const pw = prompt('Backup password:'); if (!pw) return;
          const data = JSON.stringify(store);
          const enc = 'MEDORA-ENC:' + btoa(Array.from(data).map((ch, i) => String.fromCharCode(ch.charCodeAt(0) ^ pw.charCodeAt(i % pw.length))).join(''));
          await window.api.export.toFolder({ folder: '', name: 'medora-backup-encrypted.txt', text: enc });
          alert('Encrypted backup saved to export folder.');
        }}>Encrypted backup</button>
        <button className="btn small ghost" onClick={() => window.api.app.openUserData()}>Open data folder</button>
      </div>
      {history && (
        <table className="grid">
          <tbody>
            {history.map(h => (
              <tr key={h.id}><td>{h.at.slice(0, 19).replace('T', ' ')}</td><td>{h.label}</td><td><button className="btn small ghost" onClick={() => restore(h.id)}>Restore</button></td></tr>
            ))}
            {history.length === 0 && <tr><td className="muted">No snapshots yet — snapshots are taken before deletes/imports/restores.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
