
const CorrectionService = {
  create: function(session, payload) {
    ['submission_id','reason_code','reason_text'].forEach(k=>{
      if (!payload[k]) throw {code:'INVALID_REQUEST',message:'Missing field: '+k};
    });

    const sub = SheetRepository.findOne(APP.sheets.SUBMISSIONS,{submission_id:payload.submission_id});
    if (!sub) throw {code:'NOT_FOUND',message:'Submission not found'};

    const rec = {
      correction_id:Utilities.getUuid(),
      submission_id:payload.submission_id,
      requested_by:session.user_id,
      requested_at:nowIso_(),
      reason_code:payload.reason_code,
      reason_text:payload.reason_text,
      status:'OPEN',
      assigned_to:sub.user_id,
      resolved_at:'',
      resolution_note:''
    };
    SheetRepository.insert(APP.sheets.CORRECTIONS,rec);
    SheetRepository.update(APP.sheets.SUBMISSIONS,'submission_id',payload.submission_id,{
      submission_status:'CORRECTION_REQUIRED',
      updated_at:nowIso_()
    });
    AuditService.log(session.user_id,'CORRECTION_REQUEST','SUBMISSION',payload.submission_id,{},rec);
    return rec;
  },

  listForUser: function(userId) {
    const subs = SheetRepository.rows(APP.sheets.SUBMISSIONS)
      .filter(s=>String(s.user_id)===String(userId));
    const allowed = {};
    subs.forEach(s=>allowed[String(s.submission_id)] = true);
    return SheetRepository.rows(APP.sheets.CORRECTIONS)
      .filter(c=>allowed[String(c.submission_id)] && String(c.status)==='OPEN');
  },

  resolve: function(session, payload) {
    const rec = SheetRepository.findOne(APP.sheets.CORRECTIONS,{correction_id:payload.correction_id});
    if (!rec) throw {code:'NOT_FOUND',message:'Correction not found'};
    SheetRepository.update(APP.sheets.CORRECTIONS,'correction_id',payload.correction_id,{
      status:'CORRECTED',
      resolved_at:nowIso_(),
      resolution_note:payload.resolution_note || ''
    });
    SheetRepository.update(APP.sheets.SUBMISSIONS,'submission_id',rec.submission_id,{
      submission_status:'UNDER_REVIEW',
      version:Number(SheetRepository.findOne(APP.sheets.SUBMISSIONS,{submission_id:rec.submission_id}).version||1)+1,
      updated_at:nowIso_()
    });
    AuditService.log(session.user_id,'RESUBMIT_CORRECTION','SUBMISSION',rec.submission_id,{},payload);
    return {submission_id:rec.submission_id,status:'UNDER_REVIEW'};
  }
};
