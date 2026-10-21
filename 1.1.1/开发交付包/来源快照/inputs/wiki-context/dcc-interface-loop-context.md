# 云外呼平台-v1.1.1-DCC接口补证 — loop 消费上下文

> 结论：本上下文由列出的 wiki 页面生成；JSON 是唯一结构化业务载体，本 Markdown 由其确定性生成。 内容范围仅含当前结论，不含历史或迁移规则。
> generated-at: `2026-10-17T14:35:38+08:00`
> context-hash: `d26c183bb41ce7f0fda5184358af62fd3df410b4789620f86dea4e4c58db9d6d`
> markdown-hash: `28e9d13644cc013bc0f501076184e42c7c8f6995c178a6723419762c611d452c`

## 输入页快照

`wiki_pages` 与下表 `input_pages` 完全一致；任一页面哈希变化后，本输出即视为陈旧。

| 页面 id | 路径 | updated | SHA-256 |
|---|---|---|---|
| lib-平台通用服务经销商车型与区域接口 | wiki/概念对齐/平台通用服务经销商车型与区域接口.md | 2026-10-16 | b621f43a34c3bf433655e9f965f362d9a5d785a2cb3dd64b3d02b46d38c371fd |
| lib-经销商口语化地址接口 | wiki/概念对齐/经销商口语化地址接口.md | 2026-10-16 | 07583679a43482fbd8b78c92b4893c73ec045e6647d621b198b11cc4653f299a |

## 字段表

### dcc_store

来源页面：`lib-经销商口语化地址接口`

| 字段 | 内容 |
|---|---|
| base_url | None |
| document_notes | 只声明page/per_page，未声明seriesCode、名称编码等搜索入参；不能从未声明推定服务实际拒绝或支持。, page/per_page必填与未传默认并存，参数位置及默认适用条件待核。, 有分页骨架及授权车系字符串，不足证明全部租户可用范围、NEV/ICE或营业状态。, 缺区县、小组、门店业务类型、营业状态和售前电话；地区不能猜作区县。 |
| method | POST |
| path | /third-api/clue/listDealerInfoExtend |
| request_content_type | None |
| request_fields | {"default_in_remark":"1","location":null,"meaning":"页码","name":"page","required_in_document":true,"source_type":"字符","type":"string"}, {"default_in_remark":"10","location":null,"meaning":"每页数量","name":"per_page","required_in_document":true,"source_type":"字符","type":"string"} |
| response_fields | {"meaning":"扩展信息","name":"extInfo","type":"string"}, {"meaning":"错误信息","name":"msg","type":"string"}, {"meaning":"返回码","name":"result","type":"string"}, {"meaning":"当前页","name":"pageindex","type":"integer"}, {"meaning":"总页数","name":"pages","type":"integer"}, {"meaning":"返回对象","name":"rows","type":"array"}, {"meaning":"门店简称","name":"rows.dealerName","type":"string"}, {"meaning":"公司名称","name":"rows.dlrFullName","type":"string"}, {"meaning":"门店地址","name":"rows.address","type":"string"}, {"meaning":"口头位置信息","name":"rows.spokenAddress","type":"string"}, {"meaning":"省份","name":"rows.provinceName","type":"string"}, {"meaning":"城市","name":"rows.cityName","type":"string"}, {"meaning":"门店编码","name":"rows.dealerCode","type":"string"}, {"meaning":"逗号分隔授权车系名称","name":"rows.carSeriesCn","type":"string"}, {"meaning":"逗号分隔的车系名称-编码映射","name":"rows.carSeriesCnCarSeriesCode","type":"string"}, {"meaning":"腾讯地图经度，转换细节未给","name":"rows.tencentLongitude","type":"string"}, {"meaning":"腾讯地图纬度，转换细节未给","name":"rows.tencentLatitude","type":"string"} |
| sample_only_fields | records |
| selection | candidate_not_integrated |
| source_ref | raw/dealer-spoken-address-api@v1 |
| unnamed_response_fields | 地区（编码、类型与备注未给） |

### platform_car_series

来源页面：`lib-平台通用服务经销商车型与区域接口`

