#!/usr/bin/env python3
"""Build only original page resources into local classic-script packages; no runtime server."""
from pathlib import Path
import re,json,hashlib,base64,mimetypes,subprocess,argparse
from flow_editor_build import apply_controller,canvas_style
from category_build import transform as category_transform
from import_build import transform as import_transform
from flow_routing_build import transform as routing_transform
from flow_runtime_build import transform as routing_runtime_transform
from flow_feedback_build import transform as routing_feedback_transform
from ai_import_result_build import transform as ai_import_result_transform
from ai_import_parse_build import transform as ai_import_parse_transform, io_source as import_io_source
from ai_parity_build import transform as ai_parity_transform
from field_model_build import transform as field_model_transform
from field_ui_build import transform as field_ui_transform
from field_import_build import transform as field_import_transform
from list_sort_build import transform as list_sort_transform
from list_sort_cloud_build import transform as list_sort_cloud_transform
from list_sort_ai_build import transform as list_sort_ai_transform
from flow_condition_ui_build import transform as flow_condition_ui_transform
from four_node_model_build import transform as four_node_model_transform
from four_node_ui_build import transform as four_node_ui_transform
from four_node_workspace_build import transform as four_node_workspace_transform, runtime_source as four_node_workspace_source, style_source as four_node_workspace_style
from business_family_build import transform as business_family_transform
from direct_followup_build import transform as direct_followup_transform
from template_lifecycle_build import transform as template_lifecycle_transform
from current_catalog_build import transform as current_catalog_transform
from current_planning_build import transform as current_planning_transform
from multiple_values_ui_build import transform as multiple_values_ui_transform
from template_list_ui_build import transform as template_list_ui_transform, style_source as template_list_ui_style
ROOT=Path(__file__).resolve().parents[1]
PROJECT=ROOT.parents[2]
SOURCES={'ai':PROJECT/'DCC&AI 外呼/AI 外呼','cloud':ROOT.parents[1]/'1.2.0/prototype-class-flow'}
# Source overrides permit isolated rebuilds; outputs stay beneath this script's ROOT.
arguments=argparse.ArgumentParser(description=__doc__)
arguments.add_argument('--ai-source',type=Path,help='Readonly AI reference root (default: existing project layout)')
arguments.add_argument('--cloud-source',type=Path,help='Readonly Cloud reference root (default: existing project layout)')
arguments=arguments.parse_args()
for kind,override in [('ai',arguments.ai_source),('cloud',arguments.cloud_source)]:
    if override is not None:SOURCES[kind]=override.resolve(strict=True)
    if not SOURCES[kind].is_dir():raise ValueError('Missing readonly reference root: '+str(SOURCES[kind]))

def menu_presentation(kind,path,code):
    """Align retained page labels with the shared menu; keep route/model contracts."""
    fragments={
        ('ai','js/pages/scene-list.js'):[
            ('<span class="scene-page-title">外呼列表</span>','<span class="scene-page-title">AI外呼任务</span>'),
            ('当前系统所有的外呼呼叫记录。','按业务场景查看AI外呼任务、名单数量和执行进度；逐通结果在“AI通话记录”查看。')],
        ('ai','js/pages/sys-scene.js'):[
            ('<span class="scene-page-title">业务场景</span>','<span class="scene-page-title">AI业务场景</span>'),
            ('创建使用智能外呼任务的业务场景，通过分配外呼平台的通话机器人和通话通道完成创建。','配置AI外呼使用的业务场景、业务分类、机器人和呼叫通道；任务进度在“AI外呼任务”查看。')],
        ('ai','js/pages/result-records.js'):[
            ('<span class="record-title">通话记录</span>','<span class="record-title">AI通话记录</span>'),
            ('查看每一通外呼的结果','查看每通AI外呼的结果、录音及识别标签。')],
        ('ai','js/pages/result-clue.js'):[
            ('<span class="record-title">线索记录</span>','<span class="record-title">AI线索回访记录</span>'),
            ('以线索的维度查看统计结果。','按线索汇总AI回访结果，查看最近通话、意向标签和历次回访。')],
        ('ai','js/pages/report-call.js'):[
            ('<span class="report-title">通话统计</span>','<span class="report-title">AI通话统计</span>'),
            ('创建任务时导入外呼名单，通过手动启动任务进行智能外呼任务。','按日期、场景和平台查看AI通话量与接通情况，具体结果在“AI通话记录”查看。')],
        ('ai','js/pages/report-billing.js'):[
            ('<strong>计费统计</strong>','<strong>AI计费统计</strong>')],
        ('ai','js/pages/usage.js'):[
            ('<h1>使用情况</h1>','<h1>AI服务与用量</h1>'),
            ('查看当前登录租户的服务有效期、可用分钟与日消耗。','查看当前租户的AI服务有效期、可用分钟与每日消耗；历史计费明细在“AI计费统计”查看。'),
            ('使用情况 / 任务明细','AI服务与用量 / 任务明细')],
        ('ai','js/pages/sys-tags.js'):[
            ('AI 标签配置</span>','AI标签配置</span>'),
            ('🏢 供应商管理</button>','🏢 标签供应商配置</button>'),
            ('🏢 供应商管理</span>','🏢 标签供应商配置</span>')],
        ('cloud','js/pages/agent-center.js'):[
            ("ui.pageHeader('坐席维护',","ui.pageHeader('坐席管理',")],
        ('cloud','js/pages/cloud-call-tasks.js'):[
            ("ui.pageHeader(isPredictive ? '预外呼任务' : '自动外呼任务',","ui.pageHeader(isPredictive ? '预外呼任务' : 'IVR外呼任务',")],
        ('cloud','js/pages/cloud-call-records.js'):[
            ("ui.pageHeader('通话记录', '查看人工外呼、预外呼、自动外呼和呼入的通话结果。')","ui.pageHeader('云呼叫记录', '查看人工外呼、预外呼、IVR外呼及呼入的通话结果和录音。')")]
    }
    for old,new in fragments.get((kind,path),[]):
        if old not in code:raise ValueError('Menu presentation source changed: '+path+' / '+old)
        code=code.replace(old,new)
    # The original routes still own permissions/secondary navigation; only their
    # labels and breadcrumb strings follow the one current menu directory.
    if kind=='cloud' and path=='js/nav.js':
        marker='  function operatorWorkbench() {'
        labels="""  parent.DNav.pages.filter(p=>p.menu).forEach(p=>{
    const key=parent.DCatalogEntries?.[p.id]?.route||(p.module==='cloud'?p.route.split('#')[0]:'');
    if(key&&routes[key]){routes[key].label=p.name;routes[key].breadcrumb=[p.area,...(p.group?[p.group]:[]),p.name];}
  });
"""
        if marker not in code:raise ValueError('Missing Cloud route label boundary')
        code=code.replace(marker,labels+marker,1)
    if kind=='ai' and path=='js/nav.js':
        marker='  var PlaceholderNames = {'
        labels="""  parent.DNav.pages.filter(p=>p.menu&&p.module==='ai').forEach(function(p){
    var route=RouteMap[p.route];if(route)route.bc=[p.area].concat(p.group?[p.group]:[]).concat([p.name]);
  });
"""
        if marker not in code:raise ValueError('Missing AI route label boundary')
        code=code.replace(marker,labels+marker,1)
    return code

# Explicit review-only omissions: original shells/annotations/version tools and remote contract console.
SKIP={'js/delivery-nav.js','js/version-nav.js','js/review-view-cache.js','js/components/alicti-contract-panel.js'}
generated=[]
provenance={'schema':'native-page-reuse@1','runtime':'local classic scripts / inline srcdoc','sources':{},'fixture_mapping_note':'Demo tenant bindings only; no assertion about production identity mapping.'}
if (ROOT/'memory/reuse-provenance.json').exists():
    previous=json.loads((ROOT/'memory/reuse-provenance.json').read_text())
    for key in ['readingViews','relatedSystemsSource']:
        if key in previous:provenance[key]=previous[key]

# Reuse the effective v1.2.0 cascade, including its later desktop/UI refinements.
# Reading only the first occurrence of a selector loses those refinements.
theme_source=SOURCES['cloud']/'assets/css/app.css'
theme_text=theme_source.read_text()
def css_blocks(text):
    """Yield complete CSS blocks without flattening conditional at-rules.

    Quotes and comments can contain braces; account for both while finding the
    next header/body. This is extraction only, not a rewriting CSS compiler.
    """
    cursor=0
    while cursor<len(text):
        while cursor<len(text):
            if text[cursor].isspace():cursor+=1
            elif text.startswith('/*',cursor):
                end=text.find('*/',cursor+2)
                if end<0:raise ValueError('Unclosed CSS comment')
                cursor=end+2
            else:break
        start=cursor;quote=None;escaped=False
        while cursor<len(text):
            char=text[cursor]
            if quote:
                if escaped:escaped=False
                elif char=='\\':escaped=True
                elif char==quote:quote=None
            elif char in ['"',"'"]:quote=char
            elif text.startswith('/*',cursor):
                end=text.find('*/',cursor+2)
                if end<0:raise ValueError('Unclosed CSS comment')
                cursor=end+2;continue
            elif char in '{;':break
            cursor+=1
        if cursor>=len(text):break
        if text[cursor]==';':cursor+=1;continue
        header=re.sub(r'/\*.*?\*/','',text[start:cursor],flags=re.S).strip()
        body_start=cursor+1;cursor+=1;depth=1;quote=None;escaped=False
        while cursor<len(text) and depth:
            char=text[cursor]
            if quote:
                if escaped:escaped=False
                elif char=='\\':escaped=True
                elif char==quote:quote=None
            elif char in ['"',"'"]:quote=char
            elif text.startswith('/*',cursor):
                end=text.find('*/',cursor+2)
                if end<0:raise ValueError('Unclosed CSS comment')
                cursor=end+2;continue
            elif char=='{':depth+=1
            elif char=='}':depth-=1
            cursor+=1
        if depth:raise ValueError('Unclosed CSS rule: '+header)
        yield header,text[body_start:cursor-1]

def css_selectors(header):
    # A comma within :is()/attribute values belongs to one selector.
    start=0;depth=0;quote=None;escaped=False
    for index,char in enumerate(header):
        if quote:
            if escaped:escaped=False
            elif char=='\\':escaped=True
            elif char==quote:quote=None
        elif char in ['"',"'"]:quote=char
        elif char in '([':depth+=1
        elif char in ')]':depth-=1
        elif char==',' and not depth:
            yield header[start:index].strip();start=index+1
    yield header[start:].strip()

def css_cascade(text,aliases):
    """Retain every matching rule in source order, inside its original condition."""
    rules=[]
    tokens=[(source,re.compile(re.escape(source)+r'(?![\w-])'))
            for source in aliases if source not in [':root','body']]
    for header,body in css_blocks(text):
        if header.startswith(('@media','@supports','@container','@layer')):
            nested=css_cascade(body,aliases)
            if nested:rules.append(header+'{\n'+nested+'}\n')
        elif not header.startswith('@'):
            selected=[]
            for selector in css_selectors(header):
                if selector in [':root','body']:
                    if selector in aliases:selected.append(aliases[selector])
                    continue
                matches=[(source,pattern) for source,pattern in tokens if pattern.search(selector)]
                if not matches:continue
                for source,pattern in matches:selector=pattern.sub(lambda _:aliases[source],selector)
                selected.append(selector)
            if selected:rules.append(',\n'.join(selected)+'{'+body+'}\n')
    return ''.join(rules)

theme_rules={':root':':root','body':'body','.app-topbar':'.d-topbar','.app-name':'.d-wordmark',
    '.top-bar-left':'.d-wordmark',
    '.app-context-tools':'.d-user','.app-sidebar':'.d-sidebar','#businessNavigation':'#main-nav',
    '.business-nav-item':'.d-nav-item','.business-nav-item.active':'.d-nav-item.active',
    '.business-nav-child':'.d-nav-child','.business-nav-group':'.d-nav-group-block',
    '.business-nav-children':'.d-nav-children','.nav-group-trigger':'.d-nav-group-trigger',
    '.nav-glyph':'.d-nav-icon','.nav-chevron':'.d-nav-chevron',
    '.sidebar-logo':'.d-sidebar-heading','.logo-text':'.d-sidebar-heading strong',
    '.sidebar-footnote':'.d-sidebar-footnote','.content-area':'#app',
    '.page-title-row':'.d-page-heading','.platform-page':':is(.d-org-page,.d-contact-page)'}
host_cascade=css_cascade(theme_text,theme_rules)
for selector in ['.d-topbar','.d-sidebar','.d-page-heading']:
    if selector not in host_cascade:raise ValueError('Missing Cloud theme alias: '+selector)
public_start=theme_text.index(':root {\n  --ui-primary:')
public_end=theme_text.index('\n#assigned-call-dialog .assigned-call-panel',public_start)
public_controls=theme_text[public_start:public_end]
# This bounded section ends with .list-pagination strong; do not pull the
# unrelated call/workbench controllers' presentation into the common host.
if not public_controls.rstrip().endswith('}') or '.list-pagination strong' not in public_controls:
    raise ValueError('Cloud shared UI section boundary changed')
overrides=(ROOT/'assets/css/cloud-ui-overrides.css').read_text()
ai_start='/* D_AI_THEME_BEGIN */';ai_end='/* D_AI_THEME_END */'
if overrides.count(ai_start)!=1 or overrides.count(ai_end)!=1:
    raise ValueError('Missing bounded AI-only UI adapter')
