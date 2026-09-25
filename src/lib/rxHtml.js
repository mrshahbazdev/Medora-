import { FREQUENCIES, ADVICE_PRESETS } from './meds.js';
import { ageText } from './model.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const freqMap = new Map(FREQUENCIES.map(f => [f.code, f]));

function itemLine(item, bilingual) {
  const f = freqMap.get(item.freq);
  const dose = f && !['SOS', 'STAT', 'WK'].includes(f.code) ? f.pattern : (f ? f.code : esc(item.freq || ''));
  const days = item.days ? ` × ${item.days} day${item.days === 1 ? '' : 's'}` : '';
  const urduOnly = bilingual === 'urdu' && f && f.urdu;
  const urdu = bilingual && f && f.urdu ? `<div class="rx-ur">${f.urdu}${item.days ? ` — ${item.days} دن` : ''}</div>` : '';
  return `<tr>
    <td class="rx-num"></td>
    <td class="rx-med"><div class="rx-name">${esc(item.name)}${item.strength ? ` <span class="rx-str">${esc(item.strength)}</span>` : ''}</div>
      ${urduOnly ? `<div class="rx-ur" style="font-size:1.15em">${f.urdu}${item.days ? ` — ${item.days} دن` : ''}</div><div class="rx-sig" style="opacity:.7">${esc(item.form || 'Tab')} — ${dose}${days}</div>` : `<div class="rx-sig">${esc(item.form || 'Tab')} — ${dose}${days}${item.note ? ` · ${esc(item.note)}` : ''}</div>${urdu}`}</td>
  </tr>`;
}

/**
 * Renders one prescription as a standalone print document.
 * size: 'a5' (half of A4, the standard pad) or 'a4'.
 */
