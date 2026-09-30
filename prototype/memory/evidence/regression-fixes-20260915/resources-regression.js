async page=>{
 const report={scope:['RG-01-resource','RG-03','RG-08','RG-09','RG-10'],checks:[],errors:[],supplierRequests:[],observed:{}};
 page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(/https?:\/\/[^/]*alicti\.cn/.test(r.url()))report.supplierRequests.push(r.url())});
 const check=(id,actual,expected)=>{const pass=JSON.stringify(actual)===JSON.stringify(expected);report.checks.push({id,actual,expected,pass});if(!pass)throw Error(id+': '+JSON.stringify(actual));};
 await page.evaluate(()=>{sessionStorage.clear();localStorage.clear()});await page.reload();
 await page.locator('#authUsername').fill('super-product');await page.locator('#authPassword').fill('123456Aa@');await page.evaluate(()=>AppState.submitLogin());
 if(await page.evaluate(()=>AppState.get().authStage==='INSTANCE'))await page.evaluate(()=>AppState.chooseInstance('7522240'));
 if(await page.evaluate(()=>AppState.get().authStage==='DOMAIN'))await page.evaluate(()=>AppState.chooseDomain('CLOUD_CONTACT_CENTER'));
 await page.evaluate(()=>{
  const base={enterpriseId:7522240,areaCode:'021',active:1,isOb:1,isAsr:0,isQualityCheck:1,status:0};
  const entries=[{id:999110,cno:'12',name:'既有短工号'},
   {id:999001,cno:'88880',name:'同步在线',status:1},{id:999002,cno:'88881',name:'异账号',enterpriseId:7522241},
   {id:999003,cno:'88882',name:'未知启用',active:9},{id:999004,cno:'88883',name:'缺失启用',active:undefined},
   {id:999005,cno:'88884',name:'未知在线',status:9},{id:999006,cno:'88885',name:'合法停用',active:0},
   {id:999007,cno:'88886',name:'缺失在线',status:undefined},{id:999008,cno:'88887',name:'合法离线'},{id:999009,cno:'88888',name:'缺失账号',enterpriseId:undefined}];
  sessionStorage.setItem('alicti-seat-import-pool-v1',JSON.stringify(entries.map(x=>({tenantId:'TEN-NISSAN-HQ',enterpriseId:'7522240',agent:{...base,...x}}))));
 });await page.reload();
 await page.evaluate(()=>{RouteRuntime.openPrimary('agents');AliCtiSeatImport.open('existing')});
 const findPage=async cno=>{
  const total=await page.evaluate(()=>Number(AliCtiSeatImport.last.response.data.total));
  for(let start=0;start<total;start+=10){await page.evaluate(n=>AliCtiSeatImport.query(n),start);if(await page.evaluate(c=>AliCtiSeatImport.last.response.data.agents.some(r=>r.agent.cno===c),cno))return;}
  throw Error('fixture missing '+cno);
 };
 for(const cno of ['88881','88882','88883','88888']){
  await findPage(cno);
  check(cno+'-not-selectable',await page.locator('[name="seat-import-selection"][value="'+cno+'"]').count(),0);
  const row=await page.locator('#seat-import-result tbody tr').filter({hasText:cno}).innerText();
  check(cno+'-has-review-reason',/待核对/.test(row),true);
  await page.evaluate(c=>{const n=document.createElement('input');n.type='checkbox';n.name='seat-import-selection';n.value=c;n.checked=true;document.querySelector('#seat-import-result').append(n);return AliCtiSeatImport.submit()},cno);
  check(cno+'-forged-submit-no-write',await page.evaluate(c=>CloudCallData.agents.some(a=>a.cno===c),cno),false);
 }
 // Valid entries remain usable even with invalid rows on the same page.
 for(const cno of ['12','88880','88884','88885','88886','88887']){
  await findPage(cno);await page.locator('[name="seat-import-selection"][value="'+cno+'"]').check();
  await page.locator('#seat-import-submit').click();
  check(cno+'-sync-completed',await page.evaluate(c=>AliCtiSeatImport.last.localResult.completed.includes(c),cno),true);
  await page.evaluate(()=>AliCtiSeatImport.query());
 }
 const seats=await page.evaluate(()=>CloudCallData.agents.filter(a=>['12','0012','88880','88884','88885','88886','88887'].includes(a.cno)).map(a=>({cno:a.cno,status:a.agentStatus,active:a.lifecycleStatus,accept:a.acceptNewTasks,enterpriseId:a.enterpriseId,rawStatus:a.supplierAgentSnapshot?.status})));
 report.observed.synchronized=seats;
 check('12-and-0012-distinct',seats.some(a=>a.cno==='12')&&seats.some(a=>a.cno==='0012'),true);
 check('status1-kept-online',seats.find(a=>a.cno==='88880').status,'在线');
 check('unknown-status-never-offline',seats.find(a=>a.cno==='88884').status,'待核对');
 check('missing-status-never-offline',seats.find(a=>a.cno==='88886').status,'待核对');
 check('active0-consistent',seats.find(a=>a.cno==='88885').active==='已停用'&&seats.find(a=>a.cno==='88885').accept===false,true);
 check('active1-offline-consistent',seats.find(a=>a.cno==='88887').active==='已启用'&&seats.find(a=>a.cno==='88887').status==='离线',true);
 await page.reload();
 check('reload-preserves-online',await page.evaluate(()=>CloudCallData.agents.find(a=>a.cno==='88880').agentStatus),'在线');
 check('reload-preserves-unknown',await page.evaluate(()=>CloudCallData.agents.find(a=>a.cno==='88886').agentStatus),'待核对');
 for(const cno of ['88880','88884','88886']){
  const result=await page.evaluate(c=>{const a=CloudCallData.agents.find(a=>a.cno===c);AliCtiDemo.lastSeatUpdate=null;Pages['agent-center'].disable(a.contactCenterIdentityId,true);return {status:a.lifecycleStatus,request:AliCtiDemo.lastSeatUpdate}},cno);
  check(cno+'-cannot-disable',{status:result.status,request:result.request},{status:'已启用',request:null});
 }
 check('offline-still-can-disable',await page.evaluate(()=>{const a=CloudCallData.agents.find(a=>a.cno==='88887');Pages['agent-center'].disable(a.contactCenterIdentityId,true);return a.lifecycleStatus}),'已停用');
 const existingMap=await page.evaluate(()=>{const a=CloudCallData.agents.find(a=>a.cno==='12');return {query:AliCtiFields.seatQueryResult({result:0,data:{total:2,agents:[{agent:{cno:'12'}},{agent:{cno:'0012'}}]}}),skill:AliCtiFields.skillUpdateFields(a,[],CloudCallData,AliCtiDemo.resourceId),saved:AliCtiDemo.saveSkills(a,[])}});
 check('query-retains-short-and-leading-zero',existingMap.query.rows.map(a=>a.cno),['12','0012']);check('existing12-skill-no-pending',existingMap.skill.pending,[]);check('existing12-skill-save-normal',existingMap.saved,true);
 // Original create rules remain strict and invalid area inputs keep their form.
 await page.evaluate(()=>{RouteRuntime.openPrimary('agents');Pages['agent-center'].openSingle()});
 for(const [id,value]of Object.entries({newAgentName:'区号修复验证',newAgentCno:'88910',newAgentAreaCode:'abc'}))await page.locator('#'+id).fill(value);
 await page.locator('#agent-single').getByRole('button',{name:'保存',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#newAgentError')?.innerText.includes('区号'));
 check('single-abc-keeps-form',await page.locator('#agent-single').count(),1);check('single-abc-not-created',await page.evaluate(()=>CloudCallData.agents.some(a=>a.cno==='88910')),false);check('single-abc-error',/区号/.test(await page.locator('#newAgentError').innerText()),true);
 await page.locator('#newAgentAreaCode').fill('021');await page.locator('#newAgentCno').fill('13');await page.locator('#agent-single').getByRole('button',{name:'保存',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#newAgentError')?.innerText.includes('3–10'));
 check('new-short-cno-still-rejected',await page.evaluate(()=>CloudCallData.agents.some(a=>a.cno==='13')),false);
 await page.locator('#newAgentCno').fill('88910');await page.locator('#agent-single').getByRole('button',{name:'保存',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#agent-single'));
 check('single-valid-area-creates',await page.evaluate(()=>CloudCallData.agents.find(a=>a.cno==='88910')?.areaCode),'021');
 await page.reload();await page.evaluate(()=>AliCtiSeatImport.open('batch'));
 for(const [id,v]of Object.entries({name:'合法批量',cno:'99001',endCno:'99002',areaCode:'abc'}))await page.locator('#seat-import-'+id).fill(v);
 await page.locator('#seat-import').getByRole('button',{name:'检查工号',exact:true}).click();check('batch-abc-disabled',await page.locator('#seat-import-submit').isDisabled(),true);check('batch-abc-error',/区号/.test(await page.locator('#seat-import-error').innerText()),true);
 await page.locator('#seat-import-areaCode').fill('010');await page.locator('#seat-import').getByRole('button',{name:'检查工号',exact:true}).click();check('batch-valid-area-enabled',await page.locator('#seat-import-submit').isEnabled(),true);await page.locator('#seat-import-submit').click();
 check('batch-valid-completed',await page.evaluate(()=>AliCtiSeatImport.last.localResult.completed),['99001','99002']);
 check('no-supplier-request',report.supplierRequests,[]);check('no-browser-error',report.errors,[]);
 report.result='pass';return report;
}