host_overrides,ai_remainder=overrides.split(ai_start)
ai_overrides,tail=ai_remainder.split(ai_end)
host_overrides+=tail
theme='/* Effective readonly v1.2.0 cascade; source order and media conditions retained. */\n'+host_cascade+'\n'+public_controls+'\n'+host_overrides
ai_theme=css_cascade(theme_text,{':root':':root','body':'body'})+'\n'+public_controls+'\n'+ai_overrides
(ROOT/'assets/css/cloud-ui.css').write_text(theme)
shared_source=SOURCES['cloud']/'assets/css/global.css'
(ROOT/'assets/css/shared-forms.css').write_bytes(shared_source.read_bytes())
provenance['uiTheme']={'reference':str(theme_source),'sha256':hashlib.sha256(theme_source.read_bytes()).hexdigest(),'sharedControls':str(shared_source),'sharedControlsSha256':hashlib.sha256(shared_source.read_bytes()).hexdigest(),'ruleAliases':theme_rules,'hostTheme':'assets/css/cloud-ui.css','overrides':'assets/css/cloud-ui-overrides.css','cascade':'all matching rules in source order, preserving conditional at-rules','publicControls':{'startMarker':':root containing --ui-primary','endBefore':'#assigned-call-dialog .assigned-call-panel','firstLine':theme_text[:public_start].count('\n')+1,'lastLine':theme_text[:public_end].count('\n'),'sha256':hashlib.sha256(public_controls.encode()).hexdigest()},'nativeCloud':'original full styles only; host aliases not appended','nativeAI':'original styles plus v1.2.0 shared controls and scoped AI visual adapter','scope':'visual only; original business controllers retained'}
def build(kind,source):
    entries=[];fixtures=None;flow_editor_info=None
    def read(rel):
        f=(source/rel).resolve()
        if not f.is_relative_to(source.resolve()):raise ValueError('External source path: '+rel)
        raw=f.read_bytes();entries.append({'path':str(f),'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)})
        return raw.decode('utf-8')
    original=read('index.html')
    scriptpaths=[x.split('?')[0] for x in re.findall(r'<script[^>]+src=["\']([^"\']+)',original)]
    scriptpaths=[x for x in scriptpaths if not x.startswith(('annotations/','../')) and x not in SKIP]
    styles=[x.split('?')[0] for x in re.findall(r'<link[^>]+href=["\']([^"\']+\.css(?:\?[^"\']*)?)["\']',original) if not x.startswith('annotations/') and 'version-history' not in x]
    css=[]
    for path in styles:
        content=read(path)
        def embed(match):
            url=match[1].strip('"\' ')
            if url.startswith(('data:','#')):return match[0]
            if '://' in url:raise ValueError('Remote CSS dependency '+url)
            f=((source/path).parent/url.split('?')[0]).resolve()
            if not f.is_relative_to(source.resolve()):raise ValueError('Outside asset '+url)
            data=f.read_bytes();entries.append({'path':str(f),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
            return 'url("data:'+str(mimetypes.guess_type(f)[0] or 'application/octet-stream')+';base64,'+base64.b64encode(data).decode()+'")'
        css.append(re.sub(r'url\(([^)]+)\)',embed,content))
    body=re.search(r'<body[^>]*>(.*?)</body>',original,re.S)[1]
    body=re.sub(r'<script\b[^>]*>.*?</script>','',body,flags=re.S)
    # Remove old annotation control; preserve original business container DOM.
    body=re.sub(r'<div[^>]+id=["\']anno[^>]*>.*?</div>','',body,flags=re.S)
    codes=[(ROOT/'js/components/list-order.js').read_text(),(ROOT/'js/components/unified-categories.js').read_text()]
    if kind=='cloud':
        codes.extend((ROOT/p).read_text() for p in ['js/components/flow-status-domains.js','js/components/flow-routing.js'])
    if kind in ['ai','cloud']:
        for local in ['assets/vendor/jszip.min.js','assets/vendor/sax.js','js/components/import-workbook.js']:
            content=(ROOT/local).read_text()
            codes.append(import_io_source(content) if local=='js/components/import-workbook.js' else content)
    if kind=='ai':codes.append("window.DUnifiedAI={scenes:()=>[],sceneOptions:()=>''};")
    for path in scriptpaths:
        code=read(path)
        if kind=='ai' and path=='js/nav.js':
            # The parent owns initial navigation; stale callbacks must not bind
            # multiple handlers to the same newly rendered source DOM.
            code=code.replace('  function navigateTo(pageKey, navId) {', '  var dNavigationVersion=0;\n  function navigateTo(pageKey, navId) {\n    var dCurrentNavigation=++dNavigationVersion;',1)
            code=code.replace('if (module.init) setTimeout(function () { module.init(); }, 0);', 'if (module.init) setTimeout(function () { if(dCurrentNavigation===dNavigationVersion&&container.isConnected)module.init(); }, 0);',1)
            code=code.replace("  document.addEventListener('DOMContentLoaded', init);", "  // The integrated parent opens the original page after module readiness.",1)
        if kind=='ai' and path=='mock/data.js':
            extraction="const fs=require('fs'),vm=require('vm');const c={};c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(0,'utf8'),c,{timeout:1000});process.stdout.write(JSON.stringify({groups:c.MockBlockGroups,rows:c.MockBlockRows,calls:c.MockCallRecordRows.map(r=>({sessionId:r.sessionId,platform:r.platform,phone:r.phone,startTime:r.startTime,sceneName:r.sceneName,status:r.status}))}));"
            fixtures=json.loads(subprocess.run(['node','-e',extraction],input=code,text=True,check=True,capture_output=True).stdout)

        if path=='js/alicti-storage.js':
            code=code.replace("const prefix = 'alicti-v120-class-flow:'", "const prefix = DNativeContext.storagePrefix || 'd-contact-cloud-v200-rebuild-20261026:cloud:'")
        if kind=='cloud' and path=='js/app.js':
            codes.append("sessionStorage.setItem('unified-call-context-v3',JSON.stringify(DNativeContext.nativeSession));")
            codes.append((ROOT/'js/adapters/cloud-resources.js').read_text())
            identity_adapter=(ROOT/'js/adapters/cloud.js').read_text().split('/* D_ORG_BOOT_BEGIN */')[1].split('/* D_ORG_BOOT_END */')[0]
            codes.append(identity_adapter)
            codes.append("if(DNativeContext.context.account.id==='SYN-CLOUD-SUPER'&&DNativeContext.storagePrefix===parent.DSession.prefix+'cloud:synthetic-resources:')window.applyDOrganizationIdentity();")
            code=code.replace('  restoreManagementData();', '  restoreManagementData();\n  window.applyDOrganizationIdentity();',1)
            resource_hooks={
              'function currentRoleCode() {':"if(DResourceAccess.active())return 'RESOURCE_ADMIN';",
              'function availableTenants() {':'if(DResourceAccess.active())return DResourceAccess.tenants(state);',
              'function availableInstances() {':'if(DResourceAccess.active())return DResourceAccess.instances().filter(r=>r.status===\'RUNNING\');',
              'function managedTenants() {':'if(DResourceAccess.active())return DResourceAccess.tenants();',
              'function currentTenant() {':'if(DResourceAccess.active())return DResourceAccess.tenants(state)[0]||null;',
              'function tenantIdsInScope() {':'if(DResourceAccess.active())return DResourceAccess.tenants(state).map(t=>t.tenantId);',
              'function ensureContext() {':'if(DResourceAccess.active()){DResourceAccess.initialize(state);return;}',
              'function effectiveAccess() {':'if(DResourceAccess.active())return DResourceAccess.access(state);',
              'function canMenu(permission) {':'if(DResourceAccess.active())return DResourceAccess.menu(permission,state);',
              'function canAction(permission) {':'if(DResourceAccess.active())return DResourceAccess.action(permission);',
              'function authorizeObject(permission, object) {':'if(DResourceAccess.active())return (!permission||DResourceAccess.action(permission))&&DResourceAccess.owns(object);'}
            for original,hook in resource_hooks.items():
                assert original in code,original
                code=code.replace(original,original+'\n    '+hook,1)
            production_hooks={
              'function canMenu(permission) {':"const production=window.DProductionAccess?.menu(permission);if(production!==null&&production!==undefined)return production&&effectiveAccess().valid;",
              'function canAction(permission) {':"const production=window.DProductionAccess?.action(permission);if(production!==null&&production!==undefined){if(!production)return false;if(['application.manage','instance.manage'].includes(permission))return isReady()&&isSuper();return effectiveAccess().valid;}"
            }
            for original,hook in production_hooks.items():
                if original not in code:raise ValueError('Native authorization entry changed: '+original)
                code=code.replace(original,original+'\n    '+hook,1)
            sensitive="function canSensitive(permission) {"
            if sensitive not in code:raise ValueError('Native sensitive-read entry changed')
            code=code.replace(sensitive,sensitive+"const production=window.DProductionAccess?.sensitive(permission);if(production!==null&&production!==undefined)return production&&effectiveAccess().valid;",1)
            code=code.replace("if (isSuper()) { state.activeDomain='CLOUD_CONTACT_CENTER'; state.currentPage='alicti-accounts'; state.returnContext=null; }", "if (isSuper()||DResourceAccess.active()) { state.activeDomain='CLOUD_CONTACT_CENTER'; state.currentPage='alicti-accounts'; state.returnContext=null; }")
        resource_pages={'js/pages/alicti-accounts.js':'PAGE-2219','js/pages/resource-lines.js':'PAGE-2215','js/components/alicti-number-import.js':'PAGE-2215','js/pages/extension-management.js':'PAGE-2217','js/pages/time-condition-management.js':'PAGE-2218'}
        if kind=='cloud' and path in resource_pages:
            code=code.replace('AppState.isSuper()',"(AppState.isSuper()||window.DResourceAccess?.page('"+resource_pages[path]+"'))")
            if path=='js/pages/alicti-accounts.js':
                code=code.replace("ui.pageHeader('AliCti 账号管理'", "ui.pageHeader('云呼叫账号'")
                code=code.replace('<button class="btn btn-primary" onclick="${action(\'openEditor\', \'\', key)}">新增账号</button>', '<button class="btn btn-primary" ${window.DResourceAccess?.active()?\'disabled title="仅可维护已授权账号"\':\'\'} onclick="${action(\'openEditor\', \'\', key)}">新增账号</button>')
        if kind=='cloud' and path in ['js/components/alicti-extensions.js','js/components/alicti-time-conditions.js']:
            page_id='PAGE-2217' if 'extensions' in path else 'PAGE-2218'
            code=code.replace("['ADMIN','SUPER_ADMIN'].includes(access().roleCode)","(['ADMIN','SUPER_ADMIN'].includes(access().roleCode)||root.DResourceAccess?.page('"+page_id+"'))")
            code=code.replace("['ADMIN','SUPER_ADMIN','OPERATOR'].includes(access().roleCode)","(['ADMIN','SUPER_ADMIN','OPERATOR'].includes(access().roleCode)||root.DResourceAccess?.page('"+page_id+"'))")
        if kind=='cloud' and path in ['js/components/alicti-queues.js','js/components/outbound-groups.js']:
            page_id='PAGE-2213' if 'queues' in path else 'PAGE-2212'
            code=code.replace("access.roleCode === 'ADMIN'", "(access.roleCode === 'ADMIN'||window.DResourceAccess?.page('"+page_id+"'))")
        if kind=='cloud' and path=='js/components/alicti-number-pools.js':
            code=code.replace("['OPERATOR','ADMIN','SUPER_ADMIN'].includes(access.roleCode)","(['OPERATOR','ADMIN','SUPER_ADMIN'].includes(access.roleCode)||root.DResourceAccess?.page('PAGE-2216'))")
            code=code.replace("['ADMIN','SUPER_ADMIN'].includes(access.roleCode)","(['ADMIN','SUPER_ADMIN'].includes(access.roleCode)||root.DResourceAccess?.page('PAGE-2216'))")
            code=code.replace("root.AppState?.canMenu?.('cloud.tasks')", "(root.AppState?.canMenu?.('cloud.tasks')||root.DResourceAccess?.page('PAGE-2216'))")
        if kind=='cloud' and path=='js/components/seat-phone-config.js':
            code=code.replace("['ADMIN', 'SUPER_ADMIN'].includes(a.roleCode)","(['ADMIN', 'SUPER_ADMIN'].includes(a.roleCode)||window.DResourceAccess?.page('PAGE-2210'))")
        if kind=='cloud' and path=='js/pages/contact-center-settings.js':
            code=code.replace('AppState.isSuper()',"(AppState.isSuper()||window.DResourceAccess?.page('PAGE-2211'))")
        if kind=='cloud' and path=='js/components/alicti-accounts.js':
            code=code.replace("app?.isSuper?.() && app?.account?.().status==='启用'", "(app?.isSuper?.()||window.DResourceAccess?.page('PAGE-2219')) && app?.account?.().status==='启用'")
            code=code.replace('if (authorized()) return true;', 'if(window.DResourceAccess?.active())return window.DResourceAccess.page(\'PAGE-2219\')&&window.DResourceAccess.owns(row);\n    if (authorized()) return true;',1)
            code=code.replace("const row=data.instances.find(r=>r.configId===configId);if(!row)return [];", "const row=data.instances.find(r=>r.configId===configId);if(!row||!canRead(row))return [];",1)
            needle='const before=opts.configId?snapshot.accounts.find(row=>row.configId===opts.configId):null;'
            assert needle in code
            code=code.replace(needle,needle+"\n        if(window.DResourceAccess?.active()&&(!before||!window.DResourceAccess.owns(before)))return failure('只能维护当前已授权的云呼叫账号。');",1)
        if kind=='cloud' and path=='js/components/call-data-issues.js':
            old=".filter(r => r && r.enterpriseId === AppState.get().enterpriseId)"
            if old not in code:raise ValueError('Call-issue ownership filter changed')
            code=code.replace(old,".filter(r => r && r.enterpriseId === AppState.get().enterpriseId && AppState.authorizeObject('',r))",1)
            code=code.replace('通话数据异常由超级管理员处理。','请使用有当前租户通话数据异常权限的管理员账号。')
            record_labels="""  const recordStateLabel=value=>({'待处理':'待核对','核对中':'核对中','仍需处理':'仍缺资料','已恢复':'已补齐'}[value]||value);
  const recordFilterLabel=value=>value==='全部'?'全部状态':value==='待处理'?'未补齐':recordStateLabel(value);
  const recordStateBadge=value=>ui.status(value).replace('>'+esc(value)+'<','>'+esc(recordStateLabel(value))+'<');
"""
            code=code.replace("  let keyword = '', status = '待处理', page = 1;",record_labels+"  let keyword = '', status = '待处理', page = 1;",1)
            record_copy={
              "ui.pageHeader('通话数据异常', '处理自动核对后仍未恢复的通话记录。')":"ui.pageHeader('通话记录核对', '核对通话结果、结束时间或时长缺失的记录，便于查询与统计。未接通、拒接等正常结果请在云呼叫记录中查看。')",
              '<span>通话 / 客户 / 租户</span>':'<span>查找通话记录</span>',
              'placeholder="输入通话编号、号码或租户"':'placeholder="输入通话编号、客户号码或租户名称"',
              '<span>处理状态</span>':'<span>核对状态</span>',
              "<option ${status === s ? 'selected' : ''}>${s}</option>":'<option value="${esc(s)}" ${status === s ? \'selected\' : \'\'}>${esc(recordFilterLabel(s))}</option>',
              "<span>待处理 ${all.filter(r => r.status !== '已恢复').length} 通</span>":"<span>待补齐记录 ${all.filter(r => r.status !== '已恢复').length} 条</span>",
              "系统自动去重、整理顺序并核对遗漏。本页仅列自动处理后仍需人工关注的记录；重新核对只补充通话数据，不重新拨打客户、不修改业务跟进结果。当前为本地演示。":"本页承接自动核对后资料仍不完整的记录。重新核对仅处理这一条通话资料，取得完整结果后才补齐；资料不足时继续保留待核对状态。不重新拨打客户，也不修改已保存的业务跟进结果。当前原型仅演示该流程。",
              "label:'异常通话'":"label:'需核对的通话记录'",
              "label:'异常情况'":"label:'缺失或异常信息'",
              "label:'业务影响'":"label:'对业务的影响'",
              "{key:'status',label:'处理状态',render:v=>ui.status(v)}":"{key:'status',label:'核对状态',render:v=>recordStateBadge(v)}",
              "查看${r.status === '已恢复' ? '结果' : '处理'}":"查看详情",
              "当前筛选下没有异常通话":"当前筛选条件下没有记录",
              "当前客户/品牌暂无需要人工处理的通话数据异常":"暂无需要补齐的通话记录",
              '<h2>通话数据异常详情</h2>':'<h2>通话记录核对详情</h2>',
              '<dt>异常情况</dt>':'<dt>需要核对的资料</dt>',
              '<dt>业务影响</dt>':'<dt>对业务的影响</dt>',
              '<dt>处理状态</dt><dd>${esc(r.status)}</dd>':'<dt>核对状态</dt><dd>${esc(recordStateLabel(r.status))}</dd>',
              "c?.result || '尚未取得'":"c?.result || '待补齐'",
              "c?.endedAt || '尚未取得'":"c?.endedAt || '待补齐'",
              "c?.durationSeconds == null ? '尚未取得'":"c?.durationSeconds == null ? '待补齐'",
              '<dt>最近核对</dt>':'<dt>最近一次核对结果</dt>',
              "ui.detailSection('异常信息',details)":"ui.detailSection('待核对资料',details)",
              "ui.detailSection('核对结果',result)":"ui.detailSection('当前通话记录',result)",
              "ui.detailSection('处理记录',":"ui.detailSection('核对历史',",
              '系统自动核对未恢复，等待人工处理。':'暂无人工核对记录，可点击下方按钮重新核对资料。',
              '演示数据：只核对这一通记录，不重新拨号，不修改坐席处理结果。':'仅核对并补齐结果、结束时间和时长，不重新拨打客户，不修改已保存的跟进结果。当前原型仅模拟核对流程。',
              '正在核对…':'正在核对记录…',
              '重新核对（演示）':'重新核对记录',
              '工作范围已变化，本次核对未应用，请重新核对':'当前租户或登录状态已变化，本次未更新记录，请重新打开后核对',
              '演示核对取得完整结果，已补齐本地通话记录':'已取得完整资料并补齐这条通话记录（原型演示）',
              '暂未取得完整结果，未修改通话记录；请稍后重试或联系技术支持':'资料仍不完整，已保留原记录；可稍后重新核对或联系平台管理员',
              '通话数据核对（演示）':'通话记录核对（演示）'
            }
            for old_copy,new_copy in record_copy.items():
                if old_copy not in code:raise ValueError('Call-record wording source changed: '+old_copy)
                code=code.replace(old_copy,new_copy)
        if kind=='cloud' and path=='js/components/alicti-inbound.js':
            old='(!manage||AppState.isSuper())'
            if old not in code:raise ValueError('Inbound configuration authorization changed')
            code=code.replace(old,"(!manage||parent.DSession.can('F36'))",1)
        if kind=='ai' and path=='js/pages/scene-block.js':
            placeholder="exportRows: function () { showToast('导出任务已提交', 'success'); },"
            if placeholder not in code:raise ValueError('AI special export source changed; review actual export behavior')
            code=code.replace(placeholder,"exportRows: function () { showToast('本页暂未接入导出，尚未生成文件。', 'info'); return false; },",1)
        if kind=='ai' and path=='js/pages/sys-tenant.js':
            old="function showBillingDrawer(tenantName) {\n    if (!requireTenantBillingPermission()) return;"
            if old not in code:raise ValueError('Original service drawer entry changed')
            code=code.replace(old,"function showBillingDrawer(tenantName) {\n    if (!(window.DNativeServices?.canReadDrawer(tenantName)||requireTenantBillingPermission())) return;",1)
            drawer=re.search(r'  function showBillingDrawer\(tenantName\) \{.*?(?=\n  function retryRechargeOverview)',code,flags=re.S)
            if not drawer:raise ValueError('Original service drawer body changed')
            drawer_body=drawer.group(0).replace("    document.body.insertAdjacentHTML('beforeend', html);","    if(window.DNativeServices)html=DNativeServices.drawerHtml(profile,html);\n    document.body.insertAdjacentHTML('beforeend', html);",1)
            code=code[:drawer.start()]+drawer_body+code[drawer.end():]
        if kind=='cloud' and path=='js/nav.js':
            code=code.replace("label: 'AliCti 账号管理'","label: '云呼叫账号'")
            code=code.replace("const requested=location.hash.slice(1)||'home'","const requested=event.state?.routeKey||'home'")
            code=code.replace("label: '流转规则模板'","label: '流转模板'")
        if kind=='cloud' and path=='js/pages/customer-demo.js':
            old="  const tenantId='TEN-NISSAN-HQ',enterpriseId='7522240',ownerId='ACC-OPS-108';"
            assert old in code
            code=code.replace(old,"  const dProof=parent.DSeed.boundedWorkflowFixture,dBounded=dProof&&DNativeContext.context.account.id===dProof.accountId&&DNativeContext.storagePrefix===parent.DSession.prefix+dProof.storageSuffix;\n  const tenantId='TEN-NISSAN-HQ',enterpriseId='7522240',ownerId=dBounded?dProof.accountId:'ACC-OPS-108',demoOwnerName=dBounded?dProof.ownerName:'王静（演示坐席）';",1)
            code=code.replace("userName:'王静（演示坐席）'","userName:demoOwnerName").replace("agentName:'王静（演示坐席）'","agentName:demoOwnerName")
            code=code.replace("lifecycleStatus:'已启用',agentStatus:'空闲',syncStatus:'同步成功'", "lifecycleStatus:'已启用',agentStatus:dBounded?'离线':'空闲',syncStatus:'同步成功'",1)
            code=code.replace("showToast('演示已准备：2位待分配客户，运营王静已有可联系客户','success')", "showToast(dBounded?'原联动样例已准备：2位待分配客户，合成流程坐席已有可联系客户':'演示已准备：2位待分配客户，运营王静已有可联系客户','success')",1)
        if kind=='cloud' and path=='js/pages/scenario-demo.js':
            marker='  function resources(){'
            helper='''  function dBoundedTaskCaller(task){
    const proof=parent.DSeed.boundedWorkflowFixture;
    if(!proof||DNativeContext.context.account.id!==proof.accountId||DNativeContext.storagePrefix!==parent.DSession.prefix+proof.storageSuffix||!f.tasks.some(s=>s.taskId===task.taskId)||!task.simulation||task.startedAt||Number(task.completed)||d.calls.some(c=>c.taskId===task.taskId)||!['待分配客户','待启动'].includes(task.status))return;
    const account=d.instances.find(a=>a.enterpriseId===task.enterpriseId),group=proof.navigations?.[task.callType];
    if(!AliCtiFields.callerNavigationOptions(account).some(n=>n.customerClidsGroup===group))return;
    const settings=AliCtiFields.callerSettingsFromAccount(account,{customerClidsGroup:group,clidPoolList:[],customerTimeout:30});
    if(!AliCtiFields.validateCallerSettings(settings,{requireNavigation:true}).ok)return;
    Object.assign(task,settings);task.executionConfig={...task.executionConfig,...settings};
  }
'''
            assert marker in code
            code=code.replace(marker,helper+marker,1)
            old="      const list=spec.callType==='预外呼'?d.predictiveTasks:d.ivrTasks;"
            assert old in code
            code=code.replace(old,"      dBoundedTaskCaller(task);\n"+old,1)
        if kind=='cloud' and path=='js/pages/cloud-call-tasks.js':
            old="      ui.journey({ current: 'create',"
            assert old in code
            code=code.replace(old,"      (DNativeContext.context.account.id===parent.DSeed.boundedWorkflowFixture?.accountId&&DNativeContext.storagePrefix===parent.DSession.prefix+parent.DSeed.boundedWorkflowFixture.storageSuffix?'<div class=\"platform-alert\"><strong>隔离Mock验收样例</strong> <button class=\"btn\" onclick=\"ScenarioDemo.prepare()\">准备原联动演示样例</button><span>仅追加原有演示数据，不代表文件上传或供应商执行。</span></div>':'')+\n"+old,1)
        if kind=='cloud' and path=='js/components/alicti-seat-import.js':
            old="    const outcome=AliCtiDemo.seatBatchOutcome||'success';"
            assert old in code
            code=code.replace(old,"    const proof=parent.DSeed.boundedSeatBatchReceipt,synthetic=batch&&proof&&DNativeContext.context.account.id===proof.accountId&&DNativeContext.storagePrefix===parent.DSession.prefix+'cloud:synthetic-resources:'&&tenant.tenantId===proof.tenantId&&tenant.enterpriseId===proof.enterpriseId&&plan.fields.name===proof.name&&JSON.stringify(selected)===JSON.stringify(proof.cnos);\n    const outcome=synthetic?proof.outcome:(AliCtiDemo.seatBatchOutcome||'success');",1)
        if kind=='cloud' and path=='js/components/call-data-issues.js':
            old="      if (location.hash === '#event-callbacks') refresh();"
            assert old in code
            code=code.replace(old,"      if (window.RouteRuntime?.snapshot?.()?.key === 'event-callbacks') refresh();",1)
            code="""// One explicit synthetic history sample; existing calls/issues are never replaced.
(function(){if(DNativeContext.context.account.id!=='SYN-CLOUD-SUPER'||DNativeContext.storagePrefix!==parent.DSession.prefix+'cloud:synthetic-resources:')return;const sample=parent.DSeed.boundedCallIssue;if(!sample)return;const clone=v=>JSON.parse(JSON.stringify(v));if(!CloudCallData.calls.some(c=>c.callId===sample.call.callId))CloudCallData.calls.push(clone(sample.call));CloudCallData.callDataIssues=CloudCallData.callDataIssues||[];if(!CloudCallData.callDataIssues.some(i=>i.issueId===sample.issue.issueId))CloudCallData.callDataIssues.push(clone(sample.issue));})();
"""+code
        if kind=='cloud' and path=='js/components/seat-phone-config.js':
            code+="""
// Extend only the independent Mock receipt after the real local binding reader exists.
(function(){
  const owner=DNativeContext.context,receipt=owner.account.id===parent.DSeed.boundedWorkflowTelephoneFixture?.supervisor.accountId?parent.DSeed.boundedWorkflowTelephoneFixture:parent.DSeed.boundedTelephoneFixture,data=window.CloudCallData,prior=window.AliCtiSeatOperationFixtures;
  if(!prior||receipt?.source!=='SYNTHETIC_ACCEPTANCE_RECEIPT_20261027'||owner.account.id!==receipt.supervisor.accountId||owner.scope.id!==receipt.supervisor.tenantId||DNativeContext.storagePrefix!==parent.DSession.prefix+(receipt.storageSuffix||'cloud:'))return;
  function exact(s){const matches=data.agents.filter(a=>a.contactCenterIdentityId===s.identityId&&a.cno===s.cno&&a.enterpriseId===s.enterpriseId&&a.tenantId===s.tenantId&&a.lifecycleStatus==='已启用'&&a.syncStatus==='同步成功');if(matches.length!==1)return null;const a=matches[0],binding=SeatPhoneConfig.read(a);return binding.ok&&binding.eligible!==false&&binding.value===s.bindTel?a:null;}
  const seatOnly=receipt.mode==='seat-only',own=exact(receipt.supervisor),peer=seatOnly?null:exact(receipt.peer);
  if(!own||(!seatOnly&&!peer)||own.accountId!==owner.account.id||(!seatOnly&&window.TenantSupervisorPolicy.powerFor(own)!==1)||prior.queues.some(q=>q.enterpriseId===receipt.queue.enterpriseId&&q.qno===receipt.queue.qno))return;
  const clone=v=>JSON.parse(JSON.stringify(v)),next=clone(prior),proof={...clone(receipt.supervisor),power:seatOnly?0:1,confirmed:true,mock:true,source:receipt.source};
  if(peer)next.seats.push({...clone(receipt.peer),mock:true,source:receipt.source});next.seats.push({...proof,bindType:3});if(!seatOnly)next.supervisors.push(proof);
  next.queues.push({...clone(receipt.queue),agentStatuses:[...clone(receipt.queue.agentStatuses),{cno:own.cno,name:own.userName,state:'离线'}]});
  next.installation.acceptance={accountId:owner.account.id,identityId:own.contactCenterIdentityId,peerIdentityId:peer?.contactCenterIdentityId||'',source:receipt.source};
  const freeze=v=>{Object.freeze(v);Object.values(v).forEach(x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x))freeze(x);});return v;};window.AliCtiSeatOperationFixtures=freeze(next);
})();
"""
        if kind=='ai' and path=='js/pages/scene-block.js':
            code=code.replace('本地分组立即更新，系统按原分组和目标分组的电声平台绑定分别生成删除与新增同步任务。','本地分组更新后，原分组与目标分组的平台处理分别待核对；不会据此认定远端已移除或已生效。')
            code=code.replace('新增或移动号码将自动向已启用的所有平台同步；移除号码时将先解除所有平台远端黑名单，全部成功后再清除本地。','已启用平台的新增、移动和移除记录分别核对处理结果；结果未确认前，保留尚未解除的限制。')
            code=code.replace('只展示已完成系统接入的平台，平台字段转换由后台适配器处理。','选择本组需要同步的平台；启用后分别核对平台处理结果。')
            integration=(ROOT/'js/adapters/ai-special.js').read_text()
            marker="  window.Pages = window.Pages || {};\n  window.Pages['scene-block'] = {"
            assert marker in code
            code=code.replace(marker,integration+"\n"+marker,1)
            code=code.replace("window.Pages['scene-block'] = {", "window.Pages['scene-block'] = {\n    integrationSelectPlatform:selectSyncPlatform,integrationDirection:setSyncDirection,integrationUpdatePhone:updateBlacklistPhone,integrationConfigurePlatform:configurePlatform,integrationPrefill:prefillBlacklist,integrationSnapshot:function(){return copySpecial({version:specialVersion,groups:groups,rows:rows});},integrationReload:function(){specialPending=null;loadSpecialState();updatePage();},integrationGuard:specialGuard,integrationPosition:function(){return {groupId:activeGroupId,groupKeyword:groupKeyword,filters:copySpecial(filters)};},integrationRestorePosition:function(p){if(p&&groups.some(function(g){return g.id===p.groupId;}))activeGroupId=p.groupId;if(p?.filters)filters=Object.assign({phone:'',addType:'all',status:'all',start:'',end:''},p.filters);},",1)
            code=code.replace("closeModal: function () { activeModal = null; editingGroupId = null; pendingAction = null; updatePage(); }", "closeModal: function () {if(specialDirty&&!specialPending)return parent.DApp.leave(null,clearSpecialModal);clearSpecialModal();}")
            code=code.replace("exportRows: function () { showToast('导出任务已提交', 'success'); }", "exportRows: function () { showToast('原黑名单导出入口尚未实现，本次未生成导出文件', 'info'); }")
            code=code.replace('<h2>外呼黑名单</h2><p>统一维护禁止外呼的手机号码，名单内的号码不会进行外呼。</p>', '<h2>呼叫拦截</h2><p>按分组管理号码和有效期，在平台同步设置中配置 AI 与天润。</p>')
            code=code.replace("    if (!group.platformBindings.length) return '仅本地';", "    if(group.platformBindings.some(function(b){return b.status==='待核对';}))return '待核对';\n    if (!group.platformBindings.length) return '仅本地';",1)
            code=code.replace("    if (statuses.some(function (status) { return status === '同步失败'; }))", "    if(statuses.indexOf('解除待核')>=0)return '解除待核';if(statuses.indexOf('待核对')>=0)return '待核对';\n    if (statuses.some(function (status) { return status === '同步失败'; }))",1)
            code=code.replace("if (status === '待同步' || status === '同步中' || status === '待首条号码')", "if (status === '待核对' || status === '解除待核' || status === '待同步' || status === '同步中' || status === '待首条号码')")
            # Group-scoped detail lookup never falls back to another group's same number.
            code=code.replace("rows.find(function (entry) { return entry.phone === phone; })", "rows.find(function (entry) { return entry.groupId === activeGroupId && entry.phone === phone; })")
            code=code.replace("rows.find(function (entry) { return entry.phone === activeModal.phone; })", "rows.find(function (entry) { return entry.groupId === activeModal.groupId && entry.phone === activeModal.phone; })")
            code=code.replace("setModal('detail', { phone: phone });", "setModal('detail', { phone: phone, groupId: activeGroupId });")
            code=code.replace('保存后立即在本地生效，并自动同步至电声平台。', '保存后按当前分组规则生效，平台同步结果分别展示。')
            code=code.replace('中台统一维护黑名单，电声外呼平台由系统自动同步。', '统一维护本租户黑名单分组，按平台配置同步号码。')
        if kind=='ai' and path=='js/pages/result-clue.js':
            code=code.replace('通话详情已加载', '暂未提供此条通话详情，未发起查询').replace('导出任务已提交，系统正在生成报表...', '本页暂未接入导出，尚未生成文件。')
        if kind=='ai' and path=='js/pages/report-clue.js':
            code=code.replace('  function getPanelData(panelId) {','  function dRawClueData(panelId) {',1)
            code=code.replace('  function doExport(event) {', "  function doExport(event) {\n    showToast('本页暂未接入导出，尚未生成文件。','info');return;",1)
            helper="""  var dClueFilters={};
  function dClueActivePanel(){var main=Array.from(document.querySelectorAll('.clue-report-page .content-main > .tab-panel')).find(function(p){return p.style.display!=='none';});if(!main)return null;return Array.from(main.querySelectorAll('.sub-tab-panel')).find(function(p){return p.style.display!=='none';})||main;}
  function dClueReadFilters(panel){var selects=panel.querySelectorAll('.filter-bar select.filter-select'),dateFrom=panel.querySelector('.date-input-start'),dateTo=panel.querySelector('.date-input-end'),starts=panel.querySelectorAll('.datetime-input-start'),ends=panel.querySelectorAll('.datetime-input-end'),detail=panel.id.indexOf('ai-')===0,scene=detail||panel.id==='tab-return'?selects[0]:null,type=detail?selects[1]:panel.id.indexOf('manual-')===0?selects[0]:null;return {from:dateFrom?.value||starts[0]?.value||'',to:dateTo?.value||ends[0]?.value||'',callFrom:starts[1]?.value||'',callTo:ends[1]?.value||'',type:type?.value==='new'?'新线索':type?.value==='cold'?'冷线索':'',scene:scene?.value?scene.options[scene.selectedIndex].textContent.trim():'',store:panel.querySelector('input[placeholder*=门店]')?.value.trim()||'',levels:Array.from(panel.querySelectorAll('.opt-item:checked')).map(function(n){return n.nextElementSibling?.textContent.trim()||'';})};}
  function dClueWithin(value,from,to){if(!from&&!to)return true;var v=String(value||'').replace(' ','T');if(!/^\\d{4}-\\d{2}-\\d{2}/.test(v))return false;var lo=String(from||'').replace(' ','T'),hi=String(to||'').replace(' ','T');if(lo.length===10&&hi.length<=10)v=v.slice(0,10);if(hi.length===16)hi+=':59';return (!lo||v>=lo)&&(!hi||v<=hi);}
  function dClueFilterRows(rows,filter,panelId){if(!filter)return rows;return rows.filter(function(r){return dClueWithin(r.date||r.importTime||r.time,filter.from,filter.to)&&dClueWithin(r.callTime,filter.callFrom,filter.callTo)&&(!filter.type||r.type===filter.type)&&(!filter.scene||(r.sceneName||r.scene)===filter.scene)&&(!filter.store||String(r.storeName||'').includes(filter.store))&&(!filter.levels?.length||filter.levels.includes(r.levelCenter));});}
  function getPanelData(panelId){return dClueFilterRows(dRawClueData(panelId),dClueFilters[panelId],panelId);}
"""
            code=code.replace('  /* ===== 渲染外呼线索统计行（14 列） ===== */',helper+'\n  /* ===== 渲染外呼线索统计行（14 列） ===== */',1)
            code=code.replace("  function doQuery() {\n    showToast('查询中...');\n  }", "  function doQuery(quiet) {var panel=dClueActivePanel();if(!panel)return;var f=dClueReadFilters(panel);if((f.from&&f.to&&f.from>f.to)||(f.callFrom&&f.callTo&&f.callFrom>f.callTo))return showToast('开始时间不能晚于结束时间','warning');dClueFilters[panel.id]=f;pageStates[panel.id].curPage=1;refreshPanel(panel.id);if(!quiet)showToast('已按当前条件查询','info');}",1)
            code=code.replace("  function doRefresh() {\n    showToast('已刷新');\n  }", "  function doRefresh() { doQuery(true);showToast('已刷新'); }",1)
            code=code.replace("    var data = getPanelData(panelId);\n    var tbody", "    var data = getPanelData(panelId);\n    state.curPage=Math.max(1,Math.min(state.curPage,Math.ceil(data.length/state.pageSize)||1));\n    var tbody",1)
            code=code.replace("var nextDisabled = cur >= totalPages && totalPages > 0 ? '' : '';", "var nextDisabled = cur >= totalPages ? 'disabled' : '';",1)
            code=code.replace('var countBtns = Math.max(totalPages, maxDisplayBtns);', 'var firstBtn=Math.max(1,Math.min(cur-4,totalPages-maxDisplayBtns+1));var countBtns=Math.min(totalPages,firstBtn+maxDisplayBtns-1);',1)
            code=code.replace('for (var i = 1; i <= countBtns; i++)','for (var i = firstBtn; i <= countBtns; i++)',1)
            code=code.replace("+ prevDisabled + '\" onclick=", "+ prevDisabled + '\" '+prevDisabled+' onclick=",1)
            code=code.replace("+ nextDisabled + '\" onclick=", "+ nextDisabled + '\" '+nextDisabled+' onclick=",1)
            code=code.replace("    initDefaultDates();\n    showToast('已重置筛选条件');", "    if(activePanel)activePanel.querySelectorAll('select.filter-select').forEach(function(el){el.selectedIndex=0;});\n    initDefaultDates();doQuery(true);\n    showToast('已重置筛选条件');",1)
            code=code.replace('    initDefaultDates();\n\n    // 点击页面其他区域', '    initDefaultDates();doQuery(true);\n\n    // 点击页面其他区域',1)
        if kind=='ai' and path=='js/pages/report-billing.js':
            code=code.replace('导出任务已提交', '本明细暂未接入导出，尚未生成文件')
            helper="""  function dBillingScopeRows(){
    var c=parent.DSession.context(),owner=window.DNativeContext?.context;
    if(!c||c.scope.kind!=='tenant'||c.account.id!==owner?.account.id||c.scope.id!==owner?.scope.id||!parent.DSession.allowed('PAGE-2106'))return [];
    var aiId=parent.DSeed.aiTenantIds[c.scope.id];if(!aiId)return [];
    return (window.MockBillingStatsRows||[]).filter(function(row){var proof=parent.DSeed.billingFixtureOwners?.[String(row.id)];return proof&&proof.aiTenantId===aiId&&proof.sourceTenantName===row.tenantName;}).map(function(row){return Object.assign({},row,{tenantId:aiId,_sourceTenantName:row.tenantName,tenantName:c.scope.label});});
  }
  function dBillingAllowed(id){return dBillingScopeRows().find(function(row){return String(row.id)===String(id);});}
  function dBillingDateRows(rows,from,to){return rows.filter(function(row){return (!from||row.dateFrom>=from)&&(!to||row.dateTo<=to);});}
  function dBillingEscape(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});}
"""
            code=code.replace('  var allRows = window.MockBillingStatsRows || [];',helper+'  var allRows = dBillingScopeRows();',1)
            code=code.replace('  function render() {','  function render() {\n    allRows=dBillingScopeRows();',1)
            code=code.replace('filteredRows = allRows.slice();',"filteredRows = dBillingDateRows(allRows,'2026-06-01','2026-06-09');")
            code=code.replace("查看不同租户的每日通话计费明细（按账号收费不统计在内）。", "仅展示当前租户已核对归属的记录；日期筛选完整统计区间，不拆分或重算原时长。")
            code=code.replace("'<div class=\"billing-note\"", "'<div class=\"billing-note\"",1)
            code=code.replace("<div>暂无数据</div>","<div>当前条件暂无已核对归属的记录；归属待核的原记录不展示。</div>",1)
            code=code.replace("'<span>第 1-' + end", "'<span>第 '+(total?1:0)+'-' + end",1)
            code=code.replace("  function query() {", "  function query() {\n    allRows=dBillingScopeRows();var from=document.getElementById('billingDateFrom')?.value||'',to=document.getElementById('billingDateTo')?.value||'';if((from&&!/^\\d{4}-\\d{2}-\\d{2}$/.test(from))||(to&&!/^\\d{4}-\\d{2}-\\d{2}$/.test(to))||(from&&to&&from>to))return showToast('请填写有效的计费日期范围','warning');",1)
            code=code.replace('filteredRows = allRows.filter(function (item) {','filteredRows = dBillingDateRows(allRows,from,to).filter(function (item) {',1)
            code=code.replace('  function resetFilters() {','  function resetFilters() {\n    allRows=dBillingScopeRows();',1)
            code=code.replace("  function refresh() {\n    filteredRows = dBillingDateRows(allRows,'2026-06-01','2026-06-09');\n    updateTable();\n    showToast('刷新成功', 'success');\n  }", "  function refresh() { query(); }",1)
            code=code.replace("  function showDetail(id) {", "  function showDetail(id) {\n    if(!dBillingAllowed(id))return showToast('当前无权查看此租户的计费记录','warning');",1)
            code=code.replace("  function showCallDetail(id) {", "  function showCallDetail(id) {\n    if(!dBillingAllowed(id))return showToast('当前无权查看此租户的计费记录','warning');",1)
            code=code.replace("var summary = allRows.filter(function (item) { return item.id === id; })[0] || {};", "var summary=dBillingAllowed(id)||{};rows=(rows||[]).filter(function(row){return row.tenantName===summary._sourceTenantName;}).map(function(row){return Object.assign({},row,{tenantName:summary.tenantName});});",1)
            code=code.replace("+ item.tenantName +", "+ dBillingEscape(item.tenantName) +")
            code=code.replace("+ name +", "+ dBillingEscape(name) +")
        if kind=='ai' and path=='js/pages/result-records.js':
            code=code.replace('导出任务已提交，系统正在生成报表...', '本通话记录导出尚未接入，本次未生成文件。')
            marker="window.Pages['result-records'] = {"
            assert marker in code
            code=code.replace(marker,marker+"\n    openByReference:function(id,platform){var index=rows.findIndex(function(r){return String(r.sessionId)===String(id)&&r.platform===platform;});if(index<0)return showToast('来源通话暂时无法准确定位，请重新核对','warning');return showDetail(index);},",1)
            helper="""    function refusalSource(item){try{var c=parent.DSession.context();if(!item||c?.scope.kind!=='tenant'||!parent.DContactPolicy.canPublic(c.scope.id,'add'))return null;var found=parent.DContactPolicy.aiCalls(c.scope.id).filter(function(r){return String(r.sessionId)===String(item.sessionId)&&r.platform===item.platform&&r.phone===item.phone;});return found.length===1?{tenantId:c.scope.id,phone:item.phone,sourceType:'ai',sourceCallId:String(item.sessionId),platform:item.platform}:null;}catch(_){return null;}}
    function confirmRefusal(index){var source=refusalSource(rows[index]);if(!source)return showToast('当前来源通话或确认权限已变化，请重新核对','warning');return parent.DContacts.openAIRefusal(source);}
    function refusalLink(item,index){return refusalSource(item)?'<button class="record-detail-link" type="button" onclick="window.Pages[\\\'result-records\\\'].confirmRefusal('+index+')">确认拒联</button>':'';}
"""
            code=code.replace('  function renderRow(item, index, realIndex) {',helper+'  function renderRow(item, index, realIndex) {',1)
            code=code.replace('>详情</a></td>\' +','>详情</a>\' + refusalLink(item,realIndex) + \'</td>\' +',1)
            code=code.replace(marker,marker+'\n    confirmRefusal:confirmRefusal,',1)

        if kind=='ai' and path=='js/pages/scene-list.js':
            start=code.index('  function removeAssigned(phone) {')
            end=code.index('  var SubTabConfig',start)
            code=code[:start]+"""  function removeAssigned(id) {
    var c=parent.DSession.context(),owner=DNativeContext.context;
    if(!c||c.account.id!==owner.account.id||c.scope.id!==owner.scope.id||c.scope.kind!=='tenant'||parent.DApp.currentPage()!=='PAGE-2103'||!parent.DSession.canWrite('PAGE-2103'))return false;
    var proof=window.DAIConfigStore.reviewCurrent();if(!proof.ok){showToast(proof.reason,'warning');return false;}
    var task=currentDetailItem?.id, row=window.DAIAssignmentIdentity.locate(window.MockAssignedData,c.scope.id,task,id);
    if(!row){showToast('名单已变化或已移除，请重新核对','warning');return false;}
    if(!confirm('移除本任务中的这一条号码 '+row.phone+'？移除后无恢复入口，导入历史保留。'))return false;
    var again=window.DAIConfigStore.reviewCurrent(),active=parent.DSession.context();
    if(parent.DApp.currentPage()!=='PAGE-2103'||!again.ok||again.revision!==proof.revision||active?.account.id!==c.account.id||active?.scope.id!==c.scope.id||currentDetailItem?.id!==task||!parent.DSession.canWrite('PAGE-2103')||window.DAIAssignmentIdentity.locate(window.MockAssignedData,c.scope.id,task,id)!==row){showToast('名单或权限已变化，本次未移除','warning');return false;}
    row.removedAt=new Date().toISOString();row.removedBy=c.account.id;
    if(!window.DAIConfigStore.saveImport())return false;
    var container=document.getElementById('sceneSubContent');if(container)container.innerHTML=renderSubContent('已分配');
    showToast('该条号码已移除，导入历史保留','info');return true;
  }

"""+code[end:]
            code=code.replace('return window.MockAssignedData[currentDetailItem.id] || [];',"return (window.MockAssignedData[currentDetailItem.id] || []).filter(function(r){return !r.removedAt;});",1)
            old="+ r.phone + '\\')\">移除"
            assert code.count(old)==1
            code=code.replace(old,"+ r.assignmentId + '\\')\">移除",1)
            old='    results.success.forEach(function (phone) {'
            assert code.count(old)==1
            code=code.replace(old,"    var importToken=crypto.randomUUID(), importedIndex=0;\n"+old,1)
            old='        phone: phone.slice(0, 3)'
            assert code.count(old)==1
            code=code.replace(old,"        assignmentId:'AIROW-'+importToken+'-'+(importedIndex++), assignmentTenant:parent.DSession.context().scope.id, assignmentTask:String(sceneId), assignmentOrigin:'import', rawPhone:phone,\n"+old,1)
            old="      op: '超管'"
            assert code.count(old)==1
            code=code.replace(old,"      op: parent.DSession.context().account.name",1)
            old='    results.validNumberCount = results.success.length;'
            code=code.replace(old,"    window.MockAssignedData[sceneId].forEach(function(r){if(r.assignmentId.indexOf('AIROW-'+importToken+'-')===0)r.importBatchId=batchId;});\n"+old,1)
            reset_source=r"resetFilter(this.closest(\'.scene-list-page\'))"
            assert code.count(reset_source)==1
            code=code.replace(reset_source,r"window.Pages[\'scene-list\'].integrationResetFilters()",1)
            code=code.replace('  var intentLevelsState = {};','  var intentLevelsState = JSON.parse(JSON.stringify(window.DPersistedIntentLevels||{})), intentDraftBase = null;',1)
            # Viewing task overview must not materialize a configuration draft.
            old="""    if (!intentLevelsState[key]) {
      var profile = getIntentProfile();
      intentLevelsState[key] = (profile.levels || []).map(function (l) { return { label: l.label, tags: l.tags.slice() }; });
    }
    return intentLevelsState[key];"""
            assert code.count(old)==1
            code=code.replace(old,"""    if (intentLevelsState[key]) return intentLevelsState[key];
    var profile = getIntentProfile();
    return (profile.levels || []).map(function (l) { return { label: l.label, tags: l.tags.slice() }; });""",1)
            code=code.replace('  function showIntentConfig() {','  function showIntentConfig() {\n    if(document.getElementById("intentConfigBackdrop"))return;\n    intentDraftBase=JSON.parse(JSON.stringify(intentLevelsState));var intentKey=getOverviewProfileKey();if(!intentLevelsState[intentKey])intentLevelsState[intentKey]=getCurrentIntentLevels();',1)
            code=code.replace('  function toggleIntentOption(levelIndex, tagValue, el, e) {', "  function toggleIntentOption(levelIndex, tagValue, el, e) {\n    if(window.DAIConfigStore?.guard().isDirty()){window.DAIConfigStore.banner();showToast('请先核对本次保存结果，再继续修改','warning');return;}",1)
            start=code.index('  function closeIntentConfig(e) {')
            end=code.index('  /* 保存配置后',start)
            code=code[:start]+'''  function closeIntentConfig(e) {
    if(e&&e.target!==e.currentTarget)return;
    var backdrop=document.getElementById('intentConfigBackdrop');if(!backdrop)return true;
    try{var outcome=window.DAIConfigStore?.cancelIntentSave();
      if(outcome!=='saved'&&intentDraftBase)intentLevelsState=JSON.parse(JSON.stringify(intentDraftBase));
      if(outcome==='saved')showToast('已核对：此前保存已生效','info');
    }catch(error){showToast(error.message,'warning');return false;}
    intentDraftBase=null;backdrop.remove();document.body.style.overflow='';document.removeEventListener('click',closeIntentDropdownOutside);updateIntentCardTitles();return true;
  }
  function saveIntentConfig() {
    if(!window.DAIConfigStore?.saveIntent())return false;
    intentDraftBase=null;closeIntentConfig();updateIntentCardTitles();showToast('保存成功','success');return true;
  }
  function integrationIntentGuard(){return {
    isDirty:function(){return intentDraftBase!==null&&(JSON.stringify(intentDraftBase)!==JSON.stringify(intentLevelsState)||window.DAIConfigStore?.guard().isDirty());},
    save:saveIntentConfig,
    discard:function(){if(closeIntentConfig()===false)throw Error('本次保存结果仍待核对，当前内容已保留。');}
  };}

'''+code[end:]
            marker="window.Pages['scene-list'] = {"
            code=code.replace(marker,marker+"\n    integrationIntents:function(){return JSON.parse(JSON.stringify(intentLevelsState));},restoreIntegrationIntents:function(data){intentLevelsState=JSON.parse(JSON.stringify(data||{}));},integrationIntentGuard:integrationIntentGuard,",1)
            old="    var sceneId = currentDetailItem.id;"
            assert old in code
            code=code.replace(old,old+"\n    var uploadOwner=parent.DSession.context();",1)
            old="    processUploadFile(pendingUploadFile, function (results) {"
            assert old in code
            code=code.replace(old,old+"\n      var active=parent.DSession.context();if(!active||active.account.id!==uploadOwner?.account.id||active.scope.id!==uploadOwner?.scope.id||currentDetailItem?.id!==sceneId){showToast('上传目标或使用范围已变化，本次未提交','warning');return;}\n      if(active.scope.kind!=='tenant'||!parent.DSession.canWrite('PAGE-2103')){showToast('当前无本租户AI名单提交资格','warning');return;}\n      if(typeof parent.DModuleHost?.prepareContactCoordination!=='function')throw Error('共享联系检查尚未就绪，请稍后重试');\n      await parent.DModuleHost.prepareContactCoordination(active.scope.id);\n      if(!dAIUploadCurrent(token))return;\n      active=parent.DSession.context();\n      results.success=results.success.filter(function(phone){var checked=parent.DContactPolicy.check(active.scope.id,phone,'AI');if(!checked.allowed)results.fail.push({phone:phone,reason:checked.message});return checked.allowed;});\n      if(!results.success.length){if(btn){btn.disabled=false;btn.textContent='开始上传';}showToast('本次无可提交号码：'+results.fail.length+'条未通过校验，未提交外呼。请处理号码限制或输入错误后重试。','warning');return;}",1)
            code=code.replace('      applyImportResults(sceneId, results, fileName);','      applyImportResults(sceneId, results, fileName);\n      if(!window.DAIConfigStore?.saveImport())return;',1)
        if kind=='cloud' and path=='js/components/dcc-records.js':
            old="if(await written.text()!==bytes)throw Error('文件回读未通过，异常明细保留。');"
            assert code.count(old)==1
            code=code.replace(old,"const expectedBytes=new TextEncoder().encode(bytes),actualBytes=new Uint8Array(await written.arrayBuffer());if(actualBytes.length!==expectedBytes.length||actualBytes.some((value,index)=>value!==expectedBytes[index]))throw Error('文件回读未通过，异常明细保留。');",1)
            old="row.customerAnswered===true&&row.shortHangupState==='not_short'&&row.shortHangup===false ? '已接通' : '结果待确认'"
            assert code.count(old)==1
            code=code.replace(old,"row.customerAnswered===true ? (row.shortHangupState==='not_short'&&row.shortHangup===false?'已接通':'已接通 · 秒挂待核') : '结果待确认'",1)
            old="status==='已接通'||status==='秒挂'"
            assert code.count(old)==1
            code=code.replace(old,"status==='已接通'||status==='已接通 · 秒挂待核'||status==='秒挂'",1)
            marker='  function renderFailureRetries(task,data) {'
            assert code.count(marker)==1
            helper='''  // Explicitly approved local record; original Runtime owns failure and quota rules.
  function dBoundedRetryScope(taskId){const proof=parent.DSeed.boundedRetryRecordFixture,c=DNativeContext.context,active=parent.DSession.context();return !!proof&&taskId===proof.taskId&&c.account.id===proof.accountId&&c.scope.id===proof.tenantId&&active?.account.id===proof.accountId&&active?.scope.id===proof.tenantId&&DNativeContext.storagePrefix===parent.DSession.prefix+proof.storageSuffix;}
  function dBoundedRetryRecords(taskId){if(!dBoundedRetryScope(taskId))return [];const proof=parent.DSeed.boundedRetryRecordFixture,view=runtime().taskRecords(taskId);if(!view?.ok)return [];const all=view.data.records||[],rows=all.filter(r=>r.phone===proof.phone&&r.leadCode===proof.leadCode&&r.recordId&&!r.reviewReason&&r.importState==='accepted'&&r.submissionState==='submitted'&&r.supplierFileId&&r.supplierDeleted!==true&&!['pending','unknown','succeeded'].includes(r.deletionState));return rows.length===1&&all.filter(r=>r.recordId===rows[0].recordId).length===1?rows:[];}
  function dBoundedRetryPicker(task){if(!dBoundedRetryScope(task.taskId))return '';return '<label for="dccBoundedRetryRecord">本任务合成客户</label><select id="dccBoundedRetryRecord"><option value="">请选择已批准的客户</option>'+dBoundedRetryRecords(task.taskId).map(r=>'<option value="'+esc(r.recordId)+'">'+esc(r.phone+' · '+r.leadCode+' · '+recordBatch(r))+'</option>').join('')+'</select>';}
'''
            code=code.replace(marker,helper+marker,1)
            old='<label for="dccRetryFailureReason">失败原因样例</label>'
            assert code.count(old)==1
            code=code.replace(old,'${dBoundedRetryPicker(task)}'+old,1)
            old="  function receiveRetryFailureDemo(taskId) {const reason=document.getElementById('dccRetryFailureReason')?.value;return failureOperation(taskId,'retry-failure','合成失败结果',()=>runtime().simulateFailureRetryFailure({taskId,reason}),'准确失败已保存。自动类从本次确认时间等待 2 分钟，人工类请处理当前记录。');}"
            assert code.count(old)==1
            new="""  function receiveRetryFailureDemo(taskId) {const reason=document.getElementById('dccRetryFailureReason')?.value,bounded=taskId===parent.DSeed.boundedRetryRecordFixture?.taskId,recordId=bounded?document.getElementById('dccBoundedRetryRecord')?.value:'';if(bounded&&(!dBoundedRetryScope(taskId)||!dBoundedRetryRecords(taskId).some(r=>r.recordId===recordId))){window.showToast?.('请明确选择本任务已批准的合成客户；未接收结果','warning');return false;}return failureOperation(taskId,'retry-failure','合成失败结果',()=>{if(bounded&&(!dBoundedRetryScope(taskId)||!dBoundedRetryRecords(taskId).some(r=>r.recordId===recordId)))return {ok:false,reason:'客户或授权范围已变化，未接收结果。'};return runtime().simulateFailureRetryFailure({taskId,reason,...(bounded?{recordId}:{})});},'准确失败已保存。自动类从本次确认时间等待 2 分钟，人工类请处理当前记录。');}"""
            code=code.replace(old,new,1)
        if kind=='cloud' and path=='js/pages/cloud-task-workspace.js':
            old='      <div class="task-center-body">${centerBody(row, context.tab)}</div>'
            assert old in code
            code=code.replace(old,"      ${context.tab==='overview'&&DNativeContext.context.account.id===parent.DSeed.boundedWorkflowFixture?.accountId&&DNativeContext.storagePrefix===parent.DSession.prefix+parent.DSeed.boundedWorkflowFixture.storageSuffix&&window.ScenarioDemoData?.tasks.some(t=>t.taskId===row.taskId)?window.ScenarioDemo.panel(row):''}\n"+old,1)
            start=code.index('  function centerCustomers(row)')
            end=code.index('  function exportTaskCustomers(taskId)',start)
            block=code[start:end]
            button='<button class="btn" onclick="CloudTaskWorkspace.exportTaskCustomers(\'${esc(row.taskId)}\')">导出当前结果</button>'
            assert block.count(button)==1
            block=block.replace(button,'').replace('${customerImportButton(row)}',"${assigned.length?`"+button+"`:''}${customerImportButton(row)}",1)
            code=code[:start]+block+code[end:]
            marker='  window.CloudTaskWorkspace = {'
            assert marker in code
            position='''  function captureIntegratedPosition(){const route=RouteRuntime.snapshot();if(route?.key!=='cloud-task-center')return null;const context=readCenterContext(route.options),row=taskById(context.taskId);return row&&canAccessObject(row)?{taskId:row.taskId,tab:context.tab}:null;}
  function restoreIntegratedPosition(position){if(!position||typeof position.taskId!=='string')return false;const row=taskById(position.taskId),page=parent.DApp.currentPage(),expected={'PAGE-2205':'预外呼','PAGE-2206':'IVR 外呼'}[page];if(!expected||!parent.DSession.allowed(page)||!row||row.callType!==expected||!canAccessObject(row))return false;return openTask(row.taskId,centerTabs.some(x=>x.key===position.tab)?position.tab:'overview');}
'''
            code=code.replace(marker,position+marker+'captureIntegratedPosition,restoreIntegratedPosition,',1)
        if kind=='cloud' and path=='js/pages/agent-workbench.js':
            # Read the exact live call before permission projection can clear an active call.
            old='  window.AgentWorkbench = { telephoneStatus:'
            assert code.count(old)==1
            code=code.replace(old,'  window.AgentWorkbench = { authorizationSnapshot:()=>({phase,call:call?structuredClone(call):null}), telephoneStatus:',1)
            old='    return \'<section class="platform-page seat-workspace seat-home workbench-page" id="native-seat-workspace">\''
            assert old in code
            code=code.replace(old,"    if(workspaceTab==='outbound'&&(DNativeContext.context.account.id===parent.DSeed.boundedTelephoneFixture?.supervisor.accountId||(DNativeContext.context.account.id===parent.DSeed.boundedWorkflowFixture?.accountId&&DNativeContext.storagePrefix===parent.DSession.prefix+parent.DSeed.boundedWorkflowFixture.storageSuffix)))content+=(window.ScenarioDemo?.receivingTools?.()||'');\n"+old,1)
            old="    if ((data.nativeWorkbench.blockedNumbers || []).some"
            assert old in code
            code=code.replace(old,"    const contactPolicy=parent.DContactPolicy.check(c.tenant.tenantId,phone,'MANUAL');if(!contactPolicy.allowed)return fail(contactPolicy.message,'seat-phone');\n"+old,1)
            code=code.replace("r.agentDisposition === '客户拒绝联系'", "r.agentDisposition === '客户拒绝联系' && !r.publicRefusalEvent")
            old="    next.agentDisposition = disposition; next.dispositionRemark = remark.trim(); next.processingStatus = '已完成';"
            assert old in code
            code=code.replace(old,"    if(call.publicRefusalDraft===true&&!next.publicRefusalEvent)next.publicRefusalEvent={schema:1,origin:'human-aftercall',committed:true,callId:next.callId,tenantId:next.tenantId,phone:customerPhone(next),operatorId:AppState.account().accountId,at:new Date().toISOString()};delete next.publicRefusalDraft;\n"+old,1)
            old='  function setDisposition(value) {'
            assert old in code
            code=code.replace(old,'  function setRefusalConfirmation(value){if(!canEditRecord())return;call.publicRefusalDraft=value===true;persist();}\n'+old,1)
            old='    reconcileCompletionCallbacks, persistBusinessForm,'
            assert old in code
            code=code.replace(old,'    setRefusalConfirmation, reconcileCompletionCallbacks, persistBusinessForm,',1)
            old='      \'<details class="phone-record-more" open>'
            assert old in code
            confirmation='      \'<label class="checkbox-row"><input id="seat-refusal-confirmed" type="checkbox" \' + (call.publicRefusalDraft===true?\'checked\':\'\') + \' onchange="AgentWorkbench.setRefusalConfirmation(this.checked)">客户明确拒绝后续联系</label><p class="field-hint">勾选并成功保存后，在本租户黑名单中保留客户拒联来源；正常呼入仍可接听。</p>\'+\n'
            code=code.replace(old,confirmation+old,1)
            old="merged.set(row.callId, { ...completed, processingStatus: '待填写', agentDisposition: '', dispositionRemark: '', dispositionAt: '',"
            assert old in code
            code=code.replace(old,"merged.set(row.callId, { ...completed, ...(completed.publicRefusalEvent?{publicRefusalEvent:merged.get(row.callId)?.publicRefusalEvent?.committed?merged.get(row.callId).publicRefusalEvent:{...completed.publicRefusalEvent,committed:false}}:{}), processingStatus: '待填写', agentDisposition: '', dispositionRemark: '', dispositionAt: '',",1)
        if kind=='cloud' and path=='js/pages/cloud-call-records.js':
            old="['坐席处理结果',CustomerDirectory.dispositionLabel(call)||'未填写']"
            assert old in code
            code=code.replace(old,old+",...(call.publicRefusalEvent?.committed===true?[['客户拒联确认','已随话后记录保存']]:[])",1)
        if kind=='cloud' and path=='js/components/alicti-task-control.js':
            old="    if(action==='start'||action==='resume'){"
            assert old in code
            code=code.replace(old,old+"\n      const restriction=root.DNativeContact?.checkTask(row,predictive(row)?'PREDICTIVE':'IVR');if(!restriction?.allowed)return restriction?.message||'联系限制尚未核对，未提交本次操作';",1)
            old="    if(!action)return unchanged('no-transition');"
            assert old in code
            code=code.replace(old,old+"\n    if(action==='resume'){const restriction=root.DNativeContact?.checkTask(row,'PREDICTIVE');if(!restriction?.allowed)return unchanged(restriction?.message||'联系限制待核对');}",1)
        if kind=='cloud' and path=='js/components/dcc-runtime.js':
            marker='  function syncWorkbenchCall(call) {'
            assert code.count(marker)==1
            helper='''  // Complete only missing customer-leg seconds from the same synchronized local CDR.
  // Answer/hangup/short-call rules and all execution state remain owned by the original model.
  function enrichWorkbenchCdr(entry,record,call){
    if(parent.DSession.context()?.scope.grant?.moduleRoles?.cloud==='reader'||window.HistorySnapshot?.read_only===true||window.DBusinessRegulation?.current())return false;
    const raw=call.alictiCdr?.raw,seconds=raw?.customerBridgeDuration;
    if(call.callSource!=='NATIVE_WORKBENCH'||call.simulation!==true||call.workbenchKind!=='predictive'||call.callType!=='预外呼'||call.taskId!==entry.task.taskId||call.dataSync?.status!=='synced'||call.alictiCdr?.mock!==true||!raw||!Number.isFinite(seconds)||seconds<0)return false;
    if(!call.contactId||raw.mainUniqueId!==call.contactId||String(raw.enterpriseId)!==String(entry.task.enterpriseId)||raw.customerNumber!==record.phone||String(raw.cno)!==String(call.cno)||!Number.isFinite(call.endedMs)||raw.endTime!==Math.floor(call.endedMs/1000))return false;
    const matches=(entry.actualResults||[]).filter(r=>r.nativeWorkbenchCallId===call.callId);
    if(matches.length!==1)return false;
    const result=matches[0],v=result.values;
    if(result.kind!=='call'||result.associationState!=='confirmed'||result.callID!==call.callId||result.tenantId!==entry.task.tenantId||result.enterpriseId!==entry.task.enterpriseId||result.taskId!==entry.task.taskId||result.supplierTaskId!==entry.task.supplierTaskId||result.recordId!==record.recordId||result.batchId!==record.batchId||result.supplierFileId!==record.supplierFileId||result.phone!==record.phone||result.leadCode!==record.leadCode||result.reviewReasons?.length||!Array.isArray(result.evidence)||!Number.isSafeInteger(result.version)||result.version<1||result.version>=Number.MAX_SAFE_INTEGER||!v||v.evidenceTrusted!==true)return false;
    if(v.callID!==call.callId||v.recordId!==record.recordId||v.taskId!==entry.task.supplierTaskId||v.batchId!==record.batchId||v.fileId!==record.supplierFileId||v.phone!==record.phone||v.leadCode!==record.leadCode||String(v.enterpriseId)!==String(entry.task.enterpriseId))return false;
    if(v.customerBridgeDuration!=null||result.customerBridgeDuration!=null||v.durationIsTrusted===true||result.durationIsTrusted===true)return false;
    const values={...v,customerBridgeDuration:seconds,durationIsTrusted:true};
    const receipt={source:'同一通话已同步客户时长（本地演示）',receivedAt:new Date().toISOString(),fingerprint:stable({callId:call.callId,raw}),raw:clone(raw),syncRevision:call.dataSync.revision||''};
    result.values=values;Object.assign(result,deriveCallResult(values));result.version=(Number(result.version)||1)+1;result.evidence.push(receipt);return true;
  }
'''
            code=code.replace(marker,helper+marker,1)
            start=code.index(marker);end=code.index('  function exactApiCall(input)',start)
            block=code[start:end]
            old='    return writeLedger(next);'
            assert block.count(old)==1
            block=block.replace(old,'    enrichWorkbenchCdr(entry,record,call);\n'+old,1)
            code=code[:start]+block+code[end:]
            old='const next = clone(ledger), entry = next.tasks[taskId], ordered = pendingFor(entry), submitted = [];'
            assert old in code
            code=code.replace(old,old+"\n    for(const record of ordered){const restricted=parent.DContactPolicy.check(entry.task.tenantId,record.phone,found.data.current.callType==='IVR 外呼'?'IVR':'PREDICTIVE');if(!restricted.allowed)return failure('CONTACT_RESTRICTED',restricted.message);}",1)
            old='function retryPlanBlock(entry,current,plan,record,clock) {'
            assert old in code
            code=code.replace(old,old+"\n    const restricted=parent.DContactPolicy.check(entry.task.tenantId,record.phone,current.callType==='IVR 外呼'?'IVR':'PREDICTIVE');if(!restricted.allowed)return restricted.message;",1)
            old="const original=entry.records.find(record=>record.recordId===input.recordId);if(!original)return failure('UNKNOWN_LINEAGE_RECORD','请选择准确的线索记录。');"
            assert old in code
            code=code.replace(old,old+"\n    const restricted=parent.DContactPolicy.check(entry.task.tenantId,original.phone,found.data.current.callType==='IVR 外呼'?'IVR':'PREDICTIVE');if(!restricted.allowed)return failure('CONTACT_RESTRICTED',restricted.message);",1)
        if kind=='cloud' and path=='js/components/repeat-predictive.js':
            old='const tel=phone(source.phone),where={tenantId:source.tenantId,enterpriseId:source.enterpriseId};'
            assert old in code
            code=code.replace(old,old+"\n    const restricted=parent.DContactPolicy.check(where.tenantId,tel,'PREDICTIVE');if(!restricted.allowed)return restricted.message;",1)
            code=code.replace("c.agentDisposition==='客户拒绝联系'", "c.agentDisposition==='客户拒绝联系'&&!c.publicRefusalEvent")
        if kind=='ai' and path=='js/pages/sys-scene.js':
            code=code.replace("var data = Object.assign({}, row, { tenants: row.tenant ? [row.tenant] : [] });", "var data = Object.assign({}, row, { tenants: Array.isArray(row.tenants)?row.tenants.slice():(row.tenant?row.tenant.split('、'):[]) });",1)
            form_helpers='''  function dCollectCommonSceneForm(row){
    var radioNames={'一知科技':'modelType','中科金智能':'zkjModelType','电声':'dsModelType','厚朴':'hpModelType','大众通信':'dzModelType'},modelName=radioNames[row.platform];
    var selected=modelName?document.querySelector('input[name="'+modelName+'"]:checked'):null;
    if(modelName)row.modelType=selected?selected.value:'';
    var importName=row.platform==='冰兰'?'binglanImportType':'importType',importRadio=document.querySelector('input[name="'+importName+'"]:checked');
    row.importType=importRadio?importRadio.value:'';row.tenants=getCheckedValues('#tenantCheckboxGroup input[type="checkbox"]:checked');
    row.customInputFields=JSON.parse(JSON.stringify(customInputFields));row.customExtractFields=JSON.parse(JSON.stringify(customExtractFields));
    var accountId={'一知科技':'yizhiAccountSelect','电声':'dsAccountSelect'}[row.platform];if(accountId)row.localAccountSelection=getTrimmedValue(accountId);
  }
  function dRestoreCommonSceneForm(data){
    var names={'一知科技':'modelType','中科金智能':'zkjModelType','电声':'dsModelType','厚朴':'hpModelType','大众通信':'dzModelType'},name=names[data.platform];
    if(name)document.querySelectorAll('input[name="'+name+'"]').forEach(function(input){input.checked=input.value===data.modelType;});
    var importName=data.platform==='冰兰'?'binglanImportType':'importType';document.querySelectorAll('input[name="'+importName+'"]').forEach(function(input){input.checked=input.value===data.importType;});
    if(data.platform==='一知科技')onModelTypeChange();else if(data.platform==='中科金智能')onZkjModelTypeChange();else if(data.platform==='电声')onDsModelTypeChange();else if(data.platform==='大众通信')onDzModelTypeChange();
    var accountId={'一知科技':'yizhiAccountSelect','电声':'dsAccountSelect'}[data.platform],account=accountId?document.getElementById(accountId):null;if(account&&data.localAccountSelection)account.value=data.localAccountSelection;
    if(Array.isArray(data.customInputFields))customInputFields=JSON.parse(JSON.stringify(data.customInputFields));
    if(Array.isArray(data.customExtractFields))customExtractFields=JSON.parse(JSON.stringify(data.customExtractFields));
    refreshInputTable();refreshExtractTable();
  }
'''
            code=code.replace('  function collectFormSceneRow() {',form_helpers+'\n  function collectFormSceneRow() {',1)
            code=code.replace('    return row;\n  }\n\n  function validateDrawerForm()', '    dCollectCommonSceneForm(row);\n    return row;\n  }\n\n  function validateDrawerForm()',1)
            code=code.replace('    applyDazhongEditPrefill(data);','    applyDazhongEditPrefill(data);\n    dRestoreCommonSceneForm(data);',1)
            helper='''  var dSceneFilters={name:'',category:'',platform:''};
  function dFilteredSceneRows(){return SceneRows.filter(function(row){return (!dSceneFilters.name||String(row.name||'').includes(dSceneFilters.name))&&(!dSceneFilters.category||row.category===dSceneFilters.category)&&(!dSceneFilters.platform||row.platform===dSceneFilters.platform);});}
  function dQueryScenes(){var bar=document.querySelector('.scene-list-page .filter-bar');if(!bar)return;var values=bar.querySelectorAll('input,select');dSceneFilters={name:values[0].value.trim(),category:values[1].value,platform:values[2].value};refreshSceneTable();showToast('已按当前条件查询','info');}
  function dResetScenes(){var bar=document.querySelector('.scene-list-page .filter-bar');if(!bar)return;bar.querySelectorAll('input,select').forEach(function(input){input.value='';});dQueryScenes();}
'''
            code=code.replace('  /* ===== 列表渲染 ===== */',helper+'\n  /* ===== 列表渲染 ===== */',1)
            code=code.replace('    return SceneRows.map(function (row) {','    return dFilteredSceneRows().map(function (row) {',1)
            code=code.replace('    tbody.innerHTML = renderSceneRowsHtml();', '    tbody.innerHTML = renderSceneRowsHtml()||\'<tr><td colspan="9" style="text-align:center;padding:28px">暂无符合条件的场景</td></tr>\';',1)
            code=code.replace('onclick="doQuery()"',r'onclick="window.Pages[\'sys-scene\'].doQuery()"',1)
            code=code.replace(r"resetFilter(this.closest(\'.scene-list-page\'))",r"window.Pages[\'sys-scene\'].resetFilters()",1)
            marker="window.Pages['sys-scene'] = {"
            assert marker in code
            code=code.replace(marker,marker+"\n    doQuery:dQueryScenes,resetFilters:dResetScenes,integrationState:function(){return SceneRows;},restoreIntegrationState:function(rows){SceneRows=rows;},integrationRows: function(){return SceneRows.map(function(row){return {id:row.id,sceneId:row.sceneId,code:row.code,name:row.name,platform:row.platform};});},",1)
        if kind=='ai' and path=='js/pages/sys-tags.js':
            scene_delete_before="  function deleteScene(sceneId) {\n    // 检查是否被配置引用\n    var usedIn = [];\n    Object.keys(MockTagConfigs).forEach(function(key) {\n      if (key.indexOf('_' + sceneId) === key.length - sceneId.length - 1 || key.indexOf('_' + sceneId) > 0) {\n        if (key.split('_').pop() === sceneId) usedIn.push(key);\n      }\n    });\n    if (usedIn.length > 0) {\n      showToast('该场景下有 ' + usedIn.length + ' 个配置，请先清空配置后再删除', 'error');\n      return;\n    }\n    showConfirmModal('删除场景', '确认删除该场景？此操作不可恢复。', function(confirmed) {\n      if (!confirmed) return;\n      MockTagScenes = MockTagScenes.filter(function(s) { return s.id !== sceneId; });\n      refreshSceneModalBody();\n      refreshTreePanel();\n      // 如果当前选中的是这个场景，清空右侧面板\n      if (currentScene === sceneId) {\n        resetContentPanel();\n      }\n      showToast('场景已删除', 'success');\n    });\n  }\n\n"
            scene_delete_after="  // Review only current, uniquely decoded professional configuration; never repair or clear it.\n  function dSceneDeleteReview(sceneId) {\n    const reject=(reason,code='UNVERIFIED')=>({ok:false,code,reason,refs:[],fingerprint:''});\n    const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value)&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);\n    const stable=value=>JSON.stringify(value,(_,item)=>object(item)?Object.fromEntries(Object.keys(item).sort().map(key=>[key,item[key]])):item);\n    const id=value=>typeof value==='string'&&value.length>0&&value.trim()===value;\n    try {\n      const session=window.parent.DSession,owner=window.DNativeContext?.context,current=session?.context?.(),page=window.parent.DApp?.currentPage?.();\n      if(!owner||!current||owner.account.id!==current.account.id||owner.scope.id!==current.scope.id||owner.scope.kind!==current.scope.kind||page!=='PAGE-2111'||session.allowed('PAGE-2111')!==true||session.canWrite('PAGE-2111')!==true)return reject('当前账号或场景配置权限已变化，请重新打开。','FORBIDDEN');\n      const store=window.DAIConfigStore,expectedKey=session.prefix+'ai-config:'+owner.scope.kind+':'+owner.scope.id;\n      if(store?.key!==expectedKey||typeof store.reviewCurrent!=='function')return reject('配置当前版本无法核验，请保留原配置。');\n      const persisted=store.reviewCurrent();\n      if(persisted?.ok!==true||!Number.isSafeInteger(persisted.revision)||persisted.revision<0||persisted.revision>=Number.MAX_SAFE_INTEGER)return reject(persisted?.reason||'配置有未核结果，请先核对。');\n      const directory=(rows,label,keys)=>{\n        if(!Array.isArray(rows))throw Error(label+'目录待核');\n        const result=new Map();\n        rows.forEach(row=>{if(!object(row)||!id(row.id)||typeof row.name!=='string'||!row.name.trim()||Object.keys(row).some(key=>!keys.includes(key))||result.has(row.id)||keys.includes('localCode')&&(!id(row.localCode)||!['enabled','disabled'].includes(row.status)))throw Error(label+'目录待核');result.set(row.id,row);});\n        return result;\n      };\n      const suppliers=directory(MockTagSuppliers,'供应商',['id','localCode','name','status']),types=directory(MockTenantTypes,'租户类型',['id','name']),scenes=directory(MockTagScenes,'场景',['id','localCode','name','status']);\n      if(!types.size||!id(sceneId)||!scenes.has(sceneId))return reject('场景或租户类型目录无法准确核验。');\n      const triples=new Map(),pairs=new Map(),put=(map,key,value)=>{if(map.has(key))throw Error('目录组合编码存在歧义');map.set(key,value);};\n      for(const tenantType of types.keys())for(const categoryId of scenes.keys()) {\n        put(pairs,tenantType+'_'+categoryId,{tenantType,sceneId:categoryId});\n        for(const supplierId of suppliers.keys())put(triples,getConfigKey(supplierId,tenantType,categoryId),{supplierId,tenantType,sceneId:categoryId});\n      }\n      if(!object(MockTagConfigs)||!object(MockLocalTagSets)||!object(MockSupplierLocalTagMappings)||!object(MockSupplierTagPool))return reject('专业配置资料结构待核，不能删除场景。');\n      const pools=new Map(),locals=new Map(),refs=[];\n      const tagSet=(rows,supplier)=>{\n        if(!Array.isArray(rows))throw Error('标签目录待核');const tags=new Map();\n        rows.forEach(tag=>{if(!object(tag)||!id(tag.id)||typeof tag.name!=='string'||!tag.name.trim()||!Number.isFinite(tag.sort)||tag.sort<1||!id(tag.localCode)||supplier&&Object.hasOwn(tag,'platformTagId')&&tag.platformTagId!==null&&typeof tag.platformTagId!=='string'&&!(typeof tag.platformTagId==='number'&&Number.isFinite(tag.platformTagId))||Object.keys(tag).some(key=>!(supplier?['id','localCode','name','sort','platformTagId']:['id','localCode','name','sort']).includes(key))||tags.has(tag.id))throw Error('标签目录待核');tags.set(tag.id,tag);});return tags;\n      };\n      for(const key of Object.keys(MockSupplierTagPool)) {if(!suppliers.has(key))return reject('存在无法关联供应商的标签资料。');pools.set(key,tagSet(MockSupplierTagPool[key],true));}\n      for(const key of Object.keys(MockLocalTagSets)) {const where=pairs.get(key);if(!where)return reject('存在无法准确关联场景的本地标签资料。');const tags=tagSet(MockLocalTagSets[key],false);locals.set(key,tags);if(where.sceneId===sceneId&&tags.size)refs.push({kind:'local-tags',key,count:tags.size});}\n      for(const key of Object.keys(MockTagConfigs)) {\n        const where=triples.get(key),config=MockTagConfigs[key];\n        if(!where||!object(config)||Object.keys(config).some(name=>name!=='enabledTagIds')||!Array.isArray(config.enabledTagIds)||config.enabledTagIds.some(tag=>!id(tag))||new Set(config.enabledTagIds).size!==config.enabledTagIds.length||config.enabledTagIds.some(tag=>!pools.get(where.supplierId)?.has(tag)))return reject('存在未知、损坏或无法准确关联的供应商配置。');\n        // Preserve original semantics: an existing configuration is a reference even when all tags are disabled.\n        if(where.sceneId===sceneId)refs.push({kind:'supplier-config',key,count:1});\n      }\n      for(const key of Object.keys(MockSupplierLocalTagMappings)) {\n        const where=triples.get(key),mapping=MockSupplierLocalTagMappings[key];\n        if(!where||!object(mapping))return reject('存在无法准确关联的供应商标签映射。');\n        for(const [tag,local] of Object.entries(mapping))if(!id(tag)||!id(local)||!pools.get(where.supplierId)?.has(tag)||!locals.get(where.tenantType+'_'+where.sceneId)?.has(local))return reject('供应商与本地标签映射资料待核。');\n        if(where.sceneId===sceneId&&Object.keys(mapping).length)refs.push({kind:'supplier-mapping',key,count:Object.keys(mapping).length});\n      }\n      const fingerprint=stable({accountId:current.account.id,scopeId:current.scope.id,scopeKind:current.scope.kind,revision:persisted.revision,sceneId,suppliers:MockTagSuppliers,types:MockTenantTypes,scenes:MockTagScenes,pools:MockSupplierTagPool,configs:MockTagConfigs,locals:MockLocalTagSets,mappings:MockSupplierLocalTagMappings});\n      return refs.length?{ok:false,code:'REFERENCED',reason:'该场景仍有 '+refs.length+' 处专业配置或标签引用，不能删除。',refs,fingerprint}:{ok:true,code:'UNUSED',reason:'当前未发现此场景的专业配置引用。',refs:[],fingerprint};\n    } catch(_) {return reject('配置目录、引用或读取结果待核，请保留原资料。');}\n  }\n  function deleteScene(sceneId) {\n    const inspected=dSceneDeleteReview(sceneId);\n    if(!inspected.ok){showToast(inspected.reason,'warning');return;}\n    showConfirmModal('删除场景','确认删除该场景？此操作不可恢复。',function(confirmed){\n      if(!confirmed)return;\n      const fresh=dSceneDeleteReview(sceneId);\n      if(!fresh.ok){showToast(fresh.reason,'warning');return;}\n      if(fresh.fingerprint!==inspected.fingerprint){showToast('场景或引用配置已变化，请重新核对后确认。','warning');return;}\n      MockTagScenes=MockTagScenes.filter(function(scene){return scene.id!==sceneId;});\n      refreshSceneModalBody();refreshTreePanel();if(currentScene===sceneId)resetContentPanel();showToast('场景已删除','success');\n    });\n  }\n"
            assert code.count(scene_delete_before)==1
            code=code.replace(scene_delete_before,scene_delete_after,1)
            old='    if (body) body.innerHTML = buildSceneTableHTML();'
            assert old in code
            code=code.replace(old,"    if (body) {var association=body.querySelector('#d-category-association');if(association)association.remove();body.innerHTML=buildSceneTableHTML();if(association)body.appendChild(association);}",1)
            code=code.replace('buildLocalMappingSelect(tag.id, localTags, mappedLocalId, disabledContext)', 'buildLocalMappingSelect(tag.id, localTags, mappedLocalId, disabledContext, tag.name)')
            code=code.replace('function buildLocalMappingSelect(tagId, localTags, mappedLocalId, disabled)', 'function buildLocalMappingSelect(tagId, localTags, mappedLocalId, disabled, supplierTagName)')
            code=code.replace("    html += '<option value=\"\">未映射</option>';", "    var suggestedId = !mappedLocalId ? guessLocalTagId(localTags, supplierTagName) : '';\n    var suggested = localTags.find(function(item){return item.id===suggestedId;});\n    html += '<option value=\"\">未映射'+(suggested?' · 推荐 '+escapeHTML(suggested.name)+'（待选择）':'')+'</option>';")
            old="    return localTags[0] ? localTags[0].id : '';"
            assert old in code
            code=code.replace(old,"    return ''; // An unmatched supplier tag is not a confirmed mapping.",1)
            start=code.index('  function ensureMappingsForEnabledTags(')
            end=code.index('  function initDefaultLocalMappings(',start)
            code=code[:start]+'''  function ensureMappingsForEnabledTags(supplierId, tenantType, sceneId) {
    // Keep existing saved mappings; only the original explicit mapping selector writes new ones.
    // Initialization or enabling a tag never turns a name recommendation into a confirmed link.
  }

'''+code[end:]
        if kind=='cloud' and path=='js/components/brand-lead-store.js':
            code=code.replace('if (ledger) return ledger;', 'if (ledger) return window.applyDOrganizationBinding?applyDOrganizationBinding(ledger):ledger;',1)
            code=code.replace('    return ledger;\n  }','    return window.applyDOrganizationBinding?applyDOrganizationBinding(ledger):ledger;\n  }',1)
        if kind=='cloud' and path=='js/components/customer-business.js':
            old='(saved?.businessType===source?.businessType && saved.businessTypeLabel)'
            assert old in code
            code=code.replace(old,'(saved && saved.businessType===source?.businessType && saved.businessTypeLabel)',1)
            replacements={
              "const state = () => root.AppState?.get?.() || {};":"const state = () => root.DSharedConfiguration?.active()?root.DSharedConfiguration.state():root.AppState?.get?.() || {};",
              "const access = () => root.AppState?.effectiveAccess?.() || {};":"const access = () => root.DSharedConfiguration?.active()?root.DSharedConfiguration.access():root.AppState?.effectiveAccess?.() || {};",
              "const ready = () => access().valid === true && state().activeDomain === 'CLOUD_CONTACT_CENTER';":"const ready = () => access().valid === true && (root.DSharedConfiguration?.active() || state().activeDomain === 'CLOUD_CONTACT_CENTER');",
              "const canManage = () => ready() &&":"const canManage = () => root.DSharedConfiguration?.active()?root.DSharedConfiguration.canManage():ready() &&",
              "  function tenants() {":"  function tenants() {\n    if(root.DSharedConfiguration?.active())return root.DSharedConfiguration.tenants().map(clone);",
              "typeof scope.enterpriseId !== 'string' || !scope.enterpriseId ||":"typeof scope.enterpriseId !== 'string' || (!scope.enterpriseId && !safeId(scope.brandId)) ||",
              "  function deleteCategory(id, source = {}, options = {}) {return deleteConfiguration('category',id,source,options);}":"  function deleteCategory(id, source = {}, options = {}) {if(source.brandId)return fail('本版品牌业务分类不提供删除');return deleteConfiguration('category',id,source,options);}",
              "  function setEnabled(id, enabled, source = {}, options = {}) {":"  function setEnabled(id, enabled, source = {}, options = {}) {\n    if(source.brandId)return fail('本版品牌业务分类不提供启停');",
              "  function save(input, source = {}, options = {}) {":"  function save(input, source = {}, options = {}) {\n    if(source.brandId){const prior=get(input.id,source),desired=input.enabled!==false;if(prior?desired!==prior.enabled:!desired)return fail('本版品牌业务分类不提供启停');}"
            }
            for old,new in replacements.items():
                if old not in code:raise ValueError('Category adapter source changed: '+old)
                code=code.replace(old,new,1)
        if kind=='cloud' and path=='js/components/customer-business.js':
            code=code.replace("...(source?.brandId?{brandId:text(source.brandId)}:{})", "...(source?.brandId?{brandId:text(source.brandId)}:{}),...(source?.legacy===true?{legacy:true}:{})",1)
            helper="""  function legacyDefaults(scope){const fixture=root.DNativeContext?.syntheticLegacyCatalogs?.[scope.tenantId];return fixture?clone(fixture):defaults();}
  function legacyCatalog(source={}) {
    const scope=scopeOf(source);if(!allowed(scope))return fail('没有本租户原目录的读取权限');
    try{const {data}=load(),bundle=scopeBundle(data,scope)||{...scope,...legacyDefaults(scope)};return {ok:true,rows:clone(bundle.types),fields:clone(bundle.fields),scope:{...scope,legacy:true},legacy:true,revision:data.revision,context:context(),retiredTypes:clone(bundle.retiredTypes||[])};}catch(_){return fail('原租户目录暂时无法可靠读取，原数据保留');}
  }
  function legacyTenants(){try{const {data}=load();return tenants().filter(t=>!sourceBrand(t)||!!scopeBundle(data,scopeOf(t)));}catch(_){return [];}}
"""
            code=code.replace('  function brandCatalog(source={}) {',helper+'  function brandCatalog(source={}) {',1)
            code=code.replace("    if(!id)return fail('尚未关联品牌，不能作为未分类默认数据使用');", "    if(source.legacy===true||!id)return legacyCatalog(source);",1)
            code=code.replace("    if (!canManageBrand(sourceBrand(source))) return fail('当前账号无权维护此品牌的业务配置');", "    const legacy=source.legacy===true||!sourceBrand(source);\n    if(legacy?!(canManage()&&allowed(scopeOf(source))):!canManageBrand(sourceBrand(source)))return fail('当前账号无权维护此业务配置');",1)
            code=code.replace('const checkedScope=brandScope(sourceBrand(source));','const checkedScope=legacy?{ok:true,scope:{...scopeOf(source),legacy:true}}:brandScope(sourceBrand(source));',1)
            code=code.replace('let target=next.brandScopes.find(row=>row.brandId===scope.brandId);', 'let target=legacy?scopeBundle(next,scope):next.brandScopes.find(row=>row.brandId===scope.brandId);',1)
            code=code.replace('if(!target){target=clone(brandBundle(next,scope.brandId,scope));next.brandScopes.push(target);}', 'if(!target){target=legacy?{...scope,...legacyDefaults(scope)}:clone(brandBundle(next,scope.brandId,scope));(legacy?next.scopes:next.brandScopes).push(target);}',1)
            code=code.replace("if(source.brandId)return fail('本版品牌业务分类不提供启停');", "if(!source.legacy&&sourceBrand(source))return fail('本版品牌业务分类不提供启停');",1)
            code=code.replace("if(source.brandId){const prior=get(input.id,source)", "if(!source.legacy&&sourceBrand(source)){const prior=get(input.id,source)",1)
            code=code.replace('      const originalTypes=clone(target.types),originalFields=JSON.stringify(target.fields);', "      if(legacy){const id=sourceBrand(source);if(id&&!next.brandScopes.some(row=>row.brandId===id))next.brandScopes.push(clone(brandBundle(next,id,{...scope,brandId:id})));}\n      const originalTypes=clone(target.types),originalFields=JSON.stringify(target.fields);",1)
            code=code.replace('root.CustomerBusiness = Object.freeze({','root.CustomerBusiness = Object.freeze({legacyCatalog,legacyTenants,',1)
            code=code.replace('context()!==operationContext||!canManageBrand(sourceBrand(source))', 'context()!==operationContext||(legacy?!(canManage()&&allowed(scopeOf(source))):!canManageBrand(sourceBrand(source)))',1)
        if kind=='cloud' and path=='js/components/business-flow-store.js':
            old='  function visible(r,a){'
            assert old in code
            code=code.replace(old,old+"\n    if(a.regulationOnly)return brandAllowed(r.brandId,a)&&(a.tenantIds||[]).includes(r.ownerTenantId);",1)
            old="const a=window.AppState?.effectiveAccess?.();requireThat(a?.valid"
            assert old in code
            code=code.replace(old,"const a=window.DSharedConfiguration?.active()?window.DSharedConfiguration.access():window.AppState?.effectiveAccess?.();requireThat(a?.valid",1)
            old="      const a=access(),s=read(),token=JSON.stringify(s),requestId=options.requestId||uid('REQ');"
            assert old in code
            code=code.replace(old,old+"\n      requireThat(!a.configurationOnly||['saveCategory','saveTemplate','deleteTemplate','saveRoute','saveRouting'].includes(kind),'EXECUTION_DENIED','配置权限不授予业务处理权限');\n      const integrated=parent.DBusinessLink.authorize(kind,payload,a);requireThat(integrated.ok,'INTEGRATED_PERMISSION',integrated.message);",1)
            old="else if(input.type==='result'){requireThat(seg.method!=='MANUAL'"
            assert old in code
            code=code.replace(old,"else if(input.type==='result'){requireThat(seg.method!=='AI'||(!input.providedFieldIds?.length&&!input.values&&!input.fieldValues&&!input.tags),'AI_FIELDS_PENDING','AI结果写入业务字段尚未核定，本次未写入业务字段');requireThat(seg.method!=='MANUAL'",1)
        if kind=='cloud' and path=='js/components/business-flow-store.js':
            old="contactGuard(r);noRunning(r);previousSaved(r);"
            assert old in code
            code=code.replace(old,"contactGuard(r);const contactKey=r.categorySnapshot.fields.find(f=>f.type==='phone')?.key;const contactCheck=parent.DContactPolicy.check(a.tenantId,String(r.fields[contactKey]||''),input.method);requireThat(contactCheck.allowed,'CONTACT_RESTRICTED',contactCheck.message);noRunning(r);previousSaved(r);",1)
        if kind=='cloud' and path=='js/pages/business-categories.js':
            # Keep field controls intact, omit category stop/delete in the current brand model.
            code=code.replace("{key:'flowBinding',label:'路由配置',render:(_,row)=>window.FlowConfiguration?.routeSummary?.(row,currentScope()) || '<span class=\"business-category-error\">路由状态待核</span>'}", "{key:'flowBinding',label:currentScope().legacy?'执行规则':'路由配置',render:(_,row)=>currentScope().legacy?'<span>沿原任务规则</span>':window.FlowConfiguration?.routeSummary?.(row,currentScope()) || '<span class=\"business-category-error\">路由状态待核</span>'}",1)
            old="<button onclick=\"${action('toggle',kind,row.id,!row.enabled)}\">${row.enabled?'停用':'启用'}</button><button class=\"business-delete-action\" onclick=\"${action('remove',kind,row.id)}\">删除</button>"
            assert old in code
            toggle="<button onclick=\"${action('toggle',kind,row.id,!row.enabled)}\">${row.enabled?'停用':'启用'}</button>"
            code=code.replace(old,"${kind==='category'?(currentScope().legacy?`"+toggle+"`:''):`"+old+"`}",1)
            code=code.replace("const kinds=model.canManage()&&brands.length?['category','field','dictionary']:[];", "const kinds=model.canManage()&&(brands.length||window.DSharedConfiguration?.legacySource())?(window.DSharedConfiguration?.legacySource()?['category','field']:['category','field','dictionary']):[];",1)
            code=code.replace("    const next=model.context();let brands=[];scopeIssue='';", "    const legacy=window.DSharedConfiguration?.legacySource();if(legacy){const next=model.context();if(context!==next||!sourceScope?.legacy||sourceScope.tenantId!==legacy.tenantId){context=next;brandId='';sourceScope=clone(legacy);savedGuidance=null;pendingFieldId='';Object.values(states).forEach(state=>{state.keyword='';state.status='';});dismissAll();}scopeIssue='';return [];}\n    const next=model.context();let brands=[];scopeIssue='';if(sourceScope?.legacy)context='';",1)
            code=code.replace("function isActive() {return !!editor &&", "function isActive() {if(editor?.scope.legacy)return model.canManage()&&editor.context===model.context()&&window.DSharedConfiguration?.legacySource()?.tenantId===editor.scope.tenantId;return !!editor &&",1)
            code=code.replace("  function brandFilter(brands) {", "  function brandFilter(brands) {\n    if(currentScope().legacy)return '<span>原租户目录 · '+esc(CloudCallRuntime.tenant(currentScope().tenantId)?.name||'当前租户')+'</span>';",1)
            code=code.replace("const descriptions={", "const descriptions={",1)
            code=code.replace("ui.pageHeader('业务分类',descriptions[kind])", "ui.pageHeader('业务分类',currentScope().legacy?'维护本租户原有分类与字段，停用仅限制新选择和新关联。':descriptions[kind])",1)
            code=code.replace("${kind==='category'?`<button data-action=\"ACTION-11220\"", "${kind==='category'&&!currentScope().legacy?`<button data-action=\"ACTION-11220\"",1)
            preview="<button onclick=\"${action('open',kind,row.id,true)}\">预览</button>"
            assert preview in code
            code=code.replace(preview,preview+"${kind==='category'?`<button ${DSharedConfiguration.canLinkAI(row.id)?'':'disabled'} onclick=\"${esc('DSharedConfiguration.openAIAssociation('+JSON.stringify(row.id)+')')}\">查看AI关联</button>`:''}",1)
        if kind=='cloud' and path=='js/pages/business-flow.js':
            changes={
              "function ref(value) { return value ? (value.name || value.templateId || '模板') + ' · v' + value.version : '未配置'; }":"function ref(value) { return DReadableFlow.template(value); }",
              "['所属品牌', row.brandId]":"['所属品牌', DReadableFlow.brand(row.brandId)]",
              "['平台记录身份', row.recordId], ":"",
              " + ' · ' + e(row.recordId)":"",
              "<small class=\"bf-muted\">' + e(round.roundId) + '</small>":"",
              "round.segments.map(seg =>":"round.segments.map((seg,segmentIndex) =>",
              "e(methodNames[seg.method] || seg.method) + ' · ' + e(seg.segmentId)":"e(methodNames[seg.method] || seg.method) + ' · 第 ' + (segmentIndex+1) + ' 次处理'",
              "e(seg.nodeId) + ' · ' + e(ref(seg.templateRef)) + ' · ' + e(seg.nodeRunId)":"e(DReadableFlow.node(seg.templateRef,seg.nodeId)) + ' · ' + e(ref(seg.templateRef))",
              "seg.result?.summary || JSON.stringify(seg.result)":"seg.result?.summary || (seg.saved?'处理结果已保存':'尚无已保存结果')",
              "e(run.name || run.nodeId)":"e(run.name || DReadableFlow.node(run.templateRef,run.nodeId))",
              "e(run.nodeRunId) + ' · ' + e(run.roundId || '')":"e(DReadableFlow.round(row,run.roundId))",
              "e(event.nodeId)":"e(DReadableFlow.eventNode(row,event))",
              "value.nodeId, value.tenantId":"value.nodeId ? DReadableFlow.node(value.templateRef||value,value.nodeId) : '', value.tenantId",
              "e(executionNames[row.execution?.state] || '待核')":"e(DReadableFlow.execution(row,executionNames))",
              "+ '<br>不再呼叫：' + (row.execution?.noMoreCalls === true ? '已核定（Mock）' : '尚未核定')":"+ (DReadableFlow.unstarted(row)?'':'<br>不再呼叫：'+(row.execution?.noMoreCalls === true ? '已确认' : '尚未确认'))"
            }
            for old,new in changes.items():
                if old not in code:raise ValueError('Record presentation source changed: '+old)
                code=code.replace(old,new)
        if kind=='cloud' and path=='js/pages/customer-tasks.js':
            old='function commit(){try{'
            assert old in code
            code=code.replace(old,"function commit(){if(window.DBusinessRegulation?.current()){load();showToast('监管仅可查看，未保存业务变更','warning');return false;}try{",1)
            old="'按'+(c.type||'text')+'字段填写'"
            assert old in code
            code=code.replace(old,"({text:'填写文本',textarea:'填写文本',number:'填写数字',date:'填写日期',datetime:'填写日期和时间'}[c.type]||'按字段要求填写')")
            code=code.replace(' · 主模板 ',' · 流转模板 ').replace('请先补齐主模板再导入','请先关联流转模板再导入')
        if kind=='cloud' and path=='js/pages/flow-configuration.js':
            code,flow_editor_info=apply_controller(code)
        code=category_transform(kind,path,code)
        code=import_transform(kind,path,code)
        code=routing_transform(kind,path,code)
        code=routing_runtime_transform(kind,path,code)
        code=routing_feedback_transform(kind,path,code)
        code=ai_import_result_transform(kind,path,code)
        code=ai_import_parse_transform(kind,path,code)
        code=ai_parity_transform(kind,path,code)
        code=field_model_transform(kind,path,code)
        code=field_ui_transform(kind,path,code)
        code=field_import_transform(kind,path,code)
        code=list_sort_transform(kind,path,code)
        code=list_sort_cloud_transform(kind,path,code)
        code=list_sort_ai_transform(kind,path,code)
        code=flow_condition_ui_transform(kind,path,code)
        code=four_node_model_transform(kind,path,code)
        code=four_node_ui_transform(kind,path,code)
        code=four_node_workspace_transform(kind,path,code)
        code=business_family_transform(kind,path,code)
        code=direct_followup_transform(kind,path,code)
        code=template_lifecycle_transform(kind,path,code)
        code=current_catalog_transform(kind,path,code)
        code=current_planning_transform(kind,path,code)
        code=multiple_values_ui_transform(kind,path,code)
        code=template_list_ui_transform(kind,path,code)
        if kind=='ai' and path=='js/pages/sys-scene.js':
            marker="      tenant: tenants.join('、'),"
            if code.count(marker)!=1:raise ValueError('AI scene ownership source changed')
            code=code.replace(marker,marker+"\n      ...(DNativeContext.context.scope.kind==='tenant'?{integrationTenantId:DNativeContext.context.scope.id}:{}),",1)
        code=menu_presentation(kind,path,code)
        codes.append(code)
        if kind=='ai' and path=='mock/data.js':
            codes.append((ROOT/'js/adapters/ai-assignment-identity.js').read_text())
            codes.append((ROOT/'js/adapters/ai-config-store.js').read_text())
    # Adapter is a new integration surface, never a copy of the discarded prototype.
    adapter=(ROOT/'js/adapters'/f'{kind}.js').read_text()
    codes.append(adapter)
    if kind=='cloud':
        codes.append((ROOT/'js/adapters/four-node-execution.js').read_text())
        codes.append(four_node_workspace_source())
        css.append(four_node_workspace_style())
    if kind=='ai':
        codes.append((ROOT/'js/adapters/ai-finance.js').read_text())
        codes.append((ROOT/'js/adapters/unified-ai.js').read_text())
    subprocess.run(['node','-e',"const fs=require('fs'),vm=require('vm');for(const code of JSON.parse(fs.readFileSync(0,'utf8')))new vm.Script(code);"],input=json.dumps(codes),text=True,check=True)
    if kind=='ai':
        css.append(shared_source.read_text())
        css.append(ai_theme)
    skin='''html,body{margin:0!important;padding:0!important;min-width:0!important;height:100%;}body>.top-bar,body>#authGateway,.main-layout>.sidebar,body>[data-version-nav]{display:none!important}body>.main-layout{margin:0!important;min-height:100%;height:100vh!important;display:flex!important}.content-area{min-width:0;flex:1;margin:0!important}.main-layout{--app-sidebar:0px;--app-topbar:0px} :root{--app-topbar:0px;--app-sidebar:0px;--delivery-nav-height:0px}.native-call-dock{left:0!important;right:0!important;top:0!important}.content-area#page-content{overflow:auto}'''
    csp="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; font-src data:; connect-src 'none'; form-action 'none';"
    def script(code):return '<script>'+re.sub('</script',r'<\\/script',code,flags=re.I)+'</script>'
    html='<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="'+csp+'"><title>D联络云 · '+kind+'</title><!--D_BOOT--><style>'+'\n'.join(css).replace('</style','<\\/style')+'\n'+skin+'</style></head><body data-native-kind="'+kind+'">'+body+'\n'+''.join(script(c) for c in codes)+'</body></html>'
    if kind=='cloud':
        if flow_editor_info is None:raise ValueError('Missing flow-template source controller; build stopped')
        html=html.replace('</head>',canvas_style()+template_list_ui_style()+'</head>')
        provenance.setdefault('localTransforms',{})['flowTemplateEditor']=flow_editor_info
    out=ROOT/'js/modules'/f'{kind}.bundle.js'
    payload='window.DNativeModules=window.DNativeModules||{};\nwindow.DNativeModules['+json.dumps(kind)+']='+json.dumps({'html':html,'sourceCount':len(entries),'fixtures':fixtures or {}},ensure_ascii=False)+';\n'
    generated.append((out,payload))
    provenance['sources'][kind]={'root':str(source),'files':entries,'scriptCount':len(scriptpaths),'styleCount':len(styles),'bundleBytes':len(payload.encode()),'bundleSha256':hashlib.sha256(payload.encode()).hexdigest(),'excluded':sorted(SKIP),'transformations':(['native storage namespace changed only in generated code','native popstate uses stored route state','unified Mock organization identity projection','public configuration scope separated from Cloud execution rights','unified seven classifications, protected category deletion and independent configuration menus','business-operation authorization and unverified AI field-write guard','record presentation uses names/round order and distinguishes unstarted state'] if kind=='cloud' else ['read-only concrete scene identifiers exposed for confirmed association UI','parent owns initial route; superseded original init callbacks canceled','unmatched supplier recommendations never become saved mappings','original AI super-admin finance for exact mapped accounts; RechargeService rules retained with scoped local journal']),'adapterSha256':hashlib.sha256(adapter.encode()).hexdigest()}
    print(kind, len(scriptpaths),'scripts',len(styles),'styles',len(payload.encode()),'bytes')
for kind,source in SOURCES.items():build(kind,source)
provenance.setdefault('localTransforms',{})['unifiedCategories']={'version':1,'helperSha256':hashlib.sha256((ROOT/'scripts/category_build.py').read_bytes()).hexdigest(),'directorySha256':hashlib.sha256((ROOT/'js/components/unified-categories.js').read_bytes()).hexdigest()}
provenance['localTransforms']['menuPresentation']={'schema':'existing-menu-presentation@1','navigationSha256':hashlib.sha256((ROOT/'config/nav.json').read_bytes()).hexdigest(),'buildSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'scope':'display names, grouping, native titles, descriptions and breadcrumbs only; route, permissions, data and phone domain retained'}
provenance['localTransforms']['listImport']={'version':1,'transformSha256':hashlib.sha256((ROOT/'scripts/import_build.py').read_bytes()).hexdigest(),'ioSha256':hashlib.sha256((ROOT/'js/components/import-workbook.js').read_bytes()).hexdigest(),'formats':['csv','xlsx'],'xls':'not-supported-explicitly'}
provenance['localTransforms']['conditionalRouting']={'policy':'FIRST_MATCH_V1','resources':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['scripts/flow_routing_build.py','scripts/flow-routing-store.js','js/components/flow-routing.js','js/components/flow-status-domains.js']},'legacy':'existing versions and bindings preserved','providerExecution':'not-verified'}
provenance['localTransforms']['independentAudit']={'resources':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['scripts/ai_import_parse_build.py','scripts/ai_import_result_build.py','scripts/flow_runtime_build.py','scripts/flow-runtime-store.js','scripts/flow-runtime-ui.js','scripts/flow_feedback_build.py','scripts/flow-warning-feedback.js','scripts/flow-condition-feedback.js']},'routingEvidence':'LOCAL_MOCK only; provider execution not verified','aiImport':'local CSV/TXT/OOXML bytes; exact scoped failed-row snapshot; xls explicitly unsupported'}
provenance['localTransforms']['brandFieldConfiguration']={'schema':'brand-purpose-fields@1','resources':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['scripts/field_model_build.py','scripts/field_ui_build.py','scripts/field_import_build.py','scripts/field-import-store.js','scripts/field-import-ui.js']},'legacy':'old field IDs, directory ownership, record/template snapshots and storage namespaces preserved; no eager storage migration','scope':'IMPORT/FOLLOWUP fields, category tabs, required import business codes, explicit column mapping and category-bound routing candidates'}
provenance['localTransforms']['updatedListOrder']={'schema':'updated-descending-lists@1','resources':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['js/components/list-order.js','scripts/list_sort_build.py','scripts/list_sort_cloud_build.py','scripts/list_sort_ai_build.py']},'rule':'updated time descending before pagination; reliable original fallback; unknown stable last','semanticOrder':'configured fields/options, routing priorities, nodes and historical rounds retain original business order','migration':'none; reads never stamp timestamps'}
provenance['localTransforms']['independentImportConditions']={'schema':'independent-import-latest-category@1','resources':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['js/components/flow-routing.js','scripts/flow-routing-store.js','scripts/flow-node-config.js','scripts/flow_condition_ui_build.py']},'sources':'AI call status/tags; Cloud status/follow-up fields; IMPORT independent of call channels','configuration':'latest category is read automatically for create/edit/validate/save; no category version selection','history':'saved template and record snapshots remain immutable; runtime identity and authorization checks retained'}
provenance['localTransforms']['fourNodeClosure']={'schema':'four-node-customer-followup@1','resources':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['scripts/four_node_model_build.py','scripts/four-node-model.js','scripts/four_node_ui_build.py','scripts/flow-canvas-ui.js','scripts/flow-node-config.js','scripts/four_node_workspace_build.py','js/adapters/four-node-workspace.js','js/adapters/four-node-workspace.css','js/adapters/four-node-execution.js','js/components/module-host.js']},'authority':'existing BusinessFlowStore ledger; no parallel business/customer store','configuration':'START anchor, TRANSFER per-edge recipient, PROCESS call and END; latest configuration for new runs, immutable captured plan for started runs','followup':'latest definitions/current values at begin; atomic sealed content/current updates; actual human handler; audited corrections','execution':'finite local Mock; no supplier or real telephone invocation'}
provenance['localTransforms']['businessProductRules']={'schema':'business-product-rules@2','resources':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['scripts/business_family_build.py','scripts/four-node-model.js','scripts/four_node_model_build.py','scripts/four_node_ui_build.py','scripts/flow-canvas-ui.js','scripts/flow-node-config.js','js/adapters/four-node-workspace.js','js/adapters/four-node-execution.js','js/components/business-link.js','js/components/module-host.js','js/components/contact-policy.js','js/components/flow-routing.js']},'scope':'START entry predicates, mandatory CALL, owner/purpose entries, business family, controlled reclassification, contact coordination, qualified manual assignment, work queues, explicit batch initiation and captured business outcomes','history':'no read-time migration; existing captured plans and sealed facts retain their source identities','execution':'local Mock only; professional contact sources use exact scope and canonical provider identities'}
provenance['localTransforms']['completeInheritanceParity']={'schema':'complete-inheritance-parity@1','resources':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['scripts/ai_parity_build.py','scripts/check-inheritance.cjs','js/app.js','js/components/session-store.js','js/components/module-host.js','js/components/organization-store.js','js/components/contact-policy.js','js/components/category-links.js','js/pages/organization.js','js/pages/contacts.js']},'scope':'original entrances, fields, operation scopes and interactions; confirmed v2 replacements retained; source placeholders do not claim completed jobs'}
provenance['localDependencies']=[{'name':'JSZip','version':'3.10.1','license':'MIT','file':'assets/vendor/jszip.min.js','licenseFile':'assets/vendor/JSZip-LICENSE.md'},{'name':'sax','version':'1.6.1','license':'BlueOak-1.0.0','file':'assets/vendor/sax.js','licenseFile':'assets/vendor/SAX-LICENSE.md'}]
for dependency in provenance['localDependencies']:
    dependency['sha256']=hashlib.sha256((ROOT/dependency['file']).read_bytes()).hexdigest()
