/* AliCti document-bound mock. No supplier network requests are made. */
(()=>{'use strict';const data=window.CloudCallData,ui=window.PlatformUI;const pendingMessage=name=>`${name}：待确认。具体字段、资源或执行结果尚未完成核对，未执行供应商操作。`;
const pending=name=>{window.showToast?.(pendingMessage(name),'warning');return {ok:false,status:'待确认',message:pendingMessage(name)}};
const blocked=[];function block(object,method,name){if(!object||typeof object[method]!=='function')return;object[method]=()=>pending(name);blocked.push({method,name,marker:object===window.AccountSeat?'AccountSeat':Object.entries(window.Pages||{}).find(([key,value])=>value===object)?.[0]||''})}
(data.instances||[]).forEach((e,i)=>{e.provider='AliCti';e.description='供应商账号 · 演示数据';});
// Configuration records open local details and correction forms, not a supplier retry operation.
block(window.AccountSeat,'retry','坐席查证重试');


// ivrRouter CRUD is handled by the documented inbound service; there is no local publish/version operation.
// Number onboarding is a local demonstration workflow; do not replace its navigation with supplier-operation guards.
const workspace=window.CloudTaskWorkspace;if(workspace){const originalDelete=workspace.deleteTask;workspace.deleteTask=function(id,...args){const task=data.tasks.find(t=>t.taskId===id&&!t.isWizardDraft);if(task&&!(task.localPrototypeTask===true&&task.simulation===true&&task.repeatContact))return pending('供应商任务删除');return originalDelete.call(this,id,...args)};}
function labelBlockedButtons(){const root=document.body;if(!root)return;root.querySelectorAll('button[onclick]').forEach(el=>{const code=el.getAttribute('onclick');const match=blocked.find(b=>b.marker&&code.includes(b.marker)&&new RegExp('\\.'+b.method+'\\(').test(code));if(match&&!el.dataset.alictiPending){el.dataset.alictiPending='true';el.title=pendingMessage(match.name);if(!el.textContent.includes('待确认'))el.append(' · 待确认');}});}
let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;labelBlockedButtons()})}).observe(document.documentElement,{childList:true,subtree:true});labelBlockedButtons();
window.AliCtiAdapter={pending,blocked,mode:'mock',enterpriseIdField:'enterpriseId',labelBlockedButtons};
})();
(()=>{'use strict';const a=window.AliCtiAdapter,wait=ms=>new Promise(r=>setTimeout(r,ms));a.scenario='success';a.trace=[];
a.connect=async (agent,input)=>{if(window.AliCtiSeatOperations)return window.AliCtiSeatOperations.login(agent,input);a.trace=[];a.authDraft=AliCtiFields.authenticateFields(agent);a.loginDraft=null;if(a.authDraft.pending.length)return {ok:false,message:a.authDraft.pending.join('；')};const stages=[['setup','正在初始化电话'],['events','正在准备电话事件'],['authenticate','正在申请登录材料'],['login','正在登录电话'],['media','正在连接音频']];for(const [key,label] of stages){a.trace.push(key);showToast(label,'info');await wait(220);if((a.scenario==='expired'&&key==='authenticate')||(a.scenario==='media-error'&&key==='media'))return {ok:false,message:a.scenario==='expired'?'登录材料已过期，请重新登录':'音频连接失败，请检查麦克风后重试'};}
a.authDraft=AliCtiFields.authenticateFields(agent);a.loginDraft={fields:{...AliCtiFields.loginFields(agent,AliCtiDemo.credentials(agent)),bindType:3,workingMode:'0'},pending:[],mock:true,source:'本地登录材料示例，不连接电话网关'};a.session={enterpriseId:agent.enterpriseId,cno:a.authDraft.fields.cno,bindType:3,workingMode:'0',tenantId:agent.tenantId,accountId:AppState.account().accountId,loginStatus:1,issuedAt:Date.now(),mock:true};return {ok:true};};
a.disconnect=async (options={removeBinding:0})=>{if(options?.removeBinding!==undefined&&options.removeBinding!==0)return {ok:false,message:'坐席退出固定保留分机绑定'};if(window.AliCtiSeatOperations)return window.AliCtiSeatOperations.logout(undefined,{removeBinding:0});a.lastLogout={logoutMode:1,removeBinding:0,mock:true};a.session=null;return {ok:true,message:'电话已退出'};};
// API-304: preserve supplier details; only explicit code=0 is a confirmed success.
const previewErrors = {
  10001:'电话服务暂时异常，请稍后重试', 20000:'呼叫参数不正确，请检查号码或联系管理员',
  20011:'坐席正在忙碌，请完成当前通话后再拨号', 20012:'坐席不存在或未在线，请核对账号并重新登录',
  20016:'当前坐席没有外呼权限，请联系管理员', 20024:'外呼功能尚未开启，请联系管理员',
  20025:'分机未注册，请检查软电话连接后重新登录', 20031:'该号码受黑白名单限制，无法呼叫，请联系管理员核对',
  20032:'外显号码不属于当前企业，请联系管理员核对号码配置', 20051:'已超过号码呼叫频次限制，请在限制解除后联系',
  20052:'该号码被运营商禁止呼叫，请联系管理员核对', 20053:'当前处于禁拨时段，请在允许时段联系',
  20054:'该号码已被冻结，无法呼叫，请联系管理员核对', 20055:'暂无可用线路，请联系管理员检查线路',
  20056:'本次呼叫受到坐席策略限制，请联系管理员核对', 20101:'当前不在允许的外呼时间内，请在允许时段联系',
  20102:'客户号码格式不正确，请检查后再拨号', 20103:'暂时无法锁定坐席，请核对电话状态后重试'
};
a.normalizePreviewResult=response=>{
  if(response&&(response.code===0||response.code==='0'))return {ok:true};
  const errorCode=response?.errorCode==null?'':String(response.errorCode),detail=typeof response?.msg==='string'?response.msg.trim():'';
  const reason=previewErrors[errorCode]||(response?.code===-1||response?.code==='-1'?'呼叫失败，请联系管理员核对':'呼叫结果尚未确认，请先核对电话状态，避免重复拨号');
  return {ok:false,errorCode,supplierMessage:detail,message:reason+(errorCode?'（错误码 '+errorCode+'）':'')+(detail?'；电话服务反馈：'+detail:'')};
};
// A one-shot local fixture, never a supplier request or an automatic retry.
a.previewDemoError='';
a.previewOutcall=(agent,phone,caller,source)=>{const connection=window.AliCtiSeatOperations?.connectionStatus?.();if(connection?.blocked)return {ok:false,message:connection.message+' 请先恢复电话连接。'};const number=CloudCallData.phoneNumbers.find(n=>n.enterpriseId===agent.enterpriseId&&(n.number===caller||n.alictiNumber?.hotline===caller));if(number&&!CloudResourceRules.usableNumber(number,agent.tenantId,'呼出','预览外呼'))return {ok:false,message:'当前号码未允许预览外呼，请重新选择'};if(!a.session||a.session.cno!==agent.cno||a.session.enterpriseId!==agent.enterpriseId)return {ok:false,message:'本人电话服务尚未就绪，请重新登录'};const outbound=window.AliCtiExtensions?window.AliCtiExtensions.outboundEligibility?.(agent):{ok:true};if(!outbound?.ok)return {ok:false,message:outbound?.message||'当前分机的外呼权限尚未就绪，请核对后重试'};const requestUniqueId='DEMO-'+crypto.randomUUID();a.lastRequest={method:'previewOutcall',...AliCtiFields.previewFields(agent,phone,caller,{cdrIsAsr:AliCtiDemo.previewAsr,...source},requestUniqueId),mock:true};const response=a.previewDemoError?{code:-1,errorCode:String(a.previewDemoError)}:{code:0,msg:'ok'};a.previewDemoError='';a.lastPreviewResponse={...response,mock:true};const outcome=a.normalizePreviewResult(response);if(!outcome.ok)return outcome;const transcriptionGate=AliCtiDemo.transcriptionGate(agent,a.lastRequest.cdrIsAsr??'omit');a.lastRequest.transcriptionGate=transcriptionGate;return {ok:true,requestUniqueId,transcriptionGate,cdrIsAsr:a.lastRequest.cdrIsAsr};};
a.normalizeCdr=(kind,cdr)=>({...AliCtiFields.normalizeCdr(kind,cdr),numberStatus:AliCtiNumberStatus.fromCdr(kind,cdr)});
a.queryRasr=(call)=>{
  if(!call||AppState.get().activeDomain!=='CLOUD_CONTACT_CENTER'||!AppState.authorizeObject('',call))return {ok:false,message:'当前范围不可查看本通话'};
  const fixture=window.CloudCallMediaFixtures?.[call.callId],sample=fixture?.demo&&fixture.callId===call.callId&&fixture.tenantId===call.tenantId&&fixture.enterpriseId===call.enterpriseId?fixture:null;
  const uniqueId=call.uniqueId??call.alictiCdr?.raw?.uniqueId??sample?.uniqueId;
  const request=AliCtiFields.rasrRequest(call.enterpriseId,uniqueId);if(request.pending.length)return {ok:false,message:request.pending.join('；'),request};
  if(!sample)return {ok:false,message:'本地演示未连接供应商，无法刷新这条记录的通话文本',request};
  const scenario=AliCtiDemo.rasrOutcome;
  const response=scenario==='failure'?{result:-1,description:'查询失败（模拟）'}:scenario==='empty'?{result:0,description:'暂无文本（模拟）',data:[]}:scenario==='unknown'?{result:-2,description:'未知返回值（模拟）',data:sample.rasr.data}:scenario==='invalid'?{result:0,description:'格式异常（模拟）',data:[{monitorSide:1,text:'格式损坏'}]}:JSON.parse(JSON.stringify(sample.rasr));
  a.lastRasr={request,response,mock:true,source:'独立 RASR 格式演示响应'};
  call.alictiRasr=response;call.alictiRasrMock=true;call.alictiRasrRequest=request;
  return {ok:true,...a.lastRasr,transcript:AliCtiFields.rasrFields(response,{enterpriseId:call.enterpriseId,uniqueId})};
};
a.mediaState=(record,rasr,options)=>{const recording=AliCtiFields.recordingFields(record,options),transcript=AliCtiFields.rasrFields(rasr);return {recording:recording.status,recordingUrl:recording.url,recordingExpiresAt:recording.expiresAt,transcript:transcript.status,segments:transcript.segments,rasr:transcript};};
a.openSettings=()=>PlatformUI.openLayer('alicti-demo-settings','<div class="layer-header"><h2>电话演示情景</h2><button onclick="PlatformUI.closeLayer(\'alicti-demo-settings\')">×</button></div><div class="layer-body"><p>仅影响本地演示，不连接供应商。</p><label class="field"><span>下次登录</span><select onchange="AliCtiAdapter.scenario=this.value"><option value="success">正常登录</option><option value="expired">登录材料过期</option><option value="media-error">音频连接失败</option></select></label><p>文档未明确支持的能力始终显示待确认。</p></div>','small');
const originalOpen=DemoSwitch.open;DemoSwitch.open=function(...args){const result=originalOpen.apply(this,args);const layer=document.querySelector('#demo-accounts .layer-body');if(layer&&!layer.querySelector('[data-alicti-settings]')){const button=document.createElement('button');button.className='btn';button.dataset.alictiSettings='true';button.textContent='接口演示配置';button.onclick=()=>AliCtiContractPanel.open();layer.prepend(button)}if(layer&&!layer.querySelector('[data-receiving-tools]')&&window.ScenarioDemo?.receivingTools)layer.insertAdjacentHTML('afterbegin',ScenarioDemo.receivingTools());return result;};
})();

