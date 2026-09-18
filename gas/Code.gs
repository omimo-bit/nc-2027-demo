
function doGet(e) {
  try {
    return route_('GET', e);
  } catch (err) {
    const code = err && err.code ? err.code : 'SERVER_ERROR';
    const message = err && err.message ? err.message : String(err);
    return fail_(code, message);
  }
}

function doPost(e) {
  try {
    return route_('POST', e);
  } catch (err) {
    const code = err && err.code ? err.code : 'SERVER_ERROR';
    const message = err && err.message ? err.message : String(err);
    return fail_(code, message);
  }
}
