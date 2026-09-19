/**
 * VisitService.gs
 * PJP_VISITS (plan) -> STORE_VISITS (actual execution) -> VISIT_TASKS (instances).
 */

function checkIn(payload) {
  var pjpVisitId = payload && payload.pjp_visit_id;
  var lat = payload && payload.latitude;
  var lng = payload && payload.longitude;
  if (!pjpVisitId || lat === undefined || lng === undefined) {
    return fail_('VALIDATION_ERROR', 'pjp_visit_id, latitude, and longitude are required.');
  }

  var pjpVisit = findById_(SHEETS.PJP_VISITS, 'pjp_visit_id', pjpVisitId);
  if (!pjpVisit) return fail_('NOT_FOUND', 'PJP visit not found.');
  var store = findById_(SHEETS.STORES, 'store_id', pjpVisit.store_id);
  var dist = distanceMeters_(Number(store.latitude), Number(store.longitude), Number(lat), Number(lng));

  var visitId = newId_();
  var now = nowIso_();
  appendRow_(SHEETS.STORE_VISITS, {
    visit_id: visitId, pjp_visit_id: pjpVisitId, nc_id: pjpVisit.nc_id, store_id: pjpVisit.store_id,
    visit_date: pjpVisit.visit_date, check_in_at: now, check_in_lat: lat, check_in_long: lng, check_in_distance: dist,
    check_out_at: '', check_out_lat: '', check_out_long: '', check_out_distance: '',
    visit_status: VISIT_STATUS.IN_PROGRESS, completion_percentage: 0, created_at: now, updated_at: now
  });
  updateById_(SHEETS.PJP_VISITS, 'pjp_visit_id', pjpVisitId, { status: VISIT_STATUS.IN_PROGRESS });

  // Instantiate visit tasks from active task definitions.
  var taskDefs = findAllWhere_(SHEETS.TASK_DEFINITIONS, function (t) { return t.status === 'ACTIVE'; });
  taskDefs.forEach(function (td) {
    appendRow_(SHEETS.VISIT_TASKS, {
      visit_task_id: newId_(), visit_id: visitId, task_id: td.task_id, task_code: td.task_code,
      status: td.task_code === TASK_CODES.CHECK_IN ? 'COMPLETED' : 'PENDING',
      started_at: td.task_code === TASK_CODES.CHECK_IN ? now : '',
      completed_at: td.task_code === TASK_CODES.CHECK_IN ? now : '',
      validation_status: VALIDATION_STATUS.PENDING
    });
  });

  writeAudit_(pjpVisit.nc_id, 'CHECK_IN', 'store_visits', visitId, null, { distance_m: dist }, 'DEMO_APP');

  return ok_({ visit_id: visitId, distance_m: dist, gps_pass_radius_m: Number(getConfigValue_('GPS_PASS_RADIUS_M', DEMO_CONFIG_DEFAULTS.GPS_PASS_RADIUS_M)) });
}

function getVisitTasks(payload) {
  var visitId = payload && payload.visit_id;
  var tasks = findAllWhere_(SHEETS.VISIT_TASKS, function (t) { return t.visit_id === visitId; });
  return ok_(tasks);
}

function completeVisit(payload) {
  var visitId = payload && payload.visit_id;
  var lat = payload && payload.latitude;
  var lng = payload && payload.longitude;
  var visit = findById_(SHEETS.STORE_VISITS, 'visit_id', visitId);
  if (!visit) return fail_('NOT_FOUND', 'Visit not found.');

  var tasks = findAllWhere_(SHEETS.VISIT_TASKS, function (t) { return t.visit_id === visitId; });
  var completed = tasks.filter(function (t) { return t.status === 'COMPLETED'; }).length;
  var pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  var store = findById_(SHEETS.STORES, 'store_id', visit.store_id);
  var dist = lat !== undefined ? distanceMeters_(Number(store.latitude), Number(store.longitude), Number(lat), Number(lng)) : '';

  var status = pct === 100 ? VISIT_STATUS.COMPLETED : VISIT_STATUS.COMPLETED; // demo: any explicit "complete" tap finalizes the visit
  updateById_(SHEETS.STORE_VISITS, 'visit_id', visitId, {
    check_out_at: nowIso_(), check_out_lat: lat || '', check_out_long: lng || '', check_out_distance: dist,
    visit_status: status, completion_percentage: pct, updated_at: nowIso_()
  });
  updateById_(SHEETS.PJP_VISITS, 'pjp_visit_id', visit.pjp_visit_id, { status: status });

  return ok_({ visit_id: visitId, completion_percentage: pct, visit_status: status });
}
