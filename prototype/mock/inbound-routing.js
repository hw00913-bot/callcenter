/** Independent fictional responses for the documented AliCti inbound-router APIs. */
(function (root) {
  'use strict';
  const enterpriseId='7522240',hq='TEN-NISSAN-HQ',sh='TEN-NISSAN-SH',created='2026-09-15 09:00:00';
  const ivrs=[
    {id:'93001',enterpriseId,ivrName:'客户服务热线导航',ivrType:'1',ivrDescription:'售前咨询与售后服务导航',createTime:created,tenantIds:[hq]},
    {id:'93002',enterpriseId:'7522241',ivrName:'上海门店来电导航',ivrType:'1',ivrDescription:'门店来电服务导航',createTime:created,tenantIds:[sh]},
    {id:'93003',enterpriseId,ivrName:'总部非营业时间留言',ivrType:'1',ivrDescription:'来电留言流程',createTime:created,tenantIds:[hq]}
  ];
  const trunks=[
    {id:'94001',enterpriseId,numberTrunk:'00006101',areaCode:'021',name:'总部服务号码',tenantIds:[hq]},
    {id:'94002',enterpriseId:'7522241',numberTrunk:'00006102',areaCode:'021',name:'上海门店服务号码',tenantIds:[sh]},
    {id:'94003',enterpriseId,numberTrunk:'66008801',areaCode:'021',name:'总部客户服务号码',tenantIds:[hq]}
  ];
  const times=[
    {id:'95001',enterpriseId,name:'工作日营业时间',type:'1',fromDay:'',toDay:'',dayOfWeek:'2,3,4,5,6',startTime:'09:00',endTime:'18:00',priority:'1',createTime:created,tenantIds:[hq]},
    {id:'95002',enterpriseId,name:'周末营业时间',type:'1',fromDay:'',toDay:'',dayOfWeek:'1,7',startTime:'10:00',endTime:'17:00',priority:'2',createTime:created,tenantIds:[hq]}
  ];
  times.push(...times.map(row=>({...row,enterpriseId:'7522241',tenantIds:[sh]})));
  const extens=[
    {id:'96001',enterpriseId,exten:'0012',name:'总部服务分机',active:'1',tenantIds:[hq]},
    {id:'96002',enterpriseId:'7522241',exten:'1018',name:'上海门店服务分机',active:'1',tenantIds:[sh]}
  ];
  const rows=[
    {id:'97001',enterpriseId,name:'总部客户来电',active:'1',routerType:'1',routerProperty:'93001',description:'转接客户服务热线导航',priority:'1',ruleAreaProperty:'',ruleTimeProperty:'95001;95002',ruleTrunkProperty:'00006101',createTime:created,localTenantIds:[hq]},
    {id:'97002',enterpriseId:'7522241',name:'上海门店来电',active:'1',routerType:'1',routerProperty:'93002',description:'转接门店来电导航',priority:'2',ruleAreaProperty:'',ruleTimeProperty:'95001;95002',ruleTrunkProperty:'00006102',createTime:created,localTenantIds:[sh]},
    {id:'97003',enterpriseId,name:'总部专线分机',active:'2',routerType:'3',routerProperty:'0012',description:'直接转接总部服务分机',priority:'3',ruleAreaProperty:'010;021',ruleTimeProperty:'95001',ruleTrunkProperty:'00006101',createTime:created,localTenantIds:[hq]},
    {id:'97004',enterpriseId,name:'客户服务热线转接',active:'2',routerType:'2',routerProperty:'02166008809',description:'转接客户服务电话',priority:'4',ruleAreaProperty:'',ruleTimeProperty:'',ruleTrunkProperty:'66008801',createTime:created,localTenantIds:[hq]}
  ];
  // tenantIds/localTenantIds are local visibility metadata, never supplier request/response fields.
  root.AliCtiInboundMock={version:1,rows,resources:{ivrs,trunks,times,extens},simulation:true};
})(window);
