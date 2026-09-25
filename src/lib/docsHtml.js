// One-page clinical documents sharing the Rx pad's header: medical
// certificate (sick note) and referral letter.
import { rxCss } from './rxHtml.js';
import { ageText } from './model.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function head(st) {
  return `<div class="rxhead ${st.template}">
    <div class="rx-doc">
      <div class="rx-docname">${esc(st.doctorName)}</div>
      <div class="rx-docsub">${esc(st.qualifications)}${st.licenseNo ? ` · ${esc(st.licenseNo)}` : ''}</div>
    </div>
    <div class="rx-clinic">
      <div class="rx-clinicname">${esc(st.clinicName)}</div>
      <div class="rx-docsub">${esc(st.clinicAddress)}</div>
      <div class="rx-docsub">${esc(st.clinicPhone)}${st.clinicTimings ? ` · ${esc(st.clinicTimings)}` : ''}</div>
    </div>
  </div>`;
}

function foot(st) {
  return `<div class="rx-foot">
    <div></div>
    <div class="rx-sign">${st.signatureDataUrl ? `<img src="${st.signatureDataUrl}" style="max-height:14mm;display:block;margin:0 auto 1mm">` : ''}${esc(st.doctorName)}${st.qualifications ? `<div style="font-size:7.5pt;color:#475569;font-weight:400">${esc(st.qualifications)}</div>` : ''}</div>
  </div>`;
}

function page(size, inner) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${rxCss(size, 'classic')}
  .cert-title { text-align: center; font-size: 14pt; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; margin: 8mm 0 6mm; text-decoration: underline; }
  .cert-body { font-size: 11pt; line-height: 2; }
  .cert-body b { border-bottom: 0.5px solid #0f172a; padding: 0 2mm; }
  </style></head><body><div class="rxpage">${inner}</div></body></html>`;
}

export function medicalCertificateHtml({ store, patient, visit, restDays, text }) {
  const st = store.settings;
  const size = st.paperSize === 'a4' ? { w: 210, h: 297 } : { w: 148, h: 210 };
  const inner = `${head(st)}
    <div class="cert-title">Medical Certificate</div>
    <div class="cert-body">
      ${text ? esc(text) : `This is to certify that <b>${esc(patient.name)}</b>,
      ${patient.gender ? esc(patient.gender) + ', ' : ''}${esc(ageText(patient))},
      has been under my treatment for <b>${esc(visit?.diagnosis || visit?.complaint || 'illness')}</b>.
      ${restDays ? ` ${patient.gender === 'Female' ? 'She' : 'He'} is advised rest for <b>${esc(String(restDays))} day${Number(restDays) === 1 ? '' : 's'}</b> from ${esc(visit?.date || new Date().toISOString().slice(0, 10))}.` : ''}`}
    </div>
    <div style="margin-top:8mm;font-size:9pt">Date: ${esc(new Date().toISOString().slice(0, 10))} &nbsp;·&nbsp; MRN ${esc(patient.mrn)}</div>
    ${foot(st)}`;
  return page(size, inner);
}

export function referralLetterHtml({ store, patient, visit, toDoctor, toFacility, reason }) {
  const st = store.settings;
  const size = st.paperSize === 'a4' ? { w: 210, h: 297 } : { w: 148, h: 210 };
  const meds = (visit?.items || []).map(i => `${i.name} ${i.strength || ''}`).join(', ');
  const inner = `${head(st)}
    <div class="cert-title">Referral Letter</div>
    <div class="cert-body">
      To: <b>${esc(toDoctor || 'The Consultant')}</b>${toFacility ? `, ${esc(toFacility)}` : ''}<br>
      Dear Doctor,<br>
      I am referring <b>${esc(patient.name)}</b>
      (${patient.gender ? esc(patient.gender) + ', ' : ''}${esc(ageText(patient))}, MRN ${esc(patient.mrn)})
      for your expert opinion and further management${reason ? ` of <b>${esc(reason)}</b>` : ''}.<br>
      ${visit?.diagnosis ? `Current diagnosis: <b>${esc(visit.diagnosis)}</b>.<br>` : ''}
      ${meds ? `Current medication: ${esc(meds)}.<br>` : ''}
      ${patient.allergies ? `Known allergies: <b>${esc(patient.allergies)}</b>.<br>` : ''}
      Kindly see the patient at your earliest convenience. Thank you.
    </div>
    <div style="margin-top:8mm;font-size:9pt">Date: ${esc(new Date().toISOString().slice(0, 10))}</div>
    ${foot(st)}`;
  return page(size, inner);
}

export function followUpSms({ store, patient, visit }) {
  const st = store.settings;
  const d = new Date(visit.date); d.setDate(d.getDate() + Number(visit.followUpDays || 0));
  const due = d.toISOString().slice(0, 10);
  return `Dear ${patient.name}, this is a reminder from ${st.clinicName || 'the clinic'} (${st.doctorName}). ` +
    `Your follow-up visit is due on ${due}. Timings: ${st.clinicTimings || 'clinic hours'}. ` +
    `Call ${st.clinicPhone || 'the clinic'} to confirm.`;
}


// ---- Queue token slip: small slip the receptionist prints and hands over ----
export function tokenSlipHtml({ store, patient, item }) {
  const st = store.settings;
  const doc = (st.doctors || []).find(d => d.id === item.doctorId);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: 80mm 120mm; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; }
    .slip { width: 80mm; min-height: 110mm; padding: 8mm; text-align: center; }
    .clinic { font-size: 9pt; font-weight: 700; border-bottom: 1px dashed #94a3b8; padding-bottom: 3mm; }
    .clinic-sub { font-size: 6.5pt; color: #64748b; font-weight: 400; }
    .tok { font-size: 34pt; font-weight: 800; color: #0d9488; margin: 6mm 0 1mm; }
    .toklab { font-size: 7pt; letter-spacing: 0.15em; color: #64748b; text-transform: uppercase; }
    .pname { font-size: 11pt; font-weight: 700; margin-top: 5mm; }
    .meta { font-size: 8pt; color: #475569; margin-top: 1mm; }
    .rule { border-top: 1px dashed #94a3b8; margin: 5mm 0 3mm; }
    .foot { font-size: 7pt; color: #64748b; }
  </style></head><body><div class="slip">
    <div class="clinic">${esc(st.clinicName || 'Clinic')}<div class="clinic-sub">${esc(st.clinicAddress || '')} · ${esc(st.clinicPhone || '')}</div></div>
    <div class="toklab">Token No.</div>
    <div class="tok">${item.tokenNo ?? '—'}</div>
    <div class="pname">${esc(patient.name)}</div>
    <div class="meta">${patient.gender ? esc(patient.gender) + ', ' : ''}${esc(ageText(patient))} · MRN ${esc(patient.mrn)}</div>
    <div class="rule"></div>
    <div class="meta">${doc ? `<b>${esc(doc.name)}</b>${doc.room ? ' — ' + esc(doc.room) : ''}` : (item.room ? esc(item.room) : '')}</div>
    <div class="meta">${esc(item.at)}${st.clinicTimings ? ' · ' + esc(st.clinicTimings) : ''}</div>
    <div class="rule"></div>
    <div class="foot">Please wait for your turn.<br>اپنا نمبر آنے کا انتظار کریں</div>
  </div></body></html>`;
}

