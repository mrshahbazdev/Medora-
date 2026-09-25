import { medLabelHtml } from '../lib/docsHtml.js';
import React, { useMemo, useState } from 'react';
import { uid } from '../lib/model.js';
import { FREQUENCIES } from '../lib/meds.js';
import { medBillHtml } from '../lib/docsHtml.js';

export default function MedsPanel({ store, update }) {
  const sell = (m) => {
    const qty = Number(prompt(`Quantity of ${m.name}:`, '1')) || 0;
    if (!qty) return;
    const price = Number(prompt(`Price per unit (Rs) — ${m.name}:`, m.price || '0')) || 0;
    const pick = prompt('Patient name or MRN (optional):', '');
    const patient = pick ? store.patients.find(p => p.name.toLowerCase() === pick.toLowerCase() || (p.mrn || '') === pick) : { name: pick || 'Walk-in', mrn: '' };
    update(s => {
      const med = s.medicines.find(x => x.id === m.id);
      if (med.stock !== '' && med.stock != null) med.stock = Math.max(0, Number(med.stock) - qty);
      s.sales = s.sales || [];
      s.sales.push({ id: 'sl' + Date.now(), patientId: patient.id || '', date: new Date().toISOString().slice(0, 10), items: [{ name: m.name, qty, price }], total: qty * price, kind: 'pharmacy' });
    });
    window.api.export.print({ html: medBillHtml({ store, patient, items: [{ name: m.name, qty, price }], total: qty * price }) });
  };
  const [q, setQ] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const lowStock = store.medicines.filter(m => m.stock !== '' && m.stock != null && Number(m.stock) <= 10);
  const expiring = store.medicines.filter(m => m.expiry && m.expiry <= today.slice(0, 8) + '99').sort((a, b) => a.expiry.localeCompare(b.expiry));
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
      {(lowStock.length > 0 || expiring.length > 0) && (
        <div className="warn" style={{ marginBottom: 10 }}>
          {lowStock.length > 0 && <div>⚠ Low stock: {lowStock.map(m => `${m.name} (${m.stock})`).join(', ')}</div>}
          {expiring.length > 0 && <div>⚠ Expiring soon: {expiring.slice(0, 5).map(m => `${m.name} — ${m.expiry}`).join(', ')}</div>}
        </div>
      )}
      <table className="grid">
        <thead><tr><th>Brand name</th><th>Generic</th><th>Form</th><th>Strength</th><th>Default freq</th><th className="num">Days</th><th className="num">Stock</th><th>Expiry</th><th>Price</th><th></th></tr></thead>
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
              <td><input className="in num" type="number" min="0" style={{ width: 62, borderColor: (m.stock !== '' && m.stock != null && Number(m.stock) <= 10) ? '#fca5a5' : undefined }} value={m.stock ?? ''} onChange={e => mut(m.id, x => x.stock = e.target.value === '' ? '' : Number(e.target.value))} /></td>
              <td><input className="in" type="date" style={{ width: 128 }} value={m.expiry || ''} onChange={e => mut(m.id, x => x.expiry = e.target.value)} /></td>
              <td><input className="in num" type="number" min="0" style={{ width: 70 }} value={m.price ?? ''} onChange={e => mut(m.id, x => x.price = e.target.value === '' ? '' : Number(e.target.value))} /></td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <button className="btn small ghost" onClick={() => sell(m)}>Sell</button>
                <button className="icon" onClick={() => update(s => s.medicines = s.medicines.filter(x => x.id !== m.id))} aria-label="Delete medicine">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
