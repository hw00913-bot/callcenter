/** Working-mode selection and switching: one-step login drawer, toolbar switcher, preview gating. No SDK or network. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
let session={presence:'ready',workingMode:'0'},online=true,modeCalls=[],loginCalls=[],layerHtml='',layerClosed=false,nextLoginResult={ok:true,message:'坐席已登录'};
const storedProfile={bindTel:'8001',bindType:3,loginStatus:2,pauseDescription:'旧原因',workingMode:'5'};
const service={current:()=>session,status:()=>({pending:false,inFlight:false}),connectionStatus:()=>({blocked:false}),managementState:()=>({}),monitorQueues:()=>[],
 modeLabels:{'0':'预览与预测同时','4':'预览外呼','5':'预测外呼'},
 profile:()=>({ok:true,profile:{...storedProfile},context:'CTX',revision:1}),
 changeWorkingMode:(agent,input)=>{modeCalls.push(input);return Promise.resolve({ok:true,message:'工作模式已切换：预览外呼'});}};
const ctx={window:null,PlatformUI:{escape:s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),openLayer(id,html){layerHtml=html||'';layerClosed=false;},closeLayer(){layerClosed=true;}},
 AgentWorkbench:{receivingContext:()=>({online,agent:{cno:'0012'}}),refreshTelephone(){},signIn(input){loginCalls.push(input);if(nextLoginResult.ok){online=true;session={presence:String(input.loginStatus)==='2'?'paused':'ready',workingMode:input.workingMode};}return Promise.resolve(nextLoginResult);}},
 AppState:{account:()=>({accountId:'A'}),get:()=>({tenantId:'T',enterpriseId:'E'})},AliCtiSeatOperations:service,showToast(){},
 document:{getElementById:()=>null,querySelectorAll:()=>[]}};
ctx.window=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'js/components/seat-operation-ui.js'),'utf8'),ctx);
const ui=ctx.SeatOperationUI,control=()=>ui.controls({agent:{cno:'0012'},phoneReason:''},{online,compact:true,busy:false}),panel=()=>ui.controls({agent:{cno:'0012'},phoneReason:''},{online,compact:false,busy:false,label:'置闲'});
const disabledPreview=html=>/id="seat-temporary"[^>]* disabled/.test(html);
// Online at mode 0: mode switch sits directly on the toolbar (before the menu), preview enabled.
let html=control();assert(html.includes('class="phone-mode-select" id="seat-working-mode-toolbar"'));assert(html.includes('预览与预测同时'));assert(html.indexOf('id="seat-working-mode-toolbar"')<html.indexOf('<details'));assert(!html.includes('phone-work-mode'));assert(!disabledPreview(html));
assert.equal(Object.entries(service.modeLabels).filter(([value])=>html.includes('value="'+value+'"')).length,3);
// Mode 5: select keeps the value, preview disabled with an explanatory title.
session={presence:'ready',workingMode:'5'};html=control();assert(html.includes('预测外呼模式下不能主动拨号'));assert(disabledPreview(html));assert(html.includes('value="5" selected'));
// Mode 4 keeps preview enabled; predictive offers are gated by the service, not the toolbar.
session={presence:'ready',workingMode:'4'};html=control();assert(!disabledPreview(html));
// Paused status blocks preview independently of the chosen mode, in both toolbar layouts.
session={presence:'paused',workingMode:'4'};html=control();assert(disabledPreview(html));assert(html.includes('请先置闲，再进行预览外呼'));
html=panel();assert(disabledPreview(html));assert(html.includes('请先置闲，再进行预览外呼'));
session={presence:'paused',workingMode:'0'};html=control();assert(disabledPreview(html));
session={presence:'ready',workingMode:'0'};html=control();assert(!disabledPreview(html));
// A live call, unfinished wrap-up or an in-flight phone operation locks the switcher visibly.
session={presence:'wrapup',workingMode:'4'};html=control();assert(/id="seat-working-mode-toolbar"[^>]* disabled/.test(html));
session={presence:'ready',workingMode:'4',resumeRequired:true};html=control();assert(/id="seat-working-mode-toolbar"[^>]* disabled/.test(html));
// Offline: no switcher, sign-in button opens the login drawer.
session=null;online=false;html=control();assert(!html.includes('seat-working-mode'));assert(html.includes('id="seat-workspace-online"'));
assert(html.includes('AgentWorkbench.signIn()'));
// Non-compact panel shows the select online and a single sign-in entry offline.
online=true;session={presence:'ready',workingMode:'4'};html=panel();assert(html.includes('id="seat-working-mode-panel"'));assert(!html.includes('id="seat-phone-settings"'));
online=false;session=null;html=panel();assert(!html.includes('seat-working-mode'));assert(!html.includes('id="seat-phone-settings"'));assert(html.includes('id="seat-workspace-online"'));
// Summary line names the current mode online only.
online=true;session={presence:'ready',workingMode:'4'};assert(ui.summary({agent:{cno:'0012'}}).includes('工作模式：预览外呼'));
session=null;assert(!ui.summary({agent:{cno:'0012'}}).includes('工作模式：'));
// Every login asks for status and mode. A previously stored mode/status cannot silently preselect the new login.
online=false;session=null;
assert(ui.open('login'));assert(layerHtml.includes('请选择工作模式'));assert(layerHtml.includes('登录状态'));assert(layerHtml.includes('置闲'));assert(!layerHtml.includes('旧原因'));
assert(/id="seat-operation-workingMode"[^>]*>[\s\S]*?<option value="" selected/.test(layerHtml));
(async()=>{
const blocked=await ui.submit();assert(!blocked.ok);assert.equal(loginCalls.length,0);assert(!layerClosed);
ui.set('workingMode','4');
const submitted=await ui.submit();
assert(submitted.ok);assert.equal(loginCalls.length,1);assert.equal(loginCalls[0].workingMode,'4');assert.equal(Number(loginCalls[0].loginStatus),1);assert.equal(loginCalls[0].pauseDescription,'');assert(layerClosed);
// A busy login submits its optional description with the selected mode in the same operation.
online=false;session=null;assert(ui.open('login'));
assert(/id="seat-operation-workingMode"[^>]*>[\s\S]*?<option value="" selected/.test(layerHtml),'A subsequent login must require a fresh mode choice');
ui.set('loginStatus','2');ui.set('pauseDescription','处理客户资料');ui.set('workingMode','5');
assert(layerHtml.includes('id="seat-operation-pauseDescription"'));
const busyLogin=await ui.submit();assert(busyLogin.ok);assert.equal(loginCalls.length,2);assert.equal(Number(loginCalls[1].loginStatus),2);assert.equal(loginCalls[1].pauseDescription,'处理客户资料');assert.equal(loginCalls[1].workingMode,'5');
// A failed login preserves the chosen values and permits a retry without another settings step.
online=false;session=null;nextLoginResult={ok:false,message:'登录失败'};assert(ui.open('login'));ui.set('workingMode','0');
const failed=await ui.submit();assert(!failed.ok);assert.equal(loginCalls.length,3);assert(!layerClosed);assert(layerHtml.includes('登录失败'));
nextLoginResult={ok:true,message:'坐席已登录'};assert((await ui.submit()).ok);assert.equal(loginCalls.length,4);assert.equal(loginCalls[3].workingMode,'0');
// Online switch goes straight through the service; unknown values never reach it.
online=true;session={presence:'ready',workingMode:'0'};
const switched=await ui.changeMode('4');assert(switched.ok);assert.equal(modeCalls.length,1);assert.equal(modeCalls[0].workingMode,'4');
assert(!(await ui.changeMode('9')).ok);assert.equal(modeCalls.length,1);
assert(!(await ui.changeMode('constructor')).ok);assert.equal(modeCalls.length,1);
console.log('PASS: one-step login requires explicit mode, defaults idle, supports busy status and retry; online toolbar mode and preview gating.');
})().catch(error=>{console.error(error);process.exitCode=1;});
