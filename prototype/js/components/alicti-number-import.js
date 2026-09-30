/** Import supplier-listed numbers into local management. No supplier mutation. */
(function(){
  'use strict';
  const data=CloudCallData,ui=PlatformUI,esc=ui.escape,key='alicti-number-import-v1',size=8;
  const useKeys=Object.keys(AliCtiFields.numberUseLabels),clone=v=>structuredClone(v);
  const ctx=()=>{const s=AppState.get();return [s.accountId,s.sessionId,s.tenantId,s.enterpriseId,s.activeDomain,AppState.effectiveAccess().roleCode].join('|');};
  const can=()=>AppState.isReady()&&AppState.effectiveAccess().valid&&AppState.isSuper()&&AppState.get().activeDomain==='CLOUD_CONTACT_CENTER'&&AppState.canMenu('resources.numbers');
  const command=(method,...args)=>esc(`AliCtiNumberImport.${method}(${args.map(v=>JSON.stringify(v)).join(',')})`);
  const ordered=v=>Array.isArray(v)?v.map(ordered):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,ordered(v[k])])):v;
  const same=(a,b)=>JSON.stringify(ordered(a))===JSON.stringify(ordered(b));
  const owner=id=>{const rows=data.tenants.filter(t=>!t.builtIn&&t.tenantId!=='TENANT-SUPER-BUILTIN'&&t.enterpriseId===id);return rows.length===1?rows[0]:null;};
  const importOwner=id=>{const tenant=owner(id);return tenant?.status==='启用'&&tenant.capabilitySet?.includes('CLOUD_CONTACT_CENTER')?tenant:null;};
  let state=null;
  // Legacy line snapshots are obsolete; never restore a line or infer one from supplier trunk metadata.
  function read(){const rows=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(rows)||rows.some(r=>!r||!r.numberId||!r.enterpriseId||!r.alictiNumber))throw Error('已导入号码暂时无法读取，请刷新后重试');return rows.map(({lineId,importedLine,...number})=>number);}
  function existing(raw,enterpriseId){return data.phoneNumbers.find(n=>n.enterpriseId===enterpriseId&&(n.number===raw.hotline||n.alictiNumber?.hotline===raw.hotline||String(n.alictiNumber?.id)===String(raw.id)));}
  function issue(raw){return !raw||!(AliCtiFields.integer(raw.id)>0)||typeof raw.hotline!=='string'||!/^\d{7,20}$/.test(raw.hotline)||![0,1].includes(AliCtiFields.code(raw.status))?'号码资料不完整，暂不能导入':'';}
  function parse(response){
    if(AliCtiFields.code(response?.result)!==0||!Array.isArray(response.data)||AliCtiFields.integer(response.totalCount)===null||Number(response.totalCount)<response.data.length)throw Error('未能取得号码列表，请重试');
    const seenIds=new Set(),seenNumbers=new Set();
    for(const r of response.data){if(!r||seenIds.has(String(r.id))||seenNumbers.has(r.hotline))throw Error('号码列表存在重复记录，请重新查询');seenIds.add(String(r.id));seenNumbers.add(r.hotline);}
    return {rows:clone(response.data),total:Number(response.totalCount)};
  }
  function restore(){
    try{
      for(const n of read()){
        if(!owner(n.enterpriseId)||n.authorizedTenantIds?.length!==1||n.authorizedTenantIds[0]!==owner(n.enterpriseId).tenantId||issue(n.alictiNumber)||n.number!==n.alictiNumber.hotline||!['Inbound','Outbound','Bidirection'].includes(n.aliyunUsage))continue;
        if(!existing(n.alictiNumber,n.enterpriseId))data.phoneNumbers.push(clone(n));
      }
    }catch(_){}
  }
  restore();
  function valid(){return !!state&&can()&&state.context===ctx();}
  function fetchPage(){
    state.error='';state.rows=[];state.total=0;
    try{const query=NumberOnboardingMock.list(state.enterpriseId,{offset:state.page*size,limit:size,...(state.keyword?{number:state.keyword}:{}),...(state.status===''?{}:{status:Number(state.status)})});const result=parse(query.response);state.rows=result.rows;state.total=result.total;state.lastQuery=query;}catch(error){state.error=error.message;}
  }
  function open(context){
    if(!can()||context&&context!==ctx())return false;
    if(!importOwner(AppState.get().enterpriseId)){showToast('请先为当前 AliCti 账号绑定已启用的云联络租户','warning');return false;}
    state={context:ctx(),enterpriseId:AppState.get().enterpriseId,step:1,page:0,keyword:'',status:'',rows:[],total:0,selected:new Map(),usage:'',error:'',result:[]};
    fetchPage();render();return true;
  }
  function uses(raw){const active=useKeys.filter(k=>AliCtiFields.code(raw[k])===1).map(k=>AliCtiFields.numberUseLabels[k]);return active.join('、')||(useKeys.every(k=>AliCtiFields.code(raw[k])===0)?'未开启外显用途':'部分设置未提供');}
  function status(raw){return AliCtiFields.numberFields(raw).providerStatus;}
  function render(){
    if(!valid())return;
    const s=state,selected=[...s.selected.values()],brand=CloudCallRuntime.instance(s.enterpriseId)?.brandCustomerName||'当前账号';let body='',footer='';
    if(s.step===1){
      body=`<p class="aci-account">${esc(brand)} · AliCti 账号 ${esc(s.enterpriseId)}</p><div class="aci-filters"><label>号码<input id="aci-number" value="${esc(s.keyword)}" placeholder="输入完整号码精确查询"></label><label>AliCti 状态<select id="aci-status"><option value="">全部状态</option><option value="1" ${s.status==='1'?'selected':''}>启用</option><option value="0" ${s.status==='0'?'selected':''}>停用</option></select></label><button class="btn" onclick="AliCtiNumberImport.query(true)">重置</button><button class="btn btn-primary" onclick="AliCtiNumberImport.query()">查询</button></div><div class="aci-selection"><label><input type="checkbox" id="aci-all" onchange="AliCtiNumberImport.selectPage(this.checked)"> 全选本页可导入号码</label><span id="aci-count">已选 ${s.selected.size} 个</span><button class="btn-link" onclick="AliCtiNumberImport.clear()">清空选择</button></div>`;
      if(s.error)body+=`<div class="aci-error" role="alert">${esc(s.error)} <button class="btn-link" onclick="AliCtiNumberImport.query()">重新查询</button></div>`;
      else body+=ui.table([{key:'id',label:'选择',render:(id,r)=>`<input type="checkbox" name="aci-row" aria-label="选择号码 ${esc(r.hotline)}" ${existing(r,s.enterpriseId)||issue(r)?'disabled':''} ${s.selected.has(String(id))?'checked':''} onchange="${command('toggle',String(id))}">`},{key:'hotline',label:'号码'},{key:'numberType',label:'号码类型',render:(_,r)=>esc(AliCtiFields.numberFields(r).numberType)},{key:'status',label:'AliCti 状态',render:(_,r)=>ui.status(status(r))},{key:'id',label:'外显设置',render:(_,r)=>`<span class="aci-uses">${esc(uses(r))}</span>`},{key:'id',label:'导入状态',render:(_,r)=>esc(existing(r,s.enterpriseId)?'已导入':issue(r)||'可导入')}],s.rows,{emptyText:'未查询到号码',emptyDetail:'检查查询条件，或确认号码已开通到当前 AliCti 账号。',numbered:false})+`<div class="aci-pager"><span>共 ${s.total} 个号码</span><button class="btn" ${s.page===0?'disabled':''} onclick="AliCtiNumberImport.page(-1)">上一页</button><span>${s.page+1} / ${Math.max(1,Math.ceil(s.total/size))}</span><button class="btn" ${(s.page+1)*size>=s.total?'disabled':''} onclick="AliCtiNumberImport.page(1)">下一页</button></div>`;
      footer=`<button class="btn" onclick="AliCtiNumberImport.close()">取消</button><button class="btn btn-primary" id="aci-next" ${!s.selected.size||s.error?'disabled':''} onclick="AliCtiNumberImport.next()">下一步</button>`;
    }else if(s.step===2){
      const has400=selected.some(r=>r.hotline.startsWith('400'));if(has400)s.usage='Inbound';
      body=`<h3>确认导入 ${selected.length} 个号码</h3><div class="aci-numbers">${selected.map(r=>`<span>${esc(r.hotline)} · ${esc(status(r))}</span>`).join('')}</div><div class="aci-fields"><label><span>平台使用方向 <b>*</b></span><select id="aci-usage" onchange="AliCtiNumberImport.set('usage',this.value)"><option value="">请选择</option>${Object.entries({Inbound:'仅呼入',Outbound:'仅呼出',Bidirection:'呼入和呼出'}).filter(([k])=>!has400||k==='Inbound').map(([k,v])=>`<option value="${k}" ${s.usage===k?'selected':''}>${v}</option>`).join('')}</select><small>${has400?'本批包含 400 号码，使用方向为仅呼入。':'实际可用的呼叫方式仍由号码的外显设置决定。'}</small></label></div><p class="aci-help">保留 AliCti 当前的启停状态和外显设置。导入后自动归属当前账号绑定的租户。</p>${s.error?`<p class="aci-error" role="alert">${esc(s.error)}</p>`:''}`;
      footer='<button class="btn" onclick="AliCtiNumberImport.close()">取消</button><button class="btn btn-primary" onclick="AliCtiNumberImport.submit()">确认导入</button>';
    }else{
      body=`<h3>已导入 ${s.result.length} 个号码</h3><p class="aci-help">号码已归属 ${esc(owner(s.enterpriseId)?.name||'当前租户')}。停用号码会继续保持停用。</p>`+ui.table([{key:'number',label:'号码'},{key:'businessStatus',label:'服务状态',render:v=>ui.status(v)},{key:'numberId',label:'操作',render:id=>`<button class="btn-link" onclick="${command('configure',id)}">查看号码</button>`}],ui.sortByUpdated?.(s.result,['importedAt'])||s.result,{numbered:false});
      footer='<button class="btn btn-primary" onclick="AliCtiNumberImport.close()">完成</button>';
    }
    ui.openLayer('alicti-number-import',`<div class="layer-header"><div><h2>从 AliCti 导入号码</h2><p>${s.step===1?'选择当前账号下需要纳入平台管理的号码。':s.step===2?'确认号码的使用方向。':'号码已加入号码管理。'}</p></div><button aria-label="关闭" onclick="AliCtiNumberImport.close()">×</button></div><div class="layer-body aci-body">${body}</div><div class="layer-footer">${footer}</div>`,'wide');
    if(s.step===2)document.querySelector('#alicti-number-import .secondary-back').onclick=back;
    syncChecks();
  }
  function syncChecks(){if(!valid())return;const candidates=state.rows.filter(r=>!existing(r,state.enterpriseId)&&!issue(r)),selected=candidates.filter(r=>state.selected.has(String(r.id))).length,all=document.getElementById('aci-all');if(all){all.checked=!!candidates.length&&selected===candidates.length;all.indeterminate=selected>0&&selected<candidates.length;}const count=document.getElementById('aci-count');if(count)count.textContent='已选 '+state.selected.size+' 个';const next=document.getElementById('aci-next');if(next)next.disabled=!state.selected.size||!!state.error;}
  function query(reset=false){if(!valid()||state.step!==1)return;state.keyword=reset?'':document.getElementById('aci-number').value.trim();state.status=reset?'':document.getElementById('aci-status').value;state.page=0;fetchPage();render();}
  function page(delta){if(!valid()||state.step!==1||![-1,1].includes(delta))return;const next=state.page+delta;if(next<0||next*size>=state.total)return;state.page=next;fetchPage();render();}
  function toggle(id){if(!valid()||state.step!==1)return;const row=state.rows.find(r=>String(r.id)===id);if(!row||issue(row)||existing(row,state.enterpriseId))return;if(state.selected.has(id))state.selected.delete(id);else state.selected.set(id,clone(row));syncChecks();}
  function selectPage(checked){if(!valid()||state.step!==1)return;for(const r of state.rows.filter(r=>!issue(r)&&!existing(r,state.enterpriseId))){if(checked)state.selected.set(String(r.id),clone(r));else state.selected.delete(String(r.id));}render();}
  function clear(){if(valid()&&state.step===1){state.selected.clear();render();}}
  function set(field,value){if(valid()&&state.step===2&&field==='usage')state[field]=value;}
  function next(){if(!valid()||state.step!==1||!state.selected.size||state.error)return;state.step=2;state.error='';render();}
  function back(){if(!valid()||state.step!==2)return;state.step=1;state.error='';fetchPage();render();}
  function submit(){
    if(!valid()||state.step!==2)return false;
    const s=state,rows=[...s.selected.values()];
    try{
      if(!['Inbound','Outbound','Bidirection'].includes(s.usage)||!rows.length)throw Error('请选择使用方向');
      if(rows.some(r=>r.hotline.startsWith('400'))&&s.usage!=='Inbound')throw Error('400 号码只能用于呼入');
      const tenant=importOwner(s.enterpriseId);if(!tenant)throw Error('当前账号没有唯一有效租户，请重新绑定后导入');
      const saved=read();
      for(const raw of rows){
        if(issue(raw)||existing(raw,s.enterpriseId)||saved.some(n=>n.enterpriseId===s.enterpriseId&&(n.number===raw.hotline||String(n.alictiNumber.id)===String(raw.id))))throw Error('部分号码已导入或资料已变化，请返回重新选择');
        const current=parse(NumberOnboardingMock.list(s.enterpriseId,{number:raw.hotline,offset:0,limit:1000}).response).rows;
        if(current.length!==1||!same(current[0],raw))throw Error('AliCti 号码状态或属性已变化，请返回重新查询');
      }
      const at=new Date().toLocaleString('sv-SE');
      const added=rows.map(raw=>({numberId:'ALICTI-IMPORTED-'+crypto.randomUUID(),enterpriseId:s.enterpriseId,number:raw.hotline,usage:{Inbound:'仅呼入',Outbound:'仅呼出',Bidirection:'呼入+呼出'}[s.usage],aliyunUsage:s.usage,localEnabled:true,businessStatus:Number(raw.status)===0?'已隔离':'正常',status:Number(raw.status)===0?'已隔离':'正常',contactFlowId:'',tenantId:tenant.tenantId,authorizedTenantIds:[tenant.tenantId],referenceCount:0,restoreSnapshot:null,alictiNumber:clone(raw),simulation:true,importedFrom:'ALICTI',importedAt:at,importedBy:AppState.get().accountId,numberEvidence:'企业号码列表独立演示响应'}));
      const batch={id:'ALICTI-IMPORT-'+crypto.randomUUID(),enterpriseId:s.enterpriseId,usage:s.usage,createdAt:at,items:added.map(n=>({number:n.number,numberId:n.numberId,status:'已添加',reason:'已归属 '+tenant.name})),running:false,trace:[],source:'ALICTI'};
      localStorage.setItem(key,JSON.stringify(saved.concat(added)));
      data.phoneNumbers.push(...added);data.numberOnboardingBatches.push(batch);
      s.result=added;s.step=3;s.error='';
    }catch(error){s.error=error.name==='QuotaExceededError'?'浏览器保存失败，请重试；号码尚未导入。':error.message||'导入未完成，请重试';render();return false;}
    render();return true;
  }
  function configure(id){if(!valid()||!state.result.some(n=>n.numberId===id))return;Pages['resource-lines'].openGrant(id,{context:ctx()});}
  function close(){const refresh=valid();state=null;ui.closeLayer('alicti-number-import');if(refresh)RouteRuntime.refreshCurrent();}
  window.AliCtiNumberImport={open,query,page,toggle,selectPage,clear,set,next,back,submit,configure,close,parse,issue,restore};
})();
