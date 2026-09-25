import { FREQUENCIES, ADVICE_PRESETS } from './meds.js';
import { ageText } from './model.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const freqMap = new Map(FREQUENCIES.map(f => [f.code, f]));

function itemLine(item, bilingual) {
  const f = freqMap.get(item.freq);
  const dose = f && !['SOS', 'STAT', 'WK'].includes(f.code) ? f.pattern : (f ? f.code : esc(item.freq || ''));
  const days = item.days ? ` × ${item.days} day${item.days === 1 ? '' : 's'}` : '';
  const urdu = bilingual && f && f.urdu ? `<div class="rx-ur">${f.urdu}${item.days ? ` — ${item.days} دن` : ''}</div>` : '';
  return `<tr>
    <td class="rx-num"></td>
    <td class="rx-med"><div class="rx-name">${esc(item.name)}${item.strength ? ` <span class="rx-str">${esc(item.strength)}</span>` : ''}</div>
      <div class="rx-sig">${esc(item.form || 'Tab')} — ${dose}${days}${item.note ? ` · ${esc(item.note)}` : ''}</div>${urdu}</td>
  </tr>`;
}

/**
 * Renders one prescription as a standalone print document.
 * size: 'a5' (half of A4, the standard pad) or 'a4'.
 */
export function rxDocument({ store, patient, visit }) {
  const st = store.settings;
  const size = st.paperSize === 'a4' ? { w: 210, h: 297 } : { w: 148, h: 210 };
  const fup = visit.followUpDays
    ? (() => { const d = new Date(visit.date); d.setDate(d.getDate() + Number(visit.followUpDays)); return d.toISOString().slice(0, 10); })()
    : '';
  const vit = visit.vitals || {};
  const vitalBits = [
    vit.bp && `BP ${esc(vit.bp)}`, vit.pulse && `Pulse ${esc(vit.pulse)}`,
    vit.temp && `Temp ${esc(vit.temp)}°F`, vit.weight && `Wt ${esc(vit.weight)}kg`,
    vit.spo2 && `SpO₂ ${esc(vit.spo2)}%`
  ].filter(Boolean);

  const adviceRows = (visit.advice || [])
    .map(i => typeof i === 'number' ? ADVICE_PRESETS[i] : null)
    .filter(Boolean);

  const body = `
  <div class="rxhead ${st.template}">
    <div class="rx-doc">
      <div class="rx-docname">${esc(st.doctorName)}</div>
      <div class="rx-docsub">${esc(st.qualifications)}${st.licenseNo ? ` · ${esc(st.licenseNo)}` : ''}</div>
    </div>
    <div class="rx-clinic">
      <div class="rx-clinicname">${esc(st.clinicName)}</div>
      <div class="rx-docsub">${esc(st.clinicAddress)}</div>
      <div class="rx-docsub">${esc(st.clinicPhone)}${st.clinicTimings ? ` · ${esc(st.clinicTimings)}` : ''}</div>
    </div>
  </div>
  <div class="rx-pline">
    <span><b>${esc(patient.name)}</b></span>
    <span>${patient.gender ? esc(patient.gender) + ', ' : ''}${esc(ageText(patient))}</span>
    <span>${esc(visit.date)}</span>
    <span class="rx-mrn">MRN ${esc(patient.mrn)}</span>
  </div>
  ${vitalBits.length && st.showVitals ? `<div class="rx-vitals">${vitalBits.join(' · ')}</div>` : ''}
  ${visit.complaint ? `<div class="rx-row"><span class="rx-lab">C/O</span> ${esc(visit.complaint)}</div>` : ''}
  ${visit.diagnosis ? `<div class="rx-row"><span class="rx-lab">Dx</span> ${esc(visit.diagnosis)}</div>` : ''}
  <div class="rx-symbol">℞</div>
  <table class="rx-items">${visit.items.map(i => itemLine(i, st.bilingual)).join('')}</table>
  ${adviceRows.length ? `<div class="rx-adv"><div class="rx-advlab">Advice</div>${adviceRows.map(a =>
    `<div class="rx-advrow"><span>${esc(a.en)}</span>${st.bilingual ? `<span class="rx-ur">${a.ur}</span>` : ''}</div>`).join('')}</div>` : ''}
  <div class="rx-foot">
    <div>${fup ? `Next visit: <b>${fup}</b>` : ''}${visit.fee && st.showFee ? ` &nbsp;·&nbsp; Fee: ${esc(visit.fee)}` : ''}</div>
    <div class="rx-sign">${esc(st.doctorName)}</div>
  </div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>${rxCss(size, st.template)}</style></head>
  <body><div class="rxpage">${body}</div></body></html>`;
}

