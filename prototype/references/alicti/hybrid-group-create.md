# 新增号码池接口

- 官方来源：[AliCti 新增号码池接口](https://wiki.alicti.cn/html/wiki/API/号码池管理/新增号码池接口.html)
- 核对日期：2026-09-23；本文件为紧凑摘录，源页面为准。
- 请求：`GET/POST https://api-{region}.alicti.cn/interface/v10/hybridGroup/create`；`region` 为 1、2、5 或 6。
- 鉴权：`validateType` 为 1 时传 `departmentId`，为 2 时传 `enterpriseId`；同时传秒级 `timestamp`（30 分钟有效）及 32 位小写 MD5 `sign`。本项目按租户绑定的 `enterpriseId` 使用类型 2。
- 业务入参：必填 `name`（同一企业不可重复）、`isDefault`（0 否、1 是）、`type`（0 号码群组、1 中继群组）；`comment` 可选。
- 响应：`result` 为 0 成功、-1 失败，`description` 为说明；错误示例附 `errorCode`。成功示例没有返回新池 ID。

官方说明明确：新增后须再调用更新接口加入号码。写入结果应重新查询列表核对，不从新增回执推造 `groupId`。
