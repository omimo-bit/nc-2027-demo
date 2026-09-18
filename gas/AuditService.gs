
const AuditService = {
  log: function(actorId, action, entityType, entityId, beforeData, afterData) {
    SheetRepository.insert(APP.sheets.AUDIT_LOGS,{
      audit_id:Utilities.getUuid(),
      actor_id:actorId,
      action:action,
      entity_type:entityType,
      entity_id:entityId,
      before_data:JSON.stringify(beforeData || {}),
      after_data:JSON.stringify(afterData || {}),
      timestamp:nowIso_(),
      source:'WEB'
    });
  }
};
