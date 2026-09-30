# 系统时序接口核验矩阵

> 项目：AliCti独立原型需求分析  
> 生成时间：2026-09-11T15:52:32+08:00  
> 本文档由结构化事实源自动汇编。

S4 先按业务场景核验接口；S5 再回填实际时序引用。关联时序为空不代表不需要接口。

| ID | 接口/事件 | 提供方 | 来源场景 | 关联时序 | 核验状态 | 认证 | 超时 | 幂等 | 限流 | 来源 |
|---|---|---|---|---|---|---|---|---|---|---|
| API-301 | 服务端接口签名 | AliCti | SC-001、SC-003、SC-005、SC-006、SC-007、SC-008、SC-009、SC-011、SC-014、SC-015、SC-019、SC-020、SC-101、SC-105、SC-204、SC-206 | — | partial | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | https://wiki.alicti.cn/html/wiki/API/权限验证/接口鉴权.html |
| API-302 | 坐席前端登录鉴权 | AliCti | SC-102、SC-103、SC-017、SC-018 | SEQ-102 | partial | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | https://wiki.alicti.cn/html/wiki/API/权限验证/座席前端登录鉴权.html |
| API-303 | CTILink初始化与电话上线 | AliCti | SC-102、SC-103、SC-017、SC-018 | SEQ-102 | partial | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | https://wiki.alicti.cn/html/wiki/工具条/快速入门.html |
| API-304 | 坐席状态与退出 | AliCti | SC-102、SC-103、SC-017、SC-018、SC-105 | SEQ-102、SEQ-103 | partial | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | https://wiki.alicti.cn/html/wiki/工具条/座席操作.html |
| API-305 | 人工预览外呼及会话控制 | AliCti | SC-103、SC-017、SC-018 | SEQ-103 | partial | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | https://wiki.alicti.cn/html/wiki/工具条/座席通话操作.html |
| API-306 | WebRTC软电话操作 | AliCti | SC-103、SC-017、SC-018 | SEQ-017 | partial | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | https://wiki.alicti.cn/html/wiki/工具条/软电话通话操作.html |
| API-307 | 新增坐席 | AliCti | SC-003、SC-101 | SEQ-003 | partial | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | https://wiki.alicti.cn/html/wiki/API/座席数据管理/座席新增.html |
| API-308 | 更新坐席 | AliCti | SC-005、SC-101 | SEQ-005 | partial | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | https://wiki.alicti.cn/html/wiki/API/座席数据管理/座席更新.html |
| API-309 | 批量全量替换技能 | AliCti | SC-007 | SEQ-007 | partial | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | https://wiki.alicti.cn/html/wiki/API/座席数据管理/批量更新座席技能列表.html |
| API-310 | 企业号码查询 | AliCti | SC-008、SC-009、SC-011 | SEQ-008 | partial | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | https://wiki.alicti.cn/html/wiki/API/配置管理/企业管理/获取企业号码列表接口.html |
| API-311 | 预测与自动IVR任务创建 | AliCti | SC-014、SC-015、SC-105、SC-204 | SEQ-014、SEQ-015 | partial | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | https://wiki.alicti.cn/html/wiki/API/预测式外呼/新增任务接口.html |
| API-312 | 任务号码导入 | AliCti | SC-014、SC-015、SC-204 | SEQ-014、SEQ-015 | partial | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | https://wiki.alicti.cn/html/wiki/API/预测式外呼/任务号码导入接口.html |
| API-313 | 暂停任务 | AliCti | SC-009、SC-014、SC-015、SC-105 | SEQ-105 | partial | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | https://wiki.alicti.cn/html/wiki/API/预测式外呼/任务暂停接口.html |
| API-314 | 结束任务 | AliCti | SC-009、SC-014、SC-015、SC-105 | SEQ-105 | partial | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | https://wiki.alicti.cn/html/wiki/API/预测式外呼/任务结束接口.html |
| API-315 | 配置HTTP推送 | AliCti | SC-014、SC-015、SC-017、SC-018、SC-019、SC-104、SC-205 | SEQ-019 | partial | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | https://wiki.alicti.cn/html/wiki/API/配置管理/推送管理/新增推送设置接口.html |
| API-316 | 企业WebSocket事件 | AliCti | SC-102、SC-103、SC-017、SC-018、SC-019、SC-105 | SEQ-019 | partial | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | https://wiki.alicti.cn/html/wiki/工具条/企业WebSocket事件推送接口说明.html |
| API-317 | 人工外呼话单 | AliCti | SC-019、SC-020、SC-104、SC-205 | SEQ-019 | partial | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | https://wiki.alicti.cn/html/wiki/API/通话记录/外呼/外呼记录接口.html |
| API-318 | 预测外呼话单 | AliCti | SC-014、SC-019、SC-020、SC-104、SC-205 | SEQ-014、SEQ-019 | partial | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | https://wiki.alicti.cn/html/wiki/API/通话记录/预测式外呼/预测外呼通话记录接口.html |
| API-319 | 呼入话单 | AliCti | SC-017、SC-018、SC-019、SC-020、SC-104、SC-205 | SEQ-017、SEQ-018、SEQ-019 | partial | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | https://wiki.alicti.cn/html/wiki/API/通话记录/来电/客户来电记录接口.html |
| API-320 | 录音地址 | AliCti | SC-019、SC-104、SC-205 | SEQ-019、SEQ-104 | partial | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | https://wiki.alicti.cn/html/wiki/API/通话记录/获取通话录音地址接口.html |
| API-321 | ASR文本 | AliCti | SC-019、SC-104、SC-205 | SEQ-019、SEQ-104 | partial | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | https://wiki.alicti.cn/html/wiki/API/ASR语音转写/ASR数据获取接口.html |
| API-322 | 导入IVR定义 | AliCti | SC-011、SC-015、SC-017 | SEQ-011 | partial | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | https://wiki.alicti.cn/html/wiki/API/配置管理/语音导航管理/导入ivr信息接口.html |
| API-323 | 查询已执行IVR流程 | AliCti | SC-017、SC-018、SC-019 | — | partial | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | https://wiki.alicti.cn/html/wiki/API/通话记录/获取IVR流程接口.html |
| API-324 | 资源开通、删除、技能建组及共享号码路由 | AliCti | SC-001、SC-003、SC-005、SC-006、SC-008、SC-009、SC-011、SC-017、SC-018、SC-206 | — | missing | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | inputs/alicti-interface-review.md |
| API-325 | 任务启动、恢复与状态查证 | AliCti | SC-014、SC-015、SC-105、SC-204、SC-206 | — | missing | 按各接口文档鉴权；长期密钥仅保留服务端。enterpriseId为供应商账号ID，UUID不参与接口。 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | inputs/alicti-interface-review.md |
| API-326 | 中台账号、客户、授权、统计及既有AI域 | 中台/既有AI供应商 | SC-001、SC-002、SC-003、SC-005、SC-006、SC-007、SC-008、SC-009、SC-011、SC-014、SC-015、SC-016、SC-019、SC-020、SC-101、SC-102、SC-103、SC-104、SC-105、SC-201、SC-203、SC-204、SC-205、SC-206 | — | not_required | 沿用中台权限与既有AI域边界 | — | 供应商幂等保证未确认；本方业务去重不等价于供应商幂等 | — | inputs/alicti-interface-review.md |

