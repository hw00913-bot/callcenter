# 平台通用服务原始接口定义定向摘录

采集：2026-10-16T10:12:10+08:00；active raw/iccai-platform-service-api@v1；原文：/Users/huhaowen/Documents/00_automatic_prototype/01_WIKI_LLM/raw/external/iccai-platform-service-api/v1/iccai-platform-service.md；SHA256：ca43014e2e3c06dcaea9fbd6b2d7624c04eaf35870db257f813084ae3c0f9829。

仅保留接口声明及请求/响应表，带原始行号，不复制或执行示例。此服务与tob服务HOST不同；不继承原文档入口认证观察，不证明SSO或生产行为。

## L4356 · PUT /base/user/status
原文L4356–L4462；Wiki `lib-平台通用服务认证与用户接口`。

```text
L4359: **接口地址**:`/base/user/status`
L4362: **请求方式**:`PUT`
L4365: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L4368: **响应数据类型**:`*/*`
L4371: **接口描述**:
L4408: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L4409: | -------- | -------- | ----- | -------- | -------- | ------ |
L4410: |baseUserUpdateParam|人员管理表|body|true|BaseUserUpdateParam|BaseUserUpdateParam|
L4411: |&emsp;&emsp;id|主键id||true|integer(int64)||
L4412: |&emsp;&emsp;userAccount|登录账号||false|string||
L4413: |&emsp;&emsp;userName|员工姓名||false|string||
L4414: |&emsp;&emsp;phone|手机号||false|string||
L4415: |&emsp;&emsp;email|电子邮箱||false|string||
L4416: |&emsp;&emsp;companyId|所属公司ID||false|integer(int64)||
L4417: |&emsp;&emsp;remark|备注||false|string||
L4418: |&emsp;&emsp;accountType|账号类型:来源字典（accountType：coreType(核心管理员)、（基础用户）baseType）||false|string||
L4419: |&emsp;&emsp;flagSystemState|系统状态:0-停用,1-可用||false|integer(int32)||
L4420: |&emsp;&emsp;systemId|系统ID||false|string||
L4421: |&emsp;&emsp;roleGroupIds|所在角色组集合数组 用途：用户管理创建||false|array|integer(int64)|
L4422: |&emsp;&emsp;userDataAuthority|数据权限:来源字典（userDataAuthority）||false|string||
L4423: |&emsp;&emsp;flagRole|是否使用roleIds字段：true-是 false-否||false|boolean||
L4424: |&emsp;&emsp;roleIds|所在角色集合数组 用途：业务员管理创建||false|array|integer(int64)|
L4425: |&emsp;&emsp;flagRoleIds|是否启用roleIds字段 1-是 0-否||false|integer(int32)||
L4426: |&emsp;&emsp;flagRoleGroupIds|是否启用roleGroupIds字段 1-是 0-否||false|integer(int32)||
L4427: |&emsp;&emsp;weightType|菜单权重:来源字典（weightType）systemType、platformType、businessType、defaultType||false|string||
L4428: |&emsp;&emsp;flagMenusIds|是否启用menusIds字段 1-是 0-否||false|integer(int32)||
L4429: |&emsp;&emsp;menusIds|菜单权限数组||false|array|integer(int64)|
L4430: |&emsp;&emsp;parentMenusIds|父级菜单权限数组 用途：取消勾选的时候使用||false|array|integer(int64)|
L4431: |&emsp;&emsp;dealerId|关联ID经销商id，用户类型为经销商时才有值||false|integer(int64)||
L4432: |&emsp;&emsp;dealerCode|经销商编码||false|string||
L4438: | 状态码 | 说明 | schema |
L4439: | -------- | -------- | ----- | 
L4440: |200|OK|OptResult|
L4446: | 参数名称 | 参数说明 | 类型 | schema |
L4447: | -------- | -------- | ----- |----- | 
L4448: |result|返回码|string||
L4449: |msg|错误信息|string||
L4450: |success||boolean||
```

## L4694 · POST /base/user/token
原文L4694–L4770；Wiki `lib-平台通用服务认证与用户接口`。

```text
L4697: **接口地址**:`/base/user/token`
L4700: **请求方式**:`POST`
L4703: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L4706: **响应数据类型**:`*/*`
L4709: **接口描述**:
L4731: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L4732: | -------- | -------- | ----- | -------- | -------- | ------ |
L4733: |accountInfo|AccountInfo|body|true|AccountInfo|AccountInfo|
L4734: |&emsp;&emsp;accountId|||false|string||
L4735: |&emsp;&emsp;accountName|||false|string||
L4736: |&emsp;&emsp;password|||false|string||
L4737: |&emsp;&emsp;nickname|||false|string||
L4738: |&emsp;&emsp;accountStatus|||false|string||
L4739: |&emsp;&emsp;authorities|||false|array|string|
L4740: |&emsp;&emsp;extObj|||false|object||
L4746: | 状态码 | 说明 | schema |
L4747: | -------- | -------- | ----- | 
L4748: |200|OK|OptResult|
L4754: | 参数名称 | 参数说明 | 类型 | schema |
L4755: | -------- | -------- | ----- |----- | 
L4756: |result|返回码|string||
L4757: |msg|错误信息|string||
L4758: |success||boolean||
```

## L4982 · POST /base/user/create
原文L4982–L5078；Wiki `lib-平台通用服务认证与用户接口`。

```text
L4985: **接口地址**:`/base/user/create`
L4988: **请求方式**:`POST`
L4991: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L4994: **响应数据类型**:`*/*`
L4997: **接口描述**:
L5029: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L5030: | -------- | -------- | ----- | -------- | -------- | ------ |
L5031: |baseUserSaveParam|人员管理表|body|true|BaseUserSaveParam|BaseUserSaveParam|
L5032: |&emsp;&emsp;id|主键id||false|integer(int64)||
L5033: |&emsp;&emsp;userAccount|登录账号||true|string||
L5034: |&emsp;&emsp;userName|员工姓名||true|string||
L5035: |&emsp;&emsp;phone|手机号||true|string||
L5036: |&emsp;&emsp;email|电子邮箱||false|string||
L5037: |&emsp;&emsp;userPassword|登录密码||true|string||
L5038: |&emsp;&emsp;companyId|所属公司ID||true|integer(int64)||
L5039: |&emsp;&emsp;systemId|系统ID||false|string||
L5040: |&emsp;&emsp;remark|备注||false|string||
L5041: |&emsp;&emsp;userAvatar|头像||false|string||
L5042: |&emsp;&emsp;flagSystemState|系统状态:0-停用,1-可用||false|integer(int32)||
L5043: |&emsp;&emsp;userDataAuthority|数据权限:来源字典（userDataAuthority）||false|string||
L5044: |&emsp;&emsp;flagRole|是否使用roleIds字段：true-是 false-否||false|boolean||
L5045: |&emsp;&emsp;roleIds|角色 1 租户管理员 0 租户运营 3超级管理员||false|array|integer(int64)|
L5046: |&emsp;&emsp;weightType|菜单权重:来源字典（weightType）systemType、platformType、businessType、defaultType||false|string||
L5047: |&emsp;&emsp;dealerId|关联ID经销商id，用户类型为经销商时才有值||false|integer(int64)||
L5048: |&emsp;&emsp;dealerCode|经销商编码||false|string||
L5054: | 状态码 | 说明 | schema |
L5055: | -------- | -------- | ----- | 
L5056: |200|OK|OptResult|
L5062: | 参数名称 | 参数说明 | 类型 | schema |
L5063: | -------- | -------- | ----- |----- | 
L5064: |result|返回码|string||
L5065: |msg|错误信息|string||
L5066: |success||boolean||
```

## L5079 · POST /base/user/companyToUserPage
原文L5079–L5192；Wiki `lib-平台通用服务认证与用户接口`。

```text
L5082: **接口地址**:`/base/user/companyToUserPage`
L5085: **请求方式**:`POST`
L5088: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L5091: **响应数据类型**:`*/*`
L5094: **接口描述**:
L5115: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L5116: | -------- | -------- | ----- | -------- | -------- | ------ |
L5117: |baseUserQueryParam|人员管理表|body|true|BaseUserQueryParam|BaseUserQueryParam|
L5118: |&emsp;&emsp;page|页码，不传是默认为1||false|integer(int32)||
L5119: |&emsp;&emsp;perPage|每页数量，不传是默认为10||false|integer(int32)||
L5120: |&emsp;&emsp;phone|手机号码||false|string||
L5121: |&emsp;&emsp;roleId|角色 1 租户管理员 0 租户运营||false|integer(int64)||
L5122: |&emsp;&emsp;modifyDateOrder|更新时间排序 升序 ascend 降序 descend||false|string||
L5123: |&emsp;&emsp;roleNames|角色||false|string||
L5129: | 状态码 | 说明 | schema |
L5130: | -------- | -------- | ----- | 
L5131: |200|OK|ListResultBaseUserListResult|
L5137: | 参数名称 | 参数说明 | 类型 | schema |
L5138: | -------- | -------- | ----- |----- | 
L5139: |result|返回码|string||
L5140: |msg|错误信息|string||
L5141: |pageindex|当前页|integer(int32)|integer(int32)|
L5142: |pages|总页数|integer(int32)|integer(int32)|
L5143: |records|总记录数|integer(int32)|integer(int32)|
L5144: |rows|结果对象集|array|BaseUserListResult|
L5145: |&emsp;&emsp;id|主键id|integer(int64)||
L5146: |&emsp;&emsp;userAccount|登录账号|string||
L5147: |&emsp;&emsp;userName|员工姓名|string||
L5148: |&emsp;&emsp;phone|手机号|string||
L5149: |&emsp;&emsp;companyId|所属公司ID|integer(int64)||
L5150: |&emsp;&emsp;companyName|所属公司名称|string||
L5151: |&emsp;&emsp;remark|备注|string||
L5152: |&emsp;&emsp;flagSystemState|系统状态:0-停用,1-可用|integer(int32)||
L5153: |&emsp;&emsp;creator|创建者|string||
L5154: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L5155: |&emsp;&emsp;modifier|修改者|string||
L5156: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L5157: |&emsp;&emsp;roleNames|所在角色名称|string||
L5158: |&emsp;&emsp;needModifyPw|是否需要修改密码|boolean||
L5159: |success||boolean||
```

## L5348 · GET /base/user/info/{account}
原文L5348–L5426；Wiki `lib-平台通用服务认证与用户接口`。

