# AI 服务接口原始定义定向摘录

查询日期：2026-10-16T10:04:26+08:00；只读 active `raw/iccai-tob-service-api@v1`。

原始净化文件：/Users/huhaowen/Documents/00_automatic_prototype/01_WIKI_LLM/raw/external/iccai-tob-service-api/v1/iccai-tob-service.md；SHA256：1bf7cf82df9d96ec23c7b65840b68f5dda04d106f0e499be4f8f9cc2a151942e。

仅摘录本期核验相关的接口声明、请求参数、响应状态及响应参数；未复制示例或执行请求。每行保留原始行号，原文空表和缺失项仍未知。不是完整站点API或生产部署证明。

## L82 · POST /create
原文：L82–L146；Wiki：`lib-智能外呼服务任务与场景接口`；模块：iccai-business-type-controller。

```text
L84: **接口地址**:`/create`
L86: **请求方式**:`POST`
L88: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L90: **响应数据类型**:`*/*`
L92: **接口描述**:
L106: | 参数名称                       | 参数说明   | 请求类型 | 是否必须  | 数据类型                       | schema                     |
L107: | -------------------------- | ------ | ---- | ----- | -------------------------- | -------------------------- |
L108: | iccaiBusinessTypeSaveParam | 业务类型   | body | true  | IccaiBusinessTypeSaveParam | IccaiBusinessTypeSaveParam |
L109: |   id                       | 主键id   |      | false | integer(int64)             |                            |
L110: |   name                     | 业务类型名称 |      | false | string                     |                            |
L111: |   code                     | 业务类型编码 |      | false | string                     |                            |
L115: | 状态码 | 说明 | schema       |
L116: | --- | -- | ------------ |
L117: | 200 | OK | ResultVOVoid |
L121: | 参数名称      | 参数说明 | 类型             | schema         |
L122: | --------- | ---- | -------------- | -------------- |
L123: | result    | 返回码  | string         |                |
L124: | msg       | 错误信息 | string         |                |
L125: | extInfo   | 扩展信息 | string         |                |
L126: | pageindex | 当前页  | integer(int32) | integer(int32) |
L127: | pages     | 总页数  | integer(int32) | integer(int32) |
L128: | records   | 总记录数 | integer(int32) | integer(int32) |
L129: | rows      | 结果对象 | object         |                |
L130: | success   |      | boolean        |                |
```

## L147 · GET /list
原文：L147–L219；Wiki：`lib-智能外呼服务任务与场景接口`；模块：iccai-business-type-controller。

```text
L149: **接口地址**:`/list`
L151: **请求方式**:`GET`
L153: **请求数据类型**:`application/x-www-form-urlencoded`
L155: **响应数据类型**:`*/*`
L157: **接口描述**:
L161: | 参数名称    | 参数说明          | 请求类型  | 是否必须  | 数据类型   | schema |
L162: | ------- | ------------- | ----- | ----- | ------ | ------ |
L163: | id      | 主键id          | query | false | string |        |
L164: | name    | 业务类型名称        | query | false | string |        |
L165: | code    | 业务类型编码        | query | false | string |        |
L166: | page    | 页码，不传是默认为1    | query | false | string |        |
L167: | perPage | 每页数量，不传是默认为10 | query | false | string |        |
L171: | 状态码 | 说明 | schema                                  |
L172: | --- | -- | --------------------------------------- |
L173: | 200 | OK | ResultVOListIccaiBusinessTypeListResult |
L177: | 参数名称           | 参数说明   | 类型                | schema                      |
L178: | -------------- | ------ | ----------------- | --------------------------- |
L179: | result         | 返回码    | string            |                             |
L180: | msg            | 错误信息   | string            |                             |
L181: | extInfo        | 扩展信息   | string            |                             |
L182: | pageindex      | 当前页    | integer(int32)    | integer(int32)              |
L183: | pages          | 总页数    | integer(int32)    | integer(int32)              |
L184: | records        | 总记录数   | integer(int32)    | integer(int32)              |
L185: | rows           | 结果对象   | array             | IccaiBusinessTypeListResult |
L186: |   id           | 主键id   | integer(int64)    |                             |
L187: |   name         | 业务类型名称 | string            |                             |
L188: |   code         | 业务类型编码 | string            |                             |
L189: |   creator      | 创建者    | string            |                             |
L190: |   createdDate  | 创建时间   | string(date-time) |                             |
L191: |   modifier     | 修改者    | string            |                             |
L192: |   modifiedDate | 修改时间   | string(date-time) |                             |
L193: | success        |        | boolean           |                             |
```

## L2156 · GET /tob/supplier-config/list
原文：L2156–L2245；Wiki：`lib-智能外呼服务线路与供应商接口`；模块：外呼供应商表相关接口。

```text
L2159: **接口地址**:`/tob/supplier-config/list`
L2162: **请求方式**:`GET`
L2165: **请求数据类型**:`application/x-www-form-urlencoded`
L2168: **响应数据类型**:`*/*`
L2171: **接口描述**:
L2177: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L2178: | -------- | -------- | ----- | -------- | -------- | ------ |
L2179: |id|主键id|query|false|string||
L2180: |code|编码|query|false|string||
L2181: |name|名称|query|false|string||
L2182: |status|是否启用 0-否 1-是|query|false|string||
L2183: |page|页码，不传是默认为1|query|false|string||
L2184: |perPage|每页数量，不传是默认为10|query|false|string||
L2190: | 状态码 | 说明 | schema |
L2191: | -------- | -------- | ----- | 
L2192: |200|OK|ResultVOListIccaiSupplierConfigListResult|
L2198: | 参数名称 | 参数说明 | 类型 | schema |
L2199: | -------- | -------- | ----- |----- | 
L2200: |result|返回码|string||
L2201: |msg|错误信息|string||
L2202: |extInfo|扩展信息|string||
L2203: |pageindex|当前页|integer(int32)|integer(int32)|
L2204: |pages|总页数|integer(int32)|integer(int32)|
L2205: |records|总记录数|integer(int32)|integer(int32)|
L2206: |rows|结果对象|array|IccaiSupplierConfigListResult|
L2207: |&emsp;&emsp;id|主键id|integer(int64)||
L2208: |&emsp;&emsp;localCode|本地编码|string||
L2209: |&emsp;&emsp;name|名称|string||
L2210: |&emsp;&emsp;status|是否启用 0-否 1-是|integer(int32)||
L2211: |&emsp;&emsp;intentLevelCount|意向标签数|integer(int32)||
L2212: |&emsp;&emsp;creator|创建者|string||
L2213: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L2214: |&emsp;&emsp;modifier|修改者|string||
L2215: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L2216: |success||boolean||
```

## L2994 · POST /tob/scene-type-config/create
原文：L2994–L3072；Wiki：`lib-智能外呼服务任务与场景接口`；模块：外呼场景类型表相关接口。

```text
L2997: **接口地址**:`/tob/scene-type-config/create`
L3000: **请求方式**:`POST`
L3003: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L3006: **响应数据类型**:`*/*`
L3009: **接口描述**:
L3027: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L3028: | -------- | -------- | ----- | -------- | -------- | ------ |
L3029: |iccaiSceneTypeConfigSaveParam|外呼场景类型表|body|true|IccaiSceneTypeConfigSaveParam|IccaiSceneTypeConfigSaveParam|
L3030: |&emsp;&emsp;id|主键id||false|integer(int64)||
L3031: |&emsp;&emsp;name|名称||false|string||
L3032: |&emsp;&emsp;status|是否启用 0-否 1-是||false|integer(int32)||
L3038: | 状态码 | 说明 | schema |
L3039: | -------- | -------- | ----- | 
L3040: |200|OK|ResultVOVoid|
L3046: | 参数名称 | 参数说明 | 类型 | schema |
L3047: | -------- | -------- | ----- |----- | 
L3048: |result|返回码|string||
L3049: |msg|错误信息|string||
L3050: |extInfo|扩展信息|string||
L3051: |pageindex|当前页|integer(int32)|integer(int32)|
L3052: |pages|总页数|integer(int32)|integer(int32)|
L3053: |records|总记录数|integer(int32)|integer(int32)|
L3054: |rows|结果对象|object||
L3055: |success||boolean||
```

## L3073 · GET /tob/scene-type-config/list
原文：L3073–L3160；Wiki：`lib-智能外呼服务任务与场景接口`；模块：外呼场景类型表相关接口。

```text
L3076: **接口地址**:`/tob/scene-type-config/list`
L3079: **请求方式**:`GET`
L3082: **请求数据类型**:`application/x-www-form-urlencoded`
L3085: **响应数据类型**:`*/*`
L3088: **接口描述**:
L3094: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L3095: | -------- | -------- | ----- | -------- | -------- | ------ |
L3096: |id|主键id|query|false|string||
L3097: |code|编码|query|false|string||
L3098: |name|名称|query|false|string||
L3099: |status|是否启用 0-否 1-是|query|false|string||
L3100: |page|页码，不传是默认为1|query|false|string||
L3101: |perPage|每页数量，不传是默认为10|query|false|string||
L3107: | 状态码 | 说明 | schema |
L3108: | -------- | -------- | ----- | 
L3109: |200|OK|ResultVOListIccaiSceneTypeConfigListResult|
L3115: | 参数名称 | 参数说明 | 类型 | schema |
L3116: | -------- | -------- | ----- |----- | 
L3117: |result|返回码|string||
L3118: |msg|错误信息|string||
L3119: |extInfo|扩展信息|string||
L3120: |pageindex|当前页|integer(int32)|integer(int32)|
L3121: |pages|总页数|integer(int32)|integer(int32)|
L3122: |records|总记录数|integer(int32)|integer(int32)|
L3123: |rows|结果对象|array|IccaiSceneTypeConfigListResult|
L3124: |&emsp;&emsp;id|主键id|integer(int64)||
L3125: |&emsp;&emsp;localCode|本地编码|string||
L3126: |&emsp;&emsp;name|名称|string||
L3127: |&emsp;&emsp;status|是否启用 0-否 1-是|integer(int32)||
L3128: |&emsp;&emsp;creator|创建者|string||
L3129: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L3130: |&emsp;&emsp;modifier|修改者|string||
L3131: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L3132: |success||boolean||
```

## L3476 · GET /tob/scene-info/list
原文：L3476–L3569；Wiki：`lib-智能外呼服务任务与场景接口`；模块：iccai-scene-info-controller。

```text
L3479: **接口地址**:`/tob/scene-info/list`
L3482: **请求方式**:`GET`
L3485: **请求数据类型**:`application/x-www-form-urlencoded`
L3488: **响应数据类型**:`*/*`
L3491: **接口描述**:
L3497: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L3498: | -------- | -------- | ----- | -------- | -------- | ------ |
L3499: |id|主键id|query|false|string||
L3500: |sceneId|业务场景ID|query|false|string||
L3501: |fieldName|字段名称|query|false|string||
L3502: |paramName|参数名|query|false|string||
L3503: |isNecessary|是否必填 0-否 1-是|query|false|string||
L3504: |infoType|信息类型 1-场景传入信息 2-场景提取信息|query|false|string||
L3505: |page|页码，不传是默认为1|query|false|string||
L3506: |perPage|每页数量，不传是默认为10|query|false|string||
L3512: | 状态码 | 说明 | schema |
L3513: | -------- | -------- | ----- | 
L3514: |200|OK|ResultVOListIccaiSceneInfoListResult|
L3520: | 参数名称 | 参数说明 | 类型 | schema |
L3521: | -------- | -------- | ----- |----- | 
L3522: |result|返回码|string||
L3523: |msg|错误信息|string||
L3524: |extInfo|扩展信息|string||
L3525: |pageindex|当前页|integer(int32)|integer(int32)|
L3526: |pages|总页数|integer(int32)|integer(int32)|
L3527: |records|总记录数|integer(int32)|integer(int32)|
L3528: |rows|结果对象|array|IccaiSceneInfoListResult|
L3529: |&emsp;&emsp;id|主键id|integer(int64)||
L3530: |&emsp;&emsp;sceneId|业务场景ID|integer(int64)||
L3531: |&emsp;&emsp;fieldName|字段名称|string||
L3532: |&emsp;&emsp;paramName|参数名|string||
L3533: |&emsp;&emsp;isNecessary|是否必填 0-否 1-是|integer(int32)||
L3534: |&emsp;&emsp;infoType|信息类型 1-场景传入信息 2-场景提取信息|integer(int32)||
L3535: |&emsp;&emsp;creator|创建者|string||
L3536: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L3537: |&emsp;&emsp;modifier|修改者|string||
L3538: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L3539: |success||boolean||
```

## L3570 · GET /tob/scene-info/detail/{id}
原文：L3570–L3642；Wiki：`lib-智能外呼服务任务与场景接口`；模块：iccai-scene-info-controller。

```text
L3573: **接口地址**:`/tob/scene-info/detail/{id}`
L3576: **请求方式**:`GET`
L3579: **请求数据类型**:`application/x-www-form-urlencoded`
L3582: **响应数据类型**:`*/*`
L3585: **接口描述**:
L3591: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L3592: | -------- | -------- | ----- | -------- | -------- | ------ |
L3593: |id|要查询的记录id|path|true|integer(int64)||
L3599: | 状态码 | 说明 | schema |
L3600: | -------- | -------- | ----- | 
L3601: |200|OK|ResultVOIccaiSceneInfoResult|
L3607: | 参数名称 | 参数说明 | 类型 | schema |
L3608: | -------- | -------- | ----- |----- | 
L3609: |result|返回码|string||
L3610: |msg|错误信息|string||
L3611: |extInfo|扩展信息|string||
L3612: |pageindex|当前页|integer(int32)|integer(int32)|
L3613: |pages|总页数|integer(int32)|integer(int32)|
L3614: |records|总记录数|integer(int32)|integer(int32)|
L3615: |rows||IccaiSceneInfoResult|IccaiSceneInfoResult|
L3616: |&emsp;&emsp;fieldName|字段名称|string||
L3617: |&emsp;&emsp;paramName|参数名|string||
L3618: |&emsp;&emsp;isNecessary|是否必填 0-否 1-是|integer(int32)||
L3619: |&emsp;&emsp;infoType|信息类型 1-场景传入信息 2-场景提取信息|integer(int32)||
L3620: |success||boolean||
```

## L4127 · GET /tob/route-config/list
原文：L4127–L4262；Wiki：`lib-智能外呼服务线路与供应商接口`；模块：线路配置相关接口。

```text
L4130: **接口地址**:`/tob/route-config/list`
L4133: **请求方式**:`GET`
L4136: **请求数据类型**:`application/x-www-form-urlencoded`
L4139: **响应数据类型**:`*/*`
L4142: **接口描述**:
L4148: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L4149: | -------- | -------- | ----- | -------- | -------- | ------ |
L4150: |id|主键id|query|false|string||
L4151: |companyId|租户ID|query|false|string||
L4152: |routeName|线路名称|query|false|string||
L4153: |routeSupplier|线路供应商|query|false|string||
L4154: |routeDesc|线路描述|query|false|string||
L4155: |sipAddress|SIP地址|query|false|string||
L4156: |sipPort|SIP端口|query|false|string||
L4157: |mainCallNumber|主叫号码|query|false|string||
L4158: |mediaAddress|媒体地址|query|false|string||
L4159: |mediaPort|媒体端口|query|false|string||
L4160: |concurrencyQuantity|并发总数|query|false|string||
L4161: |callTimeBegin|呼叫时段-开始|query|false|string||
L4162: |callTimeEnd|呼叫时段-结束|query|false|string||
L4163: |callFrequencyDay|呼叫频次-每天 0-不限制|query|false|string||
L4164: |callFrequencyMonth|呼叫频次-每月 0-不限制|query|false|string||
L4165: |callBlindSpot|呼叫盲区|query|false|string||
L4166: |coverageCities|覆盖城市|query|false|string||
L4167: |isPriority|是否最优先 0-否 1-是|query|false|string||
L4168: |isCertified|是否已认证线路 0-否 1-是|query|false|string||
L4169: |status|是否启用 0-否 1-是|query|false|string||
L4170: |page|页码，不传是默认为1|query|false|string||
L4171: |perPage|每页数量，不传是默认为10|query|false|string||
L4177: | 状态码 | 说明 | schema |
L4178: | -------- | -------- | ----- | 
L4179: |200|OK|ResultVOListIccaiRouteConfigListResult|
L4185: | 参数名称 | 参数说明 | 类型 | schema |
L4186: | -------- | -------- | ----- |----- | 
L4187: |result|返回码|string||
L4188: |msg|错误信息|string||
L4189: |extInfo|扩展信息|string||
L4190: |pageindex|当前页|integer(int32)|integer(int32)|
L4191: |pages|总页数|integer(int32)|integer(int32)|
L4192: |records|总记录数|integer(int32)|integer(int32)|
L4193: |rows|结果对象|array|IccaiRouteConfigListResult|
L4194: |&emsp;&emsp;id|主键id|integer(int64)||
L4195: |&emsp;&emsp;companyId|租户ID|integer(int64)||
L4196: |&emsp;&emsp;routeName|线路名称|string||
L4197: |&emsp;&emsp;routeSupplier|线路供应商|string||
L4198: |&emsp;&emsp;routeDesc|线路描述|string||
L4199: |&emsp;&emsp;sipAddress|SIP地址|string||
L4200: |&emsp;&emsp;sipPort|SIP端口|string||
L4201: |&emsp;&emsp;mainCallNumber|主叫号码|string||
L4202: |&emsp;&emsp;mediaAddress|媒体地址|string||
L4203: |&emsp;&emsp;mediaPort|媒体端口|string||
L4204: |&emsp;&emsp;concurrencyQuantity|并发总数|integer(int32)||
L4205: |&emsp;&emsp;callTimeBegin|呼叫时段-开始|string||
L4206: |&emsp;&emsp;callTimeEnd|呼叫时段-结束|string||
L4207: |&emsp;&emsp;callFrequencyDay|呼叫频次-每天 0-不限制|integer(int32)||
L4208: |&emsp;&emsp;callFrequencyMonth|呼叫频次-每月 0-不限制|integer(int32)||
L4209: |&emsp;&emsp;callBlindSpot|呼叫盲区|string||
L4210: |&emsp;&emsp;coverageCities|覆盖城市|string||
L4211: |&emsp;&emsp;isPriority|是否最优先 0-否 1-是|integer(int32)||
L4212: |&emsp;&emsp;isCertified|是否已认证线路 0-否 1-是|integer(int32)||
L4213: |&emsp;&emsp;status|是否启用 0-否 1-是|integer(int32)||
L4214: |&emsp;&emsp;creator|创建者|string||
L4215: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L4216: |&emsp;&emsp;modifier|修改者|string||
L4217: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L4218: |success||boolean||
```

