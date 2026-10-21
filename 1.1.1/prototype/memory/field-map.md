# 本地模拟字段映射

> SRC-158 / CHANGE-11106-generic-interface-dependency：当前接口字段可独立查询或配置单上游映射（返回取值字段→下游入参名），依赖分必需／可选，允许多级联动。仅必需依赖强制分类闭合；可选缺上游/空值不传参，已填无效不当空。门店无参查询当前租户全部可用门店，有参数按实际编码查询。旧门店绑定保留必需；车系单选、门店多选、来源权限和历史保留。仍为SRC-155授权模拟试做，真实接口及正式G3待核验。

> SRC-157 / CHANGE-11104-multiple-intention-stores：用户明确意向门店多选；车系仍唯一单选，按单编码查店。门店按逐家有效性和同通集合快照处理，旧单值兼容一项，历史不改。当前覆盖早期门店单选表述。仍为SRC-155授权模拟试做，非G3冻结。


> SRC-156 当前更正（CHANGE-11103-single-intention-series）：用户转述黄专并明确确认，意向车系只有一个字段、单选；门店只关联该字段并按单编码查询。此确认覆盖早期多车系并集方案；原草稿输入与批准历史保持只读。仍为授权模拟试做，非G3冻结。

> SRC-155：用户原文“同意，先做独立模拟原型（推荐）”。本记忆服务于已明确批准的独立模拟试做，输入为产品草稿快照，非 G3 冻结导入；真实契约缺口保留，不代表生产或开发交付。

FLD-201～230 为本项目演示编号。字段路径、类型、枚举和 queryScope 只是 mock 格式，不称为真实 API 或生产保存协议；业务含义沿所列确认来源。具体实现成员读取 `memory/ui-contract.md`：字典能力映射 `capabilityId`、查询范围映射 `query.scopeKey`、已选状态映射 `selection.state`；未选择用空值，恢复后待确认以待重选及页面提示表达。下表原始语义路径用于字段追溯，不能据此创建真实 API。

