import { useMemo, useState } from 'react';
import { ageText, visitPatient } from '../lib/model.js';
import { dayRegisterHtml } from '../lib/docsHtml.js';

export default function DayBookPanel({ store }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  const visits = useMemo(() =>
    store.visits.filter(v => v.date === date)
      .map(v => ({ visit: v, patient: visitPatient(store, v) }))
      .filter(r => r.patient), [store, date]);

  const monthRows = useMemo(() => {
    const m = date.slice(0, 7);
    const byDay = {};
    store.visits.forEach(v => {
      if (!v.date.startsWith(m)) return;
      byDay[v.date] = byDay[v.date] || { seen: 0, fees: 0 };
      byDay[v.date].seen += 1;
      byDay[v.date].fees += Number(v.fee) || 0;
    });
    return Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0]));
  }, [store, date]);

  const totalFees = visits.reduce((t, r) => t + (Number(r.visit.fee) || 0), 0);

  const printRegister = () => window.api.export.print({
    html: dayRegisterHtml({ store, date, rows: visits })
  });

  return (
    <div className="pwrap">
      <div className="toolbar">
        <h2 className="ptitle" style={{ margin: 0 }}>Day book</h2>
        <input className="in" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <button className="btn small ghost" onClick={() => setDate(today)}>Today</button>
        <span className="spacer" />
        <button className="btn small ghost" onClick={printRegister} title="Print OPD day register">Print day sheet</button>
      </div>

      <div className="cards">
        <div className="card"><div className="clabel">Patients seen</div><div className="cnum">{visits.length}</div><div className="csub">on {date}</div></div>
        <div className="card"><div className="clabel">Collected</div><div className="cnum">{totalFees ? `Rs ${totalFees}` : '—'}</div><div className="csub">consultation fees</div></div>
        <div className="card"><div className="clabel">Prescriptions</div><div className="cnum">{visits.filter(r => r.visit.items.length > 0).length}</div><div className="csub">with medicines</div></div>
      </div>

      <table className="grid">
        <thead><tr><th>#</th><th>MRN</th><th>Patient</th><th>Complaint</th><th>Diagnosis</th><th>Meds</th><th>Fee</th><th>Doctor</th></tr></thead>
        <tbody>
          {visits.map((r, i) => (
            <tr key={r.visit.id}>
              <td>{i + 1}</td><td>{r.patient.mrn}</td>
              <td><b>{r.patient.name}</b> <span className="muted">{r.patient.gender}, {ageText(r.patient)}</span></td>
              <td>{r.visit.complaint || '—'}</td><td>{r.visit.diagnosis || '—'}</td>
              <td>{r.visit.items.length}</td>
              <td>{Number(r.visit.fee) ? `Rs ${r.visit.fee}` : '—'}</td>
              <td className="muted">{(store.settings.doctors || []).find(d => d.id === r.visit.doctorId)?.name || ''}</td>
            </tr>
          ))}
          {visits.length === 0 && <tr><td colSpan="8" className="muted" style={{ textAlign: 'center' }}>No visits recorded on this date.</td></tr>}
        </tbody>
      </table>

      <h2 className="ptitle" style={{ marginTop: 18 }}>This month</h2>
      <table className="grid">
        <thead><tr><th>Date</th><th>Patients seen</th><th>Collected</th></tr></thead>
        <tbody>
          {monthRows.map(([d, s]) => (
            <tr key={d} style={{ cursor: 'pointer' }} onClick={() => setDate(d)}>
              <td>{d}</td><td>{s.seen}</td><td>{s.fees ? `Rs ${s.fees}` : '—'}</td>
            </tr>
          ))}
          {monthRows.length === 0 && <tr><td colSpan="3" className="muted">No visits this month.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
