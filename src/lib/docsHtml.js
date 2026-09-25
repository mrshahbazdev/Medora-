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
