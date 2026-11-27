(() => {
  'use strict';

  // The published review rubric and its criteria are display data for this prototype.
  const outline = [
    ['FS001','销售引导及话术标准',35,[
      ['SS001','开场白',[['TS001','报品牌+自我介绍','开场报出品牌并做自我介绍']]],
      ['SS002','留资信息确认',[['TS002','确认留资意愿','与客户确认留资意愿及信息准确性']]],
      ['SS003','需求分析',[
        ['TS003','问购车用途','询问客户购车的用途场景'],
        ['TS004','问购车方式','询问客户准备全款还是分期'],
        ['TS005','问购车时间','询问客户计划购车时间'],
        ['TS006','问客户城市','确认客户所在城市']
      ]],
      ['SS004','邀请试驾排程',[['TS007','主动邀请到店试驾','邀请试驾并约定时间']]],
      ['SS005','姓氏确认',[['TS008','确认客户姓氏','称呼前确认客户姓氏']]],
      ['SS006','邀请添加企业微信',[['TS009','添加客户微信','邀请添加企业微信并确认结果']]],
      ['SS007','礼貌结束',[['TS010','礼貌结束通话','通话结束时使用礼貌用语']]],
      ['SS008','产品介绍',[['TS011','介绍车型卖点','结合客户需求介绍车型核心卖点']]],
      ['SS009','权益介绍',[['TS012','介绍购车权益','向客户介绍当前购车权益政策']]]
    ]],
    ['FS002','应对技巧',20,[
      ['SS010','异议处理',[
        ['TS013','价格异议应对','合理回应客户的价格异议'],
        ['TS014','竞品对比应对','客观回应竞品比较']
      ]],
      ['SS011','需求引导',[
        ['TS015','引导到店','合理引导客户到店看车'],
        ['TS016','引导留资','引导客户补充必要的联系信息']
      ]]
    ]],
    ['FS003','服务态度',20,[
      ['SS012','服务热情',[
        ['TS017','主动问候','接通后主动问候客户'],
        ['TS018','耐心解答','耐心答复客户提出的问题']
      ]],
      ['SS013','情绪管理',[
        ['TS019','语气平和','通话过程中保持语气平和'],
        ['TS020','安抚客户','听到客户表示不满时及时沟通']
      ]]
    ]],
    ['FS004','通话行为',25,[
      ['SS014','通话礼仪',[
        ['TS021','使用礼貌用语','通话中使用礼貌用语'],
        ['TS022','语速适中','维持平稳、清楚的表达']
      ]],
      ['SS015','通话规范',[
        ['TS023','无长时间静音','通话中没有出现长时间静音'],
        ['TS024','无打断客户','客户讲话时未强行打断']
      ]]
    ]]
  ];

  function rubric() {
    return outline.map(([id,name,weight,groups])=>({id,name,weight,groups:groups.map(([groupId,groupName,items])=>
      ({id:groupId,name:groupName,items:items.map(([itemId,itemName,description])=>
        ({id:itemId,name:itemName,description,dimensionId:id,groupId}))}))}));
  }

  // Tenant identities correspond to the review prototype's demo roles. Contact data are synthetic.
  const tenants = {
    'TEN-NISSAN-HQ':{
      brandId:'BRAND-NISSAN',code:'NS-HQ',brand:'东风日产',series:['N7','NX8','天籁','轩逸'],
      dealers:['北京东风日产朝阳店','上海东风日产浦东店'],
      seats:[
        ['ACC-OPS-CHEN','陈敏','1001','总部外呼一组'],
        ['ACC-OPS-108','王静','9001','总部外呼二组']
      ]
    },
    'TEN-NISSAN-SH':{
      brandId:'BRAND-NISSAN',code:'NS-SH',brand:'东风日产',series:['N7','NX8','轩逸'],
      dealers:['上海东风日产浦东店'],
      seats:[['ACC-OPS-066','周岚','QA-SH-01','门店外呼组'],['QA-SH-PEER','门店演示坐席','QA-SH-02','门店外呼组']]
    },
    'TEN-EPI-HQ':{
      brandId:'BRAND-EPI',code:'EP-HQ',brand:'东风奕派',series:['eπ007','eπ008'],
      dealers:['东风奕派演示门店'],
      seats:[['QA-EPI-A','奕派演示坐席 A','QA-EP-01','奕派外呼组'],['QA-EPI-B','奕派演示坐席 B','QA-EP-02','奕派外呼组']]
    }
  };
  const leadTypes = ['首次咨询','试驾预约','订单线索','再次咨询'];
  const sources = ['官方表单','汽车之家','懂车帝','活动报名'];
  const channels = ['R1-懂车帝留资','R2-汽车之家留资','R3-官网表单','R4-活动报名'];
  const reasons = ['通话时长不足30秒','系统重复质检','无有效语音内容','录音损坏无法质检'];
  const demoQuestions = [
    '这款车落地要多少钱？',
    '满电平时能跑多少公里？',
    '这周有现车吗？',
    '分期首付和月供大概多少？',
    '基础版和高配版的区别是什么？',
    '一年保养大概需要多少钱？',
    '周末怎么预约试驾？',
    '家用充电桩需要另外安装吗？',
    '车身有哪些颜色可以选？',
    '订车到提车通常要等多久？'
  ];
  const demoCompetitors = ['问界 M7','理想 L7','极氪 001','特斯拉 Model Y','蔚来 ES6','比亚迪 汉'];
  const complianceRules = [
    {id:'RULE-SENSITIVE',name:'服务禁语',category:'sensitive-word',description:'通话用语需要核对',deduction:4},
    {id:'RULE-KNOWLEDGE',name:'产品知识',category:'knowledge',description:'产品信息与当前资料不一致',deduction:7},
    {id:'RULE-RED-LINE',name:'合规红线',category:'red-line',description:'模拟合规风险，需要人工复核',deduction:0,fatal:true},
    {id:'RULE-VIOLATION',name:'违规下发',category:'violation',description:'演示下发记录需核对客户确认环节',deduction:0,fatal:true}
  ];
  const pad = (value,width=2)=>String(value).padStart(width,'0');

  function timestamp(daysBefore,hour,minute) {
    const at = new Date(Date.UTC(2026,10,22-daysBefore));
    return at.toISOString().slice(0,10)+' '+pad(hour)+':'+pad(minute)+':00';
  }

  function callItems(seed) {
    return outline.flatMap(([dimensionId, ,weight,groups],dimensionIndex)=>{
      const size = groups.reduce((total,[, ,items])=>total+items.length,0);
      const maxScore = weight/size;
      return groups.flatMap(([groupId, ,items])=>items.map(([id,name,description])=>{
        const sequence = Number(id.slice(2));
        const passed = (seed+sequence*7+dimensionIndex)%11>=(seed%3+1);
        const time = '00:'+pad((sequence+seed)%2)+':'+pad((sequence*3)%60);
        return {id,name,description,dimensionId,groupId,score:passed?maxScore:0,maxScore,passed,
          appealable:!passed,evidenceTime:time,evidence:passed?'已识别到本项通话动作。':'演示质检未识别到本项通话动作。'};
      }));
    });
  }

  function compliance(seed) {
    return complianceRules.filter((row,index)=>[4,6,12,15][index]===seed%[9,13,21,25][index])
      .map(item=>({...item,categoryLabel:item.name,score:0,maxScore:0,passed:false,appealable:true,
        evidenceTime:'00:01:15',evidence:'本项是复核用的模拟质检提示。'}));
  }

  function recordFor(tenantId, config, seat, seatIndex, index, attempt) {
    const [accountId,seatName,seatId,seatGroup] = seat;
    const sequence = seatIndex*100+index+1;
    const suffix = config.code+'-'+pad(sequence,3);
    const seed = sequence*3+attempt;
    const series = config.series[(index+seatIndex)%config.series.length];
    const inspected = seed%13!==9 || attempt===2;
    const connected = inspected || seed%2===0;
    const callAt = timestamp(index*2+(attempt===1&&index%3===0?1:0),9+index%9,5+(sequence*7)%48);
    const qualityAt = inspected ? callAt.slice(0,11)+'19:'+pad(5+seed%50)+':00' : '';
    const duration = inspected ? 60+seed*23%560 : 12+seed%25;
    const items = inspected ? callItems(seed) : [];
    const redLines = inspected ? compliance(seed) : [];
    const callMode = seatIndex===0 && index===0 && attempt===2 ? 'AI 外呼' : '人工外呼';
    const speaker = callMode==='AI 外呼' ? 'AI 坐席' : '坐席';
    const transcript = connected ? [
      {time:'00:00:06',role:speaker,text:'您好，我是'+config.brand+'的'+seatName+'，想跟您确认一下之前咨询的'+series+'。'},
      {time:'00:00:18',role:'客户',text:'我主要想了解日常通勤的用车情况，以及能不能周末去店里试驾。'},
      {time:'00:00:33',role:speaker,text:'可以，我先和您核对所在城市，再看看门店周末可约的时段。'},
      {time:'00:00:51',role:'客户',text:'好的，您把门店地址和可约时间一起发给我就行。'}
    ] : [];
    if (inspected) {
      const question = demoQuestions[(index+seatIndex*2+attempt-1)%demoQuestions.length];
      transcript.push({time:'00:00:54',role:'客户',text:question});
      if (index%3!==1 || attempt===2) {
        const competitor = demoCompetitors[(index+seatIndex+attempt-1)%demoCompetitors.length];
        transcript.push({time:'00:00:58',role:'客户',text:'我还在比较'+competitor+'，希望了解两款车各自的使用成本。'});
      }
    }
    return {
      id:'QC-'+suffix+'-'+attempt,tenantId,brandId:config.brandId,accountId,seatId,seatName,seatGroup,callMode,
      taskId:'QC-TASK-'+suffix,roundId:'QC-TASK-'+suffix+'-R'+attempt,callId:'QC-CALL-'+suffix+'-'+attempt,
      leadCode:'QC-LEAD-'+suffix,customerName:'演示客户 '+pad(sequence,3),phone:'170****'+pad(1000+sequence,4),
      series,source:sources[index%sources.length],channel:channels[(index+seatIndex)%channels.length],
      leadType:leadTypes[index%leadTypes.length],dealer:config.dealers[index%config.dealers.length],
      callAt,qualityAt,receivedAt:timestamp(index*2+2,8,30),duration,connected,validCall:connected&&duration>=30,
      completeness:connected&&seed%8!==0?'完整':'不完整',inspected,notInspectedReason:inspected?'':reasons[index%reasons.length],
      excellent:inspected&&seed%11===0&&redLines.length===0,
      items,redLines,transcript,tags:[{label:'意向车系',value:series},{label:'购车目的',value:'日常通勤'},
        {label:'试驾意愿',value:index%3===0?'待确认':'有意愿'},{label:'客户关注',value:'用车成本、试驾时段'}]
    };
  }

  function records(tenantId,brandId) {
    const config = tenants[tenantId];
    if (!config || config.brandId!==brandId) return [];
    return config.seats.flatMap((seat,seatIndex)=>Array.from({length:14},(_,index)=>
      (index%3===0?[1,2]:[1]).map(attempt=>recordFor(tenantId,config,seat,seatIndex,index,attempt))).flat(1));
  }

  function seededAppeals(records) {
    const firstBySeat = new Map();
    for (const record of records) {
      const item = record.items.find(row=>row.appealable);
      if (item && !firstBySeat.has(record.accountId)) firstBySeat.set(record.accountId,{record,item});
    }
    return [...firstBySeat.values()].map(({record,item},index)=>({
      id:'QA-APPEAL-'+record.id,recordId:record.id,itemIds:[item.id],
      reason:'请复核这段通话转写与该细项的判定。',
      submittedAt:timestamp(1,10+index,20),submittedBy:record.seatName,submittedByAccountId:record.accountId,
      repliedAt:index?timestamp(1,14,30):'',reviewedBy:index?'演示审核员':'',
      reply:index?'已核对会话证据，维持原判定。':'',decisions:index?[{itemId:item.id,approve:false}]:[]
    }));
  }

  window.DQualityInspectionFixture = Object.freeze({records,rubric,seededAppeals});
})();
