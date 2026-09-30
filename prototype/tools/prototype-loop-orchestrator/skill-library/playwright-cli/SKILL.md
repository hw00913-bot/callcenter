---
name: playwright-cli
description: PM 原型 loop 的浏览器证据采集工具。Use only as a support tool for prototype-verifier to inspect generated static prototype pages and collect browser evidence; do not judge stages, write verification logs, install dependencies, or create Playwright project files inside the deliverable prototype folder.
allowed-tools: Bash(playwright-cli:*)
---

# 浏览器证据采集工具

本技能是工具型 support skill，不拥有任何 S 阶段。它只负责用 `playwright-cli` 打开页面、执行浏览器动作并返回证据；验证判断、失败归因、日志写入和阶段推进都不属于本技能。

## 调用边界

- 默认由 `prototype-verifier` 调用。
- `prototype-builder` 完成实现步骤后，应调用 `prototype-verifier` 的 step 验证模式；由 `prototype-verifier` 决定是否使用本工具采集浏览器证据。
- S8 全局验证由 `prototype-verifier` 负责，本工具只提供页面证据。
- 冷门命令或参数不确定时，直接运行 `playwright-cli --help` 或对应子命令的 `--help`；不要预加载通用测试、录屏、登录态或代码生成手册。

## 适用场景

涉及以下任一内容时，应采集浏览器证据：

- 页面是否能通过本地 HTTP 服务打开。
- DOM 节点、文本、属性或 `data-anno` 锚点是否存在。
- 点击、输入、筛选、tab 切换、弹窗、抽屉、跨页面跳转等交互是否符合预期。
- 控制台是否存在阻塞性错误。
- 本地资源是否出现阻塞性 404。
- 桌面端或移动端 viewport 下布局是否明显异常。
- 只有本轮明确请求标注时，检查标注运行时是否影响页面交互或渲染。

## 常用命令

```bash
playwright-cli open http://127.0.0.1:8080
playwright-cli goto http://127.0.0.1:8080/pages/example.html
playwright-cli snapshot
playwright-cli click e3
playwright-cli fill e5 "keyword"
playwright-cli eval "document.title"
playwright-cli eval "el => el.textContent" e5
playwright-cli eval "el => el.getAttribute('data-anno')" e5
playwright-cli console
playwright-cli requests
playwright-cli resize 390 844
playwright-cli screenshot --filename=/tmp/prototype-check.png
playwright-cli close
```

## 证据输出格式

每次调用后，把证据交给调用方，不直接写 `memory/verification-log.md`。推荐摘要格式：

```text
Browser Evidence
- url:
- viewport:
- action:
- observed:
- console:
- network:
- screenshot:
- result_hint:
```

`result_hint` 只能描述观察倾向，例如 `looks-ok`、`needs-review`、`blocked-by-console-error`。不得写成 `result: pass` 或 `gate_result: pass`。

## 禁止事项

- 不判断阶段是否通过。
- 不写 `memory/verification-log.md`。
- 不写 `memory/circuit-state.json`。
- 不写 `config/workflow.json`。
- 不写 `memory/stage-log.md`。
- 不调用 `tools/loop_run.py complete`。
- 不在业务原型目录运行 `npm install`、`npm init`、`npx playwright install`。
- 不在交付目录创建 `node_modules/`、`package.json`、`package-lock.json`、`playwright-report/`、`test-results/`。
- 不把截图、trace、video 或临时脚本留在交付目录；需要保存时使用 `/tmp` 或其它临时目录。

## 与验证 owner 的关系

```text
prototype-verifier = 决定验什么、如何判定、如何记录
playwright-cli     = 打开浏览器并采集证据
loop_preflight.py  = 阶段门禁裁判
```

本工具返回证据后，由 `prototype-verifier` 写入结构化验证记录并决定 pass/fail。
