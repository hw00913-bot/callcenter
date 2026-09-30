---
name: verification-before-completion
description: 面向 PM 原型 loop 的完成前验证门禁。Use before claiming a prototype step, global verification, annotation, or handoff is complete.
---

# 完成前验证

使用本技能防止在没有证据的情况下声称原型已完成、已修复或可交付。

## Loop 上下文

本技能是 `prototype-loop-orchestrator` 的一部分，由总控在指定阶段或支持场景中调用。它只处理本技能职责内的分析、验证或失败定位，不自行推进阶段，不写 `config/workflow.json`，不写 `memory/stage-log.md`，不声明阶段通过。

## 适用阶段

- S7 实现与单步验证循环
- S8 全局验证

## 原则

没有新鲜验证证据，就不能声称完成。

在 S7 中，本技能通常由 `prototype-builder` 或其调用的 `prototype-verifier` 用于每个实现步骤的完成前门禁；在 S8 中用于全局验证和交付前门禁。

## 单步完成前必须确认

- 当前步骤要求的文件已修改。
- `memory/change-log.md` 已更新。
- 步骤验收标准已检查。
- `memory/verification-log.md` 已记录当前步骤 ID、验证动作、证据和结果。
- 必要页面能打开。
- 没有阻塞性 console error。
- 当前步骤相关交互可用。

## 全局交付前必须确认

- 本地 HTTP 预览可打开。
- 入口页面加载成功。
- 本地资源没有 404。
- 核心导航可用。
- 核心用户路径可走通。
- 桌面端布局可接受；业务页面的移动端验证按已批准设备要求执行。业务流程／场景泳道和时序图仅按桌面宽屏可读性验收，不要求移动端适配，仍须核对标签完整、缩放、宽图滚动与全屏。
- 只有 `requestedDeliverables.annotations=true` 时，标注运行时兼容且已请求标注产物通过检查。
- 只有 `requestedDeliverables.interactionDoc=true` 时，功能说明文档通过检查。
- `memory/verification-log.md` 已更新。

## 输出

验证结果应写入：

- `memory/verification-log.md`

必要时也更新：

- `memory/change-log.md`
- `memory/open-items.md`

## 失败处理

验证失败时，不能进入下一阶段。

按失败原因回流：

- 需求不清：回到 S1 或 S2。
- 任务拆分错误：回到 S6。
- 项目结构缺失：回到 S4 或 S5。
- 页面实现错误：回到 S7。
- 全局验证失败：回到 S7 或 S6。

## 禁止事项

- 不用“应该可以”替代验证。
- 不用旧验证结果证明当前状态。
- 不在全局验证失败时生成最终标注。
- 不在**已明确请求**的标注或说明文档缺失时进入交付；未请求的可选产物不得阻塞完成。
