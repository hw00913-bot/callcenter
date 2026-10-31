# 当前来源记录

本轮只消费已确认分析稿及明确参考；禁止底层会话资料和Wiki/query正文。源路径与使用边界在下表保留，收录日期是本轮绑定日期。

## Sources

| Source ID | Type | Title | Received At | Key Points | Used In |
| --- | --- | --- | --- | --- | --- |
| SRC-001 | user-confirmation | 用户重建/取消删除/直接index授权 | 2026-10-26（本轮绑定） | 本轮真实确认；路径：inputs/rebuild-authorization.json | memory/project.md, memory/field-map.md, memory/feature-list.md |
| SRC-002 | readonly-design | 当前项目、角色、对象与权限事实 | 2026-10-26（本轮绑定） | 当前已确认设计，非生产合同；路径：/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/需求/分析工作区/memory/project-facts.json | memory/project.md, memory/field-map.md, memory/feature-list.md |
| SRC-003 | readonly-design | 当前业务规则与流程 | 2026-10-26（本轮绑定） | 现行结构化事实；路径：/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/需求/分析工作区/memory/business-rules.json | memory/project.md, memory/field-map.md, memory/feature-list.md |
| SRC-004 | readonly-design | 当前43页113动作及来源映射 | 2026-10-26（本轮绑定） | 现行页面规划；路径：/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/需求/分析工作区/planning/page-index.json | memory/project.md, memory/field-map.md, memory/feature-list.md |
| SRC-005 | readonly-design | 38用户故事与134验收条件 | 2026-10-26（本轮绑定） | 已确认范围；路径：/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/需求/分析工作区/memory/normalized-user-stories.json | memory/project.md, memory/field-map.md, memory/feature-list.md |
| SRC-006 | readonly-design | 43差异责任和222原操作完整边界 | 2026-10-26（本轮绑定） | 原功能逐项承接；路径：/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/需求/分析工作区/memory/feature-list.json | memory/project.md, memory/field-map.md, memory/feature-list.md |
| SRC-007 | readonly-design | 36场景/36时序及全部只读输入 | 2026-10-26（本轮绑定） | 90文件新核摘要；路径：inputs/design-source-lock.json | memory/project.md, memory/field-map.md, memory/feature-list.md |
| SRC-008 | readonly-design | 接口核验矩阵 | 2026-10-26（本轮绑定） | partial等状态原样，不读取Wiki原文；路径：/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/需求/分析工作区/interfaces/interface-index.json | memory/project.md, memory/field-map.md, memory/feature-list.md |
| SRC-009 | readonly-design | 未决工程问题 | 2026-10-26（本轮绑定） | 原缺证保留；路径：/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/需求/分析工作区/runtime/open-items.json | memory/project.md, memory/field-map.md, memory/feature-list.md |
| SRC-010 | readonly-reference | AI专业视觉与交互 | 2026-10-26（本轮绑定） | 只读参考，不复制工具/历史；路径：/Users/huhaowen/Documents/038-云外呼平台/DCC&AI 外呼/AI 外呼 | memory/project.md, memory/field-map.md, memory/feature-list.md |
| SRC-011 | readonly-reference | 云呼叫原专业页面 | 2026-10-26（本轮绑定） | 只读参考；路径：/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/1.2.0/prototype | memory/project.md, memory/field-map.md, memory/feature-list.md |
| SRC-012 | readonly-reference | 单模板分类与流转原页面 | 2026-10-26（本轮绑定） | 只读参考；现行确认稿约束语义；路径：/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/1.2.0/prototype-class-flow | memory/project.md, memory/field-map.md, memory/feature-list.md |
| SRC-013 | readonly-reference | 原DCC业务参考 | 2026-10-26（本轮绑定） | 完整CRM不扩入本期；路径：/Users/huhaowen/Documents/038-云外呼平台/DCC&AI 外呼/DCC/DccLead.html | memory/project.md, memory/field-map.md, memory/feature-list.md |

## 2026-10-28 本轮明确授权的状态域只读核对

仅为当前模板增量核对，不修改冻结分析输入，也不将接口文档当实际执行证据。Wiki/raw未写入。

- lib-通话状态码：/Users/huhaowen/Documents/00_automatic_prototype/01_WIKI_LLM/wiki/概念对齐/通话状态码.md；SHA256 ee236870afaedd19e8efa29ad84783f9ac07ee1e8ea23e00fcd94f358efa814a。
- lib-天润融通通话记录：/Users/huhaowen/Documents/00_automatic_prototype/01_WIKI_LLM/wiki/概念对齐/天润融通通话记录.md；SHA256 3597309d33852bca1b6cb60abaf73d7b20a7c6a2312af8daba4a5b2b5ffa9bfa。
- AI机器取值、原始转换及标签稳定ID另核原AI只读参考的js/pages/result-records.js、mock/data.js、js/pages/sys-tags.js，以及当前统一分类/上下文配置。厚朴770–790为原项目已确认本地归并规则，非供应商官方DCC映射。云接口域保原status，不将sipCauseType/sipCauseRaw混作相同枚举。


## 本轮直接授权

inputs/four-node-implementation-authorization-20261029.json记录用户开始修改原型及中途推荐决策执行授权，绑定docs/四节点与客户跟进闭环需求记录.md当时摘要。该本地授权不替代上游冻结分析、G3或真实供应商核验。