## L6909 · GET /tob/line-business-type/list
原文：L6909–L6994；Wiki：`lib-智能外呼服务任务与场景接口`；模块：业务类型表相关接口。

```text
L6912: **接口地址**:`/tob/line-business-type/list`
L6915: **请求方式**:`GET`
L6918: **请求数据类型**:`application/x-www-form-urlencoded`
L6921: **响应数据类型**:`*/*`
L6924: **接口描述**:
L6930: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L6931: | -------- | -------- | ----- | -------- | -------- | ------ |
L6932: |id|主键id|query|false|string||
L6933: |businessTypeName|业务类型名称|query|false|string||
L6934: |businessTypeCode|业务类型编码|query|false|string||
L6935: |timeOrder|更新时间排序 0-倒序 1-升序|query|false|string||
L6936: |page|页码，不传是默认为1|query|false|string||
L6937: |perPage|每页数量，不传是默认为10|query|false|string||
L6943: | 状态码 | 说明 | schema |
L6944: | -------- | -------- | ----- | 
L6945: |200|OK|ResultVOListIccaiLineBusinessTypeListResult|
L6951: | 参数名称 | 参数说明 | 类型 | schema |
L6952: | -------- | -------- | ----- |----- | 
L6953: |result|返回码|string||
L6954: |msg|错误信息|string||
L6955: |extInfo|扩展信息|string||
L6956: |pageindex|当前页|integer(int32)|integer(int32)|
L6957: |pages|总页数|integer(int32)|integer(int32)|
L6958: |records|总记录数|integer(int32)|integer(int32)|
L6959: |rows|结果对象|array|IccaiLineBusinessTypeListResult|
L6960: |&emsp;&emsp;id|主键id|integer(int64)||
L6961: |&emsp;&emsp;businessTypeName|业务类型名称|string||
L6962: |&emsp;&emsp;businessTypeCode|业务类型编码|string||
L6963: |&emsp;&emsp;creator|创建者|string||
L6964: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L6965: |&emsp;&emsp;modifier|修改者|string||
L6966: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L6967: |success||boolean||
```

## L8639 · PUT /tob/intent-level-config/update
原文：L8639–L8731；Wiki：`lib-智能外呼服务标签与拦截接口`；模块：外呼意向标签表相关接口。

```text
L8642: **接口地址**:`/tob/intent-level-config/update`
L8645: **请求方式**:`PUT`
L8648: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L8651: **响应数据类型**:`*/*`
L8654: **接口描述**:
L8679: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L8680: | -------- | -------- | ----- | -------- | -------- | ------ |
L8681: |iccaiIntentLevelConfigUpdateParam|外呼意向标签表|body|true|IccaiIntentLevelConfigUpdateParam|IccaiIntentLevelConfigUpdateParam|
L8682: |&emsp;&emsp;id|主键id||false|integer(int64)||
L8683: |&emsp;&emsp;sceneTypeId|场景类型ID||false|integer(int64)||
L8684: |&emsp;&emsp;sceneTypeCode|场景类型||false|integer(int32)||
L8685: |&emsp;&emsp;supplierId|供应商ID||false|integer(int64)||
L8686: |&emsp;&emsp;supplierCode|供应商||false|integer(int32)||
L8687: |&emsp;&emsp;name|名称||false|string||
L8688: |&emsp;&emsp;bindCode|关联编码||false|string||
L8689: |&emsp;&emsp;companyTypeCode|租户类型 1-总部 2-门店||false|integer(int32)||
L8690: |&emsp;&emsp;status|是否启用 0-否 1-是||false|integer(int32)||
L8691: |&emsp;&emsp;sort|排序||false|integer(int32)||
L8697: | 状态码 | 说明 | schema |
L8698: | -------- | -------- | ----- | 
L8699: |200|OK|ResultVOVoid|
L8705: | 参数名称 | 参数说明 | 类型 | schema |
L8706: | -------- | -------- | ----- |----- | 
L8707: |result|返回码|string||
L8708: |msg|错误信息|string||
L8709: |extInfo|扩展信息|string||
L8710: |pageindex|当前页|integer(int32)|integer(int32)|
L8711: |pages|总页数|integer(int32)|integer(int32)|
L8712: |records|总记录数|integer(int32)|integer(int32)|
L8713: |rows|结果对象|object||
L8714: |success||boolean||
```

## L8815 · POST /tob/intent-level-config/create
原文：L8815–L8907；Wiki：`lib-智能外呼服务标签与拦截接口`；模块：外呼意向标签表相关接口。

```text
L8818: **接口地址**:`/tob/intent-level-config/create`
L8821: **请求方式**:`POST`
L8824: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L8827: **响应数据类型**:`*/*`
L8830: **接口描述**:
L8855: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L8856: | -------- | -------- | ----- | -------- | -------- | ------ |
L8857: |iccaiIntentLevelConfigSaveParam|外呼意向标签表|body|true|IccaiIntentLevelConfigSaveParam|IccaiIntentLevelConfigSaveParam|
L8858: |&emsp;&emsp;id|主键id||false|integer(int64)||
L8859: |&emsp;&emsp;sceneTypeId|场景类型ID||false|integer(int64)||
L8860: |&emsp;&emsp;sceneTypeCode|场景类型||false|integer(int32)||
L8861: |&emsp;&emsp;supplierId|供应商ID||false|integer(int64)||
L8862: |&emsp;&emsp;supplierCode|供应商||false|integer(int32)||
L8863: |&emsp;&emsp;name|名称||false|string||
L8864: |&emsp;&emsp;bindCode|关联编码||false|string||
L8865: |&emsp;&emsp;companyTypeCode|租户类型 1-总部 2-门店||false|integer(int32)||
L8866: |&emsp;&emsp;status|是否启用 0-否 1-是||false|integer(int32)||
L8867: |&emsp;&emsp;sort|排序||false|integer(int32)||
L8873: | 状态码 | 说明 | schema |
L8874: | -------- | -------- | ----- | 
L8875: |200|OK|ResultVOVoid|
L8881: | 参数名称 | 参数说明 | 类型 | schema |
L8882: | -------- | -------- | ----- |----- | 
L8883: |result|返回码|string||
L8884: |msg|错误信息|string||
L8885: |extInfo|扩展信息|string||
L8886: |pageindex|当前页|integer(int32)|integer(int32)|
L8887: |pages|总页数|integer(int32)|integer(int32)|
L8888: |records|总记录数|integer(int32)|integer(int32)|
L8889: |rows|结果对象|object||
L8890: |success||boolean||
```

## L8908 · GET /tob/intent-level-config/local-intent-level
原文：L8908–L9009；Wiki：`lib-智能外呼服务标签与拦截接口`；模块：外呼意向标签表相关接口。

```text
L8911: **接口地址**:`/tob/intent-level-config/local-intent-level`
L8914: **请求方式**:`GET`
L8917: **请求数据类型**:`application/x-www-form-urlencoded`
L8920: **响应数据类型**:`*/*`
L8923: **接口描述**:
L8929: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L8930: | -------- | -------- | ----- | -------- | -------- | ------ |
L8931: |sceneType||query|false|integer(int32)||
L8932: |companyType||query|false|integer(int32)||
L8938: | 状态码 | 说明 | schema |
L8939: | -------- | -------- | ----- | 
L8940: |200|OK|ResultVOListIccaiIntentLevelConfig|
L8946: | 参数名称 | 参数说明 | 类型 | schema |
L8947: | -------- | -------- | ----- |----- | 
L8948: |result|返回码|string||
L8949: |msg|错误信息|string||
L8950: |extInfo|扩展信息|string||
L8951: |pageindex|当前页|integer(int32)|integer(int32)|
L8952: |pages|总页数|integer(int32)|integer(int32)|
L8953: |records|总记录数|integer(int32)|integer(int32)|
L8954: |rows|结果对象|array|IccaiIntentLevelConfig|
L8955: |&emsp;&emsp;id||integer(int64)||
L8956: |&emsp;&emsp;enable||boolean||
L8957: |&emsp;&emsp;createdDate||string(date-time)||
L8958: |&emsp;&emsp;creator||string||
L8959: |&emsp;&emsp;modifiedDate||string(date-time)||
L8960: |&emsp;&emsp;modifier||string||
L8961: |&emsp;&emsp;sceneTypeId||integer(int64)||
L8962: |&emsp;&emsp;sceneType||integer(int32)||
L8963: |&emsp;&emsp;supplierId||integer(int64)||
L8964: |&emsp;&emsp;supplierCode||integer(int32)||
L8965: |&emsp;&emsp;code||string||
L8966: |&emsp;&emsp;name||string||
L8967: |&emsp;&emsp;localCode||string||
L8968: |&emsp;&emsp;bindCode||string||
L8969: |&emsp;&emsp;companyType||integer(int32)||
L8970: |&emsp;&emsp;status||integer(int32)||
L8971: |&emsp;&emsp;sort||integer(int32)||
L8972: |success||boolean||
```

## L9010 · GET /tob/intent-level-config/list
原文：L9010–L9114；Wiki：`lib-智能外呼服务标签与拦截接口`；模块：外呼意向标签表相关接口。

```text
L9013: **接口地址**:`/tob/intent-level-config/list`
L9016: **请求方式**:`GET`
L9019: **请求数据类型**:`application/x-www-form-urlencoded`
L9022: **响应数据类型**:`*/*`
L9025: **接口描述**:
L9031: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L9032: | -------- | -------- | ----- | -------- | -------- | ------ |
L9033: |sceneTypeId|场景类型ID|query|false|string||
L9034: |supplierId|供应商ID|query|false|string||
L9035: |searchWord|搜索关键词|query|false|string||
L9036: |companyType|租户类型 1-总部 2-门店|query|false|string||
L9037: |status|是否启用 0-否 1-是|query|false|string||
L9038: |supplierType|供应商类型 1-本地 2-供应商|query|false|string||
L9039: |page|页码，不传是默认为1|query|false|string||
L9040: |perPage|每页数量，不传是默认为10|query|false|string||
L9047: | 状态码 | 说明 | schema |
L9048: | -------- | -------- | ----- | 
L9049: |200|OK|ResultVOListIccaiIntentLevelConfigListResult|
L9055: | 参数名称 | 参数说明 | 类型 | schema |
L9056: | -------- | -------- | ----- |----- | 
L9057: |result|返回码|string||
L9058: |msg|错误信息|string||
L9059: |extInfo|扩展信息|string||
L9060: |pageindex|当前页|integer(int32)|integer(int32)|
L9061: |pages|总页数|integer(int32)|integer(int32)|
L9062: |records|总记录数|integer(int32)|integer(int32)|
L9063: |rows|结果对象|array|IccaiIntentLevelConfigListResult|
L9064: |&emsp;&emsp;id|主键id|integer(int64)||
L9065: |&emsp;&emsp;sceneTypeId|场景类型ID|integer(int64)||
L9066: |&emsp;&emsp;sceneType|场景类型|integer(int32)||
L9067: |&emsp;&emsp;supplierId|供应商ID|integer(int64)||
L9068: |&emsp;&emsp;supplierCode|供应商|integer(int32)||
L9069: |&emsp;&emsp;name|名称|string||
L9070: |&emsp;&emsp;localCode|本地编码|string||
L9071: |&emsp;&emsp;bindCode|关联编码|string||
L9072: |&emsp;&emsp;companyType|租户类型 1-总部 2-门店|integer(int32)||
L9073: |&emsp;&emsp;status|是否启用 0-否 1-是|integer(int32)||
L9074: |&emsp;&emsp;sort|排序|integer(int32)||
L9075: |&emsp;&emsp;creator|创建者|string||
L9076: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L9077: |&emsp;&emsp;modifier|修改者|string||
L9078: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L9079: |success||boolean||
```

## L9115 · GET /tob/intent-level-config/intent-level-parent-tree
原文：L9115–L9226；Wiki：`lib-智能外呼服务标签与拦截接口`；模块：外呼意向标签表相关接口。

```text
L9118: **接口地址**:`/tob/intent-level-config/intent-level-parent-tree`
L9121: **请求方式**:`GET`
L9124: **请求数据类型**:`application/x-www-form-urlencoded`
L9127: **响应数据类型**:`*/*`
L9130: **接口描述**:
L9136: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L9137: | -------- | -------- | ----- | -------- | -------- | ------ |
L9138: |supplierType||query|false|integer(int32)||
L9139: |supplierCode||query|false|integer(int32)||
L9145: | 状态码 | 说明 | schema |
L9146: | -------- | -------- | ----- | 
L9147: |200|OK|ResultVOListIntentLevelParentTreeResult|
L9153: | 参数名称 | 参数说明 | 类型 | schema |
L9154: | -------- | -------- | ----- |----- | 
L9155: |result|返回码|string||
L9156: |msg|错误信息|string||
L9157: |extInfo|扩展信息|string||
L9158: |pageindex|当前页|integer(int32)|integer(int32)|
L9159: |pages|总页数|integer(int32)|integer(int32)|
L9160: |records|总记录数|integer(int32)|integer(int32)|
L9161: |rows|结果对象|array|IntentLevelParentTreeResult|
L9162: |&emsp;&emsp;supplierId|供应商ID|integer(int64)||
L9163: |&emsp;&emsp;supplierCode|供应商编码|integer(int32)||
L9164: |&emsp;&emsp;supplierName|供应商名称|string||
L9165: |&emsp;&emsp;status|是否启用 0-否 1-是|integer(int32)||
L9166: |&emsp;&emsp;companyTypeList|租户类型列表|array|CompanyType|
L9167: |&emsp;&emsp;&emsp;&emsp;companyTypeCode|租户类型编码|integer(int32)||
L9168: |&emsp;&emsp;&emsp;&emsp;companyTypeName|租户类型名称|string||
L9169: |&emsp;&emsp;&emsp;&emsp;sceneTypeList|场景类型列表|array|SceneType|
L9170: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;sceneTypeId|场景类型ID|integer(int64)||
L9171: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;sceneTypeCode|场景类型编码|integer(int32)||
L9172: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;sceneTypeName|场景类型名称|string||
L9173: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;status|是否启用 0-否 1-是|integer(int32)||
L9174: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;intentLevelCount|意向标签数|integer(int32)||
L9175: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;companyTypeCode|租户类型编码|integer(int32)||
L9176: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;companyTypeName|租户类型名称|string||
L9177: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;supplierId|供应商ID|integer(int64)||
L9178: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;supplierCode|供应商编码|integer(int32)||
L9179: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;supplierType|供应商类型 1-本地 2-供应商|integer(int32)||
L9180: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;supplierName|供应商名称|string||
L9181: |success||boolean||
```

## L9227 · GET /tob/intent-level-config/detail/{id}
原文：L9227–L9321；Wiki：`lib-智能外呼服务标签与拦截接口`；模块：外呼意向标签表相关接口。

```text
L9230: **接口地址**:`/tob/intent-level-config/detail/{id}`
L9233: **请求方式**:`GET`
L9236: **请求数据类型**:`application/x-www-form-urlencoded`
L9239: **响应数据类型**:`*/*`
L9242: **接口描述**:
L9248: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L9249: | -------- | -------- | ----- | -------- | -------- | ------ |
L9250: |id|要查询的记录id|path|true|integer(int64)||
L9256: | 状态码 | 说明 | schema |
L9257: | -------- | -------- | ----- | 
L9258: |200|OK|ResultVOIccaiIntentLevelConfigResult|
L9264: | 参数名称 | 参数说明 | 类型 | schema |
L9265: | -------- | -------- | ----- |----- | 
L9266: |result|返回码|string||
L9267: |msg|错误信息|string||
L9268: |extInfo|扩展信息|string||
L9269: |pageindex|当前页|integer(int32)|integer(int32)|
L9270: |pages|总页数|integer(int32)|integer(int32)|
L9271: |records|总记录数|integer(int32)|integer(int32)|
L9272: |rows||IccaiIntentLevelConfigResult|IccaiIntentLevelConfigResult|
L9273: |&emsp;&emsp;id|主键id|integer(int64)||
L9274: |&emsp;&emsp;sceneTypeId|场景类型ID|integer(int64)||
L9275: |&emsp;&emsp;sceneType|场景类型|integer(int32)||
L9276: |&emsp;&emsp;supplierId|供应商ID|integer(int64)||
L9277: |&emsp;&emsp;supplierCode|供应商|integer(int32)||
L9278: |&emsp;&emsp;name|名称|string||
L9279: |&emsp;&emsp;localCode|本地编码|string||
L9280: |&emsp;&emsp;bindCode|关联编码|string||
L9281: |&emsp;&emsp;companyType|租户类型 1-总部 2-门店|integer(int32)||
L9282: |&emsp;&emsp;status|是否启用 0-否 1-是|integer(int32)||
L9283: |&emsp;&emsp;sort|排序|integer(int32)||
L9284: |&emsp;&emsp;creator|创建者|string||
L9285: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L9286: |&emsp;&emsp;modifier|修改者|string||
L9287: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L9288: |success||boolean||
```

## L9322 · DELETE /tob/intent-level-config/del/{id}
原文：L9322–L9388；Wiki：`lib-智能外呼服务标签与拦截接口`；模块：外呼意向标签表相关接口。

```text
L9325: **接口地址**:`/tob/intent-level-config/del/{id}`
L9328: **请求方式**:`DELETE`
L9331: **请求数据类型**:`application/x-www-form-urlencoded`
L9334: **响应数据类型**:`*/*`
L9337: **接口描述**:
L9343: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L9344: | -------- | -------- | ----- | -------- | -------- | ------ |
L9345: |id|要删除的记录id|path|true|integer(int64)||
L9351: | 状态码 | 说明 | schema |
L9352: | -------- | -------- | ----- | 
L9353: |200|OK|ResultVOVoid|
L9359: | 参数名称 | 参数说明 | 类型 | schema |
L9360: | -------- | -------- | ----- |----- | 
L9361: |result|返回码|string||
L9362: |msg|错误信息|string||
L9363: |extInfo|扩展信息|string||
L9364: |pageindex|当前页|integer(int32)|integer(int32)|
L9365: |pages|总页数|integer(int32)|integer(int32)|
L9366: |records|总记录数|integer(int32)|integer(int32)|
L9367: |rows|结果对象|object||
L9368: |success||boolean||
```