provenance['localTransforms']['productionPermissions']={'schema':'five-role-permissions@1','basis':'2026-10-29 user-confirmed menu/function/data matrices','roles':['super','hq_admin','hq_ops','store_admin','store_ops'],'seat':'optional current-tenant capability, not a role','resources':{name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in ['js/components/role-permissions.js','js/components/session-store.js','js/components/organization-store.js','js/components/contact-policy.js','js/components/module-host.js','js/pages/organization.js','js/adapters/ai-finance.js','js/adapters/cloud-resources.js']},'acceptance':'pending; user requested no functional regression'}
provenance['localTransforms']['templateLifecycle']={'schema':'current-template-maintenance@2','resources':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['scripts/template_lifecycle_build.py','scripts/check-template-lifecycle.cjs','scripts/check-template-roundtrip.cjs']},'editing':'business execution pending does not block new current configuration; unresolved configuration still blocks','removal':'current classification bindings protect removal; started runs retain their own captured plans','data':'current schema only; no retired-template archives'}
provenance['localTransforms']['currentPlanning']={'schema':'current-four-node-planning@2','resources':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['scripts/current_planning_build.py','scripts/current_catalog_build.py','scripts/check-current-planning-data.cjs']},'initialization':'empty current flow ledger; explicitly discard prior planning schema once without conversion','catalog':'no obsolete template seeds or tenant-to-brand merge; existing field definitions and independent professional settings retained','snapshots':'future current runs, calls and follow-ups capture their own basis'}
provenance['localTransforms']['templateFieldReference']={'schema':'template-field-reference-vs-route-binding@1','resources':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['scripts/four-node-model.js','scripts/four_node_ui_build.py','scripts/flow_condition_ui_build.py','scripts/current_planning_build.py','scripts/check-reference-category.cjs']},'reference':'authoring fields only; no implicit category binding','binding':'category routing explicitly selects a same-brand template; stable used fields and actual AI context validated','execution':'target-category effective plans captured for new runs; source template reference and started runs unchanged'}
provenance['localTransforms']['businessChainAudit']={'schema':'reference-import-followup-chain-audit@1','resources':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['scripts/four-node-model.js','scripts/four_node_model_build.py','scripts/four_node_ui_build.py','scripts/flow-routing-store.js','scripts/flow-runtime-store.js','js/components/flow-routing.js','js/components/module-host.js','js/adapters/four-node-execution.js','js/adapters/four-node-workspace.js','scripts/check-reference-audit.cjs','scripts/check-import-chain-audit.cjs','scripts/check-followup-chain-audit.cjs','scripts/check-product-chain-audit.cjs']},'scope':'actual category preview, confirmed new-run config, manual column mapping and async input isolation, actual/downstream AI context and callback facts, formal known-field confirmation without SYSTEM value invention','compatibility':'current contract only; no snapshot-less legacy result fallback'}
provenance['localTransforms']['multipleComparisonValues']={'schema':'explicit-multiple-comparison-values@1','resources':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['js/components/flow-routing.js','scripts/multiple_values_ui_build.py','scripts/check-multiple-values.cjs']},'input':'one value per line; blank lines ignored, text commas retained; typed scalar parsing shared by node/START','operators':'IN and NOT_IN scalar sets; EQ/NE and ordered comparisons remain single-value; multi-select/tag any/all unchanged','facts':'unknown remains pending and explicit empty requires empty predicate'}
provenance['localTransforms']['templateListUI']={'schema':'template-list-filter-layout@1','resources':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['scripts/template_list_ui_build.py','scripts/template-list-ui.css']},'scope':'list filter markup and scoped CSS only; brand values and query events retained; desktop baseline alignment and narrow stacking'}
provenance['localTransforms']['importRoutingGuidance']={'schema':'row-dependent-import-routing-guidance@1','resources':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['scripts/four-node-model.js','js/adapters/four-node-workspace.js','js/adapters/four-node-workspace.css','scripts/check-import-routing-guidance.cjs']},'scope':'neutral pre-row IMPORT dependency; exact first-node row diagnostics; honest format samples; no permission, rule or default-path changes'}
provenance['localTransforms']['directFollowup']={'schema':'explicit-direct-or-template@1','resources':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['scripts/direct_followup_build.py','scripts/four-node-model.js','scripts/four_node_model_build.py','js/adapters/four-node-workspace.js','js/adapters/four-node-execution.js']},'category':'allowDirectFollowup boolean opt-in; business family and actual template route remain independent','import':'explicit whole-batch handlingMode; direct still validates base schema and identity; template failures never downgrade','lifecycle':'same ledger and record; direct has no flow run/node; explicit enableFlow validates current route and closed prior execution; immutable source followups retained','execution':'shared contacts, real handlers, current values, snapshots and request guard; local Mock only'}
provenance['localTransforms']['customerSIPResults']={'schema':'customer-sip-results@1','authority':'2026-10-30 user clarification: 710 dictionary; https://develop.clink.cn/develop/api/cc-download.html','resources':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['js/components/flow-status-domains.js','scripts/flow-node-config.js','scripts/flow_condition_ui_build.py','js/adapters/four-node-workspace.js','scripts/check-cloud-sip-status.cjs']},'results':'Customer-side final code 200 and 710-724; method-scoped raw evidence; answer flags are not results','editing':'current draft source refreshed without rewriting captured runs','execution':'finite local Mock only; unknown values stay pending'}
provenance['currentProductDiagramGuide']={'source':'js/components/current-diagram-guide.js','sha256':hashlib.sha256((ROOT/'js/components/current-diagram-guide.js').read_bytes()).hexdigest(),'scope':'Current confirmed explanation outside original SVG; source geometry unchanged','geometryEvidence':'memory/global-acceptance-20261030/diagram-geometry.json'}
provenance['localAdapters']={str(path.relative_to(ROOT)):hashlib.sha256(path.read_bytes()).hexdigest() for path in (ROOT/'js/adapters').glob('*.js')}
for out,payload in generated:out.write_text(payload)
(ROOT/'memory/reuse-provenance.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n')

# Refresh local cache revisions after producing artifacts; still works when opened directly.
entry=ROOT/'index.html'
text=entry.read_text()
def versioned(match):
    name=match[2].split('?')[0]
    target=ROOT/name
    # These two standard loaders have fixed URL contracts; their content
    # proof is carried by a data attribute (navigation) or the signed projection.
    if name in ['js/delivery-nav.js','../../memory/public/版本清单.js']:return match[1]+name+match[3]
    return match[1]+name+'?v='+hashlib.sha256(target.read_bytes()).hexdigest()[:10]+match[3]
text=re.sub(r'((?:src|href)=")([^"#]+)(")',versioned,text)
text=re.sub(r'(<script src="js/delivery-nav.js")(?: data-content-revision="[a-f0-9]+")?',lambda m:m[1]+' data-content-revision="'+hashlib.sha256((ROOT/'js/delivery-nav.js').read_bytes()).hexdigest()[:10]+'"',text)
entry.write_text(text)
