# 04→02→05 项目版本、变更和快照契约

工具软件版本与业务项目版本分开。`project_id` 稳定；`version_id` 在明确开版时创建；一个版本包含多条 `change_id`。`label` 是用户选择的业务版本名称。变更不自动升级版本。每版独立工作区；已有工作区不能 attach 到另一项目或版本。新版本在新目录初始化，原版本保持可追溯。

三阶段使用同一个台账 JSON（放在各阶段工作区以外）。04/05 的 `scripts/project_versions.py` 与02的 `orchestrator/scripts/project_versions.py` 的 schema 和实现保持一致；原型项目运行副本在 `tools/project_versions.py`。台账记录各版 changes、处理 events、当前阶段 receipts、被撤销的 snapshot_history。阶段快照绑定项目、版本、内部 revision、内容摘要、上游 snapshot_id 和工作区身份。内部 revision 是防旧证据复用的计数，不是业务版本号。锁与原子替换防止并发写丢失。

02 `memory/change-log.md` 历史正文保留。台账是新增结构化记录的唯一源，02 Markdown 中明确标记的段落是同一台账的派生视图，不单独编辑或维护。04/05 变更也可显示在这份视图。导入历史只保留来源定位/摘要及备份，不虚构旧 change_id、版本归属或审批。审批撤销后归档，不能复用；旧交付包保留但执行检查拒绝。

## 新项目和现有项目接入

所有命令示例需要替换路径/ID和版本名称；不要把示例审批人当实际批准者。下面维护命令以04/05的 scripts/project_versions.py 为例；在02维护根改用 orchestrator/scripts/project_versions.py，在生成原型根改用 tools/project_versions.py。

```sh
python3 scripts/project_versions.py init /shared/project-ledger.json --project-id PROJECT-001 --version-id VERSION-001 --label 1.0.0
python3 scripts/project_versions.py attach /workspace/04 --registry /shared/project-ledger.json --version-id VERSION-001
# 上一条仅预览；核对后应用。已有 02 日志会备份，原正文不删。
python3 scripts/project_versions.py attach /workspace/04 --registry /shared/project-ledger.json --version-id VERSION-001 --apply
```

attach 不迁移历史批准、不改业务事实、不自动完成阶段。旧原型验证日志缺当前内容摘要/轮次时不能继续完成，需要实际重新验证。旧验收表须保留原列并追加第八列 `Step IDs`，每行关联真实执行任务，如 `step-01`；不删除困难项绕过覆盖。旧 05 工作区正式导出被阻断：在新目录选择顺序模式的 reviewed 包或明确授权的独立 `--standalone` 模式，复制可编辑方案后实际复核，不沿用旧审批。没有批量迁移命令。

```sh
python3 scripts/project_versions.py new-version /shared/project-ledger.json --version-id VERSION-002 --label 2.0.0 --from-version VERSION-001
```

新版本不复制旧批准。使用独立阶段目录，按新版来源完成分析/方案/开发规划。实际业务开版时点与批准人员由用户决定。

## 同版变更和回流

```sh
python3 scripts/project_versions.py change /shared/project-ledger.json --version-id VERSION-001 --change-id CHANGE-001 --stage analysis --summary '明确业务变更' --source '已确认记录路径' --affects FUNC-001 AC-001
python3 scripts/project_versions.py resolve-change /shared/project-ledger.json --version-id VERSION-001 --change-id CHANGE-001 --status implemented --note '实际处理依据'
```

`proposed` 不改变有效范围；接受/实施变更撤销其阶段和所有下游批准。被拒绝记录留作历史，新提案用新 ID。重复同内容记录幂等，冲突 ID 拒绝。内容变化即使尚未登记也会在后续检查中被摘要漂移阻断。变更状态只描述处理，不等于业务批准或代码运行通过。

04 已接入台账的 `loop.py invalidate ... --change-id CHANGE-* --reason ...` 同时记录全链变更、撤销下游并按旧机制退回本地阶段。02 `tools/loop_run.py reopen PROJECT --stage S6|S7 --reason ... --change-id CHANGE-*` 清空下游完成标记，开启新验证轮次，保留旧日志。登记 ID 使用同一原命令重试，不要先用不同字段重复创建同 ID。`complete --force` 只复检，不先修改状态；需要修复时用 reopen。

## 04 冻结、02 评审和正式交接

04 先走原有阶段和 G1/G2/G3，再对当前真实内容执行 bind/approve；baseline 记录需具名实际证据。package_delivery 会校验这一批准，把项目版本、变更与快照引用纳入冻结包。原型导入会验证当前上游状态、自动关联相同台账，错误版本拒绝；同包重复导入幂等。