## L13635 · GET /tob/call-record/playAudio
原文：L13635–L13680；Wiki：`lib-智能外呼服务通话报表与计费接口`；模块：通话记录相关接口。

```text
L13638: **接口地址**:`/tob/call-record/playAudio`
L13641: **请求方式**:`GET`
L13644: **请求数据类型**:`application/x-www-form-urlencoded`
L13647: **响应数据类型**:`*/*`
L13650: **接口描述**:
L13656: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L13657: | -------- | -------- | ----- | -------- | -------- | ------ |
L13658: |callRecordId||query|true|integer(int64)||
L13664: | 状态码 | 说明 | schema |
L13665: | -------- | -------- | ----- | 
L13666: |200|OK||
```

## L13681 · GET /tob/call-record/page
原文：L13681–L13830；Wiki：`lib-智能外呼服务通话报表与计费接口`；模块：通话记录相关接口。

```text
L13684: **接口地址**:`/tob/call-record/page`
L13687: **请求方式**:`GET`
L13690: **请求数据类型**:`application/x-www-form-urlencoded`
L13693: **响应数据类型**:`*/*`
L13696: **接口描述**:
L13702: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L13703: | -------- | -------- | ----- | -------- | -------- | ------ |
L13704: |id|主键id|query|false|string||
L13705: |sceneId|业务场景ID|query|false|string||
L13706: |sceneTitle|场景名称|query|false|string||
L13707: |intelligentPlatformType|智能平台类型 1-冰兰 2-科大讯飞 3-一知|query|false|string||
L13708: |callPhoneListId|外呼名单ID|query|false|string||
L13709: |phone|号码|query|false|string||
L13710: |callResultStatus|外呼结果状态 1-已接通 2-无人接听 3-占线 4-拒接 5-空号 6-关机 7-停机 8-欠费 9-无法接通 10-黑名单过滤 11-拦截规则 12-待呼叫去重 13-分机号错误 14-呼叫受限 15-主叫欠费 16-呼损客户 17-外呼失败 18-转人工呼损 19-线路拦截|query|false|string||
L13711: |startCallDate|外呼开始时间|query|false|string||
L13712: |callStartTime|通话开始开始时间|query|false|string||
L13713: |callStartEndTime|通话开始结束时间|query|false|string||
L13714: |callEndStartTime|通话结束开始时间|query|false|string||
L13715: |callEndEndTime|通话结束结束时间|query|false|string||
L13716: |endCallDate|外呼结束时间|query|false|string||
L13717: |callDuration|通话时长|query|false|string||
L13718: |callSummary|外呼小结|query|false|string||
L13719: |finalNodeNumber|最后通话节点|query|false|string||
L13720: |sessionId|会话ID|query|false|string||
L13721: |audioUrl|录音文件|query|false|string||
L13722: |callParam|呼叫参数|query|false|string||
L13723: |callResult|呼叫结果|query|false|string||
L13724: |companyId|租户ID|query|false|string||
L13725: |startCallDateOrder|通话开始时间排序  0-倒序 1-升序|query|false|string||
L13726: |endCallDateOrder|通话结束时间排序  0-倒序 1-升序|query|false|string||
L13727: |sceneIds|场景ID列表|query|false|string||
L13728: |pageIndex|分页索引|query|false|string||
L13729: |page|页码，不传是默认为1|query|false|string||
L13730: |perPage|每页数量，不传是默认为10|query|false|string||
L13736: | 状态码 | 说明 | schema |
L13737: | -------- | -------- | ----- | 
L13738: |200|OK|ResultVOListIccaiCallRecordListResult|
L13744: | 参数名称 | 参数说明 | 类型 | schema |
L13745: | -------- | -------- | ----- |----- | 
L13746: |result|返回码|string||
L13747: |msg|错误信息|string||
L13748: |extInfo|扩展信息|string||
L13749: |pageindex|当前页|integer(int32)|integer(int32)|
L13750: |pages|总页数|integer(int32)|integer(int32)|
L13751: |records|总记录数|integer(int32)|integer(int32)|
L13752: |rows|结果对象|array|IccaiCallRecordListResult|
L13753: |&emsp;&emsp;id|主键id|integer(int64)||
L13754: |&emsp;&emsp;sceneId|业务场景ID|integer(int64)||
L13755: |&emsp;&emsp;sceneTitle|场景名称|string||
L13756: |&emsp;&emsp;sceneCode|场景编码|string||
L13757: |&emsp;&emsp;intelligentPlatformType|智能平台类型 1-冰兰 2-科大讯飞 3-一知|integer(int32)||
L13758: |&emsp;&emsp;intelligentPlatformTypeCn||string||
L13759: |&emsp;&emsp;callPhoneListId|外呼名单ID|integer(int64)||
L13760: |&emsp;&emsp;phone|号码|string||
L13761: |&emsp;&emsp;callResultStatus|外呼结果状态 1-已接通 2-无人接听 3-占线 4-拒接 5-空号 6-关机 7-停机 8-欠费 9-无法接通 10-黑名单过滤 11-拦截规则 12-待呼叫去重 13-分机号错误 14-呼叫受限 15-主叫欠费 16-呼损客户 17-外呼失败 18-转人工呼损 19-线路拦截|integer(int32)||
L13762: |&emsp;&emsp;callResultStatusCn|外呼结果状态中文|string||
L13763: |&emsp;&emsp;startCallDate|外呼开始时间|string(date-time)||
L13764: |&emsp;&emsp;endCallDate|外呼结束时间|string(date-time)||
L13765: |&emsp;&emsp;callDuration|通话时长|integer(int32)||
L13766: |&emsp;&emsp;callDurationStr|通话时长-时分秒|string||
L13767: |&emsp;&emsp;callSummary|外呼小结|string||
L13768: |&emsp;&emsp;finalNodeNumber|最后通话节点|string||
L13769: |&emsp;&emsp;sessionId|会话ID|string||
L13770: |&emsp;&emsp;audioUrl|录音文件|string||
L13771: |&emsp;&emsp;callParam|呼叫参数|string||
L13772: |&emsp;&emsp;callResult|呼叫结果  包含{单号、是否需要救援 0-否 1-是、是否结案 0-否 1-是}|string||
L13773: |&emsp;&emsp;creator|创建者|string||
L13774: |&emsp;&emsp;filterReason|过滤原因|string||
L13775: |&emsp;&emsp;filterDate|过滤时间|string(date-time)||
L13776: |&emsp;&emsp;failReason|失败原因|string||
L13777: |&emsp;&emsp;extraParam|额外参数|string||
L13778: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L13779: |&emsp;&emsp;modifier|修改者|string||
L13780: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L13781: |success||boolean||
```

## L13941 · GET /tob/call-record/detail/{id}
原文：L13941–L14087；Wiki：`lib-智能外呼服务通话报表与计费接口`；模块：通话记录相关接口。

```text
L13944: **接口地址**:`/tob/call-record/detail/{id}`
L13947: **请求方式**:`GET`
L13950: **请求数据类型**:`application/x-www-form-urlencoded`
L13953: **响应数据类型**:`*/*`
L13956: **接口描述**:
L13962: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L13963: | -------- | -------- | ----- | -------- | -------- | ------ |
L13964: |id|要查询的记录id|path|true|integer(int64)||
L13970: | 状态码 | 说明 | schema |
L13971: | -------- | -------- | ----- | 
L13972: |200|OK|ResultVOIccaiCallRecordResult|
L13978: | 参数名称 | 参数说明 | 类型 | schema |
L13979: | -------- | -------- | ----- |----- | 
L13980: |result|返回码|string||
L13981: |msg|错误信息|string||
L13982: |extInfo|扩展信息|string||
L13983: |pageindex|当前页|integer(int32)|integer(int32)|
L13984: |pages|总页数|integer(int32)|integer(int32)|
L13985: |records|总记录数|integer(int32)|integer(int32)|
L13986: |rows||IccaiCallRecordResult|IccaiCallRecordResult|
L13987: |&emsp;&emsp;id|主键id|integer(int64)||
L13988: |&emsp;&emsp;sceneId|业务场景ID|integer(int64)||
L13989: |&emsp;&emsp;sceneCode|场景编码|string||
L13990: |&emsp;&emsp;sceneTitle|场景名称|string||
L13991: |&emsp;&emsp;intelligentPlatformType|智能平台类型 1-冰兰 2-科大讯飞 3-一知|integer(int32)||
L13992: |&emsp;&emsp;callPhoneListId|外呼名单ID|integer(int64)||
L13993: |&emsp;&emsp;phone|号码|string||
L13994: |&emsp;&emsp;callResultStatus|外呼结果状态 1-已接通 2-无人接听 3-占线 4-拒接 5-空号 6-关机 7-停机 8-欠费 9-无法接通 10-黑名单过滤 11-拦截规则 12-待呼叫去重 13-分机号错误 14-呼叫受限 15-主叫欠费 16-呼损客户 17-外呼失败 18-转人工呼损 19-线路拦截|integer(int32)||
L13995: |&emsp;&emsp;startCallDate|外呼开始时间|string(date-time)||
L13996: |&emsp;&emsp;endCallDate|外呼结束时间|string(date-time)||
L13997: |&emsp;&emsp;callDuration|通话时长|integer(int32)||
L13998: |&emsp;&emsp;callDurationStr|通话时长-时分秒|string||
L13999: |&emsp;&emsp;callSummary|外呼小结|string||
L14000: |&emsp;&emsp;finalNodeNumber|最后通话节点|string||
L14001: |&emsp;&emsp;sessionId|会话ID|string||
L14002: |&emsp;&emsp;audioUrl|录音文件|string||
L14003: |&emsp;&emsp;callParam|呼叫参数|string||
L14004: |&emsp;&emsp;callResult|呼叫结果|string||
L14005: |&emsp;&emsp;creator|创建者|string||
L14006: |&emsp;&emsp;filterReason|过滤原因|string||
L14007: |&emsp;&emsp;filterDate|过滤时间|string(date-time)||
L14008: |&emsp;&emsp;failReason|失败原因|string||
L14009: |&emsp;&emsp;extraParam|额外参数|string||
L14010: |&emsp;&emsp;chatHistoryList|聊天记录|array|CallChatHistoryParam|
L14011: |&emsp;&emsp;&emsp;&emsp;clienteleServices|客服|string||
L14012: |&emsp;&emsp;&emsp;&emsp;client|客户|string||
L14013: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L14014: |&emsp;&emsp;modifier|修改者|string||
L14015: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L14016: |&emsp;&emsp;tags|标签|object||
L14017: |&emsp;&emsp;yiwishInfo||YiwishInfo|YiwishInfo|
L14018: |&emsp;&emsp;&emsp;&emsp;transferType|转人工状态 (NO_TRANSFER, “无转人工”),(TRANSFERED, “已转人工”),(TRANSFER_CUSTOMER_FAILED, “客户未等待”),(TRANSFER_MANUAL_FAILED, “人工未应答”),(TRANSFER_ERROR, “转人工失败”)|string||
L14019: |&emsp;&emsp;&emsp;&emsp;intentLevelName|意向标签|string||
L14020: |&emsp;&emsp;&emsp;&emsp;realIntentLevelName|人工意向标签|string||
L14021: |&emsp;&emsp;&emsp;&emsp;customerConcern|用户关注点，命中话术中问答知识设置的关键词|array|string|
L14022: |&emsp;&emsp;&emsp;&emsp;callRecordTagNames|通话标签名称，命中话术中设置的规则而收集到的客户标签，通话标签相当于客户标签的子集|array|string|
L14023: |&emsp;&emsp;&emsp;&emsp;customerTagIds|客户标签id|array|integer|
L14024: |&emsp;&emsp;&emsp;&emsp;customerTagNames|客户标签名称，手动打的标签＋通话标签|array|string|
L14025: |&emsp;&emsp;isDealer|是否门店住户|boolean||
L14026: |success||boolean||
```

## L14155 · PUT /tob/call-phone-list/update
原文：L14155–L14259；Wiki：`lib-智能外呼服务名单与黑名单接口`；模块：外呼名单相关接口。

```text
L14158: **接口地址**:`/tob/call-phone-list/update`
L14161: **请求方式**:`PUT`
L14164: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L14167: **响应数据类型**:`*/*`
L14170: **接口描述**:
L14201: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L14202: | -------- | -------- | ----- | -------- | -------- | ------ |
L14203: |iccaiCallPhoneListUpdateParam|外呼名单|body|true|IccaiCallPhoneListUpdateParam|IccaiCallPhoneListUpdateParam|
L14204: |&emsp;&emsp;id|主键id||false|integer(int64)||
L14205: |&emsp;&emsp;sceneId|业务场景ID||false|integer(int64)||
L14206: |&emsp;&emsp;phone|号码||false|string||
L14207: |&emsp;&emsp;execStatus|执行状态 1-已分配 2-待呼叫 3-已呼叫 4-已过滤 5-呼叫失败||false|integer(int32)||
L14208: |&emsp;&emsp;expectedChannelId|预计使用的通道ID||false|integer(int64)||
L14209: |&emsp;&emsp;channelId|使用的通道ID||false|integer(int64)||
L14210: |&emsp;&emsp;commitDate|号码提交时间||false|string(date-time)||
L14211: |&emsp;&emsp;calledTimes|已拨打次数||false|integer(int32)||
L14212: |&emsp;&emsp;finalCallResultStatus|最终外呼结果状态 1-已接通 2-无人接听 3-占线 4-拒接 5-空号 6-关机 7-停机 8-欠费 9-无法接通 10-黑名单过滤 11-拦截规则 12-待呼叫去重 13-分机号错误 14-呼叫受限 15-主叫欠费 16-呼损客户 17-外呼失败 18-转人工呼损 19-线路拦截||false|integer(int32)||
L14213: |&emsp;&emsp;finalCallDate|最终外呼时间||false|string(date-time)||
L14214: |&emsp;&emsp;callDuration|通话时长||false|integer(int32)||
L14215: |&emsp;&emsp;callSummary|外呼小结||false|string||
L14216: |&emsp;&emsp;finalNodeNumber|最后通话节点||false|string||
L14217: |&emsp;&emsp;filterReason|过滤原因||false|string||
L14218: |&emsp;&emsp;filterDate|过滤时间||false|string(date-time)||
L14219: |&emsp;&emsp;failReason|失败原因||false|string||
L14225: | 状态码 | 说明 | schema |
L14226: | -------- | -------- | ----- | 
L14227: |200|OK|ResultVOVoid|
L14233: | 参数名称 | 参数说明 | 类型 | schema |
L14234: | -------- | -------- | ----- |----- | 
L14235: |result|返回码|string||
L14236: |msg|错误信息|string||
L14237: |extInfo|扩展信息|string||
L14238: |pageindex|当前页|integer(int32)|integer(int32)|
L14239: |pages|总页数|integer(int32)|integer(int32)|
L14240: |records|总记录数|integer(int32)|integer(int32)|
L14241: |rows|结果对象|object||
L14242: |success||boolean||
```

## L14366 · GET /tob/call-phone-list/list
原文：L14366–L14492；Wiki：`lib-智能外呼服务名单与黑名单接口`；模块：外呼名单相关接口。

