import React, { useEffect, useRef, useState } from 'react';
import { emptyStore, sampleStore, newPatient, patientMrn, uid } from './lib/model.js';
import Dashboard from './components/Dashboard.jsx';
import PatientsPanel from './components/PatientsPanel.jsx';
import QueuePanel from './components/QueuePanel.jsx';
import MedsPanel from './components/MedsPanel.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import DayBookPanel from './components/DayBookPanel.jsx';
import AdmissionsPanel from './components/AdmissionsPanel.jsx';
import { exportCsv } from './lib/csv.js';

const NAV = [
  { sec: 'Front desk', secUr: 'رجسٹرار', items: [
    { id: 'dash', label: 'Dashboard', ur: 'ڈیش بورڈ', glyph: '⌂' },
    { id: 'queue', label: 'Token queue', ur: 'ٹوکن قطار', glyph: '≡' },
    { id: 'patients', label: 'Patients', ur: 'مریض', glyph: '◉' },
    { id: 'wards', label: 'Wards / IPD', ur: 'وارڈ', glyph: '⌂' },
    { id: 'daybook', label: 'Day book', ur: 'روزنامچہ', glyph: '▤' }
  ]},
  { sec: 'Clinic', secUr: 'کلینک', items: [
    { id: 'meds', label: 'Medicines', ur: 'ادویات', glyph: '℞' },
    { id: 'settings', label: 'Settings', ur: 'ترتیبات', glyph: '⚙' }
  ]}
];
const RECEPTION_TABS = ['queue', 'daybook'];

export default function App() {
  const [store, setStore] = useState(null);
  const [tab, setTab] = useState('dash');
  const [patientId, setPatientId] = useState(null);
  const [rxVisitId, setRxVisitId] = useState(null); // visit open in Rx editor
  const [version, setVersion] = useState('');
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const { doc } = await window.api.store.load();
      setStore(doc && Array.isArray(doc.patients) ? doc : sampleStore());
      setVersion(await window.api.app.version().catch(() => ''));
    })();
  }, []);

  useEffect(() => {
    if (!store) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => window.api.store.save(store), 600);
    return () => clearTimeout(saveTimer.current);
  }, [store]);

  const update = (fn) => setStore(s => {
    const next = structuredClone(s);
    fn(next);
    return next;
  });

  const openPatient = (id) => { setPatientId(id); setRxVisitId(null); setTab('patients'); };
  const openRx = (patientId, visitId) => { setPatientId(patientId); setRxVisitId(visitId); setTab('patients'); };

  const addPatient = () => {
    const p = newPatient();
    p.mrn = patientMrn(store);
    update(s => s.patients.unshift(p));
    openPatient(p.id);
  };

  const exportAllJson = () => {
    window.api.export.json({ json: JSON.stringify(store, null, 2), suggestedName: 'medora-backup.json' });
    update(s => s.settings.lastBackupAt = new Date().toISOString().slice(0, 10));
  };
  const exportAllCsv = () => window.api.export.text({ text: exportCsv(store), suggestedName: 'medora-patients.csv' });
  const importJson = async () => {
    const f = await window.api.app.openFile({ filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (!f?.text) return;
    try {
      const parsed = JSON.parse(f.text);
      if (!parsed.patients) throw new Error('not a Medora backup');
      await window.api.store.snapshot(store, 'before import');
      setStore({ ...emptyStore(), ...parsed });
    } catch (e) { alert('Could not import: ' + e.message); }
  };

  if (!store) return <div className="boot">Loading…</div>;

  const firstRun = !store.settings.firstRunDone;
  const ur = !!store.settings.uiUrdu;
  const reception = !!store.settings.receptionMode;
  const nav = reception
    ? NAV.map(g => ({ ...g, items: g.items.filter(i => RECEPTION_TABS.includes(i.id)) })).filter(g => g.items.length)
    : NAV;
  if (reception && !RECEPTION_TABS.includes(tab)) setTab('queue');
  return (
    <div className="app" dir={ur ? 'rtl' : 'ltr'}>
      <aside className="side">
        <div className="sbrand"><span className="smark">✚</span><div><div className="sname">Medora</div><div className="ssub">Clinic OS</div></div></div>
        {nav.map(g => (
          <div key={g.sec} className="sgrp">
            <div className="ssec">{ur ? (g.secUr || g.sec) : g.sec}</div>
            {g.items.map(t => (
              <button key={t.id} className={'snav' + (tab === t.id ? ' on' : '')} onClick={() => setTab(t.id)}>
                <span className="sglyph">{t.glyph}</span>{ur ? (t.ur || t.label) : t.label}
              </button>
            ))}
          </div>
        ))}
        <div className="sfoot">
          <div className="sdotline"><span className="sdot" />Offline</div>
          <span>Data stays on this computer</span>
        </div>
      </aside>

      <div className="main">
        <header className="status">
          <div className="stline">
            <b>{store.settings.clinicName || 'Clinic'}</b>
            <span className="opd">OPD open</span>
            <span className="muted">{(store.settings.doctors || [])[0]?.name || store.settings.doctorName || ''}</span>
            {(store.settings.branches || []).length > 0 && (
              <select className="in" style={{ padding: '3px 8px', fontSize: 12 }} value={store.settings.activeBranch || ''} title="Branch"
                onChange={e => update(s => s.settings.activeBranch = e.target.value)}>
                <option value="">Main branch</option>
                {store.settings.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>)}
            {reception && <span className="opd" style={{ background: '#fde68a', color: '#92400e' }}>Receptionist</span>}
          </div>
          <span className="spacer" />
          <div className="top-actions">
            <button className="btn ghost" onClick={exportAllJson} title="Backup everything as JSON">Backup</button>
            <button className="btn ghost" onClick={exportAllCsv}>CSV</button>
            <button className="btn ghost" onClick={importJson}>Import</button>
            <button className="btn" onClick={addPatient}>+ New patient</button>
          </div>
        </header>

      {firstRun && (
        <div className="welcome">
          <h1>Welcome to Medora</h1>
          <p>A sample clinic (Dr. Ayesha Khan, City Care Clinic) with 8 patients, 4 visits and a full medicine library is loaded so you can try everything — write a prescription, print it, work through today's queue.</p>
          <div className="welcome-actions">
            <button className="btn" onClick={() => update(s => { s.settings.firstRunDone = true; })}>Explore sample data</button>
            <button className="btn ghost" onClick={() => { setStore(emptyStore()); setTab('settings'); }}>Start blank — set up my clinic</button>
          </div>
        </div>
      )}

          <main className="body">
        {tab === 'dash' && <Dashboard store={store} update={update} openPatient={openPatient} openRx={openRx} />}
        {tab === 'queue' && <QueuePanel store={store} update={update} openPatient={openPatient} openRx={openRx} />}
        {tab === 'patients' && <PatientsPanel store={store} update={update} patientId={patientId} setPatientId={setPatientId} rxVisitId={rxVisitId} setRxVisitId={setRxVisitId} />}
        {tab === 'meds' && <MedsPanel store={store} update={update} />}
        {tab === 'daybook' && <DayBookPanel store={store} update={update} />}
        {tab === 'wards' && <AdmissionsPanel store={store} update={update} />}
        {tab === 'settings' && <SettingsPanel store={store} update={update} setStore={setStore} />}
        </main>
        <footer className="foot">Medora v{version} — offline patient register &amp; prescription pad. Nothing leaves this computer.</footer>
      </div>
    </div>
  );
}
