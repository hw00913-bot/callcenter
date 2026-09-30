# 项目结构摘要

> S5 阶段读取真实文件结构后填写本文件。S6 拆分以此为可编辑边界，不得把总控工具包（tools/prototype-loop-orchestrator）纳入业务实现范围。

## 可编辑业务文件清单

| 路径 | 类型 | 责任 | 可编辑原因 |
|---|---|---|---|
| 待补充 | page/component/mock/config/style | 待补充 | 待补充 |

## 页面与入口

- 入口页面：待补充。
- 页面路由/导航：待补充。
- 页面实现文件：待补充。

## 公共组件与复用边界

- 待补充。

## 数据与配置来源

- Mock 数据位置：待补充。
- 配置文件位置：待补充。

## 可选交付与流程图位置

- 源码锚点位置：待补充。
- 标注运行时位置：`annotations/`（只有明确请求标注时纳入实现与验证）。
- 说明文档位置：`docs/interaction.html`（只有明确请求时存在）。
- 交互说明位置：`docs/interaction.html`。

## 交付图页面

- 业务流程图：`flowcharts/business-process.html`。
- 时序交互图：`flowcharts/sequence-interaction.html`。
- 关联系统展示：`related-systems/index.html`，内容可为空但页面壳必须保留。

## 不纳入实现/交付的目录

- `tools/prototype-loop-orchestrator/`：项目内总控工具包，不作为业务实现、验证对账、标注覆盖或交付统计范围。
