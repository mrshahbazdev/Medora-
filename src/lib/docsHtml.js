// One-page clinical documents sharing the Rx pad's header: medical
// certificate (sick note) and referral letter.
import { rxCss } from './rxHtml.js';
import { ageText } from './model.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function head(st) {
  // Pre-printed letterhead: leave topMm mm for the clinic's printed header.
  if (st.letterhead?.prePrinted) return `<div style="height:${Number(st.letterhead.topMm) || 40}mm"></div>`;
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


export function labReportHtml({ store, patient, labs, visit }) {
  const st = store.settings;
  const esc = (x) => String(x || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rows = labs.map(l => `<tr><td>${esc(l.test)}</td><td><b>${esc(l.result)}</b></td><td>${esc(l.note || '')}</td><td>${esc(l.date)}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A5; margin: 0; } * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; }
    .pg { width: 210mm; min-height: 148mm; padding: 10mm 12mm; font-size: 9.5pt; }
    .hd { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 2.5mm; margin-bottom: 4mm; }
    .hd b { font-size: 14pt; color: #134e4a; } .hd span { font-size: 8pt; color: #64748b; }
    .pt { display: flex; gap: 16px; font-size: 8.5pt; margin-bottom: 3mm; color: #334155; }
    table { width: 100%; border-collapse: collapse; } th { background: #f0fdfa; color: #0d9488; font-size: 8pt; text-align: left; }
    th, td { border: 1px solid #cbd5e1; padding: 4px 8px; }
    .sig { margin-top: 12mm; text-align: right; font-size: 8pt; color: #475569; }
  </style></head><body><div class="pg">
    <div class="hd"><b>${esc(st.clinicName || 'Clinic')} — Lab Report</b><span>${esc(st.clinicAddress || '')} · ${esc(st.clinicPhone || '')}</span></div>
    <div class="pt"><span><b>Patient:</b> ${esc(patient.name)}</span><span><b>MRN:</b> ${esc(patient.mrn || '')}</span><span><b>Age/Sex:</b> ${esc(ageText(patient))}${patient.sex ? ' / ' + esc(patient.sex) : ''}</span><span><b>Date:</b> ${labs[0] ? esc(labs[0].date) : ''}</span></div>
    <table><thead><tr><th style="width:35%">Test</th><th style="width:30%">Result</th><th style="width:20%">Reference / note</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="sig">Checked by: ______________ &nbsp;&nbsp; ${esc((st.doctors || [])[0]?.name || st.doctorName || '')}</div>
  </div></body></html>`;
}

export function vaccinationCardHtml({ store, patient, vaccines }) {
  const st = store.settings;
  const esc = (x) => String(x || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rows = vaccines.map(v => `<tr><td>${esc(v.vaccine)}</td><td>${esc(v.dueAt)}</td><td>${v.doneAt ? '✓ ' + esc(v.doneAt) : '—'}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A5 landscape; margin: 0; } * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; }
    .pg { width: 210mm; min-height: 148mm; padding: 10mm 12mm; font-size: 9.5pt; }
    .hd { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 2mm; margin-bottom: 4mm; }
    .hd b { font-size: 13pt; color: #134e4a; } .hd span { font-size: 8pt; color: #64748b; }
    .pt { font-size: 8.5pt; margin-bottom: 3mm; color: #334155; }
    table { width: 100%; border-collapse: collapse; } th { background: #f0fdfa; color: #0d9488; font-size: 8pt; }
    th, td { border: 1px solid #cbd5e1; padding: 4px 8px; }
  </style></head><body><div class="pg">
    <div class="hd"><b>${esc(st.clinicName || 'Clinic')} — Vaccination Card</b><span>${esc(st.clinicPhone || '')}</span></div>
    <div class="pt"><b>${esc(patient.name)}</b> · ${esc(ageText(patient))} · MRN ${esc(patient.mrn || '')} · Father/Guardian: ${esc(patient.guardian || '')}</div>
    <table><thead><tr><th>Vaccine</th><th>Due date</th><th>Given on</th></tr></thead><tbody>${rows}</tbody></table>
  </div></body></html>`;
}

export function monthlyReportHtml({ store, month, rows }) {
  const st = store.settings;
  const esc = (x) => String(x || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const body = rows.map(r => `<tr><td>${esc(r.label)}</td><td style="text-align:right"><b>${esc(r.value)}</b></td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 0; } * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; }
    .pg { width: 210mm; min-height: 297mm; padding: 14mm; font-size: 10pt; }
    .hd { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 3mm; margin-bottom: 5mm; }
    .hd b { font-size: 15pt; color: #134e4a; } .hd span { font-size: 8.5pt; color: #64748b; }
    table { width: 100%; border-collapse: collapse; } td, th { border-bottom: 1px solid #e2e8f0; padding: 6px 8px; }
  </style></head><body><div class="pg">
    <div class="hd"><b>${esc(st.clinicName || 'Clinic')} — Monthly Report</b><span>${esc(month)}</span></div>
    <table>${body}</table>
    <div style="margin-top:14mm;text-align:right;font-size:8.5pt;color:#475569">Prepared by: ______________</div>
  </div></body></html>`;
}


const _esc = (x) => String(x || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const _certCss = `
  @page { size: A5; margin: 0; } * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; }
  .pg { width: 210mm; min-height: 148mm; padding: 12mm 14mm; font-size: 10pt; }
  .hd { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 2.5mm; margin-bottom: 5mm; }
  .hd b { font-size: 14pt; color: #134e4a; } .hd span { font-size: 8pt; color: #64748b; }
  .body { line-height: 1.9; } .sig { margin-top: 14mm; display: flex; justify-content: space-between; font-size: 8.5pt; color: #475569; }
`;

export function fitnessCertHtml({ store, patient, purpose }) {
  const st = store.settings;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${_certCss}</style></head><body><div class="pg">
    <div class="hd"><b>${_esc(st.clinicName || 'Clinic')}</b><span>${_esc(st.clinicAddress || '')} · ${_esc(st.clinicPhone || '')}</span></div>
    <h3 style="text-align:center;font-size:12pt;letter-spacing:1px;margin-bottom:4mm">MEDICAL FITNESS CERTIFICATE</h3>
    <p class="body">This is to certify that <b>${_esc(patient.name)}</b>, ${_esc(ageText(patient))}${patient.gender ? ', ' + _esc(patient.gender) : ''} (MRN ${_esc(patient.mrn || '')}), has been examined at this clinic on <b>${new Date().toISOString().slice(0, 10)}</b> and is found medically <b>FIT</b>${purpose ? ' for <b>' + _esc(purpose) + '</b>' : ''}.</p>
    <div class="sig"><span>MRN: ${_esc(patient.mrn || '')}</span><span>____________________<br>${_esc(st.doctorName || '')}<br>${_esc(st.qualifications || '')}</span></div>
  </div></body></html>`;
}

export function medBillHtml({ store, patient, items, total }) {
  const st = store.settings;
  const rows = items.map(i => `<tr><td>${_esc(i.name)}</td><td style="text-align:center">${i.qty}</td><td style="text-align:right">${i.price || ''}</td><td style="text-align:right"><b>${i.qty * (Number(i.price) || 0)}</b></td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: 80mm 200mm; margin: 0; } * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 8.5pt; }
    .b { width: 80mm; padding: 4mm; }
    .hd { text-align: center; border-bottom: 1.5px solid #0d9488; padding-bottom: 2mm; margin-bottom: 2.5mm; }
    table { width: 100%; border-collapse: collapse; } th { font-size: 7pt; color: #0d9488; text-align: left; border-bottom: 1px solid #cbd5e1; }
    td { padding: 2px 2px; border-bottom: 1px dashed #e2e8f0; }
    .tot { text-align: right; font-weight: 800; font-size: 10pt; margin-top: 2mm; }
  </style></head><body><div class="b">
    <div class="hd"><b>${_esc(st.clinicName || 'Clinic')} — Pharmacy</b><br><span style="font-size:6.5pt;color:#64748b">${_esc(st.clinicPhone || '')}</span></div>
    <div style="margin-bottom:2mm">${_esc(patient.name)} · ${_esc(patient.mrn || '')} · ${new Date().toISOString().slice(0, 10)}</div>
    <table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amt</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="tot">Total: Rs ${total}</div>
  </div></body></html>`;
}

export function procedureNoteHtml({ store, patient, visit }) {
  const st = store.settings;
  const p = visit.procedure || {};
  return `<!doctype html><html><head><meta charset="utf-8"><style>${_certCss}
    .row { display: flex; gap: 10mm; margin-bottom: 3mm; } .lbl { font-size: 8pt; color: #0d9488; text-transform: uppercase; letter-spacing: 0.5px; }
  </style></head><body><div class="pg">
    <div class="hd"><b>${_esc(st.clinicName || 'Clinic')} — Procedure / OT Note</b><span>${_esc(st.clinicPhone || '')}</span></div>
    <div class="row"><span class="lbl">Patient</span><b>${_esc(patient.name)}</b><span class="lbl">MRN</span>${_esc(patient.mrn || '')}<span class="lbl">Date</span>${_esc(visit.date)}</div>
    <div class="row"><span class="lbl">Procedure</span><b>${_esc(p.name || visit.diagnosis || '')}</b></div>
    <div class="row"><span class="lbl">Anesthesia</span>${_esc(p.anesthesia || '—')}<span class="lbl">Surgeon</span>${_esc(p.surgeon || st.doctorName || '')}</div>
    <div class="lbl">Findings / notes</div><p class="body">${_esc(p.findings || visit.complaint || '')}</p>
    <div class="sig"><span></span><span>____________________<br>${_esc(st.doctorName || '')}</span></div>
  </div></body></html>`;
}


export function ancCardHtml({ store, patient, visits }) {
  const st = store.settings;
  const esc = (x) => String(x || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const anc = visits.filter(v => v.type === 'anc' || (v.anc && (v.anc.gravida || v.anc.edd)));
  const latest = anc[0]?.anc || {};
  const rows = anc.slice().reverse().map(v => `<tr><td>${esc(v.date)}</td><td>${esc(v.vitals?.bp || '')}</td><td>${esc(v.vitals?.weight || '')}</td><td>${esc(v.anc?.fhr || '')}</td><td>${esc(v.anc?.fundal || '')}</td><td>${esc(v.diagnosis || v.complaint || '')}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A5 landscape; margin: 0; } * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 8.5pt; }
    .pg { width: 210mm; padding: 9mm 11mm; }
    .hd { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 2mm; margin-bottom: 3mm; }
    .hd b { font-size: 12pt; color: #134e4a; }
    .grid2 { display: flex; gap: 14px; margin-bottom: 3mm; }
    table { width: 100%; border-collapse: collapse; } th { background: #f0fdfa; color: #0d9488; font-size: 7.5pt; }
    th, td { border: 1px solid #cbd5e1; padding: 3px 6px; text-align: left; }
  </style></head><body><div class="pg">
    <div class="hd"><b>${esc(st.clinicName || 'Clinic')} — Antenatal Card</b></div>
    <div class="grid2"><span><b>${esc(patient.name)}</b> · ${esc(ageText(patient))} · MRN ${esc(patient.mrn || '')}</span><span>G${esc(latest.gravida) || '—'} P${esc(latest.para) || '—'} · <b>EDD: ${esc(latest.edd) || '—'}</b></span></div>
    <table><thead><tr><th>Date</th><th>BP</th><th>Weight</th><th>FHR</th><th>Fundal</th><th>Notes</th></tr></thead><tbody>${rows || '<tr><td colspan="6">No ANC visits recorded</td></tr>'}</tbody></table>
  </div></body></html>`;
}

export function opdHandoutHtml({ store, patient, visit }) {
  const st = store.settings;
  const esc = (x) => String(x || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A5; margin: 0; } * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9.5pt; }
    .pg { width: 148mm; padding: 9mm 11mm; }
    .hd { text-align: center; border-bottom: 1.5px solid #0d9488; padding-bottom: 2mm; margin-bottom: 3mm; }
    .hd b { font-size: 12pt; color: #134e4a; }
    .sec { margin-bottom: 3mm; } .lab { font-size: 7.5pt; color: #0d9488; text-transform: uppercase; letter-spacing: .5px; }
    .foot { border-top: 1px dashed #94a3b8; margin-top: 4mm; padding-top: 2mm; font-size: 8pt; color: #475569; }
  </style></head><body><div class="pg">
    <div class="hd"><b>${esc(st.clinicName || 'Clinic')}</b><br><span style="font-size:7.5pt;color:#64748b">Visit summary — ${esc(visit.date)}</span></div>
    <div class="sec"><b>${esc(patient.name)}</b> · ${esc(ageText(patient))} · MRN ${esc(patient.mrn || '')}</div>
    ${visit.diagnosis ? `<div class="sec"><div class="lab">Diagnosis</div>${esc(visit.diagnosis)}</div>` : ''}
    ${(visit.advice || []).length ? `<div class="sec"><div class="lab">Instructions</div><ul style="padding-left:16px">${visit.advice.map(a => `<li>${esc(typeof a === 'object' ? a.en : a)}</li>`).join('')}</ul></div>` : ''}
    ${visit.followUpDays ? `<div class="sec"><div class="lab">Next visit</div>After <b>${esc(visit.followUpDays)} day(s)</b></div>` : ''}
    <div class="foot">${esc(st.clinicPhone || '')} · ${esc(st.clinicTimings || '')}</div>
  </div></body></html>`;
}

export function bundlePrintHtml({ store, patient, visit, rxBody, attachments }) {
  const imgs = (attachments || []).filter(a => a.dataUrl).map(a => `<div style="page-break-before:always;padding:10mm"><img src="${a.dataUrl}" style="max-width:100%"></div>`).join('');
  return rxBody.replace('</body></html>', `${imgs}</body></html>`);
}


export function opdBillHtml({ store, patient, visit }) {
  const st = store.settings;
  const esc = (x) => String(x || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const items = [{ desc: 'Consultation fee', amt: Number(visit.fee) || 0 }];
  (visit.items || []).forEach(i => items.push({ desc: `Medicine: ${i.name} ${i.strength || ''}`, amt: Number(i.price) || 0 }));
  if (visit.procedure?.name) items.push({ desc: `Procedure: ${visit.procedure.name}`, amt: Number(visit.procedure.charge) || 0 });
  const total = items.reduce((t, i) => t + i.amt, 0);
  const rows = items.filter(i => i.amt || true).map((i, n) => `<tr><td>${n + 1}</td><td>${esc(i.desc)}</td><td style="text-align:right">Rs ${i.amt}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: 80mm auto; margin: 0; } * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9pt; }
    .pg { width: 80mm; padding: 6mm; }
    .hd { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 2mm; margin-bottom: 2mm; }
    .hd b { font-size: 11pt; }
    table { width: 100%; border-collapse: collapse; font-size: 8.5pt; } td, th { padding: 2px 2px; }
    .tot { border-top: 1px dashed #000; margin-top: 2mm; padding-top: 2mm; font-weight: 800; font-size: 11pt; display: flex; justify-content: space-between; }
    .foot { text-align: center; font-size: 7.5pt; color: #555; margin-top: 3mm; }
  </style></head><body><div class="pg">
    <div class="hd"><b>${esc(st.clinicName || 'Clinic')}</b><br>OPD Bill — ${esc(visit.date)}</div>
    <div><b>${esc(patient.name)}</b> · MRN ${esc(patient.mrn || '')}</div>
    <table><tr><th>#</th><th>Item</th><th style="text-align:right">Amt</th></tr>${rows}</table>
    ${Number(visit.discount) ? `<div style="display:flex;justify-content:space-between"><span>Discount</span><span>- Rs ${Number(visit.discount)}</span></div>` : ''}
    <div class="tot"><span>TOTAL</span><span>Rs ${total - (Number(visit.discount) || 0)}</span></div>
    <div class="foot">Thank you — get well soon.<br>${esc(st.clinicPhone || '')}</div>
  </div></body></html>`;
}


export function deathCertHtml({ store, patient, adm, doctor }) {
  const st = store.settings;
  const esc = (x) => String(x || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A5; margin: 0; } * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9.5pt; }
    .pg { width: 148mm; padding: 12mm; }
    .hd { text-align: center; border-bottom: 2px solid #333; padding-bottom: 3mm; margin-bottom: 4mm; }
    .hd b { font-size: 13pt; } .body { line-height: 1.9; }
    .sign { margin-top: 18mm; text-align: right; }
  </style></head><body><div class="pg">
    <div class="hd"><b>${esc(st.clinicName || 'Clinic')}</b><br><span style="font-size:9pt">DEATH CERTIFICATE</span></div>
    <div class="body">This is to certify that <b>${esc(patient.name)}</b>, ${esc(ageText(patient))}, MRN ${esc(patient.mrn || '')}, resident of ${esc(patient.address || '—')}, was admitted to this facility${adm ? ` on ${esc(adm.admittedOn)}` : ''} and expired${adm && adm.dischargedOn ? ` on ${esc(adm.dischargedOn)}` : ' on ' + esc(new Date().toISOString().slice(0, 10))}.<br>Cause of death (as per clinical record): ${esc((adm && adm.diagnosis) || '—')}.</div>
    <div class="sign">${st.signatureDataUrl ? `<img src="${st.signatureDataUrl}" style="max-height:14mm">` : ''}<br><b>${esc(doctor || st.doctorName)}</b><br>${esc(st.clinicName)}</div>
  </div></body></html>`;
}

export function otListHtml({ store, date }) {
  const st = store.settings;
  const esc = (x) => String(x || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rows = (store.otSchedule || []).filter(o => o.date === date).sort((a, b) => (a.time || '').localeCompare(b.time || '')).map((o, i) => {
    const p = store.patients.find(x => x.id === o.patientId);
    return `<tr><td>${i + 1}</td><td>${esc(o.time)}</td><td>${esc(p ? p.name : '')}</td><td>${esc(o.procedure)}</td><td>${esc(o.surgeon)}</td><td>${esc(o.anesthesia)}</td><td>${esc(o.status)}</td></tr>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 12mm; } * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9pt; }
    h2 { text-align: center; color: #134e4a; margin-bottom: 4mm; }
    table { width: 100%; border-collapse: collapse; } th { background: #f0fdfa; }
    th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; }
  </style></head><body><h2>${esc(st.clinicName || 'Clinic')} — OT list, ${esc(date)}</h2>
  <table><tr><th>#</th><th>Time</th><th>Patient</th><th>Procedure</th><th>Surgeon</th><th>Anesthesia</th><th>Status</th></tr>${rows || '<tr><td colspan="7">No cases scheduled</td></tr>'}</table></body></html>`;
}

// ---- Cash handover slip (80mm) --------------------------------------------
export const cashHandoverHtml = ({ store, date, fees, expenses, opening = 0 }) => {
  const esc = (x) => String(x ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const st = store.settings || {};
  const expRows = (expenses || []).map(e => `<tr><td>${esc(e.title)}</td><td>${esc(e.category || '')}</td><td class="r">${e.amount}</td></tr>`).join('');
  return `<!doctype html><html><head><style>
    @page { size: 80mm auto; margin: 0 } body { margin:0; font: 9pt/1.45 'Segoe UI',sans-serif; color:#111; width:76mm; padding:2mm }
    .h { text-align:center; border-bottom:1.5px solid #111; padding-bottom:2mm; margin-bottom:2mm }
    table { width:100%; border-collapse:collapse } td { padding:1px 0 } .r { text-align:right }
    .big { font-size:13pt; font-weight:800; text-align:center; border:1.5px solid #111; border-radius:4px; padding:2mm; margin:2mm 0 }
  </style></head><body>
    <div class="h"><b>${esc(st.clinicName || 'Clinic')}</b><br/>CASH HANDOVER SLIP<br/><b>${esc(date)}</b></div>
    <table>
      <tr><td>Opening balance</td><td class="r">Rs ${opening}</td></tr>
      <tr><td>OPD fees collected</td><td class="r">Rs ${fees}</td></tr>
      <tr><td>Expenses</td><td class="r">− Rs ${(expenses || []).reduce((t, e) => t + (Number(e.amount) || 0), 0)}</td></tr>
    </table>
    ${expRows ? `<table style="margin-top:1mm;border-top:1px dashed #888">${expRows}</table>` : ''}
    <div class="big">HANDOVER — Rs ${(opening || 0) + fees - (expenses || []).reduce((t, e) => t + (Number(e.amount) || 0), 0)}</div>
    <table><tr><td>Cashier sign: __________</td><td class="r">Received by: __________</td></tr></table>
    <p style="text-align:center;margin-top:2mm">Medora — cash day end</p>
  </body></html>`;
};

// ---- Medicine shelf barcode label (Code 39, no libs) -----------------------
const C39 = { '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn', '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw', '8': 'wnnwnnwnn', '9': 'nnwwnnwnn', 'A': 'wnnnnwnnw', 'B': 'nnwnnwnnw', 'C': 'wnwnnwnnn', 'D': 'nnnnwwnnw', 'E': 'wnnnwwnnn', 'F': 'nnwnwwnnn', 'G': 'nnnnnwwnw', 'H': 'wnnnnwwnn', 'I': 'nnwnnwwnn', 'J': 'nnnnwwwnn', 'K': 'wnnnnnnww', 'L': 'nnwnnnnww', 'M': 'wnwnnnnwn', 'N': 'nnnnwnnww', 'O': 'wnnnwnnwn', 'P': 'nnwnwnnwn', 'Q': 'nnnnnnwww', 'R': 'wnnnnnwwn', 'S': 'nnwnnnwwn', 'T': 'nnnnwnwwn', 'U': 'wwnnnnnnw', 'V': 'nwwnnnnnw', 'W': 'wwwnnnnnn', 'X': 'nwnnwnnnw', 'Y': 'wwnnwnnnn', 'Z': 'nwwnwnnnn', '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', '*': 'nwnnwnwnn' };
const c39bars = (txt) => ('*' + txt.toUpperCase().replace(/[^0-9A-Z .-]/g, '') + '*').split('').map(ch => {
  const p = C39[ch] || C39[' ']; let out = '';
  for (let i = 0; i < 9; i++) { const w = p[i] === 'w' ? 3 : 1; out += `<span style="display:inline-block;width:${w}px;height:9mm;background:${i % 2 === 0 ? '#000' : '#fff'}"></span>`; }
  return out + '<span style="display:inline-block;width:1px"></span>';
}).join('');
export const medLabelHtml = ({ store, med }) => {
  const esc = (x) => String(x ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return `<!doctype html><html><head><style>@page { size: 60mm 30mm; margin: 0 } body { margin:0; font:8pt/1.3 'Segoe UI',sans-serif; width:58mm; padding:1.5mm; text-align:center }</style></head><body>
    <b style="font-size:9pt">${esc(med.name)}</b> ${esc(med.strength || '')}<br/>
    <span style="font-size:7pt;color:#444">${esc(med.generic || '')} ${med.price ? '· Rs ' + med.price : ''}</span><br/>
    <div style="margin:1mm 0">${c39bars(med.name)}</div>
    <span style="font-size:6.5pt;letter-spacing:1px">${esc((med.name || '').toUpperCase())} — ${esc(store.settings.clinicName || '')}</span>
  </body></html>`;
};

// ---- Consent form -----------------------------------------------------------
export const consentFormHtml = ({ store, patient, procedure }) => `<!doctype html><html><head><style>
  @page { size: A4; margin: 16mm } body { font: 11pt/1.6 'Segoe UI',sans-serif; color:#111 }
  .box { border: 1.5px solid #111; border-radius: 6px; padding: 4mm; margin-top: 4mm }
  .sig { display:flex; gap:20mm; margin-top:14mm } .sig div { flex:1; border-top:1px solid #111; padding-top:2mm; font-size:9pt }
</style></head><body>
  <h2 style="text-align:center;margin:0">${store.settings.clinicName || 'Clinic'}</h2>
  <h3 style="text-align:center">CONSENT FORM / اجازت نامہ</h3>
  <div class="box">
    <b>Patient:</b> ${patient.name} — MRN ${patient.mrn || ''} — Age ${patient.age || ''} ${patient.ageUnit || ''}<br/>
    <b>Procedure / Treatment:</b> ${procedure || '________________'}
  </div>
  <p>I, the undersigned, voluntarily consent to the above procedure/treatment. The nature, benefits, risks and alternatives have been explained to me in a language I understand.<br/>
  <i style="font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif">میں بالرضا و رغبت مذکورہ طریقہ علاج کی اجازت دیتا ہوں۔ مجھے اس کی نوعیت، فائدے اور نقصانات سمجھا دیے گئے ہیں۔</i></p>
  <div class="sig"><div>Patient / Guardian sign</div><div>Witness</div><div>Doctor sign &amp; stamp</div></div>
</body></html>`;

// ---- IPD ward round / progress chart ---------------------------------------
export const ipdChartHtml = ({ store, patient, admission }) => {
  const esc = (x) => String(x ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const doc = (store.settings.doctors || []).find(d => d.id === admission.doctorId);
  const rows = (admission.progress || []).map(p => `<tr><td>${esc(p.at)}</td><td>${esc(p.note)}</td></tr>`).join('');
  const vrows = (admission.vitals || []).map(v => `<tr><td>${esc(v.at)}</td><td>${esc(v.bp)}</td><td>${esc(v.pulse)}</td><td>${esc(v.temp)}</td><td>${esc(v.spo2)}</td></tr>`).join('');
  return `<!doctype html><html><head><style>
    @page { size: A4; margin: 12mm } body { font: 10pt 'Segoe UI',sans-serif } table { width:100%; border-collapse:collapse; margin:3mm 0 }
    td,th { border:1px solid #cbd5e1; padding:4px 6px; text-align:left } th { background:#0d9488; color:#fff }
  </style></head><body>
    <h2 style="margin:0">${store.settings.clinicName || 'Clinic'} — IPD Progress Chart</h2>
    <p><b>${esc(patient.name)}</b> · MRN ${esc(patient.mrn)} · Ward ${esc(admission.ward)} · Bed ${esc(admission.bed)} · Dr. ${esc(doc?.name || '')}<br/>Admitted ${esc(admission.admittedAt || admission.date)} — Dx: ${esc(admission.dx || patient.dx || '')}</p>
    <h3>Vitals log</h3><table><thead><tr><th>Time</th><th>BP</th><th>Pulse</th><th>Temp</th><th>SpO2</th></tr></thead><tbody>${vrows || '<tr><td colspan="5">No vitals logged</td></tr>'}</tbody></table>
    <h3>Progress / orders</h3><table><thead><tr><th>Time</th><th>Note / order</th></tr></thead><tbody>${rows || '<tr><td colspan="2">No notes</td></tr>'}</tbody></table>
    <p style="margin-top:8mm">Doctor sign: ______________</p></body></html>`;
};

// ---- Payroll slip -----------------------------------------------------------
export const payslipHtml = ({ store, staff, month, salary, present }) => `<!doctype html><html><head><style>
  @page { size: A5 landscape; margin: 10mm } body { font: 10pt 'Segoe UI',sans-serif }
  table { width:100%; border-collapse:collapse } td { padding:4px 6px; border:1px solid #e2e8f0 }
  .t { font-size:14pt; font-weight:700; text-align:center }
</style></head><body>
  <div class="t">${store.settings.clinicName || 'Clinic'} — Salary Slip</div>
  <table style="margin-top:4mm">
    <tr><td><b>Staff</b></td><td>${staff.name} (${staff.role || ''})</td></tr>
    <tr><td><b>Month</b></td><td>${month}</td></tr>
    <tr><td><b>Days present</b></td><td>${present}</td></tr>
    <tr><td><b>Salary</b></td><td>Rs ${salary}</td></tr>
  </table>
  <p style="margin-top:8mm">Received by: ______________ &nbsp;&nbsp; Accountant: ______________</p>
</body></html>`;

// ---- Patient ledger print ---------------------------------------------------
export const ledgerHtml = ({ store, patient, entries }) => {
  const esc = (x) => String(x ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let bal = 0;
  const rows = entries.map(e => { bal += (Number(e.debit) || 0) - (Number(e.credit) || 0); return `<tr><td>${esc(e.date)}</td><td>${esc(e.desc)}</td><td class="r">${e.debit || ''}</td><td class="r">${e.credit || ''}</td><td class="r">${bal}</td></tr>`; }).join('');
  return `<!doctype html><html><head><style>
    @page { size: A4; margin: 12mm } body { font: 10pt 'Segoe UI',sans-serif } table { width:100%; border-collapse:collapse }
    td,th { border:1px solid #e2e8f0; padding:4px 6px } th { background:#0d9488; color:#fff; text-align:left } .r { text-align:right }
  </style></head><body>
    <h2 style="margin:0">${store.settings.clinicName || 'Clinic'} — Patient Ledger</h2>
    <p><b>${esc(patient.name)}</b> · MRN ${esc(patient.mrn)} · ${esc(patient.phone || '')}</p>
    <table><thead><tr><th>Date</th><th>Description</th><th>Debit (paid)</th><th>Credit (charge)</th><th>Balance</th></tr></thead><tbody>${rows || '<tr><td colspan="5">No entries</td></tr>'}</tbody></table>
    <p><b>Balance due: Rs ${bal}</b></p></body></html>`;
};

// ---- Fluid input/output chart ----------------------------------------------
export const ioChartHtml = ({ store, patient, adm }) => {
  const esc = (x) => String(x ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rows = (adm.io || []).map(e => `<tr><td>${esc(e.at)}</td><td>${esc(e.kind)}</td><td class="r">${e.ml}</td></tr>`).join('');
  const inn = (adm.io || []).filter(e => e.kind === 'In').reduce((t, e) => t + (Number(e.ml) || 0), 0);
  const out = (adm.io || []).filter(e => e.kind === 'Out').reduce((t, e) => t + (Number(e.ml) || 0), 0);
  return `<!doctype html><html><head><style>
    @page { size: A4; margin: 12mm } body { font:10pt 'Segoe UI',sans-serif } table { width:100%; border-collapse:collapse }
    td,th { border:1px solid #cbd5e1; padding:4px 6px } th { background:#0d9488; color:#fff; text-align:left } .r{text-align:right}
  </style></head><body>
    <h2 style="margin:0">${store.settings.clinicName || 'Clinic'} — Fluid Input/Output Chart</h2>
    <p><b>${esc(patient.name)}</b> · MRN ${esc(patient.mrn)} · Ward ${esc(adm.ward)}</p>
    <table><thead><tr><th>Time</th><th>In / Out</th><th>ml</th></tr></thead><tbody>${rows || '<tr><td colspan="3">No entries</td></tr>'}</tbody></table>
    <p><b>In: ${inn} ml · Out: ${out} ml · Balance: ${inn - out} ml</b></p></body></html>`;
};

// ---- Multipara vitals chart (BP + pulse graph) ------------------------------
export const vitalsChartHtml = ({ store, patient, adm }) => {
  const esc = (x) => String(x ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const vs = (adm.vitals || []).slice(-24);
  const pts = (fn) => vs.map((v, i) => `${40 + i * (700 / Math.max(1, vs.length - 1))},${fn(v)}`).join(' ');
  const sys = v => 200 - ((Number((v.bp || '0/0').split('/')[0]) || 0) - 60) * 1.4;
  const pul = v => 200 - ((Number(v.pulse) || 0) - 30) * 1.1;
  const labels = vs.map((v, i) => `<text x="${40 + i * (700 / Math.max(1, vs.length - 1))}" y="215" font-size="7" text-anchor="middle">${esc((v.at || '').slice(11, 16))}</text>`).join('');
  const svg = vs.length > 1 ? `<svg viewBox="0 0 760 230" style="width:100%;border:1px solid #e2e8f0">
    ${[80, 100, 120, 140, 160, 180].map((y, i) => `<line x1="40" y1="${200 - i * 26}" x2="740" y2="${200 - i * 26}" stroke="#f1f5f9"/><text x="8" y="${204 - i * 26}" font-size="8" fill="#94a3b8">${60 + i * 20}</text>`).join('')}
    <polyline points="${pts(sys)}" fill="none" stroke="#dc2626" stroke-width="2"/>
    <polyline points="${pts(pul)}" fill="none" stroke="#0d9488" stroke-width="2"/>${labels}
    <text x="60" y="20" font-size="9" fill="#dc2626">— Systolic BP</text><text x="150" y="20" font-size="9" fill="#0d9488">— Pulse</text></svg>` : '<p style="color:#94a3b8">Log 2+ vitals to draw the chart.</p>';
  const rows = vs.map(v => `<tr><td>${esc(v.at)}</td><td>${esc(v.bp)}</td><td>${esc(v.pulse)}</td><td>${esc(v.temp)}</td><td>${esc(v.spo2)}</td></tr>`).join('');
  return `<!doctype html><html><head><style>
    @page { size: A4 landscape; margin: 10mm } body { font:10pt 'Segoe UI',sans-serif } table{width:100%;border-collapse:collapse;margin-top:4mm}
    td,th{border:1px solid #cbd5e1;padding:3px 6px} th{background:#0d9488;color:#fff;text-align:left}
  </style></head><body>
    <h2 style="margin:0">${store.settings.clinicName || 'Clinic'} — Vitals Monitor Chart</h2>
    <p><b>${esc(patient.name)}</b> · MRN ${esc(patient.mrn)} · Ward ${esc(adm.ward)}</p>
    ${svg}
    <table><thead><tr><th>Time</th><th>BP</th><th>Pulse</th><th>Temp</th><th>SpO2</th></tr></thead><tbody>${rows || '<tr><td colspan="5">No vitals logged</td></tr>'}</tbody></table></body></html>`;
};

// ---- Insurance claim form ---------------------------------------------------
export const claimFormHtml = ({ store, patient, insurer, visits }) => {
  const esc = (x) => String(x ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rows = visits.map(v => `<tr><td>${esc(v.date)}</td><td>${esc(v.diagnosis || v.complaint || '')}</td><td class="r">${v.fee || 0}</td></tr>`).join('');
  const total = visits.reduce((t, v) => t + (Number(v.fee) || 0), 0);
  return `<!doctype html><html><head><style>
    @page { size: A4; margin: 14mm } body { font:10.5pt 'Segoe UI',sans-serif } table{width:100%;border-collapse:collapse;margin:3mm 0}
    td,th{border:1px solid #cbd5e1;padding:4px 6px} th{background:#0d9488;color:#fff;text-align:left} .r{text-align:right}
    .box{border:1.5px solid #111;border-radius:6px;padding:4mm;margin-bottom:4mm}
  </style></head><body>
    <h2 style="margin:0;text-align:center">${store.settings.clinicName || 'Clinic'}</h2>
    <h3 style="text-align:center">INSURANCE CLAIM FORM</h3>
    <div class="box"><b>Insurer:</b> ${esc(insurer)}<br/><b>Patient:</b> ${esc(patient.name)} · MRN ${esc(patient.mrn)}<br/><b>Policy #:</b> ${esc(patient.policyNo || '________________')}</div>
    <table><thead><tr><th>Date</th><th>Diagnosis / service</th><th>Charges Rs</th></tr></thead><tbody>${rows}</tbody></table>
    <p style="text-align:right"><b>Total claimed: Rs ${total}</b></p>
    <p style="margin-top:10mm">Attending doctor sign &amp; stamp: ______________</p></body></html>`;
};

// ---- Chronic patient trend chart (BP / sugar / weight / pulse across visits) --
export const trendChartHtml = ({ store, patient }) => {
  const esc = (x) => String(x ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const visits = store.visits.filter(v => v.patientId === patient.id).slice().sort((a, b) => a.date.localeCompare(b.date));
  const num = (s) => { const m = String(s ?? '').match(/\d+(\.\d+)?/); return m ? Number(m[0]) : null; };
  const bpParts = (s) => { const m = String(s ?? '').match(/(\d+)\s*[/]\s*(\d+)/); return m ? [Number(m[1]), Number(m[2])] : [null, null]; };
  const sugarLabs = (store.labs || []).filter(l => l.patientId === patient.id && /sugar|glucose|hba1c/i.test(l.test || '') && num(l.result) != null)
    .map(l => ({ date: l.date, val: num(l.result), hba: /hba1c/i.test(l.test || '') }));
  const pts = visits.map(v => {
    const [sys, dia] = bpParts(v.vitals?.bp);
    return { date: v.date, sys, dia, pulse: num(v.vitals?.pulse), weight: num(v.vitals?.weight), temp: num(v.vitals?.temp), spo2: num(v.vitals?.spo2) };
  });
  const series = [
    { key: 'sys', label: 'BP sys', color: '#dc2626', pts: pts.map(p => ({ d: p.date, v: p.sys })).filter(p => p.v != null) },
    { key: 'dia', label: 'BP dia', color: '#f59e0b', pts: pts.map(p => ({ d: p.date, v: p.dia })).filter(p => p.v != null) },
    { key: 'weight', label: 'Weight kg', color: '#2563eb', pts: pts.map(p => ({ d: p.date, v: p.weight })).filter(p => p.v != null) },
    { key: 'pulse', label: 'Pulse', color: '#7c3aed', pts: pts.map(p => ({ d: p.date, v: p.pulse })).filter(p => p.v != null) },
    { key: 'sugar', label: 'Sugar (lab)', color: '#059669', pts: sugarLabs.filter(s => !s.hba).map(s => ({ d: s.date, v: s.val })) },
    { key: 'hba1c', label: 'HbA1c %', color: '#0d9488', pts: sugarLabs.filter(s => s.hba).map(s => ({ d: s.date, v: s.val })) }
  ].filter(s => s.pts.length > 1);
  const allVals = series.flatMap(s => s.pts.map(p => p.v));
  const lo = Math.min(...allVals, 0), hi = Math.max(...allVals, 1);
  const span = Math.max(hi - lo, 1);
  const allDates = [...new Set([...pts.map(p => p.date), ...sugarLabs.map(s => s.date)])].sort();
  const x = (d) => 40 + (allDates.indexOf(d) / Math.max(allDates.length - 1, 1)) * 900;
  const y = (v) => 190 - ((v - lo) / span) * 160;
  const lines = series.map(s => `<polyline points="${s.pts.map(p => `${x(p.d)},${y(p.v)}`).join(' ')}" fill="none" stroke="${s.color}" stroke-width="2"/>`
    + s.pts.map(p => `<circle cx="${x(p.d)}" cy="${y(p.v)}" r="3" fill="${s.color}"/>`).join('')).join('');
  const xlabels = allDates.filter((_, i) => i % Math.ceil(allDates.length / 8 || 1) === 0).map(d => `<text x="${x(d)}" y="208" font-size="8" text-anchor="middle">${esc(d.slice(5))}</text>`).join('');
  const tableRows = pts.map(p => `<tr><td>${esc(p.date)}</td><td>${p.sys != null ? p.sys + '/' + p.dia : '—'}</td><td>${p.pulse ?? '—'}</td><td>${p.weight ?? '—'}</td><td>${p.temp ?? '—'}</td><td>${p.spo2 ?? '—'}</td><td>${esc(visits.find(v => v.date === p.date)?.diagnosis || '')}</td></tr>`).join('');
  const sugarRows = sugarLabs.map(s => `<tr><td>${esc(s.date)}</td><td>${s.hba ? 'HbA1c' : 'Blood sugar'}</td><td><b>${s.val}</b></td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A4 landscape; margin: 12mm } body { font:10pt 'Segoe UI',sans-serif } h2 { margin:0 } .muted{color:#64748b}
    table { width:100%; border-collapse:collapse; margin-top:4mm; font-size:8.5pt } td,th { border:1px solid #cbd5e1; padding:2px 5px } th { background:#1e3a5f; color:#fff; text-align:left }
    .legend span { display:inline-block; margin-right:12px; font-size:9pt }
    .dot { display:inline-block; width:8px; height:8px; border-radius:4px; margin-right:4px }
  </style></head><body>
    <h2>${esc(patient.name)} — chronic trend</h2>
    <div class="muted">MRN ${esc(patient.mrn)} · ${esc(patient.chronic || '')} · ${allDates.length} visits · ${esc(store.settings.clinicName || '')}</div>
    ${series.length ? `<svg width="960" height="215" viewBox="0 0 960 215" style="margin-top:4mm">
      <rect x="0" y="0" width="960" height="215" fill="#fff"/>
      ${[0.25, 0.5, 0.75, 1].map(f => `<line x1="40" y1="${190 - f * 160}" x2="940" y2="${190 - f * 160}" stroke="#e2e8f0"/><text x="4" y="${193 - f * 160}" font-size="8">${Math.round(lo + f * span)}</text>`).join('')}
      ${lines}${xlabels}
    </svg>
    <div class="legend">${series.map(s => `<span><span class="dot" style="background:${s.color}"></span>${s.label}</span>`).join('')}</div>`
    : '<p class="muted">Not enough vitals recorded yet — chart appears after 2+ visits with vitals.</p>'}
    <table><thead><tr><th>Date</th><th>BP</th><th>Pulse</th><th>Wt kg</th><th>Temp</th><th>SpO2</th><th>Diagnosis</th></tr></thead><tbody>${tableRows || '<tr><td colspan="7">No visits</td></tr>'}</tbody></table>
    ${sugarRows ? `<table><thead><tr><th>Date</th><th>Test</th><th>Result</th></tr></thead><tbody>${sugarRows}</tbody></table>` : ''}
    <p class="muted" style="margin-top:4mm">Trends for clinical review — not diagnostic. Printed from Medora.</p>
  </body></html>`;
};