```text
L5351: **接口地址**:`/base/user/info/{account}`
L5354: **请求方式**:`GET`
L5357: **请求数据类型**:`application/x-www-form-urlencoded`
L5360: **响应数据类型**:`*/*`
L5363: **接口描述**:
L5369: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L5370: | -------- | -------- | ----- | -------- | -------- | ------ |
L5371: |account||path|true|string||
L5377: | 状态码 | 说明 | schema |
L5378: | -------- | -------- | ----- | 
L5379: |200|OK|EntityResultUserAccountInfoResult|
L5385: | 参数名称 | 参数说明 | 类型 | schema |
L5386: | -------- | -------- | ----- |----- | 
L5387: |result|返回码|string||
L5388: |msg|错误信息|string||
L5389: |extInfo|扩展信息|string||
L5390: |rows||UserAccountInfoResult|UserAccountInfoResult|
L5391: |&emsp;&emsp;id|主键id|integer(int64)||
L5392: |&emsp;&emsp;userAccount|登录账号|string||
L5393: |&emsp;&emsp;userName|员工姓名|string||
L5394: |&emsp;&emsp;email|电子邮箱|string||
L5395: |&emsp;&emsp;companyId|所属公司ID|integer(int64)||
L5396: |&emsp;&emsp;companyName|所属公司名称|string||
L5397: |&emsp;&emsp;accountType|账号类型:来源字典（accountType）|string||
L5398: |&emsp;&emsp;phone|手机号|string||
L5399: |&emsp;&emsp;roleName|角色名称|array|string|
L5400: |&emsp;&emsp;userAvatar|头像|string||
L5401: |success||boolean||
```

## L5427 · GET /base/user/detail/{id}
原文L5427–L5529；Wiki `lib-平台通用服务认证与用户接口`。

```text
L5430: **接口地址**:`/base/user/detail/{id}`
L5433: **请求方式**:`GET`
L5436: **请求数据类型**:`application/x-www-form-urlencoded`
L5439: **响应数据类型**:`*/*`
L5442: **接口描述**:
L5448: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L5449: | -------- | -------- | ----- | -------- | -------- | ------ |
L5450: |id|要查询的记录id|path|true|integer(int64)||
L5456: | 状态码 | 说明 | schema |
L5457: | -------- | -------- | ----- | 
L5458: |200|OK|EntityResultBaseUserResult|
L5464: | 参数名称 | 参数说明 | 类型 | schema |
L5465: | -------- | -------- | ----- |----- | 
L5466: |result|返回码|string||
L5467: |msg|错误信息|string||
L5468: |extInfo|扩展信息|string||
L5469: |rows||BaseUserResult|BaseUserResult|
L5470: |&emsp;&emsp;id|主键id|integer(int64)||
L5471: |&emsp;&emsp;userAccount|登录账号|string||
L5472: |&emsp;&emsp;userName|员工姓名|string||
L5473: |&emsp;&emsp;userAvatar|头像|string||
L5474: |&emsp;&emsp;phone|手机号|string||
L5475: |&emsp;&emsp;email|电子邮箱|string||
L5476: |&emsp;&emsp;companyId|所属公司ID|integer(int64)||
L5477: |&emsp;&emsp;companyName|所属公司名称|string||
L5478: |&emsp;&emsp;remark|备注|string||
L5479: |&emsp;&emsp;accountType|账号类型:来源字典（accountType）|string||
L5480: |&emsp;&emsp;flagSystemState|系统状态:0-停用,1-可用|integer(int32)||
L5481: |&emsp;&emsp;creator|创建者|string||
L5482: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L5483: |&emsp;&emsp;modifier|修改者|string||
L5484: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L5485: |&emsp;&emsp;userDataAuthority|数据权限:来源字典（userDataAuthority）|string||
L5486: |&emsp;&emsp;roleIds|所在权限集合数组|array|integer(int64)|
L5487: |&emsp;&emsp;weightType|菜单权重:来源字典（weightType）systemType、platformType、businessType、defaultType|string||
L5488: |&emsp;&emsp;needModifyPw|是否需要修改密码|boolean||
L5489: |&emsp;&emsp;systemId|系统id|string||
L5490: |&emsp;&emsp;dealerCode|经销商编码|string||
L5491: |&emsp;&emsp;dealerId|经销商id|integer(int64)||
L5492: |success||boolean||
```

## L5694 · PUT /base/user/business/status
原文L5694–L5800；Wiki `lib-平台通用服务认证与用户接口`。

```text
L5697: **接口地址**:`/base/user/business/status`
L5700: **请求方式**:`PUT`
L5703: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L5706: **响应数据类型**:`*/*`
L5709: **接口描述**:
L5746: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L5747: | -------- | -------- | ----- | -------- | -------- | ------ |
L5748: |baseUserUpdateParam|人员管理表|body|true|BaseUserUpdateParam|BaseUserUpdateParam|
L5749: |&emsp;&emsp;id|主键id||true|integer(int64)||
L5750: |&emsp;&emsp;userAccount|登录账号||false|string||
L5751: |&emsp;&emsp;userName|员工姓名||false|string||
L5752: |&emsp;&emsp;phone|手机号||false|string||
L5753: |&emsp;&emsp;email|电子邮箱||false|string||
L5754: |&emsp;&emsp;companyId|所属公司ID||false|integer(int64)||
L5755: |&emsp;&emsp;remark|备注||false|string||
L5756: |&emsp;&emsp;accountType|账号类型:来源字典（accountType：coreType(核心管理员)、（基础用户）baseType）||false|string||
L5757: |&emsp;&emsp;flagSystemState|系统状态:0-停用,1-可用||false|integer(int32)||
L5758: |&emsp;&emsp;systemId|系统ID||false|string||
L5759: |&emsp;&emsp;roleGroupIds|所在角色组集合数组 用途：用户管理创建||false|array|integer(int64)|
L5760: |&emsp;&emsp;userDataAuthority|数据权限:来源字典（userDataAuthority）||false|string||
L5761: |&emsp;&emsp;flagRole|是否使用roleIds字段：true-是 false-否||false|boolean||
L5762: |&emsp;&emsp;roleIds|所在角色集合数组 用途：业务员管理创建||false|array|integer(int64)|
L5763: |&emsp;&emsp;flagRoleIds|是否启用roleIds字段 1-是 0-否||false|integer(int32)||
L5764: |&emsp;&emsp;flagRoleGroupIds|是否启用roleGroupIds字段 1-是 0-否||false|integer(int32)||
L5765: |&emsp;&emsp;weightType|菜单权重:来源字典（weightType）systemType、platformType、businessType、defaultType||false|string||
L5766: |&emsp;&emsp;flagMenusIds|是否启用menusIds字段 1-是 0-否||false|integer(int32)||
L5767: |&emsp;&emsp;menusIds|菜单权限数组||false|array|integer(int64)|
L5768: |&emsp;&emsp;parentMenusIds|父级菜单权限数组 用途：取消勾选的时候使用||false|array|integer(int64)|
L5769: |&emsp;&emsp;dealerId|关联ID经销商id，用户类型为经销商时才有值||false|integer(int64)||
L5770: |&emsp;&emsp;dealerCode|经销商编码||false|string||
L5776: | 状态码 | 说明 | schema |
L5777: | -------- | -------- | ----- | 
L5778: |200|OK|OptResult|
L5784: | 参数名称 | 参数说明 | 类型 | schema |
L5785: | -------- | -------- | ----- |----- | 
L5786: |result|返回码|string||
L5787: |msg|错误信息|string||
L5788: |success||boolean||
```

## L7371 · PUT /base/role/update
原文L7371–L7459；Wiki `lib-平台通用服务角色菜单与数据权限接口`。

```text
L7374: **接口地址**:`/base/role/update`
L7377: **请求方式**:`PUT`
L7380: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L7383: **响应数据类型**:`*/*`
L7386: **接口描述**:
L7414: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L7415: | -------- | -------- | ----- | -------- | -------- | ------ |
L7416: |baseRoleUpdateParam|权限组表|body|true|BaseRoleUpdateParam|BaseRoleUpdateParam|
L7417: |&emsp;&emsp;id|主键id||true|integer(int64)||
L7418: |&emsp;&emsp;roleName|角色名称||false|string||
L7419: |&emsp;&emsp;roleCode|角色编码||false|string||
L7420: |&emsp;&emsp;dataAuthority|数据权限标题:来源字典(dataAuthority)||false|string||
L7421: |&emsp;&emsp;dataAuthorityCustomList|当数据权限为customCompany，则此字段有效||false|array|integer(int64)|
L7422: |&emsp;&emsp;flagSystemRole|系统角色:0-否,1-是||false|integer(int32)||
L7423: |&emsp;&emsp;remark|备注||false|string||
L7424: |&emsp;&emsp;sortOrder|排序 越小越靠前||false|integer(int32)||
L7425: |&emsp;&emsp;systemId|系统ID||false|string||
L7426: |&emsp;&emsp;userId|创建者用户ID||false|integer(int64)||
L7427: |&emsp;&emsp;flagSystemState|系统状态:0-停用,1-可用||false|integer(int32)||
L7428: |&emsp;&emsp;flagMenusIds|是否启用menusIds字段 1-是 0-否||false|integer(int32)||
L7429: |&emsp;&emsp;menusIds|菜单权限数组||false|array|integer(int64)|
L7435: | 状态码 | 说明 | schema |
L7436: | -------- | -------- | ----- | 
L7437: |200|OK|OptResult|
L7443: | 参数名称 | 参数说明 | 类型 | schema |
L7444: | -------- | -------- | ----- |----- | 
L7445: |result|返回码|string||
L7446: |msg|错误信息|string||
L7447: |success||boolean||
```

## L7549 · POST /base/role/create
原文L7549–L7635；Wiki `lib-平台通用服务角色菜单与数据权限接口`。

```text
L7552: **接口地址**:`/base/role/create`
L7555: **请求方式**:`POST`
L7558: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L7561: **响应数据类型**:`*/*`
L7564: **接口描述**:
L7591: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L7592: | -------- | -------- | ----- | -------- | -------- | ------ |
L7593: |baseRoleSaveParam|权限组表|body|true|BaseRoleSaveParam|BaseRoleSaveParam|
L7594: |&emsp;&emsp;id|主键id||false|integer(int64)||
L7595: |&emsp;&emsp;roleName|角色名称||true|string||
L7596: |&emsp;&emsp;roleCode|角色编码||true|string||
L7597: |&emsp;&emsp;dataAuthority|数据权限标题:来源字典(dataAuthority)||false|string||
L7598: |&emsp;&emsp;flagSystemRole|系统角色:0-否,1-是||false|integer(int32)||
L7599: |&emsp;&emsp;remark|备注||false|string||
L7600: |&emsp;&emsp;sortOrder|排序 越小越靠前||false|integer(int32)||
L7601: |&emsp;&emsp;userId|创建者用户ID||false|integer(int64)||
L7602: |&emsp;&emsp;systemId|系统ID||false|string||
L7603: |&emsp;&emsp;flagSystemState|系统状态:0-停用,1-可用||false|integer(int32)||
L7604: |&emsp;&emsp;flagMenusIds|是否启用menusIds字段 1-是 0-否||false|integer(int32)||
L7605: |&emsp;&emsp;menusIds|菜单权限数组||false|array|integer(int64)|
L7611: | 状态码 | 说明 | schema |
L7612: | -------- | -------- | ----- | 
L7613: |200|OK|OptResult|
L7619: | 参数名称 | 参数说明 | 类型 | schema |
L7620: | -------- | -------- | ----- |----- | 
L7621: |result|返回码|string||
L7622: |msg|错误信息|string||
L7623: |success||boolean||
```

## L7636 · GET /base/role/user/company-role-list
原文L7636–L7726；Wiki `lib-平台通用服务角色菜单与数据权限接口`。

```text
L7639: **接口地址**:`/base/role/user/company-role-list`
L7642: **请求方式**:`GET`
L7645: **请求数据类型**:`application/x-www-form-urlencoded`
L7648: **响应数据类型**:`*/*`
L7651: **接口描述**:
L7657: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L7658: | -------- | -------- | ----- | -------- | -------- | ------ |
L7659: |roleParam||query|true|UserCompanyRoleParam|UserCompanyRoleParam|
L7660: |&emsp;&emsp;companyId|所属公司ID||false|integer(int64)||
L7661: |&emsp;&emsp;systemId|系统ID||false|string||
L7667: | 状态码 | 说明 | schema |
L7668: | -------- | -------- | ----- | 
L7669: |200|OK|EntityResultListBaseRoleListResult|
L7675: | 参数名称 | 参数说明 | 类型 | schema |
L7676: | -------- | -------- | ----- |----- | 
L7677: |result|返回码|string||
L7678: |msg|错误信息|string||
L7679: |extInfo|扩展信息|string||
L7680: |rows|结果对象|array|BaseRoleListResult|
L7681: |&emsp;&emsp;id|主键id|integer(int64)||
L7682: |&emsp;&emsp;roleName|角色名称|string||
L7683: |&emsp;&emsp;roleCode|角色编码|string||
L7684: |&emsp;&emsp;dataAuthority|数据权限标题:来源字典(dataAuthority)|string||
L7685: |&emsp;&emsp;flagSystemRole|系统角色:0-否,1-是|integer(int32)||
L7686: |&emsp;&emsp;remark|备注|string||
L7687: |&emsp;&emsp;sortOrder|排序 越小越靠前|integer(int32)||
L7688: |&emsp;&emsp;companyId|所属公司ID|integer(int64)||
L7689: |&emsp;&emsp;userId|创建者用户ID|integer(int64)||
L7690: |&emsp;&emsp;flagSystemState|系统状态:0-停用,1-可用|integer(int32)||
L7691: |&emsp;&emsp;creator|创建者|string||
L7692: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L7693: |&emsp;&emsp;modifier|修改者|string||
L7694: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L7695: |success||boolean||
```

