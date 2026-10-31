# UI 规范说明

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](README.md) · [按功能阅读](features/README.md)

UI 呈现引用业务字段和局部逻辑，不重新定义业务规则；本说明没有执行视觉或交互测试。

## UI 范围

模式：specified

当前2.0.0五区域下43个有效产品页面及共享/内部表面全量UI；3个历史来源页面明确superseded，不重建概览或重复名单页。

依据：
- documentation/input/pages.json#PAGE-2001
- documentation/input/pages.json#PAGE-2002
- documentation/input/pages.json#PAGE-2202
- documentation/input/pages.json#PAGE-2006
- documentation/input/pages.json#PAGE-2204
- documentation/input/pages.json#PAGE-2228
- documentation/input/pages.json#PAGE-2007
- documentation/input/pages.json#PAGE-2203
- documentation/input/pages.json#PAGE-2102
- documentation/input/pages.json#PAGE-2103
- documentation/input/pages.json#PAGE-2108
- documentation/input/pages.json#PAGE-2110
- documentation/input/pages.json#PAGE-2111
- documentation/input/pages.json#PAGE-2205
- documentation/input/pages.json#PAGE-2206
- documentation/input/pages.json#PAGE-2207
- documentation/input/pages.json#PAGE-2208
- documentation/input/pages.json#PAGE-2210
- documentation/input/pages.json#PAGE-2211
- documentation/input/pages.json#PAGE-2212
- documentation/input/pages.json#PAGE-2213
- documentation/input/pages.json#PAGE-2214
- documentation/input/pages.json#PAGE-2215
- documentation/input/pages.json#PAGE-2216
- documentation/input/pages.json#PAGE-2217
- documentation/input/pages.json#PAGE-2218
- documentation/input/pages.json#PAGE-2219
- documentation/input/pages.json#PAGE-2221
- documentation/input/pages.json#PAGE-2105
- documentation/input/pages.json#PAGE-2106
- documentation/input/pages.json#PAGE-2107
- documentation/input/pages.json#PAGE-2209
- documentation/input/pages.json#PAGE-2003
- documentation/input/pages.json#PAGE-2004
- documentation/input/pages.json#PAGE-2005
- documentation/input/pages.json#PAGE-2220
- documentation/input/pages.json#PAGE-2222
- documentation/input/pages.json#PAGE-2109
- documentation/input/pages.json#PAGE-2112
- documentation/input/pages.json#PAGE-2223
- documentation/input/pages.json#PAGE-2225
- documentation/input/pages.json#PAGE-2226
- documentation/input/pages.json#PAGE-2227

## 设计依据

- 当前2.0.0 assets/css/app.css、assets/css/global.css和scripts/template-list-ui.css；复用现有桌面管理端视觉和专业页交互事实。
- config/nav.json和docs/role-permissions.md为当前五区域与五角色入口；docs/decisions.md优先解释四节点、参考分类和导入/分配链。
- 本规格是当前原型的产品呈现说明，未重新设计品牌体系；具体生产接口、真实认证、供应商回执与实际远端可用性由工程补齐验证。

## 全局布局

- 桌面外壳固定56px顶栏，左侧212px功能导航，内容区24px留白；主内容可纵向滚动，长表格在自身容器横向滚动，顶层不遮住操作。
- 顶栏只提供坐席工作台、业务&amp;客户、呼叫中心、报表中心、系统管理五区域；按实际可达能力显示菜单，不增统一首页；项目交付视图只属原型阅读工具。
- 列表页按标题/说明、筛选、工具栏、数据、分页层级；有业务说明时独立行，标签在控件上方，查询按钮与控件底线对齐。
- 流转模板筛选栏采用品牌240px、名称最长480px、查询80px及12px间距，所有控件34px高；保存说明另行或在有余量时尾部显示，不挤占名称输入。
- 普通确认弹层宽520px、最大90vw，正文最大65vh滚动；复杂字段/导入配置采用宽抽屉，四节点编排使用全屏画布和独立节点侧栏。
- 业务对象列表先按真实更新时间倒序再分页，页面读取不更新时间；节点路径优先级、字段呈现顺序、跟进轮次和报表时间序列保留各自明确业务顺序。
- 详情区明确当前有效值、运行冻结方案、跟进basis/内容快照、实际通话事实和转出截止资料，不以同一标签把不同时间含义混在一起。
- 正常导航不以电话状态强制退出；话后与通话资格仍属于电话业务自身检查，撤权有限收尾分开。

