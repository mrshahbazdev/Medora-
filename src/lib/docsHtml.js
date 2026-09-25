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
