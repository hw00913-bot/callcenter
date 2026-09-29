# 接口与供应商原始资料

这里保存既有接口快照和供应商回复原件；本次从开发包移出，内容未改写。

- `alicti/`：按 API- / DOC- 编号查找官方网页、正文与表格。文档地址、来源时间与字段采用口径见[字段级对齐清单](../docs/field-alignment.json)。
- `supplier-feedback/`：供应商回复截图、文字原件。适用范围与已确认规则见[供应商澄清记录](../docs/supplier-clarifications.json)。
- `user-task-settings/`：用户提供的 AliCti 后台任务设置界面截图，仅用于界面入口核对；接口值域和默认值以 `alicti/API-311.txt` 与 `alicti/DOC-338.txt` 为准。
- AliCti 号码池管理四接口紧凑摘录：[获取](alicti/hybrid-group-list.md)、[新增](alicti/hybrid-group-create.md)、[删除](alicti/hybrid-group-delete.md)、[更新](alicti/hybrid-group-update.md)。四页来自官方“号码池管理”目录，端点为 `/interface/v10/hybridGroup/{list,create,delete,update}`；本地摘录记录 2026-09-23 核对事实，实施以链接中的官方原文为准。

先从[开发阅读指引](../docs/development.html)选择本次任务对应的功能和字段，再按来源编号查看原件，无需一次加载整个目录。

这些材料保留采集时事实；本地演示及检查不代表已经完成真实接口联调。

- `alicti/API-404.*`：AliCti 更新任务接口原始快照，端点 `/interface/v10/task/update`。仅证明接口列出的可选字段和原taskId更新形态；差量省略语义、运行中生效时点及本项目真实写入结果待联调。
