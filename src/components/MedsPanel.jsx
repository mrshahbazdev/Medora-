import React, { useMemo, useState } from 'react';
import { uid } from '../lib/model.js';
import { FREQUENCIES } from '../lib/meds.js';

export default function MedsPanel({ store, update }) {
  const [q, setQ] = useState('');
  const meds = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? store.medicines.filter(m => m.name.toLowerCase().includes(n) || (m.generic || '').toLowerCase().includes(n)) : store.medicines;
  }, [q, store.medicines]);

  const mut = (id, fn) => update(s => { const m = s.medicines.find(x => x.id === id); if (m) fn(m); });

  return (
    <div className="panel">
      <div className="toolbar">
        <input className="in" style={{ minWidth: 280 }} placeholder="Search medicines…" value={q} onChange={e => setQ(e.target.value)} />
        <button className="btn" onClick={() => update(s => s.medicines.unshift({ id: uid(), name: 'New medicine', generic: '', form: 'Tab', strength: '', freq: 'TDS', days: 5 }))}>+ Medicine</button>
        <span className="muted">{store.medicines.length} in library — defaults here pre-fill every new Rx line</span>
      </div>
      <table className="grid">
        <thead><tr><th>Brand name</th><th>Generic</th><th>Form</th><th>Strength</th><th>Default freq</th><th className="num">Days</th><th></th></tr></thead>
        <tbody>
          {meds.map(m => (
            <tr key={m.id}>
              <td><input className="in" value={m.name} onChange={e => mut(m.id, x => x.name = e.target.value)} /></td>
              <td><input className="in" value={m.generic || ''} onChange={e => mut(m.id, x => x.generic = e.target.value)} /></td>
              <td>
                <select className="in" value={m.form} onChange={e => mut(m.id, x => x.form = e.target.value)}>
                  {['Tab', 'Cap', 'Syrup', 'Sachet', 'Inhaler', 'Inj', 'Drops', 'Eye drops', 'Ear drops', 'Cream', 'Oint', 'Gel', 'Tab SL'].map(f => <option key={f}>{f}</option>)}
                </select>
              </td>
              <td><input className="in" value={m.strength || ''} onChange={e => mut(m.id, x => x.strength = e.target.value)} /></td>
              <td>
                <select className="in" value={m.freq} onChange={e => mut(m.id, x => x.freq = e.target.value)}>
                  {FREQUENCIES.map(f => <option key={f.code} value={f.code}>{f.code} — {f.label}</option>)}
                </select>
              </td>
              <td><input className="in num" type="number" min="0" value={m.days} onChange={e => mut(m.id, x => x.days = Number(e.target.value))} /></td>
              <td><button className="icon" onClick={() => update(s => s.medicines = s.medicines.filter(x => x.id !== m.id))} aria-label="Delete medicine">✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
