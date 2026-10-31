# 云呼叫供应商接口定义摘录（本版独立核验）

采集时间：2026-10-16T09:30:43+08:00。仅只读本地既有文档，未访问生产、未继承上游核验状态或批准。

本文是局部契约证据：能支持文档列出的端点、字段和结果语义，不能证明当前企业已开通、已部署或已完成 v2.0.0 的统一身份、四类禁呼接入。资料获取时间和实际供应商版本仍须研发核对。未摘录的契约项仍未知。

与 v1.1.0 的关系：仅复用材料作接口线索，最终业务范围等待其独立确认基线；不回写该版本。当前独立 v1.1.1 的业务字典取数接口不并入本版。

## API-301.txt
原文件：/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/inputs/interface-documents/API-301.txt
SHA256：e02a483f65f7cc9588f98f258aff38615f610bc3dc70ffb3618521e8468b070c

### 原文 L1–L21
```text
1: 接口鉴权
2: 
3: 接口说明
4: 
5: 所有接口权限验证都使用此接口方法实现，接口鉴权不能作为接口单独使用
6: 
7: API URL
8: 
9: 接口请求地址：
10: 
11: https://api-{region}.alicti.cn/interface/{version}/{interface}
12: 
13: 地址参数说明：
14: 
15: {region}为alicti平台区域，{region}=1 表示华东1区，{region}=2 表示华北2区，{region}=5 表示华东5区，{region}=6 表示华北6区
16: 
17: {version}为接口版本，当前{version}=v10，{interface}接口路径，如/{interface}=webcall
18: 
19: 接口请求方式：
20: 
21: GET/POST
```

### 原文 L31–L64
```text
31: validateType | 
32: Int | 
33: 必选 | 
34: 验证类型 | 
35: 取值1，2； 取值说明：
36: validateType=1时使用部门编号(departmentId)进行验证；
37: validateType=2时使用呼叫中心编号(enterpriseId)进行验证； | 
38: 
39: departmentId | 
40: String | 
41: 必选 | 
42: 部门编号 | 
43: 说明：validateType=1时，此参数为必选参数，例如：departmentId=BM0000001； | 
44: 
45: enterpriseId | 
46: Int | 
47: 必选 | 
48: 呼叫中心编号 | 
49: 说明：validateType=2时，此参数为必选参数，例如：enterpriseId=7000101； | 
50: 
51: timestamp | 
52: Int | 
53: 必选 | 
54: 当前时间戳 | 
55: 说明：取当前linux时间戳，精确到s，时间戳有效期为30分钟 | 
56: 
57: sign | 
58: String | 
59: 必选 | 
60: 验证值 | 
61: 说明： 
62: validateType=1时，sign=MD5({departmentId}+{timestamp}+{部门token值})； 
63: validateType=2时，sign=MD5({enterpriseId}+{timestamp}+{部门token值})； 
64: 格式要求：32位全小写 | 
```

## API-311.txt
原文件：/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/inputs/interface-documents/API-311.txt
SHA256：2edab6c1ccb813d81997b94e2891f6b6196777984529e4362afd8036c583d46e

### 原文 L1–L5
```text
1: 新增任务接口
2: 
3: 接口说明
4: 
5: 接口支持创建预测外呼和自动外呼任务，任务类型通过type字段区分。
```

### 原文 L55–L71
```text
55: 接口定义
56: 
57: API URL
58: 
59: 接口请求地址：
60: 
61: https://api-{region}.alicti.cn/interface/{version}/task/create
62: 
63: 地址参数说明：
64: 
65: {region}为alicti平台区域，{region}=1 表示华东1区，{region}=2 表示华北2区，{region}=5 表示华东5区，{region}=6 表示华北6区
66: 
67: {version}为接口版本，当前{version}=v10
68: 
69: 接口请求方式：
70: 
71: GET/POST请求
```

### 原文 L140–L144
```text
140: type | 
141: Int | 
142: 必选 | 
143: 任务类型 | 
144: 1.预测外呼任务 2.自动外呼任务。外呼任务创建后任务类型不支持修改 | 
```

