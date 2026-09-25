# Clinory

Offline prescription pad and patient register for clinics. Write a bilingual (English + Urdu) prescription in seconds, keep every visit on file, run a daily patient queue — with no account, no internet, nothing leaving the machine.

## Features

- **Patient register** — MRN auto-numbering, search by name/MRN/phone, allergies, chronic notes, full visit timeline per patient
- **One-click Rx pad** — medicine autocomplete from a built-in library of ~60 common medicines, frequency codes (OD/BD/TDS/QID/HS/SOS…), durations, per-line notes, one-click advice presets
- **Bilingual printing** — Urdu instruction line under every medicine and a right-aligned Urdu advice column (Jameel Noori Nastaleeq / Urdu Typesetting)
- **Safety** — allergy cross-check warns when a prescribed item matches a recorded allergy
- **Vitals row** — BP, pulse, temp, weight, SpO₂ on the pad
- **Repeat last Rx** — one click copies the previous visit's medicines and advice
- **Queue** — today's waiting list, call-in → write Rx → done
- **Follow-ups** — "next visit in N days" lands on the dashboard when due/overdue
- **Print & export** — A5 pad or A4, Classic (navy) or Modern (teal) template, direct print or vector PDF via hidden-window printToPDF
- **Data safety** — atomic JSON writes + 50 rolling snapshots, full JSON backup/restore, CSV export of patients/visits/medicines

## Stack

Electron 30 + Vite 5 + React 18. CommonJS `electron/`, ESM `src/`. Strict CSP — the renderer has no network access at all in packaged builds.

## Run

```sh
npm install
npm run dev        # Vite :5173 + Electron
npm run build      # production bundle in dist/
npm run dist:win   # Windows NSIS installer + .appx in release/ (Windows only)
```

## Microsoft Store

`identityName` and `publisher` in `package.json → build.appx` are `FROM_PARTNER_CENTER` placeholders — paste real values from Partner Center once the product is reserved, then build on Windows.
