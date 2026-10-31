"""Read-only handoff checks; does not approve, complete stages or authorize code.

--scope planning checks product/task material completeness only.
--scope formal additionally requires real engineering/global/approval gates.
Original project check-package remains mandatory before business implementation.
"""
from pathlib import Path
import argparse, collections, datetime, hashlib, json, re, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
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

def current_regression(summary):
    """New bounded fixture checks, never a rewritten old/global/browser result."""
    projection=read(ROOT/'续接记录/current-prototype-evidence.json') if (ROOT/'续接记录/current-prototype-evidence.json').exists() else None
    targets=set(summary['implementationHashes'])
    if projection:targets.update(row['path'] for row in projection['files'])
    suite=read(PROJECT/'memory/local-tenant-flow-regression-20261030.json') if projection else None
    rows=[{'script':r['script'],'command':['node',r['script'],'--output','pending-output']} for r in suite['results']] if suite else list(summary['results'])
    # Copy only known isolated local fixtures, preserving their assertions and
    # redirecting an explicit temporary JSON output into this evidence folder.
    fixtures=[]
    for original in ['/private/tmp/check-cloud-leave-request-20261030.cjs','/private/tmp/check-customer-directory-interaction-20261030.cjs']:
        p=Path(original)
        if not projection or not p.is_file():continue
        code=p.read_text()
        if any(token in code for token in ['child_process','fetch(','http.request','localStorage.clear']):raise RuntimeError('Unexpected fixture IO '+original)
        code=code.replace("'/private/tmp/customer-directory-interaction-regression-20261030.json'",json.dumps(str(EVIDENCE/'directory-fixture-output.json')))
        dest=ROOT/'续接记录/targeted-tests'/p.name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(code)
        fixtures.append({'script':str(dest),'command':['node',str(dest)],'source_sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
    rows+=[{'script':name,'command':['node',name,'--output','pending-output']} for name in ['scripts/check-ai-only-coordination.cjs','scripts/check-inheritance.cjs','scripts/check-simulation-selection.cjs'] if name not in {r['script'] for r in rows}]
    rows+=fixtures
    def hashes():
        return {p:hashlib.sha256((PROJECT/p).read_bytes()).hexdigest() if (PROJECT/p).is_file() else None for p in sorted(targets)}
    before=hashes();cached=EVIDENCE/'current-runtime-summary.json'
    if cached.exists():
        prior=read(cached)
        fixture_hashes={r['script']:r['source_sha256'] for r in fixtures}
        if prior.get('passed') and prior.get('implementation_hashes')==before and prior.get('scripts')==[r['script'] for r in rows] and prior.get('fixture_source_hashes')==fixture_hashes:return prior
    dest=EVIDENCE/'current-runtime';dest.mkdir(exist_ok=True)
    def one(row):
        command=list(row['command']);script=Path(row['script']).name;out=dest/(script+'.json')
        if out.exists():out.unlink() # own derived output, never a prototype/user file
        if '--output' in command:command[command.index('--output')+1]=str(out)
        r=subprocess.run(command,cwd=PROJECT,text=True,capture_output=True,timeout=60)
        raw=r.stdout
        if '--output' in command and out.exists():raw=out.read_text()
        try:data=json.loads(raw)
        except ValueError:data=None
        errors=[];passed=None;failed=None
        if isinstance(data,dict) and isinstance(data.get('tests'),list):
            cases=data['tests'];passed=sum(c.get('status')=='pass' for c in cases);failed=sum(c.get('status')!='pass' for c in cases)
            if data.get('passed')!=passed or data.get('failed')!=failed:errors.append('reported and actual case counts differ')
            write(out,data)
        elif isinstance(data,dict) and isinstance(data.get('passed'),int):
            passed=data['passed'];failed=data.get('failed');write(out,data)
        else:write(out,{'scope':'script-level assertion; no invented case count','command':command,'exit_code':r.returncode,'stdout':r.stdout,'stderr':r.stderr})
        ok=r.returncode==0 and not errors and failed in [None,0]
        return {'script':row['script'],'command':command,'exit_code':r.returncode,'passed':ok,'passed_cases':passed,'failed_cases':failed,'assertions':data.get('assertions') if isinstance(data,dict) else None,'errors':errors,'stderr':r.stderr,'evidence':'current-runtime/'+out.name}
    with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(one,rows))
    after=hashes();changed=[p for p in before if before[p]!=after[p]]
    report={'schema':'current-handoff-runtime-check@1','checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'scope':'existing actual-built model/workspace/script fixtures; no browser, provider, stage or approval claims',
            'script_count':len(results),'scripts':[r['script'] for r in rows],'fixture_source_hashes':{r['script']:r['source_sha256'] for r in fixtures},'passed_cases':sum(r['passed_cases'] or 0 for r in results),'failed_cases':sum(r['failed_cases'] or 0 for r in results),
            'passed':all(r['passed'] for r in results) and not changed,'changed_during_checks':changed,'implementation_hashes':after,'results':results}
    write(cached,report);return report

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
    contract_run=subprocess.run([sys.executable,str(ROOT/'check_current_contracts.py')]+(['--package'] if (out/'handoff-gates.json').exists() else []),text=True,capture_output=True)
    contracts=read(EVIDENCE/'current-contracts.json')
    if contract_run.returncode and contracts['passed']:raise RuntimeError(contract_run.stderr)
    current=read(PROJECT/'memory/direct-followup-verification-20261030.json');summary=read(PROJECT/current['regression']['freshEvidenceSummary'])
    mismatch=[name for name,sha in summary['implementationHashes'].items() if not (PROJECT/name).is_file() or hashlib.sha256((PROJECT/name).read_bytes()).hexdigest()!=sha]
    original_review=read(WS/'product-review.json');reference_identity=current_reference_identity()
    source={'checked_runtime_and_scripts':len(summary['implementationHashes']),'mismatches':mismatch,'reference_run_passed_cases':current['regression']['passedCases'],'reference_run_scope':current['scope'],'reference_run_date':current['date'],
            'note':'本次仅回读并核对前次422项验证的文件身份，不声称本次重新执行422项；不证明当前全局S8/final通过。',
            'product_digest':product['result']['product_digest'],'product_review_digest':original_review['product_digest'],
            'current_readonly_sources':reference_identity,'superseded_exports_required':False}
    projection_file=Path(read(WS/'config.json')['source_root'])/'docs/exception-definitions.json'
    projection=read(projection_file) if projection_file.exists() else None
    projection_mismatches=[]
    if projection and projection.get('schema')=='current-prototype-projection@1':
        projection_mismatches=[r['path'] for r in projection['files'] if not (PROJECT/r['path']).is_file() or hashlib.sha256((PROJECT/r['path']).read_bytes()).hexdigest()!=r['sha256']]
        source['current_projection']={'evidence':str(projection_file),'matched_files':len(projection['files'])-len(projection_mismatches),'mismatches':projection_mismatches}
    fresh=current_regression(summary) if mismatch else None
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
      {'id':'G-REFERENCE','name':'现有局部原型证据身份','status':'passed' if (not mismatch or fresh and fresh['passed']) and reference_identity['passed'] else 'blocked','summary':('122文件与前次step-28证据一致，当前仅核身份，未重跑其422项。' if not mismatch else str(len(mismatch))+'文件与前次不同；已实际补跑当前构建'+str(fresh['passed_cases'])+'项，失败'+str(fresh['failed_cases'])+'，运行中漂移'+str(len(fresh['changed_during_checks']))+'。')+'这些是局部Mock/脚本证据，不是新鲜浏览器或全局通过。','owner':'验证负责人','required_for':'planning'},
      {'id':'G-PACKAGE','name':'本次交接文件完整性','status':'passed' if pkg['passed'] else 'blocked','summary':'manifest/相对链接'+('核查通过' if pkg['passed'] else '生成后核查')+'，包内状态保留DRAFT。','owner':'交接整理','required_for':'planning'},
      {'id':'G-GLOBAL','name':'当前原型有限Mock全局与final制作门禁','status':'passed' if proto['s8']['result']['passed'] and proto['final']['result']['passed'] and loop_status['stage']=='none' and not loop_status['finalDirty']['dirty'] else 'blocked','summary':'S7='+str(proto['s7']['result']['passed'])+'；S8='+str(proto['s8']['result']['passed'])+'；final='+str(proto['final']['result']['passed'])+'；阶段='+loop_status['stage']+'；快照干净='+str(not loop_status['finalDirty']['dirty'])+'。范围为有限Mock/获准HTTP；真实接口、file自动和人审批分列。','owner':'原型验证负责人/产品范围责任人','required_for':'formal'},
      {'id':'G-ENGINEERING','name':'开发工程绑定与正式开发校验','status':'passed' if development['result']['ready'] and development['result']['semantic_review']=='current' else 'blocked','summary':'目标库/七项工程/物理映射/文件/自动化执行绑定由开发完成；当前'+str(len(dev_errors))+'条派生诊断不是同数量的产品缺陷；全量工程语义复核='+development['result']['semantic_review']+'。','owner':'开发负责人及服务对接负责人','required_for':'formal'},
      {'id':'G-APPROVAL','name':'版本快照和真实阶段确认','status':'passed' if confirmation['passed'] else 'blocked','summary':'当前版本已登记阶段：'+(', '.join(version.get('stages',{})) or '无')+'；正式确认按原工具check-package核验当前产品及受控批准；current/standalone资料不代替批准。','owner':'当前版本实际业务/运营/工程评审责任人','required_for':'formal'}]
    result={'schema':'product-task-handoff-gates@1','checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),
      'scope':scope,'planning_material_ready':all(g['status']=='passed' for g in gates if g['required_for']=='planning'),
      'formal_development_ready':all(g['status']=='passed' for g in gates),
      'gates':gates,'prototype_blocker_groups':blockers(proto['final']),
      'product_digest':product['result']['product_digest'],'task_plan_sha256':hashlib.sha256((WS/'plan.json').read_bytes()).hexdigest(),
      'boundary':'仅检查和报告，不调用approve/complete、不改旧验证、不绑定未知工程、不产生execution-authority；正式实施仍需原工具现场check-package。'}
    write(EVIDENCE/'handoff-gates.json',result)
    print(json.dumps({k:result[k] for k in ['planning_material_ready','formal_development_ready','product_digest']},ensure_ascii=False))
    return 0 if (result['planning_material_ready'] if scope=='planning' else result['formal_development_ready']) else 1

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--scope',choices=['planning','formal'],default='planning');p.add_argument('--out',type=Path,default=OUT);p.add_argument('--formal-package',type=Path)
    a=p.parse_args();raise SystemExit(run(a.scope,a.out,a.formal_package))
