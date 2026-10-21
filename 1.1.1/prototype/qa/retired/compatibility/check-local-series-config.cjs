/* Preserved legacy local-series profile, model and non-destructive tenant projection. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=process.argv[2]?path.resolve(process.argv[2]):path.resolve(__dirname,'..');
const copy=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));let passed=0;
const check=(value,message)=>{assert(value,message);passed++;};
const equal=(actual,expected,message)=>{assert.deepEqual(copy(actual),copy(expected),message);passed++;};
function harness(withProfile=true) {
  const scope={enterpriseId:'e1',tenantId:'t1'},storage=new Map();let role='ADMIN',writes=0;
  const win={structuredClone,
    localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>{writes++;storage.set(key,String(value));}},
    AppState:{get:()=>({...scope,accountId:'admin',sessionId:'session',activeDomain:'CLOUD_CONTACT_CENTER'}),effectiveAccess:()=>({roleCode:role,valid:true}),authorizeObject:()=>true},
    CloudCallData:{tenants:[{...scope,status:'启用',capabilitySet:['CLOUD_CONTACT_CENTER']},{enterpriseId:'e1',tenantId:'t2',status:'启用',capabilitySet:['CLOUD_CONTACT_CENTER']}]},
    PlatformUI:{escape:value=>String(value??'')},
    BusinessData:{entry:id=>({'d-series':{id,capabilityId:'series'},'d-store':{id,capabilityId:'store'}})[id]||null,capability:id=>({kind:id,selectionMode:id==='store'?'multiple':'single',queryConditions:id==='store'?[{key:'seriesCode',sourceKind:'series',required:false,valueKey:'code'}]:[]}),available:()=>true}
  };win.window=win;const context=vm.createContext(win);
  const load=file=>vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  if(withProfile)win.CustomerIntentProfile={mode:'local-series-text-store',revision:1,seriesFieldId:'customIntendedSeries',seriesFieldLabel:'本次意向车系',seriesOptions:['A','B','C'].map((letter,index)=>({id:'local-series-'+(index+1),label:'自定义车系 '+letter+'（演示）',businessKey:'LOCAL-SERIES-00'+(index+1)}))};
  load('js/components/customer-business.js');
  const model=win.CustomerBusiness;
  return {scope,win,model,storage,load,setRole:value=>{role=value;},writes:()=>writes,raw:()=>storage.get(model.storageKey),put:data=>storage.set(model.storageKey,JSON.stringify(data))};
}
function legacy() {
  const old=harness(false),data=old.model.catalog(old.scope);
  return {version:3,revision:9,seriesSelectionPolicy:'single',scopes:[{...old.scope,types:data.rows,fields:data.fields}]};
}
const row=(bundle,id)=>bundle.fields.find(field=>field.id===id);
const category=(bundle,id='lead')=>bundle.types.find(item=>item.id===id);
const ref=(item,id)=>item.fields.find(value=>value.fieldId===id);
function currentDefaults() {
  const h=harness(),M=h.model,data=M.catalog(h.scope),local=M.localSeriesField(h.scope);
  check(data.ok,'actual product profile has readable tenant defaults');
  check(h.win.CustomerIntentProfile.mode==='local-series-text-store','runtime profile explicitly selects local series and original store text');
  equal(M.fields('lead',h.scope).map(field=>field.id),['leadLevel','intentionLevel','visitIntention','testDriveIntention','plannedVisitAt','plannedStoreName',local.id],'current lead form has six original fields and one local series');
  check(local.id==='customIntendedSeries'&&local.type==='select'&&M.isLocalSeriesField(local),'current series has a new stable local single-select identity');
  equal(local.options.map(option=>[option.businessKey,option.label]),[['LOCAL-SERIES-001','自定义车系 A（演示）'],['LOCAL-SERIES-002','自定义车系 B（演示）'],['LOCAL-SERIES-003','自定义车系 C（演示）']],'product seeds are explicit fictional local examples');
  check(!M.fields('lead',h.scope).some(field=>field.type==='interface'),'default customer form has no external interface query field');
  check(M.getField('intendedSeries',h.scope)?.type==='interface'&&M.getField('intendedStore',h.scope)?.type==='interface','old interface definitions remain available');
  check(M.getField('plannedStoreName',h.scope)?.type==='text','planned store remains the original text field');
  check(h.writes()===0&&h.raw()===undefined,'reading defaults never writes storage');
  equal(M.catalog(h.scope),data,'repeated default reads are deterministic');
  check(M.localSeriesField(h.scope,'aftersales')===null,'helper returns only a local series visible in the requested business category');
  check(M.localSeriesField({...h.scope,tenantId:'t2'})===null,'helper respects current account tenant scope');
  const generic=harness(false);
  check(generic.model.fields('lead',generic.scope).some(field=>field.id==='intendedStore'&&field.type==='interface'),'without the product profile generic interface behavior remains intact');
}
function optionMaintenance() {
  const h=harness(),M=h.model;let field=M.localSeriesField(h.scope);
  const change=options=>M.saveField({...field,options},h.scope);
  const reject=(options,message)=>{const before=h.raw();check(!change(options).ok,message);equal(h.raw(),before,'rejected option edit is atomic');};
  reject([{id:'a',label:'车系A',businessKey:''}],'local series code is required');
  reject([{id:'a',label:'',businessKey:'001'}],'local series name is required');
  reject([{id:'a',label:'A',businessKey:'001'},{id:'b',label:'B',businessKey:'001'}],'local series codes must be unique within the field');
  reject([{id:'a',label:'A',businessKey:'001'},{id:'b',label:'a',businessKey:'002'}],'local series display names remain unique');
  reject([{id:'a',label:'A',businessKey:'001'},{id:'a',label:'B',businessKey:'002'}],'local option identity must be unique');
  reject([{id:'a',label:'A',businessKey:'x'.repeat(81)}],'local code follows the existing 80-character bound');
  reject([{id:'a',label:'A',businessKey:'a\nb'}],'local code rejects control characters');
  reject([],'a series field cannot be saved with zero options');
  reject(Array.from({length:51},(_,index)=>({id:'a'+index,label:'A'+index,businessKey:'c'+index})),'the existing 50-option maximum remains enforced');
  const valid=change([{id:'stable-a',label:' 本地车系 A ',businessKey:' 001 '},{id:'stable-b',label:'本地车系 B',businessKey:'1'}]);
  check(valid.ok,'administrator can maintain local series names and string codes');
  field=M.localSeriesField(h.scope);
  equal(field.options,[{id:'stable-a',label:'本地车系 A',businessKey:'001'},{id:'stable-b',label:'本地车系 B',businessKey:'1'}],'trim preserves leading zeroes and independent option identities');
  const snapshot=M.callbackSnapshot({businessType:'lead',[field.id]:'stable-a'},h.scope),stored=snapshot.fields.find(item=>item.fieldId===field.id);
  check(stored.localIntentRole==='series'&&stored.type==='select','saved field manifest records semantic local series role');
  equal(stored.selectedOptions,[{optionId:'stable-a',businessOptionCode:'001',optionName:'本地车系 A'}],'snapshot carries option identity and then-current code and name');
  check(M.saveField({...field,options:field.options.map(option=>({...option,label:option.label+'（新）',businessKey:'NEW-'+option.businessKey}))},h.scope).ok,'administrator may later rename and recode options without changing option IDs');
  equal(stored.selectedOptions,[{optionId:'stable-a',businessOptionCode:'001',optionName:'本地车系 A'}],'an already captured snapshot retains the original code and name');
  const before=h.raw();
  check(!M.saveField({...field,type:'text',options:[]},h.scope).ok,'local field is permanently single-select');
  const unmarked={...field};delete unmarked.localIntentRole;
  check(!M.saveField(unmarked,h.scope).ok,'existing local role cannot be removed during field editing');
  check(!M.saveField({...field,id:'otherLocalSeries',label:'另一个本地车系'},h.scope).ok,'each tenant has at most one local series role');
  check(!M.deleteField(field.id,h.scope).ok,'local series definition cannot be deleted');
  equal(h.raw(),before,'type, role, duplicate-role and delete rejections leave configuration untouched');
  check(M.saveField({id:'ordinarySelect',label:'普通选项',type:'select',businessKey:'',options:[{id:'x',label:'普通值',businessKey:''}],enabled:true},h.scope).ok,'ordinary select option codes remain optional');
}
function projection() {
  const h=harness(),M=h.model,data=legacy(),bundle=data.scopes[0];
  ref(category(bundle),'intendedSeries').required=true;
  ref(category(bundle),'intendedStore').required=true;
  ref(category(bundle),'plannedStoreName').required=true;
  bundle.fields.push({id:'customNote',label:'运营备注',type:'text',businessKey:'memo',options:[],enabled:true});
  category(bundle).fields.push({fieldId:'customNote',enabled:true,required:false});
  bundle.types.push({id:'retained',label:'其他接口业务',codeLabel:'业务编号',prefix:'R',enabled:true,fields:[{fieldId:'intendedSeries',enabled:true,required:false},{fieldId:'intendedStore',enabled:true,required:false}]});
  const other={...copy(bundle),tenantId:'t2'};data.scopes.push(other);
  h.put(data);const before=h.raw(),catalog=M.catalog(h.scope),local=M.localSeriesField(h.scope);
  check(catalog.ok,'old configured tenant is projected as readable local-series product');
  check(local.required,'old intended-series required setting migrates to the local series');
  check(M.fields('lead',h.scope).find(field=>field.id==='plannedStoreName').required,'original planned store required setting is unchanged');
  check(M.fields('lead',h.scope).some(field=>field.id==='customNote'),'unrelated custom lead field is retained');
  check(!M.fields('lead',h.scope).some(field=>field.type==='interface'),'old default series/store references leave the current customer path');
  check(M.fields('retained',h.scope).some(field=>field.id==='intendedStore'),'other business categories retain their explicitly configured interface references');
  check(M.getField('intendedSeries',h.scope).label.includes('历史接口'),'same-named old interface definition receives a unique working label');
  equal(h.raw(),before,'projection does not rewrite localStorage or history');
  equal(M.catalog(h.scope),catalog,'projected identity and labels are idempotent');
  check(M.saveField({...local,options:local.options.map(option=>({...option}))},h.scope).ok,'explicit administrator save persists current tenant projection');
  const persisted=JSON.parse(h.raw());
  equal(persisted.scopes.find(item=>item.tenantId==='t2'),other,'saving current tenant leaves another tenant raw configuration unchanged');
  check(persisted.scopes[0].localIntentProfileVersion===1,'explicit save records the current product profile revision');
  const noSeries=harness(),raw=legacy();ref(category(raw.scopes[0]),'intendedStore').required=true;noSeries.put(raw);
  check(!noSeries.model.localSeriesField(noSeries.scope).required,'old store required setting never becomes local series required');
}
function collisionAndRepair() {
  const h=harness(),M=h.model,data=legacy(),bundle=data.scopes[0];
  bundle.fields.push({id:'customIntendedSeries',label:'本地既有说明',type:'text',businessKey:'original-key',options:[],enabled:true});
  category(bundle).fields.push({fieldId:'customIntendedSeries',enabled:true,required:false});
  h.put(data);const local=M.localSeriesField(h.scope);
  check(local.id==='customIntendedSeries2','a preexisting ordinary ID is never commandeered');
  check(M.getField('customIntendedSeries',h.scope).businessKey==='original-key','ID collision preserves the original business field');
  equal(M.localSeriesField(h.scope),local,'collision-generated role remains stable across reads');
  const lead=M.get('lead',h.scope);ref(lead,local.id).enabled=false;ref(lead,local.id).required=true;
  check(M.save(lead,h.scope).ok&&M.localSeriesField(h.scope)===null,'administrator can hide local series without changing its field definition');
  check(!ref(M.get('lead',h.scope),local.id).required,'a hidden category field cannot retain a required flag');
  const enabled=M.get('lead',h.scope);ref(enabled,local.id).enabled=true;ref(enabled,local.id).required=true;
  check(M.save(enabled,h.scope).ok&&M.localSeriesField(h.scope).required,'display and required remain separate category settings');
  const invalid=M.get('lead',h.scope);invalid.fields.push({fieldId:'intendedSeries',enabled:true,required:false});
  check(!M.save(invalid,h.scope).ok,'a category cannot show local and external intended series together');
  const scope={...h.scope},context=M.context(),revision=M.catalog(scope).revision,original=h.raw();
  check(!M.save(M.get('lead',scope),scope,{expectedContext:'stale'}).ok,'stale UI context cannot write');
  check(!M.save(M.get('lead',scope),scope,{expectedRevision:revision-1}).ok,'stale configuration revision cannot write');
  h.setRole('AGENT');check(!M.saveField(local,scope).ok,'customer agents cannot maintain options');h.setRole('ADMIN');
  check(M.context()===context,'test restores the same administrator session');
  check(!M.saveField(local,{...scope,tenantId:'t2'}).ok,'tenant administrators cannot write another tenant');
  equal(h.raw(),original,'rejected identity and access operations have no writes');
}
function capacityAndDependency() {
  const h=harness(),M=h.model,data=legacy(),bundle=data.scopes[0],lead=category(bundle);
  lead.fields=lead.fields.filter(item=>!['intendedSeries','intendedStore'].includes(item.fieldId));
  for(let index=0;index<24;index++){const id='ordinary'+index;bundle.fields.push({id,label:'原字段'+index,type:'text',businessKey:'',options:[],enabled:true});lead.fields.push({fieldId:id,enabled:true,required:false});}
  h.put(data);const before=h.raw(),catalog=M.catalog(h.scope);
  check(catalog.ok&&catalog.rows.find(item=>item.id==='lead').fields.length===30,'capacity conflict leaves all thirty original category fields readable');
  check(catalog.profileIssue.includes('30')&&M.configurationIssue('lead',h.scope).includes('上限'),'capacity conflict provides explicit administrator repair guidance');
  check(M.localSeriesField(h.scope)===null&&catalog.fields.some(M.isLocalSeriesField),'capacity conflict creates no thirty-first reference and retains the local role in field library');
  equal(h.raw(),before,'capacity review is a read projection only');
  const repaired=M.get('lead',h.scope),local=catalog.fields.find(M.isLocalSeriesField);repaired.fields.pop();repaired.fields.push({fieldId:local.id,enabled:true,required:false});
  check(M.save(repaired,h.scope).ok&&!M.catalog(h.scope).profileIssue,'administrator can explicitly choose which field to replace and resolve capacity review');
  const dep=harness(),dd=legacy(),db=dd.scopes[0];
  db.fields.push({id:'customDependent',label:'已有接口字段',type:'interface',businessKey:'',options:[],enabled:true,dictionaryId:'d-store',useQueryConditions:true,depends:['intendedSeries'],parameterBinding:{parameterName:'seriesCode',sourceValueKey:'code',required:true}});
  category(db).fields.push({fieldId:'customDependent',enabled:true,required:false});
  dep.put(dd);const result=dep.model.catalog(dep.scope);
  check(result.ok&&result.rows.find(item=>item.id==='lead').fields.some(item=>item.fieldId==='customDependent'),'migration preserves a dependent custom business field');
  check(result.profileIssue.includes('关联字段'),'required dependency conflict stays visible for explicit repair');
  check(dep.model.getField('customDependent',dep.scope).depends[0]==='intendedSeries','migration never silently remaps an interface dependency to local data');
}
function unavailableAndLegacyPolicy() {
  const h=harness(),M=h.model,data=legacy(),bundle=data.scopes[0];delete data.seriesSelectionPolicy;
  bundle.fields.push({id:'backupSeries',label:'备选意向车系',type:'interface',dictionaryId:'d-series',depends:[],businessKey:'legacy-backup',options:[],enabled:true});
  category(bundle).fields.push({fieldId:'backupSeries',enabled:true,required:true});
  const oldBackup=copy(row(bundle,'backupSeries'));
  row(bundle,'intendedStore').depends=['intendedSeries','backupSeries'];
  const oldStore=copy(row(bundle,'intendedStore'));
  bundle.fields.push({id:'retainedDependency',label:'保留的自定义接口',type:'interface',dictionaryId:'d-store',depends:['backupSeries'],useQueryConditions:true,parameterBinding:{parameterName:'seriesCode',sourceValueKey:'code',required:true},businessKey:'',options:[],enabled:true});
  bundle.types.push({id:'oldMulti',label:'旧多上游业务',codeLabel:'业务编号',prefix:'OLD',enabled:true,fields:[{fieldId:'intendedSeries',enabled:true,required:false},{fieldId:'backupSeries',enabled:true,required:false},{fieldId:'intendedStore',enabled:true,required:false}]});
  const oldCustom=copy(row(bundle,'retainedDependency'));
  const other={...copy(bundle),tenantId:'t2'};data.scopes.push(other);h.put(data);const before=h.raw();
  check(M.catalog(h.scope).ok&&M.localSeriesField(h.scope).required,'a pre-single-policy backup is projected into the current local series');
  equal(M.getField('backupSeries',h.scope),oldBackup,'legacy backup interface definition remains present and unchanged');
  equal(M.getField('intendedStore',h.scope),oldStore,'legacy multiple upstream edges are preserved rather than narrowed');
  equal(M.getField('retainedDependency',h.scope),oldCustom,'a custom dependency is not silently remapped to another old series');
  check(M.catalog(h.scope).profileWarning.includes('旧多上游')&&!M.configurationIssue('lead',h.scope),'inactive legacy definitions have a repair warning without blocking the current local form');
  check(!!M.configurationIssue('oldMulti',h.scope),'a category using an unresolved old multiple-source contract remains explicitly blocked for repair');
  check(!M.save(M.get('oldMulti',h.scope),h.scope).ok,'saving an unchanged unresolved old category never silently executes a single guessed upstream');
  equal(h.raw(),before,'earlier single-series projection also remains read-only');
  check(M.saveField(M.localSeriesField(h.scope),h.scope).ok,'administrator may persist the combined legacy and local projection');
  equal(row(JSON.parse(h.raw()).scopes[0],'backupSeries'),oldBackup,'saving only local options preserves the backup definition on disk');
  equal(row(JSON.parse(h.raw()).scopes[0],'intendedStore'),oldStore,'saving only local options preserves all old upstream edges on disk');
  equal(row(JSON.parse(h.raw()).scopes[0],'retainedDependency'),oldCustom,'saving only local options preserves custom upstream identity on disk');
  equal(JSON.parse(h.raw()).scopes.find(item=>item.tenantId==='t2'),other,'missing old global policy flag does not cause a write into another tenant');
  const unavailable=harness(),raw=legacy();unavailable.win.BusinessData.entry=()=>null;unavailable.put(raw);
  check(unavailable.model.catalog(unavailable.scope).ok,'an unavailable old interface dictionary does not block the local product profile');
  check(!unavailable.model.fields('lead',unavailable.scope).some(field=>field.type==='interface'),'known legacy intent IDs leave the default path even if source metadata is unavailable');
  const local=unavailable.model.localSeriesField(unavailable.scope);
  check(local&&local.type==='select','local series does not depend on dictionary metadata or external querying');
  check(unavailable.model.getField('intendedSeries',unavailable.scope).label.includes('历史接口'),'old definition remains uniquely labelled without source metadata');
  const snapshot={fieldId:'historical-local',type:'select',localIntentRole:'series'};
  const generic=harness(false);
  check(generic.model.isLocalSeriesField(snapshot),'history role recognition does not depend on the active product profile');
}
currentDefaults();optionMaintenance();projection();collisionAndRepair();capacityAndDependency();unavailableAndLegacyPolicy();
process.stdout.write(JSON.stringify({suite:'local-series-config',passed,failed:0})+'\n');
