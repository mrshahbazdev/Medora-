import React, { useEffect, useMemo, useState } from 'react';
import { newPatient, newVisit, patientMrn, patientVisits, ageText, uid, nextToken } from '../lib/model.js';
import { patientCardHtml, ancCardHtml } from '../lib/docsHtml.js';
import RxEditor from './RxEditor.jsx';

export default function PatientsPanel({ store, update, patientId, setPatientId, rxVisitId, setRxVisitId }) {
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
          <RxEditor store={store} update={update} patient={patient} visit={rxVisit} close={() => setRxVisitId(null)} />
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
              <button className="btn small ghost" onClick={() => update(s => { const d = new Date().toISOString().slice(0, 10); s.queue.push({ id: uid(), patientId: patient.id, at: d, tokenNo: nextToken(s, d), room: s.settings.rooms?.[0] || '', doctorId: '', status: 'waiting', note: '' }); })}>Add to today's queue</button>
              <button className="btn small ghost" onClick={() => window.api.export.print({ html: patientCardHtml({ store, patient }) })}>Print card</button>
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
              <button className="icon" onClick={() => delPatient(patient.id)} aria-label="Delete patient">✕</button>
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
              </div>
              <div className="frow">
                <input className="in" style={{ flex: 1 }} value={patient.chronic} placeholder="Chronic conditions — HTN, DM, asthma…" onChange={e => update(s => { s.patients.find(x => x.id === patient.id).chronic = e.target.value; })} />
                <input className="in" value={patient.referredBy} placeholder="Referred by (doctor/clinic)" title="Referring doctor or clinic" onChange={e => update(s => { s.patients.find(x => x.id === patient.id).referredBy = e.target.value; })} />
              </div>
              <div className="frow">
                <input className="in" style={{ flex: 1 }} value={patient.address} placeholder="Address" onChange={e => update(s => { s.patients.find(x => x.id === patient.id).address = e.target.value; })} />
                <input className="in" style={{ borderColor: patient.allergies ? '#fca5a5' : undefined }} value={patient.allergies} placeholder="Allergies (e.g. Penicillin)" onChange={e => update(s => { s.patients.find(x => x.id === patient.id).allergies = e.target.value; })} />
              </div>
              <textarea className="in" rows={2} value={patient.notes} placeholder="Notes — chronic conditions, long-term meds…" onChange={e => update(s => { s.patients.find(x => x.id === patient.id).notes = e.target.value; })} />
            </div>

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
