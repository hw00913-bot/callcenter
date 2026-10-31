# v2.0.0 平台认证租户权限接口核验 — loop 消费上下文

> 结论：当前上下文已对齐 `raw/iccai-platform-service-api@v1（字段文档，非生产保证）`；JSON 是唯一结构化业务载体，本 Markdown 由其确定性生成。 内容范围仅含当前结论，不含历史或迁移规则。
> generated-at: `2026-10-16T10:12:10+08:00`
> context-hash: `edb423aa61b060a55aec915cf03a251cbb4c640dddee32d4ca2919bd1191f5d1`
> markdown-hash: `7cbfac551fdf4e33a0ed6967f7a0675ce93a079830754cded20e85efd8d6a453`

## 输入页快照

`wiki_pages` 与下表 `input_pages` 完全一致；任一页面哈希变化后，本输出即视为陈旧。

| 页面 id | 路径 | updated | SHA-256 |
|---|---|---|---|
| lib-平台通用服务公司与充值计费接口 | wiki/概念对齐/平台通用服务公司与充值计费接口.md | 2026-10-16 | 8dbf7901d6050ed2bd6bca06c416072db27ae3bd5481752ba8b3f39259035066 |
| lib-平台通用服务接口总览 | wiki/概念对齐/平台通用服务接口总览.md | 2026-10-16 | 77017ebbe6e31f6809e4c4cdd49e1e4147ff625ceb4b053edd41b5d44b83e985 |
| lib-平台通用服务角色菜单与数据权限接口 | wiki/概念对齐/平台通用服务角色菜单与数据权限接口.md | 2026-10-16 | 2626bae34810aebc6477c05731f547bc05a0b2ec57a2d2fac46268fce0ab9cc9 |
| lib-平台通用服务认证与用户接口 | wiki/概念对齐/平台通用服务认证与用户接口.md | 2026-10-16 | f6a01515fc69e2bd18ec894ecbccd78e948a0950dbf32aea78351dfc9c7d5469 |

## 平台与权威版本

| 项目 | 值 |
|---|---|
| 平台 | iccai-platform-service |
| 当前权威来源 | raw/iccai-platform-service-api@v1（字段文档，非生产保证） |
| 文档载体 | 原样Markdown，文档1.0／证据v1 |
| 覆盖范围 | 32模块196接口；本次仅认证用户、角色菜单数据权限、公司与用量相关4当前页 |

## 字段表

### company_scope

来源页面：`lib-平台通用服务公司与充值计费接口`

| 字段 | 内容 |
|---|---|
| companyType | 平台为字典字符串（如zyd1/tenant/superAdminGroup），tob部分配置为数字总部/门店；需映射，不能直接通用 |
| scope | 公司写入说明单选1AI/2云呼叫，读取说明逗号多值；同租户双模块保存/开通能力待核 |
| status | 人员停用不能直接分配为全局/本租户停用；会话和在途影响未定义 |

### document_scope

来源页面：`lib-平台通用服务接口总览`