export function rxDocument({ store, patient, visit }) {
  const st0 = store.settings;
  if (st0.padStyle === 'label') return rxLabelDocument({ store, patient, visit });
  const st = { ...store.settings };
  const doc = (st.doctors || []).find(d => d.id === visit?.doctorId);
  if (doc) { st.doctorName = doc.name; st.qualifications = doc.qualifications || st.qualifications; }
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

  // Pre-printed letterhead mode: the clinic's own printed pad carries the
  // header — Medora just leaves topMm mm of space and starts the Rx below it.
  const headerHtml = st.letterhead?.prePrinted
    ? `<div style="height:${Number(st.letterhead.topMm) || 40}mm"></div>`
    : `<div class="rxhead ${st.template}"${st.letterhead?.accent ? ` style="border-color:${st.letterhead.accent}"` : ''}>
    ${st.letterhead?.logoDataUrl ? `<img src="${st.letterhead.logoDataUrl}" style="max-height:16mm;max-width:30mm;object-fit:contain;margin-right:6mm">` : ''}
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

  const body = `
  ${headerHtml}
  <!--HEAD-->
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
  ${st.padWatermark ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none"><span style="font-size:52pt;font-weight:800;color:${st.letterhead?.accent || '#0d9488'};opacity:.07;transform:rotate(-28deg);white-space:nowrap">${esc(st.padWatermark)}</span></div>` : ''}
  <table class="rx-items">${visit.items.map(i => itemLine(i, st.rxUrdu ? 'urdu' : st.bilingual)).join('')}</table>
  ${(() => {
    if (visit.type === 'eye' && visit.eye && (visit.eye.od?.sph || visit.eye.os?.sph)) {
      const f = (x) => [x.sph && `sph ${x.sph}`, x.cyl && `cyl ${x.cyl}`, x.axis && `axis ${x.axis}`, x.add && `add ${x.add}`].filter(Boolean).join(', ');
      return `<div class="rx-row"><span class="rx-lab">Refraction</span> <b>OD:</b> ${esc(f(visit.eye.od)) || '—'} &nbsp;·&nbsp; <b>OS:</b> ${esc(f(visit.eye.os)) || '—'}</div>`;
    }
    if (visit.type === 'dental' && (visit.dental || []).length)
      return `<div class="rx-row"><span class="rx-lab">Teeth</span> ${visit.dental.map(t => `#${t}`).join(', ')}</div>`;
    if (visit.type === 'anc' && visit.anc && (visit.anc.edd || visit.anc.fhr || visit.anc.gravida))
      return `<div class="rx-row"><span class="rx-lab">ANC</span> G${esc(visit.anc.gravida) || '—'} P${esc(visit.anc.para) || '—'} · EDD ${esc(visit.anc.edd) || '—'} · FHR ${esc(visit.anc.fhr) || '—'} · Fundal ${esc(visit.anc.fundal) || '—'}</div>`;
    return '';
  })()}
  ${(visit.investigations || []).length ? `<div class="rx-inv"><div class="rx-advlab">Investigations advised</div><div class="rx-invlist">${visit.investigations.map(esc).join(' · ')}</div></div>` : ''}
  ${adviceRows.length ? `<div class="rx-adv"><div class="rx-advlab">Advice</div>${adviceRows.map(a =>
    st.rxUrdu
      ? `<div class="rx-advrow"><span class="rx-ur" style="font-size:1.1em">${a.ur || a.en}</span></div>`
      : `<div class="rx-advrow"><span>${esc(a.en)}</span>${st.bilingual ? `<span class="rx-ur">${a.ur}</span>` : ''}</div>`).join('')}</div>` : ''}
  <div class="rx-foot">
    <div>${fup ? `Next visit: <b>${fup}</b>` : ''}${visit.fee && st.showFee ? ` &nbsp;·&nbsp; Fee: ${esc(visit.fee)}` : ''}</div>
    ${st.padThirdLine ? `<div style="text-align:center;font-size:8.5pt;color:#64748b;margin-top:3mm">${esc(st.padThirdLine)}</div>` : ''}
    <div class="rx-sign">${st.signatureDataUrl ? `<img src="${st.signatureDataUrl}" style="max-height:14mm;display:block;margin:0 auto 1mm">` : ''}${esc(st.doctorName)}</div>
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
  .rx-inv { margin-top: 3mm; }
  .rx-invlist { font-size: 8.5pt; color: #334155; }
  .rx-adv { margin-top: 4mm; border-top: 0.5px dashed #94a3b8; padding-top: 2mm; }
  .rx-advlab { font-size: 8pt; font-weight: 700; color: #64748b; margin-bottom: 1mm; }
  .rx-advrow { display: flex; justify-content: space-between; font-size: 8.5pt; padding: 0.5mm 0; }
  .rx-foot { position: absolute; bottom: ${size.w === 210 ? '14mm' : '8mm'}; left: ${size.w === 210 ? '18mm' : '10mm'}; right: ${size.w === 210 ? '18mm' : '10mm'}; display: flex; justify-content: space-between; align-items: flex-end; font-size: 8.5pt; }
  .rx-sign { border-top: 0.5px solid #0f172a; padding-top: 1mm; min-width: 30mm; text-align: center; font-size: 9pt; }
  `;
}


export function rxLabelDocument({ store, patient, visit }) {
  const st = { ...store.settings };
  const doc = (st.doctors || []).find(d => d.id === visit?.doctorId);
  if (doc) { st.doctorName = doc.name; st.qualifications = doc.qualifications || st.qualifications; }
  const items = visit.items.map((it, i) => {
    const f = FREQUENCIES.find(x => x.code === it.freq);
    return `<div class="li"><b>${i + 1}. ${esc(it.name)}</b>${it.strength ? ` ${esc(it.strength)}` : ''}${it.form ? ` (${esc(it.form)})` : ''}
      <div class="mut">${f ? `${f.pattern}${it.days ? ` × ${it.days}d` : ''}` : ''}${f && st.bilingual && f.ur ? ` · ${f.ur}` : ''}${it.note ? ` — ${esc(it.note)}` : ''}</div></div>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: 80mm 140mm; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; }
    .lab { width: 80mm; padding: 4mm; font-size: 8.5pt; }
    .cl { text-align: center; border-bottom: 1.5px solid #0d9488; padding-bottom: 2mm; margin-bottom: 2.5mm; }
    .cl b { font-size: 9.5pt; color: #134e4a; display: block; }
    .cl span { font-size: 6.5pt; color: #64748b; }
    .pt { font-size: 8pt; margin-bottom: 2mm; }
    .rx { font-size: 15pt; font-weight: 800; color: #0d9488; float: left; margin-right: 2mm; }
    .li { margin-bottom: 1.6mm; }
    .mut { font-size: 7.5pt; color: #475569; padding-left: 4mm; }
    .foot { border-top: 1px dashed #94a3b8; margin-top: 3mm; padding-top: 1.5mm; font-size: 7pt; color: #475569; display: flex; justify-content: space-between; }
  </style></head><body><div class="lab">
    <div class="cl"><b>${esc(st.clinicName || 'Clinic')}</b><span>${esc(st.doctorName || '')} · ${esc(st.clinicPhone || '')}</span></div>
    <div class="pt"><b>${esc(patient.name)}</b> ${esc(ageText(patient))} · ${visit.date}${patient.mrn ? ` · ${esc(patient.mrn)}` : ''}</div>
    ${visit.diagnosis ? `<div class="pt"><i>Dx: ${esc(visit.diagnosis)}</i></div>` : ''}
    <div><span class="rx">℞</span><div style="overflow:hidden">${items}</div></div>
    <div class="foot"><span>${visit.followUpDays ? `Follow up: ${visit.followUpDays}d` : ''}</span><span>${st.showFee && visit.fee ? `Rs ${visit.fee}` : ''}</span></div>
  </div></body></html>`;
}
