/** Actual Mapping profile + fixture + adapter + BusinessData + form/save integration. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {harness,copy}=require('./check-local-series-followup.cjs');
const base=path.resolve(process.argv[2] || path.join(__dirname,'..'));
let passed=0;const check=(condition,message)=>{assert.ok(condition,message);passed++;};
const make=()=>harness({currentProfile:true});
const field=h=>h.M.mappingSeriesField(h.call,'lead');
const redraw=h=>{h.form().outerHTML=h.C.form(h.values,h.call,'seat-followup','AgentWorkbench.setFollowup');};
const query=h=>h.win.BusinessInterfaceField.query('seat-followup',field(h).id);
const pick=(h,item)=>h.win.BusinessInterfaceField.choose('seat-followup',field(h).id,JSON.stringify([item.type || '',item.code]));
const save=h=>h.C.save(h.call,h.values,{wrapping:true,expectedVersion:''});
function putLegacy(h,mutate=()=>{}) {
  const legacy=harness(),data=legacy.M.catalog(legacy.scope),bundle={...legacy.scope,localIntentProfileVersion:1,fields:copy(data.fields),types:copy(data.rows)};
  mutate(bundle,legacy);const payload={version:3,revision:9,seriesSelectionPolicy:'single',scopes:[bundle,{...copy(bundle),tenantId:'UNCHANGED-OTHER-TENANT'}]};
  h.storage.set(h.M.storageKey,JSON.stringify(payload));return {legacy,bundle,payload};
}
async function main(){
  {
    const h=make(),M=h.M,f=field(h),rows=M.fields('lead',h.scope);
    check(h.win.CustomerIntentProfile.mode==='interface-series-text-store','actual runtime product profile selects interface series and original store text');
    check(f.id==='mappingIntendedSeries'&&f.type==='interface'&&M.isMappingSeriesField(f)&&!M.isLocalSeriesField(f),'current semantic series has its own stable interface identity');
    check(f.dictionaryId==='d-mapping-series'&&h.win.BusinessData.capability(h.win.BusinessData.entry(f.dictionaryId).capabilityId).id==='mapping-series','default field binds the newly registered Mapping capability only');
    check(M.selectionMode(f)==='single'&&!M.usesQueryConditions(f)&&f.depends.length===0&&f.options.length===0,'Mapping field is single, independent and has no manual options');
    check(rows.length===7&&rows.filter(row=>row.type==='interface').length===1&&rows.some(row=>row.id==='plannedStoreName'&&row.type==='text'),'default customer form contains six original fields and only one interface series');
    check(!rows.some(row=>['intendedStore','intendedSeries','customIntendedSeries'].includes(row.id)),'new defaults never revive former interface stores or manual series');
    check(M.getField('intendedSeries',h.scope).label.includes('原接口')&&!M.getField('intendedSeries',h.scope).label.includes('原自定义'),'retained former interface definition is labelled accurately');
    check(!h.storage.has(M.storageKey),'reading the new profile performs no configuration write');
    check(h.form().querySelector('[data-interface-field="'+f.id+'"]')&&h.document.getElementById('seat-followup-'+f.id)?.tagName!=='SELECT','real current form renders a query selector rather than a manual options select');
    check(h.form().textContent.includes('带入本次意向车系')&&!h.form().textContent.includes('带入本次意向车系及门店'),'import guidance reflects series-only querying and retained store text');
    const B=h.win.BusinessConfiguration;B.render('field');B.open('field',f.id);
    check(h.managerHtml.includes('车系由接口提供')&&h.managerHtml.includes('无需维护手工车系选项')&&!h.managerHtml.includes('id="business-field-options"'),'administrator sees interface maintenance guidance without manual option rows');
    check(/id="business-field-type" disabled/.test(h.managerHtml)&&/id="business-field-interface" disabled/.test(h.managerHtml),'prebuilt series type and source are explicitly read-only');
    B.setBasic('type','select');B.setDictionary('d-series');B.save();
    check(M.getField(f.id,h.scope).type==='interface'&&M.getField(f.id,h.scope).dictionaryId===f.dictionaryId,'cached UI setter calls cannot convert the protected source back to a manual or old interface field');
    const invalid=[{...f,type:'select',options:[{id:'x',label:'手工',businessKey:'X'}]},{...f,dictionaryId:'d-series'},{...f,options:[{id:'x',label:'手工',businessKey:'X'}]},{...f,useQueryConditions:true,depends:['intendedSeries']}];
    for(const candidate of invalid)check(!M.saveField(candidate,h.scope).ok,'model rejects incompatible type/source/options/upstream changes for the prebuilt Mapping series');
    const unmarked={...f};delete unmarked.intentProfileRole;check(!M.saveField(unmarked,h.scope).ok,'existing Mapping role cannot be silently stripped');
    check(!M.saveField({...f,id:'anotherMapping',label:'第二个接口车系'},h.scope).ok&&!M.deleteField(f.id,h.scope).ok,'tenant has one protected Mapping definition and it cannot be deleted');
  }

  // Only explicit local semantic references change, in every business category.
  {
    const h=make(),{bundle,payload}=putLegacy(h,(bundle,legacy)=>{
      const local=legacy.M.localSeriesField(legacy.scope),after=bundle.types.find(row=>row.id==='aftersales'),activity=bundle.types.find(row=>row.id==='activity');
      Object.assign(bundle.fields.find(row=>row.id===local.id),{label:'运营意向车系',businessKey:'KEEP_INTENT_SERIES_KEY'});
      after.fields.splice(1,0,{fieldId:local.id,enabled:false,required:false});activity.fields.unshift({fieldId:local.id,enabled:true,required:true});
      bundle.types.push({id:'customType',label:'自建分类',codeLabel:'自建编号',prefix:'CUSTOM',enabled:true,fields:[{fieldId:'serviceConcern',enabled:true,required:false},{fieldId:local.id,enabled:true,required:false},{fieldId:'participantCount',enabled:false,required:false}]});
      bundle.types.push({id:'genericType',label:'通用接口分类',codeLabel:'通用编号',prefix:'GEN',enabled:true,fields:[{fieldId:'intendedSeries',enabled:true,required:false},{fieldId:'intendedStore',enabled:true,required:false}]});
    }),before=h.storage.get(h.M.storageKey),catalog=h.M.catalog(h.scope),current=catalog.fields.find(h.M.isMappingSeriesField);
    check(catalog.ok&&current&&h.storage.get(h.M.storageKey)===before,'read projection preserves the exact existing configuration bytes');
    for(const id of ['lead','aftersales','activity','customType']){
      const original=bundle.types.find(row=>row.id===id),projected=catalog.rows.find(row=>row.id===id),prior=original.fields.find(ref=>ref.fieldId==='customIntendedSeries'),next=projected.fields.find(ref=>ref.fieldId===current.id);
      check(!!next&&next.fieldId===prior.fieldId&&current.id==='customIntendedSeries','semantic field keeps its original stable identity in '+id);
      check(next.enabled===prior.enabled&&next.required===prior.required,'classification visibility and mandatory settings survive in '+id);
      check(projected.fields.findIndex(ref=>ref.fieldId===current.id)===original.fields.findIndex(ref=>ref.fieldId==='customIntendedSeries'),'classification field position survives in '+id);
    }
    check(JSON.stringify(catalog.rows.find(row=>row.id==='genericType'))===JSON.stringify(bundle.types.find(row=>row.id==='genericType')),'intentionally configured generic interface category is untouched');
    const old=catalog.fields.find(row=>row.id==='customIntendedSeries');check(old.type==='interface'&&old.options.length===0&&old.localIntentRole===undefined&&old.intentProfileRole==='mapping-series','existing semantic field changes to interface mode without a duplicate local definition');
    check(old.label==='运营意向车系'&&old.businessKey==='KEEP_INTENT_SERIES_KEY'&&old.enabled===true&&!catalog.fields.some(row=>row.id==='mappingIntendedSeries'),'configured field label, business mapping key and enabled state survive without allocating another ID');
    check(h.M.saveField({...current,label:'接口意向车系'},h.scope).ok,'an explicit ordinary field-config save can persist the safe projection');
    const written=JSON.parse(h.storage.get(h.M.storageKey));check(JSON.stringify(written.scopes.find(row=>row.tenantId==='UNCHANGED-OTHER-TENANT'))===JSON.stringify(payload.scopes[1]),'explicit current-tenant save preserves another tenant byte-for-byte');
    const saved=h.M.catalog(h.scope);check(saved.rows.find(row=>row.id==='aftersales').fields.find(ref=>ref.fieldId===current.id).enabled===false,'disabled semantic reference stays disabled after persistence');
  }
  {
    const h=make(),{bundle}=putLegacy(h,(bundle,legacy)=>{
      const local=legacy.M.localSeriesField(legacy.scope);bundle.types.push({id:'conflictType',label:'冲突分类',codeLabel:'冲突编号',prefix:'CON',enabled:true,fields:[{fieldId:local.id,enabled:false,required:false},{fieldId:'intendedSeries',enabled:true,required:true}]});
    });const projected=h.M.catalog(h.scope);
    check(JSON.stringify(projected.rows.find(row=>row.id==='conflictType'))===JSON.stringify(bundle.types.find(row=>row.id==='conflictType')),'conflicting category references and required settings are not silently deleted or compressed');
    check(h.M.configurationIssue('conflictType',h.scope).includes('多个意向车系'),'specific conflicting category has an actionable configuration message');
    check(!h.M.configurationIssue('aftersales',h.scope),'an unrelated category conflict does not block a normal category');
  }
  {
    const h=make();putLegacy(h,(bundle,legacy)=>{
      const local=legacy.M.localSeriesField(legacy.scope);Object.assign(bundle.fields.find(row=>row.id===local.id),{enabled:false,businessKey:'DISABLED_FIELD_MAPPING'});
      for(const category of bundle.types)for(const ref of category.fields)if(ref.fieldId===local.id){ref.enabled=false;ref.required=false;}
    });const data=h.M.catalog(h.scope),semantic=data.fields.find(h.M.isMappingSeriesField);
    check(data.ok&&semantic.id==='customIntendedSeries'&&semantic.enabled===false&&semantic.businessKey==='DISABLED_FIELD_MAPPING','disabled semantic field preserves its ID, mapping key and stopped state during mode conversion');
    check(!h.M.fields('lead',h.scope).some(row=>row.id===semantic.id),'a disabled semantic definition is never implicitly reactivated');
  }
  {
    const h=make(),{legacy}=putLegacy(h,(bundle,legacy)=>{bundle.fields.find(row=>row.id===legacy.field().id).businessKey='STABLE_FIELD_MAPPING';}),local=legacy.field(),option=local.options[0];
    legacy.mount({callId:'existing-unbound-editor'},{[local.id]:option.id,plannedStoreName:'原编辑门店'});legacy.change(option.id);
    h.mount(copy(legacy.call),copy(legacy.values));const current=field(h);
    check(current.id===local.id&&h.values[local.id]===option.id&&!h.C.validate(h.values,h.call).ok,'same-ID unbound local draft is preserved and never automatically converted into an interface choice');
    const q=await query(h);check(pick(h,q.items[0])&&h.C.validate(h.values,h.call).ok,'explicit official-interface selection can replace the old same-ID local draft without a stale local guard blocking it');
    const result=save(h),recorded=result.values.businessFieldSnapshot.fields.find(row=>row.fieldId===local.id);
    check(result.ok&&recorded.businessFieldCode==='STABLE_FIELD_MAPPING'&&recorded.type==='interface'&&recorded.value.code===q.items[0].code,'saved interface value keeps the exact prior field ID and business mapping key');
    check(result.values.plannedStoreName==='原编辑门店'&&!Object.hasOwn(result.values,'__localSeriesSelection'),'explicit mode change preserves independent text and excludes old local draft metadata');
  }

  // Real adapter candidates, selection, callback whitelist, detail and text independence.
  {
    const h=make(),f=field(h),F=h.win.BusinessInterfaceField;
    h.win.AgentWorkbench.setFollowup('plannedStoreName','客户口述门店文本');const q=await query(h);
    check(q.ok&&q.complete&&q.items.length===3&&q.meta.request.media_id===10&&q.meta.request.car_state===1,'actual query uses the prebuilt defaults and returns the complete synthetic array');
    check(q.items.every(item=>item.code===String(item.relation_id)&&item.code!==item.media_car_series_id),'official ID is the only normalized option code');
    check(!q.items.some(item=>item.car_state===0)&&q.meta.pagination===false,'default scope excludes other mock states without inventing status labels or pagination');
    F.open('seat-followup',f.id);await query(h);F.filter('seat-followup',f.id,'乙');
    const popup=h.document.getElementById('business-series-dropdown');check(popup.querySelectorAll('[role="option"]').length===1&&popup.textContent.includes('车系乙'),'real dropdown locally filters Mapping names');
    F.filter('seat-followup',f.id,'910003');check(popup.querySelectorAll('[role="option"]').length===1&&popup.textContent.includes('车系丙'),'real dropdown filters official ID strings');F.closeDropdown(false);
    check(pick(h,q.items[0])&&h.values[f.id].code==='910001','real single-select handler writes the official ID');
    check(pick(h,q.items[1])&&h.values[f.id].code==='910002'&&!Array.isArray(h.values[f.id]),'choosing another series replaces rather than appends the selection');
    check(h.C.update(h.values,h.call,f.id,[h.values[f.id]])===null,'current series does not accept a multi-select payload');
    const raw=h.values[f.id].sourceValues;check(raw.relation_id===910002&&raw.car_state===1&&raw.media_car_series_id==='DEMO-MEDIA-SERIES-B','selection retains the raw official/media/status fields without coercion');
    const result=save(h);check(result.ok&&result.values.plannedStoreName==='客户口述门店文本','actual save keeps original text-store input independently of series selection');
    const snapshot=result.values.businessFieldSnapshot,row=snapshot.fields.find(row=>row.fieldId===f.id);
    check(row.value.code==='910002'&&row.value.name===q.items[1].name&&snapshot.values[f.id].code==='910002','saved field and callback values use the same selected official ID and name');
    for(const target of [row.value,snapshot.values[f.id]])check(target.sourceValues.relation_id===910002&&target.sourceValues.media_car_series_id==='DEMO-MEDIA-SERIES-B'&&target.sourceValues.car_state===1,'callback/field snapshot preserves the explicit Mapping provenance whitelist');
    check(!JSON.stringify(snapshot).includes('sourceVersion')&&!JSON.stringify(snapshot).includes('verifiedScope')&&!JSON.stringify(snapshot).includes('"state"'),'callback strips query state while retaining source provenance');
    check(h.C.detail(result.values,h.call).includes(q.items[1].name)&&h.C.detail(result.values,h.call).includes('910002'),'call detail displays the saved interface series snapshot');
    const aggregate=h.C.aggregate([h.call]),group=aggregate.groups[0];check(group.values[f.id].code==='910002'&&h.C.detail(group.values,group).includes(q.items[1].name),'customer aggregate reads the same saved interface selection');
  }
  for(const imported of ['910001','DEMO-MEDIA-SERIES-A','映射演示车系甲（虚构）','0910001','UNKNOWN']){
    const h=make(),f=field(h),original={intentionSeriesCode:imported,intentionStoreName:'原导入门店',intentionStoreCode:'RAW-STORE'};h.mount({callId:'import-'+imported,...original},{plannedStoreName:'人工门店保留'});
    const F=h.win.BusinessInterfaceField;await F.bringOriginal('seat-followup');
    check(imported==='910001'?h.values[f.id]?.code==='910001':h.values[f.id]==='','explicit import matches only the exact official ID: '+imported);
    check(h.values.plannedStoreName==='人工门店保留'&&!Object.hasOwn(h.values,'intendedStore')&&h.call.intentionSeriesCode===imported,'import never changes original information or writes imported store into current text');
  }
  for(const scenario of ['failure','partial','empty','conflict','malformed']){
    const h=make(),f=field(h),F=h.win.BusinessInterfaceField,q=await query(h);pick(h,q.items[0]);h.win.AgentWorkbench.setFollowup('plannedStoreName','异常时保留门店');h.win.BusinessData.env.mappingScenario=scenario;
    const next=await query(h);check(scenario==='empty'?next.ok&&next.complete&&next.items.length===0:!next.ok&&next.items.length===0,'empty versus incomplete '+scenario+' produces no partial candidates');
    check(h.values[f.id].code===q.items[0].code&&h.values.plannedStoreName==='异常时保留门店','query outcome preserves the selected name/code and other draft input');
    check(!pick(h,q.items[1]),'old candidates cannot be selected after '+scenario);
    check(!save(h).ok,'a stale selection is not silently submitted after '+scenario);
    check(F.clear('seat-followup',f.id)&&h.C.validate(h.values,h.call).ok,'optional Mapping selection can be explicitly cleared to resolve '+scenario);
  }
  {
    const h=make(),f=field(h),F=h.win.BusinessInterfaceField,B=h.win.BusinessData,q=await query(h);pick(h,q.items[0]);check(B.setEnabled(f.dictionaryId,false).ok,'administrator can stop the source');
    check(!h.C.validate(h.values,h.call).ok&&h.values[f.id].code===q.items[0].code,'source stop remains live and preserves the displayed draft');
    check(B.setEnabled(f.dictionaryId,true).ok,'administrator restores the source');await query(h);check(!h.C.validate(h.values,h.call).ok,'source restoration never automatically confirms an older selection');
    check(F.confirm('seat-followup',f.id)&&h.C.validate(h.values,h.call).ok,'explicit current-result confirmation restores valid source use');
    B.env.mappingScenario='delay';const pending=query(h);check(B.setTenants(f.dictionaryId,[]).ok,'administrator revokes tenant access during a query');const stale=await pending;
    check(!stale.ok&&(stale.items || []).length===0&&!h.C.validate(h.values,h.call).ok,'revocation discards the old response and still prevents submission');
  }
  {
    const h=make(),f=field(h),category=h.M.get('lead',h.scope);category.fields.find(ref=>ref.fieldId===f.id).required=true;check(h.M.save(category,h.scope).ok,'category independently marks Mapping series mandatory');redraw(h);
    check(!h.C.validate(h.values,h.call).ok,'mandatory Mapping series cannot be empty');
    check(h.C.validate(h.values,{...h.call,answered:false}).ok,'existing unanswered-outbound exception still applies to an empty mandatory interface field');
    h.win.BusinessData.env.source='dcc';h.win.BusinessData.env.dccScenario='page_failure';h.win.BusinessData.env.query='failure';check((await query(h)).ok,'unrelated DCC and standard demo failures cannot override the Mapping source');
  }

  // Previously bound local calls stay local; new calls read the real current Mapping profile.
  {
    const old=harness(),local=old.field(),option=copy(local.options[0]);old.mount({callId:'old-bound-local'},{[local.id]:option.id,plannedStoreName:'旧通门店'});check(old.C.bindCallForm(old.call).ok,'legacy fixture captures its original full local form version');
    const h=make();h.mount(copy(old.call),copy(old.values));const before=JSON.stringify(h.call.businessFormVersion);check(h.C.bindCallForm(h.call).ok&&JSON.stringify(h.call.businessFormVersion)===before,'current model retains the exact previously bound local version');
    check(h.M.localSeriesField(h.call)?.id===local.id&&h.M.mappingSeriesField(h.call)===null,'old bound call renders its original local selection rather than converting it to an interface object');
    const result=save(h);check(result.ok&&result.values[local.id]===option.id&&result.values.plannedStoreName==='旧通门店','old call can finish without losing its local selection or store text');
    h.mount({callId:'new-bound-mapping'});check(h.C.bindCallForm(h.call).ok&&field(h)?.type==='interface'&&h.M.localSeriesField(h.call)===null,'new call binds the actual new interface profile');redraw(h);
    const current=field(h),category=h.M.get('lead',h.scope);category.fields.find(ref=>ref.fieldId===current.id).enabled=false;category.fields.find(ref=>ref.fieldId==='plannedStoreName').required=true;check(h.M.save(category,h.scope).ok,'administrator changes live field visibility and mandatory text rules during the new call');
    check(field(h)?.id===current.id&&h.M.fields('lead',h.call).find(row=>row.id==='plannedStoreName').required===false,'same-call interface and ordinary rules remain on the captured version');
    const q=await query(h);check(pick(h,q.items[0])&&save(h).ok,'new Mapping call can still select and complete according to its bound version');
  }
  console.log(JSON.stringify({ok:true,assertions:passed,scope:'real current Mapping profile, all semantic category references, protected interface configuration, query/select/import/save/provenance, source permissions and call-version isolation'}));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
