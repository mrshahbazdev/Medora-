import React, { useState } from 'react';

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
        <thead><tr><th>Doctor</th><th>Qualifications</th><th>Room</th><th></th></tr></thead>
        <tbody>
          {(st.doctors || []).map(d => (
            <tr key={d.id}>
              <td><input className="in" value={d.name} onChange={e => mut(x => { const dd = x.doctors.find(z => z.id === d.id); dd.name = e.target.value; })} /></td>
              <td><input className="in" value={d.qualifications || ''} onChange={e => mut(x => { const dd = x.doctors.find(z => z.id === d.id); dd.qualifications = e.target.value; })} /></td>
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