export function dayRegisterHtml({ store, date, rows }) {
  const st = store.settings;
  const total = rows.reduce((t, r) => t + (Number(r.visit.fee) || 0), 0);
  const tr = rows.map((r, i) => `<tr>
    <td>${i + 1}</td><td>${esc(r.patient.mrn)}</td><td><b>${esc(r.patient.name)}</b><br><span class="sm">${r.patient.gender ? esc(r.patient.gender) + ', ' : ''}${esc(ageText(r.patient))}</span></td>
    <td>${esc(r.visit.complaint || '—')}</td><td>${esc(r.visit.diagnosis || '—')}</td>
    <td>${r.visit.items.length}</td><td class="fee">${Number(r.visit.fee) ? `Rs ${r.visit.fee}` : '—'}</td>
    <td>${esc((st.doctors || []).find(d => d.id === r.visit.doctorId)?.name || st.doctorName || '')}</td>
  </tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A4 landscape; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; }
    .sheet { width: 297mm; min-height: 210mm; padding: 12mm 14mm; }
    h1 { font-size: 15pt; color: #134e4a; }
    .sub { font-size: 8.5pt; color: #64748b; margin: 1mm 0 5mm; }
    table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
    th { background: #0d9488; color: #fff; text-align: left; padding: 2mm 2.5mm; font-size: 7.5pt; letter-spacing: .05em; text-transform: uppercase; }
    td { padding: 2mm 2.5mm; border-bottom: 0.4pt solid #cbd5e1; vertical-align: top; }
    tr:nth-child(even) td { background: #f0fdfa; }
    .sm { font-size: 7.5pt; color: #64748b; }
    .fee { font-weight: 700; }
    .tot { margin-top: 5mm; display: flex; justify-content: space-between; font-size: 10pt; font-weight: 700; }
    .sign { margin-top: 12mm; display: flex; justify-content: flex-end; font-size: 9pt; }
  </style></head><body><div class="sheet">
    <h1>${esc(st.clinicName || 'Clinic')} — OPD Day Register</h1>
    <div class="sub">${esc(st.clinicAddress || '')} · ${esc(st.clinicPhone || '')} · Date: ${date}</div>
    <table><thead><tr><th>#</th><th>MRN</th><th>Patient</th><th>Complaint</th><th>Diagnosis</th><th>Meds</th><th>Fee</th><th>Doctor</th></tr></thead>
    <tbody>${tr || '<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:8mm">No visits on this date.</td></tr>'}</tbody></table>
    <div class="tot"><span>Patients seen: ${rows.length}</span><span>Total collected: Rs ${total}</span></div>
    <div class="sign"><div>${esc(st.doctorName || 'Doctor')} — Signature</div></div>
  </div></body></html>`;
}

export function patientCardHtml({ store, patient }) {
  const st = store.settings;
  const bars = Array.from(patient.mrn).map(c => `<i style="display:inline-block;width:${(c.charCodeAt(0)%3)+1}px;height:100%;background:#0f172a"></i>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: 86mm 54mm; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; }
    .card { width: 86mm; height: 54mm; border: 1px solid #0d9488; border-radius: 3mm; overflow: hidden; }
    .head { background: #0d9488; color: #fff; padding: 2.5mm 4mm; font-size: 8pt; font-weight: 700; display: flex; justify-content: space-between; }
    .head small { font-weight: 400; opacity: .85; }
    .body { padding: 3mm 4mm; }
    .nm { font-size: 11pt; font-weight: 800; color: #134e4a; }
    .mrn { font-family: Consolas, monospace; font-size: 12pt; letter-spacing: 0.12em; margin: 1mm 0; }
    .meta { font-size: 7pt; color: #475569; }
    .bc { height: 7mm; margin-top: 2.5mm; display: flex; align-items: flex-end; gap: 1px; }
    .foot { font-size: 6.5pt; color: #94a3b8; padding: 0 4mm 2mm; }
  </style></head><body><div class="card">
    <div class="head"><span>${esc(st.clinicName || 'Clinic')} — Patient Card</span><small>${esc(st.clinicPhone || '')}</small></div>
    <div class="body">
      <div class="nm">${esc(patient.name)}</div>
      <div class="mrn">${esc(patient.mrn)}</div>
      <div class="meta">${patient.gender ? esc(patient.gender) + ' · ' : ''}${esc(ageText(patient))} · ${esc(patient.phone || '')}${patient.allergies ? ' · ⚠ ' + esc(patient.allergies) : ''}</div>
      <div class="bc">${bars}</div>
    </div>
    <div class="foot">Bring this card on every visit · ہر وزٹ پر یہ کارڈ ساتھ لائیں</div>
  </div></body></html>`;
}

export function dischargeSummaryHtml({ store, patient, adm }) {
  const st = store.settings;
  const doc = (st.doctors || []).find(d => d.id === adm.doctorId);
  const days = adm.dischargedOn ? Math.max(1, Math.round((new Date(adm.dischargedOn) - new Date(adm.admittedOn)) / 86400000) + 1) : '';
  return `<!doctype html><html><head><meta charset="utf-8"><style>${rxCss ? '' : ''}
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; }
    .pg { width: 210mm; min-height: 250mm; padding: 18mm 20mm; }
    h1 { font-size: 16pt; color: #134e4a; text-align: center; }
    .sub { text-align: center; font-size: 8.5pt; color: #64748b; margin-bottom: 8mm; }
    h2 { font-size: 10pt; color: #0d9488; text-transform: uppercase; letter-spacing: .08em; margin: 6mm 0 2mm; border-bottom: 1px solid #99f6e4; padding-bottom: 1mm; }
    .row { display: flex; gap: 6mm; font-size: 10pt; margin: 1.5mm 0; }
    .row b { min-width: 45mm; }
    .box { font-size: 10pt; line-height: 1.6; white-space: pre-wrap; }
    .sig { display: flex; justify-content: space-between; margin-top: 20mm; font-size: 9pt; }
    .sig div { border-top: 1px solid #0f172a; padding-top: 2mm; width: 55mm; text-align: center; }
  </style></head><body><div class="pg">
    <h1>${esc(st.clinicName || 'Clinic')}</h1>
    <div class="sub">${esc(st.clinicAddress || '')} · ${esc(st.clinicPhone || '')} · DISCHARGE SUMMARY</div>
    <h2>Patient</h2>
    <div class="row"><b>Name</b><span>${esc(patient.name)}</span><b>MRN</b><span>${esc(patient.mrn)}</span></div>
    <div class="row"><b>Age / Gender</b><span>${esc(ageText(patient))}${patient.gender ? ' / ' + esc(patient.gender) : ''}</span><b>Ward / Bed</b><span>${esc(adm.ward)}${adm.bed ? ' / Bed ' + esc(adm.bed) : ''}</span></div>
    <div class="row"><b>Admitted</b><span>${esc(adm.admittedOn)}</span><b>Discharged</b><span>${esc(adm.dischargedOn)}${days ? ` (${days} day${days > 1 ? 's' : ''})` : ''}</span></div>
    <h2>Diagnosis & treatment</h2>
    <div class="box">${esc(adm.note || '—')}</div>
    <h2>Discharge advice</h2>
    <div class="box">${esc(adm.dischargeNote || 'Continue medicines as advised. Follow up in OPD.')}</div>
    <div class="sig"><div>Date</div><div>${esc(doc ? doc.name : (st.doctorName || 'Doctor'))}</div></div>
  </div></body></html>`;
}
