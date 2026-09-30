# 执行步骤

> 每个步骤都必须小到可以独立实现、验证和修复。不要把不确定需求写成已确认任务。

## Step 01: 初始化项目骨架

### Goal

建立静态原型项目的基础结构和运行入口。

### Files

- `index.html`
- `assets/css/global.css`
- `assets/css/app.css`
- `js/app.js`
- `js/common.js`
- `js/nav.js`
- `mock/data.js`
- `config/nav.json`

### Expected Change

- verify-only

### Inputs

- `docs/decisions.md`
- `memory/project-startup-plan.md`
- `memory/project.md`
- `memory/business-rules.md`
- `memory/source-materials.md`
- `memory/field-map.md`

### Work

- 确认入口页面、基础样式、导航配置和 Mock 数据已接入。
- 保持无构建步骤的静态前端结构。

### Acceptance

- `index.html` 可以通过本地 HTTP 服务打开。
- 页面无阻塞级控制台错误。
- 本地资源路径有效。
- 导航容器存在。

### Verification

- 运行本地 HTTP 服务并打开入口页。
- 检查控制台错误和本地资源加载状态。

### Verification Skill

- Verification Skill: `prototype-verifier`
- Browser Evidence Tool: `playwright-cli when needed`

### Annotation Impact（仅本轮明确请求标注时保留）

- affected-pages: index
- annotation-required: no
- annotation-targets: none

### Dependencies

- None

### Failure Handling

- 如果资源路径失败，修复 HTML 中的 `src` / `href`。
- 如果脚本语法失败，先修复 JS 语法再继续。
