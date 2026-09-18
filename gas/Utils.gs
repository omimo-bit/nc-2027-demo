
function apiResponse_(success, code, message, data, errors) {
  const payload = { success: success, code: code, message: message };
  if (data !== undefined) payload.data = data;
  if (errors !== undefined) payload.errors = errors;
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok_(data, message) {
  return apiResponse_(true, 'OK', message || 'Request completed', data || {});
}

function fail_(code, message, errors) {
  return apiResponse_(false, code || 'SERVER_ERROR', message || 'Request failed', undefined, errors || []);
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try { return JSON.parse(e.postData.contents); }
  catch (err) { throw new Error('INVALID_JSON'); }
}

function sha256_(value) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value);
  return bytes.map(function(b) {
    const v = (b + 256) % 256;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

function nowIso_() {
  return Utilities.formatDate(new Date(), APP.timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
}
