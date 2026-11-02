/* Actual built customer-result dictionary, editor and Mock event chain. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {setup,success,plain,pick}=require('./check-four-node-model.cjs');
const {attach}=require('./check-four-node-workspace.cjs');
const root=path.resolve(__dirname,'..'),tests=[];
const ids={MANUAL:'TIANRUN_MANUAL_SIP_CAUSE',PREDICTIVE:'TIANRUN_PREDICTIVE_SIP_CAUSE'};
const values=['200',...Array.from({length:15},(_,i)=>String(710+i))];
function check(name,run){try{run();tests.push({name,status:'pass'});}catch(error){tests.push({name,status:'fail',error:error.stack||error.message});}}
function configured(method='MANUAL',wanted='710'){
  const f=setup(),source={channel:'CLOUD',domainId:ids[method],scope:'CURRENT_NODE'},nodes=[{nodeId:'CALL',name:'客户呼叫',type:'PROCESS',methods:[method],recipient:{kind:'TENANT',scope:'CURRENT'},conditionSource:source,next:['MATCH','OTHER']},...['MATCH','OTHER'].map(nodeId=>({nodeId,name:nodeId,type:'END',endAction:'CLOSE',next:[]}))];
  const edges=[{edgeId:'MATCH',fromNodeId:'CALL',toNodeId:'MATCH',branch:{kind:'IF',priority:1},conditions:{enabled:true,mode:'ALL',rules:[{ruleId:'SIP-RULE',source:'CALL_STATUS',operator:'EQ',values:[wanted]}]}},{edgeId:'OTHER',fromNodeId:'CALL',toNodeId:'OTHER',branch:{kind:'ELSE',priority:2},conditions:{enabled:false,mode:'ALL',rules:[]}}];
  const bound=f.bindCustom(nodes,edges);return {...f,bound};
}
function editor(f){
  const b=f.b,elements=new Map();b.PlatformUI={escape:x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),closeLayer(){},confirm(){throw Error('Status choice must not need a confirmation');},pageHeader:()=>'',table:()=>'',help:()=>''};
  b.Pages={};b.RouteRuntime={refreshCurrent(){}};b.showToast=()=>{};b.document={getElementById:id=>elements.get(id)||null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},removeEventListener(){}};b.requestAnimationFrame=fn=>fn();b.cancelAnimationFrame=()=>{};
  let source=pick('/** PAGE-11205').replace('window.FlowConfiguration={','window.FlowConfiguration={__get:()=>editor,__node:nodeCard,');
  const start=source.indexOf('  function draw() {'),end=source.indexOf('\n  function status(',start);assert(start>=0&&end>start);source=source.slice(0,start)+'  function draw() {}\n'+source.slice(end);vm.runInContext(source,b,{filename:'actual-built-cloud-sip-editor'});
  const api=b.FlowConfiguration;api.open('template',f.bound.template.templateId);api.__get().stage='canvas';return {api,ed:api.__get(),elements};
}
function proof(f,seg,code,state='KNOWN'){
  const item=f.b.DFlowStatusDomains.find(domain=>domain.id===ids[seg.method]).statuses.find(item=>item.value===code);
  return {simulation:true,tenantId:seg.tenantId,roundId:seg.roundId,nodeRunId:seg.nodeRunId,segmentId:seg.segmentId,channel:'CLOUD',domainId:ids[seg.method],rawDomain:ids[seg.method],rawCode:code,rawLabel:item?.label||code,statusValue:state==='KNOWN'?code:null,state,completed:true,retriesCompleted:true};
}
function busyFlow(method){
  const f=configured(method),id=f.imported('SIP-'+method);f.arrange(id);const seg=success(f.s.start(id,{}));f.event(id,seg,'attempt-start',{attemptId:'ATT',actualDialed:true});f.event(id,seg,'attempt-end',{attemptId:'ATT',customerAnswered:false});f.event(id,seg,'attempts-complete',{completed:true,retriesCompleted:true,routingEvidence:proof(f,seg,'710')});
  return {...f,id,seg};
}
check('both actual catalogs offer 200 and 710-724 without answer-status flags',()=>{
  const f=setup();for(const method of Object.keys(ids)){const d=f.b.DFlowStatusDomains.find(d=>d.id===ids[method]);assert(d);assert.deepEqual(plain(d.statuses.map(s=>s.value)),values);assert.deepEqual(plain(d.methods),[method]);assert.equal(d.field,'sipCause');assert.equal(d.statuses.find(s=>s.value==='710').label,'占线');for(const bad of ['1','2','3','4','40','41','42','43','701'])assert(!d.statuses.some(s=>s.value===bad));}
  assert(!f.b.DFlowStatusDomains.some(d=>/TIANRUN_LIST_CDR_OB_STATUS|TIANRUN_PREDICTIVE_STATUS/.test(d.id)));
});
check('normalization uses exact method domain and never guesses an unknown/answer flag',()=>{
  const f=setup();for(const method of Object.keys(ids))for(const value of values)assert.equal(f.b.DFlowNormalizeStatus(ids[method],ids[method],value).value,value);
  for(const bad of ['3','43','701','999'])assert.equal(f.b.DFlowNormalizeStatus(ids.MANUAL,ids.MANUAL,bad).state,'PENDING');assert.equal(f.b.DFlowNormalizeStatus(ids.MANUAL,ids.PREDICTIVE,'710').state,'PENDING');
});
for(const method of Object.keys(ids)){
  check(method+' editor uses customer SIP choices and saves 710 exactly',()=>{const f=configured(method),u=editor(f),node=u.ed.values.nodes.find(n=>n.nodeId==='CALL'),html=u.api.__node(node,0,u.ed.values.nodes);assert.equal(node.conditionSource.domainId,ids[method]);assert(html.includes('占线 · 710'));assert(html.includes('已接通 · 200'));assert(!html.includes('客户接听 · 3'));assert(!html.includes('双方接听 · 43'));const saved=success(f.s.saveTemplate({...plain(u.ed.values),brandId:f.brand,templateId:f.bound.template.templateId},{expectedVersion:1}));assert.equal(saved.nodes[0].conditionSource.domainId,ids[method]);assert.deepEqual(plain(saved.edges[0].conditions.rules[0].values),['710']);});
  check(method+' raw 710 drives the matching branch from actual completed facts',()=>{const f=busyFlow(method),evaluation=success(f.s.evaluatePaths(f.id));assert.equal(evaluation.selectedEdgeId,'MATCH');const seg=success(f.s.timeline(f.id)).followups[0];assert.equal(seg.routingEvidence.rawCode,'710');assert.equal(seg.calls[0].customerAnswered,false);assert.equal(seg.archived,true);});
}
check('method switching retains shared valid SIP values with exact source scope',()=>{const f=configured(),u=editor(f),before=f.b.localStorage.dump();u.api.selectProcessMethod('CALL','PREDICTIVE');assert.equal(u.ed.values.nodes[0].conditionSource.domainId,ids.PREDICTIVE);assert.deepEqual(plain(u.ed.values.edges[0].conditions.rules[0].values),['710']);u.api.selectProcessMethod('CALL','MANUAL');assert.equal(u.ed.values.nodes[0].conditionSource.domainId,ids.MANUAL);assert.equal(f.b.localStorage.dump(),before);});
check('current editing refresh corrects an obsolete source only in the editable draft',()=>{const f=configured(),u=editor(f),node=u.ed.values.nodes[0],before=f.b.localStorage.dump();node.conditionSource.domainId='TIANRUN_LIST_CDR_OB_STATUS';u.ed.values.edges[0].conditions.rules[0].values=['3'];u.api.refreshTemplateCategory({capture:false,redraw:false});assert.equal(node.conditionSource.domainId,ids.MANUAL);assert.deepEqual(plain(u.ed.values.edges[0].conditions.rules[0].values),[]);assert.equal(f.b.localStorage.dump(),before);});
check('answer flags and another execution method cannot be saved as customer results',()=>{for(const value of ['1','3','40','43'])assert.throws(()=>configured('MANUAL',value),/比较值/);const f=configured(),input={...plain(f.bound.template),brandId:f.brand,templateId:f.bound.template.templateId};input.nodes[0].conditionSource.domainId=ids.PREDICTIVE;assert.equal(f.s.saveTemplate(input,{expectedVersion:1}).status,'failed');});
check('unknown raw result remains pending and does not fall through to ELSE',()=>{const f=configured(),id=f.imported('UNKNOWN-SIP');f.arrange(id);const seg=success(f.s.start(id,{}));f.event(id,seg,'attempt-start',{attemptId:'ATT',actualDialed:true});f.event(id,seg,'attempt-end',{attemptId:'ATT',customerAnswered:false});f.event(id,seg,'attempts-complete',{completed:true,retriesCompleted:true,routingEvidence:proof(f,seg,'999','PENDING')});const r=success(f.s.evaluatePaths(id));assert.equal(r.selectedEdgeId,null);assert.equal(r.pending,true);});
check('actual workspace Mock selects raw 710 and publishes 710 rather than a guessed answer flag',()=>{
  for(const method of Object.keys(ids)){const f=configured(method),id=f.imported('UI-SIP-'+method);f.arrange(id);const seg=success(f.s.start(id,{})),x=attach(f),html=x.ui.renderDetail({recordId:id});assert(html.includes('占线 · 710'));x.set('fnw-mock-segment',seg.segmentId);x.set('fnw-mock-result','710');for(const type of ['attempt-start','attempt-end','attempts-complete'])x.ui.mockEvent(id,type);const rerendered=x.ui.renderDetail({recordId:id});assert(rerendered.includes('value="710" selected'),'selected raw result survives page refresh');const saved=success(f.s.timeline(id)).followups[0];assert.equal(saved.routingEvidence.rawCode,'710');assert.equal(saved.routingEvidence.domainId,ids[method]);assert.equal(saved.calls[0].customerAnswered,false);}
});
check('AI native labels and raw mapping remain independent',()=>{const f=setup();assert.equal(f.b.DFlowNormalizeStatus('DCC_LOCAL_LABEL','DCC_LOCAL_LABEL','已接通').value,'已接通');assert.equal(f.b.DFlowNormalizeStatus('DCC_LOCAL_LABEL','HOUPU_RAW_STATUS','773').value,'占线');assert.equal(f.b.DFlowNormalizeStatus('DCC_LOCAL_LABEL',ids.MANUAL,'710').state,'PENDING');});
const result={schema:'cloud-sip-status-regression@1',date:new Date().toISOString(),scope:'actual built catalog/editor/model/Mock UI; isolated VM storage, not provider integration',cloudSha256:crypto.createHash('sha256').update(fs.readFileSync(root+'/js/modules/cloud.bundle.js')).digest('hex'),passed:tests.filter(t=>t.status==='pass').length,failed:tests.filter(t=>t.status==='fail').length,tests};
const out=process.argv.indexOf('--output');if(out>=0)fs.writeFileSync(path.resolve(process.argv[out+1]),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));process.exitCode=result.failed?1:0;