```text
L14369: **接口地址**:`/tob/call-phone-list/list`
L14372: **请求方式**:`GET`
L14375: **请求数据类型**:`application/x-www-form-urlencoded`
L14378: **响应数据类型**:`*/*`
L14381: **接口描述**:
L14387: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L14388: | -------- | -------- | ----- | -------- | -------- | ------ |
L14389: |id|主键id|query|false|string||
L14390: |sceneId|业务场景ID|query|false|string||
L14391: |phone|号码|query|false|string||
L14392: |execStatus|执行状态 1-已分配 2-待呼叫 3-已呼叫 4-已过滤 5-呼叫失败|query|false|string||
L14393: |expectedChannelId|预计使用的通道ID|query|false|string||
L14394: |channelId|使用的通道ID|query|false|string||
L14395: |commitDate|号码提交时间|query|false|string||
L14396: |calledTimes|已拨打次数|query|false|string||
L14397: |finalCallResultStatus|最终外呼结果状态 1-已接通 2-无人接听 3-占线 4-拒接 5-空号 6-关机 7-停机 8-欠费 9-无法接通 10-黑名单过滤 11-拦截规则 12-待呼叫去重 13-分机号错误 14-呼叫受限 15-主叫欠费 16-呼损客户 17-外呼失败 18-转人工呼损 19-线路拦截|query|false|string||
L14398: |finalCallDate|最终外呼时间|query|false|string||
L14399: |finalCallEndDate|最终外呼结束时间|query|false|string||
L14400: |callDuration|通话时长|query|false|string||
L14401: |callSummary|外呼小结|query|false|string||
L14402: |finalNodeNumber|最后通话节点|query|false|string||
L14403: |filterReason|过滤原因|query|false|string||
L14404: |filterDate|过滤时间|query|false|string||
L14405: |failReason|失败原因|query|false|string||
L14406: |timeOrder|时间排序 0-倒序 1-升序|query|false|string||
L14407: |pageIndex|分页索引|query|false|string||
L14408: |page|页码，不传是默认为1|query|false|string||
L14409: |perPage|每页数量，不传是默认为10|query|false|string||
L14415: | 状态码 | 说明 | schema |
L14416: | -------- | -------- | ----- | 
L14417: |200|OK|ResultVOListIccaiCallPhoneListListResult|
L14423: | 参数名称 | 参数说明 | 类型 | schema |
L14424: | -------- | -------- | ----- |----- | 
L14425: |result|返回码|string||
L14426: |msg|错误信息|string||
L14427: |extInfo|扩展信息|string||
L14428: |pageindex|当前页|integer(int32)|integer(int32)|
L14429: |pages|总页数|integer(int32)|integer(int32)|
L14430: |records|总记录数|integer(int32)|integer(int32)|
L14431: |rows|结果对象|array|IccaiCallPhoneListListResult|
L14432: |&emsp;&emsp;id|主键id|integer(int64)||
L14433: |&emsp;&emsp;sceneId|业务场景ID|integer(int64)||
L14434: |&emsp;&emsp;phone|号码|string||
L14435: |&emsp;&emsp;execStatus|执行状态 1-已分配 2-待呼叫 3-已呼叫 4-已过滤 5-呼叫失败|integer(int32)||
L14436: |&emsp;&emsp;expectedChannelId|预计使用的通道ID|integer(int64)||
L14437: |&emsp;&emsp;channelId|使用的通道ID|integer(int64)||
L14438: |&emsp;&emsp;commitDate|号码提交时间|string(date-time)||
L14439: |&emsp;&emsp;calledTimes|已拨打次数|integer(int32)||
L14440: |&emsp;&emsp;finalCallResultStatus|最终外呼结果状态 1-已接通 2-无人接听 3-占线 4-拒接 5-空号 6-关机 7-停机 8-欠费 9-无法接通 10-黑名单过滤 11-拦截规则 12-待呼叫去重 13-分机号错误 14-呼叫受限 15-主叫欠费 16-呼损客户 17-外呼失败 18-转人工呼损 19-线路拦截|integer(int32)||
L14441: |&emsp;&emsp;finalCallDate|最终外呼时间|string(date-time)||
L14442: |&emsp;&emsp;callDuration|通话时长|integer(int32)||
L14443: |&emsp;&emsp;callSummary|外呼小结|string||
L14444: |&emsp;&emsp;finalNodeNumber|最后通话节点|string||
L14445: |&emsp;&emsp;filterReason|过滤原因|string||
L14446: |&emsp;&emsp;filterDate|过滤时间|string(date-time)||
L14447: |&emsp;&emsp;failReason|失败原因|string||
L14448: |&emsp;&emsp;creator|创建者|string||
L14449: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L14450: |&emsp;&emsp;modifier|修改者|string||
L14451: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L14452: |success||boolean||
```

## L14919 · DELETE /tob/call-phone-list/del/{id}
原文：L14919–L14985；Wiki：`lib-智能外呼服务名单与黑名单接口`；模块：外呼名单相关接口。

```text
L14922: **接口地址**:`/tob/call-phone-list/del/{id}`
L14925: **请求方式**:`DELETE`
L14928: **请求数据类型**:`application/x-www-form-urlencoded`
L14931: **响应数据类型**:`*/*`
L14934: **接口描述**:
L14940: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L14941: | -------- | -------- | ----- | -------- | -------- | ------ |
L14942: |id|要删除的记录id|path|true|integer(int64)||
L14948: | 状态码 | 说明 | schema |
L14949: | -------- | -------- | ----- | 
L14950: |200|OK|ResultVOVoid|
L14956: | 参数名称 | 参数说明 | 类型 | schema |
L14957: | -------- | -------- | ----- |----- | 
L14958: |result|返回码|string||
L14959: |msg|错误信息|string||
L14960: |extInfo|扩展信息|string||
L14961: |pageindex|当前页|integer(int32)|integer(int32)|
L14962: |pages|总页数|integer(int32)|integer(int32)|
L14963: |records|总记录数|integer(int32)|integer(int32)|
L14964: |rows|结果对象|object||
L14965: |success||boolean||
```

## L16739 · GET /tob/call-account/list
原文：L16739–L16832；Wiki：`lib-智能外呼服务线路与供应商接口`；模块：外呼账号配置表相关接口。

```text
L16742: **接口地址**:`/tob/call-account/list`
L16745: **请求方式**:`GET`
L16748: **请求数据类型**:`application/x-www-form-urlencoded`
L16751: **响应数据类型**:`*/*`
L16754: **接口描述**:
L16760: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L16761: | -------- | -------- | ----- | -------- | -------- | ------ |
L16762: |id|主键id|query|false|string||
L16763: |appKey|appKey|query|false|string||
L16764: |appSecret|appSecret|query|false|string||
L16765: |tenantSign|tenantSign|query|false|string||
L16766: |token|token|query|false|string||
L16767: |encodingAesKey|encodingAESKey|query|false|string||
L16768: |page|页码，不传是默认为1|query|false|string||
L16769: |perPage|每页数量，不传是默认为10|query|false|string||
L16775: | 状态码 | 说明 | schema |
L16776: | -------- | -------- | ----- | 
L16777: |200|OK|ResultVOListIccaiCallAccountListResult|
L16783: | 参数名称 | 参数说明 | 类型 | schema |
L16784: | -------- | -------- | ----- |----- | 
L16785: |result|返回码|string||
L16786: |msg|错误信息|string||
L16787: |extInfo|扩展信息|string||
L16788: |pageindex|当前页|integer(int32)|integer(int32)|
L16789: |pages|总页数|integer(int32)|integer(int32)|
L16790: |records|总记录数|integer(int32)|integer(int32)|
L16791: |rows|结果对象|array|IccaiCallAccountListResult|
L16792: |&emsp;&emsp;id|主键id|integer(int64)||
L16793: |&emsp;&emsp;appKey|appKey|string||
L16794: |&emsp;&emsp;appSecret|appSecret|string||
L16795: |&emsp;&emsp;tenantSign|tenantSign|string||
L16796: |&emsp;&emsp;token|token|string||
L16797: |&emsp;&emsp;encodingAesKey|encodingAESKey|string||
L16798: |&emsp;&emsp;creator|创建者|string||
L16799: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L16800: |&emsp;&emsp;modifier|修改者|string||
L16801: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L16802: |success||boolean||
```

## L17051 · POST /tob/blacklist/blacklist-user/retry-sync
原文：L17051–L17127；Wiki：`lib-智能外呼服务名单与黑名单接口`；模块：黑名单用户相关接口。

```text
L17054: **接口地址**:`/tob/blacklist/blacklist-user/retry-sync`
L17057: **请求方式**:`POST`
L17060: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L17063: **响应数据类型**:`*/*`
L17066: **接口描述**:
L17083: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L17084: | -------- | -------- | ----- | -------- | -------- | ------ |
L17085: |blacklistRetrySyncParam|BlacklistRetrySyncParam|body|true|BlacklistRetrySyncParam|BlacklistRetrySyncParam|
L17086: |&emsp;&emsp;blacklistUserIds|黑名单ID列表||false|array|integer(int64)|
L17087: |&emsp;&emsp;sourceGroupId|黑名单分组ID||false|integer(int64)||
L17093: | 状态码 | 说明 | schema |
L17094: | -------- | -------- | ----- | 
L17095: |200|OK|ResultVOVoid|
L17101: | 参数名称 | 参数说明 | 类型 | schema |
L17102: | -------- | -------- | ----- |----- | 
L17103: |result|返回码|string||
L17104: |msg|错误信息|string||
L17105: |extInfo|扩展信息|string||
L17106: |pageindex|当前页|integer(int32)|integer(int32)|
L17107: |pages|总页数|integer(int32)|integer(int32)|
L17108: |records|总记录数|integer(int32)|integer(int32)|
L17109: |rows|结果对象|object||
L17110: |success||boolean||
```

## L17260 · POST /tob/blacklist/blacklist-user/create
原文：L17260–L17346；Wiki：`lib-智能外呼服务名单与黑名单接口`；模块：黑名单用户相关接口。

```text
L17263: **接口地址**:`/tob/blacklist/blacklist-user/create`
L17266: **请求方式**:`POST`
L17269: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L17272: **响应数据类型**:`*/*`
L17275: **接口描述**:
L17297: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L17298: | -------- | -------- | ----- | -------- | -------- | ------ |
L17299: |iccaiBlacklistUserSaveParam|黑名单用户|body|true|IccaiBlacklistUserSaveParam|IccaiBlacklistUserSaveParam|
L17300: |&emsp;&emsp;id|主键id||false|integer(int64)||
L17301: |&emsp;&emsp;groupId|分组ID||true|integer(int64)||
L17302: |&emsp;&emsp;phoneList|手机号||true|array|string|
L17303: |&emsp;&emsp;reason|添加原因||false|string||
L17304: |&emsp;&emsp;validityPeriodStartDate|有效期开始时间||false|string(date-time)||
L17305: |&emsp;&emsp;validityPeriodEndDate|有效期结束时间||false|string(date-time)||
L17306: |&emsp;&emsp;addType|添加类型 INTENT-意向保护 DECLINE-明确拒绝 OTHER-普通添加||false|string||
L17312: | 状态码 | 说明 | schema |
L17313: | -------- | -------- | ----- | 
L17314: |200|OK|ResultVOVoid|
L17320: | 参数名称 | 参数说明 | 类型 | schema |
L17321: | -------- | -------- | ----- |----- | 
L17322: |result|返回码|string||
L17323: |msg|错误信息|string||
L17324: |extInfo|扩展信息|string||
L17325: |pageindex|当前页|integer(int32)|integer(int32)|
L17326: |pages|总页数|integer(int32)|integer(int32)|
L17327: |records|总记录数|integer(int32)|integer(int32)|
L17328: |rows|结果对象|object||
L17329: |success||boolean||
```

## L17347 · GET /tob/blacklist/blacklist-user/page
原文：L17347–L17452；Wiki：`lib-智能外呼服务名单与黑名单接口`；模块：黑名单用户相关接口。

```text
L17350: **接口地址**:`/tob/blacklist/blacklist-user/page`
L17353: **请求方式**:`GET`
L17356: **请求数据类型**:`application/x-www-form-urlencoded`
L17359: **响应数据类型**:`*/*`
L17362: **接口描述**:
L17368: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L17369: | -------- | -------- | ----- | -------- | -------- | ------ |
L17370: |id|主键id|query|false|string||
L17371: |targetId|过滤指定分组ID|query|false|string||
L17372: |groupId|分组ID|query|false|string||
L17373: |phone|手机号|query|false|string||
L17374: |reason|添加原因|query|false|string||
L17375: |startTime|添加时间-开始时间|query|false|string||
L17376: |endTime|添加时间-结束时间|query|false|string||
L17377: |timeOrder|添加时间排序 0-倒序 1-升序|query|false|string||
L17378: |addType|添加类型 INTENT-意向保护 DECLINE-明确拒绝 OTHER-普通添加|query|false|string||
L17379: |page|页码，不传是默认为1|query|false|string||
L17380: |perPage|每页数量，不传是默认为10|query|false|string||
L17386: | 状态码 | 说明 | schema |
L17387: | -------- | -------- | ----- | 
L17388: |200|OK|ResultVOListIccaiBlacklistUserListResult|
L17394: | 参数名称 | 参数说明 | 类型 | schema |
L17395: | -------- | -------- | ----- |----- | 
L17396: |result|返回码|string||
L17397: |msg|错误信息|string||
L17398: |extInfo|扩展信息|string||
L17399: |pageindex|当前页|integer(int32)|integer(int32)|
L17400: |pages|总页数|integer(int32)|integer(int32)|
L17401: |records|总记录数|integer(int32)|integer(int32)|
L17402: |rows|结果对象|array|IccaiBlacklistUserListResult|
L17403: |&emsp;&emsp;id|主键id|integer(int64)||
L17404: |&emsp;&emsp;groupId|分组ID|integer(int64)||
L17405: |&emsp;&emsp;phone|手机号|string||
L17406: |&emsp;&emsp;reason|添加原因|string||
L17407: |&emsp;&emsp;addType|添加类型 INTENT-意向保护 DECLINE-明确拒绝 OTHER-普通添加|string||
L17408: |&emsp;&emsp;creator|创建者|string||
L17409: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L17410: |&emsp;&emsp;modifier|修改者|string||
L17411: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L17412: |&emsp;&emsp;syncPlatformList|平台同步信息|array|SyncPlatformUserResult|
L17413: |&emsp;&emsp;&emsp;&emsp;blacklistUserId|黑名单ID|integer(int64)||
L17414: |&emsp;&emsp;&emsp;&emsp;intelligentPlatformType|智能平台类型 1-冰兰 2-科大讯飞 3-一知 4-中科金 5-电声|integer(int32)||
L17415: |&emsp;&emsp;&emsp;&emsp;syncStatus|同步状态 0-未同步 1-已同步 2-同步失败 3-仅本地 4-同步中|integer(int32)||
L17416: |success||boolean||
```

## L17596 · DELETE /tob/blacklist/blacklist-user/del
原文：L17596–L17662；Wiki：`lib-智能外呼服务名单与黑名单接口`；模块：黑名单用户相关接口。

```text
L17599: **接口地址**:`/tob/blacklist/blacklist-user/del`
L17602: **请求方式**:`DELETE`
L17605: **请求数据类型**:`application/x-www-form-urlencoded`
L17608: **响应数据类型**:`*/*`
L17611: **接口描述**:
L17617: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L17618: | -------- | -------- | ----- | -------- | -------- | ------ |
L17619: |ids||query|true|array|integer|
L17625: | 状态码 | 说明 | schema |
L17626: | -------- | -------- | ----- | 
L17627: |200|OK|ResultVOVoid|
L17633: | 参数名称 | 参数说明 | 类型 | schema |
L17634: | -------- | -------- | ----- |----- | 
L17635: |result|返回码|string||
L17636: |msg|错误信息|string||
L17637: |extInfo|扩展信息|string||
L17638: |pageindex|当前页|integer(int32)|integer(int32)|
L17639: |pages|总页数|integer(int32)|integer(int32)|
L17640: |records|总记录数|integer(int32)|integer(int32)|
L17641: |rows|结果对象|object||
L17642: |success||boolean||
```

## L17746 · POST /tob/blacklist/blacklist-group/create
原文：L17746–L17828；Wiki：`lib-智能外呼服务名单与黑名单接口`；模块：黑名单分组相关接口。

```text
L17749: **接口地址**:`/tob/blacklist/blacklist-group/create`
L17752: **请求方式**:`POST`
L17755: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L17758: **响应数据类型**:`*/*`
L17761: **接口描述**:
L17781: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L17782: | -------- | -------- | ----- | -------- | -------- | ------ |
L17783: |iccaiBlacklistGroupSaveParam|黑名单分组|body|true|IccaiBlacklistGroupSaveParam|IccaiBlacklistGroupSaveParam|
L17784: |&emsp;&emsp;id|主键id||false|integer(int64)||
L17785: |&emsp;&emsp;groupName|分组名称||true|string||
L17786: |&emsp;&emsp;groupDesc|分组描述||false|string||
L17787: |&emsp;&emsp;validityPeriodType|有效期类型 1-永久 2-7天 3-30天 4-90天 5-180天 6-自定义||true|integer(int32)||
L17788: |&emsp;&emsp;customizeDay|自定义天数||false|integer(int32)||
L17794: | 状态码 | 说明 | schema |
L17795: | -------- | -------- | ----- | 
L17796: |200|OK|ResultVOVoid|
L17802: | 参数名称 | 参数说明 | 类型 | schema |
L17803: | -------- | -------- | ----- |----- | 
L17804: |result|返回码|string||
L17805: |msg|错误信息|string||
L17806: |extInfo|扩展信息|string||
L17807: |pageindex|当前页|integer(int32)|integer(int32)|
L17808: |pages|总页数|integer(int32)|integer(int32)|
L17809: |records|总记录数|integer(int32)|integer(int32)|
L17810: |rows|结果对象|object||
L17811: |success||boolean||
```

## L17829 · GET /tob/blacklist/blacklist-group/list
原文：L17829–L17931；Wiki：`lib-智能外呼服务名单与黑名单接口`；模块：黑名单分组相关接口。

