"""Refresh reviewed documentation from portable, authored local inputs.

Does not fetch the network or mutate frozen analysis inputs / pre-existing official
snapshots. Run before build_delivery.py and build_development_guide.py. Only its owned
field review, confirmations, appendix Markdown, decisions and new references change.
"""
from pathlib import Path
from collections import Counter
from urllib.parse import unquote
from html import escape
import hashlib, json, re

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs'
INPUT = ROOT / 'documentation/input'
DATA = json.loads((INPUT/'consolidated-reviewed-facts.json').read_text())
VERSION = DATA['version']
DATE = DATA['date']
LATEST_DECISION_ID = max((row['id'] for row in DATA['decisions']), key=lambda value: int(value.split('-')[1]))
CURRENT_DECISION_RANGE = 'D-044至'+LATEST_DECISION_ID
LATEST_SOURCE_REF = max((row['sourceRef'] for row in DATA['decisions']), key=lambda value: int(value.split('-')[1]))

def dump(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')

def table(headers, rows):
    def clean(v): return str(v).replace('|','&#124;').replace('\n',' ')
    return '\n'.join(['| '+' | '.join(headers)+' |','|'+'|'.join(['---']*len(headers))+'|']+['| '+' | '.join(clean(c) for c in row)+' |' for row in rows])+'\n'

def refs(row, sources):
    return ' / '.join('['+i+']('+sources[i]['url']+')' for i in row.get('sourceIds',[]) if i in sources) or '平台本地规则（D-059）' if row.get('area')=='客户业务信息' else ' / '.join('['+i+']('+sources[i]['url']+')' for i in row.get('sourceIds',[]) if i in sources) or '平台本地规则'

def refresh_catalog_mappings(audit):
    # Recompute project traceability after every authored mapping override, also
    # for older sources whose immutable snapshots did not need refreshing.
    # Field paths include parent containers (data.agent), arrays and arrows; use
    # complete identifiers so sipCause cannot also match sipCauseAsyncUpdateFlag.
    mapping_fields=[(m,set(re.findall(r'[A-Za-z_][A-Za-z0-9_]*',m['field']))) for m in audit['mappings']]
    for row in audit['catalog']:
        ids=[m['id'] for m,names in mapping_fields if row['sourceId'] in m.get('sourceIds',[]) and row['field'] in names]
        row['mappingIds']=ids
        row['adoption']='当前采用映射见'+','.join(ids) if ids else '契约已摘录；本期未采用或接入待确认，未冒充已实现'
    return audit

def sources_and_catalog(audit):
    # Each authored source names its capture input. Existing captures retain their
    # metadata/basis; new report captures also retain HTML for independent review.
    reviews={}
    existing={unquote(p['url']):p['id'] for p in audit['sources']}
    for source in DATA['sources']:
        input_name=source.get('reviewInput','inbound-official-review.json')
        if input_name not in reviews:
            reviews[input_name]=json.loads((INPUT/input_name).read_text())
        review=reviews[input_name]
        byurl={unquote(p['url']):p for p in review['pages']}
        sid=source['id']; page=byurl[unquote(source['url'])]
        assert page['status']==200
        assert existing.get(unquote(source['url']),sid)==sid, 'Duplicate official URL under different ID'
        name=source.get('name') or unquote(source['url']).split('/')[-1].removesuffix('.html')
        text=page['text']; blocks=page.get('sectionedTables') or [dict(section=name,rows=rows) for rows in page['tables']]
        raw=ROOT/'references/alicti'/sid
        captures=[('.txt',text),('.json',json.dumps(blocks,ensure_ascii=False,indent=2)+'\n')]
        if 'html' in page: captures.append(('.html',page['html']))
        for suffix,content in captures:
            path=raw.with_suffix(suffix)
            if path.exists(): assert path.read_text()==content, 'Refusing to rewrite snapshot '+str(path)
            else: path.write_text(content)
        metadata=dict(id=sid,name=name,url=source['url'],status=200,retrievedAt=page.get('retrievedAt',review['retrievedAt']),sha256=hashlib.sha256(text.encode()).hexdigest(),tables=len(blocks),characters=len(text),endpoint=source['endpoint'],reviewDecision=source.get('reviewDecision','D-024'),hashBasis='extracted_text_snapshot',snapshotCapture='text_and_tables')
        if page.get('preserveExistingTextSnapshot'):
            metadata.update(hashBasis='preserved_tool_capture_bytes',snapshotCapture=page.get('captureFormat','existing_capture'),reviewedAt=page.get('reviewedAt'),originalCaptureTime=page.get('originalCaptureTime','not_recorded'))
        if 'html' in page:
            metadata.update(snapshotCapture='text_tables_and_html',htmlSha256=hashlib.sha256(page['html'].encode()).hexdigest(),htmlHashBasis='official_html_snapshot',originalEvidence=page.get('originalEvidence',''))
        audit['sources']=[s for s in audit['sources'] if s['id']!=sid]+[metadata]
        audit['catalog']=[f for f in audit['catalog'] if f['sourceId']!=sid]
        for ti,block in enumerate(blocks,1):
            head=block['rows'][0]
            if '类型' not in head: continue
            for fi,cells in enumerate(block['rows'][1:],1):
                row=dict(zip(head,cells)); field=cells[0] if cells else ''; section=block.get('section',name)
                audit['catalog'].append(dict(id=f'{sid}-T{ti:02}-F{fi:03}',sourceId=sid,section=section,field=field,type=row.get('类型',''),required=row.get('要求',row.get('可选','返回字段/按方法')),description=row.get('描述',row.get('说明','')),constraints=row.get('备注',''),mappingIds=[],adoption='',url=source['url']))
    return audit

def fields(render=True):
    audit=json.loads((DOC/'field-alignment.json').read_text())
    old_ids={m['id'] for m in DATA['mappings']}
    audit['mappings']=[m for m in audit['mappings'] if m['id'] not in old_ids and m['id']!='FA-087']+DATA['mappings']
    sources={s['id']:s for s in audit['sources']}
    sources.update({s['id']:s for s in DATA['sources']})
    for m in audit['mappings']:
        if m['id'] in old_ids:m['sources']=[sources[i]['url'] for i in m['sourceIds']]
        if m['id']=='FA-091':
            m.update(label='从AliCti同步已有坐席',prototypeField='seatImport.rows / enterpriseId / tenantId',sourceIds=['DOC-342','DOC-343'],rule='来源为当前enterpriseId下已在AliCti存在的坐席；agent/query分页解包data.agents[].agent，按原字符串工号agent/get查证。start>=0；limit=1–1000默认10；cnos最多500。',action='界面明确来源账号和同步到租户，仅写入本地授权池；重复或已归属其他租户跳过，不新增远端坐席、不覆盖姓名或技能。',evidence='js/components/alicti-seat-import.js',sources=[sources[i]['url'] for i in ['DOC-342','DOC-343']])
    for m in audit['mappings']:
        patch=DATA.get('mappingOverrides',{}).get(m['id'])
        if patch:
            m.update(patch)
            m['sources']=[sources[i]['url'] for i in m['sourceIds']]
    for mapping in audit['mappings']:
        for key in ['label','rule','action']:
            if isinstance(mapping.get(key),str):mapping[key]=mapping[key].replace('技能组','技能')
    audit=refresh_catalog_mappings(sources_and_catalog(audit))
    audit.update(version=VERSION,sourceCount=len(audit['sources']),reviewedMappingCount=len(audit['mappings']),catalogFieldCount=len(audit['catalog']),counts=dict(Counter(m['status'] for m in audit['mappings'])))
    base=audit['scope'].split(' 本轮统一更新：')[0]
    base=base.replace('当前云联络中心与平台边界；未将既有AI链路改成AliCti。','当前原型只覆盖 AliCti 云联络中心与平台自有能力。')
    base=base.replace('CF-04仅余已发起拨号/振铃及已接通通话的收尾，不声称供应商已答复或保证挂断、删除队列。','CF-04已按D-047用户转述供应商答复关闭：暂停或结束后已发起通话正常进行并生成正常话单；不强制挂断、不改写通话结果。')
    audit['scope']=base+' 本轮统一更新：'+DATA['scopeNote']
    dump(DOC/'field-alignment.json',audit)
    if not render: return audit
    md=['# AliCti 原型字段级对齐复核','',f"版本：{VERSION}。读取 {audit['sourceCount']} 份官方正文/字段定义；逐项复核 {audit['reviewedMappingCount']} 项原型字段映射，附 {audit['catalogFieldCount']} 条带接口/方法上下文的字段契约。",'','；'.join(f'{k} {v} 项' for k,v in audit['counts'].items())+'。','',audit['scope'],'','## 原型采用字段','',table(['编号','业务字段','接口或本地字段','方向 / 类型 / 必填','最终规则','结论与处理','来源'],[[m['id'],m['label'],m['field'],m['direction']+' / '+m['type']+' / '+m['required'],m['rule'],m['status']+'；'+m['action'],refs(m,sources)] for m in audit['mappings']]),'## 官方来源','',table(['来源','文档','接口','原文'],[[s['id'],s['name'],s.get('endpoint') or '字段模型 / 工具条','[查看官方原文]('+s['url']+')'] for s in audit['sources']]),'完整字段契约见 [结构化清单](field-alignment.json) 与 [字段复核页面](field-alignment.html)。原始官方正文及表格保存在 [原始资料目录](../references/README.md)；平台数据不会额外放入供应商请求。','']
    (DOC/'field-alignment.md').write_text('\n'.join(md))
    html=(DOC/'field-alignment.html').read_text()
    # Include every current adoption category in filtering; unadopted APIs are not green successes.
    statuses=list(dict.fromkeys(['已修正','已对齐','待确认','平台字段']+list(audit['counts'])))
    options='<option>全部结论</option>'+''.join('<option>'+escape(value)+'</option>' for value in statuses)
    html=re.sub(r'(<select[^>]*id="status"[^>]*>).*?(</select>)',lambda m:m[1]+options+m[2],html,flags=re.S)
    html=html.replace("s==='平台字段'?'platform':'fixed'", "(s==='平台字段'||s==='本项目不开放')?'platform':'fixed'")
    html=re.sub(r'<a href="(?:release-notes|change-log)\.html">[^<]*</a>','',html)
    html=html.replace('<a href="functional-spec.html">完整功能说明</a>','<a href="change-log.html">版本与变更记录</a><a href="functional-spec.html">完整功能说明</a>')
    payload=json.dumps(audit,ensure_ascii=False).replace('</','<\\/')
    html=re.sub(r'(<script[^>]+id="fieldData"[^>]*>).*?(</script>)',lambda m:m[1]+payload+m[2],html,flags=re.S)
    html=re.sub(r'<footer>.*?</footer>','<footer>'+escape(VERSION+' · '+DATA['footerNote'])+'</footer>',html,flags=re.S)
    if 'delivery-nav.js' not in html:
        html=html.replace('</body>', '<script src="../js/delivery-nav.js?v=20260919-navigation2"></script></body>')
    else:
        html=re.sub(r'delivery-nav\.js(?:\?[^\"\']*)?', 'delivery-nav.js?v=20260919-navigation2', html)
    if 'field-nav-offset' not in html:
        html=html.replace('</head>', '<style id="field-nav-offset">@media(min-width:761px){body.has-delivery-nav>aside{top:var(--delivery-nav-height,48px)}}</style></head>')
    (DOC/'field-alignment.html').write_text(html)
    return audit

def confirmations(audit):
    d=json.loads((DOC/'remaining-confirmations.json').read_text())
    src={s['id']:s for s in audit['sources']}
    closing=next((i for i in d['items'] if i['id']=='CF-05'),None)
    if closing:
        closing.update(status='closed',decisionId='D-028',sourceRef='SRC-060',updatedAt=DATE,
            resolution='原响应示例的相邻时间差与Duration独立证明epoch秒，按接口区分接听方后乘1000用于本地展示；0为空时间，缺失/非法保留未知。并非由查询参数单位倒推。FA-068已修正，真实接入仍按样例验收。')
        d['items']=[i for i in d['items'] if i['id']!='CF-05']
        d['closedItems']=[i for i in d['closedItems'] if i['id']!='CF-05']+[closing]
    c=next(i for i in d['items'] if i['id']=='CF-13')
    ids=['API-317','API-318','API-319','API-327','API-362']
    c.update(question='已提供的自动任务话单obSipCause/obSipCauseRaw如何取得号码识别编码并对应本期710–724/183字典？准确识别编码字段是什么？',
        handling='自动任务话单/cc/list_cdr_auto_task已采用，不能再列为接口不存在；其接听状态与时长已明确。预测异步标识由D-053明确，呼入适用范围由D-054明确；本项目软电话呼入采用status，不依赖识别结果，本问题仅保留自动外呼识别字段和编码对应。人工、预测复用已核实字段；715/183不自定义子码。',
        sourceIds=ids,sources=[dict(id=i,url=src[i]['url'],title=src[i]['name']) for i in ids],decisionId='D-028',sourceRef='SRC-060',updatedAt=DATE)
    ids=['API-368','DOC-369','DOC-376']
    item=dict(id='CF-14',topic='队列报表两项计数说明冲突',fieldIds='FA-128',sourceIds=ids,function='FS-16：原生队列报表的呼入与接听指标',
        question='queueReport的telEnterCount、telAnswerCount中文描述与样例含义存在矛盾，请确认哪项代表呼入、哪项代表接通，并给出对应示例。',
        handling='保留两个字段原值，不交换含义、不重算相关率。当前只提供纯适配，原生队列报表UI未接入；此问题不阻断已明确的CDR聚合、首队列等待及放弃/溢出统计。',
        sources=[dict(id=i,url=src[i]['url'],title=src[i]['name']) for i in ids],decisionId='D-028',sourceRef='SRC-060',sourceType='official_document_review',questionType='documented_field_description_conflict',updatedAt=DATE)
    d['items']=[i for i in d['items'] if i['id']!='CF-14']+[item]
    seat_review=DATA.get('seatOperationsReview')
    if seat_review:
        item=next(i for i in d['items'] if i['id']=='CF-11')
        item.update(question=seat_review['cf11Question'],handling=seat_review['cf11Handling'],
                    fieldIds=seat_review['cf11FieldIds'],function='FS-12：本人及班长目标坐席的生命周期与状态核对',
                    sourceIds=['API-302','API-303','API-304','DOC-344','DOC-395'],sources=[dict(id=i,url=src[i]['url'],title=src[i]['name']) for i in ['API-302','API-303','API-304','DOC-344','DOC-395']],
                    decisionId='D-045',sourceRef='SRC-075',updatedAt=DATE)
    for authored in DATA.get('newConfirmations',[]):
        item = dict(authored)
        item['sources'] = [dict(id=i,url=src[i]['url'],title=src[i]['name']) for i in item['sourceIds']]
        d['items'] = [row for row in d['items'] if row['id'] != item['id']] + [item]
    for confirmation in d['items']:
        override=DATA.get('confirmationOverrides',{}).get(confirmation['id'])
        if override: confirmation.update(override)
    for cid,closure in DATA.get('confirmationClosures',{}).items():
        item=next((i for i in d['items']+d['closedItems'] if i['id']==cid),None)
        assert item is not None, cid
        if item.get('status')!='closed':
            item['historicalQuestion']=item.get('question','')
            item['historicalQuestionItems']=item.get('questionItems',[])
        item.update(closure)
        item.update(question='',questionItems=[],replyRequired='',handling=closure['resolution'])
        d['items']=[i for i in d['items'] if i['id']!=cid]
        d['closedItems']=[i for i in d['closedItems'] if i['id']!=cid]+[item]
    for closed in d['closedItems']:
        if closed['id']=='CF-09':
            closed['resolution']='实际提交配置或技能仍须坐席下线；20023失败不回写，启用与电话登录分开。D-045允许在线仅追加新技能并保存本地待提交，正常下线后由管理员手动通过API-309全量提交；暂存不代表供应商在线修改生效，修改既有等级或移除技能仍须先下线。'
    d.update(version=VERSION,date=DATE,confirmationRevision=VERSION,updatedQuestionIds=list(dict.fromkeys((['CF-11'] if seat_review else [])+list(DATA.get('confirmationOverrides',{}))+list(DATA.get('confirmationClosures',{}))+[row['id'] for row in DATA.get('newConfirmations',[])])),fieldReviewCount=audit['reviewedMappingCount'],remainingPendingFieldCount=audit['counts'].get('待确认',0),confirmationTopicCount=len(d['items']),preparationCount=len(d['preparations']))
    d['scope']=f"{d['fieldReviewCount']}项字段映射有{d['remainingPendingFieldCount']}项待确认；{d['confirmationTopicCount']}个供应商确认主题与{d['preparationCount']}类接入准备分别管理，不能相加。"+DATA.get('confirmationScopeNote','')
    historical=set(DATA.get('supersededDecisionIds',[]))
    new=[x['id']+'：'+('【历史阶段决定；部分口径以'+CURRENT_DECISION_RANGE+'最新决定为准】' if x['id'] in historical else '')+x['description'] for x in DATA['decisions']]
    d['confirmed']=new+[v for v in d['confirmed'] if not any(v.startswith(x['id']+'：') for x in DATA['decisions'])]
    if 'CF-04' in DATA.get('confirmationClosures',{}):
        d['confirmed']=[v.replace('已发起通话如何收尾仍待CF-04明确，不承诺挂断或删除供应商队列','已发起通话收尾已由D-047用户转述供应商答复明确：正常进行并生成正常话单，不因任务暂停或结束挂断') for v in d['confirmed']]
    current_decisions=[x for x in DATA['decisions'] if int(x['id'].split('-')[1])>=27]
    d['scopeDecisions']=[x for x in d['scopeDecisions'] if x['id'] not in {v['id'] for v in current_decisions}]+[dict(id=x['id'],date=x.get('date',DATE),status='accepted',type=x['sourceType'],description=x['description'],affectedFieldIds=x['fieldIds'],sourceRef=x['sourceRef']) for x in current_decisions]
    if DATA.get('sameTaskFollowupReview'):
        for decision in d['scopeDecisions']:
            if decision['id']=='D-032':
                decision.update(status='superseded',followedBy='D-060')
    if 'CF-04' in DATA.get('confirmationClosures',{}):
        for decision in d['scopeDecisions']:
            if decision['id'] in ['D-017','D-021']:
                if decision.get('followedBy')!='D-047':decision['historicalDescription']=decision['description']
                decision.update(followedBy='D-047',closedConfirmationIds=['CF-04'],remainingConfirmationIds=[],description='原暂停、继续及结束规则保持；已发起通话的收尾部分现按D-047 / SRC-077用户转述供应商答复明确：正常进行并生成正常话单，CF-04已关闭。原决定来源不改写为当时已获供应商确认。')
    dump(DOC/'remaining-confirmations.json',d)
    md=['# 待确认与接入准备','',f'版本：{VERSION} · {DATE}','',d['scope'],'','## 已采用结论','']+['- '+v for v in d['confirmed']]+['','## 待答复问题','']
    for item in d['items']:
        md += ['### '+item['id']+' '+item['topic'],'','**关联功能**：'+item['function']+'；'+item['fieldIds'],'','**问题**：'+item['question'],'','**当前处理**：'+item['handling'],'','**接口来源**：'+refs(item,src),'']
    md += ['## 已关闭主题','',table(['编号','主题','结论'],[[x['id'],x['topic'],x.get('resolution',x.get('handling',''))] for x in d['closedItems']]),'## 接入准备','',table(['编号','事项','内容'],[[x['id'],x['item'],x['detail']] for x in d['preparations']]),'']
    text='\n'.join(md).rstrip()+'\n'; (DOC/'remaining-confirmations.md').write_text(text)
    from build_delivery import markdown_html,shell
    body=markdown_html(text)
    for item in d['items']:body=re.sub(r'<h3 id="[^"]*">'+re.escape(item['id']),'<h3 id="'+item['id']+'">'+item['id'],body)
    for item in d['closedItems']:body=body.replace('<td>'+item['id']+'</td>','<td id="'+item['id']+'">'+item['id']+'</td>')
    nav=[('已采用结论','已采用结论')]+[(x['id'],x['id']+' '+x['topic']) for x in d['items']]+[('已关闭主题','已关闭主题')]+[(cid,cid+' 已关闭') for cid in DATA.get('confirmationClosures',{})]+[('接入准备','接入准备')]
    (DOC/'remaining-confirmations.html').write_text(shell('待确认与接入准备',body,nav,'remaining-confirmations.md'))
    return d


def appendix(audit):
    p=DOC/'rules-appendix.md'; s=p.read_text()
    s=re.sub(r'附表版 v[\d.]+(?:（[^）]*）)?｜\d{4}-\d{2}-\d{2}', '附表版 v'+DATA['appendixVersion']+'（'+VERSION+'）｜'+DATE,s)
    s=s.replace('补齐四步任务创建、简化重呼和开发实施边界','同步当前队列、外呼组、班长监控、号码管理与任务导入规则')
    replacements={
    'A-10':['交付事实优先级','当前用户决定、字段级核验及对应官方快照约束供应商事实；平台权限和业务行为按本附表与完整功能说明。',f"平台模型和适配层设计不冒充AliCti原生对象；{audit['sourceCount']}份快照采集于{DATA['sourceRange']}，旧56份保持采集时原文。",'SRC-042–'+LATEST_SOURCE_REF],
    'F-07':['新增坐席 / 从AliCti同步坐席','当前范围','本租户','不允许','连续工号批量新增最多100个；已有坐席query/get只读查证后写本地归属、重复跳过；DOC-341 / DOC-342 / DOC-343；D-022'],
    'G-23':['从AliCti同步坐席','先确认来源供应商账号和同步到租户，再agent/query分页读取、agent/get按原字符串工号查证；同步已有坐席到本地授权池。','重复或已归属其他租户跳过；不调用agent/create，不覆盖姓名技能，不把电话实时状态作为配置查询。','DOC-342 / DOC-343；D-022'],
    'I-07':['共享号码与呼入归属','共享号码可作为呼入路由的中继号码条件，使用官方ivrRouter接口配置。平台租户归属、客户数据权限与路由目标分别维护。','本地租户可见性不证明供应商按租户隔离；条件组合与未命中行为见CF-10。','API-350–API-354；D-024'],
    'J-06':['语音流程列表与详情','从ivrProfile/list读取资源，按当前账号、ivrType=1与使用范围选择既有流程；自动外呼传任务ivrId，呼入路由routerType=1传ivrId。','列表不提供实际运行保证；本期不制作供应商流程编辑器。呼入路由可直接创建、编辑、启停与删除。','DOC-348 / DOC-349 / API-350 / API-351；D-024'],
    'J-07':['呼入归属','呼入规则由供应商账号统一管理；平台以明确的本地归属控制规则可见范围，通话依原记录归属收集。','号码共享或相同目标不能唯一推导租户；localTenantIds不是供应商入参，不以本地可见性宣称远端隔离。','D-024；API-319 / API-350–API-354'],
    'J-08':['呼入条件匹配','配置来电地区、既有时间条件与中继号码；优先级小值优先。','条件跨类/类内组合、留空和未命中行为保留CF-10，不自建AND/OR、排队或兜底引擎。','API-350 / API-351；CF-10'],
    'M-09':['呼入路由（已有接口）','已有ivrRouter/create、update、list、get、delete；三种目标、优先级、条件、启停均按官方字段配置，删除须停用。','CF-10收敛为条件组合、空值、未命中语义与共享来电归属证据；本期选取既有IVR和资源，不制作流程编辑器，不把本地可见租户当远端分流证据。','API-350–API-354 / DOC-355–DOC-359；D-024']}
    for rid,row in replacements.items():
        pattern=r'^\| '+rid+r' \|.*$'; assert re.search(pattern,s,re.M),rid
        s=re.sub(pattern,'| '+' | '.join([rid]+row)+' |',s,flags=re.M)
    s=s.replace('agent/delete、skill/create、skill/update、skill/list 已提供；号码控制、路由发布仍待确认','agent/delete、skill/create、skill/update、skill/list及ivrRouter增改查删已提供；剩余条件语义见CF-10')
    s=s.replace('真实共享呼入分流见 CF-10','呼入条件组合与未命中语义见 CF-10')
    s=s.replace('呼入发布分流见CF-10','呼入条件语义见CF-10').replace('CF-10仅呼入发布分流','CF-10现仅呼入条件语义').replace('真实呼入分流待确认','条件组合及未命中行为待确认')
    s=re.sub(r'接口依据为\d+份AliCti官方文档',f"接口依据为{audit['sourceCount']}份AliCti官方文档",s)
    s=s.replace('呼入按键、非服务时间和排队兜底的实际远端执行仍待确认。','呼入规则CRUD已有官方依据；条件组合、空条件、未命中及共享来电唯一归属仍见CF-10。')
    blocks={
    'G':('坐席同步与配置记录补充',[
      ['G-26','资料纠正','明确失败的坐席创建记录进入原表单修改资料，保留原始失败原因，提交前重新核验对象和当前范围。','纠正失败继续保留输入；成功不再开放重复提交，不把旧失败原因覆盖成成功。','D-023 / API-307'],
      ['G-27','配置记录分支','可修正资料显示“修改资料”，成功显示“查看记录”，技能超时或结果未知显示“查看原因”。','只读原因不自动查询或重放远端写操作；不提供意义不明的统一重试按钮。','D-023'],
      ['G-28','纠正历史','保留configurationRecordId、failureReason、latestResult、repairHistory、retryInput及更新时间。','失败、未知、成功分别记录；刷新恢复原记录与最新状态，防止失效窗口重复提交。','FA-114 / D-023']]),
    'I':('计划到店门店与数据权限',[
      ['I-13', '门店名称输入', '计划到店门店为选填plannedStoreName字符串，去除首尾空白，无需对应系统门店或租户。', '目的地文本不迁移客户归属、不创建门店关联、不授权跨店访问，仍按原客户权限保存。', 'D-034 / FA-112'],
      ['I-14', '历史门店兼容', '旧记录继续显示已保存名称；名称未变且非空时可保留旧plannedStoreId，改名或清空则清除旧ID。', '不得按输入名称寻找或新建租户；ID仅历史兼容，不是新表单必填项。', 'D-034 / FA-113']]),
    'J':('官方呼入路由配置',[
      ['J-11','管理权限','超级管理员在当前供应商账号创建、编辑、启停和删除呼入规则；租户管理员仅查看明确归属本租户的规则。','运营无配置入口；对象、业务域和上下文改变后提交被拒绝。','D-024；当前权限实现'],
      ['J-12','接听方式与目标','1语音导航传ivrId整数；2电话号码传tel字符串；3分机传exten字符串，均按对应类型必填。','只发送当前目标分支；分机保留前导零，号码不是坐席工号。','API-350 / API-351；FA-095 / FA-096'],
      ['J-13','优先级和启停','priority为同enterpriseId唯一的正整数，小值优先；active=1启用、2停用。','创建默认1、更新默认2不同，本期始终显式提交；删除前须停用。','API-350 / API-351 / API-354'],
      ['J-14','名称与说明','创建name可选；更新/删除的name是定位条件，本期使用id定位，编辑名称只读；description可选。','不把更新接口name误作改名字段。','FA-099 / FA-100'],
      ['J-15','条件格式','地区传号码/前缀/区号；时间传时间条件ID；中继传numberTrunk不含areaCode；多值均用分号。','原模型示例与写入说明不一致时保留原响应，不自动拼接或剥离区号；CF-10不虚构匹配规则。','FA-101–FA-103'],
      ['J-16','资源列表','选择既有IVR、时间、中继和分机资源；分机data.list分页limit≤500，其余候选data为数组。','租户可见性元数据只用于本地权限过滤，不进入AliCti请求。','DOC-348 / DOC-355–DOC-359；FA-105'],
      ['J-17','回执与未知结果','list返回data包装对象数组；详情返回data包装对象，内含enterpriseIvrRouter与enterpriseTimeList。写失败保留原规则，未知留存原请求等待核对。','不由超时推断失败或成功；未知期间阻止重复写；本地成功演示不代表供应商联调。','FA-104 / FA-106；D-024']]),
    'K':('客户业务信息与通话快照',[
      ['K-16','六项选填','线索等级、意向等级、到店意向、试驾意向、计划到店时间、计划到店门店均可留空。','留空不阻断原有话后处理完成；六项独立，不要求时间与门店同时填写。','D-025；FA-107–FA-112'],
      ['K-17','本地业务选项','线索A级/B级/C级/D级；意向高/中/低/无；到店与试驾分别有意向/暂不确定/无意向。','本期演示选项来自本地字典，不属于号码状态、话单status或AliCti/AI供应商标签。','mock/customer-followup.js；D-025'],
      ['K-18','填写入口','话后处理填写并随完成操作保存；已结束且在当前可处理客户范围内的通话可在详情补录或修改本通信息。','进行中通话不可从详情补录；原生待处理通话由本人话后处理完成；保存前复核完整身份和权限。','D-025；CustomerFollowup.canEdit'],
      ['K-19','保存与汇总','每次通话保留独立customerFollowup快照；客户档案按更新时间逐字段汇总最近非空值。','新通话留空不会清空其他通话已有值；修改本通只影响本通快照并重算档案，不批量覆盖历史。','FA-113 / D-025'],
      ['K-20', '身份与元数据', '按enterpriseId+tenantId+完整客户号码+callId保存；updatedAt、updatedBy由内部生成，plannedStoreId仅兼容历史。', 'plannedStoreName为选填业务文本；相同号码跨账号/租户或不同callId不共用快照。', 'FA-112 / FA-113 / D-034'],
      ['K-21','时间与保存失败','计划到店时间为有效本地日期时间、精确到分钟；持久化成功后才更新通话与档案。','非法日期、存储失败、上下文变化或旧版本冲突保留输入并提示，不显示成功、不自动预约或发消息。','D-025；CustomerFollowup.validate/save']])}
    s=re.sub(r'<!-- /?consolidated-[GIJK] -->', '', s)
    for sec,(heading,rows) in blocks.items():
        mark='consolidated-'+sec
        # Replace only this authored subsection; later incremental sections
        # (for example J.18) are maintained independently and must survive.
        pattern=r'\n### '+sec+r'\.10 .*?(?=\n### [A-Z]\.\d+\b|\n## 附表 |\Z)'
        block='\n### '+sec+'.10 '+heading+'\n\n'+table(['规则编号','规则项','具体规则','边界 / 异常处理','依据'],rows)+'\n\n'
        if re.search(pattern,s,re.S):
            s=re.sub(pattern,lambda _:block,s,count=1,flags=re.S)
        else:
            nextsec=chr(ord(sec)+1)
            s=s.replace('## 附表 '+nextsec,block+'## 附表 '+nextsec,1)
    # Incremental reviewed rows are applied after legacy authored subsections so
    # replay cannot resurrect the pre-regression rules.
    for rid,row in DATA.get('appendixRowOverrides',{}).items():
        pattern=r'^\| '+re.escape(rid)+r' \|.*$'
        assert re.search(pattern,s,re.M), rid
        s=re.sub(pattern,'| '+' | '.join([rid]+row)+' |',s,flags=re.M)
    # M.10 was retitled after CF-14 supplier clarification; remove its superseded generated block.
    s=re.sub(r'\n### M\.10 本轮已核验与新增说明冲突\n.*?(?=\n### |\n## 附表 |\Z)', '', s, flags=re.S)
    for section in DATA.get('appendixSections',[]):
        heading=section['heading']
        pattern=r'\n### '+re.escape(heading)+r'\n.*?(?=\n### |\n## 附表 |\Z)'
        block='\n### '+heading+'\n\n'+table(section.get('headers',['规则编号','规则项','具体规则','边界 / 异常处理','依据']),section['rows'])+'\n'
        if re.search(pattern,s,re.S):s=re.sub(pattern,lambda _:block,s,count=1,flags=re.S)
        else:s=s.replace('## 附表 '+section['before'],block+'\n## 附表 '+section['before'],1)
    s=s.replace('CF-04仅余已发起拨号/振铃及已接通通话的收尾','CF-04已按D-047用户转述供应商答复关闭：已发起通话正常进行并生成正常话单')
    s=s.replace('CF-04仍保留已发起拨号/振铃及已接通通话的收尾','当时保留的CF-04已由D-047供应商答复关闭，已发起通话正常收尾')
    pending=json.loads((DOC/'remaining-confirmations.json').read_text())
    s=re.sub(r'剩余\d+项字段问题（FA-068），合并其他规则共\d+个供应商确认主题', f"当前{audit['counts'].get('待确认',0)}项字段待确认，另有{pending['confirmationTopicCount']}个供应商确认主题",s)
    s=re.sub(r'当前\d+项字段待确认，另有\d+个供应商确认主题',f"当前{audit['counts'].get('待确认',0)}项字段待确认，另有{pending['confirmationTopicCount']}个供应商确认主题",s)
    s=s.replace('### J.18 线路准备与使用坐席交互','### J.18 号码资源与租户授权').replace('### J.18 号码资源与使用坐席交互','### J.18 号码资源与租户授权')
    s=s.replace('六类云呼叫报表','七类云呼叫报表').replace('六类云报表','七类云报表')
    s=s.replace('同步线路准备、已有号码同步、号码使用坐席，以及坐席同步、配置纠正、呼入路由与客户业务信息等当前实现。','同步软电话分机本地配置、号码租户授权及当前业务引用；保留既有接听、话后、报表及呼入规则。')
    # Refresh the current-rule introduction without rewriting historical decisions.
    s=re.sub(r'本附表与\[完整功能说明\]\(functional-spec.html\)共同(?:交付|使用)，[^\n]*', '本附表与[完整功能说明](functional-spec.html)共同使用，原规则编号保持稳定。'+DATA['scopeNote']+'总部enterpriseId=7522240、同品牌门店enterpriseId=7522241，UUID不参与接口；未明确的供应商语义见待确认清单。原型演示不等于真实联调通过。', s)
    s=s.replace('服务类型用于当前 enterpriseId 品牌通用分类，内部沿用 templateId；租户技能组用于独立成员和呼叫资源配置。同一类型可对应多个租户及每个租户多个组，不共享坐席、等级或号码授权。', '服务类型用于当前 enterpriseId 品牌通用分类，内部沿用 templateId；租户技能组独立维护成员和技能等级。同一类型可对应多个租户及每个租户多个组；号码按租户独立授权，不设置号码与技能组绑定。')
    current,marker,history=s.partition('## 附表 N')
    current=current.replace('技能组','技能')
    current=re.sub(r'^服务类型用于当前 enterpriseId 品牌通用分类.*$', '当前直接维护租户技能及成员、等级，不再维护或选择服务类型。技能、队列、外呼组与号码租户授权分别维护。',current,flags=re.M)
    s=current+marker+history
    # Stable source index entries for newly appended official snapshots.
    rows=[]
    for item in DATA['sources']:
        source=next(x for x in audit['sources'] if x['id']==item['id'])
        row='| '+' | '.join([source['id'],source['name'],source.get('endpoint') or '字段模型','[官方原文]('+source['url']+')'])+' |'
        s=re.sub(r'^\| '+source['id']+r' \|.*\n?','',s,flags=re.M)
        rows.append(row)
    source_end=s.index('\n',s.index('| DOC-349 |'))
    s=s[:source_end+1]+'\n'.join(rows)+'\n'+s[source_end+1:]
    for decision in DATA['decisions']:
        row='| '+decision['id']+' / '+decision['sourceRef']+' · '+decision['title']+' | '+('历史阶段记录，部分口径由'+CURRENT_DECISION_RANGE+'最新决定更新。' if decision['id'] in DATA.get('supersededDecisionIds',[]) else '')+decision['description']+' | '+decision['sourceType']+'；原官方快照只读，不冒充生产联调。 |'
        s=re.sub(r'^\| '+decision['id']+r'(?: / | · ).*\n?','',s,flags=re.M)
        s=s.rstrip()+'\n'+row+'\n'
    p.write_text(re.sub(r'\n{3,}', '\n\n', s).rstrip()+'\n')


def decisions():
    p=DOC/'decisions.md'; s=p.read_text()
    for d in DATA['decisions']:
        s=re.sub(r'\n## '+d['id']+r'\b.*?(?=\n## |\Z)','',s,flags=re.S)
        text=f"\n\n## {d['id']} · {d['title']}（{d.get('date',DATE)}）\n\n- 来源{d['sourceRef']}，类型`{d['sourceType']}`。{d['description']}\n- 采用字段：{', '.join(d['fieldIds'])}；官方依据：{', '.join(d['sourceIds']) or '本地业务规则，无新增供应商入参'}。\n- 本次统一更新由用户明确授权；不改写冻结分析输入或原官方快照。版本`{d.get('version',VERSION)}`，附表v{d.get('appendixVersion',DATA['appendixVersion'])}；开发生产验收与原型演示分别记录。\n"
        if d['id'] in DATA.get('supersededDecisionIds',[]):text+='- 当前采用提示：本条保留历史阶段决定；与'+CURRENT_DECISION_RANGE+'的最新决定冲突的旧界面、关系、权限或兼容处理不再作为本期实现要求。\n'
        if d['id']=='D-032' and DATA.get('sameTaskFollowupReview'):text+='- 当前再次联系以D-060为准：保留原taskId，在原任务内追加批次和客户行，不再新建任务；本条新任务方案仅作历史记录。\n'
        if d['id']=='D-024':text+='- 新增10份原文快照：API-350–API-354路由CRUD；DOC-355分机列表、DOC-356时间列表、DOC-357中继列表、DOC-358路由模型、DOC-359时间模型。DOC-348为已有来源，仅复核不重新计数。条件逻辑及实际命中规则证据保留CF-10，D-068已取消同账号共享号码跨租户方案，不宣称供应商按本地租户隔离。\n'
        if d['id']=='D-025':text+='- 六项信息为当次通话选填内容，档案逐字段取最近非空值，不把当前汇总倒填旧通话。当前门店输入按D-034：plannedStoreName为自由文本，plannedStoreId仅历史兼容，updatedAt/updatedBy仍由内部保存。\n'
        if d['id']=='D-026':text+='- 历史说明：本阶段曾按租户和团队配置号码；当前号码导入默认归属唯一业务租户，以D-068为准，不再预览或绑定技能组/坐席。授权不代表电话上线、实际可拨或呼入路由已生效；供应商号码池ID不等于skillId。\n'
        s=s.rstrip()+text
    p.write_text(s)
    p=DOC/'supplier-clarifications.json'; j=json.loads(p.read_text())
    if DATA.get('reportReview'):
        j['reportReview']={**DATA['reportReview'],'productionVerificationClaimed':False}
    if DATA.get('resourceUxReview'):
        j['resourceUxReview']={**DATA['resourceUxReview'],'productionVerificationClaimed':False}
    else:
        j['consolidatedReview']=dict(version=VERSION,date=DATE,decisions=DATA['decisions'],sourcePolicy=DATA['sourcePolicy'],newOfficialSourceIds=[x['id'] for x in DATA['sources']],narrowedConfirmationIds=['CF-10'],productionVerificationClaimed=False)
    j['consolidatedIncrementReview']={**DATA.get('consolidatedIncrementReview',{}),'decisions':[x for x in DATA['decisions'] if int(x['id'].split('-')[1])>=30],'productionVerificationClaimed':False}
    clarification=DATA.get('taskInFlightClarification')
    if clarification:
        j['taskInFlightClarification']=clarification
        j['closedConfirmationIds']=list(dict.fromkeys(j.get('closedConfirmationIds',[])+['CF-04']))
        for key in ['taskLifecycleClarification','taskExecutionDecision']:
            old=j.get(key,{})
            if old.get('remainingQuestions'):old['historicalRemainingQuestions']=old['remainingQuestions']
            old.update(remainingQuestions=[],closedConfirmationIds=['CF-04'],followedBy='D-047',remainingQuestionUpdateSource='D-047 / SRC-077：用户转述供应商答复已关闭CF-04；旧决定的原始来源类型保留')
            old['boundaries']=[x for x in old.get('boundaries',[]) if '仍待CF-04' not in x]
    if DATA.get('numberUseClarification'):
        j['numberUseClarification']=DATA['numberUseClarification']
        j['closedConfirmationIds']=list(dict.fromkeys(j.get('closedConfirmationIds',[])+['CF-06']))
    for key in ['queueCounterClarification','seatRecreationClarification','seatBatchClarification','connectionLifecycleClarification','numberRecognitionClarification','inboundNumberRecognitionClarification','developmentPackageSync','dailyAlignment','sameTaskFollowupReview','manualTimePriorityReview','uiFieldAlignmentReview','singleTenantReview','callerNavigationReview','multiCallerNavigationReview','workingModeReview','seatLoginReview','defaultNavigationAndSeatThresholdReview','navigationMultiplicityReview']:
        if DATA.get(key):j[key]=DATA[key]
    if DATA.get('deliveryMaintenance'):j['deliveryMaintenance']=DATA['deliveryMaintenance']
    j['closedConfirmationIds']=list(dict.fromkeys(j.get('closedConfirmationIds',[])+list(DATA.get('confirmationClosures',{}))))
    dump(p,j)


def main():
    audit=fields(); pending=confirmations(audit); appendix(audit); decisions()
    print(json.dumps(dict(version=VERSION,sourceCount=audit['sourceCount'],mappingCount=audit['reviewedMappingCount'],catalogCount=audit['catalogFieldCount'],counts=audit['counts'],confirmationTopics=pending['confirmationTopicCount']),ensure_ascii=False))

if __name__=='__main__':main()
