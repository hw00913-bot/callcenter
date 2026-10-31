/* Explicit demonstration identities. No real credentials or authentication calls. */
(function () {
  'use strict';
  const ids = predicate => DNav.pages.filter(predicate).map(p => p.id);
  const management = ['PAGE-2003','PAGE-2004','PAGE-2005','PAGE-2006','PAGE-2007'];
  const resources = ids(p => ['PAGE-2210','PAGE-2211','PAGE-2212','PAGE-2213','PAGE-2214','PAGE-2215','PAGE-2216','PAGE-2217','PAGE-2218','PAGE-2219','PAGE-2220','PAGE-2221','PAGE-2222'].includes(p.id));
  // Seed the same business grants by stable identity; moving a menu is not a revocation.
  const business = ids(p => !['PAGE-2003','PAGE-2004','PAGE-2005'].includes(p.id) && !resources.concat(['PAGE-2110','PAGE-2111','PAGE-2106','PAGE-2112','PAGE-2006','PAGE-2223','PAGE-2228']).includes(p.id));
  const ai = ids(p => p.module === 'ai' && !['PAGE-2106','PAGE-2112'].includes(p.id));
  const member = (tenantId, role, modules, pages, landing, extra) => Object.assign({tenantId, role, modules, pages, landing, enabled:true}, extra || {});
  window.DSeed = {
    schema: 1,
    brands: [{id:'BRAND-NISSAN',name:'东风日产'}, {id:'BRAND-EPI',name:'东风奕派'}],
    tenants: [
      {id:'TEN-NISSAN-HQ',name:'东风日产总部',brandId:'BRAND-NISSAN',organization:'总部',commercialFlag:'commercial',enterpriseId:'7522240',enabled:true,modules:{ai:true,cloud:true}},
      {id:'TEN-NISSAN-SH',name:'上海华东门店',brandId:'BRAND-NISSAN',organization:'门店',commercialFlag:'trial',enterpriseId:'7522241',enabled:true,modules:{ai:true,cloud:true}},
      {id:'TEN-EPI-HQ',name:'东风奕派总部',brandId:'BRAND-EPI',organization:'总部',enterpriseId:'DEMO-ENT-003',enabled:true,modules:{ai:false,cloud:true}}
    ],
    accounts: [
      {id:'ACC-ADMIN-018',name:'李明',label:'租户管理员',enabled:true,nativeProfile:'admin',memberships:[member('TEN-NISSAN-HQ','admin',['ai','cloud'],ids(p=>!['PAGE-2215','PAGE-2219','PAGE-2220','PAGE-2221'].includes(p.id)),'PAGE-2204'),member('TEN-NISSAN-SH','admin',['ai','cloud'],ids(p=>!['PAGE-2215','PAGE-2219','PAGE-2220','PAGE-2221'].includes(p.id)),'PAGE-2204')]},
      {id:'ACC-OPS-108',name:'王静',label:'总部运营',enabled:true,nativeProfile:'operator-hq',memberships:[member('TEN-NISSAN-HQ','operator',['ai','cloud'],business,'PAGE-2204')]},
      {id:'ACC-OPS-066',name:'周岚',label:'门店运营',enabled:true,nativeProfile:'operator',memberships:[member('TEN-NISSAN-SH','operator',['ai','cloud'],business,'PAGE-2204')]},
      {id:'ACC-OPS-CHEN',name:'陈敏',label:'电话坐席',enabled:true,nativeProfile:'operator-chen',memberships:[member('TEN-NISSAN-HQ','seat',['cloud'],['PAGE-2202','PAGE-2203','PAGE-2204','PAGE-2208','PAGE-2209','PAGE-2225','PAGE-2226','PAGE-2227'],'PAGE-2202',{seatId:'1001'})]},
      {id:'DEMO-AI-READER',name:'林运营',label:'AI只读运营',enabled:true,memberships:[member('TEN-NISSAN-HQ','reader',['ai'],ai.filter(id=>!['PAGE-2110','PAGE-2111'].includes(id)),'PAGE-2102')]},
      {id:'DEMO-PUBLIC-ADMIN',name:'公共管理演示',label:'仅公共管理',enabled:true,memberships:[member('TEN-NISSAN-HQ','admin',[],management,'PAGE-2003')]},
      {id:'ACC-SUPER-001',name:'平台超级管理员',label:'超级管理员',enabled:true,nativeProfile:'super',memberships:[],platform:{id:'platform',label:'平台管理范围',role:'super',pages:management.concat(resources),landing:'PAGE-2004',tenantIds:['TEN-NISSAN-HQ','TEN-NISSAN-SH','TEN-EPI-HQ']}},
      {id:'DEMO-RESOURCE',name:'资源管理员',label:'仅供应商资源',enabled:true,memberships:[],platform:{id:'resources',label:'供应商资源范围',role:'resource',pages:resources,landing:'PAGE-2219',enterpriseIds:['7522240']}},
      {id:'DEMO-FINANCE',name:'服务财务',label:'仅AI服务财务',enabled:true,memberships:[],platform:{id:'finance',label:'AI服务财务范围',role:'finance',pages:['PAGE-2106','PAGE-2112'],landing:'PAGE-2106',tenantIds:['TEN-NISSAN-HQ']}}
    ]
  };

  const cloudAllowed={
    reader:ids(p=>['PAGE-2203','PAGE-2204','PAGE-2208','PAGE-2209','PAGE-2226','PAGE-2227'].includes(p.id)),
    operator:ids(p=>(p.module==='cloud'||['PAGE-2226','PAGE-2227'].includes(p.id))&&!resources.includes(p.id)),
    admin:ids(p=>(p.module==='cloud'||['PAGE-2226','PAGE-2227'].includes(p.id))&&!['PAGE-2215','PAGE-2219','PAGE-2220','PAGE-2221'].includes(p.id))
  };
  DSeed.rolePages={ai:{reader:ai.filter(id=>!['PAGE-2110','PAGE-2111'].includes(id)),operator:ai,admin:ai},cloud:cloudAllowed,publicOperator:[],publicAdmin:management};
  const delegates={ai:['reader','operator','admin'],cloud:['reader','operator','admin']};
  DSeed.tenants.forEach(t=>{t.hasBusinessData=true;});
  DSeed.accounts.forEach(a=>{
    a.login=a.id; a.builtIn=a.id==='ACC-SUPER-001';a.hasBusinessData=true;
    a.memberships.forEach(m=>{
      m.moduleRoles={ai:m.modules.includes('ai')?(m.role==='reader'?'reader':m.role==='admin'?'admin':'operator'):'',cloud:m.modules.includes('cloud')?(m.role==='admin'?'admin':'operator'):''};
      m.permissions=m.role==='admin'?['account.create','member.manage','member.disable','tenant.update','seat.link']:[];
      m.delegableRoles=m.role==='admin'?JSON.parse(JSON.stringify(delegates)):{};
    });
    if(a.platform){a.platform.permissions=[];a.platform.delegableRoles={};a.platform.brandIds=[];}
  });
  const superGrant=DSeed.accounts.find(a=>a.id==='ACC-SUPER-001').platform;
  superGrant.pages.push('PAGE-2228','PAGE-2204','PAGE-2226','PAGE-2227');
  superGrant.permissions=['brand.write','tenant.create','tenant.update','tenant.brand','module.open','account.create','member.manage','member.disable','account.disable','account.delete','tenant.delete','seat.link'];
  superGrant.brandIds=DSeed.brands.map(b=>b.id);superGrant.delegableRoles=delegates;
  // Explicit local examples, not inferred production identity correspondence.
  DSeed.aiSceneRelations=[
    {tenantId:'TEN-NISSAN-HQ',sceneId:'1',executionSceneId:'2021498427234983938',platform:'一知科技',supplierId:'yzzh',tagSceneId:'xxs',tenantType:'headquarters'},
    {tenantId:'TEN-NISSAN-HQ',sceneId:'6',executionSceneId:'ZKJ20260601001',platform:'中科金智能',supplierId:'zkj',tagSceneId:'xxs',tenantType:'headquarters'},
    {tenantId:'TEN-NISSAN-SH',sceneId:'6',executionSceneId:'ZKJ20260601001',platform:'中科金智能',supplierId:'zkj',tagSceneId:'xxs',tenantType:'store'},
    {tenantId:'TEN-NISSAN-SH',sceneId:'11',executionSceneId:'BL-SCENE-001',platform:'冰兰',supplierId:'bl',tagSceneId:'xxs',tenantType:'store'}
  ];
  DSeed.accounts.push({id:'DEMO-AI-PLATFORM',login:'ai-platform-demo',name:'AI平台维护',label:'AI专项管理',enabled:true,memberships:[],platform:{id:'ai-platform',label:'AI平台配置范围',role:'ai-platform',pages:['PAGE-2007'],landing:'PAGE-2007',tenantIds:[],brandIds:[],permissions:[],specialScope:'platform:ai-original-demo',specialPermissions:['view','group.create','group.update','group.delete','record.add','record.import','record.move','record.remove','sync.enable','sync.disable','sync.retry']}});
  // Distinct, explicitly owned local samples. Brand association never seeds another tenant's list.
  DSeed.specialFixtures={'tenant:TEN-NISSAN-SH':{
    groups:[{id:'sh-intent',name:'门店意向保护',desc:'本租户号码保护示例',expire:'7 天',count:0,platformBindings:[]},{id:'sh-local',name:'门店号码限制',desc:'独立来源示例',expire:'永久',count:0,platformBindings:[]}],
    rows:[{phone:'13800008888',name:'演示客户',groupId:'sh-intent',addType:'INTENT',reason:'意向保护示例',source:'本地演示',sourceType:'MANUAL',creator:'示例管理员',createdAt:'2026-10-26 09:00',effective:'7 天',_expiresAt:'2026-11-02T01:00:00.000Z',platformSync:{}},{phone:'13800008888',name:'演示客户',groupId:'sh-local',addType:'OTHER',reason:'同号另一独立来源',source:'本地演示',sourceType:'MANUAL',creator:'示例管理员',createdAt:'2026-10-26 09:00',effective:'永久',platformSync:{}}]
  }};
})();

