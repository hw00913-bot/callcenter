import pathlib,json,sys,hashlib,argparse,re
import xml.etree.ElementTree as ET
sys.dont_write_bytecode=True
sys.path.insert(0,'/Users/huhaowen/.codex/skills/requirement-analysis-loop/scripts')
from render_atlases import render_scenarios
from render_documents import render_scenario_list
from plantuml_renderer import resolve_plantuml_runtime,compile_plantuml_activity
root=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description='Render the current business atlas with project layout repairs.')
parser.add_argument('--audit-baseline',help='Optional temporary HTML of untouched engine SVGs for independent comparison.')
parser.add_argument('--reuse-cache',help='Temporary exact compiled-source cache; only unchanged verified SVG geometry may be reused.')
args=parser.parse_args()
baseline_path=pathlib.Path(args.audit_baseline).resolve() if args.audit_baseline else None
if baseline_path and not baseline_path.is_relative_to(pathlib.Path('/tmp').resolve()):
    raise ValueError('Audit baselines may only be written to temporary storage.')
sys.path.insert(0,str(root/'planning'))
from svg_orthogonal_router import reroute_svg
import render_atlases
from business_diagrams import bind_business_svg

# Preserve PlantUML's nodes and arrows; repair only connector layout. A successful
# route remains subject to independent geometry and browser review at S3.
official_render=render_atlases.render_plantuml_svg
routing_reports=[]
baseline_svgs=[]
reuse_meta=None
reuse_routed={}
reuse_engine={}
reuse_reports={}
if args.reuse_cache:
    cache_path=pathlib.Path(args.reuse_cache).resolve()
    if not cache_path.is_relative_to(pathlib.Path('/tmp').resolve()):raise ValueError('Reuse metadata must be temporary.')
    reuse_meta=json.loads(cache_path.read_text())
    old_atlas=pathlib.Path(reuse_meta['atlas_path']);old_engine=pathlib.Path(reuse_meta['engine_baseline_path'])
    if hashlib.sha256(old_atlas.read_bytes()).hexdigest()!=reuse_meta['atlas_sha256']:raise ValueError('Cached atlas drifted.')
    if hashlib.sha256(old_engine.read_bytes()).hexdigest()!=reuse_meta['engine_baseline_sha256']:raise ValueError('Cached engine baseline drifted.')
    if hashlib.sha256((root/'planning/svg_orthogonal_router.py').read_bytes()).hexdigest()!=reuse_meta['router_sha256']:raise ValueError('Router changed; do not reuse.')
    for path,target in [(old_atlas,reuse_routed),(old_engine,reuse_engine)]:
        for raw in re.findall(r'<svg\b[\s\S]*?</svg>',path.read_text()):
            svg=ET.fromstring(raw)
            if svg.get('data-plantuml-render')=='pass':target[svg.get('data-source-id')]=raw
    reuse_reports={r['id']:r for r in reuse_meta['reports']}
    if set(reuse_routed)!=set(reuse_meta['compiled_source_sha256']) or set(reuse_engine)!=set(reuse_routed):raise ValueError('Incomplete exact SVG reuse set.')
def compact_geometry(report):
    return {key:(len(value) if isinstance(value,list) else value)
            for key,value in report.items()}
