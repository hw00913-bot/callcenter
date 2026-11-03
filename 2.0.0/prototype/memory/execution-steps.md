# 执行步骤

当前迭代：D联络云 v2.0.0 原址离线重建 20261026。所有步骤只消费新轮记忆/当前来源；不继承旧验证。适用静态/隔离运行检查与实际file浏览器验收分别记录；file既有拒绝不绕过。

## Step 01: 离线登录、合法租户与六入口

### Source IDs

SRC-001, SRC-002, SRC-003, SRC-004, SRC-006, SRC-007, FUNC-2001, FUNC-2002, FUNC-2003, FUNC-2004, PAGE-2001, PAGE-2002, ACTION-2001, ACTION-2002, ACTION-2003, ACTION-2004, ACTION-2005, ACTION-2006, ACTION-2007, ACTION-2086, ACTION-2087, SC-2001, SC-2002, SC-2003, SEQ-2001, SEQ-2002, SEQ-2003, FLD-001, FLD-002, FLD-003, FLD-004, FLD-005, FLD-006, FLD-007, FLD-008

### Goal

离线登录、合法租户与六入口，在已确认边界内形成可观察且离线运行的结果。

### Files

- `js/pages/organization.js`、`js/components/organization-store.js`、`js/components/session-store.js`、`js/app.js`、`js/components/module-host.js`、`js/adapters/ai-finance.js`（超管组织与权限/接入管理全局读取和独立筛选，不跟随业务租户；成员操作仍显式指定租户）

- `js/components/module-host.js`、`js/adapters/cloud.js`、`js/adapters/ai.js`、`js/adapters/ai-finance.js`、`js/components/organization-store.js`、`js/components/contact-policy.js`（按用户纠偏复用1.2直接租户上下文切换；平台授权与数据租户分离，删除租户报表专用模式，不新增成员或角色）

- `index.html`
- `assets/css/global.css`
- `assets/css/app.css`
- `assets/css/cloud-ui-overrides.css`、`assets/css/cloud-ui.css`、`assets/css/shared-forms.css`（2026-10-28 用户要求登录与系统UI全部对齐1.2.0，完整保留源CSS层叠并按当前DOM映射）
- `js/common.js`
- `js/nav.js`
- `js/app.js`
- `mock/data.js`
- `config/nav.json`
- `js/components/session-store.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `js/components/login-screen.js`、`assets/css/login.css`（2026-10-28 用户确认恢复原账号密码登录界面；按 1.2.0 原登录展示复用，不回退当前租户/权限模型）

### Expected Change

- create/update

### Inputs

- `memory/project.md`
- `memory/project-startup-plan.md`
- `memory/business-rules.md`
- `memory/feature-list.md`
- `memory/source-materials.md`
- `memory/field-map.md`
- `docs/decisions.md`

### Work

- 替换脚手架fetch导航和HTTP提示；普通本地脚本直接提供导航/Mock。
- 建立统一演示身份、单/多租户进入、独立平台范围、模块/页面/操作权限及合法位置记忆。
- 六入口仅显示真实可达页面；无统一首页。为原模块准备同一上下文和离开保护接口。

### Acceptance

- 加载入口不产生HTTP依赖、动态import或fetch JSON；本地所有链接存在。
- 纯模型验证多租户合法恢复、无权拒绝、默认原入口、两个模块授权独立；导航DOM按权限生成。
- 本步只验外壳/登录/路由；未接页面不得假报功能完成。

### Verification

- 对修改脚本做node --check；检查本地src/href及静态模块依赖。
- 通过隔离模型/DOM检查关键状态、权限、错误与回读；这类证据不冒充实际浏览器file验收。
- 实际页面操作仅在已有工具授权边界内；file自动拒绝保留，待用户最小人工核验。

### Verification Skill

prototype-verifier


## Step 02: 离线复用原专业页面载体

### Source IDs

SRC-001, SRC-002, SRC-003, SRC-004, SRC-006, SRC-007, FUNC-2015, FUNC-2019, FUNC-2022, FUNC-2023, FUNC-2024, FUNC-2027, PAGE-2102, PAGE-2103, PAGE-2105, PAGE-2106, PAGE-2107, PAGE-2108, PAGE-2109, PAGE-2110, PAGE-2111, PAGE-2112, PAGE-2202, PAGE-2203, PAGE-2204, PAGE-2205, PAGE-2206, PAGE-2207, PAGE-2208, PAGE-2209, PAGE-2210, PAGE-2211, PAGE-2212, PAGE-2213, PAGE-2214, PAGE-2215, PAGE-2216, PAGE-2217, PAGE-2218, PAGE-2219, PAGE-2220, PAGE-2221, PAGE-2222, PAGE-2223, PAGE-2225, PAGE-2226, PAGE-2227, ACTION-2028, ACTION-2029, ACTION-2030, ACTION-2031, ACTION-2032, ACTION-2035, ACTION-2036, ACTION-2103, ACTION-2037, ACTION-2038, ACTION-2039, ACTION-2040, ACTION-2041, ACTION-2042, ACTION-2043, ACTION-2044, ACTION-2045, ACTION-2046, ACTION-2047, ACTION-2049, ACTION-2050, ACTION-2051, ACTION-2052, ACTION-2088, ACTION-2089, ACTION-2090, ACTION-2053, ACTION-2054, ACTION-2055, ACTION-2121, ACTION-2056, ACTION-2057, ACTION-2058, ACTION-2059, ACTION-2060, ACTION-2061, ACTION-2062, ACTION-2063, ACTION-2064, ACTION-2065, ACTION-2066, ACTION-2067, ACTION-2068, ACTION-2069, ACTION-2070, ACTION-2071, ACTION-2072, ACTION-2073, ACTION-2074, ACTION-2075, ACTION-2076, ACTION-2077, ACTION-2078, ACTION-2079, ACTION-2080, ACTION-2081, ACTION-2082, ACTION-2083, ACTION-2085, ACTION-2106, ACTION-2107, ACTION-2108, ACTION-2109, ACTION-2110, ACTION-2116, ACTION-2117, SC-2010, SC-2011, SC-2013, SC-2014, SC-2017, SC-2018, SC-2019, SC-2020, SC-2021, SC-2025, SC-2026, SC-2027, SC-2028, SC-2030, SC-2031, SC-2032, SC-2034, SC-2035, SEQ-2010, SEQ-2011, SEQ-2013, SEQ-2014, SEQ-2017, SEQ-2018, SEQ-2019, SEQ-2020, SEQ-2021, SEQ-2025, SEQ-2026, SEQ-2027, SEQ-2028, SEQ-2030, SEQ-2031, SEQ-2032, SEQ-2034, SEQ-2035, FLD-039, FLD-040, FLD-041, FLD-042, FLD-043, FLD-044, FLD-080, FLD-081, FLD-082, FLD-083, FLD-045, FLD-046, FLD-047, FLD-103, FLD-048, FLD-049, FLD-050, FLD-051, FLD-052, FLD-104, FLD-105, FLD-106, FLD-107, FLD-108, FLD-009, FLD-010, FLD-011, FLD-038, FLD-016, FLD-017, FLD-018, FLD-019, FLD-020, FLD-053, FLD-054, FLD-055, FLD-056, FLD-057, FLD-058, FLD-059, FLD-060, FLD-061, FLD-062, FLD-063, FLD-064, FLD-065, FLD-084, FLD-066, FLD-067, FLD-068, FLD-069, FLD-070, FLD-071, FLD-072, FLD-073, FLD-074, FLD-075, FLD-076, FLD-077, FLD-078, FLD-100, FLD-101, FLD-079, FLD-102, FLD-109, FLD-110, FLD-111, FLD-112, FLD-113, FLD-114, FLD-115, FLD-116, FLD-117, FLD-118, FLD-119, FLD-120, FLD-121, FLD-122, FLD-123, FLD-124, FLD-125, FLD-126, FLD-127, FLD-128, FLD-129, FLD-130, FLD-131, FLD-132, FLD-133, FLD-134, FLD-135, FLD-136

### Goal

离线复用原专业页面载体，在已确认边界内形成可观察且离线运行的结果。

### Files

- `index.html`（模块脚本需在现有唯一入口加载）
- `js/app.js`（转发原页面内部操作上下文）

- `scripts/build-modules.py`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `js/components/module-host.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `js/modules/ai.bundle.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `js/modules/cloud.bundle.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `js/adapters/ai.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `js/adapters/cloud.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `assets/css/app.css`
- `memory/reuse-provenance.json`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）

### Expected Change

- create/update

### Inputs

- `memory/project.md`
- `memory/project-startup-plan.md`
- `memory/business-rules.md`
- `memory/feature-list.md`
- `memory/source-materials.md`
- `memory/field-map.md`
- `docs/decisions.md`

### Work

- 从只读AI和v1.2单模板参考按实际script/style/resource依赖生成本地模块，剔除其工具/旧控制/导航壳和旧标注运行时；不整包复制项目。
- 原专业UI/业务模型保持，统一外壳通过一个明确模块接口打开原路由；资源离线，file/HTTP不分业务逻辑。
- 新命名空间保留旧浏览器数据；模块不调用真实网络、认证或CTI。

### Acceptance

- 本地资源依赖闭包与来源摘要可追溯，包内没有运行必需远程脚本/fetch数据。
- 原AI三列卡片及Cloud各原页面控制器存在；隔离DOM/加载检查无丢失依赖。
- 不复制旧原型适配器；只做本轮必要上下文适配。

### Verification

- 对修改脚本做node --check；检查本地src/href及静态模块依赖。
- 通过隔离模型/DOM检查关键状态、权限、错误与回读；这类证据不冒充实际浏览器file验收。
- 实际页面操作仅在已有工具授权边界内；file自动拒绝保留，待用户最小人工核验。

### Verification Skill

prototype-verifier

### Evidence and Support

- Browser Evidence Tool: `playwright-cli when needed`（仅获准范围，file旧拒绝不重试）
- Support Skill: `superpowers-pm-prototype/skills/verification-before-completion`
- Support Skill: `superpowers-pm-prototype/skills/systematic-debugging`

### Dependencies

- step-01

### Failure Handling

- 已确认范围内实现错误在本步修复；需求事实冲突记录open-items并按来源处理，不能改冻结事实。
- 环境未验与实现失败分别记录；不将未执行项写pass，不修改工具/门禁。

## Step 03: 品牌、租户、账号成员和模块开通

### Source IDs

SRC-001, SRC-002, SRC-003, SRC-004, SRC-006, SRC-007, FUNC-2010, FUNC-2011, FUNC-2012, FUNC-2013, FUNC-2014, FUNC-2026, FUNC-2028, FUNC-2029, PAGE-2003, PAGE-2004, PAGE-2005, ACTION-2008, ACTION-2009, ACTION-2010, ACTION-2011, ACTION-2091, ACTION-2102, ACTION-2104, ACTION-2012, ACTION-2013, ACTION-2014, ACTION-2015, ACTION-2105, ACTION-2016, ACTION-2017, ACTION-2018, SC-2004, SC-2005, SC-2006, SC-2007, SC-2008, SC-2009, SC-2017, SC-2021, SC-2022, SC-2023, SC-2024, SC-2036, SEQ-2004, SEQ-2005, SEQ-2006, SEQ-2007, SEQ-2008, SEQ-2009, SEQ-2017, SEQ-2021, SEQ-2022, SEQ-2023, SEQ-2024, SEQ-2036, FLD-085, FLD-086, FLD-087, FLD-088, FLD-089, FLD-090, FLD-091, FLD-092, FLD-093, FLD-094, FLD-095, FLD-096, FLD-097, FLD-098, FLD-099

### Goal

品牌、租户、账号成员和模块开通，在已确认边界内形成可观察且离线运行的结果。

### Files

- `assets/css/cloud-ui-overrides.css`、派生 `assets/css/cloud-ui.css`、`memory/reuse-provenance.json`（原字段与管理抽屉、列表和动作链对齐，现有生成器输出）
- `index.html`、`assets/css/shared-forms.css`、`assets/css/app.css`（加载公共管理及复用原云呼叫表单样式）
- `js/components/module-host.js`、`js/adapters/cloud.js`、`scripts/build-modules.py`（统一身份接入与原坐席关联入口，源页面只读）

- `js/components/session-store.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `js/components/organization-store.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `js/pages/organization.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `mock/data.js`
- `js/app.js`

### Expected Change

- create/update

### Inputs

- `memory/project.md`
- `memory/project-startup-plan.md`
- `memory/business-rules.md`
- `memory/feature-list.md`
- `memory/source-materials.md`
- `memory/field-map.md`
- `docs/decisions.md`

### Work

- 按已确认品牌归属、唯一总部/多门店和全局账号+租户成员关系实现本方公共管理，复用原表单布局。
- 超管开通模块，租户管理员在本租户可授范围分配AI/Cloud角色；账号与坐席关联明确分离。
- 停用范围、当前通话有限收尾、历史/引用保护删除和未知同次核对保持；只模拟原批准边界。

### Acceptance

- 角色/对象/租户范围模型有越权反例；品牌归属不授跨租户业务权。
- 创建/编辑/停用的实际Mock回读、错误保输入和未知不重发可核。
- 删除保护保留历史，开模块不自动授所有人员。

### Verification

- 对修改脚本做node --check；检查本地src/href及静态模块依赖。
- 通过隔离模型/DOM检查关键状态、权限、错误与回读；这类证据不冒充实际浏览器file验收。
- 实际页面操作仅在已有工具授权边界内；file自动拒绝保留，待用户最小人工核验。

### Verification Skill

prototype-verifier

### Evidence and Support

- Browser Evidence Tool: `playwright-cli when needed`（仅获准范围，file旧拒绝不重试）
- Support Skill: `superpowers-pm-prototype/skills/verification-before-completion`
- Support Skill: `superpowers-pm-prototype/skills/systematic-debugging`

### Dependencies

- step-02

### Failure Handling

- 已确认范围内实现错误在本步修复；需求事实冲突记录open-items并按来源处理，不能改冻结事实。
- 环境未验与实现失败分别记录；不将未执行项写pass，不修改工具/门禁。

## Step 04: 分类字段与AI专业关联

### Source IDs

SRC-001, SRC-002, SRC-003, SRC-004, SRC-006, SRC-007, FUNC-2019, PAGE-2006, PAGE-2110, PAGE-2111, PAGE-2223, ACTION-2019, ACTION-2020, ACTION-2021, ACTION-2022, ACTION-2111, ACTION-2042, ACTION-2043, ACTION-2044, ACTION-2083, SC-2010, SC-2011, SC-2017, SC-2021, SC-2037, SEQ-2010, SEQ-2011, SEQ-2017, SEQ-2021, SEQ-2037, FLD-012, FLD-013, FLD-014, FLD-015, FLD-048, FLD-049, FLD-050, FLD-051, FLD-052, FLD-109, FLD-110, FLD-111

### Goal

分类字段与AI专业关联，在已确认边界内形成可观察且离线运行的结果。

### Files

- `js/adapters/ai-config-store.js`、`scripts/build-modules.py`（同一AI分类删除入口的只读原文/版本审查及精确配置键引用保护；不新增业务功能或分类删除授权）

- `index.html`、`config/nav.json`、`js/nav.js`、`js/components/session-store.js`（原字段内部页沿所属公共配置权访问）
- `js/components/module-host.js`、`scripts/build-modules.py`、`js/modules/ai.bundle.js`、`js/modules/cloud.bundle.js`（仅适配公共配置范围、原字段编辑与只读目录桥接）

- `js/components/catalog-store.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `js/pages/catalog.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `js/adapters/ai.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `js/adapters/cloud.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `mock/data.js`
- `js/app.js`

### Expected Change

- create/update

### Inputs

- `memory/project.md`
- `memory/project-startup-plan.md`
- `memory/business-rules.md`
- `memory/feature-list.md`
- `memory/source-materials.md`
- `memory/field-map.md`
- `docs/decisions.md`

### Work

- 公共分类基础/原字段与路由分开保存；原目录及AI具体场景稳定ID关联保留。
- 沿原标签管理场景配置维护关联；原供应商标签、启停、映射和结果展示保持。
- 停用仅限制新选/新关联，已有场景按原规则；不新增AI标签写业务字段。

### Acceptance

- 分类和专业场景不能按名称自动合并；跨租户/不匹配值拒绝或待核。
- 原字段类型/枚举/多选/取数配置及既有快照语义与原来源对应。
- 公共配置权不替代AI专业操作权。

### Verification

- 对修改脚本做node --check；检查本地src/href及静态模块依赖。
- 通过隔离模型/DOM检查关键状态、权限、错误与回读；这类证据不冒充实际浏览器file验收。
- 实际页面操作仅在已有工具授权边界内；file自动拒绝保留，待用户最小人工核验。

### Verification Skill

prototype-verifier

### Evidence and Support

- Browser Evidence Tool: `playwright-cli when needed`（仅获准范围，file旧拒绝不重试）
- Support Skill: `superpowers-pm-prototype/skills/verification-before-completion`
- Support Skill: `superpowers-pm-prototype/skills/systematic-debugging`

### Dependencies

- step-03

### Failure Handling

- 已确认范围内实现错误在本步修复；需求事实冲突记录open-items并按来源处理，不能改冻结事实。
- 环境未验与实现失败分别记录；不将未执行项写pass，不修改工具/门禁。

## Step 05: 单模板、导入分配与串行流转

### Source IDs

SRC-001, SRC-002, SRC-003, SRC-004, SRC-006, SRC-007, FUNC-2022, FUNC-2024, PAGE-2228, PAGE-2204, PAGE-2226, PAGE-2227, ACTION-2112, ACTION-2113, ACTION-2114, ACTION-2115, ACTION-2054, ACTION-2055, ACTION-2121, ACTION-2106, ACTION-2107, ACTION-2108, ACTION-2109, ACTION-2110, ACTION-2116, ACTION-2117, SC-2018, SC-2019, SC-2021, SC-2025, SC-2026, SC-2027, SC-2028, SC-2029, SC-2030, SC-2031, SC-2032, SC-2034, SC-2035, SEQ-2018, SEQ-2019, SEQ-2021, SEQ-2025, SEQ-2026, SEQ-2027, SEQ-2028, SEQ-2029, SEQ-2030, SEQ-2031, SEQ-2032, SEQ-2034, SEQ-2035, FLD-021, FLD-022, FLD-023, FLD-024, FLD-025, FLD-026, FLD-027, FLD-028, FLD-029, FLD-030, FLD-016, FLD-017, FLD-018, FLD-019, FLD-020, FLD-114, FLD-115, FLD-116, FLD-117, FLD-118, FLD-119, FLD-120, FLD-121, FLD-122, FLD-123, FLD-124, FLD-125, FLD-126, FLD-127, FLD-128, FLD-129, FLD-130, FLD-131, FLD-132, FLD-133, FLD-134, FLD-135, FLD-136

### Goal

单模板、导入分配与串行流转，在已确认边界内形成可观察且离线运行的结果。

### Files

- `index.html`、`js/components/module-host.js`、`scripts/build-modules.py`、`js/modules/cloud.bundle.js`（原业务模型的逐操作授权与AI字段待核边界，保持同一原台账）
- `scripts/flow_editor_build.py`、`scripts/flow-editor.patch.json`、`scripts/flow-canvas-ui.js`、`scripts/flow-canvas-ui.css`（本轮已授权画布交互的生成期转换；保留原保存与执行模型，避免重建覆盖）
- `assets/css/app.css`（仅流转模板应用内全屏容器；基础信息与编排阶段共用原保存模型）

- `js/adapters/cloud.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `js/components/business-link.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `js/pages/business.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `mock/data.js`
- `js/app.js`

