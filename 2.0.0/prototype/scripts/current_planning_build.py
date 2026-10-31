"""Current planning data, without retired-template or old-node compatibility."""
import re


MOCK = r'''/** 本轮独立 Mock，当前四节点规划从空台账开始。 */
(function () {
  'use strict';
  window.BusinessFlowMock = Object.freeze({create:()=>({schema:4,revision:0,templates:[],categories:[],records:[],batches:[],requests:[],deletedTemplateIds:[],contactPolicies:[]})});
})();'''


READ = r'''
  function fourCurrentLedgerValid(current){try{return current?.schema===4&&Number.isSafeInteger(current.revision)&&current.revision>=0&&['templates','categories','records','batches','requests','deletedTemplateIds','contactPolicies'].every(key=>Array.isArray(current[key]))&&!['legacyRefs','templateSnapshots','templateCleanup'].some(key=>Object.hasOwn(current,key))&&current.templates.every(t=>t&&Array.isArray(t.versions)&&t.versions.every(v=>v.fourNodeSchema===FOUR_SCHEMA))&&current.records.every(r=>r?.fourNodeSchema===FOUR_SCHEMA&&(fourDirect(r)?fourDirectRecordValid(r):Array.isArray(r.runs)));}catch(_){return false;}}
  function read(){
    const initializationKey=KEY+':condition-first-reset-v1',marker=localStorage.getItem(initializationKey),raw=localStorage.getItem(KEY);let value,expected=raw;
    const valid=fourCurrentLedgerValid;
    requireThat(marker===null||marker==='3'||marker==='4','READ_FAILED','业务台账初始化标记无效');
    if(raw!==null){try{value=JSON.parse(raw);}catch(_){if(marker==='4')fail('READ_FAILED','业务台账无法读取，请检查当前数据');}}
    if(marker===null||marker==='3'){
      // This release discards the authorized old planning data, without conversion.
      // A previous interrupted marker write must never erase valid current data.
      if(!valid(value)){
        requireThat(window.BusinessFlowMock?.create&&window.CustomerBusiness?.clearPlanningFlowReferences,'INITIALIZE_FAILED','当前业务初始化能力未就绪');
        const cleared=CustomerBusiness.clearPlanningFlowReferences();requireThat(cleared.ok,'INITIALIZE_FAILED',cleared.message||'流程关联未能清理');
        requireThat(localStorage.getItem(KEY)===raw&&localStorage.getItem(initializationKey)===marker,'STALE','业务数据已变化，请重新读取');
        value=BusinessFlowMock.create();requireThat(valid(value),'INITIALIZE_FAILED','当前业务初始结构无效');
        const written=JSON.stringify(value);localStorage.setItem(KEY,written);expected=written;
        requireThat(localStorage.getItem(KEY)===written,'INITIALIZE_FAILED','当前业务初始化结果尚未确认');
      }
      requireThat(localStorage.getItem(KEY)===expected,'STALE','业务数据已变化，请重新读取');
      localStorage.setItem(initializationKey,'4');
      requireThat(localStorage.getItem(initializationKey)==='4'&&localStorage.getItem(KEY)===expected,'INITIALIZE_FAILED','当前业务初始化标记尚未确认');
    }
    requireThat(valid(value),'READ_FAILED','当前业务台账结构无效');
    return value;
  }
'''


REFERENCES = r'''
  function configurationReferences(brandId){
    const C=window.CustomerBusiness;requireThat(C?.brandCatalog&&C?.brandScope,'CONFIG_READ_FAILED','分类引用读取能力不可用');
    const scope=C.brandScope(brandId);requireThat(scope?.ok,'CONFIG_READ_FAILED',scope?.message||'品牌配置范围无效');
    const catalog=C.brandCatalog(scope.scope);requireThat(catalog?.ok&&Array.isArray(catalog.rows),'CONFIG_READ_FAILED',catalog?.message||'当前分类无法读取');
    const raw=localStorage.getItem(C.storageKey),sources=[];
    if(raw!==null){let saved;try{saved=JSON.parse(raw);}catch(_){fail('CONFIG_READ_FAILED','业务目录无法读取');}
      requireThat(saved.version===C.storageVersion&&Array.isArray(saved.scopes)&&(saved.routingRequests===undefined||Array.isArray(saved.routingRequests)),'CONFIG_READ_FAILED','当前路由请求结构无效');
      for(const request of saved.routingRequests||[])if(request.status==='unknown'&&request.brandId===brandId){let input;try{input=JSON.parse(request.signature);}catch(_){fail('CONFIG_READ_FAILED','待核配置请求无法读取');}sources.push({row:{input,result:request.result},label:'本品牌尚待核对的路由配置请求'});}
    }
    return {token:JSON.stringify({rows:catalog.rows,sources}),catalog,sources};
  }
'''


