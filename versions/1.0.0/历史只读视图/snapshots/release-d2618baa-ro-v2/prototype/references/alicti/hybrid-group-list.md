# 获取号码池列表接口

- 官方来源：[AliCti 获取号码池列表接口](https://wiki.alicti.cn/html/wiki/API/号码池管理/获取号码池列表接口.html)
- 核对日期：2026-09-23；本文件为紧凑摘录，源页面为准。
- 请求：`GET/POST https://api-{region}.alicti.cn/interface/v10/hybridGroup/list`；`region` 为 1、2、5 或 6。
- 鉴权：`validateType` 为 1 时传 `departmentId`，为 2 时传 `enterpriseId`；同时传秒级 `timestamp`（30 分钟有效）及 32 位小写 MD5 `sign`。本项目按租户绑定的 `enterpriseId` 使用类型 2。
- 业务入参：无；按已鉴权的账号返回号码池列表，无分页字段。
- 响应：`result` 为 0 成功、-1 失败，`description` 为说明；成功时 `data` 为数组，元素含 `id`、`name`、`comment`、`createTime`、`numbers`、`type`、`isDefault`。`type` 为 0 号码群组、1 中继群组；`isDefault` 为 0/1。示例中数值可能以字符串返回，`isDefault` 也可能为 `null`。

此接口返回的池名可供任务 `clidPoolList[].name` 选择；任务实际选号方式、池类型适用范围和运行中变更生效时点仍须联调核验。
