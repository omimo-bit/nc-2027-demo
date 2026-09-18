
const VisitService = {
  haversineMeters: function(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = d => d * Math.PI / 180;
    const p1 = toRad(Number(lat1));
    const p2 = toRad(Number(lat2));
    const dp = toRad(Number(lat2) - Number(lat1));
    const dl = toRad(Number(lon2) - Number(lon1));
    const a = Math.sin(dp/2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) ** 2;
    return Math.round(R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))));
  },

  checkIn: function(session, payload) {
    ['pjp_visit_id','store_id','latitude','longitude'].forEach(k => {
      if (payload[k] === undefined || payload[k] === '') {
        throw {code:'INVALID_REQUEST', message:'Missing field: '+k};
      }
    });

    const existing = SheetRepository.findOne(APP.sheets.STORE_VISITS, {
      pjp_visit_id: payload.pjp_visit_id,
      nc_id: session.user_id
    });
    if (existing) {
      return this.getVisit(existing.visit_id);
    }

    const store = MasterService.getStore(payload.store_id);
    const distance = this.haversineMeters(
      payload.latitude, payload.longitude,
      store.latitude, store.longitude
    );

    const passRadius = Number(SystemConfigService.get('GPS_PASS_RADIUS', store.gps_radius || 200));
    const warnRadius = Number(SystemConfigService.get('GPS_WARNING_RADIUS', 500));
    let gpsStatus = distance <= passRadius ? 'PASS' : (distance <= warnRadius ? 'WARNING' : 'ERROR');

    const now = nowIso_();
    const visit = {
      visit_id: Utilities.getUuid(),
      pjp_visit_id: payload.pjp_visit_id,
      nc_id: session.user_id,
      store_id: payload.store_id,
      visit_date: now.slice(0,10),
      check_in_at: payload.device_timestamp || now,
      check_in_lat: Number(payload.latitude),
      check_in_long: Number(payload.longitude),
      check_in_distance: distance,
      check_out_at: '',
      check_out_lat: '',
      check_out_long: '',
      check_out_distance: '',
      visit_status: 'IN_PROGRESS',
      completion_percentage: 25,
      created_at: now,
      updated_at: now
    };

    SheetRepository.insert(APP.sheets.STORE_VISITS, visit);
    TaskService.createVisitTasks(visit.visit_id);
    AuditService.log(session.user_id,'CHECK_IN','STORE_VISIT',visit.visit_id,{},visit);

    return {
      visit_id: visit.visit_id,
      distance: distance,
      gps_status: gpsStatus,
      visit_status: visit.visit_status
    };
  },

  getVisit: function(visitId) {
    const v = SheetRepository.findOne(APP.sheets.STORE_VISITS, {visit_id:visitId});
    if (!v) throw {code:'NOT_FOUND',message:'Visit not found'};
    return v;
  },

  summary: function(visitId) {
    const v = this.getVisit(visitId);
    return {
      visit: v,
      tasks: TaskService.getVisitTasks(visitId),
      submissions: SheetRepository.findMany(APP.sheets.SUBMISSIONS, {visit_id:visitId})
    };
  },

  complete: function(session, visitId) {
    const tasks = TaskService.getVisitTasks(visitId);
    const incomplete = tasks.filter(t => String(t.required) === 'true' || t.required === true)
      .filter(t => !['SUBMITTED','VALIDATED','COMPLETED'].includes(String(t.status)));
    if (incomplete.length) {
      throw {code:'TASK_INCOMPLETE',message:'Required tasks are incomplete'};
    }
    SheetRepository.update(APP.sheets.STORE_VISITS,'visit_id',visitId,{
      visit_status:'COMPLETED',
      completion_percentage:100,
      updated_at:nowIso_()
    });
    AuditService.log(session.user_id,'COMPLETE_VISIT','STORE_VISIT',visitId,{}, {visit_status:'COMPLETED'});
    return this.summary(visitId);
  }
};
