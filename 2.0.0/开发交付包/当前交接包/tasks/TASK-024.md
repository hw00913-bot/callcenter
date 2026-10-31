# TASK-024 确认节点推进及END两动作接续

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [判断并确认本租户后继节点 · FUNC\-2038](../features/FUNC-2038.md)

## 目标

确认准确边与令牌后进入后继；到END先封原run，再执行CLOSE或DIRECT_FOLLOWUP。；CLOSE业务结束不跟进；DIRECT_FOLLOWUP在同record/当前tenant建立MANUAL直接周期，保结束run/原通话/快照，不自动起呼。；原跟进人仅当前有效且有电话资格才沿用，否则待安排；合法END来源与分类普通DIRECT许可分开验证。

## 产品依据

- FUNC-2038 判断并确认本租户后继节点：按准确条件确认后继，END执行无模板跟进/业务结束两动作；原run先结束，原业务与事实保留。；来源 documentation/input/functions.json#FUNC-2038

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`0904ba9de2798ea9878d0602f5fbc337ae523a60911c1b10dac967c13febffbe`

## 前置任务

- TASK-023

## 只读代码上下文

未指定既有代码文件；从工程规范和产品依据读取上下文。

## 允许修改的文件

- 未填写

代码库根：`None`。未列出的文件不属于本任务修改范围；扩大范围需回到计划。

## 变更安排

- 未填写

## 逻辑与字段依据

先读 [全局逻辑](../global-logic.md)，再读本任务关联的局部逻辑与字段定义。