```text
L17832: **接口地址**:`/tob/blacklist/blacklist-group/list`
L17835: **请求方式**:`GET`
L17838: **请求数据类型**:`application/x-www-form-urlencoded`
L17841: **响应数据类型**:`*/*`
L17844: **接口描述**:
L17850: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L17851: | -------- | -------- | ----- | -------- | -------- | ------ |
L17852: |id|主键id|query|false|string||
L17853: |groupName|分组名称|query|false|string||
L17854: |groupDesc|分组描述|query|false|string||
L17855: |validityPeriodType|有效期类型 1-永久 2-7天 3-30天 4-90天 5-180天 6-自定义|query|false|string||
L17856: |page|页码，不传是默认为1|query|false|string||
L17857: |perPage|每页数量，不传是默认为10|query|false|string||
L17863: | 状态码 | 说明 | schema |
L17864: | -------- | -------- | ----- | 
L17865: |200|OK|ResultVOListIccaiBlacklistGroupListResult|
L17871: | 参数名称 | 参数说明 | 类型 | schema |
L17872: | -------- | -------- | ----- |----- | 
L17873: |result|返回码|string||
L17874: |msg|错误信息|string||
L17875: |extInfo|扩展信息|string||
L17876: |pageindex|当前页|integer(int32)|integer(int32)|
L17877: |pages|总页数|integer(int32)|integer(int32)|
L17878: |records|总记录数|integer(int32)|integer(int32)|
L17879: |rows|结果对象|array|IccaiBlacklistGroupListResult|
L17880: |&emsp;&emsp;id|主键id|integer(int64)||
L17881: |&emsp;&emsp;groupName|分组名称|string||
L17882: |&emsp;&emsp;groupDesc|分组描述|string||
L17883: |&emsp;&emsp;validityPeriodType|有效期类型 1-永久 2-7天 3-30天 4-90天 5-180天 6-自定义|integer(int32)||
L17884: |&emsp;&emsp;customizeDay|自定义天数|integer(int32)||
L17885: |&emsp;&emsp;creator|创建者|string||
L17886: |&emsp;&emsp;syncPlatformList|平台同步信息|array|SyncPlatformGroupResult|
L17887: |&emsp;&emsp;&emsp;&emsp;blacklistGroupId|分组ID|integer(int64)||
L17888: |&emsp;&emsp;&emsp;&emsp;intelligentPlatformType|智能平台类型 1-冰兰 2-科大讯飞 3-一知 4-中科金 5-电声|integer(int32)||
L17889: |&emsp;&emsp;&emsp;&emsp;syncStatus|同步状态 0-未同步 1-已同步 2-同步失败 3-仅本地 4-同步中|integer(int32)||
L17890: |&emsp;&emsp;&emsp;&emsp;status|是否启用 0-否 1-是|integer(int32)||
L17891: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L17892: |&emsp;&emsp;modifier|修改者|string||
L17893: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L17894: |success||boolean||
```

## L18001 · GET /tob/blacklist/blacklist-group/detail/{id}
原文：L18001–L18083；Wiki：`lib-智能外呼服务名单与黑名单接口`；模块：黑名单分组相关接口。

```text
L18004: **接口地址**:`/tob/blacklist/blacklist-group/detail/{id}`
L18007: **请求方式**:`GET`
L18010: **请求数据类型**:`application/x-www-form-urlencoded`
L18013: **响应数据类型**:`*/*`
L18016: **接口描述**:
L18022: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L18023: | -------- | -------- | ----- | -------- | -------- | ------ |
L18024: |id|要查询的记录id|path|true|integer(int64)||
L18030: | 状态码 | 说明 | schema |
L18031: | -------- | -------- | ----- | 
L18032: |200|OK|ResultVOIccaiBlacklistGroupResult|
L18038: | 参数名称 | 参数说明 | 类型 | schema |
L18039: | -------- | -------- | ----- |----- | 
L18040: |result|返回码|string||
L18041: |msg|错误信息|string||
L18042: |extInfo|扩展信息|string||
L18043: |pageindex|当前页|integer(int32)|integer(int32)|
L18044: |pages|总页数|integer(int32)|integer(int32)|
L18045: |records|总记录数|integer(int32)|integer(int32)|
L18046: |rows||IccaiBlacklistGroupResult|IccaiBlacklistGroupResult|
L18047: |&emsp;&emsp;id|主键id|integer(int64)||
L18048: |&emsp;&emsp;groupName|分组名称|string||
L18049: |&emsp;&emsp;groupDesc|分组描述|string||
L18050: |&emsp;&emsp;validityPeriodType|有效期类型 1-永久 2-7天 3-30天 4-90天 5-180天 6-自定义|integer(int32)||
L18051: |&emsp;&emsp;creator|创建者|string||
L18052: |&emsp;&emsp;customizeDay|自定义天数|integer(int32)||
L18053: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L18054: |&emsp;&emsp;modifier|修改者|string||
L18055: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L18056: |success||boolean||
```

## L18442 · GET /tob/blacklist-user-sync-record/list
原文：L18442–L18544；Wiki：`lib-智能外呼服务名单与黑名单接口`；模块：黑名单同步记录相关接口。

```text
L18445: **接口地址**:`/tob/blacklist-user-sync-record/list`
L18448: **请求方式**:`GET`
L18451: **请求数据类型**:`application/x-www-form-urlencoded`
L18454: **响应数据类型**:`*/*`
L18457: **接口描述**:
L18463: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L18464: | -------- | -------- | ----- | -------- | -------- | ------ |
L18465: |id|主键id|query|false|string||
L18466: |intelligentPlatformType|智能平台类型 1-冰兰 2-科大讯飞 3-一知 4-中科金 5-电声|query|false|string||
L18467: |sourceBlacklistGroupId|中台分组ID|query|false|string||
L18468: |sourceBlacklistUserId|中台黑名单ID|query|false|string||
L18469: |platformBlacklistGroupCode|平台分组编码|query|false|string||
L18470: |syncDate|同步时间|query|false|string||
L18471: |syncStatus|同步状态 0-未同步 1-已同步 2-同步失败|query|false|string||
L18472: |syncType|同步类型 1-新增 2-删除|query|false|string||
L18473: |syncFailReason|同步失败原因|query|false|string||
L18474: |page|页码，不传是默认为1|query|false|string||
L18475: |perPage|每页数量，不传是默认为10|query|false|string||
L18481: | 状态码 | 说明 | schema |
L18482: | -------- | -------- | ----- | 
L18483: |200|OK|ResultVOListIccaiBlacklistUserSyncRecordListResult|
L18489: | 参数名称 | 参数说明 | 类型 | schema |
L18490: | -------- | -------- | ----- |----- | 
L18491: |result|返回码|string||
L18492: |msg|错误信息|string||
L18493: |extInfo|扩展信息|string||
L18494: |pageindex|当前页|integer(int32)|integer(int32)|
L18495: |pages|总页数|integer(int32)|integer(int32)|
L18496: |records|总记录数|integer(int32)|integer(int32)|
L18497: |rows|结果对象|array|IccaiBlacklistUserSyncRecordListResult|
L18498: |&emsp;&emsp;id|主键id|integer(int64)||
L18499: |&emsp;&emsp;intelligentPlatformType|智能平台类型 1-冰兰 2-科大讯飞 3-一知 4-中科金 5-电声|integer(int32)||
L18500: |&emsp;&emsp;sourceBlacklistGroupId|中台分组ID|integer(int64)||
L18501: |&emsp;&emsp;sourceBlacklistUserId|中台黑名单ID|integer(int64)||
L18502: |&emsp;&emsp;platformBlacklistGroupCode|平台分组编码|string||
L18503: |&emsp;&emsp;syncDate|同步时间|string(date-time)||
L18504: |&emsp;&emsp;syncStatus|同步状态 0-未同步 1-已同步 2-同步失败 3-仅本地 4-同步中|integer(int32)||
L18505: |&emsp;&emsp;syncType|同步类型 1-新增 2-删除|integer(int32)||
L18506: |&emsp;&emsp;syncFailReason|同步失败原因|string||
L18507: |&emsp;&emsp;creator|创建者|string||
L18508: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L18509: |&emsp;&emsp;modifier|修改者|string||
L18510: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L18511: |success||boolean||
```

## L18795 · PUT /tob/blacklist-group-sync-config/updateStatus
原文：L18795–L18871；Wiki：`lib-智能外呼服务名单与黑名单接口`；模块：黑名单分组同步配置相关接口。

```text
L18798: **接口地址**:`/tob/blacklist-group-sync-config/updateStatus`
L18801: **请求方式**:`PUT`
L18804: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L18807: **响应数据类型**:`*/*`
L18810: **接口描述**:
L18827: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L18828: | -------- | -------- | ----- | -------- | -------- | ------ |
L18829: |blacklistGroupSyncConfigUpdateStatusParam|BlacklistGroupSyncConfigUpdateStatusParam|body|true|BlacklistGroupSyncConfigUpdateStatusParam|BlacklistGroupSyncConfigUpdateStatusParam|
L18830: |&emsp;&emsp;id|主键id||false|integer(int64)||
L18831: |&emsp;&emsp;status|是否启用 0-否 1-是||false|integer(int32)||
L18837: | 状态码 | 说明 | schema |
L18838: | -------- | -------- | ----- | 
L18839: |200|OK|ResultVOVoid|
L18845: | 参数名称 | 参数说明 | 类型 | schema |
L18846: | -------- | -------- | ----- |----- | 
L18847: |result|返回码|string||
L18848: |msg|错误信息|string||
L18849: |extInfo|扩展信息|string||
L18850: |pageindex|当前页|integer(int32)|integer(int32)|
L18851: |pages|总页数|integer(int32)|integer(int32)|
L18852: |records|总记录数|integer(int32)|integer(int32)|
L18853: |rows|结果对象|object||
L18854: |success||boolean||
```

## L18872 · POST /tob/blacklist-group-sync-config/create
原文：L18872–L18948；Wiki：`lib-智能外呼服务名单与黑名单接口`；模块：黑名单分组同步配置相关接口。

```text
L18875: **接口地址**:`/tob/blacklist-group-sync-config/create`
L18878: **请求方式**:`POST`
L18881: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L18884: **响应数据类型**:`*/*`
L18887: **接口描述**:
L18904: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L18905: | -------- | -------- | ----- | -------- | -------- | ------ |
L18906: |iccaiBlacklistGroupSyncConfigSaveParam|黑名单分组同步配置|body|true|IccaiBlacklistGroupSyncConfigSaveParam|IccaiBlacklistGroupSyncConfigSaveParam|
L18907: |&emsp;&emsp;intelligentPlatformType|智能平台类型 1-冰兰 2-科大讯飞 3-一知 4-中科金 5-电声||false|integer(int32)||
L18908: |&emsp;&emsp;sourceBlacklistGroupId|中台分组ID||false|integer(int64)||
L18914: | 状态码 | 说明 | schema |
L18915: | -------- | -------- | ----- | 
L18916: |200|OK|ResultVOVoid|
L18922: | 参数名称 | 参数说明 | 类型 | schema |
L18923: | -------- | -------- | ----- |----- | 
L18924: |result|返回码|string||
L18925: |msg|错误信息|string||
L18926: |extInfo|扩展信息|string||
L18927: |pageindex|当前页|integer(int32)|integer(int32)|
L18928: |pages|总页数|integer(int32)|integer(int32)|
L18929: |records|总记录数|integer(int32)|integer(int32)|
L18930: |rows|结果对象|object||
L18931: |success||boolean||
```

## L18949 · GET /tob/blacklist-group-sync-config/list
原文：L18949–L19046；Wiki：`lib-智能外呼服务名单与黑名单接口`；模块：黑名单分组同步配置相关接口。

```text
L18952: **接口地址**:`/tob/blacklist-group-sync-config/list`
L18955: **请求方式**:`GET`
L18958: **请求数据类型**:`application/x-www-form-urlencoded`
L18961: **响应数据类型**:`*/*`
L18964: **接口描述**:
L18970: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L18971: | -------- | -------- | ----- | -------- | -------- | ------ |
L18972: |sourceBlacklistGroupId|中台分组ID|query|true|string||
L18973: |id|主键id|query|false|string||
L18974: |page|页码，不传是默认为1|query|false|string||
L18975: |perPage|每页数量，不传是默认为10|query|false|string||
L18981: | 状态码 | 说明 | schema |
L18982: | -------- | -------- | ----- | 
L18983: |200|OK|ResultVOListIccaiBlacklistGroupSyncConfigListResult|
L18989: | 参数名称 | 参数说明 | 类型 | schema |
L18990: | -------- | -------- | ----- |----- | 
L18991: |result|返回码|string||
L18992: |msg|错误信息|string||
L18993: |extInfo|扩展信息|string||
L18994: |pageindex|当前页|integer(int32)|integer(int32)|
L18995: |pages|总页数|integer(int32)|integer(int32)|
L18996: |records|总记录数|integer(int32)|integer(int32)|
L18997: |rows|结果对象|array|IccaiBlacklistGroupSyncConfigListResult|
L18998: |&emsp;&emsp;id|主键id|integer(int64)||
L18999: |&emsp;&emsp;intelligentPlatformType|智能平台类型 1-冰兰 2-科大讯飞 3-一知 4-中科金 5-电声|integer(int32)||
L19000: |&emsp;&emsp;sourceBlacklistGroupId|中台分组ID|integer(int64)||
L19001: |&emsp;&emsp;platformBlacklistGroupId|平台分组ID|integer(int64)||
L19002: |&emsp;&emsp;platformBlacklistGroupCode|平台分组编码|string||
L19003: |&emsp;&emsp;platformBlacklistGroupName|平台分组名称|string||
L19004: |&emsp;&emsp;syncQuantity|已同步数|integer(int32)||
L19005: |&emsp;&emsp;syncStatus|同步状态 0-未同步 1-已同步 2-同步失败 3-仅本地 4-同步中|integer(int32)||
L19006: |&emsp;&emsp;lastSyncDate|最近同步时间|string(date-time)||
L19007: |&emsp;&emsp;status|是否启用 0-否 1-是|integer(int32)||
L19008: |&emsp;&emsp;creator|创建者|string||
L19009: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L19010: |&emsp;&emsp;modifier|修改者|string||
L19011: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L19012: |success||boolean||
```

## L19047 · GET /tob/blacklist-group-sync-config/group-sync-info
原文：L19047–L19119；Wiki：`lib-智能外呼服务名单与黑名单接口`；模块：黑名单分组同步配置相关接口。

```text
L19050: **接口地址**:`/tob/blacklist-group-sync-config/group-sync-info`
L19053: **请求方式**:`GET`
L19056: **请求数据类型**:`application/x-www-form-urlencoded`
L19059: **响应数据类型**:`*/*`
L19062: **接口描述**:
L19068: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L19069: | -------- | -------- | ----- | -------- | -------- | ------ |
L19070: |groupId||query|true|integer(int64)||
L19076: | 状态码 | 说明 | schema |
L19077: | -------- | -------- | ----- | 
L19078: |200|OK|ResultVOGroupSyncInfoResult|
L19084: | 参数名称 | 参数说明 | 类型 | schema |
L19085: | -------- | -------- | ----- |----- | 
L19086: |result|返回码|string||
L19087: |msg|错误信息|string||
L19088: |extInfo|扩展信息|string||
L19089: |pageindex|当前页|integer(int32)|integer(int32)|
L19090: |pages|总页数|integer(int32)|integer(int32)|
L19091: |records|总记录数|integer(int32)|integer(int32)|
L19092: |rows||GroupSyncInfoResult|GroupSyncInfoResult|
L19093: |&emsp;&emsp;groupId|分组ID|integer(int64)||
L19094: |&emsp;&emsp;groupName|分组名称|string||
L19095: |&emsp;&emsp;syncStatus|同步状态 0-未同步 1-已同步 2-同步失败 3-仅本地 4-同步中|integer(int32)||
L19096: |&emsp;&emsp;platformQuantity|平台数|string||
L19097: |success||boolean||
```

## L21359 · POST /tob/task/update-exec-status
原文：L21359–L21435；Wiki：`lib-智能外呼服务任务与场景接口`；模块：外呼管理。

```text
L21362: **接口地址**:`/tob/task/update-exec-status`
L21365: **请求方式**:`POST`
L21368: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L21371: **响应数据类型**:`*/*`
L21374: **接口描述**:
L21391: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L21392: | -------- | -------- | ----- | -------- | -------- | ------ |
L21393: |updateSceneExecStatusParam|UpdateSceneExecStatusParam|body|true|UpdateSceneExecStatusParam|UpdateSceneExecStatusParam|
L21394: |&emsp;&emsp;id|主键id||false|integer(int64)||
L21395: |&emsp;&emsp;execStatus|执行状态 1-未启动 2-进行中 3-已暂停 4-已终止||false|integer(int32)||
L21401: | 状态码 | 说明 | schema |
L21402: | -------- | -------- | ----- | 
L21403: |200|OK|ResultVOVoid|
L21409: | 参数名称 | 参数说明 | 类型 | schema |
L21410: | -------- | -------- | ----- |----- | 
L21411: |result|返回码|string||
L21412: |msg|错误信息|string||
L21413: |extInfo|扩展信息|string||
L21414: |pageindex|当前页|integer(int32)|integer(int32)|
L21415: |pages|总页数|integer(int32)|integer(int32)|
L21416: |records|总记录数|integer(int32)|integer(int32)|
L21417: |rows|结果对象|object||
L21418: |success||boolean||
```

## L21830 · POST /tob/task/import-phone-list-v2
原文：L21830–L21896；Wiki：`lib-智能外呼服务任务与场景接口`；模块：外呼管理。

```text
L21833: **接口地址**:`/tob/task/import-phone-list-v2`
L21836: **请求方式**:`POST`
L21839: **请求数据类型**:`application/x-www-form-urlencoded,multipart/form-data`
L21842: **响应数据类型**:`application/json`
L21845: **接口描述**:
L21851: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L21852: | -------- | -------- | ----- | -------- | -------- | ------ |
L21853: |sceneId||query|true|integer(int64)||
L21854: |file||query|true|file||
L21855: |reimport||query|false|integer(int32)||
L21856: |importBatchNumber||query|false|string||
L21862: | 状态码 | 说明 | schema |
L21863: | -------- | -------- | ----- | 
L21864: |200|OK|ResultVOVoid|
L21870: | 参数名称 | 参数说明 | 类型 | schema |
L21871: | -------- | -------- | ----- |----- | 
L21872: |result|返回码|string||
L21873: |msg|错误信息|string||
L21874: |extInfo|扩展信息|string||
L21875: |pageindex|当前页|integer(int32)|integer(int32)|
L21876: |pages|总页数|integer(int32)|integer(int32)|
L21877: |records|总记录数|integer(int32)|integer(int32)|
L21878: |rows|结果对象|object||
L21879: |success||boolean||
```

## L21988 · POST /tob/task/dzDeleteCallList
原文：L21988–L22081；Wiki：`lib-智能外呼服务任务与场景接口`；模块：外呼管理。

