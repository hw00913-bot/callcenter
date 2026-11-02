# 两工作区既有入口盘点（静态观察）

观察时间：2026-10-15T17:30:16+08:00。不是生产可用性确认，未执行真实接口。AI14个叶路由中通道管理为整页占位；云呼叫31个主菜单均有页面模块，局部动作仍须验证。config/nav.json均不能单独作为业务功能总清单。

## AI路由
| 原路由 | 页面ID | 观察状态 |
|---|---|---|
| nav-home | home | 存在页面渲染模块；部分按钮可能仅演示 |
| usage | usage | 存在页面渲染模块；部分按钮可能仅演示 |
| scene-list | scene-list | 存在页面渲染模块；部分按钮可能仅演示 |
| scene-block | scene-block | 存在页面渲染模块；部分按钮可能仅演示 |
| report-call | report-call | 存在页面渲染模块；部分按钮可能仅演示 |
| report-billing | report-billing | 存在页面渲染模块；部分按钮可能仅演示 |
| report-clue | report-clue | 存在页面渲染模块；部分按钮可能仅演示 |
| result-records | result-records | 存在页面渲染模块；部分按钮可能仅演示 |
| result-clue | result-clue | 存在页面渲染模块；部分按钮可能仅演示 |
| sys-account | sys-account | 存在页面渲染模块；部分按钮可能仅演示 |
| sys-tenant | sys-tenant | 存在页面渲染模块；部分按钮可能仅演示 |
| sys-channel | sys-channel | 整页占位 |
| sys-scene | sys-scene | 存在页面渲染模块；部分按钮可能仅演示 |
| sys-tags | sys-tags | 存在页面渲染模块；部分按钮可能仅演示 |

附属入口还包含：使用情况的日明细→任务明细；外呼详情/导入/意向配置抽屉；通话详情；线索标签及回访详情；计费明细→单次计费；租户充值及手工调整；标签管理内场景配置和供应商管理。
AI租户充值当前可达showBillingDrawer为统一分钟池与两标签，不能根据旧showLegacyBillingDrawer补回旧功能。列表编辑/批量移除、部分导出与列设置只是禁用/未绑定/提示，不因本版全已有范围转为新增开发。
AI原home和新增统一首页是不同对象，最终入口在页面阶段细化。

## 云呼叫主菜单
| 原路由 | 标题 | 页面模块 |
|---|---|---|
| home | 工作台 | home |
| seat-workbench | 坐席工作台 | seat-workbench |
| customer-directory | 客户档案 | customer-directory |
| customer-tasks | 导入与分配 | customer-tasks |
| business-categories | 业务分类 | business-categories |
| predictive-tasks | 预外呼 | cloud-call-tasks |
| ivr-tasks | 自动外呼 | cloud-call-tasks |
| inbound-service | 呼入服务 | cloud-call-tasks |
| cloud-call-records | 通话记录 | cloud-call-records |
| cloud-overview-report | 通话总览 | report-center |
| cloud-lead-report | 线索成效 | report-center |
| cloud-customer-report | 客户跟进 | report-center |
| cloud-outbound-report | 外呼任务 | report-center |
| cloud-agent-report | 坐席成效 | report-center |
| cloud-inbound-report | 呼入服务 | report-center |
| cloud-skill-report | 服务技能 | report-center |
| accounts | 账号管理 | account-tenant |
| tenants | 租户管理 | account-tenant |
| agent-maintenance | 坐席维护 | agent-center |
| skill-mappings | 技能管理 | contact-center-settings |
| outbound-group-management | 外呼组管理 | outbound-group-management |
| queue-management | 队列管理 | queue-management |
| sync-records | 配置记录 | agent-center |
| numbers | 号码管理 | resource-lines |
| number-pools | 号码池管理 | number-pool-management |
| extensions | 分机管理 | extension-management |
| time-conditions | 时间条件 | time-condition-management |
| alicti-accounts | AliCti 账号管理 | alicti-accounts |
| application-access | 应用接入管理 | application-access |
| event-callbacks | 通话数据异常 | system-center |
| audit | 操作审计 | system-center |

