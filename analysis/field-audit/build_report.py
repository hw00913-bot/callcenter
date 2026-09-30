"""Build a field review from the current public docs and explicit prototype mappings."""
import html
import json
import re
from pathlib import Path

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
PUBLIC=ROOT/'prototype'
OUT=PUBLIC/'docs'
SOURCES=json.loads((HERE/'source-manifest.json').read_text())
for source in SOURCES:
    content=(HERE/'sources'/(source['id']+'.txt')).read_text()
    match=re.search(r'https://api-\{region\}\.alicti\.cn/interface/\{version\}/([^\s]+)',content)
    source['endpoint']=match.group(1) if match else None
SOURCE={s['id']:s for s in SOURCES}
ROWS=[]
def row(area,label,local,api,field,kind,typ,required,rule,status,action,file='js/components/alicti-fields.js',symbol=''):
    refs=api.split(',')
    line=None
    p=PUBLIC/file
    if p.exists() and symbol:
        line=next((i for i,t in enumerate(p.read_text().splitlines(),1) if symbol in t),None)
    ROWS.append(dict(id=f'FA-{len(ROWS)+1:03}',area=area,label=label,prototypeField=local,sourceIds=refs,field=field,direction=kind,type=typ,required=required,rule=rule,status=status,action=action,evidence=file+(f':{line}' if line else ''),sources=[SOURCE[i]['url'] for i in refs]))

# The rows describe current behavior and precise outstanding work, not the old supplier.
row('身份与鉴权','供应商账号ID','enterpriseId（平台资源上下文）','API-301','enterpriseId','请求','Int','validateType=2时必填','enterpriseId 是供应商账号 ID，按 Int 传入；用户已确认本演示主账号为 7522240。UUID 不参与接口。','已修正','主账号与既有演示保存统一为7522240；其他品牌账号保持独立。',file='js/alicti-storage.js',symbol='canonical=')
row('身份与鉴权','鉴权方式','服务端鉴权','API-301','validateType','请求','Int','必填','本项目使用2，按enterpriseId验证；departmentId分支不采用。','已对齐','字段转换固定validateType=2；不额外引入UUID。',symbol='authFields')
row('身份与鉴权','签名时间','当前时间','API-301','timestamp','请求','Int/Long（各页）','必填','Unix秒；签名时间有效期30分钟，不能传浏览器毫秒。','已修正','转换为Math.floor(now/1000)。',symbol='timestamp:')
row('身份与鉴权','接口签名','服务端签名','API-301','sign','请求','String','必填','正式接口要求 MD5(enterpriseId+timestamp+部门token)，32位小写。用户明确本原型仅演示，不必计算真实签名。','已修正','仅生成32位格式占位sign并标记mock；无token、无实际MD5运算、无供应商请求。',symbol='authFields')
row('身份与鉴权','坐席登录工号','cno','API-302,API-307,DOC-336','cno','请求/响应','String','分支必填','D-014供应商澄清：鉴权文档Int是笔误，实际工号均为String；鉴权与登录须保持完整工号一致。0012、012与12是不同工号，不能转整数或补零归一。','已修正','鉴权、创建、SDK登录与身份比较保留完整字符串；CF-01关闭。新增3–10位规则不变。',symbol='authenticateFields')
row('身份与鉴权','短期登录材料','电话上线登录材料','API-302','sessionKey','响应→登录请求','String','登录必填','30秒过期指建立连接的材料；不等于已建立电话会话每30秒失效。','已修正','本地生成明确标识的短期登录材料样例；不将30秒描述为通话会话寿命。',file='js/components/alicti-adapter.js',symbol='loginDraft')
row('身份与鉴权','电话网关地址','webSocketUrl','API-302,API-304','agentGateWayUrl → webSocketUrl','响应→请求','String','登录可选','保持返回字段原拼写agentGateWayUrl，映射到login的webSocketUrl。','已修正','显式转换，不把两个字段当成同名。',symbol='loginFields')
row('身份与鉴权','绑定电话','联系手机号 / 电话配置','API-304,DOC-336','bindTel','登录请求','String','必填','bindTel 为登录必填String，与平台联系手机号分别配置。','已修正','接口演示配置中可单独填写绑定电话，实际登录草稿复用该值。',file='js/components/alicti-contract-panel.js',symbol='function savePhone')
row('身份与鉴权','电话绑定类型','WebRTC接入','API-304,DOC-336','bindType / bindTelType','请求/响应','Int','login必填','login.bindType=3软电话；Agent.bindTelType=4软电话，两个枚举不同。','已对齐','登录只用bindType=3，不将返回bindTelType直接透传。',symbol='loginFields')
row('身份与鉴权','登录状态','上线 / 置闲 / 置忙','API-304,DOC-339','loginStatus','请求/状态','Int','登录必填','登录请求1置闲/2置忙；状态字典0离线/1在线/2置忙/3整理。','已对齐','按方法和方向解释枚举，不把状态1直接当作当前空闲证据。',symbol='loginFields')
row('身份与鉴权','退出方式','完全下线','API-304','logoutMode','请求','Int','必填','0退出但后台在线，1完全退出。','已对齐','现有完全下线保留logoutMode=1。','js/components/alicti-adapter.js','a.disconnect')

