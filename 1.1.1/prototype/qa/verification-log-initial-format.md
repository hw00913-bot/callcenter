# 验证记录

> 记录每步验证和全局验证结果。失败项必须能追溯到具体步骤或需求。

## 最新状态

- Overall: Pending
- Last verified: 未验证

## 机器可读记录格式

每条记录必须包含以下键值行。`Step` 必须使用 `step-01`、`step-02` 等稳定 ID，且与 `memory/execution-steps.md` 对应。

```text
Date:
Step: step-01
Scope: step | global | diagram
Local URL / File:
Tool:
Command / Check:
Passed:
Failed:
Evidence:
Result: pass | fail
Consecutive Failures:
Next Action:
```

全局验证记录使用：

```text
Date:
Step: global
Scope: global
Local URL / File:
Tool:
Command / Check:
Passed:
Failed:
Evidence:
Result: pass | fail
Consecutive Failures:
Next Action:
```

图集记录使用 `Step: business-flow` 或 `sequence-flow`、`Scope: diagram`，并增加 `Visible Elements: 实际可见节点或参与者数`（至少 2）。Evidence 必须来自浏览器实际渲染与截图，不能统计隐藏语义标记。先追加单步结果，再追加图集及全局结果；门禁取最新记录，脚本写入 verification-epoch 分隔符后，历史结果不再作为本轮通过证据。

## History

- 待补充

## Fresh verification assertion
- Step: step-01
- Scope: step
- Result: pass
- Date: 2026-10-15T17:15:10
- Local URL / File: http://127.0.0.1:8771/index.html ; qa/model-check.cjs
- Tool: prototype-verifier / cua_repl + node
- Command / Check: node --check js/common.js js/app.js js/nav.js ; node qa/model-check.cjs ; UI打开工具并切换坐席
- Passed: 48 model assertions; host loaded; role navigation and demo drawer; console errors 0
- Failed: None
- Evidence: 独立模型断言48项通过；IAB tab5实际观察宿主、演示工具与角色导航，mock数据仅内存，无业务网络调用。
- Consecutive Failures: 0
- Content Digest: f94ee2b0830da8e7642e1cd323a16b387934c592d7d5d387a35d266758053239
- Verification Epoch: initial

## Fresh verification assertion
- Step: step-02
- Scope: step
- Result: pass
- Date: 2026-10-15T17:30:18
- Local URL / File: http://127.0.0.1:8771/index.html ; js/pages/configuration.js
- Tool: prototype-verifier / cua_repl + node
- Command / Check: node --check js/pages/configuration.js ; IAB 1440宽实际新增/改名/启停/授权/字段来源/独立必填操作
- Passed: 新增仅4业务项，保存第三条；d-store改名保留2引用；启停结果保留引用；撤销t1只剩t2并重新授权；关联series2取消保存后再勾回；追加其他意向车系；独立必填及双页签；console0
- Failed: None
- Evidence: IAB browser3 tab3真实操作，截图已观察；只读能力无技术输入项；原计划到店文本未变；查询选择值使用模拟模型。
- Consecutive Failures: 0
- Content Digest: 5480180f0de6b558489ba474861bd1bd6a9cd819cccb4f2d7bf1cb61d1c9e637
- Verification Epoch: initial

## Fresh verification assertion
- Step: step-03
- Scope: step
- Result: pass
- Date: 2026-10-15T17:40:26
- Local URL / File: http://127.0.0.1:8771/index.html ; js/pages/followup.js ; qa/model-check.cjs
- Tool: prototype-verifier / cua_repl + node
- Command / Check: node --check followup.js ; node qa/model-check.cjs ; IAB 1440/1920主流程与异常实际操作
- Passed: 52模型断言；双NEV并集3店、混合并集3店、搜索不误判、部分失败0新选按钮、全清空待确认、匹配后人工恢复、来源停用和恢复、失败保文本重试成功、两处0编辑控件快照、上游改名历史保持、原值确认带入、准确未接空值通过/呼入未接拦截、旧错误清除、console0
- Failed: None
- Evidence: IAB browser3 tab3多次实际截图与DOM观察；1920 body=scrollWidth1920，1440布局已观察。独立模型复核另验证换来源、在途撤权/恢复和保存中撤权/身份变化。仅本地模拟，不证明生产能力。
- Consecutive Failures: 0
- Content Digest: ba322153ecf95477582aca9cd44a04a3d9d189bda7f558e5e046faaa53ed162b
- Verification Epoch: initial

## Fresh verification assertion
- Step: step-04
- Scope: step
- Result: pass
- Date: 2026-10-15T17:42:21
- Local URL / File: http://127.0.0.1:8771/index.html#delivery=business-flow
- Tool: prototype-verifier / cua_repl + Python byte comparison
- Command / Check: 16 SVG strip-semantic-attrs equality; IAB in-frame FLOW005/SC008 actual/fullscreen
- Passed: 16 SVG geometry and text preserved; 8 primary PlantUML; 2 visible lanes; 5 FLOW actions plus SC branches; host frame visible; no duplicate nav
- Failed: None
- Evidence: 实际截图观察SC008超管/平台泳道、提交取消和保存成功失败；仅复用草稿，G3 pending。
- Consecutive Failures: 0
- Content Digest: f97c9884e3fa600c7ad847437948bc5b0fea7c88b479296fdc136c97ff737266
- Verification Epoch: initial

## Fresh verification assertion
- Step: step-05
- Scope: step
- Result: pass
- Date: 2026-10-15T17:44:07
- Local URL / File: http://127.0.0.1:8771/index.html#delivery=sequence-flow
- Tool: prototype-verifier / cua_repl + Python XML/byte checks
- Command / Check: 6 SVG XML parse and exact geometry/text comparison; IAB actual/zoom/fullscreen
- Passed: 6 SVG valid and preserved; 19 participants/108 messages; visible SEQ010 3 participants and13 messages; no duplicate nav
- Failed: None
- Evidence: 首次SVG属性注入错误已按真实截图定位并修复，复验截图非空、所有13消息可见；真实接口仍missing/partial。
- Consecutive Failures: 0
- Content Digest: 97f47a5788e2e809157a0dc1e4776d4d640e9495e3c69e5330acb9689e126235
- Verification Epoch: initial

## Fresh verification assertion
- Step: step-06
- Scope: step
- Result: pass
- Date: 2026-10-15T17:45:31
- Local URL / File: http://127.0.0.1:8771/index.html#delivery=related-systems
- Tool: prototype-verifier / cua_repl + local file checks
- Command / Check: IAB系统页和版本页同宿主切换；本地launcher与README路径检查
- Passed: 2 system boundaries visible; no invented endpoint; open issues retained; version unconnected explicit; console0
- Failed: None
- Evidence: 实际截图观察双系统卡片、职责表、真实契约待核验；版本状态页不调用缺失版本清单。
- Consecutive Failures: 0
- Content Digest: baa818dc9874be01840e7837fee31fdf904087960a6738d234e79a5ea325f95d
- Verification Epoch: initial
