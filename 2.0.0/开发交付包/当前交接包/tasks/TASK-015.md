# TASK-015 确认导入、业务身份和批次证据

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [按实际分类严格预检并导入业务 · FUNC\-2036](../features/FUNC-2036.md)

## 目标

全部纳入行成功且确认依据与重算一致才提交；业务、来源、初始租户与批次一致保存。；DIRECT只建业务和直接周期；TEMPLATE才建封存运行及首节点；重复/冲突不覆盖原业务。

## 产品依据

- FUNC-2036 按实际分类严格预检并导入业务：整批明确DIRECT或TEMPLATE后严格预检及导入：DIRECT须分类显式允许、方式明确且AI场景必选，仅豁免路由附加资料，不建run/node；TEMPLATE沿当前路由建run。已有直接业务后续显式启用流程，在旧执行与必要归档收敛且当前路由资料通过后于原业务建新run，不重复导入。；来源 documentation/input/functions.json#FUNC-2036

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`0904ba9de2798ea9878d0602f5fbc337ae523a60911c1b10dac967c13febffbe`

## 前置任务

- TASK-014

## 只读代码上下文

未指定既有代码文件；从工程规范和产品依据读取上下文。

## 允许修改的文件

- 未填写

代码库根：`None`。未列出的文件不属于本任务修改范围；扩大范围需回到计划。

## 变更安排

- 未填写

## 逻辑与字段依据

先读 [全局逻辑](../global-logic.md)，再读本任务关联的局部逻辑与字段定义。

