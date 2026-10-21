# 项目结构读取（S5）

当前为空脚手架加产品草稿快照，运行入口 index.html，无构建步骤。S0-S4已顺序完成，S2只绑定用户SRC-155模拟试做计划，不是G3基线。

## 文件清单

- `.clauderules`
- `.gitignore`
- `CLAUDE.md`
- `annotations/annotation-runtime.js`
- `annotations/annotation.css`
- `annotations/annotations.js`
- `assets/css/app.css`
- `assets/css/delivery-diagrams.css`
- `assets/css/global.css`
- `assets/css/version-history.css`
- `config/nav.json`
- `config/project.json`
- `config/requirement-analysis.json`
- `config/workflow.json`
- `docs/decisions.md`
- `flowcharts/business-process.html`
- `flowcharts/page-structure.html`
- `flowcharts/sequence-interaction.html`
- `index.html`
- `inputs/product-draft/interfaces/interface-index.json`
- `inputs/product-draft/memory/business-rules.json`
- `inputs/product-draft/memory/feature-list.json`
- `inputs/product-draft/memory/normalized-user-stories.json`
- `inputs/product-draft/memory/project-facts.json`
- `inputs/product-draft/planning/page-index.json`
- `inputs/product-draft/runtime/open-items.json`
- `inputs/product-draft/scenarios/SC-008.json`
- `inputs/product-draft/scenarios/SC-009.json`
- `inputs/product-draft/scenarios/SC-010.json`
- `inputs/product-draft/scenarios/SC-011.json`
- `inputs/product-draft/scenarios/SC-012.json`
- `inputs/product-draft/scenarios/SC-013.json`
- `inputs/product-draft/scenarios/scenario-index.json`
- `inputs/product-draft/sequences/SEQ-010.json`
- `inputs/product-draft/sequences/SEQ-011.json`
- `inputs/product-draft/sequences/SEQ-012.json`
- `inputs/product-draft/sequences/SEQ-013.json`
- `inputs/product-draft/sequences/SEQ-014.json`
- `inputs/product-draft/sequences/SEQ-015.json`
- `inputs/product-draft/sequences/sequence-index.json`
- `inputs/product-draft/source-record.json`
- `js/app.js`
- `js/common.js`
- `js/components/.gitkeep`
- `js/delivery-nav.js`
- `js/nav.js`
- `js/pages/.gitkeep`
- `js/version-nav.js`
- `memory/acceptance-map.md`
- `memory/business-rules.md`
- `memory/change-log.md`
- `memory/circuit-state.json`
- `memory/execution-steps.md`
- `memory/feature-list.md`
- `memory/field-map.md`
- `memory/loop-status.md`
- `memory/open-items.md`
- `memory/project-startup-plan.md`
- `memory/project-structure.md`
- `memory/project.md`
- `memory/source-materials.md`
- `memory/stage-log.md`
- `memory/task-plan.md`
- `memory/ui-contract.md`
- `memory/verification-log.md`
- `mock/data.js`
- `related-systems/index.html`
- `version-history.html`

## 编辑边界与拆分

index.html、assets/css/app.css、js/common.js、js/app.js、js/nav.js、mock/data.js 承载宿主与本地状态。配置页新增 js/pages/configuration.js 及专用CSS；填写和两处只读展示新增 js/pages/followup.js 及专用CSS。复用上游图页仅注入来源与导航，不重算几何。related-systems/index.html 说明未接入的责任边界。js/delivery-nav.js沿用四视图宿主机制，不能加未请求说明/标注。

inputs/product-draft 为只读草稿快照；memory启动计划与CLAUDE已绑定，不能回改。tools/prototype-loop-orchestrator及tools/*.py仅运行时工具不计业务可编辑文件。现有v1.1.0与原prototype在本目录外，全部禁止修改。

## 可编辑业务文件清单

上文实际文件和下述已声明新增页面为编辑范围；tools、inputs快照及外部版本禁止修改。

## 页面与入口

index.html为入口，config/nav.json为业务导航，js/pages为页面模块。

## 公共组件与复用边界

Trial公共宿主在js/common.js，Mock公共状态在mock/data.js，各页不重复实现业务规则。

## 数据与配置来源

mock/data.js仅虚构演示，inputs/product-draft为只读来源，config为本地运行。

## 可选交付与流程图位置

annotations基础设施不启用；docs/interaction.html未请求不生成；两图集在flowcharts下，关联系统在related-systems/index.html。

## 不纳入实现/交付的目录

tools/prototype-loop-orchestrator是工具包，现有prototype及版本目录均不在本目录内。


## 2026-10-16 当前结构更新

原精简界面已备份于.loop-history/minimal-shell-before-v110，当前运行文件基于真实v1.1.0复制，清单及源摘要为qa/v110-base-manifest.json。原js/app/common/nav、assets、mock完整保留；新增business-data字典服务与页面、business-interface-field组件，修改原分类/CustomerBusiness/CustomerFollowup扩展接口取数。旧configuration.js/followup.js和对应CSS不再是运行文件。数据沿原本地机制，Storage前缀独立。当前文件范围及操作映射按memory/v110-reuse-contract.md、execution-steps.md和docs/decisions.md，旧结构记录保留作溯源。


## CHANGE-11112 新增模拟边界文件

- mock/dcc-business-data.js：独立虚构目录、分页raw形状与异常fixture。
- js/components/dcc-business-adapter.js：全页聚合、精确fixture授权关系与当前上下文守卫。
- qa/check-dcc-business-adapter.cjs、qa/check-dcc-business-runtime.cjs、qa/check-dcc-store-picker.cjs：分页/namespace/epoch/UI边界回归。

index按fixture→adapter→BusinessData装载；不新增业务菜单或真实接口入口。BIF只传demoProfile展示元数据，原保存与只读档案组件不改。


## CHANGE11127｜当前删除范围与第三Tab（S6，待实施）

当前来源：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.1/分析工作区/runtime/product-draft-delete-and-dictionary-tab-20261020/source-record.json`；SHA-256 `8d77f3f83fe6f98dc5a627caa370ac428305fb00e9089468e08dc1f747c2ab7c`，40件已核对。SRC172～176为用户直接范围指令，沿SRC155独立模拟；不是G2/G3或开发冻结。当前11FUNC／46AC／9SC／9SEQ／3FLOW／5PAGE／10ACTION，原只读inputs、startup、CLAUDE里的8项为初始历史输入，不改写、不当当前范围。

当前实际可编辑落点为既有CB/BD/BC/字典页、nav/app/index及专用CSS；新增纯读`js/components/business-configuration-usage.js`集中多源引用检查（只接删除准入），避免各模型复制扫描或查询引入副作用。字典页现有controller通过embedded方式复用，不新建同义页面；BC第三Tab不是新sidebar。QA用真实模型/DOM及明确白名单存储，测试适配不能修改产品保护。其余原型版本、冻结inputs/startup/CLAUDE、tools运行包只读。
