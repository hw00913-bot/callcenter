"""Generate current developer references without resurrecting obsolete export packages."""
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parent
def read(p):return json.loads(Path(p).read_text())
def md(p,text):Path(p).write_text(text.rstrip()+'\n')
def render(out):
    out=Path(out);bs=read(ROOT/'fragments/business.json');ps=read(ROOT/'fragments/platform.json');u=read(ROOT/'fragments/ui.json')
    esc=lambda value:str(value).replace('|','／').replace('\n',' ')
    lines=['# 页面权限与数据范围','','[返回阅读入口](README.md)','','五种生产角色：'+ '、'.join(u['permissions_summary']['roles'])+'。坐席是本人电话能力，不是第六种生产角色。以下表与同源局部动作、字段权限及页面无权状态配套阅读。','']
    lines+=['| 页面 | 入口资格 | 可办理动作 | 数据范围 |','|---|---|---|---|']
    for p in u['permissions_summary']['pages']:
        lines.append('| '+' | '.join(map(esc,[f"[{p['page_id']}](ui-pages/{p['ui_page_id']}.md)",p['menu_entry'],p['operations'],p['data_scope']]))+' |')
    md(out/'权限与范围.md','\n'.join(lines))
    lines=['# 专业对象子字段与报表指标','','[返回阅读入口](README.md) · [完整字段规则](field-specs.md)','','按当前专业renderer的稳定列键解释各指标，中文说明表达同一业务含义；“尚未明确”是实际待核事实，不是产品规则尚未决定。此表不改变现有统计口径，不以未实现指标补零。','']
    for f in ps['fields']+[row for row in bs['fields'] if row.get('entity')=='CustomerProfileProjection']:
        if not (f.get('object_members') or f.get('report_variants')):continue
        lines+=['<a id="'+f['id']+'"></a>','## '+f['id']+' '+f['name'],'','[基本规则](field-specs.md#'+f['id']+')','']
        if f.get('object_members'):
            lines+=['| 子键 | 具体规则 |','|---|---|']
            for obj in f['object_members']:
                lines.append('| '+esc(obj.get('key',obj.get('name','')))+' | '+esc('；'.join(k+'='+str(v) for k,v in obj.items() if k not in ['key','name']))+' |')
        for v in f.get('report_variants',[]):
            lines+=['','### '+v['reportKind'],'', '粒度：'+v.get('grain','')+'\n\n归期：'+v.get('period',''),'','| 列键 | 含义 | 类型／单位 | 计算和空值 |','|---|---|---|---|']
            for col in v.get('columns',[]):lines.append('| '+' | '.join(map(esc,[col.get('key',''),col.get('label',''),col.get('type','')+'／'+col.get('unit',''),col.get('meaning','')]))+' |')
            for key,val in v.items():
                if key not in ['columns','grain','period','reportKind']:lines+=['',key+'：'+( '；'.join(map(str,val)) if isinstance(val,list) else str(val))]
    md(out/'专业对象与报表指标.md','\n'.join(lines))
    lines=['# 原工程缺证与当前补证责任','','[返回阅读入口](README.md)','','14项原ISSUE保持未补证事实；合并为当前12组工程问题，不因产品规则已定义或旧v2无兼容负担而删除专业契约证据缺口。','', '| 原ISSUE | 当前责任组 | 已明确产品义务 | 仍缺工程证据 |','|---|---|---|---|']
    for q in ps['engineering_issue_crosswalk']:lines.append('| '+' | '.join(map(esc,[q['legacy_issue_id'],', '.join(q['current_question_ids']),q['product_rule'],q['engineering_gap']]))+' |')
    md(out/'工程缺证追溯.md','\n'.join(lines))
    project=ROOT.parent.parent/'prototype'
    proof=read(project/'memory/http-e2e-acceptance-verification-20261101.json')
    checklist=read(project/proof['actualChecklist']);old_reg=proof['currentRegression']
    latest=read(project/'memory/devpack-publication-step60-20261103/verification-proof.json');reg=latest['currentRegression']
    profile=read(project/'memory/customer-profile-integration-20261102/verification-proof.json')
    lines=['# 当前原型验证与交付边界','','[返回阅读入口](README.md)','','当前内容承接原型Step48～60：原入口/执行、客户档案/模板任务、管理权限/创建反馈、生产全号单表及卡片精简。业务规则、已修复行为、实际验证覆盖和正式交接状态分别阅读；更新开发包或发布演示不把未验子项变成通过。','',
           '| 层次 | 当前事实 |','|---|---|',
           '| 本次Step60发布前完整自动回归 | '+str(reg['suites'])+'套脚本、'+str(reg['structuredPassed'])+'结构化用例通过、'+str(reg['structuredFailed'])+'失败；发布前已实际执行当前完整矩阵；本包维护检查只重核对应源码/构建/测试SHA，不声称它又重跑一次 |',
           '| Step55局部HTTP | 客户档案新旧AI/PRED/人工来源、准确原详情、冷刷新、分页筛选和租户切换，25条有效修后观察；70套1222为当时记录，非全局完成 |',
           '| Step56局部HTTP | 任务先选、目录自动读取、准确场景联动、最终保存/重开和滚动保持，11条有效最终观察；相关built48项；after08截图不计完整可见性通过 |',
           '| Step57局部HTTP | 总部/门店管理员三配置页及刷新恢复、四身份边界和运营六次直访拒绝；21条观察；旧快照准确红绿另为隔离内存证据 |',
           '| Step58局部HTTP | 超管PRED/IVR禁用创建并直接说明；四租户角色原向导进入后放弃，原列表保持；18条含2修前16修后，无正式任务提交 |',
           '| Step59局部HTTP | 按用户完整手机号口径撤第二表，七DEMO_ONLY样例完整号；12条含1修前11修后，原回访/计数/筛选/刷新/租户检查 |',
           '| Step60局部HTTP | 26卡各只保导入方式标签，厚朴筛选3卡正常；供应商详情/映射保持，整AI逆向单一片段回基线 |',
           '| Step54原全流程 | '+str(old_reg['suites'])+'套脚本、'+str(old_reg['structuredPassed'])+'结构化用例为当时自动回归；'+str(checklist['counts']['passed'])+'组已验、'+str(checklist['counts']['partial'])+'组部分已验；三条有限Mock主链实际闭环，全量验收未授予 |',
           '| 正式产品/工程批准 | 保留DRAFT及实际工程/版本门禁；不生成READY_FOR_DEVELOPMENT、批准或execution-authority |','',
           '前序局部证明：[Step55客户档案](../../prototype/memory/customer-profile-integration-20261102/verification-proof.json) · [Step56模板AI任务入口](../../prototype/memory/template-ai-task-entry-20261102/verification-proof.json)。实际报告：[档案修复](../../prototype/memory/customer-profile-integration-20261102/report.html) · [模板任务入口修复](../../prototype/memory/template-ai-task-entry-20261102/report.html)。',
           '当前局部证明：[Step57管理员入口](../../prototype/memory/tenant-business-management-20261103/verification-proof.json) · [Step58创建反馈](../../prototype/memory/predictive-create-permission-20261103/verification-proof.json) · [Step59完整号码单表](../../prototype/memory/ai-full-phone-profile-20261103/verification-proof.json) · [Step60卡片精简](../../prototype/memory/ai-task-card-label-20261103/verification-proof.json)。',
           'Step54原全流程证明：[http-e2e-acceptance-verification-20261101.json](../../prototype/memory/http-e2e-acceptance-verification-20261101.json)。实际报告：[HTTP验收与复现证据](../../prototype/'+proof['report']+')。本包本次身份核对：[当前回归证据](gate-evidence/current-runtime-summary.json)；[实际HTTP覆盖](gate-evidence/current-http-acceptance.json)。','',
           '## 尚未实际完成的验证','','以下是验证覆盖缺口，不是同数量的新产品缺陷，也不得因为自动回归通过而视为通过。','','| 检查组 | 尚未实际验证的子项 |','|---|---|']
    for row in checklist['cases']:
        if row['status']!='passed':lines.append('| '+esc(row['id'])+' | '+esc('；'.join(row.get('notActuallyVerified',[])))+' |')
    lines+=['','## 范围与限制','','以下限制保留Step54证据形成时的范围；其中“开发包保持冻结”记录当时状态，本次用户已授权更新开发包，不构成继续冻结要求。']+['- '+value for value in proof['limits']]
    lines+=['','## 局部诊断保留','','OBS-PROFILE-STARTUP-01：Step55刷新观察期间的MutationObserver日志未获准确来源栈，临时诊断已撤；保留待归因，不以资料同步宣布已解决或控制台零诊断。','', '原Step28、localTenant及旧S8/final报告只保留其当时范围，不能充当当前Step54通过。当前源或工程变化后重新核对并补实际证据；原需求/G3/真实服务证据缺口及工程责任不因此消失。']
    md(out/'当前原型验证边界.md','\n'.join(lines))
    marker='<!-- DEVELOPER-REFERENCES -->'
    p=out/'README.md';text=re.sub(r'<!-- DEVELOPER-REFERENCES -->[\s\S]*?<!-- /DEVELOPER-REFERENCES -->\n*','',p.read_text())
    text+='\n'+marker+'\n## 开发补充查询\n\n- [当前原型验证与未验边界](当前原型验证边界.md)\n- [页面权限与数据范围](权限与范围.md)\n- [专业对象子字段与10类报表指标](专业对象与报表指标.md)\n- [14项原工程缺证到12组责任](工程缺证追溯.md)\n\n222项专业能力统一查[专业操作任务映射](原专业操作任务映射.md)，不再重复生成第二份索引。\n<!-- /DEVELOPER-REFERENCES -->\n'
    md(p,text)