(()=>{AliCtiAdapter.validateTaskDraft=d=>{if(!AppState.scoped([d]).length)return '当前工作范围已改变';const caller=AliCtiFields.validateCallerSettings(d.values,{requireNavigation:true});if(!caller.ok)return caller.message;if(d.type==='预外呼'){if(Number(d.values.callGroupType)===2){const r=window.OutboundGroups?.resolve?.(d.values,d);if(!r?.ok)return r?.message||'请选择有效的外呼组';}else{const cnos=Array.isArray(d.values.cnos)?d.values.cnos:String(d.values.cnos||'').split(',').filter(Boolean);if(!cnos.length&&!d.values.skillGroupId)return '请选择参与本次预外呼的坐席工号';}}if(d.type==='IVR 外呼'){const flow=AliCtiIvr.resolve(d.values,d);if(!flow.ok)return flow.message;}return '';};})();

(()=>{
  'use strict';
  const a = window.AliCtiAdapter, groups = window.OutboundGroups, fields = window.AliCtiFields;
  if (!a || !groups) return;
  function groupRecord(group) {
    let id = 2166136261;
    for (const char of `${group.enterpriseId}:${group.gno}`) id = Math.imul(id ^ char.charCodeAt(0), 16777619);
    return { id: String(id >>> 0), enterpriseId: group.enterpriseId, gno: group.gno, type: '2', groupName: group.name, comment: group.comment || '', createTime: group.createTime };
  }
  function request(method, input, operation) {
    const contracts = { assignAgent:'assign', unassignAgent:'unassign', listAssignedAgent:'listAssigned' };
    const check = fields.agentGroupFields[contracts[method] || method](input);
    const auth = fields.authFields(AppState.get().enterpriseId);
    let response;
    if (!groups.canAccess()) response = {result:-1,description:'当前工作范围没有外呼组管理权限'};
    else if (!check.ok) response = {result:-1,description:check.errors.join('；')};
    else if (auth.pending.length) response = {result:-1,description:auth.pending.join('；')};
    else if (!groups.refresh()) response = {result:-1,description:groups.storageError()};
    else response = operation(check.fields);
    a.lastAgentGroupRequest = {method:'agentGroup/' + method, fields:{...auth.fields,...check.fields}, response, mock:true};
    return response;
  }
  const failed = result => ({result:-1,description:result.message});
  a.agentGroup = {
    async create(input = {}) {
      return request('create', input, checked => {
        const result = groups.create({...checked,tenantId:input.tenantId},groups.contextKey(),groups.revision());
        return result.ok ? {result:0,description:'添加成功',data:groupRecord(result.group)} : failed(result);
      });
    },
    async list(input = {}) {
      return request('list', input, checked => {
        const rows=groups.list({...checked,tenantId:input.tenantId});
        return {result:0,description:'查询成功',data:rows.slice(checked.start,checked.start+checked.limit).map(g=>({ctiLinkAgentGroup:groupRecord(g),childGnos:null})),total:String(rows.length)};
      });
    },
    async get(input = {}) {
      return request('get', input, checked => {
        const group=groups.get(checked.gno);
        return group ? {result:0,description:'查询成功',data:groupRecord(group)} : {result:-1,description:'未找到此外呼组'};
      });
    },
    async update(input = {}) {
      return request('update', input, checked => {
        const result=groups.update(checked.gno,checked,groups.contextKey(),groups.revision());
        const group=result.ok&&groups.get(checked.gno);
        return group ? {result:0,description:'修改成功',data:groupRecord(group)} : failed(result);
      });
    },
    async delete(input = {}) {
      return request('delete', input, checked => {
        const result=groups.deleteGroup(checked.gno,groups.contextKey(),groups.revision());
        return result.ok ? {result:0,description:'删除成功'} : failed(result);
      });
    },
    async assignAgent(input = {}) {
      return request('assignAgent', input, checked => {
        const result=groups.assignAgent(checked.gno,checked.cnos,groups.contextKey(),groups.revision());
        return result.ok ? {result:0,description:'分配成功'} : failed(result);
      });
    },
    async unassignAgent(input = {}) {
      return request('unassignAgent', input, checked => {
        const result=groups.unassignAgent(checked.gno,checked.cno,groups.contextKey(),groups.revision());
        return result.ok ? {result:0,description:'解绑成功'} : failed(result);
      });
    },
    async listAssignedAgent(input = {}) {
      return request('listAssignedAgent', input, checked => {
        const group=groups.get(checked.gno);
        if(!group)return {result:-1,description:'未找到此外呼组'};
        const result=groups.listAssignedAgent(checked.gno,checked);
        return {result:0,description:'查询成功',data:result.agents.map(agent=>({id:null,enterpriseId:group.enterpriseId,gno:group.gno,cno:agent.cno,cname:agent.name,gname:group.name,createTime:group.createTime})),total:String(result.total)};
      });
    },
    async queryAgentGroup(input = {}) {
      return request('queryAgentGroup', input, checked => {
        const result=groups.queryAgentGroup(checked.cno),group=result&&groups.get(result.outboundGroupId);
        return group ? {result:0,description:'查询成功',data:groupRecord(group)} : {result:-1,description:'未找到座席所属外呼组'};
      });
    }
  };
})();