/* Login presentation fixtures restored from v1.2.0. These are public, local-only
 * demonstration credentials; they never replace saved accounts or grant roles. */
DSeed.demoLogin = {
  defaultPassword: 'Demo@123456',
  smsCode: '8866',
  accounts: {
    'ACC-SUPER-001': {username:'super-product',password:'123456Aa@',mobile:'15975585393'},
    'ACC-ADMIN-018': {username:'nissan-admin',password:'Abc@123456',mobile:'13800002818'},
    'ACC-OPS-108': {username:'hq-operator',password:'Abc@123456',mobile:'13600001108'},
    'ACC-OPS-066': {username:'store-operator',password:'Abc@123456',mobile:'13900007066'},
    'ACC-OPS-CHEN': {username:'chenmin-operator',password:'Abc@123456',mobile:'13800005201'},
    'DEMO-AI-READER': {username:'ai-reader'},
    'DEMO-PUBLIC-ADMIN': {username:'public-admin'},
    'DEMO-RESOURCE': {username:'resource-admin'},
    'DEMO-FINANCE': {username:'service-finance'},
    'DEMO-AI-PLATFORM': {username:'ai-platform-demo'}
  }
};

// Explicit local fixture grants. No production role or tenant matching is inferred.
DSeed.aiTenantIds={'TEN-NISSAN-HQ':'2054080803329462274','TEN-NISSAN-SH':'2054073731284819970'};
DSeed.financialGrants={'DEMO-FINANCE':{scopeId:'finance',actions:['service.export'],tenantIds:['TEN-NISSAN-HQ']}};
DSeed.resourceGrants={'DEMO-RESOURCE':{scopeId:'resources',enterpriseIds:['7522240'],pages:['PAGE-2210','PAGE-2211','PAGE-2212','PAGE-2213','PAGE-2214','PAGE-2215','PAGE-2216','PAGE-2217','PAGE-2218','PAGE-2219','PAGE-2220','PAGE-2221','PAGE-2222']}};
DSeed.regulationGrants={'ACC-SUPER-001':{scopeId:'platform',pages:['PAGE-2204','PAGE-2226','PAGE-2227'],readOnly:true}};
DSeed.tenantResourceGrants={'ACC-SUPER-001':{scopeId:'platform',canBind:true}};
// Original super-admin recharge restored 2026-10-29 for explicitly mapped local AI accounts.
DSeed.financialGrants['ACC-SUPER-001']={scopeId:'platform',tenantIds:['TEN-NISSAN-HQ','TEN-NISSAN-SH'],actions:['service.view','service.trial','service.annual','service.credit','service.adjust','service.history'],sourceRole:'super_admin',operatorUsername:'super-product'};
DSeed.accounts.find(a=>a.id==='ACC-SUPER-001').platform.pages.push('PAGE-2112','PAGE-2102');

