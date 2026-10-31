# v2.0.0 AI外呼接口定向核验 — loop 消费上下文

> 结论：当前上下文已对齐 `raw/iccai-tob-service-api@v1（用户提供文档，非部署保证）`；JSON 是唯一结构化业务载体，本 Markdown 由其确定性生成。 内容范围仅含当前结论，不含历史或迁移规则。
> generated-at: `2026-10-16T10:04:26+08:00`
> context-hash: `10e58fb166d735c9a03e62966b0ad07045cf54fa36d963fd6471f4c89301f5b1`
> markdown-hash: `3e2721f6a25e8384ed383b36349b1424b1957450f0a0cc8e801ba5691d7a2c0f`

## 输入页快照

`wiki_pages` 与下表 `input_pages` 完全一致；任一页面哈希变化后，本输出即视为陈旧。

| 页面 id | 路径 | updated | SHA-256 |
|---|---|---|---|
| lib-智能外呼服务任务与场景接口 | wiki/概念对齐/智能外呼服务任务与场景接口.md | 2026-10-16 | e58ac8d29710d691e59c1ecba2205df4b3c89ce7791d76e9b4db2fd4c7f4a29d |
| lib-智能外呼服务名单与黑名单接口 | wiki/概念对齐/智能外呼服务名单与黑名单接口.md | 2026-10-16 | 61a1e7377d68cb3417151a477e6c01bdc5273a42a531d6744da737d86f49c459 |
| lib-智能外呼服务回调与开放接口 | wiki/概念对齐/智能外呼服务回调与开放接口.md | 2026-10-16 | 61f61edb1ddd7089bc5ca4b0b680a0c781b1d0393f0f9eab15ca781d47e8da80 |
| lib-智能外呼服务接口总览 | wiki/概念对齐/智能外呼服务接口总览.md | 2026-10-16 | 2935d228b8df7aebe2dca4c2e0c67b294d39cadfc8f0769b8cae5af5a1e20c8d |
| lib-智能外呼服务标签与拦截接口 | wiki/概念对齐/智能外呼服务标签与拦截接口.md | 2026-10-16 | b376272e1f363aee2a936e59523323fd843e95eb693843c5db6324e2d752c16d |
| lib-智能外呼服务线路与供应商接口 | wiki/概念对齐/智能外呼服务线路与供应商接口.md | 2026-10-16 | b83a2bf04b84bec0661c034149e019aaaa8ec11aa929ff46ea103a8af8ceb8e7 |
| lib-智能外呼服务通话报表与计费接口 | wiki/概念对齐/智能外呼服务通话报表与计费接口.md | 2026-10-16 | d91b16d61691004261f75fb32889759c1a0ecc5e039f16478cde1d53179ff5bd |

## 平台与权威版本

| 项目 | 值 |
|---|---|
| 平台 | iccai-tob-service |
| 当前权威来源 | raw/iccai-tob-service-api@v1（用户提供文档，非部署保证） |
| 文档载体 | 净化Markdown；文档版本1.0／Wiki证据v1 |
| 覆盖范围 | 用户新导入的AI服务接口分组；51模块/368接口；本查询排除运维测试专题，不扩大v2范围 |

## 字段表

### blacklist_semantics

来源页面：`lib-智能外呼服务名单与黑名单接口`

| 字段 | 内容 |
|---|---|
| addType | 存在INTENT/DECLINE/OTHER；DECLINE类型不自动建立公共永久拒联规则 |
| syncStatus | 查询参数只说明0至2，响应说明0至4，允许范围待核 |
| syncType | 记录有1新增/2删除；记录存在不等于逐供应商解除已完成 |
| validityPeriodType | 存在永久分组期限；不自动意味着所有拨打入口强制应用 |

### call_record_source

来源页面：`lib-智能外呼服务通话报表与计费接口`

| 字段 | 内容 |
|---|---|
| detail | GET /tob/call-record/detail/{id}，id必填int64，含sceneId/phone/录音/聊天/标签等；查看授权未提供 |
| page | GET /tob/call-record/page含可选companyId查询；不能证明服务端隔离 |
| refusal | 拒接/通话结果枚举或聊天内容不能自动替代人工核实的公共拒联依据 |

