/* Regression cases RG-01/RG-02/RG-10. Runs only local mapping functions. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..'),ctx={URL};vm.createContext(ctx);
for(const name of ['alicti-number-status','alicti-retry','alicti-fields','alicti-ivr'])vm.runInContext(fs.readFileSync(path.join(root,'js/components/'+name+'.js'),'utf8'),ctx);
const f=ctx.AliCtiFields,checks=[];
const check=(name,fn)=>{fn();checks.push(name)};
const same=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
check('既有工号12与0012保持String且分别解析',()=>{
 for(const cno of ['12','0012','1'])assert(f.validExistingCno(cno));
 for(const cno of [12,0,'000','',null,' 12 ','A12'])assert(!f.validExistingCno(cno));
 const r=f.seatQueryResult({result:0,data:{total:2,agents:[{agent:{cno:'12'}},{agent:{cno:'0012'}}]}});
 assert.equal(r.pending,false);same(r.rows.map(a=>a.cno),['12','0012']);
 assert(f.seatQueryResult({result:0,data:{total:1,agents:[{agent:{cno:12}}]}}).pending);
});
const group={physicalGroupId:'PG',skillGroupId:'SG',tenantId:'T',enterpriseId:'7522240',providerSkillId:1};
const seat=(cno,id)=>({contactCenterIdentityId:id,cno,tenantId:'T',enterpriseId:'7522240',lifecycleStatus:'已启用'});
const data={instances:[{enterpriseId:'7522240',callerNavigations:[{name:'总部外显',customerClidsGroup:'DEMO-NAV-HQ'}]}],physicalSkillGroups:[group],agents:[seat('12','A'),seat('0012','B')],agentSkills:['A','B'].map(identityId=>({identityId,physicalGroupId:'PG',status:'已生效',skillLevel:1}))};
const draft={type:'预外呼',tenantId:'T',enterpriseId:'7522240',values:{name:'工号回归',skillGroupId:'SG',callStrategy:'4',minAvailableAgentCount:1,retryPolicy:ctx.AliCtiRetry.create('预外呼'),callerMode:'navigation',customerClidsGroup:'DEMO-NAV-HQ'}};
check('预测任务引用两个既有短工号，真正空列表进入错误',()=>{
 const r=f.taskFields(draft,data);assert.equal(r.fields.cnos,'12,0012');assert.equal(r.fields.customerClidsGroup,'DEMO-NAV-HQ');assert.equal(r.errors.length,0);
 const empty=f.taskFields(draft,{...data,agents:[]});assert.equal(empty.fields.cnos,'');assert(empty.errors.length&&empty.pending.length);
 const mixed=f.taskFields(draft,{...data,agents:[seat(12,'A'),seat('0012','B')]});assert(mixed.errors.length);
});
check('既有12可清空或分配技能，失败工号12不被改为0012',()=>{
 const clear=f.skillUpdateFields(data.agents[0],[],data);same(clear.body,[{cno:'12',skillIds:'0'}]);
 const add=f.skillUpdateFields(data.agents[0],[{identityId:'A',physicalGroupId:'PG',skillLevel:10}],data);same(add.body,[{cno:'12',skillIds:'1',skillLevels:'10'}]);
 const failed=f.skillUpdateResult({result:0,data:{failCno:'[12]'}},['12','0012']);assert.equal(failed.pending,false);same(failed.failedCnos,['12']);same(failed.successCnos,['0012']);
});
check('新增3至10位规则继续独立生效',()=>{
 assert(f.seatBatchFields({cno:'12',endCno:'13',name:'新增',areaCode:'021'}).pending.length);
 const valid=f.seatBatchFields({cno:'0012',endCno:'0013',name:'新增',areaCode:'021'});assert.equal(valid.pending.length,0);same(valid.cnos,['0012','0013']);
});
check('区号基础格式拒绝明显非法文本，不捏造长度规则',()=>{
 for(const value of ['021','010',' 021 '])assert(f.validAreaCode(value));
 for(const value of ['abc','02a','+21','',null,21])assert(!f.validAreaCode(value));
 assert(f.seatBatchFields({cno:'801',endCno:'802',name:'新增',areaCode:'abc'}).pending.length);
});
check('导入逐行显式clid拒绝掩码且不继承批次值',()=>{
 const t={providerTaskId:80001,callerNumberId:'NUM-OLD'},rows=[{id:'C',batchId:'B',phone:'13800000000'}],batch={name:'回归',isRepeat:0,clid:'4000001002'};
 const withoutRow=f.importFields(t,rows,batch);assert.equal(withoutRow.pending.length,0);assert(!Object.hasOwn(withoutRow.fields.taskTelList[0],'clid'));
 const valid=f.importFields(t,[{...rows[0],clid:'4000001003'}],batch);assert.equal(valid.pending.length,0);assert.equal(valid.fields.taskTelList[0].clid,'4000001003');
 assert(f.importFields(t,[{...rows[0],clid:'400****801'}],batch).pending.length);
 assert.equal(f.importFields(t,rows,{...batch,clid:''}).pending.length,0);
});
console.log(JSON.stringify({result:'pass',scope:'local field regressions; no supplier requests',count:checks.length,checks},null,2));