### Expected Change

- create/update

### Inputs

- `memory/project.md`
- `memory/project-startup-plan.md`
- `memory/business-rules.md`
- `memory/feature-list.md`
- `memory/source-materials.md`
- `memory/field-map.md`
- `docs/decisions.md`

### Work

- 复用v1.2分类流转原模型/表单；按确认稿修正明确冲突：单模板精确版本、空节点和显式起点、人工选择路径。
- 原导入/批次/台账及租户内分配；业务记录保持分类/字段/模板快照，原多选分配原子性。
- AI/预外呼/人工执行段区别受理/结束/保存；总部与门店转交保持稳定线索、准确门店、历史截止与原段首次补录。

### Acceptance

- 新记录导入不会自动分配/起呼；路径ALL/ANY、未知字段和条件只控制人工准入。
- 整记录最近段未结束/未保存阻止下一方式，换轮次/归属也不豁免。
- 有意向唯一映射/无意向总部管理员/映射异常及门店上交保持；迟到结果不覆盖新轮。

### Verification

- 对修改脚本做node --check；检查本地src/href及静态模块依赖。
- 通过隔离模型/DOM检查关键状态、权限、错误与回读；这类证据不冒充实际浏览器file验收。
- 实际页面操作仅在已有工具授权边界内；file自动拒绝保留，待用户最小人工核验。

### Verification Skill

prototype-verifier

### Evidence and Support

- Browser Evidence Tool: `playwright-cli when needed`（仅获准范围，file旧拒绝不重试）
- Support Skill: `superpowers-pm-prototype/skills/verification-before-completion`
- Support Skill: `superpowers-pm-prototype/skills/systematic-debugging`

### Dependencies

- step-04

### Failure Handling

- 已确认范围内实现错误在本步修复；需求事实冲突记录open-items并按来源处理，不能改冻结事实。
- 环境未验与实现失败分别记录；不将未执行项写pass，不修改工具/门禁。

## Step 06: 客户联系、公共拒联与专项名单

### Source IDs

SRC-001, SRC-002, SRC-003, SRC-004, SRC-006, SRC-007, FUNC-2020, FUNC-2021, FUNC-2023, FUNC-2025, PAGE-2203, PAGE-2007, ACTION-2053, ACTION-2023, ACTION-2024, ACTION-2025, ACTION-2026, ACTION-2092, ACTION-2093, ACTION-2094, ACTION-2095, ACTION-2096, ACTION-2097, ACTION-2098, ACTION-2099, ACTION-2100, ACTION-2101, SC-2012, SC-2013, SC-2014, SC-2015, SC-2016, SC-2017, SC-2021, SEQ-2012, SEQ-2013, SEQ-2014, SEQ-2015, SEQ-2016, SEQ-2017, SEQ-2021, FLD-038, FLD-031, FLD-032, FLD-033, FLD-034, FLD-035, FLD-036, FLD-037

### Goal

客户联系、公共拒联与专项名单，在已确认边界内形成可观察且离线运行的结果。

### Files

- `index.html`、`assets/css/app.css`、`js/components/module-host.js`、`js/components/session-store.js`、`js/components/organization-store.js`、`js/pages/organization.js`（统一名单入口及单独的公共新增授权）
- `js/adapters/ai-special.js`、`scripts/build-modules.py`、`js/modules/ai.bundle.js`、`js/modules/cloud.bundle.js`（在原专项页面内实现固定来源操作及四方式校验）

- `js/components/contact-policy.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `js/pages/contacts.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `js/adapters/ai.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `js/adapters/cloud.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `js/app.js`
- `mock/data.js`

### Expected Change

- create/update

### Inputs

- `memory/project.md`
- `memory/project-startup-plan.md`
- `memory/business-rules.md`
- `memory/feature-list.md`
- `memory/source-materials.md`
- `memory/field-map.md`
- `docs/decisions.md`

### Work

- 复用原同号联系历史和原客户档案，业务记录不按手机号合并。
- 统一当前租户联系限制入口；人工拒联保存入公共名单，AI拒联由有权人员确认。
- 四种外呼与重呼/补提交均检查；专项保来源/期限/范围；正常呼入继续，解除仅本条来源且需原权限/原因。

### Acceptance

- 公共和专项没有重复主维护；同品牌其它租户不自动共享名单。
- 同号多来源、已解除/到期不复活、供应商状态未知不能当已全放行。
- 读取/保存失败保现场，拒联话后与名单部分失败分开可核。

### Verification

- 对修改脚本做node --check；检查本地src/href及静态模块依赖。
- 通过隔离模型/DOM检查关键状态、权限、错误与回读；这类证据不冒充实际浏览器file验收。
- 实际页面操作仅在已有工具授权边界内；file自动拒绝保留，待用户最小人工核验。

### Verification Skill

prototype-verifier

### Evidence and Support

- Browser Evidence Tool: `playwright-cli when needed`（仅获准范围，file旧拒绝不重试）
- Support Skill: `superpowers-pm-prototype/skills/verification-before-completion`
- Support Skill: `superpowers-pm-prototype/skills/systematic-debugging`

### Dependencies

- step-05

### Failure Handling

- 已确认范围内实现错误在本步修复；需求事实冲突记录open-items并按来源处理，不能改冻结事实。
- 环境未验与实现失败分别记录；不将未执行项写pass，不修改工具/门禁。

## Step 07: 原电话、任务、资源与报表操作

### Source IDs

SRC-001, SRC-002, SRC-003, SRC-004, SRC-006, SRC-007, FUNC-2015, FUNC-2019, FUNC-2022, FUNC-2023, FUNC-2024, FUNC-2027, PAGE-2102, PAGE-2103, PAGE-2105, PAGE-2106, PAGE-2107, PAGE-2108, PAGE-2109, PAGE-2110, PAGE-2111, PAGE-2112, PAGE-2202, PAGE-2205, PAGE-2206, PAGE-2207, PAGE-2208, PAGE-2209, PAGE-2210, PAGE-2211, PAGE-2212, PAGE-2213, PAGE-2214, PAGE-2215, PAGE-2216, PAGE-2217, PAGE-2218, PAGE-2219, PAGE-2220, PAGE-2221, PAGE-2222, PAGE-2223, PAGE-2225, ACTION-2028, ACTION-2029, ACTION-2030, ACTION-2031, ACTION-2032, ACTION-2035, ACTION-2036, ACTION-2103, ACTION-2037, ACTION-2038, ACTION-2039, ACTION-2040, ACTION-2041, ACTION-2042, ACTION-2043, ACTION-2044, ACTION-2045, ACTION-2046, ACTION-2047, ACTION-2049, ACTION-2050, ACTION-2051, ACTION-2052, ACTION-2088, ACTION-2089, ACTION-2090, ACTION-2056, ACTION-2057, ACTION-2058, ACTION-2059, ACTION-2060, ACTION-2061, ACTION-2062, ACTION-2063, ACTION-2064, ACTION-2065, ACTION-2066, ACTION-2067, ACTION-2068, ACTION-2069, ACTION-2070, ACTION-2071, ACTION-2072, ACTION-2073, ACTION-2074, ACTION-2075, ACTION-2076, ACTION-2077, ACTION-2078, ACTION-2079, ACTION-2080, ACTION-2081, ACTION-2082, ACTION-2083, ACTION-2085, SC-2010, SC-2011, SC-2013, SC-2014, SC-2017, SC-2018, SC-2019, SC-2020, SC-2021, SEQ-2010, SEQ-2011, SEQ-2013, SEQ-2014, SEQ-2017, SEQ-2018, SEQ-2019, SEQ-2020, SEQ-2021, FLD-039, FLD-040, FLD-041, FLD-042, FLD-043, FLD-044, FLD-080, FLD-081, FLD-082, FLD-083, FLD-045, FLD-046, FLD-047, FLD-103, FLD-048, FLD-049, FLD-050, FLD-051, FLD-052, FLD-104, FLD-105, FLD-106, FLD-107, FLD-108, FLD-009, FLD-010, FLD-011, FLD-053, FLD-054, FLD-055, FLD-056, FLD-057, FLD-058, FLD-059, FLD-060, FLD-061, FLD-062, FLD-063, FLD-064, FLD-065, FLD-084, FLD-066, FLD-067, FLD-068, FLD-069, FLD-070, FLD-071, FLD-072, FLD-073, FLD-074, FLD-075, FLD-076, FLD-077, FLD-078, FLD-100, FLD-101, FLD-079, FLD-102, FLD-109, FLD-110, FLD-111, FLD-112, FLD-113

### Goal

原电话、任务、资源与报表操作，在已确认边界内形成可观察且离线运行的结果。

### Files

- `scripts/build-modules.py`（2060快照保存回读逐字节校验，保留BOM与原成功/清理守卫）

- `mock/data.js`、`js/adapters/ai.js`（已批准2045独立财务样例、最小授权；不含真实账务）

- `js/adapters/ai-assignment-identity.js`（2032同脱敏键误移除修复：稳定行身份/租户任务边界，保留旧行和历史）

- `js/adapters/ai.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `js/adapters/cloud.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `js/components/module-host.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `js/components/contact-policy.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `js/components/business-link.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `js/app.js`
- `js/modules/ai.bundle.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `js/modules/cloud.bundle.js`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `scripts/build-modules.py`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `memory/reuse-provenance.json`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）

- `scripts/import_build.py`、`js/components/import-workbook.js`、`js/adapters/dcc-import-enhancements.js`、`js/adapters/customer-import-enhancements.js`（2026-10-28用户明确的Excel/模板/名称反馈修复）
- `assets/vendor/jszip.min.js`、`assets/vendor/sax.js`及对应许可证/README（已安装本地依赖、生成期内联，无运行时联网）

### Expected Change

- create/update

### Inputs

- `memory/project.md`
- `memory/project-startup-plan.md`
- `memory/business-rules.md`
- `memory/feature-list.md`
- `memory/source-materials.md`
- `memory/field-map.md`
- `docs/decisions.md`

### Work

- 逐项承接原专业操作和资格，不以页面可见授予执行/导出/财务/配置权限。
- 保原Cloud电话范围与本人通话/话后/离线保护；专业后台任务不因人员停用被擅自撤销或自动转交。
- 任务客户导出仅按FUNC2043修正合法非空入口并保六列；服务汇总采用八列分钟/服务口径；其它原导出/明细保原范围。
- 原占位查询与未知接口保真实限制，任务/资源不同供应商参数不抹平。

### Acceptance

- 原卡片、向导、资源维护、明细与结果回读保原交互；参考代码指纹及必要适配逐项可追溯。
- 原电话字段/任务资格/公共禁呼/只读角色/独立财务范围的关键行为有模型或DOM证据。
- 真实远端执行、同步、账务不伪造通过；file未实际验项如实列出。

### Verification

- 对修改脚本做node --check；检查本地src/href及静态模块依赖。
- 通过隔离模型/DOM检查关键状态、权限、错误与回读；这类证据不冒充实际浏览器file验收。
- 实际页面操作仅在已有工具授权边界内；file自动拒绝保留，待用户最小人工核验。

### Verification Skill

prototype-verifier

### Evidence and Support

- Browser Evidence Tool: `playwright-cli when needed`（仅获准范围，file旧拒绝不重试）
- Support Skill: `superpowers-pm-prototype/skills/verification-before-completion`
- Support Skill: `superpowers-pm-prototype/skills/systematic-debugging`

### Dependencies

- step-06

### Failure Handling

- 已确认范围内实现错误在本步修复；需求事实冲突记录open-items并按来源处理，不能改冻结事实。
- 环境未验与实现失败分别记录；不将未执行项写pass，不修改工具/门禁。

## Step 08: 复用业务流程图

### Source IDs

SRC-007, LOCAL, FUNC-2001, FUNC-2002, FUNC-2003, FUNC-2004, FUNC-2005, FUNC-2006, FUNC-2007, FUNC-2008, FUNC-2009, FUNC-2010, FUNC-2011, FUNC-2012, FUNC-2013, FUNC-2014, FUNC-2015, FUNC-2016, FUNC-2017, FUNC-2018, FUNC-2019, FUNC-2020, FUNC-2021, FUNC-2022, FUNC-2023, FUNC-2024, FUNC-2025, FUNC-2026, FUNC-2027, FUNC-2028, FUNC-2029, FUNC-2030, FUNC-2031, FUNC-2032, FUNC-2033, FUNC-2034, FUNC-2035, FUNC-2036, FUNC-2037, FUNC-2038, FUNC-2039, FUNC-2040, FUNC-2041, FUNC-2042, FUNC-2043, SC-2001, SC-2002, SC-2003, SC-2004, SC-2005, SC-2006, SC-2007, SC-2008, SC-2009, SC-2010, SC-2011, SC-2012, SC-2013, SC-2014, SC-2015, SC-2016, SC-2017, SC-2018, SC-2019, SC-2020, SC-2021, SC-2022, SC-2023, SC-2024, SC-2025, SC-2026, SC-2027, SC-2028, SC-2029, SC-2030, SC-2031, SC-2032, SC-2033, SC-2034, SC-2035, SC-2036, SEQ-2001, SEQ-2002, SEQ-2003, SEQ-2004, SEQ-2005, SEQ-2006, SEQ-2007, SEQ-2008, SEQ-2009, SEQ-2010, SEQ-2011, SEQ-2012, SEQ-2013, SEQ-2014, SEQ-2015, SEQ-2016, SEQ-2017, SEQ-2018, SEQ-2019, SEQ-2020, SEQ-2021, SEQ-2022, SEQ-2023, SEQ-2024, SEQ-2025, SEQ-2026, SEQ-2027, SEQ-2028, SEQ-2029, SEQ-2030, SEQ-2031, SEQ-2032, SEQ-2033, SEQ-2034, SEQ-2035, SEQ-2036

### Goal

复用业务流程图，在已确认边界内形成可观察且离线运行的结果。

### Files

- `flowcharts/business-process.html`
- `js/delivery-nav.js`
- `assets/css/delivery-diagrams.css`
- `scripts/publish-views.py`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `memory/reuse-provenance.json`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）

### Expected Change

- create/update

### Inputs

- `memory/project.md`
- `memory/project-startup-plan.md`
- `memory/business-rules.md`
- `memory/feature-list.md`
- `memory/source-materials.md`
- `memory/field-map.md`
- `docs/decisions.md`

### Work

- 从当前分析自包含业务图集只读发布；保留13FLOW/36SC与原SVG几何，注入本轮评审/导航语义。

### Acceptance

- 源几何摘要可核，宽屏/折叠目录/缩放原能力保持；与已确认业务行为对应。
- 本轮工具不允许的file可见性不能用静态标签冒充通过。

### Verification

- 对修改脚本做node --check；检查本地src/href及静态模块依赖。
- 通过隔离模型/DOM检查关键状态、权限、错误与回读；这类证据不冒充实际浏览器file验收。
- 实际页面操作仅在已有工具授权边界内；file自动拒绝保留，待用户最小人工核验。

### Verification Skill

prototype-verifier

### Evidence and Support

- Browser Evidence Tool: `playwright-cli when needed`（仅获准范围，file旧拒绝不重试）
- Support Skill: `superpowers-pm-prototype/skills/verification-before-completion`
- Support Skill: `superpowers-pm-prototype/skills/systematic-debugging`

### Dependencies

- step-07

### Failure Handling

- 已确认范围内实现错误在本步修复；需求事实冲突记录open-items并按来源处理，不能改冻结事实。
- 环境未验与实现失败分别记录；不将未执行项写pass，不修改工具/门禁。

## Step 09: 复用交互时序图

### Source IDs

SRC-007, LOCAL, FUNC-2001, FUNC-2002, FUNC-2003, FUNC-2004, FUNC-2005, FUNC-2006, FUNC-2007, FUNC-2008, FUNC-2009, FUNC-2010, FUNC-2011, FUNC-2012, FUNC-2013, FUNC-2014, FUNC-2015, FUNC-2016, FUNC-2017, FUNC-2018, FUNC-2019, FUNC-2020, FUNC-2021, FUNC-2022, FUNC-2023, FUNC-2024, FUNC-2025, FUNC-2026, FUNC-2027, FUNC-2028, FUNC-2029, FUNC-2030, FUNC-2031, FUNC-2032, FUNC-2033, FUNC-2034, FUNC-2035, FUNC-2036, FUNC-2037, FUNC-2038, FUNC-2039, FUNC-2040, FUNC-2041, FUNC-2042, FUNC-2043, SC-2001, SC-2002, SC-2003, SC-2004, SC-2005, SC-2006, SC-2007, SC-2008, SC-2009, SC-2010, SC-2011, SC-2012, SC-2013, SC-2014, SC-2015, SC-2016, SC-2017, SC-2018, SC-2019, SC-2020, SC-2021, SC-2022, SC-2023, SC-2024, SC-2025, SC-2026, SC-2027, SC-2028, SC-2029, SC-2030, SC-2031, SC-2032, SC-2033, SC-2034, SC-2035, SC-2036, SEQ-2001, SEQ-2002, SEQ-2003, SEQ-2004, SEQ-2005, SEQ-2006, SEQ-2007, SEQ-2008, SEQ-2009, SEQ-2010, SEQ-2011, SEQ-2012, SEQ-2013, SEQ-2014, SEQ-2015, SEQ-2016, SEQ-2017, SEQ-2018, SEQ-2019, SEQ-2020, SEQ-2021, SEQ-2022, SEQ-2023, SEQ-2024, SEQ-2025, SEQ-2026, SEQ-2027, SEQ-2028, SEQ-2029, SEQ-2030, SEQ-2031, SEQ-2032, SEQ-2033, SEQ-2034, SEQ-2035, SEQ-2036

