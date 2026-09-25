import React, { useEffect, useRef, useState } from 'react';
import { emptyStore, sampleStore, newPatient, patientMrn, uid } from './lib/model.js';
import Dashboard from './components/Dashboard.jsx';
import PatientsPanel from './components/PatientsPanel.jsx';
import QueuePanel from './components/QueuePanel.jsx';
import MedsPanel from './components/MedsPanel.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import DayBookPanel from './components/DayBookPanel.jsx';
import AdmissionsPanel from './components/AdmissionsPanel.jsx';
import LabPanel from './components/LabPanel.jsx';
import VaccinesPanel from './components/VaccinesPanel.jsx';
import StaffPanel from './components/StaffPanel.jsx';
import StatsPanel from './components/StatsPanel.jsx';
import TvDisplay from './components/TvDisplay.jsx';
import PinGate from './components/PinGate.jsx';
import { installWebApi } from './lib/webapi.js';

// When this bundle is opened in a plain browser on another PC (LAN host mode)
// there is no Electron api — install the fetch shim before anything calls it.
installWebApi();
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
    { id: 'labs', label: 'Lab reports', ur: 'لیب', glyph: '∴' },
    { id: 'vaccines', label: 'Vaccination', ur: 'ویکسین', glyph: '💉' },
    { id: 'meds', label: 'Medicines', ur: 'ادویات', glyph: '℞' },
    { id: 'staff', label: 'Staff', ur: 'عملہ', glyph: '⚕' },
    { id: 'stats', label: 'Monthly stats', ur: 'رپورٹ', glyph: '☷' },
    { id: 'settings', label: 'Settings', ur: 'ترتیبات', glyph: '⚙' }
  ]}
];
const RECEPTION_TABS = ['queue', 'daybook'];

