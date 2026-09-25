import React from 'react';
import { ageText, uid, nextToken, patientVisits, visitPatient } from '../lib/model.js';

const today = () => new Date().toISOString().slice(0, 10);

export default function Dashboard({ store, update, openPatient, openRx }) {
  const t = today();
  const branch = store.settings.activeBranch || '';
  const queue = store.queue.filter(q => q.at === t && q.status !== 'done' && (!branch || (q.branch || '') === branch));
  const backupAge = store.settings.lastBackupAt ? Math.floor((new Date(t) - new Date(store.settings.lastBackupAt)) / 86400000) : null;
  const backupStale = backupAge === null || backupAge > 7;
  const visitsToday = store.visits.filter(v => v.date === t);
  const feesToday = visitsToday.reduce((n, v) => n + (Number(v.fee) || 0), 0);

  // Follow-ups: latest visit per patient with a followUpDays landing on/before today.
  const followUps = store.visits
    .filter(v => v.followUpDays)
    .map(v => ({ v, due: addDays(v.date, Number(v.followUpDays)) }))
    .filter(x => x.due <= t)
    .filter(x => !store.visits.some(later => later.patientId === x.v.patientId && later.date > x.v.date))
    .sort((a, b) => a.due.localeCompare(b.due));

  return (
    <div className="panel">
      {backupStale && (
        <div className="warn" style={{ marginBottom: 12 }}>
          💾 {backupAge === null ? 'No backup made yet' : `Last backup ${backupAge} days ago`} — click <b>Backup</b> in the top bar to save a copy{store.settings.backupFolder ? ` to ${store.settings.backupFolder}` : ''}.
        </div>)}
      <div className="cards" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {(() => {
          const waits = (store.queue || []).filter(q => q.at === t && q.calledAt && q.createdAt).map(q => Math.round((q.calledAt - q.createdAt) / 60000));
          const avg = waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : null;
          return avg != null ? <div className="card"><div className="clabel">Avg wait today</div><div className="cnum">{avg} min</div></div> : null;
        })()}
        <div className="card"><div className="clabel">In queue today</div><div className="cval">{queue.length}</div><div className="csub">waiting patients</div></div>
        <div className="card ok"><div className="clabel">Seen today</div><div className="cval">{visitsToday.length}</div><div className="csub">prescriptions written</div></div>
        <div className="card"><div className="clabel">Collected today</div><div className="cval">{feesToday || '—'}</div><div className="csub">consultation fees</div></div>
        <div className="card"><div className="clabel">Patients on record</div><div className="cval">{store.patients.length}</div><div className="csub">{store.visits.length} visits total</div></div>
        {(store.vaccines || []).some(v => !v.doneAt && v.dueAt <= t) && (
          <div className="card"><div className="clabel">Vaccines due</div><div className="cval">{(store.vaccines || []).filter(v => !v.doneAt && v.dueAt <= t).length}</div><div className="csub">see Vaccination tab</div></div>)}
      </div>

      {(() => {
        const soon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
        const expiring = (store.medicines || []).filter(m => m.expiry && m.expiry <= soon);
        return expiring.length ? <div className="warn" style={{ marginBottom: 14 }}>🧾 {expiring.length} medicine(s) expiring within 30 days: {expiring.slice(0, 6).map(m => `${m.name} (${m.expiry})`).join(', ')}{expiring.length > 6 ? '…' : ''}</div> : null;
      })()}
      {(() => {
        const ancDue = [];
        store.patients.forEach(p => {
          const lv = patientVisits(store, p.id).filter(v => v.anc?.edd).sort((a, b) => b.date.localeCompare(a.date))[0];
          if (lv && lv.anc.edd && lv.anc.edd <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)) ancDue.push({ p, edd: lv.anc.edd });
        });
        const chronicOver = store.patients.filter(p => p.chronic && !store.visits.some(v => v.patientId === p.id && v.date >= new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10)));
        if (!ancDue.length && !chronicOver.length) return null;
        return (
          <div className="warn" style={{ marginBottom: 14 }}>
            {ancDue.map(x => <div key={'a' + x.p.id}>🤰 <b>{x.p.name}</b> — EDD {x.edd} (ANC due)</div>)}
            {chronicOver.slice(0, 6).map(p => <div key={'c' + p.id}>⏰ <b>{p.name}</b> — {p.chronic} follow-up overdue (60+ days)</div>)}
          </div>
        );
      })()}
      <h2 className="ptitle">Today's queue</h2>
      {queue.length === 0 && <p className="muted">Queue is empty. Add patients from the Queue tab or the Patients list.</p>}
      {queue.map((q, i) => {
        const p = visitPatient(store, { patientId: q.patientId }) || store.patients.find(x => x.id === q.patientId);
        if (!p) return null;
        return (
          <div className="qrow" key={q.id}>
            <div className="qnum">{q.tokenNo || i + 1}</div>{q.branch && <span className="muted" style={{ fontSize: 10.5 }}>{(store.settings.branches || []).find(b => b.id === q.branch)?.name}</span>}
            <div style={{ flex: 1 }}>
              <b>{p.name}</b> <span className="muted">{p.gender}, {ageText(p)} · MRN {p.mrn}</span>
              <div className="muted" style={{ fontSize: 11.5 }}>
                Token {q.tokenNo || i + 1}{q.room ? ` · ${q.room}` : ''}{(store.settings.doctors || []).find(d => d.id === q.doctorId) ? ` · ${(store.settings.doctors || []).find(d => d.id === q.doctorId).name}` : ''}
              </div>
            </div>
            <span className={'pill ' + (q.status === 'in-progress' ? 'st-partial' : 'st-draft')}>{q.status}</span>
            <button className="btn small" onClick={() => openRx(p.id, 'new')}>Write Rx</button>
            <button className="btn small ghost" onClick={() => update(s => { const x = s.queue.find(z => z.id === q.id); if (x) x.status = 'done'; })}>Done</button>
          </div>
        );
      })}

      <h2 className="ptitle">This week's appointments</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[0, 1, 2, 3, 4, 5, 6].map(i => {
          const d = new Date(Date.now() + i * 86400000).toISOString().slice(0, 10);
          const day = (store.appointments || []).filter(a => a.date === d);
          return (
            <div key={d} style={{ minWidth: 110, flex: 1, border: '1px solid var(--line)', borderRadius: 10, padding: 8, background: i === 0 ? '#f0fdfa' : 'var(--card)' }}>
              <div className="muted" style={{ fontSize: 11, fontWeight: 700 }}>{new Date(d).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
              {day.length === 0 && <div className="muted" style={{ fontSize: 11 }}>—</div>}
              {day.map(a => {
                const p = store.patients.find(x => x.id === a.patientId);
                const clash = day.filter(x => x !== a && x.doctorId === a.doctorId).length > 0;
                return <div key={a.id} style={{ fontSize: 11, marginTop: 4 }}>• {p ? p.name : '?'} {clash && <span style={{ color: '#dc2626' }} title="Possible double-booking">⚠</span>}</div>;
              })}
            </div>
          );
        })}
      </div>

      <h2 className="ptitle">Appointments due</h2>
      {(store.appointments || []).filter(a => a.date <= t).length === 0 ? (
        <p className="muted">No pending appointments.</p>
      ) : (
        (store.appointments || []).filter(a => a.date <= t).sort((a, b) => a.date.localeCompare(b.date)).map(a => {
          const p = store.patients.find(x => x.id === a.patientId);
          if (!p) return null;
          return (
            <div className="qrow" key={a.id}>
              <div className="qnum" style={{ background: 'var(--cta)' }}>◷</div>
              <div style={{ flex: 1 }}>
                <b>{p.name}</b> <span className="muted">{a.date === t ? 'today' : `overdue — ${a.date}`}{a.note ? ` · ${a.note}` : ''}</span>
              </div>
              <button className="btn small ghost" onClick={() => update(s => { s.appointments = s.appointments.filter(x => x.id !== a.id); const d = t; s.queue.push({ id: uid(), patientId: p.id, at: d, tokenNo: nextToken(s, d), room: s.settings.rooms?.[0] || '', doctorId: a.doctorId || '', status: 'waiting', createdAt: Date.now(), note: a.note || '' }); })}>Check in</button>
              <button className="icon" onClick={() => update(s => s.appointments = s.appointments.filter(x => x.id !== a.id))} aria-label="Remove appointment">✕</button>
            </div>
          );
        })
      )}

      <h2 className="ptitle">Top diagnoses this month</h2>
      {(() => {
        const m = t.slice(0, 7);
        const counts = {};
        store.visits.forEach(v => { if (v.date.startsWith(m) && v.diagnosis) counts[v.diagnosis] = (counts[v.diagnosis] || 0) + 1; });
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
        return top.length === 0
          ? <p className="muted">No diagnoses recorded this month.</p>
          : <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{top.map(([dx, n]) => <span key={dx} className="dxchip">{dx} <b>×{n}</b></span>)}</div>;
      })()}

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
