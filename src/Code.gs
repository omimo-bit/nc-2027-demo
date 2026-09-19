/**
 * Code.gs
 * Web app entry point. Every API action (login, getTodayPJP, checkIn,
 * submitStock, ... — see 05_DRD_DEMO.md §6) is a plain global function
 * defined in src/services/*.gs and called directly from the frontend via
 * google.script.run. This keeps the same action names/envelope the DRD
 * defines while staying idiomatic to Apps Script (no CORS, no separate
 * REST deployment needed — PRD Demo §10 prefers serving UI from the same
 * GAS project for pitch stability).
 */

var PAGE_MAP_ = {
  login: 'frontend/index',
  nc: 'frontend/nc/nc',
  'data-entry': 'frontend/data-entry/control-center',
  analyst: 'frontend/analyst/dashboard',
  client: 'frontend/client/executive'
};

function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) || 'login';
  var file = PAGE_MAP_[page] || PAGE_MAP_.login;
  return HtmlService.createTemplateFromFile(file)
    .evaluate()
    .setTitle('NC 2027 Reporting & Monitoring System')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Used by HTML template scriptlets: <?!= include_('frontend/shared/theme') ?> */
function include_(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
