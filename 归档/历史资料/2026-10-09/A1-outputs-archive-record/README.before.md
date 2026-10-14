# AliCti 云联络中心原型与说明文档

历史文档对齐记录 `2026-09-21-ui-field-alignment-1` 已与当时客户档案、两类外呼任务及四类通话详情的修改对齐。现行功能、字段及待确认状态以原型内正式说明和统一版本记录为准；本次目录说明更新不代表重新发布或推送。

- [原型入口](prototype/index.html) · [运行与维护说明](prototype/README.md)
- [功能说明](prototype/docs/functional-spec.html) · [规则附表](prototype/docs/interaction.html)
- [字段对齐](prototype/docs/field-alignment.html) · [待确认事项](prototype/docs/remaining-confirmations.html)
- [业务流程图](prototype/flowcharts/business-process.html) · [时序图](prototype/flowcharts/sequence-interaction.html) · [系统蓝图](prototype/related-systems/index.html)
- [按需阅读指引](prototype/docs/development.html) · [版本与变更](prototype/docs/change-log.html)
- [项目版本入口](prototype/version-history.html) · [版本展示清单](版本清单.json) · [本地启动器](启动原型.command)

原型、正式说明和接口证据共同维护。开发按任务选读对应章节和代码；字段、规则及待确认数量以正式文档当前统计为准。正式开发交付物按版本预留出口，只有需求确认、业务与运营评审及开发共同批准齐备后才由05生成有效开发包，不能将目录或演示文件当作已批准交付。

## 工作目录与版本目录

| 目录 | 职责 |
|---|---|
| [analysis/](analysis/) | 保留旧需求分析工作区、冻结交接输入及供应商原始证据，也包含字段核验等维护资料；不是当前业务版本的自动批准依据。 |
| [memory/](memory/) | 保存项目级统一事实台账 `project-versions.json` 及历史启动草案。根 `版本清单.json` 是台账的展示投影，不是第二套批准记录。 |
| [prototype/](prototype/) | 当前可演示、继续维护和评审的原型工作区，包含现行页面、文档、导入输入与运行工具。 |
| [需求/](需求/) | 按业务版本保存增量评审底稿和经04确认导出的需求快照；当前1.1.0仍为draft，不虚构确认快照。 |
| [原型版本/](原型版本/) | 保存按版本组织的只读历史查看或确认快照；不能替代现用 `prototype/` 工作区，也不补造历史批准。 |
| [开发交付物/](开发交付物/) | 按版本保存05正式开发出口；目前仅有来源与阻断说明，没有有效开发包。 |
| [blueprint/](blueprint/) | 较早蓝图生成源及说明，保留为待核准归档候选。现用维护源见 [prototype/blueprint/README.md](prototype/blueprint/README.md)；不要误跑旧生成器覆盖现行蓝图。 |
| [outputs/](outputs/) | 历史导出附件，保留为待核准归档候选；本次不迁移或删除。 |

工作区、确认快照和版本展示清单各有职责：一个版本可包含多项变更，确认快照不得覆盖，不为每项变更复制整项目。供应商原始快照不改写，用户澄清与项目采用规则在现行说明中单独记录。本地演示与验证不代表供应商真实接入已经完成。

## 本地启动

从本项目根目录双击 `启动原型.command`，或在项目根运行 `python3 -m http.server 8773 --bind 127.0.0.1`，访问 `http://127.0.0.1:8773/prototype/index.html`。服务根必须覆盖项目根，才能同时读取版本展示清单和历史查看页；仅从 `prototype/` 目录启动服务无法提供这些同级资源。关闭启动窗口即可停止本地服务。
