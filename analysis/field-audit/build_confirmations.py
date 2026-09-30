"""Current supplier questions; separate interface semantics from deployment preparation."""
import json,html
from pathlib import Path
R=Path(__file__).resolve().parents[2];O=R/'prototype/docs';D=json.loads((O/'field-alignment.json').read_text());S={s['id']:s for s in D['sources']}
UPDATED_DATE='2026-09-15'
REVISION='2026-09-15-task-execution-1'
items=[
('工号字符串类型与身份一致性','FA-005',['API-302','API-307','DOC-336'],'坐席创建、电话鉴权及登录','已澄清：鉴权文档Int为笔误，实际全部String；0012与12是不同工号，鉴权与登录必须完整一致。','鉴权、登录及身份比较统一保留完整字符串；不转整数，不合并不同前导零工号。'),
('RASR文本与预览转写开关','FA-018 / FA-078',['API-304','API-307','DOC-346','DOC-347'],'预览转写条件与通话文本展示','已按D-015确认：仅预览且企业自动转写开启并按席过滤时，两个开关均允许才具备转写条件；RASR monitorSide明确识别说话方。','统一rasrEvent/query读取text和botText，机器人独立标记；旧asr/get不作为本期路径，文本定位录音继续取消。'),
('两类外呼按状态重呼与关闭口径','FA-046',['API-311','DOC-338'],'预测与自动外呼按状态重呼；关闭时不启用重呼','已关闭：预测按号码状态重呼依据用户转述阿里反馈；关闭省略相关重呼字段与templateName按不启用处理，为当前项目采用。','D-020两类任务统一按一组condition.sipCause多码数组映射；开启时官方状态、次数、间隔及计时依据必填。关闭保留本地配置但省略retryStrategy、retryStrategyTimeType、templateName，按不启用重呼处理；匹配、轮次、计数及调度由阿里执行，常规接入验证不作为功能阻断。'),
('暂停、结束后已发起通话的收尾方式','FA-051 / FA-052',['API-313','API-314','DOC-333','DOC-334','DOC-338'],'已发起拨号或振铃、已接通通话的收尾','暂停或结束任务后，已发起的拨号或振铃、已接通通话分别如何收尾？','D-017已明确：暂停始终省略pauseDuration；继续前task/get成功、taskId匹配且status=2才调用task/start，随后再查询；保留本地权限及资源校验，受理不代表运行。D-021为用户产品确认：暂停后可以继续；结束后不再发起后续首次呼叫及尚未执行的重呼，不重新开启；迟到结果只回补原记录与统计，不重开或触发新重呼。CF-04仅保留已发起通话如何收尾，属于现有控制接口的行为语义澄清；不承诺挂断通话或删除供应商队列。'),
('话单返回时间格式','FA-068',['API-317','API-318','API-319'],'通话时间展示、统计对账','确认返回upTime、bridgeTime等字段在各话单类型下的时间单位、格式和空值含义。请求参数已明确Unix秒；返回示例为时间戳，但表格未逐字段明确。','保留原始返回，客户/坐席接听字段按呼叫类型映射；不根据查询参数单位强推所有响应单位。'),
('号码资源控制','—',['API-310','DOC-345'],'号码停用对呼入及在途影响、线路级隔离、账号解绑','号码status=0对既有来电入口及在途通话的准确影响是什么？线路级隔离和账号解绑是否提供接口及查证路径？','开通与账号归属采用供应商资源流程；本期按batchUpdateNumber实现启停和用途，保留授权/路由，不能当作呼入全隔离。'),
('供应商任务删除','—',['DOC-334','DOC-338'],'已创建任务删除与历史保留','已知task/delete允许初始或完成态并删除任务号码；删除超时如何查证最终结果、已关联批次及历史证据如何保留？','仅支持符合条件的本地草稿删除，不将task/stop等同于删除。'),
('坐席批量导入与查证','—',['API-307','API-308','DOC-332','DOC-341','DOC-342','DOC-343'],'同工号重建历史、部分技能失败和未知结果','删除后再建同工号如何与旧坐席及话单区分？批量other与success是否重叠、如何定位技能失败的工号？请求未知后哪些查询状态可证明本次写入结果？','已补batchCreate连续工号和query/get查证路径；已有席导入只读后本地关联。未知不重放，other不当技能成功，历史身份不覆盖。'),
('坐席在线修改与在途影响','—',['API-308','DOC-332'],'停用/恢复、变更坐席配置','在线或通话中允许修改哪些字段？active=0何时生效、在途通话如何处理、恢复应检查哪些状态？','技能更新与删除先检查离线；平台保留历史，不以本地开关证明真实电话侧生效。'),
('呼入IVR发布与租户分流','—',['API-322','API-323','API-319','DOC-348','DOC-349'],'呼入流程发布、号码绑定、总部与门店共享呼入','自动外呼已采用官方列表选取既有流程，流程维护交由阿里；剩余为呼入完整发布/版本、共享号码按键分租户、技能队列、无坐席及非服务时间兜底如何配置并回传唯一租户归属。','自动外呼从ivrProfile/list按账号、ivrType=1与本租户外呼授权选取id，listDetail按需读取详情；列表存在不等于已发布或适用于外呼。执行轨迹仅用于回查，呼入分流仍待确认。'),
('电话连接生命周期','—',['API-303','API-304','API-306'],'上线、异常恢复、跨设备占用','SDK不同设备登录互斥、断线重连、浏览器关闭后的会话清理与可靠就绪判断应采用哪些事件/步骤？','可演示登录成功、材料过期、音频失败；本地占用控制不作为供应商跨设备保证。'),
('事件交付与来源回传','—',['API-304','API-312','API-315','API-316','API-318'],'状态回调、断线补偿、同号跨批次归属','HTTP/WebSocket事件的乱序、重复、断线补发及最终结果更新边界是什么？property、callVariables等来源字段在哪些回调/话单完整返回？','推送类型、目标配置及重试参数已有文档；本轮问题限定事件一致性与来源贯通。未知归属不回写其他租户或客户行。'),
('号码识别异步结果与覆盖范围','—',['API-317','API-318','API-327'],'号码状态刷新、自动外呼与呼入号码识别','sipCauseAsyncUpdateFlag取值与完成条件是什么？自动外呼/呼入使用哪些结果接口和字段，能否覆盖本期识别需求？','人工、预测复用已核实字段与官方编码；715/183按同一编码展示全部候选，不自定义新码。')]
Q=[dict(id=f'CF-{i:02}',topic=x[0],fieldIds=x[1],sourceIds=x[2],function=x[3],question=x[4],handling=x[5],sources=[dict(id=k,url=S[k]['url'],title=S[k].get('name', S[k].get('path', k))) for k in x[2]]) for i,x in enumerate(items,1)]
QUESTION_UPDATES={
    'CF-04':dict(
        topic='暂停、结束后已发起通话的收尾方式',
        function='已发起拨号或振铃、已接通通话的收尾',
        questionItems=[
            '任务经task/get确认暂停（status=2）后，暂停前已发起、仍在拨号或振铃的通话如何收尾？已经接通的通话如何收尾？请分别说明是等待本次通话自然结束，还是由阿里中止，以及对应结果如何回传。',
            '任务经task/get确认结束（status=3）后，结束前已发起、仍在拨号或振铃的通话如何收尾？已经接通的通话如何收尾？请分别说明是等待本次通话自然结束，还是由阿里中止，以及对应结果如何回传。'],
        confirmedBasis=[
            '暂停请求不提交可选pauseDuration，不设置本地自动继续计时。',
            '继续先task/get成功确认原任务status=2，再调用/interface/v10/task/start，随后再次task/get核对实际状态。',
            '本期不做已结束任务重新开启；继续保留权限、资源和任务归属校验。',
            'D-021（SRC-053）为用户产品确认：暂停后可以继续；结束后不再执行后续首次呼叫及尚未执行的重呼，不再就此重复提问。',
            '结束后的迟到通话结果只回补原记录和统计，不重开任务或继续、触发新的重呼；此为产品规则，不声明供应商已答复。',
            '不新增接口参数、本地执行队列或恢复计时，不承诺挂断已发起通话或删除供应商队列。'],
        decisionId='D-021',sourceRef='SRC-053',sourceType='user_product_confirmation',questionType='existing_api_behavior_semantics',
        replyRequired='请仅分别说明暂停和结束时，已发起拨号或振铃、已接通这两类通话的收尾方式及结果回传；预测外呼与自动外呼如有差异，请分别列明。这是现有接口行为语义澄清，不要求新增暂停或结束接口。')}
