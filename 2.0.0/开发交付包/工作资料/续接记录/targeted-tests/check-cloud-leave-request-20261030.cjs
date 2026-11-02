'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root='/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype';
const adapter=fs.readFileSync(root+'/js/adapters/cloud.js','utf8');
const bundleBox={window:{}};vm.createContext(bundleBox);vm.runInContext(fs.readFileSync(root+'/js/modules/cloud.bundle.js','utf8'),bundleBox);
const html=bundleBox.window.DNativeModules.cloud.html;
const bundled=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.startsWith('/* Cloud source keeps its native state'));
assert(bundled,'cloud adapter is embedded in actual runtime bundle');
function first(code){const marker='/* Reuse the original call identity checks';assert(code.includes(marker));return code.slice(0,code.indexOf(marker));}
function setup(source,options={}){
 const events=[],scope={account:{id:'ACCOUNT'},scope:{id:'TENANT'}};
 const parent={DSession:{context:()=>options.invalid?null:scope},DUI:{toast:message=>events.push(['toast',message]),dialog:()=>{throw Error('must not require telephone logout');}},DApp:{leave:(next,proceed)=>{events.push(['leave',next]);box.DAdapter.beforeLeave(next,proceed);},refresh:()=>events.push(['refresh'])},DModuleHost:{dispose:()=>events.push(['dispose'])}};
 parent.DSession.logout=()=>events.push(['logout']);
 const box={DNativeContext:{context:scope,routeMap:{}},navigateTo(){},parent,document:{addEventListener(){}},AppState:{get:()=>({hasUnsavedChanges:!!options.dirty})},PlatformUI:{hasUnsavedLayers:()=>!!options.layers},AgentWorkbench:{telephoneStatus:()=>{events.push(['telephone-status']);return options.phone||{};},allowContextChange:()=>{throw Error('must not check busy or unresolved telephone state');},signOut:()=>{throw Error('must not sign out automatically');}},SeatOperationUI:{isBusy:()=>!!options.operation},AliCtiSeatOperations:{status:()=>options.status||{},connectionStatus:()=>({blocked:!!options.blocked}),managementState:()=>options.management||{}}};box.window=box;vm.createContext(box);vm.runInContext(first(source),box);return {box,events};
}
let assertions=0;const scenarios=[];
const subjects=process.argv.includes('--adapter-only')?[['adapter',adapter]]:[['adapter',adapter],['runtime bundle',bundled]];
for(const [name,source]of subjects){
 for(const [state,options]of [['active call',{busy:true,phone:{online:true}}],['signing in',{phone:{signingIn:true}}],['telephone pending',{status:{pending:true,inFlight:true},operation:true}],['management pending',{management:{pending:true,inFlight:true}}],['blocked connection',{blocked:true}],['online idle',{phone:{online:true}}]])for(const next of [{phoneDomain:'ai'},null]){
  const t=setup(source,options);let proceed=0;t.box.DAdapter.beforeLeave(next,()=>proceed++);assert.equal(proceed,1,name+'/'+state+' must allow navigation/exit');assert.deepEqual(t.events,[],name+'/'+state+' must not touch telephone state');assertions+=2;scenarios.push(name+'/'+state+'/'+(next?'cross-domain':'logout'));
 }
 for(const [state,options]of [['unsaved app form',{dirty:true}],['unsaved layer',{layers:true}],['invalid scope',{invalid:true}]])for(const next of [{phoneDomain:'ai'},null]){
  const t=setup(source,options);let proceed=0;t.box.DAdapter.beforeLeave(next,()=>proceed++);assert.equal(proceed,0,name+'/'+state+' remains blocked');assert.equal(t.events.filter(e=>e[0]==='toast').length,1);assertions+=2;
 }
 {
  const t=setup(source,{busy:true,phone:{online:true},status:{pending:true},blocked:true});assert.equal(t.box.AppState.logout(),true);assert.deepEqual(t.events.map(e=>e[0]),['leave','logout','dispose','refresh']);assertions+=2;
 }
}
if(!process.argv.includes('--adapter-only')){assert.equal(first(adapter),first(bundled),'runtime must embed the current adapter exactly');assertions++;}
console.log(JSON.stringify({ok:true,assertions,allowedScenarios:scenarios.length,scope:'actual adapter and built runtime beforeLeave; isolated VM; no project or browser data writes'}));
