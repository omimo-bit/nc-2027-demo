
const ControlCenterService = {
  list: function(params) {
    const users = SheetRepository.rows(APP.sheets.USERS); const um={}; users.forEach(u=>um[String(u.user_id)]=u);
    const stores = SheetRepository.rows(APP.sheets.STORES); const sm={}; stores.forEach(s=>sm[String(s.store_id)]=s);
    const validations = SheetRepository.rows(APP.sheets.VALIDATION_RESULTS);
    const issueMap={};
    validations.filter(v=>String(v.result)==='FAIL').forEach(v=>{
      if(!issueMap[String(v.submission_id)]) issueMap[String(v.submission_id)]=[];
      issueMap[String(v.submission_id)].push(v.rule_code);
    });

    let subs = SheetRepository.rows(APP.sheets.SUBMISSIONS);
    if (params && params.status && params.status !== 'ALL') {
      subs = subs.filter(s=>String(s.validation_status)===String(params.status));
    }
    const rows = subs.map(s=>({
      submission_id:s.submission_id,
      time:String(s.server_timestamp||'').slice(11,16),
      nc_name:(um[String(s.user_id)]||{}).full_name || s.user_id,
      store_name:(sm[String(s.store_id)]||{}).store_name || s.store_id,
      task_code:s.task_code,
      validation_status:s.validation_status,
      submission_status:s.submission_status,
      issues:issueMap[String(s.submission_id)] || []
    })).sort((a,b)=>String(b.time).localeCompare(String(a.time)));

    const q = DataQualityService.summary({});
    return {summary:{total:q.total_submission,pass:q.pass,warning:q.warning,error:q.error},rows:rows};
  },

  detail: function(submissionId) {
    const sub = SheetRepository.findOne(APP.sheets.SUBMISSIONS,{submission_id:submissionId});
    if (!sub) throw {code:'NOT_FOUND',message:'Submission not found'};
    const user = SheetRepository.findOne(APP.sheets.USERS,{user_id:sub.user_id}) || {};
    const store = SheetRepository.findOne(APP.sheets.STORES,{store_id:sub.store_id}) || {};
    let detail = {};
    if (String(sub.task_code)==='STOCK_TAKING') detail = SheetRepository.findOne(APP.sheets.STOCK_TAKING,{submission_id:submissionId}) || {};
    if (String(sub.task_code)==='OFFTAKE') detail = SheetRepository.findOne(APP.sheets.OFFTAKE,{submission_id:submissionId}) || {};
    return {
      submission:sub,
      user:{user_id:user.user_id,full_name:user.full_name},
      store:{store_id:store.store_id,store_name:store.store_name},
      detail:detail,
      evidence:SheetRepository.findMany(APP.sheets.EVIDENCE,{submission_id:submissionId}),
      validation_results:SheetRepository.findMany(APP.sheets.VALIDATION_RESULTS,{submission_id:submissionId}),
      corrections:SheetRepository.findMany(APP.sheets.CORRECTIONS,{submission_id:submissionId}),
      audit:SheetRepository.findMany(APP.sheets.AUDIT_LOGS,{entity_id:submissionId})
    };
  },

  approve: function(session, submissionId) {
    const sub = SheetRepository.findOne(APP.sheets.SUBMISSIONS,{submission_id:submissionId});
    if (!sub) throw {code:'NOT_FOUND',message:'Submission not found'};
    SheetRepository.update(APP.sheets.SUBMISSIONS,'submission_id',submissionId,{
      submission_status:'VALIDATED',
      validation_status:'PASS',
      updated_at:nowIso_()
    });
    AuditService.log(session.user_id,'VALIDATE','SUBMISSION',submissionId,sub,{submission_status:'VALIDATED',validation_status:'PASS'});
    return {submission_id:submissionId,status:'VALIDATED'};
  }
};
