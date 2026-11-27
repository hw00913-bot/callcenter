(() => {
  'use strict';

  const rChannels = Array.from({length:12}, (_, index) => ({
    value:'r' + (index + 1), label:'R' + (index + 1), aliases:['R' + (index + 1)]
  }));
  const leadStatuses = (window.DReview21DictionarySeed?.items?.INITIAL_LEAD_STATUS || [])
    .filter(item => item.status === '启用')
    .map(item => ({value:item.code,label:item.name,aliases:[item.name]}));

  const fields = [
    {key:'originalKey', businessKey:'hclueid', label:'来源线索编号', type:'text', required:true},
    {key:'name', businessKey:'name', label:'客户姓名', type:'text', required:true},
    {key:'phone', businessKey:'phone', label:'手机号码', type:'phone', required:true},
    {key:'dealer', businessKey:'dealer', label:'意向门店', type:'select', options:[
      {value:'DLR-BJ-CY-002',label:'北京东风日产朝阳店'},
      {value:'DLR-SH-PD-004',label:'上海东风日产浦东店'}
    ]},
    {key:'series', businessKey:'series', label:'意向车系', type:'select', options:[
      {value:'N7',label:'N7'}, {value:'NX8',label:'NX8'}
    ]},
    {key:'channel', businessKey:'channel', label:'留资渠道', type:'select', options:[
      {value:'TW-ONLINE',label:'天网线上活动'}, {value:'TW-OTHER',label:'天网其他渠道'}
    ]},
    {key:'rChannel', businessKey:'rChannel', label:'R 渠道', type:'select', options:rChannels},
    {key:'leadStatus', businessKey:'leadStatus', label:'线索状态', type:'select', options:leadStatuses},
    {key:'leadAt', businessKey:'firstIntakeAt', label:'留资时间', type:'datetime-local'},
    {key:'smartCode', businessKey:'smartCode', label:'SmartCode', type:'text'},
    {key:'projectName', businessKey:'project', label:'大项目名', type:'text'}
  ];

  const historyCases = [
    {value:'empty',label:'已接入 · 查无记录'},
    {value:'found',label:'已接入 · 查到记录'},
    {value:'unconnected',label:'未接入'},
    {value:'failed',label:'已接入 · 查询失败'}
  ];
  const templateVersions = [
    {value:'1.0', label:'天网人工培育 v1.0'},
    {value:'1.1', label:'天网人工培育 v1.1'}
  ];
  const deliveryTargets = [
    {type:'externalSystem',id:'DEMO-EXT-LEAD-RECEIVER',label:'外部线索接收系统（模拟）'}
  ];
  const templates = {
    '1.0':{nurtureTemplateId:'TW-NURTURE-MANUAL', nurtureTemplateVersion:'1.0',
      deliveryTemplateId:'TW-DELIVERY-REVIEW', deliveryTemplateVersion:'1.0', requiredMode:'人工外呼'},
    '1.1':{nurtureTemplateId:'TW-NURTURE-MANUAL', nurtureTemplateVersion:'1.1',
      deliveryTemplateId:'TW-DELIVERY-REVIEW', deliveryTemplateVersion:'1.0', requiredMode:'人工外呼'}
  };

  const nodes = [
    {id:'fields', label:'来件校验', condition:'按培育线索的字段映射、类型、字典和必填项校验', branches:{
      valid:{action:'继续',next:'localHistory'},
      invalid:{action:'过滤',status:'已过滤'}
    }},
    {id:'localHistory', label:'本系统历史', condition:'核对最近 30 天原线索或同号码的任务回访、当次话单及意向级别',
      days:30, match:{visitResult:'已成交', callStatus:'已接通', intentLevel:'A'}, branches:{
        matched:{action:'结束',status:'已结束',reason:'本系统历史中存在已接通且已成交的回访'},
        unmatched:{action:'继续',next:'externalHistory',reason:'选中的本系统历史不符合结束条件'},
        noHistory:{action:'继续',next:'externalHistory',reason:'授权范围内无符合时间窗口的历史回访'},
        missing:{action:'转待处理',status:'待处理',reason:'选中的历史回访或对应话单缺少判定所需数据'}
      }},
    {id:'externalHistory', label:'外部历史', condition:'外部历史已接入时由智能培育系统发起模拟查询', branches:{
      found:{action:'过滤',status:'已过滤',reason:'模拟外部历史确认线索已结案'},
      empty:{action:'继续',next:'template',reason:'模拟外部历史未查到记录'},
      unconnected:{action:'转待处理',status:'待处理',reason:'外部历史未接入，当前节点未发起查询'},
      failed:{action:'转待处理',status:'待处理',reason:'模拟外部历史查询失败'}
    }},
    {id:'template', label:'培育模板匹配', condition:'意向门店、意向车系及留资渠道满足当前模板条件',
      match:{dealer:['DLR-BJ-CY-002','DLR-SH-PD-004'], series:['N7','NX8'], channel:['TW-ONLINE']}, branches:{
        matched:{action:'送入培育模板',status:'已匹配',reason:'命中天网人工培育模板'},
        unmatched:{action:'保留待匹配',status:'待匹配',reason:'节点已执行完毕，当前没有匹配的处理去向'}
      }}
  ];

  const example = {
    originalKey:'TW-LEAD-001', name:'天网演示客户', phone:'13800007630',
    dealer:'DLR-BJ-CY-002', series:'N7', channel:'TW-ONLINE',
    rChannel:'r1', leadStatus:leadStatuses[0]?.value || '',
    leadAt:'2026-11-18T10:00', smartCode:'TW-DEMO', projectName:'天网演示活动',
    historyCase:'empty', targetVersion:'1.0'
  };
  const sample = (id,label,fields={}) => ({id,label,input:{...example,...fields}});
  const samples = [
    sample('matched','通过清洗并进入任务分配'),
    sample('preRatingA','预评级接口返回 A',{originalKey:'TW-PRERATING-A',phone:'13800007634'}),
    sample('preRatingB','预评级接口返回 B',{originalKey:'TW-PRERATING-B',phone:'13800007635'}),
    sample('preRatingTimeout','预评级接口超时',{originalKey:'TW-PRERATING-TIMEOUT',phone:'13800007636'}),
    sample('invalid','字段校验过滤',{originalKey:'TW-LEAD-002',phone:'123456'}),
    sample('unmatched','节点走完仍无去向',{originalKey:'TW-LEAD-003',channel:'TW-OTHER'}),
    sample('localMatched','本系统历史命中并结束',{originalKey:'TW-HIST-MATCH',phone:'13800007631'}),
    sample('localUnmatched','本系统历史未命中并继续',{originalKey:'TW-HIST-NEXT',phone:'13800007632'}),
    sample('localMissing','本系统历史缺少话单',{originalKey:'TW-HIST-MISSING',phone:'13800007633'}),
    sample('externalFound','外部历史查到并过滤',{originalKey:'TW-LEAD-004',historyCase:'found'}),
    sample('externalUnconnected','外部历史未接入',{originalKey:'TW-LEAD-005',historyCase:'unconnected'}),
    sample('externalFailed','外部历史查询失败',{originalKey:'TW-LEAD-006',historyCase:'failed'}),
    sample('flowMissing','缺少大项目名',{originalKey:'TW-FLOW-MISSING',projectName:''})
  ];

  function localHistory(scope, receivedAt) {
    const at = new Date(Date.parse(receivedAt) - 2 * 86400000).toISOString();
    const cases = [
      {id:'MATCH', phone:'13800007631', result:'已成交', intentLevel:'A', callStatus:'已接通'},
      {id:'NEXT', phone:'13800007632', result:'下次回访', intentLevel:'B', callStatus:'已接通'},
      {id:'MISSING', phone:'13800007633', result:'已成交', intentLevel:'A'}
    ];
    const tasks = cases.map(({id,phone,result,intentLevel}) => ({
      tenant:scope.id, brandId:scope.tenant.brandId, taskId:'TW-HIST-TASK-' + id,
      originalKey:'TW-HIST-' + id, phone, requiredMode:'人工外呼',
      followupHistory:[{id:'TW-HIST-VISIT-' + id, taskId:'TW-HIST-TASK-' + id,
        callId:'TW-HIST-CALL-' + id, at, result, details:{intentLevel}}]
    }));
    const calls = cases.filter(item => item.callStatus).map(item => ({
      tenantId:scope.id, brandId:scope.tenant.brandId, callId:'TW-HIST-CALL-' + item.id,
      callType:'人工外呼', direction:'呼出', status:item.callStatus
    }));
    return {tasks,calls};
  }

  function externalHistory(historyCase) {
    if (historyCase === 'found') return {result:'查到记录', evidence:'模拟历史记录 TW-EXT-HIST-001', actual:'已结案'};
    if (historyCase === 'failed') return {result:'查询失败', evidence:'模拟查询异常响应', actual:'未获得历史数据'};
    return {result:'查无记录', evidence:'模拟查询返回空集合', actual:'0 条'};
  }

  window.DSkynetIntakeFixtures = Object.freeze({
    source:'天网', sourceApplicationId:'APP-SKYNET-DEMO', category:'培育线索', categoryId:'review21-nurture',
    fields, historyCases, templateVersions, deliveryTargets, templates, nodes, samples, localHistory, externalHistory
  });
})();
