/** Mock-only ivrRouter service; local visibility metadata is kept outside API payloads. */
(function(root){
  'use strict';
  const fixture=root.AliCtiInboundMock,storageKey='alicti-inbound-router-v1',clone=v=>JSON.parse(JSON.stringify(v)),str=v=>v==null?'':String(v).trim();
  const columns=['id','enterpriseId','name','active','routerType','routerProperty','description','priority','ruleTimeProperty','ruleAreaProperty','ruleTrunkProperty','createTime'];
  let store={version:1,rows:clone(fixture.rows),pending:[],journal:[]};
  const unsavedPending=[];
  const api={scenario:'success',last:null};
  function context(){const s=AppState.get();return [s.accountId,s.sessionId,s.tenantId,s.enterpriseId,s.activeDomain,s.roleCode].join('|');}
  function allowed(manage=false){const s=AppState.effectiveAccess();return s.valid&&s.activeDomain==='CLOUD_CONTACT_CENTER'&&AppState.canMenu('settings.routes')&&(!manage||AppState.isSuper());}
  const failure=(message,pending=false)=>({ok:false,message,pending,rows:[]});
  function reload(strict=false){try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved?.version===1&&Array.isArray(saved.rows)&&Array.isArray(saved.pending)&&Array.isArray(saved.journal))store=saved;else if(saved&&strict)throw Error('Invalid inbound rule storage');}catch(error){if(strict)throw error;}}
  function persist(next){try{localStorage.setItem(storageKey,JSON.stringify(next));store=next;return true;}catch(_){return false;}}
  function own(row){return row&&str(row.enterpriseId)===str(AppState.get().enterpriseId)&&(AppState.isSuper()||(row.localTenantIds||row.tenantIds||[]).includes(AppState.get().tenantId));}
  function scopeRows(){reload();return store.rows.filter(own).sort((a,b)=>Number(a.priority)-Number(b.priority));}
  function supplier(row){return Object.fromEntries(columns.filter(k=>row[k]!==undefined).map(k=>[k,clone(row[k])]));}
  // Local edit token only; this is not a supplier version field or API parameter.
  function revision(row){return JSON.stringify([supplier(row),row.localTenantIds||row.tenantIds||[]]);}
  function timeResources(){return root.AliCtiTimeConditions?root.AliCtiTimeConditions.catalog():{ok:true,rows:fixture.resources.times.filter(own)};}
  function timeRows(row){return (timeResources().rows||[]).filter(t=>str(t.enterpriseId)===str(row.enterpriseId)&&str(row.ruleTimeProperty).split(';').includes(str(t.id))).map(t=>{const {tenantIds,...raw}=t;return clone(raw);});}
  function wrapped(row){const times=timeRows(row);return {enterpriseIvrRouter:supplier(row),enterpriseTimeList:times.length?times:null};}
  function request(endpoint,fields={},method='GET'){
    const auth=AliCtiFields.authFields(AppState.get().enterpriseId);
    return {endpoint:'ivrRouter/'+endpoint,method,fields:{...auth.fields,...fields},mock:true};
  }
  function traced(req,response){api.last={request:req,response:clone(response),mock:true};return api.last;}
  function readError(req){if(api.scenario==='success')return null;traced(req,api.scenario==='failure'?{result:'-1',description:'获取失败'}:null);return failure(api.scenario==='failure'?'暂时无法获取呼入规则，请重新获取。':'暂时无法确认呼入规则，请稍后重新获取。',api.scenario==='unknown');}
  function decorate(row){return {...clone(row),pending:store.pending.some(p=>p.enterpriseId===str(row.enterpriseId)&&p.id===str(row.id))};}
  function list(){
    if(!allowed())return failure('当前范围无权查看呼入规则。');
    const req=request('list'),error=readError(req);if(error)return error;
    const rows=scopeRows();traced(req,{result:'0',description:'成功',data:rows.map(wrapped)});
    return {ok:true,rows:rows.map(decorate),message:'已获取呼入规则。',trace:clone(api.last)};
  }
  function get(id){
    if(!allowed())return failure('当前范围无权查看呼入规则。');
    const row=scopeRows().find(r=>str(r.id)===str(id));if(!row)return {...failure('该规则不存在或不在当前权限范围。'),code:'scope'};
    const req=request('get',{id:Number(row.id)}),error=readError(req);if(error)return error;
    traced(req,{result:'0',description:'成功',data:wrapped(row)});
    return {ok:true,row:decorate(row),revision:revision(row),trace:clone(api.last),history:clone(store.journal.filter(j=>j.enterpriseId===str(row.enterpriseId)&&j.id===str(row.id)))};
  }
  function extensionResources(){
    const directory=root.AliCtiExtensions?.catalog();
    if(!directory?.ok)return [];
    return directory.rows.filter(row=>row.active===1&&row.tenantId).map(row=>({id:row.id,enterpriseId:row.enterpriseId,exten:row.exten,active:String(row.active),name:'分机 '+row.exten,tenantIds:[row.tenantId]}));
  }
  function resources(){
    if(!allowed())return {...failure('当前范围无权获取呼入资源。'),ivrs:[],trunks:[],times:[],extens:[]};
    if(api.scenario!=='success')return {...failure('暂时无法获取接听资源，请重试。',api.scenario==='unknown'),ivrs:[],trunks:[],times:[],extens:[]};
    const result=Object.fromEntries(Object.entries(fixture.resources).map(([key,rows])=>[key,clone(rows.filter(own))]));
    result.extens=extensionResources();
    const times=timeResources();if(!times.ok)return {...times,ivrs:[],trunks:[],times:[],extens:[]};result.times=times.rows;
    return {ok:true,...result};
  }
  const positive=v=>/^\d+$/.test(str(v))&&Number.isSafeInteger(Number(v))&&Number(v)>0;
  const pieces=v=>str(v)?str(v).split(';').map(x=>x.trim()):[];
  function validate(input,previous){
    const type=Number(input.routerType),active=Number(input.active??(previous?NaN:1)),priority=Number(input.priority);
    const r=Object.fromEntries(Object.entries(fixture.resources).map(([key,rows])=>[key,rows.filter(own)]));
    r.extens=extensionResources();
    const timesResult=timeResources();if(!timesResult.ok)return failure(timesResult.message);r.times=timesResult.rows;
    if(![1,2,3].includes(type))return failure('请选择接听方式。');
    if(![1,2].includes(active))return failure('请选择启用或停用。');
    if(!positive(input.priority))return failure('优先级须为大于 0 的整数。');
    if(store.rows.some(row=>str(row.enterpriseId)===str(AppState.get().enterpriseId)&&str(row.id)!==str(previous?.id)&&Number(row.priority)===priority))return failure('该优先级已被当前账号的其他规则使用，请更换。');
    const target=str(type===1?input.ivrId:type===2?input.tel:input.exten);
    const targetRow=type===1?r.ivrs.find(x=>str(x.id)===target&&str(x.ivrType)==='1'):type===3?r.extens.find(x=>str(x.exten)===target):null;
    if(type===1&&(!positive(target)||!targetRow))return failure('请选择当前账号下可用的语音导航。');
    if(type===2&&!/^(?:1[3-9]\d{9}|0\d{9,11}|\d{7,8}|400\d{7})$/.test(target))return failure('请填写有效的手机号码或固定电话号码。');
    if(type===3&&(!/^\d{3,11}$/.test(target)||!targetRow))return failure('请选择当前账号下有效的分机，分机号码保留开头的 0。');
    const area=pieces(input.ruleAreaProperty),times=pieces(input.ruleTimeProperty),trunks=pieces(input.ruleTrunkProperty);
    if(area.some(x=>!/^\d+$/.test(x)))return failure('来电号码、前缀或区号应填写数字，多个条件用分号分隔。');
    if(times.some(x=>!positive(x)||!r.times.some(t=>str(t.id)===x)))return failure('请选择当前账号下的时间条件。');
    if(trunks.some(x=>!r.trunks.some(t=>str(t.numberTrunk)===x)))return failure('请选择当前账号下的接入号码，中继号码不附加区号。');
    const tenantIds=AppState.availableTenants().filter(t=>str(t.enterpriseId)===str(AppState.get().enterpriseId)&&!t.builtIn).map(t=>t.tenantId);
    let localTenantIds=targetRow?tenantIds.filter(id=>targetRow.tenantIds.includes(id)):tenantIds;
    if(trunks.length)localTenantIds=localTenantIds.filter(id=>r.trunks.some(t=>trunks.includes(str(t.numberTrunk))&&t.tenantIds.includes(id)));
    if(times.length)localTenantIds=localTenantIds.filter(id=>r.times.some(t=>times.includes(str(t.id))&&t.tenantIds.includes(id)));
    if(!localTenantIds.length)return failure('接听资源与接入号码没有共同的可见租户，请重新选择。');
    const fields={routerType:type,active,priority,description:str(input.description),ruleAreaProperty:[...new Set(area)].join(';'),ruleTimeProperty:[...new Set(times)].join(';'),ruleTrunkProperty:[...new Set(trunks)].join(';')};
    fields[type===1?'ivrId':type===2?'tel':'exten']=type===1?Number(target):target;
    if(previous)fields.id=Number(previous.id);else if(str(input.name))fields.name=str(input.name);
    return {ok:true,fields,localTenantIds,target};
  }
  function guard(key,id){
    if(!allowed(true)||key!==context())return failure('操作范围已变化，请关闭后重新打开。');
    reload();
    if(id&&!store.rows.some(r=>str(r.id)===str(id)&&own(r)))return failure('该规则不存在或不在当前权限范围。');
    if([...store.pending,...unsavedPending].some(p=>p.enterpriseId===str(AppState.get().enterpriseId)&&(!id||!p.id||p.id===str(id))))return failure('此前提交结果尚未确认，请先核对原操作，避免重复提交。',true);
    return null;
  }
  function write(endpoint,fields,nextRow,key){
    const id=str(fields.id||nextRow?.id),error=guard(key,fields.id);if(error)return error;
    const req=request(endpoint,fields,'POST'),enterpriseId=str(AppState.get().enterpriseId),at=new Date().toLocaleString('sv-SE');
    const next=clone(store),result=api.scenario==='unknown'?null:api.scenario==='failure'?{result:'-1',description:'操作未完成'}:{result:'0',description:'成功',...(nextRow?{data:wrapped(nextRow)}:{})};
    const trace=traced(req,result),entry={id,enterpriseId,at,action:endpoint,trace:clone(trace),status:result?.result==='0'?'成功':result?'失败':'待核对'};
    next.journal.unshift(entry);
    if(!result){next.pending.push({id:fields.id?str(fields.id):'',enterpriseId,at,request:clone(req)});if(!persist(next)){unsavedPending.push(next.pending[next.pending.length-1]);store=next;return failure('无法保存核对记录，请保持当前页面并先核对原操作。',true);}return {...failure('提交结果尚未确认，已保留本次记录，请先核对后再操作。',true),trace};}
    if(result.result!=='0'){persist(next);return {...failure('本次操作未完成，原规则保持不变。'),trace};}
    const index=next.rows.findIndex(r=>str(r.id)===id&&str(r.enterpriseId)===enterpriseId);
    if(endpoint==='delete')next.rows.splice(index,1);else if(index>=0)next.rows[index]=nextRow;else next.rows.push(nextRow);
    if(!persist(next))return failure('保存失败，请检查浏览器存储后重试。');
    return {ok:true,row:nextRow?clone(nextRow):null,message:endpoint==='delete'?'规则已删除。':'规则已保存。',trace:clone(trace)};
  }
  function save(input,options={}){
    const error=guard(options.context,options.id);if(error)return error;
    const previous=options.id?store.rows.find(r=>str(r.id)===str(options.id)&&own(r)):null;
    if(previous&&options.expectedRevision!==undefined&&options.expectedRevision!==revision(previous))return {...failure('这条规则已被修改，请关闭并重新打开后再保存。当前填写内容已保留。'),code:'conflict'};
    const validated=validate(input,previous);if(!validated.ok)return validated;
    const f=validated.fields,id=previous?.id||String(Math.max(97000,...store.rows.map(r=>Number(r.id)))+1);
    const row={id,enterpriseId:str(AppState.get().enterpriseId),name:previous?.name||str(input.name)||'呼入规则 '+id,active:str(f.active),routerType:str(f.routerType),routerProperty:validated.target,description:f.description,priority:str(f.priority),ruleAreaProperty:f.ruleAreaProperty,ruleTimeProperty:f.ruleTimeProperty,ruleTrunkProperty:f.ruleTrunkProperty,createTime:previous?.createTime||new Date().toLocaleString('sv-SE'),localTenantIds:validated.localTenantIds};
    return write(previous?'update':'create',f,row,options.context);
  }
  function setActive(id,active,key){
    if(!positive(id))return failure('请选择有效的呼入规则。');
    const error=guard(key,id);if(error)return error;
    if(![1,2].includes(Number(active)))return failure('启用状态无效。');
    const row=store.rows.find(r=>str(r.id)===str(id)&&own(r));
    return write('update',{id:Number(id),active:Number(active)},{...clone(row),active:str(active)},key);
  }
  function remove(id,key){
    if(!positive(id))return failure('请选择有效的呼入规则。');
    const error=guard(key,id);if(error)return error;
    const row=store.rows.find(r=>str(r.id)===str(id)&&own(r));
    if(str(row.active)!=='2')return failure('请先停用该规则，再删除。');
    return write('delete',{id:Number(id)},null,key);
  }
  // Number grants are local. Check the same current router store used by the rule page,
  // including rules without a trunk condition, before revoking a tenant's number access.
  function numberReferences(number,includeInactive=false){
    const access=AppState.effectiveAccess(),enterpriseId=str(AppState.get().enterpriseId);
    if(!access.valid||AppState.get().activeDomain!=='CLOUD_CONTACT_CENTER'||!AppState.isSuper()||!AppState.canMenu('resources.numbers')||!number||str(number.enterpriseId)!==enterpriseId)return failure('当前范围无权核对号码的呼入规则。');
    try{reload(true);}catch(_){return failure('呼入规则暂时无法读取，原号码授权保留，请刷新后重试。');}
    const req=request('list'),error=readError(req);if(error)return error;
    const numbers=new Set([number.alictiNumber?.hotline,number.number].map(str).filter(value=>/^\d+$/.test(value)));
    const matchingTrunks=new Set(fixture.resources.trunks.filter(t=>str(t.enterpriseId)===enterpriseId&&numbers.has(str(t.areaCode)+str(t.numberTrunk))).map(t=>str(t.numberTrunk)));
    const candidates=store.rows.filter(row=>str(row.enterpriseId)===enterpriseId&&(includeInactive||str(row.active)==='1')).filter(row=>{const trunks=pieces(row.ruleTrunkProperty);return !trunks.length||trunks.some(value=>matchingTrunks.has(value));});
    if(candidates.some(row=>!Array.isArray(row.localTenantIds||row.tenantIds)))return failure('部分呼入规则的租户范围尚未确认，原号码授权保留，请先核对呼入规则。');
    traced(req,{result:'0',description:'成功',data:store.rows.filter(row=>str(row.enterpriseId)===enterpriseId).map(wrapped)});
    return {ok:true,rows:candidates.map(decorate)};
  }
  function numberScopeConflicts(number,removedTenantIds){
    if(!Array.isArray(removedTenantIds)||removedTenantIds.some(id=>!CloudCallData.tenants.some(t=>t.tenantId===id&&str(t.enterpriseId)===str(AppState.get().enterpriseId))))return failure('号码租户范围已变化，请重新打开后核对。');
    const result=numberReferences(number);if(!result.ok)return result;
    return {...result,rows:result.rows.filter(row=>(row.localTenantIds||row.tenantIds).some(id=>removedTenantIds.includes(id)))};
  }
  Object.assign(api,{context,allowed,list,get,resources,save,setActive,remove,numberScopeConflicts,numberReferences});
  root.AliCtiInbound=api;
})(window);