## L8212 · POST /base/role-group/create
原文L8212–L8284；Wiki `lib-平台通用服务角色菜单与数据权限接口`。

```text
L8215: **接口地址**:`/base/role-group/create`
L8218: **请求方式**:`POST`
L8221: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L8224: **响应数据类型**:`*/*`
L8227: **接口描述**:
L8247: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L8248: | -------- | -------- | ----- | -------- | -------- | ------ |
L8249: |baseRoleGroupSaveParam|角色组管理表|body|true|BaseRoleGroupSaveParam|BaseRoleGroupSaveParam|
L8250: |&emsp;&emsp;id|主键id||false|integer(int64)||
L8251: |&emsp;&emsp;roleGroupName|角色组名称||true|string||
L8252: |&emsp;&emsp;roleGroupCode|角色组编码||true|string||
L8253: |&emsp;&emsp;remark|备注||false|string||
L8254: |&emsp;&emsp;sortOrder|排序 越小越靠前||true|integer(int32)||
L8260: | 状态码 | 说明 | schema |
L8261: | -------- | -------- | ----- | 
L8262: |200|OK|OptResult|
L8268: | 参数名称 | 参数说明 | 类型 | schema |
L8269: | -------- | -------- | ----- |----- | 
L8270: |result|返回码|string||
L8271: |msg|错误信息|string||
L8272: |success||boolean||
```

## L8285 · GET /base/role-group/list
原文L8285–L8380；Wiki `lib-平台通用服务角色菜单与数据权限接口`。

```text
L8288: **接口地址**:`/base/role-group/list`
L8291: **请求方式**:`GET`
L8294: **请求数据类型**:`application/x-www-form-urlencoded`
L8297: **响应数据类型**:`*/*`
L8300: **接口描述**:
L8306: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L8307: | -------- | -------- | ----- | -------- | -------- | ------ |
L8308: |param|角色组管理表|query|true|BaseRoleGroupQueryParam|BaseRoleGroupQueryParam|
L8309: |&emsp;&emsp;page|页码，不传是默认为1||false|integer(int32)||
L8310: |&emsp;&emsp;perPage|每页数量，不传是默认为10||false|integer(int32)||
L8311: |&emsp;&emsp;companyId|所属公司ID||false|integer(int64)||
L8312: |&emsp;&emsp;roleGroupName|角色组名称||false|string||
L8313: |&emsp;&emsp;roleGroupCode|角色组编码||false|string||
L8314: |&emsp;&emsp;flagSystemState|系统状态:0-停用,1-可用||false|integer(int32)||
L8315: |&emsp;&emsp;userId|创建者用户ID||false|integer(int64)||
L8321: | 状态码 | 说明 | schema |
L8322: | -------- | -------- | ----- | 
L8323: |200|OK|ListResultBaseRoleGroupListResult|
L8329: | 参数名称 | 参数说明 | 类型 | schema |
L8330: | -------- | -------- | ----- |----- | 
L8331: |result|返回码|string||
L8332: |msg|错误信息|string||
L8333: |pageindex|当前页|integer(int32)|integer(int32)|
L8334: |pages|总页数|integer(int32)|integer(int32)|
L8335: |records|总记录数|integer(int32)|integer(int32)|
L8336: |rows|结果对象集|array|BaseRoleGroupListResult|
L8337: |&emsp;&emsp;id|主键id|integer(int64)||
L8338: |&emsp;&emsp;roleGroupName|角色组名称|string||
L8339: |&emsp;&emsp;roleGroupCode|角色组编码|string||
L8340: |&emsp;&emsp;companyId|所属公司ID|integer(int64)||
L8341: |&emsp;&emsp;remark|备注|string||
L8342: |&emsp;&emsp;sortOrder|排序 越小越靠前|integer(int32)||
L8343: |&emsp;&emsp;flagSystemState|系统状态:0-停用,1-可用|integer(int32)||
L8344: |&emsp;&emsp;userId|创建者用户ID|integer(int64)||
L8345: |&emsp;&emsp;creator|创建者|string||
L8346: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L8347: |&emsp;&emsp;modifier|修改者|string||
L8348: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L8349: |success||boolean||
```

## L8381 · GET /base/role-group/detail/{id}
原文L8381–L8465；Wiki `lib-平台通用服务角色菜单与数据权限接口`。

```text
L8384: **接口地址**:`/base/role-group/detail/{id}`
L8387: **请求方式**:`GET`
L8390: **请求数据类型**:`application/x-www-form-urlencoded`
L8393: **响应数据类型**:`*/*`
L8396: **接口描述**:
L8402: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L8403: | -------- | -------- | ----- | -------- | -------- | ------ |
L8404: |id|要查询的记录id|path|true|integer(int64)||
L8410: | 状态码 | 说明 | schema |
L8411: | -------- | -------- | ----- | 
L8412: |200|OK|EntityResultBaseRoleGroupResult|
L8418: | 参数名称 | 参数说明 | 类型 | schema |
L8419: | -------- | -------- | ----- |----- | 
L8420: |result|返回码|string||
L8421: |msg|错误信息|string||
L8422: |extInfo|扩展信息|string||
L8423: |rows||BaseRoleGroupResult|BaseRoleGroupResult|
L8424: |&emsp;&emsp;id|主键id|integer(int64)||
L8425: |&emsp;&emsp;roleGroupName|角色组名称|string||
L8426: |&emsp;&emsp;roleGroupCode|角色组编码|string||
L8427: |&emsp;&emsp;companyId|所属公司ID|integer(int64)||
L8428: |&emsp;&emsp;companyName|所属公司名称|string||
L8429: |&emsp;&emsp;remark|备注|string||
L8430: |&emsp;&emsp;sortOrder|排序 越小越靠前|integer(int32)||
L8431: |&emsp;&emsp;flagSystemState|系统状态:0-停用,1-可用|integer(int32)||
L8432: |&emsp;&emsp;userId|创建者用户ID|integer(int64)||
L8433: |&emsp;&emsp;creator|创建者|string||
L8434: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L8435: |&emsp;&emsp;modifier|修改者|string||
L8436: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L8437: |success||boolean||
```

## L8759 · POST /base/menu/create
原文L8759–L8851；Wiki `lib-平台通用服务角色菜单与数据权限接口`。

```text
L8762: **接口地址**:`/base/menu/create`
L8765: **请求方式**:`POST`
L8768: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L8771: **响应数据类型**:`*/*`
L8774: **接口描述**:
L8804: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L8805: | -------- | -------- | ----- | -------- | -------- | ------ |
L8806: |baseMenuSaveParam|菜单管理表|body|true|BaseMenuSaveParam|BaseMenuSaveParam|
L8807: |&emsp;&emsp;id|主键id||false|integer(int64)||
L8808: |&emsp;&emsp;parentId|上级菜单ID||false|integer(int64)||
L8809: |&emsp;&emsp;menuName|菜单名称||true|string||
L8810: |&emsp;&emsp;menuType|菜单类型:来源字典（menuType）||false|string||
L8811: |&emsp;&emsp;linkAddress|前端路由||false|string||
L8812: |&emsp;&emsp;urlAddress|后端路由||false|string||
L8813: |&emsp;&emsp;linkTarget|链接目标||false|string||
L8814: |&emsp;&emsp;authorityCode|权限标识||false|string||
L8815: |&emsp;&emsp;menuWeight|菜单权重:来源字典（menuWeight）||false|string||
L8816: |&emsp;&emsp;remark|备注||false|string||
L8817: |&emsp;&emsp;sortOrder|排序 选项排序 越小越靠前||true|integer(int32)||
L8818: |&emsp;&emsp;flagVisible|是否可见:0-隐藏,1-显示||false|integer(int32)||
L8819: |&emsp;&emsp;flagSystemState|系统状态:0-停用,1-可用||false|integer(int32)||
L8820: |&emsp;&emsp;systemId|系统ID||false|string||
L8821: |&emsp;&emsp;scopeList|可见范围列表:1-平台端;2-品牌端;3-门店端||true|array|integer(int32)|
L8827: | 状态码 | 说明 | schema |
L8828: | -------- | -------- | ----- | 
L8829: |200|OK|OptResult|
L8835: | 参数名称 | 参数说明 | 类型 | schema |
L8836: | -------- | -------- | ----- |----- | 
L8837: |result|返回码|string||
L8838: |msg|错误信息|string||
L8839: |success||boolean||
```

## L10629 · PUT /base/company/update
原文L10629–L10731；Wiki `lib-平台通用服务公司与充值计费接口`。

