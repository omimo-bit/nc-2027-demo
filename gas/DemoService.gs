
const DemoService = {
  seed: function(session) {
    if (!APP.demoMode) throw {code:'FORBIDDEN',message:'Demo mode disabled'};
    const today = '2026-09-18T10:00:00+07:00';
    const samples = [
      {id:'SUB-SEED-001',task:'STOCK_TAKING',user:'USR001',store:'STR001',status:'WARNING'},
      {id:'SUB-SEED-002',task:'STOCK_TAKING',user:'USR001',store:'STR002',status:'ERROR'},
      {id:'SUB-SEED-003',task:'OFFTAKE',user:'USR001',store:'STR003',status:'ERROR'},
      {id:'SUB-SEED-004',task:'OFFTAKE',user:'USR001',store:'STR001',status:'WARNING'},
      {id:'SUB-SEED-005',task:'STOCK_TAKING',user:'USR001',store:'STR002',status:'PASS'}
    ];
    samples.forEach((s,i)=>{
      if (!SheetRepository.findOne(APP.sheets.SUBMISSIONS,{submission_id:s.id})) {
        SheetRepository.insert(APP.sheets.SUBMISSIONS,{
          submission_id:s.id,visit_id:'VIS-SEED-'+i,visit_task_id:'VT-SEED-'+i,task_code:s.task,
          user_id:s.user,store_id:s.store,device_timestamp:today,server_timestamp:today,
          latitude:'',longitude:'',sync_source:'SEED',submission_status:'SUBMITTED',
          validation_status:s.status,idempotency_key:'SEED-'+i,version:1,created_at:today,updated_at:today
        });
      }
    });
    AuditService.log(session.user_id,'SEED_DEMO','SYSTEM','DEMO',{}, {count:samples.length});
    return {seeded:samples.length};
  },

  reset: function(session) {
    if (!APP.demoMode) throw {code:'FORBIDDEN',message:'Demo mode disabled'};

    // Transactional demo tables only; master data is preserved.
    const transactional = [
      APP.sheets.STORE_VISITS,
      APP.sheets.VISIT_TASKS,
      APP.sheets.SUBMISSIONS,
      APP.sheets.STOCK_TAKING,
      APP.sheets.OFFTAKE,
      APP.sheets.EVIDENCE,
      APP.sheets.VALIDATION_RESULTS,
      APP.sheets.CORRECTIONS,
      APP.sheets.AUDIT_LOGS
    ];

    transactional.forEach(function(sheetName) {
      SheetRepository.deleteWhere(sheetName, function(row) {
        // Keep no transactional rows; demo seed can be restored with Seed Demo.
        return true;
      });
    });

    // Reset PJP visit statuses.
    SheetRepository.rows(APP.sheets.PJP_VISITS).forEach(function(v) {
      SheetRepository.update(APP.sheets.PJP_VISITS,'pjp_visit_id',v.pjp_visit_id,{status:'PLANNED'});
    });

    AuditService.log(session.user_id,'RESET_DEMO','SYSTEM','DEMO',{}, {reset_at:nowIso_()});
    return {reset:true};
  }

};
