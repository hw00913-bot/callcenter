/* CF-08 supplier-seat generations. Synthetic state and UI only; no supplier requests. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),checks=[],failures=[],clone=value=>JSON.parse(JSON.stringify(value));
function storage(){const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};}
function setup({local=storage(),session=storage()}={}){
  const state={sessionId:'CF08',accountId:'ADMIN',tenantId:'T1',enterpriseId:'7522240',activeDomain:'CLOUD_CONTACT_CENTER',roleCode:'SUPER_ADMIN'},nodes=new Map();let selected=[],confirmation=null;
  const data={agents:[],agentSkills:[],accounts:[{accountId:'ADMIN',status:'启用'}],memberships:[],syncRecords:[],exceptions:[],calls:[{callId:'OLD-CALL',agentIdentityId:'OLD',agentName:'历史坐席'}],instances:[{enterpriseId:'7522240',name:'测试账号'}],tenants:['T1','T2'].map(tenantId=>({tenantId,enterpriseId:tenantId==='T2'?'7522241':'7522240',name:tenantId,status:'启用',capabilitySet:['CLOUD_CONTACT_CENTER']})),physicalSkillGroups:[{physicalGroupId:'G1',enterpriseId:'7522240',tenantId:'T1'}]};
  const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',innerHTML:'',disabled:false});return nodes.get(id);};
  const ctx={console,Date,URL,Map,Set,JSON,Object,Array,Number,structuredClone,crypto,localStorage:local,sessionStorage:session,CloudCallData:data,Pages:{},
    AppState:{get:()=>state,effectiveAccess:()=>({valid:true,roleCode:'SUPER_ADMIN'}),account:()=>({name:'管理员'}),scoped:rows=>rows.filter(row=>row.enterpriseId===state.enterpriseId),canMenu:()=>true,authorizeObject:(_,row)=>row.enterpriseId===state.enterpriseId},
    navigator:{locks:{request:async(_key,_options,fn)=>fn({})}},
    CloudResourceRules:{id:prefix=>prefix+'-'+crypto.randomUUID(),recount(){},changed(){}},CloudCallRuntime:{tenant:id=>data.tenants.find(t=>t.tenantId===id),addAudit(){}},
    PlatformUI:{escape:value=>String(value??''),openLayer(){},closeLayer(){},alert:(_type,_title,text)=>text,table:(columns,rows)=>rows.map(row=>columns.map(column=>column.render?column.render(row[column.key],row):row[column.key]).join('|')).join('\n'),confirm:options=>{confirmation=options;}},
    document:{getElementById:id=>id==='page-content'?null:node(id),querySelectorAll:()=>selected.map(value=>({value}))},RouteRuntime:{refreshCurrent(){}},showToast(){},addEventListener(){},fetch(){throw Error('Unexpected network');}};
  ctx.window=ctx;vm.createContext(ctx);
  for(const file of ['js/components/alicti-fields.js','mock/extensions.js','js/components/alicti-extensions.js','js/components/seat-phone-config.js','js/components/alicti-demo.js','js/pages/agent-center.js','js/components/account-seat.js','js/components/alicti-seat-import.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
  ctx.AliCtiAdapter={};
  ctx.AliCtiExtensionFixtures=clone(ctx.AliCtiExtensionFixtures);ctx.AliCtiExtensionFixtures.rows=[{...ctx.AliCtiExtensionFixtures.rows[0],id:'QA-008001',exten:'008001',tenantId:'T1',bindCno:null}];
  const api=ctx.AliCtiSeatImport,account=ctx.AccountSeat,page=ctx.Pages['agent-center'];
  const active=cno=>data.agents.find(a=>a.cno===cno&&a.lifecycleStatus!=='已删除');
  const single=(cno,extra={},options={})=>account.create({tenantId:'T1',userName:'新坐席',cno,areaCode:'021',...extra},options);
  const remove=agent=>{page.remove(agent.contactCenterIdentityId);assert(confirmation);const action=confirmation;confirmation=null;action.onConfirm();};
  const query=()=>{node('seat-import-tenant').value='T1';api.open('existing');return clone(api.last.response.data.agents.map(row=>row.agent));};
  const sync=async cno=>{query();selected=[cno];await api.submit();return api.last;};
  const batch=async(cno,end=cno)=>{node('seat-import-tenant').value='T1';api.open('batch');for(const [key,value] of Object.entries({name:'本批坐席',cno,endCno:end,areaCode:'021'}))node('seat-import-'+key).value=value;api.preview();await api.submit();return api.last;};
  return {ctx,data,local,session,nodes,node,api,account,page,active,single,remove,query,sync,batch};
}
async function check(name,fn){try{await fn();checks.push(name);}catch(error){failures.push({name,error:error.stack});}}
const good=result=>assert(result.ok,JSON.stringify(result));
module.exports={setup};
if(require.main===module)(async()=>{
 await check('单建删除再建使用新平台身份、新供应商主键和创建时间，旧历史及墓碑保留',async()=>{
   const f=setup();assert(!(await f.single('2201',{softphoneExtension:'008001'})).ok);assert.equal(f.data.agents.length,0);const one=await f.single('2201');good(one);const old=one.agent,oldId=old.demoProviderAgentId,oldTime=old.supplierAgentSnapshot.createTime;good(await f.ctx.SeatPhoneConfig.save(old.contactCenterIdentityId,'008001'));assert.equal(f.ctx.SeatPhoneConfig.assignedValue(old),'008001');
   f.data.agentSkills.push({identityId:old.contactCenterIdentityId,physicalGroupId:'G1',skillLevel:1,status:'已生效'});f.data.calls[0].agentIdentityId=old.contactCenterIdentityId;const history=clone(f.data.calls);
   f.remove(old);assert.equal(old.lifecycleStatus,'已删除');assert.equal(f.query().some(row=>row.cno==='2201'),false);
   const next=await f.single('2201');good(next);assert.notEqual(next.agent.contactCenterIdentityId,old.contactCenterIdentityId);assert.notEqual(next.agent.demoProviderAgentId,oldId);assert.notEqual(next.agent.supplierAgentSnapshot.createTime,oldTime);
   assert.equal(next.agent.softphoneExtension,'');assert.equal(f.ctx.SeatPhoneConfig.assignedValue(next.agent),'');assert.equal(f.ctx.SeatPhoneConfig.extension(next.agent),'');assert.equal(f.ctx.AliCtiExtensions.choices(next.agent).rows.some(row=>row.exten==='008001'),true);assert.equal(f.data.agentSkills.some(row=>row.identityId===next.agent.contactCenterIdentityId),false);assert.deepEqual(clone(f.data.calls),history);assert.equal(f.data.agents.length,2);
 });
 await check('同一成功请求不能在删除后恢复旧坐席，必须新建操作',async()=>{const f=setup(),one=await f.single('2202',{}, {requestId:'SAME-REQUEST'});good(one);f.remove(one.agent);assert(!(await f.single('2202',{}, {requestId:'SAME-REQUEST'})).ok);assert.equal(f.active('2202'),undefined);good(await f.single('2202'));});
 await check('当前坐席工号按企业唯一，不能越权指定其他企业租户，停用仍占用且前导零独立',async()=>{
   const f=setup(),first=await f.single('0012');good(first);assert(!(await f.single('0012',{tenantId:'T2'})).ok);first.agent.lifecycleStatus='已停用';assert(f.account.persistAgent(first.agent));assert(!(await f.single('0012')).ok);good(await f.single('012'));
 });
 await check('删除保存失败不会改变本地状态、技能、供应商候选或历史',async()=>{
   const f=setup(),first=await f.single('2203');good(first);const before=clone(first.agent),calls=clone(f.data.calls);f.data.agentSkills.push({identityId:first.agent.contactCenterIdentityId,physicalGroupId:'G1',skillLevel:1});
   const original=f.local.setItem;f.local.setItem=()=>{throw Error('quota');};f.remove(first.agent);f.local.setItem=original;
   assert.deepEqual(clone(first.agent),before);assert.equal(f.data.agentSkills.length,1);assert.equal(f.query().find(row=>row.cno==='2203').id,before.demoProviderAgentId);assert.deepEqual(clone(f.data.calls),calls);
 });
 await check('单建最终保存失败不写入坐席，重试不误恢复未保存结果',async()=>{
   const f=setup(),original=f.local.setItem;f.local.setItem=(key,value)=>{if(key==='account-seat-v1'&&JSON.parse(value).seats.length)throw Error('quota');original(key,value);};
   assert(!(await f.single('2204')).ok);assert.equal(f.data.agents.length,0);assert.equal(JSON.parse(f.local.getItem('account-seat-v1')).seats.length,0);f.local.setItem=original;good(await f.single('2204'));
 });
 await check('已有供应商示例仅同步一次，删除后不会由固定示例复活',async()=>{
   const f=setup();assert(f.query().some(row=>row.cno==='9100'));await f.sync('9100');const old=f.active('9100');assert(old);assert.equal(old.demoProviderAgentId,970000);await f.sync('9100');assert.equal(f.data.agents.length,1);f.remove(old);assert(!f.query().some(row=>row.cno==='9100'));assert(!f.api.hasCurrentCno('7522240','9100'));
   const reloaded=setup({local:f.local,session:f.session});assert(!reloaded.query().some(row=>row.cno==='9100'));assert.equal(reloaded.data.agents[0].lifecycleStatus,'已删除');
 });
 await check('供应商未同步工号不能单建或跨租户批量重复开通',async()=>{const f=setup();assert(!(await f.single('9100')).ok);assert(!(await f.single('9100',{tenantId:'T2'})).ok);await f.batch('9100');assert.equal(f.data.agents.length,0);assert.match(f.node('seat-import-error').innerHTML,/已存在/);});
 await check('删除已有坐席后批量重建同工号，不继承固定示例旧主键',async()=>{const f=setup();await f.sync('9100');const old=f.active('9100');f.remove(old);await f.batch('9100');const next=f.active('9100');assert(next);assert.notEqual(next.demoProviderAgentId,old.demoProviderAgentId);assert.notEqual(next.supplierAgentSnapshot.createTime,old.supplierAgentSnapshot.createTime);assert.equal(next.softphoneExtension,'');assert.equal(f.api.last.localResult.completed[0],'9100');});
 await check('批量删除再建从当前最新供应商池取值，重载仍只见新主键',async()=>{
   const f=setup();await f.batch('2301','2302');assert.equal(f.api.last.localResult.completed.length,2);const old=f.active('2301'),id=old.demoProviderAgentId;f.remove(old);await f.batch('2301');const next=f.active('2301');assert(next);assert.notEqual(next.demoProviderAgentId,id);assert.equal(f.query().find(row=>row.cno==='2301').id,next.demoProviderAgentId);
   const reloaded=setup({local:f.local,session:f.session});assert.equal(reloaded.query().find(row=>row.cno==='2301').id,next.demoProviderAgentId);assert.equal(reloaded.data.agents.filter(a=>a.cno==='2301'&&a.lifecycleStatus!=='已删除').length,1);
 });
 await check('批量供应商池保存失败不会产生可同步的新坐席或本地记录',async()=>{const f=setup(),original=f.session.setItem;f.session.setItem=(key,value)=>{if(key==='alicti-seat-import-pool-v1')throw Error('quota');original(key,value);};await f.batch('2303');f.session.setItem=original;assert.equal(f.data.agents.length,0);assert(!f.query().some(row=>row.cno==='2303'));});
 await check('批量供应商开通已保存但本地失败，可同步恢复新主键且跳过旧墓碑',async()=>{
   const f=setup();await f.batch('2304');const old=f.active('2304');f.remove(old);const original=f.local.setItem;f.local.setItem=()=>{throw Error('quota');};await f.batch('2304');assert.equal(f.active('2304'),undefined);const remote=f.query().find(row=>row.cno==='2304');assert(remote);assert.notEqual(remote.id,old.demoProviderAgentId);assert.match(f.node('seat-import-result').innerHTML,/选择工号 2304/);
   f.local.setItem=original;await f.sync('2304');const next=f.active('2304');assert(next);assert.equal(next.demoProviderAgentId,remote.id);assert.equal(next.softphoneExtension,'');assert.equal(f.api.last.localResult.completed[0],'2304');
 });
 await check('同步保存失败不会本地新增坐席，恢复存储后仍可同步',async()=>{const f=setup(),original=f.local.setItem;f.local.setItem=()=>{throw Error('quota');};await f.sync('9101');assert.equal(f.data.agents.length,0);f.local.setItem=original;await f.sync('9101');assert(f.active('9101'));});
 await check('会话重置后创建仍不能复用持久化旧供应商主键',async()=>{const f=setup(),one=await f.single('2401');good(one);f.remove(one.agent);const next=setup({local:f.local}),two=await next.single('2401');good(two);assert.notEqual(two.agent.demoProviderAgentId,one.agent.demoProviderAgentId);});
 const result={kind:'synthetic-seat-recreation-checks',decisionId:'D-050',sourceRef:'SRC-080',supplierIntegration:false,passed:checks.length,failed:failures.length,checks,failures};console.log(JSON.stringify(result,null,2));process.exitCode=failures.length?1:0;
})().catch(error=>{console.error(error);process.exitCode=1;});
