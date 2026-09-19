/**
 * ValidationService.gs
 * Implements the demo validation rules from 05_DRD_DEMO.md §4:
 *   stock non-negative, offtake non-negative, evidence required,
 *   GPS radius, duplicate/idempotency concept.
 * Operational result: PASS / WARNING / ERROR (REJECTED reserved for
 * production-only hard rejects, not used by the demo engine).
 *
 * Data Entry works exception-first (PRD Production §5.7 / DRD Demo §7):
 * PASS submissions never need a human to look at them; only
 * WARNING/ERROR land in the Control Center queue.
 */

function runValidationForSeed_(submissionId, store) {
  return runValidation_(submissionId, store);
}

/**
 * Evaluates every applicable rule for a submission and persists the
 * results. Returns the overall status: PASS | WARNING | ERROR.
 */
function runValidation_(submissionId, storeHint) {
  var submission = findById_(SHEETS.SUBMISSIONS, 'submission_id', submissionId);
  if (!submission) throw new Error('Submission not found: ' + submissionId);

  var store = storeHint || findById_(SHEETS.STORES, 'store_id', submission.store_id);
  var results = []; // { rule_code, severity, result, expected_value, actual_value, message }

  function record(ruleCode, severity, result, expected, actual, message) {
    results.push({ rule_code: ruleCode, severity: severity, result: result, expected_value: expected, actual_value: actual, message: message });
  }

  // --- GPS distance --------------------------------------------------
  if (store && submission.latitude !== '' && submission.longitude !== '') {
    var dist = distanceMeters_(Number(store.latitude), Number(store.longitude), Number(submission.latitude), Number(submission.longitude));
    var passRadius = Number(getConfigValue_('GPS_PASS_RADIUS_M', DEMO_CONFIG_DEFAULTS.GPS_PASS_RADIUS_M));
    var warnRadius = Number(getConfigValue_('GPS_WARNING_RADIUS_M', DEMO_CONFIG_DEFAULTS.GPS_WARNING_RADIUS_M));
    if (dist === null) {
      record('GPS_DISTANCE', 'WARNING', 'WARNING', '<= ' + passRadius + 'm', 'unknown', 'GPS coordinates missing.');
    } else if (dist <= passRadius) {
      record('GPS_DISTANCE', 'INFO', 'PASS', '<= ' + passRadius + 'm', dist + 'm', '');
    } else if (dist <= warnRadius) {
      record('GPS_DISTANCE', 'WARNING', 'WARNING', '<= ' + passRadius + 'm', dist + 'm', 'Check-in distance exceeds pass radius but within warning band.');
    } else {
      record('GPS_DISTANCE', 'ERROR', 'ERROR', '<= ' + warnRadius + 'm', dist + 'm', 'Check-in distance exceeds warning radius.');
    }
  }

  // --- Task-specific detail rules ------------------------------------
  if (submission.task_code === TASK_CODES.STOCK_TAKING) {
    var stock = findAllWhere_(SHEETS.STOCK_TAKING, function (r) { return r.submission_id === submissionId; });
    stock.forEach(function (row) {
      if (Number(row.physical_stock) < 0) {
        record('STOCK_NON_NEGATIVE', 'ERROR', 'ERROR', '>= 0', row.physical_stock, 'Physical stock cannot be negative.');
      } else {
        record('STOCK_NON_NEGATIVE', 'INFO', 'PASS', '>= 0', row.physical_stock, '');
      }
    });
    if (stock.length === 0) {
      record('STOCK_REQUIRED', 'ERROR', 'ERROR', '>= 1 line', 0, 'No stock taking lines submitted.');
    }
  }

  if (submission.task_code === TASK_CODES.OFFTAKE) {
    var offtake = findAllWhere_(SHEETS.OFFTAKE, function (r) { return r.submission_id === submissionId; });
    offtake.forEach(function (row) {
      if (Number(row.quantity) < 0) {
        record('OFFTAKE_NON_NEGATIVE', 'ERROR', 'ERROR', '>= 0', row.quantity, 'Offtake quantity cannot be negative.');
      } else {
        record('OFFTAKE_NON_NEGATIVE', 'INFO', 'PASS', '>= 0', row.quantity, '');
      }
    });
  }

  if (submission.task_code === TASK_CODES.STORE_EVIDENCE) {
    var evidence = findAllWhere_(SHEETS.EVIDENCE, function (r) { return r.submission_id === submissionId; });
    if (evidence.length === 0) {
      record('EVIDENCE_REQUIRED', 'ERROR', 'ERROR', '>= 1 photo', 0, 'Store evidence task requires at least one photo.');
    } else {
      record('EVIDENCE_REQUIRED', 'INFO', 'PASS', '>= 1 photo', evidence.length, '');
    }
  }

  // --- Duplicate / idempotency ----------------------------------------
  var siblings = findAllWhere_(SHEETS.SUBMISSIONS, function (r) {
    return r.idempotency_key === submission.idempotency_key && r.submission_id !== submissionId;
  });
  if (siblings.length > 0) {
    record('DUPLICATE_IDEMPOTENCY', 'WARNING', 'WARNING', '1 submission per idempotency_key', siblings.length + 1, 'Another submission shares the same idempotency key.');
  }

  // --- Late submission (device vs server timestamp gap) ---------------
  if (submission.device_timestamp && submission.server_timestamp) {
    var deviceTime = new Date(String(submission.device_timestamp).replace(' ', 'T'));
    var serverTime = new Date(String(submission.server_timestamp).replace(' ', 'T'));
    var gapHours = (serverTime - deviceTime) / (1000 * 60 * 60);
    if (gapHours > 6) {
      record('LATE_SUBMISSION', 'WARNING', 'WARNING', '<= 6h gap', Math.round(gapHours) + 'h', 'Submission synced long after it was captured on device.');
    }
  }

  if (results.length === 0) {
    record('NO_RULES_APPLICABLE', 'INFO', 'PASS', '-', '-', 'No task-specific rules matched; treated as pass.');
  }

  // --- Persist validation_results, roll up overall status --------------
  var overall = VALIDATION_STATUS.PASS;
  results.forEach(function (r) {
    appendRow_(SHEETS.VALIDATION_RESULTS, {
      validation_id: newId_(), submission_id: submissionId, rule_code: r.rule_code, severity: r.severity,
      result: r.result, expected_value: r.expected_value, actual_value: r.actual_value, message: r.message, validated_at: nowIso_()
    });
    if (r.result === 'ERROR' && overall !== VALIDATION_STATUS.ERROR) overall = VALIDATION_STATUS.ERROR;
    if (r.result === 'WARNING' && overall === VALIDATION_STATUS.PASS) overall = VALIDATION_STATUS.WARNING;
  });

  var newSubmissionStatus = overall === VALIDATION_STATUS.PASS ? SUBMISSION_STATUS.VALIDATED : SUBMISSION_STATUS.UNDER_REVIEW;
  updateById_(SHEETS.SUBMISSIONS, 'submission_id', submissionId, { validation_status: overall, submission_status: newSubmissionStatus, updated_at: nowIso_() });
  updateById_(SHEETS.VISIT_TASKS, 'visit_task_id', submission.visit_task_id, { validation_status: overall });

  return overall;
}

function getConfigValue_(key, fallback) {
  var row = findById_(SHEETS.SYSTEM_CONFIG, 'config_key', key);
  return row ? row.config_value : fallback;
}