/* Isolated, explicitly synthetic legacy-directory QA fixture; never a migration. */
(function(){
  const ids=['SYN-LEGACY-TEN-A','SYN-LEGACY-TEN-B'];
  DSeed.syntheticLegacy={
    tenants:ids.map((id,i)=>({id,name:'合成旧目录租户'+(i?'B':'A'),brandId:'',organization:'门店',enterpriseId:'SYN-LEGACY-ENT-'+(i?'B':'A'),enabled:true,modules:{ai:false,cloud:false},hasBusinessData:false})),
    accounts:[{id:'SYN-LEGACY-ADMIN',login:'synthetic-legacy-admin',name:'合成旧目录验收',label:'隔离Mock · 非真实历史',enabled:true,memberships:ids.map(tenantId=>({tenantId,role:'admin',enabled:true,modules:[],moduleRoles:{ai:'',cloud:''},pages:['PAGE-2006','PAGE-2223'],landing:'PAGE-2006',permissions:[],delegableRoles:{}}))}],
    catalogs:Object.fromEntries(ids.map(id=>[id,{types:[{id:'syn-legacy-category',label:'合成旧目录分类',codeLabel:'合成业务编码',prefix:'SYN',enabled:true,configurationVersion:1,fields:[{fieldId:'syn-legacy-note',enabled:true,required:false}]}],fields:[{id:'syn-legacy-note',label:'合成备注',type:'text',businessKey:'synthetic_note',enabled:true,options:[]}]}]))
  };
})();
// Same business-admin qualification, separate synthetic Cloud data; no org/finance/call grants.
DSeed.syntheticLegacy.accounts.push({id:'SYN-BUSINESS-ADMIN',login:'synthetic-business-admin',name:'合成业务验收',label:'隔离Mock · 非原保存数据',fixtureStorageGroup:'business',enabled:true,memberships:['TEN-NISSAN-HQ','TEN-NISSAN-SH'].map(tenantId=>({tenantId,role:'admin',enabled:true,modules:['cloud'],moduleRoles:{ai:'',cloud:'admin'},pages:['PAGE-2006','PAGE-2223','PAGE-2228','PAGE-2204','PAGE-2226','PAGE-2227'],landing:'PAGE-2204',permissions:[],delegableRoles:{}}))});
// Explicit ownership of two native billing fixtures; never a name-based identity join.
DSeed.billingFixtureOwners={
 '1':{aiTenantId:'2054080803329462274',sourceTenantName:'重庆东风南方渝兴'},
 '5':{aiTenantId:'2054080803329462274',sourceTenantName:'重庆东风南方渝兴'}
};
// AI configuration/blacklist QA uses a distinct synthetic tenant key, not existing AI saves.
DSeed.syntheticLegacy.tenants.push({id:'SYN-AI-TENANT',name:'合成AI验收租户',brandId:'BRAND-NISSAN',organization:'门店',enterpriseId:'',enabled:true,modules:{ai:true,cloud:false},hasBusinessData:false});
DSeed.syntheticLegacy.accounts.push({id:'SYN-AI-ADMIN',login:'synthetic-ai-admin',name:'合成AI验收',label:'隔离Mock · 非原保存数据',fixtureStorageGroup:'ai',enabled:true,memberships:[{tenantId:'SYN-AI-TENANT',role:'admin',enabled:true,modules:['ai'],moduleRoles:{ai:'admin',cloud:''},pages:['PAGE-2103','PAGE-2108','PAGE-2109','PAGE-2110','PAGE-2111','PAGE-2007'],landing:'PAGE-2103',permissions:[],delegableRoles:{},contactAdd:false}]});
// Existing Cloud operations, isolated from saved business and resource ledgers.
// This synthetic identity creates no production authorization or actual CTI session.
DSeed.syntheticLegacy.accounts.push({id:'SYN-CLOUD-ADMIN',login:'synthetic-cloud-admin',name:'合成云呼叫验收',label:'隔离Mock · 非原保存数据',fixtureStorageGroup:'call',enabled:true,memberships:[{tenantId:'TEN-NISSAN-HQ',role:'admin',enabled:true,modules:['cloud'],moduleRoles:{ai:'',cloud:'admin'},pages:['PAGE-2202','PAGE-2203','PAGE-2204','PAGE-2205','PAGE-2206','PAGE-2207','PAGE-2208','PAGE-2209','PAGE-2210','PAGE-2211','PAGE-2225','PAGE-2226','PAGE-2227'],landing:'PAGE-2205',permissions:[],delegableRoles:{}}]});
DSeed.syntheticLegacy.accounts.push({id:'SYN-CLOUD-SUPER',login:'synthetic-cloud-super',name:'合成资源验收',label:'隔离Mock · 原超管资源权限',fixtureStorageGroup:'resources',sourceRoleFixture:'super',nativeProfile:'synthetic-super',enabled:true,memberships:[],platform:{id:'synthetic-resources',label:'合成呼叫资源范围',role:'super',pages:['PAGE-2207','PAGE-2210','PAGE-2211','PAGE-2212','PAGE-2213','PAGE-2214','PAGE-2215','PAGE-2216','PAGE-2217','PAGE-2218','PAGE-2219','PAGE-2220','PAGE-2221','PAGE-2222'],landing:'PAGE-2207',tenantIds:['TEN-NISSAN-HQ','TEN-NISSAN-SH','TEN-EPI-HQ'],enterpriseIds:['7522240','7522241'],permissions:[],brandIds:[],delegableRoles:{}}});
// Explicit synthetic supplier receipts for the UI-created acceptance seats only.
// These are independent Mock facts, never inferred from a real role or queue save.
DSeed.boundedTelephoneFixture={source:'SYNTHETIC_ACCEPTANCE_RECEIPT_20261027',supervisor:{enterpriseId:'7522240',tenantId:'TEN-NISSAN-HQ',accountId:'ACC-1793078689099-xkhz',identityId:'CCI-1793078776127-2',cno:'901040',qnos:['6999'],bindTel:'8102'},peer:{enterpriseId:'7522240',tenantId:'TEN-NISSAN-HQ',identityId:'CCI-1793079300137-3',cno:'901041',qnos:['6999'],bindTel:'8101',bindType:3,power:0},queue:{enterpriseId:'7522240',tenantId:'TEN-NISSAN-HQ',qno:'6999',name:'合成电话验收队列（模拟回执）',wrapupTime:1,agentStatuses:[{cno:'901041',name:'合成监管目标1027',state:'空闲'}],queueEntries:[]}};
DSeed.boundedSeatBatchReceipt={accountId:'SYN-CLOUD-SUPER',tenantId:'TEN-NISSAN-HQ',enterpriseId:'7522240',name:'合成未知批次1027',cnos:['901032'],outcome:'unknown'};
DSeed.boundedWorkflowFixture={accountId:'SYN-CLOUD-ADMIN',storageSuffix:'cloud:synthetic-call:',ownerName:'合成流程坐席1027',navigations:{'预外呼':'DEMO-HQ-DEFAULT-NAV','IVR 外呼':'DEMO-HQ-SERVICE-NAV'}};
DSeed.boundedRetryRecordFixture={accountId:'SYN-CLOUD-ADMIN',tenantId:'TEN-NISSAN-HQ',storageSuffix:'cloud:synthetic-call:',taskId:'TASK-PRED-D66028-f6c062a9',phone:'13800000102',leadCode:'SYN-PRED-1027-02'};
DSeed.boundedCallIssue={call:{callId:'SYN-CALL-ISSUE-1027',tenantId:'TEN-NISSAN-HQ',enterpriseId:'7522240',callType:'人工外呼',direction:'呼出',caller:'02100006101',callee:'13800009992',customerName:'合成异常客户1027',ringingAt:'2026-10-27 09:00:00',endedAt:null,durationSeconds:null,result:'结果待核对',processingStatus:'已保存',agentDisposition:'已完成',dispositionRemark:'合成异常核验，原业务处理结果须保留',simulation:true},issue:{issueId:'SYN-ISSUE-1027',callId:'SYN-CALL-ISSUE-1027',tenantId:'TEN-NISSAN-HQ',enterpriseId:'7522240',callee:'13800009992',callType:'人工外呼',type:'合成回执缺少结束信息',impact:'仅本条合成话单资料不完整',status:'待处理',detectedAt:'2026-10-27 09:01:00',attempts:0,trace:[],readback:{result:'已接通',endedAt:'2026-10-27 09:00:30',durationSeconds:30}}};

