/**
 * Setup.gs
 * Run setupSheets() ONCE (from the Apps Script editor) against a fresh
 * Spreadsheet to create all 22 frozen demo tabs with correct headers,
 * exactly matching 05_DRD_DEMO.md §2–3. Safe to re-run: it will not
 * duplicate a tab that already exists, but it will not fix headers on an
 * existing tab either (delete the tab first if you need to reset its shape).
 */

var SHEET_HEADERS = {};
SHEET_HEADERS[SHEETS.USERS] = ['user_id', 'username', 'password_hash', 'full_name', 'role_code', 'phone', 'email', 'region_id', 'area_id', 'status', 'created_at', 'updated_at'];
SHEET_HEADERS[SHEETS.ROLES] = ['role_code', 'role_name', 'dashboard_route', 'can_field_input', 'can_validate', 'can_analyze', 'can_view_executive', 'status'];
SHEET_HEADERS[SHEETS.ASSIGNMENTS] = ['assignment_id', 'user_id', 'supervisor_id', 'region_id', 'area_id', 'effective_start', 'effective_end', 'status'];
SHEET_HEADERS[SHEETS.REGIONS] = ['region_id', 'code', 'name', 'status'];
SHEET_HEADERS[SHEETS.AREAS] = ['area_id', 'region_id', 'code', 'name', 'status'];
SHEET_HEADERS[SHEETS.STORES] = ['store_id', 'store_code', 'store_name', 'channel', 'region_id', 'area_id', 'address', 'city', 'latitude', 'longitude', 'gps_radius', 'status'];
SHEET_HEADERS[SHEETS.PRODUCTS] = ['product_id', 'sku_code', 'brand', 'product_name', 'size', 'uom', 'category', 'status'];
SHEET_HEADERS[SHEETS.PJP] = ['pjp_id', 'period', 'nc_id', 'status', 'created_by', 'created_at'];
SHEET_HEADERS[SHEETS.PJP_VISITS] = ['pjp_visit_id', 'pjp_id', 'visit_date', 'nc_id', 'store_id', 'sequence', 'planned_start', 'planned_end', 'status'];
SHEET_HEADERS[SHEETS.STORE_VISITS] = ['visit_id', 'pjp_visit_id', 'nc_id', 'store_id', 'visit_date', 'check_in_at', 'check_in_lat', 'check_in_long', 'check_in_distance', 'check_out_at', 'check_out_lat', 'check_out_long', 'check_out_distance', 'visit_status', 'completion_percentage', 'created_at', 'updated_at'];
SHEET_HEADERS[SHEETS.TASK_DEFINITIONS] = ['task_id', 'task_code', 'task_name', 'frequency', 'required', 'requires_photo', 'requires_gps', 'sequence', 'status'];
SHEET_HEADERS[SHEETS.VISIT_TASKS] = ['visit_task_id', 'visit_id', 'task_id', 'task_code', 'status', 'started_at', 'completed_at', 'validation_status'];
SHEET_HEADERS[SHEETS.SUBMISSIONS] = ['submission_id', 'visit_id', 'visit_task_id', 'task_code', 'user_id', 'store_id', 'device_timestamp', 'server_timestamp', 'latitude', 'longitude', 'sync_source', 'submission_status', 'validation_status', 'idempotency_key', 'version', 'created_at', 'updated_at'];
SHEET_HEADERS[SHEETS.STOCK_TAKING] = ['stock_id', 'submission_id', 'product_id', 'physical_stock', 'system_stock', 'stock_gap', 'remark'];
SHEET_HEADERS[SHEETS.OFFTAKE] = ['offtake_id', 'submission_id', 'product_id', 'quantity', 'period_type', 'period_start', 'period_end', 'remark'];
SHEET_HEADERS[SHEETS.EVIDENCE] = ['evidence_id', 'submission_id', 'evidence_type', 'drive_file_id', 'file_url', 'file_name', 'mime_type', 'file_size', 'captured_at', 'uploaded_at', 'uploaded_by', 'latitude', 'longitude'];
SHEET_HEADERS[SHEETS.VALIDATION_RESULTS] = ['validation_id', 'submission_id', 'rule_code', 'severity', 'result', 'expected_value', 'actual_value', 'message', 'validated_at'];
SHEET_HEADERS[SHEETS.CORRECTIONS] = ['correction_id', 'submission_id', 'requested_by', 'requested_at', 'reason_code', 'reason_text', 'status', 'assigned_to', 'resolved_at', 'resolution_note'];
SHEET_HEADERS[SHEETS.TARGETS] = ['target_id', 'period', 'kpi_code', 'target_level', 'region_id', 'area_id', 'user_id', 'store_id', 'target_value', 'version', 'status'];
SHEET_HEADERS[SHEETS.KPI_DAILY] = ['kpi_daily_id', 'date', 'region_id', 'area_id', 'user_id', 'store_id', 'kpi_code', 'target_value', 'actual_value', 'achievement', 'gap', 'calculated_at'];
SHEET_HEADERS[SHEETS.AUDIT_LOGS] = ['audit_id', 'actor_id', 'action', 'entity_type', 'entity_id', 'before_data', 'after_data', 'timestamp', 'source'];
SHEET_HEADERS[SHEETS.SYSTEM_CONFIG] = ['config_key', 'config_value', 'data_type', 'description', 'status'];

function setupSheets() {
  var ss = getSpreadsheet_();
  var created = [];
  var skipped = [];
  Object.keys(SHEET_HEADERS).forEach(function (sheetName) {
    var existing = ss.getSheetByName(sheetName);
    if (existing) {
      skipped.push(sheetName);
      return;
    }
    var sh = ss.insertSheet(sheetName);
    var headers = SHEET_HEADERS[sheetName];
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    created.push(sheetName);
  });
  // Remove the default blank "Sheet1" if it's still there and unused.
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }
  Logger.log('Created: ' + created.join(', '));
  Logger.log('Already existed (skipped): ' + skipped.join(', '));
  return { created: created, skipped: skipped };
}