| 字段 | 内容 |
|---|---|
| modules | 32 |
| operations | 196 |
| selected_operations | {"method":"PUT","path":"/base/user/status","source_line":4356,"title":"启用禁用人员管理表","wiki_ref":"lib-平台通用服务认证与用户接口"}, {"method":"POST","path":"/base/user/token","source_line":4694,"title":"生成token","wiki_ref":"lib-平台通用服务认证与用户接口"}, {"method":"POST","path":"/base/user/create","source_line":4982,"title":"创建人员管理表","wiki_ref":"lib-平台通用服务认证与用户接口"}, {"method":"POST","path":"/base/user/companyToUserPage","source_line":5079,"title":"账号管理-租户账户关联查询","wiki_ref":"lib-平台通用服务认证与用户接口"}, {"method":"GET","path":"/base/user/info/{account}","source_line":5348,"title":"后台-个人中心-信息","wiki_ref":"lib-平台通用服务认证与用户接口"}, {"method":"GET","path":"/base/user/detail/{id}","source_line":5427,"title":"根据id查询人员管理表","wiki_ref":"lib-平台通用服务认证与用户接口"}, {"method":"PUT","path":"/base/user/business/status","source_line":5694,"title":"启用禁用管理员设置表","wiki_ref":"lib-平台通用服务认证与用户接口"}, {"method":"PUT","path":"/base/role/update","source_line":7371,"title":"编辑权限组表","wiki_ref":"lib-平台通用服务角色菜单与数据权限接口"}, {"method":"POST","path":"/base/role/create","source_line":7549,"title":"创建权限组表","wiki_ref":"lib-平台通用服务角色菜单与数据权限接口"}, {"method":"GET","path":"/base/role/user/company-role-list","source_line":7636,"title":"人员设置-权限列表","wiki_ref":"lib-平台通用服务角色菜单与数据权限接口"}, {"method":"POST","path":"/base/role-group/create","source_line":8212,"title":"创建角色组管理表","wiki_ref":"lib-平台通用服务角色菜单与数据权限接口"}, {"method":"GET","path":"/base/role-group/list","source_line":8285,"title":"查询角色组管理表列表","wiki_ref":"lib-平台通用服务角色菜单与数据权限接口"}, {"method":"GET","path":"/base/role-group/detail/{id}","source_line":8381,"title":"根据id查询角色组管理表","wiki_ref":"lib-平台通用服务角色菜单与数据权限接口"}, {"method":"POST","path":"/base/menu/create","source_line":8759,"title":"创建菜单管理表","wiki_ref":"lib-平台通用服务角色菜单与数据权限接口"}, {"method":"PUT","path":"/base/company/update","source_line":10629,"title":"编辑公司管理表","wiki_ref":"lib-平台通用服务公司与充值计费接口"}, {"method":"POST","path":"/base/company/create","source_line":11331,"title":"创建公司管理表","wiki_ref":"lib-平台通用服务公司与充值计费接口"}, {"method":"GET","path":"/base/company/usage/balance","source_line":11436,"title":"用量余额","wiki_ref":"lib-平台通用服务公司与充值计费接口"}, {"method":"GET","path":"/base/company/get-my-company","source_line":11784,"title":"获取我的所属公司","wiki_ref":"lib-平台通用服务公司与充值计费接口"}, {"method":"GET","path":"/base/company/detail/{id}","source_line":11895,"title":"根据id查询公司管理表","wiki_ref":"lib-平台通用服务公司与充值计费接口"}, {"method":"POST","path":"/base/user-role-rel/confirm","source_line":13611,"title":"用户-角色确认授权-角色取消授权","wiki_ref":"lib-平台通用服务角色菜单与数据权限接口"}, {"method":"GET","path":"/base/user-role-rel/list","source_line":13789,"title":"查询用户角色关联表列表","wiki_ref":"lib-平台通用服务角色菜单与数据权限接口"}, {"method":"POST","path":"/base/user-data-scope/create","source_line":14140,"title":"创建用户数据权限表","wiki_ref":"lib-平台通用服务角色菜单与数据权限接口"}, {"method":"GET","path":"/base/user-data-scope/list","source_line":14281,"title":"查询用户数据权限表列表","wiki_ref":"lib-平台通用服务角色菜单与数据权限接口"}, {"method":"POST","path":"/base/role-data-scope/create","source_line":15375,"title":"编辑角色数据权限表","wiki_ref":"lib-平台通用服务角色菜单与数据权限接口"}, {"method":"GET","path":"/base/role-data-scope/list","source_line":15451,"title":"查询角色数据权限表列表","wiki_ref":"lib-平台通用服务角色菜单与数据权限接口"}, {"method":"POST","path":"/base/auth/phone-login","source_line":15795,"title":"手机号码验证码登录","wiki_ref":"lib-平台通用服务认证与用户接口"}, {"method":"POST","path":"/base/auth/logout-callback","source_line":15879,"title":"logoutSuccessCallback","wiki_ref":"lib-平台通用服务认证与用户接口"}, {"method":"GET","path":"/base/auth/resources","source_line":15983,"title":"getAccessResources","wiki_ref":"lib-平台通用服务认证与用户接口"}, {"method":"GET","path":"/base/auth/resource-and-role","source_line":16044,"title":"getAccessResourceAndRole","wiki_ref":"lib-平台通用服务认证与用户接口"}, {"method":"GET","path":"/base/auth/login","source_line":16107,"title":"loginByAccountName","wiki_ref":"lib-平台通用服务认证与用户接口"}, {"method":"GET","path":"/base/auth/loginByCode","source_line":16180,"title":"loginByCode","wiki_ref":"lib-平台通用服务认证与用户接口"}, {"method":"GET","path":"/base/user-menu/mine-menu","source_line":16515,"title":"登录用户菜单","wiki_ref":"lib-平台通用服务角色菜单与数据权限接口"}, {"method":"GET","path":"/base/user-menu/list","source_line":16633,"title":"查询用户菜单权限表列表","wiki_ref":"lib-平台通用服务角色菜单与数据权限接口"}, {"method":"GET","path":"/base/tenant-billing/my-usage-task-detail/{companyId}","source_line":16779,"title":"查询当前租户使用明细-按日任务消耗明细","wiki_ref":"lib-平台通用服务公司与充值计费接口"}, {"method":"GET","path":"/base/tenant-billing/my-usage-daily/{companyId}","source_line":16857,"title":"查询当前租户使用明细-按日消耗汇总","wiki_ref":"lib-平台通用服务公司与充值计费接口"}, {"method":"GET","path":"/base/tenant-billing/my-recharge-records","source_line":16930,"title":"查询当前租户内部充值记录","wiki_ref":"lib-平台通用服务公司与充值计费接口"}, {"method":"GET","path":"/base/tenant-billing/my-package/{companyId}","source_line":17063,"title":"查询当前租户套餐信息","wiki_ref":"lib-平台通用服务公司与充值计费接口"}, {"method":"GET","path":"/base/role-menu/list","source_line":17420,"title":"查询角色菜单权限表列表","wiki_ref":"lib-平台通用服务角色菜单与数据权限接口"} |

