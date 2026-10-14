/* Report contracts with supplier clarification D-049 / SRC-079, 2026-09-20. Pure mapping, no network calls. */
(function(root){
  'use strict';
  const routes=Object.freeze({task:'outboundReport/predictiveObReport',daily:'outboundReport/predictiveDailyObReport',agent:'outboundReport/predictiveAgentObReport',queue:'queueReport'});
  const pages={task:'获取预测外呼报表数据',daily:'获取预测外呼日报表',agent:'获取预测外呼座席报表',queue:'队列报表'};
  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const own=(value,key)=>Object.prototype.hasOwnProperty.call(value||{},key);
  const array=value=>Array.isArray(value)?value:[];
  const id=value=>typeof value==='string'&&/^\d+$/.test(value)&&/[1-9]/.test(value)?value:typeof value==='number'&&Number.isSafeInteger(value)&&value>0?String(value):'';
  const identity=value=>typeof value==='string'&&value.trim()===value&&value&&!value.includes(',')?value:'';
  function count(value){return (typeof value==='string'&&/^\d+$/.test(value)||typeof value==='number'&&Number.isSafeInteger(value))&&Number.isSafeInteger(Number(value))&&Number(value)>=0?Number(value):null;}
  function seconds(value){
    if(typeof value!=='string'||!/^\d+:[0-5]\d:[0-5]\d$/.test(value))return null;
    const [h,m,s]=value.split(':').map(Number),total=h*3600+m*60+s;
    return Number.isSafeInteger(total)?total:null;
  }
  function percent(value){
    if(typeof value!=='string'||!/^\d+(?:\.\d+)?%$/.test(value))return null;
    const n=Number(value.slice(0,-1));return n<=100?n:null;
  }
  function day(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
    const time=Date.parse(value+'T00:00:00Z');return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===value;
  }
  function list(value,validator){
    const values=Array.isArray(value)?value:typeof value==='string'?value.split(','):[];
    const normalized=values.map(validator);return normalized.length&&normalized.every(Boolean)&&new Set(normalized).size===normalized.length?normalized:null;
  }
  function buildRequest(kind,options={}){
    const pending=[],enterpriseId=id(options.enterpriseId),fields={enterpriseId};
    if(!own(routes,kind))pending.push('不支持的报表类型');
    if(!enterpriseId)pending.push('请核对供应商账号');
    const start=count(options.start??0),limit=count(options.limit??10);
    if(start===null)pending.push('查询起点须为非负整数');else fields.start=start;
    if(limit===null||limit<1||limit>1000)pending.push('每页条数须为1–1000');else fields.limit=limit;
    if(kind==='task'){
      const ids=list(options.taskId??options.taskIds,id);
      if(!ids)pending.push('请提供有效的供应商任务编号');else fields.taskId=ids.join(',');
      if(options.startTime!=null||options.endTime!=null)pending.push('任务报表为任务累计统计，不接受日期筛选');
    }else if(own(routes,kind)){
      if(!day(options.startTime))pending.push('开始日期须为有效的年月日');else fields.startTime=options.startTime;
      const range=count(options.timeRangeType??4);
      if(kind!=='agent'){
        if(![1,2,3,4].includes(range))pending.push('请选择有效的统计时间类型');else fields.timeRangeType=range;
      }
      if(kind!=='queue'||range===4||options.endTime!=null){
        if(!day(options.endTime))pending.push('结束日期须为有效的年月日');else fields.endTime=options.endTime;
      }
      if(fields.startTime&&fields.endTime&&fields.endTime<fields.startTime)pending.push('结束日期不能早于开始日期');
      if(kind==='queue'){
        const method=count(options.statisticMethod??2);
        if(![0,1,2,8].includes(method))pending.push('请选择有效的队列统计方法');else fields.statisticMethod=method;
        for(const key of ['startHour','endHour'])if(own(options,key)){
          const n=count(options[key]),min=key==='startHour'?0:1,max=key==='startHour'?23:24;
          if(n===null||n<min||n>max)pending.push('队列统计时段无效');else fields[key]=n;
        }
        if((fields.endHour??24)<=(fields.startHour??0))pending.push('队列统计结束时段须晚于开始时段');
      }
      for(const [key,validator] of Object.entries(kind==='daily'?{taskIds:id}:kind==='agent'?{taskIds:id,gnos:identity,qnos:identity}:{qnos:identity}))if(own(options,key)){
        const ids=list(options[key],validator);if(!ids)pending.push(key+'格式无效');else fields[key]=ids.join(',');
      }
    }
    return {ok:pending.length===0,kind,endpoint:routes[kind]?'/interface/v10/'+routes[kind]:'',method:'GET',fields,pending,
      sourceUrl:pages[kind]?'https://wiki.alicti.cn/html/wiki/API/数据报表/'+pages[kind]+'.html':'',requiresAuth:true};
  }
  function unavailable(issue,raw,request){return {available:false,rows:[],totalCount:null,calledCount:null,answerCount:null,bridgeCount:null,retryCalledCount:null,issue,raw:clone(raw),request};}
  function parse(kind,response,options={}){
    const request=buildRequest(kind,options),bad=message=>unavailable(message,response,request);
    if(!request.ok)return bad(request.pending.join('；'));
    if(!response||![0,'0'].includes(response.result))return bad('未取得有效的报表查询结果');
    const data=response.data;
    if(!data||Array.isArray(data)||!Array.isArray(data.list))return bad('报表返回结构不完整');
    const total=count(data.totalCount),pageSize=count(data.pageSize),start=count(data.start??request.fields.start);
    if(total===null||pageSize===null||pageSize<1||pageSize>1000||start===null||start!==request.fields.start||data.list.length>pageSize||data.list.length>total)return bad('报表分页信息无效');
    const taskIds=list(request.fields.taskId??request.fields.taskIds,id),qnos=list(request.fields.qnos,identity),gnos=list(request.fields.gnos,identity);
    const rows=[],keys=new Set();
    for(const raw of data.list){
      if(!raw||typeof raw!=='object'||Array.isArray(raw)||id(raw.enterpriseId)!==request.fields.enterpriseId)return bad('报表包含其他供应商账号或缺少账号标识');
      const row={...clone(raw)},rowTask=id(kind==='task'?raw.id:raw.taskId);
      if(kind==='task'||kind==='daily'){
        if(!rowTask||taskIds&&!taskIds.includes(rowTask))return bad('报表任务编号与查询范围不一致');
        row.providerTaskId=rowTask;
      }
      if(kind==='task'){
        if(![1,2].includes(count(raw.taskType)))return bad('任务报表缺少有效任务类型');
        if(options.taskType!=null&&count(raw.taskType)!==count(options.taskType))return bad('任务报表类型与当前任务不一致');
        for(const key of ['totalCount','calledCount','answerCount','bridgeCount','retryCalledCount']){
          row[key]=count(raw[key]);if(row[key]===null)return bad('任务累计数据不完整：'+key);
        }
        if(row.answerCount>row.calledCount||row.bridgeCount>row.answerCount||row.retryCalledCount>row.calledCount)return bad('任务累计数量之间不一致');
        row.taskType=count(raw.taskType);
      }else if(kind==='daily'){
        if(raw.day!=null&&(!day(raw.day)||raw.day<request.fields.startTime||raw.day>request.fields.endTime))return bad('报表日期与查询范围不一致');
        for(const key of ['calledCount','answerCount','bridgeCount','answerMinutes','telRetryRound'])row[key]=count(raw[key]);
        row.durationSeconds=seconds(raw.duration);row.runDurationSeconds=seconds(raw.runDuration);
      }else if(kind==='agent'){
        if(typeof raw.cno!=='string'||!/^\d+$/.test(raw.cno)||!/[1-9]/.test(raw.cno))return bad('报表坐席工号无效');
        if(gnos&&!gnos.includes(raw.gno))return bad('报表外呼组与查询范围不一致');
        // qname is a supplier label, not a qno or a local skill ID. Keep it as received.
        row.calledCount=count(raw.calledCount);row.bridgeCount=count(raw.bridgeCount);
        for(const key of ['stateCalling','stateIdle','stateInuse','statePause','stateWrapup'])row[key+'Seconds']=seconds(raw[key]);
      }else if(kind==='queue'){
        if(!identity(raw.qno)||qnos&&!qnos.includes(raw.qno))return bad('报表队列与查询范围不一致');
        if(raw.day!=null&&(!day(raw.day)||raw.day<request.fields.startTime||request.fields.endTime&&raw.day>request.fields.endTime))return bad('报表日期与查询范围不一致');
        for(const key of ['enterCount','successCount','leaveCompleteCount','rnaCount','callCount','leaveAbandonedCount','leaveTimeoutCount'])row[key]=count(raw[key]);
        for(const key of ['totalBridgeTime','avgBridgeTime','totalWaitTime','avgWaitTime'])row[key+'Seconds']=seconds(raw[key]);
        // D-049 / SRC-079: the supplier confirmed these meanings despite their English names.
        // Preserve the original String fields and every supplier rate as received.
        row.telephoneAnsweredCount=count(raw.telEnterCount); // 队列来电接听数
        row.telephoneEnteredCount=count(raw.telAnswerCount); // 进入队列来电数
      }
      const key=JSON.stringify(kind==='task'?[rowTask]:kind==='daily'?[rowTask,raw.day??null]:kind==='agent'?[raw.cno,raw.task??'',raw.gno??'',raw.qname??'']:[raw.qno,raw.day??null,raw.hour??null,raw.dateTimeRange??null]);
      if(keys.has(key))return bad('报表返回重复统计行，请核对查询结果');keys.add(key);
      rows.push(row);
    }
    const totalStatistic=kind==='daily'&&data.totalStatistic&&typeof data.totalStatistic==='object'&&!Array.isArray(data.totalStatistic)?clone(data.totalStatistic):null;
    if(totalStatistic){
      for(const key of ['bridgeCount','calledCount','answerCount','answerMinutes','telRetryRound','distinctCustomerNumberBridgeCount'])totalStatistic[key]=count(totalStatistic[key]);
      totalStatistic.durationSeconds=seconds(data.totalStatistic.duration);
    }
    return {available:true,kind,rows,totalRows:total,pageSize,start,complete:start===0&&rows.length===total,totalStatistic,
      raw:clone(response),request,issue:'',scope:'supplier-report',mock:response.mock===true};
  }
  function task(row,response){
    const taskId=id(row?.providerTaskId),type=count(row?.providerType??(row?.callType==='预外呼'?1:row?.callType==='IVR 外呼'?2:null));
    if(!taskId||![1,2].includes(type))return unavailable('当前任务尚无可核验的供应商任务标识',response);
    const raw=response===undefined?root.AliCtiReportSummaryFixtures?.task(row):response;
    if(!raw)return unavailable('尚未取得任务累计报表',raw);
    const parsed=parse('task',raw,{enterpriseId:row.enterpriseId,taskId,taskType:type});
    if(!parsed.available)return parsed;
    if(parsed.rows.length!==1||parsed.totalRows!==1)return unavailable('未取得当前任务唯一的累计报表',raw,parsed.request);
    return {...parsed,...parsed.rows[0],raw:parsed.raw,issue:'',available:true,asOf:raw.asOf||null,
      metricScope:'task-cumulative',source:'outboundReport/predictiveObReport'};
  }
  root.AliCtiReportSummary=Object.freeze({buildRequest,parse,task,count,seconds,percent});
})(window);
