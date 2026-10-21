## 查询基础车系表列表


**接口地址**:`/organization/car-series/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|userId|用户id,关联base_user表id|query|false|string||
|id|主键id|query|false|string||
|companyId|公司ID（用途：数据权限）|query|false|string||
|carSeriesName|车系名称|query|false|string||
|flagSystemState|系统状态:0-停用,1-可用|query|false|string||
|forSaleFlag|是否在售:1-是;0-否|query|false|string||
|page|页码，不传是默认为1|query|false|string||
|perPage|每页数量，不传是默认为10|query|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultVOListBaseCarSeriesListResult|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|result|返回码|string||
|msg|错误信息|string||
|extInfo|扩展信息|string||
|pageindex|当前页|integer(int32)|integer(int32)|
|pages|总页数|integer(int32)|integer(int32)|
|records|总记录数|integer(int32)|integer(int32)|
|rows|结果对象|array|BaseCarSeriesListResult|
|&emsp;&emsp;userId|用户id,关联base_user表id|integer(int64)||
|&emsp;&emsp;id|主键id|integer(int64)||
|&emsp;&emsp;companyId|公司ID（用途：数据权限）|integer(int64)||
|&emsp;&emsp;carSeriesCode|车系编码|string||
|&emsp;&emsp;carSeriesName|车系名称|string||
|&emsp;&emsp;flagSystemState|系统状态:0-停用,1-可用|integer(int32)||
|&emsp;&emsp;carSeriesImage|车系图片地址|string||
|&emsp;&emsp;remark|备注|string||
|&emsp;&emsp;sortOrder|排序 越小越靠前|integer(int32)||
|&emsp;&emsp;forSaleFlag|是否在售:1-是;0-否|integer(int32)||
|&emsp;&emsp;lowestPrice|最低价格,单位万元|number||
|&emsp;&emsp;highestPrice|最高价格,单位万元|number||
|&emsp;&emsp;discountFlag|是否有优惠政策:1-是;0-否|integer(int32)||
|&emsp;&emsp;discountDesc|优惠政策描述|string||
|&emsp;&emsp;exchangeSubsidyFlag|是否有置换补贴:1-是;0-否|integer(int32)||
|&emsp;&emsp;exchangeSubsidyDesc|置换补贴描述|string||
|&emsp;&emsp;financialPolicyFlag|是否有金融政策:1-是;0-否|integer(int32)||
|&emsp;&emsp;financialPolicyDesc|金融政策描述|string||
|&emsp;&emsp;warrantyFlag|是否有质保政策:1-是;0-否|integer(int32)||
|&emsp;&emsp;warrantyDesc|质保政策描述|string||
|&emsp;&emsp;introduction|介绍|string||
|&emsp;&emsp;creator|创建者|string||
|&emsp;&emsp;createdDate|创建时间|string(date-time)||
|&emsp;&emsp;modifier|修改者|string||
|&emsp;&emsp;modifiedDate|修改时间|string(date-time)||
|&emsp;&emsp;carType|车辆类型：1-SUV、2-轿车、3-卡车、4-MPV、5-皮卡|integer(int32)||
|&emsp;&emsp;energyType|车系能源类型：1-纯电、2-燃油、3-插混、4-增程、5-混动|integer(int32)||
|success||boolean||


**响应示例**:
```javascript
{
	"result": "",
	"msg": "",
	"extInfo": "",
	"pageindex": 0,
	"pages": 0,
	"records": 0,
	"rows": [
		{
			"userId": 0,
			"id": 0,
			"companyId": 0,
			"carSeriesCode": "",
			"carSeriesName": "",
			"flagSystemState": 0,
			"carSeriesImage": "",
			"remark": "",
			"sortOrder": 0,
			"forSaleFlag": 0,
			"lowestPrice": 0,
			"highestPrice": 0,
			"discountFlag": 0,
			"discountDesc": "",
			"exchangeSubsidyFlag": 0,
			"exchangeSubsidyDesc": "",
			"financialPolicyFlag": 0,
			"financialPolicyDesc": "",
			"warrantyFlag": 0,
			"warrantyDesc": "",
			"introduction": "",
			"creator": "",
			"createdDate": "",
			"modifier": "",
			"modifiedDate": "",
			"carType": 0,
			"energyType": 0
		}
	],
	"success": true
}
```

