// Prescription frequency codes with English + Urdu instruction text.
// `pattern` is the 1+0+1 style dosage printed on the pad.
export const FREQUENCIES = [
  { code: 'OD', label: 'Once daily', pattern: '1+0+0', urdu: 'دن میں ایک بار' },
  { code: 'BD', label: 'Twice daily', pattern: '1+0+1', urdu: 'دن میں دو بار' },
  { code: 'TDS', label: 'Three times daily', pattern: '1+1+1', urdu: 'دن میں تین بار' },
  { code: 'QID', label: 'Four times daily', pattern: '1+1+1+1', urdu: 'دن میں چار بار' },
  { code: 'HS', label: 'At bedtime', pattern: '0+0+1', urdu: 'سونے سے پہلے' },
  { code: 'BB', label: 'Before breakfast', pattern: '1+0+0', urdu: 'ناشتے سے پہلے' },
  { code: 'PC', label: 'After meals', pattern: '1+1+1', urdu: 'کھانے کے بعد' },
  { code: 'AC', label: 'Before meals', pattern: '1+1+1', urdu: 'کھانے سے پہلے' },
  { code: 'SOS', label: 'When needed', pattern: 'SOS', urdu: 'ضرورت ہو تو' },
  { code: 'STAT', label: 'Immediately', pattern: 'STAT', urdu: 'فوراً' },
  { code: 'WK', label: 'Once weekly', pattern: 'weekly', urdu: 'ہفتے میں ایک بار' },
  { code: 'NOCTE', label: 'Every night', pattern: '0+0+1', urdu: 'ہر رات' }
];

export const DURATIONS = [1, 2, 3, 5, 7, 10, 14, 21, 30, 60, 90];

