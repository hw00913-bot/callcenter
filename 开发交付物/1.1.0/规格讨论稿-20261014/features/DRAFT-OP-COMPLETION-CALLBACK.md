# DRAFT-OP-COMPLETION-CALLBACK 已完成沟通后回调本次通话与业务信息

当前独立操作草案，正式FUNC编号与S7拆分待评审。

**标识**：DRAFT-OP-COMPLETION-CALLBACK

**名称**：已完成沟通后回调本次通话与业务信息

**状态**：candidate_not_formal_FUNC

**说明**：通话结束且坐席明确选择已完成沟通并可靠保存后，生成本次通话和本次已保存业务信息快照，携原业务批次号回调原应用业务系统；保留每次结果/进度回调，补送不重做导入、拨号或保存。 已填选填字段与选项业务编码一并回传，多选全量，编码缺失待完善而不假报成功。 完成快照同时携准确本次原导入六字段，不能用最新其他来源替代。

**source_story_ids**

1. US-006

2. US-012

**source_acceptance_ids**

1. AC-095

2. AC-096

3. AC-097

4. AC-098

5. AC-101

6. AC-104

**source_scenario_ids**

1. SC-002

2. SC-007

**来源**：需求/1.1.0/分析工作区/inputs/source-index.json#SRC-123, 需求/1.1.0/分析工作区/inputs/source-index.json#SRC-125

**交付优先级**

**级别**：P0

**角色**：primary

**优先组**

1. P0-FOLLOWUP

**范围**：完成沟通快照生成与原业务系统交付

**来源**：draft-20261014.json#priority_policy.scope_extensions

[验收](../acceptance-map.md) · [局部逻辑](../local-logic.md) · [字段](../field-specs.md) · [页面](../ui-spec.md)