### Goal

复用交互时序图，在已确认边界内形成可观察且离线运行的结果。

### Files

- `flowcharts/sequence-interaction.html`
- `js/delivery-nav.js`
- `assets/css/delivery-diagrams.css`
- `scripts/publish-views.py`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）
- `memory/reuse-provenance.json`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）

### Expected Change

- create/update

### Inputs

- `memory/project.md`
- `memory/project-startup-plan.md`
- `memory/business-rules.md`
- `memory/feature-list.md`
- `memory/source-materials.md`
- `memory/field-map.md`
- `docs/decisions.md`

### Work

- 从当前36份时序图集只读发布，保原参与方、消息和几何；业务异步分支由相关实现步骤实际落实。

### Acceptance

- 当前源与发布图几何一致，语义/导航/资源完整；图页存在不等于业务时序已验。

### Verification

- 对修改脚本做node --check；检查本地src/href及静态模块依赖。
- 通过隔离模型/DOM检查关键状态、权限、错误与回读；这类证据不冒充实际浏览器file验收。
- 实际页面操作仅在已有工具授权边界内；file自动拒绝保留，待用户最小人工核验。

### Verification Skill

prototype-verifier

### Evidence and Support

- Browser Evidence Tool: `playwright-cli when needed`（仅获准范围，file旧拒绝不重试）
- Support Skill: `superpowers-pm-prototype/skills/verification-before-completion`
- Support Skill: `superpowers-pm-prototype/skills/systematic-debugging`

### Dependencies

- step-08

### Failure Handling

- 已确认范围内实现错误在本步修复；需求事实冲突记录open-items并按来源处理，不能改冻结事实。
- 环境未验与实现失败分别记录；不将未执行项写pass，不修改工具/门禁。

## Step 10: 关联系统与单入口阅读

### Source IDs

SRC-007, LOCAL, FUNC-2001, FUNC-2002, FUNC-2003, FUNC-2004, FUNC-2005, FUNC-2006, FUNC-2007, FUNC-2008, FUNC-2009, FUNC-2010, FUNC-2011, FUNC-2012, FUNC-2013, FUNC-2014, FUNC-2015, FUNC-2016, FUNC-2017, FUNC-2018, FUNC-2019, FUNC-2020, FUNC-2021, FUNC-2022, FUNC-2023, FUNC-2024, FUNC-2025, FUNC-2026, FUNC-2027, FUNC-2028, FUNC-2029, FUNC-2030, FUNC-2031, FUNC-2032, FUNC-2033, FUNC-2034, FUNC-2035, FUNC-2036, FUNC-2037, FUNC-2038, FUNC-2039, FUNC-2040, FUNC-2041, FUNC-2042, FUNC-2043, SC-2001, SC-2002, SC-2003, SC-2004, SC-2005, SC-2006, SC-2007, SC-2008, SC-2009, SC-2010, SC-2011, SC-2012, SC-2013, SC-2014, SC-2015, SC-2016, SC-2017, SC-2018, SC-2019, SC-2020, SC-2021, SC-2022, SC-2023, SC-2024, SC-2025, SC-2026, SC-2027, SC-2028, SC-2029, SC-2030, SC-2031, SC-2032, SC-2033, SC-2034, SC-2035, SC-2036, SEQ-2001, SEQ-2002, SEQ-2003, SEQ-2004, SEQ-2005, SEQ-2006, SEQ-2007, SEQ-2008, SEQ-2009, SEQ-2010, SEQ-2011, SEQ-2012, SEQ-2013, SEQ-2014, SEQ-2015, SEQ-2016, SEQ-2017, SEQ-2018, SEQ-2019, SEQ-2020, SEQ-2021, SEQ-2022, SEQ-2023, SEQ-2024, SEQ-2025, SEQ-2026, SEQ-2027, SEQ-2028, SEQ-2029, SEQ-2030, SEQ-2031, SEQ-2032, SEQ-2033, SEQ-2034, SEQ-2035, SEQ-2036

### Goal

关联系统与单入口阅读，在已确认边界内形成可观察且离线运行的结果。

### Files

- `docs/interaction.html`、`docs/role-permissions.md`、`功能说明.md`、`README.md`（用户明确要求维护已有权限说明：全局管理/业务租户、账号成员和独立授权；非新增交互文档生成或业务变更）

- `related-systems/index.html`
- `version-history.html`
- `js/version-nav.js`
- `js/delivery-nav.js`
- `index.html`
- `README.md`（新增：新轮没有该模块/适配/生成器，保证原专业离线复用所需）

### Expected Change

- create/update

### Inputs

- `memory/project.md`
- `memory/project-startup-plan.md`
- `memory/business-rules.md`
- `memory/feature-list.md`
- `memory/source-materials.md`
- `memory/field-map.md`
- `docs/decisions.md`

### Work

- 按当前systems展示AI服务、云呼叫/供方及本方责任；保真实待核状态。
- 四阅读视图在当前宿主切换，版本入口保留；最终只给本目录index主入口和适用边界。

### Acceptance

- 无远程iframe或必需服务，资源闭包完整；不新增独立说明/标注/备份包。
- 保既有未验状态，最小人工file核验步骤可执行。

### Verification

- 对修改脚本做node --check；检查本地src/href及静态模块依赖。
- 通过隔离模型/DOM检查关键状态、权限、错误与回读；这类证据不冒充实际浏览器file验收。
- 实际页面操作仅在已有工具授权边界内；file自动拒绝保留，待用户最小人工核验。

### Verification Skill

prototype-verifier

### Evidence and Support

- Browser Evidence Tool: `playwright-cli when needed`（仅获准范围，file旧拒绝不重试）
- Support Skill: `superpowers-pm-prototype/skills/verification-before-completion`
- Support Skill: `superpowers-pm-prototype/skills/systematic-debugging`

### Dependencies

- step-09

### Failure Handling

- 已确认范围内实现错误在本步修复；需求事实冲突记录open-items并按来源处理，不能改冻结事实。
- 环境未验与实现失败分别记录；不将未执行项写pass，不修改工具/门禁。

## 2026-10-26 本轮视觉追加范围（不增加业务步骤）
已获用户明确授权：Step 01统一Cloud外壳并合并“业务&客户”，菜单4～6字，旧区域位置只读兼容；Step 02复用Cloud共享样式到AI控件，保原控制器；Step 10同步阅读导航和README。涉及assets/css/cloud-ui-overrides.css、派生cloud-ui.css、scripts/build-modules.py、js/app.js、js/nav.js、config/nav.json、js/components/session-store.js、index.html和当前阅读发布器。验证先视觉/入口，再审计、整改Step 06/07，不继承旧通过，不推进正式G3。

审计整改实际落点补记：Step 06使用scripts/build-modules.py注入原话后独立拒联确认及托管提交/重试检查；Step 07使用js/adapters/ai-finance.js、cloud-resources.js、ai-config-store.js及既有module-host/ai/cloud边界，补原范围的财务导出、资源身份和专业模型持久化。无新增业务FUNC、生产接口或原型目录。

## 2026-10-26 审计后12组已授权修复
沿当前S7步骤修复已有范围，不开新迭代或新项目。第1批涉及mock/data.js、session-store.js、organization-store.js、business-link.js、module-host.js、cloud.js和build-modules.py：恢复隐藏业务页的原Cloud角色资格、显式有权监管读取与只读边界。后批按open-items最新12项标题映射既有step-01/03/04/06/07/10；C07保持待定。审计附录仅阅读索引，正式验收R表不新增或删改。


## Step 11: 已批准统一七分类与三配置菜单

### Source IDs
SRC-001, SRC-002, FUNC-2019, PAGE-2006, PAGE-2110, PAGE-2111, PAGE-2223, PAGE-2228；本轮用户确认及执行顺序见docs/decisions.md最新节。

### Goal
同一目录管理七分类，字段/字典及AI标签分菜单集中维护；原8项保留待验，不声明全局通过。

### Files
- scripts/category_build.py、scripts/build-modules.py
- js/components/unified-categories.js、js/components/category-links.js、js/components/catalog-store.js
- js/adapters/ai.js、js/adapters/cloud.js、js/adapters/unified-ai.js
- js/components/module-host.js、js/components/session-store.js、js/nav.js、config/nav.json、mock/data.js、index.html
- js/modules/ai.bundle.js、js/modules/cloud.bundle.js、memory/reuse-provenance.json

### Expected Change

- update（仅已批准的统一分类、三配置菜单及其生成产物；不增加业务范围）

### Work
- 保原lead/aftersales/activity和字段/路由/历史快照，新增四项AI分类为未配路由；首访不再新选，不清历史。
- 单一分类所有权，AI页面只读目录、配置标签，不另维护分类。字段库已独立，分类保原fieldId引用、顺序/显示/必填。
- 分类到租户AI上下文独立关联；严格范围/版本/保存回读；引用或未知阻止分类删除。

### Acceptance
- 新旧目录幂等升级、删除后不复活，未知/同名实体冲突不自动合并。
- 供应商/租户类型/标签上下文、未映射、权限/存储隔离不破坏；AI不写业务字段。
- 两次正式构建一致，原全屏拖拽生成器/样式/原执行模型保持；受影响UI独立实验，不覆盖105/113证据或8待验。

### Verification
JS语法/资源闭包、当前bundle隔离模型与DOM、受支持原HTTP主页面。file及上传旧拒绝不重试，不调用真实接口。新证据使用unified-20261028独立文件名。

### Verification Skill
prototype-verifier

### Dependencies
原Step01–10现状；用户已允许8项保留待验，不以其完成为本轮前提。

## Step 12: 已批准分类绑定与条件单路编排

### Source IDs
本轮可信用户确认（父任务转交2026-10-28 10:59及11:03 +08）、PAGE-2228/PAGE-2006、原SC-2029/SC-2037/BR-2045；新增确认见docs/decisions.md最新节。仅授权范围内维护，不改冻结分析输入。

### Goal
保留基础信息后进入全屏的编辑器，模板精确关联分类；AI按状态/意向标签，云按状态/分类导入/培育字段，以IF/ELSEIF/ELSE优先级只选一条合法出口。

### Files
- scripts/flow-editor.patch.json、flow_editor_build.py、flow-canvas-ui.js、flow-canvas-ui.css、flow_routing_build.py、flow-routing-store.js、build-modules.py
- js/components/flow-routing.js、flow-status-domains.js、js/adapters/unified-ai.js
- js/modules/ai.bundle.js、cloud.bundle.js、index.html、memory/reuse-provenance.json及生成的既有共享样式

### Expected Change
update（唯一正式入口和现有生成链；不改1.2/AI参考、菜单、原导入与数据）

### Acceptance
基础分类必选、全屏往返草稿/取消/失败/未知回读；类型及渠道白名单、稳定状态域/标签上下文、空值与未就绪、优先级及唯一ELSE、重叠/循环/版本/权限/幂等。旧模板图/历史精确保留，新保存追加版本，不启动呼叫或自动推进。分类删除检查新模板引用。

### Verification
JS语法、纯路由与权威Store合成模型、实际主项目临时HTTP全新非持久Chrome、两次生成一致和参考指纹；明确区分UI、模型、file未验和供应商待核。不得重试已拒file/上传。

### Verification Skill
prototype-verifier

### Dependencies
原Step01–11及本轮明确写入交接；原112/113和2059工程缺证不被本轮模板证据改写。

### 2026-10-28 当前画布表现调整（Step 05 / Step 12）

用户请求“流转规则模板的拖拉拽能否像图这样设计”：沿用当前规则，将编辑器调整为分组组件库、点阵大画布和按需展开配置。新增可视开始端口、节点拖线、画布平移/缩放与组件库收起；开始仅是显示锚点，必须明确连接或选择起始业务节点。节点/边仍由原模型保存，新增分支类型由用户明确配置；删除条件、只读、失败/待核、新保存版本与已有记录引用保护不变。验收覆盖真实拖入/移动/连线、取消与重复、缩放落点、草稿条件保留、校验展开、正常保存回读及只读锁定；不推进其他步骤或全局阶段。

### 2026-10-28 单选处理方式与一次旧模板清理（Step 05 / Step 12）

- 用户明确要求节点处理方式改为单选，先选方式再编排分支；旧模板只清理现有项，未来仍保留正常保存版本。
- 新增维护源：`scripts/flow-node-config.js/css`、`scripts/flow-template-cleanup.js`、`scripts/flow_template_cleanup_build.py`；调整`flow_editor_build.py`、`flow_routing_build.py`、`flow-routing-store.js`、`js/components/flow-routing.js`、`js/adapters/cloud.js`与主生成链及其已有产物。
- 验收：顶部先见节点信息；AI/人工/预外呼单选，未选不展开分支；自动提供对应通话状态、AI标签按需选择；切换保留原条件并拦不兼容新保存；新保存仅一个有效方式，既有记录按固定事实读取；当前旧模板一次退出活动列表、旧关联不可接新记录、既有记录详情不破坏；后续V1/V2及刷新持久化保持。
- 验证：真实主项目HTTP新隔离浏览器、模型与权威清理函数检查、重复构建和参考指纹，不代表file直开或真实供应商联调。


### 2026-10-29 完整继承核对的已授权维护源补充

- step-01/02/07：`scripts/ai_parity_build.py`、`js/adapters/ai.js`、`js/adapters/ai-config-store.js`、`js/adapters/ai-finance.js`、`js/adapters/cloud.js`、`scripts/build-modules.py`。原字段/查询/来源片段及候选保存保留已确认规则，旧源只读，统一生成。
- step-01/03/06：`js/app.js`、`mock/data.js`、`js/components/session-store.js`、`js/components/module-host.js`、`js/components/organization-store.js`、`js/components/contact-policy.js`、`js/components/category-links.js`、`js/pages/organization.js`、`js/pages/contacts.js`、`assets/css/cloud-ui-overrides.css`及既有生成样式/入口。
- step-12：`scripts/check-inheritance.cjs`、`memory/full-inheritance-audit-20261029.json`，记录43承载/113动作/222原引用的四维核对、适用回归与未验范围，不把占位或外部未核声明为成功；不新增业务FUNC或页面。


## 当前S7补充：2026-10-29 已确认权限同步

- 授权：用户逐项确认当前五角色权限矩阵后直接要求“把权限更新进原型”；沿原本地Mock例外，在唯一现有原型实施，不新建原型、不修改正式分析/G3或永久工具。
- 归属：现有Step01/02/03/04/07的同一项权限一致性修订，来源为本轮直接用户确认与docs/interaction.html中的当前矩阵。既有FUNC/PAGE/ACTION不重编号；关联Step03账号/成员、Step04分类与AI专业、Step07禁呼及专业继承。
- 文件：js/components/role-permissions.js（新增统一权限策略）、session-store.js、organization-store.js、module-host.js、contact-policy.js、js/pages/organization.js、js/app.js、mock/data.js、js/adapters/ai.js、ai-config-store.js、ai-finance.js、cloud.js、cloud-resources.js、scripts/build-modules.py及既有生成模块/index资源版本。
- 实现：五角色由全局超管/当前租户组织与成员判定；模块保独立使用授权，坐席为本人关联能力；菜单、专业动作和原对象范围使用同一确认口径。保留原业务/对象/状态/电话及未保存保护，不清理已保存数据。
- 本轮用户此前要求暂停验证仍有效：只实施及生成交付脚本，不执行功能回归、浏览器操作或验收，不写新的pass，不修改workflow/verification/circuit状态。构建所需语法处理不等于权限验收。实现状态为待回归，旧通过不能覆盖本次变更。


## 当前S7补充：2026-10-29 Step06 单一黑名单与天润目标

来源：本轮用户直接授权，见 `inputs/blacklist-change-authorization-20261029.json`。本轮在原址调整 PAGE-2007，不新建项目或重写冻结分析；此前公共禁呼/AI专项双页签验收结论不替代此次验证。

落点：`js/pages/contacts.js`、`js/components/contact-policy.js`、`js/adapters/ai-special.js`、`js/adapters/ai.js`、`js/components/module-host.js`、`scripts/build-modules.py`及生成模块；同步现有权限说明、README及成员授权文案。

验收：同一分组/号码页无双页签；保留原AI分组与批量操作、来源与期限、存储失败及草稿；新增天润目标可选择方向/外呼范围、保存重开回读、详情、停用及重试；AI与天润状态分别显示，天润无虚构远端分组；手机号与带区号固话均可录入；旧拒联来源不丢失/不复活/不扩大解除权；同号多组移除不清其他来源，短期到期不显示远端已解除；云呼叫单模块租户可读取有权页面；无真实请求、阻塞JS错误或本地资源缺失。验证为本轮 step-06，不宣称整版S8或生产联调完成。


## 当前S7补充：2026-10-29 菜单归属与名称统一

用户直接要求整体检查并一并调整错位和不清晰的菜单，尽量复用、不新增无必要功能。本轮为现有Step01导航及Step02原页面呈现的维护，不重跑/改写冻结分析，不推进G3。

- 文件：config/nav.json、js/nav.js、js/app.js、mock/data.js、js/components/session-store.js、scripts/build-modules.py、scripts/category_build.py、js/adapters/ai.js及既有生成模块/index版本；同步现有docs/interaction.html、docs/role-permissions.md、功能说明.md、README.md。
- 范围：保持41个页面/38个菜单及既有五角色；AI配置归位，AI服务/充值归服务分组，AI线索回访归客户维护；业务字段/坐席配置记录明确对象，AI及IVR任务、记录与统计统一名称。只改显示名称、分组顺序、说明和原面包屑，不合并不同数据模型、不新增控件或操作。
- 验收：页面ID、原路由、菜单开关、模块、电话范围、权限代码和矩阵授权单元格逐项与本轮前比对；导航和矩阵位置/名称一致；生成模块保留原控制器及过滤/操作；真实获准HTTP页面验证改动入口和新名称，无新增阻塞JS错误。浏览器仅查看，不充值/调账/删除/拨号/新建账号或角色；file运行及真实供应商缺证保持。

