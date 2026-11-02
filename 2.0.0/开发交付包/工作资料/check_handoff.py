"""Read-only handoff checks; does not approve, complete stages or authorize code.

--scope planning checks product/task material completeness only.
--scope formal additionally requires real engineering/global/approval gates.
Original project check-package remains mandatory before business implementation.
"""
from pathlib import Path
import argparse, collections, datetime, hashlib, json, re, subprocess, sys
from implementation_tasks import ROOT, WS, OUT, read, write, topological

PROJECT=ROOT.parent.parent/'prototype'
CLI=Path('/Users/huhaowen/.codex/skills/development-planning-loop/scripts/planning.py')
EVIDENCE=ROOT/'交接检查'

def tool(args):
    r=subprocess.run([sys.executable,*map(str,args)],capture_output=True,text=True)
    try:data=json.loads(r.stdout)
    except ValueError:raise RuntimeError('Cannot read actual tool result: '+r.stdout[-500:]+' '+r.stderr[-500:])
    return {'command':[sys.executable,*map(str,args)],'exit_code':r.returncode,'result':data}

def tasks_check(plan,ir):
    errors=[];tasks=plan['tasks'];locals_={l['id']:l for l in plan['logic']['locals']};fields={f['id']:f for f in plan['logic']['fields']};checks={c['id']:c for c in plan['acceptance_checks']}
    owners=collections.Counter(lid for t in tasks for lid in t['local_logic_ids']);test_owners=collections.Counter(c['id'] for t in tasks for c in t['tests'])
    if set(owners)!=set(locals_) or any(v!=1 for v in owners.values()):errors.append('LOCAL必须恰有一个主实施任务')
    if set(test_owners)!=set(checks) or any(v!=1 for v in test_owners.values()):errors.append('原CHECK必须原ID且恰有一个主测试归属')
    for t in tasks:
        ls=[locals_[lid] for lid in t['local_logic_ids'] if lid in locals_]
        if set(t['field_ids'])!=set(f for l in ls for f in l['field_ids']):errors.append(t['id']+'字段集合与LOCAL不一致')
        if not set(r for l in ls for r in l['global_rule_ids'])<=set(t['global_rule_ids']):errors.append(t['id']+'缺全局守卫')
        if not set(f for l in ls for f in l['feature_ids'])<=set(t['feature_ids']):errors.append(t['id']+'功能范围缺失')
        for c in t['tests']:
            source=checks.get(c['id'],{})
            if any(c.get(k)!=source.get(k) for k in ['acceptance_ids','procedure','expected']):errors.append(c['id']+'原验收正文/ID被改')
        for ref in t['prototype_reference_files']:
            if not (PROJECT/ref['path'].split('../../prototype/',1)[1]).is_file():errors.append('原型只读引用缺失 '+ref['path'])
        if t['allowed_files'] or t['changes'] or t['context_files']:errors.append(t['id']+'未有开发仓库却声明精确写入范围')
    if set(f for t in tasks for f in t['field_ids'])!=set(fields):errors.append('FIELD覆盖缺失')
    if set(f for t in tasks for f in t['feature_ids'])!=set(plan['scope']['feature_ids']):errors.append('FUNC覆盖缺失')
    if set(a for t in tasks for a in t['acceptance_ids'])!=set(a['id'] for a in ir['acceptance']):errors.append('AC覆盖缺失')
    for p in plan['ui']['pages']:
        ts=[t for t in tasks if p['id'] in t['ui_page_ids']]
        if not set(p['local_logic_ids'])<=set(l for t in ts for l in t['local_logic_ids']):errors.append(p['id']+'LOCAL未承接')
        if not set(f['field_id'] for f in p['fields'])<=set(f for t in ts for f in t['field_ids']):errors.append(p['id']+'字段未承接')
        for a in p['interactions']:
            for c in a['test_refs']:
                if not any(c in {v['id'] for v in t['tests']} and set(t['local_logic_ids'])&set(a['local_logic_ids']) for t in ts):errors.append(a['id']+'检查不属于本页对应动作任务')
    try:order=topological(tasks)
    except ValueError as e:errors.append(str(e));order=[]
    ops=read(ROOT/'原专业操作任务映射.json')['operations'];keys=[o['operation_ref'] for o in ops];tm={t['id']:t for t in tasks}
    if len(keys)!=222 or len(set(keys))!=222:errors.append('原222专业key缺失/重复')
    for op in ops:
        if op['primary_task_id'] not in tm or not set(op['local_logic_ids'])<=set(l for t in op['related_task_ids'] for l in tm[t]['local_logic_ids']):errors.append(op['operation_ref']+'责任缺失')
    return {'passed':not errors,'errors':errors,'tasks':len(tasks),'locals':len(locals_),'fields':len(fields),'pages':len(plan['ui']['pages']),'checks':len(checks),'acceptance':len(ir['acceptance']),'professional_operations':len(ops),'task_order':order,
            'physical_file_binding':'尚无目标库，不验证实际文件并行安全，不授写入权'}

