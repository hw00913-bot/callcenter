# 原型回归与开发包更新报告

版本：`2026-09-20-regression-delivery-1` · 日期：2026-09-20。

本轮围绕当前原型和 D-046–D-053 已确认规则执行本地回归，并修复号码识别读取与字段目录追溯两类问题。既有历史报告独立保留，不覆盖或改写其结果。

**回归结果：通过。** 离线检查 44 组、1075 个声明检查项，失败 0 组；87 个 JS 文件语法检查，失败 0 个；141 处本地资源引用检查，缺失 0 处。

另记录 19 项本机浏览器检查，失败 0 项。检查项按各组真实输出计数，不把循环内断言另行累计。

## 本轮修复

| 范围 | 回归发现 | 修复后的规则 | 关联内容 |
|---|---|---|---|
| 预测话单号码识别与上下文校验 | 号码识别读取未完整核对话单类型、账号与供应商通话身份；本地通话/会话 contactId 若被当作供应商 mainUniqueId，会误拒绝本通合法话单。现有字典还保留异步语义待确认的旧说明。 | 按真实字段归属核对类型、账号及已明确的供应商通话标识；本地通话/会话 contactId 不参与供应商主通话 ID 比较。预测话单 0 表示同步、1 表示结果已异步写回 sipCause；未知标识和未识别结果原样保留。不以标识判断接通、不设置两分钟必完成时限，读取不产生新话单或重呼。 | D-053 / SRC-083；FA-070、FA-071；号码识别、通话记录与统计 |
| FA-071 字段目录追溯 | 应用最新字段映射后，接口字段目录的 mappingIds 与 adoption 未同步重算，sipCauseAsyncUpdateFlag 的采用关系落后于 FA-071。 | 以当前字段映射统一重算目录关联；API-318 的 sipCauseAsyncUpdateFlag 明确关联 FA-071。供应商原文字段类型、描述及官方快照保持原样；本轮更新采用规则和追溯关系。 | API-318 / FA-071；字段对齐、接口契约、交付核验 |

## 本地自动回归

覆盖任务创建与重呼、暂停与结束、号码授权与启停、坐席分机与配置、技能与队列、班长管理、通话中记录、线索统计、删除重建及断线恢复等现有套件；新增预测话单号码识别专项。完整明细见各组实际检查名称。

| 检查组 | 声明检查项 | 结果 |
|---|---|---|
| skill-group-management | 8 | 通过 |
| alicti-fields | 71 | 通过 |
| alicti-retry | 26 | 通过 |
| alicti-ivr | 24 | 通过 |
| alicti-task-control | 33 | 通过 |
| demo-fixtures | 28 | 通过 |
| regression-fields | 6 | 通过 |
| call-regression-fixes | 9 | 通过 |
| task-attachment-transaction | 9 | 通过 |
| alicti-report-facts | 40 | 通过 |
| lead-report | 67 | 通过 |
| alicti-report-summary | 28 | 通过 |
| customer-followup-version | 13 | 通过 |
| alicti-receiving | 33 | 通过 |
| repeat-predictive | 63 | 通过 |
| alicti-number-import | 35 | 通过 |
| alicti-accounts | 50 | 通过 |
| alicti-account-context | 23 | 通过 |
| incall-followup | 30 | 通过 |
| alicti-queue-contracts | 17 | 通过 |
| alicti-queues | 29 | 通过 |
| queue-config | 21 | 通过 |
| predictive-strategy | 12 | 通过 |
| seat-operations | 41 | 通过 |
| seat-phone-config | 15 | 通过 |
| tenant-call-monitor | 18 | 通过 |
| tenant-supervisor-migration | 12 | 通过 |
| supervisor-management | 28 | 通过 |
| supervisor-workbench | 13 | 通过 |
| number-resource-rules | 21 | 通过 |
| number-tenant-scope | 31 | 通过 |
| queue-catalog | 24 | 通过 |
| queue-detail | 28 | 通过 |
| queue-management | 22 | 通过 |
| queue-multi-skills | 15 | 通过 |
| outbound-groups | 26 | 通过 |
| task-direct-import | 1 | 通过 |
| delivery-navigation | 9 | 通过 |
| seat-recreation | 13 | 通过 |
| seat-batch-clarification | 13 | 通过 |
| seat-reconnect | 15 | 通过 |
| seat-reconnect-workbench | 4 | 通过 |
| seat-cno-report | 31 | 通过 |
| predictive-recognition | 20 | 通过 |

## 浏览器检查

