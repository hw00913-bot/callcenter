"""Step44 current-product authoring: one IMPORT schema and one business ledger.

This module changes documentation source structures only. It never imports task
data, changes runtime files, approves stages or submits provider requests.
"""
import copy

VERSION = '2.0.0-current-20261101-step44'
AUTH = 'inputs/task-business-import-authorization-20261101.json'
MAPPING_CATEGORY = 'FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY'
MAPPINGS = 'FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS'
TASK_SOURCE = 'FIELD-FLOW-TASK-IMPORT-SOURCE'
PARAMETER_SNAPSHOT = 'FIELD-FLOW-TASK-IMPORT-PARAMETERS'
PROJECTION_RECORD = 'FIELD-PLAT-TASK-BUSINESS-RECORD-ID'
FIELD_IDS = [MAPPING_CATEGORY, MAPPINGS, TASK_SOURCE, PARAMETER_SNAPSHOT, PROJECTION_RECORD]


def unique(values):
    return list(dict.fromkeys(values))


def apply(b, p, u, pf, rules):
    bf = {f['id']: f for f in b['fields']}
    fields = {f['id']: f for d in [b, p] for f in d['fields']}
    locals_ = {l['id']: l for d in [b, p] for l in d['locals']}

    def field(ident, name, entity, key, kind, fmt, nullable, required, rule, persist, tests, deps, write_rule=None):
        row = copy.deepcopy(fields['FIELD-FLOW-IMPORT-ORIGINAL'] if ident in [TASK_SOURCE,PARAMETER_SNAPSHOT] else fields['FIELD-PLAT-AI-PARAMS'])
        row.update(id=ident, name=name, entity=entity, key=key, type=kind, format=fmt,
                   nullable=nullable, required_when=required, source_refs=['docs/field-alignment.json#' + ident], source_keys=[], test_refs=tests)
        row['default'] = {'kind': 'none', 'value': None, 'rule': '没有准确来源时不生成、不以首项/同名/同手机号猜测；旧历史保持原事实。'}
        row['validation_rules'] = rule
        row['permissions'] = {
            'read': ['按原任务/场景/统一业务对象读取资格及当前租户范围；任务读权不授任意统一业务或其他任务查看权。'],
            'write': [write_rule or '系统依据当前有权动作的准确任务/分类/请求结果写入；用户不能直接修改来源或回链。']}
        row['lifecycle'] = [
            {'state': '读取/预检', 'behavior': '只读取当前实际分类IMPORT及准确任务/场景，FOLLOWUP不进入导入；未知来源保待核。'},
            {'state': '明确成功', 'behavior': persist['write_when']},
            {'state': '失败/未知/上下文变化', 'behavior': '保输入和已生效事实，旧预检失效；同请求核对，不重复写业务、原生行或提交供应商。'},
            {'state': '历史', 'behavior': '旧专业行及业务快照不迁移，不因同手机号认领旧业务或按当前字段重绘历史。'}]
        row['derivation'] = {'kind': 'calculated' if ident == PROJECTION_RECORD else 'system' if ident in [MAPPING_CATEGORY, TASK_SOURCE,PARAMETER_SNAPSHOT] else 'input',
                             'rule': '；'.join(rule), 'dependencies': deps}
        row['persistence'] = persist
        row['examples'] = {'valid': ['使用准确分类IMPORT fieldId、taskId及recordId形成可核引用，字段值完整且来源只写一次。'],
                           'invalid': ['FOLLOWUP/异分类/失效fieldId、同手机号猜关联、伪造任务来源或用无权任务提交，拒绝。']}
        target = b if ident in [TASK_SOURCE,PARAMETER_SNAPSHOT] else p
        target['fields'] = [f for f in target['fields'] if f['id'] != ident] + [row]
        fields[ident] = row

    field(MAPPING_CATEGORY, 'AI参数映射关联的实际分类', 'aiScene', 'importFieldCategoryId', 'string', '与当前场景实际业务分类相同的稳定categoryId', False,
          '本次保存受控业务参数映射时必需；不是另一个用户可选分类',
          ['由场景实际关联分类派生并与importFieldMappingSchema=1一起保存；不能用它绕开实际分类关联。',
           '实际分类变化后旧映射须重新核fieldId；不保一套自定义名称/类型/选项，不迁移旧导入历史。'],
          {'kind': 'stored', 'write_when': '本场景分类/参数映射明确保存成功时与同次场景修订保存；导入预检捕获该依据。'},
          ['CHECK-PLAT-AI-IMPORT-FIELD-MAPPING'], ['FIELD-PLAT-AI-CATEGORY'])
    field(MAPPINGS, 'AI业务导入字段到供应商参数映射', 'aiScene', 'importFieldMappings', 'array', '[{fieldId,parameter,required}]；受控格式importFieldMappingSchema=1', False,
          '配置场景业务参数映射时提供；可无额外业务参数映射，实际分类IMPORT仍完整导入',
          ['fieldId只可引用实际关联分类有效IMPORT，排除FOLLOWUP、异分类、失效和同名猜配；业务名称/类型/选项/编码/分类必填从分类读取。',
           'parameter/重复或固定项冲突按原专业参数约束；required只表达供应商参数需值，不能取消分类必填。',
           '固定供应商项保原platformInputRows/厚朴只读定义，必要Binglan importFixedParameters沿原固定默认；不自由复制第二套业务字段。'],
          {'kind': 'stored', 'write_when': '有原AI专业场景配置权者明确保存后与importFieldCategoryId/schema标识同次更新；新导入捕获映射快照，旧业务/专业历史不追改。'},
          ['CHECK-PLAT-AI-IMPORT-FIELD-MAPPING'], [MAPPING_CATEGORY, 'FIELD-FLOW-CATEGORY-IMPORT-REFS'],
          '仅原AI场景专业配置权限内保存；业务分类维护或任务导入资格不自动授参数配置权。')
    field(TASK_SOURCE, '统一业务的准确任务导入来源', 'BusinessRecord', 'taskImportSource', 'object',
          '{method,taskId,aiSceneId,categoryId,tenantId,batchId,targetFingerprint,parameterMappingFingerprint}；仅本次AI/PRED任务新导入', True,
          '新AI/预外呼任务内DIRECT导入业务必有；客户维护或旧历史不伪造此来源',
          ['由当前准确任务、方法、场景、租户及同请求批次捕获；AI固定当前任务+适配场景，PRED固定任务+本次分类。',
           '保存全部IMPORT规范值及本次字段定义/来源/参数快照、五档等级并建DIRECT周期；UI列映射在导入前统一校验，不承诺列原文/UI映射作为业务字段持久化，不创建run/node或按手机号认领旧业务。',
           '新任务名单只读投影本账本来源，统一写入不再新建原生名单行或重复提交供应商；任务/来源/权限变化须重验。'],
          {'kind': 'stored', 'write_when': '本次统一导入同请求明确成功时，与业务、直接周期、原始证据、字段快照及等级同次保存；未知先核原请求，不另造业务或周期。'},
          ['CHECK-FLOW-AI-TASK-DIRECT-IMPORT', 'CHECK-FLOW-PRED-TASK-DIRECT-IMPORT', 'CHECK-FLOW-TASK-IMPORT-REPLAY'],
          ['FIELD-FLOW-RECORD-ID', 'FIELD-FLOW-CATEGORY-ID', 'FIELD-FLOW-IMPORT-ORIGINAL', 'FIELD-FLOW-EXECUTION-PRIORITY', 'FIELD-PLAT-TASK-ID', 'FIELD-PLAT-AI-SCENE-ID'])
    field(PARAMETER_SNAPSHOT, '任务导入单行业务参数快照', 'BusinessRecord', 'taskImportParameterSnapshot', 'object',
          '{fingerprint,mappings,parameters}；依据本条归一后IMPORT值校验/生成，不代表供应商已接收', True,
          '任务导入存在当前参数映射时形成准确单行快照；不从其他行/手机号借值',
          ['从当前实际分类归一后的本行值和受控映射生成，保0/false与未提供语义；fingerprint与本次source参数映射依据一致，不能跨行或读取时替换为最新配置。',
           'originalImportSnapshot.taskImportSource及originalImportSnapshot.taskImportParameterSnapshot与规范值/字段定义快照同次封存，批次保存同来源/参数映射配置；保存快照不触发供应商提交。'],
          {'kind':'stored','write_when':'统一导入同次成功时，按本行已验证的规范值保存record.taskImportParameterSnapshot及originalImportSnapshot.taskImportParameterSnapshot；旧行和已发生导入不重新计算覆盖。'},
          ['CHECK-PLAT-AI-IMPORT-FIELD-MAPPING','CHECK-FLOW-AI-TASK-DIRECT-IMPORT','CHECK-FLOW-TASK-IMPORT-REPLAY'],[TASK_SOURCE,MAPPINGS,'FIELD-FLOW-IMPORT-VALUES'])
    field(PROJECTION_RECORD, '专业任务视图的统一业务回链', 'ProfessionalTaskListRow', 'recordId', 'string', '来自本任务准确来源统一记录的稳定recordId；旧原生行可没有', True,
          '本轮新统一业务投影行必有；旧行无可靠引用时保留其原历史身份',
          ['只读按record.taskImportSource和原任务/对象读权投影；不从手机号、姓名或最近一次通话猜回链。',
           '只读投影不新持久专业行/第二账本、不改业务更新时间或供应商受理/拨打计数；旧专业数据继续按其原身份查询。'],
          {'kind': 'transient', 'write_when': '进入准确有权任务视图时从统一账本只读派生，recordId回到同一统一记录；不落第二份专业业务行或持久businessRef。'},
          ['CHECK-FLOW-AI-TASK-DIRECT-IMPORT', 'CHECK-FLOW-PRED-TASK-DIRECT-IMPORT', 'CHECK-FLOW-TASK-IMPORT-REPLAY'], [TASK_SOURCE, 'FIELD-FLOW-RECORD-ID'])

    uses = {
        'LOCAL-FLOW-IMPORT-PREVIEW': [TASK_SOURCE, MAPPING_CATEGORY, MAPPINGS, 'FIELD-PLAT-TASK-ID', 'FIELD-PLAT-AI-SCENE-ID'],
        'LOCAL-FLOW-IMPORT-COMMIT': [TASK_SOURCE, PARAMETER_SNAPSHOT, PROJECTION_RECORD],
        'LOCAL-FLOW-QUERY': [TASK_SOURCE], 'LOCAL-FLOW-DETAIL': [TASK_SOURCE,PARAMETER_SNAPSHOT], 'LOCAL-FLOW-BATCH-READ': [TASK_SOURCE,PARAMETER_SNAPSHOT],
        'LOCAL-PLAT-AI-SCENE-QUERY': [MAPPING_CATEGORY, MAPPINGS, 'FIELD-FLOW-CATEGORY-IMPORT-REFS'],
        'LOCAL-PLAT-AI-SCENE-SAVE': [MAPPING_CATEGORY, MAPPINGS, 'FIELD-FLOW-CATEGORY-IMPORT-REFS'],
        'LOCAL-PLAT-AI-LIST-IMPORT': [MAPPING_CATEGORY, MAPPINGS, TASK_SOURCE, PARAMETER_SNAPSHOT, PROJECTION_RECORD, 'FIELD-FLOW-CATEGORY-ID', 'FIELD-FLOW-IMPORT-VALUES', 'FIELD-FLOW-IMPORT-ORIGINAL', 'FIELD-FLOW-EXECUTION-PRIORITY', 'FIELD-FLOW-HANDLING-MODE', 'FIELD-FLOW-DIRECT-CYCLE-ID', 'FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP'],
        'LOCAL-PLAT-AI-IMPORT-TEMPLATE': [MAPPING_CATEGORY, MAPPINGS, 'FIELD-FLOW-CATEGORY-IMPORT-REFS'],
        'LOCAL-PLAT-AI-TASK-QUERY': [TASK_SOURCE, PROJECTION_RECORD, 'FIELD-FLOW-IMPORT-VALUES'],
        'LOCAL-PLAT-AI-IMPORT-HISTORY': [TASK_SOURCE, PROJECTION_RECORD],
        'LOCAL-PLAT-CLOUD-TASK-IMPORT': [TASK_SOURCE, PROJECTION_RECORD, 'FIELD-FLOW-CATEGORY-ID', 'FIELD-FLOW-CATEGORY-IMPORT-REFS', 'FIELD-FLOW-IMPORT-VALUES', 'FIELD-FLOW-IMPORT-ORIGINAL', 'FIELD-FLOW-EXECUTION-PRIORITY', 'FIELD-FLOW-HANDLING-MODE', 'FIELD-FLOW-DIRECT-CYCLE-ID', 'FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP'],
        'LOCAL-PLAT-CLOUD-TASK-QUERY': [TASK_SOURCE, PROJECTION_RECORD, 'FIELD-FLOW-IMPORT-VALUES'],
        'LOCAL-PLAT-CUSTOMER-IMPORT': [TASK_SOURCE, PROJECTION_RECORD],
    }
    for lid, ids in uses.items():
        l = locals_[lid]
        l['inputs'] = unique(l['inputs'] + ids)
        l['steps'][-1]['reads'] = unique(l['steps'][-1]['reads'] + ids)
    for lid in ['LOCAL-PLAT-AI-LIST-IMPORT', 'LOCAL-PLAT-CLOUD-TASK-IMPORT', 'LOCAL-FLOW-IMPORT-COMMIT']:
        l = locals_[lid];l['outputs'] = unique(l['outputs'] + [TASK_SOURCE, PARAMETER_SNAPSHOT,'FIELD-FLOW-RECORD-ID', 'FIELD-FLOW-DIRECT-CYCLE-ID'])
        l['steps'][-1]['writes'] = unique(l['steps'][-1]['writes'] + [TASK_SOURCE, PARAMETER_SNAPSHOT,'FIELD-FLOW-RECORD-ID', 'FIELD-FLOW-DIRECT-CYCLE-ID'])
    for lid in ['LOCAL-PLAT-AI-TASK-QUERY', 'LOCAL-PLAT-CLOUD-TASK-QUERY', 'LOCAL-PLAT-AI-IMPORT-HISTORY']:
        l=locals_[lid];l['outputs']=unique(l['outputs']+[PROJECTION_RECORD]);l['steps'][-1]['writes']=unique(l['steps'][-1]['writes']+[PROJECTION_RECORD])
    l=locals_['LOCAL-PLAT-AI-SCENE-SAVE'];l['outputs']=unique(l['outputs']+[MAPPING_CATEGORY,MAPPINGS]);l['steps'][-1]['writes']=unique(l['steps'][-1]['writes']+[MAPPING_CATEGORY,MAPPINGS])
    l['steps'][1]['action']='按场景实际关联分类读取IMPORT，业务字段名称/类型/选项/编码/分类必填只引用不复制；配置fieldId→供应商parameter映射及需值约束，schema=1与分类身份同次保存；固定供应商项沿原定义'
    l['steps'][2]['action']='当前修订成功才保存映射并刷新；分类变化、FOLLOWUP/异分类fieldId、固定项或重复参数冲突阻保存，保草稿；不改分类路由或旧导入历史'
    l['postconditions']=['实际分类IMPORT引用及供应商参数映射准确保存；无第二套自由业务字段定义，固定专业参数/来源规则及旧历史保留']
    locals_['LOCAL-PLAT-AI-IMPORT-TEMPLATE']['steps'][0]['action']='取当前任务准确场景关联分类的统一IMPORT schema及code/姓名/号码等系统必需项形成下载模板；FOLLOWUP不导入，供应商固定项按专业定义保留，不自由复制业务字段'
    ai=locals_['LOCAL-PLAT-AI-LIST-IMPORT'];ai['title']='AI任务内按分类字段导入统一DIRECT业务'
    ai['feature_ids']=unique(ai['feature_ids']+['FUNC-2036','FUNC-2037'])
    ai['preconditions']=['当前有效租户ADMIN及customer.import，实际AI模块/任务导入权和来源允许，场景关联分类有效且allowDirectFollowup显式允许；AI-only合法管理员无需Cloud菜单或Cloud授权']
    ai['postconditions']=['当前准确任务+场景的新DIRECT业务/周期及完整IMPORT值/快照/来源/等级形成；专业视图按recordId只读投影，无新原生行或重复供应商提交']
    ai['steps'][0]['action']='只读任务概览不物化意向草稿；任务内导入从准确scene实际分类读取共同IMPORT schema、code/姓名/号码等系统必需列，校必填/类型/选项/映射及统一重复编码；排除FOLLOWUP和场景自由复制定义'
    # Preserve the already audited contact/AI-only and asynchronous invalidation obligations.
    ai['steps'][2]['action']='异步返回后重核账号/tenant/ADMIN+customer.import、AI模块、任务/场景/分类/映射/文件及原来源锁定；当前上下文与预检一致才同请求写一次统一业务账本/DIRECT周期，保存原始联系号码（联系协调用规范明文，非源CSV列原文副本）、实际操作人、全部规范字段及taskImportSource；只读专业投影recordId，不新写原生名单或再提交供应商；不把保存说成已受理/拨打'
    ai['steps'][2]['action']+='；AI-only使用共享业务服务的精确账号/tenant/task导入及同源请求核对范围，schema只读，完成/异常恢复原访问，不持久授Cloudcap/成员/菜单，不能借此配置/起呼或访问其他Cloud动作'
    pred=locals_['LOCAL-PLAT-CLOUD-TASK-IMPORT'];pred['title']='预外呼任务统一业务导入及原IVR名单边界'
    # This original wrapper is shared with IVR. Unified-record creation belongs
    # to the existing common IMPORT locals, not to an enlarged IVR capability.
    pred['feature_ids']=[f for f in pred['feature_ids'] if f not in ['FUNC-2036','FUNC-2037']]
    pred['preconditions']=['预外呼新统一手工导入须ADMIN+customer.import及原Cloud模块/任务导入与来源权、分类允许DIRECT；接口来源任务不得混手工；原IVR名单按原方式权限处理，不扩成DIRECT']
    pred['postconditions']=['预外呼创建当前准确任务的统一DIRECT业务/周期和完整IMPORT字段/快照/来源/等级，专业名单只读投影；原IVR/旧专业历史保留各自事实']
    pred['steps'][0]['action']='预外呼明确本次有效且允许DIRECT分类，按共同IMPORT+code/姓名/号码基础schema逐行校类型/选项/必填/映射/重复编码；FOLLOWUP排除；任务及接口/手工来源锁定继续。IVR仍原专业校验，不创建本轮DIRECT'
    pred['steps'][1]['action']='预外呼默认DIRECT/PREDICTIVE并固定当前准确taskId与租户/修订，五档默认中；不另选seat/person，不建run/node；相关字段/任务/来源变化使旧确认失效'
    pred['steps'][1]['action']+='；原配置校验完整且状态/来源允许的待分配客户任务可导入，包括既有flat/alictiCreateDraft配置型任务，不要求先有原生名单或旧目录已发布方案；缺配置/无权/停用/在途仍拒绝，不伪造供应商发布/受理'
    pred['steps'][2]['action']='预外呼同请求只写一次统一业务及直接周期，完整值/快照/taskImportSource保存；当前专业名单按recordId只读投影，不新建原生行或重提供应商；未知核原请求。IVR及旧数据维持原独立专业结果'
    original=locals_['LOCAL-PLAT-CUSTOMER-IMPORT']
    original['steps'][2]['action']='保原人工/接口及其他专业名单的准确实体、来源锁定与批次；本轮AI/预外呼任务新统一导入按对应任务入口写统一账本并投影，不把旧专业名单自动迁入或按同手机号回链'
    original['postconditions']=['原人工/接口专业历史保原事实；本轮AI/PRED任务新导入采用共同分类IMPORT并形成DIRECT业务，不自动模板启动或迁移旧名单']
    for lid in ['LOCAL-PLAT-AI-TASK-QUERY','LOCAL-PLAT-CLOUD-TASK-QUERY','LOCAL-PLAT-AI-IMPORT-HISTORY']:
        clause='本轮新AI/PRED业务仅按准确taskImportSource和原任务读取权投影recordId/必要字段；旧专业名单/历史依其原身份显示，不能按手机号补链，不以业务记录数改写供应商受理或通话事实'
        l=locals_[lid]
        if clause not in l['steps'][-1]['action']:l['steps'][-1]['action']+='；'+clause
        mode_clause='投影办理模式及详情副标题读当前有权业务的真实handlingMode；初次DIRECT后显式启用流程可为TEMPLATE，不能以导入来源硬写DIRECT；转出方仅本方截止历史'
        if mode_clause not in l['steps'][-1]['action']:l['steps'][-1]['action']+='；'+mode_clause
    for lid in ['LOCAL-FLOW-IMPORT-PREVIEW','LOCAL-FLOW-IMPORT-COMMIT']:
        clause='客户维护与AI/PRED任务三入口共用IMPORT及code等系统必需校验；任务内默认DIRECT且固定准确task/scene、ADMIN+customer.import和原模块/来源准入，分类已绑模板也不建run/node；统一记录一次保存，专业视图只读投影'
        l=locals_[lid]
        if clause not in l['steps'][-1]['action']:l['steps'][-1]['action']+='；'+clause
    limits='共享读取/预检采用准确目标context.importLimits而非任意调用参数：保AI大众100行、厚朴150000行、其他2000行及16MB文件，预外呼2000行/1MB；超限明示分批且不截断，旧AI parser只作历史兼容不成第二新写入口'
    for lid in ['LOCAL-FLOW-IMPORT-PREVIEW','LOCAL-PLAT-AI-LIST-IMPORT','LOCAL-PLAT-CLOUD-TASK-IMPORT']:
        l=locals_[lid]
        if limits not in l['steps'][0]['action']:l['steps'][0]['action']+='；'+limits

    acs=[
        ('AC-2158','客户维护、AI任务及预外呼任务三入口共用实际分类启用IMPORT及code/姓名/号码等系统必需schema，下载/映射/必填/类型/选项/完整值保存一致；FOLLOWUP/异分类排除，不按手机号生成/认领。读取/预检按准确目标context.importLimits，保AI大众100/厚朴150000/其他2000行及16MB、PRED2000行/1MB，超限明示分批不截断。'),
        ('AC-2159','AI场景保存schema=1的importFieldCategoryId/importFieldMappings[{fieldId,parameter,required}]，业务名称/类型/选项/编码/分类必填只从实际分类引用，不复制自由字段；原固定供应商项保留，分类/映射变化失效旧预检，旧历史不迁移。'),
        ('AC-2160','允许DIRECT的AI/预外呼任务内新导入固定当前准确任务和必要AI场景，建统一业务及直接周期，保存完整字段/快照/taskImportSource/逐行参数快照/五档等级，原始证据/批次同源。配置完整且原状态/来源允许的待分配客户PRED任务不需先有原生名单或旧目录已发布方案。分类已绑模板仍可独立DIRECT，无run/node或自动起呼/转交。'),
        ('AC-2161','统一任务新导入只写一个业务账本，专业名单按准确recordId只读投影，不新写原生行或重复提交供应商；旧名单及来源保持，同手机号不补链。重复编码/同请求重复/未知核对不重复建业务/周期，不把保存当供应商已受理或拨打。'),
        ('AC-2162','任务内新统一DIRECT导入仍须当前租户ADMIN+customer.import及原模块/任务/来源资格，AI-only合法管理员不需Cloud菜单，ops只保原任务/历史读权不扩导入。预外呼接口来源不混手工；上下文/字段/映射变化及联系未知不绕原守卫。')]
    checks=[
        ('CHECK-FLOW-TASK-IMPORT-SCHEMA','LOCAL-FLOW-IMPORT-PREVIEW',['AC-2158'],'同分类配置文本/数字/日期/枚举等IMPORT和同名FOLLOWUP，三入口下载/映射并构造缺code/必填、非法类型/枚举、异分类与重复编码；构造各目标context.importLimits的行数/文件边界及越界。','同一IMPORT及系统必需项完整保存，FOLLOWUP不出现；按准确目标保专业容量，越界提示分批不截断；非法行有定位且不部分写入，不按手机号造编码/认领。'),
        ('CHECK-PLAT-AI-IMPORT-FIELD-MAPPING','LOCAL-PLAT-AI-SCENE-SAVE',['AC-2159'],'场景关联实际分类，保存fieldId→parameter/required，重开；构造FOLLOWUP、异分类、重复或固定项冲突，修改分类后复用旧预检。','schema=1/分类/映射准确回读，无复制的业务名称/类型定义；固定供应商项保留，非法映射或旧预检拒绝且保草稿，历史不改。'),
        ('CHECK-FLOW-AI-TASK-DIRECT-IMPORT','LOCAL-PLAT-AI-LIST-IMPORT',['AC-2160','AC-2162'],'AI任务合法ADMIN导入完整IMPORT/五档，分类既有模板；两行业务值分别18.5/0及false等校参数snapshot、原始证据和批次映射依据，不借别行。另核AI-only管理员、ops、异任务/租户、分类禁DIRECT及禁止手工来源。','合法task+scene只建一次统一DIRECT/周期/source，逐行参数与本行规范值相符、配置fingerprint一致，原始/批次快照可核；任务视图recordId准确、无新原生行/run/node。AI-only不需Cloud，ops或无权/来源/分类不符拒绝，不假供应商执行。'),
        ('CHECK-FLOW-PRED-TASK-DIRECT-IMPORT','LOCAL-PLAT-CLOUD-TASK-IMPORT',['AC-2160','AC-2162'],'配置完整且允许手工的待分配客户预外呼任务（含既有flat/alictiCreateDraft、原生名单0）选分类/完整IMPORT/等级，提交刷新；构造缺配置、接口来源、无权/异租户/停用/在途任务及分类关闭，另核原IVR边界。','合法配置型新task不需先有原生名单或旧已发布目录项，固定DIRECT/PRED业务及完整字段/来源/等级可回读；原守卫反例仍拒绝，无seat/person/模板、无新原生行或假供应商受理，IVR不扩DIRECT。'),
        ('CHECK-FLOW-TASK-IMPORT-REPLAY','LOCAL-FLOW-IMPORT-COMMIT',['AC-2161'],'三入口同请求重放/未知核对、同编码冲突、同手机号不同业务及旧专业行，比较统一账本/周期/原生名单与供应商提交次数；改任务/字段/映射后复用确认。','业务/周期同请求只建一次，未知先核原请求；专业视图只读recordId且不新增原生行/重复提交，旧同号不认领，已生效不假回滚，过期上下文拒绝。')]
    for aid,statement in acs:b['acceptance_updates']=[a for a in b['acceptance_updates'] if a['id']!=aid]+[{'id':aid,'statement':statement,'source_refs':['docs/exception-definitions.json#CHG-044-TASK-IMPORT'],'decision_refs':['CHG-044-TASK-IMPORT']}]
    for cid,lid,aids,procedure,expected in checks:
        target=b if lid.startswith('LOCAL-FLOW-') else p
        target['checks']=[c for c in target['checks'] if c['id']!=cid]+[{'id':cid,'acceptance_ids':aids,'procedure':procedure,'expected':expected,'task_import_revision':VERSION}]
        locals_[lid]['test_refs']=unique(locals_[lid]['test_refs']+[cid])
    for d in [b,p]:
        for feature in d['features']:
            aids={'FUNC-2002':['AC-2158','AC-2159','AC-2160','AC-2161','AC-2162'],'FUNC-2019':['AC-2159'],'FUNC-2036':['AC-2158','AC-2160','AC-2161','AC-2162'],'FUNC-2037':['AC-2160'],'FUNC-2039':['AC-2161']}.get(feature['id'],[])
            if aids:feature['acceptance_ids']=unique(feature['acceptance_ids']+aids);feature['source_refs']=unique(feature['source_refs']+['docs/exception-definitions.json#CHG-044-TASK-IMPORT'])
            if feature['id']=='FUNC-2036':
                feature['name']='按共同分类字段预检并导入统一业务'
                feature['description']='客户维护与AI/预外呼任务三入口共用分类IMPORT和code等系统必需校验。客户维护按原DIRECT/TEMPLATE；任务内固定准确任务/必要scene并默认DIRECT，须ADMIN+customer.import、原模块/任务/来源及分类允许，保存完整值/快照/taskImportSource/等级和直接周期。专业名单只读recordId投影，不写第二账本/原生行或重复提交供应商，旧历史不迁移。'
            if feature['id']=='FUNC-2031':
                feature['description']='明确发起同租户DIRECT或TEMPLATE当前CALL的AI/人工/预外呼，重核准确资源/场景、本人资格、串行和联系限制。人工待分配不先起呼，AI/PRED无独立责任人要求；同组AI/预外呼按五档/FIFO统一总序逐条核验及反馈，不抢占在途。直接周期完成后显式下一方式建立新周期，旧事实保持。'
            if feature['id']=='FUNC-2019':
                feature['description']='在现有有权AI场景/分类关联入口按准确场景维护实际分类引用及IMPORT到供应商参数映射；业务字段定义只来自分类，固定专业项保留，不等于模板实际路由或新增导入/专业权限。'
                feature['source_page_ids']=unique(feature.get('source_page_ids',[])+['PAGE-2110'])
            if feature['id']=='FUNC-2002':feature['field_ids']=unique(feature.get('field_ids',[])+FIELD_IDS)
            if feature['id']=='FUNC-2019':feature['field_ids']=unique(feature.get('field_ids',[])+[MAPPING_CATEGORY,MAPPINGS,'FIELD-FLOW-CATEGORY-IMPORT-REFS'])
    for l in locals_.values():
        if l['id'] not in uses:continue
        l['global_rule_ids']=unique(l['global_rule_ids']+['GR-TASK-UNIFIED-IMPORT'])
        l['steps'][-1]['rule_ids']=unique(l['steps'][-1]['rule_ids']+['GR-TASK-UNIFIED-IMPORT'])
        if l['id'].startswith('LOCAL-PLAT-'):
            for branch in l['branches']:
                if branch['condition'].startswith('前提、字段'):branch['result']='；'.join(l['postconditions'])
        target=b if l['id'].startswith('LOCAL-FLOW-') else p
        for cid in l['test_refs']:
            c=next((x for x in target['checks'] if x['id']==cid),None)
            if not c or cid in [x[0] for x in checks]:continue
            c['procedure']='按当前三入口统一导入规则：'+l['trigger']+'；'+'；'.join(s['action'] for s in l['steps'])+'。构造无权、来源锁定、字段/任务/窗口变化及失败/未知。'
            c['expected']='；'.join(l['postconditions'])+'；原资格/历史/未知守卫保持，不把新统一记录或投影说成供应商已受理/拨打。'
        used=l['inputs']+l['outputs']+[v for s in l['steps'] for v in s['reads']+s['writes']]+[v for z in l['branches'] for v in z['field_ids']]
        l['field_ids']=unique(used)

    page_new={
        'UI-PAGE-2103':[MAPPING_CATEGORY,MAPPINGS,TASK_SOURCE,PARAMETER_SNAPSHOT,PROJECTION_RECORD,'FIELD-FLOW-CATEGORY-ID','FIELD-FLOW-EXECUTION-PRIORITY','FIELD-FLOW-HANDLING-MODE','FIELD-FLOW-IMPORT-VALUES'],
        'UI-PAGE-2110':[MAPPING_CATEGORY,MAPPINGS,'FIELD-FLOW-CATEGORY-IMPORT-REFS'],
        'UI-PAGE-2205':[TASK_SOURCE,PROJECTION_RECORD,'FIELD-FLOW-CATEGORY-ID','FIELD-FLOW-CATEGORY-IMPORT-REFS','FIELD-FLOW-EXECUTION-PRIORITY','FIELD-FLOW-HANDLING-MODE','FIELD-FLOW-IMPORT-VALUES'],
        'UI-PAGE-2204':[TASK_SOURCE], 'UI-PAGE-2226':[TASK_SOURCE], 'UI-PAGE-2227':[TASK_SOURCE,PARAMETER_SNAPSHOT]}
    for page in u['ui']['pages']:
        if page['id'] in ['UI-PAGE-2103','UI-PAGE-2205']:
            page['local_logic_ids']=unique(page['local_logic_ids']+['LOCAL-FLOW-IMPORT-PREVIEW','LOCAL-FLOW-IMPORT-COMMIT'])
        if page['id'] in page_new:
            for ident in page_new[page['id']]:
                if ident in [f['field_id'] for f in page['fields']]:continue
                source=fields[ident];base=copy.deepcopy(page['fields'][0]);readonly=ident in [TASK_SOURCE,PARAMETER_SNAPSHOT,PROJECTION_RECORD,MAPPING_CATEGORY,'FIELD-FLOW-HANDLING-MODE','FIELD-FLOW-IMPORT-VALUES'] or ident==MAPPINGS and page['id']!='UI-PAGE-2110' or ident=='FIELD-FLOW-CATEGORY-ID' and page['id']=='UI-PAGE-2103'
                base.update(field_id=ident,label=source['name'],component_id='UI-COMP-READONLY' if readonly else 'UI-COMP-SELECT',
                            help_text='；'.join(source['validation_rules']),visible_when='本页准确任务/场景/业务读取或对应有权导入/配置表单展开时；无对象权不显示值。',
                            editable_when='只读准确来源或投影，不授维护权。' if readonly else '当前对应动作及字段权限均通过；新统一任务导入须ADMIN+customer.import和原模块/任务/来源权，映射编辑另核原专业配置权。',
                            required_indicator=source['required_when'],validation_timing='预检/正式提交分别重核；类别/字段/任务/映射/身份变化失效旧确认。',error_message='保原输入并说明准确字段/来源/权限/旧确认问题，不首项猜补或按手机号认领。',formatting=source['format'])
                if ident=='FIELD-FLOW-HANDLING-MODE':base.update(help_text='本任务入口固定DIRECT，不依赖模板，不因此绕分类允许及原权限。',formatting='固定DIRECT，无run/node，不提供切换TEMPLATE选项。')
                if ident in [TASK_SOURCE,PARAMETER_SNAPSHOT]:base.update(visible_when='仅在有权业务来源/字段证据详情或参数错误定位摘要展开时显示，不在普通任务列表或导入主表铺原始指纹。',formatting='显示来源任务/场景/批次及本次字段→参数和值摘要；内部fingerprint按需追溯，不作为用户输入。')
                if ident==PROJECTION_RECORD:base.update(formatting='复用现有业务详情回链，以业务编码/来源标识展示，recordId作稳定关联键，不新增可编辑编号。')
                page['fields'].append(base)
            page['components']=unique(page['components']+['UI-COMP-READONLY','UI-COMP-SELECT'])
            if page['id'] in ['UI-PAGE-2103','UI-PAGE-2205']:
                page['feature_ids']=unique(page['feature_ids']+['FUNC-2036','FUNC-2037'])
        for interaction in page['interactions']:
            related=[locals_[lid] for lid in interaction['local_logic_ids'] if lid in locals_]
            if not any(l['id'] in uses for l in related):continue
            interaction['behavior']='；'.join('；'.join(s['action'] for s in l['steps']) for l in related)+'；失败/未知保输入和准确请求，不自动起呼或新增原生业务行。'
            interaction['test_refs']=unique(interaction['test_refs']+[t for l in related for t in l['test_refs']])
        for field_view in page['fields']:
            if field_view['field_id']=='FIELD-FLOW-IMPORT-ORIGINAL':field_view.update(label='首次导入事实快照',help_text='保存首次规范值及字段定义/来源/参数快照；UI列映射在导入前统一校验，不承诺源CSV/Excel列原文或UI映射作为业务字段持久化。',formatting='当前有权业务的首次规范值及当时定义/来源/参数摘要，不显示不存在的原列原文。')
            if page['id'] in ['UI-PAGE-2103','UI-PAGE-2205'] and field_view['field_id']=='FIELD-FLOW-HANDLING-MODE':field_view.update(help_text='本任务新导入窗口固定DIRECT；已导入任务投影及详情只读当前有权业务真实handlingMode，后续显式启用流程可为TEMPLATE。',formatting='新导入：DIRECT且不提供切换模板；投影/详情：按有权记录真实DIRECT/TEMPLATE展示，旧原生行按历史来源标识，不假定DIRECT。')
        page['test_refs']=unique(page['test_refs']+[t for lid in page['local_logic_ids'] if lid in locals_ for t in locals_[lid]['test_refs']])
    pages={page['source_page_ids'][0]:page for page in u['ui']['pages']}
    # Keep current page facts as projections of the same UI; stale prior person-only
    # and native-only import summaries must not become a competing current source.
    for page in pf['pages']:
        ui=pages.get(page['id'])
        if not ui:continue
        page['local_logic_ids']=unique(page.get('local_logic_ids',[])+ui['local_logic_ids'])
        page['interaction_rules']=[a['behavior'] for a in ui['interactions']]
        if page['id'] in ['PAGE-2103','PAGE-2110','PAGE-2205','PAGE-2204','PAGE-2226','PAGE-2227']:
            page['current_behavior']='；'.join(a['behavior'] for a in ui['interactions'])
            page['canonical_field_ids']=unique(page.get('canonical_field_ids',[])+[f['field_id'] for f in ui['fields']])
            if page['id'] in ['PAGE-2103','PAGE-2205']:page['function_ids']=unique(page['function_ids']+['FUNC-2036','FUNC-2037'])
    for f in p['fields']:
        if f['id']=='FIELD-PLAT-AI-PARAMS':
            clause='业务IMPORT定义只从实际分类引用，场景只保存独立fieldId→parameter映射；原固定专业参数/机器人继续，不复制另一套业务字段。'
            f['validation_rules']=unique(f['validation_rules']+[clause]);f['derivation']['rule']+='；'+clause if clause not in f['derivation']['rule'] else ''
    for f in b['fields']:
        if f['id']=='FIELD-FLOW-IMPORT-ORIGINAL':
            f.update(name='首次导入事实快照',format='批次/首次规范字段值/当时字段定义/准确来源与任务参数快照/发生时间')
            clause='三入口保存规范值及本次字段定义/来源/参数快照；UI列映射仅在导入前校验，不承诺CSV/Excel列原文或UI映射作为业务字段持久化。taskImportSource及taskImportParameterSnapshot按实际键同次封存，旧专业行不按手机号认领。'
            f['validation_rules']=[r for r in f['validation_rules'] if '原始/规范' not in r and '系统列原始' not in r]
            f['validation_rules']=unique(f['validation_rules']+[clause])
            f['derivation']={'kind':'system','rule':'共同预检后的规范值、字段定义/来源/任务参数事实同次封存；不把UI映射或源列原文存为业务字段。','dependencies':['FIELD-FLOW-IMPORT-VALUES','FIELD-FLOW-CATEGORY-ID']}
            f['examples']={'valid':['首次规范sc=1及当时字段定义封存；当前更正sc=2后首次事实仍为1。'],'invalid':['更正时覆盖首次快照，或把未保存的原CSV列原文/UI映射当作已持久事实。']}
    # Current page mappings use canonical field identities, while original source
    # evidence and historical page records stay untouched.
    for page in pf['pages']:
        ui=pages.get(page['id'])
        if not ui or page.get('status')=='superseded':continue
        present={f.get('id',f.get('field_id')) for f in page['fields']}
        for item in ui['fields']:
            ident=item['field_id']
            if ident not in present:
                page['fields'].append({'id':ident,'name':fields[ident]['name'],'local_logic_ids':[lid for lid in ui['local_logic_ids'] if lid in locals_ and ident in locals_[lid]['field_ids']]})
                present.add(ident)
    permission_note='Step44新任务内统一DIRECT导入须ADMIN+customer.import及原模块/任务/来源和分类准入；运营仅保原任务/旧历史读权及其他原动作，不扩统一写账本或Cloud权限。'
    for permission in u.get('permissions_summary',{}).get('pages',[]):
        if permission.get('page_id') not in ['PAGE-2103','PAGE-2205']:continue
        if permission_note not in permission.get('operations',''):permission['operations']=permission.get('operations','')+'；'+permission_note
    for issue in p.get('engineering_issue_crosswalk',[]):
        if '分配只安排合法责任人' in issue.get('product_rule',''):issue['product_rule']=issue['product_rule'].replace('分配只安排合法责任人','按方式安排任务或人工分配方式/坐席，无独立责任人输入；任务三入口同源IMPORT及DIRECT资格继续')
    for question in b.get('engineering_questions',[])+p.get('engineering_questions',[]):
        if question['id']=='ENG-FLOW-PERSISTENCE':
            clause='Step44统一taskImportSource/逐行参数快照/原始与批次依据及只读recordId投影的真实事务、隔离和同请求唯一约束须工程映射，不持久第二份专业业务行。'
            if clause not in question['question']:question['question']+=' '+clause
        if question['id']=='EQ-PLAT-PROFESSIONAL':
            clause='Step44供应商固定导入项/参数映射/各目标容量与配置型待分配客户任务的真实适配、后续执行证据继续待工程核证，统一账本/投影不是供应商导入受理证明。'
            if clause not in question['question']:question['question']+=' '+clause
    statement='三入口共用实际分类IMPORT及系统必需schema；AI场景只引用并做供应商参数映射，任务内新导入以原ADMIN+customer.import/模块/任务/来源及分类DIRECT准入创建统一业务和直接周期。taskImportSource精确溯源，专业名单按recordId只读投影，不新写原生行或再提交供应商；旧历史不迁移、同号不认领。'
    b['supersessions']=[s for s in b['supersessions'] if s['id']!='CHG-044-TASK-IMPORT']+[{'id':'CHG-044-TASK-IMPORT','old':'任务内导入只读取场景独立字段/参数，落专业名单，与统一业务各自分开且不形成业务记录。','current':statement,'evidence_refs':['docs/exception-definitions.json#CHG-044-TASK-IMPORT']}]
    b['task_import_delta']={'version':VERSION,'authorization':AUTH,'field_ids':FIELD_IDS,'acceptance_ids':[a[0] for a in acs],'check_ids':[c[0] for c in checks],'formal_approval':False,'production_verified':False}
    rules=[r for r in rules if r['id']!='GR-TASK-UNIFIED-IMPORT']+[{'id':'GR-TASK-UNIFIED-IMPORT','name':'同源业务字段与任务DIRECT统一账本','statement':statement,'source_refs':['docs/exception-definitions.json#CHG-044-TASK-IMPORT'],'source_keys':[],'test_refs':[c[0] for c in checks]}]
    return b,p,u,pf,rules
