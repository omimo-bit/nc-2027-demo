
const MasterService = {
  getStore: function(storeId) {
    const s = SheetRepository.findOne(APP.sheets.STORES, { store_id: storeId });
    if (!s) throw { code: 'NOT_FOUND', message: 'Store not found' };
    return s;
  },

  getProducts: function() {
    return SheetRepository.rows(APP.sheets.PRODUCTS)
      .filter(function(p){ return String(p.status) === 'ACTIVE'; })
      .map(function(p){
        return {
          product_id: p.product_id,
          sku_code: p.sku_code,
          brand: p.brand,
          product_name: p.product_name,
          size: p.size,
          uom: p.uom
        };
      });
  }
};