```sh
python3 scripts/project_versions.py bind /workspace/04 --stage analysis
python3 scripts/project_versions.py approve /workspace/04 --stage analysis --role baseline --reviewer ACTUAL_PERSON --evidence /reviews/g3.md --note '实际基线确认结论'
```

02 准备明确的 `product-input.json`，沿用 05 manual 产品字段契约（features、acceptance及相关 pages/rules/flows/fields等），内容须反映实际产品方案并保留上游业务 ID，不直接把原始需求冒充已审方案。它必须在原型重新验证前写好。交接时检查原型 final 门禁和已导入上游版本；G3、原型技术验证和业务/运营批准分别保留。

验证 owner 实际检查后，用新记录 JSON 调用 `tools/loop_run.py record-verification PROJECT --record-json RECORD.json`，字段沿用 Step/Scope/Result/Local URL / File/Tool/Command / Check/Passed/Failed/Evidence/Consecutive Failures，diagram 加 Visible Elements。记录当前内容摘要和轮次，只是新的验证声明；不能给旧日志批量补摘要，不能把记录命令称为实际浏览器测试。实现、执行计划或基线变化要求所有受影响验证重新执行。当前采用保守的整实现摘要，可能要求重验更多步骤，不会漏撤销。

```sh
python3 tools/project_versions.py bind /workspace/02 --stage product
python3 tools/project_versions.py approve /workspace/02 --stage product --role business --reviewer ACTUAL_PERSON --evidence /reviews/business.md --note '实际业务确认'
python3 tools/project_versions.py approve /workspace/02 --stage product --role operations --reviewer ACTUAL_PERSON --evidence /reviews/operations.md --note '实际运营确认'
python3 tools/project_versions.py export-product /workspace/02 --out /handoffs/product-snapshot-001
```

审批证据至少 60 字，保存 SHA256、具名责任人、结论与当前快照。代码检查完整关系、摘要和失效，不认证人的真实身份；宿主必须获得真实确认，不能用生成内容替人批准。

## 05 开发规划和执行前检查

默认 init 顺序模式只接 `project-handoff.json` 的 reviewed 包，验证上游 active snapshot 与业务/运营两项批准。analysis/current/manual 仍可只读分析；独立工作需明确 `init --standalone`，该模式不能替代用户指定的 04→02→05 顺序评审。

```sh
python3 scripts/planning.py init /workspace/05 --source /handoffs/product-snapshot-001 --repo /repo
# 补产品规格、工程七类、精确任务文件/依赖/验收映射，并完成 validate/review --stage development
python3 scripts/project_versions.py bind /workspace/05 --stage development
python3 scripts/project_versions.py approve /workspace/05 --stage development --role joint --reviewer ACTUAL_REVIEWER --evidence /reviews/joint.md --note '实际联合复核'
python3 scripts/planning.py export /workspace/05 --stage development --out /handoffs/devpack-001
python3 scripts/project_versions.py check-package /handoffs/devpack-001
```

开发 AI 在业务实现开始前、每个任务前运行 check-package。它检查包内文件摘要、共享台账当前版本与审批、源工作区内容和证据；离线或无权限时失败关闭。交付不是代码实现或测试已运行。任意外部程序不调用门禁无法被本地规划工具强制停止；代码提供可执行守卫，宿主执行流程必须调用。台账/工作区/审批证据需一起可访问，不能只把 Markdown 包拷走就宣称有效。

同版新产品快照经重审后：`planning.py refresh WORKSPACE --source NEW_REVIEWED_PACKAGE` 显式更新来源，保留计划、撤销开发评审；补差异后重新 validate/review/bind/approve/export。不同项目/版本拒绝原地替换。

## 维护与安装

产品原型阶段的唯一维护主源为物理 `02_LOOP_PROTOTYPE`；个人技能及项目内工具包由完整主源生成。04 原同名路径保留完整兼容归档，不重命名或删除，不作为第二套默认维护入口。安装器先核验冻结需求导入、统一版本协议、根版本说明和回归，缺任何集成必需资产均拒绝覆盖；更新已有安装时保留完整回滚备份，清理另行批准。旧 Git 历史、未提交内容、兼容模板与本地配置按逐文件归位清单保全；不整树重置。业务项目按明确授权刷新，不批量改产物。保持正式 PlantUML/原生图集方案。


## 标准交付目录与公开版本入口

业务项目根与三个阶段的可编辑工作区分开。一个项目仅有一份共享台账；`版本清单.json`、原型版本页和 Markdown 变更段均为派生视图，不能用展示提示替代现场门禁。公开清单只含项目、版本、变更摘要、阶段状态、快照 ID 和项目内相对链接，不含本机路径、台账位置或审批证据正文。

正式确认后使用标准模式，不覆盖同一确认快照：

