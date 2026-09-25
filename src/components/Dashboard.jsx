import React from 'react';
import { ageText, patientVisits, visitPatient } from '../lib/model.js';

const today = () => new Date().toISOString().slice(0, 10);

export default function Dashboard({ store, update, openPatient, openRx }) {
  const t = today();
  const queue = store.queue.filter(q => q.at === t && q.status !== 'done');
  const visitsToday = store.visits.filter(v => v.date === t);

  // Follow-ups: latest visit per patient with a followUpDays landing on/before today.
  const followUps = store.visits
    .filter(v => v.followUpDays)
    .map(v => ({ v, due: addDays(v.date, Number(v.followUpDays)) }))
    .filter(x => x.due <= t)
    .filter(x => !store.visits.some(later => later.patientId === x.v.patientId && later.date > x.v.date))
    .sort((a, b) => a.due.localeCompare(b.due));

  return (
    <div className="panel">
      <div className="cards">
        <div className="card"><div className="clabel">In queue today</div><div className="cval">{queue.length}</div><div className="csub">waiting patients</div></div>
        <div className="card ok"><div className="clabel">Seen today</div><div className="cval">{visitsToday.length}</div><div className="csub">prescriptions written</div></div>
        <div className="card"><div className="clabel">Patients on record</div><div className="cval">{store.patients.length}</div><div className="csub">{store.visits.length} visits total</div></div>
      </div>

      <h2 className="ptitle">Today's queue</h2>
      {queue.length === 0 && <p className="muted">Queue is empty. Add patients from the Queue tab or the Patients list.</p>}
      {queue.map((q, i) => {
        const p = visitPatient(store, { patientId: q.patientId }) || store.patients.find(x => x.id === q.patientId);
        if (!p) return null;
        return (
          <div className="qrow" key={q.id}>
            <div className="qnum">{i + 1}</div>
            <div style={{ flex: 1 }}>
              <b>{p.name}</b> <span className="muted">{p.gender}, {ageText(p)} · MRN {p.mrn}</span>
            </div>
            <span className={'pill ' + (q.status === 'in-progress' ? 'st-partial' : 'st-draft')}>{q.status}</span>
            <button className="btn small" onClick={() => openRx(p.id, 'new')}>Write Rx</button>
            <button className="btn small ghost" onClick={() => update(s => { const x = s.queue.find(z => z.id === q.id); if (x) x.status = 'done'; })}>Done</button>
          </div>
        );
      })}

      <h2 className="ptitle">Follow-ups due</h2>
      {followUps.length === 0 && <p className="muted">No pending follow-ups.</p>}
      {followUps.slice(0, 10).map(({ v, due }) => {
        const p = visitPatient(store, v);
        if (!p) return null;
        return (
          <div className="qrow" key={v.id}>
            <div style={{ flex: 1 }}>
              <b>{p.name}</b> <span className="muted">— {v.diagnosis || v.complaint}</span>
            </div>
            <span className={'pill ' + (due < t ? 'st-overdue' : 'st-sent')}>{due < t ? 'overdue ' : ''}{due}</span>
            <button className="btn small ghost" onClick={() => openPatient(p.id)}>Open</button>
          </div>
        );
      })}
    </div>
  );
}

function addDays(iso, n) {
  const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10);
}
