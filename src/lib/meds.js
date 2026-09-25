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
