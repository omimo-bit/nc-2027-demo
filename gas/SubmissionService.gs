
const SubmissionService = {
  ensureUnique_: function(key) {
    const found = SheetRepository.findOne(APP.sheets.SUBMISSIONS,{idempotency_key:key});
    if (found) return found;
    return null;
  },

  createHeader_: function(session, payload, taskCode) {
    const dup = this.ensureUnique_(payload.idempotency_key);
    if (dup) return {duplicate:true, submission:dup};

    const now = nowIso_();
    const sub = {
      submission_id:Utilities.getUuid(),
      visit_id:payload.visit_id,
      visit_task_id:payload.visit_task_id,
      task_code:taskCode,
      user_id:session.user_id,
      store_id:payload.store_id,
      device_timestamp:payload.device_timestamp || now,
      server_timestamp:now,
      latitude:payload.latitude || '',
      longitude:payload.longitude || '',
      sync_source:payload.sync_source || 'ONLINE',
      submission_status:'SUBMITTED',
      validation_status:'PENDING',
      idempotency_key:payload.idempotency_key || Utilities.getUuid(),
      version:1,
      created_at:now,
      updated_at:now
    };
    SheetRepository.insert(APP.sheets.SUBMISSIONS,sub);
    return {duplicate:false, submission:sub};
  },

  submitStock: function(session, payload) {
    ['visit_id','visit_task_id','store_id','product_id','physical_stock'].forEach(k=>{
      if (payload[k] === undefined || payload[k] === '') throw {code:'INVALID_REQUEST',message:'Missing field: '+k};
    });
    const h = this.createHeader_(session,payload,'STOCK_TAKING');
    if (h.duplicate) return {submission_id:h.submission.submission_id, duplicate:true, validation_status:h.submission.validation_status};

    const detail = {
      stock_id:Utilities.getUuid(),
      submission_id:h.submission.submission_id,
      product_id:payload.product_id,
      physical_stock:Number(payload.physical_stock),
      system_stock:Number(payload.system_stock || 0),
      stock_gap:Number(payload.physical_stock)-Number(payload.system_stock || 0),
      remark:payload.remark || ''
    };
    SheetRepository.insert(APP.sheets.STOCK_TAKING,detail);
    const evidence = EvidenceService.saveBase64(session,h.submission.submission_id,payload.evidence);
    const status = ValidationService.validateStock(h.submission,detail,!!evidence);
    SheetRepository.update(APP.sheets.SUBMISSIONS,'submission_id',h.submission.submission_id,{
      validation_status:status, updated_at:nowIso_()
    });
    TaskService.markSubmitted(payload.visit_task_id,status);
    AuditService.log(session.user_id,'SUBMIT','SUBMISSION',h.submission.submission_id,{},detail);
    return {submission_id:h.submission.submission_id, stock_gap:detail.stock_gap, validation_status:status};
  },

  submitOfftake: function(session, payload) {
    ['visit_id','visit_task_id','store_id','product_id','quantity'].forEach(k=>{
      if (payload[k] === undefined || payload[k] === '') throw {code:'INVALID_REQUEST',message:'Missing field: '+k};
    });
    const h = this.createHeader_(session,payload,'OFFTAKE');
    if (h.duplicate) return {submission_id:h.submission.submission_id, duplicate:true, validation_status:h.submission.validation_status};

    const date = String(payload.period_start || nowIso_().slice(0,10));
    const detail = {
      offtake_id:Utilities.getUuid(),
      submission_id:h.submission.submission_id,
      product_id:payload.product_id,
      quantity:Number(payload.quantity),
      period_type:payload.period_type || 'DAILY',
      period_start:date,
      period_end:payload.period_end || date,
      remark:payload.remark || ''
    };
    SheetRepository.insert(APP.sheets.OFFTAKE,detail);
    const evidence = EvidenceService.saveBase64(session,h.submission.submission_id,payload.evidence);
    const status = ValidationService.validateOfftake(h.submission,detail,!!evidence);
    SheetRepository.update(APP.sheets.SUBMISSIONS,'submission_id',h.submission.submission_id,{
      validation_status:status, updated_at:nowIso_()
    });
    TaskService.markSubmitted(payload.visit_task_id,status);
    AuditService.log(session.user_id,'SUBMIT','SUBMISSION',h.submission.submission_id,{},detail);
    return {submission_id:h.submission.submission_id, validation_status:status};
  },

  submitStoreEvidence: function(session, payload) {
    ['visit_id','visit_task_id','store_id'].forEach(k=>{
      if (payload[k] === undefined || payload[k] === '') throw {code:'INVALID_REQUEST',message:'Missing field: '+k};
    });
    if (!payload.evidence || !payload.evidence.data_url) {
      throw {code:'VALIDATION_ERROR',message:'Store evidence photo is required'};
    }

    const h = this.createHeader_(session,payload,'STORE_EVIDENCE');
    if (h.duplicate) return {
      submission_id:h.submission.submission_id,
      duplicate:true,
      validation_status:h.submission.validation_status
    };

    const evidence = EvidenceService.saveBase64(session,h.submission.submission_id,payload.evidence);
    const status = evidence ? 'PASS' : 'ERROR';

    SheetRepository.insert(APP.sheets.VALIDATION_RESULTS,{
      validation_id:Utilities.getUuid(),
      submission_id:h.submission.submission_id,
      rule_code:'EVIDENCE_REQUIRED',
      severity:'ERROR',
      result:evidence ? 'PASS':'FAIL',
      expected_value:'PHOTO',
      actual_value:evidence ? 'AVAILABLE':'MISSING',
      message:evidence ? 'OK':'Required store evidence missing',
      validated_at:nowIso_()
    });

    SheetRepository.update(APP.sheets.SUBMISSIONS,'submission_id',h.submission.submission_id,{
      validation_status:status,
      updated_at:nowIso_()
    });
    TaskService.markSubmitted(payload.visit_task_id,status);
    AuditService.log(session.user_id,'SUBMIT','SUBMISSION',h.submission.submission_id,{},{
      evidence_id:evidence ? evidence.evidence_id : ''
    });
    return {submission_id:h.submission.submission_id,validation_status:status};
  }

};
