# 需求分析基线导入

- Baseline ID: `ra-云呼叫中心-v1.1.0-原始需求重新分析草稿-676248563fbe9e8e`
- Baseline fingerprint: `676248563fbe9e8e4daf04b88d37af45b92d8d653b4e1ba524acbcca0e3143d2`
- Manifest SHA-256: `6d42db2b593b28e48c174e76218db68283c1076c17397bdb2736c6f5056aa94d`
- Contract: `requirement-analysis-to-prototype@1.0`
- Project: 云呼叫中心 v1.1.0 原始需求重新分析草稿
- Version: 1.1.0
- Frozen at: 2026-10-11T19:47:36+08:00
- Imported at: 2026-10-11T19:50:40+08:00
- Fact policy: 业务范围、功能清单、规则、接口结论和页面规划按冻结事实只读消费；展示决策可在原型 Loop 内补充。
- Wiki policy: LLM Wiki 只在需求分析 Loop 消费；原型不查询知识库、不读取 query/loop-context 正文。来源元数据只作追溯，原始证据只供脚本核验完整性。

## Upstream Gates

| Gate | Status | Approved By | Approved At | Note |
| --- | --- | --- | --- | --- |
| G1 | approved | 用户 | 2026-10-11T13:14:10+08:00 | 用户SRC087直接要求应用列表新增详情修改删除、精简密钥用途及预外呼导入常驻；SRC088要求完整回归对齐后推进。原4外呼场景保留，新SC005承载应用管理独立操作，runtime/g1-reconcile-20261011.md记录明确范围依据。此前SRC084～086批次规则与合成桌面边界沿用，不新增启停/重置/生产承诺，不是G3或02产品批准。 |
| G2 | approved | 用户 | 2026-10-11T13:14:17+08:00 | 沿用用户SRC084～086已确认本方批次/幂等业务契约，并据SRC087明确应用密钥用于获取token的本方目的、SRC088要求对齐推进。API001外部字段/端点未新增，仅source场景关联SC005及用途notes更新；真实密钥算法/存储/CRUD/token时效与撤销仍missing，供应商partial未提升，合成风险沿已授权演示范围保留，runtime/g2-reconcile-20261011.md记录依据；不是生产验证或G3批准。 |
| G3 | approved | 用户 | 2026-10-11T19:46:05+08:00 | 用户在本会话明确回复“批准 g3 冻结”。批准当前已审阅快照 7f304bb7edec130a5a22e237019a4f992e7189e9e434450047f3911da2fcc001，17 FUNC/62 AC/21 BR/5 SC/8 SEQ/5 PAGE/20 ACTION；保留真实接口 partial/missing 和合成演示边界。按此前已授权流程生成新需求包、导入唯一 prototype 并推进02 S8；不代批02业务/运营或05开发交付。 |

## Accepted Risks

- `ISSUE-002` DCC请求规范化、主子批次接收与原子并发工程落实；关联：SRC-002, API-001, API-002
- `ISSUE-004` 系统限制解除契约缺失；关联：SRC-002, API-008
- `ISSUE-005` 秒挂供应商字段映射；关联：SRC-002, API-004
- `ISSUE-008` 真实下载成功信号；关联：SRC-003, SC-001, US-001, SRC-005, API-009
- `ISSUE-022` 精准删除实际接口并发与幂等缺口；关联：SC-001, US-001, API-006
- `ISSUE-024` 解除信号缺失，原型仅暂停；关联：US-003, SC-003, API-008
- `ISSUE-026` DCC逐行回执和每次结果主子关联可靠交付工程落实；关联：API-010, AC-037, AC-038
- `ISSUE-027` 53推送完整协议与准确关联待核；关联：API-002, API-003, FUNC-017, AC-039, AC-040, AC-042
- `ISSUE-029` 供应商呼叫时段与禁呼规则覆盖及任务状态行为待核；关联：API-002, FUNC-005, SC-001, SRC-080
- `ISSUE-031` 应用CRUD及密钥生命周期的生产工程契约仍未联调；关联：SRC-087, SRC-088, API-001, SC-005