```text
L10632: **接口地址**:`/base/company/update`
L10635: **请求方式**:`PUT`
L10638: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L10641: **响应数据类型**:`*/*`
L10644: **接口描述**:
L10679: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L10680: | -------- | -------- | ----- | -------- | -------- | ------ |
L10681: |baseCompanyUpdateParam|公司管理表|body|true|BaseCompanyUpdateParam|BaseCompanyUpdateParam|
L10682: |&emsp;&emsp;id|主键id||false|integer(int64)||
L10683: |&emsp;&emsp;companyName|公司名称||false|string||
L10684: |&emsp;&emsp;companyFullName|公司全称||false|string||
L10685: |&emsp;&emsp;creditCode|统一社会信用代码||false|string||
L10686: |&emsp;&emsp;companyType|公司类型 来源字典（companyType）||false|string||
L10687: |&emsp;&emsp;businessLicense|营业执照上传文件目标||false|string||
L10688: |&emsp;&emsp;defaultEmail|默认邮箱||false|string||
L10689: |&emsp;&emsp;alternateEmail|备用邮箱||false|string||
L10690: |&emsp;&emsp;officePhone|办公电话||false|string||
L10691: |&emsp;&emsp;companyAddress|公司地址||false|string||
L10692: |&emsp;&emsp;bank|开户行||false|string||
L10693: |&emsp;&emsp;bankName|开户行名称||false|string||
L10694: |&emsp;&emsp;bankAccount|银行账号||false|string||
L10695: |&emsp;&emsp;remark|备注||false|string||
L10696: |&emsp;&emsp;sortOrder|排序 越小越靠前||false|integer(int32)||
L10697: |&emsp;&emsp;userId|创建者用户ID||false|integer(int64)||
L10698: |&emsp;&emsp;flagSystemState|系统状态:0-停用,1-可用||false|integer(int32)||
L10699: |&emsp;&emsp;businessType|商用/试用类型:1-商用,2-试用||false|integer(int32)||
L10700: |&emsp;&emsp;scope|作用域：1-智能外呼;2-云呼叫；多个以逗号分隔||false|string||
L10701: |&emsp;&emsp;enterpriseId|AliCti 账号||false|string||
L10707: | 状态码 | 说明 | schema |
L10708: | -------- | -------- | ----- | 
L10709: |200|OK|OptResult|
L10715: | 参数名称 | 参数说明 | 类型 | schema |
L10716: | -------- | -------- | ----- |----- | 
L10717: |result|返回码|string||
L10718: |msg|错误信息|string||
L10719: |success||boolean||
```

## L11331 · POST /base/company/create
原文L11331–L11435；Wiki `lib-平台通用服务公司与充值计费接口`。

```text
L11334: **接口地址**:`/base/company/create`
L11337: **请求方式**:`POST`
L11340: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L11343: **响应数据类型**:`*/*`
L11346: **接口描述**:
L11382: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L11383: | -------- | -------- | ----- | -------- | -------- | ------ |
L11384: |baseCompanySaveParam|租户管理表|body|true|BaseCompanySaveParam|BaseCompanySaveParam|
L11385: |&emsp;&emsp;id|主键id||false|integer(int64)||
L11386: |&emsp;&emsp;companyName|租户名称||false|string||
L11387: |&emsp;&emsp;companyFullName|租户全称||false|string||
L11388: |&emsp;&emsp;companyCode|租户编码||false|string||
L11389: |&emsp;&emsp;creditCode|统一社会信用代码||false|string||
L11390: |&emsp;&emsp;companyType|租户类型 来源字典 zyd1-门店  tenant/superAdminGroup为总部||false|string||
L11391: |&emsp;&emsp;businessLicense|营业执照上传文件目标||false|string||
L11392: |&emsp;&emsp;defaultEmail|默认邮箱||false|string||
L11393: |&emsp;&emsp;alternateEmail|备用邮箱||false|string||
L11394: |&emsp;&emsp;officePhone|办公电话||false|string||
L11395: |&emsp;&emsp;companyAddress|租户地址||false|string||
L11396: |&emsp;&emsp;bank|开户行||false|string||
L11397: |&emsp;&emsp;bankName|开户行名称||false|string||
L11398: |&emsp;&emsp;bankAccount|银行账号||false|string||
L11399: |&emsp;&emsp;remark|描述||false|string||
L11400: |&emsp;&emsp;sortOrder|排序 越小越靠前||false|integer(int32)||
L11401: |&emsp;&emsp;userId|创建者用户ID||false|integer(int64)||
L11402: |&emsp;&emsp;flagSystemState|系统状态:0-停用,1-可用||false|integer(int32)||
L11403: |&emsp;&emsp;scope|作用域单选：1-智能外呼;2-云呼叫；未传默认1||false|string||
L11404: |&emsp;&emsp;enterpriseId|AliCti 账号||false|string||
L11405: |&emsp;&emsp;businessType|商用/试用类型:1-商用,2-试用||false|integer(int32)||
L11411: | 状态码 | 说明 | schema |
L11412: | -------- | -------- | ----- | 
L11413: |200|OK|OptResult|
L11419: | 参数名称 | 参数说明 | 类型 | schema |
L11420: | -------- | -------- | ----- |----- | 
L11421: |result|返回码|string||
L11422: |msg|错误信息|string||
L11423: |success||boolean||
```

## L11436 · GET /base/company/usage/balance
原文L11436–L11544；Wiki `lib-平台通用服务公司与充值计费接口`。

```text
L11439: **接口地址**:`/base/company/usage/balance`
L11442: **请求方式**:`GET`
L11445: **请求数据类型**:`application/x-www-form-urlencoded`
L11448: **响应数据类型**:`*/*`
L11451: **接口描述**:
L11463: | 状态码 | 说明 | schema |
L11464: | -------- | -------- | ----- | 
L11465: |200|OK|EntityResultBaseCompanyListResult|
L11471: | 参数名称 | 参数说明 | 类型 | schema |
L11472: | -------- | -------- | ----- |----- | 
L11473: |result|返回码|string||
L11474: |msg|错误信息|string||
L11475: |extInfo|扩展信息|string||
L11476: |rows||BaseCompanyListResult|BaseCompanyListResult|
L11477: |&emsp;&emsp;id|主键id|integer(int64)||
L11478: |&emsp;&emsp;companyName|公司名称|string||
L11479: |&emsp;&emsp;companyCode|公司编码|string||
L11480: |&emsp;&emsp;companyType|公司类型 来源字典（companyType）|string||
L11481: |&emsp;&emsp;companyTypeName|公司类型名称|string||
L11482: |&emsp;&emsp;remark|备注|string||
L11483: |&emsp;&emsp;sortOrder|排序 越小越靠前|integer(int32)||
L11484: |&emsp;&emsp;flagSystemState|系统状态:0-停用,1-可用|integer(int32)||
L11485: |&emsp;&emsp;scope|作用域：1-智能外呼;2-云呼叫；多个以逗号分隔|string||
L11486: |&emsp;&emsp;enterpriseId|AliCti 账号|string||
L11487: |&emsp;&emsp;businessType|商用/试用类型:1-商用,2-试用|integer(int32)||
L11488: |&emsp;&emsp;businessTypeName|商用/试用类型名称|string||
L11489: |&emsp;&emsp;serviceStatus|服务状态: 0-未开通 1-待生效 2-有效 3-已过期|integer(int32)||
L11490: |&emsp;&emsp;serviceStatusName|服务状态名称|string||
L11491: |&emsp;&emsp;flagCheck|是否勾选|boolean||
L11492: |&emsp;&emsp;modifiedDate|更新时间|string(date-time)||
L11493: |&emsp;&emsp;modifier|更新人|string||
L11494: |&emsp;&emsp;callControlStatus|呼叫状态： 1-可发起 0-不可发起|integer(int32)||
L11495: |&emsp;&emsp;callControlStatusCn|呼叫状态|string||
L11496: |&emsp;&emsp;largeModelFrozenMinutes|大模型冻结分钟数|number||
L11497: |&emsp;&emsp;smallFrozenMinutes|小模型冻结分钟数|number||
L11498: |&emsp;&emsp;validStartDate|有效期开始时间|string(date-time)||
L11499: |&emsp;&emsp;validEndDate|有效期结束时间|string(date-time)||
L11500: |&emsp;&emsp;totalUseableMinutes|总可用分钟数|number||
L11501: |&emsp;&emsp;totalFrozenMinutes|总冻结分钟数|number||
L11502: |&emsp;&emsp;totalConsumedMinutes|累计消耗分钟数|number||
L11503: |success||boolean||
```

## L11784 · GET /base/company/get-my-company
原文L11784–L11894；Wiki `lib-平台通用服务公司与充值计费接口`。

```text
L11787: **接口地址**:`/base/company/get-my-company`
L11790: **请求方式**:`GET`
L11793: **请求数据类型**:`application/x-www-form-urlencoded`
L11796: **响应数据类型**:`*/*`
L11799: **接口描述**:
L11811: | 状态码 | 说明 | schema |
L11812: | -------- | -------- | ----- | 
L11813: |200|OK|EntityResultBaseCompanyResult|
L11819: | 参数名称 | 参数说明 | 类型 | schema |
L11820: | -------- | -------- | ----- |----- | 
L11821: |result|返回码|string||
L11822: |msg|错误信息|string||
L11823: |extInfo|扩展信息|string||
L11824: |rows||BaseCompanyResult|BaseCompanyResult|
L11825: |&emsp;&emsp;id|主键id|integer(int64)||
L11826: |&emsp;&emsp;companyName|公司名称|string||
L11827: |&emsp;&emsp;companyFullName|公司全称|string||
L11828: |&emsp;&emsp;companyCode|公司编码|string||
L11829: |&emsp;&emsp;creditCode|统一社会信用代码|string||
L11830: |&emsp;&emsp;companyType|公司类型 来源字典（companyType）|string||
L11831: |&emsp;&emsp;companyTypeName|公司类型名称|string||
L11832: |&emsp;&emsp;businessLicense|营业执照上传文件目标|string||
L11833: |&emsp;&emsp;defaultEmail|默认邮箱|string||
L11834: |&emsp;&emsp;alternateEmail|备用邮箱|string||
L11835: |&emsp;&emsp;officePhone|办公电话|string||
L11836: |&emsp;&emsp;companyAddress|公司地址|string||
L11837: |&emsp;&emsp;bank|开户行|string||
L11838: |&emsp;&emsp;bankName|开户行名称|string||
L11839: |&emsp;&emsp;bankAccount|银行账号|string||
L11840: |&emsp;&emsp;remark|备注|string||
L11841: |&emsp;&emsp;sortOrder|排序 越小越靠前|integer(int32)||
L11842: |&emsp;&emsp;userId|创建者用户ID|integer(int64)||
L11843: |&emsp;&emsp;flagSystemState|系统状态:0-停用,1-可用|integer(int32)||
L11844: |&emsp;&emsp;scope|作用域：1-智能外呼;2-云呼叫；多个以逗号分隔|string||
L11845: |&emsp;&emsp;enterpriseId|AliCti 账号|string||
L11846: |&emsp;&emsp;businessType|商用/试用类型:1-商用,2-试用|integer(int32)||
L11847: |&emsp;&emsp;businessTypeName|商用/试用类型名称|string||
L11848: |&emsp;&emsp;creator|创建者|string||
L11849: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L11850: |&emsp;&emsp;modifier|修改者|string||
L11851: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L11852: |success||boolean||
```

## L11895 · GET /base/company/detail/{id}
原文L11895–L12007；Wiki `lib-平台通用服务公司与充值计费接口`。

