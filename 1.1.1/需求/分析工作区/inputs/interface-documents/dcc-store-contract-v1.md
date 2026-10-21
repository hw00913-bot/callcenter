# 查询经销商口语化地址接口——PM粘贴表格净化整理

该文件是聊天中粘贴表格的净化整理转录，不是原始附件的逐字节副本。仅规范空白排版、重排宽表和将响应JSON中的HTML换行转为换行；保留业务字段、类型、备注、空项、原始编号异常及示例结构。示例2条记录各5处名称/位置/编码按PM确认改为占位符。未调用任何接口。

## 服务说明

| 原表项目 | 原表内容 |
|---|---|
| 服务编码* | |
| 调用频率 | |
| 服务名称* | 查询经销商口语化地址接口 |
| 服务说明 | |
| 请求方式 | POST |
| 内容类型 | |
| 请求URL | /third-api/clue/listDealerInfoExtend |

## 参数说明

| 序号 | 参数中文名 | 参数编码 | 数据类型 | 长度 | 格式 | 必填 | 是否校验参数有效 | 备注 |
|---|---|---|---|---|---|---|---|---|
| 1 | 页码 | page | 字符 |  |  | 必填 | 是 | 页码，不传是默认为1 |
| 2 | 每页数量 | per_page | 字符 |  |  | 必填 | 是 | 每页数量，不传是默认为10 |

原表“参数示例（JSON格式）”为空，未补写请求体或传输位置。

## 返回值说明

| 序号 | 返回值中文名 | 返回值编码 | 数据类型 | 长度 | 格式 | 必填 | 备注 |
|---|---|---|---|---|---|---|---|
| 1 | 扩展信息 | extInfo | 字符 |  |  |  |  |
| 2 | 错误信息 | msg | 字符 |  |  |  |  |
| 3 | 返回码 | result | 字符 |  |  |  |  |
| 4 | 当前页 | pageindex | 整型 |  |  |  |  |
| 5 | 总页数 | pages | 整型 |  |  |  |  |
| 4 | 返回对象 | rows | 数组 |  |  |  |  |
| 4.1 | 门店简称 | dealerName | 字符 |  |  |  |  |
| 4.2 | 公司名称 | dlrFullName | 字符 |  |  |  |  |
| 4.3 | 门店地址 | address | 字符 |  |  |  |  |
| 4.4 | 口头位置信息 | spokenAddress | 字符 |  |  |  |  |
| 4.5 | 省份 | provinceName | 字符 |  |  |  |  |
| 4.6 | 城市 | cityName | 字符 |  |  |  |  |
| 4.7 | 门店编码 | dealerCode | 字符 |  |  |  |  |
| 4.8 | 授权车系名称 | carSeriesCn | 字符 |  |  |  | 授权车系名称(多个逗号隔开)<br>N7,N6 |
| 4.9 | 授权车系名称 | carSeriesCnCarSeriesCode | 字符 |  |  |  | 授权车系名称-车系编码映射关系(多个逗号隔开)<br><br>N7-AE01,N6-AC01 |
| 4.10. | 腾讯地图经度 | tencentLongitude | 字符 |  |  |  | 腾讯地图经度，调用腾讯地图API转换 |
| 4.11 | 腾讯地图纬度 | tencentLatitude | 字符 |  |  |  | 腾讯地图纬度，调用腾讯地图API转换 |
| 4.12 | 地区 |  |  |  |  |  |  |

返回字段的长度、格式和必填格均为空；原表编号4同时用于pageindex和rows，4.10.末尾的点号保留；“地区”编码、类型、备注均未提供。

## 返回JSON示例（净化）

```json
{
  "result": "1",
  "pageindex": 1,
  "pages": 1,
  "records": 2,
  "msg": "操作成功",
  "rows": [
    {
      "dealerName": "<门店简称示例1>",
      "dlrFullName": "<公司名称示例1>",
      "address": "<门店地址示例1>",
      "spokenAddress": "<口头位置示例1>",
      "provinceName": "广东省",
      "cityName": "广州",
      "dealerCode": "<门店编码示例1>",
      "carSeriesCn": "N7",
      "carSeriesCnCarSeriesCode": "N7-AE01"
    },
    {
      "dealerName": "<门店简称示例2>",
      "dlrFullName": "<公司名称示例2>",
      "address": "<门店地址示例2>",
      "spokenAddress": "<口头位置示例2>",
      "provinceName": "广东省",
      "cityName": "广州",
      "dealerCode": "<门店编码示例2>",
      "carSeriesCn": "N7",
      "carSeriesCnCarSeriesCode": "N7-AE01"
    }
  ]
}
```

示例未包含extInfo及经纬度；records仅在JSON示例中出现，未增补进原字段表。2条记录仅为结构演示，不作为门店主数据。
