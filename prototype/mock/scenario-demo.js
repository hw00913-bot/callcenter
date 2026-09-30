/** Namespaced fixtures for local demonstrations; never production resources. */
window.ScenarioDemoData = {
  tenantId:'TEN-NISSAN-HQ', enterpriseId:'7522240',
  receiving:{inboundCustomer:{name:'演示来电客户',phone:'13900009901'}},
  tasks:[
    {taskId:'DEMO-LINK-PRED',name:'流程演示 · 试驾预外呼',callType:'预外呼',flowId:'FLOW-PRED-HQ-V1'},
    {taskId:'DEMO-LINK-IVR',name:'流程演示 · 保养IVR通知',callType:'IVR 外呼',flowId:'FLOW-MAINTAIN-OUT-V4'}
  ],
  customers:[
    {id:'DEMO-LINK-C1',name:'演示客户张先生',phone:'13800000201',note:'确认试驾时间',taskId:'DEMO-LINK-PRED'},
    {id:'DEMO-LINK-C2',name:'演示客户李女士',phone:'13800000202',note:'了解置换计划',taskId:'DEMO-LINK-PRED'},
    {id:'DEMO-LINK-C3',name:'演示客户王先生',phone:'13800000203',note:'保养到期提醒',taskId:'DEMO-LINK-IVR'},
    {id:'DEMO-LINK-C4',name:'演示客户赵女士',phone:'13800000204',note:'确认收到通知',taskId:'DEMO-LINK-IVR'}
  ],
  inboundNumber:{numberId:'DEMO-LINK-IN-NUM',number:'02100009010',enterpriseId:'7522240',usage:'仅呼入',aliyunUsage:'Inbound',status:'正常',businessStatus:'正常',authorizedTenantIds:['TEN-NISSAN-HQ'],simulation:true},
  inboundRoute:{routeId:'DEMO-LINK-IN-ROUTE',enterpriseId:'7522240',numberId:'DEMO-LINK-IN-NUM',routeVersion:'DEMO-V1',status:'已发布',contactFlowId:'FLOW-NISSAN-ENTRY-V8',defaultTenantId:'TEN-NISSAN-HQ',branches:[{branchCode:'DTMF-1',label:'按1 客户邀约',tenantId:'TEN-NISSAN-HQ',physicalGroupId:'DEMO-CUSTOMER-PHY'}],overrides:{}}
};
