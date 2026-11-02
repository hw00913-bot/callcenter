/* Actual AI supplier status reader and current-tenant ModuleHost task projection. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),tests=[];
const moduleBox={window:{}};vm.createContext(moduleBox);vm.runInContext(read('js/modules/ai.bundle.js'),moduleBox);
const page=[...moduleBox.window.DNativeModules.ai.html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('integrationTaskStatus: function'));
assert(page,'Build must expose the original task page status reader');
const statusBox={window:null,Pages:{}};statusBox.window=statusBox;vm.createContext(statusBox);vm.runInContext(page,statusBox);
const statusReader=statusBox.Pages['scene-list'].integrationTaskStatus;
const host=read('js/components/module-host.js'),source=host.slice(host.indexOf('  function workflowSceneContext('),host.indexOf('  async function prepareSeatCapabilities('));
function fixture(){
  const context={account:{id:'A'},scope:{kind:'tenant',id:'T',tenant:{enabled:true,brandId:'B',modules:{ai:true}},grant:{modules:['ai','cloud']}}};
  const sceneRows=[{dataImportSource:'MANUAL',importType:'手动导入',id:1,sceneId:'REMOTE-SCENE',name:'场景',platform:'中科金智能',unifiedCategoryId:'lead',integrationTenantId:'T'}];
  let valid=true,revision=1,writes=0;
  const ai={DNativeContext:{context},MockSceneList:[],Pages:{'scene-list':{integrationTaskStatus:statusReader}},DAIConfigStore:{reviewCurrent:()=>({ok:valid,revision}),snapshot:()=>({sceneRows})}};
  const b={frames:{ai:{contentWindow:ai}},readyKinds:new Set(['ai']),DSession:{context:()=>context,roleKey:()=> 'hq_admin',allowed:id=>id==='PAGE-2204',canWrite:id=>id==='PAGE-2204'},DSeed:{aiSceneRelations:[]},DUnifiedCategories:{definitions:[]},DCatalog:{key:'LINKS'},localStorage:{getItem:()=>null,setItem(){writes++;}},setTimeout,clearTimeout};
  b.window=b;vm.createContext(b);vm.runInContext(read('js/adapters/ai-scene-import-source.js'),b);vm.runInContext(source+'\nthis.tasks=currentWorkflowTasks;this.readTasks=readWorkflowTasks;',b);
  const task=(extra={})=>({source:'手动导入',id:'TASK',name:'已存在专业任务',integrationTenantId:'T',platform:'中科金智能',status:'not_started',taskStatus:1,...extra});
  return {b,ai,context,sceneRows,task,rows:()=>b.tasks().tasks,importRows:taskId=>b.tasks({forImport:true,taskId}).tasks,valid:value=>{valid=value;},revision:value=>{revision=value;},writes:()=>writes};
}
function test(name,run){try{run();tests.push({name,status:'pass'});}catch(e){tests.push({name,status:'fail',error:e.stack});}}
test('projects existing professional task IDs separately from scene IDs with no writes',()=>{
  const f=fixture();f.ai.MockSceneList=[f.task(),f.task({id:'OTHER',name:'另一个任务'})];
  const rows=f.rows();assert.equal(rows.length,2);assert.equal(rows[0].resourceId,'TASK');assert.equal(rows[0].taskId,'TASK');assert.equal(rows[0].kind,'TASK');assert.equal(rows[0].sceneId,'');assert.equal(rows[0].tenantId,'T');assert.equal(f.writes(),0);const scene=f.b.currentWorkflowScenes().scenes[0];assert.equal(scene.dataImportSource,'MANUAL');assert.equal(scene.importType,'手动导入');
});
test('keeps only exact owned tasks and never matches by task or tenant name',()=>{
  const f=fixture();f.ai.MockSceneList=[f.task({id:'OWN'}),f.task({id:'FOREIGN',integrationTenantId:'X'}),f.task({id:'LABEL',integrationTenantId:undefined,tenant:'当前租户'}),f.task({id:'DELETED',deleted:true})];
  assert.equal(JSON.stringify(f.rows().map(t=>t.taskId)),JSON.stringify(['OWN']));
});
test('uses the original supplier raw-status mapping rather than stale display labels',()=>{
  const f=fixture();f.ai.MockSceneList=[f.task({id:'RAW-RUNNING',status:'paused',taskStatus:2}),f.task({id:'UNKNOWN',status:'paused',taskStatus:999}),f.task({id:'QUEUED',taskStatus:5}),f.task({id:'PAUSED',taskStatus:6})];
  assert.equal(JSON.stringify(f.rows().map(t=>t.taskId)),JSON.stringify(['PAUSED']));
});
test('does not arrange running, completed, auto-start or disabled tasks',()=>{
  const f=fixture();f.ai.MockSceneList=[f.task({id:'RUNNING',running:true}),f.task({id:'FINISHED',taskStatus:3}),f.task({id:'AUTO',autoStartOnAdd:true}),f.task({id:'DISABLED',enabled:false})];assert.equal(f.rows().length,0);
});
test('links explicit scene IDs and remote task keys only when uniquely verified',()=>{
  const f=fixture();f.ai.MockSceneList=[f.task({id:'EXPLICIT',workflowSceneId:'1'}),f.task({id:'REMOTE',taskId:'REMOTE-SCENE'}),f.task({id:'BAD',workflowSceneId:'MISSING'})];
  const rows=f.rows();assert.equal(rows.length,2);assert(rows.every(t=>t.sceneId==='1'&&t.categoryId==='lead'));
});
test('requires at least a compatible same-provider scene and respects explicit category facts',()=>{
  const f=fixture();f.ai.MockSceneList=[f.task({id:'PROVIDER',platform:'未知平台'}),f.task({id:'CATEGORY',categoryId:'service'}),f.task({id:'OK',categoryId:'lead'})];assert.equal(JSON.stringify(f.rows().map(t=>t.taskId)),JSON.stringify(['OK']));
});
test('duplicate professional task identity fails closed instead of choosing a first row',()=>{
  const f=fixture();f.ai.MockSceneList=[f.task(),f.task()];assert.throws(()=>f.rows(),/身份重复/);
});
test('configuration status change changes the captured target fingerprint',()=>{
  const f=fixture();f.ai.MockSceneList=[f.task()];const before=f.rows()[0].configurationFingerprint;f.ai.MockSceneList[0].taskStatus=6;assert.notEqual(f.rows()[0].configurationFingerprint,before);
});
test('revoked module usage or unavailable saved configuration cannot disclose a directory',()=>{
  const f=fixture();f.ai.MockSceneList=[f.task()];f.context.scope.grant.modules=['cloud'];assert.throws(()=>f.rows(),/使用权限/);f.context.scope.grant.modules=['ai'];f.valid(false);assert.throws(()=>f.rows(),/待核/);
});
test('stale frame identity and unresolved explicit scene linkage fail closed',()=>{
  const f=fixture();f.ai.MockSceneList=[f.task({workflowSceneId:'1'})];f.ai.DNativeContext={context:{account:{id:'OTHER'},scope:{id:'T'}}};assert.throws(()=>f.rows(),/尚未就绪/);
});
test('native Houpu24 running import is distinct from execution admission and links exact professional task ID',()=>{const f=fixture();f.sceneRows.push({id:12,sceneId:'HP-SCENE-001',taskId:'HP-TASK-20260714-001',name:'原专业场景',platform:'厚朴',unifiedCategoryId:'lead',integrationTenantId:'T'});f.ai.MockSceneList=[f.task({id:24,name:'厚朴-新线索首访',platform:'厚朴',task_id:'HP-TASK-20260714-001',status:'running',taskStatus:1})];assert.equal(f.rows().length,0);const row=f.importRows('24')[0];assert.equal(row.name,'厚朴-新线索首访');assert.equal(row.taskStatusCode,2);assert.equal(row.importEligibility.known,true);assert.equal(row.importEligibility.allowed,true);assert.equal(row.sceneId,'12');assert.equal(row.remoteTaskId,'HP-TASK-20260714-001');assert.equal(f.b.currentWorkflowScenes().scenes.find(scene=>scene.sceneId==='12').sourceConfigurationState,'ABSENT');assert.equal(f.writes(),0)});
test('import projection keeps existing terminal unknown disabled and auto tasks with accurate refusal reasons',()=>{for(const [change,reason]of [[{taskStatus:2},/终止|完成|归档/],[{taskStatus:999},/状态待核/],[{enabled:false},/删除|停用/],[{autoStartOnAdd:true},/自动/]]){const f=fixture();f.ai.MockSceneList=[f.task({id:24,platform:'厚朴',status:'running',taskStatus:1,...change})];const row=f.importRows('24')[0];assert(row,'existing task metadata stays available');assert.equal(row.importEligibility.allowed,false);assert.match(row.importEligibility.reason,reason);assert.equal(f.writes(),0)}});
test('forImport never links by equal names and refuses ambiguous professional remote bindings',()=>{const f=fixture();f.sceneRows.push({id:12,sceneId:'HP-SCENE-001',taskId:'HP-TASK',name:'同名',platform:'厚朴',unifiedCategoryId:'lead',integrationTenantId:'T'});f.ai.MockSceneList=[f.task({id:24,name:'同名',platform:'厚朴',task_id:'WRONG',status:'running',taskStatus:1})];assert.equal(f.importRows('24')[0].sceneId,'');f.ai.MockSceneList[0].task_id='HP-TASK';f.sceneRows.push({...f.sceneRows[1],id:13,sceneId:'HP-SCENE-002'});const row=f.importRows('24')[0];assert.equal(row.importEligibility.allowed,false);assert.match(row.importEligibility.reason,/多个|冲突|不唯一/);assert.equal(row.sceneId,'');assert.equal(f.writes(),0)});
const result={schema:'workflow-task-directory@1',date:new Date().toISOString(),scope:'actual built supplier status reader plus actual ModuleHost projection in isolated VM; no browser or provider writes',passed:tests.filter(t=>t.status==='pass').length,failed:tests.filter(t=>t.status==='fail').length,tests};
const i=process.argv.indexOf('--output');if(i>=0)fs.writeFileSync(path.resolve(process.argv[i+1]),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));process.exitCode=result.failed?1:0;
