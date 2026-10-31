/* Real persisted template -> current editor -> save regressions. Isolated VM journals only. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),{setup,success,pick,plain}=require('./check-four-node-model.cjs');
const tests=[];
function check(name,run){try{run();tests.push({name,status:'pass'});}catch(e){tests.push({name,status:'fail',error:e.stack});}}
function attach(f){
  const b=f.b;
  b.PlatformUI={escape:x=>String(x??''),closeLayer(){},confirm(){},pageHeader:()=>'',table:()=>'',help:()=>''};
  b.Pages={};b.RouteRuntime={refreshCurrent(){}};b.showToast=()=>{};
  b.document={getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},removeEventListener(){}};
  b.requestAnimationFrame=()=>{};b.cancelAnimationFrame=()=>{};b.setTimeout=fn=>fn();
  let code=pick('/** PAGE-11205');
  code=code.replace('window.FlowConfiguration={','window.FlowConfiguration={__get:()=>editor,__compat:compatibilityIssues,__editable:editableCanvas,__validate:validateEditor,');
  const a=code.indexOf('  function draw() {'),z=code.indexOf('\n  function status(',a);assert(a>=0&&z>a);code=code.slice(0,a)+'  function draw() {}\n'+code.slice(z);
  vm.runInContext(code,b,{filename:'actual-built-flow-editor'});return b.FlowConfiguration;
}
function fixture(kind){
  const f=setup(),category=success(f.s.routingCatalog(f.brand,'lead')),e=(id,from,to,recipient)=>({edgeId:id,fromNodeId:from,toNodeId:to,branch:{kind:'ELSE',priority:1},conditions:{enabled:false,mode:'ALL',rules:[]},...(recipient?{recipient}:{})});
  let nodes,edges,startNodeId;
  if(kind==='END'){nodes=[{nodeId:'END',name:'无需联系',type:'END',endAction:'CLOSE',methods:[],next:[]}];edges=[];startNodeId='END';}
  else if(kind==='TRANSFER'){nodes=[{nodeId:'TRANSFER',name:'合法转交',type:'TRANSFER',methods:[],next:['END']},{nodeId:'END',name:'结束',type:'END',endAction:'CLOSE',methods:[],next:[]}];edges=[e('E-T','TRANSFER','END',{kind:'TENANT',scope:'OTHER'})];startNodeId='TRANSFER';}
  else{nodes=[{nodeId:'CALL',name:'人工办理',type:'PROCESS',recipient:{kind:'TENANT',scope:'CURRENT'},methods:['MANUAL'],next:['END']},{nodeId:'END',name:'结束',type:'END',endAction:'CLOSE',methods:[],next:[]}];edges=[e('E-C','CALL','END')];startNodeId='CALL';}
  const draft={brandId:f.brand,name:'往返-'+kind,routingPolicy:'FIRST_MATCH_V1',categoryRef:category.categoryRef,startNodeId,nodes,edges};
  if(kind==='ENTRY'){nodes.push({nodeId:'NO-CALL',name:'入口免呼叫',type:'END',endAction:'CLOSE',methods:[],next:[]});draft.entryRules=[{entryId:'ENTRY-FIRST',name:'首次免呼叫',toNodeId:'NO-CALL',branch:{kind:'IF',priority:1},conditions:{enabled:true,mode:'ALL',rules:[{ruleId:'R-PURPOSE',source:'CONTEXT',fieldId:'PURPOSE',operator:'EQ',values:['FIRST']}]}},{entryId:'ENTRY-DEFAULT',name:'其他办理',toNodeId:'CALL',branch:{kind:'ELSE',priority:2},conditions:{enabled:false,mode:'ALL',rules:[]}}];}
  const saved=success(f.s.saveTemplate(draft)),row=success(f.s.templates(f.brand)).find(row=>row.templateId===saved.templateId),version=row.versions.find(v=>v.version===saved.version),api=attach(f);
  return {f,api,draft,saved,version};
}
for(const type of ['END','TRANSFER','CALL','ENTRY'])check(type+' template save -> actual editor open -> edit -> save remains supported',()=>{
  const x=fixture(type),{f,api}=x;assert.deepEqual(plain(api.__compat(x.draft)),[],'new editor-shaped draft should be supported');
  api.open('template',x.saved.templateId);const ed=api.__get();assert(ed,'actual saved template opens');assert.deepEqual(plain(ed.compatibilityIssues),[],'persisted canonical nodes must remain supported');ed.stage='canvas';assert.equal(api.__editable(),true);assert.equal(api.__validate(),null,'valid canonical configuration is editable');
  const old=JSON.stringify(x.version);ed.values.name+='-再次保存';api.save();const latest=success(f.s.templates(f.brand)).find(t=>t.templateId===x.saved.templateId);assert.equal(latest.latestVersion,2,'actual editor save persists a new current configuration');assert.equal(JSON.stringify(latest.versions.find(v=>v.version===1)),old,'prior captured template stays byte-identical');
  api.open('template',x.saved.templateId);assert.deepEqual(plain(api.__get().compatibilityIssues),[]);if(type==='ENTRY'){assert.equal(api.__get().values.entryRules[0].conditions.rules[0].values[0],'FIRST');assert.equal(api.__get().values.nodes.find(n=>n.nodeId==='NO-CALL').endAction,'CLOSE');}
});
check('malformed CALL methods stay blocked and original values are retained',()=>{const x=fixture('CALL');for(const value of [undefined,'MANUAL',{}]){const bad=plain(x.version);if(value===undefined)delete bad.nodes[0].methods;else bad.nodes[0].methods=value;const bytes=JSON.stringify(bad);assert(x.api.__compat(bad).length>0);assert.equal(JSON.stringify(bad),bytes);}});
check('invalid CALL method arrays remain semantic save errors without journal writes',()=>{for(const value of [[],['BOGUS'],['MANUAL','AI']]){const x=fixture('CALL');x.api.open('template',x.saved.templateId);const ed=x.api.__get();ed.stage='canvas';ed.values.nodes[0].methods=value;ed.compatibilityIssues=x.api.__compat(ed.values);const before=x.f.b.localStorage.dump();assert(x.api.__validate(),'bad method choice is not a valid current template');x.api.save();assert.equal(x.f.b.localStorage.dump(),before);assert(x.api.__get(),'unsaved invalid draft stays open');}});
check('malformed next and provided malformed non-call methods stay blocked without coercion',()=>{const x=fixture('TRANSFER');for(const change of [n=>n.next='END',n=>n.methods='MANUAL']){const bad=plain(x.version);change(bad.nodes[0]);const bytes=JSON.stringify(bad);assert(x.api.__compat(bad).length>0);assert.equal(JSON.stringify(bad),bytes);}});
check('unknown node and edge extensions remain protected without silent loss',()=>{const x=fixture('CALL');for(const extension of ['node','edge']){const bad=plain(x.version);(extension==='node'?bad.nodes[0]:bad.edges[0]).unrecognizedContract={retained:'must stay'};const bytes=JSON.stringify(bad);assert(x.api.__compat(bad).length>0);assert.equal(JSON.stringify(bad),bytes);}});
check('readonly saved configuration opens without journal migration or writable controls',()=>{const x=fixture('ENTRY'),before=x.f.b.localStorage.dump();x.api.open('template',x.saved.templateId,{readOnly:true});const ed=x.api.__get();assert.equal(ed.readOnly,true);assert.deepEqual(plain(ed.compatibilityIssues),[]);assert.equal(x.api.__editable(),false);x.api.save();assert.equal(x.f.b.localStorage.dump(),before);});
const out={schema:'template-save-reopen-regression@1',date:new Date().toISOString(),scope:'actual current built model and editor open/save functions; isolated storage only',passed:tests.filter(t=>t.status==='pass').length,failed:tests.filter(t=>t.status==='fail').length,tests};const arg=process.argv.indexOf('--output');if(arg>=0)fs.writeFileSync(path.resolve(process.argv[arg+1]),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out,null,2));process.exitCode=out.failed?1:0;
