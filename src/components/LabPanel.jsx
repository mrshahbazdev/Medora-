import { useState } from 'react';
import { newLab, patientMrn, ageText, uid } from '../lib/model.js';
import { labReportHtml } from '../lib/docsHtml.js';
import { INVESTIGATION_PRESETS } from '../lib/meds.js';

export default function LabPanel({ store, update }) {
  const [pick, setPick] = useState('');
  const [test, setTest] = useState('');
  const [result, setResult] = useState('');
  const [note, setNote] = useState('');

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
              <thead><tr><th>Test</th><th>Result</th><th>Note</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {rows.map(l => (
                  <tr key={l.id}>
                    <td>{l.test}</td><td><b>{l.result}</b></td><td>{l.note}</td><td>{l.date}</td>
                    <td><button className="icon" onClick={() => update(s => s.labs = s.labs.filter(x => x.id !== l.id))} aria-label="Delete">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