| Field ID | Source ID | Page / Area | API / Data Field | Display Name | Business Definition | Value Logic | Display Format | Enum / Mapping | Empty / Error Rule | Annotation Point | Used In |
|---|---|---|---|---|---|---|---|---|---|---|---|
| FLD-201 | SRC-155 | 接口字典／字段配置 | `dictionary.id` | `dictionary.id` | 字典稳定标识；本地模拟格式，真实契约未核验 | 新增自动生成，改名不变，供字段引用 | string | SRC-145／150；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-202 | SRC-155 | 接口字典／字段配置 | `dictionary.name` | `dictionary.name` | 业务可读名称；本地模拟格式，真实契约未核验 | 超管填写或改名，引用仍按id | string | SRC-145；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-203 | SRC-155 | 接口字典／字段配置 | `dictionary.capabilityId` | `dictionary.capabilityId` | 预置取数能力；本地模拟格式，真实契约未核验 | 模拟清单选择能力id，已引用后固定，非URL；能力kind为series/store | 模拟能力id | SRC-145／150；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-204 | SRC-155 | 接口字典／字段配置 | `dictionary.tenants` | `dictionary.tenants` | 可用租户集合；本地模拟格式，真实契约未核验 | 勾选保存，新旧集合差形成开放或撤销 | string[] | SRC-128／135；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-205 | SRC-155 | 接口字典／字段配置 | `dictionary.enabled` | `dictionary.enabled` | 启用状态；本地模拟格式，真实契约未核验 | 明确选择，与租户授权共同判来源可用 | boolean | SRC-139／148；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-206 | SRC-155 | 接口字典／字段配置 | `field.id` | `field.id` | 独立字段标识；本地模拟格式，真实契约未核验 | 从演示字段库取得，各字段分别留存 | string | SRC-142／143；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-207 | SRC-155 | 接口字典／字段配置 | `field.dictionaryId` | `field.dictionaryId` | 字典引用；本地模拟格式，真实契约未核验 | 选当前租户可用条目并保存id | string | SRC-142／145；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-208 | SRC-155 | 接口字典／字段配置 | `field.depends` | `field.depends` | 关联车系字段；本地模拟格式，真实契约未核验 | 按所选能力的查询条件声明绑定一个单选车系字段id；页面显示“车系取自”，查询只取该字段一个编码 | string[1] | SRC-156／142；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-209 | SRC-155 | 接口字典／字段配置 | `field.required` | `field.required` | 分类内独立必填；本地模拟格式，真实契约未核验 | 取当前分类此字段配置，车系门店各自判断 | boolean，分类维度 | SRC-134；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-210 | SRC-155 | 坐席填写／结果展示 | `series.code` | `series.code` | 车系编码模拟值；本地模拟格式，真实契约未核验 | 取所选模拟候选，不从名称推真编码 | string | SRC-149／151；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-211 | SRC-155 | 坐席填写／结果展示 | `series.name` | `series.name` | 车系展示名称；本地模拟格式，真实契约未核验 | 取候选当前名称，保存复制当时值 | string | SRC-149；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-212 | SRC-155 | 坐席填写／结果展示 | `series.type` | `series.type` | 车系体系模拟值；本地模拟格式，真实契约未核验 | 取模拟对象，保持体系对应 | NEV/ICE | SRC-126／151；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-213 | SRC-155 | 坐席填写／结果展示 | `store.code` | `store.code` | 门店编码模拟值；本地模拟格式，真实契约未核验 | 取按车系返回的模拟候选 | string | SRC-149／151；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-214 | SRC-155 | 坐席填写／结果展示 | `store.name` | `store.name` | 门店展示名称；本地模拟格式，真实契约未核验 | 取当前候选，保存时复制快照 | string | SRC-149；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-215 | SRC-155 | 坐席填写／结果展示 | `store.type` | `store.type` | 门店体系模拟值；本地模拟格式，真实契约未核验 | 模拟返回与查询车系体系对应 | NEV/ICE | SRC-126／151；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-216 | SRC-155 | 坐席填写／结果展示 | `values[fieldId].code / values[fieldId][].code` | `values[fieldId].code / values[fieldId][].code` | 每字段本次编码；本地模拟格式，真实契约未核验 | 车系保存单编码名称；门店逐家保存编码名称数组 | string/null | SRC-149；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-217 | SRC-155 | 坐席填写／结果展示 | `values[fieldId].name / values[fieldId][].name` | `values[fieldId].name / values[fieldId][].name` | 每字段当时名称；本地模拟格式，真实契约未核验 | 与编码一起复制进保存记录，历史不实时改名 | string/null | SRC-149；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-218 | SRC-155 | 坐席填写／结果展示 | `values[fieldId].state / values[fieldId][].state` | `values[fieldId].state / values[fieldId][].state` | 未提交值有效性；本地模拟格式，真实契约未核验 | 按来源、当前完整关联结果和人工确认转换；空值表示未选择，待确认不直接变有效 | valid/pending/unavailable，仅模拟 | SRC-147～149；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-219 | SRC-155 | 坐席填写／结果展示 | `query.scopeKey`（queryScope语义） | `query.scopeKey`（queryScope语义） | 当前查询模拟范围；本地模拟格式，真实契约未核验 | 由租户、来源、关联字段有效编码组成；变更后忽略旧返回 | 本地对象或字符串 | SRC-137／147／148／151；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-220 | SRC-155 | 坐席填写／结果展示 | `query.status` | `query.status` | 查询完整性和结果；本地模拟格式，真实契约未核验 | 单车系查询完整成功才形成可选结果；complete且items空为完整无匹配 | idle/loading/complete/partial/failed，仅模拟 | SRC-146／147；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-221 | SRC-155 | 坐席填写／结果展示 | `query.results` | `query.results` | 当前单车系完整结果；本地模拟格式，真实契约未核验 | 所选单车系返回按体系加编码去重，真实唯一键待核验 | store[] | SRC-137／151；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-222 | SRC-155 | 坐席填写／结果展示 | `query.search` | `query.search` | 候选展示筛选词；本地模拟格式，真实契约未核验 | 只筛显示，不改变完整关联范围或判失配 | string | SRC-151／155及产品草稿搜索边界；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-223 | SRC-155 | 坐席填写／结果展示 | `originalIntentSeries` | `originalIntentSeries` | 导入车系原始意向；本地模拟格式，真实契约未核验 | 读取模拟客户原信息，只读保留，确认带入不覆盖 | string，本地 | SRC-132／143；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-224 | SRC-155 | 坐席填写／结果展示 | `originalIntentStore` | `originalIntentStore` | 导入门店原始意向；本地模拟格式，真实契约未核验 | 原信息只读，不自动当有效本次值 | string，本地 | SRC-132／143；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-225 | SRC-155 | 坐席填写／结果展示 | `plannedStoreName` | `plannedStoreName` | 原计划到店门店文本；本地模拟格式，真实契约未核验 | 沿旧字段独立显示保存，不换接口、不被新值覆盖 | string | SRC-143／152；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-226 | SRC-155 | 坐席填写／结果展示 | `context.tenantId` | `context.tenantId` | 模拟租户上下文；本地模拟格式，真实契约未核验 | 演示上下文取得，参与来源和对象范围判断 | string | SRC-128／135／152；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-227 | SRC-155 | 坐席填写／结果展示 | `context.role` | `context.role` | 模拟使用者角色；本地模拟格式，真实契约未核验 | 演示选择取得，不是生产鉴权方案 | 本地角色枚举 | SRC-128／152／155；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-228 | SRC-155 | 坐席填写／结果展示 | `call.context` | `call.context` | 原保存通话条件；本地模拟格式，真实契约未核验 | 模拟已结束外呼、人工或预外呼、客户接通、本人和阶段，准确判原例外 | 本地对象，非生产契约 | SRC-140／152；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-229 | SRC-155 | 坐席填写／结果展示 | `saved.fields` | `saved.fields` | 按字段保存快照；本地模拟格式，真实契约未核验 | 校验且模拟保存成功后复制各fieldId的code/name，供只读展示 | 字段映射对象 | SRC-149；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |
| FLD-230 | SRC-155 | 坐席填写／结果展示 | `save.status` | `save.status` | 模拟保存结果；本地模拟格式，真实契约未核验 | 校验／成功失败模拟；失败保输入，成功产生快照 | idle/saving/invalid/error/success，仅模拟 | SRC-140／152／155；SRC-155；mock_only; production_contract_unverified | 空值及异常按已确认AC；不推导真实接口空值 | 本轮未请求标注 | step-01、step-02、step-03 |