def blockers(preflight):
    errors=preflight['result'].get('errors',[])
    patterns=[('部分验收状态',r'验收映射未明确', '按当前范围逐条核定并实际补验；真实服务缺证交开发/服务负责人，不能把全部Partial批量改Pass/N/A。'),
              ('旧验证记录措辞矛盾',r'验证记录矛盾','验证负责人回读原证据，在实际重新检查后追加标准新记录，不能改旧日志掩盖失败。'),
              ('旧证据缺当前内容/轮次绑定',r'验证证据已过期','验证负责人对当前实现实际复验，使用record-verification追加新声明，不给旧记录补盖摘要。'),
              ('阶段完成记录',r'阶段日志缺少','所有实际验证通过后由总控受控完成阶段，不能手改workflow/stage-log。'),
              ('全局与图集可见性',r'全局验证|缺少最新图集','在前置可进入条件满足后，由验证负责人检查核心路径和两图真实可见性，记录新鲜全局结果。'),
              ('交付导航配置一致性',r'统一交付导航','核对已请求交付范围，再用既有生成入口同步静态导航并实际复验，不改审批开关迁就显示。')]
    rows=[];classified=set()
    for name,pattern,action in patterns:
        matches=[e for e in errors if re.search(pattern,e)]
        if matches:rows.append({'category':name,'count':len(matches),'errors':matches,'action':action});classified.update(matches)
    rest=[e for e in errors if e not in classified]
    if rest:rows.append({'category':'其他实际预检错误','count':len(rest),'errors':rest,'action':'按原始错误核对并实际修正，不静默排除。'})
    return rows

def package_check(folder,require_current_digest=True):
    if not folder.exists():return {'passed':False,'status':'not_exported','errors':['本次交接包尚未生成']}
    m=read(folder/'manifest.json');errors=[];links=0
    for row in m['files']:
        p=folder/row['path']
        if not p.is_file() or p.stat().st_size!=row['bytes'] or hashlib.sha256(p.read_bytes()).hexdigest()!=row['sha256']:errors.append('manifest '+row['path'])
    from urllib.parse import unquote
    for p in folder.rglob('*.md'):
        for target in re.findall(r'\]\(([^)\n]+)\)',p.read_text()):
            base=unquote(target.strip('<>').split('#',1)[0])
            if not base or re.match('[A-Za-z][A-Za-z0-9+.-]*:',base):continue
            links+=1
            if not (p.parent/base).exists():errors.append(str(p.relative_to(folder))+' → '+target)
    same=m.get('product_digest')==read(WS/'product-review.json')['product_digest']
    if require_current_digest and not same:errors.append('导出包产品摘要不同')
    return {'passed':not errors,'errors':errors,'manifest_files':len(m['files']),'relative_links_checked':links,'status':m['status'],'stage':m['stage'],'matches_current_product':same}

