# TASK-004 租户资料与品牌身份同次保存

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [新建业务租户并关联品牌 · FUNC\-2005](../features/FUNC-2005.md)
- [修改有权租户基础资料 · FUNC\-2006](../features/FUNC-2006.md)
- [维护租户品牌与组织身份 · FUNC\-2007](../features/FUNC-2007.md)

## 目标

创建业务租户与品牌/HQ-STORE关联同次落地，可查询和重新打开。；普通基本资料修改与品牌/身份/企业绑定的维护权限分开；引用后身份保护。

## 产品依据

- FUNC-2005 新建业务租户并关联品牌：有租户创建权的平台管理员同次填写基础资料、单一品牌、总部/门店身份及可选门店编码；独立模块默认未开，Cloud资源按实际需要准确关联。；来源 documentation/input/functions.json#FUNC-2005
- FUNC-2006 修改有权租户基础资料：超管或有本租户tenant.update权的租户管理员维护允许的名称、联系人、说明；品牌/组织/门店编码/资源关联、商业标记和开通按独立权限与引用保护办理。；来源 documentation/input/functions.json#FUNC-2006
- FUNC-2007 维护租户品牌与组织身份：超管按单品牌/品牌唯一总部/门店编码唯一维护归属。有现行业务引用或引用状态不明禁止换绑；不做旧v2数据迁移。；来源 documentation/input/functions.json#FUNC-2007

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`ac24ea3af455fa8052e0daeaa799eea0265f5d02f520b26bdd98ac1e620a1a6c`

## 前置任务

- TASK-003

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

局部逻辑：[LOCAL-PLAT-TENANT-SAVE](../local-logic/LOCAL-PLAT-TENANT-SAVE.md)、[LOCAL-PLAT-TENANT-BIND](../local-logic/LOCAL-PLAT-TENANT-BIND.md)

字段：[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)、[FIELD-PLAT-OP-STATE](../field-specs.md#FIELD-PLAT-OP-STATE)、[FIELD-PLAT-REFERENCE-STATE](../field-specs.md#FIELD-PLAT-REFERENCE-STATE)、[FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)、[FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)、[FIELD-PLAT-STORE-CODE](../field-specs.md#FIELD-PLAT-STORE-CODE)、[FIELD-PLAT-TENANT-BRAND](../field-specs.md#FIELD-PLAT-TENANT-BRAND)、[FIELD-PLAT-TENANT-COMMERCIAL](../field-specs.md#FIELD-PLAT-TENANT-COMMERCIAL)、[FIELD-PLAT-TENANT-CONTACT](../field-specs.md#FIELD-PLAT-TENANT-CONTACT)、[FIELD-PLAT-TENANT-DESC](../field-specs.md#FIELD-PLAT-TENANT-DESC)、[FIELD-PLAT-TENANT-ENTERPRISE](../field-specs.md#FIELD-PLAT-TENANT-ENTERPRISE)、[FIELD-PLAT-TENANT-ID](../field-specs.md#FIELD-PLAT-TENANT-ID)、[FIELD-PLAT-TENANT-NAME](../field-specs.md#FIELD-PLAT-TENANT-NAME)、[FIELD-PLAT-TENANT-TYPE](../field-specs.md#FIELD-PLAT-TENANT-TYPE)、[FIELD-PLAT-UPDATED](../field-specs.md#FIELD-PLAT-UPDATED)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2004](../ui-pages/UI-PAGE-2004.md)

## 实现要求

- 创建业务租户与品牌/HQ-STORE关联同次落地，可查询和重新打开。
- 普通基本资料修改与品牌/身份/企业绑定的维护权限分开；引用后身份保护。
- 失败无孤立租户，未知核同次请求；不按门店名称猜稳定编码。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2016**：两模块共用准确业务租户基础资料；AI租户/Cloud企业等原身份分别按稳定ID显式映射，不按名字合并，不引入旧v2数据迁移。
  依据：docs/functional-spec.json#AC-2016

- **AC-2017**：各模块供应商资源、专属配置及业务数据按原规则管理；账号、电话坐席、供应商账号和机器人分别映射。
  依据：docs/functional-spec.json#AC-2017

- **AC-2018**：新建业务租户必须关联一个有效品牌并明确总部/门店身份；当前规划无旧未绑定租户兼容或补迁移流程。
  依据：docs/functional-spec.json#AC-2018

- **AC-2035**：关联成功的每个租户只对应一个接入品牌。
  依据：docs/functional-spec.json#AC-2035

- **AC-2036**：每租户一个品牌，每品牌最多一个总部及多独立门店；创建品牌必填。已有当前业务引用或引用无法可靠判定时，禁止更换品牌/总部门店身份；当前不定义旧未绑定租户补迁移。
  依据：docs/functional-spec.json#AC-2036

- **AC-2037**：品牌关联变更保留前后信息、操作人和时间；品牌相同不自动共享线索/名单、授予总部品牌全量查看或触发转交。跨租户线索仅按独立的本次转交规则办理，普通租户资料编辑不得绕过归属与身份锁定。
  依据：docs/functional-spec.json#AC-2037

- **AC-2081**：同一接入品牌可关联多个租户。
  依据：docs/functional-spec.json#AC-2081

- **AC-2082**：每品牌对应一个总部租户及多个独立门店租户。
  依据：docs/functional-spec.json#AC-2082

- **AC-2083**：租户所属品牌由平台超级管理员统一维护。
  依据：docs/functional-spec.json#AC-2083

- **AC-2095**：超管创建业务租户时选择本平台有效品牌及总部/门店身份，租户和品牌关联同次保存，遵守单品牌及品牌唯一总部；不能先建无品牌孤立租户。
  依据：docs/functional-spec.json#AC-2095

- **AC-2096**：明确同次保存成功后能按准确tenantId持久查询租户与品牌关联；明确失败保留输入且不留下孤立租户或孤立关联；结果未知先核对本次请求和准确对象，不用新请求盲重建。当前无旧会话/历史身份迁移需求。
  依据：docs/functional-spec.json#AC-2096

## 测试要求（尚未执行）

### CHECK-PLAT-TENANT-SAVE / manual

步骤：在准确有权范围触发“新建或修改租户基础资料”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。新建时同时选择品牌与总部身份，分别模拟同次成功、明确保存失败、保存结果未知并核对原请求；确认无孤立租户/关联。

预期：确认保存租户基础资料和审计；不改变原业务归属、财务余额或自动授成员权；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。；明确成功按tenantId可持久读到同次品牌关联，失败不留孤立记录，未知仅核对原请求不盲重建。

覆盖：AC-2016, AC-2017, AC-2018, AC-2035, AC-2081, AC-2082, AC-2095, AC-2096

### CHECK-PLAT-TENANT-BIND / manual

步骤：在准确有权范围触发“维护租户品牌与总部门店身份”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：合法品牌与组织身份生效；同品牌不共享数据或绑定路由；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2035, AC-2036, AC-2037, AC-2081, AC-2082, AC-2083

## 完成条件

- 创建业务租户与品牌/HQ-STORE关联同次落地，可查询和重新打开。
- 普通基本资料修改与品牌/身份/企业绑定的维护权限分开；引用后身份保护。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [organization-store.js](../../../prototype/js/components/organization-store.js) · 只读行为参考，非生产可写目标

需开发处理的问题：EQ-PLAT-IDENTITY。
