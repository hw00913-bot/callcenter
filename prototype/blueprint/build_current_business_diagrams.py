#!/usr/bin/env python3
"""Render current D-022–D-052 diagrams into the existing SVG atlases.

Only published cards and their navigation/metadata are updated. Frozen analysis
inputs and untouched scenario cards remain unchanged. Running twice is stable.
"""
from pathlib import Path
import hashlib, html, json, re
from build_current_task_diagrams import svg as sequence_svg, wrap, text_lines

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'blueprint/current-business-diagrams.json'
E=lambda value:html.escape(str(value),quote=True)


def panel(svg,ident):
    box=re.search(r'viewBox="0 0 (\d+) (\d+)"',svg)
    width,height=box.groups()
    buttons=[('zoom-out','缩小'),('zoom-in','放大'),('fit','适应宽度'),('readable','阅读模式'),('actual','100%'),('fullscreen','全屏'),('download','下载 SVG')]
    toolbar='<div class="diagram-toolbar"><span class="renderer-label">当前交付 · 原生 SVG</span>'+''.join(f'<button type="button" data-diagram-action="{action}" aria-label="{E(label)}">{E(label)}</button>' for action,label in buttons)+'<span class="diagram-status" role="status"></span></div>'
    return f'<div class="diagram-panel" data-diagram-panel data-renderer="native" data-filename="{ident}-current.svg" data-natural-width="{width}" data-natural-height="{height}" data-view-mode="readable" style="--diagram-natural-width:{width}px">{toolbar}<div class="diagram">{svg}</div></div>'


