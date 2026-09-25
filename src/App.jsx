import React, { useEffect, useRef, useState } from 'react';
import { emptyStore, sampleStore, newPatient, patientMrn, uid } from './lib/model.js';
import Dashboard from './components/Dashboard.jsx';
import PatientsPanel from './components/PatientsPanel.jsx';
import QueuePanel from './components/QueuePanel.jsx';
import MedsPanel from './components/MedsPanel.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import DayBookPanel from './components/DayBookPanel.jsx';
import { exportCsv } from './lib/csv.js';

const TABS = [
  { id: 'dash', label: 'Dashboard' },
  { id: 'queue', label: 'Queue' },
  { id: 'patients', label: 'Patients' },
  { id: 'meds', label: 'Medicines' },
  { id: 'daybook', label: 'Day book' },
  { id: 'settings', label: 'Settings' }
];

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

  const exportAllJson = () => window.api.export.json({ json: JSON.stringify(store, null, 2), suggestedName: 'medora-backup.json' });
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
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Medora</div>
        <nav className="tabs">
          {TABS.map(t => (
            <button key={t.id} className={'tab' + (tab === t.id ? ' on' : '')} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </nav>
        <div className="top-actions">
          <button className="btn ghost" onClick={exportAllJson} title="Backup everything as JSON">Backup</button>
          <button className="btn ghost" onClick={exportAllCsv}>Export CSV</button>
          <button className="btn ghost" onClick={importJson}>Import</button>
          <button className="btn" onClick={addPatient}>+ Patient</button>
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
        {tab === 'settings' && <SettingsPanel store={store} update={update} setStore={setStore} />}
      </main>
      <footer className="foot">Medora v{version} — offline patient register &amp; prescription pad. Nothing leaves this computer.</footer>
    </div>
  );
}
