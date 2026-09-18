
const state = {
  currentVisit:null,currentStore:null,currentTasks:[],products:[],
  get token(){return localStorage.getItem('nc_token')||''},
  set token(v){localStorage.setItem('nc_token',v)},
  get user(){try{return JSON.parse(localStorage.getItem('nc_user')||'null')}catch(e){return null}},
  set user(v){localStorage.setItem('nc_user',JSON.stringify(v))}
};
function show(id){document.querySelectorAll('[data-page]').forEach(x=>x.classList.add('hidden'));document.getElementById(id).classList.remove('hidden')}
function err(msg){alert(msg)}
async function login(ev){ev.preventDefault();document.getElementById('loginError').textContent='';
 try{const d=await apiPost('login',{username:username.value.trim(),password:password.value});state.token=d.token;state.user=d.user;if(d.user.role_code==='NC') await loadHome(); else location.href='dashboard.html'}
 catch(e){document.getElementById('loginError').textContent=e.message}}
async function loadHome(){show('homePage');hello.textContent='Good Morning, '+state.user.full_name;
 const d=await apiGet('getTodayPJP',{token:state.token,date:'2026-09-18'});planned.textContent=d.summary.planned;completed.textContent=d.summary.completed;progress.textContent=(d.summary.planned?Math.round(d.summary.completed/d.summary.planned*100):0)+'%';
 visits.innerHTML='';d.visits.forEach(v=>{const el=document.createElement('button');el.className='action';el.innerHTML=`<b>${v.planned_start} · ${v.store_name}</b><br><span class="muted">${v.address||''}</span><br><span class="badge">${v.status}</span>`;el.onclick=()=>openStore(v);visits.appendChild(el)})}
async function openStore(v){state.currentStore=await apiGet('getStoreDetail',{token:state.token,store_id:v.store_id});state.currentStore.pjp_visit_id=v.pjp_visit_id;
 show('storePage');storeName.textContent=state.currentStore.store_name;storeAddress.textContent=state.currentStore.address||'';storeRadius.textContent=(state.currentStore.gps_radius||200)+' m';distanceText.textContent='Tap CHECK IN to request your location.'}
function getPosition(){return new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{enableHighAccuracy:true,timeout:12000,maximumAge:0}))}
async function doCheckIn(){try{distanceText.textContent='Checking location...';const p=await getPosition();const d=await apiPost('checkIn',{token:state.token,pjp_visit_id:state.currentStore.pjp_visit_id,store_id:state.currentStore.store_id,latitude:p.coords.latitude,longitude:p.coords.longitude,device_timestamp:new Date().toISOString()});state.currentVisit=d.visit_id;distanceText.textContent=`${d.distance} meter · ${d.gps_status}`;await loadTasks()}
catch(e){distanceText.textContent='Location/check-in failed';err(e.message)}}
async function loadTasks(){state.currentTasks=await apiGet('getVisitTasks',{token:state.token,visit_id:state.currentVisit});show('taskPage');renderTasks()}
function renderTasks(){taskList.innerHTML='';const done=state.currentTasks.filter(t=>['SUBMITTED','VALIDATED','COMPLETED'].includes(String(t.status))).length;taskPct.textContent=Math.round(done/state.currentTasks.length*100)+'%';taskBar.style.width=Math.round(done/state.currentTasks.length*100)+'%';
 state.currentTasks.forEach(t=>{const b=document.createElement('button');b.className='action '+(['SUBMITTED','VALIDATED','COMPLETED'].includes(String(t.status))?'done':'');b.innerHTML=`<b>${t.task_name}</b><br><span class="muted">${t.status}</span>`;b.onclick=()=>startTask(t);taskList.appendChild(b)});checkCompleteButton()}