### category_axes

来源页面：`lib-智能外呼服务标签与拦截接口`

| 字段 | 内容 |
|---|---|
| companyId | 业务场景等处标为租户ID；不证明人员成员模型或服务端授权 |
| companyType/companyTypeCode | 总部/门店类型；不是具体租户ID |
| sceneTypeId/sceneTypeCode/sceneType | 不同字段并存，编码/主键/业务场景枚举的对应关系未说明 |
| supplierType | 本地/供应商类别；不等于租户类别 |
| tenantId | 供应商任务详情中的租户字段；未证明等于本平台companyId |

### document_scope

来源页面：`lib-智能外呼服务接口总览`

| 字段 | 内容 |
|---|---|
| auth | 未提供人员SSO、租户成员角色或完整鉴权协议，不能认定无需认证 |
| modules | 51 |
| operations | 368 |
| selected_operations | {"method":"POST","path":"/create","source_line":82,"title":"创建业务类型","wiki_ref":"lib-智能外呼服务任务与场景接口"}, {"method":"GET","path":"/list","source_line":147,"title":"查询业务类型列表","wiki_ref":"lib-智能外呼服务任务与场景接口"}, {"method":"GET","path":"/tob/supplier-config/list","source_line":2156,"title":"查询外呼供应商表列表","wiki_ref":"lib-智能外呼服务线路与供应商接口"}, {"method":"POST","path":"/tob/scene-type-config/create","source_line":2994,"title":"创建外呼场景类型表","wiki_ref":"lib-智能外呼服务任务与场景接口"}, {"method":"GET","path":"/tob/scene-type-config/list","source_line":3073,"title":"查询外呼场景类型表列表","wiki_ref":"lib-智能外呼服务任务与场景接口"}, {"method":"GET","path":"/tob/scene-info/list","source_line":3476,"title":"查询业务场景信息列表","wiki_ref":"lib-智能外呼服务任务与场景接口"}, {"method":"GET","path":"/tob/scene-info/detail/{id}","source_line":3570,"title":"根据id查询业务场景信息","wiki_ref":"lib-智能外呼服务任务与场景接口"}, {"method":"GET","path":"/tob/route-config/list","source_line":4127,"title":"查询线路配置列表","wiki_ref":"lib-智能外呼服务线路与供应商接口"}, {"method":"GET","path":"/tob/line-business-type/list","source_line":6909,"title":"查询业务类型表列表","wiki_ref":"lib-智能外呼服务任务与场景接口"}, {"method":"PUT","path":"/tob/intent-level-config/update","source_line":8639,"title":"更新外呼意向标签表","wiki_ref":"lib-智能外呼服务标签与拦截接口"}, {"method":"POST","path":"/tob/intent-level-config/create","source_line":8815,"title":"创建外呼意向标签表","wiki_ref":"lib-智能外呼服务标签与拦截接口"}, {"method":"GET","path":"/tob/intent-level-config/local-intent-level","source_line":8908,"title":"获取本地标签","wiki_ref":"lib-智能外呼服务标签与拦截接口"}, {"method":"GET","path":"/tob/intent-level-config/list","source_line":9010,"title":"查询外呼意向标签表列表","wiki_ref":"lib-智能外呼服务标签与拦截接口"}, {"method":"GET","path":"/tob/intent-level-config/intent-level-parent-tree","source_line":9115,"title":"配置树","wiki_ref":"lib-智能外呼服务标签与拦截接口"}, {"method":"GET","path":"/tob/intent-level-config/detail/{id}","source_line":9227,"title":"根据id查询外呼意向标签表","wiki_ref":"lib-智能外呼服务标签与拦截接口"}, {"method":"DELETE","path":"/tob/intent-level-config/del/{id}","source_line":9322,"title":"删除外呼意向标签表","wiki_ref":"lib-智能外呼服务标签与拦截接口"}, {"method":"GET","path":"/tob/call-record/playAudio","source_line":13635,"title":"播放录音","wiki_ref":"lib-智能外呼服务通话报表与计费接口"}, {"method":"GET","path":"/tob/call-record/page","source_line":13681,"title":"分页查询通话记录列表","wiki_ref":"lib-智能外呼服务通话报表与计费接口"}, {"method":"GET","path":"/tob/call-record/detail/{id}","source_line":13941,"title":"根据id查询通话记录","wiki_ref":"lib-智能外呼服务通话报表与计费接口"}, {"method":"PUT","path":"/tob/call-phone-list/update","source_line":14155,"title":"更新外呼名单","wiki_ref":"lib-智能外呼服务名单与黑名单接口"}, {"method":"GET","path":"/tob/call-phone-list/list","source_line":14366,"title":"查询外呼名单列表","wiki_ref":"lib-智能外呼服务名单与黑名单接口"}, {"method":"DELETE","path":"/tob/call-phone-list/del/{id}","source_line":14919,"title":"删除外呼名单","wiki_ref":"lib-智能外呼服务名单与黑名单接口"}, {"method":"GET","path":"/tob/call-account/list","source_line":16739,"title":"查询一知账号配置表列表","wiki_ref":"lib-智能外呼服务线路与供应商接口"}, {"method":"POST","path":"/tob/blacklist/blacklist-user/retry-sync","source_line":17051,"title":"重试同步","wiki_ref":"lib-智能外呼服务名单与黑名单接口"}, {"method":"POST","path":"/tob/blacklist/blacklist-user/create","source_line":17260,"title":"创建黑名单用户","wiki_ref":"lib-智能外呼服务名单与黑名单接口"}, {"method":"GET","path":"/tob/blacklist/blacklist-user/page","source_line":17347,"title":"查询黑名单用户列表","wiki_ref":"lib-智能外呼服务名单与黑名单接口"}, {"method":"DELETE","path":"/tob/blacklist/blacklist-user/del","source_line":17596,"title":"删除黑名单用户","wiki_ref":"lib-智能外呼服务名单与黑名单接口"}, {"method":"POST","path":"/tob/blacklist/blacklist-group/create","source_line":17746,"title":"创建黑名单分组","wiki_ref":"lib-智能外呼服务名单与黑名单接口"}, {"method":"GET","path":"/tob/blacklist/blacklist-group/list","source_line":17829,"title":"分页查询黑名单分组列表","wiki_ref":"lib-智能外呼服务名单与黑名单接口"}, {"method":"GET","path":"/tob/blacklist/blacklist-group/detail/{id}","source_line":18001,"title":"根据id查询黑名单分组","wiki_ref":"lib-智能外呼服务名单与黑名单接口"}, {"method":"GET","path":"/tob/blacklist-user-sync-record/list","source_line":18442,"title":"查询黑名单同步记录列表","wiki_ref":"lib-智能外呼服务名单与黑名单接口"}, {"method":"PUT","path":"/tob/blacklist-group-sync-config/updateStatus","source_line":18795,"title":"停用&启用同步","wiki_ref":"lib-智能外呼服务名单与黑名单接口"}, {"method":"POST","path":"/tob/blacklist-group-sync-config/create","source_line":18872,"title":"创建黑名单分组同步配置","wiki_ref":"lib-智能外呼服务名单与黑名单接口"}, {"method":"GET","path":"/tob/blacklist-group-sync-config/list","source_line":18949,"title":"查询黑名单分组同步配置列表","wiki_ref":"lib-智能外呼服务名单与黑名单接口"}, {"method":"GET","path":"/tob/blacklist-group-sync-config/group-sync-info","source_line":19047,"title":"查询黑名单分组同步信息","wiki_ref":"lib-智能外呼服务名单与黑名单接口"}, {"method":"POST","path":"/tob/task/update-exec-status","source_line":21359,"title":"修改执行状态","wiki_ref":"lib-智能外呼服务任务与场景接口"}, {"method":"POST","path":"/tob/task/import-phone-list-v2","source_line":21830,"title":"导入外呼名单V2","wiki_ref":"lib-智能外呼服务任务与场景接口"}, {"method":"POST","path":"/tob/task/dzDeleteCallList","source_line":21988,"title":"中科金删除外呼名单","wiki_ref":"lib-智能外呼服务任务与场景接口"}, {"method":"POST","path":"/tob/task/batch-del-phone","source_line":22161,"title":"批量移除名单","wiki_ref":"lib-智能外呼服务任务与场景接口"}, {"method":"GET","path":"/tob/task/yiWishDetail","source_line":22310,"title":"一知任务详情","wiki_ref":"lib-智能外呼服务任务与场景接口"}, {"method":"GET","path":"/tob/task/dzDetail","source_line":23624,"title":"中科金任务详情","wiki_ref":"lib-智能外呼服务任务与场景接口"}, {"method":"GET","path":"/tob/task/call-list","source_line":24277,"title":"外呼列表","wiki_ref":"lib-智能外呼服务任务与场景接口"}, {"method":"POST","path":"/tob/business-scene/create","source_line":24901,"title":"创建&更新业务场景","wiki_ref":"lib-智能外呼服务任务与场景接口"}, {"method":"GET","path":"/tob/business-scene/scene-type-list","source_line":25210,"title":"获取场景列表","wiki_ref":"lib-智能外呼服务任务与场景接口"}, {"method":"GET","path":"/tob/business-scene/list","source_line":25427,"title":"查询业务场景列表","wiki_ref":"lib-智能外呼服务任务与场景接口"}, {"method":"GET","path":"/tob/business-scene/detail/{id}","source_line":25681,"title":"根据id查询业务场景","wiki_ref":"lib-智能外呼服务任务与场景接口"}, {"method":"POST","path":"/tob/billing-record/statistics","source_line":26211,"title":"计费统计","wiki_ref":"lib-智能外呼服务通话报表与计费接口"}, {"method":"POST","path":"/tob/billing-record/statisticsDetail","source_line":26313,"title":"计费统计详情","wiki_ref":"lib-智能外呼服务通话报表与计费接口"}, {"method":"POST","path":"/iccai/open/systemCallback","source_line":29561,"title":"业务系统回调","wiki_ref":"lib-智能外呼服务回调与开放接口"} |
| status | partial |