## 文字规范

- 字体沿用 -apple-system、BlinkMacSystemFont、Segoe UI、PingFang SC、Hiragino Sans GB、Microsoft YaHei、sans-serif。
- 基础正文14px，列表/次级信息13px，辅助与状态说明12px；现有主页面标题21px/600，登录标题23px/600，弹层标题17px；不以过小字号容纳主要业务内容。
- 业务编码、手机号、通话ID保持字符串和前导零；长ID在列表可截断并给完整可复制详情，错误及字段帮助允许换行。

## 颜色规范

- 当前外壳覆盖token：primary #1677ff、primary-hover #0958d9、page #f0f2f5、primary-text #1f1f1f、border #e8e8e8；内容面板white。
- 现有基础语义色success #34c759、warning #ff9500、danger #ff3b30、info #5ac8fa；选中导航沿用#e6f4ff；错误文本当前#c93225。
- 蓝色表达选中/可执行主动作，红色表达真实失败或危险动作，橙色表达待核/受限，灰色表达只读或未发生；状态均附文字，不只依赖颜色。
- 未提供名单时的数据依赖分流说明使用中性提示；仅实际行预检或静态配置确定错误时使用红色，避免把待输入当失败。

## 间距规范

- 沿用4/8/12/16/24/32px间距token：4px标签内状态，8px同行小动作，12px筛选和表单组，16px区块内部，24px页面与主要区块。
- 现有圆角4/6/8px分别用于小状态/表单/面板；按钮和输入保持同高，危险按钮与取消间留8–10px，不能靠文字空格对齐。
- 表格操作可换行且保8px纵向、12px横向间距；说明不能覆盖输入、底部按钮或分页。

## 可访问性

- 按钮、输入、选择、表格均有可读名称，必填与错误对应具体字段；错误区域可被辅助技术读取，不能只用颜色或placeholder作标签。
- 沿用focus-visible蓝色2px轮廓与3px偏移；键盘顺序从导航到筛选、内容、主要动作。弹层打开后焦点进入标题或首个可用字段，关闭后回触发处。
- 禁用原因在邻近说明中可读，查询/提交/文件读取状态有文字；窄屏和滚动时保错误、按钮与实际作用对象可见。
- 画布除拖拽外保节点点击、侧栏目标选择和优先级上移/下移入口；业务条件不依赖颜色、连线视觉位置或鼠标悬停才能理解。

## 响应式行为

- 本轮覆盖现有桌面管理端。&lt;=1150px按现有样式缩小顶栏间距，左栏188px，内容保持可滚动；不声称新增全站移动端适配。
- 模板筛选栏允许换行，&lt;=720px品牌/名称控件各占一行，查询保持可点击且保存说明独立换行；弹层最大90vw、正文滚动。
- 长表格与全屏画布在本区域横向滚动，不强行压缩编码、号码或条件文字；节点配置侧栏独立纵向滚动，底部校验不覆盖内容。

## 组件规范

<a id="UI-COMP-NAV"></a>

### UI-COMP-NAV 区域、功能与当前租户导航

变体：
- 五区域顶栏
- 左侧菜单
- 合法租户切换
- 来源返回

状态：
- selected
- available
- disabled
- no_permission

交互：
- 正常跨业务域、切租户及系统退出不因拨号/振铃/通话/话后/电话未知而拦截，也不强制先退出电话；身份、数据范围和普通未保存表单检查保留，撤权后的有限当前收尾是独立机制。

<a id="UI-COMP-FILTER"></a>

### UI-COMP-FILTER 查询与筛选栏

变体：
- 关键字
- 分类/品牌/租户
- 日期时间
- 状态

状态：
- normal
- editing
- applying
- invalid

交互：
- 输入草稿和已应用筛选分开，查询/重置后回第一页；新结果对应准确本次范围。
- 空筛选不等无数据；无权范围不给候选，查询失败保原已确认结果和当前输入。