原导入和 plannedStoreName 独立保留。queryScope、状态及完整性仅服务浏览器内演示，不增加技术配置项。真实编码、体系、分页完整性、唯一键、保存回传继续 ISSUE-11102；生产暂存继续 ISSUE-11105。

SRC-158配置扩展：field.useQueryConditions控制独立/关联；field.depends[0]引用上游；field.parameterBinding.sourceValueKey/parameterName/required表达属性到入参及依赖必需性。仅本地格式，原FLD-207/208扩展，不另编号或认定真实接口字段。独立及可选省略参数的查询scope也保存进未提交确认指纹。


## CHANGE-11112 仅供本轮DCC结构模拟的映射

以下为总控基于已核验候选字段形状制定的虚构fixture转换，不是新增FLD或真实接口承诺；原FLD210～222的业务语义及8FUNC/34AC不变。

| 现有模拟目标 | 本轮模拟输入 | 边界 |
|---|---|---|
| store.code / store.name | rows.dealerCode / rows.dealerName | DCC_DEMO独立编码与虚构名称；与平台车系编码不混用 |
| store.address / province / city | rows.address / provinceName / cityName | 虚构地址明确标注模拟，不使用真实门店样本 |
| store.seriesCodes / seriesNames | carSeriesCnCarSeriesCode + 独立fixture目录 | 仅认fixture登记的完整字符串与精确编码；未知串失败，不猜通用拆分协议 |
| series.type / store.type | 独立fixture显式NEV/ICE演示声明 | 上游文档未提供体系；不由名称或energyType推断，不证明真实范围 |
| district / group / businessType / status / phone | 不提供 | DCC模式显示接口未提供并禁用相关筛选，不移除原业务页面字段 |
| 内部条件参数seriesCode | 本平台模拟适配器参数 | 只用于读全后的编码筛选；DCC原始page调用只含page/per_page |
| 完整性与错误 | 模拟器每页pageindex/pages + 本次来源上下文 | 所有页读齐且上下文一致才complete；失败不返回可选择的部分数据，records不作正式总数依据 |

DCC模拟车系目录独立于真实平台车系接口，类型、权限范围与授权关系只是演示fixture。正式解析、空值、错误码和分页一致性协议须回需求侧补证，不能从本实现反证接口具备能力。


## CHANGE-11117-prototype-dcc-v2｜2026-10-19 当前执行约定

来源为已分析的 SRC-163（DCC v2 净化契约）和 SRC-164（用户确认 ICE 数据源内全部可用门店）；用户明确“开始更新原型”。沿 SRC-155 授权做独立模拟，原 v1.1.0、冻结 startup／CLAUDE／inputs 不改，真实 G2/G3 及 API-018、生产草稿缺口保留。

v2 为 POST /third-api/clue/listDealerInfoExtend/v2、JSON。原始接口仅 sourceType（必需，NEV/ICE 大小写不敏感）、page、perPage、provinceName、cityName；其他原始入参不生效。平台统一 seriesCode 是本地适配入参，经显式虚构目录解析来源，非 DCC 原始请求参数。模拟始终显式传 page/perPage；默认、最大分页、空页语义、错误码及 result=1 成功判断仅为演示约定，真实环境待核。

响应顶层 result/msg/pageindex/pages/records/rows；共用8字段 dealerName/dealerCode/address/provinceName/cityName/countyName/tencentLongitude/tencentLatitude。ICE 六字段 dlrFullName/spokenAddress/carSeriesCn/carSeriesCnCarSeriesCode/testDriveSeriesCn/testDriveSeriesCnCode 可为 null，业务接受，不补假值。countyName 映射区县并在完整结果上本地筛选；小组/业务类型/营业状态/售前电话缺失占位，对应筛选禁用，不宣称上游支持 county 查询。

NEV 的默认非黑名单且 ARIYA 授权数据源范围业务接受；选 NEV 车系时在此来源内按已明确的演示编码关系精确筛选。选 ICE_A 或 ICE_B 则均返回 ICE 数据源全部可用门店，不用 ICE carSeries 字段建关系，也不把所选 ICE 编码填到门店授权车系列。独立查询按模拟授权来源集合读取 NEV+ICE，所有请求来源和分页完整才可选，任何部分异常无新候选，不据此判旧店失配。每来源 records 与完整行数一致性为 fixture 护栏，不代表真实生产补证。

车系仍一个单选、门店多选；条件/来源/epoch/权限变化先使旧查询失效，查全后按当前完整候选核对旧店。ICE 同来源换车系可保留仍有效门店；NEV→ICE 则旧 NEV 店待重选，未确认不能提交。原选填清空/必填/未接通、同通快照、导入确认和页签护栏保持。所有编码、名称、租户、关系、可用性与分页数据为虚构，禁止真实外联。


## CHANGE-11118-local-series-text-store｜SRC165当前方案

用户原话“现在门店先不接入系统，采用自定义车系编码和名称的方式接入”，并明确选择“管理员维护车系，门店用原文本字段（推荐）”。本期默认客服线索表单由管理员维护车系编码/名称候选供单选；门店沿原plannedStoreName文本，外部车系查询/接口门店选择和联动暂缓。通用取数接口字典、授权、字段映射与原有历史保留，不擅自取消整个v1.1.1。SRC165已在上游S1物化、7US/34AC稳定ID保留；G2/G3未通过。

