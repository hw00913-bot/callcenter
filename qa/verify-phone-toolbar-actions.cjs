'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
let session={presence:'ready'},blocked=false,pending=false,inFlight=false;
const ctx={window:null,PlatformUI:{escape:s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')},AgentWorkbench:{receivingContext:()=>({online:true})},AliCtiSeatOperations:{current:()=>session,status:()=>({pending,inFlight}),connectionStatus:()=>({blocked}),managementState:()=>({}),monitorQueues:()=>[]}};ctx.window=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'js/components/seat-operation-ui.js'),'utf8'),ctx);
const control=()=>ctx.SeatOperationUI.controls({agent:{cno:'001'},phoneReason:''},{online:true,compact:true,busy:false});
let html=control();assert(html.indexOf('id="seat-presence-toggle"')<html.indexOf('<details'));assert.equal((html.match(/id="seat-presence-toggle"/g)||[]).length,1);
session={presence:'paused',pauseDescription:'处理资料 <客户>'};html=control();assert(html.includes('置闲'));assert(html.includes('处理资料 &lt;客户>'));
blocked=true;assert.match(control(),/id="seat-presence-toggle"[^>]* disabled/);blocked=false;
session={presence:'wrapup'};assert(ctx.SeatOperationUI.wrapupControl('toolbar').includes('id="seat-extend-wrapup-toolbar"'));assert(ctx.SeatOperationUI.wrapupControl().includes('id="seat-extend-wrapup"'));
inFlight=true;assert(ctx.SeatOperationUI.wrapupControl('toolbar').includes(' disabled'));inFlight=false;
session={presence:'ready'};assert.equal(ctx.SeatOperationUI.wrapupControl('toolbar'),'');
// Load the real adapter, retaining its local mock transport and permission checks.
const adapterCtx={window:null,CloudCallData:{instances:[],phoneNumbers:[]},PlatformUI:{},Pages:{},document:{body:{querySelectorAll:()=>[]},documentElement:{}},MutationObserver:class{observe(){}},DemoSwitch:{open(){}},crypto:{randomUUID:()=> 'test-request'},AliCtiFields:{previewFields:()=>({tel:'13991000001'})},AliCtiDemo:{transcriptionGate:()=>({})}};
adapterCtx.window=adapterCtx;vm.createContext(adapterCtx);vm.runInContext(fs.readFileSync(path.join(root,'js/components/alicti-adapter.js'),'utf8'),adapterCtx);
const a=adapterCtx.AliCtiAdapter;
assert(a.normalizePreviewResult({code:0}).ok);assert(a.normalizePreviewResult({code:'0'}).ok);
for(const code of [10001,20000,20011,20012,20016,20024,20025,20031,20032,20051,20052,20053,20054,20055,20056,20101,20102,20103]){const r=a.normalizePreviewResult({code:-1,errorCode:String(code),msg:'恢复时间：18:30'});assert.equal(r.ok,false);assert(r.message.includes(String(code)));assert(r.message.includes('恢复时间：18:30'));}
assert(a.normalizePreviewResult({code:-1,errorCode:99999,msg:'未知业务错误'}).message.includes('未知业务错误'));
for(const response of [null,{}, {code:false},{code:2}])assert.equal(a.normalizePreviewResult(response).ok,false);
const agent={cno:'001',enterpriseId:'1'};a.session={...agent};a.previewDemoError='20025';assert.equal(a.previewOutcall(agent,'13991000001','',{}).ok,false);assert.equal(a.lastPreviewResponse.errorCode,'20025');assert.equal(a.previewDemoError,'');assert.equal(a.previewOutcall(agent,'13991000001','',{}).ok,true);
console.log('PASS: toolbar direct actions, escaped pause reason, operation guards, unique wrap controls, all 18 documented errors, unknown results, one-shot mock failure/retry.');