### 原文 L375–L387
```text
375: ivrId | 
376: Int | 
377: 可选 | 
378: 语音导航Id | 
379: 参数ivrId和ivrName二选一，同时传入时ivrId生效，在创建自动外呼任务时ivrId或ivrName必选其一。
380: 预测外呼使用场景：直连座席模式下如果客户接听后未在特定时间内（默认2秒）找到可用座席，通话将溢出到语音导航继续排队找座席。同时支持在呼转座席，座席未接听时也溢出到语音导航，需要开启企业配置生效。AI转人工模式下，呼叫先转到语音导航
381: 自动外呼使用场景：客户接听后，转到的语音导航 | 
382: 
383: ivrName | 
384: String | 
385: 可选 | 
386: 语音导航名称 | 
387: 参数ivrId和ivrName二选一，同时传入时ivrId生效，在创建自动外呼任务时ivrId或ivrName必选其一。 | 
```

### 原文 L558–L576
```text
558: result | 
559: Int | 
560: 0 成功, -1 失败 | 
561: 
562: description | 
563: String | 
564: 返回结果描述 | 
565: 
566: errorCode | 
567: Int | 
568: 错误码,当返回result=-1时，返回该参数 | 
569: 
570: data | 
571: JSON | 
572: 返回数据JSON格式 | 
573: 
574: description给出成功或失败时的文本描述：
575: 
576: description | 
```

## API-312.txt
原文件：/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/inputs/interface-documents/API-312.txt
SHA256：8d6f1e0b2a7f876f0fd23bc013221776fc048197a369ec45ce10b21c583c98ea

### 原文 L1–L7
```text
1: 任务号码导入接口
2: 
3: 接口说明
4: 
5: 按批次导入号码，一次导入一个批次
6: 
7: 限制：一个批次最多10w个号码，一个任务最多100w个号码，一个企业最多1000w个号码
```

### 原文 L31–L47
```text
31: API URL
32: 
33: 接口请求地址：
34: 
35: https://api-{region}.alicti.cn/interface/{version}/task/importTaskTel
36: 
37: 地址参数说明：
38: 
39: {region}为alicti平台区域，{region}=1 表示华东1区，{region}=2 表示华北2区，{region}=5 表示华东5区，{region}=6 表示华北6区
40: 
41: {version}为接口版本，当前{version}=v10
42: 
43: 接口请求方式：
44: 
45: POST请求
46: 
47: 请求参数为Json数据格式
```

### 原文 L100–L110
```text
100: taskId | 
101: Int | 
102: 必选 | 
103: 任务Id | 
104:  | 
105: 
106: fileId | 
107: Int | 
108: 可选 | 
109: 批次Id | 
110: 传此值表示在批次中增加号码 | 
```

### 原文 L137–L161
```text
137: taskTelList | 
138: List<TaskTel> | 
139: 必选 | 
140: 任务号码列表 | 
141: CtiLinkTaskTel中只有Tel是必选字段，长度大小不超过8MB 
142:  注：获取导入失败明细，需配置事件推送 | 
143: 
144: importTelAutoStart | 
145: Int | 
146: 可选 | 
147: 是否自动启动任务 | 
148: 0:不自动启动 1:自动启动，默认为0 | 
149: 
150: TaskTel 参数定义：
151: 
152: 字段 | 
153: 类型 | 
154: 要求 | 
155: 描述 | 
156: 
157: tel | 
158: String | 
159: 必选 | 
160: 电话号 | 
161: 
```

### 原文 L221–L243
```text
221: 接口返回
222: 
223: JSON格式数据：
224: 
225: 参数 | 
226: 类型 | 
227: 说明 | 
228: 
229: result | 
230: Int | 
231: 0 成功, -1 失败 | 
232: 
233: description | 
234: String | 
235: 返回结果描述 | 
236: 
237: errorCode | 
238: Int | 
239: 错误码,当返回result=-1时，返回该参数 | 
240: 
241: data | 
242: JSON | 
243: 返回数据JSON格式 | 
```

## API-315.txt
原文件：/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/inputs/interface-documents/API-315.txt
SHA256：e9cfbc9575adbd0b9cca1d016d563e863e87e17f26aced2863320e47b5e367b1

