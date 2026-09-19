# Deployment Guide — NC 2027 Demo

## 1. Prerequisites
- A Google account with access to Sheets / Drive / Apps Script.
- Node.js installed locally, then:
  ```bash
  npm install -g @google/clasp
  clasp login
  ```

## 2. Create the backing Spreadsheet and Drive folder
1. Create a new Google Sheet (e.g. "NC 2027 Demo Data"). Copy its ID from the URL
   (`https://docs.google.com/spreadsheets/d/<THIS_PART>/edit`).
2. Create a new Drive folder (e.g. "NC 2027 Demo Evidence"). Copy its folder ID
   the same way from the folder's URL.
3. Paste both IDs into `src/Config.gs`:
   ```js
   var SPREADSHEET_ID = '...';
   var EVIDENCE_DRIVE_FOLDER_ID = '...';
   ```

## 3. Push the code to a new Apps Script project
From the repo root:
```bash
clasp create --type webapp --title "NC 2027 Demo" --rootDir .
clasp push
```
This uploads `appsscript.json`, everything in `src/`, and everything in `frontend/`.

## 4. Initialize the spreadsheet
1. Open the Apps Script project (`clasp open`).
2. Select the `Setup.gs` file, choose the `setupSheets` function, click Run.
   Authorize the requested Sheets/Drive scopes when prompted.
3. This creates all 22 tabs with header rows (see `05_DRD_DEMO.md` §2).

## 5. Seed synthetic demo data
1. Still in the Apps Script editor, select `Seed.gs`, choose `seedDemo`, click Run.
2. This creates: 1 region/area, 3 stores, 3 products, 4 task definitions, the
   4 demo user accounts, today's PJP with 3 visits, ~14 days of synthetic KPI
   history, and 5 seeded exception scenarios for the Control Center demo.
3. To wipe and reseed later (e.g. before a live pitch), run `resetDemo` instead.

## 6. Deploy as a Web App
1. In the Apps Script editor: **Deploy → New deployment → Web app**.
2. Execute as: **Me**. Who has access: **Anyone** (or "Anyone within
   [organization]" if you don't want it public).
3. Copy the resulting web app URL — this is the demo link you share for pitching.

## 7. Log in
Open the web app URL (defaults to `?page=login`). Demo accounts (password =
username, per `Seed.gs`):
- `nc.demo` → mobile field app (`?page=nc`)
- `dataentry.demo` → Control Center (`?page=data-entry`)
- `analyst.demo` → Analyst dashboard (`?page=analyst`)
- `client.demo` → Executive view (`?page=client`)

## 8. Iterating
After editing files locally, `clasp push` again. If you change
`appsscript.json` webapp settings or want a stable link, use **Deploy →
Manage deployments → Edit → New version** rather than creating a brand new
deployment each time (this keeps the same URL).

## Known demo limitations (do not present as production-ready)
- `Auth.gs` login is not secure — fine for a controlled pitch, not for real
  credentials.
- Apps Script execution quotas and Sheets row limits apply; this will not
  scale to the production target of 1,000+ users (see `01_PRD_PRODUCTION.md` §8).
- No offline queue sync is implemented yet beyond the architectural
  placeholder (`IndexedDB` foundation) — evidentiary items in the PRD/DRD
  offline behavior section are a follow-up increment.
