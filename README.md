# NC 2027 — Demo / Pitching Prototype Scaffold

Change Impact: **[DEMO ONLY]** — no production PRD/DRD/ERD changes.

This is the initial repo scaffold for the **NC 2027 Reporting & Monitoring System**
pitching prototype, built exactly to the approved baseline:
`04_PRD_DEMO.md`, `05_DRD_DEMO.md`, `06_ERD_DEMO.md`, and the clarifications
approved on top of the A–J summary.

## Stack (per PRD Demo §10 / §2)
- **Source control:** GitHub (this repo)
- **Backend/API:** Google Apps Script (`src/`), deployed as a Web App
- **Database:** Google Sheets, 22 frozen relational-style tabs (`05_DRD_DEMO.md` §2)
- **Frontend:** HTML/CSS/Vanilla JS (`frontend/`), served from the same Apps Script
  project (avoids CORS issues for pitch stability)
- **Evidence storage:** Google Drive
- **GPS:** Browser Geolocation API

## Repo layout
```
appsscript.json          Apps Script manifest (web app config)
src/
  Config.gs               Spreadsheet/Drive IDs, sheet names, demo config defaults
  Utils.gs                Response envelope, UUIDs, GPS distance, audit logging
  Repository.gs           Generic Sheets CRUD (frontend never touches rows directly)
  Setup.gs                setupSheets() — one-time tab + header creation
  Seed.gs                 seedDemo() / resetDemo() — synthetic data + seeded exceptions
  Auth.gs                 login() — demo-only, NOT production security
  Code.gs                 doGet() web app router, HTML include helper
  services/
    PjpService.gs          getTodayPJP, getStoreDetail, getProducts
    VisitService.gs        checkIn, getVisitTasks, completeVisit
    SubmissionService.gs   submitStock, submitOfftake, submitStoreEvidence
    ValidationService.gs   exception-first validation engine
    ControlCenterService.gs getControlCenter, getSubmission, approveSubmission, requestCorrection
    DashboardService.gs    getDataQuality, getDashboardSummary, getRegionalPerformance
frontend/
  index.html               Login (role-neutral, "NC 2027" branding)
  shared/theme.html         Design tokens (colors/type) — no third-party branding
  shared/api.html           google.script.run wrapper matching DRD action names
  nc/nc.html                 Mobile NC app: PJP → check-in → tasks → submit → complete
  data-entry/control-center.html  Exception-first review queue
  analyst/dashboard.html     KPI cards, trend, regional performance
  client/executive.html      Executive-only summary view
docs/DEPLOYMENT.md         Step-by-step clasp/Apps Script deployment guide
```

## What is intentionally NOT here yet (deferred from Demo v1, per PRD Demo §4)
Consumer module, GWP module, full survey builder, Share of Shelf / Paid
Visibility production logic, payroll/incentive, enterprise security. These
stay in the **Production** PRD/DRD/ERD only — do not add them to the demo
without an explicit request (approved clarification #4).

## What is intentionally simplified / synthetic
- `demoHash_()` in `Auth.gs` is a placeholder, not a real password hash —
  never reuse this for production auth (Supabase Auth handles that).
- KPI values in `Seed.gs` (`seedHistoricalKpi_`) are random synthetic
  numbers for chart visuals only — not Acquisition/Conversion/GWP formulas,
  which remain `TBD / Client Confirmation` everywhere (approved clarification #5).
- Validation thresholds in `Config.gs` (`DEMO_CONFIG_DEFAULTS`) are demo
  config values, not client-approved production thresholds.

## Frozen identifiers preserved from production
`user_id, store_id, pjp_visit_id, visit_id, visit_task_id, submission_id,
product_id, evidence_id, validation_id, correction_id` — used verbatim as
column names throughout the Sheets schema (see `03_ERD_PRODUCTION.md` §4).

## Next steps
See `docs/DEPLOYMENT.md` to stand this up in ~15 minutes with `clasp`.