def current_regression():
    """Verify Step56 exact runtime identity while retaining the separate Step54 full HTTP checklist."""
    def local(ref):
        path=(PROJECT/ref).resolve()
        if not path.is_relative_to(PROJECT.resolve()):raise ValueError('原型证据路径越界 '+str(ref))
        return path
    errors=[];proof_path=PROJECT/'memory/http-e2e-acceptance-verification-20261101.json'
    proof=read(proof_path)
    latest=read(PROJECT/'memory/template-ai-task-entry-20261102/verification-proof.json')
    basis={**latest['currentRegression'],'summary':'memory/template-ai-task-entry-20261102/regression-final/summary.json','stability':'memory/template-ai-task-entry-20261102/regression-final/source-stability.json'}
    summary_path=local(basis['summary'])
    summary=read(summary_path);stability=read(local(basis['stability']))
    before=read(summary_path.parent/'source-build-test-hashes-before.json')
    expected=read(summary_path.parent/'source-build-test-hashes-after.json')
    actual={name:hashlib.sha256(local(name).read_bytes()).hexdigest() if local(name).is_file() else None for name in expected}
    mismatches=[name for name in expected if expected[name]!=actual[name]]
    if not expected or before!=expected or stability.get('unchanged') is not True or stability.get('changed') or stability.get('runnerExitCode')!=0:errors.append('最新回归运行前后文件身份不稳定或缺证')
    if stability.get('files')!=len(before) or len(before)!=len(expected):errors.append('最新回归稳定性记录的文件计数不一致')
    if mismatches:errors.append('当前源码/构建/测试与最新回归证据不符')
    rows=summary['results'];scripts=[row['script'] for row in rows]
    if len(set(scripts))!=len(scripts) or summary['suites']!=len(rows):errors.append('最新回归脚本身份或数量不一致')
    if any(row.get('exitCode')!=0 or row.get('infrastructureError') or row.get('failed') not in [None,0] for row in rows):errors.append('最新回归保留失败或基础设施错误')
    passed=sum(row.get('passed') or 0 for row in rows);failed=sum(row.get('failed') or 0 for row in rows)
    if summary['reportedPassed']!=passed or summary['reportedFailed']!=failed or summary['failedSuites']!=0:errors.append('最新回归结构化计数不一致')
    if any('scripts/'+name not in expected for name in scripts):errors.append('最新回归缺准确脚本源码身份')
    current_scripts={p.name for p in (PROJECT/'scripts').glob('check-*.cjs')}
    if current_scripts!=set(scripts):errors.append('当前回归脚本集合与最新回归证据不一致')
    if any(basis[key]!=summary[source] for key,source in [('suites','suites'),('structuredPassed','reportedPassed'),('structuredFailed','reportedFailed'),('failedSuites','failedSuites')]):errors.append('当前总证明与最新回归摘要不一致')
    checklist=read(local(proof['actualChecklist']));cases=checklist['cases'];counts=collections.Counter(row['status'] for row in cases)
    if len({row['id'] for row in cases})!=len(cases) or counts['passed']!=proof['groupCounts']['passed'] or counts['partial']!=proof['groupCounts']['partial']:errors.append('实际HTTP清单及总证明的分组计数不一致')
    if any(checklist['counts'].get(key)!=counts[key] for key in ['passed','partial']):errors.append('实际HTTP清单的报告计数与逐组状态不一致')
    if any(not row.get('evidenceTags') or not row.get('verified') for row in cases if row['status']=='passed'):errors.append('HTTP通过组缺本轮实际观察引用')
    if proof['overallStatus']=='passed' and counts['passed']!=len(cases):errors.append('实际总证明宣称全量通过但仍有未验组')
    http={'status':proof['overallStatus'],'passed_groups':counts['passed'],'partial_groups':counts['partial'],'case_groups':len(cases),
          'fully_accepted':proof['overallStatus']=='passed' and counts['passed']==len(cases),
          'partial_cases':[{'id':row['id'],'not_actually_verified':row.get('notActuallyVerified',[])} for row in cases if row['status']!='passed'],
          'limits':proof['limits'],'evidence':proof['actualChecklist'],'report':proof['report']}
    http['local_updates']=[{'step':step,'proof':ref,'result':read(PROJECT/ref).get('functionalResult',read(PROJECT/ref).get('result'))} for step,ref in [('step-55','memory/customer-profile-integration-20261102/verification-proof.json'),('step-56','memory/template-ai-task-entry-20261102/verification-proof.json')]]
    report={'schema':'current-handoff-runtime-check@3','checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'scope':'Latest Step56 bounded actual-built evidence and current file hashes, plus original Step54 HTTP coverage; this check does not rerun tests, browse, approve or complete any stage',
            'passed':not errors,'errors':errors,'not_reexecuted':True,'script_count':len(rows),'scripts':scripts,
            'passed_cases':passed,'failed_cases':failed,'changed_during_checks':stability.get('changed',[]),
            'mismatches':mismatches,'implementation_hashes':actual,'recorded_implementation_hashes':expected,
            'evidence':basis['summary'],'source_stability':basis['stability'],'actual_http':http,'results':rows}
    write(EVIDENCE/'current-runtime-summary.json',report);write(EVIDENCE/'current-http-acceptance.json',http)
    return report