def replace_function(code, name, source):
    marker = '  function ' + name + '('
    if code.count(marker) != 1:
        raise ValueError('Current planning function conflict: ' + name)
    start = code.index(marker)
    match = re.search(r'\n  (?:function |const |let |window\.)', code[start + len(marker):])
    if not match:
        raise ValueError('Current planning function boundary missing: ' + name)
    end = start + len(marker) + match.start() + 1
    return code[:start] + source.lstrip('\n') + code[end:]


def clean_editor(code):
    for name in ['Initial','TemplateEditor','ShowCanvas']:
        code = code.replace('legacy'+name, 'base'+name)
    code = re.sub(r'if\(!v2\(\)\)return legacy\w+\([^;]*\);', '', code)
    code = code.replace('return v2()?routingDirectory():legacyConditionDirectory();', 'return routingDirectory();')
    code = code.replace('const legacy=!v2(),result=', 'const result=')
    code = code.replace("legacy?'分类已选择，旧条件保持原样，请逐条核对来源和比较值。':", '')
    code = re.sub(r"      if\(!v2\(\)\)html='<div[^\n]*\+html;\n", '', code)
    code = code.replace('请选择业务分类后进入节点编排；旧规则保持原样，请逐条核对。', '请选择业务分类后进入节点编排。')
    code = code.replace("...(v2()?{conditionSource:{scope:type==='TRANSFER'?'CURRENT_ROUND':'CURRENT_NODE'}}:{})", "conditionSource:{scope:type==='TRANSFER'?'CURRENT_ROUND':'CURRENT_NODE'}")
    code = code.replace('(!v2(latest)||latest.categoryRef?.categoryId===d.categoryId)', '(latest.categoryRef?.categoryId===d.categoryId)')
    code = code.replace('本次保存会生成新版本，旧版本保持', '保存后生效，已开始运行保持原方案').replace('原版本保持', '仅影响本次草稿').replace('原版本与配置条件', '当前配置与条件')
    # The template category is a field reference, never an application binding.
    code = code.replace('填写名称并明确业务分类后，进入全屏画布编排节点与条件路径。', '填写名称并选择字段参考分类，再编排节点与条件路径；实际使用关系由业务分类的路由配置绑定。')
    code = code.replace('请选择业务分类后进入节点编排。', '请选择字段参考分类后进入节点编排。').replace('请选择有效的业务分类并配置当前四节点流程。', '请选择有效的字段参考分类并配置当前四节点流程。')
    code = code.replace('已使用当前业务分类，原条件和比较值保持。', '已读取字段参考分类，条件和比较值保留；尚未建立业务使用绑定。')
    code = code.replace("'<div class=\"fc-canvas-start\"><span>'+e(value.routingCatalog?.categoryLabel||value.categoryRef.categoryId)", "'<div class=\"fc-canvas-start\"><span>字段参考分类：'+e(value.routingCatalog?.categoryLabel||value.categoryRef.categoryId)")
    code = code.replace('按当前业务分类配置校验', '按实际应用分类校验字段与条件').replace('关联模板与分类字段兼容。', '模板所需字段与本业务分类兼容，保存后建立实际使用绑定。')
    for name in re.findall(r'^  function (legacy\w+)\(', code, re.M):
        if len(re.findall(r'\b'+name+r'\b',code)) != 1:
            raise ValueError('Obsolete editor branch still referenced: '+name)
        code = replace_function(code,name,'')
    return code


