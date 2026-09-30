"""Build the product documentation from authored content and current reviewed facts.

Run from any directory. Inputs in the parent analysis folder are read-only.
Normalized documentation input snapshots are kept beside this script.
"""
from pathlib import Path
from collections import Counter
from html import escape
import json, re, hashlib
from functional_content import VERSION, DATE, SECTIONS, CURRENT_FUNCTIONS, DEFAULTS

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs'
INPUT = ROOT / 'documentation' / 'input'
INPUT.mkdir(parents=True, exist_ok=True)

def dump(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')

def current_statistics(audit):
    pending=json.loads((DOC/'remaining-confirmations.json').read_text())
    counts=Counter(row['status'] for row in audit['mappings'])
    rule_text=(DOC/'rules-appendix.md').read_text()
    rule_count=len(re.findall(r'^\| [A-M]-\d+ \|',rule_text,re.M))
    return dict(fields=len(audit['mappings']),sources=len(audit['sources']),rules=rule_count,
                counts=counts,pending=counts['待确认'],topics=len(pending['items']),preparations=len(pending['preparations']))

def update_readme_statistics(audit):
    path=ROOT/'README.md'
    if not path.exists():return
    stats=current_statistics(audit)
    text=path.read_text()
    summary=(f"本原型仅展示 AliCti 云联络中心。账号管理映射 FS-01/FS-02，独立多技能队列映射 FS-05，班长监控映射 FS-12，外呼组映射 FS-21，分机、时间条件和业务分类分别映射 FS-22/FS-23/FS-24。当前交付包含 {stats['fields']} 项字段映射、{stats['rules']} 条附表规则和 {stats['sources']} 份供应商文档快照。"
             f"字段状态为 {stats['counts']['已修正']} 项已修正、{stats['counts']['已对齐']} 项已对齐、{stats['pending']} 项待确认、{stats['counts']['平台字段']} 项平台字段、{stats['counts']['本项目不开放']} 项本项目不开放；另有 {stats['topics']} 个供应商确认主题及 {stats['preparations']} 类接入准备，分别统计。开发按 [阅读指引](docs/development.html) 定位现有说明和代码，不再另行生成重复开发资料。")
    text=re.sub(r'<!-- current-statistics -->.*?<!-- /current-statistics -->','<!-- current-statistics -->\n'+summary+'\n<!-- /current-statistics -->',text,flags=re.S)
    path.write_text(text)

def load_inputs():
    source = ROOT / 'memory/feature-list.md'
    if source.exists():
        features=[]
        for line in source.read_text().splitlines():
            if not line.startswith('| FUNC-'): continue
            row=[x.strip() for x in line.strip('|').split('|')]
            features.append(dict(id=row[0],area=row[2],module=row[3],name=row[5],description=CURRENT_FUNCTIONS.get(row[0],row[6]),
                                 storyIds=json.loads(row[9]),acceptanceIds=json.loads(row[10]),scenarioIds=json.loads(row[11])))
    else: features=json.loads((INPUT/'functions.json').read_text())
    source=ROOT.parent/'analysis/planning/page-index.json'
    if source.exists():
        pages=json.loads(source.read_text())['pages']
        # Page labels and references are preserved, old supplier assertions are not copied.
        pages=[{k:p[k] for k in ['id','name','route','roles','domain','function_ids','scenario_ids','sequence_ids']} for p in pages]
    else: pages=json.loads((INPUT/'pages.json').read_text())
    # Historical planning inputs can include another product. Filter before
    # writing the normalized snapshots so generators cannot read obsolete scope.
    features=[item for item in features if item['id'] not in {'FUNC-278','FUNC-279','FUNC-280','FUNC-281'}]
    pages=[item for item in pages if item.get('domain')!='AI_OUTBOUND']
    dump(INPUT/'functions.json',features)
    dump(INPUT/'pages.json',pages)
    return features,pages,json.loads((DOC/'field-alignment.json').read_text())

def inline(text):
    text=escape(str(text),quote=False)
    text=re.sub(r'`([^`]+)`',r'<code>\1</code>',text)
    text=re.sub(r'\*\*([^*]+)\*\*',r'<strong>\1</strong>',text)
    text=re.sub(r'\[([^\]]+)\]\(([^)]+)\)',lambda m:'<a href="'+escape(m[2],quote=True)+'">'+m[1]+'</a>',text)
    return text

def heading_id(text):
    match=re.search(r'(FS-\d+|附表 ([A-N])|DEV-\d+)',text)
    if match:return match.group(2) or match.group(1)
    return re.sub(r'[^\w\u4e00-\u9fff-]+','-',text).strip('-')

def markdown_html(md):
    lines=md.splitlines();out=[];i=0;code=False;heading_counts=Counter()
    while i<len(lines):
        line=lines[i]
        if line.startswith('```'):
            code=not code;out.append('<pre><code>' if code else '</code></pre>');i+=1;continue
        if code:out.append(escape(line)+'\n');i+=1;continue
        if not line.strip():i+=1;continue
        if line.startswith('|'):
            rows=[]
            while i<len(lines) and lines[i].startswith('|'):
                r=[v.strip().replace('&#124;','|') for v in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-{3,}:?',v or '') for v in r):rows.append(r)
                i+=1
            width=len(rows[0]); assert all(len(r)==width for r in rows),rows[:2]
            out.append('<div class="table-wrap"><table><thead><tr>'+''.join('<th scope="col">'+inline(c)+'</th>' for c in rows[0])+'</tr></thead><tbody>')
            for row in rows[1:]:
                rid=row[0] if re.fullmatch(r'(?:[A-N]-\d+|API-\d+|DOC-\d+|FUNC-\d+|FA-\d+)',row[0]) else ''
                out.append('<tr'+(' id="'+rid+'"' if rid else '')+'>'+''.join('<td>'+inline(c)+'</td>' for c in row)+'</tr>')
            out.append('</tbody></table></div>');continue
        m=re.match(r'^(#{1,6}) (.+)',line)
        if m:
            n=len(m[1]);hid=heading_id(m[2]);heading_counts[hid]+=1
            if heading_counts[hid]>1:hid+='-'+str(heading_counts[hid])
            out.append(f'<h{n} id="{hid}">{inline(m[2])}</h{n}>');i+=1;continue
        if line.startswith('- '):
            out.append('<ul>')
            while i<len(lines) and lines[i].startswith('- '):out.append('<li>'+inline(lines[i][2:])+'</li>');i+=1
            out.append('</ul>');continue
        if re.match(r'^\d+\. ',line):
            out.append('<ol>')
            while i<len(lines) and re.match(r'^\d+\. ',lines[i]):out.append('<li>'+inline(re.sub(r'^\d+\. ','',lines[i]))+'</li>');i+=1
            out.append('</ol>');continue
        out.append('<p>'+inline(line)+'</p>');i+=1
    return '\n'.join(out)

def shell(title,body,nav,download='',kind='spec'):
    mainlinks='<a href="change-log.html">版本与变更记录</a><a href="functional-spec.html">完整功能说明</a><a href="interaction.html">规则附表 A–M</a><a href="exception-definitions.html">异常定义表</a><a href="field-alignment.html">字段级对齐清单</a><a href="remaining-confirmations.html">待确认与接入准备</a><a href="development.html">开发阅读指引</a>'
    links=''.join('<a href="#'+escape(i)+'" data-search="'+escape(t)+'">'+escape(t)+'</a>' for i,t in nav)
    actions=(f'<a href="{download}" download>下载 Markdown</a>' if download else '')+'<button type="button" onclick="window.print()">打印 / 保存 PDF</button><a href="../index.html" data-delivery-switch="prototype">返回原型 →</a>'
    return f'''<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>{escape(title)}</title><link rel="stylesheet" href="../assets/css/delivery-docs.css?v={VERSION}"></head><body class="doc-page doc-{kind}"><aside class="doc-sidebar" aria-label="文档目录"><h2>交付文档</h2><div class="doc-catalog">{mainlinks}</div><label class="doc-search-label" for="doc-search">查找目录</label><input id="doc-search" type="search" placeholder="输入功能名称或编号"><nav>{links}</nav><p id="doc-search-empty" hidden>没有匹配的目录项</p></aside><main class="doc-main"><div class="doc-actions">{actions}</div>{body}</main><script src="../js/documentation-nav.js?v={VERSION}"></script><script src="../js/delivery-nav.js?v=20260919-navigation2"></script></body></html>'''

def table(headers, rows):
    def clean(v):return str(v).replace('|','&#124;').replace('\n',' ')
    return '\n'.join(['| '+' | '.join(headers)+' |','|'+'|'.join(['---']*len(headers))+'|']+['| '+' | '.join(clean(c) for c in r)+' |' for r in rows])+'\n'

def build_spec(features,pages,audit):
    # Current presentation labels override the frozen input names without changing snapshots.
    def current_label(value):
        value={'保存租户用号授权':'确认号码自动归属','导入已有坐席':'从 AliCti 同步坐席','查询同步记录':'查询坐席配置记录',
               '校验业务域访问权限':'校验云联络中心访问权限','修改租户授权':'修改租户配置'}.get(value,value)
        for old in ['自动 IVR 外呼','自动IVR外呼','IVR 外呼','IVR外呼','IVR 任务','IVR任务']:
            value=value.replace(old,'自动外呼任务' if '任务' in old else '自动外呼')
        return value.replace('技能组','技能')
    features=[dict(f,name=current_label(f['name'])) for f in features]
    pages=[dict(p,name=current_label(p['name'])) for p in pages]
    byid={x['id']:x for x in features}; ownership={}; sections=[]
    for raw in SECTIONS:
        s=dict(raw);s['functionIds']=['FUNC-'+x for x in s.pop('functions').split()];s['relatedFunctionIds']=['FUNC-'+x for x in s.pop('relatedFunctions','').split()]
        s['pageIds']=s.pop('pages').split();s['sourceIds']=s.pop('sources').split();s['ruleSections']=s.pop('rules').split();s['fieldIds']=[f'FA-{n:03}' for n in s.pop('fields')];s['files']=s['files'].split()
        # Only real file references are included in the source map.
        s['files']=[f for f in s['files'] if (ROOT/f).exists()]
        for f in s['functionIds']:
            assert f in byid,f
            assert f not in ownership,f
            ownership[f]=s['id']
        sections.append(s)
    assert set(ownership)==set(byid),(set(byid)-set(ownership),set(ownership)-set(byid))
    for f in features:
        f['sectionId']=ownership[f['id']]
        f['pageIds']=[p['id'] for p in pages if f['id'] in p['function_ids']]
        f['implementation']='cancelled_in_current_scope' if f['id'] in ['FUNC-229','FUNC-230'] else 'prototype_hint_only' if f['id']=='FUNC-275' else 'documented_prototype_or_pending_branch'
    stats=current_statistics(audit)
    dates=sorted({source['retrievedAt'][:10] for source in audit['sources'] if isinstance(source.get('retrievedAt'),str) and re.match(r'^\d{4}-\d{2}-\d{2}',source['retrievedAt'])})
    unknown_capture_count=sum(not source.get('retrievedAt') for source in audit['sources'])
    capture_note=(f"有记录的采集日期为 {dates[0]} 至 {dates[-1]}" if dates else '既有采集日期未记录')+(f"；另有 {unknown_capture_count} 份既有快照未记录原抓取时间，本轮仅补入索引并记录审阅时间" if unknown_capture_count else '')
    m=['# 功能说明文档','',f'AliCti 云联络中心 · {VERSION} · {DATE}','',
       '本说明只覆盖 AliCti 云联络中心原型：账号租户、坐席技能、分机、时间条件、客户管理与自定义字段、队列、外呼组、号码、客户、预外呼、自动外呼、人工电话、呼入、通话媒体、业务报表及治理审计。开发和测试以本说明、规则附表和字段对齐清单共同验收；供应商未知规则由具体确认项约束。',
       '', '## 一 版本说明','',table(['版本号','更新时间','更新内容'],[['2026-09-30-local-logic-fixes-1','2026-09-30','D-088本地逻辑修复：已保存任务持久化并保留客户关联；租户改绑保护补齐业务分类、独立字段、号码池及任务台账；直接导入失败保留输入并补偿保存。供应商字段和附表保持原事实基线。'],['2026-09-30-call-data-sync-demo-1','2026-09-30','D-087局部交互：话后资料同步不阻塞按原规则保存与自动置闲；列表详情独立展示同步状态、最近同步时间和刷新。折叠演示话单延迟、合成录音后到及异常恢复；独立本地journal可随浏览器刷新恢复，不代表真实后端或供应商SLA。任务进度与已同步话单统计分开；供应商字段和附表沿用下列事实基线。'],[VERSION,DATE,'D-086：同一enterpriseId可登记多个外显导航；预外呼和自动外呼创建时从当前账号显式选择一个，本任务可选多个本租户号码池。任务保存所选导航与号码池，目录变化不回填，移除时阻止启动并要求编辑原任务。该决定替代D-083的单导航自动带入，预测座席阈值规则仍有效。'],['2026-09-24-business-category-fields-1','2026-09-24','D-085：取消独立业务模板实体。业务分类用有序fields数组直接引用本租户字段库，每项fieldId、enabled、required，数组位置决定顺序；分类可零字段，线索分类须含六项预置字段。独立字段及选项可选businessKey、租户隔离、导入与通话校验、档案和统计不变；原型不做旧模板兼容。D-074/D-077三层关系仅留历史。'],['2026-09-23-supervisor-event-history-1','2026-09-23','D-084：班长监控事件页签按平台接收/观察时间倒序预览最近5条；查看全部事件进入分页二级页。主列表只保留时间、坐席/工号、事件或状态、来源，移除无统一接口字段的前态与说明。API-316只有企业事件订阅、API-315 type=9只有推送设置、DOC-344只有当前状态；生产历史由本方服务端鉴权采集、租户过滤、去重和持久化。静态原型不宣称已接实时推送。D-083及此前范围继续适用。'],['2026-09-23-task-seat-threshold-default-navigation-1','2026-09-23','D-083（外显导航口径已由D-086替代）：预测任务minAvailableAgentCount默认10、范围1–10，任务内可用座席数低于阈值自动暂停；只有autoStart=1且因座席不足自动暂停的任务在人数恢复到阈值时自动启动，手工暂停、号码停用保护暂停及结束不自动恢复。API-311/API-404仅证明阈值、定时字段与不足自动暂停；自动恢复为用户转述供应商业务口径，CF-18待联调。每enterpriseId由自建系统保存AliCti线下提供的一个固定默认外显导航标识，任务自动带入category=5和customerClidsGroup，号码池仍可选；供应商侧唯一性与标识有效性见CF-15。D-082班长监控、D-081号码池、D-078任务级固定号码边界和D-077业务配置入口继续适用。'],['2026-09-23-supervisor-monitor-access-1',DATE,'D-082：班长监控内设“监控概览／坐席事件日志”二级页签。本租户ADMIN未关联本人坐席或未上线可查看今日已结束外呼统计、按enterpriseId与原String cno逐席使用DOC-344 agentStatus/get取得的只读坐席状态，以及已有事件日志；平台再按tenantId授权范围过滤，后台控制查询频率。队列实时状态及管理置忙、置闲、下线仍须关联有效班长坐席、本人上线、供应商班长资格及本租户授权队列；不把状态快照说成queueStatus或供应商事件推送。'],['2026-09-23-tenant-number-pool-1',DATE,'D-081：[AliCti号码池四接口](../references/README.md)支持本租户号码池管理。租户管理员按当前租户关联enterpriseId查询、新增、删除、更新；预外呼和自动外呼只从本租户列表选择池名，clidPoolList仍只传name和选填priority。创建后通过更新加入号码，默认池和容量遵守官方限制；静态原型只模拟接口请求与回执，不发真实供应商请求。'],['2026-09-23-task-caller-contract-1',DATE,'D-078：API-311/API-404没有任务级指定号码字段，预外呼与自动外呼取消固定号码/外显导航二选一；供应商导航参数虽可选，本原型为明确选号口径要求新建任务显式选择当前账号已登记导航，按接口传customerClidsCategory=5、customerClidsGroup、可选clidPoolList与customerTimeout。API-312的taskTelList[].clid仅在名单逐客户行显式提供时可选，不从任务或批次自动推导；与导航同传的优先关系仍待CF-15确认。沿用D-077：客户管理仅保留业务分类菜单，分类、模板与字段在业务分类页内维护，D-074三层配置关系不变。沿用D-076：普通坐席退出固定logoutMode=1、removeBinding=0，保留坐席与接听分机的绑定，退出面板不提供解绑选项，本地坐席分机配置不清空。官方API-304支持removeBinding=1，但本产品不开放。沿用D-075：自动外呼与预外呼的名称、描述、供应商业务标签及本期采用通用设置，创建、确认、查看管理和编辑均使用本任务保存值；已建自动任务提供名称、描述和业务标签可见编辑入口，实际改动按API-404差量提交并以DOC-334回查。任务级语音流程名称优先冻结快照，既有customerTimeout缺失显示未记录，新建默认30秒不反填历史。API-404的IVR字段行与仅type=1生效章节冲突，已建type=2修改保持只读并列CF-17待供应商确认。沿用D-074：客户业务字段独立定义、同页维护，业务模板引用字段并配置顺序、显示与必填，业务分类可不关联模板，关联时至多一个且多个分类可共用；线索分类须关联启用模板。字段和单选/多选选项新增选填的业务编码，分别在本租户字段库和所属字段内唯一；保存选项使用稳定内部ID，编码仅作本地外部映射，不传AliCti。导入继续选分类，客服按模板填写，通话与档案保留正式业务值，预置六项线索统计口径不变。本原型不做旧数据迁移或历史schema兼容。']]),
       f"供应商依据为已核验的 {stats['sources']} 份 AliCti 文档快照，{capture_note}。D-081另核对官方号码池四接口并在references保存紧凑摘录，不计入既有完整快照数量。队列依据见 API-377–385：当前独立管理、多选本租户技能，参数编辑通过queue/update，技能增减按queueSkill/create、delete模拟差异请求；不开放远端队列删除。外呼组依据API-386–394，对应独立外呼组管理与任务agentGroup分支。班长管理依据DOC-395，管理下线回执reqType命名矛盾保留CF-11。报表和话单依据见 API-360–368、DOC-369–376；呼入路由依据 API-350–354、DOC-355–359，IVR 列表沿用 DOC-348。原生日报、坐席与队列适配器并不代表当前页面已接供应商原生报表；接听分段接口仅完成核对。D-020 的预测重呼支持来自用户转述供应商反馈，D-021 为用户产品确认，均不改写官方快照。当前原型是本地模拟，已修正字段不表示生产接口已联调。总部 enterpriseId=7522240、同品牌门店 enterpriseId=7522241；UUID 不参与接口。账号资料不采用服务区域，已登记enterpriseId与品牌固定；本地登记不创建供应商账号。",
       f"冻结规划保留 82 项功能编号、47 项页面规划，运行增量账号管理映射 FS-01/FS-02，独立多技能队列映射 FS-05，班长监控映射 FS-12，外呼组映射 FS-21，分机、时间条件和业务分类分别映射 FS-22/FS-23/FS-24，冻结功能和页面规划数量不代表当前运行能力与路由数，不修改冻结输入。当前有 {stats['fields']} 项字段映射、{stats['rules']} 条附表规则，其中字段状态为 {stats['counts']['已修正']} 项已修正、{stats['counts']['已对齐']} 项已对齐、{stats['pending']} 项待确认、{stats['counts']['平台字段']} 项平台字段、{stats['counts']['本项目不开放']} 项本项目不开放。{stats['topics']} 个供应商确认主题与 {stats['preparations']} 类接入准备分别管理，不与字段待确认数相加。",
       '说明材料纳入D-046至D-088；D-087为话后资料同步局部交互增量，D-088为本地逻辑修复；供应商字段与附表保留既有事实基线。开发按[阅读指引](development.html)选择本次任务需要的说明、字段和代码，不另行维护重复的开发包。具体改动、依据及交付边界见[版本与变更记录](change-log.html)。',
       '', '## 二 项目范围','',table(['系统名称','涉及板块','功能范围','对接系统范围'],[
          ['统一外呼中台','账号、租户、客户、权限、报表、审计','平台自有规则和数据归属','浏览器及平台服务端'],
          ['云联络中心','坐席、技能、队列、外呼组、号码、任务、电话、话单、媒体','按本期实际采用字段接入；未知分支保留待确认','AliCti API、CTILink、WebSocket及客户电话'],
          ['交付视图','功能说明、附表、流程、时序、架构及开发阅读指引','左侧目录进入具体内容；支持本地静态预览','项目内文档，无生产写接口']]),
       '界面交互以当前原型为准；供应商能力和字段以字段对齐清单、对应官方快照及已采纳的供应商澄清为准；平台权限以附表 A、D–I 为准。技术栈、真实环境、数据模型和服务实现由开发项目结合这些规则明确，不把演示代码直接视为生产实现。',
       '二级交互统一规则（2026-09-15）：左侧菜单负责切换主页面；业务页面内的任务创建与详情、客户批次、关联记录、报表明细和资源配置从右侧滑出的全高抽屉中打开，关闭时向右收起。每个抽屉右上角关闭，左上角“返回”逐层回到上一视图，保留原列表筛选、分页、页签和未提交输入。菜单主页面不显示返回按钮；二级抽屉、内部流程页在左上角返回。呼叫确认、拨号和振铃使用页面中央呼叫弹窗，坐席接通后切换为页面中央填写弹窗，未接通而结束则进入话后结果确认；收起或切页保留同通草稿，电话工具条可重开。二次确认置顶显示。D-039账号详情和租户清单只读，不嵌套管理入口；账号编辑启停在列表，租户维护统一从租户管理进入。关闭或返回任务创建先保存草稿，重呼等未完成输入允许保留，下一步及确认创建才执行完整必填校验；通话中可填写并自动暂存，关闭仅收起，挂断后保留内容并确认保存，正式保存前仍保持处理占用，完整保存成功后自动unpause，确认ready才恢复接听。',
       '', '## 三 逻辑说明','',table(['流程名称','跳转地址'],[
          ['业务流程图','[查看流程](../flowcharts/business-process.html)'],['时序交互图','[查看时序](../flowcharts/sequence-interaction.html)'],['关联系统架构蓝图','[查看架构](../related-systems/index.html)'],['当前任务创建和重呼流程','[查看 FS-08](#FS-08) 与 [FS-09](#FS-09)'],['当前状态与权限','[规则附表](interaction.html)']]),
       '供应商写操作按权限与归属检查、字段校验、发出请求、核对返回或查询、更新原对象与审计处理。AliCti账号目录等平台配置只在本地保存，不发供应商创建或验证请求；先持久化后公布成功。创建、导入、拨号受理与实际完成分别表达，不靠本地保存显示远端成功。',
       '', '## 四 功能说明','']
    fmap={r['id']:r for r in audit['mappings']}
    for s in sections:
        m += [f"### {s['id']} {s['title']}",'',f"**1）功能名称**：{s['title']}。{s['purpose']}",'',f"**权限范围**：{s['roles']}",'',
              '**2）交互说明**','']+[f'{i}. {t}' for i,t in enumerate(s['steps'],1)]+['', '**3）数据来源**','',
              ('；'.join(f'[{i}](interaction.html#{i})' for i in s['sourceIds']) or '平台账号、租户、业务记录及当前已授权数据；无 AliCti 等价字段要求。'),
              '来源记录：既有字段核验和采纳决定见 SRC-042–053；当前来源、平台产品决定及历次变更见[版本与变更记录](change-log.html)。官方呼入路由及资源采用依据列于本节来源；客户业务信息与配置记录为平台规则，不虚构供应商接口。相关规则：'+'、'.join(f'[附表 {r}](interaction.html#{r})' for r in s['ruleSections'])+'。',
              '**4）逻辑说明**','']+['- '+t for t in s['logic']]+['', '**异常与边界**','']+['- '+t for t in s['exceptions']]+['', '**5）功能明细**','']
        if s['functionIds']:
            m += [table(['功能编号','功能名称','当前功能说明'],[[f,byid[f]['name'],byid[f]['description']] for f in s['functionIds']])]
        if s['relatedFunctionIds']:m+=['关联功能：'+'、'.join(f'[{f}](#{f})' for f in s['relatedFunctionIds'])+'；属于已有功能内的规则，不另增加功能数量。','']
        if s['fieldIds']:
            rows=[]
            for fid in s['fieldIds']:
                r=fmap[fid];rows.append([f"{fid} {r['label']}",r['field'],','.join(r['sourceIds']),r['rule'],r['type']+'；'+r['required'],DEFAULTS[int(fid[3:])],r['action']])
            m+=[table(['功能名称','功能说明','数据来源','取值逻辑','数据格式','默认值','异常处理与实现约束'],rows)]
        m+=['**验收要点**','']+['- '+t for t in s['acceptance']]+['']
        if s['pageIds']:m+=['页面映射：'+', '.join(s['pageIds'])+'。','']
        if s.get('runtimeRoutes'):m += ['新增运行模块：'+', '.join(s['runtimeRoutes'])+'；映射本节及关联租户功能。该路由不新增或改写冻结PAGE编号，也不计入原47项页面规划。','']
    m+=['## 五 其他说明','',
        '- [规则附表 A–M](interaction.html) 保留稳定编号，完整列出状态、权限、总部门店及媒体等规则。',
        f"- [字段级对齐清单](field-alignment.html) 覆盖 {stats['fields']} 项采用映射；完整文档字段摘录仅作为参考，不表示全部纳入本期。",
        f"- [本轮待确认清单](remaining-confirmations.html) 保留 {stats['pending']} 项字段及 {stats['topics']} 个供应商主题。资源和服务开通为 {stats['preparations']} 类接入准备。",
        '- [版本与变更记录](change-log.html) 记录本轮统一交付及此前原型增量，可从左侧文档目录进入。',
        '- 本方开发补齐项 IMP-01：操作审计导出的真实文件输出；不计为供应商缺失能力。',
        '- [开发阅读指引](development.html) 按任务定位已有说明、字段、原型代码、Mock 和官方原文，避免重复读取整套材料。',
        '- 本地模拟的 taskId、fileId、skillId、音频和响应均需在实际接入时替换。演示通过不等于供应商联调或上线验收通过。',
        '- 界面保存、接口受理、实际执行和生产验收分别记录；没有明确证据不升级为成功。','']
    text='\n'.join(m)
    # Portable Markdown readers do not give table rows the HTML anchor IDs.
    markdown_text=re.sub(r'\]\(#((?:FS|FUNC)-\d+)\)',r'](functional-spec.html#\1)',text)
    (DOC/'functional-spec.md').write_text(markdown_text)
    nav=[(heading_id(x),x) for x in ['一 版本说明','二 项目范围','三 逻辑说明']]+[(s['id'],s['id']+' '+s['title']) for s in sections]+[(heading_id('五 其他说明'),'五 其他说明')]
    (DOC/'functional-spec.html').write_text(shell('功能说明文档',markdown_html(text),nav,'functional-spec.md'))
    dump(DOC/'functional-spec.json',dict(version=VERSION,date=DATE,featureCount=len(features),pageCount=len(pages),sections=sections,functions=features,pages=pages))
    return sections

def build_appendix():
    text=(DOC/'rules-appendix.md').read_text()
    nav=[(heading_id(x),x) for x in re.findall(r'^## (.+)$',text,re.M)]
    (DOC/'interaction.html').write_text(shell('功能说明文档 · 规则附表',markdown_html(text),nav,'rules-appendix.md','appendix'))
    rules=[]
    for line in text.splitlines():
        if re.match(r'^\| [A-M]-\d+ \|',line):
            cells=[c.strip() for c in line.strip('|').split('|')]
            rules.append({'id':cells[0],'section':cells[0][0],'cells':cells[1:]})
    assert len(rules)==len({r['id'] for r in rules})
    version_match=re.search(r'附表版 v(\d+(?:\.\d+)+)',text)
    if not version_match:raise ValueError('Missing appendix version in rules-appendix.md')
    dump(DOC/'rules-appendix.json',{'version':version_match[1],'date':DATE,'ruleCount':len(rules),'rules':rules})
    return rules

if __name__=='__main__':
    features,pages,audit=load_inputs()
    sections=build_spec(features,pages,audit)
    rules=build_appendix()
    update_readme_statistics(audit)
    print(json.dumps({'version':VERSION,'functions':len(features),'sections':len(sections),'pages':len(pages),'rules':len(rules)},ensure_ascii=False))