## Step 13: 已确认品牌导入与填写字段配置联动

### Expected Change

create/update

### Goal

落实本轮用户逐项确认并直接授权实施的字段配置变更，保留既有功能、字段身份、引用及历史数据。

### Files

- `scripts/field_model_build.py`、`scripts/field_ui_build.py`、`scripts/field_import_build.py`
- `scripts/field-import-store.js`、`scripts/field-import-ui.js`、`scripts/flow-routing-store.js`
- `js/components/import-workbook.js`、`scripts/build-modules.py`及生成模块、入口资源版本
- `scripts/check-field-configuration.cjs`及本轮验证记录

### Inputs

`inputs/field-configuration-authorization-20261029.json`及本对话已确认整合需求。原冻结输入、其他版本和既有未验证边界保持，不新增业务功能编号或冒充G3冻结。

### Work

字段库明确品牌和IMPORT/FOLLOWUP用途，导入业务编码必填，同品牌同用途非空编码唯一；分类importFields与原fields分开保存。导入模板、列映射、类型校验、值保存和条件目录联动；规则以来源和稳定字段ID读取。保旧目录及原版本指纹；有引用字段锁身份和结构，当前/历史引用均阻删，历史快照不追随新定义。

### Acceptance

两用途同名/同码独立；跨品牌不可选；分类双Tab草稿与引用互不覆盖；导入映射无歧义、必填和系统列原校验保留；模板候选仅来自当前分类对应用途；未提供值不当空；旧读取0写入、旧ID/字段指纹/历史快照保持；允许名称/选项文案和新增选项，不允许改变引用字段含义或删引用。

### Verification

模型和导入/路由的隔离VM正反例、源语法和资源版本核验、构建前后无关控制器指纹比较、实际本轮独立HTTP页面检查。临时HTTP使用独立浏览器来源，不更改原file环境数据；不重试既有file自动验收限制。不以本轮专项通过替代整版S8或供应商联调。

### Verification Skill

prototype-verifier


## Step 14: 所有普通数据列表默认更新时间倒序

### Expected Change

create/update

### Goal

按用户直接要求统一现有普通列表默认顺序，在筛选后、分页前按真实更新时间倒序；保原业务语义顺序、引用、权限及历史数据。

### Files

- `js/components/list-order.js`、`scripts/list_sort_build.py`、`scripts/list_sort_cloud_build.py`、`scripts/list_sort_ai_build.py`
- `js/components/organization-store.js`、`js/components/contact-policy.js`、`js/adapters/ai-finance.js`
- `scripts/build-modules.py`、`js/modules/ai.bundle.js`、`js/modules/cloud.bundle.js`、`index.html`
- `scripts/check-list-order.cjs`、`scripts/check-inheritance.cjs`及本轮验证记录

### Inputs

`inputs/list-order-authorization-20261029.json`；原现有列表、筛选分页、保存模型和已确认权限/字段/历史保护逻辑。

### Work

同一纯函数解析真实更新时间及可靠原时间，缺失稳定置末；Host账号/成员、品牌租户和黑名单、AI各普通列表、Cloud字段分类/字典/模板/业务批次/记录/资源/报表及待核卡片统一排序。补显式保存时间；旧读零写入，字段时间metadata不改变业务schema或旧配置版本。操作保持稳定ID/原数组索引，原始数据和业务配置序列不重排。

### Acceptance

全量过滤结果排序后再分页；更新时间最大值优先，缺值不造时间；北京无时区/ISO偏移/秒毫秒正确；同时间稳定；编辑保存/刷新后新更新记录置顶；原引用及快照继续可读；成员页不读取其他租户成员更新时间；原权限、条件优先级、导入预览行及对话/轮次顺序保持。

### Verification

隔离VM验证日期解析、稳定不变性、实际Host/AI/Cloud列表、分页和操作目标；覆盖清单逐页核对；字段配置31组回归；资源闭包/源指纹/旧通用回归前后比较；获准独立HTTP实页查看和原值保存置顶。file自动验收、真实供应商及整版S8/G3边界保留，不清理原浏览器数据。

### Verification Skill

prototype-verifier


## Step 15: 独立导入条件与最新业务分类配置

### Expected Change

create/update

### Goal

修复用户截图的导入字段条件强绑呼叫方式及分类V1/V2确认；每次配置自动读取最新分类，保原值和历史快照。

### Files

- `js/components/flow-routing.js`、`scripts/flow-routing-store.js`、`scripts/flow-node-config.js`
- `scripts/flow_condition_ui_build.py`、`scripts/build-modules.py`、生成Cloud模块与入口资源版本
- `scripts/check-flow-condition-sources.cjs`、`scripts/check-field-configuration.cjs`及本轮验证记录

### Inputs

`inputs/flow-condition-fix-authorization-20261029.json`及本轮用户两张截图，原字段来源/流转/权限和历史快照逻辑。

### Work

IMPORT独立于call channel/domain/result，AI允许状态/标签并可组合独立导入，Cloud允许状态/填写并可组合导入。UI独立模式、分类名称展示和自动最新读取；Store按最新catalog验证原stableID和比较值，保原身份/权限与运行快照。

### Acceptance

无channel无通话的ASSIGN/TRANSFER纯IMPORT可配置并求值；AI/Cloud组合正例，错来源/错域/未知或AI段伪装填写拒绝；缺导入值PENDING阻ELSE；类选项无V/无确认，连续刷新保草稿和失效字段名；旧draft保存用最新定义而旧template/record不写不迁移；PROCESS实际方式、三态、权限及手动推进不放松。

### Verification

先记录原最小失败红证据，再用真实built validator/evaluator、实际controller及store的隔离VM回归；保字段31和排序30；获准独立HTTP实页检查用户截图路径，无需保存测试模板。参考/源资源、既有回归和未验范围另列，不推进整版S8。

### Verification Skill

prototype-verifier


## Step 16: 四节点与客户跟进闭环

### Expected Change

create/update

### Goal

按用户最终确认记录在原址实现开始、转交、呼叫、结束四节点，明确承接方、归属与人员分配、AI场景、新跟进最新值及历史快照的闭环。

### Files

- `scripts/four_node_model_build.py`、`scripts/four-node-model.js`
- `scripts/four_node_ui_build.py`、`scripts/flow-canvas-ui.js`、`scripts/flow-node-config.js`及对应样式
- `scripts/four_node_workspace_build.py`、`js/adapters/four-node-workspace.js`及页面样式
- `js/adapters/four-node-execution.js`、`js/components/module-host.js`、`js/components/flow-routing.js`、`js/adapters/cloud.js`
- `scripts/build-modules.py`、生成模块、`index.html`资源摘要及本轮测试与记录

### Inputs

`inputs/four-node-implementation-authorization-20261029.json`，`docs/四节点与客户跟进闭环需求记录.md`，现有品牌字段/分类/流转及专业电话能力。

### Work

一个权威运行账本；四节点拖放即定类型，条件分支与连线同源，按分支承接方合法转交。导入强校验后启动固定流程；只分跟进人，AI需本租户场景。谁接听谁填写，正式保存快照与当前值原子更新，修正留痕，废弃/重新办理与未知执行不丢事实。旧专业入口保留，全部普通列表更新时间倒序。

### Acceptance

四节点无二次类型选择；独立IMPORT不绑通话；转交不受人员/场景缺失阻断；跨租户清空安排；重复导入不重复运行；每次跟进最新定义和值，历史封存；实际处理人唯一填写；并发/幂等/迟到回调不错误覆写；开始运行不随换绑换流程，完成或废弃后新运行从开始；真实通话与跟进统计分开；原专业路径可访问。

### Verification

真实构建产物JS语法、资源闭包与引用源指纹、四节点隔离VM状态链/异常/权限检查；字段/列表/条件来源回归；获准独立loopback HTTP浏览器验证编辑器与运行入口。明确未验file://自动直开、真实供应商与整版S8/G3，不用成功toast代替保存。

### Verification Skill

prototype-verifier


## Step 17: 四节点改造独立审计与修复

### Expected Change

create/update

### Goal

完成后对四节点及关联导入、分配、流转、跟进、快照、通话链做一轮独立审计，修复已复现问题并回归，不改既定需求或清理数据。

### Files

- `scripts/four-node-model.js`、`scripts/four_node_model_build.py`、`js/components/flow-routing.js`
- `scripts/four_node_ui_build.py`、`scripts/flow-canvas-ui.js`、`scripts/flow-node-config.js`及受影响样式
- `js/adapters/four-node-workspace.js`、`scripts/four_node_workspace_build.py`
- `js/adapters/four-node-execution.js`、`js/components/module-host.js`、`js/adapters/cloud.js`
- 复现/回归脚本、`scripts/build-modules.py`、对应生成模块和入口摘要
- 本轮audit17审计、修复、验证与推荐决策记录

### Inputs

`inputs/four-node-audit-authorization-20261029.json`、四节点完整需求、step-16当前实现及验证证据。

### Work

三个独立审计面先只读检查并用真实built模型/控件确认；保留具体红证据后按根因定点修复，逐项回归并复核正常链与原专业入口。根负责整合，避免并行源冲突；旧fixture失配与未接真实外部事实分别保留。

### Acceptance

可复现的本轮问题全部修复并有回归；字段引用、封存快照、租户及实际接听权限、并发和运行身份准确；导入到通话/归档闭环可用；普通列表排序与原专业功能保留。审计报告给出范围、问题/触发/根因/修复/验证及未验边界。

### Verification

当前built专项、独立负例及旧字段/列表/条件回归；必要的获准独立HTTP页面检查、源码摘要/资源闭包；不以静态扫描替代已知交互故障。file://自动操作、真实CTI/供应商及正式S8/G3状态保持。

### Verification Skill

prototype-verifier


## Step 18: 业务规则与产品工作区完整落地及复审

### Expected Change

create/update

### Goal

落实用户批准的6项业务规则及3项产品改进，保留既有功能、引用与历史，完成后独立审计并修复发现的问题。

### Files

- `scripts/four-node-model.js`、`scripts/four_node_model_build.py`及新核心专项
- `scripts/four_node_ui_build.py`、`scripts/flow-canvas-ui.js`、`scripts/flow-node-config.js`及样式／编辑器专项
- `js/adapters/four-node-workspace.js`、样式／workspace build helper及新真实控件专项
- `scripts/business_family_build.py`、`js/adapters/four-node-execution.js`
- `js/components/flow-routing.js`、`js/components/contact-policy.js`、`js/components/module-host.js`及原动作授权桥
- `scripts/build-modules.py`、生成AI/Cloud模块、入口摘要和本轮需求／实施／审计证据

### Inputs

`inputs/business-product-implementation-authorization-20261030.json`，需求记录第16节，原当前权威Store／字段库／专业入口。

### Work

开始条件入口、CALL完成要求、首次／复访／纠偏、分类业务域、受控转类、号码协调、人工资格、工作队列、批起呼与业务结果在同一模型与现有页面落地；新配置规则与旧run快照隔离。完成后做独立业务／权限／异常审计和定点修复，不伪报真实外呼。

### Acceptance

9项均有可见配置／操作与保存结果；字段／业务ID和历史快照不迁移不重绘；同号占用跨业务一致、未知不释放；转类不可绕过资料和旧运行终态；批次逐条反馈且幂等；队列和动作守卫同源、更新时间倒序；原专业入口保持；审计确认问题全部回归闭环。

### Verification

当前built真实模型／表单／editor和新增负例，保原174专项与历史fixture差异对照；获准独立HTTP实页业务链与资源指纹；实施完成后独立有限审计→修复→最终回归。file自动直开、真实provider/CTI、正式S8/G3保持未验。

### Verification Skill

prototype-verifier


## Step 19: 模板保存后重新编辑误拦截修复

### Expected Change

create/update

### Goal

修复截图所示正常END／TRANSFER保存后因缺少非适用methods而被兼容检查误拦，提示提供可理解的问题定位。

### Files

- `scripts/four_node_ui_build.py`、`scripts/flow-canvas-ui.js`
- `scripts/check-template-roundtrip.cjs`及本轮复现／回归证据
- 生成Cloud模块、`index.html`资源摘要及实施记录

### Inputs

`inputs/template-editor-compatibility-authorization-20261030.json`及用户截图，原四节点规范存储形状和保留数据／引用原则。

### Work

按节点类型核methods适用性：仅CALL要求数组，非call允许缺省但有值仍须合法数组；next结构及未知配置保护保持。移除普通界面原始JSON提示，真实异常指向具体节点；不迁移或改写原模板数据。

### Acceptance

新建→保存→重新打开→修改再保存，END-only／TRANSFER／CALL及入口分流与业务结论均不误拦；坏methods／next／未知配置仍阻保存且保原对象；只读历史不写入。

### Verification

当前built真实Store与实际editor roundtrip red→green；编辑器、字段、条件来源与原模型回归；获准HTTP实页保存并重新编辑，无file自动操作，不升级正式阶段。

### Verification Skill

prototype-verifier


## Step 20: 模板二次编辑与删除引用规则修复

### Expected Change

create/update

### Goal

区分当前配置维护与冻结业务执行，允许正常二次编辑及仅保留历史引用模板从列表移除，保全部精确版本和历史数据。

### Files

- `scripts/template_lifecycle_build.py`、`scripts/build-modules.py`及生成Cloud模块／入口摘要
- `scripts/check-template-lifecycle.cjs`及本轮引用／编辑往返验证
- 本轮授权、决策、审计和验证记录

### Inputs

`inputs/template-lifecycle-authorization-20261030.json`及现行模板冻结方案／历史快照／权限规则。

### Work

编辑仅被同模板未核配置保存／删除保护，旧业务待核仍按原方案核对。删除仅检查当前分类关联和未核配置引用，历史分类／业务／批次改为保留说明。显式移除事务原子归档完整模板、同步删除和原有快照索引，读取不迁移，原精确引用继续读取原版本。

### Acceptance

有权模板可二次编辑；未核业务不误挡新配置，未核配置仍阻；当前分类关联不可删除；切绑后历史引用可从当前列表移除，旧run／无planSnapshot旧引用和字段保护均保留；跨品牌／只读／并发版本／未知幂等守卫不放松。

### Verification

真实built Store及editor lifecycle负正例、原save-reopen9和相关模型／字段回归，获准独立HTTP删除确认／二次编辑页面核对；不操作用户原file数据，不升级正式G3/S8。

### Verification Skill

prototype-verifier


## Step 21: 条件出口可选默认路径与未命中停留修复

### Expected Change

create/update

### Goal

修复截图中呼叫／转交的合法纯条件路径无法保存，明确已知不匹配与资料待核的安全停留语义。

### Files

- `js/components/flow-routing.js`、`scripts/four-node-model.js`、`scripts/four_node_ui_build.py`、`js/adapters/four-node-workspace.js`
- `scripts/check-conditional-paths.cjs`、生成模块与资源摘要及本轮证据

### Inputs

`inputs/conditional-paths-authorization-20261030.json`、用户截图及已授权中途按推荐方案执行后留痕。

### Work

普通呼叫／转交允许单个或多个有条件出口而不必添加默认路径；可选默认路径仍唯一且在末尾，条件按顺序首命中。已知全不匹配留本节点／归属，呼叫可继续办理并保原跟进快照；待核阻后续及默认。START默认和首次分流可确定性、实际呼叫归档守卫不放松，不静默改条件。

### Acceptance

截图式配置可保存／重开；单IF和无默认的IF／ELSEIF正常；坏顺序／重复默认／空条件仍拦；无匹配不能推进，待核不能走默认；首次转交不能判定仍禁止导入；旧配置和快照不改，工作队列准确表达条件未满足。

### Verification

实际built Store与编辑器隔离复现→修复复验，条件、字段、模型、工作台及模板往返回归，获准HTTP编辑器页面核验；原file／供应商／全量正式验收边界保留。

### Verification Skill

prototype-verifier


## Step 22: 规划期旧流转数据和兼容分支清理

### Expected Change

create/update

### Goal

按用户明确无历史负担清理旧流转台账、模板归档和示例悬空引用，统一当前四节点规范。

### Files

- 当前模型／编辑器／目录／生成链及相关测试
- `scripts/current_planning_build.py`、`scripts/current_catalog_build.py`、模块存储形状及生成资源

### Inputs

`inputs/current-planning-cleanup-authorization-20261030.json`取代此前旧数据兼容保留要求，仅限本轮相关规划数据。

### Work

空台账直接生成当前规范；旧schema1规划台账一次性舍弃，不转换或归档，同时清分类旧路由关联与旧路由待核记录，保留字段定义和独立专业配置。当前schema2再次读取不清空。去旧模板／旧节点／旧业务回退与迁移提示，保以后新产生的运行、跟进、通话及转出方截止快照。

### Acceptance

真实首次初始化无旧模板／业务／归档索引／悬空种子；旧数据清理只发生一次且不清无关key；新配置持久重读；当前模板CRUD、分类字段、严格导入、分配／AI场景、四节点及逐次快照可用；坏JSON或未知结构明确失败。

### Verification

实际构建隔离存储清理与当前链路回归，获准HTTP页面检查；原file自动操作和正式阶段／外部接口验收不升级。

### Verification Skill

prototype-verifier


## Step 23: 字段参考分类与实际路由绑定解耦

### Expected Change

create/update

### Goal

模板基础的分类仅作字段参考，实际应用由业务分类路由配置显式关联。

### Files

- `scripts/four-node-model.js`、模板字段参考和路由选择UI生成helper
- `scripts/check-reference-category.cjs`、生成模块及本轮证据记录

### Inputs

`inputs/template-reference-category-authorization-20261030.json`及用户截图，当前四节点／目标分类和运行快照规则。

### Work

名称字段参考分类，明确不自动绑定；同品牌可选所有模板，绑定时按实际分类校验所用字段稳定ID／用途／类型／选项及AI准确上下文。集中构造目标分类有效方案，用于入口／导入／转类预检和新运行快照；模板参考值不变。包含转交的模板仅绑定线索业务域。