for q in Q:
    if q['id'] in QUESTION_UPDATES:
        q.update(QUESTION_UPDATES[q['id']])
        q['question']=' '.join(f'{i}. {s}' for i,s in enumerate(q['questionItems'],1))
        q['updatedAt']=UPDATED_DATE
CLOSED=[dict(**q,status='closed',decisionId='D-013',resolution='本期统一先下线再更新配置或技能；20023失败不回写，启用与电话登录分开。不实现在线修改例外。') for q in Q if q['id']=='CF-09']
CLOSED += [dict(**q,status='closed',decisionId='D-014',resolution='供应商确认Int为文档笔误，cno实际全部String；0012与12不同，鉴权与登录必须原样一致。') for q in Q if q['id']=='CF-01']
CLOSED += [dict(**q,status='closed',decisionId='D-015',resolution='采用供应商预览门控表及RASR文本路径：isAsr=0不可由单次开启覆盖；monitorSide区分坐席/客户，botText独立标记机器人。时长等条件仍影响实际文本产出。') for q in Q if q['id']=='CF-02']
CLOSED += [dict(**q,status='closed',decisionId='D-020',closedAt=UPDATED_DATE,
    resolution='预测外呼按号码状态重呼已按用户转述阿里反馈确认，两类任务统一采用条件策略。关闭时省略retryStrategy、retryStrategyTimeType和templateName，按不启用重呼处理，是当前项目采用；不表述为供应商已保证。两问不再作为功能待确认，仅保留常规联调。',
    resolutionSources=[
        dict(conclusion='预测外呼也支持按号码状态重呼',sourceType='user_relayed_supplier_feedback',source='2026-09-15用户转述阿里反馈'),
        dict(conclusion='关闭省略相关字段与templateName，按不启用重呼处理',sourceType='current_project_adoption',source='当前项目采用口径；不伪造供应商默认行为保证')],
    remainingValidation='号码识别服务开通、正式请求及执行结果按常规接入验证，不阻断本期功能。') for q in Q if q['id']=='CF-03']
