"""Step46 provider-scene contracts and Step47 UI correction; documentation only."""
import copy

VERSION = '2.0.0-current-20261101-step46'
AUTH = 'inputs/ai-provider-field-dialog-authorization-20261101.json'
UX_VERSION = '2.0.0-current-20261101-step47'
UX_AUTH = 'inputs/ai-add-field-entry-authorization-20261101.json'
MAPPING_CATEGORY = 'FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY'
MAPPINGS = 'FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS'
PARAMETERS = 'FIELD-FLOW-TASK-IMPORT-PARAMETERS'
CHECK = 'CHECK-PLAT-AI-IMPORT-FIELD-MAPPING'


def unique(values):
    return list(dict.fromkeys(values))


def append_clause(action, clause):
    return action.replace('；' + clause, '') + '；' + clause


def apply(b, p, u, pf, rules):
    fields = {f['id']: f for d in [b, p] for f in d['fields']}
    locals_ = {l['id']: l for d in [b, p] for l in d['locals']}
    category = fields[MAPPING_CATEGORY]
    category['validation_rules'] = [
        '由场景实际关联分类派生，与importFieldMappingSchema=2及当前scene/platform配置同次保存；不能另选分类绕开实际关联。',
        'IMPORT_FIELD只引用当前分类有效IMPORT；CUSTOM_COLUMN仅本scene/platform额外供应商列，均不能改写分类定义；分类变化重核引用，不迁移历史。']
    category['derivation']['rule'] = '；'.join(category['validation_rules'])
    category['persistence']['write_when'] = '主场景明确保存并通过当前权限/修订/分类/平台校验时同次保存；子弹窗确认仅更新父草稿。'
    mapping = fields[MAPPINGS]
    mapping.update(name='AI场景供应商参数与专属导入列配置',
                   format='schema=2；importFieldMappings[{id,source:IMPORT_FIELD|CUSTOM_COLUMN,fieldId?(仅引用),parameter,label,type:text|number|date,required}]，与importFieldCategoryId/importFieldPlatform及当前scene/platform绑定',
                   required_when='本次场景参数配置提供；未映射业务字段仍按分类完整导入，供应商必需项必须满足')
    mapping['validation_rules'] = [
        'IMPORT_FIELD.fieldId只引用实际分类有效IMPORT，排除FOLLOWUP、异分类、失效及同名猜配；业务名称/类型/选项/编码/分类必填从分类读取，不自由复制分类业务字段。',
        '配置按准确scene/platform独立，保存时系统写importFieldPlatform；其存在且不等当前platform时拒绝，用户不能手改绕过。parameter在本场景平台内唯一，允许相同fieldId映射多个不同parameter；平台切换不沿用另一供应商草稿或固定项。',
        'IMPORT_FIELD类型随源number/date，其余源类型包括datetime/phone/enum按text保完整规范值；label/type为本次映射元数据，不另立分类业务定义。CUSTOM_COLUMN独立定义label、text/number/date、required，提供稳定id，不增加固定值配置。',
        'required只增加本参数需值约束，不能取消分类必填；参数格式/保留名/重复及原固定必需项按当前供应商校验，原platformInputRows、厚朴只读定义及必要冰兰固定项保留。',
        '协议固定参数未显式映射时，name/customerName/calleeNo/remark按精确协议名绑定系统值；其余成为当前scene/platform默认专业导入列，customFields保fixed/system标志，required不减；不要求把旧固定项重复手录。',
        '旧schema=1只读兼容；legacy customInputFields未被显式parameter覆盖时，以legacy-custom-<code>确定性CUSTOM_COLUMN读取，保原名称/类型/必填。只有父场景明确保存升级schema=2才清旧重复定义，取消不改旧配置。']
    mapping['derivation'] = {'kind':'input','rule':'；'.join(mapping['validation_rules']), 'dependencies':[MAPPING_CATEGORY,'FIELD-PLAT-AI-SUPPLIER','FIELD-FLOW-CATEGORY-IMPORT-REFS']}
    mapping['persistence'] = {'kind':'stored','write_when':'选择和配置在子弹窗独立草稿；确认通过才更新父草稿，取消/关闭不改父草稿。主场景明确保存并重核权限/修订/scene/platform/category后，schema=2/importFieldPlatform与当前映射同次持久化；旧导入快照不追改。'}
    mapping['lifecycle'] = [
        {'state':'读取/草稿','behavior':'场景主表仅摘要/入口；选择IMPORT和参数/专属列配置分别打开弹窗，均不直接写场景。'},
        {'state':'子弹窗确认/取消','behavior':'确认校验通过才回填父草稿；取消/关闭不改父草稿及已保存配置，不能用旧弹窗回填已切换平台/分类。'},
        {'state':'主场景保存','behavior':mapping['persistence']['write_when']},
        {'state':'历史','behavior':'schema=1/legacy原事实只读兼容；历史导入继续使用当时定义/规范值和参数快照，不读取时升级。'}]
    mapping['examples'] = {'valid':['同一预算fieldId在冰兰映射budget、在另一场景/平台映射amount，或本场景映射多个不同参数；专属visitDate列按date导入。'],
                           'invalid':['切平台带入另一家的参数、重复parameter、FOLLOWUP引用、取消弹窗仍改父草稿，或专属值写入record.fields。']}
    parameter = fields[PARAMETERS]
    parameter.update(name='任务导入单行供应商参数及专属列快照',
                     format='{fingerprint,mappings,parameters,customFields,customValues}；按本行规范业务值及独立供应商列值生成，保存不代表供应商已接收')
    parameter['validation_rules'] = [
        'task context.fields=businessFields+customFields供模板/列映射；businessFields.required合并供应商需值约束，businessRequired保原分类基础必填，只改本次上下文不改字段库。归一行拆fields业务与customValues独立字典，record.fields永不混供应商值；专属列不进入分类IMPORT/FOLLOWUP或路由条件。',
        "customFields仅本scene/platform派生，key='__AI_CUSTOM__'+encode(platform)+'__'+encode(sceneId)+'__'+encode(mapping.id)，usage=SUPPLIER_PARAMETER/source=AI_CUSTOM；key编码连下划线也转义，避免platform/scene/id分隔碰撞；旧opaque key快照不回写。保本次label/type/required及专业fixed/system标志，专属text/number/date依定义校验，不从其他行借值。",
        '从本行规范值和准确scene/platform/category映射产生parameters，保0/false及空值语义；fingerprint绑定本次映射/字段定义，不跨行、不按当前配置重绘历史。',
        'record.taskImportParameterSnapshot及originalImportSnapshot.taskImportParameterSnapshot同封customFields/customValues/mappings/parameters/fingerprint，originalImportSnapshot.taskImportSource同源；批次映射快照扩customFields，供应商专属定义/值不写业务字段库。']
    parameter['derivation']['rule'] = '；'.join(parameter['validation_rules'])
    parameter['persistence'] = {'kind':'stored','write_when':'统一导入同次成功时保存本行record.taskImportParameterSnapshot及originalImportSnapshot.taskImportParameterSnapshot；批次保本次映射及customFields。独立供应商值只在此快照，不混record.fields，不重复新建原生供应商行/提交供应商。'}
    parameter['lifecycle'][0]['behavior']='按准确AI任务/场景/平台读取共同业务schema及派生customFields，列映射预检拆业务值和供应商专属值。'
    parameter['lifecycle'][1]['behavior']=parameter['persistence']['write_when']
    for f in [category, mapping, parameter]:
        f['source_refs']=unique(f['source_refs']+['docs/exception-definitions.json#CHG-046-AI-PROVIDER-DIALOG'])
        f['ai_provider_revision']=VERSION
    ai_params=fields['FIELD-PLAT-AI-PARAMS']
    ai_params['validation_rules']=[s for s in ai_params['validation_rules'] if not s.startswith('业务IMPORT定义只从实际分类引用，场景只保存独立fieldId')]
    clause='当前场景schema=2按scene/platform配置IMPORT_FIELD引用及CUSTOM_COLUMN专属导入列；分类业务定义仍权威，供应商列/值独立快照；固定专业项保各自来源。'
    ai_params['validation_rules']=unique(ai_params['validation_rules']+[clause])
    ai_params['derivation']['rule']='；'.join(ai_params['validation_rules'])

    save=locals_['LOCAL-PLAT-AI-SCENE-SAVE']
    save['title']='弹窗配置并保存AI场景的供应商参数与导入列'
    save['steps'][0]['action']='新建/修改分开校验原必填、准确scene/platform及AI专业配置权；主场景只显示配置摘要与选择/配置入口，不单页展开全部业务字段和参数行'
    save['steps'][1]['action']='选择IMPORT字段与配置参数/专属列分别在弹窗独立草稿；选择来源后下一步进入配置，选择本身不回填父草稿；IMPORT_FIELD引用当前分类fieldId且可映不同parameter，CUSTOM_COLUMN定义本scene/platform的稳定id/label/text-number-date/required，无固定值；最终配置确认合法才更新父草稿，取消/关闭无副作用，切平台不混用另一家草稿'
    save['steps'][2]['action']='主场景明确保存时重核权限/修订/当前平台分类、参数唯一/原固定项与引用有效性，schema=2及importFieldCategoryId/importFieldPlatform/importFieldMappings同次保存；label/type引用源规则，FOLLOWUP/异分类/重复参数拒绝并保草稿。旧schema1和legacy customInputFields只读兼容，显式保存升级才清旧重复定义；不改分类字段/路由、已导入值/历史或触发任务导入'
    save['postconditions']=['本场景/供应商schema=2配置准确保存，分类IMPORT保持权威；专属列定义和值独立，固定专业项/原来源权及历史保留；子弹窗确认不等主场景保存']
    save['branches']=[v for v in save['branches'] if v['id']!='LOCAL-PLAT-AI-SCENE-SAVE-B-DIALOG-CANCEL']+[{
        'id':'LOCAL-PLAT-AI-SCENE-SAVE-B-DIALOG-CANCEL','condition':'取消或关闭选择/配置弹窗，或取消主场景编辑',
        'result':'子取消不改父草稿；父取消不改已保存场景，旧schema1/legacy定义不升级或清除；不产生配置保存/导入副作用',
        'field_ids':[MAPPING_CATEGORY,MAPPINGS,'FIELD-PLAT-AI-SUPPLIER'],'test_refs':[CHECK]}]
    template=locals_['LOCAL-PLAT-AI-IMPORT-TEMPLATE']
    template['steps'][0]['action']='按当前准确task/scene/platform读取系统code/姓名/号码等必需项与实际分类完整IMPORT，附加本scene/platform派生customFields形成下载模板及同一映射schema；业务与供应商列身份分开，FOLLOWUP排除；原固定供应商项按其专业定义保留'
    template['steps'][1]['action']='schema1/legacy只读兼容、schema2按本场景映射处理；无准确平台/分类/字段定义或供应商必需参数不满足时不给空白假模板；下载不导入、不改分类或升级旧场景'
    ai=locals_['LOCAL-PLAT-AI-LIST-IMPORT']
    old=ai['steps'][0]['action']
    ai['steps'][0]['action']=old.replace('排除FOLLOWUP和场景自由复制定义','排除FOLLOWUP，业务定义不自由复制；当前scene/platform专属customFields附加于模板和列映射，按text/number/date/required逐行校验，rows拆fields与customValues独立字典')
    ai['steps'][2]['action']=append_clause(ai['steps'][2]['action'],'本行record.fields仅业务值，专属列规范值及customFields在taskImportParameterSnapshot和originalImportSnapshot.taskImportParameterSnapshot独立封存，保parameters/mappings/fingerprint；批次映射快照保customFields，后改平台/配置不追改')
    preview=locals_['LOCAL-FLOW-IMPORT-PREVIEW']
    clause='仅准确AI任务内上下文将businessFields+本scene/platform customFields共同用于模板和列映射；共同业务字段定义不变，专属值拆customValues并校验，不把专属列当分类字段或强加给PRED/普通客户入口。'
    preview['steps'][0]['action']=append_clause(preview['steps'][0]['action'],clause)
    commit=locals_['LOCAL-FLOW-IMPORT-COMMIT']
    commit['steps'][-1]['action']=append_clause(commit['steps'][-1]['action'],'AI任务供应商专属列定义/规范值按独立参数快照封存，不混record.fields，批次映射快照保customFields，原CSV列文及UI映射仍不作为业务字段持久化')
    for lid in ['LOCAL-PLAT-AI-SCENE-SAVE','LOCAL-PLAT-AI-IMPORT-TEMPLATE','LOCAL-PLAT-AI-LIST-IMPORT','LOCAL-FLOW-IMPORT-PREVIEW','LOCAL-FLOW-IMPORT-COMMIT']:
        l=locals_[lid];l['source_refs']=unique(l.get('source_refs',[])+['docs/exception-definitions.json#CHG-046-AI-PROVIDER-DIALOG']);l['ai_provider_revision']=VERSION
        for branch in l['branches']:
            if branch['condition'].startswith('前提、字段'):branch['result']='；'.join(l['postconditions'])

    ac_updates={
        'AC-2158':'三入口共同业务部分均读取系统code等必需项及实际分类IMPORT，FOLLOWUP排除，业务校验同源；AI任务另外附加本scene/platform供应商专属customFields，字段定义/规范值不污染业务；原分类和容量守卫继续。',
        'AC-2159':'AI场景schema=2按scene/platform分别保存IMPORT_FIELD/CUSTOM_COLUMN映射（id/source/fieldId?/parameter/label/type/required）；同fieldId可映不同参数而参数名唯一，专属列text/number/date无固定值。主表仅摘要/入口，选择/配置均弹窗，子确认只入父草稿，取消无副作用，主保存才持久。业务定义仍从分类读取；固定专业项保留。schema1/legacy只读兼容，父保存升级才清旧重复定义，旧历史不迁移。',
    }
    for a in b['acceptance_updates']:
        if a['id'] in ac_updates:a['statement']=ac_updates[a['id']];a['ai_provider_revision']=VERSION
    for collection in [b['checks'],p['checks']]:
        for c in collection:
            if c['id'] in ['CHECK-PLAT-AI-SCENE-SAVE','CHECK-PLAT-AI-LIST-IMPORT']:
                local=save if c['id']=='CHECK-PLAT-AI-SCENE-SAVE' else ai
                c['procedure']='按当前准确场景/平台：'+'；'.join(step['action'] for step in local['steps'])+'；构造无权、平台/分类切换、旧修订及取消/失败/未知。'
                c['expected']='；'.join(local['postconditions'])+'；失败保输入，未知核同请求，原权限/联系/来源守卫继续。'
            if c['id']==CHECK:
                c.update(procedure='冰兰、中科金各场景引用同一业务字段映不同参数；同字段两参数；弹窗选择/配置确认、取消、父取消及父保存重开；平台切换；自定义text/number/date、重复参数、FOLLOWUP/异分类、原固定项及schema1/legacy重开/显式升级。',
                         expected='scene/platform隔离，schema2准确回读；主场景无全字段展开，子取消不改父草稿，主保存才生效；合法一字段多参数，专属列不改分类；非法项拒绝保输入，旧配置读不迁移且取消不清旧定义。')
            if c['id']=='CHECK-PLAT-AI-IMPORT-TEMPLATE':
                c['procedure']='按当前准确AI task/scene/platform下载模板并检查共同业务schema+本场景customFields；构造平台/分类失效和必需参数不满足。'
                c['expected']='系统必需列与全部分类IMPORT保留，专属列身份稳定且只属于本场景，错误不给假模板；不混FOLLOWUP、不改分类或旧场景。'
            if c['id']=='CHECK-FLOW-AI-TASK-DIRECT-IMPORT':
                c['procedure']+='；导入本场景number/date/text专属列并构造类型/必填反例，修改场景/平台后复用旧预检；读取业务及originalImportSnapshot参数快照。'
                c['expected']+='；taskImportParameterSnapshot含准确customFields/customValues与parameters/mappings/fingerprint，业务record.fields不混专属值，后改场景不追改快照。'
    statement='三入口业务部分共用实际分类IMPORT及系统必需schema。AI按scene/platform独立配置IMPORT_FIELD引用和CUSTOM_COLUMN专属供应商导入列，选择/配置均弹窗、主保存才持久；业务定义保持分类权威，专属定义/值及参数快照分开。任务内DIRECT统一账本、原ADMIN/customer.import/模块/任务/来源及分类准入继续，专业名单只读recordId投影，不重复新建原生行/供应商提交；旧schema1/legacy只读兼容、历史不迁移。'
    for r in rules:
        if r['id']=='GR-TASK-UNIFIED-IMPORT':r['statement']=statement;r['source_refs']=unique(r.get('source_refs',[])+['docs/exception-definitions.json#CHG-046-AI-PROVIDER-DIALOG'])
    for d in [b,p]:
        for feature in d.get('features',[]):
            if feature['id']=='FUNC-2019':feature['description']='有权AI场景按准确scene/platform通过弹窗选择实际分类IMPORT引用及配置专属供应商列/参数；分类业务定义权威、供应商列和值独立，主场景保存才持久，固定专业项/权限/历史保留，不授任务导入或分类维护权。'
            if feature['id'] in ['FUNC-2002','FUNC-2019']:feature['source_refs']=unique(feature.get('source_refs',[])+['docs/exception-definitions.json#CHG-046-AI-PROVIDER-DIALOG'])

    components=u['ui']['global']['components']
    if not any(c['id']=='UI-COMP-DIALOG' for c in components):
        components.append({'id':'UI-COMP-DIALOG','name':'AI场景字段选择与参数配置弹窗','variants':['分类IMPORT选择','供应商参数与专属列配置'],'states':['open','editing','invalid','confirming','cancelled'],
                           'interaction_rules':['绑定准确父场景草稿/平台/分类；子确认校验通过才回填父草稿，不直接保存场景。','子取消/关闭不改父草稿，父取消不持久；主保存重核权限/修订/上下文，旧弹窗不得回填新平台。']})
    for page in u['ui']['pages']:
        if page['id']=='UI-PAGE-2110':
            page['components']=unique(page['components']+['UI-COMP-DIALOG'])
            page['layout']=['本租户场景名称/平台等原筛选与列表','新增/编辑主场景表单：实际分类、原专业参数和参数配置摘要/入口；不铺开全部字段','选择IMPORT弹窗及供应商参数/专属列配置弹窗；独立子草稿，主场景保存结果反馈']
        for i in page['interactions']:
            related=[locals_[lid] for lid in i['local_logic_ids'] if lid in locals_]
            if any(l['id'] in ['LOCAL-PLAT-AI-SCENE-SAVE','LOCAL-PLAT-AI-IMPORT-TEMPLATE','LOCAL-PLAT-AI-LIST-IMPORT','LOCAL-FLOW-IMPORT-PREVIEW','LOCAL-FLOW-IMPORT-COMMIT'] for l in related):
                i['behavior']='；'.join('；'.join(s['action'] for s in l['steps']) for l in related)+'；失败/未知保输入和准确请求，不自动起呼或新增原生供应商行。'
        for view in page['fields']:
            if view['field_id'] in [MAPPING_CATEGORY,MAPPINGS,PARAMETERS]:
                f=fields[view['field_id']];view.update(label=f['name'],help_text='；'.join(f['validation_rules']),formatting=f['format'])
            if view['field_id']==MAPPINGS and page['id']=='UI-PAGE-2110':
                view.update(component_id='UI-COMP-DIALOG',visible_when='主场景仅配置摘要和选择/配置入口；详细行仅对应弹窗打开时显示。',editable_when='仅有原AI专业配置权且准确父场景/平台/分类未变的弹窗草稿；主表不直接展开编辑。',validation_timing='子确认校验当前行；主场景保存重新核全部配置/权限/修订，父保存才持久。',formatting='主场景显示引用/专属列数量与配置摘要；弹窗按source展示只读业务来源或可编专属列、参数及需值约束。')
        if page['id']=='UI-PAGE-2110':
            additions=[('SELECT','打开分类IMPORT选择弹窗','按准确分类选择稳定fieldId；只读源定义，下一步进入参数配置弹窗，选择本身不回填父草稿；最终配置确认才回填，取消/关闭不改父草稿。'),('CONFIG','打开供应商参数/专属列配置弹窗','按准确scene/platform配置参数名、需值及CUSTOM_COLUMN定义，允许一字段多不同参数；独立子草稿，确认只回父草稿，主保存才持久。'),('CANCEL','取消子弹窗或主场景编辑','子取消/关闭无父草稿副作用；父取消不写场景，不升级schema1或清legacy；平台/分类变化不接受旧弹窗结果。')]
            for suffix,trigger,behavior in additions:
                ident='UI-PLAT-2110-AI-PROVIDER-'+suffix
                page['interactions']=[i for i in page['interactions'] if i['id']!=ident]+[{'id':ident,'trigger':trigger,'behavior':behavior,'local_logic_ids':['LOCAL-PLAT-AI-SCENE-SAVE'],'test_refs':[CHECK],'source_action_ids':[]}]
    ui_pages={page['source_page_ids'][0]:page for page in u['ui']['pages']}
    for fact in pf['pages']:
        if fact.get('status')=='superseded':continue
        page=ui_pages.get(fact['id'])
        if not page:continue
        if fact['id'] in ['PAGE-2110','PAGE-2103','PAGE-2204','PAGE-2227']:
            fact['interaction_rules']=[i['behavior'] for i in page['interactions']]
            fact['current_behavior']='；'.join(fact['interaction_rules'])
            for view in fact['fields']:
                ident=view.get('id',view.get('field_id'))
                if ident in [MAPPINGS,PARAMETERS]:view['name']=fields[ident]['name']
    # Supersession histories retain old wording; active current statement is replaced.
    for s in b.get('supersessions',[]):
        if s['id']=='CHG-044-TASK-IMPORT':s['current']=statement
    b['supersessions']=[s for s in b.get('supersessions',[]) if s['id']!='CHG-046-AI-PROVIDER-DIALOG']+[{'id':'CHG-046-AI-PROVIDER-DIALOG','old':'Step44场景配置只允许fieldId参数映射、不支持本场景供应商专属导入列；选择/配置在主场景单页展开。','current':statement,'evidence_refs':['docs/exception-definitions.json#CHG-046-AI-PROVIDER-DIALOG']}]
    b['ai_provider_delta']={'version':VERSION,'authorization':AUTH,'field_ids':[MAPPING_CATEGORY,MAPPINGS,PARAMETERS],'acceptance_ids':['AC-2158','AC-2159'],'check_ids':[CHECK,'CHECK-PLAT-AI-IMPORT-TEMPLATE','CHECK-FLOW-AI-TASK-DIRECT-IMPORT'],'formal_approval':False,'production_verified':False}
    return apply_ux(b,p,u,pf,rules)



