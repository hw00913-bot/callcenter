/** Local samples only. Import on explicit action; never replace saved batches. */
window.CustomerImportSamples = Object.freeze(Object.fromEntries([
  ['lead', '模拟名单 · 试驾线索', 'LEAD', ['确认试驾时间','了解购车计划','预约到店体验','回访试驾感受','确认置换需求','介绍车型配置','确认购车预算','确认到店时间']],
  ['aftersales', '模拟名单 · 售后回访', 'AS', ['确认保养预约','回访维修体验','确认工单处理结果','提醒领取车辆','了解用车情况','预约售后检查','确认维修时间','回访服务满意度']],
  ['activity', '模拟名单 · 周末活动邀约', 'ACT', ['确认活动报名','沟通到场时间','确认参与人数','介绍活动安排','提醒携带报名凭证','确认活动地点','了解参与意愿','确认报名信息']]
].map(([type,name,prefix,notes],typeIndex)=>[type,{
  name,
  rows:notes.map((note,i)=>({name:'模拟客户'+String(i+1).padStart(2,'0'),phone:'1380000'+String(typeIndex*100+i+1).padStart(4,'0'),note,externalDocumentId:prefix+'-'+(type==='activity'?'0001':String(i+1).padStart(4,'0'))}))
}])));
