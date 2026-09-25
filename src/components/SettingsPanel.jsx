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
      </div>

      <h2 className="ptitle">Prescription</h2>
      <div className="frow">
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
