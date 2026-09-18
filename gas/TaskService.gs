
const TaskService = {
  createVisitTasks: function(visitId) {
    const defs = SheetRepository.rows(APP.sheets.TASK_DEFINITIONS)
      .filter(d => String(d.status) === 'ACTIVE' && String(d.task_code) !== 'CHECK_IN');
    defs.forEach(d => {
      const exists = SheetRepository.findOne(APP.sheets.VISIT_TASKS,{
        visit_id:visitId, task_code:d.task_code
      });
      if (!exists) {
        SheetRepository.insert(APP.sheets.VISIT_TASKS,{
          visit_task_id:Utilities.getUuid(),
          visit_id:visitId,
          task_id:d.task_id,
          task_code:d.task_code,
          status:'PENDING',
          started_at:'',
          completed_at:'',
          validation_status:'PENDING'
        });
      }
    });
  },

  getVisitTasks: function(visitId) {
    const defs = SheetRepository.rows(APP.sheets.TASK_DEFINITIONS);
    const map = {};
    defs.forEach(d => map[String(d.task_code)] = d);
    return SheetRepository.findMany(APP.sheets.VISIT_TASKS,{visit_id:visitId})
      .sort((a,b) => Number((map[a.task_code]||{}).sequence||99)-Number((map[b.task_code]||{}).sequence||99))
      .map(t => Object.assign({}, t, {
        task_name:(map[t.task_code]||{}).task_name || t.task_code,
        required:(map[t.task_code]||{}).required,
        requires_photo:(map[t.task_code]||{}).requires_photo
      }));
  },

  markSubmitted: function(visitTaskId, validationStatus) {
    SheetRepository.update(APP.sheets.VISIT_TASKS,'visit_task_id',visitTaskId,{
      status:'SUBMITTED',
      completed_at:nowIso_(),
      validation_status:validationStatus
    });
  }
};
