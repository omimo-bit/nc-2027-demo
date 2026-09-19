/**
 * Utils.gs
 * Cross-cutting helpers shared by every service.
 */

// Common response envelope per 05_DRD_DEMO.md §6: { success, code, message, data/errors }
function ok_(data, message) {
  return { success: true, code: 'OK', message: message || 'OK', data: data !== undefined ? data : null };
}

function fail_(code, message, errors) {
  return { success: false, code: code || 'ERROR', message: message || 'Something went wrong', errors: errors || null, data: null };
}

function newId_() {
  return Utilities.getUuid();
}

function nowIso_() {
  return new Date().toISOString();
}

/**
 * Haversine distance in meters between two lat/lng points.
 * Used for GPS check-in / GPS validation rules — thresholds are demo config,
 * not a client-approved final radius (see Config.gs DEMO_CONFIG_DEFAULTS).
 */
function distanceMeters_(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some(function (v) { return v === null || v === undefined || v === ''; })) {
    return null;
  }
  var R = 6371000;
  var toRad = function (deg) { return (deg * Math.PI) / 180; };
  var dLat = toRad(lat2 - lat1);
  var dLng = toRad(lng2 - lng1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function writeAudit_(actorId, action, entityType, entityId, before, after, source) {
  appendRow_(SHEETS.AUDIT_LOGS, {
    audit_id: newId_(),
    actor_id: actorId || 'SYSTEM',
    action: action,
    entity_type: entityType,
    entity_id: entityId,
    before_data: before ? JSON.stringify(before) : '',
    after_data: after ? JSON.stringify(after) : '',
    timestamp: nowIso_(),
    source: source || 'DEMO_APP'
  });
}
