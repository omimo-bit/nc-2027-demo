/**
 * SubmissionService.gs
 * SUBMISSIONS is the generic, immutable transaction header (PRD Production
 * §5.5 / ERD Production §3). Task-specific data always goes to its own
 * detail table. Never branch the submission lifecycle per task type here —
 * add a new detail table instead (ERD Production §5 extension rule).
 */

function _createSubmission_(visitTaskId, taskCode, userId, storeId, lat, lng, idempotencyKey) {
  var visitTask = findById_(SHEETS.VISIT_TASKS, 'visit_task_id', visitTaskId);
  if (!visitTask) throw new Error('Visit task not found: ' + visitTaskId);

  var submissionId = newId_();
  var now = nowIso_();
  appendRow_(SHEETS.SUBMISSIONS, {
    submission_id: submissionId, visit_id: visitTask.visit_id, visit_task_id: visitTaskId, task_code: taskCode,
    user_id: userId, store_id: storeId, device_timestamp: now, server_timestamp: now,
    latitude: lat, longitude: lng, sync_source: 'ONLINE', submission_status: SUBMISSION_STATUS.SUBMITTED,
    validation_status: VALIDATION_STATUS.PENDING, idempotency_key: idempotencyKey || newId_(), version: 1,
    created_at: now, updated_at: now
  });
  updateById_(SHEETS.VISIT_TASKS, 'visit_task_id', visitTaskId, { status: 'COMPLETED', completed_at: now, started_at: visitTask.started_at || now });
  return submissionId;
}

function submitStock(payload) {
  var p = payload || {};
  if (!p.visit_task_id || !p.lines || !p.lines.length) return fail_('VALIDATION_ERROR', 'visit_task_id and at least one stock line are required.');

  var submissionId = _createSubmission_(p.visit_task_id, TASK_CODES.STOCK_TAKING, p.user_id, p.store_id, p.latitude, p.longitude, p.idempotency_key);
  p.lines.forEach(function (line) {
    appendRow_(SHEETS.STOCK_TAKING, {
      stock_id: newId_(), submission_id: submissionId, product_id: line.product_id,
      physical_stock: line.physical_stock, system_stock: line.system_stock || 0,
      stock_gap: (Number(line.physical_stock) || 0) - (Number(line.system_stock) || 0), remark: line.remark || ''
    });
  });
  var status = runValidation_(submissionId);
  return ok_({ submission_id: submissionId, validation_status: status });
}

function submitOfftake(payload) {
  var p = payload || {};
  if (!p.visit_task_id || !p.lines || !p.lines.length) return fail_('VALIDATION_ERROR', 'visit_task_id and at least one offtake line are required.');

  var submissionId = _createSubmission_(p.visit_task_id, TASK_CODES.OFFTAKE, p.user_id, p.store_id, p.latitude, p.longitude, p.idempotency_key);
  p.lines.forEach(function (line) {
    appendRow_(SHEETS.OFFTAKE, {
      offtake_id: newId_(), submission_id: submissionId, product_id: line.product_id, quantity: line.quantity,
      period_type: line.period_type || 'DAILY', period_start: line.period_start || '', period_end: line.period_end || '', remark: line.remark || ''
    });
  });
  var status = runValidation_(submissionId);
  return ok_({ submission_id: submissionId, validation_status: status });
}

/**
 * Evidence upload: expects base64 photo data. Stored in Google Drive per
 * PRD Demo §10; only metadata/URL is stored in the sheet (mirrors the
 * production rule that the DB never stores blobs — DRD Production §1.6).
 */
function submitStoreEvidence(payload) {
  var p = payload || {};
  if (!p.visit_task_id || !p.file_base64) return fail_('VALIDATION_ERROR', 'visit_task_id and file_base64 are required.');

  var submissionId = _createSubmission_(p.visit_task_id, TASK_CODES.STORE_EVIDENCE, p.user_id, p.store_id, p.latitude, p.longitude, p.idempotency_key);

  var folder = DriveApp.getFolderById(EVIDENCE_DRIVE_FOLDER_ID);
  var blob = Utilities.newBlob(Utilities.base64Decode(p.file_base64), p.mime_type || 'image/jpeg', (p.file_name || 'evidence') + '.jpg');
  var file = folder.createFile(blob);

  appendRow_(SHEETS.EVIDENCE, {
    evidence_id: newId_(), submission_id: submissionId, evidence_type: p.evidence_type || 'STORE_PHOTO',
    drive_file_id: file.getId(), file_url: file.getUrl(), file_name: file.getName(), mime_type: blob.getContentType(),
    file_size: blob.getBytes().length, captured_at: nowIso_(), uploaded_at: nowIso_(), uploaded_by: p.user_id,
    latitude: p.latitude, longitude: p.longitude
  });

  var status = runValidation_(submissionId);
  return ok_({ submission_id: submissionId, validation_status: status, file_url: file.getUrl() });
}