export default function App() {
  if (new URLSearchParams(window.location.search).get('tv') === '1') return <TvDisplay />;
  const [store, setStore] = useState(null);
  const [user, setUser] = useState(null);
  const idleRef = useRef(null);
  useEffect(() => {
    if (!user) return;
    const reset = () => { clearTimeout(idleRef.current); idleRef.current = setTimeout(() => setUser(null), 10 * 60 * 1000); };
    ['mousemove', 'keydown', 'click'].forEach(e => window.addEventListener(e, reset));
    reset();
    return () => { clearTimeout(idleRef.current); ['mousemove', 'keydown', 'click'].forEach(e => window.removeEventListener(e, reset)); };
  }, [user]);
  const [tab, setTab] = useState('dash');
  const [patientId, setPatientId] = useState(null);
  const [rxVisitId, setRxVisitId] = useState(null); // visit open in Rx editor
  const [version, setVersion] = useState('');
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const { doc } = await window.api.store.load();
      if (doc && Array.isArray(doc.patients)) {
        const base = emptyStore();
        Object.keys(base).forEach(k => { if (doc[k] === undefined) doc[k] = base[k]; });
        ['ledger', 'purchases', 'otSchedule', 'bloodBank', 'referrals', 'nursing', 'attendance', 'payroll'].forEach(k => { if (!Array.isArray(doc[k])) doc[k] = []; });
        setStore(doc);
      } else setStore(sampleStore());
      setVersion(await window.api.app.version().catch(() => ''));
    })();
  }, []);

  useEffect(() => {
    if (!store) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      window.api.store.save(store);
      if (store.settings.syncFolder) {
        const text = JSON.stringify(store);
        window.api.export.toFolder({ folder: store.settings.syncFolder, name: 'medora-sync.json', text });
        syncText.current = text;
      }
      if (store.settings.syncAuto !== false) window.api.sync.publish(store);
    }, 600);
    return () => clearTimeout(saveTimer.current);
  }, [store]);

  // Zero-config LAN sync: when another Medora instance on the network has a
  // newer store, apply it here automatically (no shared folder needed).
  useEffect(() => {
    if (!window.api.sync?.onApply) return;
    window.api.sync.onApply(doc => {
      const base = emptyStore();
      Object.keys(base).forEach(k => { if (doc[k] === undefined) doc[k] = base[k]; });
      ['ledger', 'purchases', 'otSchedule', 'bloodBank', 'referrals', 'nursing', 'attendance', 'payroll'].forEach(k => { if (!Array.isArray(doc[k])) doc[k] = []; });
      setStore(doc);
      setSyncFlash(Date.now());
    });
  }, []);

  // LAN auto-sync: poll the shared sync file; when another PC on the network
  // writes a newer store, adopt it locally (ignores our own writes).
  const syncText = useRef('');
  const [syncFlash, setSyncFlash] = useState(0);
  useEffect(() => {
    const t = setInterval(async () => {
      const folder = store?.settings?.syncFolder;
      if (!folder || store?.settings?.syncAuto === false) return;
      const res = await window.api.export.readFromFolder({ folder, name: 'medora-sync.json' }).catch(() => null);
      if (!res?.ok || !res.text) return;
      if (res.text === syncText.current || res.text === JSON.stringify(store)) return;
      try {
        const doc = JSON.parse(res.text);
        if (!doc || !Array.isArray(doc.patients)) return;
        const base = emptyStore();
        Object.keys(base).forEach(k => { if (doc[k] === undefined) doc[k] = base[k]; });
        ['ledger', 'purchases', 'otSchedule', 'bloodBank', 'referrals', 'nursing', 'attendance', 'payroll'].forEach(k => { if (!Array.isArray(doc[k])) doc[k] = []; });
        syncText.current = res.text;
        setStore(doc);
        setSyncFlash(Date.now());
      } catch { /* partial write — try again next poll */ }
    }, 5000);
    return () => clearInterval(t);
  }, [store]);

  const update = (fn, label) => setStore(s => {
    const next = structuredClone(s);
    fn(next);
    next.auditLog = next.auditLog || [];
    next.updatedAt = Date.now();
    next.auditLog.push({ at: new Date().toISOString(), user: (user && user.name) || 'app', what: label || 'edit' });
    if (next.auditLog.length > 500) next.auditLog = next.auditLog.slice(-500);
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
    const json = JSON.stringify(store, null, 2);
    window.api.export.json({ json, suggestedName: 'medora-backup.json' });
    if (store.settings.backupFolder)
      window.api.export.toFolder({ folder: store.settings.backupFolder, name: `medora-backup-${new Date().toISOString().slice(0, 10)}.json`, text: json });
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

  if (new URLSearchParams(window.location.search).get('kiosk') === '1')
    return <div style={{ zoom: 1.6, maxWidth: 1100, margin: '12px auto', padding: '0 16px' }}><QueuePanel store={store} update={update} /></div>;

  if ((store.settings.users || []).length && !user)
    return <PinGate store={store} onLogin={setUser} />;

  const firstRun = !store.settings.firstRunDone;
  const ur = !!store.settings.uiUrdu;
  const reception = !!store.settings.receptionMode || (user && user.role === 'reception');
  const nav = reception
    ? NAV.map(g => ({ ...g, items: g.items.filter(i => RECEPTION_TABS.includes(i.id)) })).filter(g => g.items.length)
    : NAV;
  if (reception && !RECEPTION_TABS.includes(tab)) setTab('queue');
  const navForUser = (user && user.role === 'doctor') ? nav.map(g => ({ ...g, items: g.items.filter(i => !['staff', 'settings'].includes(i.id)) })).filter(g => g.items.length) : nav;
  return (
    <div className="app" dir={ur ? 'rtl' : 'ltr'}>
      <aside className="side">
        <div className="sbrand"><span className="smark">✚</span><div><div className="sname">Medora</div><div className="ssub">Clinic OS</div></div></div>
        {navForUser.map(g => (
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
            {store.settings.syncAuto !== false && (
              <span className="opd" title="Auto-sync on — updates move between Medora apps on this WiFi/LAN automatically"
                style={Date.now() - syncFlash < 8000 ? { background: '#bbf7d0', color: '#166534' } : { background: '#e0f2fe', color: '#0369a1' }}>
                ↻ Live sync
              </span>)}
            {user && <span className="muted">👤 {user.name} <button className="icon" title="Lock" onClick={() => setUser(null)}>🔒</button></span>}
            <button className="icon" title="Waiting-room TV board" onClick={() => window.open(window.location.href.split('?')[0] + '?tv=1', '_blank')}>📺</button>
            <button className="icon" title="Token kiosk screen" onClick={() => window.open(window.location.href.split('?')[0] + '?kiosk=1', '_blank')}>🖥</button>
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
          <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.6, maxWidth: 560 }}>
            <b>Your consent & privacy:</b> by using Medora you agree that patient health data (names, diagnoses,
            prescriptions, visits) is entered and stored <b>only on this computer</b> — encrypted at rest.
            Nothing is uploaded or shared unless you turn on Local connection yourself. Medora is a
            record-keeping and printing tool — <b>not clinical decision support</b>; the treating doctor
            remains responsible for every medical decision.
          </p>
          <div className="welcome-actions">
            <button className="btn" onClick={() => update(s => { s.settings.firstRunDone = true; })}>Explore sample data</button>
            <button className="btn ghost" onClick={() => { setStore(emptyStore()); setTab('settings'); }}>Start blank — set up my clinic</button>
          </div>
        </div>
      )}

          <main className="body">
        {tab === 'dash' && <Dashboard store={store} update={update} openPatient={openPatient} openRx={openRx} />}
        {tab === 'queue' && <QueuePanel store={store} update={update} openPatient={openPatient} openRx={openRx} />}
        {tab === 'patients' && <PatientsPanel store={store} update={update} patientId={patientId} setPatientId={setPatientId} rxVisitId={rxVisitId} setRxVisitId={setRxVisitId} user={user} />}
        {tab === 'meds' && <MedsPanel store={store} update={update} />}
        {tab === 'daybook' && <DayBookPanel store={store} update={update} />}
        {tab === 'wards' && <AdmissionsPanel store={store} update={update} />}
        {tab === 'labs' && <LabPanel store={store} update={update} />}
        {tab === 'vaccines' && <VaccinesPanel store={store} update={update} />}
        {tab === 'staff' && <StaffPanel store={store} update={update} />}
        {tab === 'stats' && <StatsPanel store={store} update={update} />}
        {tab === 'settings' && <SettingsPanel store={store} update={update} setStore={setStore} />}
        </main>
        <footer className="foot">Medora v{version} — offline patient register &amp; prescription pad. Data is encrypted on this computer. Not clinical decision support.</footer>
      </div>
    </div>
  );
}