### identity_boundaries

来源页面：`lib-平台通用服务认证与用户接口`

| 字段 | 内容 |
|---|---|
| identifiers | accountId为string与人员id为int64之间关系未说明 |
| login_by_name | 只收accountName返回AccountInfoObject，不能当完整账号密码登录 |
| logout | 仅有退出成功callback定义，未给主动统一退出协议 |
| tokens | 手机/code登录返回token/refreshToken，TTL、续期、传递和撤销未定义 |

## 业务规则

| 来源页面 | 规则 | 范围 |
|---|---|---|
| lib-平台通用服务接口总览 | 新分组增补接口证据，不改写已确认业务、角色及AI原用量账务规则；HOST与tob不同，不能继承Basic认证结论。 | current |

## 建议写入 `memory/source-materials.md`

暂无推荐来源材料。

## 建议写入 `memory/field-map.md`

暂无推荐字段映射。

## 命中页面状态

| wiki_ref | status | updated | coverage |
|---|---|---|---|
| lib-平台通用服务公司与充值计费接口 | partial | 2026-10-16 | 当前分组字段定义；操作说明、统一鉴权与部署语义待核 |
| lib-平台通用服务接口总览 | partial | 2026-10-16 | 当前分组字段定义；操作说明、统一鉴权与部署语义待核 |
| lib-平台通用服务角色菜单与数据权限接口 | partial | 2026-10-16 | 当前分组字段定义；操作说明、统一鉴权与部署语义待核 |
| lib-平台通用服务认证与用户接口 | partial | 2026-10-16 | 当前分组字段定义；操作说明、统一鉴权与部署语义待核 |

本文件是由同名 JSON 确定性生成的可重建派生物，不得作为知识来源。