// Common medicines preloaded so a new install prescribes out of the box.
// `sig` = suggested default { freq, days, note }
export const PRESET_MEDS = [
  { name: 'Paracetamol', generic: 'Acetaminophen', form: 'Tab', strength: '500mg', freq: 'TDS', days: 3 },
  { name: 'Panadol', generic: 'Acetaminophen', form: 'Tab', strength: '665mg', freq: 'TDS', days: 3 },
  { name: 'Brufen', generic: 'Ibuprofen', form: 'Tab', strength: '400mg', freq: 'TDS', days: 5 },
  { name: 'Ponstan', generic: 'Mefenamic acid', form: 'Cap', strength: '250mg', freq: 'TDS', days: 5 },
  { name: 'Augmentin', generic: 'Amoxicillin/clavulanate', form: 'Tab', strength: '625mg', freq: 'TDS', days: 7 },
  { name: 'Amoxil', generic: 'Amoxicillin', form: 'Cap', strength: '500mg', freq: 'TDS', days: 7 },
  { name: 'Ciproxin', generic: 'Ciprofloxacin', form: 'Tab', strength: '500mg', freq: 'BD', days: 7 },
  { name: 'Flagyl', generic: 'Metronidazole', form: 'Tab', strength: '400mg', freq: 'TDS', days: 7 },
  { name: 'Zithromax', generic: 'Azithromycin', form: 'Tab', strength: '500mg', freq: 'OD', days: 3 },
  { name: 'Velosef', generic: 'Cephradine', form: 'Cap', strength: '500mg', freq: 'QID', days: 7 },
  { name: 'Risek', generic: 'Omeprazole', form: 'Cap', strength: '20mg', freq: 'OD', days: 14 },
  { name: 'Nexum', generic: 'Esomeprazole', form: 'Tab', strength: '40mg', freq: 'OD', days: 14 },
  { name: 'Motilium', generic: 'Domperidone', form: 'Tab', strength: '10mg', freq: 'TDS', days: 5 },
  { name: 'Maxolon', generic: 'Metoclopramide', form: 'Tab', strength: '10mg', freq: 'TDS', days: 3 },
  { name: 'Gravinate', generic: 'Dimenhydrinate', form: 'Tab', strength: '50mg', freq: 'TDS', days: 3 },
  { name: 'Loperamide', generic: 'Loperamide', form: 'Cap', strength: '2mg', freq: 'SOS', days: 3 },
  { name: 'ORS', generic: 'Oral rehydration salts', form: 'Sachet', strength: '', freq: 'SOS', days: 3 },
  { name: 'Rigix', generic: 'Cetirizine', form: 'Tab', strength: '10mg', freq: 'OD', days: 7 },
  { name: 'Telfast', generic: 'Fexofenadine', form: 'Tab', strength: '120mg', freq: 'OD', days: 7 },
  { name: 'Avil', generic: 'Pheniramine', form: 'Tab', strength: '25mg', freq: 'TDS', days: 5 },
  { name: 'Montiget', generic: 'Montelukast', form: 'Tab', strength: '10mg', freq: 'NOCTE', days: 14 },
  { name: 'Ventolin', generic: 'Salbutamol', form: 'Inhaler', strength: '100mcg', freq: 'SOS', days: 30 },
  { name: 'Ventolin Syp', generic: 'Salbutamol', form: 'Syrup', strength: '2mg/5ml', freq: 'TDS', days: 5 },
  { name: 'Sancolin', generic: 'Dextromethorphan', form: 'Syrup', strength: '', freq: 'TDS', days: 5 },
  { name: 'Corex-Dx', generic: 'Chlorpheniramine+phenylephrine', form: 'Syrup', strength: '', freq: 'TDS', days: 5 },
  { name: 'Sinarest', generic: 'Paracetamol+chlorpheniramine', form: 'Tab', strength: '', freq: 'TDS', days: 5 },
  { name: 'Arinac', generic: 'Ibuprofen+pseudoephedrine', form: 'Tab', strength: '200/30mg', freq: 'TDS', days: 5 },
  { name: 'Xanax', generic: 'Alprazolam', form: 'Tab', strength: '0.25mg', freq: 'HS', days: 7 },
  { name: 'Lexotanil', generic: 'Bromazepam', form: 'Tab', strength: '3mg', freq: 'HS', days: 7 },
  { name: 'Ativan', generic: 'Lorazepam', form: 'Tab', strength: '1mg', freq: 'HS', days: 7 },
  { name: 'Disprin', generic: 'Aspirin', form: 'Tab', strength: '300mg', freq: 'OD', days: 14 },
  { name: 'Angised', generic: 'Glyceryl trinitrate', form: 'Tab SL', strength: '0.5mg', freq: 'SOS', days: 30 },
  { name: 'Norvasc', generic: 'Amlodipine', form: 'Tab', strength: '5mg', freq: 'OD', days: 30 },
  { name: 'Concor', generic: 'Bisoprolol', form: 'Tab', strength: '5mg', freq: 'OD', days: 30 },
  { name: 'Co-Diovan', generic: 'Valsartan+HCTZ', form: 'Tab', strength: '80/12.5mg', freq: 'OD', days: 30 },
  { name: 'Lasix', generic: 'Furosemide', form: 'Tab', strength: '40mg', freq: 'OD', days: 7 },
  { name: 'Glucophage', generic: 'Metformin', form: 'Tab', strength: '500mg', freq: 'BD', days: 30 },
  { name: 'Diamicron MR', generic: 'Gliclazide', form: 'Tab', strength: '30mg', freq: 'OD', days: 30 },
  { name: 'Thyroxine', generic: 'Levothyroxine', form: 'Tab', strength: '50mcg', freq: 'OD', days: 30 },
  { name: 'Cataflam', generic: 'Diclofenac potassium', form: 'Tab', strength: '50mg', freq: 'TDS', days: 5 },
  { name: 'Voltral', generic: 'Diclofenac sodium', form: 'Tab', strength: '50mg', freq: 'BD', days: 7 },
  { name: 'Myonal', generic: 'Eperisone', form: 'Tab', strength: '50mg', freq: 'TDS', days: 7 },
  { name: 'Surbex-Z', generic: 'Multivitamin+zinc', form: 'Tab', strength: '', freq: 'OD', days: 30 },
  { name: 'CAC-1000', generic: 'Calcium+vitamin D', form: 'Tab', strength: '', freq: 'OD', days: 30 },
  { name: 'Fefol-Vit', generic: 'Iron+folic acid', form: 'Cap', strength: '', freq: 'OD', days: 30 },
  { name: 'Iberet-Folic', generic: 'Iron+folic acid', form: 'Tab', strength: '', freq: 'OD', days: 30 },
  { name: 'Sunny D', generic: 'Cholecalciferol', form: 'Cap', strength: '200,000IU', freq: 'WK', days: 28 },
  { name: 'Hydrillin', generic: 'Multivitamin syrup', form: 'Syrup', strength: '', freq: 'OD', days: 30 },
  { name: 'Duphalac', generic: 'Lactulose', form: 'Syrup', strength: '', freq: 'BD', days: 7 },
  { name: 'Phixogesic', generic: 'Phloroglucinol', form: 'Tab', strength: '80mg', freq: 'TDS', days: 3 },
  { name: 'No-Spa', generic: 'Drotaverine', form: 'Tab', strength: '40mg', freq: 'TDS', days: 3 },
  { name: 'Buscopan', generic: 'Hyoscine butylbromide', form: 'Tab', strength: '10mg', freq: 'TDS', days: 3 },
  { name: 'Polyfax', generic: 'Polymyxin B+bacitracin', form: 'Oint', strength: '', freq: 'BD', days: 7 },
  { name: 'Fucidin', generic: 'Fusidic acid', form: 'Cream', strength: '2%', freq: 'BD', days: 7 },
  { name: 'Soframycin', generic: 'Framycetin', form: 'Cream', strength: '1%', freq: 'BD', days: 7 },
  { name: 'Betnovate', generic: 'Betamethasone', form: 'Cream', strength: '0.1%', freq: 'BD', days: 7 },
  { name: 'Quadriderm', generic: 'Betamethasone+gentamicin+clotrimazole', form: 'Cream', strength: '', freq: 'BD', days: 7 },
  { name: 'Canesten', generic: 'Clotrimazole', form: 'Cream', strength: '1%', freq: 'BD', days: 14 },
  { name: 'Daktarin', generic: 'Miconazole', form: 'Gel', strength: '2%', freq: 'BD', days: 14 },
  { name: 'Tobradex', generic: 'Tobramycin+dexamethasone', form: 'Eye drops', strength: '', freq: 'QID', days: 7 },
  { name: 'Ciplox Eye', generic: 'Ciprofloxacin', form: 'Eye drops', strength: '0.3%', freq: 'QID', days: 7 },
  { name: 'Refresh Tears', generic: 'Carboxymethylcellulose', form: 'Eye drops', strength: '0.5%', freq: 'SOS', days: 30 },
  { name: 'Cerumol', generic: 'Arachis oil+chlorobutanol', form: 'Ear drops', strength: '', freq: 'BD', days: 5 },
  { name: 'Bonviva', generic: 'Ibandronic acid', form: 'Tab', strength: '150mg', freq: 'WK', days: 30 }
];

