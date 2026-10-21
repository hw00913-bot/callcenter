# 接口来源与供应商原始资料

> 发布查看说明：下文维护命令属于原本地环境，依赖维护脚本与外部 Wiki；本次未附带可携带维护环境，不能据此视为在发布副本中可执行。查看范围见[仓库说明](../../README.md)。

2026-10-13 起，官方接口信息统一通过 [LLM Wiki 接口索引](index.html)按需读取。本目录只携带轻量来源映射，不再携带整套官方原文；原 API- / DOC- 编号保留。文档地址、来源版本与文件校验信息见 [interface-sources.json](interface-sources.json)，项目采用口径仍见[字段级对齐清单](../docs/field-alignment.json)。

- 官方接口：先从字段清单取得来源编号，再在 [LLM Wiki 接口索引](index.html)定位。新规则须经过需求分析核验与冻结，原型仅消费冻结事实；来源覆盖或文件校验通过不表示所有历史条款语义等价。
- `supplier-feedback/`：保留供应商回复截图、文字原件。适用范围与已确认规则见[供应商澄清记录](../docs/supplier-clarifications.json)，不因接口读取入口切换而改写。
- `user-task-settings/`：保留用户提供的 AliCti 后台任务设置界面截图，仅用于界面入口核对；请求字段、值域和默认值按 [API-311](index.html#API-311)与 [DOC-338](index.html#DOC-338)读取 Wiki 原文核对，历史采用值仍按冻结依据追溯。
- AliCti 号码池管理四接口：[获取](index.html#WIKI-HYBRIDGROUP-LIST)、[新增](index.html#WIKI-HYBRIDGROUP-CREATE)、[删除](index.html#WIKI-HYBRIDGROUP-DELETE)、[更新](index.html#WIKI-HYBRIDGROUP-UPDATE)。端点为 `/interface/v10/hybridGroup/{list,create,delete,update}`；`WIKI-HYBRIDGROUP-*`是补充检索 ID，不是新增正式 API 编号或实现范围。2026-09-23 的紧凑摘录已随旧原文归档，仅用于历史追溯。
- 更新任务接口 [API-404](index.html#API-404)：端点 `/interface/v10/task/update`。仅证明接口列出的可选字段和原taskId更新形态；差量省略语义、运行中生效时点及本项目真实写入结果仍待联调。

## 按需读取与校验

在 `prototype/` 根目录运行：

```sh
python3 documentation/interface_sources.py read API-311
python3 documentation/interface_sources.py read WIKI-HYBRIDGROUP-LIST
python3 documentation/interface_sources.py verify
PYTHONDONTWRITEBYTECODE=1 python3 documentation/verify_documentation.py --interfaces-only
```

`--interfaces-only` 专项验证现行 Wiki 来源和历史归档原件，不代表旧业务文档全量检查通过，也不刷新业务批准。

读取器只读连接外部 LLM Wiki，按编号定位 `raw/tianrun-api-official@v1` 的文档，并检查 active 版本、inventory 与文件哈希。`v1` 是知识库快照版本，不是供应商 API 版本。默认知识库位置为 `[本机资料路径已省略]`；其他机器可用 `LLM_WIKI_ROOT` 或读取器的 `--wiki-root` 参数指向同一知识库根目录。Wiki 不可用或校验不通过时应停止采用该来源，不以原型演示值补造接口事实。

## 历史原件与恢复

旧 `alicti/` 原文、正文和摘录保存在[接口来源切换归档 ZIP](../../%E5%BD%92%E6%A1%A3/%E5%8E%86%E5%8F%B2%E8%B5%84%E6%96%99/2026-10-13-%E6%8E%A5%E5%8F%A3%E6%9D%A5%E6%BA%90%E5%88%87%E6%8D%A2.zip)，保留原路径与文件内容。历史冻结包、批准、来源时间及核验记录继续以当时证据为准。可用 `python3 documentation/interface_sources.py legacy references/alicti/API-304.txt` 只读提取归档成员并校验大小与哈希。需要恢复时先将 ZIP 解压到独立临时目录，按归档内原相对路径定位文件；恢复原件不自动切换现行读取来源，也不覆盖历史记录。

先从[开发阅读指引](../docs/development.html)选择任务对应的功能和字段，再按来源编号读取，不需一次加载整套接口资料。本地演示及检查不代表真实接口联调完成。
