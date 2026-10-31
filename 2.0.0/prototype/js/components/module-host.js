(function () {
  'use strict';
  const frames={}, readyKinds=new Set();let inlineSlot=null;let currentKind='', pending={},seatLink=null;
  const map={};DNav.pages.forEach(p=>{if(p.module==='ai'||p.module==='cloud')map[p.id]={kind:p.module,route:p.route.split('#')[0]};});
  Object.assign(map,{'PAGE-2228':{kind:'cloud',route:'flow-templates'},'PAGE-2226':{kind:'cloud',route:'business-records'},'PAGE-2227':{kind:'cloud',route:'business-record-detail'}});
  map['PAGE-2112']={kind:'ai',route:'finance-service'};
  Object.assign(map,window.DCatalogEntries||{},window.DBusinessEntries||{});
  const waiters=[],aiWaiters=[];
  const aliases={'cloud':{'accounts':'PAGE-2003','tenants':'PAGE-2004','brand-archives':'PAGE-2005','brand-leads':'PAGE-2204','business-records':'PAGE-2226','business-record-detail':'PAGE-2227','brand-business-categories':'PAGE-2006','flow-templates':'PAGE-2228','business-fields':'PAGE-2223','inbound-routes':'PAGE-2207','manual-outbound':'PAGE-2202','agent-skills':'PAGE-2211'},'ai':{'home':'PAGE-2102','scene-block':'PAGE-2007','sys-account':'PAGE-2003','sys-tenant':'PAGE-2004'}};
  function routeMap(kind){const result={...aliases[kind]};Object.keys(map).forEach(id=>{if(map[id].kind===kind)result[map[id].route]=id;});if(kind==='ai'){result['finance-export']='PAGE-2106';for(const [group,ids] of Object.entries({'nav-scene':['PAGE-2103'],'nav-report':['PAGE-2105','PAGE-2106','PAGE-2107'],'nav-result':['PAGE-2108','PAGE-2109'],'nav-system':['PAGE-2004','PAGE-2003','PAGE-2110','PAGE-2111','PAGE-2007']}))result[group]=ids.find(id=>DSession.allowed(id))||ids[0];}if(kind==='cloud')['overview','lead','customer','outbound','agent','inbound','skill'].forEach(type=>{result['cloud-'+type+'-report']='PAGE-2209';});return result;}
  function makeContext(kind,route){
    const context=DSession.context();const grant=context.scope.grant;
    const nativeSession={accountId:context.account.id,profileId:context.account.nativeProfile||('integrated-'+context.account.id),sessionId:'mock-'+context.account.id,tenantId:DSession.isPlatformContext(context)?'TENANT-SUPER-BUILTIN':context.scope.kind==='tenant'?context.scope.id:'TENANT-SUPER-BUILTIN',enterpriseId:context.scope.tenant?.enterpriseId||(grant.enterpriseIds||[])[0]||'7522240',authStage:'READY',loginPlatform:'cloud',currentPage:route};
    const synthetic=DSeed.syntheticLegacy?.accounts.find(a=>a.id===context.account.id),group=synthetic?.fixtureStorageGroup||'legacy';
    return {context,route,nativeSession,routeMap:routeMap(kind),management:window.DOrganization?.snapshot(),storagePrefix:DSession.nativeStoragePrefix(context),syntheticLegacyCatalogs:synthetic&&group==='legacy'?DSeed.syntheticLegacy.catalogs:null};
  }
  // Apply only the native page's known display-label fragments, without changing its data or route contracts.
  function nativeDocument(kind){
    let html=DNativeModules[kind].html;
    if(kind!=='cloud')return html;
    const labels=[
      ["ui.pageHeader('流转规则模板',","ui.pageHeader('流转模板',"],
      [' · 流转规则模板</h2>',' · 流转模板</h2>'],
      ['暂无流转规则模板，点击“新增模板”开始。','暂无流转模板，点击“新增模板”开始。'],
      ["'新增流转规则模板'","'新增流转模板'"],
      ['<h2>删除流转规则模板</h2>','<h2>删除流转模板</h2>'],
      ['模板尚未配置节点，请先在流转规则模板中维护。','模板尚未配置节点，请先在流转模板中维护。'],
      ["label: '流转规则模板', permission: 'business.flow.configure'","label: '流转模板', permission: 'business.flow.configure'"]
    ];
    if(DSession.isGlobalAdministrator())labels.push(['创建应用，获取用于申请 token 的接入密钥。','全平台统一管理应用及授权租户，不受顶部品牌或租户切换影响。']);
    labels.forEach(([before,after])=>{html=html.split(before).join(after);});
    return html;
  }
  function create(kind,route){
    const frame=document.createElement('iframe');frame.className='d-native-frame';frame.dataset.nativeModule=kind;frame.title=kind==='ai'?'AI外呼原页面':'云呼叫原页面';
    const data=JSON.stringify(makeContext(kind,route)).replace(/</g,'\\u003c');
    const historyBridge="['pushState','replaceState'].forEach(function(name){var original=history[name].bind(history);history[name]=function(state,title,url){return original(state,title);};});";
    const boot='<script>window.DNativeContext='+data+';'+historyBridge+'<\/script>';
    frame.srcdoc=nativeDocument(kind).replace('<!--D_BOOT-->',boot);
    frame.addEventListener('error',()=>DUI.toast('专业页面加载失败，请重新进入。'));
    frame.hidden=true;document.getElementById('page-host').appendChild(frame);frames[kind]=frame;return frame;
  }
  let templateFullscreen=null;
  function setTemplateEditorFullscreen(enabled){
    if(!enabled){if(templateFullscreen){templateFullscreen.frame.classList.remove('d-template-editor-fullscreen');templateFullscreen.inert.forEach(([node,value])=>{if(node.isConnected)node.inert=value;});templateFullscreen=null;}return true;}
    const frame=frames.cloud,c=DSession.context(),native=frame?.contentWindow.DNativeContext?.context;
    if(!frame||frame.hidden||currentKind!=='cloud'||!readyKinds.has('cloud')||!DSession.allowed('PAGE-2228')||window.DApp?.currentPage?.()!=='PAGE-2228'||!frame.contentDocument?.getElementById('flow-configuration-editor')||native?.account.id!==c?.account.id||native?.scope.id!==c?.scope.id){setTemplateEditorFullscreen(false);return false;}
    if(templateFullscreen?.frame===frame)return true;
    const inert=[],seen=new Set();let child=frame;
    while(child.parentElement){const parent=child.parentElement;Array.from(parent.children).forEach(node=>{if(node!==child&&!seen.has(node)&&!['SCRIPT','STYLE','LINK'].includes(node.tagName)){seen.add(node);inert.push([node,node.inert]);node.inert=true;}});if(parent===document.body)break;child=parent;}
    templateFullscreen={frame,inert};frame.classList.add('d-template-editor-fullscreen');return true;
  }
  function hide(){
    const readonlyLayer=frames.cloud?.contentDocument?.getElementById('flow-configuration-editor');
    if(readonlyLayer?._flowEditor?.readOnly)frames.cloud.contentWindow.FlowConfiguration?.cancel?.();
    setTemplateEditorFullscreen(false);Object.values(frames).forEach(f=>{f.hidden=true;f.classList.remove('d-native-inline');f.style.top='';f.style.height='';});inlineSlot=null;currentKind='';}
  function open(id,filters,options){
    let target=map[id];if(!target||!DSession.allowed(id))return false;
    if(id==='PAGE-2207'&&DSession.roleKey().endsWith('_ops'))target={kind:'cloud',route:'seat-workbench'};
    if(id==='PAGE-2204'&&DSession.regulation()?.pages.includes(id))target={kind:'cloud',route:'business-records'};
    if(DSession.needsTenant(id)){
      hide();const node=document.getElementById('app');node.hidden=false;node.innerHTML='<section class="platform-page"><h1>'+DUI.esc(DSession.page(id).name)+'</h1><p>当前品牌暂无可用租户，请先在租户管理中新增或关联租户。</p></section>';return true;
    }
    if(id==='PAGE-2112'&&!DSession.can('F54')){hide();const node=document.getElementById('app');node.hidden=false;node.innerHTML='<section class="platform-page"><div class="d-page-heading"><h1>AI充值管理</h1></div><div class="platform-alert warning">当前身份的AI服务明细及充值权限尚未明确配置。公共租户管理和汇总导出权限不会自动授予该权限。</div></section>';return false;}
    if(id==='PAGE-2106'&&DSession.context().scope.kind==='platform'&&DSession.context().scope.grant.role==='finance')target={kind:'ai',route:'finance-export'};
    if(target.kind==='cloud'&&!DSession.context().account.nativeProfile&&DSession.context().scope.kind!=='tenant'&&!DSeed.resourceGrants?.[DSession.context().account.id]){
      hide();const host=document.getElementById('app');host.hidden=false;host.innerHTML='<div class="d-page-empty"><h1>'+DUI.esc(DSession.page(id).name)+'</h1><p>该专业范围的页面正在接入。</p></div>';return false;
    }
    pending[target.kind]={id,route:target.route,filters,options};
    hide();currentKind=target.kind;
    const frame=frames[target.kind]||create(target.kind,target.route);frame.hidden=false;
    if(readyKinds.has(target.kind)){const ok=frame.contentWindow.DAdapter.navigate(target.route,{preserveFilters:true,...filters,...options});if(ok===false)DUI.toast('原页面的权限或状态检查未通过，请核对当前使用范围。');}
    return true;
  }
  // Read-only source-derived shape checks; CRUD permissions and business guards remain separate.
  function validateCloudReferenceValue(name,v){
    const obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x), str=x=>typeof x==='string', id=x=>str(x)&&x.length>0,
      integer=(x,min=0)=>Number.isSafeInteger(x)&&x>=min, rows=x=>Array.isArray(x)&&x.every(obj), strings=x=>Array.isArray(x)&&x.every(str), ids=x=>Array.isArray(x)&&x.every(id),
      unique=x=>new Set(x).size===x.length, has=(x,k)=>Object.hasOwn(x,k), only=(x,keys)=>Object.keys(x).every(k=>keys.includes(k)),
      optional=(x,k,check)=>x[k]===undefined||check(x[k]), fields=(x,keys,check=rows)=>obj(x)&&keys.every(k=>check(x[k])),
      version=(field,n)=>obj(v)&&v[field]===n, revision=(min=0)=>integer(v.revision,min), jsonKey=(key,n)=>{try{const a=JSON.parse(key);return Array.isArray(a)&&a.length===n&&a.every(id)?a:null;}catch(_){return null;}},
      scope=x=>obj(x)&&id(x.tenantId)&&id(x.enterpriseId), task=x=>scope(x)&&id(x.taskId)&&['预外呼','IVR 外呼'].includes(x.callType),
      call=x=>scope(x)&&id(x.callId), sameTask=(a,b)=>task(a)&&task(b)&&['taskId','tenantId','enterpriseId','callType'].every(k=>a[k]===b[k]),
      optionalArrays=(x,keys)=>keys.every(k=>optional(x,k,rows)), sameScope=(a,b)=>a.tenantId===b.tenantId&&a.enterpriseId===b.enterpriseId;
    function fieldRow(f){return obj(f)&&id(f.id)&&id(f.label)&&str(f.businessKey)&&typeof f.enabled==='boolean'&&['text','textarea','number','select','multiselect','date','datetime','interface'].includes(f.type)&&rows(f.options)&&f.options.every(o=>id(o.id)&&str(o.label)&&str(o.businessKey))&&optional(f,'depends',strings);}
    function bundle(b){return scope(b)&&rows(b.fields)&&b.fields.every(fieldRow)&&unique(b.fields.map(f=>f.id))&&rows(b.types)&&unique(b.types.map(t=>t.id))&&b.types.every(t=>obj(t)&&id(t.id)&&id(t.label)&&typeof t.enabled==='boolean'&&str(t.prefix)&&rows(t.fields)&&t.fields.every(r=>id(r.fieldId)&&b.fields.some(f=>f.id===r.fieldId)&&typeof r.enabled==='boolean'&&typeof r.required==='boolean'))&&optional(b,'retiredTypes',x=>rows(x)&&x.every(a=>obj(a.row)&&rows(a.fields)));}
    function group(g){return only(g,['outboundGroupId','gno','name','comment','tenantId','enterpriseId','memberIdentityIds','revision','createTime','localUpdatedAt','mock','providerVerified','demoAgentGroup'])&&['outboundGroupId','gno','name','tenantId','enterpriseId','createTime'].every(k=>id(g[k]))&&str(g.comment)&&g.comment.length<=100&&g.name.length<=50&&ids(g.memberIdentityIds)&&unique(g.memberIdentityIds)&&integer(g.revision)&&g.mock===true&&/^(?=.*[0-9])[a-zA-Z][a-zA-Z0-9]{1,19}$/.test(g.gno.trim())&&(g.demoAgentGroup===undefined||g.demoAgentGroup===g.gno);}
    function clock(s){return str(s)&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(s);}
    function date(s){if(!str(s)||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;}
    function time(r){return id(r.id)&&Number.isSafeInteger(Number(r.id))&&Number(r.id)>0&&id(r.enterpriseId)&&id(r.name)&&[1,2].includes(Number(r.type))&&[1,2].includes(Number(r.timeType))&&Number.isSafeInteger(Number(r.priority))&&Number(r.priority)>0&&clock(r.startTime)&&clock(r.endTime)&&r.startTime<=r.endTime&&ids(r.tenantIds)&&r.tenantIds.length>0&&unique(r.tenantIds)&&(Number(r.type)===1?str(r.dayOfWeek)&&/^([1-7])(?:,[1-7])*$/.test(r.dayOfWeek)&&unique(r.dayOfWeek.split(','))&&r.fromDay===''&&r.toDay==='':date(r.fromDay)&&date(r.toDay)&&r.fromDay<=r.toDay&&r.dayOfWeek==='');}
    try{
      switch(name){
        // F customer-tasks.load; nativeJournal; CustomerDirectory writer; ScenarioDemo writer/journal.
        case 'customer-task-batches-v1':return rows(v)&&v.every(b=>id(b.id)&&rows(b.rows)&&b.rows.every(r=>id(r.id)&&rows(r.calls)));
        case 'native-workbench-records-v1':return rows(v)&&v.every(call)&&unique(v.map(r=>r.callId));
        case 'customer-directory-v1':return version('version',1)&&rows(v.calls)&&v.calls.every(call)&&optional(v,'unmerged',x=>rows(x)&&x.every(call));
        case 'linked-scenario-demo-v1':return obj(v)&&typeof v.enabled==='boolean'&&rows(v.calls)&&v.calls.every(call)&&rows(v.tasks)&&v.tasks.every(task);
        case 'local-task-result-journal-v1':return version('version',1)&&rows(v.calls)&&v.calls.every(call);
        case 'customer-followup-v111-current':return version('version',1)&&rows(v.entries)&&v.entries.every(e=>str(e.key)&&jsonKey(e.key,4)&&obj(e.values));
        case 'cloud-task-created-v1':return rows(v)&&v.every(task)&&unique(v.map(r=>r.taskId));
        // Transactions: the stronger required members below come from explicit writers, not loose recovery readers.
        case 'cloud-task-creation-transaction-v1':return version('version',1)&&id(v.taskId)&&obj(v.draftBefore)&&id(v.draftBefore.draftId)&&task(v.taskAfter)&&v.taskAfter.taskId===v.taskId&&obj(v.attachment)&&typeof v.committed==='boolean';
        case 'cloud-task-repeat-transaction-v1':return version('version',1)&&id(v.taskId)&&sameTask(v.taskBefore,v.taskAfter)&&v.taskBefore.taskId===v.taskId&&obj(v.attachment)&&typeof v.committed==='boolean';
        case 'cloud-task-import-transaction-v1':return version('version',1)&&obj(v.batch)&&id(v.batch.id)&&rows(v.batch.rows)&&sameTask(v.before,v.after)&&sameScope(v.batch,v.before)&&typeof v.committed==='boolean';
        case 'brand-lead-ledger-v120':return version('schema',1)&&fields(v,['brands','bindings','leads'])&&v.brands.every(r=>id(r.brandId))&&v.bindings.every(r=>id(r.tenantId))&&v.leads.every(r=>id(r.brandId)&&id(r.leadCode))&&optional(v,'management',m=>obj(m)&&m.version===2&&fields(m,['accounts','memberships','tenants']));
        case 'business-flow-ledger:condition-first-reset-v1':return v===4;
        case 'business-flow-ledger':return version('schema',4)&&fields(v,['templates','categories','records','batches','requests','contactPolicies'])&&v.templates.every(r=>id(r.templateId)&&id(r.brandId)&&integer(r.latestVersion,1)&&rows(r.versions)&&r.versions.every(x=>integer(x.version,1)&&rows(x.nodes)))&&v.categories.every(r=>id(r.categoryId)&&id(r.brandId)&&rows(r.versions))&&v.records.every(r=>id(r.recordId)&&id(r.brandId)&&id(r.ownerTenantId)&&obj(r.categorySnapshot))&&v.batches.every(r=>id(r.batchId)&&id(r.brandId)&&id(r.tenantId)&&rows(r.rows))&&v.requests.every(r=>id(r.requestId))&&optional(v,'deletedTemplateIds',strings);
        case 'customer-business-config-v111-current':return version('version',1)&&revision()&&rows(v.scopes)&&v.scopes.every(bundle)&&optional(v,'brandScopes',x=>rows(x)&&x.every(b=>id(b.brandId)&&bundle(b)))&&optional(v,'routingRequests',x=>rows(x)&&x.every(r=>id(r.requestId)&&id(r.brandId)&&id(r.categoryId)&&['success','failed','unknown'].includes(r.status)));
        case 'business-data-dictionary-v111-current':return version('version',1)&&revision()&&rows(v.entries)&&v.entries.every(e=>/^d-[a-zA-Z0-9_-]+$/.test(e.id)&&id(e.name)&&e.name.length<=60&&id(e.capabilityId)&&typeof e.enabled==='boolean'&&strings(e.tenantIds)&&unique(e.tenantIds)&&integer(e.sourceRevision)&&obj(e.tenantRevisions)&&Object.values(e.tenantRevisions).every(x=>integer(x)))&&unique(v.entries.map(e=>e.id))&&unique(v.entries.map(e=>e.name.toLocaleLowerCase()));
        case 'dcc-runtime-v1.1.0':return version('schemaVersion','1.1.0')&&optional(v,'revision',x=>integer(x))&&rows(v.applications)&&v.applications.every(a=>id(a.applicationId)&&a.applicationId.startsWith('DEMO-DCC-APP-')&&ids(a.authorizedTenantIds)&&a.authorizedTenantIds.length>0&&(!has(a,'name')||id(a.name)&&a.name.length<=60)&&(!has(a,'credentialPlaceholder')||id(a.credentialPlaceholder)&&a.credentialPlaceholder.startsWith('MOCK-')))&&unique(v.applications.map(a=>a.applicationId));
        case 'dcc-task-ledger-v1.1.0':return version('schemaVersion','1.1.0')&&integer(v.sequence)&&obj(v.tasks)&&Object.entries(v.tasks).every(([key,e])=>obj(e)&&obj(e.task)&&e.task.taskId===key&&scope(e.task)&&id(e.task.supplierTaskId)&&fields(e,['records','localFailures','submissions'])&&optionalArrays(e,['failureEvents','failureDetails','failureGroups','deliveries','exportSnapshots','actualResults','resultReviews','queryEvidence','failureRetryPlans','failureRetryAttempts','deletionRequests'])&&optional(e,'creationImports',obj))&&optionalArrays(v,['communicationEvents','manualImportTransactions','requestReceipts']);
        case 'alicti-number-import-v1':return rows(v)&&v.every(r=>id(r.numberId)&&id(r.enterpriseId)&&obj(r.alictiNumber));
        case 'alicti-inbound-router-v1':return version('version',1)&&fields(v,['rows','pending','journal'])&&v.rows.every(r=>id(String(r.id??''))&&id(String(r.enterpriseId??''))&&[1,2].includes(Number(r.active))&&[1,2,3].includes(Number(r.routerType))&&id(String(r.routerProperty??''))&&integer(Number(r.priority),1)&&ids(r.localTenantIds||r.tenantIds))&&v.pending.every(r=>str(r.id)&&id(r.enterpriseId)&&obj(r.request))&&v.journal.every(r=>id(r.id)&&id(r.enterpriseId)&&str(r.action)&&str(r.status));
        case 'alicti-extension-directory-v2':return version('schemaVersion',2)&&revision()&&rows(v.rows)&&v.rows.every(r=>id(r.id)&&scope(r)&&str(r.exten)&&/^\d+$/.test(r.exten)&&[1,2,3].includes(r.type)&&[0,1].includes(r.active)&&!Object.keys(r).some(k=>/password/i.test(k)))&&rows(v.deleted)&&v.deleted.every(r=>id(r.enterpriseId)&&str(r.exten)&&/^\d+$/.test(r.exten))&&unique(v.rows.map(r=>JSON.stringify([r.enterpriseId,r.exten])))&&unique(v.rows.map(r=>JSON.stringify([r.enterpriseId,r.id])));
        case 'alicti-time-conditions-v1':return version('version',1)&&revision()&&rows(v.rows)&&v.rows.every(time)&&['id','name','priority'].every(k=>unique(v.rows.map(r=>JSON.stringify([r.enterpriseId,String(r[k])]))))&&optional(v,'nextId',n=>integer(n,1)&&n>Math.max(95999,...v.rows.map(r=>Number(r.id))));
        case 'account-seat-v1':return version('version',1)&&fields(v,['seats','attempts'])&&v.seats.every(r=>scope(r)&&id(r.agentRecordId)&&id(r.contactCenterIdentityId)&&id(r.cno))&&v.attempts.every(r=>scope(r)&&id(r.id)&&id(r.kind)&&str(r.accountId)&&['失败','成功','开通中'].includes(r.status)&&str(r.message)&&str(r.updatedAt)&&optional(r,'history',rows))&&optional(v,'skillAssignments',x=>rows(x)&&x.every(r=>scope(r)&&id(r.identityId)&&rows(r.relations)));
        case 'alicti-seat-phone-config-v1':return version('schemaVersion',1)&&revision(1)&&only(v,['schemaVersion','revision','extensions','updatedAtBySeat'])&&obj(v.extensions)&&Object.entries(v.extensions).every(([key,value])=>jsonKey(key,4)&&str(value)&&(value===''||/^\d+$/.test(value)))&&optional(v,'updatedAtBySeat',x=>obj(x)&&Object.entries(x).every(([key,time])=>has(v.extensions,key)&&str(time)&&Number.isFinite(Date.parse(time))));
        case 'alicti-seat-operation-profiles-v1':return version('schemaVersion',1)&&revision(1)&&only(v,['schemaVersion','revision','profiles'])&&obj(v.profiles)&&Object.entries(v.profiles).every(([key,r])=>jsonKey(key,4)&&obj(r)&&only(r,['loginStatus','pauseDescription','workingMode'])&&[1,2].includes(Number(r.loginStatus))&&optional(r,'pauseDescription',str)&&(r.workingMode==null||['0','4','5'].includes(r.workingMode)));
        case 'alicti-seat-event-log-v1':return version('version',1)&&rows(v.rows)&&v.rows.every(r=>scope(r)&&id(r.id)&&id(r.cno)&&id(r.seatIdentityId)&&['login','idle','busy','offline','signalLost','signalRestored','softphoneLost'].includes(r.type)&&id(r.source)&&Number.isFinite(r.occurredAt)&&optional(r,'updatedAt',Number.isFinite));
        case 'alicti-accounts-v3':return version('schemaVersion',3)&&revision(1)&&rows(v.accounts)&&rows(v.audits)&&v.accounts.every(a=>only(a,['configId','enterpriseId','name','brandCustomerName','credentialConfigured','callerNavigations','remark','status','version','verification','aliases','seedEnterpriseId','createdAt','updatedAt','createdBy','updatedBy'])&&id(a.configId)&&id(a.enterpriseId)&&id(a.name)&&a.name===a.name.trim()&&id(a.brandCustomerName)&&typeof a.credentialConfigured==='boolean'&&str(a.remark)&&['RUNNING','STOPPED'].includes(a.status)&&integer(a.version,1)&&a.verification==='unverified'&&ids(a.aliases)&&unique(a.aliases)&&rows(a.callerNavigations)&&a.callerNavigations.every(n=>only(n,['name','customerClidsGroup'])&&id(n.name)&&n.name===n.name.trim()&&id(n.customerClidsGroup)&&n.customerClidsGroup===n.customerClidsGroup.trim())&&unique(a.callerNavigations.map(n=>n.customerClidsGroup))&&['createdAt','updatedAt','createdBy','updatedBy'].every(k=>optional(a,k,str)))&&unique(v.accounts.map(a=>a.configId))&&unique(v.accounts.map(a=>a.enterpriseId))&&v.audits.every(a=>['auditId','source','configId','enterpriseId','previousEnterpriseId','tenantId','operator','action','object','before','after','at'].every(k=>str(a[k])))&&unique(v.audits.map(a=>a.auditId));
        case 'alicti-queue-bindings-v1':return version('schemaVersion',1)&&revision(1)&&only(v,['schemaVersion','revision','bindings','queues'])&&rows(v.bindings)&&rows(v.queues)&&v.bindings.every(b=>only(b,['enterpriseId','tenantId','physicalGroupId','qno','checkedAt','checkedFingerprint','updatedAt','updatedBy','simulation'])&&['enterpriseId','tenantId','physicalGroupId','qno'].every(k=>id(b[k]))&&['checkedAt','checkedFingerprint','updatedAt','updatedBy'].every(k=>str(b[k]))&&b.simulation===true)&&unique(v.bindings.map(b=>JSON.stringify([b.enterpriseId,b.physicalGroupId])))&&v.queues.every(q=>['enterpriseId','tenantId','qno','name','description','strategy'].every(k=>id(q[k]))&&q.simulation===true&&['ACTIVE','STOPPED'].includes(q.status)&&ids(q.cnos)&&rows(q.queueSkills)&&q.queueSkills.every(s=>integer(s.skillId,1)&&Number.isInteger(s.skillLevel)&&s.skillLevel>=1&&s.skillLevel<=10)&&unique(q.queueSkills.map(s=>s.skillId))&&optional(q,'skillMappings',x=>rows(x)&&x.every(m=>id(m.physicalGroupId)&&integer(m.skillId,1))))&&unique(v.queues.map(q=>JSON.stringify([q.enterpriseId,q.qno])));
        case 'outbound-groups-v1':return version('schemaVersion',1)&&revision()&&only(v,['schemaVersion','revision','groups'])&&rows(v.groups)&&v.groups.every(group)&&unique(v.groups.map(g=>g.outboundGroupId))&&unique(v.groups.map(g=>JSON.stringify([g.enterpriseId,g.gno])))&&unique(v.groups.map(g=>JSON.stringify([g.enterpriseId,g.tenantId,g.name])))&&unique(v.groups.flatMap(g=>g.memberIdentityIds.map(i=>JSON.stringify([g.enterpriseId,i]))));
      }
      if(name.startsWith('skill-groups-v2:')){
        const enterpriseId=name.slice('skill-groups-v2:'.length);return id(enterpriseId)&&version('version',2)&&v.enterpriseId===enterpriseId&&rows(v.templates)&&rows(v.groups)&&v.templates.length<=1000&&v.groups.length<=1000&&v.templates.every(t=>id(t.skillTemplateId)&&t.enterpriseId===enterpriseId&&id(t.name)&&id(t.code)&&str(t.description)&&str(t.status))&&v.groups.every(g=>id(g.physicalGroupId)&&id(g.skillGroupId)&&g.enterpriseId===enterpriseId&&id(g.tenantId)&&id(g.name)&&str(g.status)&&str(g.syncStatus))&&unique(v.templates.map(t=>t.skillTemplateId))&&unique(v.groups.map(g=>g.physicalGroupId));
      }
      if(name.startsWith('cloud-task-record-v1:')){
        if(!task(v))return false;const body=name.slice('cloud-task-record-v1:'.length),parts=body.split(':');return parts.length===3&&parts[0]===encodeURIComponent(v.taskId)&&/^(?:0|[1-9]\d*)$/.test(parts[1])&&Number.isSafeInteger(Number(parts[1]))&&Number(parts[1])===Number(v._localTaskRevision||0)&&id(parts[2]);
      }
      if(name.startsWith('call-data-sync-v1:')){
        if(!version('version',1)||!str(v.identity)||!obj(v.sync)||!obj(v.snapshot))return false;
        const identity=JSON.parse(v.identity),snapshotKeys=['telephony','alictiCdr','result','durationSeconds','answeredAt'];
        return Array.isArray(identity)&&identity.length===8&&identity.every(str)&&identity.slice(0,3).every(id)&&name==='call-data-sync-v1:'+encodeURIComponent(v.identity)&&snapshotKeys.every(k=>has(v.snapshot,k))&&obj(v.sync.finalSnapshot)&&snapshotKeys.every(k=>has(v.sync.finalSnapshot,k))&&['pending','synced','error'].includes(v.sync.status)&&id(v.sync.revision);
      }
      return false;
    }catch(_){return false;}
  }
  const referenceCache=new Map();
  function referenceStatus(type,id,includeCloud=true){
    const unknown=message=>({state:'unknown',message}),referenced=message=>({state:'referenced',message});
    const accountFields=new Set(['accountId','operatorId','operatorAccountId','actorId','actorAccountId','assignedAccountId','ownerId','createdBy','updatedBy','createdByAccountId','updatedByAccountId']);
    const tenantFields=new Set(['tenantId','ownerTenantId','sourceTenantId','targetTenantId']);
    const fields=type==='account'?accountFields:tenantFields;
    function contains(value){if(!value||typeof value!=='object')return false;for(const [key,v] of Object.entries(value)){if(fields.has(key)&&v===id)return true;if(Array.isArray(v)){if((type==='account'&&['accountIds','authorizedAccountIds','memberAccountIds'].includes(key)||type==='tenant'&&['tenantIds','authorizedTenantIds'].includes(key))&&v.includes(id)||v.some(contains))return true;}else if(v&&typeof v==='object'&&contains(v))return true;}return false;}
    function parse(key,raw,repository){
      const cached=referenceCache.get(key);if(cached?.raw===raw)return cached.value;
      const original=raw,packed='\u001ealicti-json-dict-v1:';
      if(raw.startsWith(packed)){
        if(!['customer-task-batches-v1','local-task-result-journal-v1','customer-directory-v1'].includes(repository))throw Error('Unknown compact owner');
        const tuple=JSON.parse(raw.slice(packed.length));
        if(!Array.isArray(tuple)||tuple.length!==2||!Array.isArray(tuple[0])||typeof tuple[1]!=='string')throw Error('Invalid compact envelope');
        const [dictionary,encoded]=tuple;
        if(!dictionary.every(token=>typeof token==='string'&&/^"(?:[^"\\]|\\.)*"$/.test(token)&&typeof JSON.parse(token)==='string'))throw Error('Invalid compact dictionary');
        raw=encoded.replace(/\u0001([0-9a-z]+);/g,(_,v)=>{const i=parseInt(v,36);if(!Number.isSafeInteger(i)||i>=dictionary.length)throw Error('Invalid compact reference');return dictionary[i];});
      }
      const value=JSON.parse(raw);referenceCache.set(key,{raw:original,value});if(referenceCache.size>64)referenceCache.delete(referenceCache.keys().next().value);return value;
    }
    try{
      const prefix=DSession.prefix,object=DOrganization.snapshot().accounts.find(a=>a.id===id),relatedTenants=type==='tenant'?[id]:(object?.memberships||[]).map(m=>m.tenantId);let uncertain=null;
      // Original CustomerDemo stores a literal readiness marker, not business JSON.
      // Recognize only its known key/namespace and exact value; its business journal is still checked.
      const cloudNamespaces=[...new Set(['cloud:',...(DSeed.syntheticLegacy?.accounts||[]).map(a=>'cloud:synthetic-'+(a.fixtureStorageGroup||'legacy')+':')])].sort((a,b)=>b.length-a.length);
      const readinessKeys=new Set(cloudNamespaces.map(namespace=>namespace+'customer-closed-loop-demo-v1'));
      for(let i=0;i<localStorage.length;i++){
        const key=localStorage.key(i);if(!key?.startsWith(prefix))continue;const name=key.slice(prefix.length);
        const raw=localStorage.getItem(key);if(raw===null)continue;
        if(readinessKeys.has(name)){if(raw!=='ready')uncertain=unknown('本地演示准备状态无法核实，暂不允许删除');continue;}
        const namespace=cloudNamespaces.find(n=>name.startsWith(n)),repository=namespace?name.slice(namespace.length):'';
        let value;try{value=parse(key,raw,repository);}catch(_){uncertain=unknown('业务引用资料无法完整读取，暂不允许删除');continue;}
        const object=value&&typeof value==='object'&&!Array.isArray(value);
        if(name==='organization'){if(!object||value.version!==1||!Number.isSafeInteger(value.revision)||value.revision<0||!['brands','tenants','accounts','audit','operations'].every(k=>Array.isArray(value[k])))uncertain=unknown('组织资料结构无法核实，暂不允许删除');continue;}
        if(name==='positions'){if(!object||value.version!==1||!value.accounts||typeof value.accounts!=='object'||Array.isArray(value.accounts))uncertain=unknown('导航位置资料结构无法核实，暂不允许删除');continue;}
        // Source-owned fictional display/migration markers; business journals remain independent.
        if(namespace&&['alicti-showcase-clock-v1','demo-small-sample-migration-v1','demo-enterprise-scope-schema-v2'].includes(repository)){
          const keys=object?Object.keys(value):[];
          const valid=repository==='demo-enterprise-scope-schema-v2'?raw==='2':repository==='demo-small-sample-migration-v1'?object&&value.version===2&&keys.length===1:object&&keys.length===2&&keys.includes('day')&&keys.includes('anchor')&&typeof value.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value.day)&&Number.isFinite(Date.parse(value.day+'T00:00:00Z'))&&new Date(value.day+'T00:00:00Z').toISOString().slice(0,10)===value.day&&Number.isFinite(value.anchor);
          if(!valid)uncertain=unknown('本地演示元数据结构无法核实，暂不允许删除');continue;
        }
        if(name.startsWith('cloud:')){
          if(!namespace||!validateCloudReferenceValue(repository,value)){uncertain=unknown('云呼叫仓库或数据结构尚未核实，暂不允许删除');continue;}
          if(includeCloud&&(raw.includes(id)||contains(value)))return referenced('已有云呼叫业务引用');continue;
        }
        if(name==='contact-policy'){
          if(value?.version!==1||!Array.isArray(value.publicRecords)||!Array.isArray(value.audit)||!value.specialScopes){uncertain=unknown('联系限制引用资料待核，暂不允许删除');continue;}
          if(contains(value))return referenced('已有黑名单业务引用');
          if(type==='tenant'&&Object.hasOwn(value.specialScopes,'tenant:'+id))return referenced('已有本租户黑名单资料');
          continue;
        }
        if(name==='ai-category-associations'){
          if(value?.version!==1||!Array.isArray(value.rows)){uncertain=unknown('AI场景关联引用待核，暂不允许删除');continue;}
          if(contains(value))return referenced('已有AI场景分类关联引用');continue;
        }
        if(name.startsWith('ai-config:')){
          if(value?.schema!==1||!value.data||!Array.isArray(value.data.sceneRows)){uncertain=unknown('AI业务资料引用待核，暂不允许删除');continue;}
          const scopeTenant=name.startsWith('ai-config:tenant:')?name.slice('ai-config:tenant:'.length):'';
          if(type==='tenant'&&scopeTenant===id)return referenced('已有本租户AI业务配置或导入资料');
          if(contains(value))return referenced('已有AI业务引用');
          if(type==='account'&&relatedTenants.includes(scopeTenant))uncertain=unknown('相关AI资料未提供完整账号归属，暂不能证明无业务引用');
          continue;
        }
        if(name==='ai-service-ledger'){if(value?.version!==1||!Number.isSafeInteger(value.revision)||!value.tenants||typeof value.tenants!=='object'||Array.isArray(value.tenants)||!Object.entries(value.tenants).every(([tid,r])=>r&&r.tenantId===tid&&r.aiTenantId===DSeed.aiTenantIds[tid]&&String(r.profile?.id)===r.aiTenantId&&['rechargeRecords','adjustmentRecords','operationResults'].every(k=>Array.isArray(r[k])&&r[k].every(x=>x&&String(x.tenantId)===r.aiTenantId)))){uncertain=unknown('服务账务引用待核，暂不允许删除');continue;}if(contains(value))return referenced('已有AI服务账务引用');continue;}
        // Unknown business stores cannot be silently treated as an empty reference set.
        uncertain=unknown('存在尚未纳入核对的业务资料，暂不能证明无业务引用');
      }
      return uncertain||false;
    }catch(_){return unknown('业务引用读取失败，暂不允许删除');}
  }
  function integration(kind,id){
    const c=DSession.context(),w=frames.cloud?.contentWindow;
    if(!c||!w||!readyKinds.has('cloud')||w.DNativeContext.context.account.id!==c.account.id||w.DNativeContext.context.scope.id!==c.scope.id)return {known:false};
    try{
      if(['supplier','suppliers'].includes(kind)&&!DOrganization.canBindResource()&&!DOrganization.visibleTenantIds().some(t=>DOrganization.permission('module.open',t)))return {known:false};
      if(['binding','history'].includes(kind)&&!DOrganization.visibleTenantIds().includes(id))return {known:false};
      if(kind==='bindings'&&!DOrganization.brands().some(b=>b.id===id))return {known:false};
      w.DNativeContext.management=DOrganization.snapshot();w.applyDOrganizationIdentity();
      if(kind==='supplier'||kind==='suppliers'){
        if(w.AliCtiAccounts.restore()!==true)return {known:false};
        const rows=w.AliCtiAccounts.list().map(r=>({enterpriseId:r.enterpriseId,name:r.name,status:r.status,tenantIds:r.tenantIds||[],version:r.version}));
        return {known:true,value:kind==='supplier'?rows.find(r=>r.enterpriseId===id)||null:rows};
      }
      if(kind==='binding'||kind==='bindings'){const rows=w.BrandLeadStore.fresh().bindings;return {known:true,value:kind==='binding'?rows.find(r=>r.tenantId===id)||null:rows.filter(r=>r.brandId===id)};}
      if(kind==='history'){const t=w.CloudCallData.tenants.find(t=>t.tenantId===id);if(!t)return {known:false};const native=w.AppState.tenantHasBusinessData(t),other=referenceStatus('tenant',id,false);return native||other?.state==='referenced'?{known:true,value:true}:other?{known:false}:{known:true,value:false};}
    }catch(_){}return {known:false};
  }
  async function prepareIntegration(){
    const c=DSession.context(),identity=c?.account.id+'|'+c?.scope.id;
    if(!frames.cloud)create('cloud','');
    if(!readyKinds.has('cloud'))await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('资源资料读取尚未完成，请稍后重试。')),8000);waiters.push(()=>{clearTimeout(timer);resolve();});});
    const now=DSession.context();if(identity!==now?.account.id+'|'+now?.scope.id)throw Error('使用范围已变化，请重新打开资料。');
    return integration('suppliers');
  }
  // Read only the original account/seat association in its authorized resource scope.
  async function readAccountSeatSummaries(tenantId,accountIds){
    const unavailable=message=>({known:false,message});
    const before=DSession.context(),identity=before?.account.id+'|'+before?.scope.id;
    const authorized=()=>DSession.allowed('PAGE-2003')&&DOrganization.visibleTenantIds().includes(tenantId);
    if(!before||!authorized()||!Array.isArray(accountIds)||accountIds.some(id=>typeof id!=='string'))return unavailable('没有该租户的账号查看权限。');
    const ids=[...new Set(accountIds)],members=new Set(DOrganization.members(tenantId).map(row=>row.account.id));
    if(ids.some(id=>!members.has(id)))return unavailable('账号与所选租户的成员关系已变化，请重新读取。');
    const target=DOrganization.snapshot().tenants.find(t=>t.id===tenantId);
    if(!target?.enterpriseId||!target.modules.cloud)return unavailable('云呼叫资源未就绪，坐席关联待核。');
    try{
      await prepareIntegration();
      const now=DSession.context(),latest=DOrganization.snapshot().tenants.find(t=>t.id===tenantId),currentMembers=new Set(DOrganization.members(tenantId).map(row=>row.account.id));
      if(identity!==now?.account.id+'|'+now?.scope.id||!authorized()||!latest||latest.enterpriseId!==target.enterpriseId||latest.modules.cloud!==true||ids.some(id=>!currentMembers.has(id)))return unavailable('使用范围或资源关联已变化，请重新读取坐席关联。');
      const w=frames.cloud?.contentWindow;
      if(!w?.AccountSeat||!w.AppState.canMenu('accounts')||!w.AppState.authorizeObject('',{tenantId,enterpriseId:target.enterpriseId}))return unavailable('请切换到该租户核对坐席关联。');
      const snapshot=w.AccountSeat.restore();if(snapshot?.version!==1||!Array.isArray(snapshot.attempts))return unavailable('原坐席操作记录暂时无法核对。');
      const rows=ids.map(accountId=>{
        const matches=w.CloudCallData.agents.filter(a=>a.accountId===accountId&&a.tenantId===tenantId&&a.enterpriseId===target.enterpriseId&&a.lifecycleStatus!=='已删除');
        if(matches.length>1)return {accountId,tenantId,enterpriseId:target.enterpriseId,opened:null,seatName:'待核',state:'关联不唯一，请核对'};
        const agent=w.AccountSeat.forAccount(accountId,tenantId,target.enterpriseId),reason=!agent?w.AccountSeat.scopeError(tenantId,target.enterpriseId,accountId):'';
        const attempt=snapshot.attempts.filter(row=>row.accountId===accountId&&row.tenantId===tenantId&&row.enterpriseId===target.enterpriseId).sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')))[0];
        const pending=attempt&&['失败','开通中'].includes(attempt.status),uncertain=!!reason||matches.length>0||pending;
        return {accountId,tenantId,enterpriseId:target.enterpriseId,opened:agent?true:uncertain?null:false,seatName:agent?.userName||'',state:agent?.lifecycleStatus||reason||(pending?(attempt.status==='失败'?'开通/关联失败':'待重新核对'):'未关联')};
      });
      return {known:true,rows};
    }catch(_){return unavailable('坐席关联暂时无法可靠读取，请保留原资料后重试。');}
  }
  async function readCloudTenantSummary(){
    const unavailable=message=>({known:false,message}),before=DSession.context(),identity=before?.account.id+'|'+before?.scope.id;
    const target=before?.scope.tenant;
    if(!before||!DSession.isGlobalAdministrator()||!DSession.allowed('PAGE-2004'))return unavailable('当前无原云服务接入摘要查看权限。');
    if(!target?.enterpriseId)return unavailable('请选择业务租户后查看当前云服务接入情况。');
    try{
      await prepareIntegration();const now=DSession.context();
      if(identity!==now?.account.id+'|'+now?.scope.id||!DSession.isGlobalAdministrator()||!DSession.allowed('PAGE-2004')||now.scope.tenant?.enterpriseId!==target.enterpriseId)return unavailable('使用范围已变化，请重新读取接入情况。');
      const w=frames.cloud?.contentWindow,access=w?.AppState?.effectiveAccess?.();
      if(!access?.valid||access.roleCode!=='SUPER_ADMIN'||!w.AppState.canMenu('home')||w.AppState.get().enterpriseId!==target.enterpriseId||!Array.isArray(w.CloudCallData?.tenants))return unavailable('原云服务接入情况暂时无法核对。');
      const rows=w.CloudCallData.tenants.filter(t=>t.enterpriseId===target.enterpriseId&&!t.builtIn&&(t.capabilitySet||[]).includes('CLOUD_CONTACT_CENTER'));
      const instance=(w.CloudCallData.instances||[]).find(i=>i.enterpriseId===target.enterpriseId);
      return {known:true,enterpriseId:target.enterpriseId,enterpriseName:instance?.name||target.enterpriseId,total:rows.length,enabled:rows.filter(t=>t.status==='启用').length,disabled:rows.filter(t=>t.status==='停用').length,headquarters:rows.filter(t=>t.organizationScope==='HEADQUARTERS').length,stores:rows.filter(t=>t.organizationScope==='STORE').length};
    }catch(_){return unavailable('云服务接入情况暂时无法可靠读取，请稍后重试。');}
  }
  function canService(tenantId){return DSession.can('F54')&&DSession.serviceTenantIds('service.view').includes(tenantId)&&DSession.allowed('PAGE-2112');}
  function contactExecutionScope(tenantId){
    const c=DSession.context();
    if(!c||c.scope.kind!=='tenant'||c.scope.id!==tenantId||DSession.roleKey(c)==='super')throw Error('只能核对当前实际业务租户的联系范围');
    return c;
  }
  async function prepareContactCoordination(tenantId){
    const authorized=()=>{
      const c=contactExecutionScope(tenantId);
      if(c.account.enabled===false||!c.scope.tenant?.enabled||!['hq_admin','hq_ops','store_admin','store_ops'].includes(DSession.roleKey(c))||!['ai','cloud'].some(kind=>c.scope.tenant.modules?.[kind]===true&&c.scope.grant?.modules?.includes(kind)))throw Error('当前租户联系核对资格已变化');
      return c;
    };
    const before=authorized(),identity=before.account.id+'|'+before.scope.id;
    // A hidden shared read model carries contact facts. Creating it grants no
    // Cloud page, seat, resource or mutation permission and does not navigate.
    const created=!frames.cloud,frame=frames.cloud||create('cloud','');
    try{
      if(!readyKinds.has('cloud'))await new Promise((resolve,reject)=>{
        const done=()=>{clearTimeout(timer);resolve();},timer=setTimeout(()=>{const i=waiters.indexOf(done);if(i>=0)waiters.splice(i,1);reject(Error('共享联系检查尚未就绪，请重试'));},8000);waiters.push(done);
      });
      const current=authorized(),w=frame.contentWindow;
      if(frames.cloud!==frame||identity!==current.account.id+'|'+current.scope.id||w?.DNativeContext?.context?.account.id!==current.account.id||w?.DNativeContext?.context?.scope.id!==tenantId)throw Error('联系核对期间账号或租户已变化，请重新导入');
      if(typeof w.BusinessFlowStore?.contactPolicyRead!=='function'||typeof w.BusinessFlowStore?.contactPolicyStatus!=='function')throw Error('共享联系检查模型尚未就绪，请重试');
      return true;
    }catch(error){
      if(created&&frames.cloud===frame&&!readyKinds.has('cloud')&&frame.hidden&&currentKind!=='cloud'&&!seatLink){frame.remove();delete frames.cloud;}
      throw error;
    }
  }
  function readContactExecutionFacts(tenantId,rawPhone){
    const c=contactExecutionScope(tenantId),phone=String(rawPhone||'').replace(/[\s-]/g,''),facts=[],active=[],seen=new Set(),seenActive=new Set();
    if(!/^(1[3-9]\d{9}|0\d{9,11})$/.test(phone))return {known:false,facts,active,message:'联系号码尚未准确核定'};
    const parse=v=>{const n=window.DListOrder?.parse(v);return typeof n==='number'&&Number.isFinite(n)?n:null;},exact=w=>w?.DNativeContext?.context?.account.id===c.account.id&&w?.DNativeContext?.context?.scope.id===tenantId;
    const number=row=>String(row?.customerPhone||row?.rawPhone||row?.originalPhone||row?.phone||(row?.direction==='呼入'?row?.caller:row?.callee)||'').replace(/[\s-]/g,'');
    const addActive=(id)=>{if(!seenActive.has(id)){seenActive.add(id);active.push({id,tenantId,phone});}};
    function addCall(row,source){
      if(!row||number(row)!==phone||row.direction==='呼入'||row.callType==='呼入'||row.businessFlowRecordId||row.fourNodeRecordId)return;
      const id=row.callId||row.sessionId||row.contactId;if(!id)return;
      const providerId=String(row.providerId||row.supplierId||(source==='AI'?row.platform:'ALI_CTI')||'UNSPECIFIED'),executionScope=String(row.providerAccountId||row.aiAccountId||row.enterpriseId||c.scope.tenant.enterpriseId||tenantId),idType=row.callId?'CALL':row.sessionId?'SESSION':'CONTACT',canonicalId=JSON.stringify([tenantId,source,providerId,executionScope,idType,String(id)]);
      const begun=parse(row.dialedAt||row.ringingAt||row.startedAt||row.startTime),ended=parse(row.endedAt||row.endTime),uncertain=['待确认','提交中','已受理','排队中','结果未知'].includes(row.result||row.status);
      if(ended===null&&(begun!==null||row.queued===true||row.running===true))addActive(source+':'+id);
      if(begun!==null&&(row.actualDialed===true||row.dialed===true||!uncertain)&&!seen.has(canonicalId)){seen.add(canonicalId);facts.push({id:canonicalId,canonicalId,callId:String(id),providerCallId:String(id),providerId,executionScope,tenantId,phone,dialed:true,dialedAt:new Date(begun).toISOString(),source});}
    }
    const cloud=frames.cloud?.contentWindow;
    if(!readyKinds.has('cloud')||!exact(cloud))return {known:false,facts,active,message:'当前租户专业联系目录尚未就绪或范围已变化'};
    if(readyKinds.has('cloud')&&exact(cloud)){
      if(!Array.isArray(cloud.CloudCallData?.calls))return {known:false,facts,active,message:'专业通话目录暂无法完整读取'};
      for(const row of cloud.CloudCallData.calls)if(row.tenantId===tenantId)addCall(row,'CLOUD');
      const workbench=cloud.AgentWorkbench?.current?.();if(workbench?.busy&&workbench.tenant?.tenantId===tenantId&&workbench.call?.direction!=='呼入'&&number(workbench.call)===phone)addActive('WORKBENCH:'+(workbench.call.callId||c.account.id));
      for(const task of cloud.CloudCallData.tasks||[])if(task.tenantId===tenantId&&['执行中','运行中','进行中','running','RUNNING'].includes(task.status)){
        const rows=cloud.CustomerTasks?.taskExecutionCustomers?.(task);
        if(Array.isArray(rows))for(const row of rows)if(number(row)===phone&&!['已完成','已删除','已移除'].includes(row.followup||row.status)&&row.deleted!==true)addActive('CLOUD-TASK:'+task.taskId+':'+(row.id||phone));
      }
    }
    const ai=frames.ai?.contentWindow;
    if(readyKinds.has('ai')&&!exact(ai))return {known:false,facts,active,message:'AI联系目录的账号或租户范围已变化'};
    if(readyKinds.has('ai')&&exact(ai)){
      // Only exact scope identities and complete numbers participate; masked labels are never guessed.
      for(const row of ai.MockCallRecordRows||[])if((row.integrationTenantId||row.tenantId)===tenantId)addCall(row,'AI');
      for(const task of ai.MockSceneList||[])if(task.integrationTenantId===tenantId&&['running','queued','retry','unknown'].includes(task.status))for(const row of ai.MockAssignedData?.[task.id]||[])if(number(row)===phone&&row.deleted!==true&&!['completed','removed','已完成','已移除'].includes(row.state||row.status))addActive('AI-TASK:'+task.id+':'+(row.assignmentId||phone));
    }
    return {known:true,facts,active};
  }
  function readContactCoordination(tenantId,phone){
    try{const c=contactExecutionScope(tenantId),w=frames.cloud?.contentWindow;if(!readyKinds.has('cloud')||w?.DNativeContext?.context?.account.id!==c.account.id||w?.DNativeContext?.context?.scope.id!==tenantId)return {allowed:false,state:'coordination-pending',message:'联系协调目录尚未就绪，请稍后重试'};
      const result=w.BusinessFlowStore?.contactPolicyRead?.(tenantId,phone);if(result?.status!=='success')return {allowed:false,state:'coordination-pending',message:result?.message||'联系协调暂无法核定'};
      const data=result.data;return {allowed:data.allowed===true,occupied:data.occupied===true,state:data.code||'coordination-ready',message:data.message,...(data.nextAvailableAt?{nextAvailableAt:data.nextAvailableAt}:{})};
    }catch(error){return {allowed:false,state:'coordination-pending',message:error.message};}
  }
  function contactCoordinationActive(tenantId){
    try{const c=contactExecutionScope(tenantId),w=frames.cloud?.contentWindow;if(!readyKinds.has('cloud')||w?.DNativeContext?.context?.account.id!==c.account.id||w?.DNativeContext?.context?.scope.id!==tenantId)return {known:false,active:false};const r=w.BusinessFlowStore?.contactPolicyStatus?.(tenantId);if(r?.status!=='success')return {known:false,active:false};if(r.data.constraintsActive===true)return {known:true,active:true};
      const numbers=new Set(),add=row=>{const p=String(row?.customerPhone||row?.rawPhone||row?.originalPhone||row?.phone||(row?.direction==='呼入'?row?.caller:row?.callee)||'').replace(/[\s-]/g,'');if(/^(1[3-9]\d{9}|0\d{9,11})$/.test(p))numbers.add(p);};
      for(const row of w.CloudCallData?.calls||[])if(row.tenantId===tenantId)add(row);const bench=w.AgentWorkbench?.current?.();if(bench?.busy)add(bench.call);
      for(const task of w.CloudCallData?.tasks||[])if(task.tenantId===tenantId&&['执行中','运行中','进行中','running','RUNNING'].includes(task.status))for(const row of w.CustomerTasks?.taskExecutionCustomers?.(task)||[])add(row);
      const ai=frames.ai?.contentWindow;if(readyKinds.has('ai')&&(ai?.DNativeContext?.context?.account.id!==c.account.id||ai?.DNativeContext?.context?.scope.id!==tenantId))return {known:false,active:false};if(readyKinds.has('ai'))for(const task of ai.MockSceneList||[])if(task.integrationTenantId===tenantId&&['running','queued','retry','unknown'].includes(task.status))for(const row of ai.MockAssignedData?.[task.id]||[])add(row);
      for(const p of numbers){const facts=readContactExecutionFacts(tenantId,p);if(facts.known!==true)return {known:false,active:false};if(facts.active.length)return {known:true,active:true};}return {known:true,active:false};
    }catch(_){return {known:false,active:false};}
  }
  // Business arrangement reads a minimal scene projection, independently of tag-maintenance rights.
  function workflowSceneContext(){
    const c=DSession.context();
    if(!c||c.scope.kind!=='tenant'||DSession.roleKey(c)==='super'||!c.scope.tenant?.enabled||!DSession.allowed('PAGE-2204')||!DSession.canWrite('PAGE-2204')||!c.scope.tenant.modules?.ai||!c.scope.grant?.modules?.includes('ai'))throw Error('当前租户或成员没有AI呼叫使用权限');
    return c;
  }
  function currentWorkflowScenes(){
    const c=workflowSceneContext(),w=frames.ai?.contentWindow,identity=c.account.id+'|'+c.scope.id;
    if(!readyKinds.has('ai')||identity!==w?.DNativeContext?.context?.account.id+'|'+w?.DNativeContext?.context?.scope.id)throw Error('当前租户AI场景尚未就绪');
    const review=w.DAIConfigStore?.reviewCurrent();if(!review?.ok)throw Error(review?.reason||'AI场景配置待核');
    const data=w.DAIConfigStore.snapshot(),rawLinks=localStorage.getItem(DCatalog.key),links=rawLinks===null?{version:1,rows:[]}:JSON.parse(rawLinks);
    if(links.version!==1||!Array.isArray(links.rows))throw Error('AI场景分类关联待核');
    const definitions=DUnifiedCategories.definitions,relations=(DSeed.aiSceneRelations||[]).filter(r=>r.tenantId===c.scope.id),out=[],tagData=data.tags||{};
    // Workflow use reads only the current scene's minimal tag facts. It does not
    // grant the caller tag-maintenance rights or expose other tenant contexts.
    const tagContext=(categoryId,supplierId,tenantType,tagSceneId)=>{
      if(!Number.isSafeInteger(review.revision)||review.revision<0||!(tagData.MockTagSuppliers||[]).some(item=>item.id===supplierId&&item.status==='enabled'))return null;
      const key=supplierId+'_'+tenantType+'_'+tagSceneId,local=tagData.MockLocalTagSets?.[tenantType+'_'+tagSceneId],pool=tagData.MockSupplierTagPool?.[supplierId],config=tagData.MockTagConfigs?.[key],mapping=tagData.MockSupplierLocalTagMappings?.[key];
      if(!Array.isArray(local)||!Array.isArray(pool)||!Array.isArray(config?.enabledTagIds)||!mapping||typeof mapping!=='object'||Array.isArray(mapping))return null;
      const tags=local.map(item=>({id:item.id,label:item.name,supplierTagIds:config.enabledTagIds.filter(id=>pool.some(entry=>entry.id===id)&&mapping[id]===item.id)})).filter(item=>item.supplierTagIds.length);
      return tags.length?{categoryId,brandId:c.scope.tenant.brandId,tenantId:c.scope.id,supplierId,tenantType,tagSceneId,revision:review.revision,tags}:null;
    };
    for(const row of data.sceneRows||[]){
      if(row.enabled===false||['disabled','stopped','停用','已停用'].includes(row.status))continue;
      const relation=relations.find(r=>String(r.sceneId)===String(row.id)&&r.executionSceneId===row.sceneId&&r.platform===row.platform);
      // New configurations carry stable category and tenant IDs. Legacy labels alone are insufficient.
      const own=(row.tenantIds||[]).includes(c.scope.id)||row.tenantId===c.scope.id||row.integrationTenantId===c.scope.id;
      const associated=links.rows.filter(r=>r.tenantId===c.scope.id&&String(r.sceneId)===String(row.id)&&(r.categoryScope||'brand')==='brand'&&r.brandId===c.scope.tenant.brandId);
      if(associated.length>1)throw Error('AI场景存在多个分类关联，请先核对');
      const categoryId=associated[0]?.categoryId||row.unifiedCategoryId||(relation&&definitions.find(d=>d.tagId===relation.tagSceneId)?.id);
      if(!categoryId||(!relation&&!own)||!row.sceneId)continue;
      const supplierId=relation?.supplierId||row.supplierId||'',tagSceneId=relation?.tagSceneId||row.tagSceneId||'',tenantType=relation?.tenantType||row.tenantType||'',context=tagContext(categoryId,supplierId,tenantType,tagSceneId),aiContexts=context?[context]:[];
      const executionConfigurationFingerprint=JSON.stringify({row,categoryId,tenantId:c.scope.id,brandId:c.scope.tenant.brandId,supplierId,tagSceneId,tenantType,association:associated[0]||null});
      out.push({id:String(row.id),sceneId:String(row.id),executionSceneId:row.sceneId,name:row.name,categoryId,tenantId:c.scope.id,brandId:c.scope.tenant.brandId,platform:row.platform,supplierId,tagSceneId,tenantType,enabled:true,updatedAt:row.updatedAt||row.updateTime||'',aiContexts,executionConfigurationFingerprint,configurationFingerprint:JSON.stringify({executionConfigurationFingerprint,aiContexts})});
    }
    return {tenantId:c.scope.id,brandId:c.scope.tenant.brandId,identity,scenes:out};
  }
  async function readWorkflowScenes(){
    const c=workflowSceneContext(),identity=c.account.id+'|'+c.scope.id;
    if(!frames.ai)create('ai','');
    if(!readyKinds.has('ai'))await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('AI场景尚未就绪，请重试')),8000);aiWaiters.push(()=>{clearTimeout(timer);resolve();});});
    if(identity!==DSession.context()?.account.id+'|'+DSession.context()?.scope.id)throw Error('操作范围已变化，请重新读取场景');
    return currentWorkflowScenes();
  }
  async function prepareSeatCapabilities(){const c=DSession.context();if(!c||!c.scope.tenant?.modules.cloud||!c.scope.grant.modules?.includes('cloud')||!DSession.roleKey(c))return false;await prepareIntegration();return DSession.boundSeat();}
  DSession.setSeatResolver(c=>{const w=frames.cloud?.contentWindow,o=w?.DNativeContext?.context;if(!readyKinds.has('cloud')||!o||o.account.id!==c.account.id||o.scope.id!==c.scope.id)return false;return w.DProductionAccess?.boundSeat()===true;});
  if(window.DOrganization){DOrganization.setReferenceResolver(referenceStatus);DOrganization.setIntegrationResolver(integration);}
  DSession.setPageAvailability((id)=>{if(id==='PAGE-2207'&&DSession.roleKey().endsWith('_ops'))return DSession.boundSeat();const target=map[id],frame=target&&frames[target.kind];if(target?.kind==='cloud'&&!['PAGE-2006','PAGE-2223','PAGE-2228'].includes(id)&&frame&&readyKinds.has('cloud'))return frame.contentWindow.RouteRuntime?.canRoute(target.route)!==false;return true;});
  window.DModuleHost={setTemplateEditorFullscreen,isReady:kind=>readyKinds.has(kind),isActive:kind=>currentKind===kind||kind==='cloud'&&!!seatLink,isSeatLinkActive:()=>!!seatLink,supports:id=>!!map[id],open,hide,ready(kind,source){if(!frames[kind]||source&&frames[kind].contentWindow!==source)return false;readyKinds.add(kind);if(kind==='ai')aiWaiters.splice(0).forEach(resolve=>resolve());if(kind==='cloud')waiters.splice(0).forEach(resolve=>resolve());if(kind==='cloud'&&seatLink){frames.cloud.contentWindow.DAdapter.openSeatLink(seatLink.accountId,seatLink.tenantId);return;}const item=pending[kind];if(item&&frames[kind])frames[kind].contentWindow.DAdapter.navigate(item.route,{preserveFilters:true,...item.filters,...item.options});DApp.recheckNavigation();},
    openInline(kind,route,slot,options={}){if(kind!=='ai'||route!=='scene-block'||!DContactPolicy.canSpecial(DContactPolicy.specialScope()))return false;hide();inlineSlot=slot;currentKind=kind;pending[kind]={id:'PAGE-2007',route,options};const frame=frames[kind]||create(kind,route);frame.classList.add('d-native-inline');const host=document.getElementById('page-host');host.scrollTop=0;const top=slot.getBoundingClientRect().top-host.getBoundingClientRect().top;frame.style.top=top+'px';frame.style.height='calc(100% - '+(top+16)+'px)';frame.hidden=false;if(readyKinds.has(kind))frame.contentWindow.DAdapter.navigate(route,options);return true;},
    prepareIntegration,prepareContactCoordination,prepareSeatCapabilities,readAccountSeatSummaries,readCloudTenantSummary,readWorkflowScenes,currentWorkflowScenes,readContactExecutionFacts,readContactCoordination,contactCoordinationActive,canService,openService(tenantId){if(!canService(tenantId))return DUI.toast('没有此租户的AI服务管理权限。');return DApp.openPage('PAGE-2112',{nativeOptions:{serviceTenantId:tenantId}});},
    currentCatalog(options){if(!readyKinds.has('cloud'))throw Error('分类目录未就绪');return frames.cloud.contentWindow.DAdapter.readCatalog(options);},
    currentAIConfiguration(){if(!readyKinds.has('ai'))throw Error('AI配置未就绪');return frames.ai.contentWindow.DUnifiedAI.configuration();},
    async readAIConfiguration(){const c=DSession.context(),identity=c?.account.id+'|'+c?.scope.id;if(!DSession.allowed('PAGE-2111'))throw Error('没有AI标签配置权限');if(!frames.ai)create('ai','');if(!readyKinds.has('ai'))await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('AI标签配置尚未就绪')),8000);aiWaiters.push(()=>{clearTimeout(timer);resolve();});});if(identity!==DSession.context()?.account.id+'|'+DSession.context()?.scope.id)throw Error('范围已变化');return frames.ai.contentWindow.DUnifiedAI.configuration();},
    async readCatalog(options){await prepareIntegration();return frames.cloud.contentWindow.DAdapter.readCatalog(options);},
    openSeatLink(accountId,tenantId){const c=DSession.context(),target=DOrganization.snapshot().accounts.find(a=>a.id===accountId)?.memberships.find(m=>m.tenantId===tenantId);if(!target||!['admin','operator','seat'].includes(target.role)){DUI.toast('请先为成员设置管理员或运营角色，再关联坐席。');return false;}if(!DOrganization.permission('seat.link',tenantId)||c.scope.kind!=='tenant'||c.scope.id!==tenantId){DUI.toast('请在有权业务租户中维护坐席关联。');return false;}seatLink={accountId,tenantId};const frame=frames.cloud||create('cloud','agent-maintenance');frame.classList.add('d-seat-link');frame.hidden=false;if(readyKinds.has('cloud'))frame.contentWindow.DAdapter.openSeatLink(accountId,tenantId);return true;},
    finishRevokedCall(){const frame=frames.cloud;if(!frame||!readyKinds.has('cloud'))return false;const ok=frame.contentWindow.DAdapter.restrictToCurrentCall?.();if(ok){hide();currentKind='cloud';frame.hidden=false;document.getElementById('app').hidden=true;}return !!ok;},
    closeSeatLink(){const frame=frames.cloud;if(frame){frame.classList.remove('d-seat-link');frame.hidden=currentKind!=='cloud';}seatLink=null;DApp.recheckNavigation();},
    beforeLeave(next,proceed){if(seatLink){DUI.toast('请先完成或关闭坐席关联窗口。');return;}const frame=frames[currentKind];if(!frame||!readyKinds.has(currentKind)){proceed();return;}
      const adapter=frame.contentWindow.DAdapter;
      adapter.beforeLeave(next,()=>{try{DApp.saveFilters(adapter.getFilters());proceed();}catch(error){DUI.toast(error.message);}});
    },dispose(){setTemplateEditorFullscreen(false);Object.values(frames).forEach(frame=>frame.remove());Object.keys(frames).forEach(k=>delete frames[k]);readyKinds.clear();currentKind='';pending={};seatLink=null;inlineSlot=null;}
  };
})();
