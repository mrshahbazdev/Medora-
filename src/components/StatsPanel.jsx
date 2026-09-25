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
            <tr key={id}><td><b>{doctorName(id)}</b></td><td>{d.count}</td><td>Rs {d.fees}</td><td>Rs {(() => { const doc = (store.settings.doctors || []).find(x => x.id === id); return doc && doc.share ? Math.round(d.fees * doc.share / 100) : Math.round(d.fees * (d.fees ? (income - expTotal) / (income || 1) : 1)); })()}</td></tr>
          ))}
          {!Object.keys(doctorShare).length && <tr><td colSpan="4" className="muted">No visits this month.</td></tr>}
        </tbody>
      </table>

      <h3 className="ptitle">Referral log</h3>
      <table className="grid">
        <thead><tr><th>Date</th><th>Patient</th><th>Referred to</th><th>Reason</th></tr></thead>
        <tbody>
          {(store.referrals || []).slice(-10).reverse().map(r => {
            const p = store.patients.find(x => x.id === r.patientId);
            return <tr key={r.id}><td>{r.date}</td><td>{p ? p.name : '?'}</td><td>{r.toFacility}</td><td>{r.reason}</td></tr>;
          })}
          {(store.referrals || []).length === 0 && <tr><td colSpan="4" className="muted">No referrals logged — use the Referral button on an Rx.</td></tr>}
        </tbody>
      </table>

      <h3 className="ptitle">Annual disease register</h3>
      <table className="grid">
        <thead><tr><th>Diagnosis</th><th>This year</th></tr></thead>
        <tbody>
          {(() => { const year = month.slice(0, 4); const c = {};
            store.visits.filter(v => v.date.startsWith(year) && v.diagnosis).forEach(v => { c[v.diagnosis] = (c[v.diagnosis] || 0) + 1; });
            const e = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 20);
            return e.length ? e.map(([k, n]) => <tr key={k}><td>{k}</td><td><b>{n}</b></td></tr>) : <tr><td colSpan="2" className="muted">No diagnoses this year.</td></tr>; })()}
        </tbody>
      </table>

      <h3 className="ptitle">Insurance / panel claims</h3>
      <table className="grid">
        <thead><tr><th>Insurer</th><th>Visits</th><th>Billed</th></tr></thead>
        <tbody>
          {(() => { const c = {}; store.visits.filter(v => v.date.startsWith(month)).forEach(v => {
              const p = store.patients.find(x => x.id === v.patientId);
              if (p && p.insurance) { c[p.insurance] = c[p.insurance] || { n: 0, amt: 0 }; c[p.insurance].n++; c[p.insurance].amt += Number(v.fee) || 0; } });
            const e = Object.entries(c);
            return e.length ? e.map(([k, x]) => <tr key={k}><td>{k}</td><td><b>{x.n}</b></td><td>Rs {x.amt}</td></tr>) : <tr><td colSpan="3" className="muted">No panel patients seen this month.</td></tr>; })()}
        </tbody>
      </table>

      <h3 className="ptitle">Doctor time</h3>
      <table className="grid">
        <thead><tr><th>Metric</th><th>Value</th></tr></thead>
        <tbody>
          {(() => { const vs = store.visits.filter(v => v.date.startsWith(month) && v.consultMinutes);
            const avg = vs.length ? Math.round(vs.reduce((a, v) => a + v.consultMinutes, 0) / vs.length) : null;
            return <tr><td>Avg consult time this month</td><td><b>{avg != null ? avg + ' min' : '—'}</b></td></tr>; })()}
        </tbody>
      </table>

      <h3 className="ptitle">Expenses by category (P&L)</h3>
      <table className="grid">
        <thead><tr><th>Category</th><th>Amount</th></tr></thead>
        <tbody>
          {(() => { const c = {}; (store.expenses || []).filter(e => e.date.startsWith(month)).forEach(e => { const k = e.category || 'Other'; c[k] = (c[k] || 0) + Number(e.amount || 0); });
            const e = Object.entries(c).sort((a, b) => b[1] - a[1]);
            return e.length ? e.map(([k, n]) => <tr key={k}><td>{k}</td><td><b>Rs {n}</b></td></tr>) : <tr><td colSpan="2" className="muted">No expenses this month.</td></tr>; })()}
        </tbody>
      </table>

      <h3 className="ptitle">Referral sources</h3>
      <table className="grid">
        <thead><tr><th>Referred by</th><th>Patients</th></tr></thead>
        <tbody>
          {(() => { const c = {}; store.patients.forEach(p => { const r = p.referredBy || 'Walk-in / self'; c[r] = (c[r] || 0) + 1; });
            return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([r, n]) => <tr key={r}><td>{r}</td><td><b>{n}</b></td></tr>); })()}
        </tbody>
      </table>

      <h3 className="ptitle">Chronic disease register</h3>
      <table className="grid">
        <thead><tr><th>Condition</th><th>Patients</th></tr></thead>
        <tbody>
          {(() => { const c = {}; store.patients.filter(p => p.chronic).forEach(p => { c[p.chronic] = (c[p.chronic] || 0) + 1; });
            const e = Object.entries(c).sort((a, b) => b[1] - a[1]);
            return e.length ? e.map(([k, n]) => <tr key={k}><td>{k}</td><td><b>{n}</b></td></tr>) : <tr><td colSpan="2" className="muted">No chronic patients flagged.</td></tr>; })()}
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