Q=[q for q in Q if q['id'] not in {'CF-01','CF-02','CF-03','CF-09'}]
P=[dict(id='PRE-01',item='正式鉴权与电话材料',detail='生产token、正式sessionKey、agentGateWayUrl与bindTel在实际接入时配置。主账号7522240已确认；演示不需要token或真实MD5。'),dict(id='PRE-02',item='服务与媒体开通',detail='号码识别、ASR、录音分轨及所需电话能力在实际接入前核对开通和资源。未开通不等于文档未提供接口。'),dict(id='PRE-03',item='真实资源与环境映射',detail='将演示skill/ivr/task/file编号替换为真实响应ID，配置回调目标、SDK环境并完成联调验收。演示编号不得直接用于生产。')]
SCOPE_DECISIONS=[{'id': 'D-012', 'date': '2026-09-14', 'status': 'accepted', 'type': 'scope_reduction', 'description': '取消转写文本到录音定位，保留录音基础播放和文本阅读搜索。', 'removed': ['transcript_audio_seek', 'segment_time_jump', 'transcript_playback_highlight'], 'retained': ['audio_player_controls', 'recording_download', 'transcript_read_search'], 'affectedFunctionIds': ['FUNC-266', 'FUNC-282'], 'affectedFieldIds': ['FA-078'], 'remainingConfirmationIds': ['CF-02']}]
SCOPE_DECISIONS.append(dict(id='D-013',date='2026-09-14',status='accepted',type='vendor_alignment',description='号码以官方batchUpdateNumber及可选字段为准；坐席导入遵循连续工号与已有席查询规则；配置及技能修改先下线；暂停处理已由D-017后续决定替代；技能等级1–10并保留历史越界值待调整。',affectedFieldIds=['FA-023','FA-052']+[f'FA-{i:03}' for i in range(88,95)],closedConfirmationIds=['CF-09'],source='供应商补充工作簿及用户本轮五项决定'))
SCOPE_DECISIONS.append(dict(id='D-014',date='2026-09-14',status='accepted',type='supplier_correction',description='供应商确认鉴权cno的Int为笔误，实际均为String；鉴权与登录完整工号一致，0012与12是不同工号。',affectedFieldIds=['FA-005'],closedConfirmationIds=['CF-01'],source='用户本轮转述供应商澄清'))
SCOPE_DECISIONS.append(dict(id='D-015',date='2026-09-14',status='accepted',type='rasr_adoption',description='统一RASR查询文本，采用预览转写门控表与monitorSide角色；旧ASR不作为本期路径，不恢复录音定位。',affectedFieldIds=['FA-018','FA-075','FA-076','FA-077','FA-078'],closedConfirmationIds=['CF-02'],source='官方DOC-346/DOC-347、用户供应商截图及采用决定'))
SCOPE_DECISIONS.append(dict(id='D-016',date='2026-09-14',status='accepted',type='product_scope_decision',description='重呼由阿里执行，本地默认关闭开关、开启完整必填；重呼配置界面已由D-018覆盖，自动外呼直接选择官方IVR列表资源，供应商维护流程。',affectedFieldIds=['FA-034','FA-038','FA-044','FA-045','FA-046'],closedConfirmationIds=[],narrowedConfirmationIds=['CF-03','CF-10'],source='用户本轮五项执行决定与官方API-311、DOC-338、DOC-348、DOC-349；不是供应商新增能力声明'))
SCOPE_DECISIONS.append(dict(id='D-017',date='2026-09-14',status='accepted',type='user_relayed_supplier_feedback_and_scope_decision',description='暂停不提交可选pauseDuration；用户转述阿里反馈，暂停后继续先task/get确认status=2，再调用/interface/v10/task/start并复查；本期不做结束后重新开启。保留本地权限、资源校验及失败未知查证。',affectedFieldIds=['FA-051','FA-052'],closedConfirmationIds=[],narrowedConfirmationIds=['CF-04'],source='当前用户指令及用户转述阿里反馈；未声明官方页面已更新'))
SCOPE_DECISIONS.append(dict(id='D-018',date='2026-09-14',status='accepted',type='user_product_requirement',description='预测与自动外呼开启重呼均必选至少一个官方状态，并填写次数、间隔、计时依据；不提供隐藏状态选择的基础模式。预测条件支持与关闭处理已由D-020采用结论接续。',affectedFieldIds=['FA-044','FA-045','FA-046'],closedConfirmationIds=[],updatedConfirmationIds=['CF-03'],source='用户明确要求两类任务均保留状态选择；此条为产品界面要求，预测支持采用后续D-020供应商反馈'))
SCOPE_DECISIONS.append(dict(id='D-020',date=UPDATED_DATE,status='accepted',type='supplier_feedback_and_project_adoption',description='用户转述阿里反馈：预测外呼也支持按号码状态重呼，两类任务统一采用条件策略。关闭省略retryStrategy、retryStrategyTimeType与templateName按不启用处理，为当前项目采用；不表述为供应商默认行为保证。FA-046已修正，CF-03关闭，仅保留常规联调。',affectedFieldIds=['FA-046'],closedConfirmationIds=['CF-03'],source='预测支持：用户转述阿里反馈；关闭处理：当前项目采用。官方原文快照不修改。'))
SCOPE_DECISIONS.append(dict(id='D-021',date=UPDATED_DATE,status='accepted',type='user_product_confirmation',sourceRef='SRC-053',description='用户确认产品规则：暂停后可以继续，结束后不再执行后续首次呼叫及尚未执行的重呼；迟到结果仅回补原通话、客户记录与统计，不重开任务或触发新重呼。D-017省略暂停时长与查询确认暂停后继续的流程保持；CF-04仅余已发起拨号/振铃及已接通通话的收尾，不承诺挂断或删除供应商队列，不新增接口参数、本地队列或恢复计时。',affectedFieldIds=['FA-051','FA-052'],closedConfirmationIds=[],narrowedConfirmationIds=['CF-04'],source='2026-09-15用户产品确认；不是供应商已答复或响应保证，官方原文快照不修改。'))
DATA=dict(version=D['version'],date=UPDATED_DATE,confirmationRevision=REVISION,updatedQuestionIds=['CF-04'],fieldReviewCount=D['reviewedMappingCount'],previousPendingFields=1,closedPreviousPendingFields=0,newPendingFields=[],remainingPendingFieldCount=D['counts']['待确认'],confirmationTopicCount=len(Q),preparationCount=len(P),scope='94项字段映射有1项待确认（FA-068）；9个供应商确认主题，两个口径不相加。D-020已修正FA-046并关闭CF-03：预测与自动外呼均采用按状态重呼，关闭省略相关字段与templateName按不启用处理；预测支持来自用户转述阿里反馈，关闭处理为当前项目采用。CF-01/CF-02/CF-09保持关闭；接入准备另列3类。D-021（SRC-053）记录用户产品确认：暂停后可以继续，结束后不再执行后续首次呼叫及尚未执行的重呼，迟到结果只回补历史；不表述为供应商已答复。CF-04仅保留暂停和结束后已发起拨号/振铃及已接通通话如何收尾的两问，属于现有接口行为语义澄清；其他8个主题不变。',confirmed=['D-021：用户产品确认（SRC-053），暂停后可以继续，结束后不再执行后续首次呼叫及尚未执行的重呼；迟到结果只回补原记录和统计，不重开任务或触发重呼；已发起通话如何收尾仍待CF-04明确，不承诺挂断或删除供应商队列','D-020：预测与自动外呼均支持按号码状态重呼；开启时状态、次数、间隔与计时依据必填，执行交由阿里','D-020：关闭保留本地配置，省略retryStrategy、retryStrategyTimeType与templateName按不启用重呼处理，为当前项目采用，常规联调另行验证','暂停省略pauseDuration；继续先get确认status=2再start并复查；结束不重新开启（D-017）','本地重呼开关默认关闭，开启完整必填；自动外呼直接选择官方IVR列表（D-016）','统一RASR文本；预览转写按双开关门控（D-015）','cno全部String；0012与12不同，鉴权与登录须完整一致（D-014）','enterpriseId=7522240；UUID不参与接口','静态演示使用32位sign占位；不计算实际MD5','技能等级1–10整数；历史越界值保留待调整'],items=Q,closedItems=CLOSED,preparations=P,scopeDecisions=SCOPE_DECISIONS)
(O/'remaining-confirmations.json').write_text(json.dumps(DATA,ensure_ascii=False,indent=2)+'\n')
md=['# 本轮待确认清单','',f'原型版本：{D["version"]} · 问题更新：{UPDATED_DATE}','',DATA['scope'],'','94项字段当前为：已修正68、已对齐18、待确认1、平台字段7。FA-046已按D-020修正，仅FA-068待确认；CF-03不再列为待答复问题。D-017暂停不传时长、继续查询确认后启动及结束不重开保持。D-021用户产品确认补齐后续执行边界，CF-04仅余已发起通话如何收尾；D-012取消的录音定位不恢复。','', '已确认：'+'；'.join(DATA['confirmed'])+'。','', '[返回字段级对齐](field-alignment.html) · [返回规则附表](interaction.html)','','## 供应商需答复的9个主题','','| 编号 | 主题 / 功能 | 关联接口 | 需要明确的问题 | 当前处理 |','|---|---|---|---|---|']
for q in Q:md.append('| '+' | '.join([q['id'],q['topic']+'；'+q['function']+'；'+q['fieldIds'], ' / '.join('['+s['id']+']('+s['url']+')' for s in q['sources']),('<br>'.join(f'{i}. {t}' for i,t in enumerate(q['questionItems'],1)) if q.get('questionItems') else q['question']),q['handling']])+' |')
for q in Q:
    if q.get('confirmedBasis'):
        md+=['',f'### {q["id"]} 答复前提与所需材料','']+['- '+t for t in q['confirmedBasis']]+['',q['replyRequired'],'']