```text
L11898: **接口地址**:`/base/company/detail/{id}`
L11901: **请求方式**:`GET`
L11904: **请求数据类型**:`application/x-www-form-urlencoded`
L11907: **响应数据类型**:`*/*`
L11910: **接口描述**:
L11916: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L11917: | -------- | -------- | ----- | -------- | -------- | ------ |
L11918: |id|要查询的记录id|path|true|integer(int64)||
L11924: | 状态码 | 说明 | schema |
L11925: | -------- | -------- | ----- | 
L11926: |200|OK|EntityResultBaseCompanyResult|
L11932: | 参数名称 | 参数说明 | 类型 | schema |
L11933: | -------- | -------- | ----- |----- | 
L11934: |result|返回码|string||
L11935: |msg|错误信息|string||
L11936: |extInfo|扩展信息|string||
L11937: |rows||BaseCompanyResult|BaseCompanyResult|
L11938: |&emsp;&emsp;id|主键id|integer(int64)||
L11939: |&emsp;&emsp;companyName|公司名称|string||
L11940: |&emsp;&emsp;companyFullName|公司全称|string||
L11941: |&emsp;&emsp;companyCode|公司编码|string||
L11942: |&emsp;&emsp;creditCode|统一社会信用代码|string||
L11943: |&emsp;&emsp;companyType|公司类型 来源字典（companyType）|string||
L11944: |&emsp;&emsp;companyTypeName|公司类型名称|string||
L11945: |&emsp;&emsp;businessLicense|营业执照上传文件目标|string||
L11946: |&emsp;&emsp;defaultEmail|默认邮箱|string||
L11947: |&emsp;&emsp;alternateEmail|备用邮箱|string||
L11948: |&emsp;&emsp;officePhone|办公电话|string||
L11949: |&emsp;&emsp;companyAddress|公司地址|string||
L11950: |&emsp;&emsp;bank|开户行|string||
L11951: |&emsp;&emsp;bankName|开户行名称|string||
L11952: |&emsp;&emsp;bankAccount|银行账号|string||
L11953: |&emsp;&emsp;remark|备注|string||
L11954: |&emsp;&emsp;sortOrder|排序 越小越靠前|integer(int32)||
L11955: |&emsp;&emsp;userId|创建者用户ID|integer(int64)||
L11956: |&emsp;&emsp;flagSystemState|系统状态:0-停用,1-可用|integer(int32)||
L11957: |&emsp;&emsp;scope|作用域：1-智能外呼;2-云呼叫；多个以逗号分隔|string||
L11958: |&emsp;&emsp;enterpriseId|AliCti 账号|string||
L11959: |&emsp;&emsp;businessType|商用/试用类型:1-商用,2-试用|integer(int32)||
L11960: |&emsp;&emsp;businessTypeName|商用/试用类型名称|string||
L11961: |&emsp;&emsp;creator|创建者|string||
L11962: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L11963: |&emsp;&emsp;modifier|修改者|string||
L11964: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L11965: |success||boolean||
```

## L13611 · POST /base/user-role-rel/confirm
原文L13611–L13699；Wiki `lib-平台通用服务角色菜单与数据权限接口`。

```text
L13614: **接口地址**:`/base/user-role-rel/confirm`
L13617: **请求方式**:`POST`
L13620: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L13623: **响应数据类型**:`*/*`
L13626: **接口描述**:
L13657: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L13658: | -------- | -------- | ----- | -------- | -------- | ------ |
L13659: |userRoleParam|UserRoleParam|body|true|UserRoleParam|UserRoleParam|
L13660: |&emsp;&emsp;confirm|授权对象 数组对象中不用传id 其余要传||false|array|BaseUserRoleRelSaveParam|
L13661: |&emsp;&emsp;&emsp;&emsp;id|主键id||false|integer(int64)||
L13662: |&emsp;&emsp;&emsp;&emsp;userId|用户ID||false|integer(int64)||
L13663: |&emsp;&emsp;&emsp;&emsp;roleId|角色ID||false|integer(int64)||
L13664: |&emsp;&emsp;&emsp;&emsp;flagCheck|是否勾选:0-取消勾选,1-勾选||false|integer(int32)||
L13665: |&emsp;&emsp;cancel|取消授权对象 对象中只要传id即可||false|array|BaseUserRoleRelSaveParam|
L13666: |&emsp;&emsp;&emsp;&emsp;id|主键id||false|integer(int64)||
L13667: |&emsp;&emsp;&emsp;&emsp;userId|用户ID||false|integer(int64)||
L13668: |&emsp;&emsp;&emsp;&emsp;roleId|角色ID||false|integer(int64)||
L13669: |&emsp;&emsp;&emsp;&emsp;flagCheck|是否勾选:0-取消勾选,1-勾选||false|integer(int32)||
L13675: | 状态码 | 说明 | schema |
L13676: | -------- | -------- | ----- | 
L13677: |200|OK|OptResult|
L13683: | 参数名称 | 参数说明 | 类型 | schema |
L13684: | -------- | -------- | ----- |----- | 
L13685: |result|返回码|string||
L13686: |msg|错误信息|string||
L13687: |success||boolean||
```

## L13789 · GET /base/user-role-rel/list
原文L13789–L13858；Wiki `lib-平台通用服务角色菜单与数据权限接口`。

```text
L13792: **接口地址**:`/base/user-role-rel/list`
L13795: **请求方式**:`GET`
L13798: **请求数据类型**:`application/x-www-form-urlencoded`
L13801: **响应数据类型**:`*/*`
L13804: **接口描述**:
L13810: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L13811: | -------- | -------- | ----- | -------- | -------- | ------ |
L13812: |param|用户角色关联表|query|true|BaseUserRoleRelQueryParam|BaseUserRoleRelQueryParam|
L13813: |&emsp;&emsp;userId|用户ID||false|integer(int64)||
L13819: | 状态码 | 说明 | schema |
L13820: | -------- | -------- | ----- | 
L13821: |200|OK|EntityResultListBaseUserRoleRelListResult|
L13827: | 参数名称 | 参数说明 | 类型 | schema |
L13828: | -------- | -------- | ----- |----- | 
L13829: |result|返回码|string||
L13830: |msg|错误信息|string||
L13831: |extInfo|扩展信息|string||
L13832: |rows|结果对象|array|BaseUserRoleRelListResult|
L13833: |&emsp;&emsp;id|主键id|integer(int64)||
L13834: |&emsp;&emsp;roleId|角色ID|integer(int64)||
L13835: |&emsp;&emsp;roleName|角色名称|string||
L13836: |&emsp;&emsp;flagCheck|是否勾选:0-取消勾选,1-勾选|integer(int32)||
L13837: |success||boolean||
```

## L14140 · POST /base/user-data-scope/create
原文L14140–L14213；Wiki `lib-平台通用服务角色菜单与数据权限接口`。

```text
L14143: **接口地址**:`/base/user-data-scope/create`
L14146: **请求方式**:`POST`
L14149: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L14152: **响应数据类型**:`*/*`
L14155: **接口描述**:
L14177: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L14178: | -------- | -------- | ----- | -------- | -------- | ------ |
L14179: |baseUserDataScopeVoParam|BaseUserDataScopeVoParam|body|true|BaseUserDataScopeVoParam|BaseUserDataScopeVoParam|
L14180: |&emsp;&emsp;userId|用户ID||true|integer(int64)||
L14181: |&emsp;&emsp;userDataAuthority|用户-数据权限类型||false|string||
L14182: |&emsp;&emsp;list|数据权限对象||false|array|BaseUserDataScopeSaveParam|
L14183: |&emsp;&emsp;&emsp;&emsp;companyId|所属公司ID||false|integer(int64)||
L14189: | 状态码 | 说明 | schema |
L14190: | -------- | -------- | ----- | 
L14191: |200|OK|OptResult|
L14197: | 参数名称 | 参数说明 | 类型 | schema |
L14198: | -------- | -------- | ----- |----- | 
L14199: |result|返回码|string||
L14200: |msg|错误信息|string||
L14201: |success||boolean||
```

## L14281 · GET /base/user-data-scope/list
原文L14281–L14408；Wiki `lib-平台通用服务角色菜单与数据权限接口`。

```text
L14284: **接口地址**:`/base/user-data-scope/list`
L14287: **请求方式**:`GET`
L14290: **请求数据类型**:`application/x-www-form-urlencoded`
L14293: **响应数据类型**:`*/*`
L14296: **接口描述**:
L14302: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L14303: | -------- | -------- | ----- | -------- | -------- | ------ |
L14304: |param|用户数据权限表|query|true|BaseUserDataScopeQueryParam|BaseUserDataScopeQueryParam|
L14305: |&emsp;&emsp;page|页码，不传是默认为1||false|integer(int32)||
L14306: |&emsp;&emsp;perPage|每页数量，不传是默认为10||false|integer(int32)||
L14307: |&emsp;&emsp;userId|用户id||false|integer(int64)||
L14313: | 状态码 | 说明 | schema |
L14314: | -------- | -------- | ----- | 
L14315: |200|OK|EntityResultListBaseCompanyTreeResult|
L14321: | 参数名称 | 参数说明 | 类型 | schema |
L14322: | -------- | -------- | ----- |----- | 
L14323: |result|返回码|string||
L14324: |msg|错误信息|string||
L14325: |extInfo|扩展信息|string||
L14326: |rows|结果对象|array|BaseCompanyTreeResult|
L14327: |&emsp;&emsp;companyType|公司类型 来源字典（companyType）|string||
L14328: |&emsp;&emsp;flagCheck|是否勾选|boolean||
L14329: |&emsp;&emsp;list|公司列表|array|BaseCompanyListResult|
L14330: |&emsp;&emsp;&emsp;&emsp;id|主键id|integer(int64)||
L14331: |&emsp;&emsp;&emsp;&emsp;companyName|公司名称|string||
L14332: |&emsp;&emsp;&emsp;&emsp;companyCode|公司编码|string||
L14333: |&emsp;&emsp;&emsp;&emsp;companyType|公司类型 来源字典（companyType）|string||
L14334: |&emsp;&emsp;&emsp;&emsp;companyTypeName|公司类型名称|string||
L14335: |&emsp;&emsp;&emsp;&emsp;remark|备注|string||
L14336: |&emsp;&emsp;&emsp;&emsp;sortOrder|排序 越小越靠前|integer(int32)||
L14337: |&emsp;&emsp;&emsp;&emsp;flagSystemState|系统状态:0-停用,1-可用|integer(int32)||
L14338: |&emsp;&emsp;&emsp;&emsp;scope|作用域：1-智能外呼;2-云呼叫；多个以逗号分隔|string||
L14339: |&emsp;&emsp;&emsp;&emsp;enterpriseId|AliCti 账号|string||
L14340: |&emsp;&emsp;&emsp;&emsp;businessType|商用/试用类型:1-商用,2-试用|integer(int32)||
L14341: |&emsp;&emsp;&emsp;&emsp;businessTypeName|商用/试用类型名称|string||
L14342: |&emsp;&emsp;&emsp;&emsp;serviceStatus|服务状态: 0-未开通 1-待生效 2-有效 3-已过期|integer(int32)||
L14343: |&emsp;&emsp;&emsp;&emsp;serviceStatusName|服务状态名称|string||
L14344: |&emsp;&emsp;&emsp;&emsp;flagCheck|是否勾选|boolean||
L14345: |&emsp;&emsp;&emsp;&emsp;modifiedDate|更新时间|string(date-time)||
L14346: |&emsp;&emsp;&emsp;&emsp;modifier|更新人|string||
L14347: |&emsp;&emsp;&emsp;&emsp;callControlStatus|呼叫状态： 1-可发起 0-不可发起|integer(int32)||
L14348: |&emsp;&emsp;&emsp;&emsp;callControlStatusCn|呼叫状态|string||
L14349: |&emsp;&emsp;&emsp;&emsp;largeModelFrozenMinutes|大模型冻结分钟数|number||
L14350: |&emsp;&emsp;&emsp;&emsp;smallFrozenMinutes|小模型冻结分钟数|number||
L14351: |&emsp;&emsp;&emsp;&emsp;validStartDate|有效期开始时间|string(date-time)||
L14352: |&emsp;&emsp;&emsp;&emsp;validEndDate|有效期结束时间|string(date-time)||
L14353: |&emsp;&emsp;&emsp;&emsp;totalUseableMinutes|总可用分钟数|number||
L14354: |&emsp;&emsp;&emsp;&emsp;totalFrozenMinutes|总冻结分钟数|number||
L14355: |&emsp;&emsp;&emsp;&emsp;totalConsumedMinutes|累计消耗分钟数|number||
L14356: |success||boolean||
```

## L15375 · POST /base/role-data-scope/create
原文L15375–L15450；Wiki `lib-平台通用服务角色菜单与数据权限接口`。

```text
L15378: **接口地址**:`/base/role-data-scope/create`
L15381: **请求方式**:`POST`
L15384: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L15387: **响应数据类型**:`*/*`
L15390: **接口描述**:
L15413: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L15414: | -------- | -------- | ----- | -------- | -------- | ------ |
L15415: |roleDataScopeParam|RoleDataScopeParam|body|true|RoleDataScopeParam|RoleDataScopeParam|
L15416: |&emsp;&emsp;roleId|角色ID||true|integer(int64)||
L15417: |&emsp;&emsp;list|新增自定义数据-公司权限||false|array|BaseRoleDataScopeSaveParam|
L15418: |&emsp;&emsp;&emsp;&emsp;id|主键id||false|integer(int64)||
L15419: |&emsp;&emsp;&emsp;&emsp;roleId|角色ID||false|integer(int64)||
L15420: |&emsp;&emsp;&emsp;&emsp;companyId|所属公司ID||false|integer(int64)||
L15426: | 状态码 | 说明 | schema |
L15427: | -------- | -------- | ----- | 
L15428: |200|OK|OptResult|
L15434: | 参数名称 | 参数说明 | 类型 | schema |
L15435: | -------- | -------- | ----- |----- | 
L15436: |result|返回码|string||
L15437: |msg|错误信息|string||
L15438: |success||boolean||
```

