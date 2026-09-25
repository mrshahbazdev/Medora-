import { useState } from 'react';
import { newAdmission, ageText, uid } from '../lib/model.js';
import { dischargeSummaryHtml } from '../lib/docsHtml.js';
import { medBillHtml } from '../lib/docsHtml.js';

export default function AdmissionsPanel({ store, update }) {
  const [pick, setPick] = useState('');
  const [ward, setWard] = useState(store.settings.wards?.[0] || '');
  const [bed, setBed] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  const admit = () => {
    if (!pick) return;
    update(s => s.admissions.push({ ...newAdmission(pick, { ward, bed, doctorId }) }));
    setPick(''); setBed('');
  };

  const discharge = (adm, patient) => {
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
            <button className="btn small ghost" onClick={() => discharge(a, p)}>Discharge + summary</button>
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
    </div>
  );
}