async function startTask(t){if(t.task_code==='STOCK_TAKING'){await prepProducts();stockTaskId.value=t.visit_task_id;show('stockPage')}else if(t.task_code==='OFFTAKE'){await prepProducts();offtakeTaskId.value=t.visit_task_id;show('offtakePage')}else if(t.task_code==='STORE_EVIDENCE'){storeEvidenceTaskId.value=t.visit_task_id;show('storeEvidencePage')}}
async function prepProducts(){if(!state.products.length)state.products=await apiGet('getProducts',{token:state.token});[stockProduct,offtakeProduct].forEach(sel=>{sel.innerHTML='';state.products.forEach(p=>sel.add(new Option(p.product_name,p.product_id)))})}
function imageToDataUrl(input,targetImg){return new Promise((resolve,reject)=>{const f=input.files[0];if(!f)return resolve(null);const r=new FileReader();r.onload=()=>{targetImg.src=r.result;targetImg.classList.remove('hidden');resolve(r.result)};r.onerror=reject;r.readAsDataURL(f)})}
async function saveStock(ev){ev.preventDefault();try{const evd=await imageToDataUrl(stockPhoto,stockPreview);const p=await getPosition();const d=await apiPost('submitStock',{token:state.token,visit_id:state.currentVisit,visit_task_id:stockTaskId.value,store_id:state.currentStore.store_id,product_id:stockProduct.value,physical_stock:Number(stockPhysical.value),system_stock:Number(stockSystem.value||0),remark:stockRemark.value,latitude:p.coords.latitude,longitude:p.coords.longitude,device_timestamp:new Date().toISOString(),idempotency_key:uuid(),evidence:evd?{data_url:evd,evidence_type:'SHELF',captured_at:new Date().toISOString(),latitude:p.coords.latitude,longitude:p.coords.longitude}:null});alert('Stock saved · '+d.validation_status);await loadTasks()}catch(e){err(e.message)}}
async function saveOfftake(ev){ev.preventDefault();try{const evd=await imageToDataUrl(offtakePhoto,offtakePreview);const p=await getPosition();const d=await apiPost('submitOfftake',{token:state.token,visit_id:state.currentVisit,visit_task_id:offtakeTaskId.value,store_id:state.currentStore.store_id,product_id:offtakeProduct.value,quantity:Number(offtakeQty.value),period_type:'DAILY',period_start:'2026-09-18',period_end:'2026-09-18',remark:offtakeRemark.value,latitude:p.coords.latitude,longitude:p.coords.longitude,device_timestamp:new Date().toISOString(),idempotency_key:uuid(),evidence:evd?{data_url:evd,evidence_type:'OFFTAKE',captured_at:new Date().toISOString(),latitude:p.coords.latitude,longitude:p.coords.longitude}:null});alert('Offtake saved · '+d.validation_status);await loadTasks()}catch(e){err(e.message)}}
function checkCompleteButton(){const requiredDone=state.currentTasks.every(t=>['SUBMITTED','VALIDATED','COMPLETED'].includes(String(t.status)));completeBtn.disabled=!requiredDone;completeBtn.style.opacity=requiredDone?'1':'.45'}
async function completeVisit(){try{await apiPost('completeVisit',{token:state.token,visit_id:state.currentVisit});alert('Visit completed');state.currentVisit=null;await loadHome()}catch(e){err(e.message)}}

async function saveStoreEvidence(ev){
  ev.preventDefault();
  try{
    const evd=await imageToDataUrl(storeEvidencePhoto,storeEvidencePreview);
    if(!evd) return err('Photo evidence is required');
    const p=await getPosition();
    const payload={
      token:state.token,visit_id:state.currentVisit,visit_task_id:storeEvidenceTaskId.value,
      store_id:state.currentStore.store_id,
      latitude:p.coords.latitude,longitude:p.coords.longitude,
      device_timestamp:new Date().toISOString(),idempotency_key:uuid(),
      evidence:{data_url:evd,evidence_type:'STORE_FRONT',captured_at:new Date().toISOString(),latitude:p.coords.latitude,longitude:p.coords.longitude}
    };
    if(!navigator.onLine){
      OfflineQueue.add('submitStoreEvidence',payload);
      alert('Saved offline · pending sync');
      await loadTasks(); return;
    }
    const d=await apiPost('submitStoreEvidence',payload);
    alert('Store evidence saved · '+d.validation_status);
    await loadTasks();
  }catch(e){err(e.message)}
}
async function demoRole(role){
  const users={NC:'nc.demo',DATA_ENTRY:'dataentry.demo',DATA_ANALYST:'analyst.demo',CLIENT:'client.demo'};
  const d=await apiPost('login',{username:users[role],password:'demo123'});
  state.token=d.token; state.user=d.user;
  if(role==='NC') await loadHome(); else location.href='dashboard.html';
}

document.addEventListener('DOMContentLoaded',()=>{loginForm.addEventListener('submit',login);stockForm.addEventListener('submit',saveStock);offtakeForm.addEventListener('submit',saveOfftake);storeEvidenceForm.addEventListener('submit',saveStoreEvidence)});
