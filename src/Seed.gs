/**
 * Seed.gs
 * Demo seed strategy per 05_DRD_DEMO.md §5:
 *  - "live scenario": one NC and three stores, PJP for today, ready to
 *    walk through the golden demo journey live.
 *  - "historical/synthetic analytics": extra days of KPI history so the
 *    Analyst/Client dashboards have something meaningful to show.
 *  - seeded exceptions: GPS warning, missing evidence, duplicate,
 *    invalid stock, late submission — so the Data Entry Control Center
 *    has real exception rows to review during a pitch.
 *
 * All data here is synthetic. Do not put real employee/consumer data in
 * this function (07_UI... / PRD Demo §11 safety boundaries).
 */

function resetDemo() {
  Object.keys(SHEET_HEADERS).forEach(function (name) {
    if (name === SHEETS.ROLES) return; // roles are semi-static reference data, safe to keep
    clearDataRows_(name);
  });
  _sheetCache_ = {}; // drop cached sheet handles so fresh state is read
  return seedDemo();
}

function seedDemo() {
  var now = nowIso_();
  var today = new Date();
  var todayStr = Utilities.formatDate(today, 'Asia/Jakarta', 'yyyy-MM-dd');
  var period = Utilities.formatDate(today, 'Asia/Jakarta', 'yyyy-MM');

  // --- System config -------------------------------------------------
  Object.keys(DEMO_CONFIG_DEFAULTS).forEach(function (key) {
    appendRow_(SHEETS.SYSTEM_CONFIG, {
      config_key: key,
      config_value: String(DEMO_CONFIG_DEFAULTS[key]),
      data_type: typeof DEMO_CONFIG_DEFAULTS[key],
      description: 'Demo config value — not a client-approved production rule.',
      status: 'ACTIVE'
    });
  });

  // --- Roles (only seeded if empty; kept across resetDemo) ------------
  if (getAllRows_(SHEETS.ROLES).length === 0) {
    appendRow_(SHEETS.ROLES, { role_code: 'NC', role_name: 'Field NC', dashboard_route: '/nc', can_field_input: true, can_validate: false, can_analyze: false, can_view_executive: false, status: 'ACTIVE' });
    appendRow_(SHEETS.ROLES, { role_code: 'DATA_ENTRY', role_name: 'Data Entry', dashboard_route: '/data-entry', can_field_input: false, can_validate: true, can_analyze: false, can_view_executive: false, status: 'ACTIVE' });
    appendRow_(SHEETS.ROLES, { role_code: 'DATA_ANALYST', role_name: 'Data Analyst', dashboard_route: '/analyst', can_field_input: false, can_validate: false, can_analyze: true, can_view_executive: false, status: 'ACTIVE' });
    appendRow_(SHEETS.ROLES, { role_code: 'CLIENT', role_name: 'Client Executive', dashboard_route: '/client', can_field_input: false, can_validate: false, can_analyze: false, can_view_executive: true, status: 'ACTIVE' });
  }

  // --- Org: region / area / stores / products -------------------------
  var regionId = newId_();
  appendRow_(SHEETS.REGIONS, { region_id: regionId, code: 'JKT', name: 'Jakarta', status: 'ACTIVE' });

  var areaId = newId_();
  appendRow_(SHEETS.AREAS, { area_id: areaId, region_id: regionId, code: 'JKT-01', name: 'Jakarta Selatan', status: 'ACTIVE' });

  var stores = [
    { name: 'Toko Sumber Rejeki', lat: -6.2615, lng: 106.7810 },
    { name: 'Toko Berkah Jaya', lat: -6.2445, lng: 106.7995 },
    { name: 'Toko Maju Bersama', lat: -6.2701, lng: 106.8102 }
  ].map(function (s, i) {
    var storeId = newId_();
    appendRow_(SHEETS.STORES, {
      store_id: storeId, store_code: 'ST-' + (i + 1).toString().padStart(3, '0'), store_name: s.name,
      channel: 'GT', region_id: regionId, area_id: areaId, address: s.name + ' St.', city: 'Jakarta',
      latitude: s.lat, longitude: s.lng, gps_radius: DEMO_CONFIG_DEFAULTS.GPS_PASS_RADIUS_M, status: 'ACTIVE'
    });
    return { store_id: storeId, lat: s.lat, lng: s.lng };
  });

  var products = ['Produk A 250ml', 'Produk B 500ml', 'Produk C Sachet'].map(function (name, i) {
    var productId = newId_();
    appendRow_(SHEETS.PRODUCTS, { product_id: productId, sku_code: 'SKU-' + (i + 1), brand: 'Brand X', product_name: name, size: name.split(' ').pop(), uom: 'PCS', category: 'Category ' + (i + 1), status: 'ACTIVE' });
    return productId;
  });

  // --- Task definitions -------------------------------------------------
  var taskDefs = [
    { code: TASK_CODES.CHECK_IN, name: 'Attendance / Check-in', photo: false, gps: true },
    { code: TASK_CODES.STOCK_TAKING, name: 'Stock Taking', photo: false, gps: false },
    { code: TASK_CODES.OFFTAKE, name: 'Offtake', photo: false, gps: false },
    { code: TASK_CODES.STORE_EVIDENCE, name: 'Store Evidence', photo: true, gps: false }
  ].map(function (t, i) {
    var taskId = newId_();
    appendRow_(SHEETS.TASK_DEFINITIONS, { task_id: taskId, task_code: t.code, task_name: t.name, frequency: 'PER_VISIT', required: true, requires_photo: t.photo, requires_gps: t.gps, sequence: i + 1, status: 'ACTIVE' });
    return { task_id: taskId, task_code: t.code };
  });

  // --- Users -------------------------------------------------------------
  var ncId = newId_();
  appendRow_(SHEETS.USERS, { user_id: ncId, username: 'nc.demo', password_hash: demoHash_('nc.demo'), full_name: 'Andi (Demo NC)', role_code: 'NC', phone: '0800000001', email: 'nc.demo@example.com', region_id: regionId, area_id: areaId, status: 'ACTIVE', created_at: now, updated_at: now });

  var deId = newId_();
  appendRow_(SHEETS.USERS, { user_id: deId, username: 'dataentry.demo', password_hash: demoHash_('dataentry.demo'), full_name: 'Bunga (Demo Data Entry)', role_code: 'DATA_ENTRY', phone: '0800000002', email: 'dataentry.demo@example.com', region_id: regionId, area_id: areaId, status: 'ACTIVE', created_at: now, updated_at: now });

  var analystId = newId_();
  appendRow_(SHEETS.USERS, { user_id: analystId, username: 'analyst.demo', password_hash: demoHash_('analyst.demo'), full_name: 'Citra (Demo Analyst)', role_code: 'DATA_ANALYST', phone: '0800000003', email: 'analyst.demo@example.com', region_id: regionId, area_id: areaId, status: 'ACTIVE', created_at: now, updated_at: now });

  var clientId = newId_();
  appendRow_(SHEETS.USERS, { user_id: clientId, username: 'client.demo', password_hash: demoHash_('client.demo'), full_name: 'Dedi (Demo Client)', role_code: 'CLIENT', phone: '0800000004', email: 'client.demo@example.com', region_id: regionId, area_id: areaId, status: 'ACTIVE', created_at: now, updated_at: now });

  appendRow_(SHEETS.ASSIGNMENTS, { assignment_id: newId_(), user_id: ncId, supervisor_id: deId, region_id: regionId, area_id: areaId, effective_start: todayStr, effective_end: '', status: 'ACTIVE' });

  // --- Today's PJP + visits (live demo scenario) --------------------------
  var pjpId = newId_();
  appendRow_(SHEETS.PJP, { pjp_id: pjpId, period: period, nc_id: ncId, status: 'ACTIVE', created_by: deId, created_at: now });

  stores.forEach(function (store, i) {
    appendRow_(SHEETS.PJP_VISITS, {
      pjp_visit_id: newId_(), pjp_id: pjpId, visit_date: todayStr, nc_id: ncId, store_id: store.store_id,
      sequence: i + 1, planned_start: todayStr + ' 09:00', planned_end: todayStr + ' 17:00', status: VISIT_STATUS.PLANNED
    });
  });

  // --- Historical synthetic data for dashboards (last 14 days) -----------
  seedHistoricalKpi_(regionId, areaId, ncId, stores, products, todayStr);

  // --- Seeded exception scenarios (yesterday's completed visit) ----------
  seedExceptionScenarios_(ncId, stores, products, taskDefs);

  return ok_({
    users: { nc: 'nc.demo', dataEntry: 'dataentry.demo', analyst: 'analyst.demo', client: 'client.demo', passwordNote: 'password = username (demo only, not secure)' },
    storesSeeded: stores.length,
    pjpId: pjpId
  }, 'Demo seeded');
}