closed_retry=next(q for q in CLOSED if q['id']=='CF-03')
md+=['','<a id="CF-03"></a>','## CF-03 已关闭','',closed_retry['resolution'],'']+['- '+s['conclusion']+'；依据：'+s['source']+'。' for s in closed_retry['resolutionSources']]+['',closed_retry['remainingValidation'],'']
md+=['','已关闭 CF-02：统一RASR文本与说话方，采用企业自动转写开启且按席过滤前提下的预览转写双开关规则。来源D-015；不代表已生成文本。','','已关闭 CF-01：cno全部String，鉴权与登录完整一致，0012与12是不同工号。来源D-014；新增3–10位工号规则不变。','','已关闭 CF-09：本期统一先下线再修改，不采用在线例外。来源 D-013；变更失败仍保留原状态。','']
md+=['','## 实际接入前准备（不计接口缺口）','']+[f'- {p["id"]} · {p["item"]}：{p["detail"]}' for p in P]
md+=['','开发交付包已按用户新指令生成；本清单仍保持未决，不表示供应商问题已澄清。影响功能与开发任务见 development/open-items.json。','']
(O/'remaining-confirmations.md').write_text('\n'.join(md))
e=html.escape
def question_html(q):
    if not q.get('questionItems'):return e(q['question'])
    return '<ol>'+''.join('<li>'+e(t)+'</li>' for t in q['questionItems'])+'</ol><p class="reply-note">'+e(q['replyRequired'])+'</p>'

