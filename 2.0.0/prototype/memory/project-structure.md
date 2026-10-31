# 项目结构摘要

S5按新建目录实际读取；旧原型未复用，当前只有新脚手架与本轮S1–S3资料。

## 可编辑业务文件清单

| 路径 | 类型 | 责任 | 可编辑原因 |

|---|---|---|---|

|.clauderules|script|script|本轮静态原型或必需阅读视图|

|.gitignore|script|script|本轮静态原型或必需阅读视图|

|annotations/annotation-runtime.js|script|script|控制/可选基础设施；不作为业务实现改写|

|annotations/annotation.css|script|script|控制/可选基础设施；不作为业务实现改写|

|annotations/annotations.js|script|script|控制/可选基础设施；不作为业务实现改写|

|assets/css/app.css|asset|asset|本轮静态原型或必需阅读视图|

|assets/css/delivery-diagrams.css|asset|asset|本轮静态原型或必需阅读视图|

|assets/css/global.css|asset|asset|本轮静态原型或必需阅读视图|

|assets/css/version-history.css|asset|asset|本轮静态原型或必需阅读视图|

|config/nav.json|configuration|configuration|本轮静态原型或必需阅读视图|

|config/project.json|configuration|configuration|本轮静态原型或必需阅读视图|

|config/requirement-analysis.json|configuration|configuration|控制/可选基础设施；不作为业务实现改写|

|config/workflow.json|configuration|configuration|控制/可选基础设施；不作为业务实现改写|

|docs/decisions.md|script|script|本轮静态原型或必需阅读视图|

|flowcharts/business-process.html|page|page|本轮静态原型或必需阅读视图|

|flowcharts/sequence-interaction.html|page|page|本轮静态原型或必需阅读视图|

|index.html|entry|entry|本轮静态原型或必需阅读视图|

|js/app.js|script|script|本轮静态原型或必需阅读视图|

|js/common.js|script|script|本轮静态原型或必需阅读视图|

|js/components/.gitkeep|script|script|本轮静态原型或必需阅读视图|

|js/delivery-nav.js|script|script|本轮静态原型或必需阅读视图|

|js/nav.js|script|script|本轮静态原型或必需阅读视图|

|js/pages/.gitkeep|script|script|本轮静态原型或必需阅读视图|

|js/version-nav.js|script|script|本轮静态原型或必需阅读视图|

|mock/data.js|mock|mock|本轮静态原型或必需阅读视图|

|related-systems/index.html|page|page|本轮静态原型或必需阅读视图|

|version-history.html|page|page|本轮静态原型或必需阅读视图|

## 页面与入口

index.html为唯一主入口；config/nav.json是开发期导航事实，js/nav.js承载运行期普通本地脚本数据，不运行fetch JSON。专业源页面通过明确本地载体复用。

## 公共组件与复用边界

js/components/用于统一身份/范围、持久化、模块载体及保护；js/pages/用于本方公共差异页面。js/modules/可新增本地打包模块，理由是原专业脚本/样式需离线且隔离运行，不能依赖跨file文档桥或localhost。scripts/build-modules.py可新增为开发期构建助手，不是用户运行前提，不属于永久Loop工具。

## 数据与配置来源

mock/data.js维护新轮构造身份、租户、角色和本方公共数据；原专业源数据按原模型复用并使用新命名空间。inputs/design-source-lock.json引用保留需求目录，当前上游事实不复制或改写；SRC-010/011/012参考代码只读。

## 可选交付与流程图位置

annotations为脚手架基础设施，本轮未请求；不启用原旧标注。docs/interaction.html未请求。业务图flowcharts/business-process.html、时序flowcharts/sequence-interaction.html从当前分析自包含HTML保几何复用；related-systems/index.html呈现已确认依赖。

## 不纳入实现/交付的目录

tools/prototype-loop-orchestrator/及tools/loop_*.py为本地控制工具，不作业务代码修改或页面数量统计。上级需求、其它版本、原参考、任何底层会话目录不纳入修改或扫描。

## 实际结构记录

```
.clauderules
.gitignore
CLAUDE.md
annotations/annotation-runtime.js
annotations/annotation.css
annotations/annotations.js
assets/css/app.css
assets/css/delivery-diagrams.css
assets/css/global.css
assets/css/version-history.css
config/nav.json
config/project.json
config/requirement-analysis.json
config/workflow.json
docs/decisions.md
flowcharts/business-process.html
flowcharts/sequence-interaction.html
index.html
inputs/design-source-lock.json
inputs/rebuild-authorization.json
js/app.js
js/common.js
js/components/.gitkeep
js/delivery-nav.js
js/nav.js
js/pages/.gitkeep
js/version-nav.js
memory/acceptance-map.md
memory/business-rules.md
memory/change-log.md
memory/circuit-state.json
memory/execution-steps.md
memory/feature-list.md
memory/field-map.md
memory/loop-status.md
memory/open-items.md
memory/project-startup-plan.md
memory/project-structure.md
memory/project.md
memory/source-materials.md
memory/stage-log.md
memory/task-plan.md
memory/verification-log.md
mock/data.js
related-systems/index.html
version-history.html
```