```text
L21991: **接口地址**:`/tob/task/dzDeleteCallList`
L21994: **请求方式**:`POST`
L21997: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L22000: **响应数据类型**:`*/*`
L22003: **接口描述**:
L22020: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L22021: | -------- | -------- | ----- | -------- | -------- | ------ |
L22022: |accountId||query|true|integer(int64)||
L22023: |dzDeleteCallListParam|DzDeleteCallListParam|body|true|DzDeleteCallListParam|DzDeleteCallListParam|
L22024: |&emsp;&emsp;taskCode|任务编码||false|string||
L22025: |&emsp;&emsp;list|需要删除的外呼名单编码，最大支持2000条数据，并确保外呼名单编码唯一||false|array|string|
L22031: | 状态码 | 说明 | schema |
L22032: | -------- | -------- | ----- | 
L22033: |200|OK|ResultVODzDeleteCallListResult|
L22039: | 参数名称 | 参数说明 | 类型 | schema |
L22040: | -------- | -------- | ----- |----- | 
L22041: |result|返回码|string||
L22042: |msg|错误信息|string||
L22043: |extInfo|扩展信息|string||
L22044: |pageindex|当前页|integer(int32)|integer(int32)|
L22045: |pages|总页数|integer(int32)|integer(int32)|
L22046: |records|总记录数|integer(int32)|integer(int32)|
L22047: |rows||DzDeleteCallListResult|DzDeleteCallListResult|
L22048: |&emsp;&emsp;code|结果码|string||
L22049: |&emsp;&emsp;message|结果描述|string||
L22050: |&emsp;&emsp;data|名单信息|array|DzDeleteResult|
L22051: |&emsp;&emsp;&emsp;&emsp;audioRecordCode|外呼名单编码，长度32位或外部名单code|string||
L22052: |&emsp;&emsp;&emsp;&emsp;status|删除结果，1删除成功 0删除失败|integer(int32)||
L22053: |&emsp;&emsp;&emsp;&emsp;msg|提示信息|string||
L22054: |success||boolean||
```

## L22161 · POST /tob/task/batch-del-phone
原文：L22161–L22237；Wiki：`lib-智能外呼服务任务与场景接口`；模块：外呼管理。

```text
L22164: **接口地址**:`/tob/task/batch-del-phone`
L22167: **请求方式**:`POST`
L22170: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L22173: **响应数据类型**:`*/*`
L22176: **接口描述**:
L22193: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L22194: | -------- | -------- | ----- | -------- | -------- | ------ |
L22195: |batchDeletePhoneParam|BatchDeletePhoneParam|body|true|BatchDeletePhoneParam|BatchDeletePhoneParam|
L22196: |&emsp;&emsp;ids|呼叫名单主键ID||false|array|integer(int64)|
L22197: |&emsp;&emsp;sceneId|任务场景ID||false|integer(int64)||
L22203: | 状态码 | 说明 | schema |
L22204: | -------- | -------- | ----- | 
L22205: |200|OK|ResultVOVoid|
L22211: | 参数名称 | 参数说明 | 类型 | schema |
L22212: | -------- | -------- | ----- |----- | 
L22213: |result|返回码|string||
L22214: |msg|错误信息|string||
L22215: |extInfo|扩展信息|string||
L22216: |pageindex|当前页|integer(int32)|integer(int32)|
L22217: |pages|总页数|integer(int32)|integer(int32)|
L22218: |records|总记录数|integer(int32)|integer(int32)|
L22219: |rows|结果对象|object||
L22220: |success||boolean||
```

## L22310 · GET /tob/task/yiWishDetail
原文：L22310–L22561；Wiki：`lib-智能外呼服务任务与场景接口`；模块：外呼管理。

```text
L22313: **接口地址**:`/tob/task/yiWishDetail`
L22316: **请求方式**:`GET`
L22319: **请求数据类型**:`application/x-www-form-urlencoded`
L22322: **响应数据类型**:`*/*`
L22325: **接口描述**:
L22331: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L22332: | -------- | -------- | ----- | -------- | -------- | ------ |
L22333: |sceneId||query|true|integer(int64)||
L22339: | 状态码 | 说明 | schema |
L22340: | -------- | -------- | ----- | 
L22341: |200|OK|ResultVORobotCallJobData|
L22347: | 参数名称 | 参数说明 | 类型 | schema |
L22348: | -------- | -------- | ----- |----- | 
L22349: |result|返回码|string||
L22350: |msg|错误信息|string||
L22351: |extInfo|扩展信息|string||
L22352: |pageindex|当前页|integer(int32)|integer(int32)|
L22353: |pages|总页数|integer(int32)|integer(int32)|
L22354: |records|总记录数|integer(int32)|integer(int32)|
L22355: |rows||RobotCallJobData|RobotCallJobData|
L22356: |&emsp;&emsp;taskCallTotal|任务总量|integer(int64)||
L22357: |&emsp;&emsp;completedTask|已呼客户量|integer(int64)||
L22358: |&emsp;&emsp;filteredTask|过滤外呼量|integer(int64)||
L22359: |&emsp;&emsp;createdByUserName|任务创建人|string||
L22360: |&emsp;&emsp;jobPhoneNumberList|任务线路列表|array|JobPhoneNumber|
L22361: |&emsp;&emsp;&emsp;&emsp;enabledStatus|是否绑定（1绑定 0已解绑）|integer(int32)||
L22362: |&emsp;&emsp;&emsp;&emsp;phoneNumber|线路名称|string||
L22363: |&emsp;&emsp;&emsp;&emsp;phoneType|线路类型 (MOBILE, "手机"),(LANDLINE, "线路"),(CALL_POLICY_GROUP，"外呼策略组")|string||
L22364: |&emsp;&emsp;&emsp;&emsp;tenantPhoneNumberId|线路id|integer(int64)||
L22365: |&emsp;&emsp;policyGroupPhoneNumberList|外呼策略组包含的线路信息|array|object|
L22366: |&emsp;&emsp;robotCallJob||RobotCallJobDetail|RobotCallJobDetail|
L22367: |&emsp;&emsp;&emsp;&emsp;baseConcurrencyQuota|线路并发数|integer(int32)||
L22368: |&emsp;&emsp;&emsp;&emsp;baseRobotCount|AI座席数|integer(int32)||
L22369: |&emsp;&emsp;&emsp;&emsp;createTime|任务创建时间|string||
L22370: |&emsp;&emsp;&emsp;&emsp;createUserId|创建人id|integer(int64)||
L22371: |&emsp;&emsp;&emsp;&emsp;csDistributionMethod|转人工分配方式（FREE 空闲分配 RANDOM 随机分配 FOLLOW 熟客分配 ROUND 轮询 SATURATION 饱和度）|string||
L22372: |&emsp;&emsp;&emsp;&emsp;csStaffGroupId|人工坐席id|integer(int64)||
L22373: |&emsp;&emsp;&emsp;&emsp;customerWhiteGroupIds|黑名单分组id|array|integer|
L22374: |&emsp;&emsp;&emsp;&emsp;customerWhiteGroupList|黑名单分组|array|NameEntity|
L22375: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;id|ID|integer(int64)||
L22376: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;name|名称|string||
L22377: |&emsp;&emsp;&emsp;&emsp;dailyStartTime|每日可拨打开始时间|string||
L22378: |&emsp;&emsp;&emsp;&emsp;dailyEndTime|每日可拨打结束时间|string||
L22379: |&emsp;&emsp;&emsp;&emsp;daysOfWeek|周可拨打时段，时段外的时间，任务会被挂起，星期几不传，星期几就是时段外|array|string|
L22380: |&emsp;&emsp;&emsp;&emsp;description|任务描述|string||
L22381: |&emsp;&emsp;&emsp;&emsp;dialogFlowId|话术id|integer(int64)||
L22382: |&emsp;&emsp;&emsp;&emsp;dialogFlowName|话术名称|string||
L22383: |&emsp;&emsp;&emsp;&emsp;earlyWarningAlertUsers|预警提示人员id|array|integer|
L22384: |&emsp;&emsp;&emsp;&emsp;endTime|结束时间外呼结束时间，该时间点后任务会被系统挂起停止外呼（设定仅到日，当日23：59停止外呼）|string||
L22385: |&emsp;&emsp;&emsp;&emsp;filterStrategyList|过滤策略组id|array|integer|
L22386: |&emsp;&emsp;&emsp;&emsp;flashMessageTemplateId|外呼前闪信推送配置的闪信模板ID|integer(int64)||
L22387: |&emsp;&emsp;&emsp;&emsp;hangUpType|系统挂起类型,详见枚举类型说明中的系统挂起枚举|string||
L22388: |&emsp;&emsp;&emsp;&emsp;inQueueType|排队类型，详见枚举类型说明中的排队类型枚举|string||
L22389: |&emsp;&emsp;&emsp;&emsp;inactiveTimeList|不可拨打时间段列表|array|InactiveTime|
L22390: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;startTime|开始时间|string||
L22391: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;endTime|结束时间|string||
L22392: |&emsp;&emsp;&emsp;&emsp;inactiveDateList|不可拨打日期列表|array|InactiveDate|
L22393: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;startDate|开始日期|string||
L22394: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;endDate|结束日期|string||
L22395: |&emsp;&emsp;&emsp;&emsp;name|任务名称|string||
L22396: |&emsp;&emsp;&emsp;&emsp;mode|任务启动类型 (AUTO, "自动任务"),(MANUAL, "手动任务")|string||
L22397: |&emsp;&emsp;&emsp;&emsp;nextEndDatetime|任务下次结束时间|string||
L22398: |&emsp;&emsp;&emsp;&emsp;nextStartDatetime|任务下次开始时间|string||
L22399: |&emsp;&emsp;&emsp;&emsp;phoneType|线路类型（补充字段）|string||
L22400: |&emsp;&emsp;&emsp;&emsp;priority|任务优先级(0表示高优先 100表示普通)|integer(int32)||
L22401: |&emsp;&emsp;&emsp;&emsp;redialSettingList|自动重播设置|array|RedialSetting|
L22402: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;redialCondition|电话未接通的情况下需要重拨的通话状态|array|string|
L22403: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;redialConditionCn|电话未接通的情况下需要重拨的通话状态（中文）|array|string|
L22404: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;connectRedialCondition|电话接通后需要重拨的意向分类code|array|string|
L22405: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;connectRedialConditionCn|电话接通后需要重拨的意向分类code（中文）|array|string|
L22406: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;redialInterval|重拨间隔(分钟)|integer(int32)||
L22407: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;redialTimes|重拨次数|integer(int32)||
L22408: |&emsp;&emsp;&emsp;&emsp;robotCallJobId|任务id|integer(int64)||
L22409: |&emsp;&emsp;&emsp;&emsp;smsPushAnswered|是否只推送接通的客户,为ture时,未接通客户即使满足其他发送条件仍不进行发送,为false时不进行此校验,不传默认为false|boolean||
L22410: |&emsp;&emsp;&emsp;&emsp;smsPushType|短信发送类型 (DISTINCT_PUSH, "去重发送"),(EVERY_PUSH, "逐通推送")|string||
L22411: |&emsp;&emsp;&emsp;&emsp;smsTemplateId|（挂机短信普通模式）短信模板id|integer(int64)||
L22412: |&emsp;&emsp;&emsp;&emsp;smsAlertLevelCode|（挂机短信普通模式）推送条件意向code|array|integer|
L22413: |&emsp;&emsp;&emsp;&emsp;smsTemplateIntentList|（挂机短信高级模式）挂机短信配置|array|SmsTemplateIntent|
L22414: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;intentLevel|触发挂机短信的意向等级|integer(int32)||
L22415: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;smsTemplateIds|挂机短信模版id|array|integer|
L22416: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;smsTemplateNames|挂机短信模板名称|array|string|
L22417: |&emsp;&emsp;&emsp;&emsp;reSendSmsTemplateIds|补发短信模板id列表|array|integer|
L22418: |&emsp;&emsp;&emsp;&emsp;enableReSendSms|短信补发开关|boolean||
L22419: |&emsp;&emsp;&emsp;&emsp;botSmsTemplateId|话术短信模板ID|integer(int64)||
L22420: |&emsp;&emsp;&emsp;&emsp;botSmsTemplateInfoVO||BotSmsTemplateInfo|BotSmsTemplateInfo|
L22421: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;smsTemplateId|模板id|integer(int64)||
L22422: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;smsTemplateName|模板名称|string||
L22423: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;content|模板内容|string||
L22424: |&emsp;&emsp;&emsp;&emsp;reSendSmsTemplateList|短信补发模板列表|array|ReSendSmsTemplate|
L22425: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;smsTemplateId|模板id|integer(int64)||
L22426: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;smsTemplateName|模板名称|string||
L22427: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;content|模板内容|string||
L22428: |&emsp;&emsp;&emsp;&emsp;startTime|任务开始时间|string||
L22429: |&emsp;&emsp;&emsp;&emsp;status|任务状态, 详见枚举类型说明中的任务状态枚举|string||
L22430: |&emsp;&emsp;&emsp;&emsp;tenantCallInterceptId|租户拦截ID（补充字段）|integer(int64)||
L22431: |&emsp;&emsp;&emsp;&emsp;tenantId|租户id|integer(int64)||
L22432: |&emsp;&emsp;&emsp;&emsp;updateTime|任务修改时间|string||
L22433: |&emsp;&emsp;&emsp;&emsp;updateUserId|更新人id|integer(int64)||
L22434: |&emsp;&emsp;&emsp;&emsp;riskControlStrategyId|风控策略ID|integer(int64)||
L22435: |&emsp;&emsp;&emsp;&emsp;riskControlStrategyName|风控策略名称|string||
L22436: |&emsp;&emsp;&emsp;&emsp;wechatPushConditionList|微信推送条件列表（补充字段）|array|object|
L22437: |&emsp;&emsp;smsTemplateName|（挂机短信普通模式）短信模板名称|string||
L22438: |success||boolean||
```

## L23624 · GET /tob/task/dzDetail
原文：L23624–L23772；Wiki：`lib-智能外呼服务任务与场景接口`；模块：外呼管理。

```text
L23627: **接口地址**:`/tob/task/dzDetail`
L23630: **请求方式**:`GET`
L23633: **请求数据类型**:`application/x-www-form-urlencoded`
L23636: **响应数据类型**:`*/*`
L23639: **接口描述**:
L23645: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L23646: | -------- | -------- | ----- | -------- | -------- | ------ |
L23647: |sceneId||query|true|integer(int64)||
L23653: | 状态码 | 说明 | schema |
L23654: | -------- | -------- | ----- | 
L23655: |200|OK|ResultVODzTaskDetail|
L23661: | 参数名称 | 参数说明 | 类型 | schema |
L23662: | -------- | -------- | ----- |----- | 
L23663: |result|返回码|string||
L23664: |msg|错误信息|string||
L23665: |extInfo|扩展信息|string||
L23666: |pageindex|当前页|integer(int32)|integer(int32)|
L23667: |pages|总页数|integer(int32)|integer(int32)|
L23668: |records|总记录数|integer(int32)|integer(int32)|
L23669: |rows||DzTaskDetail|DzTaskDetail|
L23670: |&emsp;&emsp;taskCode|任务编码，长度32位|string||
L23671: |&emsp;&emsp;taskName|任务名称，长度50位|string||
L23672: |&emsp;&emsp;taskStatus|任务状态：1-未开始，2-进行中，3-已完成，4-已终止，5-排队中，6-手动暂停，7-自动暂停，8-已过期|integer(int32)||
L23673: |&emsp;&emsp;taskType|任务启动方式：1-手动，2-定时|integer(int32)||
L23674: |&emsp;&emsp;tenantId|租户id，长度32位|string||
L23675: |&emsp;&emsp;robotId|机器人id，长度32位|string||
L23676: |&emsp;&emsp;robotName|机器人名称，长度32位|string||
L23677: |&emsp;&emsp;outboundNo|外呼号码|string||
L23678: |&emsp;&emsp;outboundDate|启动时间|string||
L23679: |&emsp;&emsp;createTime|创建时间（时间戳）|integer(int64)||
L23680: |&emsp;&emsp;createDate|创建时间|string(date-time)||
L23681: |&emsp;&emsp;outboundTotal|外呼数量|integer(int32)||
L23682: |&emsp;&emsp;outboundProgress|外呼进度|integer(int32)||
L23683: |&emsp;&emsp;outboundCircleType|外呼周期，默认1，目前只支持weekday=1|integer(int32)||
L23684: |&emsp;&emsp;outboundCircleValue|与outboundCircleType联动，值为：1,2,3,4,5,6,7（周几）|string||
L23685: |&emsp;&emsp;outboundTimeInterval|外呼时段，JSON数组字符串，如["09:00-11:30","13:30-14:00"]|string||
L23686: |&emsp;&emsp;aiSeatsNum|AI座席数|integer(int32)||
L23687: |&emsp;&emsp;aiSeatsFlag|弹性坐席，默认关闭：1开启，0关闭|integer(int32)||
L23688: |&emsp;&emsp;recallStatus|允许重呼状态：15-关机，14-停机，9-占线，12-无法接通，5-未接，6-拨打失败，3-正在通话中，11-来电提醒|string||
L23689: |&emsp;&emsp;maxRecallTimes|重呼次数，默认0|integer(int32)||
L23690: |&emsp;&emsp;recallPeriodMin|重呼间隔（分钟），最小5分钟|integer(int32)||
L23691: |&emsp;&emsp;blacklistGroupIds|黑名单组id|string||
L23692: |&emsp;&emsp;blacklistGroupNames|黑名单组名称|string||
L23693: |&emsp;&emsp;dialogTaskId|任务流程id|integer(int32)||
L23694: |&emsp;&emsp;dialogTaskName|任务流程名称|string||
L23695: |&emsp;&emsp;recallModel|重呼模式：0-关闭，1-高级模式，2-普通模式|integer(int32)||
L23696: |&emsp;&emsp;recallStrategy|重呼策略，JSON串，格式：[{"status":1,"time":4,"period":10}]|string||
L23697: |&emsp;&emsp;recallSetting|重呼策略，JSON串，格式："[{"recallType":"interval","intervalValue":2,"day":null,"time":""}]"|string||
L23698: |&emsp;&emsp;recallStrategyList|重呼策略列表|array|RecallStrategy|
L23699: |&emsp;&emsp;&emsp;&emsp;status|允许重呼状态：15-关机，14-停机，9-占线，12-无法接通，5-未接，6-拨打失败，3-正在通话中，11-来电提醒|integer(int32)||
L23700: |&emsp;&emsp;&emsp;&emsp;time|重呼次数|integer(int32)||
L23701: |&emsp;&emsp;&emsp;&emsp;period|重呼时间间隔|integer(int32)||
L23702: |&emsp;&emsp;recallSettingList|重呼配置列表|array|RecallSetting|
L23703: |&emsp;&emsp;&emsp;&emsp;recallType|时间类型 interval-按时间间隔|string||
L23704: |&emsp;&emsp;&emsp;&emsp;intervalValue|重呼次数|integer(int32)||
L23705: |&emsp;&emsp;&emsp;&emsp;day|天|integer(int32)||
L23706: |&emsp;&emsp;&emsp;&emsp;time|时间|string||
L23707: |&emsp;&emsp;notCallFirstSwitch|优先拨打未呼叫名单|integer(int32)||
L23708: |&emsp;&emsp;recallCn|重呼设置|string||
L23709: |success||boolean||
```