### 原文 L1–L19
```text
1: 新增推送设置接口
2: 
3: 接口说明
4: 
5: 创建一条新的推送设置。目标配置支持两种方式：
6: 
7: 目标接口模式：传 targetUrlId，关联已存在的目标接口
8: 
9: 直配模式：直接传 url、method、contentType、timeout
10: 
11: 如果两种方式同时传入，服务端优先以 targetUrlId 对应的目标接口配置为准。
12: 
13: 接口路径：/cc/create_push_action
14: 
15: 请求方式：POST
16: 
17: Content-Type：application/json
18: 
19: 鉴权方式：请参考接口鉴权
```

### 原文 L176–L209
```text
176: 预览外呼座席接听推送 | 
177: 
178: 23 | 
179: 主叫外呼分机响铃推送 | 
180: 
181: 24 | 
182: 主叫外呼分机接听推送 | 
183: 
184: 25 | 
185: 主叫外呼客户侧响铃推送 | 
186: 
187: 26 | 
188: 主叫外呼双方接听推送 | 
189: 
190: 31 | 
191: 预测外呼客户侧响铃推送 | 
192: 
193: 16 | 
194: 预测外呼客户接听推送 | 
195: 
196: 17 | 
197: 预测外呼双方接听推送 | 
198: 
199: 42 | 
200: 预测外呼任务状态推送 | 
201: 
202: 52 | 
203: 预测外呼呼叫失败推送 | 
204: 
205: 53 | 
206: 预测外呼导入号码失败结果推送 | 
207: 
208: 1060 | 
209: 预测外呼降级执行结果推送 | 
```

## API-318.txt
原文件：/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/inputs/interface-documents/API-318.txt
SHA256：7575d8b70247164894c8db6161f68e259fc2d8db2af3c3a1716de27e1d30fbb0

### 原文 L1–L19
```text
1: 查询预测外呼通话记录列表接口
2: 
3: 接口说明
4: 
5: 通过本接口，可以查询预测外呼通话记录列表，包括客户接听状态、座席接听情况、任务信息、IVR 信息、通话结果等详细信息。
6: 
7: API URL
8: 
9: 接口请求地址：
10: 
11: https://api-{region}.alicti.cn/cc/list_cdr_predictive_call
12: 
13: 地址参数说明：
14: 
15: {region}为alicti平台区域，{region}=1 表示华东1区，{region}=2 表示华北2区，{region}=5 表示华东5区，{region}=6 表示华北6区
16: 
17: 接口请求方式：
18: 
19: GET
```

### 原文 L29–L38
```text
29: startTime | 
30: Long | 
31: 必选 | 
32: 开始时间，时间戳格式精确到秒。默认值取当前月份第一天 | 
33: 1708398399 | 
34: 
35: startTimeEnd | 
36: Long | 
37: 必选 | 
38: 开始时间查询截止，时间戳格式精确到秒，开始时间和结束时间跨度不能超过一个月。默认值取当前时间 | 
```

### 原文 L431–L457
```text
431: onHookSource | 
432: String | 
433: 挂断方 | 
434: 
435: tsiFile | 
436: String | 
437: 客户彩铃录音 | 
438: 
439: recordFile | 
440: String | 
441: 录音 | 
442: 
443: asrRecord | 
444: Integer | 
445: 转写记录标识 | 
446: 
447: callId | 
448: String | 
449: CallID | 
450: 
451: webrtcCallId | 
452: String | 
453: WebRTCCallId | 
454: 
455: cno | 
456: String | 
457: 座席工号 | 
```

## deleteTaskTel.txt
原文件：/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/inputs/interface-documents/deleteTaskTel.txt
SHA256：6b0f597adfc755dd4e6b77890ea3fcdea6e6cf1f6beb5bc760b8e616363d93f6

