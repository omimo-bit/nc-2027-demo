
const SystemConfigService = {
  get: function(key, fallback) {
    const row = SheetRepository.findOne(APP.sheets.SYSTEM_CONFIG,{config_key:key});
    return row ? row.config_value : fallback;
  }
};
