/** Independent model checks; no browser, storage writes or supplier requests. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.resolve(__dirname, '..');
const checks = [];
function check(name, fn) { fn(); checks.push(name); }
const enterpriseId = '7522240';
let visible = ['HQ', 'A', 'B'], allowed = true;
const context = {
  console, Date, Map, Set, structuredClone,
  PlatformUI: { callTypeLabel: v => v },
  AppState: { get: () => ({ accountId: 'USER', tenantId: 'HQ', enterpriseId, activeDomain: 'CLOUD_CONTACT_CENTER' }),
    effectiveAccess: () => ({ valid: allowed, tenantIds: visible, roleCode: 'ADMIN' }), canMenu: () => allowed,
    scoped: rows => rows.filter(row => visible.includes(row.tenantId)) },
  CallState: { view: call => ({ known: call.result === '接通' || call.result === '未接通', ended: !!call.endedAt,
    answered: call.result === '接通' ? true : call.result === '未接通' ? false : null,
    agentAnswered: call.result === '接通' ? true : null, answerLabel: call.result || '待确认',
    customerEstablishedAt: call.answeredAt, agentEstablishedAt: call.agentAnsweredAt, endedAt: call.endedAt }) }
};
context.window = context;
vm.createContext(context);
for (const file of ['mock/customer-followup.js','js/components/alicti-fields.js','js/components/alicti-report-facts.js','js/components/report-metrics.js','js/components/lead-report.js']) {
  vm.runInContext(fs.readFileSync(path.join(base, file), 'utf8'), context, { filename: file });
}
const tenants = ['HQ','A','B','HIDDEN'].map(id => ({ tenantId:id,enterpriseId,name:id+'门店',organizationScope:id==='HQ'?'HEADQUARTERS':'STORE',brandId:id==='B'?'BRAND-B':'BRAND-A' }));
const item = (id, externalDocumentId, extra={}) => ({ id,name:'客户'+id,phone:'13800000001',externalDocumentId,businessType:'lead',followup:'待联系',calls:[],...extra });
const batch = (id,tenantId,createdAt,rows,extra={}) => ({ id,name:'批次'+id,tenantId,enterpriseId,createdAt,rows,...extra });
const batches = [
  batch('B1','HQ','2026-09-01',[item('L1','0012',{ownerId:'ACC1',followup:'已完成',updatedAt:'2026-09-02'})]),
  batch('B2','A','2026-09-10',[item('L2','0012',{taskId:'TASK1',followup:'待继续跟进',updatedAt:'2026-09-10'})]),
  batch('B3','HQ','2026-09-05',[item('L3','12'),item('M1',''),item('M2',12),item('J','JOURNAL',{calls:[{callId:'J1',at:'2026-09-09',result:'未接通',disposition:'再次联系'}]})]),
  batch('B4','B','2026-09-06',[item('L4','0012')]),
  batch('BH','HIDDEN','2026-08-01',[item('H1','0012',{phone:'13999999999'})]),
  batch('OTHER','HQ','2026-09-04',[item('O1','0012')],{enterpriseId:'8888888'}),
  batch('AFTER','HQ','2026-09-04',[item('AS1','0012',{businessType:'aftersales'})])
];
function call(id, code, tenantId='HQ', extra={}) {
  return { callId:id,enterpriseId,tenantId,businessType:'lead',externalDocumentId:code,callType:'人工外呼',direction:'呼出',
    caller:'02100000001',callee:'13800000001',ringingAt:'2026-09-02T10:00:00',answeredAt:'2026-09-02T10:00:03',agentAnsweredAt:'2026-09-02T10:00:02',endedAt:'2026-09-02T10:00:10',
    durationSeconds:999,result:'接通',...extra };
}
function official(call, main, extra={}) {
  return {...call,alictiCdr:{kind:call.callType==='呼入'?'inbound':call.callType==='人工外呼'?'manual':'predictive',raw:{enterpriseId:Number(enterpriseId),mainUniqueId:main,cno:'12',status:3,
    startTime:1788314400,upTime:1788314402,bridgeTime:1788314403,endTime:1788314415,bridgeDuration:12,...extra}}};
}
const calls = [
  official(call('C1','0012','HQ',{customerTaskItemId:'L1',customerTaskBatchId:'B1',agentDisposition:'较早通话后更新',customerFollowup:{leadLevel:'A级',intentionLevel:'低意向',updatedAt:'2026-09-12T00:00:00Z'}}),'P1'),
  official(call('C2','0012','A',{customerTaskItemId:'L2',customerTaskBatchId:'B2',ringingAt:'2026-09-10T10:00:00',agentDisposition:'最新通话结果',customerFollowup:{leadLevel:'B级',intentionLevel:'中意向',visitIntention:'有意向',testDriveIntention:'暂不确定',plannedVisitAt:'2026-09-20T10:00',plannedStoreId:'A',plannedStoreName:'A门店',updatedAt:'2026-09-11T00:00:00Z'}}),'P2',{startTime:1789005600,endTime:1789005615}),
  call('C3','12','HQ',{customerTaskItemId:'L3',customerTaskBatchId:'B3',customerFollowup:{intentionLevel:'高意向',updatedAt:'2026-09-15T00:00:00Z'}}),
  call('C4','0012','B',{brandId:'BRAND-B',customerTaskItemId:'L4'}),
  call('CF','12','HQ',{customerTaskItemId:'L1'}),
  call('PHONE','','HQ'),
  official(call('ACCOUNT','0012'), 'P-ACCOUNT',{enterpriseId:8888888}),
  official(call('IDENTITY','0012','HQ',{providerMainUniqueId:'EXPECTED'}),'DIFFERENT'),
  call('HIDDEN','0012','HIDDEN',{customerTaskItemId:'H1',customerFollowup:{intentionLevel:'无意向',updatedAt:'2026-09-30'}}),
  call('OUT-ACCOUNT','0012','HQ',{enterpriseId:'8888888'}),
  call('AFTER-CALL','0012','HQ',{businessType:'aftersales'})
];
calls.push({...structuredClone(calls[0]),callId:'C1-DUP'});
context.CloudCallData = { tenants, instances:[{enterpriseId,brandId:'BRAND-A'}],calls,
  tasks:[{taskId:'TASK1',tenantId:'A',enterpriseId,name:'联系任务',callType:'预外呼',total:5,completed:2,createdAt:'2026-09-05'}],
  agents:[{agentRecordId:'AG1',contactCenterIdentityId:'I1',tenantId:'HQ',enterpriseId,cno:'12',userName:'短工号坐席',accountId:'ACC1'},
    {agentRecordId:'AG2',contactCenterIdentityId:'I2',tenantId:'A',enterpriseId,cno:'0012',userName:'前零工号坐席'}],
  physicalSkillGroups:[{physicalGroupId:'G1',skillGroupId:'SK1',tenantId:'HQ',enterpriseId,name:'首队列服务',providerQueueNo:'0012'}],agentSkills:[],callPlans:[] };
context.CustomerTasks = { reportSnapshot: () => structuredClone(batches) };
context.CustomerFollowup = { overlay() {} };
vm.runInContext(fs.readFileSync(path.join(base,'js/components/report-data.js'),'utf8'),context,{filename:'report-data.js'});
const filters = {period:'自定义',startDate:'2026-09-01',endDate:'2026-09-30'};
const get = extra => context.CloudReportData.getModel('leads',{...filters,...extra});
const lead = (m,code,brand='BRAND-A') => m.rows.find(r=>r.code===code&&r.brandId===brand);
let model = get();
check('跨批次及可见租户同编码合并，缺码各自独立',()=>assert.equal(model.rows.length,6));
check('0012与12保持两条原始字符串线索',()=>assert.ok(lead(model,'0012')&&lead(model,'12')));
check('同编码跨品牌隔离',()=>assert.notEqual(lead(model,'0012').key,lead(model,'0012','BRAND-B').key));
check('同手机号不同编码不合并',()=>assert.deepEqual([...lead(model,'12').phones],[...lead(model,'0012').phones]));
check('缺编码与数字型编码均待补，不聚合',()=>assert.equal(model.rows.filter(r=>r.codeStatus==='待补编号').length,2));
check('同一官方mainUniqueId只计一次',()=>assert.equal(lead(model,'0012').callCount,2));
check('不同线索不会继承同手机号档案业务字段',()=>assert.equal(lead(model,'0012').intentionLevel,'低意向'));
check('业务字段取同线索通话updatedAt而非通话发生顺序',()=>assert.equal(lead(model,'0012').leadLevel,'A级'));
check('各次通话已填业务信息按字段累计',()=>assert.equal(lead(model,'0012').plannedStoreId,'A'));
check('业务字段补录不改变最近通话处理结果',()=>assert.equal(lead(model,'0012').latestDisposition,'最新通话结果'));
check('最新明确跟进状态覆盖旧批次状态',()=>assert.equal(lead(model,'0012').followupStatus,'待继续跟进'));
check('意向统计不把低意向或无意向擅自升级为有效意向',()=>assert.equal(model.summary.intentionRecorded,2));
check('意向分布按既有选项计数',()=>assert.equal(model.summary.intentionDistribution.find(d=>d.value==='低意向').count,1));
check('任务和批次详情保留id/name关联',()=>{assert.equal(lead(model,'0012').batches.length,2);assert.equal(lead(model,'0012').tasks[0].name,'联系任务');});
check('平台唯一通话日志可计为已联系且不按手机号推断',()=>assert.equal(lead(model,'JOURNAL').callCount,1));
check('通话编码与明确名单矛盾进入未关联',()=>assert.ok(model.associationIssues.some(i=>i.callId==='CF')));
check('只有手机号没有线索编码的通话不倒推',()=>assert.ok(model.associationIssues.some(i=>i.callId==='PHONE')));
check('供应商账号错配不能计入线索联系',()=>assert.ok(model.associationIssues.some(i=>i.callId==='ACCOUNT')));
check('供应商通话唯一ID错配不能计入线索联系',()=>assert.ok(model.associationIssues.some(i=>i.callId==='IDENTITY')));
check('跨账号/不可见租户/售后线索不泄入',()=>assert.ok(!JSON.stringify(model).includes('13999999999')&&!model.rows.some(r=>r.items.some(i=>['O1','AS1'].includes(i.id)))));
check('同线索首次可见导入日为cohort基准',()=>assert.equal(lead(model,'0012').firstImportedAt,Date.parse('2026-09-01')));
check('重复导入不会使旧线索进入新周期',()=>assert.ok(!lead(get({startDate:'2026-09-10'}),'0012')));
check('按最早导入日入选后保留截止当前的后续联系',()=>assert.equal(lead(get({endDate:'2026-09-01'}),'0012').callCount,2));
check('意向等级筛选在合并及最新字段聚合后应用',()=>assert.equal(get({intentionLevel:'低意向'}).rows.length,1));
check('到店/试驾/计划门店筛选可组合',()=>assert.equal(get({visitIntention:'有意向',testDriveIntention:'暂不确定',plannedStoreId:'A'}).rows.length,1));
check('非法业务等级筛选返回错误',()=>assert.ok(get({leadLevel:'不存在'}).error));
check('跨权限门店筛选返回错误',()=>assert.ok(get({plannedStoreId:'HIDDEN'}).error));
check('KPI与布尔下钻严格一致',()=>context.CloudLeadReport.flags.forEach(key=>assert.equal(model.summary[key],model.rows.filter(r=>r[key]).length)));
check('单门店筛选先缩小可见贡献再合并',()=>{const row=lead(get({tenantId:'A'}),'0012');assert.deepEqual([...row.tenantNames],['A门店']);assert.equal(row.firstImportedAt,Date.parse('2026-09-10'));});
visible=['A'];model=get();
check('切换权限后不读取其他门店线索及业务字段',()=>{assert.equal(model.rows.length,1);assert.equal(model.rows[0].intentionLevel,'中意向');assert.equal(model.rows[0].callCount,1);});
visible=['HQ','A','B'];allowed=false;
check('无报表权限时无数据返回',()=>{const denied=get();assert.ok(denied.error);assert.equal(denied.rows.length,0);});allowed=true;
const snapshots=JSON.stringify({calls:context.CloudCallData.calls,batches});get();
check('模型构建不写入原通话或批次',()=>assert.equal(JSON.stringify({calls:context.CloudCallData.calls,batches}),snapshots));
const conflictA=official(call('DUP-A','0012'),'DUP-CROSS'),conflictB=official(call('DUP-B','12'),'DUP-CROSS');
context.CloudCallData.calls.push(conflictA,conflictB);model=get();
check('同一官方通话关联不同线索双方均排除',()=>{assert.equal(lead(model,'0012').callCount,2);assert.equal(lead(model,'12').callCount,1);assert.ok(model.associationIssues.some(i=>i.callId==='DUP-A'));});
context.CloudCallData.calls.splice(-2);
const noPhoneBatch=batch('NOPHONE','HQ','2026-09-02',[item('N','NO-PHONE',{phone:''})]);batches.push(noPhoneBatch);
check('完整线索编码无需手机号也可独立统计',()=>assert.ok(lead(get(),'NO-PHONE')));batches.pop();
const long='X'.repeat(100);batches.push(batch('LONG','HQ','2026-09-02',[item('LONG',long)]));
check('完整编码不截断',()=>assert.equal(lead(get(),long).code.length,100));batches.pop();
context.CloudCallData.calls.push(call('INVALID-LINK','0012','HQ',{customerTaskItemId:'NOT-VISIBLE'}));
check('已失效明确名单关联不以同编码绕过',()=>assert.ok(get().associationIssues.some(i=>i.callId==='INVALID-LINK')));context.CloudCallData.calls.pop();
// Existing report models use supplier identities and durations, not local-looking fallbacks.
let agents=context.CloudReportData.getModel('agents',filters);
check('官方字符串cno=12关联正确且同主通话去重',()=>assert.equal(agents.rows.find(r=>r.id==='AG1').total,1));
const inbound=official(call('INBOUND','0012','HQ',{callType:'呼入',agentIdentityId:'I2',skillGroupId:'WRONG',result:'排队超时'}),'P-IN',{status:'系统应答',statusResult:'队列中溢出',firstCallCno:'12',firstCallQno:'0012',firstQueueDuration:9,firstJoinQueueTime:1788314401,firstLeaveQueueTime:1788314410,bridgeDuration:0});
context.CloudCallData.calls.push(inbound);
let inboundModel=context.CloudReportData.getModel('inbound',filters);
check('呼入首队列时长直接采用官方值',()=>assert.equal(inboundModel.summary.queueAverage,9));
check('官方队列溢出独立统计不冒称排队超时',()=>{assert.equal(inboundModel.summary.queueOverflow,1);assert.equal(inboundModel.summary.queueAbandoned,0);assert.equal(inboundModel.rows[0].queueResult,'队列中溢出');});
let skills=context.CloudReportData.getModel('skills',filters);
check('呼入首呼队列不冒充整通人工承接队列',()=>assert.equal(skills.rows.find(r=>r.id==='G1').total,0));
const original=inbound.alictiCdr.raw.firstCallQno;inbound.alictiCdr.raw.firstCallQno='UNKNOWN';skills=context.CloudReportData.getModel('skills',filters);
check('官方队列无法映射保留未关联',()=>assert.ok(skills.excludedUnassociatedCalls.some(c=>c.callId==='INBOUND')));inbound.alictiCdr.raw.firstCallQno=original;
context.CloudCallData.calls.push(official(call('PRED-QUEUE','0012','HQ',{callType:'预外呼',skillGroupId:'WRONG'}),'P-PRED',{status:43,qno:'0012'}));
skills=context.CloudReportData.getModel('skills',filters);
check('预测话单qno按明确providerQueueNo映射',()=>assert.equal(skills.rows.find(r=>r.id==='G1').total,1));
const tasks=context.CloudReportData.getModel('outbound',filters);
check('任务累计量明确平台口径且值保持',()=>{assert.equal(tasks.rows[0].cumulativeBasis,'platform-task-progress');assert.equal(tasks.rows[0].finishRate,'40.0%');});
context.AliCtiReportSummary = { task: () => ({available:true,totalCount:5,calledCount:8,answerCount:4,bridgeCount:3,retryCalledCount:3}) };
const supplierTask=context.CloudReportData.getModel('outbound',filters).rows[0];
check('官方累计呼叫含重呼，不覆盖平台完成名单',()=>{assert.equal(supplierTask.supplierCalled,8);assert.equal(supplierTask.completed,2);assert.equal(supplierTask.finishRate,'40.0%');});
check('官方累计号码和重呼使用独立指标',()=>{assert.equal(supplierTask.supplierTotal,5);assert.equal(supplierTask.supplierRetry,3);assert.equal(supplierTask.supplierBridged,3);});
context.AliCtiReportSummary = { task: () => ({available:false,issue:'任务身份不一致'}) };
check('官方累计身份未核对时不拿本地数字冒充',()=>{const row=context.CloudReportData.getModel('outbound',filters).rows[0];assert.equal(row.supplierTotal,null);assert.equal(row.supplierSummaryIssue,'任务身份不一致');});
vm.runInContext(fs.readFileSync(path.join(base,'js/components/alicti-report-summary.js'),'utf8'),context,{filename:'alicti-report-summary.js'});
context.CloudCallData.tasks[0].providerTaskId=321;
const officialSummary={result:0,data:{totalCount:1,pageSize:10,start:0,list:[{enterpriseId:7522240,id:'321',taskType:'1',totalCount:'5',calledCount:'8',answerCount:'4',bridgeCount:'3',retryCalledCount:'3'}]}};
context.AliCtiReportSummaryFixtures={task:()=>structuredClone(officialSummary)};
check('真实官方累计适配器与报表模型联测',()=>{const row=context.CloudReportData.getModel('outbound',filters).rows[0];assert.equal(row.supplierSummaryAvailable,true);assert.equal(row.supplierCalled,8);assert.equal(row.completed,2);});
officialSummary.data.list[0].enterpriseId=8888888;
check('真实官方累计适配拒绝跨账号响应',()=>{const row=context.CloudReportData.getModel('outbound',filters).rows[0];assert.equal(row.supplierSummaryAvailable,false);assert.equal(row.supplierCalled,null);});
officialSummary.data.list[0].enterpriseId=7522240;officialSummary.data.list[0].id='999';
check('真实官方累计适配拒绝串任务',()=>assert.equal(context.CloudReportData.getModel('outbound',filters).rows[0].supplierSummaryAvailable,false));
batches.push(batch('RAW-CODES','HQ','2026-09-02',[item('SPACE-1',' A'),item('SPACE-2','A'),item('SPACE-3','A '),item('SPACE-4','   ')]));
const rawCodes=get();
check('线索编码完整原值保留，前后空白不做身份归一',()=>{assert.ok(lead(rawCodes,' A'));assert.ok(lead(rawCodes,'A'));assert.ok(lead(rawCodes,'A '));assert.notEqual(lead(rawCodes,' A').key,lead(rawCodes,'A').key);});
check('仅空白的线索编码按待补处理',()=>assert.equal(rawCodes.rows.find(r=>r.items.some(i=>i.id==='SPACE-4')).codeStatus,'待补编号'));
batches.pop();
batches.push(batch('SOURCE-ONLY','HQ','2026-09-02',[item('SOURCE-ITEM','SOURCE-CODE')]));
context.CloudCallData.calls.push(call('STORE-CODE-ONLY','SOURCE-CODE','A',{taskId:'TASK1',brandId:'BRAND-A',contactCenterIdentityId:'I2'}));
const sourceOnly=lead(get(),'SOURCE-CODE');
check('仅凭明确编码关联的通话组织纳入线索来源',()=>assert.deepEqual([...sourceOnly.tenantIds].sort(),['A','HQ']));
check('编码关联通话的任务保留完整组织账号scope供详情打开',()=>{assert.equal(sourceOnly.tasks[0].name,'联系任务');assert.equal(sourceOnly.tasks[0].tenantId,'A');assert.equal(sourceOnly.tasks[0].enterpriseId,enterpriseId);});
const completeLead=lead(get(),'0012');
const leadSignature=r=>JSON.stringify({calls:r.calls.map(c=>c.callId).sort(),values:[r.leadLevel,r.intentionLevel,r.plannedStoreId],batches:r.batches.map(b=>b.id).sort()});
for(const [name,filter] of [['批次',{batchId:'B1'}],['任务',{taskId:'TASK1'}],['坐席',{agentId:'AG1'}]])check(name+'筛选保留整条线索累计联系及最新信息',()=>assert.equal(leadSignature(lead(get(filter),'0012')),leadSignature(completeLead)));
visible=['HQ'];
check('来源扩展仍只包含已授权的通话组织及任务',()=>{const row=lead(get(),'SOURCE-CODE');assert.deepEqual([...row.tenantIds],['HQ']);assert.equal(row.tasks.length,0);assert.equal(row.callCount,0);});
visible=['HQ','A','B'];
context.CloudCallData.calls.pop();batches.pop();
const textStoreCalls = [
  call('STORE-TEXT','0012','HQ',{customerFollowup:{plannedStoreName:' 上海体验中心 / Pudong ',updatedAt:'2026-09-20T00:00:00Z'}}),
  call('STORE-EMPTY','0012','HQ',{customerFollowup:{plannedStoreName:'',plannedStoreId:'',updatedAt:'2026-09-21T00:00:00Z'}}),
  call('STORE-HIDDEN','0012','HIDDEN',{customerFollowup:{plannedStoreName:'隐藏专属门店',updatedAt:'2026-09-22T00:00:00Z'}}),
  call('STORE-OTHER-ACCOUNT','0012','HQ',{enterpriseId:'8888888',customerFollowup:{plannedStoreName:'其他账号专属门店',updatedAt:'2026-09-23T00:00:00Z'}})
];
context.CloudCallData.calls.push(...textStoreCalls);
const textStoreModel=get(),textStoreLead=lead(textStoreModel,'0012');
check('仅字符串门店名称可更新线索汇总且去除首尾空格',()=>assert.equal(textStoreLead.plannedStoreName,'上海体验中心 / Pudong'));
check('新门店名称没有ID时清除先前门店ID',()=>assert.equal(textStoreLead.plannedStoreId,''));
check('后续门店留空不会抹去最近已填写名称',()=>assert.equal(textStoreLead.fieldSources.plannedStoreName.callId,'STORE-TEXT'));
check('计划门店按名称包含查询且支持组合筛选',()=>assert.equal(get({plannedStoreName:'体验中心',visitIntention:'有意向'}).rows.length,1));
check('门店文本查询去除首尾空格并忽略英文大小写',()=>assert.equal(get({plannedStoreName:' pudong '}).rows.length,1));
check('门店字符串无需对应已有租户',()=>assert.equal(get({plannedStoreName:'体验中心'}).error,undefined));
check('已改为新名称的线索不再匹配历史门店ID',()=>assert.equal(get({plannedStoreId:'A'}).rows.length,0));
check('不同编码及品牌不继承其他线索自由输入门店',()=>{assert.equal(lead(textStoreModel,'12').plannedStoreName,'');assert.equal(lead(textStoreModel,'0012','BRAND-B').plannedStoreName,'');});
check('名称筛选不暴露不可见租户或其他账号门店',()=>{assert.equal(get({plannedStoreName:'隐藏专属门店'}).rows.length,0);assert.equal(get({plannedStoreName:'其他账号专属门店'}).rows.length,0);assert.ok(!JSON.stringify(textStoreModel).includes('专属门店'));});
visible=['A'];
check('名称筛选仍先限制客户通话可见范围',()=>{assert.equal(get({plannedStoreName:'体验中心'}).rows.length,0);assert.equal(lead(get(),'0012').plannedStoreName,'A门店');});
visible=['HQ','A','B'];
context.CloudCallData.calls.splice(-textStoreCalls.length);
check('模板化选项对象仍按稳定选项 ID 统计并用于筛选',()=>{
  const previous=context.CustomerBusiness;
  const choices={leadLevel:['A级','B级','C级','D级'],intentionLevel:['高意向','中意向','低意向','无意向'],visitIntention:['有意向','暂不确定','无意向'],testDriveIntention:['有意向','暂不确定','无意向']};
  context.CustomerBusiness={fields:()=>Object.entries(choices).map(([id,options])=>({id,options:options.map(label=>({id:label,label,businessKey:''}))})).concat([{id:'plannedVisitAt',options:[]},{id:'plannedStoreName',options:[]}])};
  try {
    assert.deepEqual([...context.CloudReportData.fieldOptions('intentionLevel')],choices.intentionLevel);
    const selected=get({visitIntention:'有意向'});
    assert.equal(selected.error,undefined);
    assert.equal(selected.rows.length,1);
    assert.equal(selected.rows[0].visitIntention,'有意向');
  } finally { context.CustomerBusiness=previous; }
});
console.log(JSON.stringify({passed:checks.length,failed:0,checks},null,2));
