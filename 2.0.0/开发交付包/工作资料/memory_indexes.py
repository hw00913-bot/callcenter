"""Render current memory while retaining prototype preflight index contracts."""
from pathlib import Path


def esc(value):
    return str(value).replace('|', '／').replace('\n', ' ')


def memory_texts(author, features, fields, rules, pages, ui, locals_):
    author = Path(author)
    baseline = ('基线日期：2026-10-30。当前业务口径以 documentation/input、docs/functional-spec.json、'
                'docs/rules-appendix.json 和 docs/field-alignment.json 为准。原分析与冻结启动计划保留来源及流程约束，'
                '已被最新用户决定替代的业务条款不并行生效。被替代条款见 docs/change-log.json。')
    fieldtext = [
        '# 当前字段映射与产品规则', '',
        '基线：2.0.0-current-20261030。136个原页面字段组身份保持有效，并明确映射当前FIELD；原业务描述由当前规则替代。'
        '逐字段完整类型、空值、默认、校验、权限、生命周期、来源和保存时点见 `../docs/field-alignment.json` 及独立产品规格包。', '',
        '原FLD-001…FLD-136在以下索引继续有效；只读来源及 `docs/field-alignment.json.history` 另存溯源。'
        '它们是页面字段组，不是生产API字段。当前FIELD是产品逻辑字段，不预设数据库/API结构。', '',
        '## 当前关键边界', '',
        '- 分类allowDirectFollowup仅显式true开放直接跟进，缺省false；配置关闭不删除旧事实，已受理执行及必要本人填写、归档仍须准确收尾。',
        '- 整批导入明确DIRECT或TEMPLATE，不因路由/资料失败自动降级；DIRECT明确AI/MANUAL/PREDICTIVE，AI场景必选。',
        '- DIRECT仅豁免路由条件附加资料；基础必填、类型、选项、映射及唯一性全部保留，不建run或节点。',
        '- DIRECT保完整同租户呼叫、实际本人填写、快照、联系限制及当前资料更正；不办理模板推进或转交。',
        '- DIRECT以独立directCycleId/directCycles及ACTIVE/COMPLETED状态管理；明确完成须真实已归档完成跟进或NO_CALL+原因。再次直接跟进显式确认下一次方式/必要AI场景，新周期清旧责任安排。',
        '- 后续启用流程在原业务显式预检当前路由和必需资料，全部旧执行与必要归档收敛后建立新run；不重复导入，旧直接事实不完成新节点。',
        '- TEMPLATE模板的字段参考分类只供编排；实际应用仍由分类独立绑定，开始、转交、呼叫、结束四节点固定。',
        '- 品牌内IMPORT/FOLLOWUP字段库独立；导入字段业务编码必填，无格式配置；分配只选择跟进人，必要AI场景在同一导入与分配安排入口明确。',
        '- 新跟进读取最新实际分类定义及有效值并封存当时快照；当前更正不重画原段。无旧v2流转数据迁移，未来真实事实与审计完整保留。', '',
        '## Fields', '',
        '| Field ID | Source ID | Page / Area | API / Data Field | Display Name | Business Definition | Value Logic | Display Format | Enum / Mapping | Empty / Error Rule | Annotation Point | Used In |',
        '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |']
    for row in ui['field_group_mappings']:
        ids = ', '.join(row['field_ids'])
        values = [row['source_field_group_id'], 'SRC-004', row['source_page_id'], 'field-alignment:' + ids,
                  row['current_name'], '当前页面逻辑字段组；以关联FIELD完整规则定义业务语义，不恢复历史描述。',
                  '逐字段按当前定义读取、校验、权限和保存时点执行；不从字段组推导默认值。',
                  '按当前页面及逐字段规格展示', ids,
                  '空、错误、未知按当前FIELD与页面五态处理；不得静默补齐', 'none', row['source_page_id']]
        fieldtext.append('| ' + ' | '.join(map(esc, values)) + ' |')
    fieldtext += ['', '## 当前FIELD详细表', '',
                  '| 字段ID | 名称 | 业务对象与键 | 类型 | 必填／空值 | 保存时点 |', '|---|---|---|---|---|---|']
    for row in fields:
        values = [row['id'], row['name'], row['entity'] + '.' + row['key'], row['type'],
                  row['required_when'] + '；nullable=' + str(row['nullable']), row['persistence']['write_when']]
        fieldtext.append('| ' + ' | '.join(map(esc, values)) + ' |')

    # Retain source module/version/edit metadata, replacing only current semantics.
    previous = {}
    for line in (author / 'provenance/previous-current-memory/feature-list.md').read_text().splitlines():
        if line.startswith('| FUNC-'):
            cols = [x.strip() for x in line.split('|')[1:-1]]
            previous[cols[0]] = cols
    featuretext = ['# 当前功能基线', '',
                   '43个差异FUNC和222项原专业能力保留身份；当前规则明确直接跟进/按模板流转两模式。'
                   '旧分析及冻结启动计划保留来源，不作为已被替代的业务操作要求。', '',
                   '| Feature ID | Version | 一级模块 | 二级模块 | 三级模块 | 功能名称 | 功能说明 | 备注 | 修改类型 | Source IDs |',
                   '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |']
    for row in features:
        cols = list(previous[row['id']])
        local_ids = [x['id'] for x in locals_ if row['id'] in x['feature_ids']]
        cols[5], cols[6] = row['name'], row['description']
        cols[7] = '当前局部动作：' + ', '.join(local_ids)
        cols[9] = 'SRC-006 ' + ', '.join(row['acceptance_ids'])
        featuretext.append('| ' + ' | '.join(map(esc, cols)) + ' |')

    project = ['# D联络云 v2.0.0 原址离线重建 20261026', '', baseline, '',
               '## 产品目标', '',
               '原址离线重建统一入口及业务与客户闭环，保留43个FUNC、134个AC、43个当前PAGE与222项专业能力。'
               '分类显式决定是否开放直接跟进；整批可明确选择直接跟进或按模板流转，保持业务、跟进和通话事实完整。', '',
               '## 目标用户', '',
               '平台超级管理员、租户管理员、业务运营、业务跟进人和只读查看者；本人坐席能力按原专业资格单独授权。', '',
               '## 核心页面列表', '',
               '坐席作业、业务分类、业务字段、流转模板、导入与分配、业务线索、业务记录详情、客户档案，'
               '及原AI／Cloud专业执行、记录、资源、报表和系统管理页面。准确PAGE身份见下方页面目录。', '',
               '## 核心用户路径', '',
               '合法身份进入当前租户→配置品牌字段/分类及直接跟进开关→整批明确办理模式→严格导入→分配跟进人→实际呼叫→本人填写与唯一归档。'
               'DIRECT无run/节点，只在同租户继续跟进；TEMPLATE按当前捕获方案明确推进或合法转交。'
               'DIRECT明确完成周期结论后可显式选择下一次方式建立新直接周期并重新分人。'
               'DIRECT后续启用流程先验证当前路由/必需资料及全部旧执行、必要归档收敛，再于原业务显式建立新run，不重复导入。', '',
               '## 主要数据对象', '',
               '账号、租户、品牌、成员授权、独立用途字段、业务分类（allowDirectFollowup缺省false）、字段参考模板、实际路由、'
               '导入批次（整批handlingMode）、业务（DIRECT另含directMethod）、独立直接周期（directCycleId/directCycles、状态及结论）、真实模板运行/节点、跟进段、通话尝试、内容快照、联系限制、当前更正及审计。'
               'DIRECT不伪造run、节点或模板方案；原AI／Cloud专业对象保持。', '',
               '## 交付方式', '',
               '本目录index.html为原址静态离线入口；当前memory和规范JSON提供产品事实，独立产品规格包用于评审及工程对齐。'
               '冻结启动计划、workflow和审批保持原记录；真实工程契约、供应商与生产授权须独立补证。', '',
               '## 范围', '',
               '五区导航：坐席工作台、业务&客户、呼叫中心、报表中心、系统管理。品牌共享配置与租户业务资料范围分开；统一账号、五生产角色、模块授权及本人电话能力分别判定。', '',
               '分类导入/填写双Tab及IMPORT/FOLLOWUP字段库保持；DIRECT仅放宽路由附加资料，基础必填/类型/映射/唯一性保留，AI场景必选。分配仅安排本租户跟进人，场景在同一安排入口明确，不改owner或自动起呼。', '',
               'TEMPLATE实际路由与参考分类分开；开始、转交、呼叫、结束固定。已开始run沿原流程完成或废弃；新run封当前明确有效方案。', '',
               '两模式均以真实实际办理/接听人填写，跟进捕获最新实际分类及有效值并封快照；当前更正、跟进归档、流程推进和业务结论分开。'
               '全部旧直接执行与必要归档收敛后才可启用新run；旧事实不得完成新节点。', '',
               '原AI、Cloud、IVR、资源、财务、报表、录音和专业客户任务保持独立对象与权限。不做旧v2流转数据迁移，但今后真实运行、跟进、通话和审计完整保留。', '',
               '## 非本期范围', '',
               '完整CRM、通用规则引擎、自动呼叫/自动推进/自动租户转交、运行中任意改绑、跨品牌数据共享、按手机号自动合并业务、跨租户录音共享和新统一首页。', '',
               '## 页面目录', '', '| PAGE | 当前页面 | 入口 |', '|---|---|---|']
    for row in pages:
        if row.get('status') != 'superseded':
            project.append('| ' + ' | '.join(map(esc, [row['id'], row['name'], ' / '.join(row.get('menu_path', [])) or row.get('surface_kind', 'internal')])) + ' |')
    project += ['', '## 交付与证据', '',
                '当前有限静态Mock与各次真实验证证据按原记录读取；本次文档规格更新本身不冒充运行、接口或业务验收。'
                '正式业务运营评审、冻结启动计划和S7/S8状态不得由文档组装改写。独立产品包提供全局/局部/字段/UI/权限/验收，工程阶段补真实契约和执行证据。']
    business = ['# 当前业务规则', '',
                '当前有效规则见 `../docs/rules-appendix.json`，局部动作见 `../documentation/input/functions.json`。'
                '两模式按最新用户授权同时存在；历史“所有导入必建run”只适用于TEMPLATE。'
                '旧六区、空白节点、按坐席/任务分配和旧v2迁移规则被替代，追溯见 `../docs/change-log.json`。', '']
    for row in rules:
        business += ['## ' + row['id'], '', row['statement'], '']
    return {'project.md': project, 'field-map.md': fieldtext, 'feature-list.md': featuretext, 'business-rules.md': business}
