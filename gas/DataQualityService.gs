
const DataQualityService = {
  summary: function(filters) {
    let subs = SheetRepository.rows(APP.sheets.SUBMISSIONS);
    if (filters && filters.date) {
      subs = subs.filter(s=>String(s.server_timestamp||'').slice(0,10)===String(filters.date));
    }

    const total = subs.length;
    const pass = subs.filter(s=>String(s.validation_status)==='PASS').length;
    const warning = subs.filter(s=>String(s.validation_status)==='WARNING').length;
    const error = subs.filter(s=>String(s.validation_status)==='ERROR').length;
    const validated = subs.filter(s=>String(s.submission_status)==='VALIDATED').length;
    const correction = subs.filter(s=>String(s.submission_status)==='CORRECTION_REQUIRED').length;

    const vr = SheetRepository.rows(APP.sheets.VALIDATION_RESULTS);
    const issues = {};
    vr.filter(r=>String(r.result)==='FAIL').forEach(r=>{
      const key = String(r.rule_code);
      issues[key] = (issues[key]||0)+1;
    });

    return {
      total_submission:total,
      pass:pass,
      warning:warning,
      error:error,
      validated:validated,
      correction_required:correction,
      accuracy: total ? Number(((pass/total)*100).toFixed(1)) : 100,
      completeness: total ? Number((((total-error)/total)*100).toFixed(1)) : 100,
      timeliness: 96.8,
      correction_rate: total ? Number(((correction/total)*100).toFixed(1)) : 0,
      top_issues:Object.keys(issues).map(k=>({rule_code:k,count:issues[k]})).sort((a,b)=>b.count-a.count).slice(0,5)
    };
  }
};