def clean_current_records(code):
    code = code.replace('...s.legacyRefs', '').replace('s.legacyRefs', '[]')
    code = re.sub(r"return \[\.\.\.s\.records,\]\.filter\(r=>\{if\(r\.mechanism==='LEGACY'\).*?return visible\(r,a\);\}\)", 'return s.records.filter(r=>visible(r,a))', code)
    code = re.sub(r"    if\(r\.mechanism==='LEGACY'\)return [^\n]+\n", '', code)
    code = replace_function(code,'detail',"  function detail(id){return safe(()=>{const s=read(),a=access(),r=s.records.find(r=>r.recordId===id);requireThat(r,'RECORD_MISSING','记录不存在');requireThat(visible(r,a),'RECORD_DENIED','无权查看该业务记录');return project(s,r,a);});}\n")
    code = code.replace('    out.push(...legacySources());\n', '')
    code = code.replace(",...(old.length===1&&projectLegacyEntry(s,old[0],a)?{recordId:old[0].recordId}:{})", '')
    code = code.replace('可确证存量编码已存在，保留原查询和处理', '专业业务来源中已有此编码，不能重复导入')
    start=code.index('  function projectBatch(')
    end=code.index('  function queryBatches(',start)
    original=code[start:end]
    body=original[original.index("      if(b.source==='template'){")+len("      if(b.source==='template'){"):original.index("      }else if(b.sourceKind==='CUSTOMER_TASK_BATCH'){")]
    old_start=body.index("        if(!r&&/^(legacy-row:|legacy-brand:)/")
    old_end=body.index('        const allowed=',old_start)
    body=body[:old_start]+body[old_end:]
    body=body.replace("const allowed=r&&(r.mechanism==='LEGACY'?(a.roleCode==='SUPER_ADMIN'?brandAllowed(r.brandId,a)&&(a.tenantIds||[]).includes(r.ownerTenantId):a.roleCode==='ADMIN'&&r.ownerTenantId===a.tenantId&&bind(a.tenantId).brandId===r.brandId):visible(r,a));",'const allowed=r&&visible(r,a);').replace('||[].find(r=>r.recordId===row.recordId)','')
    head=original[:original.index("      if(b.source==='template'){")]
    tail=original[original.index('    if(!rows.length&&!records.length)'):]
    current=head+body+'    }\n'+tail
    code=code[:start]+current+code[end:]
    for name in ['projectLegacyEntry','actualLegacyVisible']:
        if len(re.findall(r'\b'+name+r'\b',code))==1:code=replace_function(code,name,'')
    for before,after in [('legacySources','professionalSources'),('legacyEntries','professionalEntries'),('readLegacyBatches','readProfessionalBatches')]:code=code.replace(before,after)
    code=code.replace("r.categoryId==='LEGACY-CUSTOMER'||",'')
    code=code.replace('Old versions use the original paths.','All current runs use the same four-node contract.')
    return code


def drop_unused_bases(code):
    changed = True
    while changed:
        changed = False
        for name in re.findall(r'^  function ((?:fourBase|retained)\w+)\(', code, re.M):
            if len(re.findall(r'\b' + name + r'\b', code)) == 1:
                code = replace_function(code, name, '')
                changed = True
    return code


def transform(kind, path, code):
    if kind != 'cloud':
        return code
    if path == 'mock/business-flow.js':
        return MOCK
    if path == 'js/components/business-flow-store.js':
        code = replace_function(code, 'read', READ)
        code = replace_function(code, 'configurationReferences', REFERENCES)
        # The base preview still supplies current import normalization and strict
        # professional-source deduplication. Its old planning-reference fallback is gone.
        code = re.sub(r"const fallback=s\.legacyRefs\.find\(.*?;if\(fallback\)return \{.*?\};seen\.add\(code\);", 'seen.add(code);', code)
        code = clean_current_records(code)
        code = drop_unused_bases(code)
        if 'templateSnapshots' in code or 'templateCleanup' in code:
            # Only the schema reject-list may mention the removed collections.
            without_reject = code.replace("['legacyRefs','templateSnapshots','templateCleanup']", '[]')
            if 'templateSnapshots' in without_reject or 'templateCleanup' in without_reject:
                raise ValueError('Retired template compatibility still present')
    if path == 'js/pages/flow-configuration.js':
        code = clean_editor(code)
    if path == 'js/components/business-configuration-usage.js':
        code = code.replace('[...(unified?.templates||[]),...(unified?.templateSnapshots||[])]', '(unified?.templates||[])')
        code = code.replace('value.schema===1&&Array.isArray(value.records)', 'value.schema===4&&Array.isArray(value.records)')
        code = code.replace("sourceLabel:'流转模板分类引用'", "sourceLabel:'模板字段参考分类'").replace("+' V'+version.version+' 已关联此分类'", "+' 的字段参考使用此分类'")
    return code