| 字段 | 内容 |
|---|---|
| base_url | None |
| document_notes | 可作为权威车系候选接口的待核验来源，不等于已确认该服务是本项目NEV/ICE权威源。, carSeriesCode与DCC映射编码是否同源、companyId如何映射当前租户均待核。, energyType为能源类型枚举，不能据此自行定义NEV/ICE业务归属。 |
| method | GET |
| path | /organization/car-series/list |
| request_content_type | application/x-www-form-urlencoded |
| request_fields | {"location":"query","meaning":"用户id","name":"userId","required_in_document":false,"type":"string"}, {"location":"query","meaning":"主键id","name":"id","required_in_document":false,"type":"string"}, {"location":"query","meaning":"公司ID，数据权限","name":"companyId","required_in_document":false,"type":"string"}, {"location":"query","meaning":"车系名称","name":"carSeriesName","required_in_document":false,"type":"string"}, {"location":"query","meaning":"系统状态0停用1可用","name":"flagSystemState","required_in_document":false,"type":"string"}, {"location":"query","meaning":"在售1是0否","name":"forSaleFlag","required_in_document":false,"type":"string"}, {"location":"query","meaning":"页码，默认1","name":"page","required_in_document":false,"type":"string"}, {"location":"query","meaning":"每页数量，默认10","name":"perPage","required_in_document":false,"type":"string"} |
| response_field_scope | 仅提取本需求相关字段，非完整响应字典；完整选定接口切片另存。 |
| response_fields | {"meaning":"返回码","name":"result","type":"string"}, {"meaning":"错误信息","name":"msg","type":"string"}, {"meaning":"扩展信息","name":"extInfo","type":"string"}, {"meaning":"当前页","name":"pageindex","type":"integer"}, {"meaning":"总页数","name":"pages","type":"integer"}, {"meaning":"总记录数","name":"records","type":"integer"}, {"meaning":"结果对象","name":"rows","type":"array"}, {"meaning":"车系编码","name":"rows.carSeriesCode","type":"string"}, {"meaning":"车系名称","name":"rows.carSeriesName","type":"string"}, {"meaning":"公司ID，数据权限","name":"rows.companyId","type":"integer"}, {"meaning":"系统状态0停用1可用","name":"rows.flagSystemState","type":"integer"}, {"meaning":"在售1是0否","name":"rows.forSaleFlag","type":"integer"}, {"meaning":"1纯电2燃油3插混4增程5混动","name":"rows.energyType","type":"integer"} |
| selection | candidate_not_selected_as_authoritative_source |
| source_ref | raw/iccai-platform-service-api@v1 |

## 业务规则

| 来源页面 | 规则 | 范围 |
|---|---|---|
| lib-经销商口语化地址接口 | 只声明page/per_page，未声明seriesCode、名称编码等搜索入参；不能从未声明推定服务实际拒绝或支持。 | current |
| lib-经销商口语化地址接口 | page/per_page必填与未传默认并存，参数位置及默认适用条件待核。 | current |
| lib-经销商口语化地址接口 | 有分页骨架及授权车系字符串，不足证明全部租户可用范围、NEV/ICE或营业状态。 | current |
| lib-经销商口语化地址接口 | 缺区县、小组、门店业务类型、营业状态和售前电话；地区不能猜作区县。 | current |
| lib-平台通用服务经销商车型与区域接口 | 可作为权威车系候选接口的待核验来源，不等于已确认该服务是本项目NEV/ICE权威源。 | current |
| lib-平台通用服务经销商车型与区域接口 | carSeriesCode与DCC映射编码是否同源、companyId如何映射当前租户均待核。 | current |
| lib-平台通用服务经销商车型与区域接口 | energyType为能源类型枚举，不能据此自行定义NEV/ICE业务归属。 | current |

## 建议写入 `memory/source-materials.md`

| Source ID | 类型 | 标题 | Received At | wiki_ref | raw_ref / path | 关键点 | 状态 / 覆盖 | Used In |
|---|---|---|---|---|---|---|---|---|
| SRC-161 | llm_wiki | DCC门店接口字段与分页契约（净化派生，partial） | 2026-10-17T14:35:38+08:00 | lib-经销商口语化地址接口 | raw/dealer-spoken-address-api@v1 / — | 只声明page/per_page，未声明seriesCode、名称编码等搜索入参；不能从未声明推定服务实际拒绝或支持。, page/per_page必填与未传默认并存，参数位置及默认适用条件待核。, 有分页骨架及授权车系字符串，不足证明全部租户可用范围、NEV/ICE或营业状态。, 缺区县、小组、门店业务类型、营业状态和售前电话；地区不能猜作区县。 | partial / 仅记录声明契约，未调用真实接口；见本地审计切片和源哈希。 | API-016 |
| SRC-162 | llm_wiki | 平台车系列表候选接口（未确认DCC编码同源，partial） | 2026-10-17T14:35:38+08:00 | lib-平台通用服务经销商车型与区域接口 | raw/iccai-platform-service-api@v1 / — | 可作为权威车系候选接口的待核验来源，不等于已确认该服务是本项目NEV/ICE权威源。, carSeriesCode与DCC映射编码是否同源、companyId如何映射当前租户均待核。, energyType为能源类型枚举，不能据此自行定义NEV/ICE业务归属。 | partial / 仅记录声明契约，未调用真实接口；见本地审计切片和源哈希。 | API-015 |

## 建议写入 `memory/field-map.md`

暂无推荐字段映射。

## 命中页面状态

| wiki_ref | status | updated | coverage |
|---|---|---|---|
| lib-平台通用服务经销商车型与区域接口 | partial | 2026-10-16 | 本次只消费定点接口契约；源页面为partial，未知不转为已验证。 |
| lib-经销商口语化地址接口 | partial | 2026-10-16 | 本次只消费定点接口契约；源页面为partial，未知不转为已验证。 |

本文件是由同名 JSON 确定性生成的可重建派生物，不得作为知识来源。