内部入口包括cloud-task-create、cloud-task-center、inbound-routes、agent-skills、seat-event-history、scenario-readiness。manual-outbound/business-fields/lines/number-grants/operations-monitor/call-plans是内部入口或重定向，不重复计作独立主菜单。
本地原型包含演示执行，最终承接仍以v1.1.0最终确认基线对账，不继承旧门禁。

## 原文件定位与摘要

### DCC&AI 外呼/AI 外呼/js/nav.js
SHA256：2dd50fac4876820c18160a4d3c31e36036e51928de0ad9b40e40c13bf4526443
```text
8:   var RouteMap = {
9:     'nav-home':     { page: 'home', bc: [] },
10:     'usage':        { page: 'usage', bc: ['使用情况'] },
11:     'nav-scene':    { page: null, bc: [] },
12:     'scene-list':   { page: 'scene-list', bc: [{ label: '外呼场景', link: 'nav-scene' }, '外呼列表'] },
13:     'scene-block':  { page: 'scene-block', bc: [{ label: '外呼场景', link: 'nav-scene' }, '外呼拦截'] },
14:     'nav-report':   { page: null, bc: [] },
15:     'report-call':  { page: 'report-call', bc: [{ label: '统计分析', link: 'nav-report' }, '通话统计'] },
16:     'report-billing': { page: 'report-billing', bc: [{ label: '统计分析', link: 'nav-report' }, '计费统计'] },
17:     'report-clue':  { page: 'report-clue', bc: [{ label: '统计分析', link: 'nav-report' }, '线索统计'] },
18:     'nav-result':   { page: null, bc: [] },
19:     'result-records': { page: 'result-records', bc: [{ label: '外呼结果', link: 'nav-result' }, '通话记录'] },
20:     'result-clue':  { page: 'result-clue', bc: [{ label: '外呼结果', link: 'nav-result' }, '线索记录'] },
21:     'nav-system':   { page: null, bc: [] },
22:     'sys-account':  { page: 'sys-account', bc: [{ label: '系统管理', link: 'nav-system' }, '账号管理'] },
23:     'sys-tenant':   { page: 'sys-tenant', bc: [{ label: '系统管理', link: 'nav-system' }, '租户管理'] },
24:     'sys-channel':  { page: 'sys-channel', bc: [{ label: '系统管理', link: 'nav-system' }, '通道管理'] },
25:     'sys-scene':    { page: 'sys-scene', bc: [{ label: '系统管理', link: 'nav-system' }, '业务场景'] },
26:     'sys-tags':     { page: 'sys-tags', bc: [{ label: '系统管理', link: 'nav-system' }, '标签管理'] }
27:   };
28: 
29:   var PlaceholderNames = {
30:     'sys-channel': '通道管理'
31:   };
32: 
33:   /* 未实现模块占位 */
34:   Object.keys(PlaceholderNames).forEach(function (key) {
35:     window.Pages = window.Pages || {};
36:     if (!window.Pages[key]) {
37:       window.Pages[key] = {
38:         render: function () {
39:           return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;color:#999;">' +
40:             '<div style="font-size:48px;opacity:.5">🚧</div>' +
41:             '<div style="font-size:16px;font-weight:500">「' + PlaceholderNames[key] + '」功能正在开发中</div>' +
42:             '<div style="font-size:13px;color:#bbb">请查看已完成的「外呼列表」等模块</div>' +
43:             '</div>';
44:         },
45:         init: function () {}
46:       };
47:     }
48:   });
```

