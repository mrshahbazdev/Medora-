import { useState } from 'react';
import { newVaccine, patientMrn, ageText } from '../lib/model.js';
import { vaccinationCardHtml } from '../lib/docsHtml.js';

const EPI = [
  { vaccine: 'BCG + OPV-0', weeks: 0 },
  { vaccine: 'Penta-1 + PCV-1 + OPV-1 + Rota-1', weeks: 6 },
  { vaccine: 'Penta-2 + PCV-2 + OPV-2 + Rota-2', weeks: 10 },
  { vaccine: 'Penta-3 + PCV-3 + OPV-3 + IPV', weeks: 14 },
  { vaccine: 'Measles-1 + MMR', weeks: 39 },
  { vaccine: 'Measles-2 + MMR-2', weeks: 65 }
];

export default function VaccinesPanel({ store, update }) {
  const today = new Date().toISOString().slice(0, 10);
  const [pick, setPick] = useState('');

  const vaccines = store.vaccines || [];
  const childPatients = store.patients.filter(p => (p.ageUnit === 'y' && Number(p.age) <= 5) || p.ageUnit === 'm' || p.ageUnit === 'd');
  const due = vaccines.filter(v => !v.doneAt && v.dueAt <= today);

  const schedule = (pid) => {
    const p = store.patients.find(x => x.id === pid);
    if (!p) return;
    const dob = p.dob || today;
    update(s => {
      s.vaccines = s.vaccines || [];
      EPI.forEach(e => {
        const due = new Date(dob); due.setDate(due.getDate() + e.weeks * 7);
        const d = due.toISOString().slice(0, 10);
        if (!s.vaccines.some(v => v.patientId === pid && v.vaccine === e.vaccine))
          s.vaccines.push(newVaccine(pid, { vaccine: e.vaccine, dueAt: d }));
      });
    });
  };

  const printCard = (pid) => {
    const p = store.patients.find(x => x.id === pid);
    const vs = vaccines.filter(v => v.patientId === pid).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    if (p && vs.length) window.api.export.print({ html: vaccinationCardHtml({ store, patient: p, vaccines: vs }) });
  };

  return (
    <div className="panel">
      <h2 className="ptitle">Vaccination (EPI schedule)</h2>
      <div className="frow">
        <select className="in" value={pick} onChange={e => setPick(e.target.value)}>
          <option value="">Select child…</option>
          {(childPatients.length ? childPatients : store.patients).map(p => <option key={p.id} value={p.id}>{p.name} · {ageText(p)}</option>)}
        </select>
        <button className="btn" onClick={() => pick && schedule(pick)}>Generate EPI schedule</button>
        <button className="btn small ghost" onClick={() => {
          const today = new Date().toISOString().slice(0, 10);
          const due = (store.vaccines || []).filter(v => !v.given && v.dueDate && v.dueDate <= today);
          const text = 'Vaccines due:\n' + due.map(v => {
            const p = store.patients.find(x => x.id === v.patientId);
            return `• ${p ? p.name : v.patientId} — ${v.vaccine} (due ${v.dueDate}) ${(p && p.phone) || ''}`;
          }).join('\n');
          navigator.clipboard.writeText(text); alert(due.length + ' due vaccine(s) copied to clipboard.');
        }}>Due list (copy)</button>
      </div>

      {due.length > 0 && (
        <div className="warn" style={{ marginBottom: 14 }}>
          💉 {due.length} vaccine(s) due: {due.slice(0, 4).map(v => `${store.patients.find(p => p.id === v.patientId)?.name || '?'} (${v.vaccine})`).join(', ')}{due.length > 4 ? '…' : ''}
        </div>)}

      {(() => {
        const byP = {};
        vaccines.forEach(v => { (byP[v.patientId] = byP[v.patientId] || []).push(v); });
        const ids = Object.keys(byP);
        if (!ids.length) return <p className="muted">No vaccination schedules yet — select a child and generate the EPI schedule.</p>;
        return ids.map(pid => {
          const p = store.patients.find(x => x.id === pid);
          const rows = byP[pid].sort((a, b) => a.dueAt.localeCompare(b.dueAt));
          return (
            <div key={pid} style={{ marginBottom: 18 }}>
              <h3 className="ptitle" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {p ? `${p.name} · ${patientMrn(p)}` : pid}
                <button className="btn small ghost" onClick={() => printCard(pid)}>Print card</button>
              </h3>
              <table className="grid">
                <thead><tr><th>Vaccine</th><th>Due</th><th>Status</th><th></th></tr></thead>
                <tbody>{rows.map(v => (
                  <tr key={v.id}>
                    <td>{v.vaccine}</td><td>{v.dueAt}</td>
                    <td>{v.doneAt ? <span className="badge ok">Done {v.doneAt}</span> : (v.dueAt <= today ? <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>Due</span> : <span className="muted">Upcoming</span>)}</td>
                    <td>{!v.doneAt && <button className="btn small ghost" onClick={() => update(s => { s.vaccines.find(x => x.id === v.id).doneAt = today; })}>Mark given</button>}</td>
                  </tr>))}</tbody>
              </table>
            </div>
          );
        });
      })()}
    </div>
  );
}
