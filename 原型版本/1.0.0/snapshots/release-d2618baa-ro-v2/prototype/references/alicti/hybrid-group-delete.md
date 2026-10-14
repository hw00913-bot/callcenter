# 删除号码池接口

- 官方来源：[AliCti 删除号码池接口](https://wiki.alicti.cn/html/wiki/API/号码池管理/删除号码池接口.html)
- 核对日期：2026-09-23；本文件为紧凑摘录，源页面为准。
- 请求：`GET/POST https://api-{region}.alicti.cn/interface/v10/hybridGroup/delete`；`region` 为 1、2、5 或 6。
- 鉴权：`validateType` 为 1 时传 `departmentId`，为 2 时传 `enterpriseId`；同时传秒级 `timestamp`（30 分钟有效）及 32 位小写 MD5 `sign`。本项目按租户绑定的 `enterpriseId` 使用类型 2。
- 业务入参：必填 `groupId`，对应列表中的号码池 `id`。
- 响应：`result` 为 0 成功、-1 失败，`description` 为说明；错误示例附 `errorCode`。官方失败示例说明：默认号码池配置使用中不能删除。

删除前须按当前账号列表核对 `groupId`，并检查本租户任务引用；删除成功后重新查询列表。原型的删除仅模拟供应商回执，不实际调用此接口。