## L15451 · GET /base/role-data-scope/list
原文L15451–L15579；Wiki `lib-平台通用服务角色菜单与数据权限接口`。

```text
L15454: **接口地址**:`/base/role-data-scope/list`
L15457: **请求方式**:`GET`
L15460: **请求数据类型**:`application/x-www-form-urlencoded`
L15463: **响应数据类型**:`*/*`
L15466: **接口描述**:
L15472: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L15473: | -------- | -------- | ----- | -------- | -------- | ------ |
L15474: |param|角色数据权限表|query|true|BaseRoleDataScopeQueryParam|BaseRoleDataScopeQueryParam|
L15475: |&emsp;&emsp;page|页码，不传是默认为1||false|integer(int32)||
L15476: |&emsp;&emsp;perPage|每页数量，不传是默认为10||false|integer(int32)||
L15477: |&emsp;&emsp;roleId|角色ID||false|integer(int64)||
L15478: |&emsp;&emsp;flagSystemRole|系统角色:0-否,1-是||false|integer(int32)||
L15484: | 状态码 | 说明 | schema |
L15485: | -------- | -------- | ----- | 
L15486: |200|OK|EntityResultListBaseCompanyTreeResult|
L15492: | 参数名称 | 参数说明 | 类型 | schema |
L15493: | -------- | -------- | ----- |----- | 
L15494: |result|返回码|string||
L15495: |msg|错误信息|string||
L15496: |extInfo|扩展信息|string||
L15497: |rows|结果对象|array|BaseCompanyTreeResult|
L15498: |&emsp;&emsp;companyType|公司类型 来源字典（companyType）|string||
L15499: |&emsp;&emsp;flagCheck|是否勾选|boolean||
L15500: |&emsp;&emsp;list|公司列表|array|BaseCompanyListResult|
L15501: |&emsp;&emsp;&emsp;&emsp;id|主键id|integer(int64)||
L15502: |&emsp;&emsp;&emsp;&emsp;companyName|公司名称|string||
L15503: |&emsp;&emsp;&emsp;&emsp;companyCode|公司编码|string||
L15504: |&emsp;&emsp;&emsp;&emsp;companyType|公司类型 来源字典（companyType）|string||
L15505: |&emsp;&emsp;&emsp;&emsp;companyTypeName|公司类型名称|string||
L15506: |&emsp;&emsp;&emsp;&emsp;remark|备注|string||
L15507: |&emsp;&emsp;&emsp;&emsp;sortOrder|排序 越小越靠前|integer(int32)||
L15508: |&emsp;&emsp;&emsp;&emsp;flagSystemState|系统状态:0-停用,1-可用|integer(int32)||
L15509: |&emsp;&emsp;&emsp;&emsp;scope|作用域：1-智能外呼;2-云呼叫；多个以逗号分隔|string||
L15510: |&emsp;&emsp;&emsp;&emsp;enterpriseId|AliCti 账号|string||
L15511: |&emsp;&emsp;&emsp;&emsp;businessType|商用/试用类型:1-商用,2-试用|integer(int32)||
L15512: |&emsp;&emsp;&emsp;&emsp;businessTypeName|商用/试用类型名称|string||
L15513: |&emsp;&emsp;&emsp;&emsp;serviceStatus|服务状态: 0-未开通 1-待生效 2-有效 3-已过期|integer(int32)||
L15514: |&emsp;&emsp;&emsp;&emsp;serviceStatusName|服务状态名称|string||
L15515: |&emsp;&emsp;&emsp;&emsp;flagCheck|是否勾选|boolean||
L15516: |&emsp;&emsp;&emsp;&emsp;modifiedDate|更新时间|string(date-time)||
L15517: |&emsp;&emsp;&emsp;&emsp;modifier|更新人|string||
L15518: |&emsp;&emsp;&emsp;&emsp;callControlStatus|呼叫状态： 1-可发起 0-不可发起|integer(int32)||
L15519: |&emsp;&emsp;&emsp;&emsp;callControlStatusCn|呼叫状态|string||
L15520: |&emsp;&emsp;&emsp;&emsp;largeModelFrozenMinutes|大模型冻结分钟数|number||
L15521: |&emsp;&emsp;&emsp;&emsp;smallFrozenMinutes|小模型冻结分钟数|number||
L15522: |&emsp;&emsp;&emsp;&emsp;validStartDate|有效期开始时间|string(date-time)||
L15523: |&emsp;&emsp;&emsp;&emsp;validEndDate|有效期结束时间|string(date-time)||
L15524: |&emsp;&emsp;&emsp;&emsp;totalUseableMinutes|总可用分钟数|number||
L15525: |&emsp;&emsp;&emsp;&emsp;totalFrozenMinutes|总冻结分钟数|number||
L15526: |&emsp;&emsp;&emsp;&emsp;totalConsumedMinutes|累计消耗分钟数|number||
L15527: |success||boolean||
```

## L15795 · POST /base/auth/phone-login
原文L15795–L15878；Wiki `lib-平台通用服务认证与用户接口`。

```text
L15798: **接口地址**:`/base/auth/phone-login`
L15801: **请求方式**:`POST`
L15804: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L15807: **响应数据类型**:`*/*`
L15810: **接口描述**:
L15831: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L15832: | -------- | -------- | ----- | -------- | -------- | ------ |
L15833: |authMobileLoginParam|AuthMobileLoginParam|body|true|AuthMobileLoginParam|AuthMobileLoginParam|
L15834: |&emsp;&emsp;phone|手机号||false|string||
L15835: |&emsp;&emsp;scene|短信场景||false|string||
L15836: |&emsp;&emsp;ip|ip||false|string||
L15837: |&emsp;&emsp;code|短信验证码||false|string||
L15838: |&emsp;&emsp;seriesCode|批次号，发送短信的时候接口返回||false|string||
L15839: |&emsp;&emsp;companyId|所属公司ID||false|integer(int64)||
L15845: | 状态码 | 说明 | schema |
L15846: | -------- | -------- | ----- | 
L15847: |200|OK|EntityResultLoginAuthResult|
L15853: | 参数名称 | 参数说明 | 类型 | schema |
L15854: | -------- | -------- | ----- |----- | 
L15855: |result|返回码|string||
L15856: |msg|错误信息|string||
L15857: |extInfo|扩展信息|string||
L15858: |rows||LoginAuthResult|LoginAuthResult|
L15859: |&emsp;&emsp;token||string||
L15860: |&emsp;&emsp;refreshToken||string||
L15861: |success||boolean||
```

## L15879 · POST /base/auth/logout-callback
原文L15879–L15930；Wiki `lib-平台通用服务认证与用户接口`。

```text
L15882: **接口地址**:`/base/auth/logout-callback`
L15885: **请求方式**:`POST`
L15888: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L15891: **响应数据类型**:`*/*`
L15894: **接口描述**:
L15906: | 状态码 | 说明 | schema |
L15907: | -------- | -------- | ----- | 
L15908: |200|OK|OptResult|
L15914: | 参数名称 | 参数说明 | 类型 | schema |
L15915: | -------- | -------- | ----- |----- | 
L15916: |result|返回码|string||
L15917: |msg|错误信息|string||
L15918: |success||boolean||
```

## L15983 · GET /base/auth/resources
原文L15983–L16043；Wiki `lib-平台通用服务认证与用户接口`。

```text
L15986: **接口地址**:`/base/auth/resources`
L15989: **请求方式**:`GET`
L15992: **请求数据类型**:`application/x-www-form-urlencoded`
L15995: **响应数据类型**:`*/*`
L15998: **接口描述**:
L16004: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L16005: | -------- | -------- | ----- | -------- | -------- | ------ |
L16006: |accountId||query|true|string||
L16012: | 状态码 | 说明 | schema |
L16013: | -------- | -------- | ----- | 
L16014: |200|OK|EntityResultAccessResourcesInfo|
L16020: | 参数名称 | 参数说明 | 类型 | schema |
L16021: | -------- | -------- | ----- |----- | 
L16022: |result|返回码|string||
L16023: |msg|错误信息|string||
L16024: |extInfo|扩展信息|string||
L16025: |rows||AccessResourcesInfo|AccessResourcesInfo|
L16026: |&emsp;&emsp;uris||array|string|
L16027: |success||boolean||
```

## L16044 · GET /base/auth/resource-and-role
原文L16044–L16106；Wiki `lib-平台通用服务认证与用户接口`。

```text
L16047: **接口地址**:`/base/auth/resource-and-role`
L16050: **请求方式**:`GET`
L16053: **请求数据类型**:`application/x-www-form-urlencoded`
L16056: **响应数据类型**:`*/*`
L16059: **接口描述**:
L16071: | 状态码 | 说明 | schema |
L16072: | -------- | -------- | ----- | 
L16073: |200|OK|EntityResultListAccessRoleResourcesInfo|
L16079: | 参数名称 | 参数说明 | 类型 | schema |
L16080: | -------- | -------- | ----- |----- | 
L16081: |result|返回码|string||
L16082: |msg|错误信息|string||
L16083: |extInfo|扩展信息|string||
L16084: |rows|结果对象|array|AccessRoleResourcesInfo|
L16085: |&emsp;&emsp;uri||string||
L16086: |&emsp;&emsp;roles||array|string|
L16087: |success||boolean||
```

## L16107 · GET /base/auth/login
原文L16107–L16179；Wiki `lib-平台通用服务认证与用户接口`。

```text
L16110: **接口地址**:`/base/auth/login`
L16113: **请求方式**:`GET`
L16116: **请求数据类型**:`application/x-www-form-urlencoded`
L16119: **响应数据类型**:`*/*`
L16122: **接口描述**:
L16128: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L16129: | -------- | -------- | ----- | -------- | -------- | ------ |
L16130: |accountName||query|true|string||
L16136: | 状态码 | 说明 | schema |
L16137: | -------- | -------- | ----- | 
L16138: |200|OK|EntityResultAccountInfoObject|
L16144: | 参数名称 | 参数说明 | 类型 | schema |
L16145: | -------- | -------- | ----- |----- | 
L16146: |result|返回码|string||
L16147: |msg|错误信息|string||
L16148: |extInfo|扩展信息|string||
L16149: |rows||AccountInfoObject|AccountInfoObject|
L16150: |&emsp;&emsp;accountId||string||
L16151: |&emsp;&emsp;accountName||string||
L16152: |&emsp;&emsp;password||string||
L16153: |&emsp;&emsp;nickname||string||
L16154: |&emsp;&emsp;accountStatus||string||
L16155: |&emsp;&emsp;authorities||array|string|
L16156: |&emsp;&emsp;extObj||object||
L16157: |success||boolean||
```

## L16180 · GET /base/auth/loginByCode
原文L16180–L16242；Wiki `lib-平台通用服务认证与用户接口`。