实施复用原普通select{id,label,businessKey}选项，车系名称和编码必填、同字段内唯一，编码为字符串不丢前导零；固定单选、每租户一个localIntentRole=series定义，可在分类关闭显示/分别设置必填，管理员维护选项。默认本地演示编码LOCAL-SERIES-001/002/003及纯虚构车系A/B/C，非真实映射。运行配置CustomerIntentProfile.mode=local-series-text-store在实际入口加载，generic未载该产品profile时保留原通用能力；不是测试开关。

本地车系用新稳定ID和marker，不将旧接口对象直接转字符串或自动带入，旧字段定义/快照保留；仅当前作用域做读投影，显式配置保存才落盘，原同名接口定义必要时加历史标注保证唯一。不清存储，不改其他租户，无法安全迁移的依赖/容量冲突提示修复，不默删自定义字段。分类原车系必填可迁移至本地车系，旧门店必填不转移；plannedStoreName原行为保持。

导入原始信息继续只读；仅明确确认后按intentionSeriesCode与当前本地businessKey唯一精确匹配带入车系，匹配失败不猜，不把导入门店写入plannedStoreName。同步导入按当前form/owner/会话/权限/handler守卫。车系保存optionId/当时编码/名称快照，改名不改历史。车系意向按同通新旧角色替换，空值清除旧车系/接口意向，计划门店文本和其他普通字段沿原汇总规则。

真实查询对接从本期客服路径暂缓；正式保存/回传和生产草稿未知项保留，本地模拟不证明G2/G3或开发交付。原v1.1.0只读，41CSS和27冻结材料不改，无真实外联。


## CHANGE-11119-existing-custom-fields-no-legacy｜SRC166

用户明确“车系配置采用现有自定义填写车系编码和车系名称啊，然后不用考虑兼容因为没有历史数据”。本期车系复用现有自定义单选选项及保存入口，不新增独立车系服务/维护模块。本期无初始存量，不纳入迁移、回填或旧接口单/多门店格式兼容验收；实际项目旧文件/演示素材保留，不删除数据。上线后新记录仍保存当时车系编码名称、导入只读及显式确认。plannedStoreName每通保存、详情及档案汇总沿原普通字段规则，不新增跨通配对/空文本清空。通用接口字典与上游配置仍由平台研发实现，具体模块/物理字段映射属工程工作；API018是内部复用逻辑职责，不需外部供方补证，未声称生产验证。原草稿工程核对边界不变；G2/G3未批准。原型已有防御兼容代码/测试仅为保留实现，不计本期迁移兼容范围。


## CHANGE11120｜审计两项实现修复

用户明确“修复发现的问题”。P1：未提交local车系仅保存option.id，管理员保留ID改code/name会使旧表单所见与保存快照不一致；分类关闭显示会静默丢已选值。必须在保存前按实际草稿所见的field ID、option ID及code/name、可见性核对，变化保留全部草稿、明确提示并提供重新选择/清空恢复；无关项变更不阻断，不用重渲染或旧DOM自动确认新配置。新元数据仅本地草稿使用，不进入保存/回传业务快照，保留会话/owner/权限守卫。

P2：配置编辑器直接退出（X、Esc、返回、取消及子字段返回分类）绕过现有遮罩未保存确认。统一用户退出入口：有改动先确认，继续填写保留同一草稿及焦点，确认放弃才关/回父；无改动、只读预览、保存成功或身份/租户/权限失效清理不误弹。遮罩只弹一次，旧确认不能关闭新编辑器或丢新输入/复活旧层。仅BC局部接管，不扩大全局PlatformUI关闭语义。

两项均现有FUNC029/030、SC012/013、SEQ014/015之实现缺陷，不新增US/AC/FUNC或业务模块。SRC166复用现有自定义code/name单选、原plannedStoreName文本、无初始存量迁移/旧格式兼容范围保持；通用接口能力保留，正式G2/G3不由本次模拟修复批准。旧v1.1.0、41CSS、27冻结材料和原始输入不改。


## CHANGE11121｜通话内表单版本固定，修复配置变更阻断收尾

用户在确认“管理员修改业务类型/字段配置可阻断当前话后完成并挡下一通”后明确要求“修复这个阻断项”。这是既有FUNC-029/030、SC-012/013、SEQ-014/015下的完整性实现缺陷修复。通话开始时以完整通话/客户/租户身份绑定整版分类和字段定义；无固定业务类型的通话也先固定目录，之后选择业务类型仍读同版。当前通话及话后直到保存完成，字段显示、必填、类型、选项code/name、依赖及分类名称均沿绑定版本，管理员的新配置仅后续新通话生效。绑定随该通话/现有本地草稿恢复，不新增生产草稿恢复承诺，也不做初始存量迁移。账号/对象/租户权限与外部接口来源启停/授权继续实时校验，不能借配置快照绕过。未绑定的档案编辑继续live配置保护，不能跨call/租户/owner复用绑定。

