# 当前原型开发边界

本目录只交付 AliCti 云联络中心原型：客户、坐席、预外呼、自动外呼（IVR）、人工外呼、呼入和运营管理。现行需求先读 `README.md`、`docs/development.md`、相关 `docs/functional-spec.md` 章节及 `docs/field-alignment.json`，再按需查看对应页面代码和供应商原文。

AliCti 预测任务的 `callRouteStrategy=2` 在接口中称“AI转人工”，只是本任务的接听流转选项，不应据此生成独立产品域。

`memory/`、`inputs/`、旧 `reviews/` 与 `qa/evidence-*/` 包含冻结分析和历史验证记录，用于追溯，不能据此恢复已删除的产品模块或覆盖现行规则。`documentation/input/functions.json` 与 `documentation/input/pages.json` 是当前交付范围的规范化清单；从历史输入重建时须先排除过时范围。历史变更日志保留原始记录，冲突时以最新正式说明和当前原型为准。

只修改当前 `prototype` 目录；源 `DEMO_PROTYPE` 只读。不得改写冻结输入、供应商原文或历史验证结果以制造通过。缺少接口依据时标明待确认，不把本地模拟结果当作供应商保证；不发真实电话，不写生产配置。每次修改执行相关回归，并同步现行说明与变更记录。