row('坐席与技能','坐席姓名','userName','API-307,API-308','name','请求','String','新增必填；更新可选','UTF-8 URL编码；本地userName转换成name，在请求序列化时编码一次。','已修正','创建草稿明确输出name，不输出userName。',symbol='seatFields')
row('坐席与技能','坐席工号','cno','API-307,API-309','cno','请求','String','必填','3–10位正整数字符串，保留前导零，不能是全零。','已修正','表单校验和输出保留字符串，拒绝全零工号。','js/pages/agent-center.js','let error=')
row('坐席与技能','所属区号','areaCode','API-307','areaCode','请求','String','必填','文档要求区号格式；不能用供应商默认区号冒充用户配置。','已对齐','新增表单要求填写，未凭空增加供应商长度规则。','js/pages/agent-center.js','buildAgent')
row('坐席与技能','联系手机号','mobile','API-307','无对应字段','平台字段','String','平台选填','当前坐席新增接口无mobile参数。','已修正','关联坐席表单去掉手机号必填星号，标为平台选填；请求不透传。','js/components/account-seat.js',"field === 'mobile'")
row('坐席与技能','坐席启停','lifecycleStatus','API-307,API-308,DOC-336','active','请求/响应','Int','可选，默认1','0停用、1启用；与在线status及是否分配新任务不同。','已对齐','agent/update列20023在线错误；启停和技能更新均先下线，配置启用不代表电话已上线。',symbol='seatFields')
row('坐席与技能','外呼许可','callEnabled','API-307,API-308','isOb','请求','Int','可选，默认1','0不允许、1允许；不代表已上线或所有号码可用。','已对齐','只映射外呼许可，租户与号码授权另行检查。',symbol='seatFields')
row('坐席与技能','预览外呼转写开关','isAsr','API-307,API-304','isAsr / cdrIsAsr','请求','Int','可选','D-015截图明确：企业开启自动转写且按坐席过滤时，坐席isAsr=1且单次cdrIsAsr=1或不传才允许转写，仍须满足时长等规则；任一为0不转写。','已修正','单次开启不能覆盖坐席关闭；仅预览外呼使用此规则，不保证文本生成。CF-02关闭。',symbol='previewTranscriptionGate')
row('坐席与技能','座席质检开关','isQualityCheck','API-307','isQualityCheck','请求','Int','可选，默认1','0关闭、1开启，字段名称为isQualityCheck。','已修正','替换qualityCheck，保持仅字段映射，不新增质检业务。','js/pages/agent-center.js','isQualityCheck')
row('坐席与技能','供应商坐席ID','providerAgentId / contactCenterIdentityId','DOC-336','id','响应','Int','返回字段','返回id为供应商坐席ID；平台坐席记录编号不是此字段。','已修正','详情区分平台记录编号、cno及待取得的供应商id。','js/pages/agent-center.js','供应商坐席 ID')
row('坐席与技能','班长席权限','平台角色','API-307,DOC-336','power','请求/响应','Int','可选，默认0','1班长席/0普通坐席，不对应平台超级管理员、管理员或运营。','平台字段','平台角色权限不透传power，不据角色自动提升话务权限。')
row('坐席与技能','多个技能','physicalGroupId列表','API-309','skillInfos[].skillIds','请求','String','必填','逗号分隔多个供应商技能ID，0清空所有技能；更新为全量替换。','已对齐','复选列表支持多选，已有关系保留，不能把本地PHY编号当skillId。','js/pages/agent-center.js','filterAssignGroups')
row('坐席与技能','技能等级','skillLevel','API-309,DOC-337','skillInfos[].skillLevels','请求','String','skillIds非0时必填','skillLevels逗号分隔，与技能ID逐个对应；越小越优先。供应商补充表及用户本轮确认采用1–10整数，本地校验；不引用队列weight的相反优先级规则。','已修正','支持多技能保存、1和10边界、逐项等级修改与清空；非法等级拒绝提交。',file='js/pages/agent-center.js',symbol='saveSkill')
row('坐席与技能','批量失败坐席','关联保存结果','API-309','data.failCno','响应','String','有失败时检查','data.failCno的字段定义和示例均为String，示例为"[0002, 100003]"；result=0仍需逐席检查失败列表。','已修正','解析字符串并保留前导零；失败坐席保持原集合，缺失或异常回执不推断成功。',symbol='skillUpdateResult')
row('坐席与技能','技能名称','技能组name','DOC-328,DOC-329','name','请求','String','必填','skill/create已提供，更新以id或preName定位，name为修改后名称。','已修正','本地支持技能创建与更新，模拟返回独立整数id；平台模板、租户归属不传给供应商。',file='js/components/alicti-demo.js',symbol='demo.skillResource')
row('坐席与技能','技能启停与模板','status / skillTemplateId','DOC-328,DOC-329,DOC-330','无对应启停或模板字段','平台字段','平台枚举/ID','平台规则','当前技能创建/更新只明确name、comment；模板和租户归属属于平台。','平台字段','不伪装成供应商技能启停参数；跨租户归属仍由平台维护。')
row('坐席与技能','坐席删除','cno','DOC-332','cno','请求','String','必填','agent/delete 请求cno为String；在线坐席错误码20023，删除前需下线。','已修正','离线坐席可演示删除并记录cno请求；保留平台历史。在线坐席拦截，真实执行与后续影响另列接入问题。',file='js/pages/agent-center.js',symbol='function remove')

row('人工电话','被叫号码','当前客户号码','API-304','previewOutcall.tel','请求','String','必填','传外呼号码；已开号码隐藏时可用customerNumberKey，不能传空。','已修正','补齐此前遗漏的tel字段。',symbol='previewFields')
row('人工电话','客户侧外显','callerNumber','API-304','previewOutcall.obClid','请求','String','可选','客户侧外显号码，与本地号码ID不同；obClidGroup会使obClid无效。','已对齐','保留所选号码值；掩码仅是样例，不作为真实可拨字段。',symbol='previewFields')
row('人工电话','请求关联ID','requestUniqueId','API-304,API-317','requestUniqueId','请求/响应','String','可选','用于请求与话单关联，未承诺供应商幂等。','已对齐','每次呼叫独立生成，失败不据此自动重拨。','js/components/alicti-adapter.js','DEMO-')
row('人工电话','随路变量','batchCustomerId','API-304','previewOutcall.callVariables[]','请求','Array','可选','数组元素为name、value、type；type=1普通变量，type=2 PJSIP_HEADER最多5个。','已修正','普通对象改为数组，客户行ID通过type=1传递。',symbol='previewFields')
row('人工电话','静音方向','本地静音按钮','API-305','CTILink.Session.mute.direction','请求','String','必填','direction=in输入音频流/out输出音频流/all全部；同一方法切换静音，不存在本页请求state参数。','已修正','通话中可选音频流方向；再次点击取消该方向静音。只生成direction并标为演示。',file='js/pages/agent-workbench.js',symbol='function toggleMute')

