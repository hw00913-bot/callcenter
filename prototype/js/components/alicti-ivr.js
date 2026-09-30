/** Official ivrProfile/list shape with explicit, separate local demo authorization. */
(function (root) {
  'use strict';
  // Synthetic provider IDs belong to this fixture only. Local FLOW-* IDs are never sent as ivrId.
  const fixtureRows = [
    {id:'91001',ivrName:'保养提醒外呼流程',enterpriseId:'7522240',ivrType:'1',ivrDescription:'客户接听后按语音流程完成提醒',createTime:'2026-09-14 09:00:00'},
    {id:'91002',ivrName:'总部预外呼转坐席流程（演示）',enterpriseId:'7522240',ivrType:'1',ivrDescription:'坐席忙时进入此流程',createTime:'2026-09-14 09:00:00'},
    {id:'91003',ivrName:'总部号码呼入导航',enterpriseId:'7522240',ivrType:'1',ivrDescription:'客户来电后的语音导航',createTime:'2026-09-14 09:00:00'},
    {id:'91004',ivrName:'等待彩铃',enterpriseId:'7522240',ivrType:'2',ivrDescription:'等待接听时播放彩铃',createTime:'2026-09-14 09:00:00'},
    {id:'91005',ivrName:'尚未分配用途的语音流程',enterpriseId:'7522240',ivrType:'1',ivrDescription:null,createTime:'2026-09-14 09:00:00'},
    {id:'91002',ivrName:'上海门店保养提醒流程',enterpriseId:'7522241',ivrType:'1',ivrDescription:'客户接听后按语音流程完成提醒',createTime:'2026-09-14 09:00:00'},
    {id:'91012',ivrName:'上海门店预外呼转坐席流程',enterpriseId:'7522241',ivrType:'1',ivrDescription:'坐席忙时进入此流程',createTime:'2026-09-14 09:00:00'},
    {id:'92001',ivrName:'其他账号语音流程',enterpriseId:'7522241',ivrType:'1',ivrDescription:null,createTime:'2026-09-14 09:00:00'}
  ];
  // This is PLATFORM data, not a supplier response, publishing state, or inferred IVR capability.
  const assignments = [
    {enterpriseId:'7522240',id:'91001',tenantIds:['TEN-NISSAN-HQ'],outboundApproved:true,usage:'automatic',contactFlowId:'FLOW-MAINTAIN-OUT-V4'},
    {enterpriseId:'7522240',id:'91002',tenantIds:['TEN-NISSAN-HQ'],outboundApproved:true,usage:'predictive',contactFlowId:'FLOW-PRED-HQ-V1'},
    {enterpriseId:'7522241',id:'91002',tenantIds:['TEN-NISSAN-SH'],outboundApproved:true,usage:'automatic',contactFlowId:'FLOW-MAINTAIN-SH-OUT-V4'},
    {enterpriseId:'7522241',id:'91012',tenantIds:['TEN-NISSAN-SH'],outboundApproved:true,usage:'predictive',contactFlowId:'FLOW-PRED-SH-V1'}
  ];
  const overrides = new Map();
  const api = {scenario:'success',lastRequest:null,lastResponse:null,assignments,fixtureRows};
  const key = v => typeof v==='string'||typeof v==='number' ? String(v) : '';
  const positiveId = v => /^\d+$/.test(key(v)) && Number.isSafeInteger(Number(v)) && Number(v)>0;
  function request(enterpriseId) {
    const auth=root.AliCtiFields.authFields(enterpriseId);
    return {endpoint:'ivrProfile/list',method:'GET',fields:auth.fields,pending:auth.pending,mock:true};
  }
  function normalize(response,scope,data=root.CloudCallData,usage='automatic') {
    const unavailable=(status,message)=>({ok:false,status,message,rows:[],raw:response,mock:true});
    const tenant=(data?.tenants||[]).find(t=>t.tenantId===scope?.tenantId);
    if(!tenant||key(tenant.enterpriseId)!==key(scope?.enterpriseId))return unavailable('scope','当前组织无法使用这些语音流程，请联系管理员。');
    if(!response||!['0','-1'].includes(key(response.result)))return unavailable('unknown','暂时无法确认可用流程，请刷新后重试。');
    if(key(response.result)==='-1')return unavailable('failure','暂时无法获取语音流程，请重新获取。');
    if(!Array.isArray(response.data))return unavailable('invalid','语音流程暂不可用，请刷新后重试。');
    if(response.data.some(r=>!r||!positiveId(r.id)||typeof r.ivrName!=='string'||!r.ivrName.trim()||!positiveId(r.enterpriseId)||!['1','2'].includes(key(r.ivrType))))return unavailable('invalid','语音流程暂不可用，请刷新后重试。');
    const current=response.data.filter(r=>key(r.enterpriseId)===key(scope.enterpriseId)&&key(r.ivrType)==='1');
    const seen=new Set();
    if(current.some(r=>{const id=key(r.id);if(seen.has(id))return true;seen.add(id);return false;}))return unavailable('invalid','语音流程存在重复，请刷新后重试。');
    const rows=current.flatMap(raw=>{
      const assignment=assignments.find(a=>a.enterpriseId===key(scope.enterpriseId)&&a.id===key(raw.id)&&a.tenantIds.includes(scope.tenantId)&&a.outboundApproved===true&&a.usage===usage);
      return assignment?[{...raw,localContactFlowId:assignment.contactFlowId,localAssignment:{tenantId:scope.tenantId,outboundApproved:true,usage}}]:[];
    });
    return {ok:true,status:rows.length?'ready':'empty',rows,raw:response,mock:true,message:rows.length?'已获取当前组织可用于外呼的语音流程。':response.data.length?'当前组织没有已分配的可用外呼流程，请联系管理员确认。':'暂无可用语音流程，请联系管理员添加。'};
  }
  function list(scope,data=root.CloudCallData,usage='automatic') {
    const req=request(scope?.enterpriseId);api.lastRequest=req;
    if(req.pending.length)return {ok:false,status:'scope',message:'语音服务尚未配置完成，请联系管理员。',rows:[],request:req,mock:true};
    if(root.AppState&&(key(root.AppState.get().enterpriseId)!==key(scope.enterpriseId)||!root.AppState.authorizeObject('',scope)))return {ok:false,status:'scope',message:'当前范围无权获取该组织的语音流程。',rows:[],request:req,mock:true};
    const response=overrides.has(key(scope.enterpriseId))?overrides.get(key(scope.enterpriseId)):api.scenario==='failure'?{result:-1,description:'获取失败（模拟）'}:api.scenario==='empty'?{result:0,data:[]}:api.scenario==='unknown'?{result:99,data:fixtureRows}:api.scenario==='invalid'?{result:0,data:{}}:{result:'0',description:'成功（本地演示）',data:fixtureRows.map(r=>({...r}))};
    api.lastResponse=response;
    return {...normalize(response,scope,data,usage),request:req};
  }
  function resolve(reference,scope,data=root.CloudCallData,usage='automatic') {
    const listed=list(scope,data,usage);
    if(!listed.ok)return {...listed,row:null};
    const explicit=reference?.providerIvrId??reference?.ivrId;
    const mapped=assignments.find(a=>a.enterpriseId===key(scope.enterpriseId)&&a.contactFlowId===reference?.contactFlowId&&a.tenantIds.includes(scope.tenantId)&&a.usage===usage&&a.outboundApproved===true);
    const selected=explicit!==undefined&&explicit!==null&&explicit!==''?key(explicit):mapped?.id;
    const row=listed.rows.find(r=>key(r.id)===selected);
    if(!row)return {...listed,ok:false,status:'unavailable',row:null,message:'请选择当前组织可用的语音流程。'};
    if(reference?.contactFlowId&&row.localContactFlowId!==reference.contactFlowId)return {...listed,ok:false,status:'mismatch',row:null,message:'语音流程与原有配置不一致，请重新选择。'};
    return {...listed,row,ivrId:Number(row.id)};
  }
  api.request=request;api.normalize=normalize;api.list=list;api.resolve=resolve;
  api.setResponse=(enterpriseId,response)=>overrides.set(key(enterpriseId),response);
  api.clearResponse=enterpriseId=>overrides.delete(key(enterpriseId));
  root.AliCtiIvr=api;
})(typeof window==='undefined'?globalThis:window);
