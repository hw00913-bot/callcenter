/* DEMO ONLY. Fixed official-shaped responses for the shipped showcase tasks.
 * No supplier calls, no statistics fabricated for user-created tasks. */
(function(root){
  'use strict';
  const data=root.CloudCallData,kit=root.DemoFixtureKit;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const samples=new Map(),key=row=>JSON.stringify([row.taskId,row.tenantId,String(row.enterpriseId),String(row.providerTaskId),String(row.providerType)]);
  const cohort=kit?.cohort;
  function rebuild(){
  samples.clear();
  for(const task of data?.tasks||[]){
    if(task.demoPack!=='alicti-showcase-v1'||task.demoCohort!==cohort||!task.taskId?.startsWith('SHOWCASE-')||!Number.isSafeInteger(task.providerTaskId)||task.providerTaskId<=0||![1,2].includes(task.providerType))continue;
    const calls=(data.calls||[]).filter(call=>call.demoPack===task.demoPack&&call.demoCohort===cohort&&call.taskId===task.taskId&&call.tenantId===task.tenantId&&call.enterpriseId===task.enterpriseId);
    const distinct=[...new Map(calls.map(call=>[call.callId,call])).values()];
    const answered=distinct.filter(call=>call.answeredAt&&call.answeredAt!=='—');
    const both=answered.filter(call=>call.agentIdentityId&&task.providerType===1);
    const raw={id:String(task.providerTaskId),enterpriseId:String(task.enterpriseId),task:task.name,taskType:String(task.providerType),
      totalCount:String(task.total),calledCount:String(distinct.length),answerCount:String(answered.length),bridgeCount:String(both.length),
      retryCalledCount:String(distinct.filter(call=>call.attemptNumber>1).length)};
    samples.set(key(task),{result:'0',description:'演示报表样本',data:{start:'0',pageSize:'10',totalCount:'1',totalPageCount:'1',list:[raw]},mock:true,asOf:kit?.at?.(0)||new Date().toLocaleString('sv-SE')});
  }
  }
  rebuild();
  root.AliCtiReportSummaryFixtures=Object.freeze({task:row=>samples.has(key(row))?clone(samples.get(key(row))):null,rebuild,get size(){return samples.size;},
    provenance:'DEMO: fixed showcase responses in official PredictiveStatisticTask shape; not a supplier result.'});
})(window);