<a id="UI-COMP-TABLE"></a>

### UI-COMP-TABLE 有权数据列表与行操作

变体：
- 业务对象表
- 专业任务表
- 资源表
- 结果表
- 审计表

状态：
- loading
- normal
- empty
- error
- read_only

交互：
- 排序、筛选、分页使用同一授权结果；选择项只代表准确记录，不跨筛选残留选择。
- 行按钮按对象当前资格核验；失败/未知/空结果独立显示，不能用无数据掩盖读取失败。

<a id="UI-COMP-FORM"></a>

### UI-COMP-FORM 带规则的字段表单

变体：
- 单值输入
- 多行文本
- 数值
- 日期时间
- 只读事实
- 条件比较值

状态：
- normal
- focus
- invalid
- disabled
- read_only
- submitting

交互：
- 标签绑定控件，动态必填有文字星号和说明；输入不隐式保存。
- 比较值多值每行一项，IN/NOT_IN支持多项，EQ/NE/大小比较只允许单项；空值和未知分别表达。
- 提交中禁止重复发送；失败保留输入，未知显示准确同次请求待核，不以新请求重复办理。

<a id="UI-COMP-SELECT"></a>

### UI-COMP-SELECT 明确选择与依赖候选

变体：
- 单选
- 多选
- 分层承接方
- 接口结果

状态：
- loading
- ready
- no_options
- invalid
- disabled

交互：
- 不按同名/第一个候选自动匹配稳定身份；候选失效明确提示并阻止提交。
- 上游变化清理已失效下游选择并要求重新确认；没有权限不查全量结果，不把查询结果自动带入正式内容。

<a id="UI-COMP-DRAWER"></a>

### UI-COMP-DRAWER 详情与业务办理抽屉

变体：
- 只读详情
- 基础配置
- 导入向导
- 业务最小表单

状态：
- open
- dirty
- submitting
- error
- read_only

交互：
- 打开时绑定准确对象、租户和修订；切换对象重读，迟到响应不能覆盖新对象。
- 普通草稿关闭提供保存/放弃/取消；保存失败留在当前抽屉；在途电话和必要话后按更强业务保护执行。

<a id="UI-COMP-CONFIRM"></a>

### UI-COMP-CONFIRM 准确对象确认

变体：
- 删除
- 转交/推进
- 废弃/转类
- 清空集合
- 解除拒联

状态：
- review
- submitting
- success
- error
- result_unknown

交互：
- 确认框展示准确对象、作用范围、必要原因及当前依据；最终确认再核对象状态/修订/权限。
- 真实成功才关层并刷新；失败保原对象，未知保同次请求并提供核对，不能用列表暂时消失当成功。

<a id="UI-COMP-STATUS"></a>

### UI-COMP-STATUS 状态与反馈

变体：
- 成功
- 失败
- 未知待核
- 空态
- 只读
- 中性说明

状态：
- visible
- resolved
- stale

交互：
- 反馈含动作对象、原因及允许下一步；运行/执行/结果保存/业务结果分别表达。
- toast只承载短反馈，阻塞原因与同次请求核对入口在页面持续可见。

<a id="UI-COMP-PHONE"></a>

### UI-COMP-PHONE 本人电话条与坐席现场

变体：
- 离线准备
- 上线/空闲/置忙
- 呼出
- 呼入/预外呼接听
- 必要话后
- 监管

状态：
- offline
- pending
- online
- dialing
- ringing
- talking
- aftercall
- unknown
- limited_finish

交互：
- 电话能力属于当前租户本人有效坐席，不增加坐席角色；上线/受理不等接通。
- 切换/退出不能跳过在途通话、必要话后或未知；监管他人电话不误当本人的切换锁。

<a id="UI-COMP-PLAYER"></a>

### UI-COMP-PLAYER 通话录音与事实明细

变体：
- 音频播放
- 暂停
- 进度
- 原始文本/标签

状态：
- ready
- playing
- paused
- unavailable
- loading
- error
- no_permission

交互：
- 有权读取录音即允许播放、暂停和定位，不要求编辑权限；重新核准确通话对象。
- 无录音、过期、网络错误和失权分别提示，播放器动作不写业务结果或更新时间。

