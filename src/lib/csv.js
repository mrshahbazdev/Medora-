/** CSV export of the whole store — patients, visits, prescribed items. */
function cell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
const row = (arr) => arr.map(cell).join(',');

export function exportCsv(store) {
  const out = [];
  out.push('# Medora export — ' + new Date().toISOString().slice(0, 10));

  out.push('');
  out.push('[patients]');
  out.push(row(['mrn', 'name', 'age', 'age_unit', 'gender', 'phone', 'address', 'allergies', 'notes', 'registered']));
  for (const p of store.patients) {
    out.push(row([p.mrn, p.name, p.age, p.ageUnit, p.gender, p.phone, (p.address || '').replace(/\n/g, ' '), p.allergies, p.notes, (p.createdAt || '').slice(0, 10)]));
  }

  out.push('');
  out.push('[visits]');
  out.push(row(['date', 'mrn', 'patient', 'complaint', 'diagnosis', 'bp', 'pulse', 'temp', 'weight', 'spo2', 'medicines', 'follow_up_days', 'fee']));
  for (const v of store.visits) {
    const p = store.patients.find(x => x.id === v.patientId) || {};
    const meds = (v.items || []).map(i => `${i.name} ${i.strength || ''} ${i.freq} x${i.days}d`.trim()).join('; ');
    out.push(row([v.date, p.mrn || '', p.name || '', v.complaint, v.diagnosis,
      v.vitals?.bp, v.vitals?.pulse, v.vitals?.temp, v.vitals?.weight, v.vitals?.spo2,
      meds, v.followUpDays, v.fee]));
  }

  out.push('');
  out.push('[medicines]');
  out.push(row(['name', 'generic', 'form', 'strength', 'default_freq', 'default_days']));
  for (const m of store.medicines) {
    out.push(row([m.name, m.generic, m.form, m.strength, m.freq, m.days]));
  }

  return out.join('\n');
}
