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
    const {fields,history}=result.data,id='customer-profile-nurture-task';
    const visits=history.length?history.map(visit=>'<article class="customer-profile-followup">'+
      '<strong>'+esc(visit.result||'回访结果未记录')+'</strong> <small>'+visitMeta(visit)+'</small>'+
      taskDetailGrid(visit.fields.filter(([,value])=>value!=null&&value!==''&&(!Array.isArray(value)||value.length)))+'</article>').join(''):
      '<p class="field-hint">暂无回访记录。</p>';
    ui.openLayer(id,'<div class="layer-header"><h2>培育任务详情</h2></div>'+
      '<div class="layer-body">'+ui.detailSection('任务信息',taskDetailGrid(fields))+
      ui.detailSection('回访记录（'+history.length+'）',visits)+'</div>'+
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
  cloud.html = html;
})();