### DCC&AI 外呼/AI 外呼/index.html
SHA256：8384a854a30f6a218a798aec7327db0efaafec1aba691ec3c6b375f89177c033
```text
38:         <span class="user-name">产品-超管</span>
39:       </div>
40:       <div class="user-dropdown-menu" id="userDropdownMenu">
41:         <div class="user-dropdown-item" onclick="window.showAccountInfoModal()">
42:           <span class="user-item-icon">🔧</span>
43:           <span class="user-item-text">账号信息</span>
44:         </div>
45:         <button class="user-dropdown-item" id="usageEntry" data-anno="usage-header-entry" data-anno-page="index" data-anno-label="当前租户使用情况入口" data-anno-kind="action" data-anno-fields="FLD-033,FLD-073" onclick="window.navigateToUsage()" style="display:none;">
46:           <span class="user-item-icon">◴</span>
47:           <span class="user-item-text">使用情况</span>
48:         </button>
49:         <div class="user-dropdown-item" onclick="window.doLogout()">
50:           <span class="user-item-icon">🚪</span>
51:           <span class="user-item-text">退出登录</span>
52:         </div>
53:       </div>
54:     </div>
55:   </div>
56: </div>
57: 
58: <div class="main-layout">
59:   <aside class="sidebar">
60:     <div class="sidebar-logo">
61:       <svg width="20" height="20" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">
62:         <path d="M64 12L116 64L64 116L12 64L64 12Z" stroke="#1677ff" stroke-width="12" fill="none"></path>
63:         <path d="M64 36L92 64L64 92L36 64L64 36Z" fill="#ff4d4f"></path>
64:       </svg>
65:       <span class="logo-text">智能外呼</span>
66:     </div>
67: 
68:     <div class="nav-item" id="nav-home" onclick="window.Nav.setActive(this)">
69:       <div class="nav-item-inner"><span class="label">首页</span></div>
70:     </div>
71: 
72:     <div class="nav-item" id="nav-scene" onclick="window.Nav.toggleMenu(this,'scene')">
73:       <div class="nav-item-inner"><span class="label">外呼场景</span></div>
74:       <span class="arrow">▾</span>
75:     </div>
76:     <div class="nav-sub" id="sub-scene">
77:       <div class="nav-sub-item" id="scene-list" onclick="window.Nav.selectSubMenu(this,'外呼列表')">外呼列表</div>
78:       <div class="nav-sub-item" id="scene-block" onclick="window.Nav.selectSubMenu(this,'外呼拦截')">外呼拦截</div>
79:     </div>
80: 
81:     <div class="nav-item" id="nav-report" onclick="window.Nav.toggleMenu(this,'report')">
82:       <div class="nav-item-inner"><span class="label">统计分析</span></div>
83:       <span class="arrow">▾</span>
84:     </div>
85:     <div class="nav-sub" id="sub-report">
86:       <div class="nav-sub-item" id="report-call" onclick="window.Nav.selectSubMenu(this,'通话统计')">通话统计</div>
87:       <div class="nav-sub-item" id="report-billing" onclick="window.Nav.selectSubMenu(this,'计费统计')">计费统计</div>
88:       <div class="nav-sub-item" id="report-clue" onclick="window.Nav.selectSubMenu(this,'线索统计')">线索统计</div>
89:     </div>
90: 
91:     <div class="nav-item" id="nav-result" onclick="window.Nav.toggleMenu(this,'result')">
92:       <div class="nav-item-inner"><span class="label">外呼结果</span></div>
93:       <span class="arrow">▾</span>
94:     </div>
95:     <div class="nav-sub" id="sub-result">
96:       <div class="nav-sub-item" id="result-records" onclick="window.Nav.selectSubMenu(this,'通话记录')">通话记录</div>
97:       <div class="nav-sub-item" id="result-clue" onclick="window.Nav.selectSubMenu(this,'线索记录')">线索记录</div>
98:     </div>
99: 
100:     <div class="nav-item" id="nav-system" onclick="window.Nav.toggleMenu(this,'system')">
101:       <div class="nav-item-inner"><span class="label">系统管理</span></div>
102:       <span class="arrow">▾</span>
103:     </div>
104:     <div class="nav-sub" id="sub-system">
105:       <div class="nav-sub-item" id="sys-account" onclick="window.Nav.selectSubMenu(this,'账号管理')">账号管理</div>
106:       <div class="nav-sub-item" id="sys-tenant" onclick="window.Nav.selectSubMenu(this,'租户管理')">租户管理</div>
107:       <div class="nav-sub-item" id="sys-channel" onclick="window.Nav.selectSubMenu(this,'通道管理')">通道管理</div>
108:       <div class="nav-sub-item" id="sys-scene" onclick="window.Nav.selectSubMenu(this,'业务场景')">业务场景</div>
109:       <div class="nav-sub-item" id="sys-tags" onclick="window.Nav.selectSubMenu(this,'标签管理')">标签管理</div>
110:     </div>
111:   </aside>
112: 
113:   <div class="content-area" id="page-content" style="flex:1;overflow:hidden;display:flex;flex-direction:column;min-height:0;background:#f0f2f5;"></div>
```