def apply_ux(b,p,u,pf,rules):
    """Presentation-only correction; reuse all existing product/data identities."""
    locals_={l['id']:l for d in [b,p] for l in d['locals']}
    save=locals_['LOCAL-PLAT-AI-SCENE-SAVE']
    save['steps'][0]['action']='新建/修改分开校验原必填、准确scene/platform及AI专业配置权；主场景保留原字段表、已配置摘要与唯一新增入口“添加字段”，不单页展开全部业务候选和新增参数编辑面板，不保两个主新增入口或大面板；已配置项的原配置/移除继续'
    save['steps'][1]['action']='点击“添加字段”后才打开来源选择，二选一“选择导入字段”/“手工添加供应商字段”；导入字段进入原选择与下一步配置，手工弹窗用“添加场景信息”布局：业务信息只读=场景传入信息、字段名称、参数名、是否必填radio（必填/选填）、取消/确定，类型次要行保text/number/date，原80/64约束不改为截图50。弹窗独立草稿，选择来源本身不回填；IMPORT_FIELD/CUSTOM_COLUMN及一字段多参数沿原合同，最终配置确认合法才更新父草稿，取消/关闭无副作用，切平台不混用另一家草稿'
    save['source_refs']=unique(save.get('source_refs',[])+['docs/exception-definitions.json#CHG-047-AI-ADD-FIELD-UX'])
    for a in b['acceptance_updates']:
        if a['id']=='AC-2159':
            a['statement']=a['statement'].replace('主表仅摘要/入口，选择/配置均弹窗','主场景唯一新增入口“添加字段”，点击再选“选择导入字段”/“手工添加供应商字段”；手工“添加场景信息”按只读业务信息、字段名称、参数名、必填/选填radio、取消/确定呈现，类型保次要行')
            a['ai_add_field_ux_revision']=UX_VERSION
    for collection in [b['checks'],p['checks']]:
        for c in collection:
            if c['id']=='CHECK-PLAT-AI-SCENE-SAVE':
                c['procedure']='按当前准确场景/平台：'+'；'.join(step['action'] for step in save['steps'])+'；构造无权、平台/分类切换、旧修订及取消/失败/未知。'
                c['expected']='；'.join(save['postconditions'])+'；唯一添加入口及线上手工布局可核，失败保输入，未知核同请求，原权限/联系/来源守卫继续。'
            if c['id']==CHECK:
                c['procedure']+='；核主场景只保“添加字段”新增入口，点击再二选来源；手工“添加场景信息”只读业务信息/字段名称/参数名/是否必填radio与取消/确定、类型次要行。'
                c['expected']+='；无两个主新增入口/大面板，线上布局文案准确，80/64原限制及schema2、权限/类型/历史/快照不变。'
    for component in u['ui']['global']['components']:
        if component['id']=='UI-COMP-DIALOG':
            component['name']='AI场景添加字段与配置弹窗'
            component['variants']=unique(['添加字段来源选择']+component['variants'])
    for page in u['ui']['pages']:
        if page['id']!='UI-PAGE-2110':continue
        page['layout']=['本租户场景名称/平台等原筛选与列表','主场景原字段表保协议项/已配置项及来源摘要，唯一新增入口“添加字段”；不展开全部分类候选或双主入口大面板','添加字段后弹窗二选一“选择导入字段”/“手工添加供应商字段”；既有选择/配置链路和父主保存','手工“添加场景信息”：业务信息只读=场景传入信息、字段名称、参数名、必填/选填radio、取消/确定；类型次要行']
        for i in page['interactions']:
            related=[locals_[lid] for lid in i['local_logic_ids'] if lid in locals_]
            if any(l['id']=='LOCAL-PLAT-AI-SCENE-SAVE' for l in related):i['behavior']='；'.join('；'.join(s['action'] for s in l['steps']) for l in related)+'；失败/未知保输入和准确请求，UI修正不改schema2或业务合同。'
            if i['id']=='UI-PLAT-2110-AI-PROVIDER-SELECT':
                i.update(trigger='主场景点击“添加字段”后选择字段来源',behavior='唯一新增入口“添加字段”；点击后再二选一“选择导入字段”/“手工添加供应商字段”。选导入字段进原字段选择及下一步配置，手工进线上布局；来源选择及取消不回填父草稿，最终配置确定才回填，主保存才持久。')
            if i['id']=='UI-PLAT-2110-AI-PROVIDER-CONFIG':
                i.update(trigger='选择手工添加供应商字段或配置已有项',behavior='手工新增“添加场景信息”：业务信息只读=场景传入信息，字段名称对应label、参数名对应parameter、是否必填radio为必填/选填，底部取消/确定；类型次要行保text/number/date，现行80/64约束不改，原协议必填不减。独立子草稿、最终确定回父草稿、主保存才持久，schema2/来源身份/字段和值快照沿原合同。')
        for view in page['fields']:
            if view['field_id']==MAPPINGS:
                view.update(visible_when='主场景原字段表及已配置摘要、唯一新增入口“添加字段”；点击后来源选择，详细编辑只在对应弹窗显示。',formatting='添加字段→选择导入字段/手工添加供应商字段；手工“添加场景信息”按业务信息只读、字段名称、参数名、必填/选填radio、取消/确定，类型次要行。schema2字段格式及已配置摘要沿原合同。')
        page['source_refs']=unique(page['source_refs']+['docs/exception-definitions.json#CHG-047-AI-ADD-FIELD-UX'])
    ui=next(page for page in u['ui']['pages'] if page['id']=='UI-PAGE-2110')
    for page in pf['pages']:
        if page['id']=='PAGE-2110' and page.get('status')!='superseded':
            page['interaction_rules']=[i['behavior'] for i in ui['interactions']]
            page['current_behavior']='；'.join(page['interaction_rules'])
    statement='原AI场景“添加字段”为主场景唯一新增入口，点击后才选“选择导入字段”/“手工添加供应商字段”；手工“添加场景信息”使用业务信息只读、字段名称、参数名、必填/选填radio及取消/确定，类型次要行保留。仅UI表现修正，不增字段/功能/LOCAL/AC/CHECK，不改schema2、供应商隔离、80/64约束、权限、值与快照、子取消及父主保存。'
    b['supersessions']=[v for v in b['supersessions'] if v['id']!='CHG-047-AI-ADD-FIELD-UX']+[{'id':'CHG-047-AI-ADD-FIELD-UX','old':'Step46主场景呈现分开的选择/配置新增入口，手工弹窗采用新布局/文案。','current':statement,'evidence_refs':['docs/exception-definitions.json#CHG-047-AI-ADD-FIELD-UX']}]
    b['ai_add_field_ux_delta']={'version':UX_VERSION,'authorization':UX_AUTH,'scope':'existing UI presentation only','acceptance_ids':['AC-2159'],'check_ids':[CHECK,'CHECK-PLAT-AI-SCENE-SAVE'],'business_contract_unchanged':True,'formal_approval':False}
    return b,p,u,pf,rules
