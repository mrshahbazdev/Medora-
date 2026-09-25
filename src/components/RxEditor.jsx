import React, { useMemo, useState } from 'react';
import { FREQUENCIES, DURATIONS, ADVICE_PRESETS, COMPLAINT_PRESETS, DIAGNOSIS_PRESETS, RX_PRESETS, INVESTIGATION_PRESETS, INTERACTIONS } from '../lib/meds.js';
import { medicalCertificateHtml, referralLetterHtml, followUpSms, fitnessCertHtml, procedureNoteHtml } from '../lib/docsHtml.js';
import { uid, ageText } from '../lib/model.js';
import { rxDocument, rxPreviewHtml, rxCss } from '../lib/rxHtml.js';

function DoseCalc({ weight, onApply }) {
  const [open, setOpen] = useState(false);
  const [perKg, setPerKg] = useState('');
  const [perDay, setPerDay] = useState(3);
  const wt = Number(weight);
  const total = wt && perKg ? (Number(perKg) * wt).toFixed(1) : '';
  return (
    <span style={{ position: 'relative' }}>
      <button className="btn small ghost" onClick={() => setOpen(!open)} title="Weight-based dose calculator">mg/kg</button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 20, background: '#fff', border: '1px solid var(--line)', borderRadius: 10, padding: 12, boxShadow: '0 8px 24px rgba(19,78,74,0.18)', width: 240 }}>
          {wt ? <div className="muted" style={{ marginBottom: 6 }}>Weight: {wt} kg</div> : <div className="muted" style={{ marginBottom: 6, color: 'var(--danger)' }}>Add weight (kg) in vitals</div>}
          <div className="frow" style={{ marginBottom: 6 }}>
            <input className="in num" placeholder="mg/kg/dose" value={perKg} onChange={e => setPerKg(e.target.value)} />
            <span className="muted">× {perDay}/day</span>
          </div>
          <input className="in num" type="number" min="1" value={perDay} onChange={e => setPerDay(Number(e.target.value) || 1)} />
          {total && <div style={{ margin: '8px 0' }}><b>{total} mg per dose</b> · {(total * perDay).toFixed(0)} mg/day</div>}
          {total && <button className="btn small" onClick={() => { onApply(`${total} mg per dose`); setOpen(false); }}>Use as note</button>}
        </div>
      )}
    </span>
  );
}

