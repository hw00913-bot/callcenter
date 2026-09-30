/** Fictional enterpriseTime responses, independently owned by each enterprise. */
(function(root){
  'use strict';
  const created='2026-09-20 09:00:00',rows=[];
  for(const [enterpriseId,tenantId,label] of [['7522240','TEN-NISSAN-HQ','总部'],['7522241','TEN-NISSAN-SH','上海门店']]){
    const week=(id,name,days,start,end,priority)=>({id,enterpriseId,name,type:1,timeType:1,fromDay:'',toDay:'',dayOfWeek:days,startTime:start,endTime:end,priority,createTime:created,tenantIds:[tenantId]});
    rows.push(
      week('95001','工作日营业时间','2,3,4,5,6','09:00','18:00',1),
      week('95002','周末营业时间','1,7','10:00','17:00',2),
      week(enterpriseId==='7522240'?'95003':'95004',label+'客户联系时间',enterpriseId==='7522240'?'2,3,4,5,6':'1,2,3,4,5,6,7','09:30',enterpriseId==='7522240'?'18:00':'20:00',3),
      week('95005','午间休息','1,2,3,4,5,6,7','12:00','13:30',4),
      {id:'95006',enterpriseId,name:'国庆假期',type:2,timeType:1,fromDay:'2026-10-01',toDay:'2026-10-07',dayOfWeek:'',startTime:'00:00',endTime:'23:59',priority:5,createTime:created,tenantIds:[tenantId]}
    );
  }
  rows.push({...rows[0],enterpriseId:'DEMO-ENT-003',tenantIds:['TEN-EPI-HQ']});
  function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
  root.AliCtiTimeFixtures=freeze({rows,simulation:true});
})(window);
