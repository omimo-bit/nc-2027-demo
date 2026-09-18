
const APP = {
  version: '0.4.0',
  timezone: 'Asia/Jakarta',
  demoMode: true,
  sheets: {
    USERS: '01_USERS',
    ROLES: '02_ROLES',
    ASSIGNMENTS: '03_ASSIGNMENTS',
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
  }
};

function getSpreadsheetId_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('SPREADSHEET_ID is not configured');
  return id;
}
