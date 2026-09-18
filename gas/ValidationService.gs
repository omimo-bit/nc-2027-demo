
const ValidationService = {
  validateStock: function(submission, detail, hasEvidence) {
    const out = [];
    this.push_(out, submission.submission_id, 'STOCK_NON_NEGATIVE', 'ERROR',
      Number(detail.physical_stock) >= 0, '>=0', detail.physical_stock,
      'Physical stock cannot be negative');
    this.push_(out, submission.submission_id, 'EVIDENCE_REQUIRED', 'ERROR',
      !!hasEvidence, 'PHOTO', hasEvidence ? 'AVAILABLE':'MISSING',
      'Required photo evidence missing');
    return this.saveAndSummarize_(out);
  },

  validateOfftake: function(submission, detail, hasEvidence) {
    const out = [];
    this.push_(out, submission.submission_id, 'OFFTAKE_NON_NEGATIVE', 'ERROR',
      Number(detail.quantity) >= 0, '>=0', detail.quantity,
      'Offtake quantity cannot be negative');
    this.push_(out, submission.submission_id, 'EVIDENCE_REQUIRED', 'ERROR',
      !!hasEvidence, 'PHOTO', hasEvidence ? 'AVAILABLE':'MISSING',
      'Required photo evidence missing');
    return this.saveAndSummarize_(out);
  },

  push_: function(arr, sid, rule, severity, pass, expected, actual, msg) {
    arr.push({
      validation_id:Utilities.getUuid(),
      submission_id:sid,
      rule_code:rule,
      severity:severity,
      result:pass ? 'PASS':'FAIL',
      expected_value:String(expected),
      actual_value:String(actual),
      message:pass ? 'OK' : msg,
      validated_at:nowIso_()
    });
  },

  saveAndSummarize_: function(rows) {
    rows.forEach(r => SheetRepository.insert(APP.sheets.VALIDATION_RESULTS,r));
    const hasError = rows.some(r => r.result === 'FAIL' && r.severity === 'ERROR');
    const hasWarning = rows.some(r => r.result === 'FAIL' && r.severity === 'WARNING');
    return hasError ? 'ERROR' : (hasWarning ? 'WARNING' : 'PASS');
  }
};