def render_routed(source,detail,runtime,diagram_type='swimlane'):
    ident=detail['id']
    if reuse_meta and reuse_meta['compiled_source_sha256'].get(ident)==hashlib.sha256(source.encode()).hexdigest():
        original=bind_business_svg(reuse_engine[ident],detail)
        if baseline_path:baseline_svgs.append(original)
        candidate=bind_business_svg(reuse_routed[ident],detail)
        report=dict(reuse_reports[ident]);report['reused_verified_geometry']=True;report['reason']='Exact PlantUML source, previous SVG bytes and router hash unchanged; current facts rebound.'
        routing_reports.append(report)
        return candidate
    original=official_render(source,detail,runtime,diagram_type)
    if baseline_path:baseline_svgs.append(original)
    candidate,report=reroute_svg(original)
    if report['status']!='candidate_obstacles_clear_other_geometry_requires_review':
        raise RuntimeError(detail['id']+' routing failed closed: '+json.dumps(report.get('failures',[]),ensure_ascii=False))
    svg=ET.fromstring(candidate)
    svg.attrib.pop('data-layout-candidate',None)
    svg.set('data-routing-engine','project-orthogonal-v9')
    svg.set('data-routing-engine-sha256',hashlib.sha256((root/'planning/svg_orthogonal_router.py').read_bytes()).hexdigest())
    routing_reports.append({'id':detail['id'],'changed_connections':len(report['changes']),'before':compact_geometry(report['before']),'after':compact_geometry(report['after']),'novel_text_intersections':len(report['novel_text_intersections']),'invariants':report['invariants'],'independent_review_required':True})
    return bind_business_svg(ET.tostring(svg,encoding='unicode'),detail)
render_atlases.render_plantuml_svg=render_routed
project=json.loads((root/'memory/project-facts.json').read_text())['project']['name']
idx=json.loads((root/'scenarios/scenario-index.json').read_text())
for item in idx['scenarios']:compile_plantuml_activity(json.loads((root/item['file']).read_text()))
runtime=resolve_plantuml_runtime(command='/opt/homebrew/bin/plantuml')
atlas=render_scenarios(root,project,'compare',runtime,False)
if baseline_path:baseline_path.write_text('<!doctype html><html><body>'+''.join(baseline_svgs)+'</body></html>')
stage_report=root/'runtime/s3-business-flow-review-20261023.json'
stage_data=json.loads(stage_report.read_text()) if stage_report.exists() else {'schema_version':'1.0'}
stage_data['formal_router_run']={'engine':'project-orthogonal-v9','module_sha256':hashlib.sha256((root/'planning/svg_orthogonal_router.py').read_bytes()).hexdigest(),'status':'candidate_complete_independent_review_required','reports':routing_reports,'ordinary_perpendicular_crossings_are_not_junctions':True,'text_bounds_limit':'原有标签基线接触按精确方向/固定坐标/区间保留；字体包络不是glyph ink，仍需浏览器核验。'}
stage_report.write_text(json.dumps(stage_data,ensure_ascii=False,indent=2)+'\n')
# Constrain grid item intrinsic widths so wide SVGs scroll inside the diagram,
# preserving the documented desktop-wide reading and visible toolbar.
layout_fix='''
/* Project reading-shell fix: contain wide SVGs; keep page and toolbar in viewport. */
.atlas-desktop .diagram-versions{grid-template-columns:minmax(0,1fr)}
.atlas-desktop .diagram-version,.atlas-desktop .diagram-panel,.atlas-desktop .diagram{min-width:0;max-width:100%}
.atlas-desktop .diagram{width:100%}
'''
html=atlas.read_text()
atlas.write_text(html.replace('</style>',layout_fix+'</style>',1))
print('atlas',atlas,flush=True)
document=render_scenario_list(root,project)
rules=json.loads((root/'memory/business-rules.json').read_text())
facts=json.loads((root/'memory/project-facts.json').read_text())
# S3 review text is derived from the current facts, not hard-coded old counts.
stories=json.loads((root/'memory/normalized-user-stories.json').read_text())
lines=['','## 当前阶段与阅读边界','','SRC-2094记录主聊天实际答复“确认 v2 范围”：本批38故事、134验收、36场景已获G1；G2/G3、原型实施与生产未批准。SRC-2096已明确本版AI标签仅配置、映射和结果展示，不新增AI→业务字段写入或由此新增自动流转；保原字段条件、人工保存及其他流转，非未来永久限制。原43条历史冻结规则、v1.2和原型均不改。','',f"当前事实：{len(stories['user_stories'])}故事、{sum(len(u['acceptance_criteria']) for u in stories['user_stories'])}验收、{len(rules['business_rules'])}条活动规则、{len(rules['business_flows'])}条跨场景流程、{len(idx['scenarios'])}张活动场景泳道。六入口沿用；接口、时序、正式页面与FUNC尚未按本轮完成重核。",'','[当前业务流程与场景泳道图集](business-scenario-atlas.html) · [具体修订及待决范围](../../待确认与重构差异清单.md)','','## 跨场景流程索引','','| 流程 | 关联场景 | 业务推进与边界 |','| --- | --- | --- |']
for flow in rules['business_flows']:
    steps=' → '.join(flow['steps'])
    lines.append('| '+' | '.join(str(v).replace('|','／').replace('\n',' ') for v in [flow['id']+' '+flow['name'],'、'.join(flow['scenario_ids']),steps])+' |')