### Acceptance

保存模板不自动绑定；同品牌兼容分类可复用；缺字段、类型／用途／品牌不符拒绝；入口与跟进／通话运行始终按目标分类，已开始运行保捕获；无同名猜配或全局分类身份保护放宽。

### Verification

真实built Store／editor红绿测试、受影响回归及获准HTTP基础信息／路由选择验证；不升级正式阶段或真实供应商验收。

### Verification Skill

prototype-verifier


## Step 24: 参考分类、导入分配与跟进链条业务审计修复

### Expected Change

create/update

### Goal

业务和产品逻辑独立审计并直接修复已复现链路缺陷，无历史兼容。

### Files

- `scripts/four-node-model.js`、路由UI/helper、AI执行桥、模块场景投影和当前导入workspace
- `js/components/flow-routing.js`及本轮4组审计测试、生成资源和审计证据

### Inputs

`inputs/business-chain-audit-authorization-20261030.json`，当前已确认四节点、字段参考与实际路由绑定、每轮快照和显式分配规则。

### Work

审查并修已复现配置待核进入新运行、重开准入遗漏、已知预填正式保存仍待核、手工列映射入口缺失、AI当前及下游标签依赖核验不足、路由预览误用参考目录。只改当前产品合同，保实际分类／字段／租户／运行身份和未明确事实不放行。

### Acceptance

新运行只消费明确已确认配置，旧已开run按原方案；映射按稳定字段校验且变更使预览失效；AI实际分类／执行租户／场景／tag版本及下游依赖一致；预填known正式确认可判断、absent仍待核、CAS不放松；实际路由预览使用实际分类目录。

### Verification

独立built VM红绿复现和当前链条回归，获准HTTP导入映射／实际分类预览／办理入口验证；只定向S7，不推进正式S8/G3。

### Verification Skill

prototype-verifier


## Step 25: 多值条件判断与填写提示

### Expected Change

create/update

### Goal

比较值可明确按多值判断，填写方式与运算符语义一致。

### Files

- `js/components/flow-routing.js`、`scripts/multiple_values_ui_build.py`及构建接入
- `scripts/check-multiple-values.cjs`、生成模块与本轮验证记录

### Inputs

`inputs/multiple-condition-values-authorization-20261030.json`和用户比较值截图。

### Work

标量字段增加不属于任一值，数值／日期补集合判断；属于任一只需一个匹配，不属于任一须全部不匹配。等于／不等于／大小比较保持单值。每行一值、空白行忽略、逗号按文本保留，两处编辑器统一类型解析和清楚示例。空值用专门判断，未知不反向放行。

### Acceptance

文本多行集合、枚举多选、数值和日期集合可保存并正确命中／排除；EQ/NE多值仍清楚拒绝；入口／节点UI和解析一致，空值／unknown守卫保留，原规则身份与其他业务能力不改。

### Verification

实际built evaluator及编辑器多值正反例、受影响回归和获准HTTP输入／保存／重开；不升级正式阶段或真实供应商验收。

### Verification Skill

prototype-verifier


## Step 26: 流转模板筛选栏UI修复

### Expected Change

create/update

### Goal

修复截图筛选栏按钮错位、输入过长及说明混排。

### Files

- `scripts/template_list_ui_build.py`、`scripts/template-list-ui.css`、构建接入和生成资源
- 本轮授权、变更及验证证据

### Inputs

`inputs/template-filter-ui-authorization-20261030.json`与用户截图。

### Work

筛选控件独立Grid底对齐、统一高度，品牌与名称宽度合理，说明另起一行；窄宽自然单列。保fcBrand/fcKeyword及onchange/query事件、真实品牌value和所有业务行为。

### Acceptance

桌面输入与查询对齐、说明不挤占输入，窄宽不横溢；品牌切换、关键词查询、新建／编辑／保存功能不受影响，画布和弹窗样式不改。

### Verification

构建／实际获准HTTP截图与DOM尺寸、筛选行为及当前模板往返回归；仅UI定向验证，不升级正式阶段。

### Verification Skill

prototype-verifier


## Step 27: 导入首次分流诊断与样例提示修复

### Expected Change

create/update

### Goal

修复空名单预录即红报错、样例误导及行校验不指明条件，明确管理员资格与资料分流分别判断。

### Files

- `scripts/four-node-model.js`、`js/adapters/four-node-workspace.js/.css`
- `scripts/check-import-routing-guidance.cjs`、构建摘要及本轮证据

### Inputs

`inputs/import-routing-guidance-authorization-20261030.json`及用户导入截图。

### Work

首次分流依赖IMPORT资料时中性显示参与字段、检查后逐行决定；真实不匹配明确节点、字段值／空值及条件。首个节点依赖尚未产生的通话／填写结果仍报配置问题。样例改称格式示例且说明需补真实分流资料，不造值、不加默认、不改权限。

### Acceptance

ADMIN有权导入仍需行条件；空预录无假红错，格式示例不误承诺，错误行具体指出SC等原因；真实匹配可通过且顶部无旧红错；START输入条件与无条件路径正确，配置错不吞，严格正式导入保留。

### Verification

actual built模型／workspace复现红绿、相关导入／条件回归及获准HTTP页面验证；不操作用户原file数据或改原模板条件。

### Verification Skill

prototype-verifier


## Step 28: 分类控制的直接跟进与模板流转

### Expected Change

create/update

### Goal

拆开业务入库与流程启动，支持同一台账的直接跟进和按模板流转，并保留字段、跟进、通话、请求和权限完整链条。

### Files

- `scripts/direct_followup_build.py`、`scripts/build-modules.py`
- `scripts/four-node-model.js`、`scripts/four_node_model_build.py`
- `js/adapters/four-node-workspace.js/.css`、必要执行桥接
- 本轮专项检查、需求记录、产品规格与验证证据

### Inputs

`inputs/direct-followup-authorization-20261030.json`和用户已确认的两种办理方式。

### Work

分类显式允许直接跟进；导入整批选择办理方式。直接跟进保基础严格校验，不依赖模板、不创建run/节点，外呼方式与AI场景明确，复用分配、真实通话、本人填写、快照与限制。模板模式仍严格且失败不降级。直接业务后续明确启用当前分类流程，先收敛执行/待核/必要归档，保持同条业务，旧事实不完成新节点。同步需求和可追溯产品规格。

### Acceptance

未允许的分类不能直接导入；缺路由依赖但基础完整时DIRECT成功、TEMPLATE失败；缺基础必填/类型/唯一性两模式都失败。DIRECT三方式明确，AI无场景拒绝，完整呼叫到跟进归档可走通。跨身份代填、重复、未知和并行仍受阻。启用流程后原记录/历史不变，当前路由和补齐资料重新核验，禁止旧入口并行启动。已有模板功能与稳定字段身份保留。

### Verification

实际built模型和workspace专项正反例、分类保存回读、模板及专业能力回归、获准HTTP交互和桌面观察；后续业务与产品审计发现问题修复后重验。file自动操作和真实外部服务边界不提升。

### Verification Skill

prototype-verifier

### Evidence and Support

- Browser Evidence Tool: `playwright-cli when needed`（仅获准范围，file旧拒绝不重试）
- Support Skill: `superpowers-pm-prototype/skills/verification-before-completion`
- Support Skill: `superpowers-pm-prototype/skills/systematic-debugging`

### Dependencies

- None

### Failure Handling

- 已确认范围内实现错误在本步修复；需求事实冲突记录open-items并按来源处理，不能改冻结事实。
- 环境未验与实现失败分别记录；不将未执行项写pass，不修改工具/门禁。


## Step 29: 取消电话状态对退出与跨业务域导航的拦截

### Expected Change

create/update

### Goal

按用户当前截图“这个逻辑不需要”，移除通话、记录或电话状态核对对退出及切换业务域的前置限制。

### Files

- `js/adapters/cloud.js`
- `js/modules/cloud.bundle.js`、`index.html`、`memory/reuse-provenance.json`
- `docs/interaction.html`、`docs/role-permissions.md`
- 本轮局部验证记录及证据

### Inputs

当前用户请求及两张相同提示截图；原始文件路径与授权原话见 `memory/cloud-navigation-verification-20261030.json`。

### Work

Cloud适配器离开前只核当前身份和未保存表单，然后继续；取消电话状态检查及强制电话退出弹窗。重建2.0运行产物并同步当前权限说明，1.2只读引用源不改。

### Acceptance

通话中、在线、登录中、操作或管理请求待核、连接待核均不因电话状态阻拦跨域与退出，不自动调用电话signOut。跨页面后原通话仍在；未保存表单及失效权限仍拒绝。原文档不再要求上述电话退出前置步骤。

### Verification

实际adapter与当前built运行包隔离VM正反例、脚本语法／27入口资产摘要／只读源hash，以及隔离HTTP实页通话中切系统管理、回坐席、切业务和退出。继承测试旧角色5失败与favicon.ico非功能404照实保留；仅局部step，不声明全局验收。

### Verification Skill

prototype-verifier


## Step 30: 客户档案页签布局与状态交互修复

### Expected Change

create/update

### Goal

按用户客户档案截图“修复交互问题”，修复业务跟进与联系档案页签布局、切换与查询状态衔接。

### Files

- `js/adapters/four-node-workspace.js`、`js/adapters/four-node-workspace.css`
- `scripts/four_node_workspace_build.py`及必要的2.0导航状态适配
- `js/modules/cloud.bundle.js`、`index.html`、`memory/reuse-provenance.json`
- 本轮局部验收与验证记录

### Inputs

当前用户直接请求及客户档案截图：`/var/folders/m8/0z42hs_d07d926kd7cjz246m0000gn/T/codex-clipboard-e79577c0-6f59-4dbd-bce6-b5caa7bbaf09.png`。

### Work

客户档案使用同一个标题与页面容器，业务跟进／联系档案通过语义明确的页签切换。保留各自查询和分页状态，当前账号或租户变化重新核验并重置；原生档案详情与保存后的摘要刷新继续使用统一布局。只改2.0适配与构建产物，1.2参考只读。

### Acceptance

单一客户档案标题；页签与内容对齐、无独立挤压白块；当前页签可聚焦且选中态与tabpanel关联正确，鼠标与键盘可切换。两视图来回切换、查询、分页和导航快照恢复保持各自状态；跨身份不借用旧查询。联系档案详情可开，跟进保存后的摘要刷新不丢页签或重复标题。既有业务与原专业能力保持。

### Verification

当前built原生customer-directory与four-node-workspace隔离模型/DOM专项、现有workspace受影响回归、入口与参考摘要检查，以及获准HTTP真实页面布局／切换／查询复核。仅step局部，不提升S8或正式G3；不操作用户原file页面。

### Verification Skill

prototype-verifier


## Step 31: 新配置和新办理运行强制 IF／ELSE IF／ELSE 兜底

### Expected Change

create/update

### Goal

按用户“流转规则没有强制兜底条件，if，elseif，else还是需要的”的当前修订，令可执行新配置具有明确、唯一、末位的ELSE兜底出口。

### Files

- `js/components/flow-routing.js`
- `scripts/four-node-model.js`、`scripts/four_node_ui_build.py`、`js/adapters/four-node-workspace.js`
- 本次直接受影响的条件、导入、参考分类、多值及跟进链路回归脚本
- 当前Cloud运行包、入口版本、来源摘要及局部证据

### Inputs

用户当前直接请求与截图：`/var/folders/m8/0z42hs_d07d926kd7cjz246m0000gn/T/codex-clipboard-1e3b5e37-c65a-47bb-a2ad-91495b2292d3.png`。本轮仅修正模板路径规则，不因兜底自动改为DIRECT或猜测目标节点。

### Work

新保存的开始、呼叫与转交出口按IF、零或多个ELSE IF和唯一末位ELSE求值；不分支可仅配一条无条件ELSE。未配置兜底的新模板不能保存或供新导入、重新运行、启用流程使用。已有已捕获运行继续按原快照执行，原条件、历史结果和用户模板不自动改写。新导入／新run按已确认有效schema将缺省非必填IMPORT字段捕获为null，明确空／不匹配才进入兜底；必填仍拒绝，字段定义读取失败、历史未提供字段、通话／填写结果待核仍PENDING。界面明确类型、顺序、兜底目标与保存反馈。

### Acceptance

新配置缺少／重复／非末位ELSE均拒绝；原IF和ELSE IF条件及优先级保留，重叠时只命中首条。已知空／不匹配及新导入已归一缺省非必填字段可进入明确兜底；必填缺失、字段目录读取失败及未知不进入后续或ELSE。当前旧缺兜底方案不能接收新流程业务，DIRECT启用和新运行同样收口；已捕获旧方案可完成原办理且快照不改。编辑器显示IF／ELSE IF／ELSE并在缺兜底时定位节点，不伪造默认去向。

### Verification

实际built模型／编辑器／workspace正反例及受影响回归；显式构造隔离历史快照以保留旧no-match、联系限制和优先级反例；27入口摘要、只读参考及设计锁摘要、脚本语法与获准HTTP最小页面操作。仅step局部，不推进S8或G3，不操作用户原file页面。

### Verification Skill

prototype-verifier


## Step 32: 条件优先的节点分支编辑

### Expected Change

create/update

### Goal

按用户截图纠正节点配置：先命名，再配置条件与下一节点，继续添加条件；兜底收在末尾，避免初始长文与警告驱动交互。

### Files

- `scripts/four_node_ui_build.py`、`scripts/flow-canvas-ui.js`、`scripts/flow-node-config.js`
- 当前节点配置样式、直接受影响的编辑器回归脚本
- 当前Cloud运行包、入口版本、来源摘要与本轮局部验证证据

### Inputs

用户直接请求及截图 `/var/folders/m8/0z42hs_d07d926kd7cjz246m0000gn/T/codex-clipboard-1d4abe2f-e848-4e49-860c-55eb1bb4228d.png`：编辑命名、选择条件、选择下一节点，然后继续配置条件；不以大量文字和初始ELSE警告作为主要操作界面。随后用户明确“不要兼容旧数据，当前数据可以删掉”，授权本轮清当前流转模板和关联业务台账、保留组织字段。

### Work

以条件卡为主体，条件先于目标选择，新增分支不要求预先连线；空目标仅存在于编辑草稿，不投影为真实运行连线。唯一ELSE以末尾“其他情况”目标槽承接，缺项只在保存时给简短定位反馈。按用户最新授权重置当前流转模板及关联演示业务台账，不兼容旧数据；账号、租户、字段和分类元数据保留。新配置具备只读回读、排序、取消及稳定ID；后端唯一末位ELSE和非必填导入空值规则保持。

用户进一步明确结束节点仅两项：“按照无模板跟进”与“业务结束不跟进”。本步同步END动作：先结束原run，按配置同业务/当前租户转DIRECT或直接关闭，不增加承接角色配置，不自动起呼；原权限、联系限制和本人填写守卫仍适用。

### Acceptance

新节点不出现长篇说明或初始黄色兜底警告；命名、条件、下一节点、继续添加条件的顺序清晰。未选择目标的条件草稿不因重绘、readValues或sync丢失；画布不画幽灵连线。保存拒绝缺条件/目标/兜底并定位；补齐后IF/ELSE IF/ELSE及原比较值可保存回读。取消不写入，新配置只读回读完整。schema4一次重置旧台账和分类路由，不迁移旧业务；组织及字段不受影响，标记写入失败可安全重试，有完成标记后的坏数据不伪装重置。END仅两选项；CLOSE结束且无跟进队列，DIRECT同record同当前租户建无模板周期且不自动呼叫，未授权/跨租户/受限号码/代填仍拒绝。

### Verification

实际built控制器与原模型隔离专项，编辑器与分支/导入受影响回归；源码语法、入口和只读来源摘要；根代理获准HTTP实际操作和截图。仅step局部，不推进S8或G3，不操作用户原file页面。

### Verification Skill

prototype-verifier


## Step 33: 移除任务页额外统计

### Expected Change

update

### Goal

按用户截图及明确纠正“1.2 是没有红框这块东西的”，移除2.0预外呼与IVR任务页额外追加的“今日任务名单分布”，恢复1.2任务页面结构。

### Files

`js/adapters/cloud.js`、`js/modules/cloud.bundle.js`、`index.html`、`memory/reuse-provenance.json`及本次局部验证记录。

### Inputs

用户当前请求及截图 codex-clipboard-3e3ac952-da6e-4da9-ad58-998cea301df6.png；用户后续明确红框模块在1.2不存在。本次纠正优先于旧MIG-CLOUD-03迁移追加解释；不改写冻结源材料。

### Work

删除任务统计函数、任务render追加包装及对应内部导出。精准更新当前运行包内该adapter、摘要和入口缓存版本，保留并发中的其他代码。原任务列表及查询/重置不变。

### Acceptance

预外呼和IVR任务页均不显示额外统计；任务名称查询、空态及重置正常；原只读来源、入口资源摘要及代码语法通过。

### Verification

当前HTTP隔离浏览器1880×900，实际菜单访问两页、查询/重置；源码与运行包语法及资源/来源摘要核对。仅本次页面移除范围，不推进S8或G3。

### Verification Skill

prototype-verifier


## Step 34: 条件即时编辑与循环连接就地反馈

### Expected Change

update

### Goal

按用户两张截图追问，移除条件变更的待应用确认面板，将不允许的循环连接在选择目标时阻止，并给出简短、可定位反馈。

### Files

条件编辑生成期transform、`js/components/flow-routing.js`、`scripts/four_node_ui_build.py`、`scripts/flow-canvas-ui.js`，当前Cloud运行包/入口/摘要，以及本次直接相关验证脚本和局部证据。

### Inputs

当前用户“这两个又是啥”及截图：`codex-clipboard-5e8c42e0-3be4-444a-8ac5-65179f1e30fe.png`、`codex-clipboard-4bef50bf-25a4-4c05-a88a-fb1e24f25b59.png`。本步延续已确认不兼容旧数据及条件优先的编辑交互，不改变原分支求值、唯一ELSE或未知待核规则。

### Work

来源、字段和判断方式在当前草稿即时生效，兼容值保留、不兼容比较值按新类型/基数明确清理；不再显示三按钮待应用面板，不自动保存模板。普通路径、其他情况目标与画布连线共用防环约束，不把空目标草稿当成连线，拒绝非法选择时原路径/条件保留。保存仍防绕过并定位具体冲突，不暴露历史兼容话术。

