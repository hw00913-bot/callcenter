(() => {
  'use strict';

  const cloud = window.DNativeModules?.cloud;
  if (!cloud?.html) return;

  function wizardPromptTone() {
    const enterpriseVoiceOptions = Object.freeze([
      {path:'DEMO-ENTERPRISE-VOICE-01',name:'客户接听欢迎语'},
      {path:'DEMO-ENTERPRISE-VOICE-02',name:'请稍候，正在为您接通坐席'},
      {path:'DEMO-ENTERPRISE-VOICE-03',name:'服务回访提示音'},
      {path:'DEMO-ENTERPRISE-VOICE-04',name:'活动咨询提示音'}
    ]);

    function customerVoiceControl(draft) {
      if (draft.type!=='预外呼' || draft.repeatPredictive) return '';
      const path = draft.values.customerVoice || '';
      const oldOption = path && !enterpriseVoiceOptions.some(item=>item.path===path) ?
        '<option value="'+esc(path)+'" selected>原提示音 · '+esc(draft.values.customerVoiceName || path)+'</option>' : '';
      const options = enterpriseVoiceOptions.map(item=>'<option value="'+esc(item.path)+'"'+(item.path===path?' selected':'')+'>'+esc(item.name)+'</option>');
      return `<label id="wizardCustomerVoice" class="field"><span>客户侧提示音</span>
        <select id="wizardCustomerVoicePath" onchange="CloudTaskWorkspace.update('customerVoice',this.value)">
          <option value="">不播放提示音</option>${oldOption}${options.join('')}
        </select><small class="field-hint">企业语音（模拟数据）。客户接听后、呼转坐席前播放。</small>
        ${errorSlot('wizardCustomerVoicePath')}</label>`;
    }

    function updateCustomerVoice(draft,key,value) {
      if (!draft || draft.type!=='预外呼' || draft.repeatPredictive || draft.editTaskId && !canEditTask(taskById(draft.editTaskId))) return false;
      const tone = enterpriseVoiceOptions.find(item=>item.path===value);
      if (value && !tone) return false;
      Object.assign(draft.values,{customerVoice:value,customerVoiceName:tone?.name || ''});
      persist();AppState.setDirty(true);clearFormErrors();
      refreshPreview();
      return true;
    }

    function customerVoiceIssue(draft) {
      const path = draft.values.customerVoice;
      if (draft.type!=='预外呼' || !path || draft.editTaskId && path===draft.editOriginalValues?.customerVoice) return null;
      return enterpriseVoiceOptions.some(item=>item.path===path) ? null :
        {message:'请重新选择企业语音，或选择不播放。',target:'wizardCustomerVoicePath'};
    }
  }

  const helpers = wizardPromptTone.toString().split('\n').slice(1,-1).join('\n');
  const allocationEdits = [
  [
    "const sourceValid = source => ['api', 'manual'].includes(source);",
    "const sourceValid = source => ['api', 'manual', 'rules'].includes(source);"
  ],
  [
    "    if (canAccessDraft(item)) return item;",
    "    if (canAccessDraft(item)) {\n      // Drafts saved before the change carried an obsolete source and might still have a selected list.\n      if (isDccDraft(item) && item.values.dccImportSource !== 'rules') {\n        Object.assign(item.values,{dccImportSource:'rules',customerIds:[],manualSelectedSnapshots:{},\n          manualSelectionEdits:{},manualImportBatchName:'',customerMode:'later'});\n      }\n      return item;\n    }"
  ],
  [
    "创建前关联业务分类，后续手工或接口导入自动带入，无需临时选择。",
    "关联业务分类后，在分配规则中将符合条件的线索分到此任务。"
  ],
  [
    "isDccDraft(draft)?'先确定任务和客户':'先确定任务和客户'",
    "isDccDraft(draft)?'先确定任务信息':'先确定任务和客户'"
  ],
  [
    "为这次外呼命名；手工来源可选择已有名单，接口来源由业务系统导入。",
    "填写任务名称和业务分类。名单统一由分配规则分派。"
  ],
  [
    "${draft.type==='预外呼'&&!draft.repeatPredictive?dccSourceSelection(draft)+(v.dccImportSource==='manual'?customerSelection(draft):''):customerSelection(draft)}",
    "${isDccDraft(draft)?'':customerSelection(draft)}"
  ],
  [
    "每次导入独立保存，保留历史记录。",
    "创建任务后，在同一业务分类的分配规则中选择此任务。"
  ],
  [
    "if(!['api','manual'].includes(v.dccImportSource))return fail('请选择业务系统接口或手工一种导入来源，确认创建后不可切换。','wizardDccSource');",
    "if(v.dccImportSource!=='rules')return fail('请重新进入预外呼任务配置。','wizardUnifiedCategoryId');"
  ],
  [
    "if(v.dccImportSource==='api'&&(v.customerIds||[]).length)return fail('接口任务不能附着手工名单。','wizardDccSource');",
    "if((v.customerIds||[]).length)return fail('名单请通过分配规则分派。','wizardUnifiedCategoryId');"
  ],
  [
    "v.dccImportSource==='api'?'待接收线索':'待导入线索'",
    "'待分配线索'"
  ],
  [
    ",['导入来源',v.dccImportSource==='api'?'业务系统接口导入（创建后锁定）':v.dccImportSource==='manual'?'手工导入（创建后锁定）':'尚未选择']",
    ""
  ],
  [
    "isPredictive&&v.dccImportSource==='api'?'创建后由业务系统导入'",
    "isDccDraft(draft)?'由分配规则分派'"
  ],
  [
    "      <p class=\"wizard-review-next\">${isDccDraft(draft)?v.dccImportSource==='api'?'创建后，进入当前任务的“客户与处理记录”页接收 业务系统线索。':count?'创建后，所选客户导入当前任务；原客户资料与历史保留。':'创建后，进入当前任务的“客户与处理记录”页点击“导入客户”，检查后确认名单。':count ? '创建后可在任务列表查看进度和操作启动。' : (!CustomerTasks.canImportCustomers()?'创建后可分配已有客户；新名单请由租户管理员导入。':draft.type==='预外呼'?'创建后，点击任务操作列的“导入客户”，名单自动加入当前任务。':'创建后，下一步是在“导入与分配”中为任务添加客户。')}</p>",
    "      <p class=\"wizard-review-next\">${isDccDraft(draft)?'创建后，在同一业务分类的分配规则中配置此预外呼任务。':count ? '创建后可在任务列表查看进度和操作启动。' : (!CustomerTasks.canImportCustomers()?'创建后可分配已有客户；新名单请由租户管理员导入。':draft.type==='预外呼'?'创建后，点击任务操作列的“导入客户”，名单自动加入当前任务。':'创建后，下一步是在“导入与分配”中为任务添加客户。')}</p>"
  ],
  [
    "按所选方式导入客户",
    "按分配规则接收线索"
  ],
  [
    "(isManualSelectionDraft(draft)&&count?'已选 '+count+' 位，创建时导入':'创建后接收 / 导入')",
    "'匹配规则后进入预外呼任务'"
  ],
  [
    "(isManualSelectionDraft(draft)?'可以先选名单，也可创建后添加':'创建后由业务系统导入')",
    "'线索入口：分配规则'"
  ],
  [
    "草稿不占用客户；确认创建时检查所选名单，保存独立的本次导入记录。",
    "手工导入与接口接入统一通过分配规则处理。"
  ],
  [
    "(draft.values.dccImportSource==='api'?'业务系统接口导入（锁定）':'手工导入（锁定）')",
    "'由分配规则分派'"
  ],
  [
    "row.dccManaged?row.dccImportSource==='api'?'任务已创建，请到“客户与处理记录”页接收业务系统接口线索。':manualCreationTransactionId?'任务已创建，所选客户已导入当前任务，原资料与历史保留。':'任务已创建，可在“客户与处理记录”导入新名单，业务分类自动沿用任务配置。'",
    "row.dccManaged?'任务已创建，请在分配规则中配置此预外呼任务。'"
  ],
  [
    "    if(row.isWizardDraft)return '请先完成任务创建';",
    "    if(row.isWizardDraft)return '请先完成任务创建';\n    if(row.dccImportSource==='rules')return '线索由分配规则分派，不支持从任务直接导入';"
  ],
  [
    "    if(row?.callType!=='预外呼'||!canAccessObject(row))return '';",
    "    if(row?.callType!=='预外呼'||!canAccessObject(row)||row.dccImportSource==='rules')return '';"
  ],
  [
    "      button('import','导入客户','openCustomerImport',CloudTaskWorkspace.customerImportReason(row))+'</div>';",
    "      (row.dccImportSource==='rules'?'':button('import','导入客户','openCustomerImport',CloudTaskWorkspace.customerImportReason(row)))+'</div>';"
  ],
  [
    "+(isPredictive?'<button class=\"btn btn-primary\" type=\"button\" id=\"predictiveImportCustomers\" onclick=\"CloudTaskWorkspace.openCustomerImport()\">导入客户</button>':'')",
    ""
  ],
  [
    "const sourceLabel = source => source === 'manual' ? '手工导入' : '接口导入';",
    "const sourceLabel = source => source === 'rules' ? '分配规则' : source === 'manual' ? '手工导入' : '接口导入';"
  ],
  [
    "      <div class=\"dcc-record-heading\"><div><h2>客户与处理记录</h2><p>查看客户名单、导入异常与待处理事项。</p></div><button class=\"btn btn-primary\" id=\"dccImportCustomers\" type=\"button\" ${readOnlyReason||importBusy?'disabled':''} title=\"${esc(readOnlyReason||'导入至当前任务')}\" onclick=\"${handler('openImport',task.taskId)}\" data-func-id=\"FUNC-004\">${task.dccImportSource==='api'?'接口接收':'导入客户'}</button></div>",
    "      <div class=\"dcc-record-heading\"><div><h2>客户与处理记录</h2><p>查看客户名单、导入异常与待处理事项。</p></div>${task.dccImportSource==='rules'?'':`<button class=\"btn btn-primary\" id=\"dccImportCustomers\" type=\"button\" ${readOnlyReason||importBusy?'disabled':''} title=\"${esc(readOnlyReason||'导入至当前任务')}\" onclick=\"${handler('openImport',task.taskId)}\" data-func-id=\"FUNC-004\">${task.dccImportSource==='api'?'接口接收':'导入客户'}</button>`}</div>"
  ],
  [
    "${readOnlyReason?'<p class=\"dcc-muted dcc-manual-disabled-reason\">",
    "${readOnlyReason&&task.dccImportSource!=='rules'?'<p class=\"dcc-muted dcc-manual-disabled-reason\">"
  ],
  [
    "${row.dccImportSource==='api'?'接收业务系统线索':'从任务记录页手工导入线索'}",
    "${row.dccImportSource==='rules'?'等待分配规则派发线索':row.dccImportSource==='api'?'接收业务系统线索':'从任务记录页手工导入线索'}"
  ],
  [
    "          const expected=importChannel==='API'?'api':'manual';if(importChannel==='API'",
    "          if(row.dccImportSource==='rules')throw Error('线索由分配规则分派，不支持从任务直接导入');\n          const expected=importChannel==='API'?'api':'manual';if(importChannel==='API'"
  ],
  [
    "  function dccSourceSelection(draft) {\n    const selected=draft.values.dccImportSource;\n    return `<section class=\"wizard-customers dcc-wizard-source\" id=\"wizardDccSource\" tabindex=\"-1\" data-func-id=\"FUNC-016\"><div class=\"wizard-section-title\"><h3>客户导入方式</h3><span>确认创建后锁定</span></div><div class=\"wizard-choice-grid\">\n      <label class=\"wizard-choice ${selected==='api'?'selected':''}\"><input type=\"radio\" name=\"dccImportSource\" id=\"wizardDccSourceApi\" value=\"api\" ${selected==='api'?'checked':''} onchange=\"CloudTaskWorkspace.setDccSource(this.value)\"><span><strong>业务系统接口导入</strong><small>创建后由业务系统导入本任务，保留各自来源</small></span></label>\n      <label class=\"wizard-choice ${selected==='manual'?'selected':''}\"><input type=\"radio\" name=\"dccImportSource\" id=\"wizardDccSourceManual\" value=\"manual\" ${selected==='manual'?'checked':''} onchange=\"CloudTaskWorkspace.setDccSource(this.value)\"><span><strong>手工导入</strong><small>选择已有名单，或创建后上传／粘贴名单</small></span></label></div>\n      <p class=\"wizard-soft-note\">${selected==='api'?'接口任务不混入手工名单。业务系统导入时指定当前任务。':selected==='manual'?'可以选择已有的待分配客户；也可以先创建任务，随后导入新名单。':'请选择本任务的导入方式。'}</p>${errorSlot('wizardDccSource')}</section>`;\n  }\n  function setDccSource(source) {\n    const draft=activeDraft();\n    if(!draft||draft.editTaskId||draft.type!=='预外呼'||!['api','manual'].includes(source))return false;\n    if(draft.values.dccImportSource!==source){draft.values.customerIds=[];draft.values.manualSelectionEdits={};draft.values.manualSelectedSnapshots={};draft.values.customerMode=source==='manual'&&selectionPool(draft).length?'now':'later';}\n    draft.values.dccImportSource=source;\n    persist();AppState.setDirty(true);clearFormErrors();refresh(true);refreshPreview();return true;\n  }\n",
    "  function setDccSource() { return false; }\n"
  ]
];
  const edits = [
    ["  function typeLabel(type) { return type === '预外呼' ? '预外呼' : '自动外呼'; }",
      before=>before+'\n'+helpers],
    ["...(type==='预外呼'?{unifiedCategoryId:''}:{}),","...(type==='预外呼'?{unifiedCategoryId:'',customerVoice:'',customerVoiceName:''}:{}),"],
    ["      integerField('callRouteStrategy',1,2,'wizardCallRouteStrategy','座席呼转模式');",
      before=>"      if(!empty(v.customerVoice)){\n        if(typeof v.customerVoice!=='string')issue('请选择有效的客户侧提示音','wizardCustomerVoicePath');\n        else fields.customerVoice=text(v.customerVoice);\n      }\n"+before],
    ["    'customerTimeout','concurrency','timeStrategy','callRouteStrategy','ivrId','ivrName','cnos','agentGroup',",
      before=>before.replace("'customerTimeout',","'customerTimeout','customerVoice',")],
    ["    const settingKeys=['description','businessTagNames','autoComplete','retryStrategyOnlyToday','callPriority','concurrency',",
      before=>before+"'customerVoice',"],
    ["    if(changed('businessTagNames'))fields.businessTagNames=text(v.businessTagNames);",
      before=>before+"\n    if(predictive&&changed('customerVoice'))fields.customerVoice=text(v.customerVoice);"],
    ["row.alictiMockTaskProperty={...(caller.ok?caller.fields:{}),id:row.demoProviderTaskId,status:0,type:row.providerType};",
      before=>before.replace('id:row.demoProviderTaskId',"...(row.alictiCreateDraft?.fields?.customerVoice?{customerVoice:row.alictiCreateDraft.fields.customerVoice}:{}),id:row.demoProviderTaskId")],
    ["        callRouteStrategy:settingNumber(v,'callRouteStrategy',1),agentTimeout:settingNumber(v,'agentTimeout',10),",
      before=>"        customerVoice:v.customerVoice||'',customerVoiceName:v.customerVoiceName||'',\n"+before],
    ["      ['接通后流转',value('callRouteStrategy',1)==='未记录'",
      before=>"      ['客户侧提示音',v.customerVoice?(v.customerVoiceName||v.customerVoice):'不播放提示音'],\n"+before],
    ["const value=structuredClone(draft);delete value.values.unifiedCategoryId;",
      before=>before.replace('delete value.values.unifiedCategoryId;',"delete value.values.customerVoiceLibrary;if(value.editOriginalValues)delete value.editOriginalValues.customerVoiceLibrary;delete value.values.unifiedCategoryId;")],
    ["key!=='unifiedCategoryBrandId'&&key!=='retryEditor'&&JSON.stringify(draft.values[key])",
      before=>before.replace("key!=='retryEditor'","key!=='retryEditor'&&key!=='customerVoiceLibrary'")],
    ['<summary>呼叫顺序与高级设置<span>按需调整</span></summary><div class="wizard-more-body">',
      before=>before+'\n        ${customerVoiceControl(draft)}'],
    ["    const changes=Object.keys(draft.values).filter(key=>JSON.stringify(draft.values[key])!==JSON.stringify(draft.editOriginalValues?.[key]));",
      "    const changes=Object.keys(draft.values).filter(key=>!['customerVoiceLibrary','customerVoiceName'].includes(key)&&\n      JSON.stringify(draft.values[key])!==JSON.stringify(draft.editOriginalValues?.[key]));"],
    ["  function update(key, value) {\n    const draft=activeDraft();if(!draft||!['name','description'",
      before=>before.replace("    const draft=activeDraft();if", "    const draft=activeDraft();\n    if (key==='customerVoice') return updateCustomerVoice(draft,key,value);\n    if")],
    ["draft.tenantId = tenantId;if(draft.type==='预外呼')draft.values.unifiedCategoryId='';",
      before=>before.replace("draft.values.unifiedCategoryId='';", "Object.assign(draft.values,{unifiedCategoryId:'',customerVoice:'',customerVoiceName:''});")],
    ["  function taskSettingsIssue(draft,step) {", before=>before+'\n    if (step===5) {const voiceIssue=customerVoiceIssue(draft);if(voiceIssue)return voiceIssue;}'],
    ["        callStrategy:requestDraft.fields.callStrategy,",before=>before+"\n        customerVoice:requestDraft.fields.customerVoice||'',customerVoiceName:draft.values.customerVoiceName||'',"],
    ["    const localCategory=saveTaskBusinessCategoryOnly(draft,row);if(localCategory!==null)return localCategory;",
      before=>"    const voiceIssue=customerVoiceIssue(draft);if(voiceIssue){showFormError(voiceIssue);return false;}\n"+before],
    ["      'callRouteStrategy','contactFlowId','providerIvrId','cnos','agentGroup','outboundGroupId','outboundGroupSnapshot',",
      before=>before.replace("'callRouteStrategy',","'customerVoice','customerVoiceName','callRouteStrategy',")],
    ["      alictiUpdateDraft:row.alictiUpdateDraft?.fields||null});",
      before=>"      customerVoice:ensureSnapshotObject(row).customerVoice,\n"+before],
    ["        callStrategy:taskCallStrategy(row),",
      before=>before+"\n        customerVoice:pick('customerVoice')??row.alictiMockTaskProperty?.customerVoice??'',customerVoiceName:pick('customerVoiceName')??'',"],
    ["        unifiedCategoryId:taskBusinessCategoryId(row),minAvailableAgentCount:v.minAvailableAgentCount??'',callStrategy:v.callStrategy,",
      before=>before+"\n        customerVoice:v.customerVoice,customerVoiceName:v.customerVoiceName,"]
  ];

  let html = cloud.html;
  for (const [before,replace] of [...edits,...allocationEdits]) {
    const at = html.indexOf(before);
    if (at < 0 || html.lastIndexOf(before)!==at) throw Error('无法定位预外呼提示音配置：'+before.slice(0,70));
    html = html.slice(0,at)+(typeof replace==='function'?replace(before):replace)+html.slice(at+before.length);
  }
  cloud.html = html;
})();
