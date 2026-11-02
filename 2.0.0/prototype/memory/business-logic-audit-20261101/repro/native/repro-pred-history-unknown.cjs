'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root='/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype';
let source=fs.readFileSync(path.join(root,'scripts/check-predictive-task-category.cjs'),'utf8');
source=source.slice(0,source.indexOf('const tests=[];'))+'\nthis.fixture=fixture;';
const box={require,__dirname:path.join(root,'scripts'),process:{argv:['node','repro','--built']},console,Buffer,structuredClone};vm.createContext(box);vm.runInContext(source,box);
const findings=[];
for(const type of ['native history unknown','unified history unknown','both unknown']){
 const f=box.fixture();
 if(type!=='unified history unknown')f.setNativeKnown(false);
 if(type!=='native history unknown')f.b.BusinessFlowStore.taskImportRecords=()=>({status:'failed',message:'统一名单历史读取失败'});
 const d=f.edit();const state=f.b.taskBusinessCategoryState(d),selected=f.b.setTaskBusinessCategory('lead'),saved=f.b.submitEdit(d);
 findings.push({case:type,state:JSON.parse(JSON.stringify(state.history)),selectionAccepted:selected,saveAccepted:saved,persisted:f.calls.persisted,errors:f.calls.errors});
}
const result={actualBuilt:true,expected:'历史读取失败且原任务无分类，不能证明无既有其他分类名单；应保未配置且明确提示待核，禁止任意关联',findings};fs.writeFileSync('/private/tmp/step50-audit/native/pred-history-unknown.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
