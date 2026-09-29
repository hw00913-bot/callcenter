"""Verify authored business documentation, its reading guide and source evidence."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import hashlib,json,re
from functional_content import VERSION,SECTIONS,CURRENT_FUNCTIONS
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def load(path):return json.loads((ROOT/path).read_text())
def check(name,condition):
    if not condition:raise AssertionError(name)
    checks.append(name)

spec=load('docs/functional-spec.json');fields=load('docs/field-alignment.json');rules=load('docs/rules-appendix.json');pending=load('docs/remaining-confirmations.json');changes=load('docs/change-log.json');facts=load('documentation/input/consolidated-reviewed-facts.json')
fieldids={x['id'] for x in fields['mappings']};ruleids={x['id'] for x in rules['rules']}
decisions={row['id']:row for row in facts['decisions']}
change_log_markdown=(ROOT/'docs/change-log.md').read_text()
change_log_version=re.search(r'^版本\s+([^\s·]+)\s+·\s+\d{4}-\d{2}-\d{2}\s*$',change_log_markdown,re.M)
release_section=re.search(r'^## 本版变化\s*\n(.*?)(?=^## |\Z)',change_log_markdown,re.S|re.M)
CURRENT_DECISIONS=re.findall(r'^\| \[(D-\d{3})\b',release_section.group(1),re.M) if release_section else []
UI_VERSION='2026-09-21-ui-field-alignment-1'
PREVIOUS_VERSION='2026-09-21-same-task-followup-1'
UNCHANGED_DIAGRAM_VERSION='2026-09-23-task-seat-threshold-default-navigation-1'
check('说明、字段、待确认与编写源版本一致',all(x['version']==VERSION for x in [spec,fields,pending,facts]))
check('变更记录版本与其编写源一致',change_log_version is not None and changes['version']==change_log_version.group(1))
check('当前云联络中心功能与页面范围一致',spec['featureCount']==78 and len({x['id'] for x in spec['functions']})==78 and spec['pageCount']==36 and len({x['id'] for x in spec['pages']})==36 and all(page.get('domain')!='AI_OUTBOUND' for page in spec['pages']) and 'FS-20' not in {section['id'] for section in spec['sections']})
normalized_functions=load('documentation/input/functions.json')
normalized_pages=load('documentation/input/pages.json')
check('规范化输入与现行交付范围一致',
      {row['id'] for row in normalized_functions}=={row['id'] for row in spec['functions']}
      and {row['id'] for row in normalized_pages}=={row['id'] for row in spec['pages']}
      and all(row.get('domain')!='AI_OUTBOUND' for row in normalized_pages)
      and all('智能外呼' not in json.dumps(row,ensure_ascii=False) for row in normalized_functions+normalized_pages))
check('全部功能章节与源一致',{s['id'] for s in spec['sections']}=={s['id'] for s in SECTIONS})
check('当前功能编号描述采用编写源覆盖而非冻结旧说明',all(row['description']==CURRENT_FUNCTIONS[row['id']] for row in spec['functions'] if row['id'] in CURRENT_FUNCTIONS))
function_text={row['id']:row['description'] for row in spec['functions']}
check('客户与通话功能描述采用业务分类动态字段',all(any(token in function_text[ident] for token in ['动态字段','动态业务信息','按业务分类','按当前业务分类','按所属业务分类']) and '固定六项' not in function_text[ident] for ident in ['FUNC-264','FUNC-265','FUNC-277']))
for authored in SECTIONS:
    built=next(s for s in spec['sections'] if s['id']==authored['id'])
    check(authored['id']+'逻辑与验收同步',all(built[k]==authored[k] for k in ['steps','logic','exceptions','acceptance']))
    check(authored['id']+'字段与运行文件可追溯',set(built['fieldIds'])<=fieldids and all((ROOT/f).is_file() for f in built['files']))
check('当前字段编号唯一且不含旧系统计费字段',len(fields['mappings'])==len(fieldids)==217 and 'FA-087' not in fieldids)
check('当前原型与规则附表不展示独立智能外呼系统',all('智能外呼' not in (ROOT/path).read_text() and 'AI_OUTBOUND' not in (ROOT/path).read_text() for path in ['index.html','docs/interaction.html','flowcharts/business-process.html','flowcharts/sequence-interaction.html','related-systems/index.html']))
check('原有来源保留且加入更新任务接口',len(fields['sources'])==101 and {f'API-{i}' for i in range(396,404)} <= {x['id'] for x in fields['sources']})
check('附表编号唯一且版本同步',len(ruleids)==len(rules['rules']) and rules['version']==facts['appendixVersion'] and '附表版 v'+rules['version'] in (ROOT/'docs/rules-appendix.md').read_text())
check('CF08关闭且CF11保留剩余子问',len(pending['items'])==9 and len(pending['preparations'])==3 and {x['id'] for x in pending['items']}=={'CF-07','CF-10','CF-11','CF-12','CF-13','CF-15','CF-16','CF-17','CF-18'})
check('确认页概述采用当前关闭结论','CF-08的重建、批量回执' in (ROOT/'docs/remaining-confirmations.md').read_text() and 'CF-08按D-050明确同工号重建的新配置身份与按cno合并历史话单，仅保留' not in (ROOT/'docs/remaining-confirmations.md').read_text())
check('D051和D052历史回复保留且本版变更来自统一记录',bool(CURRENT_DECISIONS) and changes['currentRelease']['changeIds']==CURRENT_DECISIONS and {'D-078','D-081','D-082','D-083','D-084','D-085'}<=set(CURRENT_DECISIONS) and all(any(x['id']==d and x['sourceRef']==r and x['sourceType']=='user_provided_supplier_reply_image' for x in facts['decisions']) for d,r in [('D-051','SRC-081'),('D-052','SRC-082')]))
closed=next(x for x in pending['closedItems'] if x['id']=='CF-04')
check('CF04关闭证据及答复完整',closed['status']=='closed' and closed['sourceRef']=='SRC-077' and closed['sourceType']=='user_relayed_supplier_feedback' and all(x in closed['resolution'] for x in ['正常进行','正常话单','不恢复任务']))
check('当前确认列表不再提问CF04',not any(x['id']=='CF-04' for x in pending['items']))
guide=(ROOT/'docs/development.md').read_text()
check('开发阅读指引保持精简并直接引用业务资料',len(guide)<6000 and all(x in guide for x in ['functional-spec','field-alignment','remaining-confirmations']) and '按需' in guide)
check('开发阅读指引不再链接独立开发包',not re.search(r'\]\([^)]*(?:\.zip|(?:\.\./)?development/)',guide,re.I))
check('重复开发资料与独立生成器已移除',not any(p.is_file() for p in (ROOT/'development').rglob('*')) and all(not (ROOT/'documentation'/name).exists() for name in ['build_development.py','build_package.py','verify_delivery.py']))
maintenance=changes['currentRelease']['deliveryMaintenance']
check('资料精简维护记录保留为D062历史决定',maintenance['date']=='2026-09-21' and maintenance['action']=='remove_duplicate_development_package' and maintenance['publicationStatus']=='tracked_by_gitlab_branch' and maintenance['guide']=='docs/development.html' and maintenance['references']=='references/README.md' and maintenance['version']==PREVIOUS_VERSION and maintenance['decisionId']=='D-062' and maintenance['sourceRef']=='SRC-092')
active_spec=(ROOT/'docs/functional-spec.md').read_text();active_rules=(ROOT/'docs/rules-appendix.md').read_text().split('## 附表 N')[0]
version_intro=re.search(r'## 一 版本说明(.*?)(?=\n## |\Z)',active_spec,re.S)
check('当前版本表正文说明监控分层与既有外显字段边界',version_intro is not None and all(token in version_intro.group(1) for token in ['D-085','取消独立业务模板','D-083','minAvailableAgentCount','autoStart=1','CF-18','CF-15','D-082','D-081','D-078']) and not any(token in version_intro.group(1) for token in ['同步D-060至D-062','纳入D-046至D-062']))
check('软电话配置、前导零与缺失阻断均说明',all(x in active_spec for x in ['软电话分机','前导零','bindTel','bindType=3','未配置']))
check('现行说明没有恢复号码技能授权链',not any(x in active_spec+active_rules for x in ['号码→总部/门店→技能组→关联坐席','号码仍由超级管理员逐组授权','authorizedTenantIds和boundSkillGroupIds','bindTel来自登录材料或独立演示配置','登录材料.bindTel（非用户配置）']))
for id in ['FA-008','FA-084','FA-170']:
    row=next(x for x in fields['mappings'] if x['id']==id)
    check(id+'已按本轮规则更新','D-046' in json.dumps(row,ensure_ascii=False))

cf06=next(x for x in pending['closedItems'] if x['id']=='CF-06')
check('CF06供应商语义与用户范围分别保留',cf06['sourceRef']=='SRC-078' and bool(cf06.get('supplierReply')) and bool(cf06.get('userScopeDecision')) and '本地' in cf06['resolution'])
local=next(x for x in fields['mappings'] if x['id']=='FA-183')
check('本地号码使用字段不冒充供应商契约',local['field']=='localEnabled' and local['status']=='平台字段' and not local['sourceIds'])

cf14=next(x for x in pending['closedItems'] if x['id']=='CF-14')
cf08=next(x for x in pending['closedItems'] if x['id']=='CF-08')
cf11=next(x for x in pending['items'] if x['id']=='CF-11')
check('CF14关闭且按截图采用中文含义',cf14['sourceRef']=='SRC-079' and 'telEnterCount（String）为队列来电接听数' in cf14['resolution'] and 'telAnswerCount（String）为进入队列来电数' in cf14['resolution'])
check('CF08关闭且查证边界完整',cf08['status']=='closed' and cf08['sourceRef']=='SRC-081' and all(x in cf08['resolution'] for x in ['子集','新id','createTime','queryAgentSkill']))
check('CF11部分明确并保留剩余问题',cf11['status']=='partially_clarified' and cf11['sourceRef']=='SRC-082' and all(x in cf11['handling'] for x in ['breakLine','20','sipDisconnected']) and all(x in cf11['question'] for x in ['异常关闭','跨设备','媒体','setOffline']))
check('四张新增供应商回复可追溯',all((ROOT/p).is_file() for k in ['seatBatchClarification','connectionLifecycleClarification'] for p in facts[k]['evidencePaths']))
check('供应商回复截图归档可追溯',all((ROOT/facts[k]['evidencePath']).is_file() for k in ['queueCounterClarification','seatRecreationClarification']))
for evidence in (ROOT/'documentation/input/supplier-feedback').iterdir():
    if not evidence.is_file():continue
    reference=ROOT/'references/supplier-feedback'/evidence.name
    check(evidence.name+'独立供应商反馈归档字节保持',reference.is_file() and hashlib.sha256(reference.read_bytes()).digest()==hashlib.sha256(evidence.read_bytes()).digest())
check('当前附表与字段已消除CF14未确认及CF08重建未确认口径',not any(x in active_rules for x in ['采用前需CF-14确认','同工号重新创建的历史关联规则需 CF-08 答复']) and any(x['id']=='FA-128' and 'D-049' in x['rule'] for x in fields['mappings']))

cf13=next(x for x in pending['items'] if x['id']=='CF-13')
check('CF13只保留自动外呼识别字段与编码对应',cf13['status']=='partially_clarified' and cf13['decisionId']=='D-054' and cf13['sourceRef']=='SRC-084' and all(x in cf13['question'] for x in ['自动','编码']) and all(x not in cf13['question'] for x in ['呼入','sipCauseAsyncUpdateFlag']))
clarification=facts['numberRecognitionClarification']
check('预测识别含义与证据独立归档',clarification['sourceType']=='user_relayed_supplier_feedback' and clarification['delayIsSla'] is False and clarification['flagMeanings']=={'0':'synchronous','1':'asynchronously_written_back_to_sipCause'} and (ROOT/clarification['evidencePath']).is_file())
inbound_clarification=facts['inboundNumberRecognitionClarification'];inbound_policy=inbound_clarification['projectPolicy']
check('呼入新澄清单独归档且不改D053历史',inbound_clarification['decisionId']=='D-054' and inbound_clarification['sourceRef']=='SRC-084' and inbound_clarification['sourceType']=='user_relayed_supplier_feedback' and load(inbound_clarification['evidencePath'])==inbound_clarification and clarification['version']=='2026-09-20-development-sync-1' and facts['regressionReview']['version']=='2026-09-20-regression-delivery-1')
check('软电话呼入以status判接听且识别不阻断',inbound_policy['seatBindType']==3 and inbound_policy['answerField']=='status' and inbound_policy['statusType']=='String' and inbound_policy['statusValues']==['人工接听','人工未接听','系统应答','系统未应答'] and all(inbound_policy[k] is False for k in ['numberRecognitionRequired','inboundRecognitionFieldBlocksDelivery','usedForInboundCustomerNumberDecision']) and inbound_policy['preserveRawRecognitionIfReturned'] is True)
check('附表和说明不把坐席绑定手机识别当来电客户结果',all(x in active_rules for x in ['D-054','坐席绑定手机号','不用作来电客户号码或接听结果判定']) and all(x in active_spec for x in ['status缺失或未知不沿用旧页面接通标签','已明确的接听事件仍保留','识别缺失正常留空']))
check('附表明确预测0不是待完成且补偿非SLA','0不是待完成' in active_rules and '非SLA' in active_rules)
check('识别适配不造新通话或重呼',all(x in active_spec for x in ['不新增记录','不由本地触发重呼','超过两分钟仍不伪造结果']))

# Regression guards for current product decisions, separate from immutable official sources.
current={x['id']:x for x in spec['sections']};fm={x['id']:x for x in fields['mappings']}
seat_logout=json.dumps(current['FS-12'],ensure_ascii=False)
logout_rules=' '.join(json.dumps(next(x for x in rules['rules'] if x['id']==ident),ensure_ascii=False) for ident in ['G-08','G-46'])
check('D076坐席普通退出固定保留电话绑定',decisions['D-076']['sourceRef']=='SRC-106' and decisions['D-076']['sourceType']=='user_product_requirement' and decisions['D-076']['sourceIds']==['API-304'] and all(token in seat_logout+logout_rules for token in ['logoutMode=1','removeBinding=0','不提供解绑选项','本地坐席分机配置']))
check('产品字段映射与官方能力分别标识','removeBinding=0' in fm['FA-011']['action'] and 'removeBinding=0' in fm['FA-171']['rule'] and 'removeBinding 0保留、1解除' in fm['FA-171']['rule'] and 'removeBinding' in (ROOT/'references/alicti/API-304.txt').read_text())
check('现行退出规则不提供解绑选择',not any(token in seat_logout+logout_rules for token in ['removeBinding显式0/1','removeBinding=0或1','可明确选1解绑','选择removeBinding=0保留或1解绑']))
task_setting_ids={f'FA-{n}' for n in range(200,213)}
check('本轮任务设置映射取自现有任务接口且证据层级明确',task_setting_ids<=fieldids and all({'API-311','DOC-338'}<=set(fm[ident]['sourceIds']) and '截图仅证入口' in fm[ident]['evidence'] for ident in task_setting_ids))
check('任务创建、重呼与详情共用新增字段',all(task_setting_ids<=set(current[ident]['fieldIds']) for ident in ['FS-08','FS-09','FS-10']))
check('预测参数与截图示例值不混作官方默认',all(token in json.dumps(current['FS-08'],ensure_ascii=False) for token in ['quotiety默认1','maxWaitTime默认40秒','截图中的quotiety=3.00','自动外呼沿用自己的必选语音流程']))
check('任务高级设置附表完整且原组保持',{'C-77','C-78','C-79','C-80','C-81'}<=ruleids and all(token in json.dumps(current['FS-10'],ensure_ascii=False) for token in ['未配置项显示未记录','task/update','task/get']))
task_edit=json.dumps(current['FS-10'],ensure_ascii=False)
check('D073原任务编辑边界完整',decisions['D-073']['sourceRef']=='SRC-103' and {'API-404','DOC-334'}<=set(decisions['D-073']['sourceIds']) and {'FA-213','C-82','C-83'}<=(fieldids|ruleids) and all(token in task_edit for token in ['原supplier taskId','未结束','只提交实际改动字段','task/get','planSnapshot','taskSettingHistory','自动外呼IVR']))
check('编辑更新当前快照且不改已发生通话',all(token in fm['FA-213']['action'] for token in ['当前原型任务配置','省略字段','失败','保留原配置','planSnapshot','taskSettingHistory','客户记录']) and all(token in json.dumps(current['FS-14'],ensure_ascii=False) for token in ['关联任务设置默认折叠且只读','无新增或管理操作']))
cf17=next(x for x in pending['items'] if x['id']=='CF-17')
check('D075自动任务通用字段与快照贯通',decisions['D-075']['sourceRef']=='SRC-105' and {'API-311','API-404','DOC-334','DOC-338'}<=set(decisions['D-075']['sourceIds']) and {'FA-199','FA-200','FA-201','FA-213','FA-216','C-84'}<=(fieldids|ruleids) and all(token in task_edit for token in ['D-075','名称、描述和供应商业务标签','差量','未记录','CF-17']))
check('缺失等待时间不借新建默认补历史',all(token in fm['FA-199']['action'] for token in ['customerTimeout','显示未记录','默认30秒']) and '冻结' in fm['FA-216']['rule'])
check('自动任务IVR章节冲突保持待确认',cf17['status']=='open' and cf17['decisionId']=='D-075' and {'API-404','API-311'}<=set(cf17['sourceIds']) and all(token in cf17['handling'] for token in ['仅type=1生效','只读','不宣称已支持或不支持']))
check('用户界面截图来源独立于官方快照',all((ROOT/'references/user-task-settings'/name).is_file() for name in ['01-basic-task.png','02-seat-customer.png','03-advanced.png','README.md']) and '不是操作指令' in (ROOT/'references/user-task-settings/README.md').read_text())
check('三个新增模块编号路由和源文件完整',all(current[key].get('runtimeRoutes')==[route] for key,route in [('FS-22','extension-management'),('FS-23','time-condition-management')]) and current['FS-24'].get('runtimeRoutes')==['business-categories'])
check('新增十二映射均归当前章节',all(f'FA-{n:03}' in fieldids for n in range(184,196)) and set(current['FS-22']['fieldIds'])>={'FA-184','FA-185','FA-186','FA-187','FA-188'} and set(current['FS-23']['fieldIds'])>={'FA-189','FA-190','FA-191'} and set(current['FS-24']['fieldIds'])>={'FA-192','FA-193','FA-194','FA-195'})
check('业务字典与自定义值不冒充供应商字段',all(fm[f'FA-{n}']['status']=='平台字段' and fm[f'FA-{n}']['sourceIds']==[] for n in range(192,196)))
check('软电话三种枚举分开且受控选择',all(t in json.dumps(current['FS-22'],ensure_ascii=False) for t in ['type=2','bindType=3','bindTelType=4','3–11','不能手填','密码不出现在']))
check('删除采用String批量方案而非改写Int原文',all(t in fm['FA-188']['rule']+fm['FA-188']['action'] for t in ['batchDelete','String','Int','list/get']))
check('时间维护不展示使用位置且内部保留引用保护',all(t in json.dumps(current['FS-23'],ensure_ascii=False) for t in ['不显示使用位置','被引用不可删','分号','逗号','不自建']))
check('业务草稿与必填最终保存分开',all(t in json.dumps(current['FS-24'],ensure_ascii=False) for t in ['required默认false','草稿可以不完整','正式保存','数字0','不做旧数据兼容']))
business_spec=json.dumps(current['FS-24'],ensure_ascii=False)
check('D074与D077保留历史阶段决定',all(decisions[k]['sourceRef']==src and decisions[k]['sourceIds']==[] and k in facts['supersededDecisionIds'] for k,src in [('D-074','SRC-104'),('D-077','SRC-107')]) and all('当前采用提示' in (ROOT/'docs/decisions.md').read_text().split('## '+k)[1].split('## ')[0] for k in ('D-074','D-077')))
check('D085分类直接关联字段库',decisions['D-085']['sourceRef']=='SRC-113' and decisions['D-085']['sourceIds']==[] and {'FA-214','FA-215'}<=set(current['FS-24']['fieldIds']) and all(t in business_spec for t in ['客户管理→业务分类','fieldId','fields数组','数组位置决定顺序','线索分类须包含六项预置','required默认false','不再创建、选择或启停业务模板']) and 'K-44' in ruleids and 'category.fields[].fieldId' in fm['FA-214']['field'])
check('字段选项业务编码是选填本地映射',all(t in json.dumps(fm['FA-215'],ensure_ascii=False) for t in ['field.businessKey','field.options[].businessKey','均选填','保留前导零','不是数据库或表单的内部主键','不加入AliCti请求']) and all(fm[t]['status']=='平台字段' and fm[t]['sourceIds']==[] for t in ('FA-214','FA-215')))
check('详情当前配置和线索稳定统计边界',all(t in json.dumps(fm['FA-195'],ensure_ascii=False) for t in ['仍可解析','旧值可能无法显示原标签','六项稳定字段']) and all(t in business_spec for t in ['稳定内部ID','线索报表','不做旧数据兼容']))
check('人工去掉技能外显选择且保存自动置闲',all(t in json.dumps(current['FS-11'],ensure_ascii=False) for t in ['不显示技能或外显选择','自动置闲','unpause','未知先核对','不展示拒接']))
check('本期规则无旧六项全可空和保存后pause',not any(t in active_spec+active_rules for t in ['六项业务字段均为平台选填','六项业务信息可独立留空','completeWrapup固定调用pauseType','保存成功后保持暂停接听','启动与继续不增加本地跨任务坐席互斥']))
check('任务不完整草稿可退出而创建仍校验',all(t in json.dumps(current['FS-08'],ensure_ascii=False) for t in ['未完成草稿','下一步及确认创建','严格检查']))
check('同组同席运行互斥和管理员接分配均说明',all(t in json.dumps(current['FS-21'],ensure_ascii=False) for t in ['最多一个运行中预测任务','未知结果保留占用']) and '管理员或运营' in json.dumps(current['FS-07'],ensure_ascii=False))
check('新增决定来自产品要求而未虚构供应商答复',all(x['sourceType']=='user_product_requirement_and_implementation_review' for x in facts['decisions'] if x['id'] in {'D-055','D-056','D-057','D-058','D-059'}) and facts['dailyAlignment']['historyMigration'] is False)

# Current follow-up and simplification decisions must agree across authored
# facts, rendered documents and machine-readable confirmations. Historical
# supplier replies and the September 20 review remain intact above.
decisions={row['id']:row for row in facts['decisions']}
same_task=facts['sameTaskFollowupReview'];manual_priority=facts['manualTimePriorityReview']
clarifications=load('docs/supplier-clarifications.json')
check('本版日期版本和附表版本明确',VERSION=='2026-09-24-business-category-fields-1' and facts['date']=='2026-09-24' and rules['version']=='1.54')
check('D060至D062历史产品决定及来源完整',all(decisions[d]['sourceRef']==source and decisions[d]['sourceType']=='user_product_requirement_and_implementation_review' and decisions[d]['version']==PREVIOUS_VERSION for d,source in [('D-060','SRC-090'),('D-061','SRC-091'),('D-062','SRC-092')]))
check('同任务再次联系审查保留原任务身份',same_task['version']==PREVIOUS_VERSION and same_task['decisionId']=='D-060' and same_task['sourceRef']=='SRC-090' and same_task['taskIdRetained'] is True and same_task['newTaskCreated'] is False)
check('再次联系仅追加新批次且显式不排重不自动启动',same_task['providerImport']=={'endpoint':'/interface/v10/task/importTaskTel','taskId':'original_provider_task_id','isRepeat':0,'importTelAutoStart':0,'scope':'new_followup_batch_only'})
check('新建预测暂停而自动外呼完成的缺省分开',same_task['newTaskAutoComplete']=={'predictive':0,'ivr':1} and all(token in json.dumps(fm['FA-047'],ensure_ascii=False) for token in ['autoComplete=1','0','预测','自动外呼','已结束任务不重新开启']))
check('D060采用既有接口且不冒充生产验证',same_task['officialSnapshotUpdated'] is False and same_task['productionVerificationClaimed'] is False and (ROOT/same_task['verificationEvidence']).is_file())
check('原再次联系未决主题保留，本版另增CF15至CF17',set(same_task['remainingConfirmationIds'])=={row['id'] for row in pending['items'] if row['id'] not in ('CF-15','CF-16','CF-17','CF-18')} and len(pending['items'])==9 and len(pending['preparations'])==3)
check('再次联系映射显式保留任务与导入边界',all(token in json.dumps(fm['FA-145'],ensure_ascii=False) for token in ['原taskId','新增','批次','importTaskTel','isRepeat=0','importTelAutoStart=0','不进入创建向导']) and 'API-312' in fm['FA-145']['sourceIds'])
check('来源与重复安排按任务隔离且拒绝联系仍保留',all(token in json.dumps(fm['FA-144'],ensure_ascii=False)+json.dumps(fm['FA-146'],ensure_ascii=False) for token in ['同一原预外呼任务','其他任务','客户拒绝联系','已结束任务不重开','重复提交']))
check('原历史和汇总不覆盖且保存失败可恢复',all(token in json.dumps(fm['FA-145'],ensure_ascii=False)+json.dumps(fm['FA-146'],ensure_ascii=False) for token in ['completed/connected','历史不变','仍暂停','恢复记录','不覆盖更新后的终止状态']))
check('当前说明附表已移除再次联系新建任务旧规则',not any(token in active_spec+active_rules for token in ['再次联系新建任务','客户已接通且结束后可建立新预外呼任务','新安排创建新的预外呼任务','再次预外呼从来源选择进入同一任务创建向导']))
old_repeat=next(row for row in pending['scopeDecisions'] if row['id']=='D-032')
check('D032保留历史并明确由D060取代','D-032' in facts['supersededDecisionIds'] and old_repeat['status']=='superseded' and old_repeat['followedBy']=='D-060' and '本条新任务方案仅作历史记录' in (ROOT/'docs/decisions.md').read_text())
check('时间优先级审查采用手工与企业唯一',manual_priority['version']==PREVIOUS_VERSION and manual_priority['decisionId']=='D-061' and manual_priority['sourceRef']=='SRC-091' and manual_priority['manualPriority'] is True and manual_priority['automaticAllocation'] is False and manual_priority['uniquenessScope']=='enterpriseId' and manual_priority['productionVerificationClaimed'] is False and (ROOT/manual_priority['verificationEvidence']).is_file())
check('时间优先级映射保留必填正整数和新增空值',all(token in json.dumps(fm['FA-189'],ensure_ascii=False) for token in ['priority必填','手动输入','正整数','不自动分配','同enterpriseId','新增优先级为空','编辑带入当前值','保留原值']))
check('本版review完整同步到澄清索引',all(clarifications[key]==facts[key] for key in ['sameTaskFollowupReview','manualTimePriorityReview','deliveryMaintenance','dailyAlignment']))
check('9月20日每日对齐保持历史身份',facts['dailyAlignment']['version']=='2026-09-20-daily-alignment-1' and facts['dailyAlignment']['decisionIds']==['D-055','D-056','D-057','D-058','D-059'])
increment=facts['consolidatedIncrementReview']
check('D085当前增量不冒充供应商新接口',increment['version']==VERSION and increment['decisionIds']==['D-085'] and increment['officialSourceAdded'] is False and increment['newOfficialSourceIds']==[] and increment['developmentPackageUpdated'] is False and increment['developmentPackageVersion'] is None and increment['productionVerificationClaimed'] is False)
check('重复下载包和发行包清单不被生成器恢复',not (ROOT/'downloads/alicti-development-kit.zip').exists() and not (ROOT/'prototype-release.json').exists() and changes['currentRelease']['developmentPackageRemoved'] is True and changes['currentRelease']['distribution']=='prototype_and_documents')
# This revision documents the already-reviewed UI changes; it must not inherit
# a previous run's supplier-integration or GitLab-publication claims.
ui_review=facts['uiFieldAlignmentReview']
check('D063至D066产品决定与SRC093至096逐项对应',all(decisions[d]['sourceRef']==source and decisions[d]['sourceType']=='user_product_requirement_and_implementation_review' and decisions[d]['version']==UI_VERSION for d,source in [('D-063','SRC-093'),('D-064','SRC-094'),('D-065','SRC-095'),('D-066','SRC-096')]))
check('本轮界面字段审查进入当前事实与澄清索引',ui_review['version']==UI_VERSION and ui_review==clarifications['uiFieldAlignmentReview'])
check('本轮四项产品调整范围与决定目录一致',ui_review['decisionIds']==['D-063','D-064','D-065','D-066'] and ui_review['sourceRefs']==['SRC-093','SRC-094','SRC-095','SRC-096'] and ui_review['sourceType']=='user_product_requirement_and_implementation_review')
check('客户档案移除批次管理入口和固定意向列但保留动态详情',all(ui_review['directory'][key] is True for key in ['batchActionsRemoved','fixedLeadIntentionColumnRemoved','dynamicDetailsPreserved']) and ui_review['directory']['unknownResultLabel']=='结果未知' and ui_review['directory']['addsSupplierStatus'] is False)
check('任务列表去配置与后续重呼列但真实配置保留',ui_review['taskList']=={'executionConfigColumn':False,'nextRetryColumn':False,'actualRetrySettingsPreserved':True})
check('任务设置使用保存值与明确空值而不回填共享模板',all(ui_review['taskSettings'][key] is True for key in ['matchesCreateSummary','savedTaskValuesOnly','explicitEmptyPreserved','copyRequiresMissingStrategySelection']) and ui_review['taskSettings']['sharedTemplateFallback'] is False and ui_review['taskSettings']['groups']==['任务与客户','接听团队配置 / 任务与语音流程','时间与重呼'])
check('话单按四类来源保持结果与任务身份边界',set(ui_review['callDetail']['sourceIds'])=={'API-317','API-318','API-319','API-362'} and set(ui_review['callDetail']['strictTaskIdentity'])=={'enterpriseId','tenantId','callType','taskId','providerTaskId'} and ui_review['callDetail']['missingFactFallback'] is False and ui_review['callDetail']['localDemoWithoutProviderSource']=='display_from_explicit_local_source' and all(ui_review['callDetail'][key] is True for key in ['actualZeroSecondsPreserved','taskSettingsReadOnlyCollapsed','inventedIvrEvidenceRemoved']))
check('D063至D066历史审查边界保留，本轮另增CF15至CF17',ui_review['officialSnapshotUpdated'] is False and ui_review['productionVerificationClaimed'] is False and set(ui_review['remainingConfirmationIds'])=={row['id'] for row in pending['items'] if row['id'] not in ('CF-15','CF-16','CF-17','CF-18')} and ui_review['preparationCount']==len(pending['preparations'])==3)
check('任务和话单既有专项证据保留原日期及边界',all((ROOT/path).is_file() and load(path)['date']=='2026-09-21' and any('未全量回归' in line or '没有全量回归' in line for line in load(path)['limits']) for path in ui_review['verificationEvidence']))

check('本轮说明没有擅自声明发布或生产验收',changes['currentRelease']['publicationStatus']=='tracked_by_gitlab_branch' and changes['currentRelease']['publicationEvidence'] is None and changes['currentRelease']['productionAcceptance']=='planned')
current_release=changes['currentRelease']
check('本版验证脚本与历史证据区分',current_release['verificationEvidence'] is None and current_release['historicalSeatLoginRegression']=='qa/seat-login-regression-20260923.json' and current_release['verificationScripts']==['documentation/verify_documentation.py'])
check('四类话单采用既有独立官方来源',{'API-317','API-318','API-319','API-362'}<=set(current['FS-14']['sourceIds']))
section_text=lambda ident:json.dumps(current[ident],ensure_ascii=False)
rule_text=lambda ident:json.dumps(next(row for row in rules['rules'] if row['id']==ident),ensure_ascii=False)
check('当前附表编号完整且旧系统计费规则已移除',len(ruleids)==453 and 'F-22' not in ruleids and {'B-71','B-72','C-68','C-77','C-81','C-84','C-85','C-86','G-64','G-65','G-66','K-44'}<=ruleids)
check('档案说明与附表均取消批次管理并保留独立入口','删除查看批次及操作列' in section_text('FS-07') and all(token in rule_text('K-05') for token in ['不提供查看批次','独立导入与分配菜单保留']))
check('档案动态字段和未知结果文案不改变底层业务状态',all(token in section_text('FS-07') for token in ['不再固定展示线索/意向列','按业务分类直接关联的当前字段和业务单据','不新增CallState状态','不改底层原记录']) and '不新增供应商状态或号码编码' in rule_text('B-09') and '详情按当前分类展示' in rule_text('K-16'))
check('列表后续重呼占位移除而不取消重呼配置',all(token in section_text('FS-10') for token in ['不再用hasNextAttempt/hasNext','均不能证明下一次已安排','真实重呼配置与任务控制继续保留']) and all(token in rule_text('C-68')+rule_text('K-10') for token in ['移除执行配置名/V1与后续重呼列','不修改真实重呼设置','不由轮次']))
check('详情与创建共用摘要且从本任务值恢复',all(token in section_text('FS-10') for token in ['三组与顺序','不从共享模板或当前技能成员重算','planSnapshot','taskSettingHistory']) and all(token in rule_text('C-38')+rule_text('C-61') for token in ['任务与客户','时间与重呼','首次启动形成当前planSnapshot','taskSettingHistory']))
check('旧任务只读缺失与复制创建必填保持区别','只读旧任务缺失显示未记录' in section_text('FS-09') and all(token in rule_text('C-60') for token in ['复制创建必须补选','不因显示补全改写旧任务']))
check('人工预测客户坐席时间方向及自动时长分开',all(token in section_text('FS-14') for token in ['人工 upTime=坐席、bridgeTime=客户；预测相反','upTime 为客户接听','customerBridgeDuration','totalDuration','answerTime系统应答','firstQueueDuration']))
check('缺结束时长不借旧值且真实零保留',all(token in section_text('FS-14') for token in ['已有接口来源对象但raw缺失/不可用','不借旧endedAt/released或durationSeconds补接口事实','没有接口来源对象的纯本地演示记录','真实0秒保留','旧agentAnswerResult不覆盖接口接听事实']) and all(token in rule_text('B-25')+rule_text('B-64') for token in ['真实0保留','不以旧durationSeconds','不借旧released或endedAt','接口来源对象','raw缺失','没有接口来源对象']))
check('实际坐席队列语音只采用话单事实',all(token in rule_text('B-71') for token in ['firstCallCno/firstCallCname','firstCallQno/firstCallQname','ivrName/ivrId','不从当前技能','不展示虚构节点/版本']) and '不按流转序号配对' in section_text('FS-14'))
check('关联任务严格核对而不改绑且摘要只读折叠',all(token in section_text('FS-14') for token in ['enterpriseId、tenantId、callType','已有本地taskId时只能关联该任务','唯一匹配','冲突不改绑','默认折叠且只读']) and all(token in rule_text('B-72') for token in ['冲突不改绑','无新增/管理入口']))
check('四类查询同月拆窗且不冒充全量统计',all(token in section_text('FS-14') for token in ['cdrAutoTask[]','共用CloudCallRecords.display及AliCtiReportFacts','跨月拆窗','offset+limit≤100000']) and all(token in rule_text('L-09') for token in ['四类请求','未实现滚动全量']))



check('D067和D068历史来源与原版本保留',all(decisions[key]['sourceRef']==ref and decisions[key]['sourceType']=='user_product_confirmation' and decisions[key]['version']=='2026-09-22-single-tenant-1' for key,ref in [('D-067','SRC-097'),('D-068','SRC-098')]))
check('单业务租户事实同步到澄清索引',facts['singleTenantReview']==clarifications['singleTenantReview'])
check('账号0或1业务租户与超级租户例外明确',all(word in json.dumps(fm['FA-155'],ensure_ascii=False) for word in ['0或1','内置超级租户','唯一']))
check('号码自动归属且保留号码状态用途校验',all(word in json.dumps(fm['FA-148'],ensure_ascii=False) for word in ['默认归属','无有效业务租户','不再提供号码租户分配','外显资格']))
check('当前统计范围与未来跨账号线索键分开',all(word in json.dumps(fm['FA-129'],ensure_ascii=False) for word in ['当前','唯一业务租户','brandId','完整','不新增跨账号汇总','未授权']))
check('现行功能与字段不含旧多业务租户及手动号码分配',not any(word in active_spec for word in ['同enterpriseId可有多个总部/门店租户','同一供应商账号可以服务多个租户','导入后点击“设置使用租户”','初始不授予租户权限']))
cf10=next(item for item in pending['items'] if item['id']=='CF-10')
check('CF10仅保留匹配与执行证据，撤下共享号码跨租户提问',cf10['decisionId']=='D-068' and '共享号码的来电' not in cf10['question'] and all(word in cf10['question'] for word in ['条件','未命中','实际命中']))

# D-069 contract coverage uses immutable sources and explicit execution boundaries.
nav_review=facts['callerNavigationReview'];nav_cf=next(row for row in pending['items'] if row['id']=='CF-15')
check('D069历史来源与原版事实保留',decisions['D-069']['version']=='2026-09-22-caller-navigation-1' and decisions['D-069']['sourceRef']=='SRC-099' and nav_review==clarifications['callerNavigationReview'] and nav_review['officialSnapshotUpdated'] is False and nav_review['productionVerificationClaimed'] is False)
check('导航四项映射及两类任务章节完整',all(f'FA-{i}' in fieldids for i in range(196,200)) and all({f'FA-{i}' for i in range(196,200)}<=set(current[k]['fieldIds']) for k in ['FS-08','FS-09','FS-10']))
check('D078任务级外显与逐客clid分开',fm['FA-196']['status']=='已修正' and all(token in fm['FA-196']['rule']+fm['FA-196']['action'] for token in ['API-311','API-404','任务级指定号码','taskTelList[].clid','不从任务或批次']))
check('默认导航单值配置与任务自动带入',all(token in fm['FA-197']['rule'] for token in ['enterpriseId','固定默认','线下提供','自建系统','自动使用']) and all(token in guide for token in ['每个enterpriseId统一使用一个默认外显导航','任务创建时自动带入']))
check('账号导航不再多选且旧任务快照保留',all(token in section_text('FS-01') for token in ['不设置多导航目录','任务自动带入','已建任务保留原快照']) and all(token in section_text('FS-10') for token in ['复制','原taskId','话单实际外显号码']))
pool_sources={
    'list': '获取号码池列表接口.html',
    'create': '新增号码池接口.html',
    'delete': '删除号码池接口.html',
    'update': '更新号码池接口.html',
}
check('D081号码池四接口与租户任务契约完整',
      decisions['D-081']['sourceRef']=='SRC-109' and decisions['D-081']['version']=='2026-09-23-tenant-number-pool-1' and
      len(decisions['D-081']['officialUrls'])==4 and
      all(any(url.endswith(name) for url in decisions['D-081']['officialUrls'])
          for name in pool_sources.values()) and
      all((ROOT/'references/alicti'/('hybrid-group-'+action+'.md')).is_file()
          for action in pool_sources) and
      all(token in fm['FA-198']['rule']+fm['FA-198']['action'] for token in
          ['hybridGroup/list','租户管理员','当前enterpriseId','手动选填整数','越小越优先','不传groupId']) and
      all(token in section_text('FS-06') for token in
          ['hybridGroup/list','create','delete','update','静态原型']) and
      all(token in rule_text('C-74') for token in ['hybridGroup/list','本租户','clidPoolList']) and
      nav_review['poolEntityAdded'] is False and nav_review['navigationListClid'] is False)
check('D082班长监控离线只读与在线队列管理分层',
      decisions['D-082']['sourceRef']=='SRC-110' and decisions['D-082']['version']=='2026-09-23-supervisor-monitor-access-1' and
      decisions['D-082']['sourceType']=='user_product_requirement_and_existing_interface_review' and
      all(token in section_text('FS-12') for token in ['监控概览','坐席事件日志','未关联坐席','未上线','agentStatus/get','queueStatus','本人已上线']) and
      all(token in rule_text('G-12') for token in ['未关联坐席','未上线','agentStatus/get','队列实时状态','关联有效班长坐席','本人上线']) and
      all(token in fm['FA-177']['action'] for token in ['未关联本人坐席','未上线','agentStatus/get','queueStatus','关联有效班长坐席','本人已上线']) and
      all(token in guide for token in ['D-082','未关联本人坐席','二级页签事件日志','关联有效班长坐席']))
check('D083默认导航与预测座席阈值证据分层',
      decisions['D-083']['sourceRef']=='SRC-111' and decisions['D-083']['version']=='2026-09-23-task-seat-threshold-default-navigation-1' and
      decisions['D-083']['sourceType']=='user_relayed_supplier_feedback_and_product_scope' and
      facts['defaultNavigationAndSeatThresholdReview']==clarifications['defaultNavigationAndSeatThresholdReview'] and
      all(token in fm['FA-217']['rule'] for token in ['默认10','1–10','自动暂停','autoStart=1','用户转述']) and
      all(token in fm['FA-217']['action'] for token in ['自动外呼不显示','CF-18','API文档没有明示自动恢复']) and
      all(token in rule_text('C-86') for token in ['手工暂停','号码停用','已结束','待CF-18联调']))
check('D084事件预览与全部历史的接口边界',
      decisions['D-084']['sourceRef']=='SRC-112' and decisions['D-084']['version']=='2026-09-23-supervisor-event-history-1' and
      all(token in section_text('FS-12') for token in ['最近5条','查看全部事件','分页','API-316','API-315','agentStatus/get','平台接收/观察时间','当前浏览器','跨设备不会汇总']) and
      all(token in fm['FA-218']['rule']+fm['FA-218']['action'] for token in ['/user/agent','type=9','当前','不是历史查询','前态','说明','持久化','当前浏览器','跨设备不汇总']) and
      all(token in rule_text('G-64')+rule_text('G-65')+rule_text('G-66') for token in ['最新5条','分页','时间','来源','后端','租户','当前浏览器']) and
      all(token in change_log_markdown for token in ['## D-084','全部事件','API-316','API-315','DOC-344','当前浏览器','跨设备不会汇总']))
check('旧任务默认导航变更保护与演示边界',
      all(token in fm['FA-197']['action'] for token in ['旧任务','task/update','task/get','原taskId','编辑期间','拒绝过期提交']) and
      all(token in rule_text('C-73') for token in ['启动/继续','task/update','task/get','同一taskId','过期提交']) and
      all(token in section_text('FS-08') for token in ['演示座席人数变化','reconcileAvailability','不读取实时人数','不代表已向AliCti执行任务操作']) and
      all(token in guide for token in ['任务中心运行概览','演示座席人数变化','task/update','task/get','不读取实时座席人数']) and
      facts['defaultNavigationAndSeatThresholdReview']['availabilityDemo']['submitsSupplierTaskOperation'] is False)
cf18=next(row for row in pending['items'] if row['id']=='CF-18')
check('自动恢复仅限定时开始且原因明确',
      cf18['decisionId']=='D-083' and cf18['status']=='open' and
      all(token in cf18['handling'] for token in ['autoStart=1','座席不足','用户转述','未明示自动恢复','自动外呼不显示']) and
      all(token in section_text('FS-08') for token in ['minAvailableAgentCount','autoStart=1','手工暂停','号码停用','自动外呼不显示']))
check('CF15收敛为固定默认标识和选号联调',
      nav_cf.get('poolDirectoryResolvedBy')=='D-081' and nav_cf['decisionId']=='D-083' and
      all(token in nav_cf['question'] for token in ['默认外显导航标识','空池','同优先级','clidGroup','运行任务']) and
      all(token in nav_cf['handling'] for token in ['D-083','单值管理','API-311/API-404','待真实联调']))
check('D069/D070多导航历史来源保留但当前规则已取代',
      decisions['D-070']['version']=='2026-09-22-caller-navigation-2' and
      decisions['D-070']['sourceRef']=='SRC-100' and
      facts['multiCallerNavigationReview']==clarifications['multiCallerNavigationReview'] and
      all(token not in section_text('FS-01') for token in ['callerNavigations:[{name,customerClidsGroup}]','超管可增改移除多个名称与标识']) and
      'D-083' in rule_text('C-73'))
check('名单字段仍与任务导航分开',
      '名单clidGroup与任务customerClidsGroup不同' in fm['FA-054']['action'] and
      '不用前者覆盖后者' in fm['FA-054']['action'] and
      '不能由任务设置或批次自动' in fm['FA-054']['action'])
check('导航附表可追溯且不承诺真实选号',
      {'C-72','C-73','C-74','C-75','C-76','C-86'}<=ruleids and
      all(token in rule_text('C-76') for token in ['不能保证','不伪造供应商选号']))

# D-071 is historical for the old login path; D-072 retains online switching
# while replacing ordinary login with one panel and one explicit submission.
mode_review=facts['workingModeReview'];login_review=facts['seatLoginReview'];mode_cf=next(row for row in pending['items'] if row['id']=='CF-16')
check('D071工作模式历史决定与来源保留',decisions['D-071']['version']=='2026-09-22-working-mode-1' and decisions['D-071']['sourceRef']=='SRC-101' and decisions['D-071']['sourceType']=='user_product_requirement_and_implementation_review' and mode_review==clarifications['workingModeReview'] and mode_review['officialSnapshotUpdated'] is False and mode_review['productionVerificationClaimed'] is False)
check('D072坐席登录决定与来源清楚',decisions['D-072']['version']=='2026-09-23-seat-login-1' and decisions['D-072']['sourceRef']=='SRC-102' and decisions['D-072']['sourceType']=='user_product_requirement' and login_review==clarifications['seatLoginReview'] and login_review['officialSnapshotUpdated'] is False and login_review['productionVerificationClaimed'] is False)
check('普通登录单面板当次显式选择',login_review['modeValues']==['0','4','5'] and login_review['singleStepLoginPanel'] is True and login_review['ordinaryLoginModeInitiallyUnselected'] is True and login_review['ordinaryLoginStatusDefault']==1 and login_review['ordinaryLoginBusyReasonOptional'] is True and login_review['separateSaveRequired'] is False and login_review['ordinaryLoginUsesOldPreferenceToPreselect'] is False and all(token in section_text('FS-12') for token in ['点击“坐席登录”直接打开登录面板','工作模式初始为“请选择”','登录状态默认置闲','点击“登录”直接提交','不先保存设置']))
check('取消失败及断线重登边界明确',login_review['cancelSendsLogin'] is False and login_review['failureRetainsDraft'] is True and login_review['reloginRetainsSessionModeAndPause'] is True and all(token in section_text('FS-12') for token in ['取消不发请求','失败保留本次输入','断线重登保留当前会话模式与暂停状态','置忙登录后预览外呼入口禁用']))
check('工具条直接切换与守卫边界明确',mode_review['toolbarSwitchImmediate'] is True and mode_review['toolbarSelectOutsideMoreMenu'] is True and mode_review['busySwitchAllowed'] is True and mode_review['blockedPhases']==['通话','振铃','话后整理','未知结果'] and all(token in section_text('FS-12') for token in ['不收入更多菜单','置忙可切换','拒绝并保留原模式']))
check('模式互斥与呼入本地假设登记',mode_review['mode4RejectsPredictive'] is True and mode_review['mode5DisablesPreview'] is True and mode_review['inboundUnrestrictedIsLocalAssumption'] is True and mode_review['changeBindTelStillRejected'] is True and all(token in section_text('FS-12') for token in ['模式4不再接受预测外呼分配','模式5禁用预览外呼入口','本地假设，见CF-16']))
check('工作模式映射更新为直接登录与在线切换',fm['FA-176']['status']=='已对齐' and all(token in fm['FA-176']['action'] for token in ['Agent.login','changeWorkingMode','置忙可切换','拒绝','CF-16']) and all(token in fm['FA-170']['action'] for token in ['点击坐席登录直接打开登录面板','不先保存设置','失败保留本次输入']) and all('D-072' in fm[id]['evidence'] for id in ['FA-170','FA-176']))
check('工作模式附表改写且不冒充答复',all(token in rule_text('G-48') for token in ['D-071','D-072','changeWorkingMode','CF-16','无保存设置前置步骤']) and all(token in rule_text('G-44') for token in ['工作模式0/4/5','D-072','点击登录直接提交Agent.login','置忙登录后须先置闲']))
toolbar_map=(ROOT/'docs/seat-toolbar-interface-map.md').read_text()
check('当前上线规则与CF11处理采用单面板',all(token in rule_text('G-07') for token in ['点击坐席登录直接打开登录面板','无先保存设置','失败保留本次输入','changeWorkingMode','D-072']) and all(token in cf11['handling'] for token in ['D-072 / SRC-102','点击坐席登录直接打开登录面板','changeWorkingMode','不改写D-052供应商答复']) and cf11.get('currentHandlingDecisionId')=='D-072')
check('工具条映射说明当次选择与在线切换',all(token in toolbar_map for token in ['模式初始未选','点击“登录”直接提交','无先保存设置步骤','CTILink.Agent.changeWorkingMode','单个String workingMode=0/4/5','话后整理及未知结果期间拒绝','CF-16']) and 'bindType=3、workingMode=0' not in toolbar_map)
check('切换在途进入来电或整理时转待核对而非断言原模式不变',all(token in text for text in [rule_text('G-07'),cf11['handling'],toolbar_map] for token in ['成功回执到达前进入来电或话后整理','不直接应用该成功回执','刷新确认实际工作模式','不能绝对声称原模式未变']))
check('CF16待确认边界独立且未冒充答复',mode_cf['status']=='open' and mode_cf['decisionId']=='D-071' and mode_cf['sourceRef']=='SRC-101' and all(token in mode_cf['question'] for token in ['呼入分配','逗号多值','置忙']) and all(token in mode_cf['handling'] for token in ['本地假设','不表示']))
check('模式切换证据与专项脚本可追溯',mode_review['verificationEvidence']=='qa/working-mode-verification-20260922.json' and (ROOT/'qa/verify-working-mode.cjs').is_file() and mode_review['remainingConfirmationId']=='CF-16')

check('官方来源编号完整唯一且无伪造的项目端点',len({s['id'] for s in fields['sources']})==101 and not {'API-324','API-325','API-326'} & {s['id'] for s in fields['sources']})
for source in fields['sources']:
    path=ROOT/'references/alicti'/source['id']
    origin=urlsplit(source['url'])
    capture_time_known=bool(source.get('retrievedAt'))
    capture_time_explicitly_unknown=source.get('originalCaptureTime')=='not_recorded' and bool(source.get('reviewedAt'))
    check(source['id']+'原文和表格保留来源身份',origin.scheme=='https' and origin.netloc=='wiki.alicti.cn' and source['status']==200 and (capture_time_known or capture_time_explicitly_unknown) and path.with_suffix('.txt').is_file() and bool(path.with_suffix('.txt').read_text().strip()) and path.with_suffix('.json').is_file() and isinstance(json.loads(path.with_suffix('.json').read_text()),list))
    basis=source.get('hashBasis','original_html')
    check(source['id']+'哈希依据明确',basis in {'original_html','extracted_text_snapshot','preserved_tool_capture_bytes'})
    canonical=path.with_suffix('.html' if basis=='original_html' else '.txt')
    check(source['id']+'官方快照内容哈希不变',canonical.is_file() and hashlib.sha256(canonical.read_bytes()).hexdigest()==source['sha256'])
    if source.get('htmlSha256'):
        html=path.with_suffix('.html')
        check(source['id']+'HTML与文本哈希分开核验',html.is_file() and hashlib.sha256(html.read_bytes()).hexdigest()==source['htmlSha256'])
    if source['id'] in {f'API-{n}' for n in range(396,404)}:
        check(source['id']+'资源接口保留采集证据',path.with_suffix('.html').is_file() and bool(source.get('originalEvidence')) and source.get('snapshotCapture')=='text_tables_and_html')
reviewed_sources={p['url']:p for p in load('documentation/input/daily-resource-official-review.json')['pages']}
for source in (s for s in fields['sources'] if s['id'] in {f'API-{n}' for n in range(396,404)}):
    page=reviewed_sources[source['url']]
    check(source['id']+'资源接口与独立采集元数据一致',hashlib.sha256(page['text'].encode()).hexdigest()==source['sha256'] and hashlib.sha256(page['html'].encode()).hexdigest()==source['htmlSha256'] and page['originalEvidence']==source['originalEvidence'])
update_source=next(s for s in fields['sources'] if s['id']=='API-404')
check('API404更新任务来源与原始证据字节一致',update_source['endpoint']=='/interface/v10/task/update' and all((ROOT/'references/alicti'/('API-404.'+ext)).read_bytes()==(ROOT/'qa/evidence-time-conditions-20260920'/('alicti-time-6.'+ext)).read_bytes() for ext in ['txt','html']) and update_source['reviewDecision']=='D-073')
predictive_flag_catalog=[f for f in fields['catalog'] if f['sourceId']=='API-318' and f['field']=='sipCauseAsyncUpdateFlag']
check('预测异步标识保留官方描述及采用字段映射',len(predictive_flag_catalog)==1 and predictive_flag_catalog[0]['mappingIds']==['FA-071'] and predictive_flag_catalog[0]['type']=='Integer' and predictive_flag_catalog[0]['description']=='呼叫结果异步更新标识')

class Links(HTMLParser):
    def __init__(self):super().__init__();self.links=[];self.ids=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        self.links.extend(a[k] for k in ['href','src'] if k in a)
parsed={};linked=0;problems=[]
def parsed_html(p):
    if p not in parsed:
        h=Links();h.feed(p.read_text());parsed[p]=h
    return parsed[p]
paths=[ROOT/'README.md',ROOT/'documentation/README.md',ROOT/'references/README.md']
for folder in ['docs','flowcharts','related-systems','blueprint']:
    paths.extend(p for p in (ROOT/folder).rglob('*') if p.is_file() and p.suffix in ['.html','.md','.css'] and '__pycache__' not in p.parts)
anchor_pages={'functional-spec.html','interaction.html','development.html','change-log.html','remaining-confirmations.html','release-notes.html','business-process.html','sequence-interaction.html'}
for p in paths:
    if p.suffix=='.html':
        h=parsed_html(p);refs=h.links
        check(str(p.relative_to(ROOT))+'锚点唯一',len(h.ids)==len(set(h.ids)))
    elif p.suffix=='.css':refs=re.findall(r'url\([\"\']?([^\)\"\']+)',p.read_text())
    else:refs=re.findall(r'\[[^\]]+\]\(([^)]+)\)',re.sub(r'```[\s\S]*?```','',p.read_text()))
    for ref in refs:
        u=urlsplit(ref)
        if u.scheme or u.netloc:continue
        target=(p.parent/unquote(u.path)).resolve() if u.path else p.resolve();linked+=1
        if not target.is_relative_to(ROOT):problems.append([str(p.relative_to(ROOT)),ref,'outside'])
        elif not target.exists():problems.append([str(p.relative_to(ROOT)),ref,'missing'])
        elif u.fragment and target.name in anchor_pages:
            if target.name=='release-notes.html':target=target.with_name('change-log.html')
            if unquote(u.fragment) not in parsed_html(target).ids:problems.append([str(p.relative_to(ROOT)),ref,'anchor'])
if problems:print(json.dumps(problems,ensure_ascii=False,indent=2))
check('文档链接与锚点有效',not problems)
check('每条规则均有可点击锚点',ruleids<=set(parsed_html(ROOT/'docs/interaction.html').ids))
diagrams=load('blueprint/current-business-diagrams.json')
check('未改动流程图保留上一版来源标识',diagrams['version'] in {VERSION,UNCHANGED_DIAGRAM_VERSION})
check('D083流程图保留旧任务保护和本地演示边界',
      all(all(token in json.dumps(row,ensure_ascii=False) for token in ['task/update','task/get','同一taskId','编辑期间'])
          for row in diagrams['businessFlows'] if row['id'] in {'SC-014','SC-015','SC-105','SC-215','FLOW-202'}) and
      all(token in json.dumps(diagrams['businessFlows'],ensure_ascii=False) for token in ['演示座席人数变化','不读取实时座席人数或执行真实供应商任务操作']))
for group in ['businessFlows','sequences']:
    for row in (d for d in diagrams[group] if d['id'] in {'SC-014','SC-015','SEQ-014','SEQ-015'}):
        check(row['id']+'同步原任务编辑与回查',{'API-404','DOC-334'}<=set(row.get('sourceIds',[])) and 'FA-213' in row.get('fieldIds',[]) and all(token in json.dumps(row,ensure_ascii=False) for token in ['D-073','原taskId','回查']))
for key,filename in [('businessFlows','business-process.html'),('sequences','sequence-interaction.html')]:
    text=(ROOT/'flowcharts'/filename).read_text()
    for d in diagrams[key]:
        digest=hashlib.sha256(json.dumps(d,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
        article=re.search(r'<article\b[^>]*id="'+d['id']+r'"[^>]*>.*?</article>',text,re.S)
        check(d['id']+'图源哈希与字段规则引用有效',article is not None and digest in article.group() and set(d.get('fieldIds',[]))<=fieldids and set(d.get('ruleIds',[]))<=ruleids)
task_sequences=load('blueprint/current-task-sequences.json')
check('未改动任务时序保留上一版来源标识',task_sequences['version'] in {VERSION,UNCHANGED_DIAGRAM_VERSION})
check('D083任务时序保留旧任务保护和本地演示边界',
      all(all(token in json.dumps(row,ensure_ascii=False) for token in ['task/update','task/get','同一taskId','编辑期间'])
          for row in task_sequences['sequences'] if row['id'] in {'SEQ-014','SEQ-015','SEQ-105'}) and
      '演示座席人数变化' in json.dumps(task_sequences['sequences'],ensure_ascii=False))
for row in (r for r in task_sequences['sequences'] if r['id'] in {'SEQ-014','SEQ-015'}):
    check(row['id']+'任务时序显示update与get闭环',{'API-404','DOC-334'}<={m['api_id'] for m in row['messages'] if m.get('api_id')} and 'D-073' in row['relatedDecisionIds'])
blueprint_text=(ROOT/'related-systems/blueprint-data.js').read_text()
blueprint=json.loads(blueprint_text.split('=',1)[1].strip().removesuffix(';'))
check('未改动系统蓝图保留上一版来源标识及日期',blueprint['deliveryVersion'] in {VERSION,UNCHANGED_DIAGRAM_VERSION} and blueprint['date']==facts['date'])
check('D083系统蓝图说明原任务导航更新与本地演示边界',
      all(token in json.dumps(blueprint['views'],ensure_ascii=False) for token in ['task/update','task/get','同一taskId','本地演示','不读取实时人数']))
for view in blueprint['views']:
    node_ids={node['id'] for node in view['nodes']}
    check(view['id']+'系统蓝图节点唯一且关系端点存在',len(node_ids)==len(view['nodes']) and all(edge['source'] in node_ids and edge['target'] in node_ids for edge in view['edges']))
check('合并版本记录旧Markdown入口一致',(ROOT/'docs/change-log.md').read_bytes()==(ROOT/'docs/release-notes.md').read_bytes())
print(json.dumps({'result':'pass','scope':'business_documentation_reading_guide_and_source_evidence_not_supplier_integration','version':VERSION,'count':len(checks),'linksChecked':linked,'officialSourcesChecked':len(fields['sources']),'checks':checks},ensure_ascii=False,indent=2))
