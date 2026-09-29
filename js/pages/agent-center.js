/** 坐席管理：独立维护云呼叫坐席、停用恢复和技能配置。 */
(function(){
  'use strict'; const ui=PlatformUI,esc=ui.escape; let view='agents',pageContext='',skillScope={physicalGroupId:'',tenantId:''},agentDetail=null;
  const filters={agents:{keyword:'',status:'全部状态'},skills:{keyword:'',status:'全部状态'},sync:{keyword:'',status:'全部状态'}};
  const pages={agents:1,skills:1,sync:1};const pageSize=8;
  let phoneDialog=null,phoneSaving=false;
  const phoneValue=agent=>window.SeatPhoneConfig?.read(agent)||{ok:false,value:'',message:'电话配置尚未加载，请刷新重试'};
  const phoneLabel=agent=>{const result=phoneValue(agent);return result.ok?(result.value?String(result.value)+(result.eligible===false?'（待重新选择）':''):'未配置'): '待核对';};
  function scoped(rows){return AppState.scoped(rows||[]);}
  function tenantName(id){return CloudCallRuntime.tenant(id)?.name||id;}
  function agentByIdentity(id){return CloudCallData.agents.find(x=>x.contactCenterIdentityId===id);}
  const command=(method,...args)=>esc(`window.Pages['agent-center'].${method}(${args.map(value=>JSON.stringify(value)).join(',')})`);
  const configurationNames={'云呼叫坐席创建':'新增坐席','物理技能映射':'技能配置','坐席技能关系':'坐席技能调整'};
  function configurationName(row){return configurationNames[row.objectType]||row.objectType;}
  function friendlyReason(value){
    if(!value)return '—';
    return String(value).replaceAll('LoginName','坐席账号').replaceAll('CreateUser','新增坐席').replaceAll('CreateSkillGroup','技能配置').replace(/（本地演示）/g,'');
  }
  function recordReason(row){return row.status==='成功'?(row.latestResult?friendlyReason(row.latestResult):'配置已完成'):friendlyReason(row.latestResult||row.failureReason);}
  function mayReadRecord(row){return !!row&&AppState.get().activeDomain==='CLOUD_CONTACT_CENTER'&&AppState.canMenu('agents.sync')&&AppState.authorizeObject('',row);}
  function mayCorrectRecord(row){return !!row&&mayManage(row)&&row.objectType==='云呼叫坐席创建'&&row.status==='失败'&&!/超时|未知|未确认/.test(row.latestResult||row.failureReason||'');}
  function filterPanel(key,label){const current=filters[key],states=key==='agents'?['已启用','已停用','待核对']:key==='sync'?['成功','失败','核查中']:['已启用','已删除','停用中','已停用','成功','失败','核查中','已生效','待生效'];return `<div class="filter-panel"><label class="field grow"><span>${label}</span><input id="${key}Keyword" value="${esc(current.keyword)}" placeholder="${key==='sync'?'输入坐席、技能或配置类型':'输入坐席姓名或手机号'}"></label><label class="field"><span>状态</span><select id="${key}Status"><option>全部状态</option>${states.map(value=>`<option ${current.status===value?'selected':''}>${value}</option>`).join('')}</select></label><div class="filter-actions"><button class="btn" onclick="window.Pages['agent-center'].resetFilters('${key}')">重置</button><button class="btn btn-primary" onclick="window.Pages['agent-center'].query('${key}')">查询</button></div></div>`;}
  function shell(key,rows,columns,primary,help){rows=ui.sortByUpdated?.(rows,['supplierAgentSnapshot.updateTime','supplierAgentSnapshot.createTime'])||rows;pages[key]=Math.max(1,Math.min(pages[key],Math.ceil(rows.length/pageSize)||1));const start=(pages[key]-1)*pageSize;return `<div class="management-list-shell">${ui.toolbar(primary,`<button class="btn" onclick="window.Pages['agent-center'].refresh('${key}')">刷新</button>${ui.help(help)}`)}${ui.table(columns,rows.slice(start,start+pageSize),{emptyText:'没有符合条件的数据',rowOffset:start})}${ui.pagination(rows.length,pages[key],pageSize,`window.Pages['agent-center'].setPage.bind(null,'${key}')`)}</div>`;}
  // AliCTI list contract: agentStatus/batchGet data[cno].state and agent/query agent.active.
  // Legacy names below only adapt local demo fixtures; online does not imply idle.
  function listFields(row){
    const aliases={'通话中':'通话','示忙':'置忙','忙碌':'置忙','话后处理':'整理','拨号中':'呼叫中','振铃':'响铃','未上线':'离线','未登录':'离线'};
    const states=['离线','空闲','置忙','整理','呼叫中','响铃','保持','通话'];
    const value=Object.hasOwn(row,'state')?row.state:(aliases[row.agentStatus]||row.agentStatus);
    const active=Object.hasOwn(row,'active')?row.active:({'已启用':1,'已停用':0})[row.lifecycleStatus];
    return {...row,state:states.includes(value)?value:'待核对',active:active===1||active==='1'?1:active===0||active==='0'?0:null};
  }
  const activeLabel=value=>value===1?'已启用':value===0?'已停用':'待核对';
  function renderAgents(){const current=filters.agents,keyword=current.keyword.toLowerCase();const rows=scoped(CloudCallData.agents).filter(row=>row.lifecycleStatus!=='已删除').map(listFields).filter(row=>(!keyword||`${row.userName} ${row.cno || ''} ${row.mobile}`.toLowerCase().includes(keyword))&&(current.status==='全部状态'||activeLabel(row.active)===current.status));return `<section class="platform-page agent-page">${ui.pageHeader('坐席维护','管理坐席、软电话分机、技能和启停；平台账号可在账号管理中关联坐席。')}${BusinessIssues.section('坐席创建')}${filterPanel('agents','坐席姓名 / 手机号')}${shell('agents',rows,[
    {key:'userName',label:'坐席',render:(v,r)=>`<button class="table-link" onclick="window.Pages['agent-center'].openAgent('${r.contactCenterIdentityId}')"><strong>${esc(v)}</strong><small>${esc(r.mobile||'未填写手机号')}</small></button>`},{key:'tenantId',label:'所属租户',render:v=>esc(tenantName(v))},{key:'softphoneExtension',label:'软电话分机号',render:(v,r)=>esc(phoneLabel(r))},{key:'state',label:'话务状态',render:v=>ui.status(v)},{key:'active',label:'启用状态',render:v=>ui.status(activeLabel(v))},{key:'contactCenterIdentityId',label:'操作',className:'action-column',render:(v,r)=>`<div class="table-actions"><button onclick="window.Pages['agent-center'].openAgent('${v}')">查看</button>${r.lifecycleStatus==='已删除'?'':`<button onclick="${command('openPhoneConfig',v)}">配置分机</button>`}${r.lifecycleStatus==='已启用'?`<button onclick="window.Pages['agent-center'].disable('${v}')">停用</button>`:(r.lifecycleStatus==='已停用'?`<button onclick="window.Pages['agent-center'].restore('${v}')">恢复</button>`:'')}${r.lifecycleStatus==='已删除'?'':`<button class="danger" onclick="window.Pages['agent-center'].remove('${v}')">删除</button>`}</div>`}
  ],'<button class="btn" onclick="window.Pages[\'agent-center\'].openSingle()">新增坐席</button><button class="btn" onclick="AliCtiSeatImport.open(\'existing\')">从 AliCti 同步坐席</button><button class="btn" onclick="AliCtiSeatImport.open(\'batch\')">批量新增</button>','坐席归属当前租户；在账号管理选择现有坐席或新建并关联，完成技能配置后可进入坐席工作台。')}</section>`;}
  function renderSkills(){
    if(!AppState.canMenu('agents.manage')||AppState.get().activeDomain!=='CLOUD_CONTACT_CENTER')return ui.empty('当前工作范围无成员维护权限');
    const group=skillScope.physicalGroupId&&CloudCallData.physicalSkillGroups.find(g=>g.physicalGroupId===skillScope.physicalGroupId);
    if(skillScope.physicalGroupId&&(!group||!mayManage(group)||group.tenantId!==skillScope.tenantId))return ui.empty('该技能不在当前可维护范围');
    const current=filters.skills,keyword=current.keyword.toLowerCase();
    const relations=CloudCallData.agentSkills.map(r=>{const agent=agentByIdentity(r.identityId),g=CloudCallData.physicalSkillGroups.find(g=>g.physicalGroupId===r.physicalGroupId);return {...r,agent,group:g,tenantId:agent?.tenantId,enterpriseId:agent?.enterpriseId,agentName:agent?.userName,groupName:g?.name};}).filter(r=>r.agent&&r.group&&mayManage(r.agent)&&mayManage(r.group)&&r.agent.tenantId===r.group.tenantId&&r.agent.enterpriseId===r.group.enterpriseId&&r.agent.lifecycleStatus!=='已删除'&&(!group||r.physicalGroupId===group.physicalGroupId)&&(!skillScope.tenantId||r.tenantId===skillScope.tenantId)&&(!keyword||`${r.agentName} ${r.agent.mobile} ${r.groupName}`.toLowerCase().includes(keyword))&&(current.status==='全部状态'||r.status===current.status));
    pages.skills=Math.min(pages.skills,Math.max(1,Math.ceil(relations.length/pageSize)));
    const context=group?`<div class="rr-context"><div><strong>${esc(group.name)}</strong><span>${esc(tenantName(group.tenantId))} · ${esc(group.status)}</span></div><div class="rr-actions"><button class="btn" onclick="window.Pages['agent-center'].backToGroup()">查看技能详情</button></div></div>`:'';
    return `<section class="platform-page agent-skill-page rr-page">${ui.pageHeader('坐席分组与等级',group?'维护当前技能的成员和等级。':'维护坐席加入的技能及等级。')}${context}${filterPanel('skills','坐席 / 技能')}${shell('skills',relations,[
      {key:'agentName',label:'坐席'},{key:'groupName',label:'技能'},{key:'skillLevel',label:'技能等级',help:'技能等级由平台约束为1–10的整数，数值越小技能等级越高；实际接听按场景和分配策略执行。在线坐席请先下线再调整。',render:(v,r)=>`<input class="level-select" type="number" min="1" max="10" step="1" value="${esc(v)}" aria-label="${esc(r.agentName)}技能等级" onchange="window.Pages['agent-center'].changeLevel('${r.relationId}',this.value)">`},{key:'status',label:'成员状态',render:v=>ui.status(v)},{key:'syncStatus',label:'配置状态',render:v=>ui.status(v)},{key:'relationId',label:'操作',className:'action-column',render:(v,r)=>`<div class="table-actions">${r.syncStatus==='待提交'?`<button onclick="window.Pages['agent-center'].submitPendingSkills('${v}')">提交新增技能</button>`:''}<button class="danger" onclick="window.Pages['agent-center'].unassign('${v}')">移出技能</button></div>`}
    ],'<button class="btn btn-primary" onclick="window.Pages[\'agent-center\'].openSkillAssign()">添加已有坐席</button>','在线或通话中的坐席可添加新技能，先保存为待提交；坐席下线后点击“提交新增技能”。待提交技能不参与接听分配。')}</section>`;
  }
  function renderSync(){
    const source=scoped(CloudCallData.syncRecords),current=filters.sync,keyword=current.keyword.toLowerCase(),key=contextKey();
    const rows=source.filter(row=>(!keyword||`${row.objectName} ${row.objectType} ${configurationName(row)}`.toLowerCase().includes(keyword))&&(current.status==='全部状态'||row.status===current.status));
    pages.sync=Math.min(pages.sync,Math.max(1,Math.ceil(rows.length/pageSize)));
    return `<section class="platform-page sync-page">${ui.pageHeader('坐席配置记录','查看新增坐席、技能配置及成员调整的处理结果；资料有误时可修改后重新提交。')}${filterPanel('sync','坐席 / 配置类型')}${shell('sync',rows,[
      {key:'objectName',label:'坐席 / 对象'},{key:'objectType',label:'配置类型',render:(v,r)=>esc(configurationName(r))},{key:'status',label:'处理结果',render:v=>ui.status(v)},
      {key:'failureReason',label:'处理说明',render:(v,r)=>`<span class="${r.status==='失败'?'danger-text':''}">${esc(recordReason(r))}</span>`},
      {key:'updatedAt',label:'更新时间'},
      {key:'syncId',label:'操作',className:'action-column',render:(v,r)=>`<div class="table-actions">${mayCorrectRecord(r)?`<button onclick="${command('retry',v,key)}">修改资料</button>`:''}<button onclick="${command('openSyncRecord',v,key)}">${r.status==='成功'?'查看记录':'查看原因'}</button></div>`}
    ],'', '记录新增坐席和技能配置的处理结果，保留原失败原因与后续提交记录。')}</section>`;
  }
  function render(options){
    const previousContext=pageContext;pageContext=contextKey();view=options?.view||view;
    if(AppState.get().activeDomain!=='CLOUD_CONTACT_CENTER'||!AppState.canMenu(view==='sync'?'agents.sync':'agents.manage'))return ui.empty('当前工作范围无坐席管理权限');
    if(previousContext&&previousContext!==pageContext){filters.skills={keyword:'',status:'全部状态'};pages.skills=1;skillScope={physicalGroupId:'',tenantId:''};}
    if(view==='skills'){
      const next={physicalGroupId:options?.physicalGroupId||'',tenantId:options?.tenantId||''};
      if(next.physicalGroupId&&!next.tenantId)next.tenantId=CloudCallData.physicalSkillGroups.find(g=>g.physicalGroupId===next.physicalGroupId)?.tenantId||'';
      if(next.physicalGroupId!==skillScope.physicalGroupId||next.tenantId!==skillScope.tenantId){filters.skills={keyword:'',status:'全部状态'};pages.skills=1;}
      skillScope=next;return renderSkills();
    }
    if(view==='sync')return renderSync();return renderAgents();
  }
  function mayManage(row){return AppState.get().activeDomain==='CLOUD_CONTACT_CENTER'&&AppState.canMenu('agents.manage')&&AppState.authorizeObject('',row);}
  function contextKey(){const s=AppState.get();return [s.accountId,s.sessionId,s.tenantId,s.enterpriseId,s.activeDomain,s.roleCode].join('|');}
  let createContext='', retrySyncId='', createRequestId='', creating=false;
  function openSingle(syncId,key){
    if(key&&key!==contextKey())return;
    const failed=CloudCallData.syncRecords.find(r=>r.syncId===syncId);
    if(syncId&&!mayCorrectRecord(failed))return;
    retrySyncId=failed?.syncId||'';
    const tenants=scoped(CloudCallData.tenants).filter(t=>(!failed||t.tenantId===failed.tenantId)&&mayManage(t)&&t.status==='启用'&&t.capabilitySet.includes('CLOUD_CONTACT_CENTER'));
    if(!tenants.length)return;createContext=contextKey();createRequestId=crypto.randomUUID();creating=false;
    const previousInput=failed?.retryInput||{};
    ui.openLayer('agent-single',`<div class="layer-header"><div><h2>${failed?'修改并重新提交坐席':'新增云呼叫坐席'}</h2><p>填写坐席资料；技能可暂不分配，之后在坐席详情中配置。</p></div><button onclick="PlatformUI.closeLayer('agent-single')">×</button></div><div class="layer-body">${failed?ui.detailSection('上次未完成的原因','<p>'+esc(recordReason(failed))+'</p>'): ''}<div class="form-grid"><label class="field"><span>所属租户</span><select id="newAgentTenant" onchange="window.Pages['agent-center'].renderNewAgentSkills()">${tenants.map(t=>`<option value="${esc(t.tenantId)}">${esc(t.name)}</option>`).join('')}</select></label><label class="field"><span>姓名</span><input id="newAgentName" value="${esc(previousInput.userName||failed?.objectName||'')}" maxlength="40"></label><label class="field"><span>坐席工号</span><input id="newAgentCno" value="${esc(previousInput.cno||'')}" maxlength="10"><small>3–10位数字，保留开头的0；0012与012是不同工号。</small></label><label class="field"><span>区号</span><input id="newAgentAreaCode" value="${esc(previousInput.areaCode||'')}" type="text" placeholder="例如021"></label><div class="field full"><span>技能（选填）</span><div id="newAgentSkills"></div><small class="field-hint">可暂不分配；每个技能可单独设置等级，1级最高，10级最低。</small></div></div><div id="newAgentError" aria-live="polite"></div></div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer('agent-single')">取消</button><button class="btn btn-primary" onclick="window.Pages['agent-center'].createSingle()">保存</button></div>`,'wide');
    renderNewAgentSkills();
  }
  function renderNewAgentSkills(){
    const node=document.getElementById('newAgentSkills');if(!node)return;
    const tenant=CloudCallRuntime.tenant(document.getElementById('newAgentTenant')?.value);
    const groups=tenant?scoped(CloudCallData.physicalSkillGroups).filter(g=>mayManage(g)&&g.status==='已启用'&&g.tenantId===tenant.tenantId&&g.enterpriseId===tenant.enterpriseId):[];
    node.innerHTML=groups.map(g=>`<div class="new-agent-skill-row"><label><input type="checkbox" name="newAgentSkill" value="${esc(g.physicalGroupId)}">${esc(g.name)}</label><label>等级 <input type="number" min="1" max="10" step="1" value="1" data-new-skill-level="${esc(g.physicalGroupId)}" aria-label="${esc(g.name)}技能等级"></label></div>`).join('')||'<p class="field-hint">当前租户暂无可分配技能，可先保存坐席。</p>';
  }
  function buildAgent(input,tenant,options={}){
    const userName=String(input.userName||'').trim(),mobile=String(input.mobile||'').trim(),cno=String(input.cno||'').trim(),areaCode=String(input.areaCode||'').trim(),softphoneExtension='';
    if(input.softphoneExtension!=null&&input.softphoneExtension!=='')return {ok:false,message:'请先创建坐席，再从本租户的分机中选择'};
    const validCno=options.existing?AliCtiFields.validExistingCno(input.cno):/^\d{3,10}$/.test(cno)&&Number(cno)!==0;
    let error=!userName?'请输入姓名':!validCno?(options.existing?'已有坐席工号须为非全零的数字文本':'坐席工号须为3–10位数字'):!areaCode?'请输入区号':!AliCtiFields.validAreaCode(areaCode)?'区号请填写数字，例如021':'';
    if(!error&&CloudCallData.agents.some(a=>a.enterpriseId===tenant.enterpriseId&&a.lifecycleStatus!=='已删除'&&a.cno===cno))error='当前供应商账号下坐席工号已存在';
    if(!error&&!options.existing&&!options.providerCreated&&window.AliCtiSeatImport?.hasCurrentCno(tenant.enterpriseId,cno))error='该工号已在 AliCti 账号中开通，请从 AliCti 同步坐席';
    if(error)return {ok:false,message:error};
    return {ok:true,agent:{agentRecordId:CloudResourceRules.id('AGT'),contactCenterIdentityId:CloudResourceRules.id('CCI'),accountId:'',userName,mobile,softphoneExtension,tenantId:tenant.tenantId,enterpriseId:tenant.enterpriseId,cno,areaCode,roleId:'Agent',workMode:'WEBRTC',lifecycleStatus:'已启用',agentStatus:'离线',syncStatus:'同步成功',callEnabled:true,currentCall:false,acceptNewTasks:true,isAsr:0,isQualityCheck:1,evidenceType:'DEMO',realVerification:'未验证'}};
  }
  async function createSingle(){
    if(creating)return;
    const value=id=>document.getElementById(id)?.value.trim()||'',tenant=CloudCallRuntime.tenant(value('newAgentTenant'));
    if(createContext!==contextKey()||!tenant||!mayManage(tenant)||tenant.status!=='启用'||!tenant.capabilitySet.includes('CLOUD_CONTACT_CENTER'))return showToast('当前权限或租户已变化，请重新打开新增页面','warning');
    const userName=value('newAgentName'),cno=value('newAgentCno'),areaCode=value('newAgentAreaCode');
    const failed=CloudCallData.syncRecords.find(r=>r.syncId===retrySyncId);
    if(retrySyncId&&(!mayCorrectRecord(failed)||failed.tenantId!==tenant.tenantId))return;
    const selectedSkills=[...document.querySelectorAll('input[name="newAgentSkill"]:checked')].map(input=>({physicalGroupId:input.value,skillLevel:[...document.querySelectorAll('[data-new-skill-level]')].find(n=>n.dataset.newSkillLevel===input.value)?.value}));
    if(selectedSkills.some(r=>{const g=CloudCallData.physicalSkillGroups.find(g=>g.physicalGroupId===r.physicalGroupId);return !g||!mayManage(g)||g.status!=='已启用'||g.tenantId!==tenant.tenantId||g.enterpriseId!==tenant.enterpriseId||!AliCtiFields.validSkillLevel(r.skillLevel);}))return showToast('请核对技能归属及等级（1–10）','warning');
    const submittedContext=createContext;creating=true;
    const result=await AccountSeat.create({tenantId:tenant.tenantId,userName,cno,areaCode},{requestId:createRequestId,configurationRecordId:retrySyncId||undefined});
    creating=false;if(submittedContext!==contextKey())return;
    if(failed){BusinessIssues.refresh();refreshSyncList();}
    if(!result.ok){const errorNode=document.getElementById('newAgentError');if(errorNode)errorNode.innerHTML=ui.alert('warning','未能开通坐席',esc(result.message));return;}
    const agent=result.agent;
    let skillsSaved=true;
    if(selectedSkills.length){
      const relations=selectedSkills.map(r=>({...r,skillLevel:Number(r.skillLevel),relationId:CloudResourceRules.id('REL'),identityId:agent.contactCenterIdentityId,status:'已生效',syncStatus:'同步成功'}));
      const stillValid=selectedSkills.every(r=>{const g=CloudCallData.physicalSkillGroups.find(g=>g.physicalGroupId===r.physicalGroupId);return g&&mayManage(g)&&g.status==='已启用'&&g.tenantId===agent.tenantId&&g.enterpriseId===agent.enterpriseId;});
      try{skillsSaved=stillValid&&AliCtiDemo.saveSkills(agent,relations);}catch(_){skillsSaved=false;}
    }
    const creationMessage=skillsSaved?'坐席已新增'+(selectedSkills.length?'，技能已分配':'，可稍后配置技能'):'坐席已新增，但技能分配未完成，请在坐席详情中重新配置';
    if(failed){
      retrySyncId='';createContext='';ui.closeLayer('agent-single');BusinessIssues.refresh();
      if(view!=='sync')RouteRuntime.refreshCurrent();
      showToast(creationMessage,skillsSaved?'success':'warning');
      if(mayReadRecord(failed))openSyncRecord(failed.syncId,contextKey());
      return;
    }
    createContext='';ui.closeLayer('agent-single');showToast(creationMessage,skillsSaved?'success':'warning');RouteRuntime.refreshCurrent();
  }
  function openAgent(id){
    const row=agentByIdentity(id);if(!row||!mayManage(row))return;agentDetail={id,context:contextKey()};
    let relations=CloudCallData.agentSkills.filter(r=>r.identityId===id).map(r=>({...r,group:CloudCallData.physicalSkillGroups.find(g=>g.physicalGroupId===r.physicalGroupId)})).filter(r=>r.group&&r.group.tenantId===row.tenantId&&r.group.enterpriseId===row.enterpriseId&&AppState.authorizeObject('',r.group));
    relations=ui.sortByUpdated?.(relations)||relations;
    const basic=`<dl class="detail-grid"><dt>手机号</dt><dd>${esc(row.mobile||'—')}</dd><dt>所属租户</dt><dd>${esc(tenantName(row.tenantId))}</dd><dt>坐席工号</dt><dd>${esc(row.cno)}</dd><dt>区号</dt><dd>${esc(row.areaCode||'尚未取得')}</dd><dt>软电话分机号</dt><dd><span id="agent-softphone-value">${esc(phoneLabel(row))}</span>${row.lifecycleStatus==='已删除'?'':` <button class="btn-link" onclick="${command('openPhoneConfig',id)}">配置分机</button>`}</dd><dt>接收新任务</dt><dd>${row.acceptNewTasks?'允许':'禁止'}</dd></dl>`;
    const groups=relations.map(r=>{
      const g=r.group,reasons=[];
      if(r.status!=='已生效'||r.syncStatus!=='同步成功')reasons.push('成员配置尚未生效');
      if(g.status!=='已启用')reasons.push('技能未启用');
      if(row.lifecycleStatus!=='已启用'||row.acceptNewTasks===false)reasons.push('坐席未启用或不接收新任务');
      if(row.syncStatus!=='同步成功')reasons.push('坐席配置尚未成功');
      if(!row.callEnabled)reasons.push('坐席电话能力未启用');
      return `<section class="detail-section"><div class="detail-section-head"><h3><button class="table-link" onclick="window.Pages['agent-center'].openJoinedGroup('${esc(g.physicalGroupId)}')">${esc(g.name)}</button></h3><span>等级 ${esc(r.skillLevel)} · ${esc(r.status)}</span></div>${reasons.length?`<div class="detail-section-body"><p class="rr-muted">${reasons.map(esc).join('；')}</p></div>`:''}</section>`;
    }).join('')||ui.empty('暂未分配技能，可随时配置');
    const layerDetail={...agentDetail};
    ui.openLayer('agent-detail',`<div class="layer-header"><div><h2>${esc(row.userName)}</h2><p>${esc(activeLabel(listFields(row).active))} · ${esc(listFields(row).state)}</p></div><button onclick="PlatformUI.closeLayer('agent-detail')">×</button></div><div class="layer-body">${ui.detailSection('基本信息',basic)}${row.currentCall?ui.alert('warning','当前正在通话','可添加新技能并保存为待提交；停用、修改已有技能及提交新增技能须等待通话结束、完成话后处理并下线。'):''}${row.lifecycleStatus==='已启用'?`<p><button class="btn" onclick="window.Pages['agent-center'].openSkillAssign('${esc(id)}')">配置技能</button></p>`:''}${ui.detailSection('已加入技能',groups)}</div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer('agent-detail')">关闭</button></div>`,'wide',{objectKey:id,onRestore(){agentDetail={...layerDetail};}});
  }
  function openPhoneConfig(id){
    const row=agentByIdentity(id);if(!row||!mayManage(row)||row.lifecycleStatus==='已删除'||phoneSaving)return;
    const configured=phoneValue(row);if(!configured.ok)return showToast(configured.message,'warning');
    const choices=window.AliCtiExtensions?.choices(row)||{ok:false,rows:[],revision:-1,message:'分机目录尚未就绪，请先同步可用分机'};
    const rows=choices.ok&&Array.isArray(choices.rows)?choices.rows:[],offline=!AccountSeat.inUse(row),ready=offline&&choices.ok;
    const oldValue=configured.value==null?'':String(configured.value),currentAvailable=rows.some(item=>item.exten===oldValue);
    phoneDialog={id,context:contextKey(),expectedContext:configured.context,expectedRevision:configured.revision,expectedDirectoryRevision:choices.revision,expectedDirectoryContext:choices.context};
    const options='<option value=""'+(!oldValue?' selected':'')+'>暂不配置</option>'+(!currentAvailable&&oldValue?'<option value="'+esc(oldValue)+'" selected disabled>'+esc(oldValue)+'（原配置不可用，请重新选择）</option>':'')+rows.map(item=>'<option value="'+esc(item.exten)+'"'+(item.exten===oldValue?' selected':'')+'>'+esc(item.exten)+'</option>').join('');
    ui.openLayer('agent-phone-config',`<div class="layer-header"><div><h2>配置软电话分机</h2><p>${esc(row.userName)} · 工号 ${esc(row.cno)}</p></div><button aria-label="关闭" onclick="window.Pages['agent-center'].closePhoneConfig()">×</button></div><div class="layer-body"><p>选择本租户的可用软电话分机，坐席上线时自动使用。</p><label class="field"><span>软电话分机号</span><select id="agent-softphone-extension" ${ready?'':'disabled'}>${options}</select><small>每个分机只能供当前企业的一位坐席使用。选择“暂不配置”后，重新选择可用分机才能上线。</small></label>${!choices.ok?'<p class="rr-muted" role="status">'+esc(choices.message)+'</p>':!rows.length?'<p class="rr-muted" role="status">本租户暂无可选分机，请先在分机管理中创建或导入。</p>':''}${configured.eligible===false&&oldValue?'<p class="rr-muted" role="status">'+esc(configured.message)+'</p>':''}${offline?'':'<p class="rr-muted" role="status">坐席当前在线或状态待核对。请先结束通话并下线，再修改分机。</p>'}<p id="agent-phone-error" class="form-error" role="alert"></p></div><div class="layer-footer"><button class="btn" onclick="window.Pages['agent-center'].closePhoneConfig()">取消</button><button id="agent-phone-save" class="btn btn-primary" onclick="window.Pages['agent-center'].savePhoneConfig()" ${ready?'':'disabled'}>保存</button></div>`,'small',{objectKey:id});
  }
  function closePhoneConfig(){if(phoneSaving)return;phoneDialog=null;ui.closeLayer('agent-phone-config');}
  async function savePhoneConfig(){
    if(!phoneDialog||phoneSaving)return;
    const request=phoneDialog,row=agentByIdentity(request.id),node=document.getElementById('agent-softphone-extension');
    if(!node||request.context!==contextKey()||!row||!mayManage(row))return showToast('工作范围已变化，请重新打开分机配置','warning');
    const button=document.getElementById('agent-phone-save'),errorNode=document.getElementById('agent-phone-error');
    phoneSaving=true;if(button){button.disabled=true;button.textContent='保存中…';}node.disabled=true;
    let result;
    try{result=await SeatPhoneConfig.save(request.id,node.value,{expectedContext:request.expectedContext,expectedRevision:request.expectedRevision,expectedDirectoryRevision:request.expectedDirectoryRevision,expectedDirectoryContext:request.expectedDirectoryContext});}
    catch(_){result={ok:false,message:'分机配置未保存，请重试'};}
    phoneSaving=false;
    if(phoneDialog!==request||request.context!==contextKey())return;
    if(!result.ok){if(errorNode)errorNode.textContent=result.message;if(button){button.disabled=false;button.textContent='保存';}node.disabled=false;return;}
    closePhoneConfig();
    const list=document.querySelector('#page-content .agent-page');if(list)list.outerHTML=renderAgents();
    if(agentDetail?.id===request.id){const value=document.getElementById('agent-softphone-value');if(value)value.textContent=phoneLabel(row);}
    showToast(result.value?'软电话分机已保存，下次上线使用':'已清空分机配置，补齐后才能上线','success');
  }
  function openJoinedGroup(id){
    const agent=agentDetail&&agentByIdentity(agentDetail.id),group=CloudCallData.physicalSkillGroups.find(g=>g.physicalGroupId===id);
    if(!agent||agentDetail.context!==contextKey()||!mayManage(agent)||!group||!mayManage(group)||agent.tenantId!==group.tenantId||agent.enterpriseId!==group.enterpriseId||!CloudCallData.agentSkills.some(r=>r.identityId===agent.contactCenterIdentityId&&r.physicalGroupId===id))return showToast('当前权限或坐席分组已变化，请重新打开详情','warning');
    window.Pages['contact-center-settings']?.openGroup(id,{tab:'members'});
  }
  function disable(id,confirmed){
    const row=agentByIdentity(id);if(!row||!mayManage(row)||row.lifecycleStatus!=='已启用')return;
    if(AccountSeat.inUse(row))return showToast('请先结束通话、完成话后处理并下线，再停用坐席','warning');
    if(!confirmed){const context=contextKey();return ui.confirm({id:'agent-disable',title:'停用坐席',danger:true,body:'<p>停用后不可接收新任务。坐席须先下线；正在进行的通话不会由此操作挂断。</p>',confirmText:'确认停用',onConfirm(){if(context!==contextKey())return showToast('当前工作范围已变化，请重新打开页面','warning');disable(id,true);}});}
    if(!AliCtiDemo.seatActive(row,0))return;const next={...row,acceptNewTasks:false,lifecycleStatus:'已停用',updatedAt:new Date().toISOString()};
    next.agentStatus='离线';
    if(!AccountSeat.persistAgent(next))return;Object.assign(row,next);
    showToast('坐席已停用','success');
    CloudResourceRules.recount();CloudResourceRules.changed(row.tenantId);CloudCallRuntime.addAudit('停用坐席',id,row.tenantId,'已启用',row.lifecycleStatus);RouteRuntime.refreshCurrent();
  }
  function restore(id){const row=agentByIdentity(id);if(!row||!mayManage(row)||row.lifecycleStatus!=='已停用')return;if(!AliCtiDemo.seatActive(row,1))return;const next={...row,lifecycleStatus:'已启用',acceptNewTasks:true,syncStatus:'同步成功',updatedAt:new Date().toISOString()};if(!AccountSeat.persistAgent(next))return;Object.assign(row,next);CloudResourceRules.recount();CloudResourceRules.changed(row.tenantId);showToast('坐席配置已启用，请在工作台登录电话','success');RouteRuntime.refreshCurrent();}
  function remove(id){
    const row=agentByIdentity(id);if(!row||!mayManage(row)||row.lifecycleStatus==='已删除')return;
    if(AccountSeat.inUse(row)){showToast('请先结束通话、完成话后处理并下线，再删除坐席','warning');return;}
    const context=contextKey();ui.confirm({id:'agent-delete-confirm',title:'删除坐席',danger:true,confirmText:'确认删除',body:`<p>删除后不恢复历史配置；再次开通将按新坐席创建。通话与操作历史永久保留。</p><p><code>${esc(id)}</code></p>`,onConfirm(){
      if(context!==contextKey()||!mayManage(row)||AccountSeat.inUse(row))return showToast('当前权限或坐席使用状态已变化，请重新核对','warning');
      AliCtiAdapter.lastRequest={endpoint:'agent/delete',fields:{...AliCtiFields.authFields(row.enterpriseId).fields,cno:row.cno},mock:true};
      const next={...row,updatedAt:new Date().toISOString(),lifecycleStatus:'已删除',agentStatus:'离线',acceptNewTasks:false,callEnabled:false,accountId:'',accountBindingManaged:true,deletedAt:new Date().toISOString(),demoProviderAgentId:row.demoProviderAgentId||row.supplierAgentSnapshot?.id||row.providerAgentId||AliCtiDemo.resourceId('agent',row)};
      if(!AccountSeat.persistAgent(next,[]))return;Object.assign(row,next);CloudResourceRules.recount();CloudResourceRules.changed(row.tenantId);showToast('坐席已删除，历史记录保留','success');RouteRuntime.refreshCurrent();
    }});
  }
  let skillAssignContext='',skillAssignGroupId='',skillAssignIdentityId='';
  function openSkillAssign(identityId,groupOption){
    if(!identityId&&view==='skills'&&pageContext&&pageContext!==contextKey())return showToast('当前工作范围已变化，请重新打开成员页面','warning');
    const groupId=(typeof groupOption==='string'?groupOption:groupOption?.physicalGroupId)||(!identityId&&view==='skills'?skillScope.physicalGroupId:'');
    const fixedGroup=groupId&&CloudCallData.physicalSkillGroups.find(g=>g.physicalGroupId===groupId);
    if(groupId&&(!fixedGroup||!mayManage(fixedGroup)||fixedGroup.status!=='已启用'))return showToast('该技能不在当前可维护范围或尚未启用','warning');
    const agents=scoped(CloudCallData.agents).filter(a=>mayManage(a)&&a.lifecycleStatus==='已启用'&&(!fixedGroup||(a.tenantId===fixedGroup.tenantId&&a.enterpriseId===fixedGroup.enterpriseId))&&(!fixedGroup||identityId||!CloudCallData.agentSkills.some(r=>r.identityId===a.contactCenterIdentityId&&r.physicalGroupId===groupId)));
    const selected=identityId?agents.find(a=>a.contactCenterIdentityId===identityId):agents[0];if(!selected)return showToast('暂无可添加的已启用坐席；已有成员可直接调整等级','warning');
    skillAssignContext=contextKey();skillAssignGroupId=fixedGroup?groupId:'';skillAssignIdentityId=identityId||'';
    ui.openLayer('skill-assign',`<div class="layer-header"><div><h2>${identityId?'配置技能':'添加已有坐席'}</h2><p>${fixedGroup?esc(fixedGroup.name)+' · '+esc(tenantName(fixedGroup.tenantId)):identityId?esc(selected.userName)+' · 工号 '+esc(selected.cno):'选择坐席，可一次勾选多个技能'}</p></div><button aria-label="关闭添加坐席分组" onclick="PlatformUI.closeLayer('skill-assign')">×</button></div><div class="layer-body"><div class="form-grid"><label class="field"><span>坐席</span><select id="assignAgent" ${identityId?'disabled':''} onchange="window.Pages['agent-center'].filterAssignGroups()">${agents.map(a=>`<option value="${esc(a.contactCenterIdentityId)}" ${a===selected?'selected':''}>${esc(a.userName)} · ${esc(a.mobile||tenantName(a.tenantId))}</option>`).join('')}</select></label><label class="field"><span>本次新增技能等级</span><input id="assignLevel" type="number" min="1" max="10" step="1" value="1"><small class="field-hint">1–10 的整数，数值越小越优先；已有技能等级保持不变。在线或通话中添加将先保存，坐席下线后由管理员提交。</small></label><div class="field full"><span id="assignGroupsLabel">${fixedGroup?'当前技能':'技能（可多选）'}</span><div id="assignGroups" class="rr-skill-options" role="group" aria-labelledby="assignGroupsLabel" aria-describedby="assignGroupsHint"></div><small id="assignGroupsCount" class="field-hint" aria-live="polite"></small><small id="assignGroupsHint" class="field-hint">${fixedGroup?'添加到当前技能，已有其他技能关联保留。':'已关联项会保留；如需移出，请前往对应技能的成员列表。'}</small></div></div></div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer('skill-assign')">取消</button><button class="btn btn-primary" onclick="window.Pages['agent-center'].saveSkill()">保存</button></div>`,'small');
    filterAssignGroups();
  }
  function saveSkill(){
    const agent=agentByIdentity(skillAssignIdentityId||document.getElementById('assignAgent')?.value),level=document.getElementById('assignLevel')?.value;
    if(skillAssignContext!==contextKey()||!agent||!mayManage(agent)||agent.lifecycleStatus!=='已启用')return showToast('当前权限或坐席范围已变化，请重新打开','warning');
    if(!AliCtiFields.validSkillLevel(level))return showToast('技能等级须为1–10的整数','warning');
    const selected=[...document.querySelectorAll('#assignGroups input:checked')].filter(input=>input.dataset.linked!=='true').map(input=>input.value);
    if(!selected.length)return showToast('请选择本次需要新增的技能','warning');
    const groups=selected.map(id=>CloudCallData.physicalSkillGroups.find(g=>g.physicalGroupId===id));
    if(groups.some(g=>!g||!mayManage(g)||g.status!=='已启用'||g.tenantId!==agent.tenantId||g.enterpriseId!==agent.enterpriseId||(skillAssignGroupId&&g.physicalGroupId!==skillAssignGroupId)))return showToast('所选技能已变化，请重新选择','warning');
    const existing=CloudCallData.agentSkills.filter(r=>r.identityId===agent.contactCenterIdentityId).map(r=>({...r}));
    for(const g of groups)if(!existing.some(r=>r.physicalGroupId===g.physicalGroupId))existing.push({relationId:CloudResourceRules.id('REL'),identityId:agent.contactCenterIdentityId,physicalGroupId:g.physicalGroupId,skillLevel:Number(level),status:'已生效',syncStatus:'同步成功'});
    if(!AliCtiDemo.saveSkills(agent,existing))return;
    CloudResourceRules.recount();CloudResourceRules.changed(agent.tenantId);ui.closeLayer('skill-assign');showToast(CloudCallData.agentSkills.some(r=>r.identityId===agent.contactCenterIdentityId&&r.syncStatus==='待提交')?'新增技能已保存待提交，请在坐席下线后提交':'技能关联已保存','success');RouteRuntime.refreshCurrent();
  }
  function submitPendingSkills(id){
    const row=CloudCallData.agentSkills.find(r=>r.relationId===id);
    if(!mayChangeRelation(row)||row.syncStatus!=='待提交')return showToast('当前权限或技能配置已变化，请刷新后重试','warning');
    const agent=agentByIdentity(row.identityId),relations=CloudCallData.agentSkills.filter(r=>r.identityId===row.identityId);
    if(agent.lifecycleStatus!=='已启用')return showToast('请先启用坐席，再提交新增技能','warning');
    if(AccountSeat.inUse(agent))return showToast('配置已保存，请等待坐席结束通话、完成话后处理并下线后提交','warning');
    if(relations.some(r=>{const g=CloudCallData.physicalSkillGroups.find(g=>g.physicalGroupId===r.physicalGroupId);return !g||!mayManage(g)||(r.syncStatus==='待提交'&&g.status!=='已启用');}))return showToast('技能状态或权限已变化，请核对后提交','warning');
    if(!AliCtiDemo.saveSkills(agent,relations))return;
    CloudResourceRules.recount();CloudResourceRules.changed(agent.tenantId);showToast('新增技能已提交','success');navigateSkills();
  }
  function mayChangeRelation(row){
    const agent=row&&agentByIdentity(row.identityId),group=row&&CloudCallData.physicalSkillGroups.find(g=>g.physicalGroupId===row.physicalGroupId);
    return !!(agent&&group&&mayManage(agent)&&mayManage(group)&&agent.lifecycleStatus!=='已删除'&&agent.tenantId===group.tenantId&&agent.enterpriseId===group.enterpriseId&&(!pageContext||pageContext===contextKey())&&(!skillScope.physicalGroupId||row.physicalGroupId===skillScope.physicalGroupId)&&(!skillScope.tenantId||agent.tenantId===skillScope.tenantId));
  }
  function changeLevel(id,value){
    const row=CloudCallData.agentSkills.find(r=>r.relationId===id),level=Number(value);
    if(!mayChangeRelation(row))return showToast('当前权限或技能范围已变化，请重新打开页面','warning');
    if(!AliCtiFields.validSkillLevel(value)){showToast('技能等级须为1–10的整数','warning');navigateSkills();return;}
    const agent=agentByIdentity(row.identityId);
    if(CloudCallData.agentSkills.some(r=>r.identityId===row.identityId&&r!==row&&!AliCtiFields.validSkillLevel(r.skillLevel)))return openSkillRepair(row.identityId,id,level);
    const relations=CloudCallData.agentSkills.filter(r=>r.identityId===row.identityId).map(r=>r===row?{...r,skillLevel:level,syncStatus:'同步成功'}:{...r});
    if(!AliCtiDemo.saveSkills(agent,relations)){navigateSkills();return;}CloudResourceRules.changed(agent.tenantId);showToast(`技能等级已调整为 ${level}`,'success');navigateSkills();
  }
  let repair=null;
  function openSkillRepair(identityId,changedId,level){
    const agent=agentByIdentity(identityId);if(!agent||!mayManage(agent)||AccountSeat.inUse(agent))return showToast('请先下线再调整技能等级','warning');
    const relations=CloudCallData.agentSkills.filter(r=>r.identityId===identityId);
    repair={identityId,context:contextKey(),relations:relations.map(r=>({...r}))};
    ui.openLayer('skill-repair',`<div class="layer-header"><div><h2>调整历史技能等级</h2><p>${esc(agent.userName)} · 请将各项等级调整为 1–10</p></div><button aria-label="关闭" onclick="PlatformUI.closeLayer('skill-repair')">×</button></div><div class="layer-body"><p>存在旧范围的技能等级。请一并核对后保存，原配置在保存成功前保留。</p><div class="form-grid">${relations.map((r,i)=>`<label class="field"><span>${esc(CloudCallData.physicalSkillGroups.find(g=>g.physicalGroupId===r.physicalGroupId)?.name||'技能')}（原等级 ${esc(r.skillLevel)}）</span><input id="repair-level-${i}" type="number" min="1" max="10" step="1" value="${esc(r.relationId===changedId?level:r.skillLevel)}"></label>`).join('')}</div></div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer('skill-repair')">取消</button><button class="btn btn-primary" onclick="window.Pages['agent-center'].saveSkillRepair()">保存全部等级</button></div>`,'small');
  }
  function saveSkillRepair(){
    if(!repair||repair.context!==contextKey())return showToast('工作范围已变化，请重新打开','warning');
    const agent=agentByIdentity(repair.identityId),current=CloudCallData.agentSkills.filter(r=>r.identityId===repair.identityId);
    if(!agent||!mayManage(agent)||JSON.stringify(current)!==JSON.stringify(repair.relations))return showToast('技能配置已变化，请重新核对','warning');
    const values=current.map((_,i)=>document.getElementById('repair-level-'+i)?.value);
    if(values.some(v=>!AliCtiFields.validSkillLevel(v)))return showToast('每项等级都须为1–10的整数','warning');
    if(!AliCtiDemo.saveSkills(agent,current.map((r,i)=>({...r,skillLevel:Number(values[i])}))))return;
    ui.closeLayer('skill-repair');repair=null;CloudResourceRules.recount();CloudResourceRules.changed(agent.tenantId);showToast('全部技能等级已保存','success');RouteRuntime.refreshCurrent();
  }
  function unassign(id,confirmed,context){
    const row=CloudCallData.agentSkills.find(r=>r.relationId===id);
    if(!mayChangeRelation(row)||(confirmed&&context!==contextKey()))return showToast('当前权限或技能范围已变化，请重新打开页面','warning');
    if(!confirmed){const captured=contextKey();return ui.confirm({id:'skill-remove',title:'移出技能',danger:true,body:'<p>移出后，该坐席将不再接收此技能的新呼叫；其他技能和历史记录保留。</p>',confirmText:'确认移出',onConfirm(){unassign(id,true,captured);}});}
    const agent=agentByIdentity(row.identityId);
    if(!AliCtiDemo.saveSkills(agent,CloudCallData.agentSkills.filter(r=>r.identityId===row.identityId&&r.relationId!==id)))return;
    CloudResourceRules.recount();CloudResourceRules.changed(agent.tenantId);showToast('坐席已移出技能','success');navigateSkills();
  }
  function retry(id,key){
    if(key&&key!==contextKey())return;
    const row=CloudCallData.syncRecords.find(x=>x.syncId===id);
    if(!mayReadRecord(row)||!mayCorrectRecord(row))return;
    openSingle(id,contextKey());
  }
  function refreshSyncList(){
    if(RouteRuntime.snapshot()?.key!=='sync-records')return;
    const input=document.getElementById('syncKeyword')?.value,status=document.getElementById('syncStatus')?.value;
    RouteRuntime.refreshCurrent();
    if(input!==undefined)document.getElementById('syncKeyword').value=input;
    if(status!==undefined)document.getElementById('syncStatus').value=status;
  }
  function syncRecordContent(row){
    const key=contextKey(),issue=CloudCallData.exceptions.find(x=>x.objectId===row.objectId&&x.tenantId===row.tenantId&&x.enterpriseId===(row.enterpriseId||CloudCallRuntime.tenant(row.tenantId)?.enterpriseId));
    const history=row.repairHistory||[],created=row.createdIdentityId&&agentByIdentity(row.createdIdentityId);
    const next=row.status==='成功'?'':mayCorrectRecord(row)?'请修改坐席资料后重新提交；已有坐席不受影响。':/超时|未知|未确认/.test(row.latestResult||row.failureReason||'')?'本次操作未取得明确的处理结果。请先核对现有配置或联系服务方，避免重复新增。':'请根据原因核对配置，再进行相应调整。';
    const basic=`<dl class="detail-grid"><dt>坐席 / 对象</dt><dd>${esc(row.objectName)}</dd><dt>所属租户</dt><dd>${esc(tenantName(row.tenantId))}</dd><dt>配置类型</dt><dd>${esc(configurationName(row))}</dd><dt>处理结果</dt><dd>${ui.status(row.status)}</dd><dt>再次提交次数</dt><dd>${esc(row.retryCount||0)}</dd><dt>更新时间</dt><dd>${esc(row.updatedAt)}</dd>${created?`<dt>已新增坐席</dt><dd>${esc(created.userName)}（工号 ${esc(created.cno)}）</dd>`:''}</dl>`;
    const entries=history.length?history:(issue?.trace||[]);
    return `<div class="layer-header"><div><h2>坐席配置记录详情</h2><p>${esc(configurationName(row))} · ${esc(row.objectName)}</p></div><button aria-label="关闭" onclick="PlatformUI.closeLayer('sync-record-detail')">×</button></div><div class="layer-body">${ui.detailSection('配置记录',basic)}${ui.detailSection('处理说明',`<p>${esc(recordReason(row))}</p>${next?`<p>${esc(next)}</p>`:''}`)}${row.failureReason&&friendlyReason(row.failureReason)!==recordReason(row)?ui.detailSection('最初未完成的原因',`<p>${esc(friendlyReason(row.failureReason))}</p>`):''}${entries.length?ui.detailSection('处理记录',ui.timeline(entries.map(item=>({title:friendlyReason(item.action),time:item.at,detail:friendlyReason(item.result)})))):''}</div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer('sync-record-detail')">关闭</button>${mayCorrectRecord(row)?`<button class="btn btn-primary" onclick="${command('retry',row.syncId,key)}">修改资料</button>`:''}</div>`;
  }
  function refreshSyncRecord(){
    const node=document.getElementById('sync-record-detail');if(!node)return;
    const row=CloudCallData.syncRecords.find(r=>r.syncId===node.dataset.recordId);
    if(node.dataset.recordContext!==contextKey()||!mayReadRecord(row))return ui.closeLayer('sync-record-detail');
    const template=document.createElement('template');template.innerHTML=syncRecordContent(row);
    // Refresh content in place so a child form keeps its position in the drawer stack.
    for(const selector of ['.layer-body','.layer-footer']){
      const old=node.querySelector(selector),next=template.content.querySelector(selector);if(!old||old.isEqualNode(next))continue;
      const scroll=old.scrollTop;old.replaceWith(next);next.scrollTop=scroll;
    }
  }
  function openSyncRecord(id,key){
    if(key&&key!==contextKey())return;
    const row=CloudCallData.syncRecords.find(x=>x.syncId===id);if(!mayReadRecord(row))return;
    const existing=document.getElementById('sync-record-detail');
    if(existing?.dataset.recordId===id&&existing.dataset.recordContext===contextKey()){refreshSyncRecord();return;}
    ui.openLayer('sync-record-detail',syncRecordContent(row),'wide',{objectKey:id,onRestore:refreshSyncRecord});
    const node=document.getElementById('sync-record-detail');node.dataset.recordId=id;node.dataset.recordContext=contextKey();
  }

  function filterAssignGroups(){
    const agent=agentByIdentity(skillAssignIdentityId||document.getElementById('assignAgent')?.value);
    const node=document.getElementById('assignGroups');if(!node)return;
    if(skillAssignContext!==contextKey()||!agent||!mayManage(agent)||agent.lifecycleStatus!=='已启用'){
      node.innerHTML='<p class="rr-skill-empty">当前坐席或工作范围已变化，请重新打开。</p>';updateSkillSelection();return;
    }
    const linked=new Set(CloudCallData.agentSkills.filter(r=>r.identityId===agent.contactCenterIdentityId).map(r=>r.physicalGroupId));
    const groups=scoped(CloudCallData.physicalSkillGroups).filter(g=>mayManage(g)&&g.tenantId===agent.tenantId&&g.enterpriseId===agent.enterpriseId&&(g.status==='已启用'||linked.has(g.physicalGroupId))&&(!skillAssignGroupId||g.physicalGroupId===skillAssignGroupId));
    node.innerHTML=groups.map(g=>{
      const existing=linked.has(g.physicalGroupId),fixed=g.physicalGroupId===skillAssignGroupId;
      return `<label class="rr-skill-option"><input type="checkbox" name="assignGroups" value="${esc(g.physicalGroupId)}" aria-label="${esc(g.name)}" data-linked="${existing}" ${existing||fixed?'checked disabled':''} onchange="window.Pages['agent-center'].updateSkillSelection()"><span class="rr-skill-name">${esc(g.name)}${g.status!=='已启用'?`<small>${esc(g.status)}</small>`:''}</span>${existing?'<span class="rr-skill-badge">已关联</span>':fixed?'<span class="rr-skill-badge">当前技能</span>':''}</label>`;
    }).join('')||'<p class="rr-skill-empty">该租户暂无可关联的已启用技能。</p>';
    updateSkillSelection();
  }
  function updateSkillSelection(){
    const node=document.getElementById('assignGroupsCount');if(!node)return;
    const selected=[...document.querySelectorAll('#assignGroups input:checked')],linked=selected.filter(input=>input.dataset.linked==='true').length;
    node.textContent=`已选 ${selected.length} 个（已关联 ${linked} 个，本次新增 ${selected.length-linked} 个）`;
  }
  function navigateSkills(){navigateTo('agent-skills',{...skillScope});}
  function backToGroup(){const group=CloudCallData.physicalSkillGroups.find(g=>g.physicalGroupId===skillScope.physicalGroupId);if(pageContext!==contextKey()||!group||!mayManage(group))return;window.Pages['contact-center-settings']?.openGroup(group.physicalGroupId,{tab:'members'});}
  function navigateList(key){if(key==='skills')navigateSkills();else navigateTo(routeFor(key));}
  function routeFor(key){return key==='skills'?'agent-skills':key==='sync'?'sync-records':'agent-maintenance';}
  function query(key){filters[key].keyword=document.getElementById(`${key}Keyword`)?.value||'';filters[key].status=document.getElementById(`${key}Status`)?.value||'全部状态';pages[key]=1;navigateList(key);}
  function resetFilters(key){filters[key]={keyword:'',status:'全部状态'};pages[key]=1;navigateList(key);}
  function setPage(key,value){pages[key]=Math.max(1,Number(value)||1);navigateList(key);}
  function refresh(key){showToast('数据已刷新','success');navigateList(key);}
  function captureNavigationState(){return {view,pageContext,skillScope:{...skillScope},agentDetail:agentDetail&&{...agentDetail},filters:structuredClone(filters),pages:{...pages},createContext,retrySyncId,createRequestId,skillAssignContext,skillAssignGroupId,skillAssignIdentityId,repair};}
  function restoreNavigationState(state){if(!state)return;({view,pageContext,skillScope,agentDetail,createContext,retrySyncId,createRequestId,skillAssignContext,skillAssignGroupId,skillAssignIdentityId,repair}=state);Object.assign(filters,structuredClone(state.filters));Object.assign(pages,state.pages);}
  window.Pages=window.Pages||{};window.Pages['agent-center']={render,captureNavigationState,restoreNavigationState,init(){},openSingle,renderNewAgentSkills,createSingle,buildAgent,openPhoneConfig,closePhoneConfig,savePhoneConfig,filterAssignGroups,updateSkillSelection,openAgent,openJoinedGroup,backToGroup,disable,restore,remove,openSkillAssign,saveSkill,submitPendingSkills,changeLevel,openSkillRepair,saveSkillRepair,unassign,retry,openSyncRecord,query,resetFilters,setPage,refresh};
})();
