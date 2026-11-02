/* Current route presentation must describe the plan used by the actual category. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {setup,success,plain,pick}=require('./check-four-node-model.cjs');
const root=path.resolve(__dirname,'..'),tests=[];
function check(name,run){try{run();tests.push({name,status:'pass'});}catch(error){tests.push({name,status:'fail',error:error.stack});}}
function fixture(){
  const f=setup(),m=f.b.CustomerBusiness,category=m.get('activity',f.scope);
  assert.equal(m.save({...category,label:'实际活动分类',fields:[{fieldId:'FOLLOW-NOTE',enabled:true,required:false}],importFields:[]},f.scope).ok,true);
  const catalog=success(f.s.routingCatalog(f.brand,'lead'));
  const template=success(f.s.saveTemplate({brandId:f.brand,name:'字段参考模板',categoryRef:catalog.categoryRef,startNodeId:'CALL',nodes:[{nodeId:'CALL',name:'人工办理',type:'PROCESS',methods:['MANUAL'],recipient:{kind:'TENANT',scope:'CURRENT'},conditionSource:{channel:'CLOUD',sourceNodeId:'CALL',scope:'CURRENT_NODE'},next:['END','FALLBACK']},{nodeId:'END',name:'结束',type:'END',endAction:'CLOSE',next:[]},{nodeId:'FALLBACK',name:'明确兜底结束',type:'END',endAction:'CLOSE',next:[]}],edges:[{edgeId:'FALLBACK',fromNodeId:'CALL',toNodeId:'FALLBACK',branch:{kind:'ELSE',priority:2},conditions:{enabled:false,mode:'ALL',rules:[]}},{edgeId:'DONE',fromNodeId:'CALL',toNodeId:'END',branch:{kind:'IF',priority:1},conditions:{enabled:true,mode:'ALL',rules:[{ruleId:'NOTE',source:'FOLLOWUP',fieldId:'FOLLOW-NOTE',operator:'EQ',values:['已确认']}]}}]}));
  const field=m.getField('FOLLOW-NOTE',f.scope);
  assert.equal(m.saveField({...plain(field),label:'实际最新跟进内容'},f.scope).ok,true);
  const context=m.routingState('activity',f.scope);
  success(f.s.saveRoute({brandId:f.brand,categoryId:'activity',main:{templateId:template.templateId,version:template.version}},{contextToken:context.context,expectedBaseVersion:context.baseVersion,expectedFieldsVersion:context.fieldsVersion,expectedRouteVersion:context.routeVersion}));
  return {f,template};
}
function attach(f,code=pick('/** PAGE-11205')){
  let html='';const b=f.b;
  b.PlatformUI={escape:value=>String(value??''),openLayer:(_id,content)=>{html=content;},closeLayer(){},confirm(){},pageHeader:()=>'',table:()=>'',help:()=>''};
  b.Pages={};b.RouteRuntime={refreshCurrent(){}};b.showToast=()=>{};
  b.document={getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},removeEventListener(){}};
  b.requestAnimationFrame=()=>{};b.cancelAnimationFrame=()=>{};
  vm.runInContext(code,b,{filename:'actual-current-product-route-ui'});
  return {ui:b.FlowConfiguration,html:()=>html};
}
check('route validation returns the actual-category effective plan without changing reference or stored bindings',()=>{
  const {f,template}=fixture(),before=f.b.localStorage.dump();
  const validated=success(f.s.validateRoute({brandId:f.brand,categoryId:'activity',main:{templateId:template.templateId,version:template.version}}));
  assert.equal(validated.effectivePlan.categoryRef.categoryId,'activity');
  assert.equal(validated.effectivePlan.referenceCategoryRef.categoryId,'lead');
  assert.equal(validated.effectivePlan.routingCatalog.fields.find(field=>field.id==='FOLLOW-NOTE').label,'实际最新跟进内容');
  assert.equal(f.b.localStorage.dump(),before);
});
check('the actual routing dialog uses current target field labels while retaining the distinct reference heading',()=>{
  const {f}=fixture(),x=attach(f),before=f.b.localStorage.dump();
  x.ui.openRoute('activity',f.scope);
  const html=x.html();assert(html.includes('字段参考分类：新线索'));assert(html.includes('实际应用分类：实际活动分类'));
  assert(html.includes('实际最新跟进内容'),'conditions shown in the actual route must use the actual-category catalog');
  assert(!html.includes('填写字段 · 跟进备注'),'do not present a stale authoring reference label as the applied condition');
  assert.equal(f.b.localStorage.dump(),before);
});
const result={schema:'product-chain-presentation-audit@1',date:new Date().toISOString(),scope:'actual built Store and route dialog; isolated current data only',passed:tests.filter(test=>test.status==='pass').length,failed:tests.filter(test=>test.status==='fail').length,tests};
const out=process.argv.indexOf('--output');if(out>=0)fs.writeFileSync(path.resolve(process.argv[out+1]),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));process.exitCode=result.failed?1:0;
