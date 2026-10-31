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
    for f in ps['fields']:
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
    marker='<!-- DEVELOPER-REFERENCES -->'
    p=out/'README.md';text=re.sub(r'<!-- DEVELOPER-REFERENCES -->[\s\S]*?<!-- /DEVELOPER-REFERENCES -->\n*','',p.read_text())
    text+='\n'+marker+'\n## 开发补充查询\n\n- [页面权限与数据范围](权限与范围.md)\n- [专业对象子字段与10类报表指标](专业对象与报表指标.md)\n- [14项原工程缺证到12组责任](工程缺证追溯.md)\n\n222项专业能力统一查[专业操作任务映射](原专业操作任务映射.md)，不再重复生成第二份索引。\n<!-- /DEVELOPER-REFERENCES -->\n'
    md(p,text)
