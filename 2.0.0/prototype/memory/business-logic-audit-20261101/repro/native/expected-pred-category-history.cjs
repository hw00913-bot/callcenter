'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root='/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype';
let source=fs.readFileSync(path.join(root,'scripts/check-predictive-task-category.cjs'),'utf8');source=source.slice(0,source.indexOf('const tests=[];'))+'\nthis.fixture=fixture;';
const box={require,__dirname:path.join(root,'scripts'),process:{argv:['node','expected','--built']},console,Buffer,structuredClone};vm.createContext(box);vm.runInContext(source,box);
const cases=[];
for(const [label,replace]of [
 ['unified history failed',f=>{f.b.BusinessFlowStore.taskImportRecords=()=>({status:'failed',message:'历史待核'});} ],
 ['unified history missing data',f=>{f.b.BusinessFlowStore.taskImportRecords=()=>({status:'success',data:null});}],
 ['unified history missing rows',f=>{f.b.BusinessFlowStore.taskImportRecords=()=>({status:'success',data:{taskId:'PRED-ONE'}});}],
 ['unified history malformed rows',f=>{f.b.BusinessFlowStore.taskImportRecords=()=>({status:'success',data:{rows:{}}});}]
]){
 try{const f=box.fixture(),d=f.edit();replace(f);d.values.unifiedCategoryId='lead';const accepted=f.b.submitEdit(d);assert.equal(accepted,false,'未知/无法核定统一名单历史必须拒绝首次分类关联');assert.equal(f.calls.persisted.length,0);cases.push({name:label,status:'pass'});}catch(error){cases.push({name:label,status:'fail',error:error.message});}
}
try{const f=box.fixture(),d=f.edit();d.values.unifiedCategoryId='lead';assert.equal(f.b.submitEdit(d),true);assert.equal(f.calls.persisted.length,1);cases.push({name:'known empty unified history remains bindable',status:'pass'});}catch(error){cases.push({name:'known empty unified history remains bindable',status:'fail',error:error.message});}
const result={schema:'native-category-history-adversarial@1',actualBuilt:true,infrastructureErrors:0,passed:cases.filter(x=>x.status==='pass').length,failed:cases.filter(x=>x.status==='fail').length,cases};fs.writeFileSync('/private/tmp/step50-audit/native/expected-pred-category-history.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));process.exitCode=result.failed?1:0;
