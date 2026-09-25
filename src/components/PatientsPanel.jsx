import React, { useEffect, useMemo, useState } from 'react';
import { newPatient, newVisit, patientMrn, patientVisits, ageText, uid, nextToken } from '../lib/model.js';
import { patientCardHtml, ancCardHtml } from '../lib/docsHtml.js';
import RxEditor from './RxEditor.jsx';

export default function PatientsPanel({ store, update, patientId, setPatientId, rxVisitId, setRxVisitId, user }) {
  const [q, setQ] = useState('');

  // openRx(patientId, 'new') from Dashboard/Queue lands here: materialise the visit.
  useEffect(() => {
    if (rxVisitId === 'new' && patientId) {
      const v = newVisit(patientId);
      update(s => s.visits.unshift(v));
      setRxVisitId(v.id);
    }
  }, [rxVisitId, patientId]);
  const [chronicOnly, setChronicOnly] = useState(false);
  const patients = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const base = chronicOnly ? store.patients.filter(p => p.chronic) : store.patients;
    if (!needle) return base;
    return store.patients.filter(p =>
      p.name.toLowerCase().includes(needle) || p.mrn.includes(needle) || (p.phone || '').includes(needle));
  }, [store.patients, q, chronicOnly]);

  const patient = store.patients.find(p => p.id === patientId) || null;
  const rxVisit = rxVisitId ? store.visits.find(v => v.id === rxVisitId) : null;
  const visits = patient ? patientVisits(store, patient.id) : [];

  const addPatient = () => {
    const p = newPatient();
    p.mrn = patientMrn(store);
    update(s => s.patients.unshift(p));
    setPatientId(p.id); setRxVisitId(null);
  };

  const newRx = (pid) => {
    const v = newVisit(pid);
    update(s => s.visits.unshift(v));
    setRxVisitId(v.id);
  };

  const delPatient = async (pid) => {
    const p = store.patients.find(x => x.id === pid);
    if (!confirm(`Delete ${p?.name} and all their visits? A snapshot is taken first.`)) return;
    await window.api.store.snapshot(store, `before deleting patient ${p?.mrn}`);
    update(s => { s.patients = s.patients.filter(x => x.id !== pid); s.visits = s.visits.filter(v => v.patientId !== pid); s.queue = s.queue.filter(x => x.patientId !== pid); });
    setPatientId(null); setRxVisitId(null);
  };

  return (
    <div className="patsplit">
      <div className="plist">
        <div className="searchrow">
          <input className="in" placeholder="Search name, MRN or phone…" value={q} onChange={e => setQ(e.target.value)} autoFocus />
        </div>
        <div className="searchrow" style={{ position: 'static', display: 'flex', gap: 6 }}>
          <button className="btn" style={{ flex: 1 }} onClick={addPatient}>+ New patient</button>
          <button className={'chip' + (chronicOnly ? ' on' : '')} onClick={() => setChronicOnly(x => !x)} title="Chronic disease register">Chronic</button>
          <button className="chip" title="Export patients + visits as Excel" onClick={async () => {
            const esc = x => String(x ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
            const rows = store.patients.map(p => {
              const vs = store.visits.filter(v => v.patientId === p.id);
              return `<tr><td>${esc(p.mrn)}</td><td>${esc(p.name)}</td><td>${esc(p.age)} ${esc(p.ageUnit)}</td><td>${esc(p.gender)}</td><td>${esc(p.phone)}</td><td>${esc(p.chronic)}</td><td>${vs.length}</td><td>${vs.reduce((t, v) => t + (Number(v.fee) || 0), 0)}</td></tr>`;
            }).join('');
            const xls = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><meta charset="utf-8"><table><tr><th>MRN</th><th>Name</th><th>Age</th><th>Gender</th><th>Phone</th><th>Chronic</th><th>Visits</th><th>Fees Rs</th></tr>${rows}</table></html>`;
            await window.api.export.toFolder({ folder: '', name: 'medora-patients.xls', text: xls });
            alert('Excel file saved to export folder.');
          }}>Excel</button>
        </div>
        {patients.map(p => (
          <div key={p.id} className={'prow' + (p.id === patientId ? ' on' : '')} onClick={() => { setPatientId(p.id); setRxVisitId(null); }}>
            <div className="pname">{p.name}</div>
            <div className="pmeta">{p.gender}{p.gender ? ' · ' : ''}{ageText(p)} · MRN {p.mrn}{p.allergies ? ' · ⚠ ' + p.allergies : ''}</div>
          </div>
        ))}
        {patients.length === 0 && <div className="prow muted">No patients match.</div>}
      </div>

      <div className="pdetail">
        {!patient && !rxVisit && <p className="muted">Select a patient or add a new one.</p>}

        {rxVisit && patient && (
          <RxEditor store={store} update={update} patient={patient} visit={rxVisit} close={() => setRxVisitId(null)} user={user} />
        )}

        {patient && !rxVisit && (
          <>
            <div className="etoolbar">
              <input className="in" style={{ width: 150 }} placeholder="Scan / MRN" title="Barcode scanner ya MRN type karke Enter"
                onKeyDown={e => {
                  if (e.key !== 'Enter') return;
                  const v = e.target.value.trim();
                  const p = store.patients.find(x => (x.mrn || '') === v || x.mrn === v.padStart(4, '0'));
                  if (p) { setPatientId(p.id); e.target.value = ''; }
                  else alert('No patient with MRN ' + v);
                }} />
              <h2 style={{ margin: 0, flex: 1 }}>{patient.name} <span className="muted">MRN {patient.mrn}</span></h2>
              <button className="btn" onClick={() => newRx(patient.id)}>+ New visit / Rx</button>
              <button className="btn small ghost" onClick={() => update(s => { const d = new Date().toISOString().slice(0, 10); s.queue.push({ id: uid(), patientId: patient.id, at: d, tokenNo: nextToken(s, d), room: s.settings.rooms?.[0] || '', doctorId: '', status: 'waiting', createdAt: Date.now(), note: '' }); })}>Add to today's queue</button>
              <button className="btn small ghost" onClick={() => window.api.export.print({ html: patientCardHtml({ store, patient }) })}>Print card</button>
              {patient.insurance && <button className="btn small ghost" title="Insurance claim form" onClick={() => window.api.export.print({ html: claimFormHtml({ store, patient, insurer: patient.insurance, visits: visits.filter(v => v.fee) }) })}>Claim form</button>}
              {visits.some(v => v.type === 'anc' || (v.anc && (v.anc.gravida || v.anc.edd))) &&
                <button className="btn small ghost" onClick={() => window.api.export.print({ html: ancCardHtml({ store, patient, visits }) })}>ANC card</button>}
              <button className="btn small ghost" title="Merge this patient into another record" onClick={async () => {
                const target = prompt('Merge INTO MRN (this record will be removed):', '');
                if (!target) return;
                const to = store.patients.find(x => x.mrn === target.trim() || x.mrn === target.trim().padStart(4, '0'));
                if (!to || to.id === patient.id) { alert('Target patient not found.'); return; }
                if (!confirm(`Move all ${patient.name}'s visits into ${to.name} (MRN ${to.mrn})?`)) return;
                await window.api.store.snapshot(store, `before merging ${patient.mrn} into ${to.mrn}`);
                update(s => {
                  ['visits', 'labs', 'vaccines', 'admissions', 'queue', 'appointments'].forEach(k => {
                    (s[k] || []).forEach(r => { if (r.patientId === patient.id) r.patientId = to.id; });
                  });
                  s.patients = s.patients.filter(x => x.id !== patient.id);
                });
                setPatientId(to.id);
              }}>Merge</button>
              <button className="btn small ghost" title="Export this patient's full record as an HTML file" onClick={async () => {
                const esc = x => String(x || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
                const rows = visits.slice().reverse().map(v => `<tr><td>${esc(v.date)}</td><td>${esc(v.complaint)}</td><td>${esc(v.diagnosis)}</td><td>${esc((v.items || []).map(i => i.name).join(', '))}</td><td>Rs ${esc(v.fee)}</td></tr>`).join('');
                const html = `<!doctype html><meta charset="utf-8"><title>${esc(patient.name)} — record</title><style>body{font-family:Arial;padding:24px;font-size:13px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:4px 8px;text-align:left}</style><h2>${esc(store.settings.clinicName || 'Clinic')} — Patient record</h2><p><b>${esc(patient.name)}</b> · ${esc(ageText(patient))} · MRN ${esc(patient.mrn)} · ${esc(patient.phone)}<br>Allergies: ${esc(patient.allergies)} · Chronic: ${esc(patient.chronic)}</p><table><tr><th>Date</th><th>Complaint</th><th>Diagnosis</th><th>Medicines</th><th>Fee</th></tr>${rows}</table><p style="color:#888;font-size:11px">Exported from Medora — offline record.</p>`;
                await window.api.export.toFolder({ folder: '', name: `${patient.mrn || 'record'}-${patient.name.replace(/[^a-z0-9]+/gi, '-')}.html`, text: html });
                alert('Saved to app export folder.');
              }}>Export history</button>
              <button className="icon" onClick={() => delPatient(patient.id)} aria-label="Delete patient">✕</button>
            </div>
            {(() => {
              const le = (store.ledger || []).filter(e => e.patientId === patient.id);
              const bal = le.reduce((t, e) => t + (Number(e.debit) || 0) - (Number(e.credit) || 0), 0);
              return (
                <div style={{ margin: '6px 0 10px', padding: 8, background: '#f8fafc', borderRadius: 8 }}>
                  <b>Ledger</b> — balance {bal > 0 ? <span style={{ color: '#16a34a' }}>Rs {bal} advance</span> : bal < 0 ? <span style={{ color: '#dc2626' }}>Rs {-bal} due (udhaar)</span> : 'settled'}
                  {' · '}<a href="#" onClick={e => { e.preventDefault(); const amt = prompt('Payment received (Rs):'); if (!amt) return; update(s => (s.ledger = s.ledger || []).push({ id: uid(), date: new Date().toISOString().slice(0, 10), patientId: patient.id, desc: 'Payment received', debit: Number(amt) })); }}>+ Payment</a>
                  {' · '}<a href="#" onClick={e => { e.preventDefault(); window.api.export.print({ html: ledgerHtml({ store, patient, entries: le }) }); }}>Print</a>
                  <div className="muted" style={{ marginTop: 4 }}>
                    {(patient.allergyEvents || []).map((a, i) => <div key={i}>⚠ {a.date} — {a.drug}: {a.reaction} <button className="icon" onClick={() => update(s => { const p = s.patients.find(x => x.id === patient.id); if (p) p.allergyEvents = (p.allergyEvents || []).filter((_, j) => j !== i); })}>✕</button></div>)}
                    {(() => {
                      const c = {}; visits.forEach(v => (v.items || []).forEach(i => { if (i.name) c[i.name] = (c[i.name] || 0) + 1; }));
                      const rep = Object.entries(c).filter(([, n]) => n > 1);
                      return rep.length ? <div>🔁 Refills: {rep.map(([k, n]) => `${k} ×${n}`).join(', ')}</div> : null;
                    })()}
                    <a href="#" onClick={e => { e.preventDefault(); const drug = prompt('Drug:'); if (!drug) return; const rx = prompt('Reaction:', 'rash'); update(s => { const p = s.patients.find(x => x.id === patient.id); if (p) (p.allergyEvents = p.allergyEvents || []).push({ date: new Date().toISOString().slice(0, 10), drug, reaction: rx || '' }); }); }}>+ Allergy event</a>
                  </div>
                </div>
              );
            })()}
            {(() => {
              const fam = store.patients.filter(x => x.id !== patient.id && (x.familyId === patient.id || (patient.familyId && x.familyId === patient.familyId) || x.id === patient.familyId));
              if (!fam.length) return null;
              return <div className="muted" style={{ margin: '4px 0 10px' }}>👪 Family: {fam.map(x => <a key={x.id} href="#" onClick={e => { e.preventDefault(); setPatientId(x.id); }}>{x.name}</a>).reduce((a, b) => [a, ', ', b])}</div>;
            })()}
            <div>
            </div>

            {patient.allergies && <div className="allergy">⚠ Allergy: {patient.allergies}</div>}

            <div className="form" style={{ marginBottom: 16 }}>
              <div className="frow" style={{ alignItems: 'center' }}>
                {patient.photoDataUrl
                  ? <img src={patient.photoDataUrl} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--line)' }} />
                  : <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e0f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'var(--accent-strong)', border: '2px solid var(--line)' }}>{(patient.name || '?').slice(0, 1)}</div>}
                <button className="btn small ghost" onClick={async () => {
                  const f = await window.api.app.openFile({ filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }] });
                  if (f?.dataUrl) update(s => { s.patients.find(x => x.id === patient.id).photoDataUrl = f.dataUrl; });
                }}>{patient.photoDataUrl ? 'Change photo' : 'Add photo'}</button>
                {patient.photoDataUrl && <button className="icon" onClick={() => update(s => { s.patients.find(x => x.id === patient.id).photoDataUrl = ''; })} aria-label="Remove photo">✕</button>}
              </div>
              <div className="frow">
                <input className="in" value={patient.name} placeholder="Full name" onChange={e => update(s => { s.patients.find(x => x.id === patient.id).name = e.target.value; })} />
                <input className="in num" type="number" value={patient.age} placeholder="Age" onChange={e => update(s => { s.patients.find(x => x.id === patient.id).age = e.target.value === '' ? '' : Number(e.target.value); })} />
                <select className="in" value={patient.ageUnit} onChange={e => update(s => { s.patients.find(x => x.id === patient.id).ageUnit = e.target.value; })}>
                  <option>years</option><option>months</option><option>days</option>
                </select>
                <select className="in" value={patient.gender} onChange={e => update(s => { s.patients.find(x => x.id === patient.id).gender = e.target.value; })}>
                  <option value="">Gender</option><option>Male</option><option>Female</option><option>Other</option>
                </select>
                <input className="in" value={patient.phone} placeholder="Phone" onChange={e => update(s => { s.patients.find(x => x.id === patient.id).phone = e.target.value; })} />
                <input className="in num" value={patient.height} placeholder="Ht (cm)" title="Height in cm" onChange={e => update(s => { s.patients.find(x => x.id === patient.id).height = e.target.value; })} />
                <input className="in" type="date" style={{ width: 140 }} value={patient.dob || ''} title="Date of birth (for growth chart)" onChange={e => update(s => { s.patients.find(x => x.id === patient.id).dob = e.target.value; })} />
              </div>
              <div className="frow">
                <input className="in" style={{ flex: 1 }} value={patient.chronic} placeholder="Chronic conditions — HTN, DM, asthma…" onChange={e => update(s => { s.patients.find(x => x.id === patient.id).chronic = e.target.value; })} />
                <input className="in" value={patient.referredBy} placeholder="Referred by (doctor/clinic)" title="Referring doctor or clinic" onChange={e => update(s => { s.patients.find(x => x.id === patient.id).referredBy = e.target.value; })} />
                <select className="in" style={{ width: 110 }} value={patient.tag || ''} title="Patient tag" onChange={e => update(s => { s.patients.find(x => x.id === patient.id).tag = e.target.value; })}>
                  <option value="">Tag…</option><option>VIP</option><option>Staff</option><option>Emergency</option><option>Senior</option>
                </select>
                <select className="in" value={patient.familyId || ''} title="Family group head" onChange={e => update(s => { s.patients.find(x => x.id === patient.id).familyId = e.target.value; })}>
                  <option value="">Family head — none</option>
                  {store.patients.filter(x => x.id !== patient.id).map(x => <option key={x.id} value={x.id}>{x.name} (MRN {x.mrn})</option>)}
                </select>
              </div>
              <div className="frow">
                <input className="in" style={{ flex: 1 }} value={patient.address} placeholder="Address" onChange={e => update(s => { s.patients.find(x => x.id === patient.id).address = e.target.value; })} />
                <input className="in" style={{ borderColor: patient.allergies ? '#fca5a5' : undefined }} value={patient.allergies} placeholder="Allergies (e.g. Penicillin)" onChange={e => update(s => { s.patients.find(x => x.id === patient.id).allergies = e.target.value; })} />
              </div>
              <textarea className="in" rows={2} value={patient.notes} placeholder="Notes — chronic conditions, long-term meds…" onChange={e => update(s => { s.patients.find(x => x.id === patient.id).notes = e.target.value; })} />
            </div>

            {(() => {
              const pts = patientVisits(store, patient.id).map(v => ({ d: v.date, w: Number(v.vitals?.weight) })).filter(x => x.w).reverse();
              if (pts.length < 2) return null;
              const isBoy = (patient.gender || '').toLowerCase().startsWith('m');
              // WHO weight-for-age reference (boys/girls median & ±2SD, months → kg)
              const MED = { 0: 3.3, 6: 7.9, 12: 9.6, 18: 10.9, 24: 12.2, 36: 14.3, 48: 16.3, 60: 18.3 };
              const ref = m => { const ks = Object.keys(MED).map(Number); const k = ks.reduce((a, b) => Math.abs(b - m) < Math.abs(a - m) ? b : a); return MED[k]; };
              const ageMonths = p => { if (!p.dob) return null; return Math.max(0, (Date.now() - new Date(p.dob)) / 2592000000); };
              const am = ageMonths(patient);
              const all = pts.map(x => x.w);
              const max = Math.max(...all, am ? ref(am) * 1.3 : 0) * 1.08, min = Math.min(...all) * 0.85;
              const W = 320, H = 110, X = i => 30 + i * ((W - 40) / Math.max(1, pts.length - 1)), Y = w => H - 8 - ((w - min) / (max - min)) * (H - 20);
              const line = pts.map((x, i) => `${X(i)},${Y(x.w)}`).join(' ');
              const band = am != null ? [30 + 0, 30 + (W - 40)] : null;
              return (
                <div style={{ marginBottom: 16 }}>
                  <h3 className="ptitle">Weight trend {am != null && am <= 60 ? `(WHO ${isBoy ? 'boys' : 'girls'} ref: median ${ref(am)}kg, band ${Math.round(ref(am) * 0.85)}–${Math.round(ref(am) * 1.15)}kg)` : ''}</h3>
                  <svg width={W} height={H} style={{ background: '#f8fafc', border: '1px solid var(--line)', borderRadius: 8 }}>
                    {am != null && am <= 60 && [0.85, 1, 1.15].map((f, i) => (
                      <line key={i} x1={30} x2={W - 10} y1={Y(ref(am) * f)} y2={Y(ref(am) * f)} stroke={i === 1 ? '#0d9488' : '#cbd5e1'} strokeDasharray={i === 1 ? '' : '4 3'} strokeWidth={i === 1 ? 1.5 : 1} />
                    ))}
                    <polyline points={line} fill="none" stroke="#f59e0b" strokeWidth="2" />
                    {pts.map((x, i) => <circle key={i} cx={X(i)} cy={Y(x.w)} r="3" fill="#f59e0b"><title>{x.d}: {x.w}kg</title></circle>)}
                    <text x={4} y={Y(max / 1.08) + 10} fontSize="8" fill="#94a3b8">kg</text>
                  </svg>
                </div>
              );
            })()}

            <h3 className="ptitle">Visit history</h3>
            <div className="tl">
              {patientVisits(store, patient.id).map(v => (
                <div className="tl-item" key={v.id}>
                  <div className="tl-date">{v.date} <span className="tl-dx">— {v.diagnosis || v.complaint || 'Visit'}</span></div>
                  <div className="tl-meds">{v.items.map(i => i.name).join(', ') || 'No medicines'}{v.fee ? ` · Fee ${v.fee}` : ''}</div>
                  <div style={{ marginTop: 4 }}>
                    <button className="btn small ghost" onClick={() => setRxVisitId(v.id)}>Open Rx</button>
                  </div>
                </div>
              ))}
              {patientVisits(store, patient.id).length === 0 && <div className="tl-item muted">No visits yet.</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