// Common pieces of advice, selectable in one click on the Rx editor.
export const ADVICE_PRESETS = [
  { en: 'Plenty of fluids and rest', ur: 'کافی پانی پیئں اور آرام کریں' },
  { en: 'Light diet / soft food', ur: 'ہلکی غذا لیں' },
  { en: 'Avoid cold drinks and ice cream', ur: 'ٹھنڈے مشروبات اور آئس کریم سے پرہیز کریں' },
  { en: 'Avoid oily and spicy food', ur: 'تلے بھنے اور مصالحہ دار کھانے سے پرہیز کریں' },
  { en: 'Gargle with warm salt water', ur: 'گرم نمکین پانی سے غرارے کریں' },
  { en: 'Steam inhalation twice daily', ur: 'دن میں دو بار بھاپ لیں' },
  { en: 'Avoid dust and smoke', ur: 'دھول اور دھوئیں سے پرہیز کریں' },
  { en: 'No smoking', ur: 'سگریٹ نہ پیئیں' },
  { en: 'Check blood pressure daily', ur: 'روزانہ بلڈ پریشر چیک کریں' },
  { en: 'Check blood sugar fasting and random', ur: 'ناشتے اور رینڈم شوگر چیک کریں' },
  { en: 'Walk 30 minutes daily', ur: 'روزانہ 30 منٹ چہل قدمی کریں' },
  { en: 'Return if fever persists beyond 3 days', ur: '3 دن کے بعد بھی بخار رہے تو دوبارہ آئیں' },
  { en: 'Lab tests advised — bring reports on follow-up', ur: 'ٹیسٹ کروائیں، رپورٹیں اگلے معائنے پر لائیں' },
  { en: 'Complete the full antibiotic course', ur: 'اینٹی بائیوٹک کا مکمل کورس کریں' },
  { en: 'Use mosquito net / repellent', ur: 'مچھر دانی / مچھر مار لوشن استعمال کریں' }
];