全局规则：[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-CONFIG](../global-logic.md#GR-CONFIG)、[GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)、[GR-FIELDS](../global-logic.md#GR-FIELDS)、[GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)、[GR-SCOPE](../global-logic.md#GR-SCOPE)、[GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

局部逻辑：[LOCAL-FLOW-IMPORT-COMMIT](../local-logic/LOCAL-FLOW-IMPORT-COMMIT.md)

字段：[FIELD-FLOW-AI-SCENE](../field-specs.md#FIELD-FLOW-AI-SCENE)、[FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP](../field-specs.md#FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP)、[FIELD-FLOW-BATCH-ID](../field-specs.md#FIELD-FLOW-BATCH-ID)、[FIELD-FLOW-BATCH-NAME](../field-specs.md#FIELD-FLOW-BATCH-NAME)、[FIELD-FLOW-BUSINESS-CODE](../field-specs.md#FIELD-FLOW-BUSINESS-CODE)、[FIELD-FLOW-CATEGORY-ID](../field-specs.md#FIELD-FLOW-CATEGORY-ID)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)、[FIELD-FLOW-EFFECTIVE-PLAN](../field-specs.md#FIELD-FLOW-EFFECTIVE-PLAN)、[FIELD-FLOW-ENTRY-CONTEXT](../field-specs.md#FIELD-FLOW-ENTRY-CONTEXT)、[FIELD-FLOW-ENTRY-DECISION](../field-specs.md#FIELD-FLOW-ENTRY-DECISION)、[FIELD-FLOW-ENTRY-RULES](../field-specs.md#FIELD-FLOW-ENTRY-RULES)、[FIELD-FLOW-FILE-PENDING](../field-specs.md#FIELD-FLOW-FILE-PENDING)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-IMPORT-ORIGINAL](../field-specs.md#FIELD-FLOW-IMPORT-ORIGINAL)、[FIELD-FLOW-IMPORT-PREVIEW](../field-specs.md#FIELD-FLOW-IMPORT-PREVIEW)、[FIELD-FLOW-IMPORT-TOKEN](../field-specs.md#FIELD-FLOW-IMPORT-TOKEN)、[FIELD-FLOW-IMPORT-VALUES](../field-specs.md#FIELD-FLOW-IMPORT-VALUES)、[FIELD-FLOW-INTENDED-STORE-NAME](../field-specs.md#FIELD-FLOW-INTENDED-STORE-NAME)、[FIELD-FLOW-NODE-RUN-ID](../field-specs.md#FIELD-FLOW-NODE-RUN-ID)、[FIELD-FLOW-OUTCOME](../field-specs.md#FIELD-FLOW-OUTCOME)、[FIELD-FLOW-OWNER-TENANT](../field-specs.md#FIELD-FLOW-OWNER-TENANT)、[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-REQUEST-ID](../field-specs.md#FIELD-FLOW-REQUEST-ID)、[FIELD-FLOW-REQUEST-STATUS](../field-specs.md#FIELD-FLOW-REQUEST-STATUS)、[FIELD-FLOW-ROUTE-MAIN](../field-specs.md#FIELD-FLOW-ROUTE-MAIN)、[FIELD-FLOW-RUN-ID](../field-specs.md#FIELD-FLOW-RUN-ID)、[FIELD-FLOW-RUN-STATUS](../field-specs.md#FIELD-FLOW-RUN-STATUS)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2204](../ui-pages/UI-PAGE-2204.md)

## 实现要求

- 全部纳入行成功且确认依据与重算一致才提交；业务、来源、初始租户与批次一致保存。
- DIRECT只建业务和直接周期；TEMPLATE才建封存运行及首节点；重复/冲突不覆盖原业务。
- 超时未知沿同次请求核对，不能重导入复制业务或自动重开。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2115**：按实际分类生成系统必需和IMPORT列及必填校验；合法等待名单数据中性提示，检查后具体报字段/节点/条件；正式提交所有行通过且token一致。
  依据：docs/functional-spec.json#AC-2115

- **AC-2116**：LEAD同品牌统一编码跨分类/来源唯一，ORDINARY同品牌同分类唯一；不凭手机号合并，不覆盖重复业务或自动重开。
  依据：docs/functional-spec.json#AC-2116

- **AC-2117**：导入失败保名单可重检；确认全部通过才同次创建批次/记录/实际run及首节点；重复/冲突不改原owner/值/结果。
  依据：docs/functional-spec.json#AC-2117

- **AC-2140**：对当前可可靠读取schema内、启用且支持条件的非必填IMPORT字段，新导入/新run准备时缺列规范化为null用于判断；必填缺失或schema读取失败仍拒绝，通话/填写未知及已捕获历史缺失不在读取时补空。
  依据：docs/functional-spec.json#AC-2140

## 测试要求（尚未执行）

### CHECK-FLOW-IMPORT-COMMIT / manual

步骤：按当前续接版本执行：点击确认导入。前提：当前管理员资格及实际分类关系仍有效；本次正式范围所有行通过且token与重算完全一致。操作：按确认模式重核每行与最新配置；模式/方式/分类开关/字段/名单/映射/必要场景变化则拒旧token，TEMPLATE另核路由；同次建立批次、稳定业务、原始来源、初始负责租户和模式；仅TEMPLATE捕获完整plan并创建run，DIRECT保存显式方式及必要场景，不创建run或节点；TEMPLATE定位首业务节点；DIRECT进入同租户待安排队列并显示“直接跟进”，无模板推进/转交入口。分别构造：任何行失败或token过期；明确成功；响应未知；所选模式不可用或任一行失败。

预期：不自动分配、转交或呼叫；整个提交不建部分业务，保名单重检；台账定位同次记录/批次；TEMPLATE导入定位即开始run，DIRECT无run/node且等待分配，不自动呼叫。；保同请求核对，不另建重复批次；整批不创建部分业务，不自动改模式重试；未知沿同请求核对。。

覆盖：AC-2115, AC-2116, AC-2117, AC-2140

## 完成条件

- 全部纳入行成功且确认依据与重算一致才提交；业务、来源、初始租户与批次一致保存。
- DIRECT只建业务和直接周期；TEMPLATE才建封存运行及首节点；重复/冲突不覆盖原业务。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [four-node-model.js](../../../prototype/scripts/four-node-model.js) · 只读行为参考，非生产可写目标
- [current_planning_build.py](../../../prototype/scripts/current_planning_build.py) · 只读行为参考，非生产可写目标

需开发处理的问题：ENG-FLOW-PERSISTENCE。
