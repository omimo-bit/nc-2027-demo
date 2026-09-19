/**
 * DashboardService.gs
 * Serves Analyst and Client views from KPI_DAILY (analytical layer) and
 * submission/validation counts — never raw transaction scans in spirit of
 * the production "no heavy raw-table dashboard query" rule (PRD Production
 * §8), even though the demo's raw tables are small.
 *
 * IMPORTANT: Acquisition, Conversion, GWP absorption and similar KPIs are
 * intentionally NOT computed here — their formulas are
 * TBD / Client Confirmation (PRD Production §5.10–5.12, §10). Do not add
 * them without an explicit client-approved formula.
 */

function getDataQuality() {
  var submissions = getAllRows_(SHEETS.SUBMISSIONS);
  var total = submissions.length || 1;
  var pass = submissions.filter(function (s) { return s.validation_status === VALIDATION_STATUS.PASS; }).length;
  var warning = submissions.filter(function (s) { return s.validation_status === VALIDATION_STATUS.WARNING; }).length;
  var error = submissions.filter(function (s) { return s.validation_status === VALIDATION_STATUS.ERROR; }).length;
  var corrections = getAllRows_(SHEETS.CORRECTIONS).length;

  return ok_({
    total_submissions: submissions.length,
    validation_pass_rate: Math.round((pass / total) * 100),
    warning_rate: Math.round((warning / total) * 100),
    error_rate: Math.round((error / total) * 100),
    correction_count: corrections,
    note: 'Demo metrics are descriptive counts, not client-approved data-quality formulas.'
  });
}

function getDashboardSummary() {
  var kpis = getAllRows_(SHEETS.KPI_DAILY);
  var byCode = {};
  kpis.forEach(function (row) {
    if (!byCode[row.kpi_code]) byCode[row.kpi_code] = [];
    byCode[row.kpi_code].push(row);
  });

  var summary = Object.keys(byCode).map(function (code) {
    var rows = byCode[code].sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
    var latest = rows[rows.length - 1];
    return {
      kpi_code: code,
      latest_value: latest ? Number(latest.actual_value) : null,
      target_value: latest ? Number(latest.target_value) : null,
      achievement: latest ? Number(latest.achievement) : null,
      trend: rows.map(function (r) { return { date: r.date, value: Number(r.actual_value) }; })
    };
  });

  var stores = getAllRows_(SHEETS.STORES);
  var users = getAllRows_(SHEETS.USERS).filter(function (u) { return u.role_code === 'NC' && u.status === 'ACTIVE'; });
  var visits = getAllRows_(SHEETS.STORE_VISITS);
  var completedVisits = visits.filter(function (v) { return v.visit_status === VISIT_STATUS.COMPLETED; }).length;

  return ok_({
    active_nc: users.length,
    active_stores: stores.length,
    store_coverage_pct: stores.length ? Math.round((completedVisits / stores.length) * 100) : 0,
    kpis: summary
  });
}

function getRegionalPerformance() {
  var kpis = getAllRows_(SHEETS.KPI_DAILY);
  var regions = getAllRows_(SHEETS.REGIONS);
  return ok_(regions.map(function (region) {
    var regionKpis = kpis.filter(function (k) { return k.region_id === region.region_id; });
    var avgAchievement = regionKpis.length
      ? Math.round(regionKpis.reduce(function (sum, k) { return sum + Number(k.achievement || 0); }, 0) / regionKpis.length)
      : null;
    return { region_id: region.region_id, region_name: region.name, avg_achievement: avgAchievement };
  }));
}