export const COMPLAINT_PRESETS = [
  'Fever', 'Fever with body aches', 'Cough', 'Sore throat', 'Runny nose / flu',
  'Headache', 'Earache', 'Toothache', 'Abdominal pain', 'Nausea / vomiting',
  'Loose motions', 'Constipation', 'Acidity / heartburn', 'Chest congestion',
  'Shortness of breath', 'Body weakness', 'Back pain', 'Joint pain',
  'Skin rash / itching', 'Burning urination', 'High blood pressure check',
  'Sugar check / diabetes visit', 'Routine check-up', 'Follow-up visit'
];

export const DIAGNOSIS_PRESETS = [
  'Viral fever', 'Influenza', 'Pharyngitis', 'Tonsillitis', 'URTI',
  'Acute bronchitis', 'Asthma — controlled', 'Allergic rhinitis',
  'Acute gastroenteritis', 'Food poisoning', 'Gastritis', 'GERD',
  'UTI', 'Otitis media', 'Dental abscess — referred',
  'Hypertension', 'Type 2 diabetes mellitus', 'Anemia',
  'Migraine', 'Tension headache', 'Musculoskeletal pain',
  'Allergic dermatitis', 'Scabies', 'Fungal skin infection',
  'Dengue — suspected', 'Malaria — suspected', 'Typhoid — suspected'
];