row('任务配置','任务名称','name','API-311','name','请求','String','必填','UTF-8 URL编码，少于50字；请求序列化编码一次。','已修正','表单最大49，提交校验少于50字。','js/pages/cloud-task-workspace.js','wizardName')
row('任务配置','任务类型','预外呼 / 自动外呼','API-311,DOC-338','type','请求/响应','Int','必填','1预测外呼、2自动外呼，创建后不可修改。','已对齐','从业务类型显式转换，不把中文类型透传。',symbol='taskFields')
row('任务配置','接听团队','skillGroupId','API-311','callGroupType','请求','Int','可选默认1','1工号列表、2外呼组；技能ID不是外呼组号，创建后不能改指定方式。','已修正','当前团队按成员展开，使用callGroupType=1。',symbol='taskFields')
row('任务配置','接听坐席列表','团队成员','API-311','cnos','请求','String','callGroupType=1必填','逗号分隔工号；一个坐席只能在一个运行任务中。','已修正','仅展开同租户同供应商账号有效成员，保留cno前导零。',symbol='fields.cnos')
row('任务配置','外呼组号','skillGroupId','API-311','agentGroup','请求','String','callGroupType=2必填','外呼组与技能组是不同资源。','已对齐','本期使用callGroupType=1工号列表，不采用外呼组分支，不列为需要供应商答复的问题。')
row('任务配置','语音流程ID','contactFlowId','API-311,DOC-348,DOC-349','ivrId / ivrName','请求','Int / String','type=2二选一','同时传入ivrId优先；本地流程ID不是供应商ivrId。','已修正','自动外呼从ivrProfile/list选择本账号ivrType=1且本租户有外呼授权的流程，返回id映射为providerIvrId并按Int写ivrId；名称仅展示。listDetail按需查详情，不视为发布证据；演示资源明确mock，不传本地FLOW字符串。',symbol='providerIvrId')
row('任务配置','预测溢出语音流程','contactFlowId','API-311,DOC-348,DOC-349','ivrId / ivrName','请求','Int / String','预测直连模式可选','自动外呼才明确要求二选一；预测直连用于无坐席时溢出。','已修正','预测页面去掉错误必填星号，显示可选溢出流程。','js/pages/cloud-task-workspace.js','溢出语音流程')
row('任务配置','自动外呼执行队列','executionQueueId','API-311','无对应字段','平台字段','平台ID','非接口必填','task/create没有要求自动外呼提交平台执行队列。','已修正','移除任务创建页的无依据必填执行资源项，不向接口透传。','js/pages/cloud-task-workspace.js','resourceStep')
row('任务配置','最少可用坐席','minAvailableAgentCount','API-311','minAvailableAgentCount','请求','Int','可选默认10','预测外呼允许1–10，低于设定值时自动暂停。','已修正','补充可编辑字段与边界校验，不再固定10；自动外呼不提交。','js/pages/cloud-task-workspace.js','wizardMinAgents')
row('任务配置','自动开始','本地计划时间','API-311','autoStart','请求','Int','可选默认0','autoStart=1时autoStartDay/autoStartTime至少一个生效；不填写字段时分别默认当天/00:00:00。','已修正','手工方式生成0；定时方式生成1及两个时间字段。原型不执行真实定时拨号。',symbol='autoStart:0')
row('任务配置','计划开始时间','scheduleAt','API-311','autoStartDay / autoStartTime','请求','String','autoStart=1条件','yyyy-MM-dd / HH:mm:ss，单字段scheduleAt不能直接透传。','已修正','计划时间转换为autoStartDay与autoStartTime，校验有效日期；保存、详情和请求参数保持一致。',symbol='scheduleFields')
row('任务配置','最大重呼次数','retryPolicy.rounds.length','API-311,DOC-338','retryStrategy.retry / retryStrategy[].retry','JSON字符串内字段','Integer','配置重试时','retry为重试次数，不含首次；strategy按轮次逐项配置。基础模式为对象，高级模式为数组。','已修正','本地重呼开关默认关闭；两类任务开启后均要求至少一个官方号码状态及完整次数、间隔、计时依据，统一间隔生成完整逐次参数，也可分别设置；关闭省略全部重呼参数，不传供应商templateName。本地不执行重呼调度或计数；保存、确认、详情与复制复用同一规则。演示单次输入1000次为本地渲染保护，不认定接口上限。','js/components/alicti-retry.js','function map')
row('任务配置','每轮重呼间隔与起算方式','retryPolicy.rounds / timeType','API-311,DOC-338','retryStrategy.strategy[].round / time / retryStrategyTimeType','JSON字符串及请求字段','String / Int','配置重试时','time为天-小时-分钟；timeType=1首次、2上次呼叫，默认1。首次起算时每轮时间须严格递增。','已修正','可统一或分别设置间隔，分钟/小时/天换算为完整分钟后输出time；新配置显式按上次呼叫计时，旧草稿原值保留，逐次设置可切换计时方式。轮次连续，首次起算严格递增。','js/components/alicti-retry.js','function validate')
row('任务配置','号码识别重试条件','retryPolicy.codes','API-311,DOC-338,API-327','retryStrategy[].condition.sipCause','高级策略','Array<Integer>','两类任务开启重呼时必填','D-020：用户转述阿里反馈，预测外呼也支持按号码状态重呼；两类任务统一采用一组condition.sipCause多码数组，715和183按编码整体匹配。关闭省略相关字段并按不启用重呼处理，是当前项目采用口径。','已修正','两类任务开启后必选官方号码状态，并填写次数、间隔、计时依据；按一组多码数组映射，不丢条件降级。旧基础策略缺状态需补选；关闭保留本地配置，省略retryStrategy、retryStrategyTimeType与templateName，按不启用重呼处理。条件匹配、轮次、计数和调度由阿里执行。CF-03关闭；号码识别开通及真实调用归常规接入验证，不作为功能待确认。预测支持依据用户转述供应商反馈；关闭采用不表述为供应商已保证，官方快照不修改。',file='js/components/alicti-retry.js',symbol='function map')
row('任务配置','自动完成','autoComplete','API-311','autoComplete','请求','Int','可选默认1','1号码呼完后结束，0号码呼完后暂停；结束后不可重新启动。','已对齐','创建显式1，不等价于平台业务跟进完成。',symbol='autoComplete:1')
row('任务配置','自动删除','autoDelete','API-311,DOC-338','autoDelete','仅创建调用参数','Int','可选','任务容量溢出时是否删最早结束任务，不是任务属性。','已修正','仅保留在创建请求草稿，列为调用选项，不将其当供应商返回字段。',symbol='autoDelete:0')
row('任务配置','供应商任务ID','taskId / providerTaskId','API-311,DOC-338','data.taskProperty.id','响应','Int','创建成功后取值','平台任务ID和供应商任务ID分别保存。','已修正','真实providerTaskId与demoProviderTaskId分开；本地模拟创建响应按data.taskProperty.id读取，后续演示导入与控制复用演示ID。',file='js/components/alicti-demo.js',symbol='demo.taskCreated')
row('任务配置','供应商任务状态','平台业务状态 / providerStatus','DOC-334,DOC-338','data.taskProperty.status','响应','Int','查询返回','0初始、1运行中、2暂停、3结束；不包含待分配、草稿等平台状态。','已修正','模拟查询和推送按官方0–3枚举展示，并标记模拟；业务状态与批次状态独立。',symbol='taskResult')
row('任务配置','启动与状态查询','启动按钮','DOC-333,DOC-334','taskId','请求','Int','必填','task/start与task/get已有文档；D-017用户转述阿里反馈：暂停后继续复用task/start，先task/get确认当前status=2。D-021用户产品确认：暂停后可以继续；结束后不再发起后续首次呼叫及尚未执行的重呼，已结束不重新开启。','已修正','继续前保留权限与资源校验；task/get须成功且匹配原taskId并返回status=2才发task/start，再task/get核对结果。受理不等于运行，失败或未知保留历史及待核对状态；status=3禁止重启，迟到通话结果仅回补原记录与统计，不重开任务或触发新重呼。D-021是用户产品规则，不声称供应商已保证挂断或删除队列；CF-04仅保留暂停/结束对已发起拨号或振铃、已接通通话的收尾方式。',file='js/components/alicti-adapter.js',symbol='task/start')
row('任务配置','暂停参数处理','pauseDuration（本期不提交）','API-313,DOC-338','pauseDuration','请求省略/返回留存','Int','可选；本期始终省略','D-017用户决定：调用task/pause不提交pauseDuration，不提供本地暂停时长输入、默认值、单位转换或恢复计时。TaskProperty原始返回仅保留作查询证据。D-021用户产品确认：暂停后可以继续；结束后不再执行后续首次呼叫及尚未执行的重呼。','已修正','所有暂停请求只提交鉴权与taskId；兼容旧草稿时也不回带pauseDuration。暂停后继续依D-017走task/get确认暂停→task/start→task/get，结束任务不重新开启。D-021不新增接口参数、本地队列或恢复计时；结束后的迟到结果仅回补历史，不继续或触发重呼。已发起通话的收尾仍见CF-04，不擅自挂断或改写通话结果。')