/** Preview-only HTML fragment (shared page CSS lives in styles.css). */
export function rxPreviewHtml({ store, patient, visit }) {
  const full = rxDocument({ store, patient, visit });
  return full.slice(full.indexOf('<body>') + 6, full.indexOf('</body>'));
}

export function rxCss(size, template) {
  return `
  @page { size: ${size.w}mm ${size.h}mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; }
  .rxpage { width: ${size.w}mm; height: ${size.h}mm; padding: ${size.w === 210 ? '16mm 18mm' : '9mm 10mm'}; position: relative; }
  .rx-ur, .rx-advrow .rx-ur { font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Urdu Typesetting', serif; direction: rtl; text-align: right; }
  .rxhead { display: flex; justify-content: space-between; border-bottom: 2.5px solid ${template === 'modern' ? '#0d9488' : '#1e3a5f'}; padding-bottom: 3mm; }
  .rx-docname { font-size: 15pt; font-weight: 700; color: ${template === 'modern' ? '#0d9488' : '#1e3a5f'}; }
  .rx-clinic { text-align: right; }
  .rx-clinicname { font-weight: 700; font-size: 10pt; }
  .rx-docsub { font-size: 7.5pt; color: #475569; }
  .rx-pline { display: flex; gap: 5mm; border-bottom: 0.5px solid #94a3b8; padding: 2mm 0; font-size: 9.5pt; }
  .rx-mrn { margin-left: auto; color: #64748b; font-size: 8pt; }
  .rx-vitals { font-size: 8pt; color: #334155; background: #f1f5f9; padding: 1.5mm 2mm; border-radius: 1mm; margin-top: 2mm; }
  .rx-row { font-size: 9.5pt; margin-top: 2mm; }
  .rx-lab { font-weight: 700; font-size: 8pt; color: #64748b; }
  .rx-symbol { font-size: 17pt; font-weight: 700; color: ${template === 'modern' ? '#0d9488' : '#1e3a5f'}; margin-top: 3mm; }
  .rx-items { width: 100%; margin-top: 1mm; border-collapse: collapse; }
  .rx-items td { padding: 1.4mm 0; vertical-align: top; }
  .rx-num { width: 6mm; }
  .rx-num::before { counter-increment: rx; content: counter(rx) ". "; color: #64748b; }
  .rx-items { counter-reset: rx; }
  .rx-name { font-weight: 700; font-size: 10pt; }
  .rx-str { font-weight: 400; color: #475569; }
  .rx-sig { font-size: 8.5pt; color: #334155; }
  .rx-ur { font-size: 9pt; color: #475569; }
  .rx-adv { margin-top: 4mm; border-top: 0.5px dashed #94a3b8; padding-top: 2mm; }
  .rx-advlab { font-size: 8pt; font-weight: 700; color: #64748b; margin-bottom: 1mm; }
  .rx-advrow { display: flex; justify-content: space-between; font-size: 8.5pt; padding: 0.5mm 0; }
  .rx-foot { position: absolute; bottom: ${size.w === 210 ? '14mm' : '8mm'}; left: ${size.w === 210 ? '18mm' : '10mm'}; right: ${size.w === 210 ? '18mm' : '10mm'}; display: flex; justify-content: space-between; align-items: flex-end; font-size: 8.5pt; }
  .rx-sign { border-top: 0.5px solid #0f172a; padding-top: 1mm; min-width: 30mm; text-align: center; font-size: 9pt; }
  `;
}
