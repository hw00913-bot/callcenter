# TASK-031 同号占用、间隔、上限和优先级

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [明确发起当前呼叫及同组批呼叫 · FUNC\-2031](../features/FUNC-2031.md)
- [查询业务、批次和工作队列 · FUNC\-2039](../features/FUNC-2039.md)

## 目标

同号码继续唯一有效呼出、联系间隔和每日次数控制；同号与同资源使用五档降序、queuedAt/queueSequence FIFO及稳定业务ID的同一总序，避免循环等待。；旧0～999分类配置仅保历史/原专业兼容，当前UI只读且不参与新排序；不抢占在途、不自动续拨。

## 产品依据

- FUNC-2031 明确发起当前呼叫及同组批呼叫：明确发起同租户DIRECT或TEMPLATE当前CALL的AI/人工/预外呼，重核准确资源/场景、本人资格、串行和联系限制。人工待分配不先起呼，AI/PRED无独立责任人要求；同组AI/预外呼按五档/FIFO统一总序逐条核验及反馈，不抢占在途。直接周期完成后显式下一方式建立新周期，旧事实保持。；来源 documentation/input/functions.json#FUNC-2031
- FUNC-2039 查询业务、批次和工作队列：查询模式、批次、队列和下一步；DIRECT显示同租户待安排/起呼/结果/本人填写/待核及再次跟进，允许有权人经独立预检显式启用流程。 列表和详情展示具体目标与五档等级；待执行视图按资源内等级与入队先后，普通历史列表仍更新时间倒序，长期等待可提示。；来源 documentation/input/functions.json#FUNC-2039

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`edc5225b5022e6100a5e5848c84fb590eba1e70c2a584fffa610b9133c191a29`

## 前置任务

- TASK-005
- TASK-015

## 只读代码上下文

未指定既有代码文件；从工程规范和产品依据读取上下文。

## 允许修改的文件

- 未填写

代码库根：`None`。未列出的文件不属于本任务修改范围；扩大范围需回到计划。

## 变更安排

- 未填写

## 逻辑与字段依据

先读 [全局逻辑](../global-logic.md)，再读本任务关联的局部逻辑与字段定义。

全局规则：[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-CONTACT](../global-logic.md#GR-CONTACT)、[GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)、[GR-EXECUTION-ARRANGEMENT](../global-logic.md#GR-EXECUTION-ARRANGEMENT)、[GR-SERIAL](../global-logic.md#GR-SERIAL)

局部逻辑：[LOCAL-FLOW-CONTACT-POLICY](../local-logic/LOCAL-FLOW-CONTACT-POLICY.md)

字段：[FIELD-FLOW-CALLS](../field-specs.md#FIELD-FLOW-CALLS)、[FIELD-FLOW-CATEGORY-PRIORITY](../field-specs.md#FIELD-FLOW-CATEGORY-PRIORITY)、[FIELD-FLOW-CONTACT-DAILY-LIMIT](../field-specs.md#FIELD-FLOW-CONTACT-DAILY-LIMIT)、[FIELD-FLOW-CONTACT-INTERVAL](../field-specs.md#FIELD-FLOW-CONTACT-INTERVAL)、[FIELD-FLOW-CONTACT-POLICY](../field-specs.md#FIELD-FLOW-CONTACT-POLICY)、[FIELD-FLOW-EXECUTION-PRIORITY](../field-specs.md#FIELD-FLOW-EXECUTION-PRIORITY)、[FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE)、[FIELD-FLOW-EXECUTION-QUEUED-AT](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUED-AT)、[FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)、[FIELD-FLOW-PHONE](../field-specs.md#FIELD-FLOW-PHONE)、[FIELD-FLOW-WORK-STATE](../field-specs.md#FIELD-FLOW-WORK-STATE)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2204](../ui-pages/UI-PAGE-2204.md)

## 实现要求

- 同号码继续唯一有效呼出、联系间隔和每日次数控制；同号与同资源使用五档降序、queuedAt/queueSequence FIFO及稳定业务ID的同一总序，避免循环等待。
- 旧0～999分类配置仅保历史/原专业兼容，当前UI只读且不参与新排序；不抢占在途、不自动续拨。
- 不抢占在途执行、不自动续拨；数据来源失败不能清占用或假0。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2121**：同业务串行，真实在途/排队/重试/unknown及冲突不放新执行。正常当前CALL仍依必要内容/事实归档；旧已废弃段可靠结清另判，不强求正常archive。转交仍原独立准入，初次纯IMPORT不先造呼叫/填写。
  依据：docs/functional-spec.json#AC-2121

- **AC-2122**：受理、真实拨打、执行终态、内容保存、唯一归档、节点、owner及业务结论分别确认；未知核原请求而非新身份重发。
  依据：docs/functional-spec.json#AC-2122

## 测试要求（尚未执行）

### CHECK-FLOW-CONTACT-POLICY / manual

步骤：按当前两模式安排版本执行：管理员从导入批次与业务名单维护联系协调设置。操作：校0禁用额外频控及有效范围；旧分类权重仅有值时只读保留，当前界面不再编辑，五档等级从当前执行安排维护；起呼按完整规范号、准确原专业及本账本事实协调占用与频次；同号码及同资源使用五档降序、queuedAt/queueSequence入队FIFO和稳定业务ID的统一总序，避免交叉等待；旧分类0～999仅保历史/原专业兼容，不参与新排序，当前UI只读，不抢占在途。。分别构造：已在途/排队/重试/unknown或频次/高优先条件不允；明确终止且事实完整/策略允许。

预期：不靠掩码猜号码，不因维护策略放松公共拒联或供应商边界；阻新呼叫并给原因及可核最早时间，不自动续拨；仅解除原占用，人员仍须明确发起。

覆盖：AC-2121, AC-2122

## 完成条件

- 同号码继续唯一有效呼出、联系间隔和每日次数控制；同号与同资源使用五档降序、queuedAt/queueSequence FIFO及稳定业务ID的同一总序，避免循环等待。
- 旧0～999分类配置仅保历史/原专业兼容，当前UI只读且不参与新排序；不抢占在途、不自动续拨。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [four-node-model.js](../../../prototype/scripts/four-node-model.js) · 只读行为参考，非生产可写目标
- [contact-policy.js](../../../prototype/js/components/contact-policy.js) · 只读行为参考，非生产可写目标
- [module-host.js](../../../prototype/js/components/module-host.js) · 只读行为参考，非生产可写目标

需开发处理的问题：ENG-FLOW-EXECUTION, EQ-PLAT-CONTACT-STATE。