// ---- One-click illness presets: a full typical Rx (meds + advice indices) ----
// items reference PRESET_MEDS by index so they stay editable.
const P = PRESET_MEDS;
export const RX_PRESETS = [
  { name: 'Viral fever / flu', diagnosis: 'Viral fever', items: [
    { med: 0, freq: 'TDS', days: 3, note: 'after meals' },
    { med: 24, freq: 'TDS', days: 3, note: '' }], advice: [0, 4, 11], followUpDays: 3 },
  { name: 'URTI / sore throat', diagnosis: 'Pharyngitis', items: [
    { med: 0, freq: 'TDS', days: 3, note: '' },
    { med: 4, freq: 'TDS', days: 5, note: 'after meals' },
    { med: 22, freq: 'TDS', days: 5, note: '2 tsp' }], advice: [0, 4, 5, 11], followUpDays: 5 },
  { name: 'Gastroenteritis / loose motions', diagnosis: 'Acute gastroenteritis', items: [
    { med: 7, freq: 'TDS', days: 5, note: '' },
    { med: 15, freq: 'SOS', days: 3, note: 'after each loose stool' },
    { med: 16, freq: 'SOS', days: 3, note: '' }], advice: [0, 1, 3, 13], followUpDays: 3 },
  { name: 'Acidity / gastritis', diagnosis: 'Gastritis', items: [
    { med: 10, freq: 'BB', days: 14, note: 'before breakfast' },
    { med: 12, freq: 'TDS', days: 5, note: 'before meals' }], advice: [1, 3], followUpDays: 14 },
  { name: 'Allergic rhinitis / skin allergy', diagnosis: 'Allergic rhinitis', items: [
    { med: 17, freq: 'OD', days: 7, note: '' },
    { med: 18, freq: 'OD', days: 7, note: 'if sedated, take at night' }], advice: [6], followUpDays: 7 },
  { name: 'Hypertension visit', diagnosis: 'Hypertension', items: [
    { med: 31, freq: 'OD', days: 30, note: 'same time daily' }], advice: [8, 10, 12], followUpDays: 30 },
  { name: 'Diabetes visit', diagnosis: 'Type 2 diabetes mellitus', items: [
    { med: 35, freq: 'BD', days: 30, note: 'with meals' }], advice: [9, 10], followUpDays: 30 },
  { name: 'Body aches / musculoskeletal pain', diagnosis: 'Musculoskeletal pain', items: [
    { med: 39, freq: 'BD', days: 5, note: 'after meals' },
    { med: 40, freq: 'TDS', days: 7, note: '' }], advice: [3], followUpDays: 7 },
  { name: 'UTI', diagnosis: 'UTI', items: [
    { med: 6, freq: 'BD', days: 7, note: '' },
    { med: 47, freq: 'TDS', days: 3, note: 'for pain' }], advice: [0, 13], followUpDays: 7 },
  { name: 'Anemia / weakness', diagnosis: 'Anemia', items: [
    { med: 43, freq: 'OD', days: 30, note: 'after food, avoid tea with dose' },
    { med: 42, freq: 'OD', days: 30, note: '' }], advice: [1, 13], followUpDays: 30 },
  { name: 'Scabies / skin infection', diagnosis: 'Scabies', items: [
    { med: 18, freq: 'HS', days: 7, note: '' },
    { med: 51, freq: 'BD', days: 7, note: 'apply thin layer' }], advice: [6], followUpDays: 7 },
  { name: 'Asthma / chest congestion', diagnosis: 'Asthma — controlled', items: [
    { med: 21, freq: 'SOS', days: 30, note: '2 puffs when breathless' },
    { med: 20, freq: 'NOCTE', days: 14, note: '' }], advice: [5, 6, 7], followUpDays: 14 }
];

export const INVESTIGATION_PRESETS = [
  'CBC', 'Blood sugar (fasting)', 'Blood sugar (random)', 'HbA1c', 'ESR', 'CRP',
  'Typhoid (Widal/ICT)', 'Dengue NS1', 'Malaria parasite (MP)', 'Urine complete examination',
  'Urine culture', 'Lipid profile', 'LFTs', 'RFTs / Creatinine', 'TSH',
  'Hepatitis B & C screening', 'X-ray chest', 'X-ray (specify site)', 'Ultrasound abdomen',
  'ECG', 'Vitamin D level', 'Stool examination', 'Pregnancy test ( urine )', 'Blood group & Rh'
];