row('名单导入','导入批次','batchId / batchName','API-312','name / fileId','请求/响应','String / Int','name必填','fileId用于向已存在的供应商批次加号；平台批次ID不能直接使用。','已修正','按平台批次ID分别生成导入草稿；独立模拟响应保存fileId、taskId及统计，不混并同名批次。',file='js/pages/cloud-task-workspace.js',symbol='alictiImportDrafts')
row('名单导入','任务号码','phone','API-312','taskTelList[].tel','请求','String','必填','单号码只要求tel，taskTelList不超过8MB；单次与任务容量另核对。','已修正','phone显式转换tel，保留字符串。',symbol='importFields')
row('名单导入','客户行来源','batchId / customerTaskItemId','API-312','taskTelList[].property','请求','String（JSON）','可选','属性是JSON字符串，不是task.userFields或SDK.callVariables。','已修正','分别序列化客户行与批次ID，原型不假定所有回传自动贯通。',symbol='property:JSON.stringify')
row('名单导入','排重范围','跨批次同号规则','API-312','isRepeat','请求','Int','可选默认1','0不排重、1任务内、2导入号码、3批次内；任务与批次排重切换不追溯。','已修正','任务表单可选0/1/2/3，原型默认显式0以保留跨批次客户行；确认、保存和复制保留选择。',file='js/pages/cloud-task-workspace.js',symbol='wizardRepeat')
row('名单导入','导入后自动开始','importTelAutoStart','API-312','importTelAutoStart','请求','Int','可选默认0','0不自动启动、1自动启动。','已对齐','导入草稿显式0。',symbol='importTelAutoStart:0')
row('名单导入','导入统计','本地分配数量','API-312','importTotal / successTotal / invalidTotal','响应','Integer','返回字段','请求总数、导入成功数与非法数分别处理，失败明细依赖推送配置。','已修正','任务详情独立展示模拟响应中的总数、成功数、非法数及未分类差额；不把差额当作排重数或把分配数当接口成功数。',file='js/components/alicti-demo.js',symbol='demo.importSummary')

row('号码资源','号码展示','number','API-310','hotline / displayNumber','响应','String','返回字段','hotline完整号码，displayNumber外显，number是查询精确筛选字段。','已修正','字段读取区分查询number和响应hotline。',symbol='numberFields')
row('号码资源','号码类型','numberType','API-310','numberType','响应/查询','Integer / Array','查询可选','1热线、2固话、3SIP手机号、4虚拟手机号；查询支持类型多选。','已修正','采用官方四类，未知值待确认；不由号码前缀猜测类型。',symbol='numberTypes')
row('号码资源','启停状态','businessStatus / providerStatus','API-310','status','响应','Integer','返回字段','1启用、0停用，平台隔离/授权/待配置并非此枚举。','已修正','号码详情单列供应商状态，平台授权保留独立。','js/pages/resource-lines.js','supplierInfo')
row('号码资源','预览客户侧用途','呼出用途','API-310','isInUse','响应','Integer','返回字段','1允许/0不允许，缺字段不是0。','已修正','独立读取并展示；不能由平台呼出用途推定供应商许可。',symbol='numberFields')
row('号码资源','预测客户侧用途','呼出用途','API-310','isPredictiveLeft','响应','Integer','返回字段','与预览客户侧isInUse、预测坐席侧isPredictiveRight分别读取。','已修正','三种呼叫侧字段不互相替代。',symbol='numberFields')
row('号码资源','号码创建与更新时间','日期显示','API-310','createTime / updateTime','响应','Long','返回字段','时间戳单位毫秒；与话单查询秒级时间不同。','已对齐','原值以Ms命名保留，不复用话单查询转换。',symbol='createdAtMs')

