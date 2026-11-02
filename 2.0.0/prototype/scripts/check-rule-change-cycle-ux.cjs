/* Immediate condition editing and preventive cycle feedback; actual built controller. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const {setup:baseSetup,success,plain,pick}=require('./check-four-node-model.cjs');
const tests=[];let assertions=0;
function equal(a,b,message){assertions++;assert.deepEqual(plain(a),plain(b),message);}
function truth(value,message){assertions++;assert(value,message);}
function check(name,run){const before=assertions;try{run();tests.push({name,status:'pass',assertions:assertions-before});}catch(error){tests.push({name,status:'fail',assertions:assertions-before,error:error.stack||error.message});}}
function setup(){
  const f=baseSetup(),b=f.b,prompts=[],messages=[],elements=new Map();
  const definitions=[
    {id:'TEXT-2',label:'第二文本',usage:'IMPORT',businessKey:'text2',type:'text',options:[],enabled:true},
    {id:'NUMBER',label:'数字字段',usage:'IMPORT',businessKey:'number',type:'number',options:[],enabled:true},
    {id:'SELECT',label:'单选字段',usage:'IMPORT',businessKey:'choice',type:'select',options:[{id:'V1',label:'选项一'},{id:'V2',label:'选项二'}],enabled:true}
  ];
  for(const def of definitions)assert.equal(b.CustomerBusiness.saveField(def,f.scope).ok,true);
  const category=b.CustomerBusiness.get('lead',f.scope);
  assert.equal(b.CustomerBusiness.save({...category,importFields:[...plain(category.importFields),...definitions.map(def=>({fieldId:def.id,enabled:true,required:false}))]},f.scope).ok,true);
  const catalog=success(f.s.routingCatalog(f.brand,'lead'));
  const source={channel:'CLOUD',domainId:'TIANRUN_MANUAL_SIP_CAUSE',scope:'CURRENT_NODE'};
  const node=(nodeId,next)=>({nodeId,name:nodeId,type:'PROCESS',methods:['MANUAL'],recipient:{kind:'TENANT',scope:'CURRENT'},next,conditionSource:plain(source)});
  const end=nodeId=>({nodeId,name:nodeId,type:'END',endAction:'CLOSE',next:[]});
  const condition=ruleId=>({ruleId,source:'IMPORT',fieldId:'STORE-CODE',operator:'EQ',values:['A'],scope:'CURRENT_NODE'});
  const edge=(edgeId,fromNodeId,toNodeId,kind,priority)=>({edgeId,fromNodeId,toNodeId,branch:{kind,priority},conditions:{enabled:kind!=='ELSE',mode:'ALL',rules:kind==='ELSE'?[]:[condition('RULE-'+edgeId)]}});
  const values={name:'即时条件和防环测试',routingPolicy:'FIRST_MATCH_V1',productRulesVersion:2,categoryRef:plain(catalog.categoryRef),routingCatalog:plain(catalog),startNodeId:'A',nodes:[node('A',['B','END-A']),node('B',['C','END-B']),node('C',['END-C']),end('END-A'),end('END-B'),end('END-C')],edges:[edge('AB','A','B','IF',1),edge('A-END','A','END-A','ELSE',2),edge('BC','B','C','IF',1),edge('B-END','B','END-B','ELSE',2),edge('C-END','C','END-C','ELSE',1)],entryRules:[{entryId:'ENTRY',name:'条件入口',toNodeId:'B',branch:{kind:'IF',priority:1},conditions:{enabled:true,mode:'ALL',rules:[condition('ENTRY-RULE')]}},{entryId:'ENTRY-DEFAULT',name:'其他情况',toNodeId:'A',branch:{kind:'ELSE',priority:2},conditions:{enabled:false,mode:'ALL',rules:[]}}]};
  b.PlatformUI={escape:value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),closeLayer(){},confirm:opts=>prompts.push(opts),pageHeader:()=>'',table:()=>'',help:()=>''};
  b.Pages={};b.RouteRuntime={refreshCurrent(){}};b.showToast=message=>messages.push(message);
  b.document={getElementById:id=>elements.get(id)||null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},removeEventListener(){}};
  b.requestAnimationFrame=fn=>fn();b.cancelAnimationFrame=()=>{};b.setTimeout=fn=>fn();
  let code=pick('/** PAGE-11205').replace('window.FlowConfiguration={','window.FlowConfiguration={__set:v=>{editor=v;},__get:()=>editor,__connect:connectCanvasNodes,__rule:conditionRule,__entryRule:fourEntryRuleControl,__node:nodeCard,__validate:validateEditor,__read:readValues,__sync:syncEdges,');
  const start=code.indexOf('  function draw() {'),stop=code.indexOf('\n  function status(',start);assert(start>=0&&stop>start);
  code=code.slice(0,start)+'  function draw() {}\n'+code.slice(stop);vm.runInContext(code,b,{filename:'actual-built-immediate-rule-cycle-editor'});
  const editor={kind:'template',brandId:f.brand,stage:'canvas',readOnly:false,busy:false,pending:false,compatibilityIssues:[],ruleChanges:{},expanded:new Set(),positions:{},zoom:1,usedNodeIds:new Set(values.nodes.map(n=>n.nodeId)),values};
  const api=b.FlowConfiguration;api.__set(editor);
  const row=id=>values.edges.find(edge=>edge.edgeId===id),rule=()=>row('AB').conditions.rules[0],entry=()=>values.entryRules[0].conditions.rules[0];
  return {...f,b,api,editor,values,catalog,prompts,messages,elements,row,rule,entry,change:(key,value)=>api.requestRuleChange('AB',rule().ruleId,key,value)};
}

check('compatible operator changes apply immediately and retain current comparison values',()=>{
  const f=setup(),before=f.b.localStorage.dump();f.change('operator','NOT_IN');equal(f.rule().operator,'NOT_IN');equal(f.rule().values,['A']);equal(Object.keys(f.editor.ruleChanges||{}),[]);equal(f.prompts.length,0);equal(f.b.localStorage.dump(),before,'draft change must not save template');
  const html=f.api.__rule(f.row('AB'),f.rule(),0,f.catalog,false);for(const text of ['待应用变更','应用并保留原值','清空原值后应用','取消变更'])truth(!html.includes(text),text);
});
check('multi-value to scalar clears the incompatible set instead of selecting its first item',()=>{
  const f=setup();f.rule().operator='IN';f.rule().values=['A','B'];f.change('operator','EQ');equal(f.rule().operator,'EQ');equal(f.rule().values,[]);equal(f.prompts.length,0);equal(Object.keys(f.editor.ruleChanges||{}),[]);
});
check('empty predicates clear comparison values without an apply-confirmation state',()=>{
  for(const operator of ['IS_EMPTY','IS_NOT_EMPTY']){const f=setup();f.change('operator',operator);equal(f.rule().operator,operator);equal(f.rule().values,[]);equal(f.prompts.length,0);equal(Object.keys(f.editor.ruleChanges||{}),[]);}
});
check('field and source changes clear prior values even when their scalar types are alike',()=>{
  const f=setup();f.change('fieldId','TEXT-2');equal(f.rule().fieldId,'TEXT-2');equal(f.rule().operator,'EQ');equal(f.rule().values,[]);f.rule().values=['B'];f.change('source','FOLLOWUP');equal(f.rule().source,'FOLLOWUP');equal(f.rule().values,[]);equal(f.prompts.length,0);equal(Object.keys(f.editor.ruleChanges||{}),[]);
});
check('an operator incompatible with a new field type is cleared while valid values do not get retyped',()=>{
  const f=setup();f.rule().fieldId='NUMBER';f.rule().operator='GT';f.rule().values=[12];f.change('fieldId','TEXT-2');equal(f.rule().fieldId,'TEXT-2');equal(f.rule().operator,'');equal(f.rule().values,[]);equal(f.prompts.length,0);
});
check('START rules use the same immediate-edit value contract',()=>{
  const f=setup(),entry=f.values.entryRules[0],rule=f.entry(),change=(key,value)=>f.api.fourChangeEntryRule(entry.entryId,rule.ruleId,key,value);
  change('operator','NOT_IN');equal(rule.operator,'NOT_IN');equal(rule.values,['A']);change('operator','IS_EMPTY');equal(rule.values,[]);rule.operator='EQ';rule.values=['A'];change('source',JSON.stringify(['IMPORT','TEXT-2']));equal(rule.fieldId,'TEXT-2');equal(rule.operator,'EQ');equal(rule.values,[]);rule.values=['B'];change('source',JSON.stringify(['CONTEXT','PURPOSE']));equal(rule.source,'CONTEXT');equal(rule.values,[]);equal(f.prompts.length,0);
});
check('readonly busy and uncertain-save editors cannot mutate ordinary or START rules',()=>{
  for(const mode of ['readOnly','busy','pending']){const f=setup();f.editor[mode]=mode==='pending'?'SAME-REQUEST':true;const before=JSON.stringify(f.values);f.change('operator','NOT_IN');f.api.fourChangeEntryRule('ENTRY','ENTRY-RULE','operator','IS_EMPTY');equal(JSON.stringify(f.values),before,mode);equal(f.prompts.length,0);}
});
check('targets that lead back to the current branch are unavailable in dropdowns',()=>{
  const f=setup(),html=f.api.__node(f.values.nodes.find(n=>n.nodeId==='B'),1,f.values.nodes),options=[...html.matchAll(/<select[^>]*data-four-(?:path|default)-target[^>]*>([\s\S]*?)<\/select>/g)].map(m=>m[1]);truth(options.length>=2);for(const markup of options)truth(!/<option[^>]*value="A"/.test(markup),'A reaches B and must not be offered');
});
check('ordinary ELSE and canvas target actions reject multi-node loops without changing original data',()=>{
  for(const action of [f=>f.api.fourChangeTarget('BC','A'),f=>f.api.fourChangeDefaultTarget('B','A'),f=>f.api.__connect('C','A'),f=>f.api.fourAddPath('C','A')]){const f=setup(),before=JSON.stringify(f.values);action(f);equal(JSON.stringify(f.values),before);const text=JSON.stringify(f.editor.targetIssue||f.editor.status||f.messages);truth(text.length>2,'invalid target has local feedback');truth(!text.includes('历史模板'));}
});
check('self-links are rejected and clearing a target preserves its condition draft',()=>{
  const f=setup(),before=JSON.stringify(f.values);f.api.fourChangeTarget('AB','A');equal(JSON.stringify(f.values),before);f.api.fourChangeTarget('AB','');equal(f.row('AB').toNodeId,'');equal(f.rule().values,['A']);f.api.__read();f.api.__sync();equal(f.row('AB').toNodeId,'');equal(f.rule().values,['A']);
});
check('legal acyclic replacement still works after a rejected cycle',()=>{
  const f=setup();f.api.fourChangeTarget('BC','A');f.api.fourChangeTarget('BC','END-C');equal(f.row('BC').toNodeId,'END-C');truth(!(f.editor.targetIssue&&f.editor.targetIssue.nodeId==='B'),'legal replacement clears stale target issue');
});
check('model and save guard still reject a forged cyclic draft with short targeted feedback',()=>{
  const f=setup();f.row('BC').toNodeId='A';f.values.nodes.find(n=>n.nodeId==='B').next=['A','END-B'];const result=f.b.DFlowRouting.validate(f.values,f.catalog,{forSave:true}),issue=result.issues.find(i=>i.code==='CYCLE');truth(!result.ok&&issue);truth(!issue.message.includes('历史'));truth(issue.edgeId,'back-edge identity is available for focus');const error=f.api.__validate();truth(error);truth(!error.text.includes('历史'));truth(error.key||error.id,'save points to a concrete control');
});

const result={schema:'immediate-rule-cycle-regression@1',date:new Date().toISOString(),scope:'actual built condition/START editor and current routing validator; isolated model journals and deterministic DOM substitutes; no user storage writes',assertions,passed:tests.filter(t=>t.status==='pass').length,failed:tests.filter(t=>t.status==='fail').length,cloudSha256:crypto.createHash('sha256').update(fs.readFileSync(root+'/js/modules/cloud.bundle.js')).digest('hex'),tests};
const at=process.argv.indexOf('--output');if(at>=0)fs.writeFileSync(path.resolve(process.argv[at+1]),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));process.exitCode=result.failed?1:0;