```text
L16183: **接口地址**:`/base/auth/loginByCode`
L16186: **请求方式**:`GET`
L16189: **请求数据类型**:`application/x-www-form-urlencoded`
L16192: **响应数据类型**:`*/*`
L16195: **接口描述**:
L16201: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L16202: | -------- | -------- | ----- | -------- | -------- | ------ |
L16203: |code||query|true|string||
L16209: | 状态码 | 说明 | schema |
L16210: | -------- | -------- | ----- | 
L16211: |200|OK|EntityResultLoginAuthResult|
L16217: | 参数名称 | 参数说明 | 类型 | schema |
L16218: | -------- | -------- | ----- |----- | 
L16219: |result|返回码|string||
L16220: |msg|错误信息|string||
L16221: |extInfo|扩展信息|string||
L16222: |rows||LoginAuthResult|LoginAuthResult|
L16223: |&emsp;&emsp;token||string||
L16224: |&emsp;&emsp;refreshToken||string||
L16225: |success||boolean||
```

## L16515 · GET /base/user-menu/mine-menu
原文L16515–L16632；Wiki `lib-平台通用服务角色菜单与数据权限接口`。

```text
L16518: **接口地址**:`/base/user-menu/mine-menu`
L16521: **请求方式**:`GET`
L16524: **请求数据类型**:`application/x-www-form-urlencoded`
L16527: **响应数据类型**:`*/*`
L16530: **接口描述**:
L16542: | 状态码 | 说明 | schema |
L16543: | -------- | -------- | ----- | 
L16544: |200|OK|EntityResultListSystemUserMenuResult|
L16550: | 参数名称 | 参数说明 | 类型 | schema |
L16551: | -------- | -------- | ----- |----- | 
L16552: |result|返回码|string||
L16553: |msg|错误信息|string||
L16554: |extInfo|扩展信息|string||
L16555: |rows|结果对象|array|SystemUserMenuResult|
L16556: |&emsp;&emsp;id|主键id|integer(int64)||
L16557: |&emsp;&emsp;parentId|上级菜单ID|integer(int64)||
L16558: |&emsp;&emsp;parentName|父类名称|string||
L16559: |&emsp;&emsp;childrend|所有父级ID:存储JSON数组|array|SystemUserMenuResult|
L16560: |&emsp;&emsp;treeLevel|层次级别:0级是首级|integer(int32)||
L16561: |&emsp;&emsp;menuName|菜单名称|string||
L16562: |&emsp;&emsp;menuType|菜单类型:来源字典（menuType）|string||
L16563: |&emsp;&emsp;menuTypeName|菜单类型名称|string||
L16564: |&emsp;&emsp;linkAddress|前端路由|string||
L16565: |&emsp;&emsp;linkTarget|链接目标|string||
L16566: |&emsp;&emsp;authorityCode|权限标识|string||
L16567: |&emsp;&emsp;menuWeight|菜单权重:来源字典（menuWeight）|string||
L16568: |&emsp;&emsp;menuWeightName|菜单权重名称|string||
L16569: |&emsp;&emsp;remark|备注|string||
L16570: |&emsp;&emsp;sortOrder|排序 选项排序 越小越靠前|integer(int32)||
L16571: |&emsp;&emsp;flagVisible|是否可见:0-隐藏,1-显示|integer(int32)||
L16572: |&emsp;&emsp;flagSystemState|系统状态:0-停用,1-可用|integer(int32)||
L16573: |&emsp;&emsp;scopeList|可见范围列表|array|integer(int32)|
L16574: |success||boolean||
```

## L16633 · GET /base/user-menu/list
原文L16633–L16731；Wiki `lib-平台通用服务角色菜单与数据权限接口`。

```text
L16636: **接口地址**:`/base/user-menu/list`
L16639: **请求方式**:`GET`
L16642: **请求数据类型**:`application/x-www-form-urlencoded`
L16645: **响应数据类型**:`*/*`
L16648: **接口描述**:
L16654: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L16655: | -------- | -------- | ----- | -------- | -------- | ------ |
L16656: |param|用户菜单权限表|query|true|BaseUserMenuQueryParam|BaseUserMenuQueryParam|
L16657: |&emsp;&emsp;needModifyPw|登录后是否需要修改密码||false|boolean||
L16658: |&emsp;&emsp;companyType|||false|string||
L16659: |&emsp;&emsp;systemId|系统ID||false|string||
L16660: |&emsp;&emsp;dealerCode|经销商编码||false|string||
L16661: |&emsp;&emsp;dealerName|经销商名称||false|string||
L16662: |&emsp;&emsp;dealerId|关联ID经销商id，用户类型为经销商时才有值||false|integer(int64)||
L16663: |&emsp;&emsp;userId|用户ID||false|integer(int64)||
L16664: |&emsp;&emsp;menuId|菜单ID||false|integer(int64)||
L16665: |&emsp;&emsp;flagCheck|是否勾选:0-取消勾选,1-勾选||false|integer(int32)||
L16671: | 状态码 | 说明 | schema |
L16672: | -------- | -------- | ----- | 
L16673: |200|OK|EntityResultListBaseMenuTreeResult|
L16679: | 参数名称 | 参数说明 | 类型 | schema |
L16680: | -------- | -------- | ----- |----- | 
L16681: |result|返回码|string||
L16682: |msg|错误信息|string||
L16683: |extInfo|扩展信息|string||
L16684: |rows|结果对象|array|BaseMenuTreeResult|
L16685: |&emsp;&emsp;id|主键id|integer(int64)||
L16686: |&emsp;&emsp;parentId|上级菜单ID|integer(int64)||
L16687: |&emsp;&emsp;treeLevel|层次级别:0级是首级|integer(int32)||
L16688: |&emsp;&emsp;menuName|菜单名称|string||
L16689: |&emsp;&emsp;menuType|菜单类型:来源字典（menuType）|string||
L16690: |&emsp;&emsp;flagCheck|是否勾选|boolean||
L16691: |&emsp;&emsp;children|下一级菜单|array|BaseMenuTreeResult|
L16692: |success||boolean||
```

## L16779 · GET /base/tenant-billing/my-usage-task-detail/{companyId}
原文L16779–L16856；Wiki `lib-平台通用服务公司与充值计费接口`。

```text
L16782: **接口地址**:`/base/tenant-billing/my-usage-task-detail/{companyId}`
L16785: **请求方式**:`GET`
L16788: **请求数据类型**:`application/x-www-form-urlencoded`
L16791: **响应数据类型**:`*/*`
L16794: **接口描述**:
L16800: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L16801: | -------- | -------- | ----- | -------- | -------- | ------ |
L16802: |companyId||path|true|integer(int64)||
L16803: |settleDate|结算日期 yyyy-MM-dd|query|true|string(date-time)||
L16809: | 状态码 | 说明 | schema |
L16810: | -------- | -------- | ----- | 
L16811: |200|OK|ResultVOListIccaiTenantUsageTaskDetailResult|
L16817: | 参数名称 | 参数说明 | 类型 | schema |
L16818: | -------- | -------- | ----- |----- | 
L16819: |result|返回码|string||
L16820: |msg|错误信息|string||
L16821: |extInfo|扩展信息|string||
L16822: |pageindex|当前页|integer(int32)|integer(int32)|
L16823: |pages|总页数|integer(int32)|integer(int32)|
L16824: |records|总记录数|integer(int32)|integer(int32)|
L16825: |rows|结果对象|array|IccaiTenantUsageTaskDetailResult|
L16826: |&emsp;&emsp;sceneId|任务ID（场景ID iccai_tenant_fund_log.scene_id）|integer(int64)||
L16827: |&emsp;&emsp;taskName|任务名称（关联 iccai_business_scene.scene_title）|string||
L16828: |&emsp;&emsp;connectedCount|已接通数|integer(int64)||
L16829: |&emsp;&emsp;unconnectedCount|未接通数|integer(int64)||
L16830: |&emsp;&emsp;consumedMinutes|消耗分钟数（已接通不足1分钟按1分钟计）|number||
L16831: |success||boolean||
```

## L16857 · GET /base/tenant-billing/my-usage-daily/{companyId}
原文L16857–L16929；Wiki `lib-平台通用服务公司与充值计费接口`。

```text
L16860: **接口地址**:`/base/tenant-billing/my-usage-daily/{companyId}`
L16863: **请求方式**:`GET`
L16866: **请求数据类型**:`application/x-www-form-urlencoded`
L16869: **响应数据类型**:`*/*`
L16872: **接口描述**:
L16878: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L16879: | -------- | -------- | ----- | -------- | -------- | ------ |
L16880: |companyId||path|true|integer(int64)||
L16881: |page|页码|query|false|integer(int32)||
L16882: |perPage|每页数量|query|false|integer(int32)||
L16888: | 状态码 | 说明 | schema |
L16889: | -------- | -------- | ----- | 
L16890: |200|OK|ResultVOListIccaiTenantUsageDailyResult|
L16896: | 参数名称 | 参数说明 | 类型 | schema |
L16897: | -------- | -------- | ----- |----- | 
L16898: |result|返回码|string||
L16899: |msg|错误信息|string||
L16900: |extInfo|扩展信息|string||
L16901: |pageindex|当前页|integer(int32)|integer(int32)|
L16902: |pages|总页数|integer(int32)|integer(int32)|
L16903: |records|总记录数|integer(int32)|integer(int32)|
L16904: |rows|结果对象|array|IccaiTenantUsageDailyResult|
L16905: |&emsp;&emsp;settlementDate|结算日期|string(date-time)||
L16906: |&emsp;&emsp;consumedMinutes|当日消耗通话分钟数|number||
L16907: |success||boolean||
```

## L16930 · GET /base/tenant-billing/my-recharge-records
原文L16930–L17062；Wiki `lib-平台通用服务公司与充值计费接口`。

```text
L16933: **接口地址**:`/base/tenant-billing/my-recharge-records`
L16936: **请求方式**:`GET`
L16939: **请求数据类型**:`application/x-www-form-urlencoded`
L16942: **响应数据类型**:`*/*`
L16945: **接口描述**:
L16951: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L16952: | -------- | -------- | ----- | -------- | -------- | ------ |
L16953: |id|主键id|query|false|string||
L16954: |companyId|租户ID|query|false|string||
L16955: |tenantLevel|租户层级：1-总部 2-门店|query|false|string||
L16956: |orderNo|充值单号|query|false|string||
L16957: |linkType|关联类型: 1-商用, 2-试用单|query|false|string||
L16958: |storeCode|门店编码|query|false|string||
L16959: |storeName|门店名称|query|false|string||
L16960: |feeType|计费类型: 1-标准套餐, 2-试用套餐, 3-话费充值包|query|false|string||
L16961: |packageName|套餐名称（与feeType对应）|query|false|string||
L16962: |cycleDays|周期天数|query|false|string||
L16963: |totalAmount|充值金额|query|false|string||
L16964: |associateTime|关联时间|query|false|string||
L16965: |remark|备注信息|query|false|string||
L16966: |validStartDate|有效期开始时间|query|false|string||
L16967: |validEndDate|有效期结束时间|query|false|string||
L16968: |lastValidStartDate|上次有效期开始时间|query|false|string||
L16969: |lastValidEndDate|上次有效期结束时间|query|false|string||
L16970: |activeStatus|生效状态： 1:生效 0-不生效|query|false|string||
L16971: |activeDate|点击生效时间|query|false|string||
L16972: |page|页码，不传是默认为1|query|false|string||
L16973: |perPage|每页数量，不传是默认为10|query|false|string||
L16979: | 状态码 | 说明 | schema |
L16980: | -------- | -------- | ----- | 
L16981: |200|OK|ResultVOListIccaiTenantOrderListResult|
L16987: | 参数名称 | 参数说明 | 类型 | schema |
L16988: | -------- | -------- | ----- |----- | 
L16989: |result|返回码|string||
L16990: |msg|错误信息|string||
L16991: |extInfo|扩展信息|string||
L16992: |pageindex|当前页|integer(int32)|integer(int32)|
L16993: |pages|总页数|integer(int32)|integer(int32)|
L16994: |records|总记录数|integer(int32)|integer(int32)|
L16995: |rows|结果对象|array|IccaiTenantOrderListResult|
L16996: |&emsp;&emsp;id|主键id|integer(int64)||
L16997: |&emsp;&emsp;companyId|租户ID|integer(int64)||
L16998: |&emsp;&emsp;tenantLevel|租户层级：1-总部 2-门店|integer(int32)||
L16999: |&emsp;&emsp;orderNo|充值单号|string||
L17000: |&emsp;&emsp;linkType|关联类型: 1-商用, 2-试用单|integer(int32)||
L17001: |&emsp;&emsp;totalCreditedMinutes|总入账分钟数|number||
L17002: |&emsp;&emsp;feeType|计费类型: 1-标准套餐, 2-试用套餐, 3-话费充值包|integer(int32)||
L17003: |&emsp;&emsp;packageName|套餐名称（与feeType对应）|string||
L17004: |&emsp;&emsp;totalAmount|充值金额|number||
L17005: |&emsp;&emsp;quantity|购买数量（话费充值包时使用）|integer(int32)||
L17006: |&emsp;&emsp;associateTime|关联时间|string(date-time)||
L17007: |&emsp;&emsp;remark|备注信息|string||
L17008: |&emsp;&emsp;validStartDate|有效期开始时间|string(date-time)||
L17009: |&emsp;&emsp;validEndDate|有效期结束时间|string(date-time)||
L17010: |&emsp;&emsp;lastValidStartDate|上次有效期开始时间|string(date-time)||
L17011: |&emsp;&emsp;lastValidEndDate|上次有效期结束时间|string(date-time)||
L17012: |&emsp;&emsp;lastUseableMinutes|上次可用分钟数|number||
L17013: |&emsp;&emsp;activeStatus|生效状态： 1:生效 0-不生效|integer(int32)||
L17014: |&emsp;&emsp;activeDate|点击生效时间|string(date-time)||
L17015: |&emsp;&emsp;creator|创建者|string||
L17016: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L17017: |&emsp;&emsp;modifier|修改者|string||
L17018: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L17019: |success||boolean||
```