### Acceptance

EQ/NE到IN/NOT_IN等兼容值保留；多值改为单值、空判断及不兼容字段变化不留下非法比较值，readonly/提交中/待核不能修改。无待应用面板或待处理变更阻塞。A→B后不能选择B→A、不能自环或通过ELSE/拖线绕过，多级回路同样阻止；合法DAG与空目标草稿正常。模型仍拒循环，保存错误简短并指向冲突卡片，既有多值、空值、未知/PENDING和END两动作不回归。

### Verification

实际built条件控制器与当前模型正反例、相关回归、源码语法/入口和只读来源摘要、根代理获准HTTP真实页面操作与截图。仅step34局部，不推进S8/G3，不修改或验收并行step33。

### Verification Skill

prototype-verifier


## Step 35: 人工与预外呼使用客户侧SIP通话结果

### Expected Change

update

### Goal

按用户确认“701写错了，就是710那套”，纠正人工外呼及预外呼误用接听标记作为通话状态。

### Files

- `js/components/flow-status-domains.js`、`scripts/flow-node-config.js`、`scripts/flow_condition_ui_build.py`
- `js/adapters/four-node-workspace.js`及当前Cloud运行包/入口/来源摘要
- 本轮状态域与实际执行、配置回读相关回归及局部证据

### Inputs

当前用户截图及710状态字典澄清；天润官方API的SIP响应与被叫状态定义。来源及限定见 `inputs/cloud-sip-status-authorization-20261030.json`。

### Work

人工/预外呼各自绑定客户侧SIP结果域，均提供200及710～724结果；接听标记1～4、40～43不作条件值。当前编辑草稿使用正确来源并清除不再有效的状态比较值，保存前不写入原台账或运行。模拟结果选择/回执按同一状态字典，不从座席接听推断客户接通。AI原状态保持。

### Acceptance

两方式均显示710占线等结果并准确保存/回读/求值；旧接听标记及另一方式来源不能冒充客户结果；未知结果继续待核，未完成重试不推进。编辑来源、快照及租户/本人守卫正确；模拟可选择710并生成710回执，AI不受影响。

### Verification

当前built控制器/模型/模拟事件链正反例、受影响回归、来源与入口摘要、语法及独立HTTP人工/预外呼选项与保存回读。仅局部，不推进S8/G3或声称真实供应商联调。

### Verification Skill

prototype-verifier


## Step 36: 转交路径允许本租户继续办理

### Expected Change

update

### Goal

修复当前用户截图中本租户选项被禁用的问题。

### Files

`scripts/four_node_ui_build.py`、`scripts/four_node_model_build.py`、`scripts/four-node-model.js`、`js/adapters/four-node-workspace.js`及当前Cloud运行包/入口/摘要；本次专项与局部证据。

### Inputs

用户“本租户为什么不能选”及截图；见 `inputs/local-tenant-flow-authorization-20261030.json`。

### Work

放开本租户选项，切换清旧指定租户；命中后当前租户继续至下一节点，保持业务归属、租户阶段和原安排，仅记录本地流转。导入预检、路径目标核对、执行与确认界面使用相同语义，不生成跨租户历史授权。

### Acceptance

本租户可选、保存与回读；本租户IF/ELSE导入及办理不依赖跨租户意向映射，不改归属或伪造OTHER承接；保留已有跟进及两种END动作；旧目标/路径令牌及伪造外租户目标拒绝；其他租户仍按原映射跨租户转交。

### Verification

实际built编辑器/模型/workspace正反例、相关回归、语法与摘要及独立HTTP选择保存回读。仅step36，不推进全局阶段。

### Verification Skill

prototype-verifier


## Step 37: 多个比较值填写提示

### Expected Change

update

### Goal

按用户截图将1111/2222/3333占位示例换成明确填写说明，并标明多个值须使用的判断方式。

### Files

`scripts/multiple_values_ui_build.py`、当前Cloud运行包/入口/来源摘要，以及本次局部证据。

### Inputs

用户当前请求及codex-clipboard-2140ca07-a92c-4afe-94ce-db84a5b81f09.png；不改变比较规则。

### Work

多值文本占位提示改为“多个值请换行填写”，提示区写明每行一个值及“属于任一值”/“不属于任一值”。普通节点与START共用提示。

### Acceptance

空白比较值区不出现1111等示例，明确换行和两种判断方式；现有条件读取、保存、求值正常。

### Verification

当前built原有多值22用例、语法/入口/来源摘要及独立HTTP文本字段实际显示与截图。局部文案验证，不推进全局阶段。

### Verification Skill

prototype-verifier


## Step 38: 错误节点使用报错同色底色

### Expected Change

update

### Goal

按用户截图，让报错关联的画布节点显示与提示相同的红色底色。

### Files

`scripts/flow-canvas-ui.js`、`scripts/flow-canvas-ui.css`、`scripts/four_node_ui_build.py`、`scripts/flow_feedback_build.py`及当前Cloud运行包/入口/摘要；本步局部证据。

### Inputs

用户“出现报错，将报错的节点底色设置为同色色值的红色”及截图codex-clipboard-a41425c8-baef-4a76-9bd2-8868daf5737b.png。

### Work

将节点/控件/条件路径错误定位到画布所属节点，报错与节点共用#fff1f0；Store合并消息缺位置时仅补显示定位，不改变保存校验。选择其他节点保留标记，修改错误节点时清除本次校验显示，重新保存重新判断；开始节点与原路径错误同样支持。

### Acceptance

错误节点浅红且颜色与提示一致；无关节点保持原色，切换查看不误移标记，输入修改后恢复；开始节点定位正常，原保存和权限规则不变。

### Verification

当前built既有相关4套52用例、语法/入口/来源摘要及独立HTTP真实多值错误、颜色、切换、输入修正和开始错误验证与截图。仅局部，不推进全局阶段。

### Verification Skill

prototype-verifier


## Step 39: 移除分类列表的AI标签配置入口

### Expected Change

update

### Goal

按用户红框截图移除业务分类列表“AI标签配置”操作。

### Files

`scripts/category_build.py`、`js/adapters/cloud.js`、当前Cloud运行包/入口/摘要及局部证据。

### Inputs

用户“这个功能感觉没什么用，是否可以去掉”及codex-clipboard-11baa33b-85e0-4a38-bcfb-043031351170.png。

### Work

移除分类行AI标签配置按钮及对应openTagConfiguration跳转包装；标签维护使用呼叫中心的AI配置独立菜单。

### Acceptance

所有分类行不显示该入口，编辑/路由配置/预览/删除仍在；独立AI标签配置页可正常打开。

### Verification

当前构建及原31项字段分类回归、语法/资源/来源摘要；独立HTTP核对7分类操作、截图及集中标签页面打开。不推进全局阶段。

### Verification Skill

prototype-verifier


## Step 40: 审计修复与开发交接口径统一

### Expected Change

update

### Goal

复现并修复AI-only冷启动名单准入阻断；保留所有联系限制，消除当前ELSE规格冲突并恢复有效继承回归，统一最新交接入口、计数和复核状态。

### Files

`scripts/four-node-model.js`、相关模型/AI导入构建源、`js/components/module-host.js`、`scripts/check-ai-only-coordination.cjs`、继承测试、运行包/指纹、需求记录及开发交付包当前规划源与导出。

### Inputs

用户提交的DeepSeek 2.0.0重新审计报告；已授权发现问题直接修复，开发工程上下文由开发确定。

### Work

AI导入显式等待共享联系只读模型，不授予Cloud界面/动作，不清理或初始化台账；异步期间重核账号、租户、配置与窗口。当前有出口节点统一唯一末位ELSE，未知事实继续待核。测试夹具按当前五角色及模块独立授权更新。交接保持DRAFT，正式S8/final与工程门禁不提升。

### Acceptance

AI-only管理员和运营冷启动正常号码可导入，限制号码仍拒绝、未知不放行、失效请求不提交；当前规格正文无ELSE相反要求，继承回归有效；最新入口、405字段/162局部检查和语义复核状态一致。

### Verification

失败复现、新专项/既有回归、构建语法资源指纹、独立HTTP真实上传及当前规划/包门禁；不声明真实CTI/供应商/认证/账务、file或整版正式验收通过。

### Verification Skill

prototype-verifier


## Step 41: 产品与原型全局验收准备及交付入口收敛

### Expected Change

update

### Goal

根据用户继续补齐S8/final的授权，修复原型交付入口、版本信息及全局复验中发现的问题，逐项核定当前产品/原型验收范围，保留真实工程和接口责任。

### Files

`index.html`、`js/delivery-nav.js`、`版本清单.js`、`scripts/build-modules.py`、`scripts/check-inheritance.cjs`、必要的当前业务生成源、memory验收/变更/开放项及全局证据；阶段/快照只由受控工具写入。

### Inputs

当前43功能/43页/146 AC/405逻辑字段/162局部检查/222原专业key基线；用户本次S8/final授权；当前实现及既有只读来源。

### Work

使用受控runtime同步及reopen开启新的验证轮次；修复入口对批准交付开关、资源和版本阅读的引用。按当前行为逐步重新检查40项实现及本步骤，逐条拆清Partial的原型与生产责任；以隔离浏览器采集角色/页面、核心链路、图集及交付视图证据。工程上下文/真实服务不写本地通过。

### Acceptance

四个核心阅读视图及版本可用；没有阻塞性资源/脚本错误；旧通过不作为新轮证据。当前规则、角色/租户、分类/字段参考/实际绑定、两模式导入/分配/跟进/通话和结束链条按现行决定实际可验；产品/原型与工程验收范围明确。

### Verification

当前构建回归、语法/入口/来源/字段引用核对、全部43页及核心动作真实HTTP浏览器、图集可见性和当前步骤逐项证据。最终按受控S7/S8/S9/final门禁推进；正式需求G3及生产接口不代确认。

### Verification Skill

prototype-verifier


## Step 42: 两模式具体执行安排与五档优先级

### Expected Change

update

### Goal

按用户2026-10-31明确授权，将TEMPLATE及DIRECT的当前CALL安排落到本租户具体AI/预外呼任务或人工坐席，并以统一五档执行优先级协调可办理的待执行记录，保留先导入后手动分配。

### Files

`scripts/four-node-model.js`、`js/adapters/four-node-execution.js`、`js/adapters/four-node-workspace.js`、`js/adapters/four-node-workspace.css`、`scripts/flow-node-config.js`、必要的现有构建转换、`scripts/check-execution-arrangement.cjs`、当前需求记录/产品规格与阅读入口；生成包由现有构建器刷新。

### Inputs

`inputs/execution-arrangement-authorization-20261031.json`；现有两模式、FUNC-2031/2034/2036/2037/2039、PAGE-2204/2227/2228，FLD-EXECUTION-TARGET、FLD-EXECUTION-PRIORITY、FLD-EXECUTION-QUEUED-AT。

### Work

同一步内分别实现模型与执行桥、工作区/模板交互、需求与产品规格投影，统一具体resourceId和1～5优先级合同。模板默认按实际承接tenant保存，当前批次可覆盖；导入未安排仍合法待分配，有明确安排则与导入同次验证保存。手动单条/同组批量分配保留。候选、提交、实际启动均核租户/方式/场景/资源及版本，目标失效保输入提示，不按首项猜测。队列优先级只比较同资源可办理待办，同级按入队时间；既有执行不抢占。跨租户清原安排，历史执行保持固定事实。

### Acceptance

两模式覆盖AI/PREDICTIVE/MANUAL：导入及手动安排可选择具体目标并回读；两个同方式任务可明确选其一并启动正确对象；五档默认中、可调整，非法值/跨租户/失效资源拒绝；同资源高优先先、同级先来先办，独立资源和在途执行不被抢占；模板租户默认及导入覆盖生效；先导入后分配、直接跟进分类门槛、未知同请求和原专业入口保持。

### Verification

实际构建模型/执行桥与UI专项回归，既有两模式/模板/权限/联系协调回归，JS语法/资源哈希，真实获准HTTP下两模式任务/坐席与优先级选择保存回读及桌面布局。仅核本地模拟，不替代file自动复验或真实供应商/全版工程验收。

### Verification Skill

prototype-verifier


## Step 43: 人工坐席安排可选与取消独立责任人

### Expected Change

update

### Goal

按用户截图和明确修复授权，在TEMPLATE和DIRECT中将人工外呼坐席安排分为指定坐席与人工分配（默认），预外呼只选具体任务，移除所有独立责任跟进人配置并保持真实人员留痕。

### Files

`scripts/four-node-model.js`、`scripts/four_node_model_build.py`、`js/adapters/four-node-execution.js`、`js/adapters/four-node-workspace.js`、`scripts/flow-node-config.js`、必要现有UI构建源及相关专项回归；既有需求记录、当前规格及DRAFT投影，原型运行包和入口由现有构建器刷新。

### Inputs

`inputs/execution-assignment-simplification-20261031.json`，用户前述两项反馈和截图中默认责任跟进人问题。FUNC-2031/2034/2036/2037/2039，PAGE-2204/2227/2228；FIELD-FLOW-EXECUTION-RESOURCE、FIELD-FLOW-EXECUTION-PRIORITY、人工坐席安排策略及系统实际人员事实。

### Work

人工分配分支不要求resourceId或人工责任人，保存为待分配，原单条/批量入口明确坐席后实际本人才能发起；指定坐席分支必须选择有效本租户坐席，实际承接由坐席绑定账号派生。AI/预外呼只配置其必要任务/场景，人员从合法任务资格及真实办理/接听事实确定，不凭空代填当前操作者为责任人。模板、导入及分配弹窗移除独立责任人输入；修复模型、权限可见性、工作状态、排队候选与批量起呼对旧必选责任人的依赖，保原租户/模块/对象动作授权。保旧历史只读，不自动迁移或清台账。

### Acceptance

新人工节点默认人工分配且无坐席/责任人必填；指定坐席才显示必填坐席。两模式导入均可人工分配而无具体坐席，后续原单条/批量分配有效。AI/预外呼不提交accountId也能保存并由有权任务操作者办理；预外呼无额外坐席字段，实际接听人填写及隔离保持。模板/导入/分配不显示独立责任跟进人；失效坐席/异租户任务拒绝，原优先级FIFO/未知幂等/在途守卫与历史快照保持。

### Verification

实际built两模式三方式专项、新旧模型/工作区/模板/任务目录回归；真实HTTP人工两策略、预外呼只任务、移除责任人、先导入后批量分配及保存刷新回读，检查源与运行包一致、权限和实际接听留痕。仅本地Mock增量，不继承旧S8/final或真实接口通过。

### Verification Skill

prototype-verifier


## Step 44: AI与预外呼任务内统一业务导入

### Expected Change

create/update

### Goal

任务内手工导入共用业务分类IMPORT字段，建立统一DIRECT业务及独立周期、完整字段快照和准确任务来源；保留AI场景独立导入而不创建模板运行。

### Files

`scripts/task-business-import-model.js`（新增：在既有事务闭包复用导入）、`scripts/four_node_model_build.py`、`js/adapters/four-node-execution.js`、`js/components/module-host.js`、`js/adapters/task-business-import.js`（新增：两模块共享导入UI）、`js/adapters/task-business-access.js`（新增：AI-only任务同步业务作用域，不授Cloud菜单）、`js/components/business-link.js`、`scripts/task_business_import_build.py`（新增：只读原页的有限转换）、`js/adapters/ai-import-field-mapping.js`（新增：场景引用/供应商参数映射）、`scripts/build-modules.py`及必要专项；既有需求/产品规格/DRAFT由同源维护链更新，运行bundle由原构建器刷新。

### Inputs

inputs/task-business-import-authorization-20261101.json；FUNC-2002/2019/2036/2037/2039；PAGE-2103/2111/2204/2227及预外呼任务页；FLD-TASK-IMPORT-SOURCE、FLD-TASK-IMPORT-FIELD-REFERENCE、FLD-TASK-IMPORT-PARAMETER-MAPPING、FLD-EXECUTION-TARGET、FLD-EXECUTION-PRIORITY。

### Work

共享模型复用当前分类DIRECT导入、基础必填/类型/枚举/编码唯一性、同请求幂等和五档安排，只新增准确来源。AI读取实际适配场景分类，预外呼本次选分类，显式带入任务；分类未允许DIRECT不能旁路。共同UI生成模板/映射/校验及保存全字段，AI场景引用共享IMPORT稳定ID并保供应商参数，不复制第二套业务定义。新统一记录只写权威业务账本，任务显示来源投影，原专业台账和旧记录不改；不自动提交供应商/起呼或伪造受理。不按手机号合并业务，接口/手工来源锁定与当前任务权限/版本/未知检查保持。

### Acceptance

AI与PRED任务内使用同分类schema及全部值/快照，下载模板和预检反例一致；AI已绑模板的分类仍能显式DIRECT且无run/node；新记录在统一业务列表及准确任务详情可读，五档回读。场景引用字段及供应商映射保存回读，缺必需映射/失效字段报实错。分类关闭DIRECT、异租户/无权/失效任务、接口源混入手工、字段变化/异步换范围、重复编码/未知重试不能写入错误对象。旧模板流程、人工分配、真实人员/历史与联系限制保持。

### Verification

新增模型/桥/共享UI/AI映射专项与既有40套适用回归、构建JS语法/资源闭包，真实获准HTTP的AI/预外呼自定义字段导入→统一详情/任务投影→刷新、模板关联分类独立AI及拒绝路径。仅局部本地Mock，不自动补盖旧S8/final或file/真实供应商通过。

### Verification Skill

prototype-verifier


## Step 45: 受控废弃结算与END/停止回执边界

### Expected Change

update/create

### Goal

修复当前3项生命周期组合缺陷，按用户明确选择的受控废弃规则保留缺失事实与未完成、不代填、不伪正常归档，可靠收尾后能继续同业务新运行或后继DIRECT。

### Files

`scripts/four-node-model.js`、`scripts/four_node_model_build.py`、`js/adapters/four-node-workspace.js`及必要同名CSS；新增`scripts/check-lifecycle-settlement.cjs`与工作区专项，必要既有fixture仅按新确认规则补前置，不删守卫；`scripts/build-modules.py`仅现有构建/溯源接入，现有需求/规格/同源DRAFT与当前图集说明。原审计目录只读。

