import { useState } from 'react';
import { newLab, patientMrn, ageText, uid } from '../lib/model.js';
import { labReportHtml } from '../lib/docsHtml.js';
import { INVESTIGATION_PRESETS } from '../lib/meds.js';

export default function LabPanel({ store, update }) {
  const [pick, setPick] = useState('');
  const [test, setTest] = useState('');
  const [result, setResult] = useState('');
  const [note, setNote] = useState('');
  const [bbName, setBbName] = useState('');
  const [bbGroup, setBbGroup] = useState('O+');
  const [bbPhone, setBbPhone] = useState('');

  const labs = (store.labs || []).slice().sort((a, b) => b.date.localeCompare(a.date));

  const add = () => {
    if (!pick || !test.trim()) return;
    update(s => { s.labs = s.labs || []; s.labs.push(newLab(pick, { test, result, note })); });
    setTest(''); setResult(''); setNote('');
  };

  const printFor = (patientId) => {
    const patient = store.patients.find(p => p.id === patientId);
    const labs = (store.labs || []).filter(l => l.patientId === patientId);
    if (patient && labs.length) window.api.export.print({ html: labReportHtml({ store, patient, labs }) });
  };

  const byPatient = {};
  labs.forEach(l => { (byPatient[l.patientId] = byPatient[l.patientId] || []).push(l); });

  return (
    <div className="panel">
      <h2 className="ptitle">Lab reports</h2>
      <div className="frow">
        <select className="in" value={pick} onChange={e => setPick(e.target.value)}>
          <option value="">Select patient…</option>
          {store.patients.map(p => <option key={p.id} value={p.id}>{p.name} · {patientMrn(p)}</option>)}
        </select>
        <input className="in" list="labtests" placeholder="Test (e.g. CBC)" value={test} onChange={e => setTest(e.target.value)} />
        <datalist id="labtests">{INVESTIGATION_PRESETS.map(t => <option key={t} value={t} />)}</datalist>
        <input className="in" placeholder="Result (e.g. Hb 11.2)" value={result} onChange={e => setResult(e.target.value)} />
        <input className="in" placeholder="Note / reference" value={note} onChange={e => setNote(e.target.value)} />
        <button className="btn" onClick={add}>+ Result</button>
      </div>

      {Object.keys(byPatient).length === 0 && <p className="muted">No lab results recorded yet.</p>}
      {Object.entries(byPatient).map(([pid, rows]) => {
        const p = store.patients.find(x => x.id === pid);
        return (
          <div key={pid} style={{ marginBottom: 18 }}>
            <h3 className="ptitle" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {p ? `${p.name} · ${patientMrn(p)} · ${ageText(p)}` : pid}
              <button className="btn small ghost" onClick={() => printFor(pid)}>Print report</button>
            </h3>
            <table className="grid">
              <thead><tr><th>Test</th><th>Status</th><th>Result</th><th>Note</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {rows.map(l => (
                  <tr key={l.id}>
                    <td>{l.test}</td>
                    <td><select className="in" style={{ width: 95, padding: '2px 6px', fontSize: 11 }} value={l.status || (l.result ? 'done' : 'ordered')} onChange={e => update(s => { const x = s.labs.find(z => z.id === l.id); if (x) x.status = e.target.value; })}>
                      <option value="ordered">Ordered</option><option value="pending">Pending</option><option value="done">Done</option>
                    </select></td>
                    <td><b>{l.result}</b></td><td>{l.note}</td><td>{l.date}</td>
                    <td><button className="icon" onClick={() => update(s => s.labs = s.labs.filter(x => x.id !== l.id))} aria-label="Delete">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
      <h3 className="ptitle" style={{ marginTop: 16 }}>Blood bank register</h3>
      <div className="frow" style={{ marginBottom: 8 }}>
        <input className="in" style={{ width: 140 }} value={bbName} placeholder="Donor name" onChange={e => setBbName(e.target.value)} />
        <select className="in" style={{ width: 80 }} value={bbGroup} onChange={e => setBbGroup(e.target.value)}>
          {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(g => <option key={g}>{g}</option>)}
        </select>
        <input className="in" style={{ width: 130 }} value={bbPhone} placeholder="Phone" onChange={e => setBbPhone(e.target.value)} />
        <button className="btn small" onClick={() => { if (!bbName) return; update(s => (s.bloodBank = s.bloodBank || []).push({ id: uid(), name: bbName, group: bbGroup, phone: bbPhone, date: new Date().toISOString().slice(0, 10), status: 'available' })); setBbName(''); setBbPhone(''); }}>+ Donor</button>
      </div>
      <table className="grid">
        <thead><tr><th>Donor</th><th>Group</th><th>Phone</th><th>Donated</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {(store.bloodBank || []).map(b => (
            <tr key={b.id}>
              <td><b>{b.name}</b></td><td>{b.group}</td><td>{b.phone}</td><td>{b.date}</td>
              <td><select className="in" style={{ width: 100, padding: '2px 6px', fontSize: 11 }} value={b.status || 'available'} onChange={e => update(s => { const x = s.bloodBank.find(z => z.id === b.id); if (x) x.status = e.target.value; })}>
                <option>available</option><option>used</option><option>deferred</option>
              </select></td>
              <td><button className="icon" onClick={() => update(s => s.bloodBank = s.bloodBank.filter(x => x.id !== b.id))}>✕</button></td>
            </tr>))}
          {(store.bloodBank || []).length === 0 && <tr><td colSpan="6" className="muted">No donors registered.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
