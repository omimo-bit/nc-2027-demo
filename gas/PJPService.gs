
const PJPService = {
  getToday: function(userId, dateString) {
    const rows = SheetRepository.findMany(APP.sheets.PJP_VISITS, {
      nc_id: userId,
      visit_date: dateString
    });

    const stores = SheetRepository.rows(APP.sheets.STORES);
    const storeMap = {};
    stores.forEach(function(s) { storeMap[String(s.store_id)] = s; });

    const visits = rows
      .sort(function(a,b){ return Number(a.sequence) - Number(b.sequence); })
      .map(function(v) {
        const s = storeMap[String(v.store_id)] || {};
        return {
          pjp_visit_id: v.pjp_visit_id,
          store_id: v.store_id,
          store_name: s.store_name || v.store_id,
          address: s.address || '',
          planned_start: v.planned_start,
          planned_end: v.planned_end,
          sequence: v.sequence,
          status: v.status
        };
      });

    return {
      date: dateString,
      summary: {
        planned: visits.length,
        completed: visits.filter(function(v){ return String(v.status) === 'COMPLETED'; }).length
      },
      visits: visits
    };
  }
};
