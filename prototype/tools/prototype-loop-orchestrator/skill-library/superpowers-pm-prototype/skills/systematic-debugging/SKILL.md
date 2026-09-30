---
name: systematic-debugging
description: 面向 PM 原型 loop 的失败定位技能。Use when prototype generation, page verification, interaction checks, annotation prompt preparation, or manual annotation writeback fail.
---

# 系统化失败定位

使用本技能在原型 loop 失败时先定位根因，再决定回流阶段。

## Loop 上下文

本技能是 `prototype-loop-orchestrator` 的一部分，由总控在指定阶段或支持场景中调用。它只处理本技能职责内的分析、验证或失败定位，不自行推进阶段，不写 `config/workflow.json`，不写 `memory/stage-log.md`，不声明阶段通过。

## 适用阶段

- S7 实现与单步验证循环
- S8 全局验证
- S9 按需补充与收尾

## 失败分类

先把失败归类：

- 需求不清
- 任务拆分错误
- 项目结构缺失
- 页面实现错误
- mock 数据缺失
- 资源路径错误
- 交互状态错误
- 响应式布局问题
- 标注运行时问题
- 验证环境问题

## 定位流程

1. 复现失败。
2. 记录失败现象和触发步骤。
3. 找到最小失败范围。
4. 判断失败分类。
5. 决定回流阶段。
6. 修复后重新运行对应验证。

## 回流规则

- 需求不清：回到 S1 或 S2。
- 任务拆分错误：回到 S6。
- 项目结构缺失：回到 S4 或 S5。
- 页面实现错误：回到 S7。
- mock 数据缺失：回到 S7，必要时回到 S6。
- 标注运行时或手动回写问题：回到 S4、S5 或 S9。
- 验证环境问题：修复环境后重新验证。

## 输出

失败定位结果写入：

- `memory/verification-log.md`

如果影响后续计划，也更新：

- `memory/open-items.md`
- `memory/change-log.md`

## 禁止事项

- 不在未复现失败前猜测修复。
- 不用大范围重写掩盖根因。
- 不把需求问题当成实现问题。
- 不把验证环境问题当成产品问题。