### Inputs

inputs/lifecycle-audit-fix-authorization-20261101.json；用户报告AUD-01/02/03及A01原问题，原报告脚本当前复现/tmp/step45-reaudit-before.json。FUNC-2031/2032/2033/2036/2038/2039、PAGE-2227/2204；FLD-ABANDONMENT-SETTLEMENT、FLD-MISSING-CONTENT-CONFIRMATION、FLD-STOPPING-RECEIPT、FLD-END-CURRENT-CYCLE-ADMISSION。

### Work

受控缺内容废弃仅当前owner ADMIN在准确run/seg/实际人或UNKNOWN/冻结字段及接通范围上下文显式确认+原因，旧确认不能跨变化复用。无未知请求/事实冲突且真实执行/重试/attempt可靠停止后独立标记废弃收尾，不改正常archived/completed计数；保旧已废弃段本人后来补齐可收尾，后续DIRECT不扫描旧废弃archive真假形成死锁。END历史结构证明与首MANUAL当前周期例外分开，再次三方式周期强核当前分类开关。原accepted且未可靠结束的ACTIVE/ABANDONING跟进登记准确迟到拨打/接听/终态事实，含停止确认前首次到达attemptId；不新派发、不误挂当前run、不提前释放；closed未知新attempt原守卫保。UI显示缺失/阻塞/确认与原本人补录，不伪正常归档。

### Acceptance

普通reason不能绕人工缺失；仅owner ADMIN按准确run+expectedRevision确认。真实在途/未知/冲突仍ABANDONING，迟到身份/缺失变化需重核；可靠收尾后ABANDONED及重开，保缺失/未完成。旧存量弃置后本人补齐、多个旧run→END DIRECT→完成/启用流程均不永久死锁；废弃不能算当前正常完成。首END人工例外正常，resume MANUAL/AI/PRED均重验分类，历史合法不丢；停止原attempt真实回执顺序/乱序/重复计数准确，外来/跨run识别、closed新尝试/原权限与占用守卫保持。

### Verification

当前生成包新模型/工作区专项、原AUD02/AUD03正确断言原样转绿；AUD01旧普通reason前置与新策略冲突单独说明，用当前明确确认及旧存量补录的语义对照证明死锁解除，原审计目录不改。适用旧回归、源码/包/资源核验，真实HTTP控弃确认/禁止代填与新起呼、旧段收尾及后继直接周期；单步范围不冒充整版S8/final或供应商执行。

### Verification Skill

prototype-verifier


## Step 46: AI供应商独立字段及弹窗配置

### Expected Change

update/create

### Goal

按用户明确纠正，分类IMPORT共享业务事实，AI供应商传入参数及自定义列按场景和供应商各自配置，不强制所有参数仅来自分类；使用选择/配置弹窗代替单页全字段展开。

### Files

js/adapters/ai-import-field-mapping.js、scripts/ai-import-field-ui.js、scripts/ai_import_field_mapping_build.py、scripts/task-business-import-model.js、必要four-node-execution/task-business-import适配与专项；scripts/build-modules.py溯源；当前需求/同源DRAFT。生成包由root统一构建。

### Inputs

inputs/ai-provider-field-dialog-authorization-20261101.json；FUNC-2002/2019/2036、PAGE-2006/2103；现有分类字段、原AI供应商场景和任务导入链。

### Work

按scene+platform保存schema2映射，source IMPORT_FIELD引用稳定字段或CUSTOM_COLUMN场景专属列；冰兰/中科金可以不同参数名、类型和必需，固定专业参数仍核验。schema1/旧参数保可回读，不静默套用或删旧数据。父场景只摘要和动作，导入字段弹窗搜索/选择后弹窗配置，自定义参数也弹窗；子取消不改父草稿，父取消不保存，主保存事务统一持久。供应商切换隔离草稿，分类变化重验引用与异步范围。任务导入模板、映射、必填/类型/供应商参数及逐行快照同源，自定义列不自动变成业务分类字段，unknown/幂等/预检变化/权限守卫继续保持。

### Acceptance

两个不同供应商场景各自映射同一业务字段到不同参数且互不污染；自定义供应商列可下载导入、校验并留参数及定义/值快照；无效引用/重复参数/非法类型/缺必填/映射变化拒绝。场景页无全字段铺开，选择与配置均弹窗；新增/编辑/取消/保存/重开/平台切换隔离及授权正确。业务记录只收分类字段，历史快照不变。

### Verification

模型及实际构建UI专项、原AI映射和任务导入适用回归；当前全部脚本回归及S7预检；真实HTTP冰兰与中科金弹窗配置/取消/保存重开，以及场景自定义列导入及参数快照回读。本轮不升整版S8/final或真实供应商通过。

### Verification Skill

prototype-verifier


## Step 47: 原添加字段单入口及线上式配置弹窗

### Expected Change

update

### Goal

恢复AI场景原添加字段入口，点击后才选择导入字段或手工添加供应商字段，采用用户线上截图的原弹窗布局和文案，不另设主场景双入口/大配置面板。

### Files

scripts/ai-import-field-ui.js/.css、scripts/ai_import_field_mapping_build.py、scripts/check-ai-import-field-dialogs.cjs及旧mapping UI fixture、scripts/build-modules.py溯源；现行需求/同源DRAFT。

### Inputs

inputs/ai-add-field-entry-authorization-20261101.json；本轮用户截图仅视觉依据；FUNC-2002/2019/2036、PAGE-2110/2103、现行Step46模型。

### Work

原表格下保+添加字段单入口→来源选择弹窗→IMPORT搜索选择/配置或手工添加场景信息。手工弹窗左标签右输入，业务信息只读场景传入信息、字段名称、参数名、必填/选填radio及取消/确定，保已支持类型作为次要设置。已有参数紧凑原表，不设独立新增大面板。保schema2、供应商/场景隔离、类型/必填验证、固定协议约束、子取消不改父/父放弃不落库及权限/异步守卫。截图的50计数不擅自改变现有64/80模型上限。

### Acceptance

主场景仅一个原添加字段入口，双路径在点击后显示；两路径均能完成/取消，手工及编辑弹窗接近截图布局和文案，业务信息不可改、必填/选填radio可核，原表信息不丢。原参数与类型/固定必需、导入/快照/隔离守卫无回归。

### Verification

实际built弹窗及原映射UI专项，pure供应商13/真实任务模型8、共享UI/原适用回归；真实HTTP单入口→两选择、手工配置/取消/确认与父保存重开、既有导入字段路径及截图排版。S7定向，不重盖整版S8/G3/工程/真实供应商。

### Verification Skill

prototype-verifier


## Step 48: 场景驱动导入、来源资格和分类入口/批次查看

### Expected Change

update/create

### Goal

落实用户确认的AI场景字段驱动/来源选择/模板FLOW候选及分类列表导入名单与批次查看；本轮只更新原型，开发交付包完全不动，待用户确认。

### Files

scripts/four-node-model.js/task-business-import-model.js及模型构建，ai-import-field-mapping/source helper，four-node-workspace/.css、AI场景配置转换/来源UI，four-node-execution、module-host、config/nav、业务分类入口转换，当前专项与必要fixture；root统一build。仅prototype内部文件。

### Inputs

inputs/scene-driven-import-prototype-authorization-20261101.json；只读审计/tmp/ai-scene-import-audit-20261101；已确认FUNC-2002/2019/2031/2036/2037/2038/2039、PAGE2006/2110/2228/2226/2204/2103；既有有限Mock例外。

### Work

统一importContext(options aiSceneId/executionArrangements/rows)，返fields/customFields/schemaReady/discoverySchema/needsGroupDiscovery/fieldBasisToken。AI投影core+场景已选引用/专属，非AI保原分类导入规则；混合实际首组按行核required。模板方式由真实入口定位，分流需先用core+IMPORT路由列检查组（不创建记录/不发正式token），再按组确定场景/正式字段，保输入。正式模板下载、列映射、校验、入库及参数/专属值快照同源；场景切换重取并失效旧预检。显式scene优先于模板默认。后续AI缺资料有当前owner ADMIN受控补充API/UI，类型/协议必需校验，不能无参start或改旧快照。

AI场景dataImportSource=MANUAL/AUTO/FLOW及旧importType精确兼容；未知/冲突不作FLOW。新增流转模板传入单选；模板配置/导入/分配/新起呼只读有效FLOW，独立手工只MANUAL，自动原锁保；分类/租户/权限继续匹配。旧手动场景不暗转FLOW；新增明确本地流程例子，不迁移用户存储。业务分类原表新增导入名单锁定当前准确分类，名单PAGE2226消费host带importLaunchId一次后打开；PAGE2204导入批次查看，名单/待分配保原单批分配，任务内导入保留。修中央download artifact调用错误及后续参数漏校验、默认场景覆盖。

### Acceptance

AI导入仅核心+路由需用+场景所需字段；未用分类optional/required不照搬；场景必需IMPORT/CUSTOM缺失拒绝，字段/场景/token变化拒绝，snapshot完整不污染分类。TEMPLATE条件分流、转交/END与混合首组保持，默认不盖明确选择，后续AI缺参有补充后才start。只FLOW可用于模板且MANUAL/AUTO不漏入，独立不读FLOW；未知来源fail-closed，旧运行/已发生事实保历史。分类列表可正确导入，批次入口只查结果/名单详情，原单批分配保持。开发交付包576文件全哈希及文件集合保持原样。

### Verification

新统一字段/来源/入口专项、原适用回归（旧fixture显式适应来源和新字段口径，不弱化负例），source===built/语法及S7预检；真实HTTP业务分类发起/模式方式场景/模板下载成功/场景必需值拒绝与完整导入/批次名单回读、FLOW配置选择及独立入口筛选、补资料和原分配。原开发包基线/tmp/step48-development-package-before.json终核不变。不capture/authoring/review/export、不更开发包状态。

### Verification Skill

prototype-verifier


## Step 49: 按入口区分任务直接导入与分类模板导入

### Expected Change

update/create

### Goal

用户最新决定以导入入口确定办理方式，撤销Step48的AI FLOW来源；开发包继续不更新。

### Files

scripts/four-node-model.js、task-business-import-model.js与模型构建；AI场景来源helper/配置构建/原配置UI、four-node-execution；four-node-workspace.js/.css、flow-node-config.js、direct_followup_build.py、task_business_import_build.py、task-business-import.js；module-host/business-link及相关当前专项；prototype内部memory/docs。root统一build-modules，开发交付包/冻结材料只读。

### Inputs

inputs/entry-based-import-authorization-20261101.json，用户最新规则替代旧来源/入口条款；FUNC-2002/2019/2031/2036/2037/2039、PAGE2006/2110/2228/2226/2204/2103/2205及原有限Mock例外。

### Work

任务内手工/接口入口按任务或场景准确配置获取字段，创建同一台账DIRECT记录、无run/node，捕获不可变入口/渠道/任务/场景标识及参数快照；手工不可混入接口任务，接口仅静态Mock演示合同与本地回执，不伪报真实接入。分类入口保人工或接口导入到TEMPLATE，按实际入口/路由/场景投影字段与参数，无中央DIRECT模式选择。删除AI第三FLOW来源/新种子；MANUAL/AUTO均可用于模板选择，UNKNOWN/冲突不能猜，旧FLOW配置提示重新选择而不暗转；已发生历史保持。移除分类或模板是否直接跟进开关；任务DIRECT不依赖旧分类开关；旧DIRECT/结束节点合法后继/本人归档和串行守卫沿既有获准边界核验。批次/名单详情展示准确来源标识，原手动分配、任务坐席目标、五档与FIFO保持。

### Acceptance

分类只有人工/接口模板导入、无DIRECT选项及配置；任务MANUAL/AUTO按配置入口不能混入，成功记录DIRECT+稳定入口渠道标识且无run/node、跨租户/失效/陈旧token/未知/重复不可绕过。模板场景MANUAL/AUTO均候选、未知/旧FLOW不混入；场景字段/必需/类型/供应商快照同源。原DIRECT历史及受控废弃、后续结算、END和停止回执规则保持（旧分类开关不再限制新任务及合法续跟）。开发包全部576文件及集合不变。

### Verification

当前实际built模型/来源/场景/两入口UI专项与全量适用回归；旧fixture显式适应入口合同，不删除权限/串行/未知/历史负例。真实获准HTTP浏览器查看AI来源2选项、分类无开关、分类模板人工/接口入口、任务直接入口与名单来源/批次回读。source===built、语法/S7预检；开发包原哈希集终核。file自动/生产接口仍未验，不做开发包capture/authoring/export。

### Verification Skill

prototype-verifier


### 2026-11-01 Step49实页反馈修正（继续同一步）

用户截图AI任务24被导入执行目录挡成不存在；预外呼不接受替换成通用业务导入弹窗。用户明确确认在预外呼任务配置关联准确业务分类，导入沿原界面自动带入分类和IMPORT字段、不临时重选。任务分类保存为本地业务关联，不混供应商payload；M/API同源锁定，缺/冲突/失效时明确去编辑任务补齐，旧记录只读不因现配置失效而丢失。AI导入按原任务来源/导入资格独立读取，起呼可用资源目录不能误作导入目录；未知/终态/权限守卫保留并显示准确原因。入口模式、来源标识、五档、手动分配及开发包冻结保持。原56套/876结果是本次追加前候选证据，不替代修正后的重新验证。


## Step 50: 当前业务逻辑独立审计与可复现缺陷修复

### Expected Change

update/create

### Goal

按用户明确授权，审计现有已确认业务逻辑和组合边界，发现可靠逻辑缺陷直接修复；保持原型与开发包等待确认的边界。

### Files

scripts/four-node-model.js、task-business-import-model.js、模型构建及必要现有配置构建；js/adapters/four-node-execution.js、four-node-workspace.js、task-business-import.js、AI字段/来源、js/components/module-host.js/business-link.js及精确相关native转换；新audit专项脚本/原适用回归；memory/docs局部记录与报告。仅prototype内已授权业务文件，不修改开发交付包/冻结分析/旧审计证据。root统一build。

### Inputs

inputs/business-logic-audit-authorization-20261101.json，当前用户决定和entry-based-import-authorization及Step42～49适用规则，既有有限Mock边界，FUNC2002/2019/2031/2032/2033/2036/2037/2038/2039及当前页面。

### Work

先独立读源并做当前built基线；三路审计入口/字段契约、native配置/权限桥、生命周期/优先级/回执，root跨链和真实HTTP。每一问题须最小复现和正确行为断言，分类严重度/触发/实际与预期/根因；原始失败保留后精确修复，不删除旧负例、不给未知或缺配置自动成功。核TASK/CATEGORY模式与来源、任务分类/场景/字段/供应商参数FP一致，私有事务不可伪造，旧历史快照与本人归档、受控废弃/结算/停止回执、同资源FIFO及跨资源串行、切租户/授权撤回/陈旧配置与同次未知结果。发现规则未定义只记录待确认，不凭审计扩功能；已明确实现缺陷在本步修完。

### Acceptance

当前确认的入口/模式/渠道/任务分类/场景及字段在所有声明入口一致；任务不能隐式转模板或错误复用起呼目录，权限及源锁不能借调用链绕过；导入请求/未知回执/重复/失败/历史/执行收敛不丢失或假成功；运行与直接周期、办理人和租户/业务类别变更遵循同一约束。所有本次可靠缺陷均有修前失败与修后通过证据，当前适用全量与新增组合回归0失败。开发包576文件/集合与旧audit7哈希保持。

### Verification

实际built模型/native controller/host/共享UI独立组合用例，根因定位后定向红绿、原适用全量（source===built/语法/模块资源和S7预检）；影响可见行为的修复用获准HTTP真实页面核验并保截图/DOM。报告说明覆盖、可靠缺陷/修复、复现证据和未验边界；file自动/真实API/供应商/CTI不伪判通过，不升整版S8/G3，不更新开发包。

### Verification Skill

prototype-verifier


## Step 51: 任务导入交互收敛与原列表新旧名单融合

### Expected Change

update/create

### Goal

按用户最新截图纠正重复任务导入配置及新旧名单分块：任务已关联配置自动读取，同一轻量导入；历史直接在原表，新字段缺失空。开发包继续不更新。

### Files

js/adapters/task-business-import.js/.css；新增task-roster-view.js/.css和scripts/task_roster_build.py；task-business-import-model.js、four-node-model.js、four_node_model_build.py、four-node-execution.js；module-host.js、task-business-access.js；root精确task_business_import_build.py原入口与build-modules.py注册；新独立专项和现有UI fixture必要口径适应；prototype内部memory/docs。

### Inputs

inputs/unified-task-import-roster-authorization-20261101.json，最新用户规则优先Step49/50‘单独统一业务名单’展示口径；原TASK DIRECT/CATEGORY TEMPLATE、五档、fields/typed/FP、未知回执、隐私及旧事实约束均保持。

### Work

AI/PRED一份共享任务导入renderer，自动任务关联场景/分类/字段，无临时重选；缺/冲突关联去配置维护，不能靠名称/首项猜。主流程文件或粘贴→检查编辑→确认，批次名从文件名或任务+本次时间派生、选填覆盖，优先级中默认可折叠5档；顶部task选择与同窗内容联动，移除空白继续中间层。新只读taskRosterRecords覆盖有权原导入、当前有效task安排和本租户实际task执行历史，独立原API来源语义；历史native数据从原model读取、不迁移。原AI/PRED表合并显示，只有稳定业务record引用且同scope去重，历史缺新字段空，原状态/时间/动作/号码脱敏保持；不能把新biz行伪喂旧原生controller。去recordsPanel分块/‘原专业’分界/独立原历史按钮，保原正常历史入口；合并列表总数来自确认集合，任一源未知保已知旧数据并明确待核，不造0或供应商受理/拨打事实。

### Acceptance

关联配置task点开即可读正确动态模板；AI/PRED同流程，无场景/分类重选或额外空窗；默认可直接检查提交，选填批次/五档能覆盖且server规则不弱化。已有未知回执/原requestID/typed/FP/失败草稿续入scope等全部保。任务原table显示旧native和新business，旧缺新字段空、不改原保存或call事实；稳定去重/跨tenant/权限/截止私有过滤、native与biz操作不可混用；配置变化/异步切scope/读取失败/旧data无配置只读保持。开发包576及原audit7文件hash/集合不变。

