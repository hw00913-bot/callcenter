# 2026-09-20 今日原型回归与交付对齐

版本：`2026-09-20-daily-alignment-1`。本地检查通过，保留非阻塞观察项。

## 结论与范围

本轮核对今日原型、功能说明、规则附表、字段映射、待确认事项、业务流程、时序、系统蓝图及完整开发包。检查范围是本地演示及交付一致性；供应商生产验收仍为 planned。

## 本轮修复

- 窄桌面窗口菜单名称和子菜单可用
- 未完成重呼可保存草稿及退出，下一步/确认仍校验
- 更正管理员账号接听能力帮助文本

## 检查结果

| 项目 | 结果 |
| --- | --- |
| 浏览器实测项 | 23 |
| 自动回归组数 | 51 |
| 结构化检查项 | 1232 |
| 失败组数 | 0 |
| 其他通过专项 | 电话工具条专项通过 |
| 脚本语法检查 | 114 |
| 页面资源引用 | 151 |
| 既有官方及答复文件 | 264 |
| 说明文档一致性检查 | 190 |
| 说明文档链接 | 2999 |
| 开发交付一致性检查 | 1745 |
| 开发交付链接 | 3305 |
| 解压独立重建步骤 | 13 |
| 重建后保留原文文件 | 289 |
| 解压重建结果 | 通过 |

## 保留观察项

- **OBS-01 客户归集缓存未写入**：客户档案提示归集结果暂未保存；本次业务值在通话详情和档案可读，刷新后仍保持。 原始批次、通话和业务记录未清除；具体存储异常原因未定位；不声称派生缓存持久化已通过。

## 运行回归

| 检查组 | 结果 | 执行选项 |
| --- | --- | --- |
| skill-group-management | 通过 | 默认 |
| alicti-fields | 通过 | 默认 |
| alicti-retry | 通过 | 默认 |
| alicti-ivr | 通过 | 默认 |
| alicti-task-control | 通过 | 默认 |
| demo-fixtures | 通过 | 默认 |
| regression-fields | 通过 | 默认 |
| call-regression-fixes | 通过 | 默认 |
| task-attachment-transaction | 通过 | 默认 |
| alicti-report-facts | 通过 | 默认 |
| lead-report | 通过 | 默认 |
| alicti-report-summary | 通过 | 默认 |
| customer-followup-version | 通过 | 默认 |
| alicti-receiving | 通过 | 默认 |
| repeat-predictive | 通过 | 默认 |
| alicti-number-import | 通过 | 默认 |
| alicti-accounts | 通过 | 默认 |
| alicti-account-context | 通过 | 默认 |
| incall-followup | 通过 | 默认 |
| alicti-queue-contracts | 通过 | 默认 |
| alicti-queues | 通过 | 默认 |
| queue-config | 通过 | 默认 |
| predictive-strategy | 通过 | 默认 |
| task-time-conditions | 通过 | 默认 |
| seat-operations | 通过 | 默认 |
| seat-phone-config | 通过 | 默认 |
| tenant-call-monitor | 通过 | 默认 |
| tenant-supervisor-migration | 通过 | 默认 |
| supervisor-management | 通过 | 默认 |
| supervisor-workbench | 通过 | 默认 |
| number-resource-rules | 通过 | 默认 |
| number-tenant-scope | 通过 | 默认 |
| queue-catalog | 通过 | 默认 |
| queue-detail | 通过 | 默认 |
| queue-management | 通过 | 默认 |
| queue-multi-skills | 通过 | 默认 |
| outbound-groups | 通过 | 默认 |
| task-direct-import | 通过 | 默认 |
| delivery-navigation | 通过 | 默认 |
| seat-recreation | 通过 | 默认 |
| seat-batch-clarification | 通过 | 默认 |
| seat-reconnect | 通过 | 默认 |
| seat-reconnect-workbench | 通过 | 默认 |
| seat-cno-report | 通过 | 默认 |
| predictive-recognition | 通过 | 默认 |
| inbound-recognition | 通过 | 默认 |
| extension-management | 通过 | --jitless |
| time-conditions | 通过 | 默认 |
| business-custom-fields | 通过 | 默认 |
| seat-optional-skills | 通过 | 默认 |
| phone-toolbar-actions | 通过 | 默认 |

分机检查曾出现 Node 进程 SIGSEGV，原始失败与诊断已保留；当前显式使用 --jitless 执行全部原断言，不通过自动重试覆盖失败。生产浏览器代码不受此验证选项影响。

## 浏览器实测

| 检查 | 观察结果 |
| --- | --- |
| 窄窗口导航 | 786px窗口显示菜单名称，点击分组可展开子菜单 |
| 分机管理 | 独立菜单可打开；新增右侧抽屉包含分机、密码、区号及高级设置；取消未创建资源 |
| 时间条件 | 列表和新增表单可打开，无使用位置字段；日期/星期/时间规则可见 |
| 预外呼创建 | 任务与客户→接听团队→时间与重呼→确认；指定坐席和授权外显号码可选 |
| 任务时段校验 | 指定时段未选条件不能进入确认 |
| 重呼状态必填 | 开启重呼未选号码状态时阻止下一步并定位状态选择 |
| 未完成草稿退出 | 缺重呼状态可关闭抽屉，列表新增今日回归检查草稿；未创建供应商任务 |
| 坐席登录 | 直接读取受控分机配置，上线不要求现场选技能或外显号码 |
| 班长和外呼页签 | 同一坐席工作台两页签可切换，电话工具条全局唯一 |
| 人工预览外呼 | 已有客户可选，自动使用授权号码，未显示技能或外显选择器 |
| 通话中记录 | 拨号/通话时记录可编辑，选择业务分类加载关联自定义字段 |
| 挂断保留草稿 | 挂断后沟通备注、处理结果和分类保持 |
| 动态必填校验 | 试驾预约必填意向车型为空阻止完成，提示请填写意向车型 |
| 正式保存和自动置闲 | 补填轩逸，选填补充说明为空可保存；处理结果成功后工具条最终恢复置闲 |
| 通话详情 | 本次记录显示意向车型轩逸、选填未填写、处理备注和完成结果 |
| 客户档案刷新 | 客户档案可读取本次业务信息，刷新后仍保持；派生归集缓存告警单列观察项 |
| 自动外呼和呼入服务 | 页面可加载任务列表、呼入规则和近期接听记录 |
| 租户坐席资源 | 坐席维护/技能/外呼组/队列列表可访问，只显示本租户资源 |
| 数据报表 | 通话总览、线索成效、客户跟进可打开，业务分类包含新增试驾预约 |
| 浏览器日志 | 上述运行页面检查未捕获JavaScript warn/error |
| 功能说明文档 | 说明文档可打开，FS22–24及FA192–195动态字段内容可见 |
| 业务与时序图 | SC227/SEQ227渲染成功，字段必填、分组入档与自动置闲链路一致 |
| 系统架构蓝图 | 蓝图v1.24加载，108节点109关系的5个视图和87项接口索引可访问 |

## 交付事实

分机、时间条件与业务分类新增独立说明章节和开发契约。业务字段按分类动态读取，必填可配置；任务预约结束采用 autoStop、autoStopDay、autoStopTime。官方原始快照保留，新增来源另行归档。

既有Loop preflight历史元数据差异未改写，未推进S8或声称生产联调完成。

[完整验证记录](../qa/daily-alignment-verification-20260920.json) · [版本与变更](../docs/change-log.html) · [开发交付](../docs/development.html)
