
const OfflineQueue = {
  key: 'nc2027_offline_queue',
  list() {
    try { return JSON.parse(localStorage.getItem(this.key) || '[]'); }
    catch(e) { return []; }
  },
  save(items) { localStorage.setItem(this.key, JSON.stringify(items)); this.updateBadge(); },
  add(action,payload) {
    const items=this.list();
    items.push({queue_id:uuid(),action,payload,created_at:new Date().toISOString(),retry_count:0,status:'PENDING'});
    this.save(items);
  },
  async sync() {
    if (!navigator.onLine) return;
    const items=this.list(); const remain=[];
    for (const item of items) {
      try { await apiPost(item.action,item.payload); }
      catch(e) { item.retry_count=(item.retry_count||0)+1; item.status='ERROR'; remain.push(item); }
    }
    this.save(remain);
  },
  updateBadge() {
    const el=document.getElementById('offlineBadge');
    if(!el) return;
    const n=this.list().length;
    el.textContent=n ? `${n} pending sync` : (navigator.onLine ? 'Online' : 'Offline');
  }
};
window.addEventListener('online',()=>OfflineQueue.sync());
window.addEventListener('offline',()=>OfflineQueue.updateBadge());
document.addEventListener('DOMContentLoaded',()=>OfflineQueue.updateBadge());