def flow_svg(d):
    ident=d['id'];lanes=d['lanes'];xs={lane['id']:160+i*280 for i,lane in enumerate(lanes)}
    warning_x=160+len(lanes)*280;width=warning_x+160;cursor=116;nodes=[]
    for i,step in enumerate(d['steps'],1):
        lines=wrap(f'{i}. '+step['label'],18)
        bad=wrap(step.get('branch',''),18) if step.get('branch') else []
        height=max(78,len(lines)*19+24,len(bad)*19+38)
        nodes.append(dict(step=step,index=i,x=xs[step['lane']],y=cursor,h=height,lines=lines,bad=bad))
        cursor+=height+64
    height=cursor+16;digest=hashlib.sha256(json.dumps(d,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
    parts=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}" role="img" aria-label="{E(d["name"])}" data-diagram-type="business-process" data-renderer="native" data-source-id="{ident}" data-flow-id="{ident}" data-current-decision="{E(d["decisionId"])}" data-source-sha256="{digest}" data-layout-audit="pass"><defs><marker id="flow-arrow-{ident}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#667085"/></marker></defs>']
    for i,lane in enumerate(lanes+[dict(id='exceptions',name='不满足 / 待核对')]):
        x=160+i*280
        parts.append(f'<rect x="{x-138}" y="14" width="276" height="{height-30}" rx="9" fill="{["#fbfcff","#f5f8ff"][i%2]}" stroke="#e2e7f0"/><rect x="{x-126}" y="26" width="252" height="64" rx="9" fill="{ "#fff5e5" if i==len(lanes) else "#eaf0ff"}" stroke="#c3cfee"/>'+text_lines(wrap(lane['name'],16),x,53,size=13))
    for prev,node in zip(nodes,nodes[1:]):
        y1=prev['y']+prev['h'];y2=node['y'];mid=(y1+y2)//2
        parts.append(f'<path d="M {prev["x"]} {y1} V {mid} H {node["x"]} V {y2}" fill="none" stroke="#667085" stroke-width="1.7" marker-end="url(#flow-arrow-{ident})"/>')
        if prev['bad']:parts.append(text_lines(['满足后继续'],prev['x'],y1+24,color='#11865b',size=11))
    for n in nodes:
        st=n['step'];x=n['x'];y=n['y'];h=n['h'];decision=bool(n['bad'])
        fill='#f1edff' if decision else '#fff';border='#9d8ddc' if decision else '#9cafce'
        parts.append(f'<g data-step-id="{E(st["id"])}" data-lane="{E(st["lane"])}"><title>{E(st["label"])}</title><rect x="{x-118}" y="{y}" width="236" height="{h}" rx="12" fill="{fill}" stroke="{border}" stroke-width="1.6"/>'+text_lines(n['lines'],x,y+(h-len(n['lines'])*18)/2+14,size=13)+'</g>')
        if decision:
            cy=y+h/2
            parts.append(f'<path d="M {x+118} {cy} H {warning_x-120}" stroke="#c88724" stroke-width="1.5" fill="none" marker-end="url(#flow-arrow-{ident})"/><rect x="{warning_x-118}" y="{y}" width="236" height="{h}" rx="10" fill="#fff7e8" stroke="#e5b560"/>'+text_lines(n['bad'],warning_x,y+(h-len(n['bad'])*18)/2+14,color='#905b15',size=12))
    return ''.join(parts+['</svg>'])


def notes(d):
    source='、'.join(f'<a href="../docs/interaction.html#{E(x)}">{E(x)}</a>' for x in d.get('sourceIds',[])) or '平台产品规则，无 AliCti 等价请求字段'
    fields='、'.join(f'<a href="../docs/field-alignment.html#{E(x)}">{E(x)}</a>' for x in d.get('fieldIds',[]))
    rules='、'.join(f'<a href="../docs/interaction.html#{E(x)}">{E(x)}</a>' for x in d.get('ruleIds',[]))
    references=('<p>字段：'+fields+'</p>' if fields else '')+('<p>规则：'+rules+'</p>' if rules else '')
    return '<div class="section"><h3>依据与边界</h3><p>'+source+'</p>'+references+'<ul class="clean">'+''.join('<li>'+E(x)+'</li>' for x in d['notes'])+'</ul><p class="muted">当前交付增量 '+E(d['decisionId'])+'；原型演示与真实供应商接入分别验收。冻结需求输入保持原有版本。</p></div>'


def flow_card(d,version):
    rows=''.join('<tr>'+''.join('<td>'+E(v)+'</td>' for v in [i,next(l['name'] for l in d['lanes'] if l['id']==s['lane']),s['label'],s.get('branch') or '—'])+'</tr>' for i,s in enumerate(d['steps'],1))
    sequences=d.get('sequenceIds') or [d['id'].replace('SC-','SEQ-')]
    sequence_links=' · '.join(f'<a href="sequence-interaction.html#{E(seq)}">{E(seq)} →</a>' for seq in sequences)
    return f'<article class="card current-business-card" id="{d["id"]}" data-current-version="{E(version)}"><h2>{d["id"]} · {E(d["name"])}</h2><p class="muted">{E(d["purpose"])}</p><div class="meta"><span class="badge">{E(d["decisionId"])}</span><span class="badge neutral">{len(d["steps"])} 个步骤</span><span class="badge neutral">当前交付</span></div>'+panel(flow_svg(d),d['id'])+'<details class="section"><summary>查看步骤与异常路径</summary><table class="flow-table"><thead><tr><th>步骤</th><th>参与方</th><th>处理</th><th>异常路径</th></tr></thead><tbody>'+rows+'</tbody></table></details>'+notes(d)+'<p>对应时序：'+sequence_links+'</p></article>'


def sequence_card(d,version):
    names={p['id']:p['name'] for p in d['participants']}
    rows=''.join('<tr>'+''.join('<td>'+E(v)+'</td>' for v in [m['step'],names[m['from']],names[m['to']],m['message'],m['type'],m.get('condition') or '—',m.get('api_id') or '—'])+'</tr>' for m in d['messages'])
    return f'<article class="card current-business-card" id="{d["id"]}" data-current-version="{E(version)}"><h2>{d["id"]} · {E(d["name"])}</h2><div class="meta"><span class="badge">{E(d["decisionId"])}</span><span class="badge neutral">场景 {d["scenario_id"]}</span><span class="badge neutral">{len(d["participants"])} 个参与方</span><span class="badge neutral">{len(d["messages"])} 条消息</span></div>'+panel(sequence_svg(d),d['id'])+'<details class="section"><summary>查看消息明细</summary><table class="message-table"><thead><tr><th>步骤</th><th>发送方</th><th>接收方</th><th>消息</th><th>类型</th><th>条件</th><th>依据</th></tr></thead><tbody>'+rows+'</tbody></table></details>'+notes(d)+f'<p><a href="business-process.html#{d["scenario_id"]}">查看对应流程 →</a></p></article>'


def replace_card(source,d,render,version):
    ident=d['id'];pattern=r'<article\b[^>]*\bid="'+ident+r'".*?</article>';matches=list(re.finditer(pattern,source,re.S))
    if len(matches)>1:raise ValueError('Duplicate card '+ident)
    card=render(d,version)
    if matches:
        m=matches[0];source=source[:m.start()]+card+source[m.end():]
    else:source=source.replace('</main>',card+'</main>',1)
    link=f'<a href="#{ident}">{ident} {E(d["name"])}</a>'
    pat=r'<a\b[^>]*href="#'+ident+r'"[^>]*>.*?</a>'
    if re.search(pat,source):source=re.sub(pat,lambda _:link,source)
    else:source=source.replace('</nav>',link+'</nav>',1)
    return source


def supplement(source,ident,target,file):
    key='current-business-link-'+ident
    source=re.sub(r'<div class="section" id="'+key+r'">.*?</div>','',source,flags=re.S)
    note=f'<div class="section" id="{key}"><h3>D-038 · 通话中记录与客户资料</h3><p>人工外呼拨号起、呼入与预外呼分配人工接通后，均可边通话边填写并逐项暂存；结束后确认保存，才更新当次通话快照、客户档案及线索成效。已结束通话详情仍可授权补录；计划到店门店直接输入名称。<a href="{file}#{target}">查看当前完整流程 {target} →</a></p></div>'
    match=re.search(r'<article\b[^>]*\bid="'+ident+r'".*?</article>',source,re.S)
    if not match:raise ValueError('Missing supplement target '+ident)
    block=match.group()[:-10]+note+'</article>'
    return source[:match.start()]+block+source[match.end():]


def build():
    data=json.loads(DATA.read_text());checks={}
    for filename,key,renderer,extras in [('business-process.html','businessFlows',flow_card,[('SC-103','SC-208'),('SC-205','SC-208')]),('sequence-interaction.html','sequences',sequence_card,[('SEQ-103','SEQ-208'),('SEQ-205','SEQ-208')])]:
        p=ROOT/'flowcharts'/filename;s=p.read_text()
        for d in data[key]:s=replace_card(s,d,renderer,data['version'])
        for ident,target in extras:s=supplement(s,ident,target,filename)
        # Frozen analysis still includes the former separate AI product. It is
        # retained as source evidence, but never rendered in this delivery view.
        removed=('FLOW-205','SC-016') if key=='businessFlows' else ('SEQ-016',)
        for ident in removed:
            s=re.sub(r'<article\b[^>]*\bid="'+ident+r'".*?</article>','',s,flags=re.S)
            s=re.sub(r'<a\b[^>]*href="#'+ident+r'"[^>]*>.*?</a>','',s,flags=re.S)
        s=re.sub(r'(<header><h1>.*?</h1><p>).*?(</p></header>)',lambda m:m.group(1)+'AliCti 当前交付 · '+E(data['version'])+' · 现行图集：号码供应商状态与本地使用开关、任务暂停结束与正常通话话单、号码自动归属唯一业务租户、独立分机管理与受控选择、时间条件与任务关联、业务分类与字段必填、顶部电话工具条与保存后置闲、班长监控与坐席管理、队列多技能与完整配置、外呼组与预测任务分配、在线新增技能待提交、账号与租户、技能组、通话中记录、再次预外呼及报表；支持缩放、适应宽度及 SVG 下载'+m.group(2),s,count=1,flags=re.S)
        # Current author records are explicit alongside the unchanged baseline fingerprint.
        s=re.sub(r'<meta name="current-business-diagram-version"[^>]*>\n?','',s)
        s=s.replace('</head>',f'<meta name="current-business-diagram-version" content="{E(data["version"])}">\n</head>',1)
        s=re.sub(r'delivery-nav\.js(?:\?[^\"\']*)?', 'delivery-nav.js?v=20260919-navigation2', s)
        p.write_text(s)
        for d in data[key]:
            assert len(re.findall(r'<article\b[^>]*\bid="'+d['id']+'"',s))==1,d['id']
            assert f'href="#{d["id"]}"' in s
        checks[filename]=dict(currentCards=len(data[key]),crossLinks=len(extras),svgCount=s.count('<svg'))
    return dict(version=data['version'],pages=checks,frozenInputsWritten=False)

if __name__=='__main__':print(json.dumps(build(),ensure_ascii=False))
