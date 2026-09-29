/* Document-bound seat import fixtures. All supplier reads and writes are simulated. */
(function(root){
  'use strict';
  const data=CloudCallData,ui=PlatformUI,esc=ui.escape,clone=x=>JSON.parse(JSON.stringify(x));
  let dialog=null,last=null,busy=false;
  const context=()=>{const s=AppState.get();return [s.sessionId,s.accountId,s.tenantId,s.enterpriseId,s.activeDomain].join('|');};
  const value=id=>document.getElementById('seat-import-'+id)?.value.trim()||'';
  const currentTenant=()=>data.tenants.find(t=>t.tenantId===value('tenant'));
  const sourceLabel=tenant=>{const account=data.instances.find(row=>row.enterpriseId===tenant?.enterpriseId);return `${account?.brandCustomerName||account?.name||'AliCti'}（${tenant?.enterpriseId||'—'}）`;};
  const valid=()=>dialog&&dialog.context===context()&&currentTenant()&&!AccountSeat.scopeError(currentTenant().tenantId,currentTenant().enterpriseId);
  const tenants=()=>AppState.scoped(data.tenants).filter(t=>!AccountSeat.scopeError(t.tenantId,t.enterpriseId));
  const key='alicti-seat-import-journal-v1';
  let journal=[];try{const saved=JSON.parse(sessionStorage.getItem(key)||'[]');if(Array.isArray(saved))journal=saved;}catch(_){}
  let providerPool=[];try{providerPool=JSON.parse(sessionStorage.getItem('alicti-seat-import-pool-v1')||'[]');if(!Array.isArray(providerPool))providerPool=[];}catch(_){}
  const currentLocal=(enterpriseId,cno)=>data.agents.find(a=>a.enterpriseId===enterpriseId&&a.cno===cno&&a.lifecycleStatus!=='已删除');
  const deletedProvider=(enterpriseId,id)=>data.agents.some(a=>a.enterpriseId===enterpriseId&&a.lifecycleStatus==='已删除'&&[a.providerAgentId,a.demoProviderAgentId,a.supplierAgentSnapshot?.id].some(value=>value!=null&&String(value)===String(id)));
  function fixtures(tenant){
    // Demo-only authorized pool: source access is a platform permission, never a supplier tenantId field.
    const index=data.tenants.findIndex(t=>t.tenantId===tenant.tenantId);
    return [0,1,2].map(i=>({id:970000+index*10+i,enterpriseId:Number(tenant.enterpriseId),cno:String(9100+index*10+i),name:'已有坐席示例 '+(i+1),areaCode:'021',active:1,isOb:1,isAsr:0,isQualityCheck:1,status:0,createTime:'2026-09-01T00:00:00.000Z'}));
  }
  function rowsFor(tenant){
    const rows=fixtures(tenant).concat(providerPool.filter(x=>x.tenantId===tenant.tenantId&&x.enterpriseId===tenant.enterpriseId).map(x=>x.agent)).filter(row=>!deletedProvider(tenant.enterpriseId,row.id)),byCno=new Map(rows.map(r=>[r.cno,r]));
    for(const a of data.agents.filter(a=>a.tenantId===tenant.tenantId&&a.enterpriseId===tenant.enterpriseId&&a.lifecycleStatus!=='已删除'))byCno.set(a.cno,{...clone(a.supplierAgentSnapshot||{}),id:a.demoProviderAgentId||a.providerAgentId||AliCtiDemo.resourceId('agent',a),enterpriseId:Number(a.enterpriseId),...AliCtiFields.seatFields(a),status:['离线','未上线','未登录'].includes(a.agentStatus)?0:['在线','空闲','通话中','话后处理','示忙','振铃'].includes(a.agentStatus)?1:null});
    return [...byCno.values()].sort((a,b)=>String(a.cno).localeCompare(String(b.cno)));
  }
  function hasCurrentCno(enterpriseId,cno){return !!currentLocal(enterpriseId,cno)||data.tenants.filter(t=>t.enterpriseId===enterpriseId).some(t=>rowsFor(t).some(row=>row.cno===cno));}
  function rowIssue(raw,tenant,expectedCno){
    if(!raw||!AliCtiFields.validExistingCno(raw.cno)||expectedCno!==undefined&&raw.cno!==expectedCno)return '坐席工号与查询目标不一致，请核对后同步';
    if(!tenant||String(raw.enterpriseId??'')!==String(tenant.enterpriseId))return '返回坐席不属于当前 AliCti 账号，未同步';
    if(![0,1].includes(AliCtiFields.code(raw.active)))return '坐席启用状态待核对，未同步';
    return '';
  }
  const activeLabel=value=>({0:'停用',1:'启用'}[AliCtiFields.code(value)]||'待核对');
  const onlineLabel=value=>({0:'离线',1:'在线'}[AliCtiFields.code(value)]||'待核对');
  const evidence=x=>'<details class="technical-details"><summary>接口请求与模拟结果</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">'+esc(JSON.stringify(x,null,2))+'</pre></details>';
  function open(mode='existing'){
    const options=tenants();if(!options.length)return showToast('当前范围无坐席维护权限','warning');
    dialog={mode:mode==='batch'?'batch':'existing',context:context(),start:0,limit:10,plan:null,rows:[]};busy=false;
    ui.openLayer('seat-import',`<div class="layer-header"><div><h2>${dialog.mode==='batch'?'批量新增坐席':'从 AliCti 同步坐席'}</h2><p>${dialog.mode==='batch'?'使用连续工号开通，本批统一姓名和区号。':'选择 AliCti 账号下已开通的坐席，同步到本平台并关联租户。'}</p></div><button aria-label="关闭" onclick="AliCtiSeatImport.close()">×</button></div><div class="layer-body"><div class="form-grid">${dialog.mode==='existing'?`<label class="field"><span>来源 AliCti 账号</span><input id="seat-import-source" value="${esc(sourceLabel(options[0]))}" readonly></label>`:''}<label class="field"><span>${dialog.mode==='batch'?'所属租户':'同步到租户'}</span><select id="seat-import-tenant" onchange="AliCtiSeatImport.reset()">${options.map(t=>`<option value="${esc(t.tenantId)}">${esc(t.name)}</option>`).join('')}</select></label>${dialog.mode==='batch'?'<label class="field"><span>本批统一姓名</span><input id="seat-import-name" maxlength="40" placeholder="开通后可逐个修改姓名" oninput="AliCtiSeatImport.invalidate()"></label><label class="field"><span>起始工号</span><input id="seat-import-cno" inputmode="numeric" maxlength="10" placeholder="例如 2001" oninput="AliCtiSeatImport.invalidate()"></label><label class="field"><span>结束工号</span><input id="seat-import-endCno" inputmode="numeric" maxlength="10" placeholder="例如 2010" oninput="AliCtiSeatImport.invalidate()"></label><label class="field"><span>区号</span><input id="seat-import-areaCode" placeholder="例如 021" oninput="AliCtiSeatImport.invalidate()"></label>':''}</div><p>${dialog.mode==='batch'?'一次最多 100 个。已有工号不重复开通；不同姓名或不连续工号可通过“新增坐席”逐个维护。':'仅展示当前权限范围内的已有坐席。已同步的坐席自动跳过，保留原有姓名和技能配置。'}</p><div id="seat-import-error" role="alert"></div><div id="seat-import-result"></div></div><div class="layer-footer"><button class="btn" onclick="AliCtiSeatImport.close()">关闭</button>${dialog.mode==='batch'?'<button class="btn" onclick="AliCtiSeatImport.preview()">检查工号</button>':''}<button class="btn btn-primary" id="seat-import-submit" ${dialog.mode==='batch'?'disabled':''} onclick="AliCtiSeatImport.submit()">${dialog.mode==='batch'?'确认新增':'同步所选坐席'}</button></div>`,'wide');
    if(dialog.mode==='existing')query();else renderPending();
  }
  function close(){if(busy)return;dialog=null;ui.closeLayer('seat-import');}
  function error(message){const el=document.getElementById('seat-import-error');if(el)el.innerHTML=ui.alert('warning','请核对后继续',esc(message));}
  function invalidate(){if(!dialog)return;dialog.plan=null;const el=document.getElementById('seat-import-submit');if(el&&dialog.mode==='batch')el.disabled=true;}
  function reset(){if(!valid())return;const source=document.getElementById('seat-import-source');if(source)source.value=sourceLabel(currentTenant());invalidate();dialog.start=0;document.getElementById('seat-import-error').innerHTML='';document.getElementById('seat-import-result').innerHTML='';if(dialog.mode==='existing')query();else renderPending();}
  function query(start=0){
    if(!valid()||dialog.mode!=='existing')return;
    const tenant=currentTenant(),request=AliCtiFields.seatQueryFields(start,dialog.limit);if(request.pending.length)return error(request.pending.join('；'));
    const auth=AliCtiFields.authFields(tenant.enterpriseId);if(auth.pending.length)return error(auth.pending.join('；'));
    const candidates=rowsFor(tenant),all=ui.sortByUpdated?.(candidates)||candidates;dialog.start=request.fields.start;dialog.rows=all.slice(dialog.start,dialog.start+dialog.limit);
    last={request:{...request,fields:{...AliCtiFields.authFields(tenant.enterpriseId).fields,...request.fields}},response:{result:'0',data:{total:String(all.length),agents:clone(dialog.rows).map(agent=>({agent,queueList:null,agentGroup:null}))}},mock:true};
    const parsed=AliCtiFields.seatQueryResult(last.response);if(parsed.pending){dialog.rows=[];document.getElementById('seat-import-submit').disabled=true;document.getElementById('seat-import-result').innerHTML=evidence(last);return error('查询结果待核对，请重新查询');}dialog.rows=parsed.rows;
    last.validation=dialog.rows.map(r=>({cno:r.cno,issue:rowIssue(r,tenant)}));
    document.getElementById('seat-import-result').innerHTML=ui.table([{key:'cno',label:'选择',render:(cno,r)=>{const issue=rowIssue(r,tenant);if(issue)return '<span title="'+esc(issue)+'">待核对</span>';const exists=!!currentLocal(tenant.enterpriseId,cno);return exists?'<span>已同步</span>':`<input type="checkbox" name="seat-import-selection" value="${esc(cno)}" aria-label="选择工号 ${esc(cno)}">`;}},{key:'cno',label:'工号'},{key:'name',label:'姓名'},{key:'areaCode',label:'区号'},{key:'active',label:'配置状态',render:activeLabel},{key:'status',label:'在线状态',render:onlineLabel},{key:'cno',label:'核对说明',render:(v,r)=>esc(rowIssue(r,tenant)||'—')}],dialog.rows)+`<div class="rr-actions"><button class="btn" ${dialog.start===0?'disabled':''} onclick="AliCtiSeatImport.query(${Math.max(0,dialog.start-dialog.limit)})">上一页</button><span>第 ${Math.floor(dialog.start/dialog.limit)+1} 页 · 共 ${all.length} 项</span><button class="btn" ${dialog.start+dialog.limit>=all.length?'disabled':''} onclick="AliCtiSeatImport.query(${dialog.start+dialog.limit})">下一页</button></div>`+evidence(last);
    document.getElementById('seat-import-submit').disabled=!dialog.rows.some(r=>!rowIssue(r,tenant)&&!data.agents.some(a=>a.enterpriseId===tenant.enterpriseId&&a.cno===r.cno&&a.lifecycleStatus!=='已删除'));
  }
  function preview(){
    if(!valid()||dialog.mode!=='batch')return;
    const plan=AliCtiFields.seatBatchFields(Object.fromEntries(['cno','endCno','name','areaCode'].map(k=>[k,value(k)]))),tenant=currentTenant();
    dialog.plan=null;document.getElementById('seat-import-submit').disabled=true;
    if(plan.pending.length)return error(plan.pending.join('；'));
    const auth=AliCtiFields.authFields(tenant.enterpriseId);if(auth.pending.length)return error(auth.pending.join('；'));
    const unknown=journal.some(x=>AliCtiFields.seatBatchOverlaps(x,tenant.enterpriseId,plan.cnos));
    if(unknown){renderPending();return error('此工号范围有未确认的开通记录，请先查询开通结果，不要重复创建');}
    const occupied=plan.cnos.filter(cno=>hasCurrentCno(tenant.enterpriseId,cno));
    if(occupied.length)return error('部分工号已存在，请使用“从 AliCti 同步坐席”或更换工号范围：'+occupied.join('、'));
    dialog.plan={...plan,tenantId:tenant.tenantId,precheck:{complete:true,rows:data.agents.filter(a=>a.enterpriseId===tenant.enterpriseId&&plan.cnos.includes(a.cno)).map(a=>({cno:a.cno,id:a.providerAgentId||a.demoProviderAgentId||a.supplierAgentSnapshot?.id}))}};document.getElementById('seat-import-error').innerHTML='';
    document.getElementById('seat-import-result').innerHTML=`<p>将新增 <strong>${plan.count}</strong> 个坐席，工号 ${esc(plan.fields.cno)} 至 ${esc(plan.fields.endCno)}。</p>`+evidence({precheck:{endpoint:'agent/query',fields:{cnos:plan.cnos.join(',')}},request:{...plan,fields:{...AliCtiFields.authFields(tenant.enterpriseId).fields,...plan.fields}},mock:true});
    document.getElementById('seat-import-submit').disabled=false;
  }
  const windowTime=at=>new Date(at).toLocaleString('sv-SE');
  function saveJournal(next){sessionStorage.setItem(key,JSON.stringify(next));journal=next;}
  function pendingRecords(){
    const tenant=currentTenant();return journal.filter(record=>record.id&&record.tenantId===tenant?.tenantId&&String(record.request?.fields?.enterpriseId)===String(tenant?.enterpriseId)&&(record.normalized?.pending||record.verification?.localFailed?.length));
  }
  function renderPending(){
    if(!valid()||dialog.mode!=='batch')return;
    const pending=pendingRecords(),records=ui.sortByUpdated?.(pending,['at'])||pending,el=document.getElementById('seat-import-result');
    if(el)el.innerHTML=records.length?`<div class="card"><h3>待核对的开通记录</h3>${records.map(record=>`<p>工号 ${esc(record.cnos.join('、'))} <button class="btn" onclick="AliCtiSeatImport.verifyPending('${esc(record.id)}')">查询开通结果</button></p>`).join('')}</div>`:'';
  }
  function persistRaw(raw,tenant,mode){
    const issue=rowIssue(raw,tenant,raw?.cno);if(issue)return {ok:false,message:issue};
    const built=Pages['agent-center'].buildAgent({cno:raw.cno,userName:raw.name,areaCode:raw.areaCode},tenant,{existing:mode==='query/get',providerCreated:mode!=='query/get'});
    if(!built.ok)return built;
    const a={...built.agent,lifecycleStatus:AliCtiFields.code(raw.active)===0?'已停用':'已启用',callEnabled:AliCtiFields.code(raw.isOb)===1,isAsr:AliCtiFields.code(raw.isAsr),isQualityCheck:AliCtiFields.code(raw.isQualityCheck),acceptNewTasks:AliCtiFields.code(raw.active)===1,agentStatus:onlineLabel(raw.status),supplierAgentSnapshot:clone(raw),simulation:true,demoProviderAgentId:raw.id||AliCtiDemo.resourceId('agent',built.agent),supplierImportMode:mode};
    return AccountSeat.persistAgent(a)?{ok:true,agent:a}:{ok:false,message:'本地保存失败，请查证后重试'};
  }
  function verifyPending(id){
    if(busy||!valid()||dialog.mode!=='batch')return;
    const record=pendingRecords().find(row=>row.id===id);if(!record)return error('该开通记录不在当前租户范围内');
    const captured=context(),tenant=currentTenant(),auth=AliCtiFields.authFields(tenant.enterpriseId);if(auth.pending.length)return error(auth.pending.join('；'));
    busy=true;invalidate();
    try{
      const rows=rowsFor(tenant).filter(row=>record.cnos.includes(row.cno));
      const response={result:'0',data:{total:String(rows.length),agents:rows.map(agent=>({agent:clone(agent),queueList:null,agentGroup:null}))}};
      const request={endpoint:'agent/query',fields:{...auth.fields,cnos:record.cnos.join(','),start:0,limit:100,...record.requestWindow}};
      const verified=AliCtiFields.seatBatchVerification(record,response),completed=[],localFailed=[];
      for(const cno of verified.confirmedCnos){
        if(captured!==context()||!valid())return;
        const raw=rows.find(row=>row.cno===cno),existing=currentLocal(tenant.enterpriseId,cno);
        if(existing){if(String(existing.demoProviderAgentId||existing.providerAgentId||existing.supplierAgentSnapshot?.id)===String(raw.id))completed.push(cno);else localFailed.push({cno,message:'当前本地坐席与查证主键不一致，请核对后处理'});continue;}
        const saved=persistRaw(raw,tenant,'batchCreate/agent-query');if(saved.ok)completed.push(cno);else localFailed.push({cno,message:saved.message});
      }
      const verification={request,response,...verified,completed,localFailed,mock:true};
      const next={...record,normalized:{...record.normalized,pending:verified.pending},verification};
      saveJournal(journal.map(item=>item.id===id?next:item));last=clone(next);AliCtiAdapter.lastRequest=last;
      CloudResourceRules.recount();CloudResourceRules.changed(tenant.tenantId);CloudCallRuntime.addAudit('查询批量坐席开通结果',record.cnos.join(','),tenant.tenantId,'待核对',`已确认 ${verified.confirmedCnos.length}，未确认 ${verified.unresolvedCnos.length}`);
      renderPending();
      const el=document.getElementById('seat-import-result');if(el)el.innerHTML+=`<p>已确认开通 ${verified.confirmedCnos.length} 个，已同步 ${completed.length} 个，仍待核对 ${verified.unresolvedCnos.length} 个。</p>${localFailed.length?ui.table([{key:'cno',label:'工号'},{key:'message',label:'同步结果'}],localFailed):''}${verified.pending?'<p>未查到记录或缺少本次创建证据的工号继续保留待核对，请勿重复创建。</p>':''}${evidence({verification,mock:true})}`;
      const errorEl=document.getElementById('seat-import-error');if(errorEl)errorEl.innerHTML='';
      const page=document.getElementById('page-content');if(page&&page.querySelector('.agent-page'))page.innerHTML=Pages['agent-center'].render({view:'agents'});
    }catch(_){error('查询结果暂未保存，请重新查询核对，不要重复创建');}finally{busy=false;}
  }
  async function submit(){
    if(busy||!valid())return;const captured=context(),tenant=currentTenant(),batch=dialog.mode==='batch';
    if(batch){preview();if(!dialog.plan)return;}
    const plan=dialog.plan,selected=batch?plan.cnos:[...document.querySelectorAll('[name="seat-import-selection"]:checked')].map(el=>el.value);
    if(!selected.length)return error('请至少选择一个坐席');
    if(!batch&&selected.some(cno=>!dialog.rows.some(r=>r.cno===cno)))return error('所选坐席已变化，请刷新列表');
    if(!batch){const issue=selected.map(cno=>rowIssue(dialog.rows.find(r=>r.cno===cno),tenant,cno)).find(Boolean);if(issue)return error(issue);}
    busy=true;document.getElementById('seat-import-submit').disabled=true;
    const completed=[],skipped=[],failed=[],requests=[];
    const outcome=AliCtiDemo.seatBatchOutcome||'success';
    const created=batch?(outcome==='partial'?selected.filter((_,i)=>i%2===0):selected):[];
    const response=batch?(outcome==='unknown'?null:outcome==='failure'?{result:-1,description:'批量开通失败（模拟）'}:{result:'0',description:'成功（模拟）',data:{cnos:created.join(','),success:String(created.length),fail:String(selected.length-created.length),other:'0'}}):null;
    const normalized=batch?AliCtiFields.seatBatchResult(response,selected,{skillIds:plan.fields.skillIds||''}):null;
    try{
      if(batch){
        const startTime=windowTime(Date.now()),request={endpoint:plan.endpoint,fields:{...AliCtiFields.authFields(tenant.enterpriseId).fields,...plan.fields}};
        const additions=(normalized.pending?outcome==='unknown'?created:[]:normalized.createdCnos).map(cno=>({tenantId:tenant.tenantId,enterpriseId:tenant.enterpriseId,agent:AccountSeat.newSupplierSnapshot({enterpriseId:tenant.enterpriseId,cno,contactCenterIdentityId:crypto.randomUUID(),userName:plan.fields.name,areaCode:plan.fields.areaCode,lifecycleStatus:'已启用',callEnabled:true,isAsr:0,isQualityCheck:1})}));
        if(normalized.pending){
          last={id:crypto.randomUUID(),mode:'batchCreate',tenantId:tenant.tenantId,request,response,normalized,cnos:[...selected],precheck:clone(plan.precheck),requestWindow:{startTime,endTime:windowTime(Date.now()+1000)},at:new Date().toISOString(),mock:true};
          saveJournal([clone(last),...journal]);
        }
        const nextPool=providerPool.concat(additions);
        sessionStorage.setItem('alicti-seat-import-pool-v1',JSON.stringify(nextPool));providerPool=nextPool;
        if(normalized.pending){dialog.plan=null;renderPending();return error('开通回执未取得。请查询开通结果，核对后再同步坐席，不要重复创建。');}
      }
      for(const cno of selected){
        if(batch&&!normalized.createdCnos.includes(cno)){failed.push({cno,message:'本次未创建成功，请核对工号后处理'});continue;}
        if(captured!==context()||!valid())return;
        const existing=currentLocal(tenant.enterpriseId,cno);
        if(existing){skipped.push(cno);continue;}
        const raw=rowsFor(tenant).find(r=>r.cno===cno);
        if(!batch&&raw&&String(raw.id)!==String(dialog.rows.find(r=>r.cno===cno)?.id)){failed.push({cno,message:'坐席配置已变化，请重新查询后同步'});continue;}
        if(!batch)requests.push({endpoint:'agent/get',fields:{...AliCtiFields.authFields(tenant.enterpriseId).fields,cno},response:raw?{result:0,data:{agent:clone(raw)}}:{result:-1,description:'未查到对应坐席'},mock:true});
        const issue=rowIssue(raw,tenant,cno);if(issue){failed.push({cno,message:issue});continue;}
        const saved=persistRaw(raw,tenant,batch?'batchCreate':'query/get');
        if(!saved.ok){failed.push({cno,message:saved.message});continue;}
        completed.push(cno);
      }
      last={mode:batch?'batchCreate':'import-existing',tenantId:tenant.tenantId,request:batch?{endpoint:plan.endpoint,fields:{...AliCtiFields.authFields(tenant.enterpriseId).fields,...plan.fields}}:null,queries:requests,response,normalized,localResult:{completed,skipped,failed},mock:true};
      saveJournal([{...last,cnos:[...selected],at:new Date().toLocaleString('sv-SE')},...journal]);
      CloudResourceRules.recount();CloudResourceRules.changed(tenant.tenantId);CloudCallRuntime.addAudit(batch?'批量新增坐席（演示）':'从 AliCti 同步坐席',completed.join(','),tenant.tenantId,batch?'未导入':'未同步',`成功 ${completed.length}，跳过 ${skipped.length}，失败 ${failed.length}`);
      document.getElementById('seat-import-result').innerHTML=`<p>${batch?'成功':'同步成功'} ${completed.length} 个，跳过${batch?'已存在':'已同步'} ${skipped.length} 个，失败 ${failed.length} 个。</p>${batch?'':`<p>已关联至：${esc(tenant.name)}。</p>`}${failed.length?ui.table([{key:'cno',label:'工号'},{key:'message',label:'原因'}],failed):''}${evidence(last)}`;
      dialog.plan=null;AliCtiAdapter.lastRequest=last;showToast(failed.length?(batch?'部分坐席未新增，请查看处理结果':'部分坐席未同步，请查看处理结果'):batch?'批量新增已完成（本地演示）':'坐席已同步并关联至所选租户',failed.length?'warning':'success');
      const page=document.getElementById('page-content');if(page&&page.querySelector('.agent-page'))page.innerHTML=Pages['agent-center'].render({view:'agents'});
    }catch(_){error('坐席结果暂未保存，请重新查询核对后重试');}finally{busy=false;}
  }
  root.AliCtiSeatImport={open,close,query,reset,invalidate,preview,submit,verifyPending,hasCurrentCno,get last(){return last}};
})(window);
