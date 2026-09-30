'use strict';
const assert=require('assert/strict');
const {setup}=require('./verify-seat-recreation.cjs');
const checks=[];
function fixture(selected=[],outcome=true){
 const f=setup(),opened=[],messages=[];let saved=null;
 Object.assign(f.data.physicalSkillGroups[0],{name:'售后服务',status:'已启用'});
 f.data.physicalSkillGroups.push({physicalGroupId:'G2',name:'异租户技能',status:'已启用',tenantId:'T2',enterpriseId:'7522240'});
 f.ctx.PlatformUI.openLayer=(id,html)=>opened.push({id,html});
 f.ctx.showToast=(message)=>messages.push(message);
 f.ctx.PlatformUI.empty=x=>x;
 f.ctx.document.querySelectorAll=selector=>selector==='input[name="newAgentSkill"]:checked'?selected.map(r=>({value:r.id})):selector==='[data-new-skill-level]'?selected.map(r=>({dataset:{newSkillLevel:r.id},value:r.level})):[];
 f.ctx.AliCtiDemo.saveSkills=(agent,rows)=>{saved={agent,rows};return outcome;};
 f.node('newAgentTenant').value='T1';f.page.openSingle();
 for(const [id,value] of Object.entries({newAgentName:'测试坐席',newAgentCno:'00987',newAgentAreaCode:'021'}))f.node(id).value=value;
 return {...f,opened,messages,saved:()=>saved};
}
(async()=>{
 let f=fixture();assert(f.node('newAgentSkills').innerHTML.includes('售后服务'));assert(!f.node('newAgentSkills').innerHTML.includes('异租户技能'));
 await f.page.createSingle();assert.equal(f.data.agents.length,1);assert.equal(f.saved(),null);assert.equal(f.opened.length,1);assert(f.messages.some(x=>x.includes('稍后')));checks.push('不选技能可创建，保存后不自动打开配置页面');
 f=fixture([{id:'G1',level:'3'}]);await f.page.createSingle();assert.equal(f.data.agents.length,1);assert.equal(f.saved().rows[0].skillLevel,3);assert.equal(f.saved().rows[0].identityId,f.data.agents[0].contactCenterIdentityId);checks.push('选填技能保存到新坐席，保留独立等级');
 f=fixture([{id:'G2',level:'1'}]);await f.page.createSingle();assert.equal(f.data.agents.length,0);checks.push('跨租户技能在创建前拒绝');
 f=fixture([{id:'G1',level:'11'}]);await f.page.createSingle();assert.equal(f.data.agents.length,0);checks.push('非法等级在创建前拒绝');
 f=fixture([{id:'G1',level:'2'}],false);await f.page.createSingle();assert.equal(f.data.agents.length,1);assert(f.messages.some(x=>/坐席已新增，但技能(?:组)?分配未完成/.test(x)));assert.equal(f.opened.length,1);checks.push('分配失败保留已创建坐席并提示之后配置');
 f.page.openSkillAssign(f.data.agents[0].contactCenterIdentityId);assert(f.opened.at(-1).html.includes('id="assignAgent" disabled'));assert(/配置技能(?:组)?/.test(f.opened.at(-1).html));assert.equal(f.page.captureNavigationState().skillAssignIdentityId,f.data.agents[0].contactCenterIdentityId);checks.push('从指定坐席配置时固定身份，不重复选择坐席');
 console.log(JSON.stringify({passed:checks.length,failed:0,checks},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
