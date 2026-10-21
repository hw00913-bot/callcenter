# 查询经销商扩展信息接口（外部对接文档）

## 1. 接口说明

查询经销商扩展信息，支持新能源（NEV）与油车（ICE）两类数据源。

| 项 | 内容 |
|---|---|
| 接口地址 | `POST /third-api/clue/listDealerInfoExtend/v2` |
| 请求方式 | POST |
| 请求格式 | `application/json`（UTF-8） |
| 响应格式 | `application/json` |

---

## 2. 请求参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| sourceType | String | 是 | 数据来源：`NEV`-新能源；`ICE`-油车（不区分大小写） |
| page | Integer | 否 | 页码，从 1 开始 |
| perPage | Integer | 否 | 每页条数 |
| provinceName | String | 否 | 省份名称，模糊匹配 |
| cityName | String | 否 | 城市名称，模糊匹配 |

> 除上述参数外，其他字段传入不生效。

### 请求示例

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

## 3. 响应参数

| 字段 | 类型 | 说明 |
|---|---|---|
| result | String | 处理结果标识 |
| msg | String | 提示信息 |
| pageindex | int | 当前页码 |
| pages | int | 总页数 |
| records | int | 总记录数 |
| rows | Array | 数据列表 |

### rows 明细字段

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

### 响应示例

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

## 4. 注意事项

1. `sourceType` 为必填，缺失将返回参数校验错误。
2. NEV 与 ICE 返回结构一致，但 NEV 字段更全；ICE 不返回公司名称、口语化地址、车系相关字段，对接时请做空值容错。
3. 车系名称/编码字段为逗号分隔字符串，多值时需自行拆分。
4. NEV 数据源默认仅返回已排除黑名单、且授权含 ARIYA 车系的门店。