export default function RxEditor({ store, update, patient, visit, close }) {
  const mut = (fn) => update(s => { const v = s.visits.find(x => x.id === visit.id); if (v) fn(v); });
  const lastVisit = store.visits.filter(v => v.patientId === patient.id && v.id !== visit.id)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  // Allergy cross-check: any item name/generic matching an allergy token.
  const allergyHit = useMemo(() => {
    if (!patient.allergies) return null;
    const toks = patient.allergies.toLowerCase().split(/[,;\s]+/).filter(Boolean);
    for (const it of visit.items) {
      const med = store.medicines.find(m => m.name === it.name);
      const hay = `${it.name} ${med?.generic || ''}`.toLowerCase();
      if (toks.some(t => hay.includes(t))) return it.name;
    }
    return null;
  }, [patient.allergies, visit.items, store.medicines]);

  const copyLast = () => {
    if (!lastVisit) return;
    mut(v => {
      v.items = lastVisit.items.map(i => ({ ...i, id: uid() }));
      v.advice = [...lastVisit.advice];
      v.followUpDays = lastVisit.followUpDays;
    });
  };

  // Drug interaction check across prescribed items (name + generic).
  const interactions = useMemo(() => {
    const hay = visit.items.map(it => {
      const med = store.medicines.find(m => m.name === it.name);
      return `${it.name} ${med?.generic || ''}`.toLowerCase();
    });
    return INTERACTIONS.filter(x =>
      hay.some(h => h.includes(x.a)) && hay.some(h => h.includes(x.b)));
  }, [visit.items, store.medicines]);

  const applyPreset = (idx) => {
    const p = RX_PRESETS[idx];
    if (!p) return;
    mut(v => {
      v.diagnosis = p.diagnosis;
      v.items = p.items.map(it => {
        const m = store.medicines[it.med] || {};
        return { id: uid(), name: m.name || '', form: m.form || 'Tab', strength: m.strength || '',
          freq: it.freq, days: it.days, note: it.note || '' };
      });
      v.advice = [...p.advice];
      if (p.followUpDays) v.followUpDays = p.followUpDays;
    });
  };

  const html = rxDocument({ store, patient, visit });
  const preview = rxPreviewHtml({ store, patient, visit });
  const size = store.settings.paperSize === 'a4' ? { w: 210, h: 297 } : { w: 148, h: 210 };

  const print = () => window.api.export.print({ html });
  const printCert = () => window.api.export.print({ html: medicalCertificateHtml({ store, patient, visit, restDays: visit.followUpDays }) });
  const printReferral = () => {
    const to = prompt('Refer to (doctor / facility):', 'Consultant, THQ Hospital');
    if (to === null) return;
    const reason = prompt('Reason:', visit.diagnosis || visit.complaint || '');
    window.api.export.print({ html: referralLetterHtml({ store, patient, visit, toDoctor: to, reason }) });
  };
  const copySms = () => {
    const tpl = (store.settings.smsTemplates || [])[0];
    let text = followUpSms({ store, patient, visit });
    if (tpl) {
      const doc = (store.settings.doctors || []).find(d => d.id === visit.doctorId) || (store.settings.doctors || [])[0];
      text = tpl.text
        .replaceAll('{name}', patient.name)
        .replaceAll('{date}', visit.date)
        .replaceAll('{clinic}', store.settings.clinicName || 'Clinic')
        .replaceAll('{doctor}', doc?.name || store.settings.doctorName || '');
    }
    navigator.clipboard.writeText(text);
    alert('SMS copied — paste it into WhatsApp/SMS to send.');
  };
  const savePdf = () => window.api.export.pdf({ html, suggestedName: `${patient.name}-Rx-${visit.date}.pdf` });
  const delVisit = async () => {
    if (!confirm('Delete this visit? A snapshot is taken first.')) return;
    await window.api.store.snapshot(store, `before deleting visit ${visit.id}`);
    update(s => { s.visits = s.visits.filter(v => v.id !== visit.id); });
    close();
  };

  return (
    <div className="editor-wrap">
      <div className="editor">
        <div className="etoolbar">
          <button className="btn small ghost" onClick={close}>← {patient.name}</button>
          <input className="in" type="date" value={visit.date} onChange={e => mut(v => v.date = e.target.value)} />
          {lastVisit && <button className="btn small ghost" onClick={copyLast} title={`Repeat ${lastVisit.date} Rx`}>Repeat last Rx</button>}
          {(store.settings.doctors || []).length > 0 && (
            <select className="in" value={visit.doctorId || ''} onChange={e => mut(v => v.doctorId = e.target.value)} title="Doctor signing this Rx">
              <option value="">{store.settings.doctorName || 'Doctor'}</option>
              {store.settings.doctors.map(d => <option key={d.id} value={d.id}>{d.name}{d.room ? ` (${d.room})` : ''}</option>)}
            </select>)}
          <select className="in" value={visit.type || 'opd'} onChange={e => mut(v => v.type = e.target.value)} title="Visit type">
            <option value="opd">OPD</option><option value="eye">Eye</option><option value="dental">Dental</option><option value="anc">Antenatal</option><option value="procedure">Procedure / OT</option>
          </select>
          <span style={{ flex: 1 }} />
          <select className="in" defaultValue="" onChange={e => { if (e.target.value !== '') applyPreset(Number(e.target.value)); e.target.value = ''; }} title="Apply a full illness preset">
            <option value="" disabled>Rx preset…</option>
            {RX_PRESETS.map((p, i) => <option key={p.name} value={i}>{p.name}</option>)}
          </select>
          <button className="btn small ghost" onClick={printCert}>Sick note</button>
          <button className="btn small ghost" onClick={() => { const pur = prompt('Fit for (e.g. job, school, travel):', 'duty'); if (pur !== null) window.api.export.print({ html: fitnessCertHtml({ store, patient, purpose: pur }) }); }}>Fitness cert</button>
          <button className="btn small ghost" onClick={async () => {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const rec = new MediaRecorder(stream);
              const chunks = [];
              rec.ondataavailable = e => chunks.push(e.data);
              rec.onstop = () => {
                const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
                const fr = new FileReader();
                fr.onload = () => mut(v => { v.voiceNote = v.voiceNote || ''; v.voiceNote = fr.result; });
                fr.readAsDataURL(blob);
                stream.getTracks().forEach(t => t.stop());
              };
              rec.start(); alert('Recording voice note — click OK to stop.'); rec.stop();
            } catch (err) { alert('Mic not available: ' + err.message); }
          }}>Voice note</button>
          <button className="btn small ghost" onClick={printReferral}>Referral</button>
          {visit.followUpDays && <button className="btn small ghost" onClick={copySms}>Copy SMS</button>}
          <button className="btn small ghost" onClick={delVisit}>Delete</button>
          <button className="btn small" onClick={savePdf}>Save PDF</button>
          <button className="btn" onClick={print}>Print</button>
        </div>

        {allergyHit && <div className="allergy">⚠ {patient.name} is allergic to <b>{patient.allergies}</b> — {allergyHit} may conflict.</div>}
        {interactions.map(x => <div className="allergy" key={x.warn}>⚠ Interaction: {x.warn}</div>)}

        {visit.voiceNote && <div className="frow" style={{ alignItems: 'center', gap: 8 }}><span className="muted">🎙 Voice note:</span><audio controls src={visit.voiceNote} style={{ height: 30 }} /></div>}
        {visit.type === 'procedure' && <div className="frow"><button className="btn small ghost" onClick={() => window.api.export.print({ html: procedureNoteHtml({ store, patient, visit }) })}>Print procedure note</button></div>}
        <div className="form">
          <div className="frow">
            <label className="lbl" style={{ flex: 1 }}>Complaint
              <input className="in" list="complaints" value={visit.complaint} onChange={e => mut(v => v.complaint = e.target.value)} placeholder="e.g. Fever with body aches" />
              <datalist id="complaints">{COMPLAINT_PRESETS.map(c => <option key={c} value={c} />)}</datalist>
            </label>
            <label className="lbl" style={{ flex: 1 }}>Diagnosis
              <input className="in" list="diagnoses" value={visit.diagnosis} onChange={e => mut(v => v.diagnosis = e.target.value)} placeholder="e.g. Viral fever" />
              <datalist id="diagnoses">{DIAGNOSIS_PRESETS.map(d => <option key={d} value={d} />)}</datalist>
            </label>
          </div>

          {store.settings.showVitals && (
            <div className="frow">
              {[['bp', 'BP'], ['pulse', 'Pulse'], ['temp', 'Temp °F'], ['weight', 'Weight kg'], ['spo2', 'SpO₂ %']].map(([k, lab]) => (
                <label className="lbl" key={k}>{lab}
                  <input className="in num" value={visit.vitals[k]} onChange={e => mut(v => v.vitals[k] = e.target.value)} />
                </label>
              ))}
            </div>
          )}

          {(visit.type === 'eye') && (
            <div className="frow">
              {[['od', 'Right eye (OD)'], ['os', 'Left eye (OS)']].map(([side, lab]) => (
                <div key={side} style={{ flex: 1 }}>
                  <div className="muted" style={{ fontSize: 11.5, marginBottom: 4 }}>{lab}</div>
                  <div className="frow">
                    {[['sph', 'SPH'], ['cyl', 'CYL'], ['axis', 'Axis'], ['add', 'ADD']].map(([k, l]) => (
                      <label className="lbl" key={k} style={{ flex: 1 }}>{l}
                        <input className="in num" value={visit.eye?.[side]?.[k] || ''} onChange={e => mut(v => { v.eye = v.eye || { od: {}, os: {} }; v.eye[side][k] = e.target.value; })} /></label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {(visit.type === 'dental') && (
            <div>
              <label className="lbl" style={{ marginBottom: 6 }}>Tooth chart — click to mark</label>
              <div className="freqgrid" style={{ marginBottom: 12 }}>
                {Array.from({ length: 32 }, (_, i) => i + 1).map(n => (
                  <button key={n} type="button" className={'chip' + ((visit.dental || []).includes(n) ? ' on' : '')}
                    onClick={() => mut(v => { v.dental = v.dental || []; v.dental = v.dental.includes(n) ? v.dental.filter(x => x !== n) : [...v.dental, n].sort((a, b) => a - b); })}>{n}</button>
                ))}
              </div>
            </div>
          )}
          {(visit.type === 'procedure') && (
            <div className="frow">
              {[['name', 'Procedure name'], ['anesthesia', 'Anesthesia'], ['surgeon', 'Surgeon'], ['findings', 'Findings / notes']].map(([k, lab]) => (
                <label className="lbl" key={k} style={{ flex: 1 }}>{lab}
                  <input className="in" value={visit.procedure?.[k] || ''} onChange={e => mut(v => { v.procedure = v.procedure || {}; v.procedure[k] = e.target.value; })} /></label>
              ))}
            </div>
          )}
          {(visit.type === 'anc') && (
            <div className="frow">
              {[['gravida', 'Gravida'], ['para', 'Para'], ['edd', 'EDD (date)'], ['fhr', 'Fetal HR'], ['fundal', 'Fundal height']].map(([k, lab]) => (
                <label className="lbl" key={k} style={{ flex: 1 }}>{lab}
                  <input className="in" type={k === 'edd' ? 'date' : 'text'} value={visit.anc?.[k] || ''} onChange={e => mut(v => { v.anc = v.anc || {}; v.anc[k] = e.target.value; })} /></label>
              ))}
            </div>
          )}

          <RxItems store={store} items={visit.items} mut={mut} patient={patient} weight={visit.vitals?.weight} />

          <label className="lbl" style={{ marginBottom: 6 }}>Investigations / lab tests</label>
          <div className="freqgrid" style={{ marginBottom: 12 }}>
            {INVESTIGATION_PRESETS.map(t => (
              <button key={t} className={'chip' + ((visit.investigations || []).includes(t) ? ' on' : '')}
                onClick={() => mut(v => {
                  v.investigations = v.investigations || [];
                  v.investigations = v.investigations.includes(t) ? v.investigations.filter(x => x !== t) : [...v.investigations, t];
                })}>{t}</button>
            ))}
          </div>

          <label className="lbl" style={{ marginBottom: 6 }}>Advice (click to add/remove)</label>
          <div className="freqgrid" style={{ marginBottom: 12 }}>
            {ADVICE_PRESETS.map((a, i) => (
              <button key={i} className={'chip' + (visit.advice.includes(i) ? ' on' : '')}
                onClick={() => mut(v => { v.advice = v.advice.includes(i) ? v.advice.filter(x => x !== i) : [...v.advice, i]; })}>
                {a.en}
              </button>
            ))}
          </div>

          <div className="frow">
            <label className="lbl">Follow-up in (days)
              <select className="in" value={visit.followUpDays} onChange={e => mut(v => v.followUpDays = e.target.value)}>
                <option value="">— none —</option>
                {DURATIONS.map(d => <option key={d} value={d}>{d} days</option>)}
              </select></label>
            <label className="lbl">Fee
              <input className="in num" type="number" value={visit.fee} onChange={e => mut(v => v.fee = e.target.value)} /></label>
          </div>
        </div>
      </div>

      <div className="rxprev-wrap">
        <style>{rxCss(size, store.settings.template)}</style>
        <div dangerouslySetInnerHTML={{ __html: preview }} />
      </div>
    </div>
  );
}

function RxItems({ store, items, mut, patient, weight }) {
  const [pickFor, setPickFor] = useState(null); // item id with open dropdown
  const [needle, setNeedle] = useState('');

  const matches = useMemo(() => {
    const n = needle.trim().toLowerCase();
    if (!n) return store.medicines.slice(0, 12);
    return store.medicines.filter(m =>
      m.name.toLowerCase().includes(n) || (m.generic || '').toLowerCase().includes(n)).slice(0, 12);
  }, [needle, store.medicines]);

  const addItem = (med) => mut(v => v.items.push({
    id: uid(), name: med.name, form: med.form || 'Tab', strength: med.strength || '',
    freq: med.freq || 'TDS', days: med.days || 5, note: ''
  }));

  const mutItem = (id, fn) => mut(v => { const it = v.items.find(x => x.id === id); if (it) fn(it); });

  return (
    <>
      <label className="lbl" style={{ marginBottom: 4 }}>Medicines</label>
      <div className="medpick" style={{ marginBottom: 10 }}>
        <input className="in" style={{ width: '100%' }} placeholder="Type to search medicine library…"
          value={needle} onChange={e => { setNeedle(e.target.value); setPickFor('new'); }}
          onFocus={() => setPickFor('new')} />
        {pickFor === 'new' && (
          <div className="medpick-list">
            {matches.map(m => (
              <div key={m.id} className="medpick-item"
                onMouseDown={() => { addItem(m); setNeedle(''); setPickFor(null); }}>
                <b>{m.name}</b> {m.strength} <span className="g">{m.form} · {m.generic}</span>
              </div>
            ))}
            {matches.length === 0 && (
              <div className="medpick-item" onMouseDown={() => { addItem({ name: needle }); setNeedle(''); setPickFor(null); }}>
                + Add “{needle}” manually
              </div>
            )}
          </div>
        )}
      </div>

      {items.map((it, idx) => (
        <div key={it.id} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
          <div className="frow" style={{ marginBottom: 6 }}>
            <b style={{ flex: 1 }}>{idx + 1}. {it.name} <span className="muted">{it.strength}</span></b>
            <select className="in" value={it.form} onChange={e => mutItem(it.id, x => x.form = e.target.value)}>
              {['Tab', 'Cap', 'Syrup', 'Sachet', 'Inhaler', 'Inj', 'Drops', 'Eye drops', 'Ear drops', 'Cream', 'Oint', 'Gel', 'Tab SL'].map(f => <option key={f}>{f}</option>)}
            </select>
            <label className="lbl" style={{ minWidth: 0 }}>days
              <input className="in num" type="number" min="0" value={it.days} onChange={e => mutItem(it.id, x => x.days = Number(e.target.value))} /></label>
            <button className="icon" onClick={() => mut(v => v.items = v.items.filter(x => x.id !== it.id))} aria-label="Remove medicine">✕</button>
          </div>
          <div className="freqgrid" style={{ marginBottom: 6 }}>
            {FREQUENCIES.map(f => (
              <button key={f.code} className={'chip' + (it.freq === f.code ? ' on' : '')}
                title={`${f.label}${f.urdu ? ' — ' + f.urdu : ''}`}
                onClick={() => mutItem(it.id, x => x.freq = f.code)}>{f.code}</button>
            ))}
          </div>
          <div className="frow" style={{ marginBottom: 0 }}>
            <input className="in" style={{ flex: 1 }} value={it.note} placeholder="Note, e.g. after meals / 2 tsp / apply thin layer"
              onChange={e => mutItem(it.id, x => x.note = e.target.value)} />
            <DoseCalc weight={weight} onApply={txt => mutItem(it.id, x => x.note = txt)} />
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="muted" style={{ marginBottom: 12 }}>No medicines yet — search above to add.</p>}
    </>
  );
}
