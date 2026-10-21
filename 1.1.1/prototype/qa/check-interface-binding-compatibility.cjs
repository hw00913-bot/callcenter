/** Capability-owned types/domains, real editors, explicit old-bound repair and runtime guards. */
'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {harness,copy}=require('./fixtures/current-profile.cjs');
let passed=0;const check=(value,message)=>{assert.ok(value,message);passed++;};
function metadata(h){const real=h.win.BusinessData,overrides=new Map();h.win.BusinessData={...real,capability:id=>overrides.has(id)?copy(overrides.get(id)):real.capability(id)};return {real,set:(id,value)=>overrides.set(id,copy(value)),clear:id=>overrides.delete(id)};}
function badMapping(h){const M=h.M,data=M.catalog(h.scope),rows=copy(data.rows),fields=copy(data.fields),store=fields.find(row=>row.id==='genericStore');store.depends=['mappingIntendedSeries'];const lead=rows.find(row=>row.id==='lead');lead.fields=lead.fields.filter(row=>row.fieldId!=='genericSeries');lead.fields.push({fieldId:'mappingIntendedSeries',enabled:true,required:false});h.storage.set(M.storageKey,JSON.stringify({version:M.storageVersion,revision:1,scopes:[{...h.scope,types:rows,fields}]}));return store;}
const render=h=>{h.form().outerHTML=h.C.form(h.values,h.call,'seat-followup','AgentWorkbench.setFollowup');};
const click=(h,selector)=>{const node=h.form().querySelector(selector);check(!!node,'explicit repair action is rendered');h.win.qaNode=node;try{return vm.runInContext('(function(){return '+node.getAttribute('onclick')+'}).call(qaNode)',h.win);}finally{delete h.win.qaNode;}};
(async()=>{
 {
  const h=harness({generic:true}),M=h.M,source=M.getField('genericSeries',h.scope),store=M.getField('genericStore',h.scope),mapping=M.getField('mappingIntendedSeries',h.scope);
  const good=M.queryBindingCompatibility(store,source);check(good.ok&&good.expected.key==='seriesCode'&&good.expected.valueType==='string'&&good.actual.valueDomain===good.expected.valueDomain,'actual source property matches declared target parameter/type/domain');
  check(M.dependencyCompatible(store,source),'same-directory single interface is a candidate');
  const wrong=M.queryBindingCompatibility(store,mapping);check(!wrong.ok&&wrong.code==='value_domain_mismatch'&&wrong.category==='configuration'&&wrong.nonRetryable,'Mapping official IDs do not masquerade as retained directory codes');
  check(!wrong.message.includes('mapping.official-series-id')&&wrong.message.includes('独立查询'),'operator reason uses readable ranges and gives the explicit independent alternative');
  check(M.queryBindingCompatibility(store,mapping,'relation_id').code==='value_type_mismatch','numeric official ID cannot be passed to a text parameter');
  check(M.queryBindingCompatibility(store,mapping,'media_car_series_id').code==='value_domain_mismatch','media IDs remain a separate declared domain');
  check(M.queryBindingCompatibility(store,source,'name').code==='value_domain_mismatch','a series display name is not its directory code');
  check(M.queryBindingCompatibility(store,source,'code','unknownParam').code==='unsupported_parameter','safe syntax does not make an undeclared downstream parameter valid');
  check(M.queryBindingCompatibility(store,source,'unknown').code==='unsupported_source_value','undeclared upstream attributes cannot be used');
  check(M.queryBindingCompatibility(store,store,'code').code==='invalid_source','a multi-value store field cannot act as a scalar source');
  const B=h.win.BusinessData;check(B.capability('series').returnFields.find(row=>row.key==='code').valueDomain!==B.capability('stores').returnFields.find(row=>row.key==='code').valueDomain,'series and store code metadata are independent');
  const bytes=h.storage.get(M.storageKey);check(!M.saveField({...store,depends:[mapping.id]},h.scope).ok&&h.storage.get(M.storageKey)===bytes,'new incompatible bindings fail without mutating configuration');
  check(!M.saveField({...store,parameterBinding:{...store.parameterBinding,parameterName:'unknownParam'}},h.scope).ok,'field save validates the actual downstream key');
 }
 {
  const h=harness({generic:true}),M=h.M,P=h.win.BusinessConfiguration;badMapping(h);const bytes=h.storage.get(M.storageKey);
  check(M.catalog(h.scope).ok&&M.configurationIssue('lead',h.scope),'existing bad binding stays readable with a targeted issue');
  check(!M.save(M.get('lead',h.scope),h.scope).ok&&h.storage.get(M.storageKey)===bytes,'category edits cannot silently retain an incompatible binding');
  P.render('field');P.open('field','genericStore');const select=h.document.getElementById('business-field-series-dependency'),mapping=select.children.find(row=>row.value==='mappingIntendedSeries');
  check(mapping?.disabled&&mapping.hasAttribute('selected')&&mapping.textContent.includes('编码不兼容')&&mapping.getAttribute('title').includes('不能直接使用'),'incompatible retained source remains visible, selected and disabled with its reason');
  check(!mapping.textContent.includes('来源能力待恢复'),'a domain mismatch is not reported as a disabled source');
  const attribute=h.document.getElementById('business-field-source-value-key').children.find(row=>row.value==='code');check(attribute?.disabled&&attribute.hasAttribute('selected'),'bad selected return property remains visible and disabled');
  check(h.managerHtml.includes('两者不能直接使用')&&h.managerHtml.includes('关闭此查询条件独立查询'),'live rule summary states the actual compatibility problem and recovery');
  check(h.document.getElementById('business-field-rule-summary').textContent.includes('两者不能直接使用'),'the complete selected incompatibility reason is visibly rendered once outside option titles');
  P.save();check(h.document.activeElement===h.document.getElementById('business-field-series-dependency'),'saving a domain mismatch focuses its unmatched source rather than the valid seriesCode parameter');
  check(h.storage.get(M.storageKey)===bytes,'opening the editor never rewrites or disables the old binding');
  P.setDependency('genericSeries');P.setParameterBinding('required',false);P.save();check(M.getField('genericStore',h.scope).depends[0]==='genericSeries','operator can explicitly choose a matching source and an optional relation without adding an absent required upstream');
 }
 {
  const h=harness({generic:true}),M=h.M,P=h.win.BusinessConfiguration,meta=metadata(h);badMapping(h);
  const capability=meta.real.capability('mapping-series');capability.returnFields.push({key:'catalogCode',label:'明确目录编码',valueType:'string',valueDomain:'demo.catalog-series-code',valueDomainLabel:'演示目录车系编码'});meta.set('mapping-series',capability);
  const source=M.getField('mappingIntendedSeries',h.scope),store=M.getField('genericStore',h.scope);
  check(M.dependencyCompatible(store,source)&&!M.queryBindingCompatibility(store,source).ok,'a source remains a candidate if another declared property matches');
  P.render('field');P.open('field','genericStore');const option=h.document.getElementById('business-field-series-dependency').children.find(row=>row.value===source.id);check(option&&!option.disabled,'future source with another compatible property is not hidden or disabled');
  P.setDependency(source.id);let values=h.document.getElementById('business-field-source-value-key');check(values.children.find(row=>row.value==='code')?.hasAttribute('selected'),'choosing a source never silently substitutes another property for code');
  check(!values.children.find(row=>row.value==='catalogCode')?.disabled,'compatible alternate property is available for explicit selection');
  P.save();check(h.document.activeElement===h.document.getElementById('business-field-source-value-key'),'when another attribute matches, a bad selected property focuses the property selector');
  P.setParameterBinding('sourceValueKey','catalogCode');P.save();check(M.getField('genericStore',h.scope).parameterBinding.sourceValueKey==='catalogCode','explicit alternate-property choice saves without code-name heuristics');
 }
 {
  const h=harness({generic:true}),M=h.M,P=h.win.BusinessConfiguration,meta=metadata(h),raw=JSON.parse(h.storage.get(M.storageKey));raw.scopes[0].fields.find(row=>row.id==='genericStore').parameterBinding.sourceValueKey='removedAttribute';h.storage.set(M.storageKey,JSON.stringify(raw));
  check(M.catalog(h.scope).ok,'a formerly declared attribute disappearing does not invalidate the entire schema');P.render('field');P.open('field','genericStore');
  const retained=h.document.getElementById('business-field-source-value-key').children.find(row=>row.value==='removedAttribute');check(retained?.disabled&&retained.hasAttribute('selected'),'an absent former return property remains explicitly visible for repair');
  const cap=meta.real.capability('stores');cap.queryConditions=[];meta.set('stores',cap);const before=h.storage.get(M.storageKey);P.open('field','genericStore');
  check(h.document.getElementById('business-field-use-query-conditions').children.find(row=>row.value==='true')?.hasAttribute('selected'),'opening an existing source with lost declarations never silently switches off its condition');
  P.save();check(h.storage.get(M.storageKey)===before,'reading or failed validation cannot save a silent independent-query downgrade');
 }
 {
 const h=harness({generic:true}),M=h.M,meta=metadata(h),source=M.getField('genericSeries',h.scope),store=M.getField('genericStore',h.scope);const cap=meta.real.capability('series');delete cap.returnFields.find(row=>row.key==='code').valueDomain;meta.set('series',cap);
  check(M.catalog(h.scope).ok&&M.queryBindingCompatibility(store,source).code==='missing_metadata','missing declarations fail compatibility without invalidating the tenant schema');
  check(!M.dependencyCompatible(store,source)&&!M.saveField(store,h.scope).ok,'missing metadata cannot manufacture compatibility or a valid edit');
  check(!M.bindingConfigurationStatus('lead',h.scope).compatibilityOnly,'missing metadata is not classified as the narrow render/repair exception');
  check(!M.callFormRepairable(h.call,'lead'),'missing source metadata does not open bound-version replacement');
  const numberCap=meta.real.capability('series'),storeCap=meta.real.capability('stores');numberCap.returnFields.find(row=>row.key==='code').valueType='number';storeCap.queryConditions[0].valueType='number';meta.set('series',numberCap);meta.set('stores',storeCap);check(M.queryBindingCompatibility(store,source).ok,'explicit number-to-number declarations remain supported');
  numberCap.returnFields.find(row=>row.key==='code').valueType='boolean';storeCap.queryConditions[0].valueType='boolean';meta.set('series',numberCap);meta.set('stores',storeCap);check(M.queryBindingCompatibility(store,source).ok,'explicit boolean-to-boolean declarations remain supported');
  storeCap.queryConditions[0].valueType='string';meta.set('stores',storeCap);check(M.queryBindingCompatibility(store,source).code==='value_type_mismatch','a boolean declaration is never implicitly converted to text');
 }
 {
  const h=harness({generic:true}),M=h.M;badMapping(h);h.mount({callId:'current-bad-binding'},{plannedStoreName:'保留门店'});const F=h.win.BusinessInterfaceField;
  check(M.bindingConfigurationStatus('lead',h.call).compatibilityOnly,'a sole declared compatibility error is structurally classified');
  check(h.form().querySelector('[data-interface-field="mappingIntendedSeries"]')&&h.form().querySelector('[data-interface-field="genericStore"]'),'real CF keeps interface controls visible only for the compatibility exception');
  const B=h.win.BusinessData;let storeRequests=0;h.win.BusinessData={...B,queryOptions(...args){if(args[0]==='d-fixture-store')storeRequests++;return B.queryOptions(...args);}};
  const q=await F.query('seat-followup','mappingIntendedSeries');check(q.ok&&q.items.some(row=>row.code==='910003'),'upstream Mapping candidates remain normally queryable');
  check(F.choose('seat-followup','mappingIntendedSeries',JSON.stringify(['',q.items[2].code])),'operator can select the actual Mapping item');
  const result=await F.query('seat-followup','genericStore');check(!result.ok&&storeRequests===0,'downstream mismatch makes zero provider requests and cannot downgrade to an independent query');
  check(!h.C.save(h.call,h.values,{wrapping:true,expectedVersion:''}).ok&&h.values.plannedStoreName==='保留门店','real save still rejects the configuration while retaining all input');
  const raw=JSON.parse(h.storage.get(M.storageKey)),lead=raw.scopes[0].types.find(row=>row.id==='lead');lead.fields.find(row=>row.fieldId==='mappingIntendedSeries').enabled=false;h.storage.set(M.storageKey,JSON.stringify(raw));
  h.mount({callId:'missing-required-upstream'});check(!M.bindingConfigurationStatus('lead',h.call).compatibilityOnly&&!h.form().querySelector('[data-interface-field]'),'required upstream absence still hides impossible interface selectors');
 }
 {
  const h=harness({generic:true}),M=h.M,meta=metadata(h);badMapping(h);const oldCap=meta.real.capability('stores');oldCap.queryConditions[0].valueDomain='mapping.official-series-id';oldCap.queryConditions[0].valueDomainLabel='官方车系ID';meta.set('stores',oldCap);
  h.mount({callId:'pre-deploy-binding'},{plannedStoreName:'原通话文本',genericStore:[{code:'N01',name:'原暂选店',entryId:'d-fixture-store',state:'valid'}]});meta.clear('stores');render(h);
  const base=copy(h.call.businessFormVersion);check(!Object.keys(base.initialIssues).length&&M.callFormRepairable(h.call,'lead'),'pre-deploy snapshot with empty initial issues may explicitly repair its newly diagnosed binding');
  check(!M.repairedCallForm(h.call,'lead').ok,'still-broken live configuration cannot replace the captured type');
  const store=M.getField('genericStore',h.scope);store.useQueryConditions=false;store.depends=[];delete store.parameterBinding;check(M.saveField(store,h.scope).ok,'administrator explicitly fixes the live source by selecting independent querying');
  h.win.AgentWorkbench.persistBusinessForm=updated=>{const accepted=M.acceptCallFormRepair(h.call,updated);if(accepted.ok)Object.assign(h.call,{businessFormVersion:copy(updated.businessFormVersion),businessFormType:updated.businessFormType});return accepted;};
  check(click(h,'[data-followup-reload-repaired]')===true,'real CF explicit repair uses the controlled acceptance bridge');
  check(JSON.stringify({...h.call.businessFormVersion,repairs:{},integrity:base.integrity})===JSON.stringify({...base,repairs:{}}),'repair does not replace the original directory or another category');
  check(M.callForm(h.call).ok&&h.call.businessFormVersion.repairs.lead.compatibilityRecovery.code==='value_domain_mismatch','accepted repair records verifiable compatibility cause and remains readable');
  check(h.values.plannedStoreName==='原通话文本'&&h.values.genericStore[0].code==='N01'&&!h.C.validate(h.values,h.call).ok,'changed downstream original value stays visible and pending rather than being silently reinterpreted');
  check(click(h,'[data-followup-recovery-clear="genericStore"]')===true&&Array.isArray(h.values.genericStore)&&h.values.genericStore.length===0,'original incompatible downstream selection is cleared through its actual handler');
  check(h.C.save(h.call,h.values,{wrapping:true,expectedVersion:''}).ok,'repaired current call can finish after explicit old-value handling');
  check(!M.callFormRepairable(h.call,'lead')&&!M.repairedCallForm(h.call,'lead').ok,'the healthy repaired version cannot repeatedly reload newer changes');
 }
 {
  const h=harness({generic:true}),M=h.M;const version=JSON.stringify(h.call.businessFormVersion);badMapping(h);
  check(!M.callFormRepairable(h.call,'lead')&&!M.repairedCallForm(h.call,'lead').ok&&JSON.stringify(h.call.businessFormVersion)===version,'healthy captured schema cannot be replaced merely because live configuration changed');
  h.win.BusinessData.setEnabled('d-fixture-series',false);check(!M.callFormRepairable(h.call,'lead'),'source disable alone does not create repair eligibility');
  h.setAuthorized(false);check(!M.callFormRepairable(h.call,'lead'),'permission loss never opens configuration replacement');
 }
 console.log(JSON.stringify({ok:true,assertions:passed,scope:'actual attribute/parameter types and domains; readable bad refs; disabled reasoned choices; alternate attributes; strict missing metadata; normal controls and no-provider mismatch; bounded explicit old-call repair'}));
})().catch(error=>{console.error(error);process.exitCode=1;});
