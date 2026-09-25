import { PRESET_MEDS } from './meds.js';

export const uid = () => Math.random().toString(36).slice(2, 10);

export function emptyStore() {
  return {
    version: 1,
    patients: [],
    visits: [],
    medicines: [],
    queue: [],
    appointments: [],
    admissions: [],
    labs: [],
    vaccines: [],
    staff: [],
    attendance: [],
    payroll: [],
    insurers: [],
    auditLog: [],
    sales: [],
    otSchedule: [], bloodBank: [], referrals: [], nursing: [],
    expenses: [],
    branches: [],
    settings: defaultSettings()
  };
}

export function defaultSettings() {
  return {
    doctorName: '', qualifications: '', licenseNo: '',
    clinicName: '', clinicAddress: '', clinicPhone: '', clinicTimings: '',
    signatureDataUrl: '',
    doctors: [], // { id, name, qualifications, room }
    rooms: [],
    paperSize: 'a5', // 'a5' | 'a4'
    padStyle: 'letter', // 'letter' | 'label' | 'form'
    receptionMode: false,
    uiUrdu: false,
    users: [],
    letterhead: { logoDataUrl: '', accent: '#0d9488', showMrn: true, showAgeSex: true, showPhone: true },
    syncFolder: '',
    smsTemplates: [
      { id: 's1', name: 'Appointment reminder', text: 'Assalam o Alaikum {name}, aap ki appointment {date} ko {clinic} mein hai. — {doctor}' },
      { id: 's2', name: 'Report ready', text: '{name}, aap ki lab report {clinic} se collect ho sakti hai. — {doctor}' },
      { id: 's3', name: 'Follow-up due', text: '{name}, aap ka check-up due hai. Please visit {clinic}. — {doctor}' }
    ],
    backupFolder: '',
    lastBackupAt: '',
    wards: ['General Ward', 'Private Room', 'ICU'],
    branches: [],
    template: 'classic', // 'classic' | 'modern'
    bilingual: true,
    showVitals: true,
    showFee: true,
    firstRunDone: false
  };
}

export function newPatient() {
  return {
    id: uid(), mrn: '', name: '', age: '', ageUnit: 'years',
    gender: '', phone: '', address: '', dob: '', allergies: '', notes: '',
    height: '', chronic: '', photoDataUrl: '', referredBy: '', familyId: '', tag: '',
    createdAt: new Date().toISOString()
  };
}

export const newLab = (patientId, { test, result, note }) => ({
  status: result ? 'done' : 'ordered',
  id: uid(), patientId, test: test || '', result: result || '', note: note || '', date: new Date().toISOString().slice(0, 10)
});

export const newVaccine = (patientId, { vaccine, dueAt }) => ({
  id: uid(), patientId, vaccine: vaccine || '', dueAt: dueAt || '', doneAt: ''
});

export function newVisit(patientId) {
  return {
    id: uid(), patientId, date: new Date().toISOString().slice(0, 10),
    complaint: '', diagnosis: '',
    vitals: { bp: '', pulse: '', temp: '', weight: '', spo2: '' },
    items: [], // { id, name, form, strength, freq, days, note }
    investigations: [],
    type: 'opd',
    eye: { od: { sph: '', cyl: '', axis: '', add: '' }, os: { sph: '', cyl: '', axis: '', add: '' } },
    dental: [],
    anc: { gravida: '', para: '', edd: '', fhr: '', fundal: '' },
    procedure: { name: '', anesthesia: '', findings: '', surgeon: '' },
    advice: [],
    doctorId: '',
    followUpDays: '',
    fee: ''
  };
}

export function patientMrn(store) {
  const max = store.patients.reduce((m, p) => Math.max(m, parseInt(p.mrn, 10) || 0), 0);
  return String(max + 1).padStart(4, '0');
}

export function ageText(p) {
  if (p.age === '' || p.age == null) return '';
  return `${p.age} ${p.ageUnit === 'years' ? 'y' : p.ageUnit === 'months' ? 'm' : 'd'}`;
}

export function visitPatient(store, v) {
  return store.patients.find(p => p.id === v.patientId) || null;
}