### DCC&AI 外呼/AI 外呼/js/pages/sys-tenant.js
SHA256：82d4a2a0cca44fadd76dc1c3a70b95d499de4c3099d4f976ebc935466d337a8c
```text
1340:         '<td>' + escapeHtmlText(value) + (r.mode === 'clear_duration' ? '<br>全部调减至0' : '') + '</td>' +
1341:         '<td>' + escapeHtmlText(before) + '<br>→ ' + escapeHtmlText(after) + '</td>' +
1342:         '<td class="record-service-range">' + range(r.beforeStartAt, r.beforeEndAt) + '</td>' +
1343:         '<td class="record-service-range">' + range(r.afterStartAt, r.afterEndAt) + '</td>' +
1344:         '<td class="tenant-record-reason">' + escapeHtmlText(r.reason) + '</td>' +
1345:         '<td title="' + escapeHtmlAttr(r.operatorAccountId || '账号 ID 未保存') + '">' + escapeHtmlText(S.operatorText(r)) + '</td>' +
1346:         '<td>' + escapeHtmlText(r.operatedAt) + '</td><td>' + rechargeStatusTag(r.status) + '</td></tr>';
1347:     }).join('');
1348:   }
1349: 
1350:   function renderRechargeDrawerContent(profile) {
1351:     var entitlement = profile.entitlement || {};
1352:     var currentProduct = (getRechargeIteration().products || {})[entitlement.productType];
1353:     var pool = profile.unifiedMinutePool || {};
1354:     var serviceMeta = serviceStatusMeta(window.RechargeService.status(entitlement));
1355:     if (profile.rechargeState === 'error') {
1356:       return '<div class="tenant-recharge-error" data-anno="recharge-load-error" data-anno-page="sys-tenant" data-anno-label="充值管理加载失败与重试" data-anno-kind="region" data-anno-fields="FLD-010,FLD-004">' +
1357:         '<div class="tenant-state-icon">!</div><strong>充值账户加载失败</strong><p>当前为异常演示状态，未覆盖或伪造账户数据。</p>' +
1358:         '<button class="btn btn-primary" onclick="window.Pages[\'sys-tenant\'].retryRechargeOverview(\'' + profile.id + '\')">重新加载</button>' +
1359:       '</div>';
1360:     }
1361:     return '' +
1362:       '<div class="tenant-account-overview" data-anno="recharge-account-overview" data-anno-page="sys-tenant" data-anno-label="租户服务与统一分钟池概览" data-anno-kind="region" data-anno-fields="FLD-005,FLD-051,FLD-009,FLD-010,FLD-011,FLD-004,FLD-022">' +
1363:         '<div class="tenant-account-card service"><span>' + escapeHtmlText(currentProduct ? currentProduct.name : '未开通套餐') + ' · 服务状态</span><strong><em class="tenant-service-status ' + serviceMeta.cls + '">' + serviceMeta.text + '</em></strong><small>' + iterationValidity(profile) + '</small></div>' +
1364:         '<div class="tenant-account-card primary"><span>可用分钟</span><strong>' + formatWholeMinutes(pool.availableMinutes) + '</strong><small>大/小模型共用</small></div>' +
1365:         '<div class="tenant-account-card"><span>冻结分钟</span><strong>' + formatWholeMinutes(pool.frozenMinutes) + '</strong><small>任务预占，不可手工扣减</small></div>' +
1366:         '<div class="tenant-account-card"><span>累计消耗</span><strong>' + formatWholeMinutes(pool.consumedMinutes) + '</strong><small>仅统计已接通结算</small></div>' +
1367:       '</div>' +
1368:       '<div class="tenant-recharge-actions">' +
1369:         (rechargeTypesForProfile(profile).includes('trial_package') ? '<button class="btn btn-primary" data-anno="recharge-trial-entry" data-anno-page="sys-tenant" data-anno-label="试用套餐开通入口" data-anno-kind="action" data-anno-fields="FLD-005,FLD-010,FLD-014,FLD-016" onclick="window.Pages[\'sys-tenant\'].openRechargeForm(\'trial_package\')">+ 开通试用套餐</button>' : '') +
1370:         (rechargeTypesForProfile(profile).includes('standard_annual') ? '<button class="btn btn-primary" data-anno="recharge-standard-entry" data-anno-page="sys-tenant" data-anno-label="标准版年包充值入口" data-anno-kind="action" data-anno-fields="FLD-005,FLD-010,FLD-014,FLD-016" onclick="window.Pages[\'sys-tenant\'].openRechargeForm(\'standard_annual\')">+ 标准版开通</button>' : '') +
1371:         (rechargeTypesForProfile(profile).includes('call_credit_pack') ? '<button class="btn btn-default" data-anno="recharge-pack-entry" data-anno-page="sys-tenant" data-anno-label="话费充值包入口" data-anno-kind="action" data-anno-fields="FLD-005,FLD-010,FLD-014,FLD-019,FLD-016" onclick="window.Pages[\'sys-tenant\'].openRechargeForm(\'call_credit_pack\')">+ 话费充值包</button>' : '') +
1372:         '<button class="btn btn-default" data-anno="adjustment-entry" data-anno-page="sys-tenant" data-anno-label="手工调增调减入口" data-anno-kind="action" data-anno-fields="FLD-035,FLD-036,FLD-037" onclick="window.Pages[\'sys-tenant\'].openIterationAdjustmentForm()">手工调整</button>' +
1373:       '</div>' +
1374:       '<div class="tenant-billing-tabs" role="tablist">' +
1375:         '<button class="tenant-billing-tab active" role="tab" data-tab="internal" onclick="window.Pages[\'sys-tenant\'].switchBillingTab(\'internal\')">内部充值记录</button>' +
1376:         '<button class="tenant-billing-tab" role="tab" data-tab="adjustment" onclick="window.Pages[\'sys-tenant\'].switchBillingTab(\'adjustment\')">手工调整流水</button>' +
1377:       '</div>' +
1378:       '<div class="tenant-billing-tab-panel active" data-panel="internal" role="tabpanel">' +
1379:         '<div class="tenant-record-table-wrap" data-anno="internal-recharge-table" data-anno-page="sys-tenant" data-anno-label="内部充值流水" data-anno-kind="region" data-anno-fields="FLD-024,FLD-066,FLD-067,FLD-031,FLD-054,FLD-068">' +
1380:           '<table class="tenant-record-table"><thead><tr><th>内部流水号</th><th>充值类型</th><th>数量</th><th>价格</th><th>实际开始时间</th><th>实际结束时间</th><th>入账分钟</th><th>调整前后</th><th data-anno="recharge-operator-column" data-anno-page="sys-tenant" data-anno-label="流水操作账号" data-anno-kind="field" data-anno-fields="FLD-031,FLD-054">操作人（账号名）</th><th>操作时间</th><th>原因</th><th>状态</th></tr></thead><tbody>' + renderInternalRechargeRows(profile) + '</tbody></table>' +
1381:         '</div>' +
1382:       '</div>' +
1383:       '<div class="tenant-billing-tab-panel" data-panel="adjustment" role="tabpanel">' +
1384:         '<div class="tenant-record-table-wrap" data-anno="manual-adjustment-table" data-anno-page="sys-tenant" data-anno-label="手工调整流水" data-anno-kind="region" data-anno-fields="FLD-024,FLD-035,FLD-036,FLD-037,FLD-038,FLD-056,FLD-057,FLD-066,FLD-067,FLD-031,FLD-054,FLD-068">' +
1385:           '<table class="tenant-record-table"><thead><tr><th>调整单号</th><th>方向</th><th>对象</th><th>调整值</th><th>调整前后</th><th>调整前服务区间</th><th>调整后服务区间</th><th>原因</th><th>操作人（账号名）</th><th>生效时间</th><th>状态</th></tr></thead><tbody>' + renderIterationAdjustmentRows(profile) + '</tbody></table>' +
1386:         '</div>' +
1387:       '</div>';
1388:   }
1389: 
1390:   function showBillingDrawer(tenantName) {
1391:     if (!requireTenantBillingPermission()) return;
1392:     var tenantBase = getTenantRows().find(function (item) { return normalizeTenantName(item.name) === normalizeTenantName(tenantName); });
1393:     var profile = getTenantIterationProfile(tenantBase || tenantName, true);
1394:     var flagText = profile.commercialFlag === 'commercial' ? '商用' : '试用';
1395:     var html = '' +
```

