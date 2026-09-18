
async function apiGet(action, params={}) {
  const u = new URL(window.NC_CONFIG.API_URL);
  u.searchParams.set('action', action);
  Object.entries(params).forEach(([k,v]) => u.searchParams.set(k, v));
  const r = await fetch(u.toString(), { method:'GET' });
  const data = await r.json();
  if (!data.success) throw new Error(data.message || data.code);
  return data.data;
}
async function apiPost(action, payload={}) {
  const u = new URL(window.NC_CONFIG.API_URL);
  u.searchParams.set('action', action);
  const r = await fetch(u.toString(), {
    method:'POST',
    headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify(payload)
  });
  const data = await r.json();
  if (!data.success) throw new Error(data.message || data.code);
  return data.data;
}
function uuid(){ return (crypto.randomUUID ? crypto.randomUUID() : 'id-'+Date.now()+'-'+Math.random()); }
