import React, { useMemo, useState } from 'react';
import { FREQUENCIES, DURATIONS, ADVICE_PRESETS, COMPLAINT_PRESETS, DIAGNOSIS_PRESETS } from '../lib/meds.js';
import { uid, ageText } from '../lib/model.js';
import { rxDocument, rxPreviewHtml, rxCss } from '../lib/rxHtml.js';

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

  const html = rxDocument({ store, patient, visit });
  const preview = rxPreviewHtml({ store, patient, visit });
  const size = store.settings.paperSize === 'a4' ? { w: 210, h: 297 } : { w: 148, h: 210 };

  const print = () => window.api.export.print({ html });
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
          <span style={{ flex: 1 }} />
          <button className="btn small ghost" onClick={delVisit}>Delete</button>
          <button className="btn small" onClick={savePdf}>Save PDF</button>
          <button className="btn" onClick={print}>Print</button>
        </div>

        {allergyHit && <div className="allergy">⚠ {patient.name} is allergic to <b>{patient.allergies}</b> — {allergyHit} may conflict.</div>}

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

          <RxItems store={store} items={visit.items} mut={mut} patient={patient} />

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

function RxItems({ store, items, mut, patient }) {
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
          <input className="in" style={{ width: '100%' }} value={it.note} placeholder="Note, e.g. after meals / 2 tsp / apply thin layer"
            onChange={e => mutItem(it.id, x => x.note = e.target.value)} />
        </div>
      ))}
      {items.length === 0 && <p className="muted" style={{ marginBottom: 12 }}>No medicines yet — search above to add.</p>}
    </>
  );
}