前轮CHANGE11120对未绑定编辑器的已选车系变化保护仍保留；本轮已绑定通话按整版快照保存，不再因管理员改码/改名强制客服重选。快照为配置及可追溯元信息，完整保留已填字段，不把私有草稿守卫混入业务values；回传fields/name/code须来自同一版。电话状态不因配置修改改变，完成保存后应真实退出wrap、可继续下一通。通话开始前原本无效的配置及用户自身必填缺失不在本轮放宽，实时权限撤销仍沿原规则。SRC166现有自定义车系code/name单选、原plannedStoreName文本，无初始存量兼容范围保持；旧原v1.1.0、41CSS、27冻结输入与startup/CLAUDE不改，G2/G3和生产核验不由本次模拟修复批准。

本轮step-01 verify-only：起始259文件终态clean，四导航runtime同步后恢复；本轮原source全量只读保护，41原CSS/27冻结不漂移。step-02 update：customer-business.js提供通话目录版本绑定读取及同版回传；customer-followup.js提供bindCallForm及同版填写/校验/保存和档案live边界；agent-workbench.js在来电/任务外呼/预览外呼/草稿恢复处接入完整身份绑定。BIF仅若实际调用链未同版才作必要最小修复。新增qa/check-call-form-version.cjs与qa/check-workbench-form-version.cjs，旧local-staleness测试仅按绑定/未绑定新边界细化不删旧保护；独立/tmp复核。step-03 update：index相关缓存、既有README/追溯与QA汇总；两图及来源只读复核，四视图与浏览器跨tab配置变更、保存详情和下一通按新配置实际走通。两个可选交付仍false，不生成新产品说明/标注/开发包。

验收重点：通话中新增必填/改必填/改类型/隐藏删除字段/普通与车系选项改码改名/分类停用改名均不得套到旧通；新通必须用最新版；旧通保存保留当时值及code/name；通话与租户/owner隔离、现有草稿恢复、实时来源授权拒绝、实际工作台完成与下一通均要有当前证据。


CHANGE11121恢复补充：通话开始即已损坏的目标业务分类不冻结为无解；管理员修复后，客服可明确选择重新载入已修复配置，全部草稿继续保留并按新版本校验，旧选择不自动确认新含义。正常有效绑定版本不提供随管理员修改更新的入口；live仍坏、身份/对象无权、快照跨call等不可替换。无关分类损坏不影响当前正常分类，不把业务表单错误当作来电信令拒绝条件。仅既有本地草稿/通话恢复边界，无生产持久化新增承诺。


## CHANGE11122｜本次意向车系改为Mapping接口取数

用户明确“把车系的字段改成接入接口”。需求分析增量当前净化草稿为 `需求/1.1.1/分析工作区/runtime/mapping-series-design-draft.json`（读取时SHA256：fc237d7effe727e06fa1d1a333bdac58d91ebe0120cf3280a0167f0f37c613ee），来源SRC167/168/169；仅分析结论供本轮实现，不直接消费Wiki正文、不把partial升级为真实接通。沿SRC155已授权独立模拟范围继续本次具体来源更改，正式G2/G3仍pending。

当前本次意向车系为一个接口取数单选字段，引用研发预置Mapping车系查询能力(mapping-series)、条目d-mapping-series，无上游；字段库不再让管理员维护此字段候选options。统一code=String(relation_id)，name显示，原relation_id/media_car_series_id/car_state作为sourceValues来源快照保留。官方ID不能与媒体ID或DCC AE等编码互换；本次编码选择和media_id10/car_state1默认范围为实施假定待正式核对，不猜状态名、品牌或NEV/ICE。模拟请求使用GET相对路径、裸数组、无分页，仅合成数据，无fetch/主机/凭据。完全相同重复可合并，相同官方ID有冲突明确报错不任取，空[]与异常/部分返回分开。

门店继续原plannedStoreName文本，不启用接口门店/车系联动。导入原值只读，明确确认后仅按官方code精确匹配，不猜名称/媒体ID；未匹配保原填写。车系值保存code/name及来源资料并复用原保存和普通文本汇总；实时接口启停/租户授权及角色/对象权限不冻结。CHANGE11121整通话表单版本仍保持：旧通绑定旧本地select可沿原版收尾，新通读取新接口字段；新旧类型不在同通静默互转。历史原型素材保留、不做生产初始存量迁移。

本轮开工前用户已整理项目目录：canonical为原型/1.1.1-接口字段联动，旧原型试做为兼容symlink；README直开index、delivery-nav与review-view-cache的file协议处理及删除启动演示.command为本轮前已有4项漂移，均保留不回退。起点最终快照261文件，当前实际起点另存/tmp/live hash；不把这些既有修改当本轮破坏或伪称原始终态clean。原v1.1.0源全目录672、41原CSS、27冻结输入及startup/CLAUDE只读保护。

step-01 verify-only：保护原源与冻结材料，runtime同步后恢复4自定义导航，承接用户当前canonical/直开文件入口；S6拆分及本轮新epoch。step-02 update：config/customer-intent-profile.js、customer-business.js、customer-followup.js、business-categories.js实现新profile及当前字段承载；新增Mapping fixture/adapter，business-data.js按entry能力独立路由mapping-series及实时epoch，原standard/DCC不混；BIF只按当前实际series/store字段修导入提示，必要保存sourceValues护栏最小调整。新增Mapping adapter/runtime/profile QA；旧local系列QA仅测试harness固定旧profile以完整保留原断言，不修改实际新profile欺骗测试。agent-workbench.js无必要不改。step-03 update：index依赖/缓存、既有README和追溯/QA报告；需求草稿图集只按上游当前输出适配并记录source/provenance，不在原型重画，保四视图/宽屏/直开入口。无新说明书/标注/开发包。

