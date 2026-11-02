# 本地原型证据摘录

采集时间：2026-10-15T17:10:48+08:00。只读摘录；原型与Mock只能证明本地演示，不能证明生产认证、资源执行或供应商回执。

## DCC&AI 外呼/AI 外呼/index.html
原文件 SHA-256：`8384a854a30f6a218a798aec7327db0efaafec1aba691ec3c6b375f89177c033`

行 38–53
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
```

行 68–115
```text
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
114: </div>
115: 
```

## DCC&AI 外呼/AI 外呼/js/nav.js
原文件 SHA-256：`2dd50fac4876820c18160a4d3c31e36036e51928de0ad9b40e40c13bf4526443`

行 8–48
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

## DCC&AI 外呼/AI 外呼/js/app.js
原文件 SHA-256：`df26d319b46e48c10be8bbc93f778d0dea29294d3ca5f0a9928c20c3ad64fee0`

行 309–318
```text
309:       showLoginPage();
310:       if (window.showToast) window.showToast('已安全退出登录', 'info');
311:     }
312:   }
313: 
314:   /* ===== 全屏登录页逻辑（无需校验，直接登录进入首页） ===== */
315:   function showLoginPage() {
316:     var overlay = document.getElementById('loginOverlay');
317:     if (overlay) {
318:       overlay.style.display = 'flex';
```

行 378–395
```text
378:       ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
379:       ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
380:       ctx.stroke();
381:     }
382:   }
383: 
384:   function doLoginSubmit() {
385:     hideLoginPage();
386:     if (window.Nav && window.Nav.init) {
387:       window.Nav.init();
388:     }
389:     if (window.showToast) {
390:       window.showToast('登录成功，欢迎来到智能外呼中台！', 'success');
391:     }
392:   }
393: 
394:   // 点击页面外部区域关闭用户菜单
395:   document.addEventListener('click', function(e) {
```

## DCC&AI 外呼/AI 外呼/js/pages/sys-account.js
原文件 SHA-256：`06c01e6046eea4e6790ddb4cdef8f3805eabcc226b6a1a934d9bc5de6acedd37`

行 39–55
```text
39:   function getAccounts() {
40:     window.MockAccountRows = window.MockAccountRows || [];
41:     return window.MockAccountRows;
42:   }
43: 
44:   function getTenantAccountCount(tenantName) {
45:     return getAccounts().filter(function (a) {
46:       return a.tenantName === tenantName;
47:     }).length;
48:   }
49: 
50:   function getFilteredAccounts() {
51:     var list = getAccounts().filter(function (a) {
52:       return a.tenantName === selectedTenantName;
53:     });
54:     if (filterPhone) {
55:       list = list.filter(function (a) {
```

行 495–520
```text
495:       if (userErr) { userErr.textContent = '账号已存在，请重新输入'; userErr.style.display = 'block'; }
496:       if (usernameInput) usernameInput.focus();
497:       return;
498:     }
499: 
500:     var nowStr = formatCurrentDateTime();
501: 
502:     if (currentEditingAccountId) {
503:       var row = getAccounts().find(function (a) { return String(a.id) === String(currentEditingAccountId); });
504:       if (row) {
505:         row.tenantName = tenantName;
506:         row.avatar = currentAvatarDataUrl || row.avatar;
507:         row.username = username;
508:         row.nickname = nickname;
509:         row.phone = phone;
510:         if (password) row.password = password;
511:         row.role = role;
512:         row.status = status;
513:         row.updater = 'xtadmin';
514:         row.updateTime = nowStr;
515:       }
516:       closeAccountFormModal();
517:       refreshTable();
518:       showToast('账号信息已更新', 'success');
519:     } else {
520:       var maxId = getAccounts().reduce(function (max, a) { return Math.max(max, Number(a.id) || 0); }, 0);
```

## DCC&AI 外呼/AI 外呼/docs/功能说明文档.md
原文件 SHA-256：`438d626c11c6d4ab1b70f3e2a435d0f2eff7adb2670dcaf3218696aab355d91f`

行 296–305
```text
296: ### 8. 统计分析 - 通话统计与计费统计
297: 
298: **1）功能名称：** 通话全量多维指标统计与消费成本账单  
299: **2）交互说明：**  
300: - **通话统计**：提供「外呼统计」（以场景/任务维度统计 10 项指标）与「客户统计」（以客户/平台维度统计 7 项指标）双 Tab；支持按时间范围、智能平台筛选；  
301: - **计费统计**：顶部展示消费概览卡片（总消费金额、总通话次数、一知费用、中科金费用、电声费用等）；下方展示计费明细表（呼叫时间、场景名、平台、通话时长、单价、通话次数、消费金额、模型类型）。  
302: **3）数据来源：** 中台账单与话单聚合引擎。  
303: **4）逻辑说明：** 本节为独立的供应商成本统计，沿用其账单与计费配置，不参与租户充值余额换算或分钟扣减。租户余额、冻结和消耗只按统一分钟池计算，详见五.4；账户下拉的“使用情况”不展示模型字段。
304: **5）功能明细：**
305: 
```

行 397–409
```text
397: | 弹窗-头像上传 | 维护账号个性化头像 | 本地文件 | 支持图片本地预览与删除 | 80x80 容器 | 默认加号 | 上传非图片格式拦截提示 |
398: | 弹窗-账号标识 | 用户登录系统的唯一账号 ID | 用户输入 | 字母/数字/符号组合 | 文本 | -- | 编辑模式只读，重名拦截 |
399: | 弹窗-账号昵称 | 系统内展示的友好称谓 | 用户输入 | 0~20 字符，右侧内嵌实时计数 | 文本 | -- | 为空或超长拦截并标红 |
400: | 弹窗-手机号码 | 绑定安全与通知手机 | 用户输入 | 11 位数字，右侧内嵌实时计数 | 文本 | -- | 格式不合规时拦截提示 |
401: | 弹窗-登录密码 | 设置初始密码或重置密码 | 用户输入 | 8~16 位大小写字母/数字/符号 | 密文/明文 | -- | 右侧眼睛图标自由切换可见性 |
402: | 弹窗-角色单选 | 分配租户级管理或运营权限 | 用户选择 | 租户管理员 / 租户运营 | Radio 组 | 租户管理员 | 必须选择其一 |
403: | 弹窗-状态单选 | 控制账号能否正常登录系统 | 用户选择 | 启用 / 禁用 | Radio 组 | 启用 | 禁用后该账号无法登录系统 |
404: 
405: ---
406: 
407: ### 13. 系统管理 - 租户管理与属性筛选
408: 
409: **1）功能名称：** 租户资料、商用/试用标记和服务状态管理。
```

行 705–723
```text
705: ### 7. 统一角色权限说明（唯一维护出处）
706: 
707: 本节是项目角色权限范围的唯一维护出处。其他功能章节、项目记忆和页面标注只引用本节，不重复维护角色权限全文。
708: 
709: | 角色 | 数据范围 | 可处理范围 | 不具备权限 |
710: | :--- | :--- | :--- | :--- |
711: | **超级管理员** | 管理权限内的全部租户数据 | 跨租户管理，以及账号、租户、线路、标签等系统管理；租户管理整个菜单和页面（含创建、编辑、删除、充值、手工调增调减）仅超管可用 | 本次充值迭代不提供租户自助“使用情况”及按日/任务消耗明细 |
712: | **租户管理员** | 本租户数据 | 本租户下业务与账号管理；本次充值迭代可查看当前登录租户的使用情况 | 跨租户数据、租户管理整个菜单和页面（含创建、编辑、删除、充值、手工调增调减）及其他全局系统配置 |
713: | **租户运营** | 本租户数据 | 外呼场景（外呼列表、外呼拦截、业务场景）、统计报表、通话记录和线索记录；可维护本人账号信息 | 账号创建与管理、租户创建与管理、线路管理、标签管理及其他未列明的系统管理功能 |
714: 
715: > **正式规则与演示差异（2026-09-05确认）**：租户管理是超级管理员专属菜单，非超管不应拥有该菜单或页面的正式访问权限。当前原型仍未完整实现租户管理菜单隐藏、页面访问拦截及全部操作隔离，因此普通/多租户演示账号可能看到租户列表或管理操作入口；这只是原型展示限制，不是权限授权。本次按用户确认保留现状，仅补充说明，不改权限代码。
716: 
717: > **已实现范围**：本次已为创建租户、充值、手工调增调减增加超管操作校验，并对使用情况限制为当前登录租户用户；超管无使用情况入口，直接访问也被拦截。不能据此宣称整个租户管理页面、编辑/删除及其他菜单已经完成鉴权。真实系统应在菜单、路由和服务端接口落实本节权限。
718: 
719: > **首页只读规则（SRC-001）**：无充值权限的“其他管理员”演示账号绑定当前渝发，可在首页查看该授权租户套餐、有效期和可用分钟；不获得创建、充值、手工调整或使用明细权限。普通/多租户用户仍只看当前租户；缺有效租户上下文时提示不可用，不回退到其他租户。超级管理员仍为平台工作台。
720: 
721: ---
722: 
723: ### 8. 充值迭代现行规则与原型差异
```

## DCC&AI 外呼/AI 外呼/js/pages/sys-tags.js
原文件 SHA-256：`6eb352195dc50af2dae1b627ef179dc98555f79cd8bbcd427cddfd9968217232`

行 62–72
```text
62:     return '<div class="tags-toolbar" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#fff;border-bottom:1px solid #e8e8e8;">' +
63:       '<div style="display:flex;align-items:center;gap:12px;">' +
64:         '<span style="font-size:15px;font-weight:600;">📋 意向标签配置</span>' +
65:       '</div>' +
66:       '<div style="display:flex;gap:8px;">' +
67:         '<button class="btn-scene-mgr" data-anno-page="sys-tags" data-anno-label="标签场景配置" data-anno-kind="action" style="padding:6px 16px;background:#fff;border:1px solid #d9d9d9;border-radius:4px;cursor:pointer;font-size:13px;" onclick="window.Pages[\'sys-tags\'].openSceneModal()">⚙ 场景配置</button>' +
68:         '<button class="btn-supplier-mgr" data-anno-page="sys-tags" data-anno-label="标签供应商管理" data-anno-kind="action" style="padding:6px 16px;background:#fff;border:1px solid #d9d9d9;border-radius:4px;cursor:pointer;font-size:13px;" onclick="window.Pages[\'sys-tags\'].openSupplierModal()">🏢 供应商管理</button>' +
69:       '</div>' +
70:     '</div>';
71:   }
72: 
```

行 300–337
```text
300:   function buildSceneModalHTML() {
301:     var html = '<div class="modal-overlay" id="scene-modal-overlay" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.45);z-index:5500;align-items:center;justify-content:center;">';
302:     html += '<div class="modal-content" style="background:#fff;border-radius:8px;width:600px;max-height:70vh;display:flex;flex-direction:column;box-shadow:0 4px 24px rgba(0,0,0,0.15);">';
303:     html += '<div class="modal-header" style="padding:16px 20px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;">';
304:     html += '<span style="font-size:16px;font-weight:600;">⚙ 场景配置</span>';
305:     html += '<button class="btn-close-modal" onclick="window.Pages[\'sys-tags\'].closeSceneModal()" style="background:none;border:none;font-size:18px;cursor:pointer;color:#999;padding:0;">✕</button>';
306:     html += '</div>';
307:     html += '<div class="modal-body" id="scene-modal-body" style="flex:1;overflow-y:auto;padding:20px;">';
308:     html += buildSceneTableHTML();
309:     html += '</div>';
310:     html += '<div class="modal-footer" style="padding:12px 20px;border-top:1px solid #f0f0f0;text-align:right;">';
311:     html += '<button class="btn-add-scene" style="padding:6px 16px;background:#1677ff;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;">+ 新增场景</button>';
312:     html += '</div>';
313:     html += '</div></div>';
314:     return html;
315:   }
316: 
317:   function buildSceneTableHTML() {
318:     var html = '<table class="data-table" style="width:100%;border-collapse:collapse;">';
319:     html += '<thead><tr><th style="width:60px;">序号</th><th style="width:130px;">本地编码</th><th>场景名称</th><th style="width:80px;">状态</th><th style="width:100px;">操作</th></tr></thead>';
320:     html += '<tbody>';
321:     MockTagScenes.forEach(function(sc, idx) {
322:       var statusColor = sc.status === 'enabled' ? '#52c41a' : '#d9d9d9';
323:       var statusText = sc.status === 'enabled' ? '启用' : '停用';
324:       html += '<tr data-scene-id="' + sc.id + '">';
325:       html += '<td style="color:#999;">' + (idx + 1) + '</td>';
326:       html += '<td><code class="local-code-text">' + escapeHTML(sc.localCode || sc.id) + '</code></td>';
327:       html += '<td><span class="scene-name-display">' + escapeHTML(sc.name) + '</span>';
328:       html += '<input type="text" class="scene-name-input" value="' + escapeHTML(sc.name) + '" style="display:none;width:100%;padding:4px 8px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;"></td>';
329:       html += '<td><span style="color:' + statusColor + ';">● ' + statusText + '</span></td>';
330:       html += '<td>';
331:       html += '<button class="btn-scene-edit" data-scene-id="' + sc.id + '" style="padding:3px 10px;font-size:12px;border:1px solid #d9d9d9;background:#fff;border-radius:3px;cursor:pointer;margin-right:4px;">✏</button>';
332:       html += '<button class="btn-scene-save" data-scene-id="' + sc.id + '" style="display:none;padding:3px 10px;font-size:12px;background:#52c41a;color:#fff;border:none;border-radius:3px;cursor:pointer;margin-right:4px;">✓</button>';
333:       html += '<button class="btn-scene-cancel" data-scene-id="' + sc.id + '" style="display:none;padding:3px 10px;font-size:12px;border:1px solid #d9d9d9;background:#fff;border-radius:3px;cursor:pointer;margin-right:4px;">✕</button>';
334:       html += '<button class="btn-scene-toggle" data-scene-id="' + sc.id + '" style="padding:3px 10px;font-size:12px;border:1px solid #faad14;color:#faad14;background:#fff;border-radius:3px;cursor:pointer;margin-right:4px;">' + (sc.status === 'enabled' ? '停用' : '启用') + '</button>';
335:       html += '<button class="btn-scene-delete" data-scene-id="' + sc.id + '" style="padding:3px 10px;font-size:12px;border:1px solid #ff4d4f;color:#ff4d4f;background:#fff;border-radius:3px;cursor:pointer;">🗑</button>';
336:       html += '</td>';
337:       html += '</tr>';
```

## DCC&AI 外呼/AI 外呼/js/pages/usage.js
原文件 SHA-256：`0bc1b55709c4ddbb59517f3d2550c46ed4efc41ed36a2550113c268b5b21655f`

行 111–146
```text
111:   function renderTaskDetailForTenant(date, requestedTenantId) {
112:     var auth = getAuth();
113:     if (!auth || auth.role !== 'tenant_user' || !auth.currentTenantId) return renderUnauthorized();
114:     if (requestedTenantId && String(requestedTenantId) !== String(auth.currentTenantId)) return renderUnauthorized();
115:     var tenant = getCurrentTenant();
116:     if (!tenant) return renderUnauthorized();
117:     var daily = getDailySummary(tenant.id, date);
118:     if (!daily) return renderTaskDetailState(tenant, date, 'empty', '所选日期没有当前租户的日汇总记录，未生成伪任务数据。');
119:     if (getTaskDetailState(tenant.id, date) === 'error') return renderTaskDetailState(tenant, date, 'error', '当前为异常演示状态，未返回或拼接其他租户任务。');
120:     if (getTaskDetailState(tenant.id, date) === 'loading') return renderTaskDetailState(tenant, date, 'loading', '');
121:     var tasks = (((getData().taskUsage || {})[tenant.id] || {})[date]) || [];
122:     if (!tasks.length && Number(daily.dailyConsumedMinutes || 0) === 0) return renderTaskDetailState(tenant, date, 'empty', '该日没有可展示的已结算任务记录。');
123:     var total = tasks.reduce(function (sum, item) { return sum + Number(item.consumedMinutes || 0); }, 0);
124:     var consistent = total === Number(daily.dailyConsumedMinutes || 0);
125:     var rows = tasks.map(function (item) {
126:       return '<tr><td><strong>' + escapeText(item.taskId) + '</strong></td><td>' + escapeText(item.taskName || '未命名任务') + '</td><td>' + Number(item.connectedCalls || 0).toLocaleString('zh-CN') + '</td><td>' + Number(item.unconnectedCalls || 0).toLocaleString('zh-CN') + '</td><td><strong>' + formatMinutes(item.consumedMinutes) + '</strong></td></tr>';
127:     }).join('');
128:     return '<div class="usage-page usage-task-detail-page" data-anno="usage-task-detail" data-anno-page="usage" data-anno-label="每日任务分钟消耗明细" data-anno-kind="region" data-anno-fields="FLD-048,FLD-055,FLD-045,FLD-046,FLD-047,FLD-049,FLD-062,FLD-063">' +
129:       '<div class="usage-detail-toolbar"><button class="usage-back-link" data-anno="usage-detail-back" data-anno-page="usage" data-anno-label="返回按日使用明细" data-anno-kind="action" data-anno-fields="FLD-055" onclick="window.Pages.usage.backToDailyList()">← 返回使用情况</button></div>' +
130:       '<div class="usage-page-header"><span>使用情况 / 任务明细</span><h1>' + date + ' 任务分钟消耗</h1><p>仅展示当前登录租户当日已结算任务。</p></div>' +
131:       '<div class="usage-detail-context"><div><span>当前租户</span><strong>' + tenant.name + '</strong><small>' + tenant.id + '</small></div><div><span>日期</span><strong>' + date + '</strong></div><div><span>一级日汇总</span><strong>' + formatMinutes(daily.dailyConsumedMinutes) + '</strong></div></div>' +
132:       (!consistent ? '<div class="usage-data-mismatch" data-anno="usage-task-mismatch" data-anno-page="usage" data-anno-label="任务合计与日汇总不一致" data-anno-kind="region" data-anno-fields="FLD-042,FLD-047,FLD-049">数据异常：任务合计 ' + formatMinutes(total) + '，与一级日汇总 ' + formatMinutes(daily.dailyConsumedMinutes) + ' 不一致。页面不会静默修正。<button class="btn btn-default" onclick="window.Pages.usage.retryTaskDetail(\'' + date + '\')">重新加载</button></div>' : '') +
133:       '<section class="usage-daily-card usage-task-card"><div class="usage-section-heading"><div><h2>任务消耗明细</h2><p>已接通不足 1 分钟按 1 分钟计量，未接通不消耗分钟。</p></div><span>' + tasks.length + ' 个任务</span></div>' +
134:         '<div class="usage-table-wrap" data-anno="usage-task-table" data-anno-page="usage" data-anno-label="任务分钟消耗列表" data-anno-kind="region" data-anno-fields="FLD-045,FLD-046,FLD-047,FLD-062,FLD-063"><table class="usage-table usage-task-table"><thead><tr><th>任务 ID</th><th>任务名称</th><th>已接通</th><th>未接通</th><th data-anno="usage-task-minutes" data-anno-page="usage" data-anno-label="任务消耗分钟" data-anno-kind="field" data-anno-fields="FLD-047">消耗分钟</th></tr></thead><tbody>' + rows + '</tbody><tfoot><tr data-anno="usage-task-total" data-anno-page="usage" data-anno-label="任务分钟当日合计" data-anno-kind="status" data-anno-fields="FLD-042,FLD-047,FLD-049"><td colspan="4">当日合计 <small>' + (consistent ? '与一级日汇总一致' : '数据异常') + '</small></td><td><strong>' + formatMinutes(total) + '</strong></td></tr></tfoot></table></div>' +
135:       '</section></div>';
136:   }
137: 
138:   function renderForTenant(requestedTenantId) {
139:     var auth = getAuth();
140:     if (!auth || auth.role !== 'tenant_user' || !auth.currentTenantId) return renderUnauthorized();
141:     if (requestedTenantId && String(requestedTenantId) !== String(auth.currentTenantId)) return renderUnauthorized();
142:     var tenant = getCurrentTenant();
143:     return tenant ? renderTenantPage(tenant) : renderUnauthorized();
144:   }
145: 
146:   function render() {
```

## DCC&AI 外呼/AI 外呼/js/pages/sys-tenant.js
原文件 SHA-256：`82d4a2a0cca44fadd76dc1c3a70b95d499de4c3099d4f976ebc935466d337a8c`

行 912–930
```text
912:           '<td>' + row.tenantId + '</td>' +
913:           '<td>' + row.desc + '</td>' +
914:           '<td>' + row.status + '</td>' +
915:           '<td>' + row.updater + '</td>' +
916:           '<td>' + row.updateTime + '</td>' +
917:           '<td>' +
918:             (canManageTenantBilling() ? '<button class="tenant-op-btn primary" onclick="window.Pages[\'sys-tenant\'].showBillingDrawer(\'' + row.name + '\')">充值管理</button>' : '') +
919:             '<button class="tenant-op-btn blue" onclick="window.Pages[\'sys-tenant\'].openEditTenantModal(\'' + row.tenantId + '\')">编辑</button>' +
920:             '<button class="tenant-op-btn red" onclick="window.Pages[\'sys-tenant\'].deleteTenant(\'' + row.tenantId + '\')">删除</button>' +
921:           '</td>' +
922:         '</tr>';
923:     }).join('');
924:   }
925: 
926:   function formatExportNumber(value) {
927:     return Number(value || 0).toFixed(2);
928:   }
929: 
930:   function getExportAvailableMinutes(summary, modelType) {
```

## Demo_Protype_2/prototype/js/pages/agent-workbench.js
原文件 SHA-256：`45177a4ea988a79372eaeefc8728602219f47acbdc68118ff226b4c566509ae3`

行 450–480
```text
450:   async function signOut(options={removeBinding:0}) {
451:     if (busy()) {fail('请先结束通话并保存处理结果，再退出');return {ok:false,message:error};}
452:     if (options?.removeBinding !== undefined && options.removeBinding !== 0) return {ok:false,message:'坐席退出保留分机绑定，请在坐席维护中调整分机配置'};
453:     const result=await AliCtiAdapter.disconnect({removeBinding:0});
454:     if(!result?.ok){fail(result?.message||'退出未成功，原状态已保留');return result||{ok:false,message:error};}
455:     release();error='';refresh();return result;
456:   }
457:   function allowContextChange(checkOnly) {
458:     if (busy() || signingIn || window.SeatOperationUI?.isBusy() || window.AliCtiSeatOperations?.status().inFlight || window.AliCtiSeatOperations?.status().pending || window.AliCtiSeatOperations?.managementState?.().inFlight || window.AliCtiSeatOperations?.managementState?.().pending) { showToast('请先完成当前通话、记录或电话状态核对，再退出或切换业务域', 'warning'); return false; }
459:     if (window.AliCtiSeatOperations?.connectionStatus?.().blocked) { showToast('电话连接尚未核对，请先重新登录电话后再退出或切换工作范围', 'warning'); return false; }
460:     if (!checkOnly) {release();window.SeatOperationUI?.contextChanged();window.TenantCallMonitor?.contextChanged();modalMode=false;modalVisible=false;ui.closeLayer(modalId);}
461:     return true;
462:   }
463:   function updateField(field, value) {
464:     if (!['customerName', 'phone', 'note'].includes(field) || busy()) return;
465:     if(draft.customerTaskItemId&&['customerName','phone'].includes(field))return;
466:     draft[field] = value;
467:     if (field === 'phone') draft.customerDirectoryId = '';
468:     error = ''; persist();
469:     const message = document.getElementById('seat-error'); if (message) message.textContent = '';
470:   }
471:   function chooseContact(id) {
472:     if (busy()) return;
473:     const row = id ? window.CustomerDirectory?.find(id) : null;
474:     if (id && !row) return fail('该客户已不在当前可查看范围内，请重新选择');
475:     draft = { ...draft, ...CustomerBusiness.snapshot({}), customerTaskItemId:'', customerDirectoryId:row?.id || '', customerName: row?.name || '', phone: row?.phone || '', note: row?.note || '' };
476:     error = ''; refresh();
477:   }
478:   function receivingContext(){
479:     ensureScope();
480:     return {online,agent:myAgent(),tenant:AppState.currentTenant(),busy:busy(),phase,call:call?structuredClone(call):null};
```

## Demo_Protype_2/prototype/js/components/alicti-ivr.js
原文件 SHA-256：`12a03334a1fd5673704f49eeefff7693a5656693edb391c1c56b594b10fe83b0`

行 30–55
```text
30:   function normalize(response,scope,data=root.CloudCallData,usage='automatic') {
31:     const unavailable=(status,message)=>({ok:false,status,message,rows:[],raw:response,mock:true});
32:     const tenant=(data?.tenants||[]).find(t=>t.tenantId===scope?.tenantId);
33:     if(!tenant||key(tenant.enterpriseId)!==key(scope?.enterpriseId))return unavailable('scope','当前组织无法使用这些语音流程，请联系管理员。');
34:     if(!response||!['0','-1'].includes(key(response.result)))return unavailable('unknown','暂时无法确认可用流程，请刷新后重试。');
35:     if(key(response.result)==='-1')return unavailable('failure','暂时无法获取语音流程，请重新获取。');
36:     if(!Array.isArray(response.data))return unavailable('invalid','语音流程暂不可用，请刷新后重试。');
37:     if(response.data.some(r=>!r||!positiveId(r.id)||typeof r.ivrName!=='string'||!r.ivrName.trim()||!positiveId(r.enterpriseId)||!['1','2'].includes(key(r.ivrType))))return unavailable('invalid','语音流程暂不可用，请刷新后重试。');
38:     const current=response.data.filter(r=>key(r.enterpriseId)===key(scope.enterpriseId)&&key(r.ivrType)==='1');
39:     const seen=new Set();
40:     if(current.some(r=>{const id=key(r.id);if(seen.has(id))return true;seen.add(id);return false;}))return unavailable('invalid','语音流程存在重复，请刷新后重试。');
41:     const rows=current.flatMap(raw=>{
42:       const assignment=assignments.find(a=>a.enterpriseId===key(scope.enterpriseId)&&a.id===key(raw.id)&&a.tenantIds.includes(scope.tenantId)&&a.outboundApproved===true&&a.usage===usage);
43:       return assignment?[{...raw,localContactFlowId:assignment.contactFlowId,localAssignment:{tenantId:scope.tenantId,outboundApproved:true,usage}}]:[];
44:     });
45:     return {ok:true,status:rows.length?'ready':'empty',rows,raw:response,mock:true,message:rows.length?'已获取当前组织可用于外呼的语音流程。':response.data.length?'当前组织没有已分配的可用外呼流程，请联系管理员确认。':'暂无可用语音流程，请联系管理员添加。'};
46:   }
47:   function list(scope,data=root.CloudCallData,usage='automatic') {
48:     const req=request(scope?.enterpriseId);api.lastRequest=req;
49:     if(req.pending.length)return {ok:false,status:'scope',message:'语音服务尚未配置完成，请联系管理员。',rows:[],request:req,mock:true};
50:     if(root.AppState&&(key(root.AppState.get().enterpriseId)!==key(scope.enterpriseId)||!root.AppState.authorizeObject('',scope)))return {ok:false,status:'scope',message:'当前范围无权获取该组织的语音流程。',rows:[],request:req,mock:true};
51:     const response=overrides.has(key(scope.enterpriseId))?overrides.get(key(scope.enterpriseId)):api.scenario==='failure'?{result:-1,description:'获取失败（模拟）'}:api.scenario==='empty'?{result:0,data:[]}:api.scenario==='unknown'?{result:99,data:fixtureRows}:api.scenario==='invalid'?{result:0,data:{}}:{result:'0',description:'成功（本地演示）',data:fixtureRows.map(r=>({...r}))};
52:     api.lastResponse=response;
53:     return {...normalize(response,scope,data,usage),request:req};
54:   }
55:   function resolve(reference,scope,data=root.CloudCallData,usage='automatic') {
```
