import { useState } from 'react';
import { monthlyReportHtml } from '../lib/docsHtml.js';

export default function StatsPanel({ store, update }) {
  const today = new Date().toISOString().slice(0, 10);
  const [month, setMonth] = useState(today.slice(0, 7));

  const visits = store.visits.filter(v => v.date.startsWith(month));
  const income = visits.reduce((a, v) => a + (Number(v.fee) || 0), 0);
  const expenses = (store.expenses || []).filter(e => e.date.startsWith(month));
  const expTotal = expenses.reduce((a, e) => a + (Number(e.amount) || 0), 0);
  const admissions = (store.admissions || []).filter(a => (a.admittedOn || '').startsWith(month));
  const vacDone = (store.vaccines || []).filter(v => (v.doneAt || '').startsWith(month));
  const dxCounts = {};
  visits.forEach(v => { if (v.diagnosis) dxCounts[v.diagnosis] = (dxCounts[v.diagnosis] || 0) + 1; });
  const dx = Object.entries(dxCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const doctorShare = {};
  visits.forEach(v => {
    const did = v.doctorId || (store.settings.doctors || [])[0]?.id || 'clinic';
    doctorShare[did] = doctorShare[did] || { count: 0, fees: 0 };
    doctorShare[did].count++; doctorShare[did].fees += Number(v.fee) || 0;
  });
  const doctorName = (id) => (store.settings.doctors || []).find(d => d.id === id)?.name || store.settings.doctorName || 'Clinic';

  const rows = [
    { label: 'Patients seen (OPD visits)', value: String(visits.length) },
    { label: 'New patients registered', value: String(store.patients.filter(p => (p.registeredOn || '').startsWith(month)).length) },
    { label: 'Consultation income', value: `Rs ${income}` },
    { label: 'Expenses', value: `Rs ${expTotal}` },
    { label: 'Net for the month', value: `Rs ${income - expTotal}` },
    { label: 'Admissions (IPD)', value: String(admissions.length) },
    { label: 'Vaccines given', value: String(vacDone.length) },
    ...Object.entries(doctorShare).map(([id, d]) => ({ label: `Share — ${doctorName(id)}`, value: `${d.count} visits · Rs ${d.fees}` }))
  ];

  return (
    <div className="panel">
      <h2 className="ptitle">Monthly report — <input type="month" className="in" style={{ width: 'auto' }} value={month} onChange={e => setMonth(e.target.value)} /></h2>
      <div className="cards" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="card"><div className="clabel">Visits</div><div className="cval">{visits.length}</div></div>
        <div className="card ok"><div className="clabel">Income</div><div className="cval">{income}</div></div>
        <div className="card"><div className="clabel">Expenses</div><div className="cval">{expTotal}</div></div>
        <div className="card ok"><div className="clabel">Net</div><div className="cval">{income - expTotal}</div></div>
      </div>

      <h3 className="ptitle">Doctor-wise fee share</h3>
      <table className="grid">
        <thead><tr><th>Doctor</th><th>Visits</th><th>Fees</th><th>Share (net)</th></tr></thead>
        <tbody>
          {Object.entries(doctorShare).map(([id, d]) => (
            <tr key={id}><td><b>{doctorName(id)}</b></td><td>{d.count}</td><td>Rs {d.fees}</td><td>Rs {Math.round(d.fees * (d.fees ? (income - expTotal) / (income || 1) : 1))}</td></tr>
          ))}
          {!Object.keys(doctorShare).length && <tr><td colSpan="4" className="muted">No visits this month.</td></tr>}
        </tbody>
      </table>

      <h3 className="ptitle">Top diagnoses</h3>
      <div>{dx.map(([d, n]) => <span key={d} className="dxchip">{d} <b>×{n}</b></span>)}</div>

      <div className="frow" style={{ marginTop: 18 }}>
        <button className="btn" onClick={() => window.api.export.print({ html: monthlyReportHtml({ store, month, rows }) })}>Print monthly report</button>
      </div>
    </div>
  );
}
