# 冻结功能与页面双向核对

核对范围：82 项功能、47 项页面规划；以冻结版本为准。复用业务功能按页面入口与源码核对，供应商差异按适配器与待确认行为核对。浏览器覆盖 5 个演示账号、云域 85 次和 AI 域 47 次可见路由访问。交互实测集中在人工通话闭环、任务创建不启动、新增坐席、登录异常及缺失能力阻断；没有声称逐个穷举所有继承弹窗或完成供应商联调。

| 功能 | 页面及实现入口 | 本期处理 |
|---|---|---|
| FUNC-201 建立登录上下文 | PAGE-201 login → js/app.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-202 退出登录上下文 | PAGE-201 login → js/app.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-203 校验业务域访问权限 | PAGE-201 login → js/app.js；PAGE-207 related-systems/index.html → related-systems/index.html；PAGE-230 ai-tasks → js/pages/scene-list.js, js/pages/home.js；PAGE-231 ai-blocklist → js/pages/scene-block.js；PAGE-232 ai-channels → js/pages/ai-domain.js；PAGE-233 ai-scenes → js/pages/sys-scene.js；PAGE-234 ai-tags → js/pages/sys-tags.js；PAGE-235 ai-call-records → js/pages/result-records.js；PAGE-236 ai-leads → js/pages/result-clue.js；PAGE-237 ai-call-report → js/pages/report-call.js；PAGE-238 ai-billing-report → js/pages/report-billing.js；PAGE-239 ai-lead-report → js/pages/report-clue.js；PAGE-241 scene-list:detail → js/pages/scene-list.js, js/pages/home.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-204 创建租户 | PAGE-203 tenants → js/pages/account-tenant.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-205 修改租户授权 | PAGE-203 tenants → js/pages/account-tenant.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-206 查询租户 | PAGE-203 tenants → js/pages/account-tenant.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-207 创建账号并加入租户 | PAGE-202 accounts → js/pages/account-tenant.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-208 复用账号加入租户 | PAGE-202 accounts → js/pages/account-tenant.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-209 查询账号 | PAGE-202 accounts → js/pages/account-tenant.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-101 关联已有账号与坐席 | PAGE-202 accounts → js/pages/account-tenant.js；PAGE-101 agent-maintenance → js/pages/agent-center.js；PAGE-245 accounts:seat-link → js/pages/account-tenant.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-210 单个开通坐席 | PAGE-202 accounts → js/pages/account-tenant.js；PAGE-101 agent-maintenance → js/pages/agent-center.js；PAGE-245 accounts:seat-link → js/pages/account-tenant.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-211 导入已有坐席 | PAGE-101 agent-maintenance → js/pages/agent-center.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-213 重新同步失败项 | PAGE-205 sync-records → js/pages/agent-center.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-214 停用坐席 | PAGE-102 home → js/pages/home.js；PAGE-101 agent-maintenance → js/pages/agent-center.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-215 恢复坐席 | PAGE-101 agent-maintenance → js/pages/agent-center.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-216 删除坐席关联 | PAGE-101 agent-maintenance → js/pages/agent-center.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-217 查询坐席 | PAGE-102 home → js/pages/home.js；PAGE-101 agent-maintenance → js/pages/agent-center.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-218 查询同步记录 | PAGE-205 sync-records → js/pages/agent-center.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-219 创建服务技能配置 | PAGE-206 skill-mappings → js/pages/agent-center.js, js/pages/contact-center-settings.js, js/pages/resource-lines.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-220 查询技能配置 | PAGE-206 skill-mappings → js/pages/agent-center.js, js/pages/contact-center-settings.js, js/pages/resource-lines.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-221 添加技能组成员 | PAGE-204 agent-skills → js/pages/agent-center.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-222 修改坐席技能等级 | PAGE-204 agent-skills → js/pages/agent-center.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-223 移出技能组成员 | PAGE-204 agent-skills → js/pages/agent-center.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-224 查询坐席技能关系 | PAGE-204 agent-skills → js/pages/agent-center.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-229 登记已开通线路 | PAGE-220 lines → js/pages/contact-center-settings.js, js/pages/resource-lines.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-230 查询线路 | PAGE-102 home → js/pages/home.js；PAGE-220 lines → js/pages/contact-center-settings.js, js/pages/resource-lines.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-231 导入企业号码 | PAGE-221 numbers → js/pages/contact-center-settings.js, js/pages/resource-lines.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-232 加入供应商账号号码 | PAGE-221 numbers → js/pages/contact-center-settings.js, js/pages/resource-lines.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-233 查询号码 | PAGE-221 numbers → js/pages/contact-center-settings.js, js/pages/resource-lines.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-234 保存租户用号授权 | PAGE-222 numbers:detail → js/pages/contact-center-settings.js, js/pages/resource-lines.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-235 查询租户用号授权 | PAGE-222 numbers:detail → js/pages/contact-center-settings.js, js/pages/resource-lines.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-236 隔离号码业务使用 | PAGE-221 numbers → js/pages/contact-center-settings.js, js/pages/resource-lines.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-237 恢复号码业务使用 | PAGE-221 numbers → js/pages/contact-center-settings.js, js/pages/resource-lines.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-238 导入客户批次 | PAGE-209 customer-tasks → js/pages/customer-demo.js, js/pages/customer-tasks.js；PAGE-210 customer-tasks:import → js/pages/customer-demo.js, js/pages/customer-tasks.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-239 查询客户批次 | PAGE-209 customer-tasks → js/pages/customer-demo.js, js/pages/customer-tasks.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-240 分配客户 | PAGE-211 customer-tasks:detail → js/pages/customer-demo.js, js/pages/customer-tasks.js；PAGE-215 cloud-task-create → js/pages/cloud-task-workspace.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-241 改派客户 | PAGE-211 customer-tasks:detail → js/pages/customer-demo.js, js/pages/customer-tasks.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-242 查询批次客户 | PAGE-209 customer-tasks → js/pages/customer-demo.js, js/pages/customer-tasks.js；PAGE-211 customer-tasks:detail → js/pages/customer-demo.js, js/pages/customer-tasks.js；PAGE-216 cloud-task-center → js/pages/cloud-task-workspace.js；PAGE-246 cloud-customer-report → js/pages/report-center.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-243 查看客户联系记录 | PAGE-209 customer-tasks → js/pages/customer-demo.js, js/pages/customer-tasks.js；PAGE-211 customer-tasks:detail → js/pages/customer-demo.js, js/pages/customer-tasks.js；PAGE-216 cloud-task-center → js/pages/cloud-task-workspace.js；PAGE-246 cloud-customer-report → js/pages/report-center.js；PAGE-244 customer-directory:detail → js/pages/customer-directory.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-244 归集客户联系结果 | PAGE-211 customer-tasks:detail → js/pages/customer-demo.js, js/pages/customer-tasks.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-245 创建预外呼任务 | PAGE-213 predictive-tasks → js/pages/cloud-call-tasks.js；PAGE-215 cloud-task-create → js/pages/cloud-task-workspace.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-246 创建IVR外呼任务 | PAGE-214 ivr-tasks → js/pages/cloud-call-tasks.js；PAGE-215 cloud-task-create → js/pages/cloud-task-workspace.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-247 保存任务草稿 | PAGE-215 cloud-task-create → js/pages/cloud-task-workspace.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-248 查询外呼任务 | PAGE-213 predictive-tasks → js/pages/cloud-call-tasks.js；PAGE-214 ivr-tasks → js/pages/cloud-call-tasks.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-249 启动外呼任务 | PAGE-216 cloud-task-center → js/pages/cloud-task-workspace.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-110 查看任务执行详情 | PAGE-102 home → js/pages/home.js；PAGE-213 predictive-tasks → js/pages/cloud-call-tasks.js；PAGE-214 ivr-tasks → js/pages/cloud-call-tasks.js；PAGE-216 cloud-task-center → js/pages/cloud-task-workspace.js；PAGE-226 cloud-outbound-report → js/pages/report-center.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-111 暂停任务 | PAGE-216 cloud-task-center → js/pages/cloud-task-workspace.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-112 继续任务 | PAGE-216 cloud-task-center → js/pages/cloud-task-workspace.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-113 终止任务 | PAGE-216 cloud-task-center → js/pages/cloud-task-workspace.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-250 删除未启动任务 | PAGE-213 predictive-tasks → js/pages/cloud-call-tasks.js；PAGE-214 ivr-tasks → js/pages/cloud-call-tasks.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-251 保存呼入服务规则 | PAGE-217 inbound-service → js/pages/cloud-call-tasks.js；PAGE-218 inbound-routes → js/nav.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-252 查询呼入服务规则 | PAGE-217 inbound-service → js/pages/cloud-call-tasks.js；PAGE-218 inbound-routes → js/nav.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-253 接待客户呼入 | PAGE-217 inbound-service → js/pages/cloud-call-tasks.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-254 执行呼入兜底 | PAGE-217 inbound-service → js/pages/cloud-call-tasks.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-255 查看供应商账号资源概览 | PAGE-102 home → js/pages/home.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-256 查看租户任务概览 | PAGE-102 home → js/pages/home.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-257 查看本人待联络与成效 | PAGE-242 seat-workbench → js/pages/agent-workbench.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-258 开启本人电话服务 | PAGE-240 seat-workbench:call-dialog → js/pages/agent-workbench.js；PAGE-242 seat-workbench → js/pages/agent-workbench.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-259 关闭本人电话服务 | PAGE-240 seat-workbench:call-dialog → js/pages/agent-workbench.js；PAGE-242 seat-workbench → js/pages/agent-workbench.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-104 发起人工呼叫 | PAGE-240 seat-workbench:call-dialog → js/pages/agent-workbench.js；PAGE-242 seat-workbench → js/pages/agent-workbench.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-260 静音本人通话 | PAGE-240 seat-workbench:call-dialog → js/pages/agent-workbench.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-261 取消本人通话静音 | PAGE-240 seat-workbench:call-dialog → js/pages/agent-workbench.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-262 结束本人通话 | PAGE-240 seat-workbench:call-dialog → js/pages/agent-workbench.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-106 保存处理结果 | PAGE-240 seat-workbench:call-dialog → js/pages/agent-workbench.js；PAGE-242 seat-workbench → js/pages/agent-workbench.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-263 归一通话结果 | PAGE-103 cloud-call-records → js/pages/cloud-task-workspace.js, js/pages/report-center.js, js/pages/cloud-call-records.js, js/pages/customer-directory.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-264 查询通话记录 | PAGE-103 cloud-call-records → js/pages/cloud-task-workspace.js, js/pages/report-center.js, js/pages/cloud-call-records.js, js/pages/customer-directory.js；PAGE-225 cloud-overview-report → js/pages/report-center.js；PAGE-227 cloud-inbound-report → js/pages/report-center.js；PAGE-228 cloud-agent-report → js/pages/report-center.js；PAGE-229 cloud-skill-report → js/pages/report-center.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-265 查看通话详情 | PAGE-102 home → js/pages/home.js；PAGE-103 cloud-call-records → js/pages/cloud-task-workspace.js, js/pages/report-center.js, js/pages/cloud-call-records.js, js/pages/customer-directory.js；PAGE-104 cloud-call-records:detail → js/pages/cloud-task-workspace.js, js/pages/report-center.js, js/pages/cloud-call-records.js, js/pages/customer-directory.js；PAGE-225 cloud-overview-report → js/pages/report-center.js；PAGE-227 cloud-inbound-report → js/pages/report-center.js；PAGE-228 cloud-agent-report → js/pages/report-center.js；PAGE-229 cloud-skill-report → js/pages/report-center.js；PAGE-244 customer-directory:detail → js/pages/customer-directory.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-266 播放通话录音 | PAGE-104 cloud-call-records:detail → js/pages/cloud-task-workspace.js, js/pages/report-center.js, js/pages/cloud-call-records.js, js/pages/customer-directory.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-270 查询通话数据异常 | PAGE-102 home → js/pages/home.js；PAGE-223 event-callbacks → js/pages/system-center.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-271 补查遗漏通话数据 | PAGE-223 event-callbacks → js/pages/system-center.js | 文档未明确部分保持待确认；已支持部分仅本地模拟 |
| FUNC-108 归集云呼叫统计 | PAGE-225 cloud-overview-report → js/pages/report-center.js；PAGE-246 cloud-customer-report → js/pages/report-center.js；PAGE-226 cloud-outbound-report → js/pages/report-center.js；PAGE-227 cloud-inbound-report → js/pages/report-center.js；PAGE-228 cloud-agent-report → js/pages/report-center.js；PAGE-229 cloud-skill-report → js/pages/report-center.js；PAGE-242 seat-workbench → js/pages/agent-workbench.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-272 查询云呼叫报表 | PAGE-225 cloud-overview-report → js/pages/report-center.js；PAGE-246 cloud-customer-report → js/pages/report-center.js；PAGE-226 cloud-outbound-report → js/pages/report-center.js；PAGE-227 cloud-inbound-report → js/pages/report-center.js；PAGE-228 cloud-agent-report → js/pages/report-center.js；PAGE-229 cloud-skill-report → js/pages/report-center.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-273 导出云呼叫报表 | PAGE-225 cloud-overview-report → js/pages/report-center.js；PAGE-246 cloud-customer-report → js/pages/report-center.js；PAGE-226 cloud-outbound-report → js/pages/report-center.js；PAGE-227 cloud-inbound-report → js/pages/report-center.js；PAGE-228 cloud-agent-report → js/pages/report-center.js；PAGE-229 cloud-skill-report → js/pages/report-center.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-274 查询操作审计 | PAGE-224 audit → js/pages/system-center.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-275 导出操作审计 | PAGE-224 audit → js/pages/system-center.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-276 查询手机号客户档案 | PAGE-243 customer-directory → js/pages/customer-directory.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-277 查看手机号档案详情 | PAGE-246 cloud-customer-report → js/pages/report-center.js；PAGE-243 customer-directory → js/pages/customer-directory.js；PAGE-244 customer-directory:detail → js/pages/customer-directory.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-278 开通智能外呼套餐 | PAGE-203 tenants → js/pages/account-tenant.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-279 调整智能外呼服务时长 | PAGE-203 tenants → js/pages/account-tenant.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-280 调整智能外呼可用分钟 | PAGE-203 tenants → js/pages/account-tenant.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-281 查询充值调账记录 | PAGE-203 tenants → js/pages/account-tenant.js | 复用本地业务能力；供应商相关实现仅演示 |
| FUNC-282 下载通话录音 | PAGE-104 cloud-call-records:detail → js/pages/cloud-task-workspace.js, js/pages/report-center.js, js/pages/cloud-call-records.js, js/pages/customer-directory.js | 复用本地业务能力；供应商相关实现仅演示 |

