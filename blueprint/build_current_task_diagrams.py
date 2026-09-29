#!/usr/bin/env python3
"""Apply current tasks, workspace, recording, and D-047 task/call lifecycle clarification; frozen inputs are untouched.

The three current sequence records are portable author data. Existing page shells,
other scenario cards and native diagram interactions are preserved.
"""
from pathlib import Path
import hashlib,html,json,re,textwrap
R=Path(__file__).resolve().parents[1]
E=lambda x:html.escape(str(x),quote=True)

def wrap(value,width):
    # Chinese-heavy labels use a conservative glyph width and keep all text.
    return [line for part in str(value).split('\n') for line in (textwrap.wrap(part,width=width,break_long_words=True,break_on_hyphens=False) or [''])]

def text_lines(lines,x,y,color='#25324a',size=12):
    return f'<text x="{x}" y="{y}" text-anchor="middle" font-size="{size}" fill="{color}" font-family="-apple-system,BlinkMacSystemFont,PingFang SC,Microsoft YaHei,sans-serif">'+''.join(f'<tspan x="{x}" y="{y+i*18}">{E(s)}</tspan>' for i,s in enumerate(lines))+'</text>'

def svg(d):
    ident=d['id'];xs={p['id']:140+i*260 for i,p in enumerate(d['participants'])};width=max(xs.values())+260;cursor=108;parts=[]
    types={'request':'请求','response':'响应','error':'错误','event':'事件'}
    for i,m in enumerate(d['messages'],1):
        x1,x2=xs[m['from']],xs[m['to']];typ=m['type'];color={'response':'#11865b','error':'#c9364f','event':'#7a4cc2'}.get(typ,'#475467')
        label=f'{i}. [{types.get(typ,typ)}] '+(f'[条件：{m["condition"]}] ' if m.get('condition') else '')+(f'[{m["api_id"]}] ' if m.get('api_id') else '')+m['message']
        chars=18 if x1==x2 else max(16,int(min(520,abs(x2-x1)-28)/12));lines=wrap(label,chars);y=cursor+len(lines)*18+8;labelx=x1+112 if x1==x2 else (x1+x2)/2
        dash=' stroke-dasharray="6 4"' if typ=='response' else ''
        arrow=(f'<path d="M {x1} {y} h 84 v 30 h -84"' if x1==x2 else f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}"')+f' fill="none" stroke="{color}" stroke-width="1.7"{dash} marker-end="url(#sequence-arrow-{ident})"/>'
        parts.append(f'<g data-message-index="{i}" data-message-type="{E(typ)}"><title>{E(label)}</title>'+text_lines(lines,labelx,cursor+14,color)+arrow+'</g>');cursor=y+(30 if x1==x2 else 0)+26
    height=cursor+20;digest=hashlib.sha256(json.dumps(d,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
    top=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}" role="img" aria-label="{E(d["name"])}" data-diagram-type="sequence" data-renderer="native" data-source-id="{ident}" data-sequence-id="{ident}" data-sequence-sha256="{digest}" data-current-decision="{E(d.get("decisionId","D-017"))}" data-layout-audit="pass"><defs><marker id="sequence-arrow-{ident}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#475467"/></marker></defs>']
    for p in d['participants']:
        x=xs[p['id']];top.append(f'<rect x="{x-100}" y="18" width="200" height="60" rx="9" fill="#eef2ff" stroke="#9aaaf5"/>'+text_lines(wrap(p['name'],13),x,48)+f'<line x1="{x}" y1="78" x2="{x}" y2="{height-20}" stroke="#b8c2d6" stroke-dasharray="5 5"/>')
    return ''.join(top+parts+['</svg>'])

def update_sequences():
    p=R/'flowcharts/sequence-interaction.html';source=p.read_text();count=0
    data=json.loads((R/'blueprint/current-task-sequences.json').read_text())
    for d in data['sequences']:
        pattern=r'<article\b[^>]*\bid="'+d['id']+r'".*?</article>'
        m=re.search(pattern,source,re.S)
        if not m:raise ValueError('Missing '+d['id'])
        old=m.group();rendered=svg(d);new=re.sub(r'<svg\b.*?</svg>',lambda _:rendered,old,count=1,flags=re.S)
        new=re.sub(r'(<article\b[^>]*?)(?:\sdata-current-version="[^"]*")?(>)',lambda x:re.sub(r'\sdata-current-version="[^"]*"','',x[1])+f' data-current-version="{E(data["version"])}">',new,count=1)
        width,height=re.search(r'viewBox="0 0 (\d+) (\d+)"',rendered).groups()
        new=re.sub(r'data-natural-width="\d+"',f'data-natural-width="{width}"',new)
        new=re.sub(r'data-natural-height="\d+"',f'data-natural-height="{height}"',new)
        new=re.sub(r'--diagram-natural-width:\s*\d+px',f'--diagram-natural-width:{width}px',new)
        new=re.sub(r'<h2>.*?</h2>',lambda _:f'<h2>{d["id"]} · {E(d["name"])}</h2>',new,count=1,flags=re.S)
        new=re.sub(r'\d+ 条消息',str(len(d['messages']))+' 条消息',new,count=1)
        rows=''.join('<tr>'+''.join('<td>'+E(v)+'</td>' for v in (x['step'],x['from'],x['to'],x['message'],x['type'],x.get('condition') or '—',x.get('api_id') or '—'))+'</tr>' for x in d['messages'])
        new=re.sub(r'(<table class="message-table">.*?<tbody>).*?(</tbody>)',lambda x:x.group(1)+rows+x.group(2),new,count=1,flags=re.S)
        references='、'.join(f'<a href="../docs/field-alignment.html#{E(x)}">{E(x)}</a>' for x in d.get('fieldIds',[]))+' '+ '、'.join(f'<a href="../docs/interaction.html#{E(x)}">{E(x)}</a>' for x in d.get('ruleIds',[]))
        note='<div class="section"><h3>说明</h3><p>'+references.strip()+'</p><ul class="clean">'+''.join('<li>'+E(x)+'</li>' for x in d.get('notes',[]))+'</ul></div>'
        new=re.sub(r'<div class="section"><h3>说明</h3>.*?</div>',lambda _:note,new,count=1,flags=re.S)
        source=source[:m.start()]+new+source[m.end():]
        source=re.sub(r'<a\b[^>]*href="#'+d['id']+r'"[^>]*>.*?</a>',lambda _:f'<a href="#{d["id"]}">{d["id"]} {E(d["name"])}</a>',source)
        count+=1
    p.write_text(source);return count

REPLACEMENTS={
 '导入不等于线路可呼叫':'导入不等于号码可用',
 '坐席/外呼组互斥':'坐席/外呼组有效',
 '在途及排队重呼影响见CF-04；独立留存，不改写通话终态':'已发起通话正常进行；正常话单回补原记录',
 '本地终止未启动任务并保存调度审计':'缺可靠任务ID，拒绝远端控制',
 '本地终止结果已展示':'保留原状态与待核对',
 '未发起厂商控制，不经过厂商结果核验路径':'不发远端请求，不伪造任务已结束',
 '仅隔离前待启动且管理员单独确认；不调用ResumeCampaign':'首次启动须get确认0，start后再get查证',
 '转SC-014/015完成首次启动校验和执行；不调用ResumeCampaign':'转SC-014/015首次启动：get确认原任务0后start并get查证',
 '无厂商活动且请求终止未启动任务':'缺可靠任务ID且请求远端控制',
 '仅本地保存终止状态与审计，不发送远端请求，不释放客户':'阻止远端控制，保留待核对与历史，不伪造已结束',
 '厂商确认结果或本地终止事务结果':'原任务查询结果与操作证据',
 '无厂商活动且操作不属于本地终止或合法首次启动':'缺少任务依据或不满足首次启动条件',
 '无厂商活动，隔离前待启动，管理员确认恢复':'资源恢复且任务从未启动，重新核验',
 '无厂商活动时请求什么操作？':'原任务能否独立查询确认？',
 '终止且本地状态允许':'缺可靠任务ID',
 '按本地草稿或厂商任务选择控制路径':'按原任务ID核验控制路径',
 '无厂商活动':'缺任务ID',
 '已有厂商活动':'有任务ID',
 'type=1预测或type=2自动IVR创建；启动/继续待确认，暂停/结束按文档，在途影响待确认':'type=1预测或type=2自动外呼；继续先查暂停再启动并复查；暂停不传时长，已发起通话正常进行',
 '暂停/结束按文档；启动/继续待确认':'暂停不传时长；继续先查后启再查',
 '厂商结果与在途保护均已确认？':'任务查询结果已确认？',
 '暂停/结束影响在途的语义待POC，不强行改通话终态':'已发起通话正常进行；正常话单回补原记录',
 '已发起通话收尾见CF-04；独立留存，不改写通话终态':'已发起通话正常进行；正常话单回补原记录',
}
def replace_plain(value):
    for old,new in REPLACEMENTS.items():value=value.replace(old,new)
    return value

def update_business():
    p=R/'flowcharts/business-process.html';s=p.read_text()
    # Reflow only changed native SVG tspans within the original line count.
    def text_match(m):
        block=m.group();plain=html.unescape(re.sub('<[^>]+>','',block));updated=replace_plain(plain)
        if updated==plain:return block
        spans=list(re.finditer(r'(<tspan\b[^>]*>)(.*?)(</tspan>)',block,re.S))
        if spans:
            widths=[len(html.unescape(re.sub('<[^>]+>','',x.group(2)))) for x in spans];oldmax=max(widths or [1]);chunks=[updated[i:i+oldmax] for i in range(0,len(updated),oldmax)]
            if len(chunks)>len(spans):raise ValueError('Label exceeds existing SVG layout: '+updated)
            n=iter(chunks+['']*(len(spans)-len(chunks)))
            return re.sub(r'(<tspan\b[^>]*>)(.*?)(</tspan>)',lambda x:x.group(1)+E(next(n))+x.group(3),block,flags=re.S)
        return re.sub(r'(<text\b[^>]*>).*?(</text>)',lambda x:x.group(1)+E(updated)+x.group(2),block,count=1,flags=re.S)
    s=re.sub(r'<text\b[^>]*>.*?</text>',text_match,s,flags=re.S)
    s=replace_plain(s)
    s=s.replace('暂停停止新呼叫且允许继续；终止不可继续但保留在途结果及关联。','暂停经查询确认后允许继续；终止不可继续，保留历史、在途结果及关联。')
    # The current sequence expands this concise business node into visible API calls.
    note='<div class="section" id="task-control-d017"><h3>暂停、继续与结束 · 当前规则 D-047</h3><p>暂停直接调用 task/pause，不提交 pauseDuration。继续时先核对权限与资源，task/get 查询成功并确认原任务 status=2，才调用 task/start，随后再次 task/get 查证。非暂停、已结束或查询失败未知不启动；受理不等于运行，失败未知保留历史、不自动重放。</p><p>D-047 / SRC-077用户转述供应商确认：暂停或结束只控制任务，未发起呼叫不再发起；已发起的拨号、振铃和通话正常进行，话单正常。暂停后可继续，查询确认结束后不再执行后续首次呼叫或重呼；正常话单回补原记录和统计，不重开任务、不强改通话结果。本次答复不等于官网更新或真实联调验收。<a href="sequence-interaction.html#SEQ-105">查看完整调用时序</a></p></div>'
    s=re.sub(r'<div class="section" id="task-control-d017">.*?</div>','',s,flags=re.S)
    match=re.search(r'<article\b[^>]*\bid="SC-105"[^>]*>',s)
    if not match:raise ValueError('Missing SC-105')
    index=match.start()
    end=s.index('</article>',index);s=s[:end]+note+s[end:];p.write_text(s)

def update_retry_business():
    p=R/'flowcharts/business-process.html';s=p.read_text()
    for ident in ['SC-014','SC-015']:
        marker='retry-status-d018-'+ident
        s=re.sub(r'<div class="section" id="'+marker+r'">.*?</div>','',s,flags=re.S)
        boundary='D-020用户转述阿里反馈：预测外呼也支持按号码状态重呼。两类任务均把所选官方编码组成一组condition.sipCause策略，由阿里执行。关闭时省略重呼字段和templateName，按不启用重呼处理；查询或创建受理不等于已运行。'
        note='<div class="section" id="'+marker+'"><h3>重呼呼叫状态 · 当前规则 D-020</h3><p>两类任务启用重呼后都直接展示呼叫状态多选，至少选择一个状态，并完整填写次数、间隔和计时依据。关闭后保留设置供再次开启；缺少状态的草稿须补选，不兼容旧basic模式。</p><p>'+boundary+'</p></div>'
        match=re.search(r'<article\b[^>]*\bid="'+ident+r'"[^>]*>',s)
        if not match: raise ValueError('Missing '+ident)
        start=match.start();end=s.index('</article>',start);s=s[:end]+note+s[end:]
        strategy_marker='task-strategy-d041-'+ident
        s=re.sub(r'<div class="section" id="'+strategy_marker+r'">.*?</div>','',s,flags=re.S)
        strategy='预测任务独立使用 String callStrategy 1～4；新建默认4（当前空闲时间最长），缺少分配方式须重新选择，不能静默回退1或提交。配置、模板、复制、再次联系、确认与启动快照保持一致；queue.strategy和weight不覆盖任务选择。' if ident=='SC-014' else '自动IVR不展示、不提交预测专用callStrategy。queue.strategy与weight是接听队列配置，不能加入自动任务创建请求。'
        note='<div class="section" id="'+strategy_marker+'"><h3>坐席分配 · D-041</h3><p>'+strategy+'</p><p><a href="../docs/field-alignment.html#FA-169">FA-169</a> · <a href="../docs/interaction.html#C-59">C-59～C-62</a>；原型字段演示不代表供应商实际调度已验收。</p></div>'
        end=s.index('</article>',start);s=s[:end]+note+s[end:]
    p.write_text(s)

if __name__=='__main__':
    count=update_sequences();update_business();update_retry_business();print(json.dumps({'decisionId':'D-047','sequenceCards':count,'frozenInputsWritten':False,'businessPage':'flowcharts/business-process.html','sequencePage':'flowcharts/sequence-interaction.html'},ensure_ascii=False))
