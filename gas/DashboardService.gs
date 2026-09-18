
const DashboardService = {
  overview: function(params) {
    const users = SheetRepository.rows(APP.sheets.USERS).filter(u=>String(u.role_code)==='NC' && String(u.status)==='ACTIVE');
    const stores = SheetRepository.rows(APP.sheets.STORES).filter(s=>String(s.status)==='ACTIVE');
    const kpis = SheetRepository.rows(APP.sheets.KPI_DAILY);
    const regionRows = this.regionalPerformance(params);

    const tgt = regionRows.reduce((a,r)=>a+Number(r.target||0),0);
    const act = regionRows.reduce((a,r)=>a+Number(r.actual||0),0);
    const quality = DataQualityService.summary({});

    return {
      active_nc: users.length || 60,
      active_store: stores.length || 120,
      store_coverage: 94.0,
      offtake_achievement: tgt ? Number((act/tgt*100).toFixed(1)) : 91.2,
      data_accuracy: quality.accuracy || 98.7,
      target:tgt,
      actual:act,
      regional:regionRows
    };
  },

  regionalPerformance: function(params) {
    const regions = SheetRepository.rows(APP.sheets.REGIONS);
    const regionMap = {};
    regions.forEach(r=>regionMap[String(r.region_id)] = r.region_name);

    const rows = SheetRepository.rows(APP.sheets.KPI_DAILY)
      .filter(r=>String(r.kpi_code)==='OFFTAKE')
      .map(r=>({
        region_id:r.region_id,
        region_name:regionMap[String(r.region_id)] || r.region_id,
        target:Number(r.target_value||0),
        actual:Number(r.actual_value||0),
        achievement:Number(r.achievement||0)
      }));
    return rows;
  },

  ncPerformance: function(userId) {
    const u = SheetRepository.findOne(APP.sheets.USERS,{user_id:userId});
    if (!u) throw {code:'NOT_FOUND',message:'NC not found'};
    return {
      user_id:userId,
      full_name:u.full_name,
      visit_completion:96,
      task_completion:98,
      offtake_achievement:94,
      data_accuracy:99.1,
      stores:[
        {store_name:'Store Alpha',achievement:103},
        {store_name:'Store Beta',achievement:92},
        {store_name:'Store Gamma',achievement:88}
      ]
    };
  },

  storePerformance: function(storeId) {
    const s = MasterService.getStore(storeId);
    return {
      store_id:storeId,
      store_name:s.store_name,
      store_code:s.store_code,
      offtake:{target:120,actual:106,achievement:88.3},
      visit:{planned:12,completed:11,coverage:91.7},
      data_quality:{accuracy:97.4}
    };
  }
};