export function patientVisits(store, patientId) {
  return store.visits.filter(v => v.patientId === patientId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function newAdmission(patientId, { ward, bed, doctorId, note }) {
  return { id: uid(), patientId, ward: ward || '', bed: bed || '', doctorId: doctorId || '',
    admittedOn: new Date().toISOString().slice(0, 10), dischargedOn: '', note: note || '' };
}

export function newAppointment({ patientId, date, doctorId, note }) {
  return { id: uid(), patientId, date, doctorId: doctorId || '', note: note || '' };
}

export function nextToken(store, date) {
  return store.queue.filter(q => q.at === date).reduce((m, q) => Math.max(m, q.tokenNo || 0), 0) + 1;
}

export function doctorOf(store, visit) {
  return (store.settings.doctors || []).find(d => d.id === visit?.doctorId) || null;
}

export function freqOf(code) {
  return { code, label: code, pattern: code, urdu: '' };
}

export function sampleStore() {
  const s = emptyStore();
  const st = s.settings;
  st.doctorName = 'Dr. Ayesha Khan';
  st.qualifications = 'MBBS, FCPS (Medicine)';
  st.licenseNo = 'PMDC-12345-P';
  st.clinicName = 'City Care Clinic';
  st.clinicAddress = '14-B Main Boulevard, Gulberg, Lahore';
  st.clinicPhone = '0300-1234567';
  st.clinicTimings = 'Mon–Sat  5:00 PM – 9:00 PM';
  st.rooms = ['Room 1', 'Room 2', 'Emergency'];
  st.doctors = [
    { id: 'd1', name: 'Dr. Ayesha Khan', qualifications: 'MBBS, FCPS (Medicine)', room: 'Room 1' },
    { id: 'd2', name: 'Dr. Bilal Hussain', qualifications: 'MBBS, MCPS (Family Medicine)', room: 'Room 2' }
  ];

  s.medicines = PRESET_MEDS.map((m, i) => ({ id: `pm${i}`, ...m }));

  const pts = [
    { name: 'Muhammad Imran', age: 42, ageUnit: 'years', gender: 'Male', phone: '0321-4455667', allergies: '' },
    { name: 'Fatima Noor', age: 28, ageUnit: 'years', gender: 'Female', phone: '0333-7788990', allergies: 'Penicillin' },
    { name: 'Ali Raza', age: 7, ageUnit: 'years', gender: 'Male', phone: '0345-1122334', allergies: '' },
    { name: 'Saima Bibi', age: 55, ageUnit: 'years', gender: 'Female', phone: '0301-9988776', allergies: 'Aspirin' },
    { name: 'Usman Tariq', age: 35, ageUnit: 'years', gender: 'Male', phone: '0322-5566778', allergies: '' },
    { name: 'Amina Siddiqui', age: 4, ageUnit: 'years', gender: 'Female', phone: '0300-2233445', allergies: '' },
    { name: 'Bashir Ahmed', age: 63, ageUnit: 'years', gender: 'Male', phone: '0321-8899001', allergies: '' },
    { name: 'Rabia Aslam', age: 31, ageUnit: 'years', gender: 'Female', phone: '0334-6655443', allergies: '' }
  ];
  pts.forEach((p, i) => {
    s.patients.push({ ...newPatient(), ...p, id: `p${i + 1}`, mrn: String(i + 1).padStart(4, '0') });
  });

  const today = new Date().toISOString().slice(0, 10);
  const d = (n) => { const x = new Date(); x.setDate(x.getDate() - n); return x.toISOString().slice(0, 10); };
  const med = (idx) => s.medicines[idx];

  s.visits.push(
    { ...newVisit('p1'), id: 'v1', date: d(9), complaint: 'Fever with body aches', diagnosis: 'Viral fever',
      vitals: { bp: '120/80', pulse: '88', temp: '101', weight: '72', spo2: '98' },
      items: [
        { id: uid(), name: med(0).name, form: 'Tab', strength: '500mg', freq: 'TDS', days: 3, note: 'after meals' },
        { id: uid(), name: med(24).name, form: 'Tab', strength: '', freq: 'TDS', days: 3, note: '' }
      ],
      advice: [0, 4, 11], followUpDays: 3, fee: '1500' },
    { ...newVisit('p1'), id: 'v2', date: d(2), complaint: 'Follow-up — fever settled, mild cough', diagnosis: 'URTI — improving',
      vitals: { bp: '118/78', pulse: '76', temp: '98.6', weight: '72', spo2: '99' },
      items: [
        { id: uid(), name: med(22).name, form: 'Syrup', strength: '', freq: 'TDS', days: 5, note: '2 tsp' }
      ],
      advice: [4, 5], followUpDays: '', fee: '1000' },
    { ...newVisit('p2'), id: 'v3', date: d(4), complaint: 'Skin rash / itching', diagnosis: 'Allergic dermatitis',
      vitals: { bp: '110/70', pulse: '72', temp: '98.4', weight: '58', spo2: '99' },
      items: [
        { id: uid(), name: med(16).name, form: 'Tab', strength: '10mg', freq: 'OD', days: 7, note: '' },
        { id: uid(), name: med(50).name, form: 'Cream', strength: '0.1%', freq: 'BD', days: 7, note: 'apply thin layer' }
      ],
      advice: [6], followUpDays: 7, fee: '1500' },
    { ...newVisit('p4'), id: 'v4', date: today, complaint: 'High blood pressure check', diagnosis: 'Hypertension',
      vitals: { bp: '150/95', pulse: '80', temp: '98.6', weight: '80', spo2: '98' },
      items: [
        { id: uid(), name: med(31).name, form: 'Tab', strength: '5mg', freq: 'OD', days: 30, note: '' }
      ],
      advice: [8, 10], followUpDays: 30, fee: '2000' }
  );

  s.admissions = [];
  s.expenses = [
    { id: uid(), date: today, title: 'Disposables', amount: '400' },
    { id: uid(), date: today, title: 'Cleaning staff', amount: '1500' }
  ];
  s.appointments = [
    { id: uid(), patientId: 'p1', date: today, doctorId: 'd1', note: 'BP review' },
    { id: uid(), patientId: 'p2', date: today, doctorId: 'd1', note: 'Postnatal check' }
  ];
  s.queue = [
    { id: uid(), patientId: 'p5', at: today, tokenNo: 1, room: 'Room 1', doctorId: 'd1', status: 'waiting', note: '' },
    { id: uid(), patientId: 'p6', at: today, tokenNo: 2, room: 'Room 1', doctorId: 'd1', status: 'waiting', note: '' },
    { id: uid(), patientId: 'p7', at: today, tokenNo: 3, room: 'Room 2', doctorId: 'd2', status: 'waiting', note: '' },
    { id: uid(), patientId: 'p8', at: today, tokenNo: 4, room: 'Room 2', doctorId: 'd2', status: 'waiting', note: '' }
  ];
  return s;
}