## L24277 · GET /tob/task/call-list
原文：L24277–L24367；Wiki：`lib-智能外呼服务任务与场景接口`；模块：外呼管理。

```text
L24280: **接口地址**:`/tob/task/call-list`
L24283: **请求方式**:`GET`
L24286: **请求数据类型**:`application/x-www-form-urlencoded`
L24289: **响应数据类型**:`*/*`
L24292: **接口描述**:
L24298: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L24299: | -------- | -------- | ----- | -------- | -------- | ------ |
L24300: |sceneTitle|场景名称|query|false|string||
L24301: |execStatus|执行状态 1-未启动 2-进行中 3-已暂停 4-已终止|query|false|string||
L24302: |companyId|租户ID|query|false|string||
L24303: |index|分页索引|query|false|string||
L24304: |intelligentPlatformType|智能平台类型 1-冰兰 2-科大讯飞 3-一知 4-中科金 5-电声|query|false|string||
L24305: |page|页码，不传是默认为1|query|false|string||
L24306: |perPage|每页数量，不传是默认为10|query|false|string||
L24312: | 状态码 | 说明 | schema |
L24313: | -------- | -------- | ----- | 
L24314: |200|OK|ResultVOListCallListResult|
L24320: | 参数名称 | 参数说明 | 类型 | schema |
L24321: | -------- | -------- | ----- |----- | 
L24322: |result|返回码|string||
L24323: |msg|错误信息|string||
L24324: |extInfo|扩展信息|string||
L24325: |pageindex|当前页|integer(int32)|integer(int32)|
L24326: |pages|总页数|integer(int32)|integer(int32)|
L24327: |records|总记录数|integer(int32)|integer(int32)|
L24328: |rows|结果对象|array|CallListResult|
L24329: |&emsp;&emsp;id|主键id|integer(int64)||
L24330: |&emsp;&emsp;sceneTitle|场景名称|string||
L24331: |&emsp;&emsp;dataImportType|数据导入方式 1-手动导入 2-接口传入|integer(int32)||
L24332: |&emsp;&emsp;intelligentPlatformType|智能平台类型 1-冰兰 2-科大讯飞 3-一知|integer(int32)||
L24333: |&emsp;&emsp;priority|任务优先级 1-低 2-中 3-高 4-紧急|integer(int32)||
L24334: |&emsp;&emsp;execStatus|执行状态 1-未启动 2-进行中 3-已暂停 4-已终止 5-已完成 6-可运行 7-排队中 8-系统挂起 9-等待重呼 10-任务超时 11-未生成 12-已归档 13-用户暂停 14-系统暂停|integer(int32)||
L24335: |&emsp;&emsp;assignedQuantity|已分配|integer(int32)||
L24336: |&emsp;&emsp;waitCallQuantity|待呼叫|integer(int32)||
L24337: |&emsp;&emsp;calledQuantity|已呼叫|integer(int32)||
L24338: |success||boolean||
```

## L24901 · POST /tob/business-scene/create
原文：L24901–L25138；Wiki：`lib-智能外呼服务任务与场景接口`；模块：业务场景相关接口。

```text
L24904: **接口地址**:`/tob/business-scene/create`
L24907: **请求方式**:`POST`
L24910: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L24913: **响应数据类型**:`*/*`
L24916: **接口描述**:
L25023: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L25024: | -------- | -------- | ----- | -------- | -------- | ------ |
L25025: |iccaiBusinessSceneSaveParam|业务场景|body|true|IccaiBusinessSceneSaveParam|IccaiBusinessSceneSaveParam|
L25026: |&emsp;&emsp;id|主键id||false|integer(int64)||
L25027: |&emsp;&emsp;companyId|租户ID||false|integer(int64)||
L25028: |&emsp;&emsp;sceneTitle|场景名称||false|string||
L25029: |&emsp;&emsp;sceneCode|场景编码||false|string||
L25030: |&emsp;&emsp;sceneType|场景类型 1-督办 2-服务 3-回访 4-新线索 5-冷线索||false|integer(int32)||
L25031: |&emsp;&emsp;sceneDesc|场景描述||false|string||
L25032: |&emsp;&emsp;sceneInputParamList|场景传入参数||false|array|IccaiSceneInfoSaveParam|
L25033: |&emsp;&emsp;&emsp;&emsp;fieldName|字段名称||false|string||
L25034: |&emsp;&emsp;&emsp;&emsp;paramName|参数名||false|string||
L25035: |&emsp;&emsp;&emsp;&emsp;isNecessary|是否必填 0-否 1-是||false|integer(int32)||
L25036: |&emsp;&emsp;&emsp;&emsp;infoType|信息类型 1-场景传入信息 2-场景提取信息||false|integer(int32)||
L25037: |&emsp;&emsp;sceneExtractParamList|场景提取参数||false|array|IccaiSceneInfoSaveParam|
L25038: |&emsp;&emsp;&emsp;&emsp;fieldName|字段名称||false|string||
L25039: |&emsp;&emsp;&emsp;&emsp;paramName|参数名||false|string||
L25040: |&emsp;&emsp;&emsp;&emsp;isNecessary|是否必填 0-否 1-是||false|integer(int32)||
L25041: |&emsp;&emsp;&emsp;&emsp;infoType|信息类型 1-场景传入信息 2-场景提取信息||false|integer(int32)||
L25042: |&emsp;&emsp;status|状态 0-禁用 1-启用||false|integer(int32)||
L25043: |&emsp;&emsp;intelligentPlatformType|智能平台类型 1-冰兰 2-科大讯飞 3-一知||false|integer(int32)||
L25044: |&emsp;&emsp;dataImportType|数据导入方式 1-手动导入 2-接口传入||false|integer(int32)||
L25045: |&emsp;&emsp;robotId|机器人ID||false|string||
L25046: |&emsp;&emsp;callLineCode|外呼线路编码||false|string||
L25047: |&emsp;&emsp;phoneNumber|话术ID||false|string||
L25048: |&emsp;&emsp;taskUuid|科大讯飞场景ID||false|string||
L25049: |&emsp;&emsp;channelIdCollList|通道ID列表||false|array|integer(int64)|
L25050: |&emsp;&emsp;priority|任务优先级 1-低 2-中 3-高 4-紧急||false|integer(int32)||
L25051: |&emsp;&emsp;callWeekSlotCollList|呼叫时段周列表 1-周一 2-周二 3-周三 4-周四 5-周五 6-周六 7-周日||false|array|integer(int32)|
L25052: |&emsp;&emsp;callTimeSlotList|呼叫时段列表||false|array|CallTimeSlotList|
L25053: |&emsp;&emsp;&emsp;&emsp;id|主键id||false|integer(int64)||
L25054: |&emsp;&emsp;&emsp;&emsp;begin|开始时间||false|string||
L25055: |&emsp;&emsp;&emsp;&emsp;end|结束时间||false|string||
L25056: |&emsp;&emsp;mergeCallTimeSlotList|呼叫时段合集||false|array|MergeCallTimeSlotParam|
L25057: |&emsp;&emsp;&emsp;&emsp;callWeekSlotCollList|呼叫时段周列表 1-周一 2-周二 3-周三 4-周四 5-周五 6-周六 7-周日||false|array|integer|
L25058: |&emsp;&emsp;&emsp;&emsp;callTimeSlotList|呼叫时段列表||false|array|CallTimeSlotList|
L25059: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;id|主键id||false|integer(int64)||
L25060: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;begin|开始时间||false|string||
L25061: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;end|结束时间||false|string||
L25062: |&emsp;&emsp;excludeDateList|排除日期||false|array|string|
L25063: |&emsp;&emsp;isAutoStart|是否自动启动 0-否 1-是||false|integer(int32)||
L25064: |&emsp;&emsp;autoStartDate|自动执行日期||false|string(date-time)||
L25065: |&emsp;&emsp;autoRecall|自动重拨 0-否 1-是||false|integer(int32)||
L25066: |&emsp;&emsp;deduplicateWaitCall|待呼叫去重 0-否 1-是||false|integer(int32)||
L25067: |&emsp;&emsp;notAnswerRecallConfig|||false|IccaiRecallConfigSaveParam|IccaiRecallConfigSaveParam|
L25068: |&emsp;&emsp;&emsp;&emsp;id|自动重拨配置主键id||false|integer(int64)||
L25069: |&emsp;&emsp;&emsp;&emsp;intelligentPlatformType|智能平台类型 1-冰兰 2-科大讯飞 3-一知||false|integer(int32)||
L25070: |&emsp;&emsp;&emsp;&emsp;firstCallStatus|首次呼叫状态 2-无人接听 3-占线 4-拒接 5-空号 6-关机 7-停机 9-无法接通 13-分机号错误 14-呼叫受限 15-主叫欠费 16-呼损客户||false|integer(int32)||
L25071: |&emsp;&emsp;&emsp;&emsp;recallQuantity|重拨次数||false|integer(int32)||
L25072: |&emsp;&emsp;&emsp;&emsp;recallInterval|重拨间隔（分钟）||false|integer(int32)||
L25073: |&emsp;&emsp;&emsp;&emsp;status|状态 0-禁用 1-启用||false|integer(int32)||
L25074: |&emsp;&emsp;&emsp;&emsp;recallDays|重拨天数||false|integer(int32)||
L25075: |&emsp;&emsp;&emsp;&emsp;recallIntervalList|重拨间隔（分钟）合集||false|array|integer|
L25076: |&emsp;&emsp;recallConfigList|自动重拨配置列表||false|array|IccaiRecallConfigSaveParam|
L25077: |&emsp;&emsp;&emsp;&emsp;id|自动重拨配置主键id||false|integer(int64)||
L25078: |&emsp;&emsp;&emsp;&emsp;intelligentPlatformType|智能平台类型 1-冰兰 2-科大讯飞 3-一知||false|integer(int32)||
L25079: |&emsp;&emsp;&emsp;&emsp;firstCallStatus|首次呼叫状态 2-无人接听 3-占线 4-拒接 5-空号 6-关机 7-停机 9-无法接通 13-分机号错误 14-呼叫受限 15-主叫欠费 16-呼损客户||false|integer(int32)||
L25080: |&emsp;&emsp;&emsp;&emsp;recallQuantity|重拨次数||false|integer(int32)||
L25081: |&emsp;&emsp;&emsp;&emsp;recallInterval|重拨间隔（分钟）||false|integer(int32)||
L25082: |&emsp;&emsp;&emsp;&emsp;status|状态 0-禁用 1-启用||false|integer(int32)||
L25083: |&emsp;&emsp;&emsp;&emsp;recallDays|重拨天数||false|integer(int32)||
L25084: |&emsp;&emsp;&emsp;&emsp;recallIntervalList|重拨间隔（分钟）合集||false|array|integer|
L25085: |&emsp;&emsp;blacklistBlocking|黑名单拦截 0-否 1-是||false|integer(int32)||
L25086: |&emsp;&emsp;blacklistId|黑名单分组ID列表||false|array|integer(int64)|
L25087: |&emsp;&emsp;isInterceptionRule|拦截规则 0-否 1-是||false|integer(int32)||
L25088: |&emsp;&emsp;interceptionRuleId|拦截规则分组ID列表||false|array|integer(int64)|
L25089: |&emsp;&emsp;execStatus|执行状态 1-未启动 2-进行中 3-已暂停 4-已终止||false|integer(int32)||
L25090: |&emsp;&emsp;modelType|模型类型 0-小模型 1-大模型||false|integer(int32)||
L25091: |&emsp;&emsp;accountId|一知账号ID||false|integer(int64)||
L25092: |&emsp;&emsp;channelType|通道类型 1-联友vcp 2-冰兰外呼通道||false|integer(int32)||
L25093: |&emsp;&emsp;needRecall|是否需要重呼：0-不需要，1-需要||false|integer(int32)||
L25094: |&emsp;&emsp;retryMethod|重呼方式：1-定时重呼，2-任务重呼||false|integer(int32)||
L25095: |&emsp;&emsp;plannedRetryTimes|计划重呼次数（不含首次呼叫）||false|integer(int32)||
L25096: |&emsp;&emsp;configConfirmed|配置确认：0-未确认，1-已确认||false|integer(int32)||
L25097: |&emsp;&emsp;riskConfirmed|风险确认：0-未确认，1-已确认||false|integer(int32)||
L25098: |&emsp;&emsp;customerGroupId|客群ID||false|string||
L25104: | 状态码 | 说明 | schema |
L25105: | -------- | -------- | ----- | 
L25106: |200|OK|ResultVOVoid|
L25112: | 参数名称 | 参数说明 | 类型 | schema |
L25113: | -------- | -------- | ----- |----- | 
L25114: |result|返回码|string||
L25115: |msg|错误信息|string||
L25116: |extInfo|扩展信息|string||
L25117: |pageindex|当前页|integer(int32)|integer(int32)|
L25118: |pages|总页数|integer(int32)|integer(int32)|
L25119: |records|总记录数|integer(int32)|integer(int32)|
L25120: |rows|结果对象|object||
L25121: |success||boolean||
```

## L25210 · GET /tob/business-scene/scene-type-list
原文：L25210–L25280；Wiki：`lib-智能外呼服务任务与场景接口`；模块：业务场景相关接口。

```text
L25213: **接口地址**:`/tob/business-scene/scene-type-list`
L25216: **请求方式**:`GET`
L25219: **请求数据类型**:`application/x-www-form-urlencoded`
L25222: **响应数据类型**:`*/*`
L25225: **接口描述**:
L25231: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L25232: | -------- | -------- | ----- | -------- | -------- | ------ |
L25233: |intelligentPlatformType||query|false|integer(int32)||
L25239: | 状态码 | 说明 | schema |
L25240: | -------- | -------- | ----- | 
L25241: |200|OK|ResultVOListSimpleSceneTypeResult|
L25247: | 参数名称 | 参数说明 | 类型 | schema |
L25248: | -------- | -------- | ----- |----- | 
L25249: |result|返回码|string||
L25250: |msg|错误信息|string||
L25251: |extInfo|扩展信息|string||
L25252: |pageindex|当前页|integer(int32)|integer(int32)|
L25253: |pages|总页数|integer(int32)|integer(int32)|
L25254: |records|总记录数|integer(int32)|integer(int32)|
L25255: |rows|结果对象|array|SimpleSceneTypeResult|
L25256: |&emsp;&emsp;code|编码|integer(int32)||
L25257: |&emsp;&emsp;name|名称|string||
L25258: |success||boolean||
```

## L25427 · GET /tob/business-scene/list
原文：L25427–L25529；Wiki：`lib-智能外呼服务任务与场景接口`；模块：业务场景相关接口。

```text
L25430: **接口地址**:`/tob/business-scene/list`
L25433: **请求方式**:`GET`
L25436: **请求数据类型**:`application/x-www-form-urlencoded`
L25439: **响应数据类型**:`*/*`
L25442: **接口描述**:
L25448: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L25449: | -------- | -------- | ----- | -------- | -------- | ------ |
L25450: |companyId|租户ID|query|false|string||
L25451: |sceneTitle|场景名称|query|false|string||
L25452: |sceneType|场景类型 1-督办 2-服务 3-回访 4-新线索 5-冷线索|query|false|string||
L25453: |timeOrder|排序 0-倒序 1-升序|query|false|string||
L25454: |intelligentPlatformType|智能平台类型 1-冰兰 2-科大讯飞 3-一知|query|false|string||
L25455: |page|页码，不传是默认为1|query|false|string||
L25456: |perPage|每页数量，不传是默认为10|query|false|string||
L25462: | 状态码 | 说明 | schema |
L25463: | -------- | -------- | ----- | 
L25464: |200|OK|ResultVOListIccaiBusinessSceneListResult|
L25470: | 参数名称 | 参数说明 | 类型 | schema |
L25471: | -------- | -------- | ----- |----- | 
L25472: |result|返回码|string||
L25473: |msg|错误信息|string||
L25474: |extInfo|扩展信息|string||
L25475: |pageindex|当前页|integer(int32)|integer(int32)|
L25476: |pages|总页数|integer(int32)|integer(int32)|
L25477: |records|总记录数|integer(int32)|integer(int32)|
L25478: |rows|结果对象|array|IccaiBusinessSceneListResult|
L25479: |&emsp;&emsp;id|主键id|integer(int64)||
L25480: |&emsp;&emsp;companyId|租户ID|integer(int64)||
L25481: |&emsp;&emsp;companyName|租户名称|string||
L25482: |&emsp;&emsp;sceneTitle|场景名称|string||
L25483: |&emsp;&emsp;sceneCode|场景编码|string||
L25484: |&emsp;&emsp;sceneType|场景类型 1-督办 2-服务 3-回访 4-新线索 5-冷线索|integer(int32)||
L25485: |&emsp;&emsp;sceneTypeName|场景类型名称|string||
L25486: |&emsp;&emsp;sceneDesc|场景描述|string||
L25487: |&emsp;&emsp;status|状态 0-禁用 1-启用|integer(int32)||
L25488: |&emsp;&emsp;intelligentPlatformType|智能平台类型 1-冰兰 2-科大讯飞 3-一知|integer(int32)||
L25489: |&emsp;&emsp;execStatus|执行状态 1-未启动 2-进行中 3-已暂停 4-已终止|integer(int32)||
L25490: |&emsp;&emsp;strategyId|AI任务调度策略ID|integer(int64)||
L25491: |&emsp;&emsp;strategyName|AI任务调度策略名称|string||
L25492: |&emsp;&emsp;modifier|修改者|string||
L25493: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L25494: |success||boolean||
```

## L25681 · GET /tob/business-scene/detail/{id}
原文：L25681–L25932；Wiki：`lib-智能外呼服务任务与场景接口`；模块：业务场景相关接口。