验收：实际新profile+真实fixture/adapter/BD/BIF/CF走查候选加载、搜索、单选、清空、导入官方码精确匹配、异常保稿、正常保存/回传/详情来源快照；门店文本不受车系选择影响。租户授权/来源停复/竞态/无关DCC模式及通话版本保护，新通新版/旧通旧版均复核。所有步骤、两图/global在本轮新epoch记录后才收尾。


CHANGE11122实施收紧：有且仅有一个现有localIntentRole=series语义字段时，直接沿用其id、label、businessKey和enabled将当前定义改为Mapping接口单选，保各分类ref原fieldId/顺序/显示/必填，不新增“原自定义”重复条目；仅fresh scope无该字段才创建mappingIntendedSeries。多个semantic或未知ID冲突明确提示不猜。已绑定旧通话自含旧select定义，不受当前字段类型变更。此条覆盖前述初步新ID保留方案，落实净化草稿的稳定标识与原业务映射保留。旧dirty-close独立QA只将旧local场景harness显式固定legacy，保100断言；当前实际Mapping配置另以新profile/独立用例验证。


## CHANGE11123｜去除旧预置配置兼容迁移（2026-10-20）

用户指出旧关联警告是兼容原数据造成，前文已明确无历史数据、不考虑兼容，现直接确认“是的，现在去掉”。本轮为对SRC166无初始存量及SRC167接口车系范围的实现纠偏，不增加功能，不重做G2/G3或开发包。当前唯一默认方案为Mapping接口车系单选＋原plannedStoreName文本，默认库只含正常统计/售后/活动字段和当前Mapping车系，没有旧预置车系/备选车系/接口门店定义。

彻底移除旧local/Mapping profile自动投影、旧字段保留改名/旧依赖补齐/多车系转单选/旧单门店转数组/历史接口快照迁移及旧冲突提示，不仅隐藏文字，不以兼容专用QA要求保留生产死分支。当前配置与字典使用独立新key和显式schema，旧key不读取/不转换/不合并/不批量删存储；本版后续自定义字段、有效依赖、分类顺序显示必填、字典授权启停均照常保存且刷新不重置。普通字段同名ID不接管，不猜多上游/缺失参数的旧schema。

保留正常通用接口：显式useQueryConditions开关，必需/可选来源及完整参数映射、循环/类型/权限校验；多选接口字段严格数组，series单选正常对象，不能放宽错配置掩盖问题。保留当版businessFieldSnapshot编码名称及正常记录追溯/非空汇总，元数据显式声明dictionaryId/interfaceKind/selectionMode，移除按旧ID或对象/数组猜旧意向角色。来源启停、租户/对象/成员权限实时核验。

保留CHANGE11121进行中通话整版配置保护与创建时显式绑定、同身份合法会话/话单恢复及一致性检查；去旧无版本演示自动首绑/孤儿值升级。两份当版记录均缺配置版本属于损坏，保稿明确报错，不自动套当前配置；电话结束不因表单损坏无法操作。正常有效版本不被管理员后改强换，下一通读取新配置；初始当版坏配置仍可沿明确修复流程恢复，不是旧数据兼容。

step-01 verify-only：起始265文件终态clean，四导航同步后恢复；原source672/原CSS41/冻结27材料保持，沿用户canonical及直开入口，不回退目录和已删启动脚本。step-02 update：CB/config直接当前初始化及显式schema、BC移旧告警，CF/BD/AW定向移旧迁移与默认补齐，mock/customer-followup仅核对且未修改；根修app.js旧配置key引用检查和alicti-storage启动批量改写，BIF移旧schema/API兜底及单店兼容。普通编解码/正常压缩与真实业务保护不误删。QA提取current fixtures，旧兼容专用套明示退役至qa/retired/compatibility留历史证据，不再计本轮通过；mixed套保正常能力意图，当前profile有新真实回归。step-03 update：index相关缓存、既有README/决策/开放项/功能差异和当前QA报告；图集仅既有源只读复核，若当前草稿文字仍提迁移则只按既有无存量事实对齐，不在原型改SVG。四视图/实际浏览器本版初始无警告、配置新增保存刷新、查车系/文本门店/完成下一通，全部当前证据新epoch记录。

验收必须用旧key注入截图123/旧多车系/旧字典证明它们既不被读取也不被改写，新key直接正确默认，实际无旧警告/旧字段；不是只验证文案消失。保正常新custom字段/上下游依赖及错误校验、授权/禁用、Mapping查询保存来源快照、当前通话隔离及正常记录详情汇总；各当前测试实际运行，退役旧兼容不伪称旧数字全过。真实Mapping主机/默认范围口径仍待核，无生产联调；两个可选交付仍false，未生成开发包或批准G2/G3。


## CHANGE11124｜未完成通话缺表单的可操作恢复

