import { ipdChartHtml, ioChartHtml, vitalsChartHtml, deathCertHtml, otListHtml } from '../lib/docsHtml.js';
import { useState } from 'react';
import { newAdmission, ageText, uid } from '../lib/model.js';
import { dischargeSummaryHtml } from '../lib/docsHtml.js';
import { medBillHtml } from '../lib/docsHtml.js';

export default function AdmissionsPanel({ store, update }) {
  const today = new Date().toISOString().slice(0, 10);
  const [pick, setPick] = useState('');
  const [otDate, setOtDate] = useState(today);
  const [otPick, setOtPick] = useState('');
  const [otTime, setOtTime] = useState('10:00');
  const [otProc, setOtProc] = useState('');
  const [otSurgeon, setOtSurgeon] = useState('');
  const [otAnes, setOtAnes] = useState('');
  const [ward, setWard] = useState(store.settings.wards?.[0] || '');
  const [bed, setBed] = useState('');
  const [doctorId, setDoctorId] = useState('');

  const admit = () => {
    if (!pick) return;
    update(s => s.admissions.push({ ...newAdmission(pick, { ward, bed, doctorId }) }));
    setPick(''); setBed('');
  };

  const discharge = (adm, patient) => {
    if (!confirm('Checklist — medicines counselled?')) return;
    if (!confirm('Checklist — reports handed over?')) return;
    if (!confirm('Checklist — follow-up booked?')) return;
    if (!confirm('Checklist — bill settled?')) return;
    const note = prompt('Discharge advice', 'Continue medicines as advised. Follow up in OPD.');
    if (note === null) return;
    update(s => {
      const a = (s.admissions = s.admissions || []).find(x => x.id === adm.id);
      a.dischargedOn = today; a.dischargeNote = note;
    });
    window.api.export.print({ html: dischargeSummaryHtml({ store, patient, adm: { ...adm, dischargedOn: today, dischargeNote: note } }) });
    const rate = Number((adm.ward || '').split('@')[1]) || 0;
    const days = Math.max(1, Math.round((new Date(today) - new Date(adm.admittedOn)) / 86400000));
    if (rate) {
      const items = [{ name: `${adm.ward.split('@')[0].trim()} — ${days} day(s)`, qty: days, price: rate }];
      window.api.export.print({ html: medBillHtml({ store, patient, items, total: days * rate }) });
      update(s => { s.sales = s.sales || []; s.sales.push({ id: uid(), patientId: patient.id, date: today, items, total: days * rate, kind: 'ipd' }); });
    }
  };

  const active = (store.admissions || []).filter(a => !a.dischargedOn);
  const past = (store.admissions || []).filter(a => a.dischargedOn);

  return (
    <div className="pwrap">
      <div className="toolbar">
        <h2 className="ptitle" style={{ margin: 0 }}>Admissions & wards</h2>
        <span className="spacer" />
        <select className="in" value={pick} onChange={e => setPick(e.target.value)}>
          <option value="">Admit patient…</option>
          {store.patients.map(p => <option key={p.id} value={p.id}>{p.name} — MRN {p.mrn}</option>)}
        </select>
        <select className="in" value={ward} onChange={e => setWard(e.target.value)}>
          {(store.settings.wards || []).map(w => <option key={w}>{w}</option>)}
          {/* Ward name may carry a daily rate: "Private Room @3000" — used for the discharge bill */}
        </select>
        <input className="in" style={{ width: 90 }} value={bed} placeholder="Bed #" onChange={e => setBed(e.target.value)} />
        {(store.settings.doctors || []).length > 0 && (
          <select className="in" value={doctorId} onChange={e => setDoctorId(e.target.value)}>
            <option value="">Doctor</option>
            {store.settings.doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>)}
        <button className="btn" onClick={admit}>Admit</button>
      </div>

      <h3 className="ptitle">In-house now ({active.length})</h3>
      {active.map(a => {
        const p = store.patients.find(x => x.id === a.patientId);
        if (!p) return null;
        const doc = (store.settings.doctors || []).find(d => d.id === a.doctorId);
        return (
          <div className="qrow" key={a.id}>
            <div className="qnum" style={{ background: '#b45309' }}>⌂</div>
            <div style={{ flex: 1 }}>
              <b>{p.name}</b> <span className="muted">{p.gender}, {ageText(p)} · MRN {p.mrn}</span>
              <div className="muted" style={{ fontSize: 11.5 }}>
                {a.ward}{a.bed ? ` · Bed ${a.bed}` : ''} · since {a.admittedOn}{doc ? ` · ${doc.name}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button className="btn small ghost" onClick={() => { const note = prompt('Nurse note (observation):'); if (note) update(s => { const x = s.admissions.find(z => z.id === a.id); if (x) (x.nursing = x.nursing || []).push({ at: new Date().toISOString().slice(0, 16).replace('T', ' '), note }); }); }}>+ Note</button>
              <button className="btn small ghost" onClick={() => {
                const bp = prompt('BP (120/80):'); const pulse = prompt('Pulse:'); const temp = prompt('Temp F:'); const spo2 = prompt('SpO2 %:');
                update(s => { const x = s.admissions.find(z => z.id === a.id); if (x) (x.vitals = x.vitals || []).push({ at: new Date().toISOString().slice(0, 16).replace('T', ' '), bp, pulse, temp, spo2 }); });
              }}>+ Vitals</button>
              <button className="btn small ghost" onClick={() => { const note = prompt('Progress note / order:'); if (note) update(s => { const x = s.admissions.find(z => z.id === a.id); if (x) (x.progress = x.progress || []).push({ at: new Date().toISOString().slice(0, 16).replace('T', ' '), note }); }); }}>+ Progress</button>
              <button className="btn small ghost" onClick={() => { const kind = prompt('In or Out?'); const ml = prompt('ml:'); if (ml) update(s => { const x = s.admissions.find(z => z.id === a.id); if (x) (x.io = x.io || []).push({ at: new Date().toISOString().slice(0, 16).replace('T', ' '), kind: (kind || 'In'), ml: Number(ml) }); }); }}>+ I/O</button>
              <button className="btn small ghost" onClick={() => window.api.export.print({ html: ipdChartHtml({ store, patient: p, admission: a }) })}>Chart</button>
              <button className="btn small ghost" onClick={() => window.api.export.print({ html: vitalsChartHtml({ store, patient: p, adm: a }) })}>Vitals📈</button>
              <button className="btn small ghost" onClick={() => window.api.export.print({ html: ioChartHtml({ store, patient: p, adm: a }) })}>I/O📄</button>
              <button className="btn small ghost" onClick={() => { const doc = (store.settings.doctors || []).find(d => d.id === a.doctorId); window.api.export.print({ html: deathCertHtml({ store, patient: p, adm: a, doctor: doc }) }); }}>Death cert</button>
              <button className="btn small ghost" onClick={() => discharge(a, p)}>Discharge + summary</button>
            </div>
          </div>
        );
      })}
      {active.length === 0 && <p className="muted">No patients admitted right now.</p>}

      <h3 className="ptitle" style={{ marginTop: 16 }}>Recent discharges</h3>
      {past.map(a => {
        const p = store.patients.find(x => x.id === a.patientId);
        if (!p) return null;
        return (
          <div className="qrow" key={a.id}>
            <div className="qnum" style={{ background: 'var(--cta)' }}>✓</div>
            <div style={{ flex: 1 }}>
              <b>{p.name}</b> <span className="muted">{a.ward} · {a.admittedOn} → {a.dischargedOn}</span>
            </div>
            <button className="btn small ghost" onClick={() => window.api.export.print({ html: dischargeSummaryHtml({ store, patient: p, adm: a }) })}>Print summary</button>
          </div>
        );
      })}
      {past.length === 0 && <p className="muted">No discharges yet.</p>}

      <h3 className="ptitle" style={{ marginTop: 16 }}>OT schedule</h3>
      <div className="toolbar" style={{ marginTop: 0 }}>
        <input className="in" type="date" value={otDate} onChange={e => setOtDate(e.target.value)} />
        <select className="in" value={otPick} onChange={e => setOtPick(e.target.value)}><option value="">Patient…</option>
          {store.patients.map(p => <option key={p.id} value={p.id}>{p.name} · {p.mrn}</option>)}
        </select>
        <input className="in" style={{ width: 70 }} type="time" value={otTime} onChange={e => setOtTime(e.target.value)} />
        <input className="in" style={{ flex: 1 }} value={otProc} placeholder="Procedure" onChange={e => setOtProc(e.target.value)} />
        <input className="in" style={{ width: 130 }} value={otSurgeon} placeholder="Surgeon" onChange={e => setOtSurgeon(e.target.value)} />
        <input className="in" style={{ width: 100 }} value={otAnes} placeholder="Anesthesia" onChange={e => setOtAnes(e.target.value)} />
        <button className="btn small" onClick={() => { if (!otPick || !otProc) return; update(s => (s.otSchedule = s.otSchedule || []).push({ id: uid(), date: otDate, time: otTime, patientId: otPick, procedure: otProc, surgeon: otSurgeon, anesthesia: otAnes, status: 'scheduled' })); setOtProc(''); setOtTime(''); }}>+ OT</button>
        <button className="btn small ghost" onClick={() => window.api.export.print({ html: otListHtml({ store, date: otDate }) })}>Print OT list</button>
      </div>
      <table className="grid">
        <thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Procedure</th><th>Surgeon</th><th>Status</th></tr></thead>
        <tbody>
          {(store.otSchedule || []).slice(-8).reverse().map(o => {
            const p = store.patients.find(x => x.id === o.patientId);
            return <tr key={o.id}><td>{o.date}</td><td>{o.time}</td><td>{p?.name || '?'}</td><td>{o.procedure}</td><td>{o.surgeon}</td>
              <td><select className="in" style={{ padding: '2px 6px', fontSize: 11 }} value={o.status || 'scheduled'} onChange={e => update(s => { const x = s.otSchedule.find(z => z.id === o.id); if (x) x.status = e.target.value; })}>
                <option>scheduled</option><option>done</option><option>postponed</option><option>cancelled</option></select></td></tr>;
          })}
          {(store.otSchedule || []).length === 0 && <tr><td colSpan="6" className="muted">No OT cases scheduled.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
