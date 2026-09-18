
const SNAPSHOT={
  control:{summary:{total:156,pass:143,warning:8,error:5},rows:[
    {submission_id:'SUB-DEMO-101',nc_name:'Dewi Andini',store_name:'Store Alpha',task_code:'STOCK_TAKING',issues:['GPS_RADIUS'],validation_status:'WARNING'},
    {submission_id:'SUB-DEMO-102',nc_name:'Dewi Andini',store_name:'Store Beta',task_code:'OFFTAKE',issues:['EVIDENCE_REQUIRED'],validation_status:'ERROR'}
  ]},
  quality:{accuracy:98.7,completeness:99.2,timeliness:96.8,correction_rate:1.8,top_issues:[
    {rule_code:'GPS_RADIUS',count:12},{rule_code:'EVIDENCE_REQUIRED',count:8},{rule_code:'DUPLICATE_SUBMISSION',count:5}
  ]},
  dashboard:{active_nc:60,active_store:120,store_coverage:94,offtake_achievement:91.2,data_accuracy:98.7,target:10000,actual:9120,regional:[
    {region_name:'Jakarta',target:2500,actual:2420,achievement:96.8},
    {region_name:'West Java',target:3000,actual:2730,achievement:91.0},
    {region_name:'Central Java',target:2000,actual:1760,achievement:88.0},
    {region_name:'East Java',target:2500,actual:2210,achievement:88.4}
  ]}
};
function fallbackOn(){statusBanner.classList.remove('hidden')}
async function safeGet(action,params,fallback){try{return await apiGet(action,params)}catch(e){fallbackOn();return fallback}}

const dstate={token:localStorage.getItem('nc_token')||'',user:(()=>{try{return JSON.parse(localStorage.getItem('nc_user')||'null')}catch(e){return null}})()};
function money(v){return Number(v||0).toLocaleString('en-US')}
function pct(v){return Number(v||0).toFixed(1)+'%'}
function logout(){localStorage.removeItem('nc_token');localStorage.removeItem('nc_user');location.href='index.html'}
function openView(v){
 ['control','quality','analytics','executive'].forEach(x=>document.getElementById(x+'View').classList.toggle('hidden',x!==v));
 pageTitle.textContent={control:'Data Control Center',quality:'Data Quality',analytics:'Program Performance',executive:'Executive Performance'}[v];
 if(v==='control')loadControl(); if(v==='quality')loadQuality(); if(v==='analytics')loadAnalytics(); if(v==='executive')loadExecutive();
}
async function loadControl(){const d=await safeGet('getControlCenter',{token:dstate.token},SNAPSHOT.control);ccTotal.textContent=d.summary.total;ccPass.textContent=d.summary.pass;ccWarn.textContent=d.summary.warning;ccError.textContent=d.summary.error;ccRows.innerHTML='';
 d.rows.forEach(r=>{const tr=document.createElement('tr');tr.style.cursor='pointer';tr.onclick=()=>openSubmission(r.submission_id);tr.innerHTML=`<td>${r.submission_id}</td><td>${r.nc_name}</td><td>${r.store_name}</td><td>${r.task_code}</td><td>${(r.issues||[]).join(', ')||'-'}</td><td><span class="badge">${r.validation_status}</span></td>`;ccRows.appendChild(tr)})}
async function openSubmission(id){const d=await apiGet('getSubmission',{token:dstate.token,submission_id:id});overlay.classList.remove('hidden');drawer.classList.remove('hidden');
 const vals=(d.validation_results||[]).map(v=>`<li>${v.rule_code}: <b>${v.result}</b> ${v.message||''}</li>`).join('');
 drawer.innerHTML=`<button class="smallbtn" onclick="closeDrawer()">Close</button><h2>${id}</h2><p><b>${d.user.full_name||''}</b><br>${d.store.store_name||''}<br>${d.submission.task_code}</p><h3>Submission Data</h3><pre style="white-space:pre-wrap">${JSON.stringify(d.detail,null,2)}</pre><h3>Validation</h3><ul>${vals}</ul><div class="row"><button class="btn" onclick="approve('${id}')">APPROVE</button><button class="btn" style="background:#a16207" onclick="correction('${id}')">CORRECTION</button></div>`}
function closeDrawer(){overlay.classList.add('hidden');drawer.classList.add('hidden')}
async function approve(id){await apiPost('approveSubmission',{token:dstate.token,submission_id:id});closeDrawer();await loadControl()}
async function correction(id){const reason=prompt('Correction message','Please confirm/correct this submission.');if(!reason)return;await apiPost('requestCorrection',{token:dstate.token,submission_id:id,reason_code:'DATA_REVIEW',reason_text:reason});closeDrawer();await loadControl()}
async function loadQuality(){const d=await safeGet('getDataQuality',{token:dstate.token},SNAPSHOT.quality);dqAcc.textContent=pct(d.accuracy);dqComp.textContent=pct(d.completeness);dqTime.textContent=pct(d.timeliness);dqCorr.textContent=pct(d.correction_rate);dqIssues.innerHTML='';(d.top_issues||[]).forEach(i=>{dqIssues.innerHTML+=`<div class="barrow"><span>${i.rule_code}</span><div class="bartrack"><div class="barfill" style="width:${Math.min(100,i.count*8)}%"></div></div><b>${i.count}</b></div>`})}
function regionHtml(rows){return rows.map(r=>`<div class="barrow"><span>${r.region_name}</span><div class="bartrack"><div class="barfill" style="width:${Math.min(100,r.achievement)}%"></div></div><b>${pct(r.achievement)}</b></div>`).join('')}
async function loadAnalytics(){const d=await safeGet('getDashboardSummary',{token:dstate.token},SNAPSHOT.dashboard);anNC.textContent=d.active_nc;anStore.textContent=d.active_store;anCoverage.textContent=pct(d.store_coverage);anOfftake.textContent=pct(d.offtake_achievement);targetActual.innerHTML=`<p>Target <b>${money(d.target)}</b></p><p>Actual <b>${money(d.actual)}</b></p><div class="bartrack"><div class="barfill" style="width:${Math.min(100,d.offtake_achievement)}%"></div></div>`;regionBars.innerHTML=regionHtml(d.regional||[])}
async function loadExecutive(){const d=await safeGet('getDashboardSummary',{token:dstate.token},SNAPSHOT.dashboard);exNC.textContent=d.active_nc;exCoverage.textContent=pct(d.store_coverage);exOfftake.textContent=pct(d.offtake_achievement);exAccuracy.textContent=pct(d.data_accuracy);exRegions.innerHTML=regionHtml(d.regional||[])}
async function seedDemo(){await apiPost('seedDemo',{token:dstate.token});alert('Demo data seeded');openView('control')}
if(!dstate.token){location.href='index.html'}else{openView('control')}

async function resetDemo(){
  if(!confirm('Reset transactional demo data?')) return;
  await apiPost('resetDemo',{token:dstate.token});
  alert('Demo reset complete. Use Seed Demo to repopulate exception queue.');
  openView('control');
}
async function demoRole(role){
  const users={NC:'nc.demo',DATA_ENTRY:'dataentry.demo',DATA_ANALYST:'analyst.demo',CLIENT:'client.demo'};
  const d=await apiPost('login',{username:users[role],password:'demo123'});
  localStorage.setItem('nc_token',d.token);localStorage.setItem('nc_user',JSON.stringify(d.user));
  if(role==='NC') location.href='index.html'; else { dstate.token=d.token; dstate.user=d.user; openView(role==='CLIENT'?'executive':role==='DATA_ANALYST'?'analytics':'control'); }
}