/** Demo-only "hash" — NOT a security control. Replace entirely for production auth. */
function demoHash_(value) {
  return Utilities.base64Encode(Utilities.newBlob(value).getBytes());
}

function seedHistoricalKpi_(regionId, areaId, ncId, stores, products, todayStr) {
  var kpiCodes = ['STORE_COVERAGE', 'TASK_COMPLETION', 'OFFTAKE_ACHIEVEMENT', 'DATA_ACCURACY'];
  for (var d = 14; d >= 1; d--) {
    var date = new Date();
    date.setDate(date.getDate() - d);
    var dateStr = Utilities.formatDate(date, 'Asia/Jakarta', 'yyyy-MM-dd');
    kpiCodes.forEach(function (code) {
      var target = 100;
      var actual = Math.round(70 + Math.random() * 30); // synthetic only — not a client formula
      appendRow_(SHEETS.KPI_DAILY, {
        kpi_daily_id: newId_(), date: dateStr, region_id: regionId, area_id: areaId, user_id: ncId, store_id: '',
        kpi_code: code, target_value: target, actual_value: actual, achievement: Math.round((actual / target) * 100),
        gap: actual - target, calculated_at: nowIso_()
      });
    });
  }
}

function seedExceptionScenarios_(ncId, stores, products, taskDefs) {
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  var yStr = Utilities.formatDate(yesterday, 'Asia/Jakarta', 'yyyy-MM-dd');

  function makeSubmission(store, taskCode, overrides) {
    var visitId = newId_();
    appendRow_(SHEETS.STORE_VISITS, Object.assign({
      visit_id: visitId, pjp_visit_id: '', nc_id: ncId, store_id: store.store_id, visit_date: yStr,
      check_in_at: yStr + ' 09:05', check_in_lat: store.lat, check_in_long: store.lng, check_in_distance: 20,
      check_out_at: yStr + ' 09:40', check_out_lat: store.lat, check_out_long: store.lng, check_out_distance: 25,
      visit_status: VISIT_STATUS.COMPLETED, completion_percentage: 100, created_at: nowIso_(), updated_at: nowIso_()
    }));
    var visitTaskId = newId_();
    appendRow_(SHEETS.VISIT_TASKS, { visit_task_id: visitTaskId, visit_id: visitId, task_id: '', task_code: taskCode, status: 'COMPLETED', started_at: yStr + ' 09:10', completed_at: yStr + ' 09:20', validation_status: VALIDATION_STATUS.PENDING });
    var submissionId = newId_();
    var base = {
      submission_id: submissionId, visit_id: visitId, visit_task_id: visitTaskId, task_code: taskCode, user_id: ncId,
      store_id: store.store_id, device_timestamp: yStr + ' 09:20', server_timestamp: yStr + ' 09:21',
      latitude: store.lat, longitude: store.lng, sync_source: 'ONLINE', submission_status: SUBMISSION_STATUS.SUBMITTED,
      validation_status: VALIDATION_STATUS.PENDING, idempotency_key: newId_(), version: 1, created_at: nowIso_(), updated_at: nowIso_()
    };
    appendRow_(SHEETS.SUBMISSIONS, Object.assign(base, overrides || {}));
    return { submissionId: submissionId, store: store };
  }

  // 1) GPS warning: check-in far from store but inside "warning" band.
  var s1 = makeSubmission(stores[0], TASK_CODES.STOCK_TAKING, { latitude: stores[0].lat + 0.0015, longitude: stores[0].lng + 0.0015 });
  appendRow_(SHEETS.STOCK_TAKING, { stock_id: newId_(), submission_id: s1.submissionId, product_id: products[0], physical_stock: 40, system_stock: 42, stock_gap: -2, remark: '' });
  runValidationForSeed_(s1.submissionId, s1.store);

  // 2) Missing evidence: STORE_EVIDENCE task submitted with no evidence row.
  var s2 = makeSubmission(stores[1], TASK_CODES.STORE_EVIDENCE, {});
  runValidationForSeed_(s2.submissionId, s2.store);

  // 3) Duplicate idempotency: two submissions sharing the same idempotency_key.
  var dupKey = newId_();
  var s3a = makeSubmission(stores[2], TASK_CODES.OFFTAKE, { idempotency_key: dupKey });
  appendRow_(SHEETS.OFFTAKE, { offtake_id: newId_(), submission_id: s3a.submissionId, product_id: products[1], quantity: 12, period_type: 'DAILY', period_start: yStr, period_end: yStr, remark: '' });
  var s3b = makeSubmission(stores[2], TASK_CODES.OFFTAKE, { idempotency_key: dupKey });
  appendRow_(SHEETS.OFFTAKE, { offtake_id: newId_(), submission_id: s3b.submissionId, product_id: products[1], quantity: 12, period_type: 'DAILY', period_start: yStr, period_end: yStr, remark: '' });
  runValidationForSeed_(s3a.submissionId, s3a.store);
  runValidationForSeed_(s3b.submissionId, s3b.store);

  // 4) Invalid stock: negative physical stock.
  var s4 = makeSubmission(stores[0], TASK_CODES.STOCK_TAKING, {});
  appendRow_(SHEETS.STOCK_TAKING, { stock_id: newId_(), submission_id: s4.submissionId, product_id: products[2], physical_stock: -5, system_stock: 10, stock_gap: -15, remark: 'seed: invalid stock' });
  runValidationForSeed_(s4.submissionId, s4.store);

  // 5) Late submission: device timestamp far earlier than server timestamp.
  var s5 = makeSubmission(stores[1], TASK_CODES.STOCK_TAKING, { device_timestamp: yStr + ' 09:20', server_timestamp: yStr + ' 23:55' });
  appendRow_(SHEETS.STOCK_TAKING, { stock_id: newId_(), submission_id: s5.submissionId, product_id: products[0], physical_stock: 30, system_stock: 31, stock_gap: -1, remark: '' });
  runValidationForSeed_(s5.submissionId, s5.store);
}
