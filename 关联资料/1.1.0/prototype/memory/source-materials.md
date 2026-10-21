# 资料来源

| Source ID | Name | Type | Location | Version | Status |
| --- | --- | --- | --- | --- | --- |
| SRC-001 | 需求分析冻结基线 | verified-package | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e | 1.1.0 | verified / immutable |
| SRC-002 | glossary.md | upstream-evidence-index | inputs/glossary.md | frozen | integrity-checked / evidence-only |
| SRC-003 | API-301.txt | upstream-evidence-index | inputs/interface-documents/API-301.txt | frozen | integrity-checked / evidence-only |
| SRC-004 | API-312.txt | upstream-evidence-index | inputs/interface-documents/API-312.txt | frozen | integrity-checked / evidence-only |
| SRC-005 | API-315.txt | upstream-evidence-index | inputs/interface-documents/API-315.txt | frozen | integrity-checked / evidence-only |
| SRC-006 | API-318.txt | upstream-evidence-index | inputs/interface-documents/API-318.txt | frozen | integrity-checked / evidence-only |
| SRC-007 | source-index.json | upstream-evidence-index | inputs/source-index.json | frozen | integrity-checked / evidence-only |
| SRC-008 | user-batch-contract-20261011.txt | upstream-evidence-index | inputs/user-batch-contract-20261011.txt | frozen | integrity-checked / evidence-only |
| SRC-009 | user-decision-20261011.txt | upstream-evidence-index | inputs/user-decision-20261011.txt | frozen | integrity-checked / evidence-only |
| SRC-010 | user-original-20261009.txt | upstream-evidence-index | inputs/user-original-20261009.txt | frozen | integrity-checked / evidence-only |
| SRC-011 | user-prototype-review-20261011.txt | upstream-evidence-index | inputs/user-prototype-review-20261011.txt | frozen | integrity-checked / evidence-only |
| SRC-012 | user-stories.md | upstream-evidence-index | inputs/user-stories.md | frozen | integrity-checked / evidence-only |

## Source Policy

- `SRC-001` 是本轮原型的权威业务事实源；其 manifest 和所有文件会在每个后续门禁重新校验。
- 其他 SRC-* 是上游证据索引，仅用于审计追溯；完整性通过不代表原始内容已被业务确认。
- 原型 Agent 不读取 LLM Wiki/query 正文，不访问 wiki_ref/raw_ref 目标；这些字段只保留来源、覆盖与风险元数据。
- 原型业务与字段事实只由冻结结构化结论物化；新增 Wiki 材料或缺口退回需求分析 Loop。
