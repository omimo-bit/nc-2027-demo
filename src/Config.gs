/**
 * Config.gs
 * Central configuration for the NC 2027 demo backend.
 *
 * IMPORTANT: values below marked TBD are demo-only illustrative defaults.
 * They are NOT client-approved business rules (see 01_PRD_PRODUCTION.md §10
 * and 02_DRD_PRODUCTION.md §6). Never promote these numbers to production
 * without explicit client confirmation.
 */

// Fill these in after creating the Spreadsheet and Drive folder (see docs/DEPLOYMENT.md).
var SPREADSHEET_ID = '11pk3q0OlCeKls6B-LmOjGw28_fMYAIYuw5WmdCk3Iuo';
var EVIDENCE_DRIVE_FOLDER_ID = '1QsDt7yGq_6R4zfDXlpjPbG1eKR2bKIln';

// Frozen tab list — do not rename without updating SHEET_HEADERS in Setup.gs.
// Matches 05_DRD_DEMO.md §2.
var SHEETS = {
  USERS: '01_USERS',
  ROLES: '02_ROLES',
  ASSIGNMENTS: '03_ASSIGNMENTS', // demo physical representation of production `user_assignments`
  REGIONS: '04_REGIONS',
  AREAS: '05_AREAS',
  STORES: '06_STORES',
  PRODUCTS: '07_PRODUCTS',
  PJP: '08_PJP',
  PJP_VISITS: '09_PJP_VISITS',
  STORE_VISITS: '10_STORE_VISITS',
  TASK_DEFINITIONS: '11_TASK_DEFINITIONS',
  VISIT_TASKS: '12_VISIT_TASKS',
  SUBMISSIONS: '13_SUBMISSIONS',
  STOCK_TAKING: '14_STOCK_TAKING',
  OFFTAKE: '15_OFFTAKE',
  EVIDENCE: '16_EVIDENCE',
  VALIDATION_RESULTS: '17_VALIDATION_RESULTS',
  CORRECTIONS: '18_CORRECTIONS',
  TARGETS: '19_TARGETS',
  KPI_DAILY: '20_KPI_DAILY',
  AUDIT_LOGS: '21_AUDIT_LOGS',
  SYSTEM_CONFIG: '22_SYSTEM_CONFIG'
};

// Demo-only configuration defaults, mirrored into 22_SYSTEM_CONFIG at seed time.
// These are config values (adjustable), not formulas — per DRD Demo §4: "Demo
// thresholds are configuration values and are not client-approved business rules."
var DEMO_CONFIG_DEFAULTS = {
  GPS_PASS_RADIUS_M: 100,     // TBD / Client Confirmation for production
  GPS_WARNING_RADIUS_M: 250,  // TBD / Client Confirmation for production
  PHOTO_MAX_WIDTH_PX: 1280,
  DEMO_MODE: true,
  DEMO_VERSION: '1.0.0'
};

var TASK_CODES = {
  CHECK_IN: 'CHECK_IN',
  STOCK_TAKING: 'STOCK_TAKING',
  OFFTAKE: 'OFFTAKE',
  STORE_EVIDENCE: 'STORE_EVIDENCE'
};

var SUBMISSION_STATUS = {
  DRAFT: 'DRAFT',
  QUEUED: 'QUEUED',
  SYNCED: 'SYNCED',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  CORRECTION_REQUIRED: 'CORRECTION_REQUIRED',
  VALIDATED: 'VALIDATED',
  REJECTED: 'REJECTED'
};

var VALIDATION_STATUS = {
  PENDING: 'PENDING',
  PASS: 'PASS',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  REJECTED: 'REJECTED'
};

var VISIT_STATUS = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  MISSED: 'MISSED',
  CANCELLED: 'CANCELLED'
};

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}