用户截图同一待处理通话提示没有有效表单版本。根因是此前移除旧自动首绑后，保留下来的未完成通话无原版时只有拦截、没有明确恢复动作。本轮为已确认通话不中断和保稿原则下的实现缺陷修复，无新增业务事实或历史兼容。两个新通入口仍必须在首写前绑定；不得恢复旧配置读取、自动首绑、旧字段转换、全站清存储或替换健康通话版本。

增加仅本人同租户/同通话pending且真正缺失版本的“重新载入表单并核对”入口。先核对同identity的有效副本，确无原版才由客服明确操作采用当前有效配置；非空原业务值全部保留为待核对，接口值重新查选，未知/隐藏值明确展示处理，备注/处理结果/电话状态不变。缺原schema不得声称含义未变；现有版本损坏/跨身份/权限失效不能借此洗成新版本。持久写异常保留旧状态及原稿可重试，恢复成功后校验完成可保存idle并继续下一通。

step-01 verify-only：保护本轮起始终态、672源/41CSS/27冻结、四导航及两图源几何；复现missing-version恢复死路，确认新通未漏首绑。
step-02 update：最小修改CB/CF/AW（若有效副本检查需正常会话读，限既有key）；实现显式恢复、原稿待核对和权限/并发/持久写守卫；增加真实组件及工作台回归，保正常版本保护/新通和已知异常保存校验。必要fixture仅QA，不新增生产旧模式。
step-03 update：入口缓存与已有README/变更/开放项/验收/QA报告；浏览器实际恢复→核对→保存idle→下一通，同次备注/结果/原值不丢；既有四视图及两图只做源一致/必要导航复核，不重画。无新可选文档、标注或开发包；G2/G3、API/生产缺口保持。


## CHANGE11125｜解除分类对六个统计预置字段的强制引用

用户截图反对“六个预置字段须保留、只能关闭显示”的强绑定。这是v1.1.0本地实现保护过度，不是接口契约或新增业务目标；现有字段复用/按分类配置原则不应受统计反向约束。本轮解除分类引用限制，保默认字段库定义及其稳定类型/选项和当前Mapping单选约束，不增加字段库任意变更/删除范围。六个默认引用可逐项或全部移除再回加，保存/读取/刷新都不得补回或将scope判坏；可以只配车系或配置零个补充字段。当前字段顺序/显示/必填按分类独立；正常必需上游闭合与可选依赖校验不放宽。

step-01 verify-only：保护起始clean、672原source/41CSS/27冻结及四导航；复现UI三个锁和CB保存/读取两处强绑，确认上游无此新增约束。
step-02 update：CB移除hasLeadFields引用硬条件、BC移除须保留提示/移除按钮禁用/动作拦截。必要report-data/lead-report最小解耦：报表筛选及统计维度选项取保留的字段库定义，不再要求当前分类引用它，当前或旧通实际取值仍用各自通话可见字段/快照，未配置保持空、不写业务否/0；正向样本计数沿既有已知正向规则，不改指标公式。新增真实组件/表单/保存/回传/统计专项，原版通话不受配置删除影响、下一通只用新refs、可重加、零字段可保存、租户与依赖检查保留。
step-03 update：入口缓存和现有README/变更/开放项/验收/QA汇总；浏览器实际分类移除六项→保存刷新→原版通话收尾/下一通仅车系→回加，配置复原；现有两图/W/冻结原样，只核验来源与导航。无新接口/G2/G3批准、无开发包/可选文档/标注。


## CHANGE11126｜取值字段与下游入参的兼容校验

用户截图Mapping车系丙已选却报无有效车系编码，已用真实组件复现params={seriesCode:"910003"}；standard/DCC门店模拟各自只接受本来源目录编码，而旧校验仅检查series单选，允许不可用组合。用户明确“是的，开始修改”。本轮修复已确认通用接口条件配置/查询错误分类，不恢复门店默认字段，不新增真实接口或业务编码映射。

step-01 verify-only：保护起点clean、672原source/41CSS/27冻结/四导航及两图，确认实际传值与编码域不匹配，非客服未选也不是成功空结果。
step-02 update：研发预置能力元数据声明返回属性及下游条件的valueType/valueDomain与可读含义；series.code与store.code分域，Mapping官方ID/媒体ID/目录编码不混。CB按所选sourceValueKey、参数声明、类型和域检查（含候选可用性），不按字段名/前缀/样例值猜、不自动转换。BC配置即时提示不兼容原因，已有错误引用保留可编辑，不使整个scope不可读。BIF运行时先检查声明与实际supplied类型，不兼容不请求/不扩成无参查询；配置问题不再提示反复重试或请先选车系。BD直调坏参数给准确配置/编码错误，Picker显示相同明确原因，原值保留不作为有效值提交。独立查询、同源联动、必需/可选条件、有效版本/权限/异步/取消/空结果保持。域由研发预置，超管仍四项，不加技术配置；缺必要声明不能凭空声称兼容。
step-03 update：入口缓存、现有README/决策/变更/开放项/验收和QA结果；真实浏览器编辑不兼容旧配置/正确来源或独立查询恢复，模拟证明无错误候选/无参数降级/保稿。现有W/冻结/两图和业务编号不改，只核验来源导航，G2/G3和真实接口/生产草稿缺口保持；不生成开发包/可选文档/标注。

