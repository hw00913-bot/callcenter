# TASK-030 客户档案统一只读归集、业务名单与当前队列

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [查看业务、运行和有权跟进通话详情 · FUNC\-2033](../features/FUNC-2033.md)
- [查询业务、批次和工作队列 · FUNC\-2039](../features/FUNC-2039.md)

## 目标

客户维护入口为导入批次查看，新增名单从分类行发起；原任务名单同表展示新recordId投影和旧原生历史，缺新增字段留空。；独立业务名单恢复不要求batchKey，详情仍须recordId；批次/全业务范围、账号/租户和撤权恢复分别核对。；当前run无有效安排不展示旧队列时间；排序依据独立使用可信当前队列/节点进入/当前周期开始，重分配同资源取得新队列身份，不让旧历史抢队。；客户档案使用一个当前有权客户列表，统一只读归集统一业务的AI/预外呼/人工跟进、原AI通话及独立AI线索回访、原Cloud/PRED联系与导入历史；业务、跟进、回访资料、通话和实际拨打分别保留，不复制持久客户/业务/通话记录，不按同号合并业务身份。；展示身份为tenantId+enterpriseId+完整规范号码；只消除号码的明确格式差异，不从脱敏、姓名、时间、城市或首项推测客户。同源身份落在不同号码或归属冲突时双方待核，不首行胜出；号码更正后旧实际通话仍留原号码，新号码只关联当前业务而不继承旧通话。；客户档案原入口权限与各来源原模块/对象/人员范围分别满足；AI通话核PAGE-2108，独立AI回访核PAGE-2109，不要求同时拥有两者。运营同号不取得他人记录；监管和转出截止沿权威已授权投影，不以当前owner再次猜测过滤。聚合身份不授CustomerDirectory.find或原编辑/再次联系资格；详情和录音重核准确原来源及原媒体权限。；各来源成功、加载、失败、无权不适用分别表达；无权来源不扩大为读取许可，已知空与未可靠取得不同。脱敏/归属待核记录保准确原引用单列，不虚建客户。查询只构建瞬态投影，原已存话单只读hydrate不启动同步定时器、推进回执或覆盖业务备注；导航偏好和原详情控制器既有缓存仍按原合同保存，不声称浏览器绝对零写入。；客户维度业务数、业务跟进段、正常归档段、原AI回访资料、通话记录及可确认拨打分别统计。原AI汇总回访次数不生成明细、通话或正式归档；受理/排队/未拨/事实待核不计确认拨打。仅同租户企业且明确record/segment/原call或providerCall关联的镜像去重；冲突事实保待核，不能仅同号/同名/同时间或跨供应商同call字符串合并。未知时长不补0，已知0保持0，时间缺失不以受理/接收/当前时间补拨打时间。；同账号和准确租户范围保查询、来源筛选、分页与选中客户；账号/tenant/enterprise/brand/授权变化及离页后的旧异步结果不能回填。来源完成或失败原位更新列表和自身只读详情，保未提交筛选、焦点/caret、滚动及嵌套来源层；冷恢复的AI-only客户等待可靠来源，源失败不误判撤权，可靠完整后仍不可见才清选中并提示。失败不自动循环重试，明确刷新可重试，接口消失不复用旧成功快照。

## 产品依据

- FUNC-2033 查看业务、运行和有权跟进通话详情：查看有权业务的实际模式、当前资料、完整跟进和通话快照；DIRECT无run或节点，模板方案/运行只对真实TEMPLATE显示，转出截止和最小本人表单资格保持。；来源 documentation/input/functions.json#FUNC-2033
- FUNC-2039 查询业务、批次和工作队列：查询模式、批次、队列和下一步；DIRECT显示同租户待安排/起呼/结果/本人填写/待核及再次跟进，允许有权人经独立预检显式启用流程。 列表和详情展示具体目标与五档等级；待执行视图按资源内等级与入队先后，普通历史列表仍更新时间倒序，长期等待可提示。；来源 documentation/input/functions.json#FUNC-2039

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`edc5225b5022e6100a5e5848c84fb590eba1e70c2a584fffa610b9133c191a29`