def handling_html(q):
    body=e(q['handling'])
    if q.get('confirmedBasis'):
        body+='<details><summary>已确认前提（无需重复答复）</summary><ul>'+''.join('<li>'+e(t)+'</li>' for t in q['confirmedBasis'])+'</ul></details>'
    return body

rows=''.join('<tr id="'+q['id']+'"><td>'+q['id']+'</td><td><strong>'+e(q['topic'])+'</strong><p>'+e(q['function'])+'</p><small>'+e(q['fieldIds'])+'</small></td><td>'+'<br>'.join('<a href="'+e(s['url'],quote=True)+'" target="_blank" rel="noopener">'+s['id']+' · '+e(s['title'])+'</a>' for s in q['sources'])+'</td><td>'+question_html(q)+'</td><td>'+handling_html(q)+'</td></tr>' for q in Q)
closed_retry_html='<section class="note" id="CF-03"><h2>CF-03 已关闭</h2><p>'+e(closed_retry['resolution'])+'</p><ul>'+''.join('<li>'+e(x['conclusion']+'；依据：'+x['source'])+'</li>' for x in closed_retry['resolutionSources'])+'</ul><p>'+e(closed_retry['remainingValidation'])+'</p></section>'
htmlpage='''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>本轮待确认清单</title><style>*{box-sizing:border-box}body{margin:0;background:#f4f6fa;color:#233247;font:14px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}aside{position:fixed;inset:0 auto 0 0;width:230px;background:white;border-right:1px solid #dce3ec;padding:25px 18px}aside a{display:block;margin:12px 0;color:#1760c4;text-decoration:none}main{margin-left:230px;padding:32px;max-width:1800px}h1{font-size:26px;margin:0 0 14px}h2{font-size:18px}.stats{display:flex;gap:16px;flex-wrap:wrap}.stats div,.note{background:white;border:1px solid #dce3ec;padding:16px;border-radius:7px;margin:10px 0}.stats strong{display:block;font-size:30px}table{width:100%;border-collapse:collapse;min-width:1000px;background:white;table-layout:fixed}td,th{padding:12px;border:1px solid #dce3ec;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#edf2f8}td:first-child{width:60px}a{color:#1760c4}.table-wrap{overflow:auto}small{color:#62718a}td ol,td ul{margin:0;padding-left:20px}td li+li{margin-top:12px}tr[id]{scroll-margin-top:20px}.reply-note{color:#62718a;font-size:12px}details{margin-top:12px}summary{cursor:pointer;color:#1760c4}details ul{margin-top:10px}@media(max-width:760px){aside{position:static;width:auto}main{margin:0;padding:18px}}@media print{aside{display:none}main{margin:0;padding:0}table{min-width:0;font-size:11px}}</style></head><body><aside><h2>本轮待确认</h2><a href="#CF-03">CF-03 已关闭</a><a href="#CF-04">CF-04 暂停与结束</a><a href="#questions">全部确认主题</a><a href="#preparation">接入准备</a><a href="field-alignment.html">← 字段级对齐</a><a href="functional-spec.html">完整功能说明</a><a href="interaction.html">规则附表</a><a href="development.html">开发交付包</a><a href="remaining-confirmations.md" download>下载 Markdown</a><a href="remaining-confirmations.json" download>下载结构化清单</a></aside><main><h1>改造后的待确认清单</h1><p>2026-09-15 · CF-03 保持关闭；CF-04 按 D-021 收窄为已发起通话的收尾</p><div class="stats"><div><strong>1</strong>剩余字段待确认 / 94项</div><div><strong>9</strong>供应商确认主题</div><div><strong>3</strong>实际接入准备类别</div></div><div class="note">'''+e(DATA['scope'])+'''<p>2026-09-14 已取消文本定位录音。CF-02已按RASR文本及预览门控方案关闭；FA-018与FA-078已修正。CF-09已按离线修改规则关闭；FA-051/FA-052保留D-017调用规则：暂停不传时长，查询确认暂停后继续；D-021用户产品确认结束后不再执行后续呼叫及未执行重呼，迟到结果仅回补历史。CF-04仅余已发起拨号/振铃及已接通通话的收尾，未声称供应商已答复。</p><p>CF-01已关闭：供应商确认工号类型均为String，0012与12不同，鉴权与登录须完整一致；FA-005已修正。</p><p>主账号：7522240 · MD5仅格式占位 · 技能等级：1–10整数约束。</p></div><h2 id="questions">供应商需答复的9个主题</h2><div class="table-wrap"><table><colgroup><col style="width:6%"><col style="width:18%"><col style="width:20%"><col style="width:29%"><col style="width:27%"></colgroup><thead><tr><th>编号</th><th>主题及功能</th><th>关联接口</th><th>需要明确的问题</th><th>原型当前处理</th></tr></thead><tbody>'''+rows+'''</tbody></table></div>'''+closed_retry_html+'''<h2 id="preparation">实际接入前准备</h2><p>这些是接入材料与验收准备，不计为接口缺口。</p>'''+''.join('<div class="note"><strong>'+e(p['id']+' · '+p['item'])+'</strong><p>'+e(p['detail'])+'</p></div>' for p in P)+'''<p>开发交付包已生成，具体未决分支继续保留。<a href="development.html">查看开发交付包及影响范围</a>。</p></main></body></html>'''
(O/'remaining-confirmations.html').write_text(htmlpage)
print(json.dumps({k:DATA[k] for k in ['remainingPendingFieldCount','confirmationTopicCount','preparationCount']}))