全局规则：[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)、[GR-END-ACTION](../global-logic.md#GR-END-ACTION)、[GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)、[GR-PRIVACY](../global-logic.md#GR-PRIVACY)、[GR-SERIAL](../global-logic.md#GR-SERIAL)、[GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

局部逻辑：[LOCAL-FLOW-ADVANCE](../local-logic/LOCAL-FLOW-ADVANCE.md)、[LOCAL-FLOW-END-HANDOFF](../local-logic/LOCAL-FLOW-END-HANDOFF.md)

字段：[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-CYCLES](../field-specs.md#FIELD-FLOW-DIRECT-CYCLES)、[FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)、[FIELD-FLOW-EDGE-ID](../field-specs.md#FIELD-FLOW-EDGE-ID)、[FIELD-FLOW-EFFECTIVE-PLAN](../field-specs.md#FIELD-FLOW-EFFECTIVE-PLAN)、[FIELD-FLOW-END-ACTION](../field-specs.md#FIELD-FLOW-END-ACTION)、[FIELD-FLOW-END-FOLLOWUP-ORIGIN](../field-specs.md#FIELD-FLOW-END-FOLLOWUP-ORIGIN)、[FIELD-FLOW-EVALUATION-TOKEN](../field-specs.md#FIELD-FLOW-EVALUATION-TOKEN)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-NEXT-NODE](../field-specs.md#FIELD-FLOW-NEXT-NODE)、[FIELD-FLOW-NODE-ID](../field-specs.md#FIELD-FLOW-NODE-ID)、[FIELD-FLOW-NODE-RUN-ID](../field-specs.md#FIELD-FLOW-NODE-RUN-ID)、[FIELD-FLOW-OUTCOME](../field-specs.md#FIELD-FLOW-OUTCOME)、[FIELD-FLOW-OWNER-TENANT](../field-specs.md#FIELD-FLOW-OWNER-TENANT)、[FIELD-FLOW-RECIPIENT](../field-specs.md#FIELD-FLOW-RECIPIENT)、[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-REQUEST-ID](../field-specs.md#FIELD-FLOW-REQUEST-ID)、[FIELD-FLOW-REQUEST-STATUS](../field-specs.md#FIELD-FLOW-REQUEST-STATUS)、[FIELD-FLOW-RUN-END-ACTION](../field-specs.md#FIELD-FLOW-RUN-END-ACTION)、[FIELD-FLOW-RUN-ID](../field-specs.md#FIELD-FLOW-RUN-ID)、[FIELD-FLOW-RUN-STATUS](../field-specs.md#FIELD-FLOW-RUN-STATUS)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2227](../ui-pages/UI-PAGE-2227.md)

## 实现要求

- 确认准确边与令牌后进入后继；到END先封原run，再执行CLOSE或DIRECT_FOLLOWUP。
- CLOSE业务结束不跟进；DIRECT_FOLLOWUP在同record/当前tenant建立MANUAL直接周期，保结束run/原通话/快照，不自动起呼。
- 原跟进人仅当前有效且有电话资格才沿用，否则待安排；合法END来源与分类普通DIRECT许可分开验证。
- 旧确认/未归档/未知拒绝；进入TRANSFER节点不等于已经切换负责租户。
- 运行关闭/转无模板是系统动作摘要，不推定成交；END不增加承接方和呼叫方式配置。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2120**：开始/转交/呼叫/结束组件直接定类型；人员明确发起实际CALL或确认后续动作，配置/分配/条件命中不自动执行。
  依据：docs/functional-spec.json#AC-2120

- **AC-2122**：受理、真实拨打、执行终态、内容保存、唯一归档、节点、owner及业务结论分别确认；未知核原请求而非新身份重发。
  依据：docs/functional-spec.json#AC-2122

- **AC-2125**：确认动作重核同一业务owner/run/node、selected edge及evaluationToken、精确当前事实和目标解析；过期保输入重判，不静默换路径；CALL必须真实拨打/必要归档。
  依据：docs/functional-spec.json#AC-2125

- **AC-2141**：END只配置名称和DIRECT_FOLLOWUP/CLOSE两种后续动作。先结束原run；CLOSE不再跟进，DIRECT_FOLLOWUP同record/当前tenant生成无模板人工周期，不自动起呼。合法END来源可授权此接续，即使分类没有开放普通DIRECT导入；原run/节点/call/快照保留，原人员仅当前仍有效且具电话资格时沿用。
  依据：docs/functional-spec.json#AC-2141

## 测试要求（尚未执行）

### CHECK-FLOW-ADVANCE / manual

步骤：按当前续接版本执行：人员确认唯一已满足后继路径。前提：handlingMode=TEMPLATE且准确当前run/node可核；对准确业务有当前本租户办理权；确认业务/run/node/owner及并发依据仍一致；当前CALL实际拨打及必要跟进已归档；无执行/重试/unknown占用。操作：重算同一selected边、token及后继承接范围，不静默改选；进入准确后继；到END由系统按endAction先结束原run，再接续无模板人工周期或关闭，不把运行结束等同业务成交。分别构造：未做实际CALL或未归档/旧确认过期；明确成功；请求未知；当前业务为DIRECT。

预期：无需呼叫业务应在START直接END，不能默认出口绕CALL；拒推进并保原node/owner；只推进节点，不自动起呼、不隐式转交；核同request，不重复进入节点；拒绝模板判断、推进、转交、废弃运行或模板重开；同租户再次直接跟进沿直接起呼入口，后续流程走独立“启用流程”预检。。

覆盖：AC-2120, AC-2122, AC-2125

### CHECK-FLOW-END-HANDOFF / manual

步骤：按当前续接版本执行：有权导入或路径确认可靠定位到当前捕获END后由系统执行。前提：原动作权限、准确业务/负责方/运行/节点及并发依据已核；原执行/重试/未知与必要归档门槛满足；纯无呼叫路径不制造跟进事实。操作：先封原run结束时间/节点/租户和准确endAction；系统摘要是结束/转无模板，不配置业务达成；DIRECT_FOLLOWUP保同record/owner和已结束历史，清当前run/节点引用，新建MANUAL周期及可信END来源；原责任人仅当前仍有效且具电话资格才沿用，否则待安排。分别构造：捕获动作CLOSE；捕获动作DIRECT_FOLLOWUP且来源可核；未选动作、伪造来源/旧租户请求或原执行未收敛。

预期：原run明确结束且保原计划/节点/通话/快照；CLOSE关闭不再跟进；DIRECT_FOLLOWUP建立当前租户MANUAL直接周期但不自动起呼；原run结束且不建直接周期/不再跟进，不虚构成交或通话；合法END来源可授权无模板接续，不要求分类允许普通DIRECT导入；原角色/资源/联系/实际本人保存仍检查，人工起呼仍须明确发起；拒绝或待核，不写半次结束/新周期，不泄露目标方后续资料。

覆盖：AC-2141

## 完成条件

- 确认准确边与令牌后进入后继；到END先封原run，再执行CLOSE或DIRECT_FOLLOWUP。
- CLOSE业务结束不跟进；DIRECT_FOLLOWUP在同record/当前tenant建立MANUAL直接周期，保结束run/原通话/快照，不自动起呼。
- 原跟进人仅当前有效且有电话资格才沿用，否则待安排；合法END来源与分类普通DIRECT许可分开验证。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [four-node-model.js](../../../prototype/scripts/four-node-model.js) · 只读行为参考，非生产可写目标
- [four-node-workspace.js](../../../prototype/js/adapters/four-node-workspace.js) · 只读行为参考，非生产可写目标

需开发处理的问题：ENG-FLOW-PERSISTENCE。