### 原文 L1–L24
```text
1: 任务号码删除接口
2: 接口说明
3: 任务号码删除接口
4: 号码删除顺序说明：
5: 注：建议在任务非运行状态下删除号码
6: 按号码或属性删除（最高优先级）
7: 支持tels参数
8: 任务运行中可删除
9: 按批次删除
10: 支持fileId或fileName
11: 任务运行中可删除
12: 按号码状态删除
13: 支持status参数
14: 任务运行中可删除
15: 删除整个任务号码（最低优先级）
16: 仅任务初始或结束状态可删除
17: API URL
18: 接口请求地址：
19: https://api-{region}.alicti.cn/interface/{version}/task/deleteTaskTel
20: 地址参数说明：
21: {region}为alicti平台区域，{region}=1 表示华东1区，{region}=2 表示华北2区，{region}=5 表示华东5区，{region}=6 表示华北6区
22: {version}为接口版本，当前{version}=v10
23: 接口请求方式：
24: GET/POST请求
```

### 原文 L63–L95
```text
63: taskId
64: Int
65: 必选
66: 任务Id
67: fileId
68: Int
69: 可选
70: 批次Id
71: fileName
72: String
73: 可选
74: 批次名称
75: 按照名称删除会删除最近添加的批次
76: status
77: Int
78: 可选
79: 号码状态
80: 0:未呼叫 1:已呼叫
81: tels
82: String
83: 可选
84: 电话号码
85: 支持多个，多个号码用英文逗号","分隔；任务在运行中，号码也会被删除，最多支持10W个号码；支持加密号码删除，加密号码传参时需URL Encode
86: skipCalling
87: Int
88: 可选
89: 是否跳过呼叫中号码
90: 0或不传：呼叫中号码也删除（默认，兼容原行为）；1：跳过呼叫中号码不删除，其余号码正常删除。部分成功仍返回成功，跳过的号码见返回data.skippedCallingTels。与 skipRetry 互斥，不能同时为1
91: skipRetry
92: Int
93: 可选
94: 是否跳过重呼号码
95: 0或不传：已呼叫号码同样清缓存并写墓碑（默认）；1：跳过重呼（已呼叫）号码的缓存与墓碑，仅删除数据库；未呼叫号码仍删除数据库、缓存并写墓碑。与 skipCalling 互斥
```

### 原文 L98–L120
```text
98: 接口返回
99: 参数
100: 类型
101: 说明
102: result
103: Int
104: 0 成功, -1 失败
105: description
106: String
107: 返回结果描述
108: errorCode
109: Int
110: 错误码,当返回result=-1时，返回该参数
111: data
112: Object
113: 可选。当skipCalling=1且存在因呼叫中被跳过的号码时返回
114: data字段说明：
115: 参数
116: 类型
117: 说明
118: skippedCallingTels
119: List<String>
120: 因处于呼叫中而被跳过、未删除的电话号码列表
```

## API-404.txt
原文件：/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/inputs/interface-documents/API-404.txt
SHA256：26a98d27741cab4149855aaa809d67bfc9c6633b4f9a261888d32129ef9cd53b

### 原文 L1–L12
```text
1: 更新任务接口
2: 接口说明
3: 更新外呼任务属性。
4: 接口定义
5: API URL
6: 接口请求地址：
7: https://api-{region}.alicti.cn/interface/{version}/task/update
8: 地址参数说明：
9: {region}为alicti平台区域，{region}=1 表示华东1区，{region}=2 表示华北2区，{region}=5 表示华东5区，{region}=6 表示华北6区
10: {version}为接口版本，当前{version}=v10
11: 接口请求方式：
12: GET/POST请求
```

## 解释边界

- API-301 是 AliCti 服务间鉴权，不是人员登录或统一会话方案。
- API-311 的 type=1/2 与 IVR 参数不等于本系统公共业务分类，也不代表增加 AI 转人工或规则引擎。
- API-312 的 result=0 不证明每条号码实际导入或呼叫成功，逐条失败仍需推送及关联。
- deleteTaskTel 文档说明 skipCalling=1 可以部分成功并返回 skippedCallingTels；它不能证明所有供应商已接收未拨号码均能及时拦截，也不能替代公共禁呼。
- API-315 列出了电话与任务事件；没有提供本版需要的电话坐席离线命令、确认时点及统一身份映射契约。
- API-318 是预测话单查询，不能作为全部人工/呼入/IVR话单及全部报表、资源维护接口的证明。
- 原文中的限制、默认值和能力只属于相应文档版本，不直接变成本版的新业务规则。