```text
L25684: **接口地址**:`/tob/business-scene/detail/{id}`
L25687: **请求方式**:`GET`
L25690: **请求数据类型**:`application/x-www-form-urlencoded`
L25693: **响应数据类型**:`*/*`
L25696: **接口描述**:
L25702: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L25703: | -------- | -------- | ----- | -------- | -------- | ------ |
L25704: |id|要查询的记录id|path|true|integer(int64)||
L25710: | 状态码 | 说明 | schema |
L25711: | -------- | -------- | ----- | 
L25712: |200|OK|ResultVOIccaiBusinessSceneResult|
L25718: | 参数名称 | 参数说明 | 类型 | schema |
L25719: | -------- | -------- | ----- |----- | 
L25720: |result|返回码|string||
L25721: |msg|错误信息|string||
L25722: |extInfo|扩展信息|string||
L25723: |pageindex|当前页|integer(int32)|integer(int32)|
L25724: |pages|总页数|integer(int32)|integer(int32)|
L25725: |records|总记录数|integer(int32)|integer(int32)|
L25726: |rows||IccaiBusinessSceneResult|IccaiBusinessSceneResult|
L25727: |&emsp;&emsp;id|主键id|integer(int64)||
L25728: |&emsp;&emsp;companyId|租户ID|integer(int64)||
L25729: |&emsp;&emsp;sceneTitle|场景名称|string||
L25730: |&emsp;&emsp;sceneCode|场景编码|string||
L25731: |&emsp;&emsp;sceneType|场景类型 1-督办 2-服务 3-回访 4-新线索 5-冷线索|integer(int32)||
L25732: |&emsp;&emsp;sceneDesc|场景描述|string||
L25733: |&emsp;&emsp;status|状态 0-禁用 1-启用|integer(int32)||
L25734: |&emsp;&emsp;intelligentPlatformType|智能平台类型 1-冰兰 2-科大讯飞 3-一知|integer(int32)||
L25735: |&emsp;&emsp;dataImportType|数据导入方式 1-手动导入 2-接口传入|integer(int32)||
L25736: |&emsp;&emsp;robotId|机器人ID|string||
L25737: |&emsp;&emsp;phoneNumber|话术ID|string||
L25738: |&emsp;&emsp;taskUuid|科大讯飞场景ID|string||
L25739: |&emsp;&emsp;channelIdColl|通道ID集合|string||
L25740: |&emsp;&emsp;channelIdCollList|通道ID列表|array|integer(int64)|
L25741: |&emsp;&emsp;priority|任务优先级 1-低 2-中 3-高 4-紧急|integer(int32)||
L25742: |&emsp;&emsp;callWeekSlotColl|呼叫时段 1-周一 2-周二 3-周三 4-周四 5-周五 6-周六 7-周日|string||
L25743: |&emsp;&emsp;callWeekSlotCollList|呼叫时段周列表 1-周一 2-周二 3-周三 4-周四 5-周五 6-周六 7-周日|array|integer(int32)|
L25744: |&emsp;&emsp;callTimeSlotColl|呼叫时段列表|string||
L25745: |&emsp;&emsp;mergeCallTimeSlotList|呼叫时段合集|array|MergeCallTimeSlotResult|
L25746: |&emsp;&emsp;&emsp;&emsp;callWeekSlotCollList|呼叫时段周列表 1-周一 2-周二 3-周三 4-周四 5-周五 6-周六 7-周日|array|integer|
L25747: |&emsp;&emsp;&emsp;&emsp;callTimeSlotList|呼叫时段列表|array|CallTimeSlotList|
L25748: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;id|主键id|integer(int64)||
L25749: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;begin|开始时间|string||
L25750: |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;end|结束时间|string||
L25751: |&emsp;&emsp;mergeCallTimeSlotColl|呼叫时段列表Json|string||
L25752: |&emsp;&emsp;excludeDateList|排除日期|array|string|
L25753: |&emsp;&emsp;excludeDateColl|排除日期json|string||
L25754: |&emsp;&emsp;isAutoStart|是否自动启动 0-否 1-是|integer(int32)||
L25755: |&emsp;&emsp;autoStartDate|自动执行日期|string(date-time)||
L25756: |&emsp;&emsp;autoRecall|自动重拨 0-否 1-是|integer(int32)||
L25757: |&emsp;&emsp;deduplicateWaitCall|待呼叫去重 0-否 1-是|integer(int32)||
L25758: |&emsp;&emsp;blacklistBlocking|黑名单拦截 0-否 1-是|integer(int32)||
L25759: |&emsp;&emsp;blacklistId|黑名单分组ID列表|array|integer(int64)|
L25760: |&emsp;&emsp;isInterceptionRule|拦截规则 0-否 1-是|integer(int32)||
L25761: |&emsp;&emsp;interceptionRuleId|拦截规则分组ID列表|array|integer(int64)|
L25762: |&emsp;&emsp;execStatus|执行状态 1-未启动 2-进行中 3-已暂停 4-已终止|integer(int32)||
L25763: |&emsp;&emsp;creator|创建者|string||
L25764: |&emsp;&emsp;createdDate|创建时间|string(date-time)||
L25765: |&emsp;&emsp;modifier|修改者|string||
L25766: |&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
L25767: |&emsp;&emsp;callTimeSlotList|呼叫时段列表|array|CallTimeSlotList|
L25768: |&emsp;&emsp;&emsp;&emsp;id|主键id|integer(int64)||
L25769: |&emsp;&emsp;&emsp;&emsp;begin|开始时间|string||
L25770: |&emsp;&emsp;&emsp;&emsp;end|结束时间|string||
L25771: |&emsp;&emsp;notAnswerRecallConfig||IccaiRecallConfigResult|IccaiRecallConfigResult|
L25772: |&emsp;&emsp;&emsp;&emsp;id|自动重拨配置主键id|integer(int64)||
L25773: |&emsp;&emsp;&emsp;&emsp;intelligentPlatformType|智能平台类型 1-冰兰 2-科大讯飞 3-一知|integer(int32)||
L25774: |&emsp;&emsp;&emsp;&emsp;firstCallStatus|首次呼叫状态 2-无人接听 3-占线 4-拒接 5-空号 6-关机 7-停机 9-无法接通 13-分机号错误 14-呼叫受限 15-主叫欠费 16-呼损客户|integer(int32)||
L25775: |&emsp;&emsp;&emsp;&emsp;recallQuantity|重拨次数|integer(int32)||
L25776: |&emsp;&emsp;&emsp;&emsp;recallInterval|重拨间隔（分钟）|integer(int32)||
L25777: |&emsp;&emsp;&emsp;&emsp;status|状态 0-禁用 1-启用|integer(int32)||
L25778: |&emsp;&emsp;&emsp;&emsp;recallDays|重拨天数|integer(int32)||
L25779: |&emsp;&emsp;&emsp;&emsp;recallIntervalColl|重拨间隔（分钟）合集Json|string||
L25780: |&emsp;&emsp;&emsp;&emsp;recallIntervalList|重拨间隔（分钟）合集|array|integer|
L25781: |&emsp;&emsp;recallConfigList|自动重拨配置列表|array|IccaiRecallConfigResult|
L25782: |&emsp;&emsp;&emsp;&emsp;id|自动重拨配置主键id|integer(int64)||
L25783: |&emsp;&emsp;&emsp;&emsp;intelligentPlatformType|智能平台类型 1-冰兰 2-科大讯飞 3-一知|integer(int32)||
L25784: |&emsp;&emsp;&emsp;&emsp;firstCallStatus|首次呼叫状态 2-无人接听 3-占线 4-拒接 5-空号 6-关机 7-停机 9-无法接通 13-分机号错误 14-呼叫受限 15-主叫欠费 16-呼损客户|integer(int32)||
L25785: |&emsp;&emsp;&emsp;&emsp;recallQuantity|重拨次数|integer(int32)||
L25786: |&emsp;&emsp;&emsp;&emsp;recallInterval|重拨间隔（分钟）|integer(int32)||
L25787: |&emsp;&emsp;&emsp;&emsp;status|状态 0-禁用 1-启用|integer(int32)||
L25788: |&emsp;&emsp;&emsp;&emsp;recallDays|重拨天数|integer(int32)||
L25789: |&emsp;&emsp;&emsp;&emsp;recallIntervalColl|重拨间隔（分钟）合集Json|string||
L25790: |&emsp;&emsp;&emsp;&emsp;recallIntervalList|重拨间隔（分钟）合集|array|integer|
L25791: |&emsp;&emsp;sceneInputParamList|场景传入参数|array|IccaiSceneInfoResult|
L25792: |&emsp;&emsp;&emsp;&emsp;fieldName|字段名称|string||
L25793: |&emsp;&emsp;&emsp;&emsp;paramName|参数名|string||
L25794: |&emsp;&emsp;&emsp;&emsp;isNecessary|是否必填 0-否 1-是|integer(int32)||
L25795: |&emsp;&emsp;&emsp;&emsp;infoType|信息类型 1-场景传入信息 2-场景提取信息|integer(int32)||
L25796: |&emsp;&emsp;sceneExtractParamList|场景提取参数|array|IccaiSceneInfoResult|
L25797: |&emsp;&emsp;&emsp;&emsp;fieldName|字段名称|string||
L25798: |&emsp;&emsp;&emsp;&emsp;paramName|参数名|string||
L25799: |&emsp;&emsp;&emsp;&emsp;isNecessary|是否必填 0-否 1-是|integer(int32)||
L25800: |&emsp;&emsp;&emsp;&emsp;infoType|信息类型 1-场景传入信息 2-场景提取信息|integer(int32)||
L25801: |&emsp;&emsp;modelType|模型类型 0-小模型 1-大模型|integer(int32)||
L25802: |&emsp;&emsp;accountId|一知账号ID|integer(int64)||
L25803: |&emsp;&emsp;channelType|通道类型 1-联友vcp 2-冰兰外呼通道|integer(int32)||
L25804: |&emsp;&emsp;callLineCode|外呼线路编码|string||
L25805: |&emsp;&emsp;needRecall|是否需要重呼：0-不需要，1-需要|integer(int32)||
L25806: |&emsp;&emsp;retryMethod|重呼方式：1-定时重呼，2-任务重呼|integer(int32)||
L25807: |&emsp;&emsp;plannedRetryTimes|计划重呼次数（不含首次呼叫）|integer(int32)||
L25808: |&emsp;&emsp;configConfirmed|配置确认：0-未确认，1-已确认|integer(int32)||
L25809: |&emsp;&emsp;riskConfirmed|风险确认：0-未确认，1-已确认|integer(int32)||
L25810: |&emsp;&emsp;customerGroupId|客群ID|string||
L25811: |success||boolean||
```

## L26211 · POST /tob/billing-record/statistics
原文：L26211–L26312；Wiki：`lib-智能外呼服务通话报表与计费接口`；模块：计费记录相关接口。

```text
L26214: **接口地址**:`/tob/billing-record/statistics`
L26217: **请求方式**:`POST`
L26220: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L26223: **响应数据类型**:`*/*`
L26226: **接口描述**:
L26248: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L26249: | -------- | -------- | ----- | -------- | -------- | ------ |
L26250: |billingRecordStatisticsParam|BillingRecordStatisticsParam|body|true|BillingRecordStatisticsParam|BillingRecordStatisticsParam|
L26251: |&emsp;&emsp;page|页码，不传是默认为1||false|integer(int32)||
L26252: |&emsp;&emsp;perPage|每页数量，不传是默认为10||false|integer(int32)||
L26253: |&emsp;&emsp;beginStatisticsDate|计费时间-开始||false|string(date-time)||
L26254: |&emsp;&emsp;endStatisticsDate|计费时间-结束||false|string(date-time)||
L26255: |&emsp;&emsp;companyId|租户ID（计费详情必传）||false|integer(int64)||
L26256: |&emsp;&emsp;timeOrder|时间排序 0-倒序 1-升序||false|integer(int32)||
L26257: |&emsp;&emsp;statisticsDate|计费时间-开始||false|string(date-time)||
L26263: | 状态码 | 说明 | schema |
L26264: | -------- | -------- | ----- | 
L26265: |200|OK|ResultVOListBillingRecordStatisticsResult|
L26271: | 参数名称 | 参数说明 | 类型 | schema |
L26272: | -------- | -------- | ----- |----- | 
L26273: |result|返回码|string||
L26274: |msg|错误信息|string||
L26275: |extInfo|扩展信息|string||
L26276: |pageindex|当前页|integer(int32)|integer(int32)|
L26277: |pages|总页数|integer(int32)|integer(int32)|
L26278: |records|总记录数|integer(int32)|integer(int32)|
L26279: |rows|结果对象|array|BillingRecordStatisticsResult|
L26280: |&emsp;&emsp;beginStatisticsDate|计费时间-开始|string(date-time)||
L26281: |&emsp;&emsp;endStatisticsDate|计费时间-结束|string(date-time)||
L26282: |&emsp;&emsp;companyId|租户ID|integer(int64)||
L26283: |&emsp;&emsp;companyName|租户名称|string||
L26284: |&emsp;&emsp;totalCallDuration|通话总时长|integer(int32)||
L26285: |&emsp;&emsp;totalCost|费用合计|number||
L26286: |success||boolean||
```

## L26313 · POST /tob/billing-record/statisticsDetail
原文：L26313–L26416；Wiki：`lib-智能外呼服务通话报表与计费接口`；模块：计费记录相关接口。

```text
L26316: **接口地址**:`/tob/billing-record/statisticsDetail`
L26319: **请求方式**:`POST`
L26322: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L26325: **响应数据类型**:`*/*`
L26328: **接口描述**:
L26350: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L26351: | -------- | -------- | ----- | -------- | -------- | ------ |
L26352: |billingRecordStatisticsParam|BillingRecordStatisticsParam|body|true|BillingRecordStatisticsParam|BillingRecordStatisticsParam|
L26353: |&emsp;&emsp;page|页码，不传是默认为1||false|integer(int32)||
L26354: |&emsp;&emsp;perPage|每页数量，不传是默认为10||false|integer(int32)||
L26355: |&emsp;&emsp;beginStatisticsDate|计费时间-开始||false|string(date-time)||
L26356: |&emsp;&emsp;endStatisticsDate|计费时间-结束||false|string(date-time)||
L26357: |&emsp;&emsp;companyId|租户ID（计费详情必传）||false|integer(int64)||
L26358: |&emsp;&emsp;timeOrder|时间排序 0-倒序 1-升序||false|integer(int32)||
L26359: |&emsp;&emsp;statisticsDate|计费时间-开始||false|string(date-time)||
L26365: | 状态码 | 说明 | schema |
L26366: | -------- | -------- | ----- | 
L26367: |200|OK|ResultVOListBillingRecordStatisticsDetailResult|
L26373: | 参数名称 | 参数说明 | 类型 | schema |
L26374: | -------- | -------- | ----- |----- | 
L26375: |result|返回码|string||
L26376: |msg|错误信息|string||
L26377: |extInfo|扩展信息|string||
L26378: |pageindex|当前页|integer(int32)|integer(int32)|
L26379: |pages|总页数|integer(int32)|integer(int32)|
L26380: |records|总记录数|integer(int32)|integer(int32)|
L26381: |rows|结果对象|array|BillingRecordStatisticsDetailResult|
L26382: |&emsp;&emsp;statisticsDate|计费时间|string(date-time)||
L26383: |&emsp;&emsp;companyId|租户ID|integer(int64)||
L26384: |&emsp;&emsp;companyName|租户名称|string||
L26385: |&emsp;&emsp;totalCallDuration|通话总时长|integer(int32)||
L26386: |&emsp;&emsp;totalCost|费用合计|number||
L26387: |&emsp;&emsp;intelligentPlatformType|智能平台类型 1-冰兰 2-科大讯飞 3-一知|integer(int32)||
L26388: |&emsp;&emsp;modelType|模型 0小模型1大模型|integer(int32)||
L26389: |success||boolean||
```

## L29561 · POST /iccai/open/systemCallback
原文：L29561–L29650；Wiki：`lib-智能外呼服务回调与开放接口`；模块：提供给外部系统接口。

```text
L29564: **接口地址**:`/iccai/open/systemCallback`
L29567: **请求方式**:`POST`
L29570: **请求数据类型**:`application/x-www-form-urlencoded,application/json`
L29573: **响应数据类型**:`*/*`
L29576: **接口描述**:
L29601: | 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
L29602: | -------- | -------- | ----- | -------- | -------- | ------ |
L29603: |systemCallbackListParam|SystemCallbackListParam|body|true|SystemCallbackListParam|SystemCallbackListParam|
L29604: |&emsp;&emsp;params|参数信息||false|array|SystemCallbackParam|
L29605: |&emsp;&emsp;&emsp;&emsp;batchNumber|批次号||false|string||
L29606: |&emsp;&emsp;&emsp;&emsp;phone|手机号||false|string||
L29607: |&emsp;&emsp;&emsp;&emsp;distributeIntentLevelCode|下发意向级别||false|string||
L29608: |&emsp;&emsp;&emsp;&emsp;distributeIntentLevelName|下发意向级别名称||false|string||
L29609: |&emsp;&emsp;&emsp;&emsp;distributeDealerCode|下发门店编码||false|string||
L29610: |&emsp;&emsp;&emsp;&emsp;distributeDealerName|下发门店名称||false|string||
L29616: | 状态码 | 说明 | schema |
L29617: | -------- | -------- | ----- | 
L29618: |200|OK|ResultVOVoid|
L29624: | 参数名称 | 参数说明 | 类型 | schema |
L29625: | -------- | -------- | ----- |----- | 
L29626: |result|返回码|string||
L29627: |msg|错误信息|string||
L29628: |extInfo|扩展信息|string||
L29629: |pageindex|当前页|integer(int32)|integer(int32)|
L29630: |pages|总页数|integer(int32)|integer(int32)|
L29631: |records|总记录数|integer(int32)|integer(int32)|
L29632: |rows|结果对象|object||
L29633: |success||boolean||
```