row('话单与媒体','话单查询窗口','日期筛选','API-317,API-318,API-319','startTime / startTimeEnd','请求','Long','预测/呼入必填；人工可选','Unix秒，开始时间区间不得超过一个月；limit为10–1000、默认10；普通分页offset+limit≤100000，scroll另行处理。','已修正','列表日期筛选可生成按自然月拆窗的秒级请求；普通分页校验100000上限。未启用scroll分支，不将其作为当前演示阻断。',file='js/pages/cloud-call-records.js',symbol='function query')
row('话单与媒体','人工接听状态','客户是否接通','API-317','status','响应','Integer','返回字段','1客户未接/2坐席未接/3客户接听/4坐席接听；与号码识别编码不同。','已修正','有原始话单时按枚举和双方时间分别判断，未知值不算未接。',symbol='normalizeCdr')
row('话单与媒体','预测接听状态','客户是否接通','API-318','status','响应','Integer','返回字段','40客户未接/41客户接听/42坐席未接/43双方接听。','已修正','保留单边未知；客户与坐席接通分别映射。',symbol='normalizeCdr')
row('话单与媒体','接听时间','customerAnsweredAt / agentAnsweredAt','API-317,API-318','upTime / bridgeTime','响应','Long','返回字段','人工upTime坐席/bridgeTime客户；预测upTime客户/bridgeTime坐席。返回单位未逐字段写出，原值保留。','待确认','方向已按通话类型转换，原始值保留；upTime、bridgeTime等返回字段的时间单位/格式需供应商明确，不能用查询Unix秒规则倒推。',symbol='normalizeCdr')
row('话单与媒体','呼入接听状态','系统应答 / 人工接听','API-319','status','响应','String','返回字段','枚举人工接听、人工未接听、系统应答、系统未应答。','已修正','复用官方字符串，系统应答不计作人工服务成功。',symbol='normalizeCdr')
row('话单与媒体','人工号码识别','号码状态','API-317,API-327','sipCauseCode / obSipCauseRaw','响应','Integer / String','条件返回','人工响应读取这两个字段；查询过滤参数名sipCause不是响应同名保证。','已对齐','继续使用已核对号码字典，715/183同码多义待确认。','js/components/alicti-number-status.js','codeField')
row('话单与媒体','预测号码识别','号码状态','API-318,API-327','sipCause / obSipCause','响应','Integer / String','条件返回','按官方识别编码，不用719正在通话中证明客户接起。','已对齐','识别结果与接通结果分开，保留异步更新标记。','js/components/alicti-number-status.js','codeField')
row('话单与媒体','录音地址','recordingUrl','API-320','data','响应','String','result=0时','录音URL直接在data，不是data.url或顶层url。','已修正','仅成功响应读取data字符串，失败响应不会继续播放。',symbol='recordingFields')
row('话单与媒体','录音有效期','recordingUrlExpiresAt','API-320','无返回过期时间字段','适配元数据','时间戳','由实际配置确认','120分钟是可配置默认值，不是每次响应保证。','已修正','移除固定推算expiresAt；仅有明确过期时间才判断已过期。',symbol='recordingFields')
row('话单与媒体','录音分轨参数','音频声道','API-320','recordFormat / recordSide / callType','请求','Int','条件必填','recordFormat=1(wav)才支持分轨；recordSide非空要求callType，mp3忽略分轨。','已修正','录音参数弹窗支持MP3/WAV、合轨/客户/坐席和下载标志；WAV分轨校验callType=1/2/4/5，MP3省略分轨。不生成假URL。',file='js/components/call-media.js',symbol='function requestOptions')
row('话单与媒体','RASR请求与结果状态','transcript.status','DOC-346','uniqueId / result','请求/响应','String / Int（样例字符串）','uniqueId必填','rasrEvent/query按供应商uniqueId查询；result=0成功、-1失败，data为数组。不得沿用旧ASR的-2转写中或用本地callId替代uniqueId。','已修正','请求使用账号鉴权和uniqueId；失败/未知清空可展示文本，空数组仅表示未返回文本。',symbol='rasrRequest')
row('话单与媒体','RASR监测侧文本','transcript.segments','DOC-346','data[].text','响应','String（JSON数组序列化）','按实际返回','解析text中的JSON数组并保留text、monitorSide与原始字段；保留来源及返回顺序，不推算跨来源时间排序或音频位置。','已修正','使用RASR响应解析独立阅读搜索，异常字符串不转成成功文本；不再读取旧ASR结构。',symbol='rasrFields')
row('话单与媒体','RASR机器人文本','transcript.segments','DOC-346','data[].botText','响应','String（JSON数组序列化）','按实际返回','botText明确为机器人对话文本；与text分别解析，不能标为人工坐席发言。','已修正','机器人使用独立角色标签，不根据录音文件名或时间字段推断角色。',symbol='rasrFields')
row('话单与媒体','RASR说话方','role','DOC-346,DOC-347','monitorSide / botText','响应','Integer（样例字符串）/ String','按实际返回','monitorSide=1坐席侧、2客户侧；webcall对应第二侧/第一侧。botText固定机器人。未知值保留原值，不套用其他接口side。','已修正','本期文本统一RASR；角色按明确枚举展示。CF-02关闭，文本定位录音继续取消。',symbol='rasrFields')
row('话单与媒体','纯IVR录音','recordingApplicability','API-311,API-320','recordFile / 录音结果','响应','String / String','依实际话单','当前材料不足以将纯IVR统一判定为无录音。','已修正','相关界面改为录音适用性待确认，轨迹与转写不混用。','js/components/call-media.js','纯IVR是否提供录音')
row('话单与媒体','已执行IVR轨迹','ivrEvidence','API-323','uniqueId / data.ivrFlows','请求/响应','String / IvrFlow[]','uniqueId必填','查询某次通话已经执行的节点，不是已发布流程可选列表。','已对齐','原型流程选择只为已有映射样例；不使用轨迹接口冒充发布列表。')

row('事件与平台','HTTP推送配置','事件通道配置','API-315','name / type / targetUrlId 或 url,method,contentType,timeout','请求','Integer/String','二选一条件','name账号内唯一；type=42为预测任务状态推送。目标ID优先；直配method=0/1、contentType=1/2、timeout=1–10。返回requestId和id在顶层。','已修正','接口演示配置提供两种互斥目标配置，验证字段并显示模拟响应；不把消息体type=1/2混入推送设置类型。',file='js/components/alicti-contract-panel.js',symbol='function savePush')
row('事件与平台','推送任务与批次状态','状态通知','DOC-340','type / status','推送字段','数值（示例依据）','事件字段','type=1任务状态0–3；type=2批次状态0–4，不能共用一张枚举表。','已修正','模拟接收按账号、任务与批次ID归属过滤；分别显示任务0–3及批次0–4。未知归属或状态拒绝回写，批次状态不覆盖任务状态。',file='js/components/alicti-contract-panel.js',symbol='function applyEvent')
row('事件与平台','WebSocket范围','企业事件 / 租户数据','API-316','/user/agent','事件订阅','企业事件','授权过滤','企业默认全坐席消息，需要平台按资源和租户映射过滤。','平台字段','现有租户对象过滤保留；不直接向普通用户暴露企业全量消息。')
row('事件与平台','账号角色与组织','accountId / tenantId / roleCode / organizationScope','API-301,API-307','无等价字段','平台字段','平台ID/枚举','平台规则','平台账号、租户、总部/门店、角色与供应商账号/工号不是同一字段。','平台字段','继续由平台保存与授权，不要求AliCti承担平台权限模型。','js/app.js')
row('事件与平台','客户与批次业务字段','业务类型 / 线索编码 / 售后单号 / 活动编码','API-312','property（可选承载）','平台字段','平台String','平台规则','业务编码与来源行归属由平台维护，可选择序列化入property，但回传需核验。','平台字段','不把手机号当跨批次唯一客户行键。','js/components/customer-business.js')
row('事件与平台','统计与跟进结果','接通率 / 处理结果 / 跟进状态','API-317,API-318,API-319','话单事实→平台聚合','平台字段','平台指标','平台规则','未知接通不算未接通；处理结果与话单status分开，按同次通话去重。','平台字段','继续共用CallState与ReportMetrics；本次接听字段修正可作用于报表。','js/components/report-metrics.js')
row('事件与平台','智能外呼与计费','AI场景 / 套餐 / 分钟 / 余额','API-301','不属于本批AliCti字段','平台/既有AI字段','原有模型','原有范围','当前文档不定义原AI供应商及平台计费字段。','平台字段','本轮检查归属边界，沿用原AI链路，未映射为AliCti请求。','js/pages/ai-domain.js')