## 待处理缺口

- **API-301 · 服务端接口签名**：partial；MD5(enterpriseId+timestamp+部门token)，32位小写；时间戳有效30分钟；/cc接口单独核对。
- **API-302 · 坐席前端登录鉴权**：partial；sessionKey有效30秒；JSONP包装及字符串JSON解析按文档；后端先核验当前登录用户/租户/坐席关系。
- **API-303 · CTILink初始化与电话上线**：partial；先setup及注册事件，再取得短效材料并Agent.login。登录成功不等于媒体就绪；跨设备互斥与重连需POC。
- **API-304 · 坐席状态与退出**：partial；loginStatus 1空闲2忙碌；logoutMode 1完全退出、0后台仍在线；qids监督权限不能授给普通运营。
- **API-305 · 人工预览外呼及会话控制**：partial；previewOutcall是人工呼叫；请求成功不等于客户接听；requestUniqueId无已证实幂等保证。mute为切换操作，禁止盲重试。
- **API-306 · WebRTC软电话操作**：partial；浏览器权限、媒体连通与业务状态分开；CTILink具体版本需真实验证。
- **API-307 · 新增坐席**：partial；isAsr默认0；不得混同平台账号与供应商坐席；超时先查存在性，查询契约待补。
- **API-308 · 更新坐席**：partial；在线状态可能禁止修改；停用/恢复在途保护尚未实测，删除及查证契约未齐。
- **API-309 · 批量全量替换技能**：partial；skillIds=0清空；skillLevels越小优先级越高；合法值域待确认，不预设取值范围；逐坐席判断部分失败。
- **API-310 · 企业号码查询**：partial；每页最多1000；可查询不代表可开通/停用/改路由。
- **API-311 · 预测与自动IVR任务创建**：partial；任务最多100；同坐席一个运行任务，同组多个绑定仅一个运行；最少空闲默认10，允许1–10；autoComplete默认1且完成不可重启；不启用autoDelete。
- **API-312 · 任务号码导入**：partial；单批10万、任务100万、8MB；默认isRepeat=1全任务去重可能吞跨批同号；来源ID须property贯通验证；导入失败明细由推送补。
- **API-313 · 暂停任务**：partial；pauseDuration默认0但单位待补；暂停后在途是否续完、确认延迟待POC；不把受理立即画为已停。
- **API-314 · 结束任务**：partial；终止不可当作暂停；在途保护和结果结算待实测。
- **API-315 · 配置HTTP推送**：partial；类型16/17/42/52/53覆盖预测/任务/失败；12录音13ASR18IVR40/41话单；顶层重试0–3，嵌套策略未完全明确，需本方重复乱序处理与回查。
- **API-316 · 企业WebSocket事件**：partial；企业最多10连接；/user/agent默认全席，后端按租户过滤；心跳30–120秒；重放与可靠补偿未明确。
- **API-317 · 人工外呼话单**：partial；upTime坐席接听，bridgeTime客户接听；状态1客户未接2坐席未接3客户接听4坐席接听。单次起止<=1月，普通分页最多10万。
- **API-318 · 预测外呼话单**：partial；upTime客户接听，bridgeTime坐席接听，与人工相反；40客户未接41客户接听42坐席未接43双方接听；异步更新终态须校准。
- **API-319 · 呼入话单**：partial；系统接听不能算人工服务成功；租户归属须由呼入路由来源链确定。
- **API-320 · 录音地址**：partial；默认120分钟可配置；mp3/wav，分轨仅wav且需开通；不是永久业务地址。
- **API-321 · ASR文本**：partial；result=-2转写中；时间单位、偏移及多段录音对齐待确认，演示交互不等于真实媒体验收。
- **API-322 · 导入IVR定义**：partial；示例与标题存在export/import冲突；导入成功不证明发布、绑定号码、租户分支路由已完成。
- **API-323 · 查询已执行IVR流程**：partial；只查询某次通话已执行节点，不能作为已发布IVR列表。
- **API-324 · 资源开通、删除、技能建组及共享号码路由**：missing；菜单存在不等于契约已核验；缺查询/创建技能组/坐席删除/号码控制/IVR发布绑定/任务删除等具体证据。原型显示待配置或模拟状态，不承诺已开通。
- **API-325 · 任务启动、恢复与状态查证**：missing；相关契约尚未逐页核验；创建和导入显式不自动启动；未明确支持的启动、恢复或删除行为显示待确认。
