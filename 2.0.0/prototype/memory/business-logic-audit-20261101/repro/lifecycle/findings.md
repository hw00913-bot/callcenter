# Step50 独立生命周期审计

审计范围：当前实际 cloud.bundle.js 模型、当前执行桥，隔离 Map 数据；未改运行源、原测试、开发包或浏览器数据。所有数据为自有合成验收数据。

## 已复现问题

1. **高：未知导入回执未锁定本批新业务。** CATEGORY/TASK 两入口 `unknown-committed` 均已创建业务，原 `commit('import', null, ...)` 请求未封生成业务 recordIds。`pending(s,id)` 无法关联，未核对原导入请求即可 assign/start，新建执行段。证据 `repro.cjs`、`repro-results.json` 前两项。原业务规则要求未知同次先核对，不能继续新办理。最小修：服务端根据本批真实生成的记录关联请求，不信客户端伪造 tag；核对前所有新办理/批次动作阻断，核对后恢复。

2. **高：旧周期事实冲突与新起呼准入不一致。** 旧 DIRECT 周期实际通话、归档、完成后进入新周期，旧已封段相反终态回执产生 factConflict；当前工作状态明确 WAITING_REVIEW，但 permissions.start 仍 true，start 成功。证据 `repro-extra.cjs`、`repro-late-conflict.json`。根因：workState 看所有历史冲突，noRunning/fourStartReady 仅当前周期。应明确旧已封冲突隔离，或一致阻断待核后继；不能同时待核和派新呼叫。

3. **高：兼容旧任务快照跨租户泄露。** 原 Step44/46 历史 TASK DIRECT 无新 entrySource，允许合法 enableFlow 后转交门店；新通用 aiImportParameterSnapshots 过滤已做，但旧 taskImportParameterSnapshot 及 originalImportSnapshot.taskImportParameterSnapshot 保持完整，接收方读到源总部供应商专属额度42.5等值。证据 `repro-legacy-private.cjs`、`repro-legacy-private.json`。最小修仅查询投影按 taskImportSource.tenantId 过滤旧快照；源存储/本方历史保持，不改历史事实。

4. **中：预外呼分类绑定可从后续执行路径绕过。** actual built 原桥的 native PRED task 关联类 C，业务 ctx.categoryId=UNRELATED，choices 仍给该任务，resolve.ok=true。证据 `repro-pred-bridge.cjs/json`。根因 predictiveTasks resource 丢分类，ordinary choices/resolve 不匹配分类，只有 import 入口锁类。若任务分类约束执行承接（符合配置/导入字段语义），应拒明确不同类或别名冲突；保旧已受理段、历史读取兼容。已交 native bridge 审计 owner 避免重复。

## 待产品口径确认的候选（不混入确定缺陷）

新 TASK 来源业务可 assign 到其它任务，completeDirect 后 resume 为其它呼叫方式，源任务的统一名单仍保该业务。现 UI 说“固定关联当前任务”，但旧 DIRECT 特性允许续跟换方式。`repro-results.json` 后两项证明行为；由 root 结合当前规则判断任务源标识是不可变来源还是整个后继执行目标锁，未自行强加新限制。

## 其它核对

读取当前停止/废弃/历史结算实现及既有实际构建测试，未发现本轮新的受控废弃/本人填写/旧回执来源篡改根因。四个确认问题各有独立最小复现，均无基础设施错误。未测试真实供应商/CTI/生产接口；不声明整体无缺陷。
