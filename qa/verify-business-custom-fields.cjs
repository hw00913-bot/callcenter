/** Business category -> independent field integration checks. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const base = path.resolve(__dirname, '..');
const scopeA = { enterpriseId: '7522240', tenantId: 'QA-TENANT-A' };
const scopeB = { enterpriseId: '7522240', tenantId: 'QA-TENANT-B' };
const checks = [], failures = [];
const clone = value => JSON.parse(JSON.stringify(value));
const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
const option = (id, label, businessKey = '') => ({ id, label, businessKey });
const field = (id, label, type, options = [], businessKey = '', enabled = true) => ({ id, label, type, options, businessKey, enabled });

function fixture(storage = new Map()) {
  let session = { ...scopeA, accountId:'QA-ADMIN', sessionId:'QA-SESSION', activeDomain:'CLOUD_CONTACT_CENTER', roleCode:'ADMIN' };
  const authorized = row => !!row && row.enterpriseId === session.enterpriseId && row.tenantId === session.tenantId;
  const ctx = {
    console, Date, structuredClone,
    PlatformUI: { escape },
    CloudCallData: {
      tenants: [scopeA,scopeB].map((scope,index) => ({ ...scope,name:'测试租户'+index,status:'启用',organizationScope:'STORE',capabilitySet:['CLOUD_CONTACT_CENTER'] })),
      accounts: [{accountId:'QA-ADMIN',name:'测试管理员',status:'启用'},{accountId:'QA-OPERATOR',name:'测试客服',status:'启用'}],
      calls:[], agents:[]
    },
    AppState: {
      get: () => ({...session}),
      effectiveAccess: () => ({...session,valid:true}),
      isReady: () => true,
      isSuper: () => session.roleCode === 'SUPER_ADMIN',
      account: () => ({accountId:session.accountId,status:'启用'}),
      currentTenant: () => ctx.CloudCallData.tenants.find(authorized),
      authorizeObject: (_,row) => authorized(row),
      scoped: rows => (rows || []).filter(authorized)
    },
    localStorage: {
      getItem: key => storage.get(String(key)) ?? null,
      setItem: (key,value) => storage.set(String(key),String(value)),
      removeItem: key => storage.delete(String(key))
    },
    document: { getElementById:()=>null, querySelector:()=>null },
    addEventListener() {}, showToast() {}, Pages:{}
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const file of ['js/components/customer-business.js','js/components/customer-followup.js','js/components/customer-directory.js']) {
    vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),ctx,{filename:file});
  }
  return {
    ctx,storage,business:ctx.CustomerBusiness,followup:ctx.CustomerFollowup,directory:ctx.CustomerDirectory,
    switchScope(scope,roleCode='ADMIN') { session={...session,...scope,roleCode,accountId:roleCode==='OPERATOR'?'QA-OPERATOR':'QA-ADMIN'}; },
    call(id,businessType='qa_sales',extra={}) {
      const call={...scopeA,callId:id,accountId:session.accountId,callee:'13991000001',direction:'呼出',customerName:'测试客户',businessType,externalDocumentId:'DOC-'+id,endedAt:'2026-09-20T10:30:00',processingStatus:'已完成',...extra};
      ctx.CloudCallData.calls.push(call); return call;
    }
  };
}

function setup() {
  const f=fixture(), b=f.business;
  const fields=[
    field('customerText','客户补充说明','text',[],'customer_note'),
    field('channel','联系渠道','select',[option('phone','电话','001'),option('store','门店','002')],'contact_channel'),
    field('interests','关注内容','multiselect',[option('insurance','续保'),option('service','保养'),option('drive','试驾')]),
    field('amount','预算金额','number'),
    field('appointment','预约日期','date'),
    field('disabledRequired','停用必填信息','text'),
    field('serviceReason','售后问题说明','textarea')
  ];
  for (const row of fields) assert.equal(b.saveField(row,scopeA).ok,true,row.id);
  assert.equal(b.save({id:'qa_sales',label:'销售业务',codeLabel:'销售单号',prefix:'QA',enabled:true,fields:[
    {fieldId:'customerText',enabled:true,required:true},
    {fieldId:'channel',enabled:true,required:true},
    {fieldId:'interests',enabled:true,required:true},
    {fieldId:'amount',enabled:true,required:true},
    {fieldId:'appointment',enabled:true,required:true},
    {fieldId:'disabledRequired',enabled:false,required:true}
  ]},scopeA).ok,true);
  assert.equal(b.save({id:'qa_service',label:'售后业务',codeLabel:'售后单号',prefix:'QA',enabled:true,fields:[
    {fieldId:'customerText',enabled:true,required:false},
    {fieldId:'serviceReason',enabled:true,required:true}
  ]},scopeA).ok,true);
  return f;
}

const validValues = () => ({businessType:'qa_sales',customerText:'客户希望试驾',channel:'phone',interests:['service','drive'],amount:'0',appointment:'2026-10-12'});
const check = (name,fn) => { try { fn(); checks.push(name); } catch (error) { failures.push({name,message:error.stack}); } };

check('预置线索分类保留六项稳定字段及原选项标识',()=>{
  const f=fixture(), ids=f.business.fields('lead',scopeA).map(row=>row.id);
  assert.deepEqual(clone(ids),['leadLevel','intentionLevel','visitIntention','testDriveIntention','plannedVisitAt','plannedStoreName']);
  assert.equal(f.business.getField('visitIntention',scopeA).options[0].id,'有意向');
  assert.equal(f.business.get('lead',scopeA).fields.length,6);
  assert.equal(f.business.get('lead',scopeA).templateId,undefined);
});

check('字段和选项业务主键可空，非空时保留前导零并拒绝重复',()=>{
  const f=setup(), b=f.business, row=b.getField('channel',scopeA);
  assert.equal(row.businessKey,'contact_channel');
  assert.equal(row.options[0].businessKey,'001');
  assert.equal(b.saveField(field('duplicateKey','重复字段编码','text',[],' contact_channel '),scopeA).ok,false);
  assert.equal(b.saveField(field('emptyKey','无编码字段','text'),scopeA).ok,true);
  assert.equal(b.saveField(field('secondEmpty','另一无编码字段','text'),scopeA).ok,true);
  row.options[1].businessKey='001';
  assert.equal(b.saveField(row,scopeA).ok,false);
  assert.equal(b.getField('channel',scopeA).options[1].businessKey,'002');
});

check('分类直接引用独立字段，顺序、显示与必填均由分类决定',()=>{
  const f=setup(), b=f.business;
  assert.equal(b.get('qa_sales',scopeA).templateId,undefined);
  assert.equal(b.catalog(scopeA).templates,undefined);
  assert.equal(b.saveTemplate,undefined);
  assert.deepEqual(clone(b.get('qa_sales',scopeA).fields.map(row=>row.fieldId)),['customerText','channel','interests','amount','appointment','disabledRequired']);
  assert.equal(b.fields('qa_sales',scopeA)[0].id,'customerText');
  assert.equal(b.fields('qa_sales',scopeA)[0].required,true);
  assert.equal(b.fields('qa_service',scopeA)[0].required,false);
  assert.equal(b.fields('qa_sales',scopeA).some(row=>row.id==='disabledRequired'),false);
  assert.equal(b.save({id:'qa_sales_2',label:'另一个销售业务',codeLabel:'另一单号',enabled:true,fields:[{fieldId:'customerText',enabled:true,required:false}]},scopeA).ok,true);
  assert.equal(b.fields('qa_sales_2',scopeA)[0].required,false,'同一字段在另一分类独立配置');
  assert.equal(b.deleteField('customerText',scopeA).ok,false);
  assert.equal(b.saveField({...b.getField('customerText',scopeA),enabled:false},scopeA).ok,false,'分类仍使用的字段不能被全局停用');
  const row=b.get('qa_sales',scopeA);
  row.fields=[row.fields[1],row.fields[0],...row.fields.slice(2)];
  assert.equal(b.save(row,scopeA).ok,true);
  assert.equal(b.fields('qa_sales',scopeA)[0].id,'channel','分类内排序生效');
});

check('分类拒绝不存在或重复字段，线索六字段不能从分类关联中删除',()=>{
  const f=setup(), b=f.business, sale=b.get('qa_sales',scopeA);
  assert.equal(b.save({...sale,fields:[...sale.fields,{fieldId:'notInLibrary',enabled:true,required:false}]},scopeA).ok,false);
  assert.equal(b.save({...sale,fields:[...sale.fields,sale.fields[0]]},scopeA).ok,false);
  const lead=b.get('lead',scopeA);
  assert.equal(b.save({...lead,fields:lead.fields.filter(row=>row.fieldId!=='leadLevel')},scopeA).ok,false);
  assert.equal(b.get('lead',scopeA).fields.length,6);
});

check('原型使用无模板的新配置存储，旧模板配置不被当作新实体读取',()=>{
  const storage=new Map([['customer-business-config-v2',JSON.stringify({version:2,revision:1,scopes:[]})]]), f=fixture(storage);
  assert.equal(f.business.storageKey,'customer-business-config-v3');
  assert.equal(f.business.catalog(scopeA).rows.length,3);
  assert.equal(f.business.catalog(scopeA).templates,undefined);
  assert.equal(storage.get('customer-business-config-v3'),undefined);
});

check('跨租户字段不可引用，客服可读取但不能修改分类配置',()=>{
  const f=setup(), b=f.business;
  assert.equal(b.save({id:'other',label:'越权业务',codeLabel:'单号',fields:[{fieldId:'customerText'}]},scopeB).ok,false);
  f.switchScope(scopeB);
  assert.equal(b.getField('channel',scopeB),null);
  f.switchScope(scopeA,'OPERATOR');
  assert.equal(b.fields('qa_sales',scopeA).length,5);
  assert.equal(b.saveField(field('operatorField','客服字段','text'),scopeA).ok,false);
  assert.equal(b.save({...b.get('qa_sales',scopeA),label:'客服修改'},scopeA).ok,false);
});

check('客服按分类填写，选择项以内部 ID 保存并显示名称',()=>{
  const f=setup(), call=f.call('FORM'), values=validValues();
  assert.equal(f.followup.validate(values,call).ok,true);
  assert.equal(f.followup.validate({...values,channel:'电话'},call).ok,false,'显示名称不是内部值');
  assert.equal(f.followup.validate({...values,interests:['service','unknown']},call).ok,false);
  const html=f.followup.form(values,call,'qa','QA.update');
  assert(html.includes('value="phone"'));
  assert(html.includes('>电话</option>'));
  assert(!html.includes('停用必填信息'));
  const detail=f.followup.detail(values,call);
  assert(detail.includes('电话'));
  assert(detail.includes('保养、试驾'));
  assert(!detail.includes('<dd>phone</dd>'));
});

check('必填由分类控制，草稿允许缺项，最终保存校验并保留合法数字零',()=>{
  const f=setup(), call=f.call('REQUIRED'), values=validValues();
  assert.equal(f.followup.update(values,call,'customerText','').customerText,'');
  assert.equal(f.followup.validate({...values,customerText:''},call).field,'customerText');
  assert.equal(f.followup.validate({...values,amount:'not-a-number'},call).field,'amount');
  assert.equal(f.followup.validate({...values,appointment:'2026-02-30'},call).field,'appointment');
  assert.equal(f.followup.validate(values,call).values.amount,'0');
  const category=f.business.get('qa_sales',scopeA);
  category.fields.find(row=>row.fieldId==='customerText').required=false;
  assert.equal(f.business.save(category,scopeA).ok,true);
  assert.equal(f.followup.validate({...values,customerText:''},call).ok,true);
});

check('导入客户沿用分类标识，字段配置变化不影响批次归档和报表维度',()=>{
  const f=setup(), batch={id:'QA-IMPORT',...scopeA,name:'销售导入批次',createdAt:'2026-09-20T08:00:00',rows:[{id:'QA-ROW',phone:'13991000002',name:'导入客户',businessType:'qa_sales',externalDocumentId:'SALES-002',createdAt:'2026-09-20T08:00:00'}]};
  f.storage.set('customer-task-batches-v1',JSON.stringify([batch]));
  const customer=f.directory.list().find(row=>row.phone==='13991000002');
  assert(customer);
  assert.equal(customer.batches[0].businessType,'qa_sales');
  assert.equal(customer.batches[0].externalDocumentId,'SALES-002');
  assert.equal(f.business.typeLabel({...scopeA,businessType:customer.batches[0].businessType}),'销售业务');
});

check('通话和客户档案按业务及单据归档，明细显示选项名称',()=>{
  const f=setup(), sale=f.call('SALE','qa_sales',{externalDocumentId:'SALE-001'}), service=f.call('SERVICE','qa_service',{externalDocumentId:'SERVICE-001'});
  f.directory.sync();
  assert.equal(f.followup.save(sale,validValues()).ok,true);
  assert.equal(f.followup.save(service,{businessType:'qa_service',serviceReason:'售后检查完成'}).ok,true);
  assert.equal(sale.customerFollowup.channel,'phone');
  assert(f.followup.detail(sale.customerFollowup,sale).includes('电话'));
  const customer=f.directory.list().find(row=>row.phone===sale.callee);
  assert.equal(customer.followup.groups.length,2);
  const html=f.followup.detail(customer.followup);
  assert(html.includes('SALE-001') && html.includes('SERVICE-001'));
  assert(html.includes('客户希望试驾') && html.includes('售后检查完成'));
});

check('业务分类单菜单内可创建字段并直接关联分类，无模板页签及实体',()=>{
  const f=fixture(), ctx=f.ctx;
  let pageHtml='', layerHtml='', refreshes=0;
  Object.assign(ctx.PlatformUI,{
    pageHeader:(title,description)=>`<h1>${title}</h1><p>${description}</p>`,
    toolbar:(left,right)=>left+right,
    table:()=>'<table></table>',
    status:value=>value,
    openLayer:(_id,html)=>{layerHtml=html;},
    closeLayer:()=>{layerHtml='';},
    sortByUpdated:rows=>rows
  });
  ctx.RouteRuntime={refreshCurrent:()=>{refreshes++;pageHtml=ctx.Pages['business-categories'].render();}};
  vm.runInContext(fs.readFileSync(path.join(base,'js/pages/business-categories.js'),'utf8'),ctx,{filename:'js/pages/business-categories.js'});
  const nav=fs.readFileSync(path.join(base,'js/nav.js'),'utf8');
  const menu=nav.slice(0,nav.indexOf('const routes = {}'));
  assert(menu.includes("key: 'business-categories'"));
  assert(!menu.includes("key: 'business-templates'"));
  assert(!menu.includes("key: 'business-fields'"));
  assert(!nav.includes("routes['business-templates']"),'原型无模板路由');
  const entry=fs.readFileSync(path.join(base,'index.html'),'utf8');
  assert(entry.indexOf('js/pages/business-categories.js')<entry.indexOf('js/nav.js'),'统一模块先于路由初始化');
  pageHtml=ctx.Pages['business-categories'].render();
  assert(pageHtml.includes('role="tablist"') && pageHtml.includes('自定义字段'));
  assert(!pageHtml.includes('业务模板'));
  ctx.BusinessConfiguration.selectKind('field');
  assert(pageHtml.includes('新增自定义字段'));
  ctx.BusinessConfiguration.selectKind('category');
  ctx.BusinessConfiguration.open('category');
  assert(layerHtml.includes('＋ 新建字段'));
  assert(!layerHtml.includes('业务模板'));
  ctx.BusinessConfiguration.setBasic('label','试驾预约');
  ctx.BusinessConfiguration.setBasic('codeLabel','预约编号');
  ctx.BusinessConfiguration.openRelated('field');
  ctx.BusinessConfiguration.setBasic('label','预约偏好');
  ctx.BusinessConfiguration.setBasic('type','select');
  ctx.BusinessConfiguration.setBasic('businessKey','preference');
  ctx.BusinessConfiguration.setOption(0,'label','周末');
  ctx.BusinessConfiguration.setOption(0,'businessKey','01');
  ctx.BusinessConfiguration.save();
  assert(layerHtml.includes('试驾预约') && layerHtml.includes('预约编号'));
  assert(layerHtml.includes('预约偏好'));
  ctx.BusinessConfiguration.save();
  assert.equal(layerHtml,'');
  assert(refreshes>=3);
  const data=f.business.catalog(scopeA), category=data.rows.find(row=>row.label==='试驾预约');
  const definition=data.fields.find(row=>row.label==='预约偏好');
  assert(category.fields.some(ref=>ref.fieldId===definition.id));
  assert.equal(definition.businessKey,'preference');
  assert.equal(definition.options[0].businessKey,'01');
  ctx.BusinessConfiguration.open('category');
  ctx.BusinessConfiguration.setBasic('label','未保存草稿');
  ctx.BusinessConfiguration.openRelated('field');
  ctx.BusinessConfiguration.close();
  assert(layerHtml.includes('未保存草稿'),'返回上一步保留分类草稿');
  ctx.BusinessConfiguration.close();
  assert.equal(layerHtml,'','再次关闭回到业务分类列表');
  ctx.BusinessConfiguration.open('category');
  assert.equal(f.business.saveField(field('concurrentField','并发新增字段','text'),scopeA).ok,true);
  ctx.BusinessConfiguration.openRelated('field');
  assert(layerHtml.includes('新增业务分类') && !layerHtml.includes('新增自定义字段'),'父分类版本过期时禁止进入嵌套新增');
  ctx.BusinessConfiguration.close();
});

console.log(JSON.stringify({result:failures.length?'fail':'pass',passed:checks.length,failed:failures.length,checks,failures},null,2));
if (failures.length) process.exitCode=1;
