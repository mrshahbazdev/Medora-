import React, { useState } from 'react';
import { uid, ageText } from '../lib/model.js';

const today = () => new Date().toISOString().slice(0, 10);

export default function QueuePanel({ store, update, openPatient, openRx }) {
  const [date, setDate] = useState(today());
  const [pick, setPick] = useState('');
  const q = store.queue.filter(x => x.at === date).sort((a, b) => a.id.localeCompare(b.id));

  const add = () => {
    if (!pick) return;
    update(s => s.queue.push({ id: uid(), patientId: pick, at: date, status: 'waiting', note: '' }));
    setPick('');
  };

  const setStatus = (id, status) => update(s => { const x = s.queue.find(z => z.id === id); if (x) x.status = status; });
  const remove = (id) => update(s => { s.queue = s.queue.filter(x => x.id !== id); });

  return (
    <div className="panel">
      <div className="toolbar">
        <input className="in" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <select className="in" value={pick} onChange={e => setPick(e.target.value)}>
          <option value="">Add patient to queue…</option>
          {store.patients.map(p => <option key={p.id} value={p.id}>{p.name} — MRN {p.mrn}</option>)}
        </select>
        <button className="btn" onClick={add}>Add</button>
      </div>

      {q.map((item, i) => {
        const p = store.patients.find(x => x.id === item.patientId);
        if (!p) return null;
        return (
          <div className="qrow" key={item.id}>
            <div className="qnum">{i + 1}</div>
            <div style={{ flex: 1 }}>
              <b>{p.name}</b> <span className="muted">{p.gender}, {ageText(p)} · MRN {p.mrn} · {p.phone}</span>
            </div>
            <span className={'pill ' + (item.status === 'in-progress' ? 'st-partial' : item.status === 'done' ? 'st-paid' : 'st-draft')}>{item.status}</span>
            {item.status === 'waiting' && <button className="btn small" onClick={() => { setStatus(item.id, 'in-progress'); openRx(p.id, 'new'); }}>Call in</button>}
            {item.status !== 'done' && <button className="btn small ghost" onClick={() => setStatus(item.id, 'done')}>Done</button>}
            <button className="icon" onClick={() => remove(item.id)} aria-label="Remove from queue">✕</button>
          </div>
        );
      })}
      {q.length === 0 && <p className="muted">Nobody queued for {date}.</p>}
    </div>
  );
}