## 前置任务

- TASK-015
- TASK-017
- TASK-021
- TASK-022
- TASK-025

## 只读代码上下文

未指定既有代码文件；从工程规范和产品依据读取上下文。

## 允许修改的文件

- 未填写

代码库根：`None`。未列出的文件不属于本任务修改范围；扩大范围需回到计划。

## 变更安排

- 未填写

## 逻辑与字段依据

先读 [全局逻辑](../global-logic.md)，再读本任务关联的局部逻辑与字段定义。

全局规则：[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)、[GR-EXECUTION-ARRANGEMENT](../global-logic.md#GR-EXECUTION-ARRANGEMENT)、[GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)、[GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)、[GR-PRIVACY](../global-logic.md#GR-PRIVACY)、[GR-SCOPE](../global-logic.md#GR-SCOPE)、[GR-TASK-UNIFIED-IMPORT](../global-logic.md#GR-TASK-UNIFIED-IMPORT)

局部逻辑：[LOCAL-FLOW-QUERY](../local-logic/LOCAL-FLOW-QUERY.md)、[LOCAL-FLOW-BATCH-READ](../local-logic/LOCAL-FLOW-BATCH-READ.md)、[LOCAL-FLOW-DETAIL](../local-logic/LOCAL-FLOW-DETAIL.md)、[LOCAL-FLOW-CUSTOMER-TIMELINE](../local-logic/LOCAL-FLOW-CUSTOMER-TIMELINE.md)

字段：[FIELD-FLOW-ACTIVITY-INTEREST](../field-specs.md#FIELD-FLOW-ACTIVITY-INTEREST)、[FIELD-FLOW-ACTUAL-ANSWER](../field-specs.md#FIELD-FLOW-ACTUAL-ANSWER)、[FIELD-FLOW-ACTUAL-HANDLER](../field-specs.md#FIELD-FLOW-ACTUAL-HANDLER)、[FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)、[FIELD-FLOW-BASIS](../field-specs.md#FIELD-FLOW-BASIS)、[FIELD-FLOW-BATCH-ID](../field-specs.md#FIELD-FLOW-BATCH-ID)、[FIELD-FLOW-BRAND-ID](../field-specs.md#FIELD-FLOW-BRAND-ID)、[FIELD-FLOW-BUSINESS-CODE](../field-specs.md#FIELD-FLOW-BUSINESS-CODE)、[FIELD-FLOW-CALLS](../field-specs.md#FIELD-FLOW-CALLS)、[FIELD-FLOW-CATEGORY-ID](../field-specs.md#FIELD-FLOW-CATEGORY-ID)、[FIELD-FLOW-CONTENT-SNAPSHOT](../field-specs.md#FIELD-FLOW-CONTENT-SNAPSHOT)、[FIELD-FLOW-CORRECTIONS](../field-specs.md#FIELD-FLOW-CORRECTIONS)、[FIELD-FLOW-CUSTOMER-NAME](../field-specs.md#FIELD-FLOW-CUSTOMER-NAME)、[FIELD-FLOW-DEPARTURE-SNAPSHOT](../field-specs.md#FIELD-FLOW-DEPARTURE-SNAPSHOT)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-CYCLES](../field-specs.md#FIELD-FLOW-DIRECT-CYCLES)、[FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)、[FIELD-FLOW-DIRECT-OUTCOME](../field-specs.md#FIELD-FLOW-DIRECT-OUTCOME)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)、[FIELD-FLOW-EFFECTIVE-PLAN](../field-specs.md#FIELD-FLOW-EFFECTIVE-PLAN)、[FIELD-FLOW-END-FOLLOWUP-ORIGIN](../field-specs.md#FIELD-FLOW-END-FOLLOWUP-ORIGIN)、[FIELD-FLOW-EVALUATION](../field-specs.md#FIELD-FLOW-EVALUATION)、[FIELD-FLOW-EXECUTION-PRIORITY](../field-specs.md#FIELD-FLOW-EXECUTION-PRIORITY)、[FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE)、[FIELD-FLOW-EXECUTION-QUEUED-AT](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUED-AT)、[FIELD-FLOW-EXECUTION-RESOURCE](../field-specs.md#FIELD-FLOW-EXECUTION-RESOURCE)、[FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)、[FIELD-FLOW-FOLLOWER](../field-specs.md#FIELD-FLOW-FOLLOWER)、[FIELD-FLOW-FOLLOWUP-ID](../field-specs.md#FIELD-FLOW-FOLLOWUP-ID)、[FIELD-FLOW-FOLLOWUP-SUMMARY](../field-specs.md#FIELD-FLOW-FOLLOWUP-SUMMARY)、[FIELD-FLOW-FOLLOWUP-VALUES](../field-specs.md#FIELD-FLOW-FOLLOWUP-VALUES)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-IMPORT-PREVIEW](../field-specs.md#FIELD-FLOW-IMPORT-PREVIEW)、[FIELD-FLOW-IMPORT-VALUES](../field-specs.md#FIELD-FLOW-IMPORT-VALUES)、[FIELD-FLOW-INTENDED-STORE-NAME](../field-specs.md#FIELD-FLOW-INTENDED-STORE-NAME)、[FIELD-FLOW-INTENTION-LEVEL](../field-specs.md#FIELD-FLOW-INTENTION-LEVEL)、[FIELD-FLOW-INTERESTED-ITEMS](../field-specs.md#FIELD-FLOW-INTERESTED-ITEMS)、[FIELD-FLOW-LEAD-LEVEL](../field-specs.md#FIELD-FLOW-LEAD-LEVEL)、[FIELD-FLOW-MANUAL-ASSIGNMENT-MODE](../field-specs.md#FIELD-FLOW-MANUAL-ASSIGNMENT-MODE)、[FIELD-FLOW-MAPPING-SERIES](../field-specs.md#FIELD-FLOW-MAPPING-SERIES)、[FIELD-FLOW-METHOD](../field-specs.md#FIELD-FLOW-METHOD)、[FIELD-FLOW-NEXT-SERVICE](../field-specs.md#FIELD-FLOW-NEXT-SERVICE)、[FIELD-FLOW-NODE-ID](../field-specs.md#FIELD-FLOW-NODE-ID)、[FIELD-FLOW-OUTCOME](../field-specs.md#FIELD-FLOW-OUTCOME)、[FIELD-FLOW-OWNER-TENANT](../field-specs.md#FIELD-FLOW-OWNER-TENANT)、[FIELD-FLOW-PARTICIPANTS](../field-specs.md#FIELD-FLOW-PARTICIPANTS)、[FIELD-FLOW-PHONE](../field-specs.md#FIELD-FLOW-PHONE)、[FIELD-FLOW-PLANNED-STORE](../field-specs.md#FIELD-FLOW-PLANNED-STORE)、[FIELD-FLOW-PLANNED-VISIT](../field-specs.md#FIELD-FLOW-PLANNED-VISIT)、[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-RUN-END-ACTION](../field-specs.md#FIELD-FLOW-RUN-END-ACTION)、[FIELD-FLOW-RUN-ID](../field-specs.md#FIELD-FLOW-RUN-ID)、[FIELD-FLOW-RUN-STATUS](../field-specs.md#FIELD-FLOW-RUN-STATUS)、[FIELD-FLOW-SERVICE-CONCERN](../field-specs.md#FIELD-FLOW-SERVICE-CONCERN)、[FIELD-FLOW-SERVICE-SATISFACTION](../field-specs.md#FIELD-FLOW-SERVICE-SATISFACTION)、[FIELD-FLOW-STATISTICS](../field-specs.md#FIELD-FLOW-STATISTICS)、[FIELD-FLOW-TASK-IMPORT-PARAMETERS](../field-specs.md#FIELD-FLOW-TASK-IMPORT-PARAMETERS)、[FIELD-FLOW-TASK-IMPORT-SOURCE](../field-specs.md#FIELD-FLOW-TASK-IMPORT-SOURCE)、[FIELD-FLOW-TESTDRIVE-INTENTION](../field-specs.md#FIELD-FLOW-TESTDRIVE-INTENTION)、[FIELD-FLOW-UPDATED-AT](../field-specs.md#FIELD-FLOW-UPDATED-AT)、[FIELD-FLOW-VALUE-SOURCES](../field-specs.md#FIELD-FLOW-VALUE-SOURCES)、[FIELD-FLOW-VISIT-INTENTION](../field-specs.md#FIELD-FLOW-VISIT-INTENTION)、[FIELD-FLOW-WORK-STATE](../field-specs.md#FIELD-FLOW-WORK-STATE)、[FIELD-PLAT-PHONE](../field-specs.md#FIELD-PLAT-PHONE)、[FIELD-PLAT-RESOURCE-SCOPE](../field-specs.md#FIELD-PLAT-RESOURCE-SCOPE)、[FIELD-PROFILE-AI-FOLLOWUPS](../field-specs.md#FIELD-PROFILE-AI-FOLLOWUPS)、[FIELD-PROFILE-COUNTS](../field-specs.md#FIELD-PROFILE-COUNTS)、[FIELD-PROFILE-IDENTITY](../field-specs.md#FIELD-PROFILE-IDENTITY)、[FIELD-PROFILE-SOURCE-REFS](../field-specs.md#FIELD-PROFILE-SOURCE-REFS)、[FIELD-PROFILE-SOURCE-STATES](../field-specs.md#FIELD-PROFILE-SOURCE-STATES)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2203](../ui-pages/UI-PAGE-2203.md)
- [UI-PAGE-2204](../ui-pages/UI-PAGE-2204.md)
- [UI-PAGE-2226](../ui-pages/UI-PAGE-2226.md)
- [UI-PAGE-2227](../ui-pages/UI-PAGE-2227.md)

## 实现要求

- 客户维护入口为导入批次查看，新增名单从分类行发起；原任务名单同表展示新recordId投影和旧原生历史，缺新增字段留空。
- 独立业务名单恢复不要求batchKey，详情仍须recordId；批次/全业务范围、账号/租户和撤权恢复分别核对。
- 当前run无有效安排不展示旧队列时间；排序依据独立使用可信当前队列/节点进入/当前周期开始，重分配同资源取得新队列身份，不让旧历史抢队。
- 客户档案使用一个当前有权客户列表，统一只读归集统一业务的AI/预外呼/人工跟进、原AI通话及独立AI线索回访、原Cloud/PRED联系与导入历史；业务、跟进、回访资料、通话和实际拨打分别保留，不复制持久客户/业务/通话记录，不按同号合并业务身份。
- 展示身份为tenantId+enterpriseId+完整规范号码；只消除号码的明确格式差异，不从脱敏、姓名、时间、城市或首项推测客户。同源身份落在不同号码或归属冲突时双方待核，不首行胜出；号码更正后旧实际通话仍留原号码，新号码只关联当前业务而不继承旧通话。
- 客户档案原入口权限与各来源原模块/对象/人员范围分别满足；AI通话核PAGE-2108，独立AI回访核PAGE-2109，不要求同时拥有两者。运营同号不取得他人记录；监管和转出截止沿权威已授权投影，不以当前owner再次猜测过滤。聚合身份不授CustomerDirectory.find或原编辑/再次联系资格；详情和录音重核准确原来源及原媒体权限。
- 各来源成功、加载、失败、无权不适用分别表达；无权来源不扩大为读取许可，已知空与未可靠取得不同。脱敏/归属待核记录保准确原引用单列，不虚建客户。查询只构建瞬态投影，原已存话单只读hydrate不启动同步定时器、推进回执或覆盖业务备注；导航偏好和原详情控制器既有缓存仍按原合同保存，不声称浏览器绝对零写入。
- 客户维度业务数、业务跟进段、正常归档段、原AI回访资料、通话记录及可确认拨打分别统计。原AI汇总回访次数不生成明细、通话或正式归档；受理/排队/未拨/事实待核不计确认拨打。仅同租户企业且明确record/segment/原call或providerCall关联的镜像去重；冲突事实保待核，不能仅同号/同名/同时间或跨供应商同call字符串合并。未知时长不补0，已知0保持0，时间缺失不以受理/接收/当前时间补拨打时间。
- 同账号和准确租户范围保查询、来源筛选、分页与选中客户；账号/tenant/enterprise/brand/授权变化及离页后的旧异步结果不能回填。来源完成或失败原位更新列表和自身只读详情，保未提交筛选、焦点/caret、滚动及嵌套来源层；冷恢复的AI-only客户等待可靠来源，源失败不误判撤权，可靠完整后仍不可见才清选中并提示。失败不自动循环重试，明确刷新可重试，接口消失不复用旧成功快照。
- 实际人员保历史原值；AI空责任人行不冒充待分配或当前actor，不迁移旧事实。
- 只读展示身份不替代专业客户或recordId，不授原写资格；源不完整不得画全来源完整总量。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2093**：接收方在明确转交后按本租户资格读取同条线索基础资料，不因共享模板获得其他租户业务范围。
  依据：docs/functional-spec.json#AC-2093

- **AC-2094**：有权接收方可查看同条业务按既定范围可读的原跟进/通话事实；转出方严格本方截止投影，最小接听表单不等整档案读取。
  依据：docs/functional-spec.json#AC-2094

- **AC-2129**：超管在管理范围仅监管查询，列表/详情/直接访问一致，不代分配、起呼、填结果或转交。
  依据：docs/functional-spec.json#AC-2129

- **AC-2130**：所有监管和办理读同权威业务事实，不造第二份线索账本或冒用目标身份。 客户档案原入口权限与各来源原模块/对象/人员范围分别满足；AI通话核PAGE-2108，独立AI回访核PAGE-2109，不要求同时拥有两者。运营同号不取得他人记录；监管和转出截止沿权威已授权投影，不以当前owner再次猜测过滤。聚合身份不授CustomerDirectory.find或原编辑/再次联系资格；详情和录音重核准确原来源及原媒体权限。
  依据：docs/functional-spec.json#AC-2130

- **AC-2131**：同台账工作区承载分类导入、批次、记录详情、工作状态、当前有效值及各轮快照；默认列表按更新时间倒序再分页。
  依据：docs/functional-spec.json#AC-2131

- **AC-2132**：当前负责、有权本方截止历史和超管管理范围监管分别投影；辅助运行API不泄露接收方后续节点/场景。 客户档案原入口权限与各来源原模块/对象/人员范围分别满足；AI通话核PAGE-2108，独立AI回访核PAGE-2109，不要求同时拥有两者。运营同号不取得他人记录；监管和转出截止沿权威已授权投影，不以当前owner再次猜测过滤。聚合身份不授CustomerDirectory.find或原编辑/再次联系资格；详情和录音重核准确原来源及原媒体权限。
  依据：docs/functional-spec.json#AC-2132

- **AC-2133**：本轮无旧规划数据迁移或旧模板适配；未来本版业务/运行/跟进/通话快照按发生时保存，名称/配置更改不重画已开run或正式内容。
  依据：docs/functional-spec.json#AC-2133

- **AC-2147**：客户档案使用一个当前有权客户列表，统一只读归集统一业务的AI/预外呼/人工跟进、原AI通话及独立AI线索回访、原Cloud/PRED联系与导入历史；业务、跟进、回访资料、通话和实际拨打分别保留，不复制持久客户/业务/通话记录，不按同号合并业务身份。 同账号和准确租户范围保查询、来源筛选、分页与选中客户；账号/tenant/enterprise/brand/授权变化及离页后的旧异步结果不能回填。来源完成或失败原位更新列表和自身只读详情，保未提交筛选、焦点/caret、滚动及嵌套来源层；冷恢复的AI-only客户等待可靠来源，源失败不误判撤权，可靠完整后仍不可见才清选中并提示。失败不自动循环重试，明确刷新可重试，接口消失不复用旧成功快照。
  依据：docs/functional-spec.json#AC-2147

- **AC-2154**：当前排队事实仅属于准确当前run/nodeRun/directCycle及有效资源安排；新运行未安排清当前queue别名，显示未记录，不能借旧运行队列时间或业务createdAt抢队。相同当前运行/资源仅重存或调等级保原FIFO，新运行重新分配同资源才产生新queuedAt/queueSequence。未安排待办排序与队列时间展示分开，按当前节点进入/当前周期开始的可信时间，身份未知保持未知。 当前/旧/generic供应商专属快照与兼容副本只按可信原始任务/批次租户及品牌投影，所有值和配置指纹均受同一范围约束，不泄露给来源方或另一租户；公共业务资料及原截止历史保持。预外呼新安排/执行同核已配置分类和品牌，统一历史未知不在读取时首次补类或换类。
  依据：docs/functional-spec.json#AC-2154

## 测试要求（尚未执行）

### CHECK-FLOW-QUERY / manual

步骤：分别从主菜单/批次/record详情查询并刷新，改变账号/租户/权限；回读原历史和新TASK行。

预期：业务分类列表提供导入名单并锁定准确分类；原导入与分配改为导入批次，以批次结果/详情为主。独立业务名单保工作队列、原单条/同组批量手动分配及明确发起；主菜单打开/刷新不带临时批次过滤，准确批次详情和recordId详情各保自身上下文，账号/租户/撤权重新核验。 原专业名单直接在原列表展示：保姓名、电话、批次、原操作与原统计，新业务按准确recordId只读回链；旧原生行缺业务编码/业务分类/五档执行优先级/导入入口四项时直接留空，不单列历史名单、不按手机号补链。统一业务数/办理状态不冒充供应商受理、真实拨打、接通或话单数。

覆盖：AC-2129, AC-2130, AC-2131, AC-2132

### CHECK-FLOW-BATCH-READ / manual

步骤：按当前三入口统一导入规则：从当前台账打开批次查看业务；按实际可见记录裁剪批次及私有行，准确表明部分可见；可见集按真实更新时间倒序分页，关联到准确业务；按准确身份展示模式与方式；DIRECT无当前run/节点显示“直接跟进”，保完整有权跟进/通话/快照及当前资料更正入口，不显示可办理模板转交或推进。 业务分类列表提供导入名单并锁定准确分类；原旧导入菜单改为导入批次，业务名单保独立，业务名单保独立，业务名单保独立，业务名单保独立，业务名单保独立，以批次结果/详情为主。独立业务名单保工作队列、原单条/同组批量手动分配及明确发起；主菜单打开/刷新不带临时批次过滤，准确批次详情和recordId详情各保自身上下文，账号/租户/撤权重新核验。 。构造无权、来源锁定、字段/任务/窗口变化及失败/未知。

预期：不通过批次扩大跨租户字段或电话读取；原资格/历史/未知守卫保持，不把新统一记录或投影说成供应商已受理/拨打。

覆盖：AC-2131, AC-2132

### CHECK-FLOW-DETAIL / manual

步骤：按当前三入口统一导入规则：打开准确业务详情或辅助run/timeline接口；分别投影当前负责、超管管理只读、本方转出截止三身份；按各自快照显示当前资料、实际run、原段内容和通话，辅助接口同样裁剪；按准确身份展示模式与方式；DIRECT无当前run/节点显示“直接跟进”，保完整有权跟进/通话/快照及当前资料更正入口，不显示可办理模板转交或推进。 业务分类列表提供导入名单并锁定准确分类；原旧导入菜单改为导入批次，业务名单保独立，业务名单保独立，业务名单保独立，业务名单保独立，业务名单保独立，以批次结果/详情为主。独立业务名单保工作队列、原单条/同组批量手动分配及明确发起；主菜单打开/刷新不带临时批次过滤，准确批次详情和recordId详情各保自身上下文，账号/租户/撤权重新核验。 。构造无权、来源锁定、字段/任务/窗口变化及失败/未知。

预期：查看不创建跟进或运行；原资格/历史/未知守卫保持，不把新统一记录或投影说成供应商已受理/拨打。

覆盖：AC-2093, AC-2094, AC-2131, AC-2132, AC-2133

### CHECK-FLOW-EXECUTION-HISTORY / manual

步骤：受控废弃后建立新RUN但不安排，再分配相同资源；比较同RUN重存和新RUN的新队列事实，回读旧跟进。

预期：当前排队事实仅属于准确当前run/nodeRun/directCycle及有效资源安排；新运行未安排清当前queue别名，显示未记录，不能借旧运行队列时间或业务createdAt抢队。相同当前运行/资源仅重存或调等级保原FIFO，新运行重新分配同资源才产生新queuedAt/queueSequence。未安排待办排序与队列时间展示分开，按当前节点进入/当前周期开始的可信时间，身份未知保持未知。 原专业名单直接在原列表展示：保姓名、电话、批次、原操作与原统计，新业务按准确recordId只读回链；旧原生行缺业务编码/业务分类/五档执行优先级/导入入口四项时直接留空，不单列历史名单、不按手机号补链。统一业务数/办理状态不冒充供应商受理、真实拨打、接通或话单数。

覆盖：AC-2154

### CHECK-FLOW-CUSTOMER-TIMELINE / manual

步骤：当前统一列表分别核AI/PRED/人工新业务、原AI通话、独立AI回访及原Cloud/PRED；核完整号码/来源引用、分项计数、原快照/详情、返回筛选分页、冷恢复有效PRED及AI-only选择、源成功/失败、上下文切换、号码更正、镜像冲突和原接听者。

预期：客户档案使用一个当前有权客户列表，统一只读归集统一业务的AI/预外呼/人工跟进、原AI通话及独立AI线索回访、原Cloud/PRED联系与导入历史；业务、跟进、回访资料、通话和实际拨打分别保留，不复制持久客户/业务/通话记录，不按同号合并业务身份。 展示身份为tenantId+enterpriseId+完整规范号码；只消除号码的明确格式差异，不从脱敏、姓名、时间、城市或首项推测客户。同源身份落在不同号码或归属冲突时双方待核，不首行胜出；号码更正后旧实际通话仍留原号码，新号码只关联当前业务而不继承旧通话。 客户档案原入口权限与各来源原模块/对象/人员范围分别满足；AI通话核PAGE-2108，独立AI回访核PAGE-2109，不要求同时拥有两者。运营同号不取得他人记录；监管和转出截止沿权威已授权投影，不以当前owner再次猜测过滤。聚合身份不授CustomerDirectory.find或原编辑/再次联系资格；详情和录音重核准确原来源及原媒体权限。 各来源成功、加载、失败、无权不适用分别表达；无权来源不扩大为读取许可，已知空与未可靠取得不同。脱敏/归属待核记录保准确原引用单列，不虚建客户。查询只构建瞬态投影，原已存话单只读hydrate不启动同步定时器、推进回执或覆盖业务备注；导航偏好和原详情控制器既有缓存仍按原合同保存，不声称浏览器绝对零写入。 客户维度业务数、业务跟进段、正常归档段、原AI回访资料、通话记录及可确认拨打分别统计。原AI汇总回访次数不生成明细、通话或正式归档；受理/排队/未拨/事实待核不计确认拨打。仅同租户企业且明确record/segment/原call或providerCall关联的镜像去重；冲突事实保待核，不能仅同号/同名/同时间或跨供应商同call字符串合并。未知时长不补0，已知0保持0，时间缺失不以受理/接收/当前时间补拨打时间。 同账号和准确租户范围保查询、来源筛选、分页与选中客户；账号/tenant/enterprise/brand/授权变化及离页后的旧异步结果不能回填。来源完成或失败原位更新列表和自身只读详情，保未提交筛选、焦点/caret、滚动及嵌套来源层；冷恢复的AI-only客户等待可靠来源，源失败不误判撤权，可靠完整后仍不可见才清选中并提示。失败不自动循环重试，明确刷新可重试，接口消失不复用旧成功快照。

覆盖：AC-2130, AC-2131, AC-2132, AC-2147

## 完成条件

- 客户维护入口为导入批次查看，新增名单从分类行发起；原任务名单同表展示新recordId投影和旧原生历史，缺新增字段留空。
- 独立业务名单恢复不要求batchKey，详情仍须recordId；批次/全业务范围、账号/租户和撤权恢复分别核对。
- 当前run无有效安排不展示旧队列时间；排序依据独立使用可信当前队列/节点进入/当前周期开始，重分配同资源取得新队列身份，不让旧历史抢队。
- 客户档案使用一个当前有权客户列表，统一只读归集统一业务的AI/预外呼/人工跟进、原AI通话及独立AI线索回访、原Cloud/PRED联系与导入历史；业务、跟进、回访资料、通话和实际拨打分别保留，不复制持久客户/业务/通话记录，不按同号合并业务身份。
- 展示身份为tenantId+enterpriseId+完整规范号码；只消除号码的明确格式差异，不从脱敏、姓名、时间、城市或首项推测客户。同源身份落在不同号码或归属冲突时双方待核，不首行胜出；号码更正后旧实际通话仍留原号码，新号码只关联当前业务而不继承旧通话。
- 客户档案原入口权限与各来源原模块/对象/人员范围分别满足；AI通话核PAGE-2108，独立AI回访核PAGE-2109，不要求同时拥有两者。运营同号不取得他人记录；监管和转出截止沿权威已授权投影，不以当前owner再次猜测过滤。聚合身份不授CustomerDirectory.find或原编辑/再次联系资格；详情和录音重核准确原来源及原媒体权限。
- 各来源成功、加载、失败、无权不适用分别表达；无权来源不扩大为读取许可，已知空与未可靠取得不同。脱敏/归属待核记录保准确原引用单列，不虚建客户。查询只构建瞬态投影，原已存话单只读hydrate不启动同步定时器、推进回执或覆盖业务备注；导航偏好和原详情控制器既有缓存仍按原合同保存，不声称浏览器绝对零写入。
- 客户维度业务数、业务跟进段、正常归档段、原AI回访资料、通话记录及可确认拨打分别统计。原AI汇总回访次数不生成明细、通话或正式归档；受理/排队/未拨/事实待核不计确认拨打。仅同租户企业且明确record/segment/原call或providerCall关联的镜像去重；冲突事实保待核，不能仅同号/同名/同时间或跨供应商同call字符串合并。未知时长不补0，已知0保持0，时间缺失不以受理/接收/当前时间补拨打时间。
- 同账号和准确租户范围保查询、来源筛选、分页与选中客户；账号/tenant/enterprise/brand/授权变化及离页后的旧异步结果不能回填。来源完成或失败原位更新列表和自身只读详情，保未提交筛选、焦点/caret、滚动及嵌套来源层；冷恢复的AI-only客户等待可靠来源，源失败不误判撤权，可靠完整后仍不可见才清选中并提示。失败不自动循环重试，明确刷新可重试，接口消失不复用旧成功快照。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [four-node-workspace.js](../../../prototype/js/adapters/four-node-workspace.js) · 只读行为参考，非生产可写目标
- [business-link.js](../../../prototype/js/components/business-link.js) · 只读行为参考，非生产可写目标
- [list-order.js](../../../prototype/js/components/list-order.js) · 只读行为参考，非生产可写目标
- [session-store.js](../../../prototype/js/components/session-store.js) · 只读行为参考，非生产可写目标
- [task-roster-view.js](../../../prototype/js/adapters/task-roster-view.js) · 只读行为参考，非生产可写目标
- [customer-profile.js](../../../prototype/js/components/customer-profile.js) · 只读行为参考，非生产可写目标
- [customer-profile-workspace.js](../../../prototype/js/adapters/customer-profile-workspace.js) · 只读行为参考，非生产可写目标
- [customer-profile-workspace.css](../../../prototype/js/adapters/customer-profile-workspace.css) · 只读行为参考，非生产可写目标
- [customer_profile_build.py](../../../prototype/scripts/customer_profile_build.py) · 只读行为参考，非生产可写目标
- [check-customer-profile.cjs](../../../prototype/scripts/check-customer-profile.cjs) · 只读行为参考，非生产可写目标
- [check-customer-profile-workspace.cjs](../../../prototype/scripts/check-customer-profile-workspace.cjs) · 只读行为参考，非生产可写目标
- [check-customer-profile-chain.cjs](../../../prototype/scripts/check-customer-profile-chain.cjs) · 只读行为参考，非生产可写目标

需开发处理的问题：ENG-FLOW-PERSISTENCE。
