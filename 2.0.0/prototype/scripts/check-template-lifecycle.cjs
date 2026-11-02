/* Current authoritative template lifecycle. Isolated in-memory storage only. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),{setup,success,pick,plain}=require('./check-four-node-model.cjs'),tests=[];
function check(name,run){try{run();tests.push({name,status:'pass'});}catch(error){tests.push({name,status:'fail',error:error.stack||error.message});}}
const state=f=>JSON.parse(f.b.localStorage.getItem(f.s.key));
function currentTemplate(f,id){return state(f).templates.find(t=>t.templateId===id);}
function edit(f,plan,name='重新编辑'){return f.s.saveTemplate({...plain(plan.template),templateId:plan.template.templateId,brandId:f.brand,name},{expectedVersion:currentTemplate(f,plan.template.templateId).latestVersion,requestId:crypto.randomUUID()});}
function unbound(f,name='未被当前分类使用的模板'){
 const catalog=success(f.s.routingCatalog(f.brand,'lead'));
 return success(f.s.saveTemplate({brandId:f.brand,name,routingPolicy:'FIRST_MATCH_V1',categoryRef:catalog.categoryRef,startNodeId:'END',nodes:[{nodeId:'END',name:'结束',type:'END',endAction:'CLOSE',next:[],outcomeCode:'NO_CALL'}],edges:[]},{requestId:crypto.randomUUID()}));
}
function remove(f,id,options={}){const t=currentTemplate(f,id),usage=success(f.s.templateUsage(id));return f.s.deleteTemplate({templateId:id,brandId:f.brand},{expectedVersion:t.latestVersion,expectedUsageFingerprint:usage.fingerprint,requestId:crypto.randomUUID(),...options});}
function captured(f,code='CAPTURED'){
 const a=f.bindPlan(),id=f.imported(code),recordBefore=plain(state(f).records.find(r=>r.recordId===id)),b=f.bindPlan();
 return {a,b,id,recordBefore};
}
check('a currently used template remains editable and saved old versions stay immutable',()=>{
 const f=setup(),a=f.bindPlan(),before=JSON.stringify(currentTemplate(f,a.template.templateId).versions[0]);
 const saved=success(edit(f,a));assert.equal(saved.version,2);const t=currentTemplate(f,a.template.templateId);assert.equal(t.latestVersion,2);assert.equal(JSON.stringify(t.versions[0]),before);
});
check('unknown business execution does not block editing new configuration or mutate the captured run',()=>{
 const f=setup(),a=f.bindPlan(),id=f.imported('UNKNOWN-BUSINESS');f.arrange(id);
 const started=f.s.start(id,{},{requestId:'BUSINESS-PENDING',outcome:'unknown-committed'});assert.equal(started.status,'unknown');
 const before=JSON.stringify(state(f).records.find(r=>r.recordId===id).runs),saved=success(edit(f,a,'为新运行更新的配置'));
 assert.equal(saved.version,2);assert.equal(JSON.stringify(state(f).records.find(r=>r.recordId===id).runs),before);assert.equal(state(f).requests.find(q=>q.requestId==='BUSINESS-PENDING').status,'unknown');
});
check('unknown configuration on the same template still blocks another edit without journal writes',()=>{
 const f=setup(),a=f.bindPlan(),first=f.s.saveTemplate({...plain(a.template),templateId:a.template.templateId,brandId:f.brand,name:'配置结果待核'},{requestId:'CONFIG-PENDING',expectedVersion:1,outcome:'unknown-committed'});
 assert.equal(first.status,'unknown');const before=f.b.localStorage.dump(),second=edit(f,a,'不能覆盖待核配置');assert.equal(second.status,'failed');assert.equal(second.error.code,'PENDING');assert.equal(f.b.localStorage.dump(),before);
});
check('active classification binding blocks removal and leaves every stored byte unchanged',()=>{
 const f=setup(),a=f.bindPlan(),usage=success(f.s.templateUsage(a.template.templateId));assert.equal(usage.canDelete,false);const before=f.b.localStorage.dump(),result=remove(f,a.template.templateId);assert.equal(result.status,'failed');assert.equal(result.error.code,'TEMPLATE_REFERENCED');assert.equal(f.b.localStorage.dump(),before);
});
check('after current rebinding, deleting the definition leaves the captured current run independent',()=>{
 const f=setup(),x=captured(f),beforeRuns=JSON.stringify(x.recordBefore.runs),usage=success(f.s.templateUsage(x.a.template.templateId));assert.equal(usage.canDelete,true,'captured runs use their own plan instead of locking the current library');
 success(remove(f,x.a.template.templateId));const raw=state(f);assert.equal(raw.templates.some(t=>t.templateId===x.a.template.templateId),false);assert(raw.deletedTemplateIds.includes(x.a.template.templateId));assert.equal(JSON.stringify(raw.records.find(r=>r.recordId===x.id).runs),beforeRuns);for(const key of ['templateSnapshots','templateCleanup','legacyRefs'])assert.equal(Object.hasOwn(raw,key),false);
 const detail=success(f.s.detail(x.id));assert.equal(detail.currentNode.nodeId,'CALL');assert.equal(detail.run.planSnapshot.name,x.recordBefore.runs[0].planSnapshot.name);f.arrange(x.id);const seg=success(f.s.start(x.id,{}));f.finish(x.id,seg);success(f.s.saveResult(x.id,{segmentId:seg.segmentId,values:{'FOLLOW-NOTE':'按已捕获流程办理'},providedFieldIds:['FOLLOW-NOTE']}));const evaluated=success(f.s.evaluatePaths(x.id));success(f.s.advance(x.id,{edgeId:evaluated.selectedEdgeId,nextNodeId:'END'},{expectedEvaluationToken:evaluated.evaluationToken}));assert.equal(success(f.s.detail(x.id)).run.status,'ENDED');
});
check('current captured run definitions keep their field references after the current template is removed',()=>{
 const f=setup(),m=f.b.CustomerBusiness;assert.equal(m.saveField({id:'RUN-FIELD',label:'本次运行字段',usage:'FOLLOWUP',businessKey:'run_field',type:'text',options:[],enabled:true},f.scope).ok,true);
 let category=m.get('lead',f.scope);assert.equal(m.save({...category,fields:[...plain(category.fields),{fieldId:'RUN-FIELD',enabled:true,required:false}]},f.scope).ok,true);const a=f.bindPlan(),id=f.imported('CAPTURED-FIELD');
 category=m.get('lead',f.scope);assert.equal(m.save({...category,fields:plain(category.fields).filter(r=>r.fieldId!=='RUN-FIELD')},f.scope).ok,true);f.bindPlan();success(remove(f,a.template.templateId));
 vm.runInContext(pick('/** Read-only, current-schema usage'),f.b,{filename:'actual-built-configuration-usage'});const before=f.b.localStorage.dump(),review=m.usage('field','RUN-FIELD',f.scope);assert.equal(review.ok,true,review.message);assert.equal(review.canDelete,false);assert(review.refs.some(r=>r.fieldId==='RUN-FIELD'),'the actual captured run keeps its field reference');assert.equal(m.deleteField('RUN-FIELD',f.scope).ok,false);assert.equal(f.b.localStorage.dump(),before);assert(success(f.s.detail(id)).run.planSnapshot.routingCatalog.fields.some(field=>field.id==='RUN-FIELD'));
});
check('brand and maintenance scope checks apply equally to edit and removal',()=>{
 const f=setup(),t=unbound(f),before=f.b.localStorage.dump();const deletion=f.s.deleteTemplate({templateId:t.templateId,brandId:'BRAND-FOREIGN'},{requestId:'WRONG-BRAND',expectedVersion:1});assert.equal(deletion.status,'failed');const editing=f.s.saveTemplate({...plain(t),brandId:'BRAND-FOREIGN',name:'越界编辑'},{expectedVersion:1});assert.equal(editing.status,'failed');assert.equal(f.b.localStorage.dump(),before);
 f.switchTo('PERSON-HQ');assert.equal(f.s.templateUsage(t.templateId).status,'failed');assert.equal(f.s.deleteTemplate({templateId:t.templateId,brandId:f.brand},{expectedVersion:1}).status,'failed');assert.equal(f.b.localStorage.dump(),before);
});
check('stale version cannot remove a newer template, even when no current binding exists',()=>{
 const f=setup(),t=unbound(f),usage=success(f.s.templateUsage(t.templateId));success(f.s.saveTemplate({...plain(t),templateId:t.templateId,brandId:f.brand,name:'更新后的配置'},{expectedVersion:1}));const before=f.b.localStorage.dump(),result=f.s.deleteTemplate({templateId:t.templateId,brandId:f.brand},{expectedVersion:1,expectedUsageFingerprint:usage.fingerprint});assert.equal(result.status,'failed');assert.equal(result.error.code,'STALE_VERSION');assert.equal(f.b.localStorage.dump(),before);
});
check('unknown committed removal reconciles and replays under one identity without duplicate deletion',()=>{
 const f=setup(),t=unbound(f),usage=success(f.s.templateUsage(t.templateId)),input={templateId:t.templateId,brandId:f.brand},opts={requestId:'REMOVE-ONE',expectedVersion:1,expectedUsageFingerprint:usage.fingerprint,outcome:'unknown-committed'};const first=f.s.deleteTemplate(input,opts);assert.equal(first.status,'unknown');const reconciled=f.s.reconcile('REMOVE-ONE');assert.equal(reconciled.status,'success');const replay=f.s.deleteTemplate(input,opts);assert.equal(replay.status,'success');const raw=state(f);assert.equal(raw.templates.some(row=>row.templateId===t.templateId),false);assert.equal(raw.deletedTemplateIds.filter(id=>id===t.templateId).length,1);assert.equal(raw.requests.filter(q=>q.requestId==='REMOVE-ONE').length,1);assert(Number.isSafeInteger(raw.revision)&&raw.revision>0,'reconciled mutation keeps a valid root revision');for(const key of ['templateSnapshots','templateCleanup','legacyRefs'])assert.equal(Object.hasOwn(raw,key),false);
});
const result={schema:'template-lifecycle-regression@1',date:new Date().toISOString(),scope:'actual current built authoritative store and real configuration usage; isolated VM Map storage only',passed:tests.filter(t=>t.status==='pass').length,failed:tests.filter(t=>t.status==='fail').length,tests};const output=process.argv.indexOf('--output');if(output>=0)fs.writeFileSync(path.resolve(process.argv[output+1]),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));process.exitCode=result.failed?1:0;