def current_reference_identity():
    """Validate actual current dependencies; old full exports are not dependencies."""
    reuse=read(PROJECT/'memory/reuse-provenance.json');lock=read(PROJECT/'inputs/design-source-lock.json');rows=[f for source in reuse['sources'].values() for f in source['files']]+lock['entries'];errors=[]
    for row in rows:
        p=Path(row['path'])
        if not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest()!=row['sha256']:errors.append(str(p))
    return {'passed':not errors,'errors':errors,'professional_files':sum(len(source['files']) for source in reuse['sources'].values()),'design_files':len(lock['entries']),'policy':'Current authoritative source identities plus live prototype projection/regressions; no dependency on superseded export copies.'}

def run(scope='planning',out=OUT,formal_package=None):
    EVIDENCE.mkdir(exist_ok=True);plan=read(WS/'plan.json');ir=read(WS/'product-ir.json')
    product=tool([CLI,'validate',WS,'--stage','product']);development=tool([CLI,'validate',WS,'--stage','development'])
    for name,result in [('product-validation',product),('development-validation',development)]:write(EVIDENCE/(name+'.json'),result['result'])
    proto={}
    for stage in ['s7','s8','final']:
        proto[stage]=tool([PROJECT/'tools/loop_preflight.py',PROJECT,'--stage',stage,'--json']);write(EVIDENCE/('prototype-'+stage+'.json'),proto[stage]['result'])
    loop_status=tool([PROJECT/'tools/loop_run.py','status',PROJECT])['result'];write(EVIDENCE/'prototype-loop-status.json',loop_status)
    coverage=tasks_check(plan,ir);write(EVIDENCE/'task-coverage.json',coverage)
    contract_run=subprocess.run([sys.executable,str(ROOT/'check_current_contracts.py')]+(['--package','--out',str(out)] if (out/'handoff-gates.json').exists() else []),text=True,capture_output=True)
    contracts=read(EVIDENCE/'current-contracts.json')
    if contract_run.returncode and contracts['passed']:raise RuntimeError(contract_run.stderr)
    fresh=current_regression();http=fresh['actual_http'];mismatch=fresh['mismatches']
    original_review=read(WS/'product-review.json');reference_identity=current_reference_identity()
    source={'checked_runtime_and_scripts':len(fresh['implementation_hashes']),'mismatches':mismatch,'reference_run_passed_cases':fresh['passed_cases'],'reference_run_scope':fresh['scope'],'reference_run_evidence':fresh['evidence'],
            'note':'读取最新Step56的70套/1241用例及当前191文件身份；本检查不重复执行。Step55/56局部HTTP与Step54全流程13组通过/9组部分已验分列，不证明全量S8/final通过。',
            'product_digest':product['result']['product_digest'],'product_review_digest':original_review['product_digest'],
            'current_readonly_sources':reference_identity,'superseded_exports_required':False}
    projection_file=Path(read(WS/'config.json')['source_root'])/'docs/exception-definitions.json'
    projection=read(projection_file) if projection_file.exists() else None
    projection_mismatches=[]
    if projection and projection.get('schema')=='current-prototype-projection@1':
        projection_mismatches=[r['path'] for r in projection['files'] if not (PROJECT/r['path']).is_file() or hashlib.sha256((PROJECT/r['path']).read_bytes()).hexdigest()!=r['sha256']]
        source['current_projection']={'evidence':str(projection_file),'matched_files':len(projection['files'])-len(projection_mismatches),'mismatches':projection_mismatches}
    source['fresh_current_regression']=fresh
    write(EVIDENCE/'source-fingerprints.json',source)
    versionref=read(PROJECT.parent/'需求/分析工作区/project-version.json');registry=read(versionref['registry']);version=registry['versions'][versionref['version_id']]
    version_state={'project_id':registry['project_id'],'version_id':versionref['version_id'],'label':version['label'],'revision':version['revision'],'stages':version.get('stages',{}),
                   'planning_flow_mode':read(WS/'config.json')['flow_mode'],'formal_approvals_written_by_this_check':False}
    write(EVIDENCE/'version-state.json',version_state)
    confirmation={'passed':False,'reason':'未提供当前已确认的正式开发包，未把资料交接包当成批准。'}
    if formal_package is not None:
        formal_package=Path(formal_package).resolve()
        needed=['manifest.json','confirmation-basis.json','execution-authority.json']
        if all((formal_package/name).is_file() for name in needed):
            verified=tool([CLI.parent/'project_versions.py','check-package',formal_package])
            same=read(formal_package/'manifest.json').get('product_digest')==product['result']['product_digest']
            confirmation={'passed':verified['exit_code']==0 and same,'original_check':verified,'current_product_matches':same,'package':str(formal_package)}
        else:confirmation={'passed':False,'reason':'正式包缺少受控确认/执行授权文件；必须由真实流程生成，不能手填。','package':str(formal_package)}
    write(EVIDENCE/'formal-package-check.json',confirmation)
    dev_errors=development['result']['errors'];write(EVIDENCE/'engineering-blocker-summary.json',{'count':len(dev_errors),'by_code':dict(collections.Counter(e['code'] for e in dev_errors)),
          'responsibility':'工程由开发绑定；本次不修改target repo/stack/modules/persistence/interfaces以减少错误数。','questions':[{'id':q['id'],'question':q['question']} for q in plan['open_questions']]})
    partial=[]
    partial_owners={
      'R-015':([45,46],['EQ-PLAT-PROFESSIONAL','EQ-PLAT-ACCEPTED-CALL'],'预外呼718正常重呼的真实部署、首次/后续尝试和准确号码身份，由服务对接负责人补证。'),
      'R-062':([32],['EQ-PLAT-PROFESSIONAL'],'原专业目录停用与既有场景/已受理任务的真实行为须核证；不重开旧v2流转迁移。'),
      'R-089':([1,4,5],['EQ-PLAT-IDENTITY'],'统一认证与AI/Cloud权威身份映射须真实材料，不以同名/手机号或Mock映射证明。'),
      'R-101':([2,42,46],['EQ-PLAT-PHONE','EQ-PLAT-ACCEPTED-CALL'],'切现场后后台租户任务与电话坐席条件的实际效果须分别验证。'),
      'R-103':([4],['EQ-PLAT-IDENTITY'],'当前共用租户稳定主体及企业/模块映射须核证，旧历史迁移口径另按当前范围核定。'),
      'R-107':([5],['EQ-PLAT-IDENTITY'],'AI/Cloud开通和实际启停来源须核证，不能用本地开关替代。'),
      'R-112':([5],['EQ-PLAT-IDENTITY'],'两模块真实授权码/成员角色映射及撤权效果由权限服务负责人给证据。'),
      'R-116':([6,42,46],['EQ-PLAT-PHONE','EQ-PLAT-ACCEPTED-CALL'],'本租户停用、有限当前收尾及已受理任务继续的真实证据分别补齐。'),
      'R-119':([6,42,46],['EQ-PLAT-PHONE','EQ-PLAT-ACCEPTED-CALL'],'全局停用生效范围、准确当前通话和话后退出/重试边界实际验证。'),
      'R-139':([9,32],['EQ-PLAT-PROFESSIONAL'],'按当前分类/专业目录语义核定停用后新选择与已有专业执行的边界，再补真实证据。'),
      'R-142':([32,33],['EQ-PLAT-PROFESSIONAL'],'专业具体场景、标签场景与共用分类的真实稳定ID引用核证，不按名称合并。'),
      'R-144':([37,38,39],['EQ-PLAT-CONTACT-STATE','EQ-PLAT-REMOTE'],'原条款含历史名单迁入，已不属于当前旧v2兼容范围；产品先核定适用口径，当前来源/期限/解除合同仍须真实核证。'),
      'R-154':([39,46],['EQ-PLAT-ACCEPTED-CALL','EQ-PLAT-REMOTE'],'供应商已受理未拨号码拦截/取消/删除能力逐供应商核证，有差异明确列出。'),
      'R-157':([38,39],['EQ-PLAT-CONTACT-STATE','EQ-PLAT-REMOTE'],'真实来源、期限、解除生效和多来源聚合核证；不把当前设计扩成历史迁移任务。'),
      'R-159':([32,33,34,35,40,47],['EQ-PLAT-PROFESSIONAL'],'按222原专业key核对生产可用范围和真实参数/权限；保留未实现能力边界。'),
      'R-166':([45,46],['EQ-PLAT-PROFESSIONAL','EQ-PLAT-ACCEPTED-CALL'],'正常718重呼与异常补提交的真实合同和同次结果分别提供证据。')}
    for line_no,line in enumerate((PROJECT/'memory/acceptance-map.md').read_text().splitlines(),1):
        if line.startswith('|') and re.search(r'\|\s*Partial\s*\|',line):
            ident=line.strip('|').split('|',1)[0].strip();ts,qs,note=partial_owners.get(ident,([],[],'由产品与验证负责人核定当前范围，再分派真实补验证据。'))
            partial.append({'id':ident,'line':line_no,'row':line,'task_ids':[f'TASK-{n:03}' for n in ts],'engineering_question_ids':qs,'closure_action':note,'owner':'产品核定范围，验证负责人复验；真实工程/服务证据由开发及对应服务负责人提供'})
    write(EVIDENCE/'partial-acceptance.json',{'count':len(partial),'items':partial,'status':'当前Partial仍需核定；已逐条核定的旧Partial另见prototype-scope-boundary.json'})
    scope_path=PROJECT/'memory/global-acceptance-20261030/partial-scope-disposition.json'
    if scope_path.exists():
        scope_proof=read(scope_path)
        for row in scope_proof['rows']:
            nums,qs,note=partial_owners.get(row['requirement_id'],([],[],row['prototype_scope']))
            row['task_ids']=[f'TASK-{n:03}' for n in nums]
        write(EVIDENCE/'prototype-scope-boundary.json',scope_proof)
    for name in ['global-verification.json','product-bidirectional-review.json','browser-summary.json','static-checks.json','reference-integrity.json','current-link-integrity.json']:
        source_file=PROJECT/'memory/global-acceptance-20261030'/name
        if source_file.exists():write(EVIDENCE/('prototype-'+name),read(source_file))
    pkg=package_check(out);write(EVIDENCE/'package-integrity.json',pkg)
    gates=[
      {'id':'G-PRODUCT','name':'当前产品资料核对（非正式交接批准）','status':'passed' if product['result']['ready'] and product['result']['semantic_review']=='current' and not projection_mismatches else 'blocked','summary':'产品校验'+str(len(product['result']['errors']))+'错误；产品语义复核'+product['result']['semantic_review']+'；当前原型投影漂移'+str(len(projection_mismatches))+'项。DRAFT未声明正式语义交接门禁通过。','owner':'产品负责人','required_for':'planning'},
      {'id':'G-CONTRACTS','name':'本轮审计的当前规则与口径一致性','status':'passed' if contracts['passed'] else 'blocked','summary':str(len(contracts['checks']))+'项ELSE、AI准入、当前计数和草稿状态检查；发现相反的当前要求即阻断资料承接。','owner':'产品/交接复核','required_for':'planning'},
      {'id':'G-TASKS','name':'逻辑任务、验收与专业能力承接','status':'passed' if coverage['passed'] else 'blocked','summary':str(coverage['tasks'])+'任务覆盖'+str(coverage['locals'])+'动作、'+str(coverage['fields'])+'字段、'+str(coverage['pages'])+'页面、'+str(coverage['checks'])+' CHECK、'+str(coverage['acceptance'])+' AC及222专业key；依赖检查'+('通过' if coverage['passed'] else '失败')+'。','owner':'任务编制/产品复核','required_for':'planning'},
      {'id':'G-REFERENCE','name':'当前原型回归证据及源码身份','status':'passed' if fresh['passed'] and reference_identity['passed'] else 'blocked','summary':'最新Step56记录'+str(fresh['script_count'])+'套/'+str(fresh['passed_cases'])+'用例，失败'+str(fresh['failed_cases'])+'；本次仅核'+str(len(fresh['implementation_hashes']))+'文件SHA，当前不符'+str(len(mismatch))+'项，未重复运行。实际HTTP'+str(http['passed_groups'])+'组通过/'+str(http['partial_groups'])+'组部分已验，不能作为全量浏览器或全局通过。','owner':'验证负责人','required_for':'planning'},
      {'id':'G-PACKAGE','name':'本次交接文件完整性','status':'passed' if pkg['passed'] else 'blocked','summary':'manifest/相对链接'+('核查通过' if pkg['passed'] else '生成后核查')+'，包内状态保留DRAFT。','owner':'交接整理','required_for':'planning'},
      {'id':'G-GLOBAL','name':'当前原型有限Mock全局与final制作门禁','status':('passed' if fresh['passed'] and proto['s8']['result']['passed'] and proto['final']['result']['passed'] and loop_status['stage']=='none' and not loop_status['finalDirty']['dirty'] else 'blocked') if http['fully_accepted'] else 'deferred-unverified','summary':'S7='+str(proto['s7']['result']['passed'])+'；S8='+str(proto['s8']['result']['passed'])+'；final='+str(proto['final']['result']['passed'])+'；阶段='+loop_status['stage']+'；快照干净='+str(not loop_status['finalDirty']['dirty'])+'。最新HTTP'+str(http['passed_groups'])+'组通过/'+str(http['partial_groups'])+'组部分已验，完整验收未授予；本项仅为formal门禁，不阻止当前资料完整的DRAFT查看包导出。回归绿不代替下载、真实音频、组合边界、file和真实接口补验。','owner':'原型验证负责人/产品范围责任人','required_for':'formal'},
      {'id':'G-ENGINEERING','name':'开发工程绑定与正式开发校验','status':'passed' if development['result']['ready'] and development['result']['semantic_review']=='current' else 'blocked','summary':'目标库/七项工程/物理映射/文件/自动化执行绑定由开发完成；当前'+str(len(dev_errors))+'条派生诊断不是同数量的产品缺陷；全量工程语义复核='+development['result']['semantic_review']+'。','owner':'开发负责人及服务对接负责人','required_for':'formal'},
      {'id':'G-APPROVAL','name':'版本快照和真实阶段确认','status':'passed' if confirmation['passed'] else 'blocked','summary':'当前版本已登记阶段：'+(', '.join(version.get('stages',{})) or '无')+'；正式确认按原工具check-package核验当前产品及受控批准；current/standalone资料不代替批准。','owner':'当前版本实际业务/运营/工程评审责任人','required_for':'formal'}]
    blocker_groups=blockers(proto['final'])
    if not http['fully_accepted']:blocker_groups.append({'category':'最新HTTP实际验证仍有未验子项','count':http['partial_groups'],'case_ids':[row['id'] for row in http['partial_cases']],'errors':['全量验收未通过；部分已验组不是同数量的产品缺陷。'],'action':'按current-http-acceptance.json逐项补实际证据；下载、真实音频、未知回执/停止/新周期等未验范围不得用脚本或旧S8/final通过替代。'})
    result={'schema':'product-task-handoff-gates@1','checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),
      'scope':scope,'planning_material_ready':all(g['status']=='passed' for g in gates if g['required_for']=='planning'),
      'formal_development_ready':all(g['status']=='passed' for g in gates),
      'gates':gates,'prototype_blocker_groups':blocker_groups,'current_http_acceptance':http,
      'product_digest':product['result']['product_digest'],'task_plan_sha256':hashlib.sha256((WS/'plan.json').read_bytes()).hexdigest(),
      'boundary':'仅检查和报告，不调用approve/complete、不改旧验证、不绑定未知工程、不产生execution-authority；正式实施仍需原工具现场check-package。'}
    write(EVIDENCE/'handoff-gates.json',result)
    print(json.dumps({k:result[k] for k in ['planning_material_ready','formal_development_ready','product_digest']},ensure_ascii=False))
    return 0 if (result['planning_material_ready'] if scope=='planning' else result['formal_development_ready']) else 1

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--scope',choices=['planning','formal'],default='planning');p.add_argument('--out',type=Path,default=OUT);p.add_argument('--formal-package',type=Path)
    a=p.parse_args();raise SystemExit(run(a.scope,a.out,a.formal_package))
