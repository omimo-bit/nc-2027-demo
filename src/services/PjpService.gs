/**
 * PjpService.gs
 * Read-side services for the NC "today's journey" screen.
 */

function getTodayPJP(payload) {
  var userId = payload && payload.user_id;
  if (!userId) return fail_('VALIDATION_ERROR', 'user_id is required.');

  var todayStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
  var visits = findAllWhere_(SHEETS.PJP_VISITS, function (v) { return v.nc_id === userId && String(v.visit_date) === todayStr; });

  var enriched = visits
    .sort(function (a, b) { return Number(a.sequence) - Number(b.sequence); })
    .map(function (v) {
      var store = findById_(SHEETS.STORES, 'store_id', v.store_id);
      var actualVisit = findAllWhere_(SHEETS.STORE_VISITS, function (sv) { return sv.pjp_visit_id === v.pjp_visit_id; })[0] || null;
      return {
        pjp_visit_id: v.pjp_visit_id,
        sequence: v.sequence,
        planned_start: v.planned_start,
        planned_end: v.planned_end,
        status: actualVisit ? actualVisit.visit_status : v.status,
        store: store
      };
    });

  return ok_({ date: todayStr, visits: enriched });
}

function getStoreDetail(payload) {
  var storeId = payload && payload.store_id;
  var store = findById_(SHEETS.STORES, 'store_id', storeId);
  if (!store) return fail_('NOT_FOUND', 'Store not found.');
  return ok_(store);
}

function getProducts() {
  var products = findAllWhere_(SHEETS.PRODUCTS, function (p) { return p.status === 'ACTIVE'; });
  return ok_(products);
}