DSeed.boundedWorkflowTelephoneFixture={source:'SYNTHETIC_ACCEPTANCE_RECEIPT_20261027',mode:'seat-only',storageSuffix:'cloud:synthetic-call:',supervisor:{enterpriseId:'7522240',tenantId:'TEN-NISSAN-HQ',accountId:'SYN-CLOUD-ADMIN',identityId:'DEMO-CUSTOMER-IDENTITY',cno:'8801',qnos:['6998'],bindTel:'8101'},queue:{enterpriseId:'7522240',tenantId:'TEN-NISSAN-HQ',qno:'6998',name:'合成流程接听队列（模拟回执）',wrapupTime:1,agentStatuses:[],queueEntries:[]}};

/* Exact user approval call_4fba20cd26bc4fbcba59be69ccc04cd7[1]: local B only. */
(function(){
 const ids=['SYN-FIN-TRIAL-1028','SYN-FIN-ANNUAL-1028'];
 DSeed.financialAcceptanceFixtures=ids.map((id,i)=>({id,aiId:i?'9900000000000001029':'9900000000000001028',name:i?'合成年包验收1028':'合成试用验收1028',commercialFlag:i?'commercial':'trial'}));
 DSeed.syntheticLegacy.tenants.push(...DSeed.financialAcceptanceFixtures.map(f=>({id:f.id,name:f.name,brandId:'BRAND-NISSAN',organization:'门店',enterpriseId:f.id,enabled:true,modules:{ai:true,cloud:false},hasBusinessData:false})));
 DSeed.syntheticLegacy.accounts.push({id:'SYN-FIN-ADMIN-1028',login:'synthetic-fin-admin-1028',name:'合成服务验收1028',label:'仅独立试用/年包验收',fixtureStorageGroup:'finance-1028',enabled:true,memberships:[],platform:{id:'synthetic-finance-1028',label:'合成财务验收范围',role:'finance-service',pages:['PAGE-2112'],landing:'PAGE-2112',tenantIds:ids,brandIds:[],permissions:[],delegableRoles:{}}});
 DSeed.financialAcceptanceFixtures.forEach(f=>DSeed.aiTenantIds[f.id]=f.aiId);
 DSeed.financialGrants['SYN-FIN-ADMIN-1028']={scopeId:'synthetic-finance-1028',tenantIds:ids,sourceRole:'super_admin',operatorUsername:'synthetic-fin-admin-1028',actions:['service.view','service.trial','service.annual','service.history']};
})();