使用本机静态原型和演示账号执行。页面、菜单和抽屉的检查范围以本表为准；没有将这些冒烟检查写成所有按钮的浏览器端到端验收。

| 检查 | 结果 |
|---|---|
| 演示登录、工作范围及云联络中心选择 | 通过 |
| 预外呼创建抽屉：右侧打开、左上返回、右上关闭 | 通过 |
| 重呼开启后不选状态阻止下一步；选择710和718后确认页显示两项、1次和10分钟 | 通过 |
| 创建草稿关闭后可在列表看到，刷新后仍保留 | 通过 |
| 自动外呼创建先选择当前组织可用语音流程 | 通过 |
| 呼入新建规则包含优先级、三类去向及可选匹配条件 | 通过 |
| 坐席维护列表显示软电话分机；王静工号0012、分机000612在抽屉目视核对一致 | 通过 |
| 技能组、外呼组、队列与配置记录页面可打开并有演示数据 | 通过 |
| 队列多选两个技能；取消时提示未保存，放弃后返回原列表且关联保持原值 | 通过 |
| 通话总览、线索成效、客户跟进、外呼任务、坐席成效、服务技能六类报表可打开 | 通过 |
| 预外呼通话记录显示718号码状态；在途详情区分通话进度、客户接通、号码识别及六项业务信息 | 通过 |
| 号码管理从AliCti导入、总部门店使用范围；无设置坐席操作 | 通过 |
| 通话数据异常、操作审计、AliCti账号管理可打开 | 通过 |
| AliCti账号详情仅资料与只读租户表格，没有新增租户或管理租户嵌套操作 | 通过 |
| 账号管理、租户管理、客户档案、导入与分配及运营工作台可打开 | 通过 |
| 总部租户管理员可进入坐席工作台的外呼坐席与班长监控页签 | 通过 |
| 总部管理员队列管理仅显示本租户5个队列，并有新增入口 | 通过 |
| 本轮浏览器控制台未捕获error/warn | 通过 |
| 最终运行修复后刷新原型、打开嵌入说明与独立开发入口，版本为2026-09-20-regression-delivery-1；51模型、21任务、331计划验收展示正确，布局目视正常 | 通过 |

本轮浏览器记录中未捕获控制台 error/warn。

浏览器本地保留一条名称为回归检查临时草稿的空客户草稿；未启动，不属于随包mock数据。队列多选测试已放弃修改。

## 开发资料与交付核验

当前功能说明、附表、字段映射、流程与时序、系统蓝图以及开发契约按本轮规则同步。开发任务和生产验收用例继续用于后续实现，不能用本地演示检查替代真实接入验收。

- [完整功能说明](../docs/functional-spec.html) · [规则附表](../docs/interaction.html) · [字段对齐](../docs/field-alignment.html)。
- [业务流程](../flowcharts/business-process.html) · [交互时序](../flowcharts/sequence-interaction.html) · [系统蓝图](../related-systems/index.html)。
- [开发入口](../docs/development.html) · [版本与变更记录](../docs/change-log.html)。
- [本轮检查总表](../qa/regression-delivery-verification-20260920.json)：最终文档一致性、开发包完整性及解压重建结果以该表所引用的证据为准。

## 待确认与验证边界

保留 5 个供应商确认主题及 3 类接入准备，主题数与待确认字段数分开统计。

| 编号 | 主题 |
|---|---|
| CF-07 | 供应商任务删除 |
| CF-10 | 呼入条件匹配与共享来电归属证据 |
| CF-11 | 电话连接生命周期 |
| CF-12 | 事件交付与来源回传 |
| CF-13 | 号码识别异步结果与覆盖范围 |

CF-13 中预测话单异步标识已经明确，自动外呼与呼入的识别字段覆盖和编码对应仍单独保留；不把 1–2 分钟描述成固定完成时限。

- 仅验证本地原型、演示数据、源码与交付资料，未执行真实供应商接口、电话媒体、生产并发或生产安全验收。
- 没有声明所有按钮均完成浏览器端到端操作，也没有声明 Loop S8 阶段门禁通过。
- 资源检查覆盖入口页、脚本中的固定资源路径和 CSS URL；语法检查不替代所有运行时路径检查。
- 本轮没有请求 GitLab 提交；交付更新保存在当前本地项目。

## 可独立阅读的证据

- [离线检查明细](evidence-20260920/offline-checks.json)。
- [源码语法与资源引用](evidence-20260920/source-integrity.json)。
- [浏览器检查事实](evidence-20260920/browser-checks.json)。
- [检查总表](../qa/regression-delivery-verification-20260920.json)。