## L17063 · GET /base/tenant-billing/my-package/{companyId}
原文L17063–L17238；Wiki `lib-平台通用服务公司与充值计费接口`。

```text
L17066: **接口地址**:`/base/tenant-billing/my-package/{companyId}`
L17069: **请求方式**:`GET`
L17072: **请求数据类型**:`application/x-www-form-urlencoded`
L17075: **响应数据类型**:`*/*`
L17078: **接口描述**:
L17084: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L17085: | -------- | -------- | ----- | -------- | -------- | ------ |
L17086: |companyId||path|true|integer(int64)||
L17092: | 状态码 | 说明 | schema |
L17093: | -------- | -------- | ----- | 
L17094: |200|OK|ResultVOIccaiTenantBillingDetailsResult|
L17100: | 参数名称 | 参数说明 | 类型 | schema |
L17101: | -------- | -------- | ----- |----- | 
L17102: |result|返回码|string||
L17103: |msg|错误信息|string||
L17104: |extInfo|扩展信息|string||
L17105: |pageindex|当前页|integer(int32)|integer(int32)|
L17106: |pages|总页数|integer(int32)|integer(int32)|
L17107: |records|总记录数|integer(int32)|integer(int32)|
L17108: |rows||IccaiTenantBillingDetailsResult|IccaiTenantBillingDetailsResult|
L17109: |&emsp;&emsp;id|主键id|integer(int64)||
L17110: |&emsp;&emsp;companyId|关联租户ID|integer(int64)||
L17111: |&emsp;&emsp;validStartDate|有效期开始时间|string(date-time)||
L17112: |&emsp;&emsp;validEndDate|有效期结束时间|string(date-time)||
L17113: |&emsp;&emsp;callControlStatus|呼叫状态： 1-可发起 0-不可发起|integer(int32)||
L17114: |&emsp;&emsp;totalUseableMinutes|总可用分钟数|number||
L17115: |&emsp;&emsp;totalFrozenMinutes|总冻结分钟数|number||
L17116: |&emsp;&emsp;totalConsumedMinutes|累计消耗分钟数|number||
L17117: |&emsp;&emsp;creator|创建者|string||
L17118: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L17119: |&emsp;&emsp;modifier|修改者|string||
L17120: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L17121: |&emsp;&emsp;largeModelFrozenMinutes|大模型冻结分钟数|number||
L17122: |&emsp;&emsp;smallModelFrozenMinutes|小模型冻结分钟数|number||
L17123: |&emsp;&emsp;serviceStatus|服务状态：0-未开通 1-待生效 2-有效 3-已过期|integer(int32)||
L17124: |&emsp;&emsp;serviceStatusDesc|服务状态中文描述|string||
L17125: |&emsp;&emsp;packageName|套餐名称|string||
L17126: |&emsp;&emsp;feeType|计费类型: 1-标准套餐, 2-试用套餐, 3-话费充值包|integer(int32)||
L17127: |&emsp;&emsp;linkType|关联类型: 1-商用, 2-试用单|integer(int32)||
L17128: |&emsp;&emsp;totalCreditedMinutes|总入账分钟数|number||
L17129: |&emsp;&emsp;totalAmount|充值金额|number||
L17130: |&emsp;&emsp;quantity|购买数量（话费充值包时使用）|integer(int32)||
L17131: |&emsp;&emsp;lastUseableMinutes|上次可用分钟数|number||
L17132: |&emsp;&emsp;activeStatus|生效状态： 1:生效 0-不生效|integer(int32)||
L17133: |&emsp;&emsp;orderNo|充值单号|string||
L17134: |&emsp;&emsp;orderList|已购买的套餐列表（含标准套餐、试用套餐、话费充值包）|array|IccaiTenantOrderResult|
L17135: |&emsp;&emsp;&emsp;&emsp;id|主键id|integer(int64)||
L17136: |&emsp;&emsp;&emsp;&emsp;companyId|租户ID|integer(int64)||
L17137: |&emsp;&emsp;&emsp;&emsp;tenantLevel|租户层级：1-总部 2-门店|integer(int32)||
L17138: |&emsp;&emsp;&emsp;&emsp;orderNo|充值单号|string||
L17139: |&emsp;&emsp;&emsp;&emsp;linkType|关联类型: 1-商用, 2-试用单|integer(int32)||
L17140: |&emsp;&emsp;&emsp;&emsp;storeCode|门店编码|string||
L17141: |&emsp;&emsp;&emsp;&emsp;totalAmount|充值金额|number||
L17142: |&emsp;&emsp;&emsp;&emsp;storeName|门店名称|string||
L17143: |&emsp;&emsp;&emsp;&emsp;totalCreditedMinutes|总入账分钟数|number||
L17144: |&emsp;&emsp;&emsp;&emsp;feeType|计费类型: 1-标准套餐, 2-试用套餐, 3-话费充值包|integer(int32)||
L17145: |&emsp;&emsp;&emsp;&emsp;packageName|套餐名称（与feeType对应）|string||
L17146: |&emsp;&emsp;&emsp;&emsp;quantity|购买数量（话费充值包时使用）|integer(int32)||
L17147: |&emsp;&emsp;&emsp;&emsp;cycleDays|周期天数|integer(int32)||
L17148: |&emsp;&emsp;&emsp;&emsp;associateTime|关联时间|string(date-time)||
L17149: |&emsp;&emsp;&emsp;&emsp;remark|备注信息|string||
L17150: |&emsp;&emsp;&emsp;&emsp;validStartDate|有效期开始时间|string(date-time)||
L17151: |&emsp;&emsp;&emsp;&emsp;validEndDate|有效期结束时间|string(date-time)||
L17152: |&emsp;&emsp;&emsp;&emsp;lastValidStartDate|上次有效期开始时间|string(date-time)||
L17153: |&emsp;&emsp;&emsp;&emsp;lastValidEndDate|上次有效期结束时间|string(date-time)||
L17154: |&emsp;&emsp;&emsp;&emsp;lastUseableMinutes|上次可用分钟数|number||
L17155: |&emsp;&emsp;&emsp;&emsp;activeStatus|生效状态： 1:生效 0-不生效|integer(int32)||
L17156: |&emsp;&emsp;&emsp;&emsp;activeDate|点击生效时间|string(date-time)||
L17157: |&emsp;&emsp;&emsp;&emsp;creator|创建者|string||
L17158: |&emsp;&emsp;&emsp;&emsp;createdDate|创建时间|string(date-time)||
L17159: |&emsp;&emsp;&emsp;&emsp;modifier|修改者|string||
L17160: |&emsp;&emsp;&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L17161: |&emsp;&emsp;totalCreditedMinutesSum|所有生效套餐总入账分钟数（汇总）|number||
L17162: |&emsp;&emsp;totalAmountSum|所有生效套餐总充值金额（汇总）|number||
L17163: |success||boolean||
```

## L17420 · GET /base/role-menu/list
原文L17420–L17513；Wiki `lib-平台通用服务角色菜单与数据权限接口`。

```text
L17423: **接口地址**:`/base/role-menu/list`
L17426: **请求方式**:`GET`
L17429: **请求数据类型**:`application/x-www-form-urlencoded`
L17432: **响应数据类型**:`*/*`
L17435: **接口描述**:
L17441: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L17442: | -------- | -------- | ----- | -------- | -------- | ------ |
L17443: |param|角色菜单权限表|query|true|BaseRoleMenuQueryParam|BaseRoleMenuQueryParam|
L17444: |&emsp;&emsp;needModifyPw|登录后是否需要修改密码||false|boolean||
L17445: |&emsp;&emsp;companyType|||false|string||
L17446: |&emsp;&emsp;systemId|系统ID||false|string||
L17447: |&emsp;&emsp;dealerCode|经销商编码||false|string||
L17448: |&emsp;&emsp;dealerName|经销商名称||false|string||
L17449: |&emsp;&emsp;dealerId|关联ID经销商id，用户类型为经销商时才有值||false|integer(int64)||
L17450: |&emsp;&emsp;id|主键id||false|integer(int64)||
L17451: |&emsp;&emsp;roleId|角色ID||false|integer(int64)||
L17452: |&emsp;&emsp;menuId|菜单ID||false|integer(int64)||
L17458: | 状态码 | 说明 | schema |
L17459: | -------- | -------- | ----- | 
L17460: |200|OK|EntityResultListBaseMenuTreeResult|
L17466: | 参数名称 | 参数说明 | 类型 | schema |
L17467: | -------- | -------- | ----- |----- | 
L17468: |result|返回码|string||
L17469: |msg|错误信息|string||
L17470: |extInfo|扩展信息|string||
L17471: |rows|结果对象|array|BaseMenuTreeResult|
L17472: |&emsp;&emsp;id|主键id|integer(int64)||
L17473: |&emsp;&emsp;parentId|上级菜单ID|integer(int64)||
L17474: |&emsp;&emsp;treeLevel|层次级别:0级是首级|integer(int32)||
L17475: |&emsp;&emsp;menuName|菜单名称|string||
L17476: |&emsp;&emsp;menuType|菜单类型:来源字典（menuType）|string||
L17477: |&emsp;&emsp;flagCheck|是否勾选|boolean||
L17478: |&emsp;&emsp;children|下一级菜单|array|BaseMenuTreeResult|
L17479: |success||boolean||
```

