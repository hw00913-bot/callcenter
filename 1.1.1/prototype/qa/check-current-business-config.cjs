/** Current configuration schema, isolation, real model persistence and graph rules. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(process.argv[2] || path.join(__dirname,'..'));
let passed=0;const check=(value,message)=>{assert.ok(value,message);passed++;},copy=value=>JSON.parse(JSON.stringify(value));
function harness(){
  const scope={enterpriseId:'7522240',tenantId:'TEN-NISSAN-HQ'},state={...scope,accountId:'CURRENT_CONFIG_ADMIN',sessionId:'CURRENT_CONFIG_SESSION',activeDomain:'CLOUD_CONTACT_CENTER'},storage=new Map(),reads=[],writes=[];
  let role='SUPER_ADMIN',valid=true,authorized=true;
  const win={console,structuredClone,Date,Map,Set,JSON,Object,String,Number,Array,crypto:require('node:crypto').webcrypto,
    setTimeout,clearTimeout,addEventListener(){},dispatchEvent(){},CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail;}},
    fetch(){throw Error('network prohibited');},XMLHttpRequest:function(){throw Error('network prohibited');},
    localStorage:{getItem:key=>{reads.push(key);return storage.get(key)??null;},setItem:(key,value)=>{writes.push([key,String(value)]);storage.set(key,String(value));}},
    AppState:{get:()=>state,isReady:()=>true,isSuper:()=>role==='SUPER_ADMIN',canMenu:()=>true,effectiveAccess:()=>({roleCode:role,valid}),authorizeObject:(_,row)=>authorized&&String(row?.enterpriseId)===scope.enterpriseId&&(role==='SUPER_ADMIN'||row?.tenantId===state.tenantId)},
    PlatformUI:{escape:value=>String(value??''),empty:()=>'',status:()=>'',pageHeader:()=>'',toolbar:(a,b)=>a+b,table:()=>'',openLayer(){},closeLayer(){}},RouteRuntime:{refreshCurrent(){}},showToast(){},document:{addEventListener(){},getElementById:()=>null,querySelectorAll:()=>[]}};
  win.window=win;vm.createContext(win);
  for(const file of ['mock/data.js','config/customer-intent-profile.js','mock/mapping-series-data.js','js/components/mapping-series-adapter.js','js/components/business-data.js','js/components/customer-business.js','js/pages/business-categories.js'])vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),win,{filename:file});
  return {scope,state,storage,reads,writes,win,M:win.CustomerBusiness,B:win.BusinessData,role:value=>{role=value;},valid:value=>{valid=value;},authorized:value=>{authorized=value;}};
}
const textField=(id,label=id)=>({id,label,type:'text',businessKey:'',options:[],enabled:true});
function generic(h){
  const series=h.B.create({name:'本版通用车系来源',capabilityId:'series',enabled:true,tenantIds:[h.scope.tenantId]});
  const store=h.B.create({name:'本版通用门店来源',capabilityId:'stores',enabled:true,tenantIds:[h.scope.tenantId]});
  check(series.ok&&store.ok,'administrator explicitly creates current generic dictionary entries');
  const upstream={id:'genericSeries',label:'通用单选来源',type:'interface',businessKey:'SOURCE',options:[],enabled:true,dictionaryId:series.row.id,useQueryConditions:false,depends:[]};
  const downstream={id:'genericStore',label:'通用多选结果',type:'interface',businessKey:'RESULT',options:[],enabled:true,dictionaryId:store.row.id,useQueryConditions:true,depends:[upstream.id],parameterBinding:{parameterName:'seriesCode',sourceValueKey:'code',required:true}};
  check(h.M.saveField(upstream,h.scope).ok&&h.M.saveField(downstream,h.scope).ok,'explicit current interface definitions persist without preseeded aliases');
  const category={id:'genericCase',label:'通用业务',codeLabel:'业务号',prefix:'G',enabled:true,fields:[{fieldId:upstream.id,enabled:true,required:false},{fieldId:downstream.id,enabled:true,required:false}]};
  check(h.M.save(category,h.scope).ok,'required dependency is valid when its source is explicitly visible');return {upstream,downstream,category};
}
{
  const h=harness(),oldConfig='customer-business-config-v3',oldDictionary='business-data-dictionary-v111';
  const oldBytes=JSON.stringify({version:3,revision:77,scopes:[{...h.scope,types:[{id:'case123',label:'截图123旧关联'}],fields:[{id:'intendedSeries',type:'interface',depends:['first','second']},{id:'backupSeries',type:'interface'},{id:'intendedStore',type:'interface'}]}]});
  h.storage.set(oldConfig,oldBytes);h.storage.set(oldDictionary,'{"version":1,"entries":[{"id":"old-entry","name":"旧字典"}]}');
  const beforeWrites=h.writes.length,data=h.M.catalog(h.scope),lead=h.M.fields('lead',h.scope),mapping=h.M.mappingSeriesField(h.scope);
  check(h.M.storageKey==='customer-business-config-v111-current'&&h.M.storageVersion===1,'model exposes its independent current key and schema version');
  check(data.ok&&data.fields.length===13&&lead.length===7,'current defaults directly contain 13 ordinary/current definitions and seven lead fields');
  check(mapping?.type==='interface'&&mapping.dictionaryId==='d-mapping-series'&&mapping.options.length===0&&!mapping.useQueryConditions,'current intent is the direct independent Mapping single selection');
  check(lead.some(row=>row.id==='plannedStoreName'&&row.type==='text')&&data.fields.every(row=>!['intendedSeries','backupSeries','intendedStore','customIntendedSeries'].includes(row.id)),'defaults retain original store text and contain no former intent definitions');
  check(!Object.hasOwn(data,'profileIssue')&&!Object.hasOwn(data,'profileWarning')&&!Object.hasOwn(data,'profileIssues'),'catalog has no migration or profile-review result contract');
  check(h.writes.length===beforeWrites&&!h.storage.has(h.M.storageKey),'initial current defaults are a read, not a migration or storage rewrite');
  check(!h.reads.includes(oldConfig)&&!h.reads.includes(oldDictionary),'old configuration and dictionary keys are never consulted');
  check(h.storage.get(oldConfig)===oldBytes&&h.storage.get(oldDictionary).includes('old-entry'),'old storage bytes remain untouched');
  const html=h.win.BusinessConfiguration.render('category');check(!html.includes('截图123')&&!html.includes('旧多上游')&&!html.includes('原配置已保留'),'actual configuration page has no old-data warning path');
  check(!h.M.isLocalSeriesField&&!h.M.localSeriesField,'no local-intent compatibility API remains');
}
{
  const h=harness();
  for(const id of ['intendedSeries','backupSeries','intendedStore'])check(h.M.saveField(textField(id,'普通字段 '+id),h.scope).ok,'unknown ordinary '+id+' is a real custom field, not a reserved old identity');
  const category=h.M.get('aftersales',h.scope);category.fields.unshift({fieldId:'intendedSeries',enabled:true,required:true},{fieldId:'backupSeries',enabled:false,required:false});category.fields.push({fieldId:'intendedStore',enabled:true,required:false});
  check(h.M.save(category,h.scope).ok,'ordinary custom references, order and independent flags persist');
  const bytes=h.storage.get(h.M.storageKey),data=JSON.parse(bytes),reloaded=h.M.catalog(h.scope);
  check(data.version===h.M.storageVersion&&data.revision===4&&!Object.hasOwn(data,'seriesSelectionPolicy'),'stored current schema contains only current revisioned configuration');
  check(reloaded.fields.filter(row=>['intendedSeries','backupSeries','intendedStore'].includes(row.id)).every(row=>row.type==='text'&&row.options.length===0),'reloading never converts ordinary matching names or IDs');
  check(JSON.stringify(h.M.get('aftersales',h.scope).fields)===JSON.stringify(category.fields),'refresh keeps exact category positions, display and required settings');
  check(h.storage.get(h.M.storageKey)===bytes,'repeated reads do not overwrite saved current custom configuration');
  vm.runInContext(fs.readFileSync(path.join(base,'js/components/customer-business.js'),'utf8'),h.win,{filename:'customer-business-reload.js'});
  check(JSON.stringify(h.win.CustomerBusiness.get('aftersales',h.scope).fields)===JSON.stringify(category.fields)&&h.storage.get(h.M.storageKey)===bytes,'reloading the actual model module preserves all current configuration bytes and flags');
  const snapshot=h.M.callbackSnapshot({businessType:'aftersales',intendedSeries:'客户填写的普通文本'},h.scope);check(snapshot.fields.find(row=>row.fieldId==='intendedSeries').type==='text','normal save manifest never infers intent from a former identifier');
}
{
  const h=harness(),data=h.M.catalog(h.scope),ordinaryId=h.win.CustomerIntentProfile.seriesFieldId,bundle={...h.scope,fields:copy(data.fields),types:copy(data.rows)};
  bundle.fields=bundle.fields.map(row=>row.id===ordinaryId?textField(ordinaryId,'用户普通备注'):row);
  const stored={version:h.M.storageVersion,revision:5,scopes:[bundle,{...copy(bundle),tenantId:'UNTOUCHED_TENANT'}]};h.storage.set(h.M.storageKey,JSON.stringify(stored));const bytes=h.storage.get(h.M.storageKey);
  check(h.M.catalog(h.scope).ok&&h.M.getField(ordinaryId,h.scope).type==='text'&&h.M.mappingSeriesField(h.scope)===null,'an explicitly configured ordinary field sharing the default Mapping ID is not taken over');
  check(h.storage.get(h.M.storageKey)===bytes&&h.M.catalog(h.scope).fields.length===13,'current scope never gains replacement or renamed preset definitions on read');
  check(h.M.saveField(textField('newCurrentNote','当前新增备注'),h.scope).ok,'current custom data continues to be editable without initializer resets');
  check(JSON.stringify(JSON.parse(h.storage.get(h.M.storageKey)).scopes.find(row=>row.tenantId==='UNTOUCHED_TENANT'))===JSON.stringify(stored.scopes[1]),'saving one current tenant leaves another tenant exactly untouched');
}
{
  const h=harness(),{upstream,downstream,category}=generic(h),bytes=h.storage.get(h.M.storageKey);
  check(!h.M.configurationIssue(category.id,h.scope),'valid current required dependency reports no issue');
  const broken={...category,fields:category.fields.filter(ref=>ref.fieldId!==upstream.id)};check(!h.M.save(broken,h.scope).ok,'required dependency cannot lose its visible source');
  const optional={...downstream,parameterBinding:{...downstream.parameterBinding,required:false}};check(h.M.saveField(optional,h.scope).ok&&h.M.save(broken,h.scope).ok,'optional dependency can omit the upstream classification field without making itself mandatory');
  check(h.M.parameterBinding(h.M.getField(downstream.id,h.scope)).required===false,'explicit optional metadata survives storage and reload');
  const invalid=[{...upstream,useQueryConditions:undefined},{...upstream,depends:undefined},{...upstream,depends:[downstream.id]},
    {...optional,parameterBinding:undefined},{...optional,parameterBinding:{parameterName:'seriesCode',sourceValueKey:'code'}},{...optional,depends:[upstream.id,'mappingIntendedSeries']},
    {...optional,parameterBinding:{...optional.parameterBinding,parameterName:'bad.parameter'}},{...optional,parameterBinding:{...optional.parameterBinding,sourceValueKey:'undeclared'}}];
  for(const field of invalid){const before=h.storage.get(h.M.storageKey);check(!h.M.saveField(field,h.scope).ok,'incomplete or incompatible current metadata is rejected without inference');check(h.storage.get(h.M.storageKey)===before,'invalid explicit metadata cannot alter stored configuration');}
  check(h.M.saveField({...upstream,useQueryConditions:true,depends:[downstream.id],parameterBinding:{parameterName:'seriesCode',sourceValueKey:'code',required:true}},h.scope).ok===false,'interface without a declared query condition cannot be given an invented upstream');
  const actual=JSON.parse(h.storage.get(h.M.storageKey)),scope=actual.scopes.find(row=>row.tenantId===h.scope.tenantId),cycleA={...optional,id:'cycleA',label:'循环A',businessKey:'',depends:['cycleB']},cycleB={...optional,id:'cycleB',label:'循环B',businessKey:'',depends:['cycleA']};
  scope.fields.push(cycleA,cycleB);h.storage.set(h.M.storageKey,JSON.stringify(actual));check(!h.M.catalog(h.scope).ok,'a structurally cyclic current configuration fails closed instead of being rewritten');
  h.storage.set(h.M.storageKey,bytes);check(h.M.catalog(h.scope).ok,'restoring a valid current record restores normal reading');
}
{
  const h=harness(),mapping=h.M.mappingSeriesField(h.scope),before=h.storage.get(h.M.storageKey);
  check(!h.M.saveField({...mapping,type:'select',options:[{id:'a',label:'手工值',businessKey:''}]},h.scope).ok,'Mapping semantic field cannot change into hand-maintained options');
  check(!h.M.deleteField(mapping.id,h.scope).ok,'protected current Mapping definition is not deletable');
  check(h.M.saveField({...mapping,label:'当前意向车系',businessKey:'INTENT'},h.scope).ok,'normal current semantic field name and business mapping key can be maintained');
  const ordinary={id:'ordinaryChoice',label:'普通选项',type:'select',businessKey:'ORDINARY',options:[{id:'stable-a',label:'普通A',businessKey:'001'},{id:'stable-b',label:'普通B',businessKey:''}],enabled:true};
  check(h.M.saveField(ordinary,h.scope).ok,'ordinary single-select fields remain available with optional option codes');
  const category=h.M.get('lead',h.scope);category.fields.push({fieldId:ordinary.id,enabled:true,required:false});check(h.M.save(category,h.scope).ok,'normal ordinary selection can be added to the current lead category');
  const raw={code:'910001',name:'映射车系',state:'valid',sourceVersion:'private-query-state',sourceValues:{relation_id:910001,media_car_series_id:'MEDIA-A',car_state:1}},saved=h.M.callbackSnapshot({businessType:'lead',[mapping.id]:raw,[ordinary.id]:'stable-a'},h.scope),record=saved.fields.find(row=>row.fieldId===mapping.id),choice=saved.fields.find(row=>row.fieldId===ordinary.id);
  check(record.dictionaryId==='d-mapping-series'&&record.interfaceKind==='series'&&record.selectionMode==='single','current interface manifest explicitly declares dictionary, kind and cardinality');
  check(record.value.code==='910001'&&record.value.sourceValues.relation_id===910001&&record.value.sourceValues.media_car_series_id==='MEDIA-A'&&record.value.sourceValues.car_state===1,'normal Mapping save preserves official code and declared provenance');
  check(!JSON.stringify(saved).includes('private-query-state')&&choice.selectedOptions[0].businessOptionCode==='001','callback removes query state and preserves ordinary option codes');
  const genericEntries=generic(h);let rejects=false;try{h.M.callbackSnapshot({businessType:genericEntries.category.id,[genericEntries.downstream.id]:{code:'ONE',name:'单门店对象'}},h.scope);}catch(_){rejects=true;}check(rejects,'multi-selection snapshot rejects a single object instead of upgrading it into an array');
  rejects=false;try{h.M.callbackSnapshot({businessType:'lead',[mapping.id]:[{code:'910001',name:'数组'}]},h.scope);}catch(_){rejects=true;}check(rejects,'single-selection snapshot rejects an array instead of reviving multiple series');
}
{
  const h=harness(),initial=h.M.catalog(h.scope),category=h.M.get('activity',h.scope);category.label='当前活动';
  check(h.M.save(category,h.scope,{expectedContext:h.M.context(),expectedRevision:initial.revision}).ok,'current versioned configuration save succeeds once');
  const bytes=h.storage.get(h.M.storageKey);check(!h.M.save({...category,label:'过期覆盖'},h.scope,{expectedRevision:initial.revision}).ok&&h.storage.get(h.M.storageKey)===bytes,'stale revision cannot overwrite current configuration');
  check(!h.M.save(category,h.scope,{expectedContext:'OTHER_CONTEXT'}).ok,'changed editing context is rejected');
  h.role('MEMBER');check(!h.M.saveField(textField('unauthorized'),h.scope).ok,'non-administrator cannot write current configuration');h.role('SUPER_ADMIN');
  h.valid(false);check(!h.M.catalog(h.scope).ok&&!h.M.save(category,h.scope).ok,'current member permissions remain live');h.valid(true);
  h.authorized(false);check(!h.M.catalog(h.scope).ok,'tenant/object authorization remains live');h.authorized(true);
  h.storage.set(h.M.storageKey,'{"version":3,"revision":9,"scopes":[]}');check(!h.M.catalog(h.scope).ok&&h.storage.get(h.M.storageKey).includes('"version":3'),'wrong schema placed in the current key is rejected rather than migrated');
}
{
  const h=harness(),call={...h.scope,accountId:h.state.accountId,callId:'CURRENT_BOUND',customerPhone:'13800000999',businessType:'lead'},captured=h.M.captureCallForm(call);check(captured.ok,'current call captures the complete current directory');call.businessFormVersion=captured.version;
  const original=JSON.stringify(call.businessFormVersion),type=h.M.get('lead',h.scope);type.label='后续通话分类';type.fields.find(row=>row.fieldId==='plannedStoreName').enabled=false;type.fields.find(row=>row.fieldId==='mappingIntendedSeries').required=true;check(h.M.save(type,h.scope).ok,'administrator updates only the live current configuration');
  check(h.M.get('lead',call).label==='线索类'&&h.M.fields('lead',call).some(row=>row.id==='plannedStoreName')&&!h.M.fields('lead',call).find(row=>row.id==='mappingIntendedSeries').required,'current bound call retains its original category, visibility and required settings');
  check(h.M.captureCallForm(call).ok&&JSON.stringify(call.businessFormVersion)===original,'existing valid call version is never silently rebound');
  h.storage.set(h.M.storageKey,'{"version":999,"scopes":[]}');check(!h.M.catalog(h.scope).ok&&h.M.catalog(call).ok&&JSON.stringify(call.businessFormVersion)===original,'call snapshot reader is independent of the live configuration input parser and does not rewrite the call');
  check(!h.M.callForm({...call,callId:'OTHER_CALL'}).ok&&!h.M.callForm({...call,tenantId:'OTHER_TENANT'}).ok,'a configuration snapshot cannot be transplanted to another call or tenant');
  h.authorized(false);check(!h.M.callForm(call).ok,'captured schema never freezes current object authorization');
}
console.log(JSON.stringify({ok:true,assertions:passed,scope:'current namespace and direct defaults; no old key access, projection or rewriting; real persistence, strict interfaces, graph rules, permissions and call schema isolation'}));
