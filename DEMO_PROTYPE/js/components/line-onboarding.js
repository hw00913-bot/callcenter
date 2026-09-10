/** 线路来源与号码接入：所有提交均为本地演示，不访问云端。 */
(function () {
  'use strict';
  const ui=PlatformUI, esc=ui.escape;
  const labels={ALI_CCC:'阿里 CCC 已开通资源',ALI_VOICE:'阿里语音服务号码',EXTERNAL:'外部供应商线路'};
  let filter='ALL', keyword='', page=1, editContext='', importContext='';
  const pool=()=>CloudCallData.numberIntakePool;
  const jobs=()=>CloudCallData.numberImportJobs;
  const context=()=>{const s=AppState.get();return [s.accountId,s.sessionId,s.instanceId,s.activeDomain].join('|');};
  const can=()=>AppState.effectiveAccess().valid&&AppState.isSuper()&&AppState.get().activeDomain==='CLOUD_CONTACT_CENTER'&&AppState.canMenu('resources.numbers');
  const line=id=>CloudCallData.lines.find(r=>r.lineId===id);
  const inScope=r=>!!r&&(r.instanceIds||[]).includes(AppState.get().instanceId);
  const allowed=r=>can()&&inScope(r);
  const value=id=>document.getElementById(id)?.value.trim()||'';
  const field=(id,title,v='',readonly=false)=>`<label class="field"><span>${title}</span><input id="${id}" value="${esc(v)}" ${readonly?'readonly':''}></label>`;
  function renderLines(){
    const rows=CloudCallData.lines.filter(r=>inScope(r)&&(filter==='ALL'||r.sourceType===filter)&&(!keyword||[r.name,r.provider].join(' ').includes(keyword)));
    page=Math.max(1,Math.min(page,Math.ceil(rows.length/8)||1));
    return `<section class="platform-page">${ui.pageHeader('线路管理','按来源管理开通进度；号码用途与使用范围在号码管理中设置。')}
      <div class="filter-panel"><label class="field grow"><span>线路 / 供应商</span><input id="lineSearch" value="${esc(keyword)}" placeholder="输入名称"></label><label class="field"><span>线路来源</span><select id="lineSourceFilter"><option value="ALL">全部来源</option>${Object.entries(labels).map(([k,v])=>`<option value="${k}" ${filter===k?'selected':''}>${v}</option>`).join('')}</select></label><div class="filter-actions"><button class="btn" onclick="LineOnboarding.query(true)">重置</button><button class="btn btn-primary" onclick="LineOnboarding.query()">查询</button></div></div>
      <div class="management-list-shell">${ui.toolbar('<button class="btn btn-primary" onclick="LineOnboarding.openLine()">登记线路</button><button class="btn" onclick="LineOnboarding.openNumbers()">添加号码</button>',ui.help('CCC 已开通资源不填写第三方网络参数；阿里语音服务和外部线路需先确认开通及首次导入加白。并发额度来自供应商，不由本页面扩容。'))}${ui.table([
        {key:'name',label:'线路名称'}, {key:'sourceType',label:'线路来源',render:v=>esc(labels[v]||'待确认')}, {key:'provider',label:'供应商'},
        {key:'concurrentLimit',label:'供应商并发额度',render:v=>v?`${v}（样例）`:'待供应商确认'},
        {key:'sourceType',label:'接入办理',render:(v,r)=>esc(v==='ALI_CCC'?'阿里侧开通':r.importAllowlisted?'首次导入已加白（演示）':'联系售后完成首次导入加白')},
        {key:'status',label:'线路状态',render:v=>ui.status(v)},
        {key:'lineId',label:'操作',render:id=>`<div class="table-actions"><button onclick="LineOnboarding.openLine('${id}')">查看</button><button onclick="LineOnboarding.openNumbers('${id}')">添加号码</button></div>`}
      ],rows.slice((page-1)*8,page*8))}${ui.pagination(rows.length,page,8,'LineOnboarding.setPage')}</div></section>`;
  }
  function query(reset){filter=reset?'ALL':value('lineSourceFilter');keyword=reset?'':value('lineSearch');page=1;navigateTo('lines');}
  function setPage(n){page=n;navigateTo('lines');}
  function openLine(id){
    if(!can())return;const r=line(id);if(id&&!allowed(r))return;editContext=context();
    const type=r?.sourceType||'EXTERNAL', managed=type==='ALI_CCC';
    const basic=`<div class="form-grid">${field('onLineName','线路名称 *',r?.name||'')}${field('onProvider','供应商 / 线路信息 *',r?.provider||'')}<label class="field"><span>线路来源 *</span><select id="onSource" ${r?'disabled':''}>${Object.entries(labels).filter(([k])=>r||k!=='ALI_CCC').map(([k,v])=>`<option value="${k}" ${type===k?'selected':''}>${v}</option>`).join('')}</select></label>${field('onQuota','供应商并发额度',r?.concurrentLimit?`${r.concurrentLimit}（演示值）`:'待供应商确认',true)}</div>`;
    const progress=managed?'<dl class="detail-grid"><dt>开通方式</dt><dd>由阿里侧提供已开通资源</dd><dt>下一步</dt><dd>选择号码，加入当前客户/品牌，再设置用途与租户授权</dd></dl>':`<dl class="detail-grid"><dt>首次导入加白</dt><dd>${r?.importAllowlisted?'已完成（演示记录）':'待联系 CCC 售后技术支持'}</dd><dt>号码导入</dt><dd>在“添加号码”提交号码资料</dd><dt>路由开通</dt><dd>${r?.routingConfirmed?'已确认（演示记录）':'待供应商 / 阿里技术支持确认'}</dd><dt>业务验证</dt><dd>${esc(r?.pocStatus||'未开始')}</dd></dl>`;
    const tech=managed?'':`<details class="technical-details"><summary>对接说明</summary><p>${type==='ALI_VOICE'?'需完成语音服务协议及开通，导入后按官方指引提交路由工单。':'外部线路需双方完成网络及路由对接；登记资料不表示线路已接通。'}</p><p>首次调用 ImportCorpNumbers 前须由 CCC 售后加白；不在浏览器保存 SIP 密码、AccessKey 或固定集群 IP。</p></details>`;
    ui.openLayer('line-onboarding',`<div class="layer-header"><h2>${r?'线路详情':'登记线路'}</h2><button onclick="PlatformUI.closeLayer('line-onboarding')">×</button></div><div class="layer-body">${ui.detailSection('基本信息',basic)}${ui.detailSection('开通进度',progress)}${tech}<div id="onLineError" aria-live="polite"></div></div><div class="layer-footer"><span class="layer-footer-note">本地演示；保存不改变供应商开通状态</span><button class="btn" onclick="PlatformUI.closeLayer('line-onboarding')">取消</button><button class="btn btn-primary" onclick="LineOnboarding.saveLine('${id||''}')">保存资料</button></div>`,'wide');
  }
  function saveLine(id){
    if(!can()||editContext!==context())return;let r=line(id);if(id&&!allowed(r))return;
    const name=value('onLineName'),provider=value('onProvider'),type=r?.sourceType||value('onSource');
    if(!name||!provider||!labels[type])return showToast('请填写线路名称、供应商和来源','warning');
    if(CloudCallData.lines.some(x=>inScope(x)&&x.lineId!==id&&x.name===name))return showToast('线路名称已存在','warning');
    if(!r){r={lineId:CloudResourceRules.id('LINE'),instanceIds:[AppState.get().instanceId],sourceType:type,concurrentLimit:null,status:'待加白',importAllowlisted:false,routingConfirmed:false,ipWhitelist:'待提交',dtmf:'未验证',failover:'未验证',pocStatus:'未开始',acceptanceStatus:'待开通'};CloudCallData.lines.push(r);}
    Object.assign(r,{name,provider});CloudCallRuntime.addAudit('登记线路资料',r.lineId,'','原资料','已保存（本地演示）');ui.closeLayer('line-onboarding');navigateTo('lines');
  }
  // One business submission; cloud-side steps remain separate and traceable.
  let wizard=null;
  const batches=()=>CloudCallData.numberOnboardingBatches;
  const demo=()=>CloudCallData.numberOnboardingDemo;
  function parseNumbers(raw){const arr=raw.split(/[\s,，;；]+/).filter(Boolean);if(!arr.length||arr.some(n=>!/^\d{7,15}$/.test(n)))throw Error('请输入完整号码，每行一个，不使用星号或其他符号');if(new Set(arr).size!==arr.length)throw Error('同批号码重复，请去重后提交');return arr;}
  const available=r=>pool().filter(p=>p.lineId===r.lineId&&!p.assignedInstanceId&&p.state==='已在号码池确认'&&!batches().some(b=>b.items.some(i=>i.number===p.number&&i.status!=='添加失败'&&i.status!=='已添加')));
  const scoped=b=>b&&b.instanceId===AppState.get().instanceId&&allowed(line(b.lineId));
  function close(){wizard=null;ui.closeLayer('number-onboarding');}
  function openNumbers(id){
    if(!can()||(id&&!allowed(line(id))))return;
    if(wizard?.batch?.running)return;
    importContext=context();
    wizard={step:1,lineId:id||'',mode:'new',raw:'',province:'',city:'',corp:'',selected:[],usage:'Inbound',flow:'',batch:null};
    renderWizard();
  }
  function renderWizard(){
    if(!wizard||importContext!==context()||!can())return;
    const w=wizard,r=line(w.lineId),direct=r?.sourceType==='ALI_CCC',brand=CloudCallRuntime.instance(AppState.get().instanceId)?.brandCustomerName||'当前品牌';
    let body='',footer='';
    if(w.batch){renderResult();return;}
    if(w.step===1){
      body=`<div class="form-grid">${field('wizardBrand','添加至客户 / 品牌',brand,true)}<label class="field"><span>号码来源 *</span><select id="intakeLine"><option value="">请选择已登记的线路</option>${CloudCallData.lines.filter(inScope).map(x=>`<option value="${x.lineId}" ${x.lineId===w.lineId?'selected':''}>${esc(x.name)} · ${esc(labels[x.sourceType])}</option>`).join('')}</select></label></div>`;
    }else if(w.step===2){
      const existing=available(r);
      body=`<div class="number-wizard-context">${esc(r.name)} · ${esc(brand)}</div>`;
      if(!direct)body+=`<div class="number-wizard-tabs"><button class="btn ${w.mode==='new'?'btn-primary':''}" onclick="LineOnboarding.changeMode('new')">填写新号码</button><button class="btn ${w.mode==='existing'?'btn-primary':''}" onclick="LineOnboarding.changeMode('existing')">选择已有号码（${existing.length}）</button></div>`;
      if(direct||w.mode==='existing'){
        body+=existing.length?`<div class="number-choice-list">${existing.map(p=>`<label class="number-choice"><input type="checkbox" name="wizardNumber" value="${p.id}" ${w.selected.includes(p.id)?'checked':''}><span>${esc(p.number)}</span><small>${esc([p.province,p.city].filter(Boolean).join(' · '))}</small></label>`).join('')}</div>`:'<p class="empty-text">暂无可添加的号码</p>';
      }else{
        body+=!r.importAllowlisted?ui.alert('warning','该线路暂不能添加新号码','请先联系阿里售后完成首次接入办理。'):'';
        body+=`<div class="form-grid"><label class="field full"><span>号码 * ${ui.help('每行一个；同批号码使用同一省市。不同归属地请分批添加。')}</span><textarea id="intakeNumbers" rows="5" placeholder="每行输入一个完整号码">${esc(w.raw)}</textarea></label>${field('intakeProvince',r.sourceType==='ALI_VOICE'?'省份 *':'省份',w.province)}${field('intakeCity',r.sourceType==='ALI_VOICE'?'城市 *':'城市',w.city)}${field('intakeCorp','企业名称',w.corp)}</div>`;
      }
    }else{
      const nums=wizardNumbers(),has400=nums.some(n=>n.startsWith('400'));
      if(has400)w.usage='Inbound';
      const flows=CloudCallData.contactFlows.filter(f=>f.instanceId===AppState.get().instanceId&&f.status==='已发布'&&String(f.usage).startsWith('呼入'));
      body=`<dl class="detail-grid"><dt>客户 / 品牌</dt><dd>${esc(brand)}</dd><dt>所属线路</dt><dd>${esc(r.name)}</dd><dt>本次添加</dt><dd>${nums.length} 个号码</dd></dl><div class="number-wizard-summary">${nums.map(n=>`<span>${esc(n)}</span>`).join('')}</div><div class="form-grid"><label class="field"><span>号码用途 * ${has400?ui.help('本批包含400号码，只能用于呼入。如其他号码需要呼出，请分批添加。'):''}</span><select id="attachUsage" onchange="LineOnboarding.usageChanged()"><option value="Inbound" ${w.usage==='Inbound'?'selected':''}>仅呼入</option>${has400?'':`<option value="Outbound" ${w.usage==='Outbound'?'selected':''}>仅呼出</option><option value="Bidirection" ${w.usage==='Bidirection'?'selected':''}>呼入和呼出</option>`}</select></label><label class="field"><span>呼入语音流程 ${ui.help('可稍后配置；添加完成后仍需授权租户、配置业务并验证线路，才可投入使用。')}</span><select id="attachFlow" ${w.usage==='Outbound'?'disabled':''}><option value="">稍后配置</option>${flows.map(f=>`<option value="${f.contactFlowId}" ${w.flow===f.contactFlowId?'selected':''}>${esc(f.name)}</option>`).join('')}</select></label></div>`;
    }
    footer=`<button class="btn" onclick="LineOnboarding.close()">取消</button>${w.step>1?'<button class="btn" onclick="LineOnboarding.back()">上一步</button>':''}<button class="btn btn-primary" onclick="LineOnboarding.next()">${w.step===3?'确认添加':'下一步'}</button>`;
    draw(body,footer,w.step);
  }
  function draw(body,footer,step){
    ui.openLayer('number-onboarding',`<div class="layer-header"><h2>${wizard?.batch?'添加结果':'添加号码'}</h2><button onclick="LineOnboarding.close()">×</button></div><div class="layer-body number-wizard"><ol class="number-wizard-steps">${['选择来源','选择或填写号码','设置用途并确认'].map((t,i)=>`<li class="${step===i+1?'active':step>i+1?'done':''}"><span>${i+1}</span>${t}</li>`).join('')}</ol>${body}</div><div class="layer-footer"><span class="layer-footer-note">本地演示，不提交真实请求</span>${footer}</div>`,'wide');
  }
  function remember(){
    const w=wizard;if(!w)return;
    if(w.step===2){if(line(w.lineId)?.sourceType==='ALI_CCC'||w.mode==='existing')w.selected=Array.from(document.querySelectorAll('input[name="wizardNumber"]:checked')).map(el=>el.value);else{w.raw=value('intakeNumbers');w.province=value('intakeProvince');w.city=value('intakeCity');w.corp=value('intakeCorp');}}
    if(w.step===3){w.usage=value('attachUsage');w.flow=w.usage==='Outbound'?'':value('attachFlow');}
  }
  function wizardNumbers(){return wizard.mode==='existing'?wizard.selected.map(id=>pool().find(p=>p.id===id)?.number).filter(Boolean):parseNumbers(wizard.raw);}
  function changeMode(mode){if(!wizard||!['new','existing'].includes(mode))return;remember();wizard.mode=mode;renderWizard();}
  function back(){if(!wizard||wizard.batch)return;remember();wizard.step--;renderWizard();}
  function next(){
    const w=wizard;if(!w||w.batch||importContext!==context()||!can())return;
    if(w.step===1){w.lineId=value('intakeLine');const r=line(w.lineId);if(!allowed(r))return showToast('请选择号码所属线路','warning');w.mode=r.sourceType==='ALI_CCC'?'existing':'new';w.selected=[];w.step=2;renderWizard();return;}
    remember();const r=line(w.lineId);if(!allowed(r))return;
    if(w.step===2){
      if(w.mode==='new'&&!r.importAllowlisted)return showToast('请先完成该线路首次接入办理','warning');
      let nums;try{nums=wizardNumbers();}catch(e){return showToast(e.message,'warning');}
      if(!nums.length)return showToast('请至少选择一个号码','warning');
      if(w.mode==='existing'&&w.selected.some(id=>!available(r).some(p=>p.id===id)))return showToast('部分号码已不可添加，请重新选择','warning');
      if(w.mode==='new'&&nums.some(n=>pool().some(p=>p.number===n)||CloudCallData.phoneNumbers.some(p=>p.number===n)||batches().some(b=>b.items.some(i=>i.number===n&&!['添加失败'].includes(i.status)))))return showToast('号码已存在或正在办理，请在添加记录中查看，或选择已有号码','warning');
      if(w.mode==='new'&&r.sourceType==='ALI_VOICE'&&(!w.province||!w.city))return showToast('请填写号码归属省份和城市','warning');
      w.step=3;renderWizard();return;
    }
    if(!['Inbound','Outbound','Bidirection'].includes(w.usage))return;
    const nums=wizardNumbers();if(nums.some(n=>n.startsWith('400'))&&w.usage!=='Inbound')return showToast('400号码只能用于呼入','warning');
    if(w.flow&&!CloudCallData.contactFlows.some(f=>f.contactFlowId===w.flow&&f.instanceId===AppState.get().instanceId&&f.status==='已发布'&&String(f.usage).startsWith('呼入')))return showToast('请选择当前品牌已发布的呼入流程','warning');
    const b={id:CloudResourceRules.id('BATCH'),lineId:r.lineId,instanceId:AppState.get().instanceId,usage:w.usage,flow:w.flow,province:w.province,city:w.city,corp:w.corp,createdAt:new Date().toLocaleString('zh-CN'),items:nums.map(number=>({number,status:'待处理',imported:w.mode==='existing',numberId:''})),running:false,trace:[]};
    batches().push(b);w.batch=b;run(b);
  }
  function usageChanged(){const el=document.getElementById('attachFlow');el.disabled=value('attachUsage')==='Outbound';if(el.disabled)el.value='';}
  function run(b){
    if(!scoped(b)||b.running)return;
    const pending=b.items.filter(i=>['待处理','添加失败'].includes(i.status)),r=line(b.lineId),key=context();
    if(!pending.length)return;
    if(pending.some(i=>!i.imported)&&!r.importAllowlisted)return showToast('请先完成首次接入办理','warning');
    b.running=true;pending.forEach(i=>{i.status='办理中';i.reason='';});renderResult();
    const valid=()=>key===context()&&scoped(b);
    const finish=()=>{b.running=false;CloudCallRuntime.addAudit('添加号码',b.id,'','办理中',b.items.map(i=>i.status).join('、')+'（本地演示）');if(wizard?.batch===b&&importContext===context()&&document.getElementById('number-onboarding'))renderResult();};
    const unknown=(items,reason)=>items.forEach(i=>{i.status='待核对';i.reason=reason;});
    const add=()=>{
      if(!valid()){unknown(pending,'操作范围已变化，需核对办理结果');finish();return;}
      const ready=pending.filter(i=>i.imported&&i.status==='办理中');
      if(!ready.length){finish();return;}
      const request={InstanceId:b.instanceId,NumberList:JSON.stringify(ready.map(i=>i.number)),Usage:b.usage};if(b.flow&&b.usage!=='Outbound')request.ContactFlowId=b.flow;
      b.trace.push({action:'AddPhoneNumbers',request});
      setTimeout(()=>{
        if(!valid()){unknown(ready,'操作范围已变化，需核对办理结果');finish();return;}
        ready.forEach(i=>{
          if(demo().addOutcome==='timeout'){unknown([i],'添加结果尚未确认，请勿重复提交');return;}
          if(demo().addOutcome==='failure'||demo().addFailedNumbers.includes(i.number)){i.status='添加失败';i.reason='号码未能加入当前品牌，可重试';return;}
          if(CloudCallData.phoneNumbers.some(n=>n.number===i.number&&n.businessStatus!=='已解绑')){i.status='添加失败';i.reason='号码已被使用，请核对归属';return;}
          const p=pool().find(p=>p.number===i.number&&p.lineId===b.lineId&&p.state==='已在号码池确认'&&!p.assignedInstanceId);
          if(!p){unknown([i],'号码归属待核对');return;}
          const n={numberId:CloudResourceRules.id('NUM'),number:i.number,instanceId:b.instanceId,lineId:b.lineId,usage:{Inbound:'仅呼入',Outbound:'仅呼出',Bidirection:'呼入+呼出'}[b.usage],aliyunUsage:b.usage,status:'待验证',businessStatus:'待配置',contactFlowId:b.flow,authorizedTenantIds:[],boundSkillGroupIds:[],referenceCount:0,restoreSnapshot:null,simulation:true};
          CloudCallData.phoneNumbers.push(n);p.assignedInstanceId=b.instanceId;i.numberId=n.numberId;i.status='已添加';i.reason='待设置使用范围与业务配置';
        });finish();
      },350);
    };
    const fresh=pending.filter(i=>!i.imported);
    if(!fresh.length){add();return;}
    const request={NumberList:JSON.stringify(fresh.map(i=>i.number)),Provider:r.provider};if(b.province)request.Province=b.province;if(b.city)request.City=b.city;if(b.corp)request.CorpName=b.corp;
    const job={lineId:r.lineId,numbers:fresh.map(i=>i.number),request,status:'提交中',requestId:CloudResourceRules.id('DEMO-IMPORT'),message:'本地演示'};
    jobs().push(job);b.trace.push({action:'ImportCorpNumbers',request});
    setTimeout(()=>{
      if(!valid()||demo().importOutcome==='timeout'){job.status='结果未知';unknown(fresh,'接入结果尚未确认，请先核对');finish();return;}
      if(demo().importOutcome==='failure'){job.status='导入失败';fresh.forEach(i=>{i.status='添加失败';i.reason='号码资料未通过，请检查后重试';});finish();return;}
      job.status='导入成功';b.trace.push({action:'ListUnassignedNumbers',request:{PageNumber:1,PageSize:100},simulation:true});
      fresh.forEach(i=>{
        if(demo().unconfirmedNumbers.includes(i.number)){unknown([i],'尚未查到可用号码，等待确认');return;}
        pool().push({id:CloudResourceRules.id('POOL'),number:i.number,lineId:b.lineId,province:b.province,city:b.city,state:'已在号码池确认',assignedInstanceId:'',simulation:true});i.imported=true;
      });
      add();
    },350);
  }
  function renderResult(){
    const b=wizard?.batch;if(!scoped(b))return;
    const ok=b.items.filter(i=>i.status==='已添加').length,failed=b.items.filter(i=>i.status==='添加失败').length,unknown=b.items.filter(i=>i.status==='待核对').length;
    const body=`<h3>${b.running?'正在添加号码…':ok===b.items.length?'号码已添加':ok?'部分号码尚未添加':'号码尚未添加'}</h3><p>${b.running?'正在办理，请勿重复提交。关闭窗口后可在“添加记录”查看结果。':`已添加 ${ok} 个 · 失败 ${failed} 个 · 待核对 ${unknown} 个`}</p>${ui.table([{key:'number',label:'号码'},{key:'status',label:'结果'},{key:'reason',label:'下一步'},{key:'numberId',label:'操作',render:(id,i)=>id?`<button class="btn-link" onclick="LineOnboarding.configure('${id}')">继续配置</button>`:'—'}],b.items)}`;
    draw(body,`<button class="btn" onclick="LineOnboarding.close()">关闭</button>${!b.running&&unknown?'<button class="btn" onclick="LineOnboarding.recheck()">重新核对</button>':''}${!b.running&&failed?'<button class="btn" onclick="LineOnboarding.retry()">重试失败号码</button>':''}<button class="btn btn-primary" onclick="LineOnboarding.toNumbers()">返回号码列表</button>`,4);
  }
  function retry(){if(wizard?.batch&&importContext===context())run(wizard.batch);}
  function recheck(){
    const b=wizard?.batch;if(!scoped(b)||b.running||importContext!==context())return;
    // Unknown is not failure: no resubmission and no fabricated confirmation.
    b.trace.push({action:'核对办理结果',simulation:true});showToast('暂未取得明确结果，已保留待核对号码；未重新提交','warning');
  }
  function configure(id){if(!can()||!CloudCallData.phoneNumbers.some(n=>n.numberId===id&&n.instanceId===AppState.get().instanceId))return;close();ui.closeLayer('number-history');navigateTo('numbers');Pages['resource-lines'].openNumber(id);}
  function toNumbers(){close();ui.closeLayer('number-history');navigateTo('numbers');}
  function openHistory(){
    if(!can())return;
    const rows=batches().filter(scoped).slice().reverse();
    ui.openLayer('number-history',`<div class="layer-header"><h2>号码添加记录</h2><button onclick="PlatformUI.closeLayer('number-history')">×</button></div><div class="layer-body">${ui.table([{key:'createdAt',label:'提交时间'},{key:'lineId',label:'线路',render:id=>esc(line(id)?.name||'')},{key:'items',label:'号码数量',render:items=>items.length},{key:'items',label:'办理结果',render:items=>esc([...new Set(items.map(i=>i.status))].join('、'))},{key:'id',label:'操作',render:id=>`<button class="btn-link" onclick="LineOnboarding.openBatch('${id}')">查看结果</button>`}],rows,{emptyText:'暂无添加记录'})}</div><div class="layer-footer"><span class="layer-footer-note">仅保留本次页面会话的演示记录</span><button class="btn" onclick="PlatformUI.closeLayer('number-history')">关闭</button></div>`,'wide');
  }
  function openBatch(id){const b=batches().find(b=>b.id===id);if(!scoped(b))return;ui.closeLayer('number-history');importContext=context();wizard={batch:b};renderResult();}
  window.LineOnboarding={renderLines,query,setPage,openLine,saveLine,openNumbers,close,next,back,changeMode,usageChanged,parseNumbers,retry,recheck,configure,toNumbers,openHistory,openBatch};
})();
