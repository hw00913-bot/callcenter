(() => {
  'use strict';
  const cloud = window.DNativeModules?.cloud;
  if (!cloud?.html) return;

  const edits = [
    [
      '.customer-profile-detail .platform-table td:nth-child(9){white-space:nowrap}',
      `.customer-profile-detail .platform-table td:nth-child(9){white-space:nowrap}
      .customer-profile-nurture-list,.customer-profile-visit-list{list-style:none;margin:0;padding:0}
      .customer-profile-nurture-list{display:grid;gap:12px}
      .customer-profile-task{min-width:0;padding:14px;border:1px solid #e4eaf1;border-radius:8px}
      .customer-profile-task-head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
      .customer-profile-task-head h4{margin:0;overflow-wrap:anywhere}
      .customer-profile-task-meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(128px,100%),1fr));gap:8px 12px;margin:12px 0}
      .customer-profile-task-meta dt{font-size:12px;color:#52647d}.customer-profile-task-meta dd{margin:3px 0 0;overflow-wrap:anywhere}
      .customer-profile-task h5{margin:0;font-size:13px}
      .customer-profile-visit-list .customer-profile-followup{padding:8px 0;overflow-wrap:anywhere}
      .customer-profile-visit-list .customer-profile-followup:last-child{border-bottom:0;padding-bottom:0}
      .customer-profile-visit-list .customer-profile-followup small{display:block;margin-top:3px}`
    ],
    [
      "aiFollowups:[],calls:[],imports:[],updatedAt:'',lastContactAt:'',legacyCustomerIds:[]",
      "aiFollowups:[],calls:[],imports:[],workspaceRecords:[],updatedAt:'',lastContactAt:'',legacyCustomerIds:[]"
    ],
    [
      '    // Collapse only explicitly linked native/business mirrors in the same customer.',
      `    for(const row of sourceRows(input.workspace,'培育任务记录','rows')){
      if(row?.kind!=='NURTURE_TASK'||!text(row.recordId)||
         row.tenantId!==context.tenantId||row.enterpriseId!==context.enterpriseId)continue;
      const customer=get(row.tenantId,row.enterpriseId,row.phone,row.name);
      if(!customer||customer.workspaceRecords.some(item=>item.kind===row.kind&&item.recordId===row.recordId))continue;
      customer.workspaceRecords.push(clone(row));
      source(customer,row.kind);
    }
    // Collapse only explicitly linked native/business mirrors in the same customer.`
    ],
    [
      '...customer.businesses.map(b=>b.updatedAt)]);',
      '...customer.businesses.map(b=>b.updatedAt),...customer.workspaceRecords.map(r=>r.updatedAt)]);'
    ],
    [
      'c.imports.length||c.legacyCustomerIds.length).sort',
      'c.imports.length||c.legacyCustomerIds.length||c.workspaceRecords.length).sort'
    ],
    [
      "const labels={BUSINESS:'统一业务',AI:'AI原记录',CLOUD:'云呼叫记录',DCC:'预外呼任务记录'};",
      "const labels={BUSINESS:'统一业务',AI:'AI原记录',CLOUD:'云呼叫记录',DCC:'预外呼任务记录',NURTURE_TASK:'培育任务'};"
    ],
    [
      "    const result=M.aggregate({context:context(),scopeToken:scope,native,business,ai,tenants:services.tenants()});\n    return {...result,sourcesResolved:[native,business,ai].every(source=>['success','forbidden','not-applicable'].includes(source?.status))};",
      `    const workspace=typeof bridge?.currentCustomerProfileWork==='function'
      ?read(()=>bridge.currentCustomerProfileWork(),'培育任务记录')
      :{status:'not-applicable'};
    const result=M.aggregate({context:context(),scopeToken:scope,native,business,ai,workspace,tenants:services.tenants()});
    return {...result,workKinds:workspace.data?.kinds||[],
      sourcesResolved:[native,business,ai,workspace].every(source=>['success','forbidden','not-applicable'].includes(source?.status))};`
    ],
    [
      "'CLOUD','DCC','BUSINESS'].includes(saved.sourceFilter)",
      "'CLOUD','DCC','BUSINESS','NURTURE_TASK'].includes(saved.sourceFilter)"
    ],
    [
      "...customer.businesses.map(b=>b.businessCode)].join(' ')",
      "...customer.businesses.map(b=>b.businessCode),...customer.workspaceRecords.flatMap(row=>[row.code,row.relatedCode])].join(' ')"
    ],
    [
      "ui.pageHeader('客户档案','按客户统一查看AI、预外呼、人工联系与业务跟进；各来源事实和权限分别保留。',action('刷新','reload'))",
      "ui.pageHeader('客户档案','按客户号码查看有权的联系和培育记录。',action('刷新','reload'))"
    ],
    [
      "['CLOUD','原云呼叫'],['DCC','原预外呼任务']].map(([v,l])",
      "['CLOUD','原云呼叫'],['DCC','原预外呼任务'],...result.workKinds.map(kind=>[kind,labels[kind]])].map(([v,l])"
    ],
    [
      'placeholder="称呼、完整号码或业务编码"></label><label class="field"><span>联系来源 / 方式</span><select id="customer-profile-source">',
      'placeholder="称呼、完整号码或记录编号"></label><label class="field"><span>记录来源</span><select id="customer-profile-source">'
    ],
    [
      "{key:'businessCount',label:'关联业务'}",
      "{key:'businessCount',label:'统一业务'}"
    ],
    [
      "[['关联业务',customer.businessCount],['业务跟进段'",
      "[['统一业务',customer.businessCount],['业务跟进段'"
    ],
    [
      "function sourceButtons(customerId,refs){return [...new Map(refs.filter(Boolean).map(ref=>[sourceKey(ref),ref])).values()].map(ref=>action(ref.kind==='BUSINESS_CALL'?'查看业务通话':ref.kind==='BUSINESS_FOLLOWUP'?'查看当时快照':ref.kind==='BUSINESS'?'打开业务':ref.kind==='NATIVE_CUSTOMER'?'查看原始联系资料':ref.kind==='AI_FOLLOWUP'?'原AI回访':'查看原来源','openSource',[customerId,sourceKey(ref)])).join('');}",
      `const sourceLabels={
    BUSINESS:'打开业务',BUSINESS_CALL:'查看业务通话',BUSINESS_FOLLOWUP:'查看当时快照',
    NATIVE_CUSTOMER:'查看联系资料',NATIVE_CALL:'通话详情',DCC_CALL:'通话详情',
    DCC_IMPORT:'导入详情',AI_NATIVE:'AI通话详情',AI_FOLLOWUP:'原AI回访',NURTURE_TASK:'查看任务'
  };
  function sourceButtons(customerId,refs){
    const supported=refs.filter(ref=>ref&&Object.hasOwn(sourceLabels,ref.kind));
    return [...new Map(supported.map(ref=>[sourceKey(ref),ref])).values()]
      .map(ref=>action(sourceLabels[ref.kind],'openSource',[customerId,sourceKey(ref)])).join('');
  }

  function workspaceMarkup(customer,result){
    if(!result.workKinds.includes('NURTURE_TASK'))return '';
    const tasks=customer.workspaceRecords.filter(row=>row.kind==='NURTURE_TASK');
    const groups=tasks.map(task=>{
      const fields=[['任务创建时间',time(task.taskAt)],['任务状态',task.status],['业务分类',task.category],
        ['线索编号',task.relatedCode],['跟进坐席',task.owner],['下次回访',task.nextAt?time(task.nextAt):'']];
      const history=task.history||[];
      const visits=history.map(visit=>'<li class="customer-profile-followup" data-profile-visit>'+
        '<strong>'+esc(visit.result||'回访结果未记录')+'</strong><small>'+visitMeta(visit)+'</small>'+
        (visit.note?'<p>'+esc(visit.note)+'</p>':'')+'</li>').join('');
      return '<li class="customer-profile-task" data-profile-task="'+esc(task.code)+'">'+
        '<div class="customer-profile-task-head"><h4>任务 '+esc(task.code)+'</h4>'+sourceButtons(customer.id,[task.sourceRef])+'</div>'+
        '<dl class="customer-profile-task-meta">'+fields.filter(([,value])=>value).map(([label,value])=>
          '<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl>'+
        '<h5>回访记录（'+history.length+'）</h5>'+(visits?'<ol class="customer-profile-visit-list">'+visits+'</ol>':
          '<p class="field-hint">暂无回访记录。</p>')+'</li>';
    }).join('');
    return '<section class="customer-profile-section" data-profile-work="nurture"><h3>培育历程</h3>'+
      (groups?'<ol class="customer-profile-nurture-list">'+groups+'</ol>':'<p class="field-hint">暂无此号码的培育任务。</p>')+'</section>';
  }

  function visitMeta(visit){
    const round=visit.roundNumber>0?'第 '+visit.roundNumber+' 轮':visit.roundId?'轮次 '+visit.roundId:'';
    return esc([time(visit.at,'回访时间未记录'),round,visit.method,visit.by].filter(Boolean).join(' · '));
  }

  function taskDetailGrid(fields){
    return '<dl class="detail-grid">'+fields.map(([label,value])=>{
      const text=Array.isArray(value)?value.join('、'):value;
      return '<dt>'+esc(label)+'</dt><dd>'+esc(text==null||text===''?'—':text).replaceAll('\\n','<br>')+'</dd>';
    }).join('')+'</dl>';
  }

  function openTaskDetail(ref){
    const result=host()?.readCustomerProfileTask?.(clone(ref));
    if(!result?.ok){root.showToast?.(result?.message||'当前培育任务无法打开。','warning');return false;}
    const {fields,history,deliveries=[]}=result.data,id='customer-profile-nurture-task';
    const visits=history.length?history.map(visit=>'<article class="customer-profile-followup">'+
      '<strong>'+esc(visit.result||'回访结果未记录')+'</strong> <small>'+visitMeta(visit)+'</small>'+
      taskDetailGrid(visit.fields.filter(([,value])=>value!=null&&value!==''&&(!Array.isArray(value)||value.length)))+'</article>').join(''):
      '<p class="field-hint">暂无回访记录。</p>';
    ui.openLayer(id,'<div class="layer-header"><h2>培育任务详情</h2></div>'+
      '<div class="layer-body">'+ui.detailSection('任务信息',taskDetailGrid(fields))+
      ui.detailSection('回访记录（'+history.length+'）',visits)+ui.detailSection('下发记录（'+deliveries.length+'）',deliveries.length?'<ol class="customer-profile-visit-list">'+taskDeliveryRecords(deliveries)+'</ol>':'<p class="field-hint">此任务尚未下发。</p>')+'</div>'+
      '<div class="layer-footer"><button type="button" class="btn" data-close-task>关闭</button></div>');
    root.document.querySelector('#'+id+' [data-close-task]').onclick=()=>ui.closeLayer(id);
    return true;
  }`
    ],
    [
      ",{key:'sourceRef',label:'操作',render:ref=>sourceButtons(customer.id,[ref])}],customer.imports",
      ",...(customer.imports.some(row=>row.sourceRef?.kind==='DCC_IMPORT')?[{key:'sourceRef',label:'操作',render:ref=>ref?.kind==='DCC_IMPORT'?sourceButtons(customer.id,[ref]):'—'}]:[])],customer.imports"
    ],
    [
      "+'</div><p class=\"field-hint\">从“原始联系资料”查看业务信息、导入详情或再次联系。</p>':'')+business+followups+aiFollowupMarkup(customer)+calls+imports",
      "+'</div>':'')+workspaceMarkup(customer,result)+business+followups+aiFollowupMarkup(customer)+calls+imports"
    ],
    [
      "...customer.imports.map(r=>r.sourceRef),...customer.legacyCustomerIds",
      "...customer.imports.map(r=>r.sourceRef),...customer.workspaceRecords.map(r=>r.sourceRef).filter(Boolean),...customer.legacyCustomerIds"
    ],
    [
      "    return services.openNative(ref);\n  }\n  async function openSource",
      "    if(ref.kind==='NURTURE_TASK')return openTaskDetail(ref);\n    return services.openNative(ref);\n  }\n  async function openSource"
    ],
    [
      "          if(ref.kind!=='NATIVE_CALL'||typeof old.directory?.openCall!=='function'||typeof old.directory?.openDetail!=='function')throw Error('原通话详情入口暂不可用。');\n          if(old.directory.openDetail(customer.id)===false)return false;return old.directory.openCall(ref.callId);",
      `          const details=root.Pages?.['cloud-call-records'],call=root.CloudCallRuntime?.call?.(ref.callId);
          if(ref.kind!=='NATIVE_CALL'||typeof details?.openCall!=='function'||!call||
             call.tenantId!==customer.tenantId||String(call.enterpriseId)!==String(customer.enterpriseId)||
             root.AppState?.authorizeObject?.('',call)!==true)throw Error('原通话详情入口暂不可用。');
          return details.openCall(ref.callId);`
    ]
  ];

  let html = cloud.html;
  for (const [before, after] of edits) {
    const index = html.indexOf(before);
    if (index < 0 || index !== html.lastIndexOf(before)) throw Error('无法唯一定位客户档案配置：'+before.slice(0, 70));
    html = html.slice(0, index) + after + html.slice(index + before.length);
  }
  function replace(before, after) {
    const index=html.indexOf(before);
    if(index<0||index!==html.lastIndexOf(before))throw Error('客户档案现况配置定位失败：'+before.slice(0,90));
    html=html.slice(0,index)+after+html.slice(index+before.length);
  }
  function cut(start, end) {
    const at=html.indexOf(start),finish=html.indexOf(end,at+start.length);
    if(at<0||finish<0)throw Error('客户档案旧段定位失败：'+start.slice(0,90));
    html=html.slice(0,at)+html.slice(finish);
  }
  // Read-only review records: never written into intake, tasks, call logs or browser storage.
  const demoTenant='TEN-NISSAN-HQ', demoSet='CUSTOMER-PROFILE-REVIEW';
  function sampleRows() {
    const current=window.DSession?.context?.();
    if(current?.scope.kind!=='tenant'||current.scope.id!==demoTenant||
       !window.DSession.allowed('PAGE-2203',current)||!window.DReview21Operations?.canView(current))return [];
    const enterpriseId=String(current.scope.tenant.enterpriseId||'');if(!enterpriseId)return [];
    const state=window.DReview21?.state(),engine=window.DSkynetIntake;
    const binding=engine?.profileSampleBinding(state,current);
    const native=document.querySelector('iframe[data-native-module="cloud"]')?.contentWindow;
    const forms=window.DReview21DccFollowupFields;
    const schema=binding&&forms?.taskForm({tenant:current.scope.id,categoryContext:binding.rule.categoryId},native,current);
    const ruleLabel=binding?[binding.rule.name||binding.rule.id,'v'+binding.rule.version].join(' '):'';
    const base={kind:'NURTURE_TASK',tenantId:current.scope.id,enterpriseId,taskAt:'2026-11-27T09:00:00+08:00',demoSet,
      assignmentRule:ruleLabel};
    function configuredVisit(result,note,at,roundNumber,preferred={}) {
      const details={},definitions=[],labels={};
      for(const field of schema?.fields||[]){
        if(!field.id||!field.label)continue;
        const key=forms.fieldKey(field)||'field:'+field.id;
        const value=(...args)=>args.find(x=>x!==undefined&&x!==null&&x!=='');
        const candidates=(Array.isArray(field.options)?field.options:Array.isArray(field.choices)?field.choices:[])
          .map(o=>typeof o==='object'&&o!==null?{value:value(o.value,o.id,o.code,o.label),label:value(o.label,o.name,o.value)}:{value:o,label:o})
          .filter(o=>o.value!==undefined);
        const requested=preferred[key];
        const option=candidates.find(o=>String(o.value)===String(requested))||candidates[0];
        if(['visitResult','visitDesc','nextVisitTime'].includes(key)){
          const v=key==='visitResult'?result:key==='visitDesc'?note:preferred.nextVisitTime;
          if(v){definitions.push([key,field.label]);details[key]=v;labels[key]=v;}
          continue;
        }
        if(!option&&requested===undefined)continue;
        const v=option?option.value:requested;
        details[key]=field.type==='multiselect'?[v]:v;
        labels[key]=option?option.label:v;
        definitions.push([key,field.label]);
      }
      return {result,note,at,roundNumber,roundId:'R'+roundNumber,callMode:'人工外呼',details,
        intent:{level:labels.intentLevel,series:labels.intentCar||labels.intentSeries,store:labels.intentStore},
        fields:definitions.map(([key,label])=>[label,details[key]])};
    }
    const first=configuredVisit('待考虑','正在比较车型。','2026-11-27T09:30:00+08:00',1,{intentLevel:'B',contactStatus:'已接通'});
    const second=configuredVisit('有意向','希望先了解车型报价，约定次日回访。','2026-11-27T10:40:00+08:00',2,
      {intentLevel:'A',contactStatus:'已接通',nextVisitTime:'2026-11-28T10:30:00+08:00'});
    const sent=configuredVisit('意向线索下发','已确认意向，送门店跟进。','2026-11-27T09:45:00+08:00',1,{intentLevel:'A',contactStatus:'已接通'});
    const delivery=binding?.delivery;
    const payload=engine?.profileSampleDelivery(delivery,sent,{originalKey:'DEMO-LEAD-03B',name:'【模拟】周女士',phone:'13900007803',
      ...sent.details},'intent');
    const sentRows=payload?[{roundId:sent.roundId,at:'2026-11-27T10:00:00+08:00',target:'模拟接收方',status:'已接收（模拟）',
      requestId:'DEMO-REQUEST-03B',receiptId:'DEMO-RECEIPT-03B',template:delivery.name,templateVersion:delivery.version,
      fields:Object.entries(payload)}]:[];
    const make=(suffix,phone,name,extra)=>{
      const id='DEMO-PROFILE-'+suffix;
      return {...base,recordId:id,code:id,relatedCode:'DEMO-LEAD-'+suffix,phone,name:'【模拟】'+name,
        category:'培育线索',status:'待办理',history:[],deliveries:[],demoContacts:[],
        sourceRef:{kind:'PROFILE_SAMPLE',recordId:id,tenantId:base.tenantId,enterpriseId},...extra};
    };
    return [
      make('01','13900007801','陈女士 · 待跟进',{owner:'演示坐席'}),
      make('02','13900007802','林先生 · 已回访',{status:'待回访',owner:'演示坐席',nextAt:'2026-11-28T10:30:00+08:00',
        history:[second,first],
        demoContacts:[{callId:'DEMO-PROFILE-CALL-02',resultLabel:'已接通',durationSeconds:42,at:'2026-11-27T10:35:00+08:00'}]}),
      make('03A','13900007803','周女士 · 两条培育任务',{status:'待下发',taskAt:'2026-11-27T10:30:00+08:00',
        history:[configuredVisit('意向线索下发','确认了意向门店。','2026-11-27T11:10:00+08:00',1,{intentLevel:'A'})]}),
      make('03B','13900007803','周女士 · 两条培育任务',{status:sentRows.length?'已结束':'待下发',
        history:[sent],deliveries:sentRows})
    ];
  }
  window.DCustomerProfileReviewSamples={
    list:sampleRows,
    read(ref){return sampleRows().find(row=>row.recordId===ref?.recordId&&row.tenantId===ref?.tenantId&&row.enterpriseId===ref?.enterpriseId)||null;}
  };
  replace("customer.workspaceRecords.push(clone(row));\n      source(customer,row.kind);",
    String.raw`customer.workspaceRecords.push(clone(row));
      source(customer,row.kind);
      if(row.demoSet==='CUSTOMER-PROFILE-REVIEW')for(const call of array(row.demoContacts)){
        addCall(customer,{sourceKind:'CLOUD',sourceId:call.callId,sourceRef:row.sourceRef,method:'MANUAL',
          callId:call.callId,taskId:row.code,taskItemId:row.recordId,dialed:true,answered:true,
          durationSeconds:call.durationSeconds,actualAt:call.at,sourceAt:call.at,resultLabel:call.resultLabel,readOnly:true});
      }`);
  // New-system customer files are based on accepted business, not discovered from CDRs.
  replace('customer.legacyCustomerIds.push(native.id||customer.id);',
    "if(native.customerMasterId||array(native.batches).some(row=>!row.archiveLedgerRecord))customer.legacyCustomerIds.push(native.id||customer.id);");
  replace('for(const item of array(native.batches))customer.imports.push',
    'for(const item of array(native.batches).filter(row=>!row.archiveLedgerRecord))customer.imports.push');
  replace("taskId:call.directoryMeta?.sourceTaskId||call.taskId||'',sceneName:call.sceneName",
    "taskId:call.directoryMeta?.sourceTaskId||call.taskId||'',taskItemId:call.directoryMeta?.sourceRecordId||call.customerTaskItemId||'',sceneName:call.sceneName");
  replace("if(!text(record.recordId))continue;\n      const history=", "if(!text(record.recordId)||record.viewIdentity==='history')continue;\n      const history=");
  replace('segmentCustomer=get(tenantId,enterpriseId,original,basis.importValues?.name||name)',
    'segmentCustomer=current&&original===currentPhone?current:null');
  replace('owner=get(tenantId,enterpriseId,actualPhone,basis.importValues?.name||name)',
    'owner=current&&actualPhone===currentPhone?current:null');
  cut("    for(const row of sourceRows(input.ai,'AI外呼','rows')){",
    "    for(const row of sourceRows(input.workspace,'培育任务记录','rows')){");
  replace('      const removed=new Set();', String.raw`      const removed=new Set();
      const currentCalls=customer.calls.filter(call=>call.sourceKind==='BUSINESS');
      customer.calls=customer.calls.filter(call=>call.sourceKind==='BUSINESS'||currentCalls.some(b=>
        call.businessRecordId&&call.businessRecordId===b.businessRecordId&&call.segmentId===b.segmentId&&call.method===b.method&&
        (call.callId&&call.callId===b.callId||call.providerCallId&&call.providerCallId===b.providerCallId))||
        !!call.taskId&&!!call.taskItemId&&(
          customer.workspaceRecords.some(row=>String(row.code)===String(call.taskId)&&String(row.recordId)===String(call.taskItemId))||
          customer.imports.some(row=>String(row.taskId)===String(call.taskId)&&String(row.rowId)===String(call.taskItemId))));
      customer.sources=customer.sources.filter(kind=>kind==='BUSINESS'||kind==='NURTURE_TASK'||kind==='CLOUD'&&customer.legacyCustomerIds.length);
      customer.calls.forEach(event=>source(customer,event.sourceKind));
      const currentNames=customer.workspaceRecords.map(row=>text(row.name)).concat(customer.businesses.map(row=>text(row.customerName))).filter(Boolean);
      customer.names=[...new Set(currentNames.concat(customer.imports.map(row=>text(row.customerName)).filter(Boolean)))];
      customer.name=customer.names[0]||customer.masterName||'未记录称呼';`);
  replace('customer.legacyCustomerIds.push(native.id||customer.id);for(const name',
    "customer.legacyCustomerIds.push(native.id||customer.id);if(native.customerMasterId)customer.masterName=text(native.name);for(const name");
  replace("rowId:item.rowId||item.recordId||'',label:item.batchName",
    "rowId:item.rowId||item.recordId||'',taskId:item.taskId||'',customerName:item.name||'',label:item.batchName");
  replace('recordId:record.recordId,businessCode:record.businessCode', "recordId:record.recordId,customerName:record.currentValues?.IMPORT?.name||record.fields?.name||record.customerName||'',nextAt:record.nextAt||record.run?.nextAt||record.currentNode?.nextAt||'',nextAction:record.workState?.nextActionLabel||record.currentNode?.name||'',businessCode:record.businessCode");
  replace('c.businesses.length||c.followups.length||c.aiFollowups.length||c.calls.length||c.imports.length||c.legacyCustomerIds.length||c.workspaceRecords.length',
    'c.businesses.length||c.legacyCustomerIds.length||c.workspaceRecords.length');
  cut("    let ai=typeof bridge?.currentCustomerProfileAI", "    const native=read(()=>services.nativeSnapshot()");
  replace('scopeToken:scope,native,business,ai,workspace','scopeToken:scope,native,business,workspace');
  replace('    const workspace=typeof bridge?.currentCustomerProfileWork', '    let workspace=typeof bridge?.currentCustomerProfileWork');
  replace('    const result=M.aggregate({context:context(),scopeToken:scope,native,business,workspace,tenants:services.tenants()});',
    String.raw`    const samples=root.parent?.DCustomerProfileReviewSamples?.list?.()||[];
    if(samples.length&&workspace.status==='success'){
      const rows=workspace.data?.rows||[],present=new Set(rows.map(row=>row.recordId));
      workspace={...workspace,data:{...workspace.data,rows:[...rows,...samples.filter(row=>!present.has(row.recordId))]}};
    }
    const result=M.aggregate({context:context(),scopeToken:scope,native,business,workspace,tenants:services.tenants()});`);
  replace("AI_NATIVE:'AI通话详情',AI_FOLLOWUP:'原AI回访',NURTURE_TASK:'查看任务'",
    "AI_NATIVE:'AI通话详情',AI_FOLLOWUP:'原AI回访',NURTURE_TASK:'查看任务',PROFILE_SAMPLE:'查看样例'");
  replace("    if(ref.kind==='NURTURE_TASK')return openTaskDetail(ref);",
    String.raw`    if(ref.kind==='PROFILE_SAMPLE'){
      const sample=root.parent?.DCustomerProfileReviewSamples?.read?.(ref);
      if(!sample)return false;
      ui.openLayer('customer-profile-sample','<div class="layer-header"><h2>模拟业务样例</h2></div>'+
        '<div class="layer-body">'+taskDetailGrid([['任务编号',sample.code],['当前状态',sample.status],['下次回访',sample.nextAt?time(sample.nextAt):'']])+
        '<p class="field-hint">仅用于查看效果，不会分配、拨号或写入真实业务。</p></div>'+
        '<div class="layer-footer"><button class="btn" type="button" data-close-profile-sample>关闭</button></div>');
      root.document.querySelector('[data-close-profile-sample]').onclick=()=>ui.closeLayer('customer-profile-sample');
      return true;
    }
    if(ref.kind==='NURTURE_TASK')return openTaskDetail(ref);`);

  replace('[native,business,ai,workspace].every','[native,business,workspace].every');
  replace("['','AI','PREDICTIVE','MANUAL','CLOUD','DCC','BUSINESS','NURTURE_TASK'].includes(saved.sourceFilter)", "['','CLOUD','BUSINESS','NURTURE_TASK'].includes(saved.sourceFilter)");
  cut('  async function loadAI(force=false){','  const api={render,snapshot');
  replace(",generation=0,aiLoading=false,aiFailure=null;", ";");
  replace("generation++;aiLoading=false;aiFailure=null;", "");
  replace("reload(){loadAI(true);return redrawVisible();}", "reload(){return redrawVisible();}");
  replace("if(!customerId)return false;loadAI(true);return redrawVisible();", "if(!customerId)return false;return redrawVisible();");
  replace("restoreDetail();loadAI();},loadAI}", "restoreDetail();}}");

  const summaryCode = String.raw`  const terminalProfileState=/^(已结束|已完成|已归档|已下发|已关闭|已终止|已结案|已作废|废弃|结束|结案|END|ENDED|COMPLETED|CLOSED|CANCELLED|FINISHED)$/i;
  function nextProfileStep(row){
    if(!row)return '暂无在办业务';
    if(terminalProfileState.test(row.status))return '无需继续跟进';
    // A retained appointment date does not override a newer wait/delivery state.
    if(/下发审核/.test(row.status))return '等待下发审核';
    if(/待下发/.test(row.status))return '处理待下发';
    if(/待分配|待指派|未分配/.test(row.status))return '分配跟进人';
    if(/待处理|待核/.test(row.status))return '查看待处理原因';
    if(/话单|待结果/.test(row.status))return '等待本轮结果';
    if(row.nextAt&&M.stamp(row.nextAt)!==null)return '回访：'+time(row.nextAt);
    if(/排队|执行|呼叫中/.test(row.status))return '等待本轮外呼完成';
    if(row.nextAction)return row.nextAction;
    if(/办理|跟进|回访|培育/.test(row.status))return '继续跟进';
    return '查看当前业务';
  }
  function profileWork(customer){
    return customer.workspaceRecords.map(task=>({label:task.category||'培育任务',code:task.code,
      id:String(task.recordId),status:followupState(task.status),nextAt:task.nextAt,assignmentRule:task.assignmentRule,
      started:task.taskAt,at:task.updatedAt||task.taskAt,ref:task.sourceRef,owner:task.owner,visits:task.history||[],deliveryRecords:task.deliveries||[]})).sort((a,b)=>
        (M.stamp(b.started||b.at)??-Infinity)-(M.stamp(a.started||a.at)??-Infinity)||
        (M.stamp(b.at)??-Infinity)-(M.stamp(a.at)??-Infinity)||a.id.localeCompare(b.id));
  }
  function profileRoundCount(visits){
    const idByNumber=new Map(),ids=new Set();
    const numberOf=visit=>Number.isSafeInteger(visit.roundNumber)&&visit.roundNumber>0?visit.roundNumber:0;
    for(const visit of visits){
      const id=String(visit.roundId||'').trim(),n=numberOf(visit);
      if(!id||!n)continue;
      const seen=idByNumber.get(n)||new Set();seen.add(id);idByNumber.set(n,seen);
    }
    let unknown=0;
    for(const visit of visits){
      const id=String(visit.roundId||'').trim(),n=numberOf(visit),seen=idByNumber.get(n);
      if(id)ids.add('id:'+id);
      else if(seen?.size===1)ids.add('id:'+Array.from(seen)[0]);
      else if(n&&!seen)ids.add('number:'+n);
      else unknown++;
    }
    return {count:ids.size,unknown};
  }
  function profileLatestVisit(rows){
    const visits=rows.flatMap(row=>row.visits), dated=visits.filter(visit=>M.stamp(visit.at)!==null)
      .sort((a,b)=>M.stamp(b.at)-M.stamp(a.at));
    if(!dated.length)return visits.length===1?{visit:visits[0]}:{visit:null,ambiguous:visits.length>1};
    const most=dated.filter(visit=>M.stamp(visit.at)===M.stamp(dated[0].at));
    return most.length===1?{visit:most[0]}:{visit:null,ambiguous:true,at:most[0].at};
  }
  function profileValue(value){
    if(Array.isArray(value))return value.map(profileValue).filter(Boolean).join('、');
    if(value&&typeof value==='object')return profileValue(value.label??value.name??value.value??'');
    return value===null||value===undefined?'':String(value);
  }
  function filledProfileFields(fields){
    return (fields||[]).filter(([,v])=>v!=null&&v!==''&&(!Array.isArray(v)||v.length));
  }
  function taskVisitRecords(history){
    return history.map((visit,index)=>{
      const fields=filledProfileFields(visit.fields),meta=visitMeta(visit);
      return '<li class="customer-profile-followup" data-profile-task-visit><strong>第 '+esc(history.length-index)+' 次回访 · '+esc(visit.result||'结果未记录')+'</strong>'+
        (meta?'<small>'+meta+'</small>':'')+
        (visit.note?'<p>'+esc(visit.note)+'</p>':'')+
        (fields.length?taskDetailGrid(fields):'<p class="field-hint">未记录其他填写字段。</p>')+'</li>';
    }).join('');
  }
  function taskDeliveryRecords(records){
    return records.map(row=>'<li class="customer-profile-followup" data-profile-task-delivery><strong>'+esc(row.target)+' · '+esc(row.status)+'</strong><small>'+esc(time(row.at))+'</small>'+
      taskDetailGrid(filledProfileFields([['下发轮次',row.roundId],['下发方式',row.mode],['下发模板',[row.template,row.templateVersion?'v'+row.templateVersion:''].filter(Boolean).join(' ')],['门店',row.store&&row.store!==row.target?row.store:''],['请求编号',row.requestId],['回执编号',row.receiptId]]))+
      (row.fields?.length?'<h5>实际下发字段</h5>'+taskDetailGrid(filledProfileFields(row.fields)):'')+
      (row.payloads||[]).map(payload=>'<h5>'+esc([payload.leadCode,payload.store].filter(Boolean).join(' · '))+'</h5>'+
        taskDetailGrid(filledProfileFields(payload.fields))).join('')+'</li>').join('');
  }
  function taskEvidence(title,records,markup,empty,attr){
    return '<details class="customer-profile-section" '+attr+'><summary>'+esc(title)+'（'+records.length+'）</summary>'+
      (records.length?'<ol class="customer-profile-visit-list">'+markup(records)+'</ol>':'<p class="field-hint">'+esc(empty)+'</p>')+'</details>';
  }
  function renderProfileTask(customer,row){
    const rounds=profileRoundCount(row.visits);
    return '<li class="customer-profile-task" data-profile-work-item data-profile-task-id="'+esc(row.id)+'"><div class="customer-profile-task-head"><h4>'+esc(row.label)+' · '+esc(row.code)+'</h4>'+
      sourceButtons(customer.id,[row.ref])+'</div><dl class="customer-profile-task-meta"><div><dt>当前状态</dt><dd>'+esc(row.status)+'</dd></div><div><dt>下一步</dt><dd>'+esc(nextProfileStep(row))+'</dd></div>'+
      '<div><dt>任务创建时间</dt><dd>'+esc(time(row.started))+'</dd></div><div><dt>跟进人</dt><dd>'+esc(row.owner||'未分配')+'</dd></div>'+
      (row.assignmentRule?'<div><dt>分配规则</dt><dd>'+esc(row.assignmentRule)+'</dd></div>':'')+
      '<div><dt>已回访轮次</dt><dd data-task-round-count>'+rounds.count+' 轮'+(rounds.unknown?' · '+rounds.unknown+' 条未记录轮次':'')+'</dd></div>'+
      '<div><dt>已保存回访</dt><dd data-task-visit-count>'+row.visits.length+' 次</dd></div>'+
      '<div><dt>是否下发</dt><dd data-task-send-state>'+(row.deliveryRecords.length?'已下发':'未下发')+'</dd></div></dl>'+
      taskEvidence('回访填写记录',row.visits,taskVisitRecords,'此任务还没有已保存的回访。','data-profile-task-visits')+
      taskEvidence('下发记录',row.deliveryRecords,taskDeliveryRecords,'此任务尚未下发。','data-profile-task-deliveries')+'</li>';
  }
  function profileDetailBody(customer,result){
    const rows=profileWork(customer),{visit,ambiguous,at}=profileLatestVisit(rows);
    const latestAt=visit?time(visit.at,'时间未记录'):ambiguous?time(at,'时间待核'):'尚未回访';
    const value=(key)=>ambiguous?'待核对':profileValue(visit?.intent?.[key])||'未记录';
    const basicFields=[['客户手机号',customer.phone],['客户姓名',customer.name],['最后一次回访时间',latestAt],
      ['最后一次意向',value('level')],['最后一次意向车系',value('series')],['最后一次意向门店',value('store')]];
    const base='<dl class="customer-profile-task-meta">'+basicFields.map(([label,v])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(v)+'</dd></div>').join('')+'</dl>'+
      (ambiguous?'<p class="field-hint">暂不能唯一识别最后一次回访，请按任务核对原记录。</p>':'');
    const accepted=customer.businesses.map(row=>'<div class="customer-profile-task-head"><strong>'+esc(row.categoryName+' · '+row.businessCode)+'</strong><span>'+esc(followupState(row.stateLabel))+'</span>'+sourceButtons(customer.id,[row.sourceRef])+'</div>').join('');
    return '<section class="customer-profile-section" data-profile-basics><h3>客户基础信息</h3>'+base+'</section>'+
      '<section class="customer-profile-section" data-profile-tasks><h3>培育任务记录</h3>'+
      (rows.length?'<ol class="customer-profile-nurture-list">'+rows.map(row=>renderProfileTask(customer,row)).join('')+'</ol>':'<p class="field-hint">尚无培育任务。</p>'+accepted)+'</section>'+
      (result.data.issues.length?'<details><summary>部分资料待核</summary>'+notice(result)+'</details>':'');
  }
`;
  replace('  function detailMarkup(customer,result,contentOnly=false){',
    summaryCode+'  function detailMarkup(customer,result,contentOnly=false){');
  cut("    const summary='<section class=\"customer-profile-summary\">", '    return contentOnly?body:');
  replace('    return contentOnly?body:', '    const body=profileDetailBody(customer,result);\n    return contentOnly?body:');
  cut("    const columns=[{key:'name',label:'客户称呼',", "    return '<section class=\"platform-page customer-profile-page\">'+ui.pageHeader('客户档案','按客户号码");
  replace("    return '<section class=\"platform-page customer-profile-page\">'+ui.pageHeader('客户档案','按客户号码查看有权的联系和培育记录。'",
    String.raw`    const columns=[{key:'name',label:'客户称呼',render:(value,row)=>'<button type="button" class="table-link" onclick="CustomerProfiles.openDetail('+arg(row.id)+')"><strong>'+esc(value)+'</strong></button>'},
      {key:'phone',label:'客户号码'},
      {key:'sources',label:'可见来源',render:v=>v.map(x=>'<span class="customer-profile-tag">'+esc(labels[x]||x)+'</span>').join('')},
      {key:'businessCount',label:'统一业务'},
      {key:'followupCount',label:'跟进记录',render:(_,row)=>String(row.followups.filter(f=>f.saved||f.archived).length+
        row.workspaceRecords.reduce((total,task)=>total+(task.history||[]).length,0))},
      {key:'workspaceRecords',label:'培育任务',render:rows=>String(rows.length)},
      {key:'callRecordCount',label:'通话记录'},
      {key:'lastContactAt',label:'最近确认拨打',render:(v,row)=>esc(time(v,row.actualDialCount?'拨打时间待核':'尚未拨打'))},
      {key:'updatedAt',label:'最近资料更新',render:v=>esc(time(v))},
      {key:'id',label:'操作',render:id=>action('查看档案','openDetail',[id])}];
    return '<section class="platform-page customer-profile-page">'+ui.pageHeader('客户档案','按客户号码查看业务、跟进和通话。进入档案查看当前状态与下一步。'`);
  replace("[['','全部'],['AI','AI外呼'],['PREDICTIVE','预外呼'],['MANUAL','人工外呼'],['BUSINESS','统一业务'],['CLOUD','原云呼叫'],['DCC','原预外呼任务'],...result.workKinds.map(kind=>[kind,labels[kind]])]",
    "[['','全部'],['BUSINESS','正式受理业务'],['NURTURE_TASK','培育任务'],['CLOUD','已受理客户资料']]");
  replace("+'</span></div><p class=\"field-hint\">业务跟进与通话分别统计；受理、排队和待核记录不计为实际拨打，未知时长显示为未记录。</p>'+ui.table",
    "+'</span></div>'+ui.table");
  replace("emptyText:'当前范围暂无可关联客户',emptyDetail:result.status==='partial'?'部分来源尚未可靠取得，请查看上方提示或原来源记录。':'可尝试重置筛选；尚未拨打的已导入业务也可归档查看。'",
    "emptyText:'还没有客户档案',emptyDetail:result.status==='partial'?'部分资料暂不可用，可刷新后重试。':'收到客户资料或正式受理业务后，会在这里显示。'");

  cut('  function workspaceMarkup(customer,result){','  function visitMeta(visit){');
  cut('  function aiFollowupMarkup(customer){','  const terminalProfileState=');
  cloud.html = html;
})();