## 页面反向映射

| 页面 | 路由与实现 | 冻结功能 |
|---|---|---|
| PAGE-102 运营工作台 | home → js/pages/home.js | FUNC-255, FUNC-256, FUNC-110, FUNC-230, FUNC-217, FUNC-270, FUNC-265, FUNC-214 |
| PAGE-201 登录与租户/业务域选择 | login → js/app.js | FUNC-201, FUNC-203, FUNC-202 |
| PAGE-202 账号管理 | accounts → js/pages/account-tenant.js | FUNC-207, FUNC-208, FUNC-209, FUNC-101, FUNC-210 |
| PAGE-203 租户管理 | tenants → js/pages/account-tenant.js | FUNC-204, FUNC-205, FUNC-206, FUNC-278, FUNC-279, FUNC-280, FUNC-281 |
| PAGE-101 坐席维护与账号关联 | agent-maintenance → js/pages/agent-center.js | FUNC-210, FUNC-211, FUNC-101, FUNC-214, FUNC-215, FUNC-216, FUNC-217 |
| PAGE-204 技能组成员与等级 | agent-skills → js/pages/agent-center.js | FUNC-221, FUNC-222, FUNC-223, FUNC-224 |
| PAGE-205 配置记录 | sync-records → js/pages/agent-center.js | FUNC-218, FUNC-213 |
| PAGE-206 技能组管理 | skill-mappings → js/pages/agent-center.js, js/pages/contact-center-settings.js, js/pages/resource-lines.js | FUNC-219, FUNC-220 |
| PAGE-207 关联系统展示 | related-systems/index.html → related-systems/index.html | FUNC-203 |
| PAGE-209 导入与分配 | customer-tasks → js/pages/customer-demo.js, js/pages/customer-tasks.js | FUNC-239, FUNC-238, FUNC-242, FUNC-243 |
| PAGE-210 导入客户弹窗 | customer-tasks:import → js/pages/customer-demo.js, js/pages/customer-tasks.js | FUNC-238 |
| PAGE-211 批次客户与分配弹窗 | customer-tasks:detail → js/pages/customer-demo.js, js/pages/customer-tasks.js | FUNC-242, FUNC-240, FUNC-241, FUNC-243, FUNC-244 |
| PAGE-213 预外呼任务列表 | predictive-tasks → js/pages/cloud-call-tasks.js | FUNC-248, FUNC-245, FUNC-110, FUNC-250 |
| PAGE-214 IVR外呼任务列表 | ivr-tasks → js/pages/cloud-call-tasks.js | FUNC-248, FUNC-246, FUNC-110, FUNC-250 |
| PAGE-215 创建预外呼/IVR任务向导 | cloud-task-create → js/pages/cloud-task-workspace.js | FUNC-247, FUNC-240, FUNC-245, FUNC-246 |
| PAGE-216 任务详情与执行控制 | cloud-task-center → js/pages/cloud-task-workspace.js | FUNC-110, FUNC-249, FUNC-111, FUNC-112, FUNC-113, FUNC-242, FUNC-243 |
| PAGE-217 呼入服务 | inbound-service → js/pages/cloud-call-tasks.js | FUNC-252, FUNC-251, FUNC-253, FUNC-254 |
| PAGE-218 呼入规则配置 | inbound-routes → js/nav.js | FUNC-251, FUNC-252 |
| PAGE-103 通话记录列表 | cloud-call-records → js/pages/cloud-task-workspace.js, js/pages/report-center.js, js/pages/cloud-call-records.js, js/pages/customer-directory.js | FUNC-264, FUNC-265, FUNC-263 |
| PAGE-104 通话详情 | cloud-call-records:detail → js/pages/cloud-task-workspace.js, js/pages/report-center.js, js/pages/cloud-call-records.js, js/pages/customer-directory.js | FUNC-265, FUNC-266, FUNC-282 |
| PAGE-220 线路管理 | lines → js/pages/contact-center-settings.js, js/pages/resource-lines.js | FUNC-230, FUNC-229 |
| PAGE-221 号码管理 | numbers → js/pages/contact-center-settings.js, js/pages/resource-lines.js | FUNC-233, FUNC-231, FUNC-232, FUNC-236, FUNC-237 |
| PAGE-222 号码详情·使用范围 | numbers:detail → js/pages/contact-center-settings.js, js/pages/resource-lines.js | FUNC-235, FUNC-234 |
| PAGE-223 通话数据异常 | event-callbacks → js/pages/system-center.js | FUNC-270, FUNC-271 |
| PAGE-224 操作审计 | audit → js/pages/system-center.js | FUNC-274, FUNC-275 |
| PAGE-225 通话总览 | cloud-overview-report → js/pages/report-center.js | FUNC-272, FUNC-264, FUNC-273, FUNC-108, FUNC-265 |
| PAGE-246 客户跟进 | cloud-customer-report → js/pages/report-center.js | FUNC-108, FUNC-272, FUNC-273, FUNC-242, FUNC-243, FUNC-277 |
| PAGE-226 外呼任务 | cloud-outbound-report → js/pages/report-center.js | FUNC-272, FUNC-110, FUNC-273, FUNC-108 |
| PAGE-227 呼入服务 | cloud-inbound-report → js/pages/report-center.js | FUNC-272, FUNC-264, FUNC-273, FUNC-108, FUNC-265 |
| PAGE-228 坐席成效 | cloud-agent-report → js/pages/report-center.js | FUNC-272, FUNC-273, FUNC-108, FUNC-264, FUNC-265 |
| PAGE-229 服务技能 | cloud-skill-report → js/pages/report-center.js | FUNC-272, FUNC-273, FUNC-108, FUNC-264, FUNC-265 |
| PAGE-230 AI外呼列表 | ai-tasks → js/pages/scene-list.js, js/pages/home.js | FUNC-203 |
| PAGE-231 AI外呼拦截 | ai-blocklist → js/pages/scene-block.js | FUNC-203 |
| PAGE-232 AI通道管理 | ai-channels → js/pages/ai-domain.js | FUNC-203 |
| PAGE-233 AI业务场景 | ai-scenes → js/pages/sys-scene.js | FUNC-203 |
| PAGE-234 AI标签管理 | ai-tags → js/pages/sys-tags.js | FUNC-203 |
| PAGE-235 AI通话记录 | ai-call-records → js/pages/result-records.js | FUNC-203 |
| PAGE-236 AI线索记录 | ai-leads → js/pages/result-clue.js | FUNC-203 |
| PAGE-237 AI通话统计 | ai-call-report → js/pages/report-call.js | FUNC-203 |
| PAGE-238 AI计费统计 | ai-billing-report → js/pages/report-billing.js | FUNC-203 |
| PAGE-239 AI线索统计 | ai-lead-report → js/pages/report-clue.js | FUNC-203 |
| PAGE-240 人工呼叫弹窗 | seat-workbench:call-dialog → js/pages/agent-workbench.js | FUNC-104, FUNC-260, FUNC-261, FUNC-262, FUNC-106, FUNC-258, FUNC-259 |
| PAGE-241 AI任务详情及原有弹窗 | scene-list:detail → js/pages/scene-list.js, js/pages/home.js | FUNC-203 |
| PAGE-242 坐席工作台 | seat-workbench → js/pages/agent-workbench.js | FUNC-257, FUNC-258, FUNC-259, FUNC-104, FUNC-106, FUNC-108 |
| PAGE-243 客户档案 | customer-directory → js/pages/customer-directory.js | FUNC-276, FUNC-277 |
| PAGE-244 客户档案详情 | customer-directory:detail → js/pages/customer-directory.js | FUNC-277, FUNC-243, FUNC-265 |
| PAGE-245 关联坐席弹窗 | accounts:seat-link → js/pages/account-tenant.js | FUNC-101, FUNC-210 |

结论：保留业务页面与本地操作；供应商能力替换为 AliCti 文档语义。未确认能力不升级为供应商已验证事实。关联系统展示保留可选空态，非本期新增业务功能。没有在原型端改写冻结功能、验收条件或业务范围。