// ---- Drug classes: allergy tokens match a med's class, not just its name ----
// Each entry maps a generic/brand substring → allergy-relevant class.
const CLASS_RULES = [
  ['amoxicillin', 'penicillin'], ['ampicillin', 'penicillin'], ['cloxacillin', 'penicillin'],
  ['flucloxacillin', 'penicillin'], ['piperacillin', 'penicillin'],
  ['cephradine', 'cephalosporin'], ['cephalexin', 'cephalosporin'], ['cefixime', 'cephalosporin'],
  ['ceftriaxone', 'cephalosporin'], ['cefuroxime', 'cephalosporin'], ['cefpodoxime', 'cephalosporin'],
  ['ciprofloxacin', 'quinolone'], ['ofloxacin', 'quinolone'], ['levofloxacin', 'quinolone'],
  ['moxifloxacin', 'quinolone'], ['norfloxacin', 'quinolone'],
  ['sulfamethoxazole', 'sulfonamide'], ['trimethoprim', 'sulfonamide'], ['sulfadiazine', 'sulfonamide'],
  ['ibuprofen', 'nsaid'], ['diclofenac', 'nsaid'], ['mefenamic', 'nsaid'], ['naproxen', 'nsaid'],
  ['aspirin', 'nsaid'], ['indomethacin', 'nsaid'], ['celecoxib', 'nsaid'], ['ketorolac', 'nsaid'],
  ['azithromycin', 'macrolide'], ['clarithromycin', 'macrolide'], ['erythromycin', 'macrolide'],
  ['metronidazole', 'nitroimidazole'], ['tinidazole', 'nitroimidazole'],
  ['doxycycline', 'tetracycline'], ['tetracycline', 'tetracycline'],
  ['tramadol', 'opioid'], ['codeine', 'opioid'], ['nalbuphine', 'opioid'],
  ['prednisolone', 'steroid'], ['dexamethasone', 'steroid'], ['betamethasone', 'steroid'],
  ['hydrocortisone', 'steroid'], ['prednisone', 'steroid'],
  ['alprazolam', 'benzodiazepine'], ['bromazepam', 'benzodiazepine'], ['lorazepam', 'benzodiazepine'],
  ['diazepam', 'benzodiazepine'], ['clonazepam', 'benzodiazepine'], ['midazolam', 'benzodiazepine']
];

// What a doctor typically writes in the allergy field → the class it means.
const ALLERGY_CLASS = {
  penicillin: 'penicillin', amoxicillin: 'penicillin', augmentin: 'penicillin',
  amoxil: 'penicillin', ampicillin: 'penicillin',
  sulfa: 'sulfonamide', sulfonamide: 'sulfonamide', septran: 'sulfonamide',
  cotrimoxazole: 'sulfonamide', bactrim: 'sulfonamide',
  nsaid: 'nsaid', aspirin: 'nsaid', brufen: 'nsaid', ibuprofen: 'nsaid',
  diclofenac: 'nsaid', voltral: 'nsaid', ponstan: 'nsaid', cataflam: 'nsaid', disprin: 'nsaid',
  quinolone: 'quinolone', ciprofloxacin: 'quinolone', cipro: 'quinolone', ciproxin: 'quinolone',
  macrolide: 'macrolide', azithromycin: 'macrolide', zithromax: 'macrolide', erythromycin: 'macrolide',
  cephalosporin: 'cephalosporin',
  codeine: 'opioid', tramadol: 'opioid',
  steroid: 'steroid', prednisolone: 'steroid',
  flagyl: 'nitroimidazole', metronidazole: 'nitroimidazole',
  benzodiazepine: 'benzodiazepine', xanax: 'benzodiazepine', lexotanil: 'benzodiazepine', ativan: 'benzodiazepine'
};

export function medClasses(name, generic) {
  const hay = `${name || ''} ${generic || ''}`.toLowerCase();
  const set = new Set();
  for (const [sub, cls] of CLASS_RULES) if (hay.includes(sub)) set.add(cls);
  return set;
}

// Returns { hit, how } when an item conflicts with the allergy text, else null.
// `how` is 'name' (string match) or 'class' (drug-class match).
export function allergyConflict(itemName, generic, allergyText) {
  if (!allergyText) return null;
  const toks = allergyText.toLowerCase().split(/[,;\s]+/).filter(t => t.length > 2);
  const hay = `${itemName || ''} ${generic || ''}`.toLowerCase();
  if (toks.some(t => hay.includes(t))) return { hit: itemName, how: 'name' };
  const classes = medClasses(itemName, generic);
  for (const t of toks) {
    const cls = ALLERGY_CLASS[t];
    if (cls && classes.has(cls)) return { hit: itemName, how: `class (${cls})` };
  }
  return null;
}