实现分工：metadata/runtime owner仅BD、BIF、picker及对应必要QA；配置owner仅CB、BC及对应必要QA，二者用CB.queryBindingCompatibility(field,source,sourceValueKey?,parameterName?)结构化ok/message/code返回协作。dependencyCompatible用于候选是否有可匹配属性，具体绑定按实际所选属性校验。必要原QA应保业务保护意图并更新新增声明预期，不通过删除断言回避错误。


## CHANGE11127｜当前删除范围与第三Tab（S6，待实施）

当前来源：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.1/分析工作区/runtime/product-draft-delete-and-dictionary-tab-20261020/source-record.json`；SHA-256 `8d77f3f83fe6f98dc5a627caa370ac428305fb00e9089468e08dc1f747c2ab7c`，40件已核对。SRC172～176为用户直接范围指令，沿SRC155独立模拟；不是G2/G3或开发冻结。当前11FUNC／46AC／9SC／9SEQ／3FLOW／5PAGE／10ACTION，原只读inputs、startup、CLAUDE里的8项为初始历史输入，不改写、不当当前范围。

以下FLD为本地演示协作字段，不是新增真实API/生产协议，原FLD201～230保持。

| Field ID | 来源 | 页面/区域 | 本地成员 | 含义及规则 | 空值/错误 | Used In |
|---|---|---|---|---|---|---|
| FLD-231 | SRC172～175 | 三对象删除 | kind / id / scope | interface全局；field/category强制当前e/t，目标稳定ID | 无目标/无权限拒绝 | step-02 |
| FLD-232 | AC140/144/148 | 引用说明 | refs[].kind/sourceLabel/message | configuration/active_form/saved_business/imported_business/source_reservation；位置纯文本、同对象多副本合并 | 无法确认不当0引用 | step-02 |
| FLD-233 | AC141/145/149 | 删除确认 | fingerprint / expectedUsageFingerprint | 绑定本目标/范围/实际来源；确认后fresh核对，保原expectedContext/expectedRevision CAS | 旧确认/状态变化拒绝，不复用canDelete | step-02 |
| FLD-234 | AC139～150 | 删除结果 | ok / canDelete / code / reason | 只有确认无使用才提交；取消/失败保对象和其他草稿；不级联 | 失败给可读位置，不宣称成功 | step-02 |
| FLD-235 | AC142/146/150 | fresh默认 | catalogState.ok/explicit/revision/entries/context | 仅可读且explicit absence省默认Mapping；已有scope的空数组/删ID不补 | disabled/revoked/读坏不投影删除 | step-02 |
| FLD-236 | SRC176/AC106 | 三Tab | category / field / dictionary | 第三字典仅原super字典权限，embedded复用真实controller；字段分类原权限 | 不授权Tab和直达入口均拒 | step-02、step-03 |


## CHANGE-11129｜业务分类逻辑删除（SRC177当前规则）

用户明确确认逻辑删除方案并要求开始修改。本节覆盖此前FUNC033/US022/AC147～150中“有历史/当前通话/已有名单任务即不能删”的限制；分类从配置列表和新业务可选项移除，归档原row全部refs及必要依赖闭包的字段定义，保留当时名称/编码/结果，旧名单任务继续，本通话后沿开始版。字段和接口仍按实际/归档保留引用保护物理删除，无恢复/清理/迁移UI，不新建功能或AC，仍11FUNC/46AC/9SC/9SEQ/3FLOW/5PAGE/10ACTION。

已核对40件净化草稿：需求/1.1.1/分析工作区/runtime/product-draft-category-logical-delete-20261020/source-record.json，SHA256 3ca0ec0add52121340c5775142b320922b596733ccac264d89e8941f11c4b54f。当前事实及原5MD/3HTML供本轮消费；历史草稿/冻结inputs/startup/CLAUDE不改，G2/G3pending、正式S5～8stale与API015/ISSUE11113/11105缺口不变，仅SRC155继续授权模拟。

实现计划：scope可选retiredTypes归档（row/fields/deletedAt/deletedBy为原型内部设计，非已冻结生产表契约），保存和归档同次CAS；live catalog/list和新import只active，retired ID不能save复活。只读历史需授权且固定类型/实际对象上下文，capturing新通另核对既有batch/DCC具体item/phone/type或已建native/RAM同identity，伪造新callId/taskId不能把deleted类带回新业务；已有效bound最先使用原版。已有归档业务单独获取该row及闭包defs，避免改变其它active定义。删除检查category的业务refs仅影响提示，权限/上下文/原子归档失败仍保留；field/interface仍扫archive refs。


## CHANGE-11132｜通话快照不限制字段库删除（SRC-180）

自定义字段删除只核对当前业务分类引用（含隐藏/停用）及其他当前字段的直接依赖；历史已保存字段值、独立归档定义和完整本通/话后字段快照只作保留影响，不阻止删除字段库定义。删除不改写快照、业务数据或草稿；本通继续按开始版保存，后续通话按新配置。权限/目标版本、当前引用或必要快照无法可靠核对、提交失败仍保留原对象，不自动补默认。取数接口的实时资格与来源保留规则不变。

当前用户明确规则沿既有独立模拟授权落实。旧交付包和冻结来源保留原字节，旧包不代表本次更新规则；本次不补造全量G3批准。仍11FUNC/46AC/5PAGE/10ACTION。
