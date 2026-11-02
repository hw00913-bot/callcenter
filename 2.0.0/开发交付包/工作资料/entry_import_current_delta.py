"""Current Step48–54 product semantics; no runtime/approval or projection writes.

Called last by the existing authoring apply chain. Stable product identities are
retained; replaced configuration fields remain only for explicit historical reads.
"""
import copy,json
VERSION='2.0.0-current-20261102-step54'
AUTH='inputs/development-package-and-gitlab-publish-authorization-20261102.json'
AUTHS=[AUTH,'inputs/scene-driven-import-prototype-authorization-20261101.json','inputs/entry-based-import-authorization-20261101.json','inputs/business-logic-audit-authorization-20261101.json','inputs/unified-task-import-roster-authorization-20261101.json','inputs/ai-call-refusal-entry-authorization-20261101.json','inputs/task-import-feedback-authorization-20261101.json','inputs/http-e2e-acceptance-authorization-20261101.json']
PROOF='memory/http-e2e-acceptance-verification-20261101.json'
ENTRY='当前由入口决定办理模式：准确AI/预外呼任务入口固定TASK/DIRECT，按任务MANUAL/API渠道导入；业务分类入口固定CATEGORY/TEMPLATE，人工或接口进入当前分类模板。没有中央模式选择、分类允许直接跟进开关或AI第三种FLOW来源，TEMPLATE失败不降级。旧无TASK来源的DIRECT及旧已捕获END来源分别只按原历史合同核验，不补新来源。'
AI_SCHEMA='先确定实际呼叫方式、条件首路径和必要AI场景，再生成本次schema：系统业务编码/客户称呼/客户号码必需；TEMPLATE保留本次IMPORT条件分流字段，其余只取该scene/platform实际IMPORT_FIELD引用及CUSTOM_COLUMN专属列，未引用的分类额外必填不阻AI导入。非AI仍按实际分类IMPORT。FOLLOWUP不混入；下载CSV/XLSX、列映射、逐行校验、参数生成与规范值/定义快照使用同一准确schema。场景/字段/资料/目标变化失效旧预检。'
TASK='任务配置保存准确业务分类；AI从准确场景取得分类和供应商映射，PRED从任务配置取得分类。导入自动带入并锁定，不在导入时临时重选或按名称/首项猜。顶部入口只选择目标任务，随即同窗展示相同导入表。缺失、冲突、失效关联到任务/场景配置维护。MANUAL任务仅手工上传/粘贴，AUTO/API仅只读接收字段与要求；本地静态演示不提供真实接口上传或假造API结果。'
SIMPLE='AI/PRED共用轻量导入：文件或粘贴名单→检查及逐行编辑→确认。主区不要求重填场景、分类、批次或优先级；批次默认文件名或任务名+本次窗口时间，选填折叠项可修改，五档默认中。文件读取中禁用旧检查；0有效确认禁用且底部说明/表外行号编码原因可见，编辑后旧结果失效需重检。AI全部行通过才确认；PRED允许当前检查的合法有效子集二次确认。成功行封存不重导，剩余失败草稿可保留/重开/更正后以新请求重检续入，原物理行号与当前编辑行号明确区分，成功后关闭按钮显示关闭。'
SOURCE='统一业务及批次保存entrySource.kind=TASK/CATEGORY、importChannel=MANUAL/API、handlingMode及准确分类/租户；TASK的taskImportSource按schema2保存method/taskId/aiSceneId?/categoryId/tenantId/brandId/batchId/importChannel/dataImportSource及targetFingerprint/parameterMappingFingerprint。每行规范业务值与独立供应商customValues/定义/参数快照同次捕获；不把供应商专属值混record.fields，不持久第二份专业业务行，不按手机号认领旧业务或重复供应商导入。'
REQUEST='未知导入先核对原请求；服务端产出的记录必须按原请求/准确任务/租户/渠道关联，读取故障不解除请求身份，不允许以新请求重试产生重复副作用。基础名称/编码/手机号/优先级按原类型和别名严格校验，旧已捕获请求只读重放不接受客户端伪报。'
PRIVATE='当前/旧/generic供应商专属快照与兼容副本只按可信原始任务/批次租户及品牌投影，所有值和配置指纹均受同一范围约束，不泄露给来源方或另一租户；公共业务资料及原截止历史保持。预外呼新安排/执行同核已配置分类和品牌，统一历史未知不在读取时首次补类或换类。'
QUEUE='当前排队事实仅属于准确当前run/nodeRun/directCycle及有效资源安排；新运行未安排清当前queue别名，显示未记录，不能借旧运行队列时间或业务createdAt抢队。相同当前运行/资源仅重存或调等级保原FIFO，新运行重新分配同资源才产生新queuedAt/queueSequence。未安排待办排序与队列时间展示分开，按当前节点进入/当前周期开始的可信时间，身份未知保持未知。'
EXACT='厚朴场景查询并保存已有准确供应商任务后，只读投影到同一任务目录和导入/执行入口，按tenant/brand/account/taskId/唯一scene稳定关联，不创建供应商任务、不按名称猜；实时读取准确任务状态，未知供应商计数显示待核。已知权威taskStatusCode使用准确可执行枚举，原status=\'unknown\'仅属兼容状态文本，不覆盖权威taskStatusCode明确枚举；权威code为null或未知仍拒绝。'
FP='导入与明确执行使用相同底层配置语义指纹；已知成功准入包装字段和对象键序不构成业务配置变化。旧schema2 TASK/DIRECT仅在完整准确身份及已知wrapper/basis证明等价时只读兼容；未知附加项或真实映射/来源/模板/状态变化继续拒绝，不回写旧快照，TEMPLATE标签依赖保完整指纹。'
HISTORY='原专业名单直接在原列表展示：保姓名、电话、批次、原操作与原统计，新业务按准确recordId只读回链；旧原生行缺业务编码/业务分类/五档执行优先级/导入入口四项时直接留空，不单列历史名单、不按手机号补链。统一业务数/办理状态不冒充供应商受理、真实拨打、接通或话单数。'
SCENE='主场景只保原添加字段唯一入口→来源二选一→独立选择/配置弹窗→子确认入父草稿→主场景明确保存。下方有效必填按准确参数唯一映射、供应商必填及所引用当前分类字段合并；CUSTOM只取自身要求，失效/重复/未读显示待核，上方供应商原模板仍保raw。空AI责任人不画旧责任行，历史明确人员仍原名保留。'
RACE='取消/放弃后关闭动画期间立即重开场景时，仅清除已获授权标记closing的旧层再初始化，活动未保存层拒绝重复打开；延时关闭只删除捕获的旧层，有新层不解锁其背景滚动，旧异步字段返回按sequence/owner不能覆盖新草稿。取消不保存、不删除原映射或误报新表单脏状态。'
BATCH='业务分类列表提供导入名单并锁定准确分类；原导入与分配改为导入批次，以批次结果/详情为主。独立业务名单保工作队列、原单条/同组批量手动分配及明确发起；主菜单打开/刷新不带临时批次过滤，准确批次详情和recordId详情各保自身上下文，账号/租户/撤权重新核验。'
CLOSE='当前新建/修改模板的END固定正常结束CLOSE，不提供是否直接跟进配置，当前新导入/路由/重开不得接纳旧DIRECT_FOLLOWUP配置；已运行历史按原捕获方案和原合法来源收尾，不改历史为CLOSE，不借旧END来源授权当前新周期。新TASK/DIRECT始终直接跟进，不显示启用流程；旧无TASK来源DIRECT仅保原合法转换能力。'
REFUSAL='AI通话原列表每行仅保详情，不追加逐行确认拒联。原准确详情保录音/文本及有权原来源人工确认入口，准确通话、租户、供应商、联系号码和原权限再次校验；不按标签/状态自动拒联，不新增待审队列，不扩大解除权。'
LIMITS='原Step54证据仅有限本地Mock/合成名单与获准HTTP；三条主流程有实际闭环，22组中13组已验、9组部分已验，66套1102结构化用例通过只是补充。下载落地、真实音频、未知回执/停止/新周期及其他列明子项、file协议、真实供应商/API/CTI未全部验证；产品资料更新不授全量验收、S8/final、G3或工程执行批准，DRAFT继续保留。'