```sh
# 04：仍先完成原分析门禁、bind 和真实 baseline 批准。
python3 scripts/package_delivery.py /workspace/04 --project-root /business/project
# 02：仍需当前分析基线及业务、运营两个角色的真实批准。
python3 tools/project_versions.py export-product /workspace/02 --project-root /business/project --return-working-href prototype/index.html
# 05：仍需当前 reviewed 来源、产品与工程检查、联合复核及 development/joint 批准。
python3 scripts/planning.py export /workspace/05 --stage development --project-root /business/project
```

分别落在 `需求/<label>/snapshots/<snapshot_id>/`、`原型版本/<label>/snapshots/<snapshot_id>/`、`开发交付物/<label>/snapshots/<snapshot_id>/`。同一个版本可以有多条变更、多个确认快照；改变范围后先撤销下游再重新确认，新快照使用新的 ID，旧快照和文件摘要继续保留。不会为每条变更复制整个业务项目。需求包、原型视图及开发交付物按确认范围建立快照。

02 标准交付同时包含产品输入、交接契约和可查看的静态原型。历史视图隔离工作版存储并限制业务操作，返回工作版的链接必须在同项目内；文件设置为只读并有完整内容摘要。只读适配器不等于不可篡改的系统权限，篡改仍由哈希核验标为失效。文档指定的旧发布归档只能登记为 `historical_reference`，不得补造历史批准。

05 `confirmation-basis.json` 明确保存本项目/版本/revision、分析/产品/开发三个确认快照 ID 和覆盖的 change_id。开工前仍重新核验 `execution-authority.json` 与实际来源；公开版本页显示批准不授予开工权限。真实材料的未决业务规则保留为阻断，不由演示参数代替。

首次 `export-index` 建立投影后，受控台账操作会更新公开清单。手工修改源码、证据或快照后，重新运行 `export-index` 获取最新展示；所有正式交付和执行检查现场复核。旧 `--out` 接口保留给兼容调用和讨论草稿，草稿不进入上述正式确认目录。

```sh
python3 scripts/project_versions.py layout /workspace/04 --stage analysis --project-root /business/project
python3 scripts/project_versions.py export-index /shared/project-ledger.json --project-root /business/project --current-version-id VERSION-001
```

标准02产品包还在交接契约中登记 artifact_snapshot_id、view_entrypoint 和完整manifest；05核验实际消费副本的全部文件。JS、静态资源、原HTML留存或交接信息改变后，接包、规划及开工检查拒绝复用。旧两JSON --out包保持兼容，但不声明拥有已核验原型视图。前一最小增量阶段未迁移源码；当前维护入口以物理02主源及本次逐文件归位清单为准，04完整兼容归档保留。标准交付与源码归位不提升真实业务批准、阶段状态。

历史导航只从快照内嵌的安全布尔标志决定是否展示可选说明文档，不读取工作版或已排除的 config/workflow.json；原工作流配置与审批资料不复制进历史视图。

## 静态入口与版本展示数据

访客从业务项目根 `index.html` 进入，本地 file 双击、HTTP 根与 GitHub Pages 项目目录均使用相对资源路径，无需启动维护工具。维护人员用既有 `export-index` 从唯一台账同次生成根 `版本清单.js` 和兼容的 `版本清单.json`；两者共享同一公开对象、导出时间和内容摘要，不人工分别维护。浏览器只读取经典脚本投影，展示导出时间及公开状态；数据缺失或不合法时显示不可用，不从另一个源或持久化记录回退。静态展示不读取内部台账，也不授予批准或执行权限，发布后需核对页面导出时间与发布批次一致。

`版本清单.js` 是展示派生物，精确排除于工作内容摘要及未来历史快照；未来快照 HTML 仅剔除专属 `data-project-version-index` 脚本标签，保留原型业务脚本和配置。既有冻结快照不改写。公共投影不得包含本机路径、台账位置、审批证据或任意外部/越界链接。必要运行工具及模板按逐文件清单同步；04 内旧02兼容归档继续保留。

可选说明文档导航在维护时按当前 `requestedDeliverables.interactionDoc` 生成静态布尔值，访客不 fetch 内部 workflow 配置。计划批准或后续可选交付请求改变该值后，使用已有脚手架 `--sync-delivery-pages` 维护入口刷新导航再验证；导航检查会核对静态值与当前请求一致，缺失或过时值不能通过。此同步不替代原阶段门禁、业务批准或真实交付验证。

发布源顶层包含 `index.html` 与空 `.nojekyll`，使用经过逐文件核查的静态依赖白名单，不整树上传内部台账、输入、工具、回归证据或备份。旧公开候选文档中指向内部资料的链接应在独立公开投影中处理并再验收；本轮根入口及仓库前缀的本地浏览器验证不等于已部署 GitHub Pages。