// ---- Minimal offline interaction cautions (pairs of generic substrings) ----
export const INTERACTIONS = [
  { a: 'aspirin', b: 'ibuprofen', warn: 'Aspirin + ibuprofen: increased GI bleed risk' },
  { a: 'aspirin', b: 'diclofenac', warn: 'Aspirin + diclofenac: increased GI bleed risk' },
  { a: 'alprazolam', b: 'bromazepam', warn: 'Two benzodiazepines: excessive sedation' },
  { a: 'alprazolam', b: 'lorazepam', warn: 'Two benzodiazepines: excessive sedation' },
  { a: 'ciprofloxacin', b: 'antacid', warn: 'Ciprofloxacin + antacid/iron: reduced absorption — space doses 2h' },
  { a: 'metronidazole', b: 'alcohol', warn: 'Metronidazole + alcohol: disulfiram reaction — advise no alcohol' },
  { a: 'glyceryl', b: 'sildenafil', warn: 'Nitrate + sildenafil: dangerous hypotension' },
  { a: 'furosemide', b: 'diclofenac', warn: 'NSAID blunts furosemide — monitor BP' },
  { a: 'warfarin', b: 'aspirin', warn: 'Warfarin + aspirin: major bleed risk' },
  { a: 'iron', b: 'ciprofloxacin', warn: 'Iron + ciprofloxacin: reduced absorption — space doses 2h' },
  { a: 'domperidone', b: 'ciprofloxacin', warn: 'Domperidone + ciprofloxacin: QT prolongation caution' },
  { a: 'metformin', b: 'alcohol', warn: 'Metformin + alcohol: lactic acidosis risk' }
];


export const DRUG_INFO = {
  'panadol': { dose: '500mg-1g, 6-8 hourly (max 4g/day)', warn: 'Liver disease — reduce dose', class: 'Analgesic/antipyretic' },
  'augmentin': { dose: '625mg 8 hourly, 5-7 days', warn: 'Penicillin allergy', class: 'Antibiotic' },
  'brufen': { dose: '400mg 8 hourly with food', warn: 'Ulcer, renal disease, asthma', class: 'NSAID' },
  'nexum': { dose: '40mg once daily before breakfast', warn: 'Long-term use — B12/Mg check', class: 'PPI' },
  'flagyl': { dose: '400mg 8 hourly, 5-7 days', warn: 'No alcohol + 48h after', class: 'Antibiotic' },
  'cetrizine': { dose: '10mg once daily', warn: 'Drowsiness', class: 'Antihistamine' },
  'amoxicillin': { dose: '500mg 8 hourly, 5-7 days', warn: 'Penicillin allergy', class: 'Antibiotic' },
  'ciprofloxacin': { dose: '500mg 12 hourly', warn: 'Not for children/pregnancy; tendon risk', class: 'Antibiotic' },
  'metformin': { dose: '500mg 12 hourly with meals', warn: 'Renal function check', class: 'Antidiabetic' },
  'amlodipine': { dose: '5mg once daily', warn: 'Ankle swelling', class: 'Antihypertensive' },
  'losartan': { dose: '50mg once daily', warn: 'Pregnancy contraindicated', class: 'ARB' },
  'salbutamol': { dose: '2 puffs PRN / 6 hourly', warn: 'Tremor, tachycardia', class: 'Bronchodilator' },
  'prednisolone': { dose: 'per condition — taper', warn: 'Never stop abruptly; diabetes/HTN caution', class: 'Steroid' },
  'artemether': { dose: '80/480mg 12 hourly × 3 days with fat', warn: 'Confirm malaria first', class: 'Antimalarial' },
  'ferrous': { dose: 'once daily empty stomach', warn: 'Black stools normal; constipation', class: 'Iron supplement' }
};

export function drugInfo(name) {
  const n = (name || '').toLowerCase();
  const key = Object.keys(DRUG_INFO).find(k => n.includes(k));
  return key ? DRUG_INFO[key] : null;
}
