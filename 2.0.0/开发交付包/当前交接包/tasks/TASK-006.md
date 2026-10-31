# TASK-006 人员停用与有限话后收尾

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [停用本租户成员 · FUNC\-2013](../features/FUNC-2013.md)
- [全局停用登录账号 · FUNC\-2014](../features/FUNC-2014.md)
- [结束停用范围有限收尾 · FUNC\-2015](../features/FUNC-2015.md)

## 目标

本租户停用与全局账号停用范围分开，禁止新增操作。；仅允许停用时已有真实通话及必要话后有限收尾；租户任务不自动转交。

## 产品依据

- FUNC-2013 停用本租户成员：只限制准确本租户新增操作，其他租户授权不变；当前已接通电话及必要话后有限收尾，保已受理租户任务。；来源 documentation/input/functions.json#FUNC-2013
- FUNC-2014 全局停用登录账号：独立超管权限停用准确账号，所有租户禁新增；当前接通电话必要话后有限收尾，任务不自动转交/取消。；来源 documentation/input/functions.json#FUNC-2014
- FUNC-2015 结束停用范围有限收尾：停用者只完成停用时已接通电话及必要话后，结束后离线并退出该范围；不是重新启用。；来源 documentation/input/functions.json#FUNC-2015

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`0904ba9de2798ea9878d0602f5fbc337ae523a60911c1b10dac967c13febffbe`

## 前置任务

- TASK-005

## 只读代码上下文

未指定既有代码文件；从工程规范和产品依据读取上下文。

## 允许修改的文件

- 未填写

代码库根：`None`。未列出的文件不属于本任务修改范围；扩大范围需回到计划。

## 变更安排

- 未填写

## 逻辑与字段依据

先读 [全局逻辑](../global-logic.md)，再读本任务关联的局部逻辑与字段定义。

全局规则：[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-IDENTITY](../global-logic.md#GR-IDENTITY)、[GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)、[GR-SCOPE](../global-logic.md#GR-SCOPE)、[GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

局部逻辑：[LOCAL-PLAT-MEMBER-STOP](../local-logic/LOCAL-PLAT-MEMBER-STOP.md)、[LOCAL-PLAT-ACCOUNT-STOP](../local-logic/LOCAL-PLAT-ACCOUNT-STOP.md)、[LOCAL-PLAT-LIMITED-FINISH](../local-logic/LOCAL-PLAT-LIMITED-FINISH.md)

字段：[FIELD-PLAT-ACCOUNT-ID](../field-specs.md#FIELD-PLAT-ACCOUNT-ID)、[FIELD-PLAT-ACCOUNT-STATE](../field-specs.md#FIELD-PLAT-ACCOUNT-STATE)、[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)、[FIELD-PLAT-CALL-ID](../field-specs.md#FIELD-PLAT-CALL-ID)、[FIELD-PLAT-CALL-STATE](../field-specs.md#FIELD-PLAT-CALL-STATE)、[FIELD-PLAT-FOLLOW-NOTE](../field-specs.md#FIELD-PLAT-FOLLOW-NOTE)、[FIELD-PLAT-GUARD-STATE](../field-specs.md#FIELD-PLAT-GUARD-STATE)、[FIELD-PLAT-LIMITED](../field-specs.md#FIELD-PLAT-LIMITED)、[FIELD-PLAT-MEMBER-ID](../field-specs.md#FIELD-PLAT-MEMBER-ID)、[FIELD-PLAT-MEMBER-STATE](../field-specs.md#FIELD-PLAT-MEMBER-STATE)、[FIELD-PLAT-PHONE-STATE](../field-specs.md#FIELD-PLAT-PHONE-STATE)、[FIELD-PLAT-PRO-FILL](../field-specs.md#FIELD-PLAT-PRO-FILL)、[FIELD-PLAT-PRO-FOLLOW-STATE](../field-specs.md#FIELD-PLAT-PRO-FOLLOW-STATE)、[FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2003](../ui-pages/UI-PAGE-2003.md)
- [UI-PAGE-2202](../ui-pages/UI-PAGE-2202.md)

## 实现要求

- 本租户停用与全局账号停用范围分开，禁止新增操作。
- 仅允许停用时已有真实通话及必要话后有限收尾；租户任务不自动转交。
- 不把已有后台任务继续等同被停用者可继续操作。
- 内容已保存但电话退出失败/未知时保留受限上下文，仅允许合法退出重试，不恢复普通办理权。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2027**：租户管理员停用本租户人员时限制该租户AI/云呼叫访问，其他租户已有授权不受影响。
  依据：docs/functional-spec.json#AC-2027

- **AC-2028**：保留历史任务、通话和操作记录；不把本租户停用显示为整个账号停用。
  依据：docs/functional-spec.json#AC-2028

- **AC-2029**：本租户人员停用后，禁止其在本租户新增操作；停用时已接通的当前电话及必要话后允许有限收尾，完成后结束该范围使用。停用前系统已受理的AI/预外呼/IVR租户任务在原条件满足时继续，停用者不能再操作，其他已有权人员依原权限管理，不自动转交。
  依据：docs/functional-spec.json#AC-2029

- **AC-2030**：整个登录账号停用归超管，租户管理员不能借本租户停用改动全局状态。
  依据：docs/functional-spec.json#AC-2030

- **AC-2031**：全局停用保留已形成任务、通话和审计事实；重新启用或删除均须对应独立原操作权，不由停用动作推授。
  依据：docs/functional-spec.json#AC-2031

- **AC-2032**：账号全局停用后，对全部租户和工作区禁止新增操作；仅允许停用时已接通的当前电话及必要话后有限收尾，完成后结束该范围使用。停用前系统已受理的租户后台任务按原条件继续，停用者不能再操作，不自动转交；会话和电话具体生效机制仍须核验，不能用前端隐藏代替。
  依据：docs/functional-spec.json#AC-2032

## 测试要求（尚未执行）

### CHECK-PLAT-MEMBER-STOP / manual

步骤：在准确有权范围触发“停用本租户成员”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：本租户成员停用，保留业务记录和允许范围的有限收尾；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2027, AC-2028, AC-2029

### CHECK-PLAT-ACCOUNT-STOP / manual

步骤：在准确有权范围触发“全局停用登录账号”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：全局账号停用且范围收敛，不因前端隐藏宣称真实会话撤销已验证；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2030, AC-2031, AC-2032

### CHECK-PLAT-LIMITED-FINISH / manual

步骤：在准确有权范围触发“结束停用后的有限收尾”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：原电话完成并结束有限访问，不重开成员/全局账号权限；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2029, AC-2032

## 完成条件

- 本租户停用与全局账号停用范围分开，禁止新增操作。
- 仅允许停用时已有真实通话及必要话后有限收尾；租户任务不自动转交。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [organization-store.js](../../../prototype/js/components/organization-store.js) · 只读行为参考，非生产可写目标
- [module-host.js](../../../prototype/js/components/module-host.js) · 只读行为参考，非生产可写目标
- [cloud.js](../../../prototype/js/adapters/cloud.js) · 只读行为参考，非生产可写目标

需开发处理的问题：EQ-PLAT-IDENTITY, EQ-PLAT-PHONE。