### Verification

当前built model/context/roster/newUI/native原table独立正负与原适用全量；原fixture按最新已配置任务前提适应，不删除旧故障/权限断言；source===built/JS语法/模块资源/S7预检；实际HTTP配置task自动fields、顶部选择即填、AI/PRED同主流程、合并原列表旧空新实及唯一去重、草稿/回读。只本地Mock，不伪报file/生产/整版验收，不开发包capture/authoring/export。

### Verification Skill

prototype-verifier


## Step 52: AI通话列表移除逐行拒联入口

### Expected Change

update

### Goal

按最新截图收敛AI通话记录列表操作，列表只保留详情；原有权人工核实能力放在准确通话详情内，开发包保持冻结。

### Files

scripts/build-modules.py、生成的AI模块及复用指纹；prototype内部授权、memory/docs及本步验证证据。原参考、contact-policy、contacts、专业存储和开发包均不改。

### Inputs

inputs/ai-call-refusal-entry-authorization-20261101.json；FUNC-2023/2020/2024/2025、PAGE-2108/2007、原来源与人工核实规则及有限Mock边界。

### Work

删除列表操作列追加确认拒联，详情保原录音／文本后可由原权限确认；准确行引用、租户、来源电话及供应商校验继续由原方法执行，不凭通话状态或标签自动拒联，不新增待审队列或保存操作。

### Acceptance

当前AI列表所有行只有原详情入口，无确认拒联；准确详情存在原有权确认入口，权限或来源变化仍拒绝；客户限制与旧记录无改写，Cloud运行包和开发包保持原样。

### Verification

比较当前构建前后原生script差异仅result-records目标段；JS语法、原来源/权限/list-order及AI协调适用回归；实际获准HTTP列表无逐行按钮、原详情可看录音／文本且保确认入口，不提交限制；开发包576文件及旧audit7哈希集保持。file自动及真实接口、整版S8/G3不作通过声明。

### Verification Skill

prototype-verifier


## Step 53: 任务导入不可提交原因可见反馈

### Expected Change

update

### Goal

修复用户截图0有效行时点击确认没有明确反馈；保持重复业务编码正确拦截和开发包冻结。

### Files

js/adapters/task-business-import.js/.css、必要原UI回归及生成模块/复用指纹；本步prototype内部授权、memory/docs和验证证据。原业务模型、参考与开发包不改。

### Inputs

inputs/task-import-feedback-authorization-20261101.json；FUNC-2036/2037，PAGE-2103/2205；原TASK直接导入、权限/类型/唯一编码/token、未知回执及部分成功草稿合同。

### Work

底部固定状态说明确认禁用原因并aria关联；预览表外显示有限错误行号/业务编码/原因。0有效行仍禁用；编辑行变待重检，不显示陈旧重复原因；待核优先同次回执，PRED合法有效子集仍可确认、AI全通过约束保留。按钮区域可换行，不挤压操作，不新增步骤。

### Acceptance

0有效行在底部与表外清楚显示阻断原因；修改编码后明确重新检查、当前检查通过方可确认；未知原请求、部分有效行、权限和失败草稿行为不变；动态文案转义，开发包及旧审计不改。

### Verification

当前built共享UI原回归与定向正确性反例；语法/资源指纹/S7；实际HTTP0有效重复阻断、编辑待重检、唯一编码预检可确认但不实际提交；AI共享界面及未知/部分成功由当前UI回归验证。仅本地Mock，不重试file自动或更新开发包，不升全局S8/G3。

### Verification Skill

prototype-verifier


## Step 54: 冻结需求下HTTP完整实际点击验收与修复

### Expected Change

verify/update

### Goal

用户明确改用HTTP继续实际点击AI、预外呼和业务分类完整流程；可靠问题直接修复并实页重验，不用脚本替代实际结果，开发包不更新、离线不判通过。

### Files

`inputs/http-e2e-acceptance-authorization-20261101.json`、`memory/http-e2e-acceptance-20261101/actual-click-checklist.json`、`js/adapters/ai.js`、`js/adapters/ai-task-directory.js`、`scripts/ai_task_directory_build.py`、`scripts/check-ai-task-directory.cjs`、`scripts/check-task-import-execution-chain.cjs`、`scripts/check-four-node-execution.cjs`、`scripts/check-reference-audit.cjs`、`scripts/check-business-rules-workspace.cjs`、`scripts/ai-import-field-ui.js`、`scripts/ai_parity_build.py`、`scripts/check-ai-import-field-dialogs.cjs`、`js/adapters/cloud.js`、`js/components/module-host.js`、`js/components/session-store.js`、`scripts/check-workspace-position.cjs`、`js/adapters/task-business-import.js`、`js/adapters/task-business-import.css`、`js/adapters/four-node-workspace.js`、`js/adapters/four-node-execution.js`、`scripts/four-node-model.js`、`scripts/task-business-import-model.js`、`scripts/task_business_import_build.py`、`scripts/build-modules.py`、`scripts/check-simple-task-import-ui.cjs`、`scripts/check-execution-arrangement-workspace.cjs`、`scripts/check-execution-arrangement.cjs`、`js/modules/ai.bundle.js`、`js/modules/cloud.bundle.js`、`memory/reuse-provenance.json`、`memory/change-log.md`、`memory/open-items.md`、`docs/decisions.md`、`docs/四节点与客户跟进闭环需求记录.md`；仅在实际复现后精确修改有关文件并记对应证据。原始参考/冻结分析/开发包均不改。

### Inputs

inputs/http-e2e-acceptance-authorization-20261101.json；当前需求冻结memory/offline-e2e-audit-20261101/freeze-baseline.json；FUNC2002/2019/2023/2031/2036/2037/2038/2039及PAGE2006/2103/2108/2110/2204/2205/2223/2226/2228，既有有限Mock例外。

### Work

先真实HTTP操作保存证据，再按最小范围定位修复。AI覆盖场景字段弹窗/任务绑定/动态导入/原表/实际明确执行/通话详情；PRED覆盖4步任务配置/自动分类导入/重复编辑重检/有效子集/原表/明确发起及执行记录；分类覆盖字段/分类/流转模板节点与安排/人工和API导入/批次/手动分配/执行后继与结束，穿插取消、保存刷新、权限/租户和历史。仅本地合成数据，不清空旧存储，不实际供应商请求。每路径写真实动作和结果，不可到达或未知明确列未验，不把源码推理或旧pass当实点通过。

### Acceptance

当前范围每一实际通过项有本轮URL/动作/观察/截图DOM；发现可靠缺陷有修前复现、修后实际重走和必要回归。当前需求不扩张，开发包576及旧audit7不变。HTTP范围、未验项、离线限制与真实接口边界准确，不伪报整版或生产通过。

### Verification

Cua唯一browser owner实际HTTP操作；Node等回归仅补充受影响守卫，语法/资源/指纹和S7核对；修复后当前构建重走涉及路径，最终产品/证据hash稳定与开发包hash集合核对。file不重试，不起新服务、不Python GET/ps、不改通道。

### Verification Skill

prototype-verifier


## Step 55: 客户档案统一只读归集AI与预外呼跟进

### Expected Change

update

### Goal

修复客户档案新业务跟进与旧联系档案割裂，以及原AI历史未完整归集；统一可读客户和时间线，保原专业模型/动作/权限及历史。

### Files

`js/components/customer-profile.js`、`js/adapters/customer-profile-workspace.js`、`js/adapters/customer-profile-workspace.css`、`js/adapters/ai-customer-profile.js`、`js/adapters/ai.js`、`js/adapters/cloud.js`、`scripts/ai_customer_profile_build.py`、`scripts/customer_profile_build.py`、`scripts/check-ai-customer-profile.cjs`、`scripts/check-customer-profile.cjs`、`scripts/check-customer-profile-workspace.cjs`、`scripts/check-customer-profile-chain.cjs`、`js/adapters/four-node-workspace.js`、`js/components/module-host.js`、`scripts/build-modules.py`、`js/modules/ai.bundle.js`、`js/modules/cloud.bundle.js`、`index.html`、`memory/reuse-provenance.json`、`inputs/customer-profile-integration-authorization-20261102.json`、`docs/customer-profile-integration.md`、`README.md`、`memory/change-log.md`、`memory/open-items.md`、`memory/acceptance-map.md`；本步验证证据在memory/customer-profile-integration-20261102/，不改原参考/冻结分析/业务存储/开发包或远端。

### Inputs

inputs/customer-profile-integration-authorization-20261102.json；当前FUNC2038/2039与PAGE2203、2108/2208、原客户档案/电话/业务授权；当前实际built两类统一任务链及原CustomerDirectory取源诊断。

### Work

新增只读客户聚合及档案UI，现有客户入口直接使用全部有权来源。统一业务按授权投影/原号码、原AI通话/线索回访分别按准确绑定frame及原2108/2109读权、原Cloud/PRED按原对象范围。保稳定来源ID，不按masked号码/同名/电话时间猜关联；明确镜像身份才去重，不把受理计拨打。旧实际号码不随更正迁到新号码。缺源/读取中明确显示，异步旧上下文不回填当前页；原详情/录音/快照入口点击重核。

### Acceptance

AI/PRED新业务和旧专业记录能按客户查到，通话/归档/业务结果分别展示；同源重复及可证镜像不重复计数；无拨打事实不计通话，缺时长不造0；跨租户、企业、账号/模块/对象及转出截止不扩大，运营不能借同号看到他人记录；查询不持久复制新来源，不改原业务/通话/客户写权限。准确详情及返回刷新可用。

### Verification

先保存当前缺口复现及baseline，再正确行为红绿/当前built定向源/权限/计数/号码更正/迟到/未知源测试，必要回归和资源指纹；Cua唯一browser owner实际HTTP核AI/PRED/原专业、统一列表/详情/返回/刷新/筛选及源入口。file及真实媒体不冒通过，本步不升全局S8/G3或发布状态。

### Verification Skill

prototype-verifier


## Step 56: 流转模板AI呼叫任务入口修复

### Expected Change

update

### Goal

呼叫节点选AI后直接可见并可选具体AI任务，任务先选并带出准确场景，保留明确后续分配及原权限/执行合同。

### Files

`scripts/flow-node-config.js`、`scripts/check-execution-arrangement-workspace.cjs`、`js/modules/cloud.bundle.js`、`js/modules/ai.bundle.js`（仅原构建校验字节不变）、`index.html`、`memory/reuse-provenance.json`、`inputs/template-ai-task-entry-authorization-20261102.json`、`README.md`、`memory/execution-steps.md`、`memory/task-plan.md`、`memory/source-materials.md`、`memory/acceptance-map.md`、`memory/open-items.md`、`memory/change-log.md`；验证证据在memory/template-ai-task-entry-20261102/。不改参考源、冻结需求、核心执行模型、开发包和远端。

### Inputs

inputs/template-ai-task-entry-authorization-20261102.json；execution-arrangement-authorization-20261031.json；现行节点tenant默认映射及DFourNodeExecution choices/保存/执行校验。

### Work

AI任务显式放在场景前，未选场景也可从原已核目录选择任务；只按准确关联与租户/分类/供应商/平台唯一匹配带出场景，冲突不首项猜测。未指定明确后续分配；无上下文/权限显示禁用入口及准确原因，不扩大SUPER或任何角色task.assign权。人工/PRED、优先级/原已捕获历史和tenant映射保持。

### Acceptance

选AI后任务入口可见；有效准确任务可选择/带出已绑定场景/保存/重开；失效、多匹配、跨租户、未授task.assign继续拒绝；未指定可保存待安排但不能绕执行前落实任务。旧UI合同保护，AI/PRED/人工切换及原默认不漂移。

### Verification

当前compiled编辑器正确行为红绿/定向回归、源复用与资源指纹；CUA实际HTTP编辑流程草稿、任务选择/已关联场景/取消或保存重开，缺少可用资源如实说明；不清浏览器数据或改审批。开发包/冻结输入与模型hash核对。本步不代表整版/离线/真实接口验收。

### Verification Skill

prototype-verifier


## Step 57: 租户管理员旧菜单快照兼容

### Expected Change

update

### Goal

已确认总部／门店管理员的业务管理权限不因旧组织快照缺页消失；保持原身份、模块和对象边界。

### Files

`js/components/session-store.js`、`scripts/check-tenant-business-management.cjs`、构建维护的`index.html`和`memory/reuse-provenance.json`；授权`inputs/tenant-business-management-authorization-20261103.json`及本步可变计划、日志、`memory/tenant-business-management-20261103/`证据。不改冻结需求、原专业执行包、开发包或远端。

### Inputs

现行五角色矩阵和实际导航；本轮用户反馈与既有发现问题直接修复授权；旧组织快照纯内存复现。

### Work

只在合法租户成员的有效会话投影中补总部／门店管理员的业务分类、业务字段、流转模板固定入口；不重写旧组织快照、不放宽全部conditional、不复制业务数据。

### Acceptance

总部和门店旧快照缺三项时应恢复菜单及原配置能力；刷新/重新加载仍可用；运营即使旧快照有页也拒绝。禁用账号／成员／租户、未知组织／角色、其它租户、独立模块和其它缺页conditional不扩大。原存储字节与开发包保持。

### Verification

正确行为红绿、当前源适用权限／导航／业务bridge回归、JS语法与资源指纹。CUA在可访问HTTP原型逐项点业务&客户→业务管理→三个页面并刷新；服务不可达时明确保留实点未验，不以脚本替代、不判定本步完成。file／真实接口／整版S8/G3不升级。

### Verification Skill

prototype-verifier


## Step 58: 预外呼新建任务权限反馈

### Expected Change

update

### Goal

超级管理员原F33创建权限为拒绝时，不再出现可点击却静默无响应的新建按钮；有权租户成员保持原新建流程。

### Files

`scripts/task_creation_access_build.py`、`scripts/build-modules.py`、`scripts/check-task-create-permission.cjs`、`js/modules/cloud.bundle.js`、`index.html`、`memory/reuse-provenance.json`及本步授权、计划、验证日志和`memory/predictive-create-permission-20261103/`证据。AI包只核字节不变，不改专业参考、权限矩阵、任务保存/创建模型、冻结需求、开发包和远端。

### Inputs

inputs/predictive-create-feedback-authorization-20261103.json；当前五角色F33/F34矩阵、DProductionAccess和AppState实际权限；当前HTTP点击无响应复现。

### Work

原工作区创建资格判断提供准确原因供列表和原start入口共用；无权按钮禁用并在列表直接显示解释，陈旧入口调用仍提示且不创建草稿/持久写。预外呼与共用IVR入口一致；合法成员进入原向导，原草稿恢复和保存继续原逻辑。

### Acceptance

SUPER新建受限且原因就近可见；原任务列表仍可查看；陈旧入口、失效范围和撤权不静默且无草稿副作用。总部/门店管理员与运营合法权限下按钮可用并能进入原向导；不得将拒绝解释改为授新权。

### Verification

当前built正确行为红绿；适用权限/预外呼分类/导入/草稿和任务回归；当前bundle/源/资源指纹。CUA实际HTTP复现与修后SUPER禁用+可见原因、合法管理员/运营新建进入与取消、IVR共用路径；不保存供应商任务或发起呼叫。保旧Observer诊断、file和真实接口未验及整版S8/G3限制。

### Verification Skill

prototype-verifier


## Step 59: AI完整手机号生产口径与客户单列表

### Expected Change

update

### Goal

按用户确认AI生产源完整手机号，撤除脱敏历史待核第二表；示例回访正常归入唯一客户表，不新增待核业务。

### Files

`mock/ai-profile-phone-facts.json`、`scripts/ai_profile_demo_build.py`、`scripts/check-ai-profile-demo-phones.cjs`、`js/adapters/customer-profile-workspace.js`及其CSS、`js/adapters/cloud.js`、`scripts/check-customer-profile-workspace.cjs`、`scripts/check-customer-profile-chain.cjs`、`scripts/check-ai-customer-profile.cjs`、`scripts/build-modules.py`、生成的AI/Cloud包、index及reuse-provenance；本步授权、当前可变口径说明、计划和验证证据。原参考、模型/数据权限、冻结9、开发包和远端不改。

### Inputs

inputs/ai-full-phone-production-clarification-20261103.json；当前统一档案来源与权限；用户截图及当前HTTP双表复现。

### Work

仅对7条固定旧脱敏demo回访用显式DEMO_ONLY映射在构建期替换完整号码，5条原全号及其它来源时间/状态/回访内容/次数保持；不对真实或浏览器保存数据补号。撤除独立pendingTable/openUnlinked及专用白名单，保notice、单表筛选/分页、原来源详情及归属冲突守卫。回访仍不充当拨打。

### Acceptance

当前12条demo回访均为完整源号码并准确进主客户档案，7条不再悬挂第二表；能按全号搜索、打开原回访、切来源/租户和刷新。正文不出现脱敏核对业务；异常输入仍不造客户、不吞未知来源/读取失败。无业务记录/供应商写入或权限扩大。

### Verification

当前built demo正确行为红绿，单列表/异常提示正确行为断言；档案模型/UI/chain/AI源权限及相关回归；两个构建资源和原参考/冻结/开发包hash。CUA实际HTTP修前第二表、修后全号搜索、原回访/通话详情、筛选、刷新与租户边界。file和真实接口及整版S8/G3不升级。

### Verification Skill

prototype-verifier


## Step 60: AI任务卡片去供应商标签

### Expected Change

update

### Goal

按截图删除AI任务列表卡片的供应商徽标，保留其它卡片信息。

### Files

`scripts/build-modules.py`、`js/modules/ai.bundle.js`、`index.html`、`memory/reuse-provenance.json`及本步授权/可变计划/验证日志。Cloud包仅核字节不变；原参考、业务数据、权限、开发包和远端不改。

### Inputs

inputs/ai-task-card-label-authorization-20261103.json及用户截图红框。

### Work

现有menu_presentation中精确删除renderCard唯一供应商标签片段；保绿色导入方式、筛选刷新和详情的供应商信息。

### Acceptance

所有列表卡片与筛选刷新不再显示供应商徽标，其它字段/布局/动作保留。

### Verification

构建语法与精确差异、适用既有继承/AI任务目录检查；CUA HTTP卡片与供应商筛选后实页核验。不新增低影响展示测试。

### Verification Skill

prototype-verifier
