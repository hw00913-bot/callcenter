# DCC门店v2当前知识查询快照

> 生成时间：2026-10-19T10:25:11+08:00
> 当前页：lib-经销商口语化地址接口
> 页面更新时间：2026-10-19
> 页面SHA256：74256254a0adbdca8284a7a633f943ec1227731712a47839115f505dddb7cc90
> active来源：raw/dealer-spoken-address-api@v2
> 状态：partial（部分可用）；本快照仅消费当前结论，不含迁移规则。

## 当前结论

本页当前接入依据为《查询经销商扩展信息接口（外部对接文档）》的v2契约。DCC业务系统归属来自PM此前明确确认，不是新文件自证；来源说明保留该确认的出处。服务路径版本与本库证据版本分开记录，不据文件名推定生产部署或旧接口停用。

### 当前v2契约

| 范围 | 新文档明确的规则 |
|---|---|
| 调用 | POST /third-api/clue/listDealerInfoExtend/v2；请求application/json（UTF-8），响应application/json |
| 请求字段 | sourceType、page、perPage、provinceName、cityName共5项；传入其他字段不生效 |
| 来源与分页 | sourceType必填NEV/ICE，不区分大小写；page/perPage为Integer选填；page从1开始 |
| 地域筛选 | provinceName、cityName选填，均模糊匹配 |
| 返回 | 6个顶层字段；records正式定义为int总记录数；rows共14字段 |
| 来源差异 | rows的8项字段共有；dlrFullName、spokenAddress、授权车系2字段、试驾车系2字段共6项在ICE为null |
| 默认NEV范围 | 排除黑名单，且授权包含ARIYA；不能当作全量NEV门店 |

### 使用边界与待补项

| 检查项 | 证据边界 |
|---|---|
| 分页 | 默认值与perPage上限未说明；请求样例perPage=20不是默认值依据 |
| 鉴权与部署 | 未给主机、鉴权、频率或完整错误码；未调用任何接口验证 |
| 坐标 | 腾讯地图经纬度均为字符串；未说明坐标系、转换方向或精度 |
| 示例 | records=2而rows仅1项，保留源样例，不视为完整分页正确性基线 |
| 主数据 | [[门店]] 的591家统计不因接口筛选或样例改变；样例仅演示结构 |
| 其他服务 | [[平台通用服务经销商车型与区域接口]] 是另一个服务契约，不合并主机、鉴权或数据版本 |

按字段表，ICE保留统一返回结构，对标“—”的6项返回null；不把注意事项中的“不返回”擅自解释为字段一定省略。完整字段类型、NEV/ICE适用范围、请求与响应样例如下，源文件正文完整保留。

### 查询经销商扩展信息接口（外部对接文档）

#### 1. 接口说明

查询经销商扩展信息，支持新能源（NEV）与油车（ICE）两类数据源。

| 项 | 内容 |
|---|---|
| 接口地址 | `POST /third-api/clue/listDealerInfoExtend/v2` |
| 请求方式 | POST |
| 请求格式 | `application/json`（UTF-8） |
| 响应格式 | `application/json` |

---

#### 2. 请求参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| sourceType | String | 是 | 数据来源：`NEV`-新能源；`ICE`-油车（不区分大小写） |
| page | Integer | 否 | 页码，从 1 开始 |
| perPage | Integer | 否 | 每页条数 |
| provinceName | String | 否 | 省份名称，模糊匹配 |
| cityName | String | 否 | 城市名称，模糊匹配 |

> 除上述参数外，其他字段传入不生效。

##### 请求示例

```json
{
  "sourceType": "NEV",
  "page": 1,
  "perPage": 20,
  "provinceName": "广东",
  "cityName": "深圳"
}
```

---

#### 3. 响应参数

| 字段 | 类型 | 说明 |
|---|---|---|
| result | String | 处理结果标识 |
| msg | String | 提示信息 |
| pageindex | int | 当前页码 |
| pages | int | 总页数 |
| records | int | 总记录数 |
| rows | Array | 数据列表 |

##### rows 明细字段

| 字段 | 类型 | 说明 | NEV | ICE |
|---|---|---|---|---|
| dealerName | String | 门店简称 | ✅ | ✅ |
| dealerCode | String | 门店编码 | ✅ | ✅ |
| address | String | 门店地址 | ✅ | ✅ |
| provinceName | String | 省份 | ✅ | ✅ |
| cityName | String | 城市 | ✅ | ✅ |
| countyName | String | 区县 | ✅ | ✅ |
| tencentLongitude | String | 腾讯地图经度 | ✅ | ✅ |
| tencentLatitude | String | 腾讯地图纬度 | ✅ | ✅ |
| dlrFullName | String | 公司名称 | ✅ | — |
| spokenAddress | String | 口头位置信息 | ✅ | — |
| carSeriesCn | String | 授权车系名称（逗号分隔） | ✅ | — |
| carSeriesCnCarSeriesCode | String | 授权车系名称-编码映射 | ✅ | — |
| testDriveSeriesCn | String | 试驾车系名称（逗号分隔） | ✅ | — |
| testDriveSeriesCnCode | String | 试驾车系编码（逗号分隔） | ✅ | — |

> 标注 `—` 的字段在对应数据源下返回空值（null）。

##### 响应示例

```json
{
  "result": "1",
  "msg": "",
  "pageindex": 1,
  "pages": 1,
  "records": 2,
  "rows": [
    {
      "dealerName": "深圳XX专营店",
      "dlrFullName": "深圳XX汽车销售服务有限公司",
      "address": "广东省深圳市...",
      "spokenAddress": "宝安大道附近",
      "provinceName": "广东省",
      "cityName": "深圳市",
      "countyName": "宝安区",
      "dealerCode": "D0001",
      "carSeriesCn": "ARIYA,奇骏",
      "carSeriesCnCarSeriesCode": "ARIYA-AE01,奇骏-AE02",
      "tencentLongitude": "113.883",
      "tencentLatitude": "22.555",
      "testDriveSeriesCn": "ARIYA",
      "testDriveSeriesCnCode": "AE01"
    }
  ]
}
```

---

#### 4. 注意事项

1. `sourceType` 为必填，缺失将返回参数校验错误。
2. NEV 与 ICE 返回结构一致，但 NEV 字段更全；ICE 不返回公司名称、口语化地址、车系相关字段，对接时请做空值容错。
3. 车系名称/编码字段为逗号分隔字符串，多值时需自行拆分。
4. NEV 数据源默认仅返回已排除黑名单、且授权含 ARIYA 车系的门店。
