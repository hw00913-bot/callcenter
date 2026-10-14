# 更新号码池接口

- 官方来源：[AliCti 更新号码池接口](https://wiki.alicti.cn/html/wiki/API/号码池管理/更新号码池接口.html)
- 核对日期：2026-09-23；本文件为紧凑摘录，源页面为准。
- 请求：`GET/POST https://api-{region}.alicti.cn/interface/v10/hybridGroup/update`；`region` 为 1、2、5 或 6。
- 鉴权：`validateType` 为 1 时传 `departmentId`，为 2 时传 `enterpriseId`；同时传秒级 `timestamp`（30 分钟有效）及 32 位小写 MD5 `sign`。本项目按租户绑定的 `enterpriseId` 使用类型 2。
- 业务入参：必填 `groupId`、`name`（同一企业不可重复）、`numbers`（逗号分隔的号码清单）、`isDefault`（0 否、1 是）；`comment` 可选，省略时不更新。接口没有 `type` 更新字段。
- 数量和清空：`numbers` 传空字符串表示池中没有号码；不能超过企业配置的最大限制，未配置时默认少于 500 条。
- 默认池：已设为默认的号码池只允许修改号码和备注，不能改名或取消默认状态。
- 响应：`result` 为 0 成功、-1 失败，`description` 为说明；错误示例附 `errorCode`。

编辑时先从列表回填完整号码清单，再提交目标全量号码，避免遗漏号码被清空；成功后重查列表核对。
