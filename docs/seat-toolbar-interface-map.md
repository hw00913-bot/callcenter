# 坐席电话工具条：接口与 SDK 对齐

更新日期：2026-09-23；业务基线：`2026-09-23-seat-logout-1`。适用：AliCTI（不是阿里云 CCC）。本次为本地业务原型改造，现有适配器和事件均为明确标记的模拟，不代表真实 SDK 已接入或联调完成。

## 功能映射

| 页面操作 | 官方方法或事件 | 使用约束 |
| --- | --- | --- |
| 坐席登录 | CTILink.Agent.login | 点击工具条“坐席登录”直接打开登录面板：每次普通登录模式初始未选，当次单选workingMode字符串0（预览与预测同时）、4（预览外呼）或5（预测外呼）；loginStatus默认1置闲、可改2置忙，pauseDescription选填。点击“登录”直接提交，无先保存设置步骤；未选模式或取消不发请求，失败保留本次输入。固定bindType=3、bindTel取管理员配置；必须等待SDK setup就绪及登录结果。置忙登录后须先置闲成功才能主动预览外呼；断线重登保留当前会话模式与暂停状态 |
| 在线切换工作模式 | CTILink.Agent.changeWorkingMode | 工具条直接显示模式下拉，显式传单个String workingMode=0/4/5；仅成功回执后更新当前模式。置忙可切换，通话、振铃、话后整理及未知结果期间拒绝；失败保留原模式，未知先核对，不重放请求 |
| 退出 | CTILink.Agent.logout | 通话及业务记录完成后固定提交logoutMode=1、removeBinding=0；完全下线并保留坐席与接听分机绑定，不显示解绑选项，也不清空本地分机配置。官方支持removeBinding=1，但本产品不开放 |
| 置忙 | CTILink.Agent.pause | pauseType、pauseDescription；忙碌或操作待核对时不可执行 |
| 置闲 | CTILink.Agent.unpause | 本人可显式操作；完整业务保存且处于空闲业务阶段后自动请求，成功确认ready才恢复接听，失败可独立重试，未知先核对 |
| 临时拨号 / 联系分配客户 | CTILink.Agent.previewOutcall | 登录读取受控分机资源；拨号不选技能或外显，从本租户有效授权号码自动选obClid；仍核验本人会话、资源用途与分机外呼许可 |
| 接听来电 | CTILink.SipSession.sipLink | 本期仅浏览器软电话，不开放设备切换或拒接入口；请求受理不是通话建立，继续等待匹配当前通话的状态事件 |
| 结束通话 | CTILink.Session.unlink | 本地预览演示在客户拨号前已建立坐席侧，故拨号/客户振铃/通话阶段均用 unlink；不是 previewOutcallCancel。后者仅适用于座席响铃到座席接听前 |
| 静音 / 取消静音 | CTILink.Session.mute | direction 必选：in / out / all；界面明确显示传入/传出/双向音频。同一方向再次 mute 为取消静音，不创造 unmute 方法 |
| 延长整理（工具条与记录面板） | CTILink.Agent.prolongWrapup | 仅整理阶段，沿用现有 30–600 秒校验 |
| 电话状态 / 连接异常 | status、breakLine、sipDisconnected 事件 | 电话在线、媒体就绪、当前通话和业务记录保存状态分开处理；旧会话事件不覆盖当前会话 |
| 查看接听队列 | 现有授权队列监控能力 | 保留原角色、工号、租户和队列权限边界 |
| 客户与记录 / 收起记录 / 草稿 / 保存并完成 | 平台业务界面和本地记录服务 | 业务记录先完整保存，再独立调用unpause；只有成功回执和ready状态才恢复接听。置闲失败不回滚业务或重复保存，未知先核对 |

## 交互边界

- 云联络中心且账号已关联本人坐席时显示常驻工具条；更换身份或退出工作范围清理旧工具条。
- 未上线、可接听、来电待接、接听中、通话中、话后处理沿用现有状态机。接听中禁用重复接听。
- 工作模式与置忙/置闲分别处理：模式4拒绝预测外呼分配，模式5禁用预览外呼入口；呼入不受模式限制是本地假设，见[CF-16](remaining-confirmations.html#CF-16)。登录文档的逗号多值不作为产品选择暴露，接听设备仍固定软电话。
- 模式切换请求发出后，若成功回执到达前进入来电或话后整理，本地不直接应用该成功回执，标记结果待核对；刷新确认实际工作模式，不重放切换请求。此时保留本地原显示值不代表供应商实际模式未变，不能绝对声称原模式未变。
- API-304正式签名为CTILink.Agent.changeWorkingMode，示例却写AgentTask；当前按正式签名适配，该命名差异保留为真实SDK接入核验事项，不能以本地成功当作供应商已验证。
- 客户记录侧栏不使用模态遮罩、不锁住键盘焦点；工具条与底层菜单保持可用。切换菜单收起侧栏，当前通话和草稿保留。
- 工具条、侧栏按实际高度错开；二次确认仍为置顶模态弹窗。
- 本轮不新增转接、咨询、保持、三方、录音控制、DTMF 等入口。官方有方法也不等于本项目已完成全部权限和状态适配。

## 依据

- [座席操作](https://wiki.alicti.cn/html/wiki/工具条/座席操作.html)：项目归档 API-304，以及 qa/evidence-extensions-20260920/alicti-exten-agent-operations.html。
- [座席通话操作](https://wiki.alicti.cn/html/wiki/工具条/座席通话操作.html)：本轮浏览器直接复核，项目归档 API-305。
- [软电话通话操作](https://wiki.alicti.cn/html/wiki/工具条/软电话通话操作.html)：项目归档 API-306。
- SDK setup、连接生命周期与状态规则见[规则附表](interaction.html)、[字段对齐清单 FA-170–179](field-alignment.html#FA-170)及[待确认项 CF-11](remaining-confirmations.html#CF-11)；实现参考现有 AliCtiReceiving 校验，官方原文按 API-304、API-306、DOC-339 编号在 references/alicti 查阅。

生产接入时须将模拟回执替换为真实 SDK 回调/事件，并执行真实线路验证；当前页面不通过点击直接宣称真实电话成功。

### 2026-09-20 操作入口与失败回执补齐
工具条直接置忙/置闲，话后整理时直接延长，继续复用 pause/unpause/prolongWrapup。previewOutcall 的本地模拟返回经 normalizePreviewResult 统一解释 code/errorCode/msg，记录 lastPreviewResponse；覆盖 API-304 的 18 种错误并保留 msg。接口演示配置可指定下一次拨号失败，仅消费一次。仍无真实供应商请求。

### 2026-09-20 用户确认的保存后行为
记录保存成功后自动调用 CTILink.Agent.unpause；确认成功即等待下一通。失败提示重试，未知先核对，不重复发送；不再自动 pause。来电面板移除拒接入口，保留 SipSession.sipLink 接听。