<a id="UI-COMP-CHART"></a>

### UI-COMP-CHART 专业报表指标与图表

变体：
- 指标卡
- 趋势图
- 维度汇总
- 下钻明细

状态：
- loading
- normal
- empty
- error

交互：
- 指标保留AI/Cloud各自原口径和当前已应用筛选；未知不补零。
- 下钻和导出分别核范围/权限，图表时间顺序按指标语义，不能以更新时间替代。

<a id="UI-COMP-TABS"></a>

### UI-COMP-TABS 用途和分区页签

变体：
- 分类导入/填写
- 字段/接口字典
- 档案业务/联系
- 专业报表分区

状态：
- active
- available
- disabled

交互：
- 分类的IMPORT和FOLLOWUP使用独立字段身份，切换Tab保当前草稿。
- 页签只是呈现同页范围，不等同开通模块、扩大数据权或更换运行绑定。

<a id="UI-COMP-FLOWCANVAS"></a>

### UI-COMP-FLOWCANVAS 固定四节点编排画布

变体：
- 唯一开始
- 转交
- 呼叫
- 结束
- 路径
- 节点侧栏
- 只读

状态：
- normal
- selected
- dragging
- invalid
- read_only

交互：
- 组件决定节点类型，不再二次选类型；开始唯一锚点，CALL仅一种方式。
- 节点和连线有可读名称；可通过节点侧栏选择目标和调整路径优先级，移动布局不改变条件优先级。
- 所有有出口节点须唯一末位ELSE；未知保留当前节点/归属且不越过后续/ELSE，前序条件明确均不匹配才进入ELSE。

<a id="UI-COMP-PAGINATION"></a>

### UI-COMP-PAGINATION 结果分页

变体：
- 页码
- 页长
- 总数

状态：
- ready
- loading
- empty
- disabled

交互：
- 先按授权集过滤和更新时间倒序再分页；筛选、租户变化回第一页。
- 部分可见批次说明只统计可见集合，不泄露其他租户数目。

<a id="UI-COMP-UPLOAD-MAPPING"></a>

### UI-COMP-UPLOAD-MAPPING 名单输入、列映射与逐行预检

变体：
- CSV/Excel文件
- 粘贴名单
- 映射表
- 预检结果
- 批次回读

状态：
- empty
- reading
- mapping
- previewing
- valid
- invalid
- submitting
- unknown

交互：
- 读取期间禁用检查与提交；只接受当前最新文件结果，旧响应不覆盖新输入。
- 每列明确映射一个业务字段或忽略，必需字段不得漏；改文件/表头/schema/映射后旧预检失效。
- 严格范围每行通过后一次确认提交；错误给行/节点/字段/条件，示例只展示格式不承诺命中业务分流。

<a id="UI-COMP-WORKQUEUE"></a>

### UI-COMP-WORKQUEUE 业务工作队列与待办

变体：
- 待安排/起呼
- 待填写
- 待流转/转交
- 条件未满足
- 待核

状态：
- normal
- empty
- blocked
- read_only

交互：
- 队列由同一权威业务账本投影，展示下一步和阻塞原因，不成为第二套可编辑账本。
- 待填写仅给真实拨打/接听人的原段最小表单；核对事项按准确request授权，不授整档案或重办权限。

<a id="UI-COMP-READONLY"></a>

### UI-COMP-READONLY 来源、当前值与快照展示

变体：
- 当前有效值
- 运行方案
- 跟进basis
- 封存内容
- 转出截止
- 审计/证据

状态：
- available
- absent
- unknown
- restricted

交互：
- 当前有效值和当时快照明确标题及时间/来源；缺失不显示为0或已确认空。
- 原始稳定ID不作为用户可更改字段；敏感凭据默认掩码，仅有准确权限才查看/复制。

<a id="UI-COMP-RADIO"></a>

### UI-COMP-RADIO 明确后续动作单选

变体：
- END两动作

状态：
- unselected
- selected
- disabled
- error

交互：
- 只改当前草稿；未选保存拒绝并定位，不额外增加承接方和方式配置。

## 页面规范