// User-requested recovery: super report access and explicit tenant/brand navigation.
DSeed.superReportPages=['PAGE-2105','PAGE-2106','PAGE-2107','PAGE-2209'];
DSeed.managedTenantAccounts={'ACC-SUPER-001':true};
(function(){const grant=DSeed.accounts.find(a=>a.id==='ACC-SUPER-001').platform;grant.pages=[...new Set(grant.pages.concat(DSeed.superReportPages))];})();

/* Current production presentation: five roles, optional telephone-seat capability.
 * Legacy fixture records stay available in their original local stores, not as role choices. */
(function(){
  const oldIds=new Set(['DEMO-AI-READER','DEMO-PUBLIC-ADMIN','DEMO-RESOURCE','DEMO-FINANCE','DEMO-AI-PLATFORM']);
  DSeed.legacyDemonstrationIds=[...oldIds];
  const usable=(id,role)=>['allow','conditional'].includes(DRolePermissions.matrix.pages[id]?.[role]);
  const pages=(module,role)=>DNav.pages.filter(p=>p.module===module&&usable(p.id,role)).map(p=>p.id);
  DSeed.rolePages={ai:{operator:pages('ai','hq_ops'),admin:pages('ai','hq_admin')},cloud:{operator:pages('cloud','hq_ops').concat(['PAGE-2225','PAGE-2226','PAGE-2227']),admin:pages('cloud','hq_admin').concat(['PAGE-2225','PAGE-2226','PAGE-2227'])},publicOperator:pages('public','hq_ops'),publicAdmin:pages('public','hq_admin')};
  const delegates={ai:['operator','admin'],cloud:['operator','admin']};
  for(const a of DSeed.accounts){
    if(oldIds.has(a.id))a.legacyDemonstration=true;
    for(const m of a.memberships||[]){
      if(m.role==='seat'){m.role='operator';a.label='租户总部运营';}
      if(!['admin','operator'].includes(m.role))continue;
      m.moduleRoles=Object.fromEntries(['ai','cloud'].map(k=>[k,m.modules.includes(k)?m.role:'']));
      m.pages=[...new Set((m.role==='admin'?DSeed.rolePages.publicAdmin:DSeed.rolePages.publicOperator).concat(...m.modules.map(k=>DSeed.rolePages[k][m.role])))];
      m.delegableRoles=m.role==='admin'?JSON.parse(JSON.stringify(delegates)):{};
    }
    if(a.platform?.role==='super'&&a.builtIn){a.platform.pages=[...new Set(DNav.pages.filter(p=>usable(p.id,'super')).map(p=>p.id).concat(['PAGE-2226','PAGE-2227']))];a.platform.delegableRoles=JSON.parse(JSON.stringify(delegates));}
  }
  const g=DSeed.financialGrants?.['ACC-SUPER-001'];if(g&&!g.actions.includes('service.export'))g.actions.push('service.export');
})();