lines+=['','## 关键对象与最小复用关系','','新模型：品牌 → 品牌共用分类基础/字段版本 → 独立单模板路由版本 → 固定模板及节点/路径条件 → 新业务记录及配置快照 → 当前实例节点。各条件直接引用分类已有多选fieldId/optionId，无单独标签来源指定；旧目录及历史按原ID处理，不按同名或手机号合并。','','责任租户、租户内分配、轮次、执行段、固定模板节点、意向门店和路径判定分别管理。新模板机制只对新数据；合法转交成功才切归属并接续新轮、清旧执行安排。备用及接续切换已退役，历史不追改。','','配置、监管及AI财务/服务/资源资格分别按原权核定，不强制业务成员或双模块，不授代处理。实际外呼启动按对应模块/成员/资源及公共禁呼核验。','','| 状态轴 | 产品状态 |','| --- | --- |']
for state in facts['state_models']:
    lines.append('| '+state['name']+' | '+'；'.join(state['states'])+' |')
lines+=['','## 必要异常和关键准入','','- 启动下一方式检查整条记录最近段结束且结果保存，换owner/round不豁免；仅整条记录从未有段才无前段。转交只核执行结束且不再呼叫等原准入，不一律要求前段结果先存。','- 各规则按自身业务字段已保存值、来源和定义/值版本作ALL/ANY三值判定；缺值与读取/来源待核分别处理。多条路径匹配由人选择，预览不代替提交重核，不自动推进、呼叫或转交。','- 总部有意向只到唯一有效映射门店；无意向保同记录待指派，仅当前HQ ADMIN同次补选并确认；映射异常不按名称或首店猜测，门店只回唯一同品牌总部。','- 分类基础与独立路由分别保存并核原版本。单模板/逐字段条件不兼容时保原关联标需复核，只阻新模板新数据；不阻原AI已关联场景按原规则建任务或旧数据原处理。','- 原批次多选分配逐行复核，任一行失败全批不写。转交成功清旧安排，接收方按本租户资格另行分配，不自动起呼。','- 原已结束未保存人工段可由原有权人员首次补录，锁原租户/轮次/段/固定表单，不读下游字段、不改新owner或覆盖当前值；已保存结果不重写，停用仍限已确认收尾。','- 独立模板详情只读精确版本；保护删除仅在无当前/历史分类、记录/批次及待核引用时按权办理。新建空节点、明确起点、局部更新及条件草稿沿原交互。','','## 本版AI标签配置与结果边界','','原供应商标签池、场景启用及映射按原supplierId/tenantType/标签scene身份和权限保留，标签场景不等于具体执行场景或品牌分类；推荐、名称及首项不当业务事实。SRC-2096已选择本版仅整合配置、映射和结果展示，不新增AI标准标签向业务字段写入或由此新增自动流转；不误删原字段条件/人工保存/其他既有流转，不作未来永久禁令。未匹配保原始结果，不首项兜底。','','非本期范围：客户主档/生命周期/统一待办、公海或自动回收、模板发布、自动调度/推进、门店直接互转/任意改派、历史初始化、新增各轮回传及其他分类开放入站。非线索分类仍限租户内节点；旧IVR任务保留，未新增为模板节点方式。源partial/missing及前序正式基底限制保留，不继承源风险接受。','']
document.write_text(document.read_text()+'\n'.join(lines))
print('review',document,flush=True)