### Demo_Protype_2/prototype/js/nav.js
SHA256：995ec5cd8d6bdb8200b44af10f3e75ab9e752835eb28dcc023ed0582e834297b
```text
1: /** 统一外呼中台：单一产品壳、按角色/能力裁剪的完整导航。 */
2: (function () {
3:   'use strict';
4:   window.Pages = window.Pages || {};
5: 
6:   const menu = [
7:     { key: 'home', label: '工作台', icon: '工', permission: 'home' },
8:     { key: 'seat-workbench', page: 'seat-workbench', label: '坐席工作台', icon: '席', permission: 'cloud.tasks', domain: 'CLOUD_CONTACT_CENTER', requiresSeat: true },
9:     { key: 'customers', label: '客户管理', icon: '客', permission: 'cloud.view', domain: 'CLOUD_CONTACT_CENTER', children: [
10:       { key: 'customer-directory', page: 'customer-directory', label: '客户档案', permission: 'cloud.tasks' },
11:       { key: 'customer-tasks', page: 'customer-tasks', label: '导入与分配', permission: 'cloud.tasks' },
12:       { key: 'business-categories', page: 'business-categories', label: '业务分类', permission: 'settings.business' }
13:     ] },
14:     { key: 'cloud', label: '云呼叫', icon: '云', permission: 'cloud.view', domain: 'CLOUD_CONTACT_CENTER', children: [
15:       { key: 'predictive-tasks', page: 'cloud-call-tasks', label: '预外呼', permission: 'cloud.tasks', view: 'predictive' },
16:       { key: 'ivr-tasks', page: 'cloud-call-tasks', label: '自动外呼', permission: 'cloud.tasks', view: 'ivr' },
17:       { key: 'inbound-service', page: 'cloud-call-tasks', label: '呼入服务', permission: 'cloud.tasks', view: 'inbound' }
18:     ] },
19:     { key: 'records', label: '通话记录', icon: '话', children: [
20:       { key: 'cloud-call-records', page: 'cloud-call-records', label: '通话记录', permission: 'records.cloud', view: 'records', domain: 'CLOUD_CONTACT_CENTER' },
21:     ] },
22:     { key: 'reports', label: '统计报表', icon: '表', children: [
23:       { key: 'cloud-overview-report', page: 'report-center', label: '通话总览', permission: 'reports.cloud', view: 'overview', domain: 'CLOUD_CONTACT_CENTER' },
24:       { key: 'cloud-lead-report', page: 'report-center', label: '线索成效', permission: 'reports.cloud', view: 'leads', domain: 'CLOUD_CONTACT_CENTER' },
25:       { key: 'cloud-customer-report', page: 'report-center', label: '客户跟进', permission: 'reports.cloud', view: 'customers', domain: 'CLOUD_CONTACT_CENTER' },
26:       { key: 'cloud-outbound-report', page: 'report-center', label: '外呼任务', permission: 'reports.cloud', view: 'outbound', domain: 'CLOUD_CONTACT_CENTER' },
27:       { key: 'cloud-agent-report', page: 'report-center', label: '坐席成效', permission: 'reports.cloud', view: 'agents', domain: 'CLOUD_CONTACT_CENTER' },
28:       { key: 'cloud-inbound-report', page: 'report-center', label: '呼入服务', permission: 'reports.cloud', view: 'inbound', domain: 'CLOUD_CONTACT_CENTER' },
29:       { key: 'cloud-skill-report', page: 'report-center', label: '服务技能', permission: 'reports.cloud', view: 'skills', domain: 'CLOUD_CONTACT_CENTER' }
30:     ] },
31:     { key: 'account-tenant', label: '账号与租户', icon: '户', children: [
32:       { key: 'accounts', page: 'account-tenant', label: '账号管理', permission: 'accounts', view: 'accounts' },
33:       { key: 'tenants', page: 'account-tenant', label: '租户管理', permission: 'tenants', view: 'tenants' }
34:     ] },
35:     { key: 'agents', label: '坐席与技能', icon: '席', domain: 'CLOUD_CONTACT_CENTER', children: [
36:       { key: 'agent-maintenance', page: 'agent-center', label: '坐席维护', permission: 'agents.manage', view: 'agents' },
37:       { key: 'skill-mappings', page: 'contact-center-settings', label: '技能管理', permission: 'settings.skills', view: 'skill-mappings' },
38:       { key: 'outbound-group-management', page: 'outbound-group-management', label: '外呼组管理', permission: 'agents.manage' },
39:       { key: 'queue-management', page: 'queue-management', label: '队列管理', icon: '队', domain: 'CLOUD_CONTACT_CENTER', permission: 'settings.queues' },
40:       { key: 'sync-records', page: 'agent-center', label: '配置记录', permission: 'agents.sync', view: 'sync' }
41:     ] },
42:     { key: 'system', label: '系统管理', icon: '设', domain: 'CLOUD_CONTACT_CENTER', children: [
43:       { key: 'numbers', page: 'resource-lines', label: '号码管理', icon: '号', domain: 'CLOUD_CONTACT_CENTER', permission: 'resources.numbers', view: 'numbers' },
44:       { key: 'number-pools', page: 'number-pool-management', label: '号码池管理', icon: '池', domain: 'CLOUD_CONTACT_CENTER', permission: 'settings.numberPools' },
45:       { key: 'extensions', page: 'extension-management', label: '分机管理', icon: '机', domain: 'CLOUD_CONTACT_CENTER', permission: 'resources.extensions' },
46:       { key: 'time-conditions', page: 'time-condition-management', label: '时间条件', icon: '时', domain: 'CLOUD_CONTACT_CENTER', permission: 'settings.times' },
47:       { key: 'alicti-accounts', page: 'alicti-accounts', label: 'AliCti 账号管理', permission: 'system.instances' },
48:       { key: 'application-access', page: 'application-access', label: '应用接入管理', permission: 'system.applications' },
49:       { key: 'event-callbacks', page: 'system-center', label: '通话数据异常', permission: 'system.events', view: 'events' },
50:       { key: 'audit', page: 'system-center', label: '操作审计', permission: 'system.audit', view: 'audit' }
51:     ] }
52:   ];
53: 
54:   const routes = {};
55:   const expanded = new Set(['cloud']);
56:   menu.forEach(group => {
57:     if (!group.children) routes[group.key] = { ...group, page: group.page || group.key, breadcrumb: [group.label] };
58:     (group.children || []).filter(item => item.type !== 'section').forEach(item => { routes[item.key] = { ...item, domain: item.domain || group.domain, breadcrumb: [group.label, item.label], parent: group.key }; });
59:   });
60:   // 不作为独立菜单；保留场景内检查及配置返回路径的权限校验。
61:   routes['application-access'].breadcrumb = ['系统设置', '应用接入管理'];
62:   routes['agent-skills'] = { key: 'agent-skills', page: 'agent-center', label: '坐席分组与等级', permission: 'agents.manage', domain: 'CLOUD_CONTACT_CENTER', view: 'skills', parent: 'agents', breadcrumb: ['坐席与技能', '技能管理', '坐席分组与等级'], internal: true };
63:   // Historical line-management bookmarks now open number management.
64:   routes['lines'] = { key: 'lines', page: 'resource-lines', permission: 'resources.numbers', domain: 'CLOUD_CONTACT_CENTER', internal: true, redirect: 'numbers' };
65:   routes['number-grants'] = { key: 'number-grants', page: 'resource-lines', permission: 'resources.numbers', domain: 'CLOUD_CONTACT_CENTER', internal: true, redirect: 'numbers' };
66:   // Field management remains a tab inside the business-category module.
67:   routes['business-fields'] = { key: 'business-fields', page: 'business-categories', permission: 'settings.business', domain: 'CLOUD_CONTACT_CENTER', internal: true, redirect: 'business-categories' };
68:   routes['scenario-readiness'] = { key: 'scenario-readiness', page: 'scenario-readiness', label: '场景检查', permission: 'cloud.tasks', domain: 'CLOUD_CONTACT_CENTER', breadcrumb: ['云呼叫', '场景检查'], internal: true };
69:   routes['operations-monitor'] = {page:'home',permission:'home',domain:'CLOUD_CONTACT_CENTER',internal:true,redirect:'home'};
70:   routes['manual-outbound'] = {page:'seat-workbench',permission:'cloud.tasks',domain:'CLOUD_CONTACT_CENTER',internal:true,redirect:'seat-workbench'};
71:   routes['cloud-task-create'] = { key: 'cloud-task-create', page: 'cloud-task-workspace', label: '创建任务', permission: 'cloud.tasks', domain: 'CLOUD_CONTACT_CENTER', breadcrumb: ['云呼叫', '创建任务'], internal: true };
72:   routes['cloud-task-center'] = { key: 'cloud-task-center', page: 'cloud-task-center', label: '任务中心', permission: 'cloud.tasks', domain: 'CLOUD_CONTACT_CENTER', breadcrumb: ['云呼叫', '任务中心'], internal: true };
73:   routes['seat-event-history'] = { key: 'seat-event-history', page: 'seat-event-history', label: '全部坐席事件', permission: 'cloud.tasks', domain: 'CLOUD_CONTACT_CENTER', breadcrumb: ['坐席工作台', '班长监控', '全部坐席事件'], internal: true };
74: 
75:   routes['call-plans']={page:'cloud-call-tasks',permission:'settings.plans',domain:'CLOUD_CONTACT_CENTER',internal:true,redirect:'manual-outbound'};
76:   routes['inbound-routes']={page:'inbound-routing',permission:'settings.routes',domain:'CLOUD_CONTACT_CENTER',internal:true,breadcrumb:['云呼叫','呼入服务','呼入规则']};
77: 
78:   function operatorWorkbench() {
```