# Preserve quoted provenance and explicit historical facts; current text is rewritten.
REPLACEMENTS={
'导入与分配':'导入批次与业务名单',
'END只配置两种后续动作。':'当前新模板END固定CLOSE；两种原动作仅旧已运行历史按原捕获解释。',
'整批明确DIRECT或TEMPLATE；DIRECT显式选择AI/MANUAL/PREDICTIVE，AI明确场景':'TASK/DIRECT或CATEGORY/TEMPLATE由准确入口固定，TASK方式/场景自动带入锁定，分类按实际首路径分组确定',
'整批明确DIRECT/TEMPLATE':'按准确入口固定TASK/DIRECT或CATEGORY/TEMPLATE',
'DIRECT显式选择AI/MANUAL/PREDICTIVE，AI场景必选':'TASK DIRECT由任务带入方式与必要场景，CATEGORY按首路径及分组确定方式/场景',
'后续流程走独立启用流程预检':'仅旧无TASK来源历史的后续流程可走独立启用流程预检',
'后续流程走独立“启用流程”预检。':'新TASK来源不得启用模板；仅旧无TASK来源历史的后续流程可走独立“启用流程”预检。',
'已有业务启用流程不重复导入':'仅旧无TASK来源历史的合法启用流程不重复导入',
'再接续无模板人工周期或关闭':'当前新END只正常CLOSE；旧已捕获历史按原动作接续或关闭',
'当前安排待重新分人':'当前按方式重新核任务或人工分配/指定seat，不选独立责任人',
'当前租户责任跟进人和必要AI场景；不在此选择原任务／执行资源替代人员分配。':'本方式准确任务或人工分配/指定seat与必要AI场景；没有独立责任跟进人选择，分配不自动起呼。',
'原导入批次与业务名单改为导入批次':'原旧导入菜单改为导入批次，业务名单保独立',
'分类显式allowDirectFollowup控制直接跟进可选，缺省false':'当前无直接跟进开关；任务DIRECT/分类TEMPLATE由准确入口派生',
'按引用保护维护分类字段及allowDirectFollowup':'按引用保护维护分类字段；当前不编辑历史allowDirectFollowup',
'校名称、编码列名、业务域和两用途字段；显式保存允许直接跟进开关，缺省false':'校名称、编码列名、业务域和两用途字段；当前不提供直接跟进开关',
'同次保存BASE、字段及allowDirectFollowup，不提交ROUTE；配置开关不重写既有业务模式':'同次保存BASE和字段，不提交ROUTE或旧直接开关；入口决定新业务模式，旧事实不改',
'DIRECT只由分类显式allowDirectFollowup开放':'当前TASK入口固定DIRECT，不由分类开关开放；旧无TASK历史另核原准入',
'END后续动作（CLOSE或DIRECT_FOLLOWUP）':'当前END固定CLOSE及旧已捕获动作的历史只读解释',
'DIRECT开关/显式方式':'准确TASK来源/渠道/方式（旧无TASK历史另核原准入）',
'当前分类allowDirectFollowup=true':'当前准确任务/场景/渠道资格（旧无TASK历史按原准入）',
'resume任何新周期都须当前分类允许':'TASK的resume新周期须当前准确任务/场景/渠道有效，旧无TASK历史按原准入',
'新DIRECT导入和新增直接执行安排不可用':'不能以旧开关授新DIRECT资格；当前任务入口仍按准确任务/渠道资格办理',
'分类允许DIRECT时':'任务入口固定DIRECT时',
'分类显式允许且':'入口合同允许且',
'允许DIRECT的AI/预外呼任务':'准确AI/预外呼任务',
'分类允许DIRECT':'任务来源允许DIRECT',
'分类已绑模板也可在允许DIRECT时独立导入':'任务来源允许时，分类已绑模板也可直接导入',
'allowDirectFollowup显式允许':'准确TASK来源/渠道有效，旧无TASK历史另按原合同',
'分类允许且显式方式确定':'入口来源有效且方式确定',
'分类当前仍显式允许直接跟进':'当前准确TASK来源/任务/渠道仍有效，旧无TASK历史另核原准入',
'分类allowDirectFollowup显式允许':'准确TASK来源/渠道有效，旧无TASK历史另按原合同',
'分类允许DIRECT；':'准确TASK来源/渠道有效；',
'且allowDirectFollowup显式允许':'且准确TASK来源/渠道有效',
'允许DIRECT分类':'任务配置关联分类',
'分类开关':'旧allowDirect标志',
'绑定所选整批handlingMode':'绑定准确入口固定handlingMode',
'整批明确办理模式；DIRECT分类显式允许且方式明确，TEMPLATE实际分类绑定已确认有效流程':'按准确入口确定模式；TASK固定DIRECT和任务方式，CATEGORY固定TEMPLATE及实际分类有效路由',
'END两种动作':'当前END固定CLOSE；旧捕获动作只作历史',
'END仅选后续两动作':'当前END固定正常结束CLOSE',
'END选择DIRECT_FOLLOWUP':'旧历史END已捕获DIRECT_FOLLOWUP（当前不允许新配置）',
'可明确改为DIRECT_FOLLOWUP':'当前不可改为DIRECT_FOLLOWUP',
'按照无模板跟进 / 业务结束不跟进':'当前固定业务结束不跟进；旧无模板接续仅历史只读',
'原专业目录正常导入/分配':'原专业目录的准确任务入口导入/分配',
'初次DIRECT后显式启用流程可为TEMPLATE':'新TASK DIRECT不启用模板；旧无TASK历史明确合法启用后才可TEMPLATE',
}

def rewrite(v):
 if isinstance(v,dict):return {k:(x if k in ['history','previous_source_records','source_evidence','raw','old'] else rewrite(x)) for k,x in v.items()}
 if isinstance(v,list):return [rewrite(x) for x in v]
 if isinstance(v,str):
  for old,new in REPLACEMENTS.items():v=v.replace(old,new)
 return v

def append_unique(seq,text):
 if text not in seq:seq.append(text)

def field(f,*,name=None,format=None,required=None,validation=None,derive=None,write=None,nullable=None,default=None):
 if name:f['name']=name
 if format:f['format']=format
 if required:f['required_when']=required
 if validation is not None:f['validation_rules']=validation
 if derive:f['derivation']['rule']=derive
 if write:f['persistence']['write_when']=write
 if nullable is not None:f['nullable']=nullable
 if default:f['default']=default
 if validation is not None:
  f['lifecycle']=[{'state':'当前输入/使用','behavior':derive or '；'.join(validation)},{'state':'历史','behavior':'按准确原身份及原捕获快照只读，不在读取时补值、迁移或回写。'},{'state':'失败或未知','behavior':'保原事实和可继续输入，未知核原请求，不虚报成功或重复副作用。'}]
  f['examples']={'valid':[validation[0]],'invalid':['无准确来源/权限、失效依据或伪造历史事实，拒绝并保原值。']}

