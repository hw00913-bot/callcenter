# 报表接口专项核验（2026-09-16）

本次读取官方文档；没有调用供应商业务接口或进行真实联调。详细字段表和来源摘要见 `contract-review.json` 及 `official-current/`。

## 已核实的新增来源

| 用途 | 官方接口 | 使用边界 |
|---|---|---|
| 两类任务累计 | `/interface/v10/outboundReport/predictiveObReport` | 模型明确 taskType=1预测、2自动。totalCount是号码总数，calledCount是呼叫次数，不能当名单完成数。 |
| 预测外呼日报 | `/interface/v10/outboundReport/predictiveDailyObReport` | 日期范围查询，answerMinutes是客户侧分钟；总计只取totalStatistic一次。 |
| 预测外呼坐席统计 | `/interface/v10/outboundReport/predictiveAgentObReport` | 工号、外呼组、队列名称；状态时长不是话单通话时长。 |
| 队列统计 | `/interface/v10/queueReport` | 按qno、日期/时段统计，不能自动映射成本地技能组。 |
| 自动外呼任务话单 | `/cc/list_cdr_auto_task` | 客户侧和机器人/转人工字段分开，不能见工号就判定人工接通。 |
| 呼入坐席分段 | `/cc/list_cdr_ib_agent` | uniqueId为分段、mainUniqueId为整通关联，提供各段cno/qno/bridgeDuration。 |

## 容易算错的口径

- API317的upTime是坐席接起、bridgeTime是客户接听；API318顺序相反。API319的answerTime仅是系统应答。
- 一通来电流转两名坐席仍是一通通话。cnoFlow和qnoFlow不能按位置强行配对，不能将整通时长复制给每位坐席；分段用新坐席接听记录。
- 供应商累计、日报、队列汇总、通话与坐席分段是不同统计粒度，不能混加。百分比也不能直接平均。
- 号码总数、已处理名单、呼叫次数、重呼次数各自保留。新建演示任务缺少明确报表样本时不伪造供应商累计。
- 队列模型telEnterCount/telAnswerCount中文描述与示例冲突，原值保留，本轮不自行交换语义。

## 品牌及线索维度

基础数据按enterpriseId选择客户/品牌，总部和门店共享账号；本轮线索样本新增显式brandId（BRAND-NISSAN、BRAND-EPI），不以显示名称猜测品牌身份。brandCustomerName只是显示名称，不能用来跨账号合并。先过滤当前账号及租户权限，再按照同品牌的原始字符串线索编码合并；0012与12不同，空编码不合并，售后/活动编码不进入线索归并。客户档案仍沿用其原有手机号归档规则。

## 验证状态

新增纯报表适配已通过26项合成边界检查，包括真实随包16任务样本加载；独立浏览器已完成46项界面、权限、下载和真实UI保存检查，全部通过；初次快照编辑版本冲突及返回父层刷新问题修复后已实际复验。详见browser-verification.json。此处不宣称真实接口联调通过。
