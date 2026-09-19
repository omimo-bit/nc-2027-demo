/**
 * ControlCenterService.gs
 * Exception-first review (PRD Production §5.7 / DRD Demo §4 "Data Entry
 * UX"): default view is exceptions only, never a wall of every record.
 */

function getControlCenter() {
  var submissions = getAllRows_(SHEETS.SUBMISSIONS);
  var summary = { total: submissions.length, pass: 0, warning: 0, error: 0, correction: 0, validated: 0 };
  var exceptions = [];

  submissions.forEach(function (s) {
    if (s.validation_status === VALIDATION_STATUS.PASS) summary.pass++;
    if (s.validation_status === VALIDATION_STATUS.WARNING) summary.warning++;
    if (s.validation_status === VALIDATION_STATUS.ERROR) summary.error++;
    if (s.submission_status === SUBMISSION_STATUS.CORRECTION_REQUIRED) summary.correction++;
    if (s.submission_status === SUBMISSION_STATUS.VALIDATED) summary.validated++;

    if (s.validation_status === VALIDATION_STATUS.WARNING || s.validation_status === VALIDATION_STATUS.ERROR) {
      var store = findById_(SHEETS.STORES, 'store_id', s.store_id);
      var user = findById_(SHEETS.USERS, 'user_id', s.user_id);
      exceptions.push({
        submission_id: s.submission_id, task_code: s.task_code, validation_status: s.validation_status,
        submission_status: s.submission_status, store_name: store ? store.store_name : s.store_id,
        nc_name: user ? user.full_name : s.user_id, server_timestamp: s.server_timestamp
      });
    }
  });

  exceptions.sort(function (a, b) { return new Date(b.server_timestamp) - new Date(a.server_timestamp); });
  return ok_({ summary: summary, exceptions: exceptions });
}

function getSubmission(payload) {
  var submissionId = payload && payload.submission_id;
  var submission = findById_(SHEETS.SUBMISSIONS, 'submission_id', submissionId);
  if (!submission) return fail_('NOT_FOUND', 'Submission not found.');

  var detail = {};
  if (submission.task_code === TASK_CODES.STOCK_TAKING) detail = findAllWhere_(SHEETS.STOCK_TAKING, function (r) { return r.submission_id === submissionId; });
  if (submission.task_code === TASK_CODES.OFFTAKE) detail = findAllWhere_(SHEETS.OFFTAKE, function (r) { return r.submission_id === submissionId; });

  var evidence = findAllWhere_(SHEETS.EVIDENCE, function (r) { return r.submission_id === submissionId; });
  var validation = findAllWhere_(SHEETS.VALIDATION_RESULTS, function (r) { return r.submission_id === submissionId; });
  var corrections = findAllWhere_(SHEETS.CORRECTIONS, function (r) { return r.submission_id === submissionId; });
  var store = findById_(SHEETS.STORES, 'store_id', submission.store_id);
  var user = findById_(SHEETS.USERS, 'user_id', submission.user_id);

  return ok_({ submission: submission, store: store, user: user, detail: detail, evidence: evidence, validation_results: validation, corrections: corrections });
}

function approveSubmission(payload) {
  var submissionId = payload && payload.submission_id;
  var actorId = payload && payload.actor_id;
  var submission = findById_(SHEETS.SUBMISSIONS, 'submission_id', submissionId);
  if (!submission) return fail_('NOT_FOUND', 'Submission not found.');

  updateById_(SHEETS.SUBMISSIONS, 'submission_id', submissionId, { submission_status: SUBMISSION_STATUS.VALIDATED, updated_at: nowIso_() });
  writeAudit_(actorId, 'APPROVE_SUBMISSION', 'submissions', submissionId, { submission_status: submission.submission_status }, { submission_status: SUBMISSION_STATUS.VALIDATED }, 'DEMO_APP');
  return ok_({ submission_id: submissionId, submission_status: SUBMISSION_STATUS.VALIDATED });
}

/**
 * Requests a correction. Per PRD Production §5.8, the raw submission is
 * never overwritten — this creates a correction request record and moves
 * the submission into CORRECTION_REQUIRED; an accepted correction should
 * later increment `version` and log original/corrected values (full
 * approval workflow is a TBD extension beyond demo v1 scope).
 */
function requestCorrection(payload) {
  var p = payload || {};
  var submission = findById_(SHEETS.SUBMISSIONS, 'submission_id', p.submission_id);
  if (!submission) return fail_('NOT_FOUND', 'Submission not found.');

  var correctionId = newId_();
  appendRow_(SHEETS.CORRECTIONS, {
    correction_id: correctionId, submission_id: p.submission_id, requested_by: p.actor_id, requested_at: nowIso_(),
    reason_code: p.reason_code || 'OTHER', reason_text: p.reason_text || '', status: 'OPEN',
    assigned_to: p.assigned_to || '', resolved_at: '', resolution_note: ''
  });
  updateById_(SHEETS.SUBMISSIONS, 'submission_id', p.submission_id, { submission_status: SUBMISSION_STATUS.CORRECTION_REQUIRED, updated_at: nowIso_() });
  writeAudit_(p.actor_id, 'REQUEST_CORRECTION', 'submissions', p.submission_id, null, { reason_code: p.reason_code }, 'DEMO_APP');

  return ok_({ correction_id: correctionId, submission_status: SUBMISSION_STATUS.CORRECTION_REQUIRED });
}