row('坐席与技能','批量起止工号','batch.cno/endCno','DOC-341','cno / endCno','请求','String','必填','连续工号范围，3–10位数字且非全零；最多100个，非任意对象数组。本地要求起止同位数以保留前导零。','已修正','检查范围和已有工号后只生成一个batchCreate请求。',symbol='seatBatchFields')
row('坐席与技能','本批公共配置','batch.name/areaCode','DOC-341','name / areaCode / active / isOb / isAsr / isQualityCheck','请求','String / Int','姓名区号必填，其余可选','整批共用姓名、区号及配置；不同姓名或离散工号按单席新增维护，不能透传名单数组。','已修正','批量表单只收公共配置；提交前预览起止和总数。',symbol='seatBatchFields')
row('坐席与技能','批量创建结果','batch.result','DOC-341','data.cnos / success / fail / other','响应','String','返回字段','cnos是成功创建工号；other表示创建成功但技能绑定失败数量。技能成功不能从坐席存在推断。','已修正','保留原响应与本地导入结果；只保存已证实工号，部分失败及未知不显示全成功。',symbol='seatBatchResult')
row('坐席与技能','已有坐席分页导入','seatImport.rows','DOC-342','start / limit / data.total / data.agents[].agent','请求/响应','Int / String / Array','分页可选','start>=0默认0；limit为1–1000默认10；cnos为逗号字符串最多500。官方示例每行由agent包裹。','已修正','分页解包后仅同步当前平台授权池，重复跳过；不调用创建或覆盖已有姓名技能。',file='js/components/alicti-seat-import.js',symbol='function query')
row('坐席与技能','坐席配置与在线查证','seatImport/detail','DOC-343,DOC-344,API-308','data.agent / data.state / loginStatus / errorCode','响应','Object / String / Int','返回字段','配置与电话实时状态分别查询；在线修改返回20023；须离线再修改。','已修正','启停写active后分别展示配置和状态查询，启用不自动电话上线；未知保持待核对。',file='js/components/alicti-demo.js',symbol='demo.seatActive')
row('线路号码','号码启停','number.businessStatus','DOC-345,API-310','numberList / status','请求','Array / Int','numberList必填，status可选','POST enterpriseHotline/batchUpdateNumber，完整号码包含区号，最多1000；status=0停用/1启用。查询使用offset/limit，data为顶层数组。','已修正','只发送修改字段并查询核对；启停保留授权、路由和外显用途，失败及未知不回写成功。',file='js/pages/resource-lines.js',symbol='applyNumberUpdate')
row('线路号码','号码外显用途','number.alictiNumber','DOC-345','isIbRight / isInUse / isPredictiveLeft / isPredictiveRight / isPreviewRight / isIntl / isSipLeft / isWebCallLeft / isWebCallRight','请求','Int','均可选','各用途0/1，省略不修改；isIbRight为呼入转坐席侧外显权限，不是呼入路由开关。','已修正','显示九项用途，仅提交发生变化字段；预览和预外呼按各自外显权限校验。',file='js/pages/resource-lines.js',symbol='saveNumberUses')

# Extract full field tables, preserving method context and duplicated names across APIs.
CATALOG=[]
for source in SOURCES:
    for ti,table in enumerate(json.loads((HERE/'sources'/(source['id']+'.json')).read_text()),1):
        rs=table['rows']
        if not rs or rs[0][0] not in ['参数','字段','参数名称','变量名']:continue
        header=rs[0]
        if not any(x in header for x in ['类型','描述','说明','备注']):continue
        for ri,values in enumerate(rs[1:],1):
            if not values or values[0] in ['（无）','无']:continue
            d=dict(zip(header,values))
            related=[r['id'] for r in ROWS if source['id'] in r['sourceIds'] and values[0] in re.split(r'[^\w]+',r['field'])]
            CATALOG.append(dict(id=f'{source["id"]}-T{ti:02}-F{ri:03}',sourceId=source['id'],section=table['section'],field=values[0],type=d.get('类型','未逐项明确'),required=d.get('要求',d.get('必填',d.get('可选','返回字段/按方法'))),description=d.get('描述',d.get('说明','')),constraints=d.get('备注',''),mappingIds=related,adoption='见关联复核项' if related else '契约已摘录；本期未采用或接入待确认，未冒充已实现',url=source['url']))

# Preserve official snapshots; apply the supplier correction to the current contract.
for entry in CATALOG:
    if entry['sourceId']=='API-302' and entry['field']=='cno':
        entry.update(documentedType=entry['type'],type='String',decisionId='D-014',correctionSource='2026-09-14 用户转述供应商澄清：Int为笔误，实际均为String；完整工号一致，0012与12不同。')
    if entry['sourceId']=='DOC-338' and entry['field']=='retryStrategy':
        entry.update(documentedDescription=entry['description'],description=entry['description'].replace('目前只支持「自动外呼」任务模式。','D-020采用用户转述阿里反馈：预测与自动外呼均支持按号码状态重呼。'),decisionId='D-020',correctionSource='2026-09-15 用户转述阿里反馈；官方快照保留，当前采用范围扩展至预测外呼。')

for mapping in ROWS:
    if mapping['id']=='FA-046':
        mapping.update(decisionId='D-020',adoptionEvidence='docs/supplier-clarifications.json#retrySupportClarification',sourceType='supplier_feedback_and_project_adoption')
    if mapping['id'] in {'FA-051','FA-052'}:
        mapping.update(decisionId='D-021',sourceRef='SRC-053',adoptionEvidence='docs/supplier-clarifications.json#taskExecutionDecision',sourceType='user_product_confirmation',priorDecisionIds=['D-017'])