def replace_local(l,pre,actions):
 if pre is not None:l['preconditions']=pre
 for i,action in enumerate(actions):l['steps'][i]['action']=action

def strip_owned(v):
 # The upstream apply chain is repeatable. Remove this module's previously
 # appended clauses before reapplying so maintenance does not grow duplicate text.
 if isinstance(v,dict):return {k:(x if k in ['history','previous_source_records','source_evidence','raw','old'] else strip_owned(x)) for k,x in v.items()}
 if isinstance(v,list):return [y for x in v if (y:=strip_owned(x))!='']
 if isinstance(v,str):
  import re
  v=re.sub(r'(?:历史)*分类开关(?:（当前不配置）)*','旧allowDirect标志',v)
  original=v
  extras=['旧未知/在途/事实冲突仍拦新运行；可靠受控废弃保持缺失未完成事实，不伪造正常archive。','数据导入方式仅MANUAL/AUTO（手工/接口），模板可选其有效场景但须分类/供应商/执行租户资格；旧FLOW配置提示重新选择，不静默暗转。','预外呼任务4步配置中保存准确业务分类和手工/接口来源，分类与来源按记录/状态原锁定规则维护；导入只自动读取，不临时补选。']
  for extra in extras:v=v.replace(extra,'')
  for clause in sorted([ENTRY,AI_SCHEMA,TASK,SIMPLE,SOURCE,REQUEST,PRIVATE,QUEUE,EXACT,FP,HISTORY,SCENE,RACE,BATCH,CLOSE,REFUSAL,LIMITS],key=len,reverse=True):
   v=v.replace(clause,'')
  return re.sub(r' {2,}',' ',v).strip() if v!=original else v
 return v

def dedupe_current(v):
 if isinstance(v,dict):return {k:(x if k in ['history','previous_source_records','source_evidence','raw','old'] else dedupe_current(x)) for k,x in v.items()}
 if isinstance(v,list):return [dedupe_current(x) for x in v]
 if isinstance(v,str):
  import re
  v=re.sub(r'(?:历史)*分类开关(?:（当前不配置）)*','旧allowDirect标志',v)
  clauses=[ENTRY,AI_SCHEMA,TASK,SIMPLE,SOURCE,REQUEST,PRIVATE,QUEUE,EXACT,FP,HISTORY,SCENE,RACE,BATCH,CLOSE,REFUSAL,LIMITS,
   '；任一行失败全组不写，保原手动分配入口。',
   '投影办理模式及详情副标题读当前有权业务的真实handlingMode；新TASK DIRECT不启用模板；旧无TASK历史明确合法启用后才可TEMPLATE，不能以导入来源硬写DIRECT；转出方仅本方截止历史',
   '同组共同候选中选择本方式具体任务或人工分配方式/坐席、必要AI场景及五档等级，逐条重核后同次写入；任一行失败全组不写，保原手动分配入口。']
  for clause in sorted(clauses,key=len,reverse=True):
   if v.count(clause)>1:
    start=v.index(clause)+len(clause);v=v[:start]+v[start:].replace(clause,'')
  return re.sub(r' {2,}',' ',v).replace('。 ；','。；').replace('；；','；').strip()
 return v

def navigation_statement(statement):
 # Preserve the separately reviewed phone/navigation contract verbatim. All
 # imported copies of the entry paragraph are replaced by one current BATCH.
 phone=statement.split('业务分类列表提供导入名单',1)[0].strip()
 return phone+' '+BATCH