- [UI-PAGE-2001](ui-pages/UI-PAGE-2001.md) 登录及合法入口
- [UI-PAGE-2002](ui-pages/UI-PAGE-2002.md) 统一业务外壳与顶层区域导航
- [UI-PAGE-2202](ui-pages/UI-PAGE-2202.md) 坐席作业
- [UI-PAGE-2006](ui-pages/UI-PAGE-2006.md) 业务分类
- [UI-PAGE-2204](ui-pages/UI-PAGE-2204.md) 导入与分配
- [UI-PAGE-2228](ui-pages/UI-PAGE-2228.md) 流转模板
- [UI-PAGE-2007](ui-pages/UI-PAGE-2007.md) 呼叫拦截
- [UI-PAGE-2203](ui-pages/UI-PAGE-2203.md) 客户档案
- [UI-PAGE-2102](ui-pages/UI-PAGE-2102.md) AI服务与用量
- [UI-PAGE-2103](ui-pages/UI-PAGE-2103.md) AI外呼任务
- [UI-PAGE-2108](ui-pages/UI-PAGE-2108.md) AI通话记录
- [UI-PAGE-2110](ui-pages/UI-PAGE-2110.md) AI业务场景
- [UI-PAGE-2111](ui-pages/UI-PAGE-2111.md) AI标签配置
- [UI-PAGE-2205](ui-pages/UI-PAGE-2205.md) 预外呼任务
- [UI-PAGE-2206](ui-pages/UI-PAGE-2206.md) IVR外呼任务
- [UI-PAGE-2207](ui-pages/UI-PAGE-2207.md) 呼入服务
- [UI-PAGE-2208](ui-pages/UI-PAGE-2208.md) 云呼叫记录
- [UI-PAGE-2210](ui-pages/UI-PAGE-2210.md) 坐席管理
- [UI-PAGE-2211](ui-pages/UI-PAGE-2211.md) 技能管理
- [UI-PAGE-2212](ui-pages/UI-PAGE-2212.md) 外呼组管理
- [UI-PAGE-2213](ui-pages/UI-PAGE-2213.md) 队列管理
- [UI-PAGE-2214](ui-pages/UI-PAGE-2214.md) 坐席配置记录
- [UI-PAGE-2215](ui-pages/UI-PAGE-2215.md) 号码管理
- [UI-PAGE-2216](ui-pages/UI-PAGE-2216.md) 号码池管理
- [UI-PAGE-2217](ui-pages/UI-PAGE-2217.md) 分机管理
- [UI-PAGE-2218](ui-pages/UI-PAGE-2218.md) 时间条件
- [UI-PAGE-2219](ui-pages/UI-PAGE-2219.md) 云呼叫账号
- [UI-PAGE-2221](ui-pages/UI-PAGE-2221.md) 通话记录核对
- [UI-PAGE-2105](ui-pages/UI-PAGE-2105.md) AI通话统计
- [UI-PAGE-2106](ui-pages/UI-PAGE-2106.md) AI计费统计
- [UI-PAGE-2107](ui-pages/UI-PAGE-2107.md) AI线索统计
- [UI-PAGE-2209](ui-pages/UI-PAGE-2209.md) 云呼叫报表
- [UI-PAGE-2003](ui-pages/UI-PAGE-2003.md) 账号管理
- [UI-PAGE-2004](ui-pages/UI-PAGE-2004.md) 租户管理
- [UI-PAGE-2005](ui-pages/UI-PAGE-2005.md) 品牌管理
- [UI-PAGE-2220](ui-pages/UI-PAGE-2220.md) 应用接入
- [UI-PAGE-2222](ui-pages/UI-PAGE-2222.md) 操作审计
- [UI-PAGE-2109](ui-pages/UI-PAGE-2109.md) AI线索回访记录
- [UI-PAGE-2112](ui-pages/UI-PAGE-2112.md) AI充值管理
- [UI-PAGE-2223](ui-pages/UI-PAGE-2223.md) 业务字段
- [UI-PAGE-2225](ui-pages/UI-PAGE-2225.md) 坐席事件记录
- [UI-PAGE-2226](ui-pages/UI-PAGE-2226.md) 业务线索
- [UI-PAGE-2227](ui-pages/UI-PAGE-2227.md) 业务记录详情