counts={k:sum(r['status']==k for r in ROWS) for k in ['已修正','已对齐','待确认','平台字段']}
DATA=dict(version='2026-09-15-task-execution-1',sourceCount=len(SOURCES),reviewedMappingCount=len(ROWS),catalogFieldCount=len(CATALOG),counts=counts,scope='当前云联络中心与平台边界；未将既有AI链路改成AliCti。工号类型按D-014统一String；D-015采用RASR文本与预览门控，CF-02关闭；D-016采用本地重呼开关与官方IVR列表选流，执行计数交由阿里；D-017暂停不提交pauseDuration，继续先查询确认暂停再启动并复查，已结束不重开；D-020采用用户转述阿里反馈，预测与自动外呼均支持按号码状态重呼，开启均必填；关闭省略相关重呼字段与templateName按不启用处理，为当前项目采用。FA-046已修正、CF-03关闭；常规接入验证不作为功能待确认。D-021（SRC-053）为用户产品确认：暂停后可以继续，结束后不再执行后续首次呼叫及尚未执行的重呼；迟到结果只回补原记录与统计，不重开任务或触发重呼。CF-04仅余已发起拨号/振铃及已接通通话的收尾，不声称供应商已答复或保证挂断、删除队列。官方原文快照保留；完整契约条目不等于已实现字段或联调通过。',mappings=ROWS,catalog=CATALOG,sources=SOURCES)
OUT.mkdir(exist_ok=True)
(OUT/'field-alignment.json').write_text(json.dumps(DATA,ensure_ascii=False,indent=2)+'\n')
(HERE/'current-review.json').write_text(json.dumps(DATA,ensure_ascii=False,indent=2)+'\n')
md=['# AliCti 原型字段级对齐复核','',f'版本：{DATA["version"]}。读取 {len(SOURCES)} 份官方正文/字段定义；逐项复核 {len(ROWS)} 项原型字段映射，附 {len(CATALOG)} 条带接口/方法上下文的字段契约。','', '；'.join(k+' '+str(v)+' 项' for k,v in counts.items())+'。','',DATA['scope'],'','“已修正”表示本地原型字段或提示已修正；“已对齐”表示当前映射一致；“待确认”说明仍缺明确接口语义；真实资源、密钥和开通准备单列，不以联调未做判定接口不支持；“平台字段”由平台维护，不要求供应商有同名字段。','', '核验重点：字段名、方向、类型、必填条件、枚举、默认值、单位、ID归属、空值及失败处理。采用官方资料与用户转述供应商澄清D-014、D-017及D-020；关闭重呼按项目采用。D-021单独记录用户产品确认，不作为供应商反馈；本次不调用业务接口。','']
for area in dict.fromkeys(r['area'] for r in ROWS):
    md+=['## '+area,'','| 编号 | 页面字段 / 本地字段 | 接口字段 | 方向 / 类型 / 必填 | 最终规则 | 结论及处理 | 证据 |','|---|---|---|---|---|---|---|']
    for r in ROWS:
        if r['area']!=area:continue
        parts=[r['id'],r['label']+' / '+r['prototypeField'],r['field'],r['direction']+'；'+r['type']+'；'+r['required'],r['rule'],r['status']+'：'+r['action'],r['evidence']+'；'+', '.join('['+i+']('+SOURCE[i]['url']+')' for i in r['sourceIds'])]
        md+=['| '+' | '.join(x.replace('|','／').replace('\n',' ') for x in parts)+' |']
    md+=['']