def apply(b,p,u,pf,rules):
 identities=({x['id'] for x in b['fields']+p['fields']},{x['id'] for x in b['locals']+p['locals']},{x['id'] for x in b['checks']+p['checks']},{x['id'] for x in b['acceptance_updates']+p['acceptance_updates']})
 b,p,u,pf,rules=[rewrite(strip_owned(x)) for x in [b,p,u,pf,rules]]
 F={x['id']:x for x in b['fields']+p['fields']};L={x['id']:x for x in b['locals']+p['locals']}
 # Obsolete configuration identities survive solely to explain old stored facts.
 f=F['FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP'];field(f,name='历史分类直接跟进开关（当前不配置）',format='历史boolean；当前UI无编辑/准入开关',required='当前动作不要求此值；仅旧无TASK来源历史按其原合同读取',nullable=True,default={'kind':'none','value':None,'rule':'当前任务DIRECT与分类TEMPLATE由准确入口派生，不读此旧开关授新资格。'},validation=[ENTRY,'旧字段不删除历史值；无TASK标识的历史DIRECT若原合同要求此值仍按原范围核验，不能借此新导入。'],derive=ENTRY,write='当前业务配置不新增或修改此历史开关；既有快照保持原样。');f['permissions']['write']=['当前没有此字段编辑入口；只保历史原捕获事实。']
 f=F['FIELD-FLOW-HANDLING-MODE'];field(f,required='正式导入及后续办理记录均按准确入口/历史合法转换确定',default={'kind':'derived','value':None,'rule':ENTRY},validation=[ENTRY,'同一批次按入口固定模式和渠道，不混；TASK DIRECT无run/node，CATEGORY TEMPLATE须实际路由/当前完整方案；任务SOURCE不能伪造改类启用模板。'],derive=ENTRY,write='同一原请求成功时由入口派生，与业务/批次/entrySource及首次快照同次保存；旧无TASK历史的合法明确转换单独记录，不回写旧周期。');f['derivation']['kind']='system'
 for fid in ['FIELD-FLOW-END-ACTION','FIELD-FLOW-RUN-END-ACTION']:
  f=F[fid];field(f,format='当前CLOSE；历史已捕获DIRECT_FOLLOWUP只读保留',required='当前END固定CLOSE；历史run按原捕获值读取',default={'kind':'literal','value':'CLOSE','rule':'当前模板固定业务结束不跟进，无二选一控件。'},validation=[CLOSE],derive=CLOSE,write='当前合法模板保存/新run捕获CLOSE；旧run的endAction与来源证明不迁移或重写。');f['derivation']['kind']='system';f['permissions']['write']=['系统按合法当前模板CLOSE或准确旧run原方案产生；用户无当前END动作切换。']
 f=F['FIELD-FLOW-TASK-IMPORT-SOURCE'];field(f,format='{schema:2,method,taskId,aiSceneId?,categoryId,tenantId,brandId,batchId,importChannel:MANUAL/API,dataImportSource,targetFingerprint,parameterMappingFingerprint}；entrySource另存kind=TASK/CATEGORY与渠道/模式',required='新TASK DIRECT必须准确来源；CATEGORY/旧历史不伪造TASK标记',validation=[SOURCE,TASK,REQUEST,PRIVATE],derive=SOURCE,write='同一明确成功请求与record、batch、DIRECT周期、entrySource及originalImportSnapshot同次保存；未知沿原请求核对，读取不迁移旧来源。')
 f=F['FIELD-FLOW-TASK-IMPORT-PARAMETERS'];append_unique(f['validation_rules'],AI_SCHEMA);append_unique(f['validation_rules'],PRIVATE);append_unique(f['validation_rules'],FP)
 f=F['FIELD-FLOW-IMPORT-ORIGINAL'];append_unique(f['validation_rules'],SOURCE);append_unique(f['validation_rules'],REQUEST)
 for fid in ['FIELD-FLOW-IMPORT-VALUES','FIELD-FLOW-IMPORT-PREVIEW','FIELD-FLOW-IMPORT-TOKEN','FIELD-FLOW-IMPORT-MAPPING']:
  append_unique(F[fid]['validation_rules'],AI_SCHEMA);append_unique(F[fid]['validation_rules'],SIMPLE)
 for fid in ['FIELD-FLOW-EXECUTION-QUEUED-AT','FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE']:
  f=F[fid];f['nullable']=True;append_unique(f['validation_rules'],QUEUE);f['derivation']['rule']=QUEUE;f['persistence']['write_when']='本次准确当前运行/节点/直接周期的有效资源安排首次入队或显式新安排生成；同身份同资源重存保原FIFO。旧执行事实独立封存，读取不回落旧队列别名。'
 f=F['FIELD-PLAT-IMPORT-ROWS'];append_unique(f['validation_rules'],SIMPLE);append_unique(f['validation_rules'],HISTORY)
 for fid in ['FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS','FIELD-PLAT-AI-CATEGORY']:
  append_unique(F[fid]['validation_rules'],AI_SCHEMA);append_unique(F[fid]['validation_rules'],SCENE)
 # Replace ambiguous old mode preconditions and import workflows with exact entry rules.
 replace_local(L['LOCAL-FLOW-IMPORT-PREVIEW'],['当前租户ADMIN与customer.import及原模块/准确对象导入资格有效',ENTRY,'CATEGORY实际分类已绑定有效当前模板；TASK关联分类/场景/渠道明确'],[TASK+' '+ENTRY+' '+AI_SCHEMA, 'CATEGORY按真实行IMPORT条件定位首路径/首CALL并分组；AI取该组实际场景参数，TRANSFER按当前/目标租户合法路径办理，未知PENDING不假落ELSE。未配置模板精确引导业务分类→路由配置，失效/删除另报，不虚构空名单1条。', SIMPLE+' 预检成功才显示实际组数，名单/映射/分类/路由/场景/执行安排改变清旧token/数量；保五档及人工MANUAL/指定seat、PRED仅任务、AI任务+scene的合法安排。'])
 replace_local(L['LOCAL-FLOW-IMPORT-COMMIT'],['当前管理员及准确入口/任务/渠道资格仍有效','正式纳入范围逐行通过且token与当前重算一致；AI全行通过，PRED可确认合法有效子集，分类保持整批预检'],[ENTRY+' '+AI_SCHEMA+' '+REQUEST,'同请求建立批次/稳定record/初始负责租户及入口模式；CATEGORY捕获完整plan建run，TASK只建DIRECT周期不建run/node。'+SOURCE,SIMPLE+' '+PRIVATE+' 保原单条/同组批量手动分配和明确起呼，不因保存导入自动呼叫。'])
 replace_local(L['LOCAL-PLAT-AI-IMPORT-TEMPLATE'],['当前准确AI任务/场景读取及原导入资格，分类/供应商映射可可靠取得'],[AI_SCHEMA+' '+TASK,'schema1/legacy只读兼容、schema2按本场景准确映射；无准确平台/分类/定义或供应商必需参数待核时不给假空模板。下载本身不导入、不改分类或升级场景；实际下载落地验收仍单列未验。'])
 replace_local(L['LOCAL-PLAT-AI-LIST-IMPORT'],['当前有效租户ADMIN+customer.import及实际AI模块/准确任务/来源/渠道资格；AI-only管理员无需Cloud菜单或Cloud授权',TASK],[TASK+' '+AI_SCHEMA+' '+SIMPLE,L['LOCAL-PLAT-AI-LIST-IMPORT']['steps'][1]['action'],REQUEST+' '+SOURCE+' '+PRIVATE+' '+FP+' 异步文件/目录/检查返回按序号和准确账号/tenant/task/窗口复核，上下文变化立即失效，旧返回不覆盖新输入。共享读取/预检严格使用准确context.importLimits：AI大众100行、厚朴150000行、其他2000行及16MB；PRED2000行/1MB，超限分批不截断。保存原始联系号码及实际操作人，规范明文用于联系协调，不保存一份CSV列原文副本。AI-only沿精确账号/tenant/task的窄共享上下文，schema只读，不持久授Cloudcap/成员/菜单，不借导入授配置/起呼权；成功、失败或异常均恢复原访问。保存仅业务事实，不说供应商已受理/拨打。'])
 replace_local(L['LOCAL-PLAT-CLOUD-TASK-IMPORT'],['PRED新统一导入须ADMIN+customer.import及原Cloud模块/准确任务/来源资格；分类从任务配置自动带入，无分类DIRECT开关','接口来源任务不混手工；IVR仍原专业合同，不扩成本轮DIRECT'],[TASK+' PRED按本任务分类IMPORT+系统code/姓名/电话逐行校类型/映射/重复，FOLLOWUP排除；保准确context.importLimits：2000行/1MB，AI其他原容量不变，超限分批不截断。',SIMPLE+' PRED固定准确taskId/PREDICTIVE，不另选seat/person；合法配置且状态/来源允许的待分配任务可导入，flat/alictiCreateDraft不要求已有原生行/旧目录已发布；缺配/无权/在途拒绝，不伪造供应商发布。',SOURCE+' '+REQUEST+' '+PRIVATE+' IVR及旧原生名单保持原独立专业结果。'])
 # Task direct cycles remain task-direct; legacy conversion is an explicit boundary.
 for lid in ['LOCAL-FLOW-ENABLE-TEMPLATE','LOCAL-FLOW-RESUME-DIRECT']:
  l=L[lid];l['preconditions']=[x for x in l['preconditions'] if '分类当前仍显式允许' not in x and '下一次AI/MANUAL/PREDICTIVE' not in x]
  append_unique(l['preconditions'], '新entrySource.kind=TASK的DIRECT不启用模板；再次直接跟进须沿准确当前任务/场景/分类/渠道资格。旧无TASK来源历史按原独立前置办理，不迁移来源。')
  if lid.endswith('ENABLE-TEMPLATE'):
   l['preconditions'].insert(0,'仅旧无TASK来源标记的历史DIRECT可使用此独立转换；新TASK来源明确拒绝，UI不显示启用流程')
   l['steps'][0]['action']='先查准确entrySource；TASK拒绝且不生成预检token。旧无TASK历史才按原合法路由/资料和执行结清条件检查，不重导、不伪造来源。'
   for z in l['branches']:
    if 'DIRECT' in z.get('condition',''):z['condition']='仅旧无TASK来源历史DIRECT且满足原分支条件；TASK来源明确不适用。'+z['condition']
  else:l['steps'][0]['action']='TASK来源新周期先核当前准确任务/场景/分类/手工或接口渠道和全部旧执行/必要归档收敛，不依赖已移除分类开关；旧无TASK历史及旧END来源仅按其准确原历史规则核验，不借历史例外授权当前新输入。'
 for lid in ['LOCAL-FLOW-TEMPLATE-CREATE','LOCAL-FLOW-TEMPLATE-EDIT','LOCAL-FLOW-TEMPLATE-READ','LOCAL-FLOW-ROUTE-BIND','LOCAL-FLOW-END-HANDOFF']:
  l=L[lid];append_unique(l['preconditions'],CLOSE);l['steps'][-1]['action']+=' '+CLOSE
 for lid in ['LOCAL-FLOW-CATEGORY-CREATE','LOCAL-FLOW-CATEGORY-EDIT']:
  l=L[lid];l['steps'][-1]['action']+=' 当前无allowDirectFollowup配置，导入入口固定TEMPLATE；保IMPORT/FOLLOWUP独立和原引用保护。'
 for lid in ['LOCAL-FLOW-START','LOCAL-FLOW-START-BATCH','LOCAL-FLOW-ASSIGN','LOCAL-FLOW-ASSIGN-BATCH']:
  L[lid]['steps'][-1]['action']+=' '+PRIVATE+' '+FP+' '+QUEUE
 for lid in ['LOCAL-FLOW-QUERY','LOCAL-FLOW-BATCH-READ','LOCAL-FLOW-DETAIL','LOCAL-PLAT-CLOUD-TASK-QUERY','LOCAL-PLAT-AI-TASK-QUERY']:
  if lid in L:L[lid]['steps'][-1]['action']+=' '+HISTORY+' '+BATCH
 for lid in ['LOCAL-PLAT-AI-SCENE-SAVE','LOCAL-PLAT-AI-SCENE-QUERY']:
  L[lid]['steps'][-1]['action']+=' '+EXACT+' '+SCENE+' '+RACE+' 数据导入方式仅MANUAL/AUTO（手工/接口），模板可选其有效场景但须分类/供应商/执行租户资格；旧FLOW配置提示重新选择，不静默暗转。'
 L['LOCAL-PLAT-CLOUD-TASK-SAVE']['steps'][-1]['action']+=' 预外呼任务4步配置中保存准确业务分类和手工/接口来源，分类与来源按记录/状态原锁定规则维护；导入只自动读取，不临时补选。'
 L['LOCAL-PLAT-BAN-AI']['steps'][0]['action']=REFUSAL+' '+L['LOCAL-PLAT-BAN-AI']['steps'][0]['action']
 L['LOCAL-PLAT-NAVIGATE']['steps'][-1]['action']+=' '+BATCH
 L['LOCAL-FLOW-REOPEN']['steps'][-1]['action']+=' '+QUEUE+' 旧未知/在途/事实冲突仍拦新运行；可靠受控废弃保持缺失未完成事实，不伪造正常archive。'
 # Exact scene references are automatic in TASK import; only template groups/arrangements choose.
 field(F['FIELD-FLOW-DIRECT-METHOD'],required='TASK初始导入由准确任务方式自动带入锁定；后续合法调整/再次周期及旧无TASK历史按各自当前动作资格明确确认',default={'kind':'derived','value':None,'rule':'TASK初始导入从准确AI/预外呼任务派生方式和必要场景，不在导入重选；后续动作仅在自身合同允许时明确确认。'},validation=['TASK初始DIRECT导入固定当前准确任务method及必要AI场景；不以分类开关或中央模式选择决定，不重复选场景。','后续合法执行调整或再次直接周期按本次方式/场景/资源与来源资格明确确认；若当前动作固定方式则不得绕过，不把初始来源事实改写为所有未来动作的无条件许可或永久硬锁。','旧无TASK来源DIRECT及旧已捕获END历史按原独立准入；所有新执行仍核准确权限、当前周期、联系限制、原未知/在途与必要归档收敛。'],derive='TASK初始由准确任务配置派生；其后按该合法调整/再次周期动作明确选择并重核，不修改原始任务来源/旧周期方式快照。',write='统一导入明确成功随准确入口/任务上下文同次保存；其后合法动作成功只改本次当前安排/新周期，旧周期及原始来源快照不回写。')
 field(F['FIELD-FLOW-AI-SCENE'],required='AI TASK从准确任务配置自动带入锁定；CATEGORY实际AI分组及后续安排需准确有效场景',validation=[TASK,AI_SCHEMA,'AI场景是执行/参数/结果来源的准确稳定身份；TEMPLATE按当前执行租户和实际组显式确认，TASK不在导入重复选择。旧历史保原sceneSnapshot不按当前目录重写。'],derive='TASK从已保存准确任务/场景关联派生；CATEGORY按实际路径/分组及本租户执行安排明确，不猜首项。',write='准确导入或安排明确成功时，与本次schema、执行安排/参数快照同次保存；旧受理/归档保当时场景，不在读取时迁移。')
 f=F['FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS'];f['required_when']='本次场景参数配置提供；新AI导入只投影实际引用的分类业务字段与专属列，系统必需/条件字段和供应商必需项分别满足'
 f['validation_rules']=[v.replace('required只增加本参数需值约束，不能取消分类必填','required只增加本参数需值约束，不能取消本次实际引用业务字段的分类必填；未引用的分类额外必填不进入AI schema') for v in f['validation_rules']]
 f['derivation']['rule']=f['derivation']['rule'].replace('required只增加本参数需值约束，不能取消分类必填','required只增加本参数需值约束，不能取消本次实际引用业务字段的分类必填；未引用的分类额外必填不进入AI schema')
 L['LOCAL-PLAT-AI-LIST-IMPORT']['postconditions']=['本次准确场景投影的规范业务值、独立供应商值及来源/定义快照同请求保存为DIRECT，不创建模板run/node；原专业历史不迁移。']
 m=L['LOCAL-FLOW-IMPORT-MAP'];m['steps'][-1]['action']='按准确入口固定TASK/DIRECT或CATEGORY/TEMPLATE，TASK自动带入方式/场景；CATEGORY先真实条件分组和必要场景，之后用本次正式schema映射/检查，不提供中央模式或TASK场景再选。'
 preview=L['LOCAL-FLOW-IMPORT-PREVIEW'];preview['steps'][1]['action']+=' 仅首组识别/discovery用于决定方式和所需场景，不生成正式token、不建record；待各组必要场景及正式schema齐全后才正式逐行检查。'
 for z in preview['branches']:
  if z['id'].endswith('-DIRECT'):z.update(condition='TASK DIRECT基础必填/类型/映射/唯一性错误，或准确任务/分类/渠道/AI场景关联缺失冲突失效',result='逐行具体报错并引导任务/场景配置维护，保名单且无有效token；不临时再选分类/场景，不降级CATEGORY或猜首项。')
  elif z['id'].endswith('-4'):z['result']='正式schema当前纳入范围全部检查通过，展示入口固定模式和TASK自动方式/场景或CATEGORY实际分组/首CALL及有效确认依据；只有首组discovery尚无正式token。'
 commit=L['LOCAL-FLOW-IMPORT-COMMIT'];commit['postconditions']=['仅保存本次明确或模板有效默认的执行安排，不自行猜选任务/seat，不自动转交或起呼。']
 for z in commit['branches']:
  if z['id'].endswith('-1'):z.update(condition='正式纳入本次确认提交范围存在失败行或token过期',result='该正式范围不写且保名单重检；PRED可先明确确认检查通过的合法有效子集，封存成功行，失败草稿另请求重检续入；AI仍全部行通过。')
  elif z['id'].endswith('-MODE'):z.update(condition='准确入口固定模式/渠道资格不符，或正式纳入提交范围任一行失败',result='拒绝该范围，不自动改入口/模式重试；PRED合法有效子集须先明确二次确认，AI仍全行通过；未知核同请求。')
  elif z['id'].endswith('-2'):z['result']='同次台账/批次保持准确入口；CATEGORY按方案建run，TASK无run/node；保存本次准确安排或保持待安排，不自动起呼。'
  elif z['id'].endswith('-3'):z['result']='保持本次原请求ID待核；首次success/unknown若显式返回requestId不符也不解锁、不认领异请求产出、不另建批次。'
 commit['steps'][0]['action']+=' 首次success/unknown响应显式requestId不符时保持本次原ID待核，不解锁或接受异请求产出。'
 L['LOCAL-PLAT-AI-LIST-IMPORT']['steps'][-1]['action']+=' 首次success/unknown响应显式requestId不符同样保本次原ID待核，不解锁或新请求重试。'
 for lid in ['LOCAL-FLOW-ENABLE-TEMPLATE','LOCAL-FLOW-RESUME-DIRECT']:
  L[lid]['preconditions']=list(dict.fromkeys(L[lid]['preconditions']))
 for z in L['LOCAL-FLOW-RESUME-DIRECT']['branches']:
  if z['id'].endswith('-1'):z['condition']='当前周期未完成、旧执行未收敛、当前TASK准确任务/渠道/场景无效，或旧无TASK历史不满足原独立准入'
 # Remove contrary active category branches rather than merely appending an override.
 for lid in ['LOCAL-FLOW-CATEGORY-CREATE','LOCAL-FLOW-CATEGORY-EDIT']:
  l=L[lid]
  for z in l['branches']:
   if z['id'].endswith('-DIRECT'):
    z.update(condition='当前新分类请求携带已移除的直接跟进开关，或旧历史只读值缺失',result='当前无此开关编辑/授予新资格；分类导入固定TEMPLATE，任务DIRECT按准确来源。缺旧历史值不补造；保原已受理与必要本人收尾。')
 e=L['LOCAL-FLOW-END-HANDOFF'];e['steps'][0]['action']='当前准确CLOSE结束原run并封结束节点/时间/租户，不虚构业务达成或通话；旧已捕获END才按其原准确动作解释。'
 e['steps'][1]['action']='新模板不产生END直接周期；仅旧已捕获DIRECT_FOLLOWUP按原record/owner/来源周期合法收尾，不反写旧事实，不授当前新TASK或新模板例外。'
 e['postconditions']=['当前准确run以CLOSE正常结束，保内容/通话/运行事实，不自动起呼。','旧已捕获END来源及旧独立直接周期按原合同只读或合法收尾，不生成新配置能力。']
 for z in e['branches']:
  if z['id'].endswith('-DIRECT'):z['condition']='仅旧已运行历史捕获动作DIRECT_FOLLOWUP且原来源可核（当前新配置/输入不得使用）';z['result']='旧准确END仅保其record/owner/来源directCycleId原首MANUAL合法接续；历史保留不授当前新TASK或新模板资格，后续新周期按各自原准入独立核验。'
 field(F['FIELD-FLOW-OUTCOME'],validation=['当前新END仅封存FLOW_CLOSED/业务结束不跟进，不把流程结束当成交；FLOW_TO_DIRECT仅保旧已捕获历史摘要。'],derive='当前按准确CLOSE结束事实生成；历史原动作及原摘要不回写。')
 legacy=F['FIELD-FLOW-END-FOLLOWUP-ORIGIN'];legacy['required_when']='仅旧已捕获END直接周期保准确来源；当前新CLOSE模板/TASK导入不产生此证明';append_unique(legacy['validation_rules'],CLOSE)
 if 'LOCAL-PLAT-CUSTOMER-IMPORT' in L:
  c=L['LOCAL-PLAT-CUSTOMER-IMPORT'];c['title']='分类导入发起与原专业历史边界';c['trigger']='业务分类行发起人工/接口模板导入，或读取原专业历史来源';c['steps'][0]['action']=BATCH+' 新写按LOCAL-FLOW-IMPORT-PREVIEW/COMMIT的准确CATEGORY/TEMPLATE办理，不构造第三个中央DIRECT导入。';c['steps'][1]['action']=AI_SCHEMA+' '+REQUEST;c['steps'][2]['action']=HISTORY+' TASK新写从准确任务入口，IVR及其他原专业能力仍按各自原权限合同，不能借批次页开启新入口。';c['postconditions']=['新写统一进入准确CATEGORY/TEMPLATE或TASK/DIRECT链；原专业历史只读按原身份保留，不重复提交。']
 # Existing acceptance identities are revised in place to match the current user decisions.
 ac={a['id']:a for a in b['acceptance_updates']+p['acceptance_updates']}
 updates={'AC-2107':'路由只更新本次单模板应用及兼容依据，不覆盖BASE；unknown不进入新业务。'+ENTRY,'AC-2136':'当前模板/路由只读展示四节点与入口、有序条件、承接方及方式；当前END固定CLOSE，旧已运行历史只读按原完整方案，参考与实际应用分明。','AC-2141':CLOSE,'AC-2149':'业务分类行保导入名单、编辑、路由配置、预览、删除；不恢复AI标签快捷入口。'+BATCH,'AC-2158':AI_SCHEMA,'AC-2160':ENTRY+' '+TASK+' '+SOURCE,'AC-2161':HISTORY+' '+REQUEST,'AC-2162':'当前TASK导入ADMIN+customer.import叠原模块/准确任务/渠道资格，AI-only不需Cloud菜单，不增Cloud授权；API仅可读字段/要求与已有记录，接口接入待开发。'+SIMPLE,'AC-2165':'当前模板END固定CLOSE，旧已捕获END来源及其受控首周期历史合法性单独保留；新TASK来源再次直接跟进核准确任务/渠道，不依赖已移除分类开关；旧来源不授新TASK周期资格。','AC-2154':QUEUE+' '+PRIVATE}
 for ident,text in updates.items():ac[ident]['statement']=text
 # Same CHECK IDs carry concrete updated procedures/expected outcomes, not code test claims.
 checks={x['id']:x for x in b['checks']+p['checks']}
 check_updates={
'CHECK-FLOW-CATEGORY-CREATE':('创建分类并保存名称/编码/域/IMPORT/FOLLOWUP，再从该行发起导入；尝试携带旧直接开关。',ENTRY+' 分类BASE不写ROUTE或旧直接开关；字段独立，当前TEMPLATE缺路由明确阻断。'),
'CHECK-FLOW-CATEGORY-EDIT':('编辑被引用分类名称/字段并取消或保存；尝试改业务域/用途及旧直接开关。',ENTRY+' 原引用保护保留，取消不污染已保存定义，不迁移旧历史。'),
'CHECK-FLOW-TASK-IMPORT-SCHEMA':(AI_SCHEMA,TASK+' '+AI_SCHEMA),
'CHECK-FLOW-IMPORT-PREVIEW':('分别从分类人工/接口和准确任务手工/接口入口准备导入；CATEGORY首组discovery后选必要AI场景；TASK自动带入；改变资料/场景/字段/安排后重检。',ENTRY+' '+AI_SCHEMA+' '+SIMPLE+' 只有首组识别尚无正式token/record，必要场景和正式schema齐备后才正式预检。'),
'CHECK-FLOW-IMPORT-COMMIT':('分别确认合法TASK DIRECT及CATEGORY TEMPLATE；构造重复、缺必填、API/手工混用、旧token、原请求未知与有效子集。',SOURCE+' '+REQUEST+' '+SIMPLE),
'CHECK-FLOW-IMPORT-MAP':('先确定入口/方式/实际AI场景，下载本次schema或上传/粘贴并映射；切场景后检查旧映射和token。',AI_SCHEMA+' 不出现未引用分类列强制AI导入；格式或映射改变重新检查。'),
'CHECK-PLAT-AI-IMPORT-TEMPLATE':('同分类配置两个供应商/场景的不同IMPORT_FIELD及CUSTOM_COLUMN，分别从任务和模板入口选择场景后准备下载/映射。',AI_SCHEMA+' 下载生成与实际文件落地验收分开。'),
'CHECK-FLOW-AI-TASK-DIRECT-IMPORT':('准确AI任务打开共享导入，不重选分类/场景；检查缺专属必填、typed错误、重复及合法名单；确认后从原列表/业务详情明确开始。',TASK+' '+SIMPLE+' '+SOURCE+' '+EXACT+' '+FP),
'CHECK-FLOW-PRED-TASK-DIRECT-IMPORT':('预外呼4步配置保存分类；从行内/顶部选同任务导入，实际CSV有空行/前导零及1有效1错误，保存有效子集再恢复失败草稿续入。',TASK+' '+SIMPLE+' '+HISTORY),
'CHECK-FLOW-TASK-IMPORT-REPLAY':('原请求返回未知后核对同次；首次success/unknown显式requestId不符、服务端已有产出、读取故障、跨租户/generic副本、旧周期冲突及typed伪报分别核验。',REQUEST+' '+PRIVATE+' 首次异requestId保持本次原ID待核，不解锁或接受异请求产出，不重复写成功行。'),
'CHECK-FLOW-ENABLE-TEMPLATE':('对新TASK DIRECT与旧无TASK来源历史DIRECT分别打开办理；测试旧段未结清/未知和合法旧转换。',CLOSE+' '+REQUEST),
'CHECK-FLOW-RESUME-DIRECT':('当前TASK DIRECT完成后明确再次直接跟进；改变准确任务/场景/渠道或保留旧未知，再测旧无TASK/END历史来源。',ENTRY+' '+CLOSE+' 旧执行/必要归档不收敛时拒绝新周期。'),
'CHECK-FLOW-END-CURRENT-CYCLE':('当前模板新配置/换绑/重开时试用旧DIRECT_FOLLOWUP；读取已捕获旧END历史，再分别创建当前新周期。',CLOSE+' 旧已捕获证明保持原样，不授新输入例外。'),
'CHECK-FLOW-END-HANDOFF':('创建当前CLOSE模板至END明确推进；对历史捕获DIRECT_FOLLOWUP只读追溯并按原合同收尾。',CLOSE),
'CHECK-FLOW-EXECUTION-HISTORY':('受控废弃后建立新RUN但不安排，再分配相同资源；比较同RUN重存和新RUN的新队列事实，回读旧跟进。',QUEUE+' '+HISTORY),
'CHECK-PLAT-AI-SCENE-SAVE':('编辑准确已有HP任务场景，配置两来源/有效必填；修改后取消并放弃，在关闭动画中立即重开，再触发旧timer/迟到字段结果。',SCENE+' '+RACE+' '+EXACT),
'CHECK-PLAT-CALL-QUERY':('原AI通话列表打开准确详情并切文本/信息页签；核列表与详情动作，按实际可用音频另验。',REFUSAL+' '+HISTORY+' 录音真实可听不能由按钮存在冒充。'),
'CHECK-PLAT-BAN-AI':('在原AI列表及准确有权/无权详情分别查看原来源确认入口；构造标签/拒接但无明确拒联依据。',REFUSAL),
'CHECK-FLOW-QUERY':('分别从主菜单/批次/record详情查询并刷新，改变账号/租户/权限；回读原历史和新TASK行。',BATCH+' '+HISTORY),
}
 for ident,(procedure,expected) in check_updates.items():
  if ident in checks:checks[ident].update(procedure=procedure,expected=expected)
 # Current UI facts derive their behavior from the updated LOCAL units.
 pages={pg['id']:pg for pg in u['ui']['pages']}
 layouts={
 'UI-PAGE-2006':['业务分类列表、字段配置、独立路由配置和导入名单；导入锁定该分类并固定TEMPLATE，不配置允许直接跟进开关'],
 'UI-PAGE-2204':['导入批次筛选/列表/结果及准确批次名单详情','新增名单从业务分类列表或准确任务入口发起；本页不提供中央模式切换或手工导入表'],
 'UI-PAGE-2226':['独立业务名单工作队列及原单条/同组批量手动分配、明确起呼','主菜单不继承临时批次过滤；缺新字段的原专业历史在原表留空'],
 'UI-PAGE-2103':['当前准确任务卡片/查看/详情与原供应商状态；未知计数显示待核','任务共享轻量导入：准确关联自动带入，文件/粘贴→检查编辑→确认；批次/五档在选填折叠区','API任务接口接收只读字段及要求，无手工上传/确认；原名单原表保历史'],
 'UI-PAGE-2205':['预外呼4步新建/编辑任务：准确分类/手工或接口来源、接听团队、执行配置、确认','行内与顶部选任务进入同一轻量导入，自动锁定分类；主区仅名单输入/检查/确认','原名单同表呈现新业务与旧原生行，旧缺四项新字段留空，统计与真实受理/通话分开'],
 'UI-PAGE-2228':['开始/转交/呼叫/结束四节点，条件和末位ELSE及准确执行安排/五档','人工分配或指定坐席、PRED仅任务、AI任务+场景；END固定CLOSE，无直接跟进配置'],
 'UI-PAGE-2108':['原AI通话列表筛选与详情入口，不逐行追加确认拒联','准确详情保录音/文本/详细信息及原有权人工拒联确认，不能以标签自动认定'],
 }
 pages['UI-PAGE-2204']['title']='导入批次';pages['UI-PAGE-2226']['title']='业务名单'
 for pid,layout in layouts.items():pages[pid]['layout']=layout
 for pg in pages.values():
  for inter in pg['interactions']:
   related=[L[i] for i in inter.get('local_logic_ids',[]) if i in L]
   if related:inter['behavior']='；'.join(s['action'] for l in related for s in l['steps'])+'；分支：'+'；'.join(z['condition']+'→'+z['result'] for l in related for z in l['branches'])
  for f in pg['fields']:
   fid=f['field_id']
   if fid in ['FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP','FIELD-FLOW-END-ACTION']:
    f.update(component_id='UI-COMP-READONLY',label=F[fid]['name'],help_text=F[fid]['derivation']['rule'],visible_when='当前新配置不显示此旧选项；仅明确历史快照有值且有准确读权时只读',editable_when='当前不可编辑，不借旧值授新模式或来源',required_indicator='当前无此配置输入必填',validation_timing='新模板/输入准入按当前入口及固定CLOSE检查，旧快照不改',error_message='旧配置不适用于当前新输入，请维护当前路由/任务配置',formatting=F[fid]['format'])
   elif fid=='FIELD-FLOW-HANDLING-MODE':f.update(component_id='UI-COMP-STATUS',help_text=ENTRY,editable_when='入口系统派生，不提供模式选择',required_indicator='由TASK/DIRECT或CATEGORY/TEMPLATE捕获',validation_timing='预检/提交按准确入口重核，旧token失效',error_message='准确入口、来源渠道或当前配置不一致',formatting='TASK直接跟进 / CATEGORY按模板流转；旧历史按实际事实')
   elif fid=='FIELD-FLOW-DIRECT-METHOD':f.update(help_text='；'.join(F[fid]['validation_rules']),required_indicator=F[fid]['required_when'],editable_when='TASK初始导入由准确任务自动带入锁定；后续合法调整/再次周期仅按各自动作资格，旧历史只读',validation_timing='准确任务/本次动作上下文预检和提交重核；变化使旧token失效',error_message='当前任务来源或本次动作不支持该方式/场景，请维护准确配置或按合法动作办理')
   elif fid=='FIELD-FLOW-AI-SCENE':f.update(help_text=F[fid]['derivation']['rule']+' '+TASK,required_indicator=F[fid]['required_when'],editable_when='TASK导入自动带入锁定；CATEGORY实际AI组及后续安排有权时才选择，历史只读',validation_timing='按准确任务/组/当前配置检查及提交重核，变化失效旧token',error_message='场景关联缺失/冲突/失效，到准确任务或场景配置维护，不临时猜选')
   elif fid in ['FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS','FIELD-FLOW-TASK-IMPORT-SOURCE','FIELD-FLOW-EXECUTION-QUEUED-AT','FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE']:
    f.update(help_text='；'.join(F[fid]['validation_rules']),required_indicator=F[fid]['required_when'],formatting=F[fid]['format'])

  if pg['id'] in ['UI-PAGE-2103','UI-PAGE-2205']:
   pg['states'][0]['behavior']=TASK+' '+SIMPLE
  if pg['id']=='UI-PAGE-2204':pg['states'][0]['behavior']=BATCH
  if pg['id']=='UI-PAGE-2110':pg['states'][0]['behavior']+=' '+SCENE+' '+RACE
 # Normalize current page facts and actions, without changing PAGE/ACTION identity sets.
 bypid={x['id']:x for x in pf['pages']}
 for uiid,pg in pages.items():
  pid=uiid.replace('UI-','')
  if pid in bypid:
   bypid[pid]['name']=pg['title']
   for a in bypid[pid].get('actions',[]):
    ls=[L[i] for i in a.get('local_logic_ids',[]) if i in L]
    if ls:a['behavior']='；'.join(s['action'] for l in ls for s in l['steps'])+'；分支：'+'；'.join(z['condition']+'→'+z['result'] for l in ls for z in l['branches'])
   bypid[pid]['interaction_rules']=[a['behavior'] for a in bypid[pid].get('actions',[]) if 'behavior' in a]
   bypid[pid]['current_behavior']='；'.join(bypid[pid]['interaction_rules'])
   for row in bypid[pid].get('fields',[]):
    fid=row.get('id')
    if fid in F and fid in ['FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP','FIELD-FLOW-END-ACTION','FIELD-FLOW-HANDLING-MODE','FIELD-FLOW-DIRECT-METHOD','FIELD-FLOW-AI-SCENE']:row['name']=F[fid]['name'];row['description']=F[fid]['derivation']['rule']
  if pid in pf['page_behavior']:
   pf['page_behavior'][pid]['layout']=pg['layout'];pf['page_behavior'][pid]['normal']=pg['states'][0]['behavior']
 for rule in rules:
  if rule['id']=='GR-HANDLING-MODE':rule['statement']=ENTRY+' '+CLOSE
  elif rule['id']=='GR-END-ACTION':rule['statement']=CLOSE
  elif rule['id']=='GR-TASK-UNIFIED-IMPORT':rule['statement']=TASK+' '+AI_SCHEMA+' '+SOURCE+' '+REQUEST+' '+PRIVATE
  elif rule['id']=='GR-EXECUTION-ARRANGEMENT':rule['statement']+=' '+QUEUE+' '+FP
  elif rule['id']=='GR-UNKNOWN':rule['statement']+=' '+REQUEST
  elif rule['id']=='GR-NAVIGATION':rule['statement']=navigation_statement(rule['statement'])
 # Current supersessions identify exactly which old configurations are retired.
 changes=[('CHG-048-SCENE-SCHEMA','场景驱动实际导入字段',AI_SCHEMA,['AC-2158','AC-2159']),('CHG-049-ENTRY-MODE','由两入口决定模式及渠道',ENTRY+' '+TASK+' '+CLOSE,['AC-2160','AC-2162','AC-2141']),('CHG-050-IMPORT-REQUEST','导入原请求及准确快照边界',REQUEST+' '+PRIVATE,['AC-2161','AC-2162']),('CHG-051-SIMPLE-IMPORT','任务轻量导入与原历史同表',SIMPLE+' '+HISTORY,['AC-2160','AC-2161']),('CHG-052-DETAIL-REFUSAL','原AI列表仅详情',REFUSAL,['AC-2162']),('CHG-053-IMPORT-FEEDBACK','不可提交反馈与重检',SIMPLE,['AC-2161']),('CHG-054-CURRENT-HTTP-FIXES','HTTP实际链与最小修复',EXACT+' '+FP+' '+QUEUE+' '+SCENE+' '+RACE,['AC-2154','AC-2159','AC-2160'])]
 # Earlier contradictory 'current' statements become explicitly superseded; preserve prior bytes as provenance records.
 superseded={'SUPERSEDE-DIRECT-FOLLOWUP-20261030':ENTRY+' '+CLOSE,'CHG-032-END':CLOSE,'CHG-039-ENTRY':BATCH,'CHG-044-TASK-IMPORT':ENTRY+' '+AI_SCHEMA+' '+SOURCE,'CHG-046-AI-PROVIDER-DIALOG':AI_SCHEMA+' '+SCENE,'SUP-FLOW-IMPORT':SIMPLE}
 for prior in b['supersessions']:
  if prior['id'] in superseded:
   old=prior['current'];hist=prior.setdefault('previous_source_records',[])
   if not any(v.get('current')==old for v in hist):hist.append({'current':old,'scope':'superseded current statement retained for provenance'})
   prior.update(current=superseded[prior['id']],status='superseded_by_current_entry_contract',superseded_by='CHG-049-ENTRY-MODE')
 for ident,title,text,acs in changes:
  b['supersessions']=[x for x in b['supersessions'] if x['id']!=ident]+[{'id':ident,'title':title,'old':'Step47及更早与本条现行规则冲突的配置/导入/展示口径仅保来源追溯，不作为当前新写要求。','current':text,'evidence_refs':['docs/exception-definitions.json#'+ident]}]
 b['entry_import_current_delta']={'version':VERSION,'authorization':AUTH,'authorizations':AUTHS,'changes':[{'id':a,'title':t,'acceptance_ids':acs,'statement':v} for a,t,v,acs in changes],'stable_product_ids':True,'runtime_proof':PROOF,'actual_http_groups':{'passed':13,'partial':9},'formal_approval':False,'production_verified':False,'limits':LIMITS}
 b['version']=u['version']=VERSION
 for d in [b,p,u]:append_unique(d.setdefault('review_notes',[]),LIMITS)
 after=({x['id'] for x in b['fields']+p['fields']},{x['id'] for x in b['locals']+p['locals']},{x['id'] for x in b['checks']+p['checks']},{x['id'] for x in b['acceptance_updates']+p['acceptance_updates']})
 assert identities==after,'Current delta must preserve product identity sets'
 return tuple(dedupe_current(x) for x in [b,p,u,pf,rules])
