# Clinory — Microsoft Store listing copy

## Category
Health & fitness (Business is an acceptable alternative — pick one, stay consistent).

## Description (paste into Partner Center)

A prescription pad and patient register for small clinics. Write a bilingual English/Urdu prescription in seconds, keep every visit on file, run the day's queue, and print on your own letterhead. Works entirely offline — no account, no subscription, and patient records never leave your computer.

For single-doctor clinics and small practices. Clinory is a record-keeping and printing tool for qualified practitioners; it does not provide medical advice, diagnosis or treatment recommendations. Allergy and interaction warnings are a limited convenience check, not a substitute for clinical judgement or a full drug-interaction database. The prescriber is responsible for every prescription issued.

Features: patient register with photos and timeline, token queue, bilingual Rx printing (letterhead or pre-printed pad mode), labs, vaccination, admissions/day book, expense tracking, staff roles with PINs, audit log, automatic encrypted backups, and optional same-network sharing between clinic PCs (off by default, access-code protected).

## Search terms
prescription pad, clinic software, patient records, rx pad, urdu prescription, doctor software, opd

## Additional Testing Information (paste into Partner Center)

No account, login, internet connection or purchase is required. The app is fully functional on first launch and ships with fictional sample data.

To evaluate:
1. Accept the data-handling notice on first run.
2. The patient list opens with sample patients. Open any patient to see the visit timeline.
3. Click "New Rx" to open the prescription pad. Type a medicine name for autocomplete, pick a frequency and duration, then "Print preview" to see the bilingual output. Print to PDF if no printer is attached.
4. Queue, Labs, Vaccines and Day Book tabs are all populated by the sample data.
5. LAN sharing (Settings → Local connection) is OFF by default and is not required for review.

The app is built with Electron. runFullTrust is a standard and mandatory requirement for Electron desktop applications; it is used only for local file access, the local database and printing.

The privateNetworkClientServer capability is used for an optional, off-by-default feature that lets a second PC in the same clinic view the same records over the local network. It requires an access code shown on the host PC, serves only to the local network, and is never enabled without the user turning it on. All patient data remains on the clinic's own machines; the app makes no internet requests.

## Pricing / publish
- Free. All markets, public, discoverable.
- "Don't publish this submission until I select Publish now" — review the live listing first.

## Age ratings
All No, including "allows users to interact or exchange content with other users" — the LAN feature shares data between devices inside one clinic, not between users of the product.

## Before-submit checklist
- [ ] Partner Center: reserve "Clinory"; paste `identityName` + `publisher` into package.json `appx` (never hand-typed)
- [ ] `npm run dist:win` on Windows, run `release/win-unpacked/Clinory.exe`, grep the UI by eye for the old name
- [ ] Fresh install on a clean profile — first run works with no data
- [ ] Print a prescription on plain paper and on a letterhead sheet
- [ ] Turn LAN sharing on, connect a phone, confirm the access code is required; turn it off, confirm the port closes
- [ ] Settings → Regenerate — old code stops working
- [ ] Reset — delete all data actually clears
- [ ] Restore from a backup file
- [ ] Privacy policy URL opens and shows "Clinory"