md+=['## 具体待确认事项','']+[f'- {r["id"]} {r["label"]}：{r["rule"]} {r["action"]}' for r in ROWS if r['status']=='待确认']
(OUT/'field-alignment.md').write_text('\n'.join(md)+'\n')
payload=json.dumps(DATA,ensure_ascii=False).replace('<','\\u003c')
page='''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>AliCti 字段级对齐复核</title><style>
*{box-sizing:border-box}body{margin:0;font:14px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#233247;background:#f4f6fa}aside{position:fixed;inset:0 auto 0 0;width:240px;background:white;border-right:1px solid #dce3ec;padding:28px 20px;overflow:auto}aside h2{font-size:18px;margin:0 0 6px}aside p{font-size:12px;color:#758096}aside button,aside a{display:block;width:100%;font:inherit;text-align:left;margin:5px 0;padding:9px 10px;border:0;border-radius:5px;background:none;color:#475569;text-decoration:none;cursor:pointer}aside button.active{background:#eaf2ff;color:#1760c4;font-weight:600}main{margin-left:240px;padding:30px;max-width:1900px}h1{font-size:26px;margin:4px 0 8px}h2{font-size:18px}p{margin:8px 0}a{color:#1760c4}.lead{color:#62718a}.stats{display:flex;gap:12px;flex-wrap:wrap;margin:22px 0}.stat{background:#fff;border:1px solid #dce3ec;border-radius:8px;padding:14px 20px;min-width:130px}.stat strong{display:block;font-size:28px}.toolbar{display:flex;flex-wrap:wrap;gap:12px;margin:18px 0;align-items:center}input,select{font:inherit;border:1px solid #cbd5e1;border-radius:5px;padding:9px;background:white}input{width:min(460px,100%)}.table-wrap{overflow:auto;background:#fff;border:1px solid #dce3ec;border-radius:7px}table{width:100%;min-width:940px;border-collapse:collapse;table-layout:fixed}th,td{padding:12px 13px;border-bottom:1px solid #e6ebf1;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#edf2f8;font-weight:600}td small{display:block;color:#718096;font-size:12px;margin-top:4px}.status{display:inline-block;font-size:12px;padding:2px 7px;border-radius:4px;background:#eef2f5;white-space:nowrap}.fixed{background:#e9f6ee;color:#25653e}.pending{background:#fff3d9;color:#875c06}.platform{background:#edf0f5;color:#536175}.note{border-left:3px solid #4281cc;background:white;padding:12px 17px;margin:16px 0}code{font-family:ui-monospace,monospace;font-size:12px}summary{cursor:pointer;font-weight:600;padding:12px 0}.catalog-table{table-layout:auto;font-size:13px}.catalog-table th:first-child{width:140px}.catalog-table td{max-width:650px}details{margin:14px 0}.hidden{display:none!important}#visibleCount{color:#61728a}footer{color:#718096;font-size:12px;margin-top:24px}@media(max-width:760px){aside{position:static;width:auto;border-bottom:1px solid #ddd}aside button{display:inline-block;width:auto}main{margin:0;padding:18px}.stats{gap:8px}.stat{min-width:110px}h1{font-size:23px}}
</style></head><body><aside><h2>字段级对齐</h2><p>以官方文档与当前采用澄清为准</p><div id="areas"></div><button id="catalogTab">完整接口字段</button><a href="remaining-confirmations.html">本轮待确认清单 ↗</a><a href="functional-spec.html">完整功能说明</a><a href="interaction.html">规则附表</a><a href="development.html">开发交付包</a><a href="field-alignment.md" download>下载 Markdown</a><a href="field-alignment.json" download>下载结构化清单</a></aside><main><h1>原型与接口字段对齐复核</h1><p class="lead" id="overview"></p><div class="stats" id="stats"></div><div class="note"><a href="remaining-confirmations.html">查看本轮确认清单与统计口径</a>。主账号7522240；MD5仅格式占位；技能等级本地约束1–10。字段按接口、方法和读写方向解释。“已修正”是本地原型结果；待确认字段会保留具体原因。平台角色、租户、客户、批次和业务状态由平台维护。</div><section id="mappingView"><div class="toolbar"><input id="search" type="search" placeholder="搜索页面字段、接口字段、规则或编号" aria-label="搜索字段"><select id="status" aria-label="筛选结论"><option>全部结论</option><option>已修正</option><option>已对齐</option><option>待确认</option><option>平台字段</option></select><span id="visibleCount" aria-live="polite"></span></div><div class="table-wrap"><table><colgroup><col style="width:15%"><col style="width:16%"><col style="width:12%"><col style="width:24%"><col style="width:23%"><col style="width:10%"></colgroup><thead><tr><th>原型字段</th><th>接口字段</th><th>方向与类型</th><th>最终规则</th><th>对齐结果</th><th>来源</th></tr></thead><tbody id="rows"></tbody></table></div></section><section id="catalogView" class="hidden"><h2>完整接口字段契约</h2><p>按原文表格逐条保留类型、必填和说明。同名字段可能属于不同方法或不同响应对象；未关联原型项的字段表示本期未采用或接入待确认，不能视为已实现。</p><div id="catalog"></div></section><footer>2026-09-15 按D-021用户产品确认补齐FA-051/FA-052：暂停后可继续，结束后不再发起后续呼叫或重呼，迟到结果只回补历史；CF-04仅余已发起通话的收尾。D-020两项结论及其不同来源保持。完整字段表不代表所有接口都已接入；未发送供应商业务请求，未重新发布 GitLab。</footer></main><script id="fieldData" type="application/json">__DATA__</script><script>
const data=JSON.parse(document.getElementById('fieldData').textContent),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let area='全部字段';
const sourceMap=Object.fromEntries(data.sources.map(s=>[s.id,s]));const byId=id=>document.getElementById(id),tone=s=>s==='待确认'?'pending':s==='平台字段'?'platform':'fixed';
byId('overview').textContent=`${data.sourceCount} 份官方正文与字段定义 · ${data.reviewedMappingCount} 项原型字段映射 · ${data.catalogFieldCount} 条接口字段契约`;
byId('stats').innerHTML=Object.entries(data.counts).map(([k,v])=>`<div class="stat"><span>${k}</span><strong>${v}</strong></div>`).join('');
byId('areas').innerHTML=['全部字段',...new Set(data.mappings.map(r=>r.area))].map(a=>`<button data-area="${esc(a)}" class="${a===area?'active':''}">${esc(a)}</button>`).join('');
function render(){const q=byId('search').value.trim().toLowerCase(),s=byId('status').value;const rows=data.mappings.filter(r=>(area==='全部字段'||r.area===area)&&(s==='全部结论'||r.status===s)&&(!q||JSON.stringify(r).toLowerCase().includes(q)));byId('visibleCount').textContent=`显示 ${rows.length} / ${data.mappings.length} 项`;byId('rows').innerHTML=rows.map(r=>`<tr id="${r.id}"><td><strong>${esc(r.label)}</strong><small>${r.id} · ${esc(r.area)}</small><code>${esc(r.prototypeField)}</code></td><td><code>${esc(r.field)}</code></td><td>${esc(r.direction)}<br>${esc(r.type)}<small>${esc(r.required)}</small></td><td>${esc(r.rule)}</td><td><span class="status ${tone(r.status)}">${r.status}</span><p>${esc(r.action)}</p><small>${esc(r.evidence)}</small></td><td>${r.sourceIds.map((id,i)=>`<a href="${esc(r.sources[i])}" target="_blank" rel="noopener">${esc(id)}</a><small>${esc(sourceMap[id]?.name)}</small><small>${esc(sourceMap[id]?.endpoint||'')}</small>`).join('<br>')}</td></tr>`).join('')||'<tr><td colspan="6">没有匹配字段</td></tr>';}
byId('areas').onclick=e=>{const b=e.target.closest('[data-area]');if(!b)return;area=b.dataset.area;document.querySelectorAll('aside button').forEach(x=>x.classList.toggle('active',x===b));byId('mappingView').classList.remove('hidden');byId('catalogView').classList.add('hidden');render();};
byId('search').oninput=render;byId('status').onchange=render;
byId('catalogTab').onclick=()=>{document.querySelectorAll('aside button').forEach(x=>x.classList.toggle('active',x===byId('catalogTab')));byId('mappingView').classList.add('hidden');byId('catalogView').classList.remove('hidden');};
byId('catalog').innerHTML=data.sources.map(s=>{const fields=data.catalog.filter(f=>f.sourceId===s.id);return `<details><summary>${esc(s.id+' · '+s.name)}（${fields.length} 条）</summary><a href="${esc(s.url)}" target="_blank" rel="noopener">查看官方原文</a>${s.endpoint?` · <code>${esc(s.endpoint)}</code>`:''}<div class="table-wrap"><table class="catalog-table"><thead><tr><th>字段</th><th>类型 / 必填</th><th>定义及约束</th><th>方法上下文 / 对齐项</th></tr></thead><tbody>${fields.map(f=>`<tr><td><code>${esc(f.field)}</code></td><td>${esc(f.type)}<small>${esc(f.required)}</small></td><td>${esc(f.description)} ${esc(f.constraints)}</td><td>${esc(f.section)}<small>${esc(f.mappingIds.join('、')||f.adoption)}</small></td></tr>`).join('')}</tbody></table></div></details>`}).join('');render();
</script></body></html>'''
(OUT/'field-alignment.html').write_text(page.replace('__DATA__',payload))
print(json.dumps({k:DATA[k] for k in ['sourceCount','reviewedMappingCount','catalogFieldCount','counts']},ensure_ascii=False))