## 业务规则

| 来源页面 | 规则 | 范围 |
|---|---|---|
| lib-智能外呼服务接口总览 | 文档定义不等于生产可用、已授权或产品已实施；未知鉴权、错误、幂等和超时保持缺口。 | current |
| lib-智能外呼服务接口总览 | 文档版本1.0、Wiki证据v1与产品v2.0.0互不等同；未覆盖的站点分组不能判为系统没有。 | current |

## 建议写入 `memory/source-materials.md`

暂无推荐来源材料。

## 建议写入 `memory/field-map.md`

暂无推荐字段映射。

## 命中页面状态

| wiki_ref | status | updated | coverage |
|---|---|---|---|
| lib-智能外呼服务任务与场景接口 | partial | 2026-10-16 | 仅当前接口文档定义；鉴权、错误语义、部署及产品实施未核验 |
| lib-智能外呼服务名单与黑名单接口 | partial | 2026-10-16 | 仅当前接口文档定义；鉴权、错误语义、部署及产品实施未核验 |
| lib-智能外呼服务回调与开放接口 | partial | 2026-10-16 | 仅当前接口文档定义；鉴权、错误语义、部署及产品实施未核验 |
| lib-智能外呼服务接口总览 | partial | 2026-10-16 | 仅当前接口文档定义；鉴权、错误语义、部署及产品实施未核验 |
| lib-智能外呼服务标签与拦截接口 | partial | 2026-10-16 | 仅当前接口文档定义；鉴权、错误语义、部署及产品实施未核验 |
| lib-智能外呼服务线路与供应商接口 | partial | 2026-10-16 | 仅当前接口文档定义；鉴权、错误语义、部署及产品实施未核验 |
| lib-智能外呼服务通话报表与计费接口 | partial | 2026-10-16 | 仅当前接口文档定义；鉴权、错误语义、部署及产品实施未核验 |

本文件是由同名 JSON 确定性生成的可重建派生物，不得作为知识来源。
