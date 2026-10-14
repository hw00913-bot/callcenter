#!/usr/bin/env python3
"""One local project ledger. Business versions, changes and content receipts are distinct."""
from __future__ import annotations
import argparse, contextlib, fcntl, hashlib, json, os, sys, tempfile, uuid, shutil, re, unicodedata
from datetime import datetime, timezone
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import quote, unquote, urlsplit
STAGES = ('analysis', 'product', 'development')
ROLES = {'analysis': ('baseline',), 'product': ('business', 'operations'), 'development': ('joint',)}
EXCLUDE_PARTS = {'.git','node_modules','__pycache__','tools','.loop-history','.claude','.codex','.agents','deliverables','.version-backups','.version-snapshot-staging'}
STAGE_DIRECTORIES = {'analysis':'需求', 'product':'原型版本', 'development':'开发交付物'}
EXCLUDE_FILES = {'project-version.json','project-handoff.json','product-review.json','review.json',
 'config/workflow.json','memory/stage-log.md','memory/loop-status.md','memory/circuit-state.json',
 'memory/change-log.md','memory/verification-log.md','memory/final-snapshot.json','runtime/state.json','runtime/workflow.json',
 'runtime/loop-state.json','runtime/change-impact.json','runtime/stage-log.jsonl','runtime/verification-report.json',
 'logic-inventory.json','版本清单.json','版本清单.js','.DS_Store'}
class VersionError(RuntimeError): pass

def digest(v): return hashlib.sha256(json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def read(p): return json.loads(Path(p).read_text(encoding='utf-8'))
def now(): return datetime.now(timezone.utc).isoformat()
def write(p,v):
 p=Path(p);p.parent.mkdir(parents=True,exist_ok=True)
 fd,name=tempfile.mkstemp(dir=p.parent,prefix=p.name+'.')
 try:
  with os.fdopen(fd,'w',encoding='utf-8') as f:json.dump(v,f,ensure_ascii=False,indent=2);f.write('\n');f.flush();os.fsync(f.fileno())
  os.replace(name,p)
 finally:
  if os.path.exists(name):os.unlink(name)

def content(root):
 root=Path(root).resolve();result={}
 if not root.is_dir():raise VersionError('Stage source unavailable: '+str(root))
 for base,dirs,files in os.walk(root,followlinks=False):
  # Only standard generated snapshot trees are ignored, never an entire business
  # source directory merely because it is named 需求/原型版本/开发交付物.
  relative_base=Path(base).relative_to(root).parts
  if len(relative_base)==2 and relative_base[0] in STAGE_DIRECTORIES.values():
   dirs[:]=[d for d in dirs if d!='snapshots']
  if any((Path(base)/d).is_symlink() for d in dirs if d not in EXCLUDE_PARTS):raise VersionError('Symlink directory forbidden')
  dirs[:]=sorted(d for d in dirs if d not in EXCLUDE_PARTS)
  for name in sorted(files):
   p=Path(base)/name;rel=p.relative_to(root).as_posix()
   if rel in EXCLUDE_FILES or name=='.DS_Store':continue
   if p.is_symlink():raise VersionError('Symlink content forbidden: '+rel)
   result[rel]=hashlib.sha256(p.read_bytes()).hexdigest()
 return digest(result)

@contextlib.contextmanager
def transaction(path, refresh=True):
 path=Path(path).resolve();path.parent.mkdir(parents=True,exist_ok=True)
 if path.is_symlink():raise VersionError('Ledger symlink forbidden')
 with path.with_suffix(path.suffix+'.lock').open('a') as f:
  fcntl.flock(f,fcntl.LOCK_EX)
  data=read(path) if path.exists() else None
  yield data
  if data is not None:write(path,data)
 if refresh and data is not None and data.get('public_projection'):
  settings=data['public_projection']
  publish_version_index(path,settings['project_root'],settings.get('current_version_id'))

def version(data,vid):
 if data.get('schema_version')!='1.0':raise VersionError('Unsupported ledger schema')
 if vid not in data['versions']:raise VersionError('Unknown project version: '+vid)
 return data['versions'][vid]

def revoke(v, stage, reason):
    old=v['stages'].pop(stage,None)
    if old:v.setdefault('snapshot_history',[]).append({'stage':stage,'reason':reason,'revoked_at':now(),'receipt':old})


def check(data,vid,stage,receipt=None):
 v=version(data,vid);i=STAGES.index(stage)
 for s in STAGES[:i+1]:
  b=v['stages'].get(s)
  if not b or b['revision']!=v['revision']:raise VersionError('Stage stale/unbound: '+s)
  if content(b['root'])!=b['content_digest']:raise VersionError('Stage content changed: '+s)
  for role in ROLES[s]:
   a=b.get('approvals',{}).get(role)
   if not a or a['snapshot_id']!=b['snapshot_id']:raise VersionError('Missing current approval: '+s+'/'+role)
   p=Path(a['evidence']['path'])
   if not p.is_file() or p.is_symlink() or hashlib.sha256(p.read_bytes()).hexdigest()!=a['evidence']['sha256']:
    raise VersionError('Approval evidence unavailable/changed: '+s+'/'+role)
 if receipt and receipt!=v['stages'][stage]['snapshot_id']:raise VersionError('Superseded delivery snapshot')
 return v['stages'][stage]

def reference(root):
 p=Path(root)/'project-version.json'
 return read(p) if p.exists() else None

def validate_reference(ref,stage,approved=True):
 data=read(ref['registry']);
 if ref['project_id']!=data['project_id']:raise VersionError('Wrong project identity')
 if approved:return check(data,ref['version_id'],stage,ref.get('snapshot_id'))
 return version(data,ref['version_id'])

def validate_workspace(root,stage):
    root=Path(root).resolve();b=validate_reference(reference(root),stage)
    if b['root']!=str(root):raise VersionError('Workspace is not the approved active stage owner')
    return b


def _safe_segment(value, description):
    if not isinstance(value,str) or not value or value != value.strip():
        raise VersionError('Unsafe '+description+' directory segment')
    if value in ('.','..') or value.endswith('.') or value.startswith('.'):
        raise VersionError('Unsafe '+description+' directory segment')
    if any(ord(c)<32 or ord(c)==127 or c in '<>:"/\\|?*' for c in value):
        raise VersionError('Unsafe '+description+' directory segment')
    if len(value.encode('utf-8'))>255:
        raise VersionError('Oversized '+description+' directory segment')
    if value.split('.')[0].casefold() in {'con','prn','aux','nul',*(f'com{i}' for i in range(1,10)),*(f'lpt{i}' for i in range(1,10))}:
        raise VersionError('Reserved '+description+' directory segment')
    return value


def _plain_path(path):
    """Resolve after inspecting every existing component: resolving first hides links."""
    raw=Path(path).expanduser().absolute()
    for component in (raw,*raw.parents):
        if component.is_symlink():raise VersionError('Symlink path forbidden: '+str(component))
    return raw.resolve()


def _labels(data):
    seen={}
    for vid,v in data.get('versions',{}).items():
        label=_safe_segment(v.get('label'),'business version label')
        key=unicodedata.normalize('NFC',label).casefold()
        if key in seen and seen[key]!=vid:
            raise VersionError('Project versions share a conflicting label path: '+label)
        seen[key]=vid


def _project_root(data, project_root, workspace=None):
    target=_plain_path(project_root)
    if target.exists() and not target.is_dir():raise VersionError('Project root must be a directory')
    if data.get('project_root') and target!=_plain_path(data['project_root']):
        raise VersionError('Ledger artifacts belong to another project root')
    workspaces=[workspace] if workspace else []
    for v in data.get('versions',{}).values():
        workspaces.extend(v.get('workspaces',{}).values())
        workspaces.extend(b.get('root') for b in v.get('stages',{}).values())
    for raw in workspaces:
        if raw and target.is_relative_to(Path(raw).resolve()):
            raise VersionError('Project root must not be inside a stage workspace')
    _labels(data)
    return target


def _layout(data, vid, project_root, stage, snapshot_id=None, workspace=None):
    if stage not in STAGES:raise VersionError('Unknown stage')
    v=version(data,vid);target=_project_root(data,project_root,workspace)
    label=_safe_segment(v['label'],'business version label')
    version_root=target/STAGE_DIRECTORIES[stage]/label
    # Detect filesystem aliases on case sensitive machines too, before deploying
    # the same project on the user's case insensitive filesystem.
    container=target/STAGE_DIRECTORIES[stage]
    if container.is_dir():
        for child in container.iterdir():
            if unicodedata.normalize('NFC',child.name).casefold()==unicodedata.normalize('NFC',label).casefold() and child.name!=label:
                raise VersionError('Existing version directory conflicts with label: '+child.name)
    _plain_path(version_root)
    if snapshot_id is None:snapshot_id=v.get('stages',{}).get(stage,{}).get('snapshot_id')
    destination=None
    if snapshot_id is not None:
        _safe_segment(snapshot_id,'snapshot ID')
        destination=version_root/'snapshots'/snapshot_id
        if not _plain_path(destination).is_relative_to(target):raise VersionError('Snapshot outside project root')
    return {'project_id':data['project_id'],'version_id':vid,'label':label,'stage':stage,
            'project_root':str(target),'version_root':str(version_root),
            'snapshots_root':str(version_root/'snapshots'),'snapshot_id':snapshot_id,
            'destination':str(destination) if destination else None}


def layout_preview(root, project_root, stage, snapshot_id=None):
    root=_plain_path(root);_plain_path(root/'project-version.json');ref=reference(root)
    if not ref:raise VersionError('Attach project/version first')
    _plain_path(ref['registry'])
    data=read(ref['registry'])
    if ref['project_id']!=data['project_id']:raise VersionError('Wrong project identity')
    return _layout(data,ref['version_id'],project_root,stage,snapshot_id,root)


def delivery_destination(root, project_root, stage):
    root=_plain_path(root);_plain_path(root/'project-version.json');ref=reference(root)
    if not ref:raise VersionError('Attach project/version first')
    _plain_path(ref['registry']);b=validate_workspace(root,stage)
    preview=layout_preview(root,project_root,stage,b['snapshot_id'])
    destination=Path(preview['destination'])
    if destination.exists():raise VersionError('Approved snapshot exists; no overwrite')
    return destination


def _relative_file(value):
    if not isinstance(value,str) or not value or '\\' in value or any(ord(c)<32 for c in value):
        raise VersionError('Unsafe artifact relative path')
    path=Path(value)
    if path.is_absolute() or any(p in ('','..','.') for p in value.split('/')) or urlsplit(value).scheme:
        raise VersionError('Unsafe artifact relative path: '+value)
    return path


def _verified_files(destination, manifest):
    entries=manifest.get('files')
    if not isinstance(entries,list) or not entries:raise VersionError('Complete nonempty artifact manifest required')
    if manifest.get('status') in ('draft','pending','blocked','blocked_for_development','pending_approval','incomplete','failed'):
        raise VersionError('Incomplete artifact may not be registered')
    if 'verification_status' in manifest and manifest['verification_status']!='pass':
        raise VersionError('Artifact verification must pass')
    files={}
    for item in entries:
        if not isinstance(item,dict):raise VersionError('Invalid artifact manifest entry')
        rel=_relative_file(item.get('path'));name=rel.as_posix();expected=item.get('sha256')
        if name in files or not isinstance(expected,str) or not re.fullmatch('[0-9a-f]{64}',expected):
            raise VersionError('Duplicate/invalid artifact digest: '+name)
        path=_plain_path(destination/rel)
        if not path.is_relative_to(destination) or not path.is_file():raise VersionError('Missing/unsafe artifact: '+name)
        if hashlib.sha256(path.read_bytes()).hexdigest()!=expected:raise VersionError('Artifact content changed: '+name)
        files[name]=expected
    actual={}
    for base,dirs,names in os.walk(destination,followlinks=False):
        if any((Path(base)/d).is_symlink() for d in dirs):raise VersionError('Symlink artifact directory forbidden')
        for name in names:
            path=_plain_path(Path(base)/name);rel=path.relative_to(destination).as_posix()
            actual[rel]=hashlib.sha256(path.read_bytes()).hexdigest()
    extra=set(actual)-set(files)
    # Integrity manifests cannot hash themselves. They are allowed only when
    # their exact parsed content is the manifest the caller supplied.
    for name in tuple(extra):
        if name in ('manifest.json','delivery-manifest.json') and read(destination/name)==manifest:
            files[name]=actual[name];extra.remove(name)
    if extra or set(files)!=set(actual):raise VersionError('Artifact manifest does not cover all snapshot files')
    return files


def record_artifact(root, stage, destination, manifest, entrypoint=None, kind=None):
    root=_plain_path(root);destination=_plain_path(destination)
    if not destination.is_dir():raise VersionError('Finished artifact directory required')
    if not isinstance(manifest,dict):raise VersionError('Artifact manifest must be an object')
    ref=reference(root)
    if not ref:raise VersionError('Attach project/version first')
    _plain_path(root/'project-version.json');_plain_path(ref['registry'])
    with transaction(ref['registry']) as data:
        if ref['project_id']!=data['project_id']:raise VersionError('Wrong project identity')
        b=check(data,ref['version_id'],stage)
        if b['root']!=str(root):raise VersionError('Workspace is not the approved active stage owner')
        if stage=='development' and manifest.get('status')!='ready_for_development':
            raise VersionError('Only reviewed development artifact may be registered')
        if len(destination.parents)<4:raise VersionError('Standard artifact destination required')
        project_root=destination.parents[3]
        preview=_layout(data,ref['version_id'],project_root,stage,b['snapshot_id'],root)
        if destination!=Path(preview['destination']):raise VersionError('Artifact destination does not match current standard snapshot')
        files=_verified_files(destination,manifest)
        if entrypoint is not None:
            entrypoint=_relative_file(entrypoint).as_posix()
            if entrypoint not in files:raise VersionError('Artifact entrypoint is not covered by manifest')
        v=version(data,ref['version_id']);artifacts=v.setdefault('artifacts',[])
        record={'stage':stage,'snapshot_id':b['snapshot_id'],'revision':v['revision'],
                'destination':str(destination),'project_root':str(project_root),
                'manifest_sha256':digest(manifest),'files':files,'entrypoint':entrypoint,
                'kind':kind or stage+'-snapshot'}
        old=next((a for a in artifacts if a.get('destination')==str(destination)),None)
        if old:
            if any(old.get(k)!=value for k,value in record.items()):raise VersionError('Registered artifact is immutable; no replacement')
            return old
        record['at']=now();artifacts.append(record)
        data.setdefault('project_root',str(project_root))
        return record


def _public_text(value):
    if value is not None and (isinstance(value,bool) or not isinstance(value,(str,int))):
        raise VersionError('Public display text must be a scalar')
    text=str(value or '')
    if any(ord(c)<32 and c not in '\n\r\t' or ord(c)==127 for c in text):
        raise VersionError('Control bytes in public display text')
    return re.sub(r'(?:file://[^\s]+|javascript:[^\s]+|[A-Za-z]:[\\/][^\s]+|(?<![\w:])/(?:[^\s，；。]+))',
                  '[本地路径已隐藏]',text,flags=re.I)


PUBLIC_PRIVATE_PARTS={'.git','.codex','.agents','.claude','.source-html','node_modules',
                      'tools','memory','reviews','evidence','runtime','analysis','inputs',
                      'qa','tests','test-results','playwright-report','coverage','backups','归档'}
PUBLIC_PRIVATE_FILES={'project-version.json','project-handoff.json','execution-authority.json',
                      'delivery-manifest.json','product-input.json',
                      'product-review.json','review.json','approval.json','approvals.json',
                      'ledger.json','project-versions.json','版本台账.json','source.txt',
                      'workflow.json','requirement-analysis.json','confirmation-basis.json',
                      '版本清单.json','版本清单.js'}


def _public_href(value):
    if not isinstance(value,str) or not value or value!=value.strip() or len(value)>4096:return None
    decoded=value
    for _ in range(4):
        next_value=unquote(decoded)
        if next_value==decoded:break
        decoded=next_value
    else:return None
    if decoded!=decoded.strip():return None
    try:parts=urlsplit(decoded)
    except ValueError:return None
    if parts.scheme or parts.netloc or parts.path.startswith('/') or '?' in decoded or '\\' in decoded or any(ord(c)<32 or ord(c)==127 for c in decoded):return None
    if '..' in parts.path.split('/') or re.search(r'(?:file://|javascript:|[A-Za-z]:[\\/]|/(?:Users|home|tmp|private|var|Volumes|opt|Applications)/)',decoded,re.I):return None
    components=parts.path.split('/')
    if any(p.startswith('.') or p.casefold() in PUBLIC_PRIVATE_PARTS for p in components if p):return None
    if any(p.casefold() in PUBLIC_PRIVATE_FILES for p in components):return None
    if parts.fragment and (len(parts.fragment)>255 or not re.fullmatch(r'[\w:.-]+',parts.fragment)):return None
    return value


def _approval_status(receipt, role):
    a=receipt.get('approvals',{}).get(role)
    if not a:return 'pending'
    if a.get('snapshot_id')!=receipt.get('snapshot_id'):return 'stale'
    try:
        path=_plain_path(a['evidence']['path'])
        return 'approved' if path.is_file() and hashlib.sha256(path.read_bytes()).hexdigest()==a['evidence']['sha256'] else 'stale'
    except (OSError,KeyError,TypeError,VersionError):return 'stale'


def _stage_status(data, vid, stage):
    v=version(data,vid);b=v.get('stages',{}).get(stage)
    if not b:
        return 'stale' if any(h.get('stage')==stage for h in v.get('snapshot_history',[])) else 'not_started'
    try:
        _plain_path(b['root'])
        if b['revision']!=v['revision'] or content(b['root'])!=b['content_digest']:return 'stale'
        approvals=[_approval_status(b,r) for r in ROLES[stage]]
        if 'stale' in approvals:return 'stale'
        if 'pending' in approvals:return 'pending_approval'
        check(data,vid,stage,b['snapshot_id'])
        return 'approved'
    except (VersionError,OSError,KeyError,TypeError,ValueError):return 'blocked_upstream'


def _artifact_status(data, vid, artifact, project_root):
    try:
        b=check(data,vid,artifact['stage'],artifact['snapshot_id'])
        _plain_path(b['root'])
        target=_plain_path(artifact['destination'])
        expected=_layout(data,vid,project_root,artifact['stage'],artifact['snapshot_id'])
        if target!=Path(expected['destination']) or not target.is_dir():return 'stale'
        for name,sha in artifact['files'].items():
            path=_plain_path(target/_relative_file(name))
            if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest()!=sha:return 'stale'
        actual={p.relative_to(target).as_posix() for p in target.rglob('*') if p.is_file()}
        if actual!=set(artifact['files']) or any(p.is_symlink() for p in target.rglob('*')):return 'stale'
        return 'current'
    except (VersionError,OSError,KeyError,TypeError,ValueError):return 'stale'


def _historical_reference_status(snapshot, project_root, entrypoint):
    try:
        if snapshot.get('sha256') and hashlib.sha256(entrypoint.read_bytes()).hexdigest()!=snapshot['sha256']:return 'stale'
        integrity=snapshot.get('files_manifest')
        if integrity is None and 'files' not in snapshot:return 'historical_reference'
        if integrity is not None and not isinstance(integrity,dict):return 'stale'
        entries=integrity.get('files') if integrity is not None else snapshot.get('files')
        root_href=(integrity.get('root_href') if integrity is not None else None) or snapshot.get('files_root_href')
        if root_href:
            if not _public_href(root_href):return 'stale'
            parts=urlsplit(root_href)
            if parts.query or parts.fragment:return 'stale'
            directory=_plain_path(project_root/_relative_file(unquote(parts.path).rstrip('/')))
        else:directory=entrypoint.parent
        if not directory.is_dir() or not directory.is_relative_to(project_root):return 'stale'
        _verified_files(directory,{'files':entries})
        return 'historical_reference'
    except (VersionError,OSError,KeyError,TypeError,ValueError):return 'stale'


def _build_version_index(data, project_root, current_version_id=None):
    target=_project_root(data,project_root)
    if current_version_id is not None:version(data,current_version_id)
    output={'schema':'project-version-index@1','generated_at':now(),'project':{'id':_public_text(data['project_id']),
            'name':_public_text(data.get('project_name') or data.get('name') or target.name)},
            'current_version_id':_public_text(current_version_id) if current_version_id is not None else None,'versions':[]}
    for vid,v in data['versions'].items():
        item={'version_id':_public_text(vid),'label':_public_text(v['label']),'stages':[],'changes':[],'snapshots':[]}
        for stage in STAGES:
            b=v.get('stages',{}).get(stage,{})
            item['stages'].append({'name':stage,'status':_stage_status(data,vid,stage),
                                  'snapshot_id':_public_text(b.get('snapshot_id')) if b.get('snapshot_id') is not None else None,
                                  'approvals':{role:{'status':_approval_status(b,role)} for role in ROLES[stage]}})
        view=v.get('public_view',{})
        if not isinstance(view,dict):view={}
        href=_public_href(view.get('working_href'))
        if href:item['working_href']=href
        count=view.get('open_items_count')
        if isinstance(count,int) and not isinstance(count,bool) and count>=0:item['open_items_count']=count
        open_href=_public_href(view.get('open_items_href'))
        if open_href:item['open_items_href']=open_href
        for c in v.get('changes',[]):
            change_status=c.get('status','proposed')
            if change_status not in ('proposed','accepted','implemented','rejected'):
                raise VersionError('Invalid public change status')
            configured=view.get('changes',{})
            pages=configured.get(c['change_id'],c.get('public_pages',[])) if isinstance(configured,dict) else c.get('public_pages',[])
            if isinstance(pages,dict):pages=pages.get('public_pages',pages.get('pages',[]))
            public_pages=[]
            for page in pages if isinstance(pages,list) else []:
                if isinstance(page,dict) and _public_href(page.get('href')):
                    public_pages.append({'label':_public_text(page.get('label') or page['href']),'href':page['href']})
            item['changes'].append({'change_id':_public_text(c['change_id']),'summary':_public_text(c.get('summary')),
                'impact_ids':[_public_text(x) for x in c.get('affects',[])],
                'status':change_status,'public_pages':public_pages})
        for artifact in v.get('artifacts',[]):
            try:
                if artifact.get('stage') not in STAGES:continue
                sid=_safe_segment(artifact['snapshot_id'],'artifact snapshot ID')
                path=_plain_path(artifact['destination'])
                if not path.is_relative_to(target):continue
                rel=path.relative_to(target).as_posix()
                if artifact.get('entrypoint'):rel+='/'+_relative_file(artifact['entrypoint']).as_posix()
                href=_public_href(quote(rel,safe='/'))
                if not href:continue
                item['snapshots'].append({'snapshot_id':sid,'stage':artifact['stage'],
                     'status':_artifact_status(data,vid,artifact,target),'href':href,'read_only':True})
            except (VersionError,OSError,KeyError,TypeError,ValueError):continue
        # A recovered baseline may be visible without claiming that it ever had
        # the current approval contract. These hints cannot create receipts.
        historical=view.get('historical_snapshots',[])
        for snapshot in historical if isinstance(historical,list) else []:
            try:
                if not isinstance(snapshot,dict) or snapshot.get('stage') not in STAGES:continue
                sid=_safe_segment(snapshot['snapshot_id'],'historical snapshot ID')
                href=_public_href(snapshot.get('href'))
                if not href:continue
                relative=unquote(urlsplit(href).path)
                path=_plain_path(target/_relative_file(relative))
                if not path.is_relative_to(target) or not path.is_file():continue
                status=_historical_reference_status(snapshot,target,path)
                item['snapshots'].append({'snapshot_id':sid,'stage':snapshot['stage'],
                                         'status':status,'href':href,'read_only':True})
            except (VersionError,OSError,KeyError,TypeError,ValueError):continue
        output['versions'].append(item)
    output['content_id']=digest(output)
    return output


def build_public_version_index(registry, project_root, current_version_id=None):
    """Read the real ledger/content without changing it or writing display files."""
    return _build_version_index(read(_plain_path(registry)),project_root,current_version_id)


def _validate_public_index(index):
    """Reject private/untyped caller additions before writing either derivative."""
    def fields(item, required, optional=()):
        if not isinstance(item,dict) or set(item)!=set(required)|set(item).intersection(optional):
            raise VersionError('Unexpected public projection fields')
    def text(value, nullable=False):
        if nullable and value is None:return
        if not isinstance(value,str) or _public_text(value)!=value:
            raise VersionError('Unsafe public projection text')
    def items(value):
        if not isinstance(value,list):raise VersionError('Public projection array required')
        return value
    def href(value):
        if not _public_href(value):raise VersionError('Unsafe public projection href')
    fields(index,('schema','generated_at','content_id','project','current_version_id','versions'))
    if index['schema']!='project-version-index@1':raise VersionError('Unsupported public projection schema')
    if not isinstance(index['content_id'],str) or not re.fullmatch(r'[0-9a-f]{64}',index['content_id']):
        raise VersionError('Invalid public projection content ID')
    if digest({k:v for k,v in index.items() if k!='content_id'})!=index['content_id']:
        raise VersionError('Public projection content ID mismatch')
    text(index['generated_at']);text(index['current_version_id'],True)
    fields(index['project'],('id','name'))
    for value in index['project'].values():text(value)
    for v in items(index['versions']):
        fields(v,('version_id','label','stages','changes','snapshots'),('working_href','open_items_count','open_items_href'))
        text(v['version_id']);text(v['label'])
        for key in ('working_href','open_items_href'):
            if key in v:href(v[key])
        if 'open_items_count' in v and (type(v['open_items_count']) is not int or v['open_items_count']<0):
            raise VersionError('Invalid public open item count')
        for s in items(v['stages']):
            fields(s,('name','status','snapshot_id','approvals'))
            if s['name'] not in STAGES or s['status'] not in ('not_started','stale','pending_approval','approved','blocked_upstream'):
                raise VersionError('Invalid public stage status')
            text(s['snapshot_id'],True);fields(s['approvals'],ROLES[s['name']])
            for a in s['approvals'].values():
                fields(a,('status',))
                if a['status'] not in ('pending','stale','approved'):raise VersionError('Invalid public approval status')
        for c in items(v['changes']):
            fields(c,('change_id','summary','impact_ids','status','public_pages'))
            text(c['change_id']);text(c['summary'])
            for value in items(c['impact_ids']):text(value)
            if c['status'] not in ('proposed','accepted','implemented','rejected'):raise VersionError('Invalid public change status')
            for p in items(c['public_pages']):
                fields(p,('label','href'));text(p['label']);href(p['href'])
        for s in items(v['snapshots']):
            fields(s,('snapshot_id','stage','status','href','read_only'))
            text(s['snapshot_id']);href(s['href'])
            if s['stage'] not in STAGES or s['status'] not in ('current','stale','historical_reference') or s['read_only'] is not True:
                raise VersionError('Invalid public snapshot status')


def _public_index_script(index):
    # JSON.parse avoids code interpolation; additional escapes keep this source
    # safe even if it is inspected or embedded by a static hosting tool.
    data=json.dumps(index,ensure_ascii=False,separators=(',',':'))
    literal=json.dumps(data,ensure_ascii=False)
    for char,escaped in (('<',r'\u003c'),('>',r'\u003e'),('&',r'\u0026'),('\u2028',r'\u2028'),('\u2029',r'\u2029')):
        literal=literal.replace(char,escaped)
    return """/* Generated public display data; never approval or execution authority. */
(() => {
  'use strict';
  const script=document.currentScript;
  if(!script || !script.hasAttribute('data-project-version-index')) throw new Error('INVALID_PROJECT_INDEX_SCRIPT');
  const source=new URL(script.src);
  if(!['file:','http:','https:'].includes(source.protocol) || source.username || source.password || source.search || source.hash || decodeURIComponent(source.pathname.split('/').pop())!=='版本清单.js') throw new Error('INVALID_PROJECT_INDEX_SCRIPT_URL');
  function freeze(value){if(value && typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
  const data=JSON.parse("""+literal+""");
  const envelope=freeze({schema:'project-version-script@1',data,content_id:data.content_id,projectRoot:new URL('./',source).href});
  Object.defineProperty(window,'ProjectVersionIndex',{value:envelope,writable:false,configurable:false});
})();
"""


def write_public_version_index(index, output_root):
    """Write the same validated object to JSON and JS; never mutate the ledger."""
    _validate_public_index(index)
    root=_plain_path(output_root)
    if root.exists() and not root.is_dir():raise VersionError('Public output root must be a directory')
    root.mkdir(parents=True,exist_ok=True)
    outputs={root/'版本清单.json':(json.dumps(index,ensure_ascii=False,indent=2)+'\n').encode(),
             root/'版本清单.js':_public_index_script(index).encode()}
    temporary={};previous={};committed=[]
    try:
        for path,raw in outputs.items():
            _plain_path(path)
            if path.exists() and not path.is_file():raise VersionError('Public output file conflict')
            previous[path]=path.read_bytes() if path.exists() else None
            fd,name=tempfile.mkstemp(dir=root,prefix=path.name+'.')
            temporary[path]=Path(name)
            with os.fdopen(fd,'wb') as f:f.write(raw);f.flush();os.fsync(f.fileno())
        # The browser consumes only the canonical JS. Both are prepared before
        # replacement; a failed controlled write restores the prior pair.
        for path in outputs:os.replace(temporary[path],path);committed.append(path)
    except Exception:
        for path in reversed(committed):
            if previous[path] is None:path.unlink()
            else:
                fd,name=tempfile.mkstemp(dir=root,prefix=path.name+'.rollback.')
                try:
                    with os.fdopen(fd,'wb') as f:f.write(previous[path]);f.flush();os.fsync(f.fileno())
                    os.replace(name,path)
                finally:
                    if os.path.exists(name):os.unlink(name)
        raise
    finally:
        for path in temporary.values():
            if path.exists():path.unlink()
    return index


def publish_version_index(registry, project_root, current_version_id=None):
    # The root is internal presentation metadata; it never becomes evidence or
    # gives an unapproved workspace the right to export.
    registry=_plain_path(registry)
    with transaction(registry,refresh=False) as data:
        if data is None:raise VersionError('Shared ledger unavailable')
        output=_build_version_index(data,project_root,current_version_id)
        write_public_version_index(output,project_root)
        data['public_projection']={'project_root':str(_plain_path(project_root)),
                                   'current_version_id':current_version_id}
        return output


def attach(root,registry,vid):
 root=Path(root).resolve();registry=Path(registry).resolve()
 if registry==root or root in registry.parents:raise VersionError('Shared ledger must be outside stage workspaces')
 data=read(registry);version(data,vid)
 old=reference(root)
 if old and (old['project_id'],old['version_id'])!=(data['project_id'],vid):raise VersionError('Copy workspace before attaching another project/version')
 ref={'schema_version':'1.0','project_id':data['project_id'],'version_id':vid,'registry':str(registry)}
 write(root/'project-version.json',ref);return ref

def sync_change_log(root, data, vid):
    """Materialized canonical view appended to the existing prototype log; legacy text untouched."""
    root=Path(root);path=root/'memory/change-log.md'
    if not path.is_file():return
    v=version(data,vid);text=path.read_text(encoding='utf-8')
    start='<!-- project-version-changes:start -->';end='<!-- project-version-changes:end -->'
    if text.count(start)!=text.count(end) or text.count(start)>1:raise VersionError('Ambiguous existing generated change section; repair explicitly')
    body='\n## 当前项目版本变更（共用台账派生视图）\n\n台账：'+str(Path(reference(root)['registry']))+'\n\n'
    body+='项目 '+data['project_id']+' / 版本 '+vid+' / '+str(v['label'])+'\n\n'
    for c in v['changes']:
        body+='- '+c['change_id']+' ['+c['stage']+' / '+c['status']+']: '+c['summary']+'；影响 '+', '.join(c['affects'])+'；来源 '+c['source']+'\n'
    block=start+body+end
    if start in text:
        first=text.index(start);last=text.index(end)+len(end);updated=text[:first]+block+text[last:]
    else:updated=text.rstrip()+'\n\n'+block+'\n'
    if updated!=text:path.write_text(updated,encoding='utf-8')


def bind(root,stage):
 ref=reference(root)
 if not ref:raise VersionError('Attach project/version first')
 with transaction(ref['registry']) as data:
  if ref['project_id']!=data['project_id']:raise VersionError('Wrong project identity')
  v=version(data,ref['version_id']);idx=STAGES.index(stage)
  expected_version=None
  for candidate in ('runtime/loop-state.json','product-input.json','product-ir.json'):
   path=Path(root)/candidate
   if path.is_file():
    value=read(path);expected_version=value.get('project',{}).get('version')
    if expected_version is not None:break
  if expected_version is not None and str(expected_version)!=str(v['label']):raise VersionError('Business project version does not match registered version label; correct explicit version inputs, never auto-upgrade')
  if idx:check(data,ref['version_id'],STAGES[idx-1])
  if stage=='product':sync_change_log(root,data,ref['version_id'])
  v.setdefault('workspaces',{})[stage]=str(Path(root).resolve())
  cd=content(root);old=v['stages'].get(stage)
  upstream=v['stages'][STAGES[idx-1]]['snapshot_id'] if idx else None
  sid=digest({'project':data['project_id'],'version':ref['version_id'],'revision':v['revision'],'stage':stage,'content':cd,'upstream':upstream,'root':str(Path(root).resolve())})
  if old and old['snapshot_id']==sid:return old
  revoke(v,stage,'stage rebound to new content')
  v['stages'][stage]={'root':str(Path(root).resolve()),'content_digest':cd,'snapshot_id':sid,'revision':v['revision'],'upstream_snapshot_id':upstream,'approvals':{}}
  for downstream in STAGES[idx+1:]:revoke(v,downstream,'upstream rebound')
  return v['stages'][stage]

def approve(root,stage,role,reviewer,evidence,note):
 ref=reference(root)
 if not ref:raise VersionError('Attach project/version first')
 if role not in ROLES[stage]:raise VersionError('Wrong approval role')
 p=Path(evidence).absolute()
 if p.is_symlink() or not p.is_file() or len(p.read_text(encoding='utf-8').strip())<60 or not reviewer.strip() or not note.strip():raise VersionError('Named actual review evidence (60+ chars) and conclusion required')
 with transaction(ref['registry']) as data:
  if data['project_id']!=ref['project_id']:raise VersionError('Wrong project identity')
  v=version(data,ref['version_id']);b=v['stages'].get(stage)
  if not b or b['root']!=str(Path(root).resolve()) or b['revision']!=v['revision'] or content(root)!=b['content_digest']:raise VersionError('Bind current stage before approval')
  idx=STAGES.index(stage)
  if idx:check(data,ref['version_id'],STAGES[idx-1])
  b['approvals'][role]={'reviewer':reviewer,'note':note,'at':now(),'snapshot_id':b['snapshot_id'],'evidence':{'path':str(p.resolve()),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}}
 return b

STATIC_SUFFIXES={'.html','.htm','.js','.mjs','.css','.json','.svg','.png','.jpg','.jpeg','.gif','.webp','.ico',
                 '.bmp','.woff','.woff2','.ttf','.otf','.eot','.mp3','.wav','.ogg','.mp4','.webm','.pdf','.md','.txt',
                 '.xml','.csv','.xlsx'}
SNAPSHOT_EXCLUDE_PARTS=EXCLUDE_PARTS|{'tests','test-results','playwright-report','coverage','exports','output',
                                  '原型版本','版本历史','需求','开发交付物','snapshots','memory','runtime','reviews','evidence'}
SNAPSHOT_EXCLUDE_FILES=EXCLUDE_FILES|{'product-input.json','execution-authority.json','manifest.json','delivery-manifest.json',
                                  'config/requirement-analysis.json','config/workflow.json','CLAUDE.md','AGENTS.md'}
SNAPSHOT_PRIVATE_FILENAMES={'project-version.json','project-handoff.json','execution-authority.json','product-review.json',
                          'review.json','approval.json','approvals.json','ledger.json','project-versions.json','版本台账.json','版本清单.json','版本清单.js','source.txt'}
READONLY_ADAPTER=r"""
(() => {
  'use strict';
  const config=__SNAPSHOT_CONFIG__;
  const root=new URL(config.rootHref,location.href);
  const returning=config.returnHref ? new URL(config.returnHref,location.href) : null;
  const message='历史快照只读：请返回工作版进行业务修改。';
  function stop(event) {
    if(event){event.preventDefault();event.stopImmediatePropagation();}
    if(typeof window.showToast==='function')window.showToast(message,'info');
    else {const node=document.getElementById('snapshot-readonly-message');if(node)node.textContent=message;}
    return false;
  }
  function memoryStorage(){
    const data=new Map();
    const api={getItem:key=>data.has(String(key))?data.get(String(key)):null,
      setItem:(key,value)=>data.set(String(key),String(value)),removeItem:key=>data.delete(String(key)),
      clear:()=>data.clear(),key:index=>Array.from(data.keys())[Number(index)]??null};
    Object.defineProperty(api,'length',{get:()=>data.size,configurable:true});
    return new Proxy(api,{get:(object,key)=>key in object?object[key]:api.getItem(key),
      set:(_object,key,value)=>{api.setItem(key,value);return true;},
      deleteProperty:(_object,key)=>{api.removeItem(key);return true;},
      ownKeys:()=>Array.from(data.keys()),getOwnPropertyDescriptor:()=>({enumerable:true,configurable:true})});
  }
  // Never read the native stores; even baseline initializers only see new maps.
  for(const name of ['localStorage','sessionStorage']){
    Object.defineProperty(window,name,{value:memoryStorage(),writable:false,configurable:false});
  }
  window.addEventListener?.('storage',event=>event.stopImmediatePropagation(),true);
  try{Object.defineProperty(navigator,'locks',{value:{request:(name,...args)=>{
    const callback=args.find(value=>typeof value==='function');
    return callback?Promise.resolve().then(()=>callback({name,mode:'exclusive'})):Promise.reject(new Error('Callback required'));
  }},configurable:false});}catch(_){}
  try{Object.defineProperty(document,'cookie',{get:()=>'',set:()=>{},configurable:false});}catch(_){/* CSP and omitted credentials still apply. */}
  try{window.opener=null;}catch(_){}
  function inside(input){
    try{const value=new URL(String(input),location.href);return value.origin===root.origin &&
      value.protocol===root.protocol && value.pathname.startsWith(root.pathname) && !value.username && !value.password;}
    catch(_){return false;}
  }
  const originalFetch=window.fetch?.bind(window);
  Object.defineProperty(window,'fetch',{configurable:false,writable:false,value:(input,options={})=>{
    const url=input?.url??input;const method=String(options.method??input?.method??'GET').toUpperCase();
    if(!inside(url)||!['GET','HEAD'].includes(method)||options.body!=null)return Promise.reject(new Error(message));
    if(!originalFetch)return Promise.reject(new Error('Local static fetch unavailable'));
    return originalFetch(input,{...options,method,credentials:'omit',redirect:'error',cache:'no-store'});
  }});
  const forbidden=()=>{throw new Error(message);};
  for(const name of ['XMLHttpRequest','WebSocket','EventSource','Worker','SharedWorker','BroadcastChannel','RTCPeerConnection','WebTransport']){
    Object.defineProperty(window,name,{value:forbidden,writable:false,configurable:false});
  }
  try{Object.defineProperty(navigator,'sendBeacon',{value:()=>false,configurable:false});}catch(_){}
  try{Object.defineProperty(navigator,'serviceWorker',{value:undefined,configurable:false});}catch(_){}
  try{Object.defineProperty(window,'indexedDB',{value:undefined,configurable:false});}catch(_){}
  try{Object.defineProperty(window,'caches',{value:undefined,configurable:false});}catch(_){}
  // Applied before original scripts/resources. All external origins and current
  // project API/resource paths are excluded from the narrower runtime policy.
  if(['http:','https:'].includes(root.protocol)){
    const source=root.href.split(/[?#]/)[0];
    const policy=document.createElement('meta');policy.httpEquiv='Content-Security-Policy';
    policy.content="default-src 'none'; script-src 'unsafe-inline' "+source+"; style-src 'unsafe-inline' "+source+
      "; img-src data: blob: "+source+"; font-src "+source+"; media-src blob: "+source+"; connect-src "+source+
      "; frame-src "+source+"; object-src 'none'; base-uri 'none'; form-action 'none'; worker-src 'none'; manifest-src 'none'";
    document.head.appendChild(policy);
  }
  const originalOpen=window.open?.bind(window);
  Object.defineProperty(window,'open',{configurable:false,writable:false,value:(url,target)=>{
    if(!inside(url))return null;
    return originalOpen ? originalOpen(url,target||'_blank','noopener,noreferrer') : null;
  }});
  if(window.HTMLFormElement){
    window.HTMLFormElement.prototype.submit=()=>stop();
    window.HTMLFormElement.prototype.requestSubmit=()=>stop();
  }
  const mutating=/(?:保存|提交|删除|新增|新建|添加|导入|上传|发布|启用|停用|拨打|发起呼叫|开始呼叫|挂断|转接|\b(?:save|submit|delete|remove|create|commit|import|upload|publish|send|setStatus|startTask|pauseTask|resumeTask|placeCall|answerCall)\w*)/i;
  const loginAction=/(?:AppState\.(?:submitLogin|sendSmsCode|refreshCaptcha|selectDemoProfile|chooseTenant|chooseInstance|chooseManagedTenant|logout)|DemoSwitch\.(?:open|close|select|choose)|(?:^|\s)(?:登录|退出登录)(?:\s|$))/;
  // Explicit operations audited in the archived release and working prototype.
  // A display label, valid business context, or supplier's own pending response
  // must never decide whether a historical view can execute a business write.
  const apiMutations={
    AppState:['persistManagementData','returnFromConfiguration','onSupplierAccountsChanged'],
    AgentWorkbench:['signIn','signOut','receiveOffer','receiveStatus','answerIncoming','syncReceivingProgress','dial','end','saveDisposition','toggleMute','setDisposition','setRemark','setFollowup','setDemoResult','bindAccount','confirmDemoResult','updateField','chooseContact','selectAssigned','openTemporary'],
    AliCtiAdapter:['connect','disconnect','previewOutcall','queryRasr','controlTask','reconcileAvailability'],
    'AliCtiAdapter.agentGroup':['create','update','delete','assignAgent','unassignAgent'],
    AliCtiSeatOperations:['demoConnection','connectionCallbacks','relogin','saveProfile','login','logout','pause','unpause','changeBindTel','changeWorkingMode','prolongWrapup','enterWrapup','completeWrapup','invalidate','manageSeat','refreshState'],
    AliCtiReceiving:['answer','refuse'],
    CloudTaskWorkspace:['addCallerPool','updateCallerPool','removeCallerPool','deleteTask','start','startRepeatPredictive','update','updatePriority','setTimeMode','toggleTimeCondition','changeRetryCount','adjustRetryCount','changeRetryInterval','setRetryLayout','resetRetry','setRetryMode','setRetryTimeType','toggleRetryCode','addRetryRound','removeRetryRound','updateRetryRound','setTenant','selectPlan','setResource','toggleAgent','toggleAllAgents','saveDraft','submit','controlTask','startTask','pauseTask','resumeTask','simulateAvailability','copyTask','pauseForNumber','syncAssignedCustomers','commitDirectImport','recoverDirectImport','saveDemoTask','setCallerNavigation','setCustomerMode','toggleCustomer','clearCustomers','selectFilteredCustomers','refreshIvrList'],
    DccPriorityModel:['ensureDemo','saveRules','push','recordResult','prepareRetry','release','submit'],
    CustomerTasks:['confirmImport','assign','assignSelected','claim','syncCall','releaseUnstartedTask','attachToNewTask','confirmAssignment','acceptTaskDemoResult','commitTaskAttachment','rollbackTaskAttachment','commitImportBatch','rollbackImportBatch','recoverMissingTask'],
    RepeatPredictive:['commitAttachment','rollbackAttachment','releaseTask'],
    CallState:['start','ingest','finish','reconcile'],
    CloudCallRuntime:['sequence','addAudit','touch'],
    CloudCallSync:['begin','refresh','demo'],
    CloudCallRecords:['refreshSync','demoSync','confirmDemo'],
    ScenarioDemo:['runNext','inbound','saveTask','confirmResult','triggerReceiving','receivingEvent','prepare'],
    ScenarioReadiness:['completeTest','markConfigurationCompleted'],
    AccountSeat:['bind','create','persistAgent','finishPendingDisable','submit'],
    OutboundGroups:['create','update','deleteGroup','setMembers','assignAgent','unassignAgent'],
    AliCtiAccounts:['save','setStatus'],
    AliCtiExtensions:['create','update','remove','assign','importCandidates','importExisting'],
    AliCtiNumberPools:['create','update','remove'],
    AliCtiTimeConditions:['create','update','remove'],
    AliCtiQueues:['updateByNumber','saveBinding','saveQueueGroups','createForGroup','createForGroups','updateQueue','verify'],
    AliCtiInbound:['save','setActive','remove','verifyPending'],
    AliCtiSeatImport:['submit','verifyPending'],
    QueueConfig:['save','verify','unbind'],
    CustomerBusiness:['save','saveField','deleteField','setEnabled'],
    CustomerFollowup:['save','saveEditor'],
    SeatEventLog:['record','observeSnapshot'],
    SeatOperationUI:['demoConnection','submit','set','relogin','resume','reconcile','finishWrapup','afterRecordSaved','changeMode'],
    WorkbenchOverview:['stopNew'],
    BusinessConfiguration:['save','toggle','remove'],
    BusinessCategories:['save','toggle','remove'],
    BusinessIssues:['record','handle'],
    CallDataIssues:['recheck'],
    'Pages.agent-center':['createSingle','savePhoneConfig','disable','restore','remove','saveSkill','submitPendingSkills','changeLevel','saveSkillRepair','unassign','retry'],
    'Pages.resource-lines':['isolate','restore','setLocalEnabled'],
    'Pages.inbound-routing':['save','changeActive','remove'],
    'Pages.contact-center-settings':['saveMapping'],
    SeatPhoneConfig:['save'],
    OutboundGroupManagement:['save','remove'],
    AccountTenantForms:['saveAccount','saveTenant'],
    'Pages.account-tenant':['saveMemberEdit','toggleMember','confirmToggleMember','confirmToggleTenant','saveTenant'],
    CustomerDemo:['prepare'],
    AliCtiContractPanel:['savePhone','savePush','applyEvent','receive'],
    AliCtiDemo:['savePreferences','setTranscriptionConditions','saveSeatAsr','seatActive','saveSkills','skillResource','taskCreated','imported'],
    AliCtiNumberImport:['submit'],
    QueueDetail:['save'],
    QueueManagement:['saveAssociation','verify','verifyCurrent','askUnlink'],
    ExtensionManagement:['save'],
    TimeConditionManagement:['save'],
    TenantCallMonitor:['stop','submitManage'],
    CloudResourceRules:['changed'],
    AliCtiTaskUpdate:['submit'],
    NumberPoolManagement:['save'],
    'Pages.alicti-accounts':['changeStatus','confirmStatus','save'],
    'Pages.number-pool-management':['save'],
    'Pages.queue-management':['askUnlink','saveAssociation','verify','verifyCurrent']
  };
  // These create/submit names are pure helpers or page-local authentication.
  // Do not blanket-deny open/set/read methods or application initialization.
  const safeAPIs={AppState:['submitLogin','sendSmsCode','refreshCaptcha','selectDemoProfile','chooseTenant','chooseInstance','chooseManagedTenant','logout'],
    DemoSwitch:['open','enter','loginShortcut'],AliCtiRetry:['create']};
  function mutationMethod(path,key){
    if(safeAPIs[path]?.includes(key))return false;
    if(apiMutations[path]?.includes(key))return true;
    if(['AppState','DemoSwitch','HistorySnapshot'].includes(path))return false;
    return /^(?:save|submit|delete|remove|commit|create|import|upload|publish|placeCall|setStatus)/i.test(key);
  }
  function explicitAction(action){
    const call=/\b((?:window\.)?[A-Za-z_$][\w$]*(?:(?:\.[A-Za-z_$][\w$]*)|(?:\[['"][^'"]+['"]\]))*)\.([A-Za-z_$][\w$]*)\s*\(/g;
    for(const match of action.matchAll(call)){
      const path=match[1].replace(/^window\./,'').replace(/\[['"]([^'"]+)['"]\]/g,'.$1');
      if(!apiMutations[path]?.includes(match[2]))continue;
      if(path==='AppState'&&match[2]==='returnFromConfiguration'&&!/^\s*true\s*[,)]/.test(action.slice(match.index+match[0].length)))continue;
      return true;
    }
    return false;
  }
  // This audited button uses a lexical onclick closure, so replacing the
  // exported CallDataIssues.recheck method alone cannot intercept its write.
  const mutationControlIds=new Set(['call-data-recheck']);
  function viewAction(button){
    const handler=(button.getAttribute('onclick')||'').trim();
    // These exact actions come from the prototype navigation contract. Neither
    // an arbitrary open/set method nor a mixed navigation+mutation is allowed.
    if(/^(?:(?:RouteRuntime\.openPrimary|toggleNavigationGroup|navigateTo)\(\s*(?:'[^']*'|"[^"]*")\s*\)|RouteRuntime\.back\(\s*\))\s*;?$/.test(handler))return true;
    return !handler&&(button.hasAttribute('data-route')||button.hasAttribute('data-group'));
  }
  document.addEventListener('click',event=>{
    const anchor=event.target.closest?.('a[href]');
    if(anchor){
      const raw=anchor.getAttribute('href')||'';
      const url=new URL(raw,location.href);
      const isReturn=anchor.hasAttribute('data-snapshot-return') && returning && url.href===returning.href;
      if(!isReturn&&!inside(raw)){stop(event);return;}
      if(anchor.hasAttribute('download')){stop(event);return;}
      anchor.setAttribute('rel','noopener noreferrer');
    }
    const button=event.target.closest?.('button,input[type="submit"],input[type="button"],[role="button"]')||anchor;
    if(!button||button.hasAttribute('data-snapshot-return'))return;
    if(viewAction(button))return;
    const action=[button.textContent,button.getAttribute('onclick'),button.getAttribute('data-action'),button.id,button.value].join(' ');
    if(mutationControlIds.has(button.id)||explicitAction(action)||(mutating.test(action)&&!loginAction.test(action)))stop(event);
  },true);
  document.addEventListener('submit',event=>stop(event),true);
  for(const type of ['input','change'])document.addEventListener(type,event=>{
    const action=event.target.getAttribute?.('on'+type)||event.target.getAttribute?.('data-action')||'';
    if(explicitAction(action)||(mutating.test(action)&&!loginAction.test(action)))stop(event);
  },true);
  document.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s')stop(event);
  },true);
  // Exported business APIs receive an extra guard, including frozen API objects
  // whose window binding can be replaced with a read-only view of their methods.
  function guardAPIs(){
    function guardObject(api,path){
      if(!api||typeof api!=='object')return api;
      const descriptors=Object.getOwnPropertyDescriptors(api),changes={};
      for(const [key,descriptor] of Object.entries(descriptors)){
        // Preserve getters and data descriptors without invoking getters while
        // discovering APIs. Only explicit nested namespaces are traversed.
        if(!Object.prototype.hasOwnProperty.call(descriptor,'value'))continue;
        const value=descriptor.value,operation=path+'.'+key;
        if(typeof value==='function'&&mutationMethod(path,key)){
          changes[key]=function(...args){
            if(operation==='AppState.returnFromConfiguration'&&args[0]!==true)return Reflect.apply(value,this,args);
            return {ok:false,read_only:true,message,operation};
          };
        }else if(value&&typeof value==='object'&&(path==='Pages'||Object.keys(apiMutations).some(name=>name===operation||name.startsWith(operation+'.')))){
          const guarded=guardObject(value,operation);if(guarded!==value)changes[key]=guarded;
        }
      }
      if(!Object.keys(changes).length)return api;
      if(Object.keys(changes).every(key=>descriptors[key].writable)){
        for(const [key,value] of Object.entries(changes))api[key]=value;
        return api;
      }
      for(const [key,value] of Object.entries(changes))descriptors[key]={...descriptors[key],value};
      const guarded=Object.create(Object.getPrototypeOf(api),descriptors);
      return Object.isFrozen(api)?Object.freeze(guarded):guarded;
    }
    for(const name of Object.keys(window)){
      if(!/^[A-Z]/.test(name))continue;
      try{
        const api=window[name],guarded=guardObject(api,name);if(guarded!==api)window[name]=guarded;
      }catch(_){}
    }
  }
  function banner(){
    guardAPIs();if(document.getElementById('snapshot-readonly-banner'))return;
    const bar=document.createElement('aside');bar.id='snapshot-readonly-banner';bar.setAttribute('role','status');
    bar.style.cssText='position:fixed;left:0;right:0;bottom:0;z-index:2147483647;padding:10px 18px;background:#fff4d7;color:#4f3d15;border-top:1px solid #d7bb6f;display:flex;gap:16px;align-items:center;font:14px system-ui';
    const label=document.createElement('span');label.id='snapshot-readonly-message';label.textContent='历史快照只读 · 登录、导航与查看仅在本页内存中演示';bar.appendChild(label);
    if(returning){const link=document.createElement('a');link.href=returning.href;link.textContent='返回工作版';link.setAttribute('data-snapshot-return','');bar.appendChild(link);}
    document.body.appendChild(bar);
  }
  Object.defineProperty(window,'HistorySnapshot',{value:Object.freeze({read_only:true,storage:'memory-only',mutation_policy:'explicit-business-actions@1',snapshot_id:config.snapshotId,include_interaction_doc:config.includeInteractionDoc===true}),configurable:false});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',banner,{once:true});else banner();
})();
"""


def _strip_current_projection_script(text):
    """Remove only dedicated display tags, leaving all other source bytes alone."""
    offsets=[0]+[m.end() for m in re.finditer('\n',text)]
    class ProjectionTags(HTMLParser):
        def __init__(self):
            super().__init__(convert_charrefs=False);self.start=None;self.ranges=[]
        def position(self):
            line,column=self.getpos();return offsets[line-1]+column
        def handle_starttag(self,tag,attrs):
            if tag=='script' and any(key=='data-project-version-index' for key,_ in attrs):
                self.start=self.position()
        def handle_startendtag(self,tag,attrs):
            if tag=='script' and any(key=='data-project-version-index' for key,_ in attrs):
                start=self.position();self.ranges.append((start,start+len(self.get_starttag_text())))
        def handle_endtag(self,tag):
            if tag=='script' and self.start is not None:
                end=text.find('>',self.position())
                if end<0:raise VersionError('Unclosed public display script')
                self.ranges.append((self.start,end+1));self.start=None
    parser=ProjectionTags();parser.feed(text);parser.close()
    if parser.start is not None:raise VersionError('Unclosed public display script')
    for start,end in reversed(parser.ranges):text=text[:start]+text[end:]
    return text


def _snapshot_html(raw, path, prototype, project_root, return_working_href, snapshot_id, include_interaction_doc=False):
    text=raw.decode('utf-8')
    text=_strip_current_projection_script(text)
    # A supplied base or refresh must not redirect the snapshot before guards run.
    text=re.sub(r'<base\b[^>]*>','',text,flags=re.I)
    text=re.sub(r'<meta\b(?=[^>]*http-equiv\s*=\s*[\'\"]?refresh\b)[^>]*>','',text,flags=re.I)
    config={'rootHref':os.path.relpath(prototype,path.parent).replace(os.sep,'/')+'/',
            'snapshotId':snapshot_id,'returnHref':None,'includeInteractionDoc':bool(include_interaction_doc)}
    if return_working_href:
        parts=urlsplit(return_working_href);relative=unquote(parts.path)
        target=_plain_path(project_root/_relative_file(relative))
        if not target.is_relative_to(project_root):raise VersionError('Return link must stay in the same project')
        config['returnHref']=quote(os.path.relpath(target,path.parent).replace(os.sep,'/'),safe='/')
        if parts.query:config['returnHref']+='?'+parts.query
        if parts.fragment:config['returnHref']+='#'+parts.fragment
    script=READONLY_ADAPTER.replace('__SNAPSHOT_CONFIG__',json.dumps(config,ensure_ascii=False).replace('</','<\\/'))
    policy="default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; worker-src 'none'; manifest-src 'none'"
    injection='<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="'+policy+'">\n<script data-history-readonly="true">'+script+'</script>\n'
    if re.search(r'<head\b[^>]*>',text,re.I):text=re.sub(r'(<head\b[^>]*>)',lambda m:m.group(1)+'\n'+injection,text,count=1,flags=re.I)
    elif re.search(r'<html\b[^>]*>',text,re.I):text=re.sub(r'(<html\b[^>]*>)',lambda m:m.group(1)+'<head>'+injection+'</head>',text,count=1,flags=re.I)
    else:text='<head>'+injection+'</head>\n'+text
    return text.encode('utf-8')


def export_static_view(root, destination, project_root, snapshot_id, return_working_href=None, source_identity=None):
    """Only prepares a view; callers still must validate/register its full manifest."""
    root=_plain_path(root);destination=_plain_path(destination);project_root=_plain_path(project_root)
    if destination==root or root in destination.parents:raise VersionError('Static snapshot must be outside its source workspace')
    _safe_segment(snapshot_id,'snapshot ID')
    if not (root/'index.html').is_file():return None
    if return_working_href is not None and not _public_href(return_working_href):raise VersionError('Unsafe return working href')
    workflow_path=root/'config/workflow.json'
    workflow={}
    if workflow_path.exists():
        _plain_path(workflow_path)
        try:workflow=read(workflow_path)
        except json.JSONDecodeError as exc:raise VersionError('Invalid workflow configuration for static snapshot') from exc
    iteration=workflow.get('currentIteration',{}) if isinstance(workflow,dict) else {}
    requested=iteration.get('requestedDeliverables',{}) if isinstance(iteration,dict) else {}
    include_interaction_doc=isinstance(requested,dict) and requested.get('interactionDoc') is True and (root/'docs/interaction.html').is_file()
    prototype=destination/'prototype'
    if prototype.exists():raise VersionError('Static snapshot already exists; no overwrite')
    prototype.mkdir(parents=True)
    sources=[]
    for base,dirs,files in os.walk(root,followlinks=False):
        dirs[:]=sorted(d for d in dirs if d not in SNAPSHOT_EXCLUDE_PARTS and not d.startswith('.') and not d.startswith('evidence-'))
        if any((Path(base)/d).is_symlink() for d in dirs):raise VersionError('Symlink static directory forbidden')
        for name in sorted(files):
            path=Path(base)/name;rel=path.relative_to(root).as_posix()
            if name.startswith('.') or name in SNAPSHOT_PRIVATE_FILENAMES or rel in SNAPSHOT_EXCLUDE_FILES or path.suffix.lower() not in STATIC_SUFFIXES:continue
            _plain_path(path)
            raw=path.read_bytes();target=prototype/rel;target.parent.mkdir(parents=True,exist_ok=True)
            original_sha=hashlib.sha256(raw).hexdigest()
            source_copy=None
            if path.suffix.lower() in ('.html','.htm'):
                source_copy='.source-html/'+rel+'.source.txt'
                original=prototype/source_copy;original.parent.mkdir(parents=True,exist_ok=True);original.write_bytes(raw)
                raw=_snapshot_html(raw,target,prototype,project_root,return_working_href,snapshot_id,include_interaction_doc)
            target.write_bytes(raw)
            item={'path':rel,'source_sha256':original_sha,'snapshot_sha256':hashlib.sha256(raw).hexdigest(),
                  'adapted_read_only':path.suffix.lower() in ('.html','.htm')}
            if source_copy:item.update({'source_copy_path':source_copy,'source_copy_sha256':original_sha,'source_copy_media_type':'text/plain'})
            sources.append(item)
    if not (prototype/'index.html').is_file():raise VersionError('Static snapshot entrypoint unavailable')
    write(prototype/'source.txt',{'schema':'prototype-snapshot-source@1','snapshot_id':snapshot_id,
                               'source_identity':_public_text(source_identity or 'static source; approval not claimed by view generator'),
                               'storage':'memory-only','read_only_adapter':'embedded-v2','mutation_policy':'explicit-business-actions@1','files':sources})
    return 'prototype/index.html'


def freeze_snapshot(destination):
    """Readable protection against accidental edits, not an OS immutability claim."""
    destination=_plain_path(destination)
    if not destination.is_dir():raise VersionError('Snapshot directory required')
    files=[];directories=[]
    for base,dirs,names in os.walk(destination,followlinks=False):
        directories.append(_plain_path(base))
        for name in dirs:_plain_path(Path(base)/name)
        for name in names:
            path=_plain_path(Path(base)/name)
            if not path.is_file():raise VersionError('Only regular snapshot files may be frozen')
            files.append(path)
    for path in files:path.chmod(0o444)
    for path in reversed(directories):path.chmod(0o555)
    return destination


def export_product(root, out=None, project_root=None, return_working_href=None):
    if (out is None)==(project_root is None):raise VersionError('Choose exactly one of output directory or project root')
    standard=project_root is not None
    root=_plain_path(root) if standard else Path(root).resolve();out=delivery_destination(root,project_root,'product') if standard else Path(out).resolve()
    if out.exists() or out==root or root in out.parents:raise VersionError('New independent output directory required')
    ref=reference(root);b=validate_reference(ref,'product')
    if b['root']!=str(root):raise VersionError('Product workspace does not own current receipt')
    if (root/'tools/loop_preflight.py').is_file():
        imported=read(root/'config/requirement-analysis.json')
        upstream=imported.get('projectVersion')
        if not upstream or (upstream['project_id'],upstream['version_id'])!=(ref['project_id'],ref['version_id']):raise VersionError('Prototype lacks matching versioned upstream; regenerate/import frozen package in a controlled iteration')
        validate_reference(upstream,'analysis')
        if upstream['snapshot_id']!=b['upstream_snapshot_id']:raise VersionError('Prototype imported a different upstream snapshot')
        import subprocess
        result=subprocess.run([sys.executable,'-B',str(root/'tools/loop_preflight.py'),str(root),'--stage','final'],capture_output=True,text=True)
        if result.returncode:raise VersionError('Prototype final gate failed before product handoff: '+result.stdout+result.stderr)
    data=read(root/'product-input.json')
    if not isinstance(data.get('features'),list) or not isinstance(data.get('acceptance'),list):raise VersionError('Explicit reviewed product-input.json features/acceptance required')
    # The proposal payload must be part of the approved root, not provided after approval.
    raw=(root/'product-input.json').read_bytes()
    out.mkdir(parents=True)
    (out/'product-input.json').write_bytes(raw)
    write(out/'project-handoff.json',{'contract':'product-to-development@1','project_version':{**ref,'snapshot_id':b['snapshot_id']},'product_sha256':hashlib.sha256(raw).hexdigest(),'upstream_snapshot_id':b['upstream_snapshot_id'],'change_ids':[c['change_id'] for c in version(read(ref['registry']),ref['version_id'])['changes']]})
    if standard:
        if return_working_href is None:
            return_working_href=version(read(ref['registry']),ref['version_id']).get('public_view',{}).get('working_href')
        entrypoint=export_static_view(root,out,_plain_path(project_root),b['snapshot_id'],return_working_href,
                                    'approved product receipt '+b['snapshot_id']) or 'product-input.json'
        handoff=read(out/'project-handoff.json')
        handoff.update({'artifact_snapshot_id':b['snapshot_id'],'view_entrypoint':entrypoint})
        write(out/'project-handoff.json',handoff)
        manifest={'status':'approved_product_snapshot','files':[
            {'path':p.relative_to(out).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
            for p in sorted(out.rglob('*')) if p.is_file()]}
        write(out/'manifest.json',manifest)
        record_artifact(root,'product',out,manifest,entrypoint=entrypoint,kind='product-handoff')
        freeze_snapshot(out)
    return {'out':str(out),'snapshot_id':b['snapshot_id']}


def validate_product_artifact(source, handoff=None):
    """Verify a registered standard product tree, even after copying the package.

    Legacy --out handoffs return None and make no static-view integrity claim.
    """
    try:
        source=_plain_path(source)
        if not source.is_dir():raise VersionError('Product artifact directory required')
        path=_plain_path(source/'project-handoff.json');actual=read(path)
        if not isinstance(actual,dict):raise VersionError('Product handoff must be an object')
        if handoff is not None and handoff!=actual:raise VersionError('Supplied product handoff differs from package bytes')
        sid=actual.get('artifact_snapshot_id')
        if sid is None:
            manifest_path=source/'manifest.json'
            standard_manifest=manifest_path.is_file() and read(_plain_path(manifest_path)).get('status')=='approved_product_snapshot'
            if 'view_entrypoint' in actual or standard_manifest:
                raise VersionError('Standard product artifact metadata missing; downgrade to legacy forbidden')
            return None
        _safe_segment(sid,'product artifact snapshot ID')
        ref=actual['project_version'];_plain_path(ref['registry'])
        receipt=validate_reference(ref,'product')
        if sid!=receipt['snapshot_id'] or sid!=ref.get('snapshot_id'):
            raise VersionError('Product artifact snapshot differs from current approved receipt')
        data=read(ref['registry']);v=version(data,ref['version_id'])
        handoff_sha=hashlib.sha256(path.read_bytes()).hexdigest()
        matches=[a for a in v.get('artifacts',[]) if a.get('stage')=='product' and a.get('snapshot_id')==sid
                 and a.get('kind')=='product-handoff' and a.get('files',{}).get('project-handoff.json')==handoff_sha]
        if len(matches)!=1:raise VersionError('Product handoff is not one uniquely registered approved artifact')
        record=matches[0];entrypoint=_relative_file(actual['view_entrypoint']).as_posix()
        if record.get('entrypoint')!=entrypoint or entrypoint not in record['files']:
            raise VersionError('Product view entrypoint differs from registered artifact')
        _verified_files(source,{'files':[{'path':rel,'sha256':sha} for rel,sha in record['files'].items()]})
        manifest=read(_plain_path(source/'manifest.json'))
        if digest(manifest)!=record['manifest_sha256']:
            raise VersionError('Product manifest differs from registered artifact')
        return record
    except VersionError:raise
    except (OSError,ValueError,KeyError,TypeError,AttributeError) as error:
        raise VersionError('Product artifact unavailable or malformed: '+str(error)) from error


def register_change(root, change_id, stage, summary, source, affects):
    ref=reference(root)
    if not ref:return
    if not change_id or not summary.strip():raise VersionError('Versioned changes require explicit change ID/reason')
    with transaction(ref['registry']) as data:
        if data['project_id']!=ref['project_id']:raise VersionError('Wrong project identity')
        v=version(data,ref['version_id'])
        old=next((c for c in v['changes'] if c['change_id']==change_id),None)
        record={'change_id':change_id,'stage':stage,'summary':summary,'source':source,'status':'accepted','affects':affects}
        if old:
            if any(old[k]!=val for k,val in record.items()):raise VersionError('Conflicting existing change ID')
            return
        v['changes'].append({**record,'at':now()});v['revision']+=1
        for st,b in list(v['stages'].items()):
            if STAGES.index(st)>=STAGES.index(stage):revoke(v,st,'change '+change_id)
            else:b['revision']=v['revision']
        product_root=v.get('workspaces',{}).get('product')
        if product_root:sync_change_log(product_root,data,ref['version_id'])


def publish_delivery(ref, manifest):
    if manifest.get('status')!='ready_for_development':return
    with transaction(ref['registry']) as data:
        b=check(data,ref['version_id'],'development',ref['snapshot_id'])
        version(data,ref['version_id']).setdefault('deliveries',{})[digest(manifest)]={'snapshot_id':b['snapshot_id'],'at':now()}


def _check_consumed_product(receipt, execution_ref):
    """The approved IR identifies the actual source consumed by development."""
    try:
        owner=_plain_path(receipt['root']);ir_path=_plain_path(owner/'product-ir.json')
        if not ir_path.exists():
            v=version(read(execution_ref['registry']),execution_ref['version_id'])
            if any(a.get('stage')=='development' and a.get('snapshot_id')==receipt['snapshot_id']
                   and a.get('kind')=='development-package' for a in v.get('artifacts',[])):
                raise VersionError('Registered development package requires its approved product IR')
            return None  # Existing synthetic/basic receipts predate consumed-source IR.
        ir=read(ir_path);source=ir.get('source')
        if not isinstance(source,dict) or not isinstance(source.get('root'),str) or not Path(source['root']).is_absolute():
            raise VersionError('Approved product IR requires an explicit absolute source root')
        source_root=_plain_path(source['root'])
        if not source_root.is_dir():raise VersionError('Consumed product source unavailable; execution forbidden')
        files=source.get('files')
        if not isinstance(files,list) or not files:raise VersionError('Approved product IR requires consumed source file records')
        seen=set()
        for item in files:
            if not isinstance(item,dict):raise VersionError('Invalid consumed product source record')
            rel=_relative_file(item.get('path'));name=rel.as_posix();sha=item.get('sha256')
            if ':' in name or name in seen or not isinstance(sha,str) or not re.fullmatch('[0-9a-f]{64}',sha):
                raise VersionError('Unsafe/duplicate consumed product source record')
            seen.add(name);path=_plain_path(source_root/rel)
            if not path.is_relative_to(source_root) or not path.is_file():raise VersionError('Consumed product source unavailable: '+name)
            raw=path.read_bytes()
            if hashlib.sha256(raw).hexdigest()!=sha:raise VersionError('Consumed product source content changed: '+name)
            if 'bytes' in item and (not isinstance(item['bytes'],int) or isinstance(item['bytes'],bool) or item['bytes']!=len(raw)):
                raise VersionError('Consumed product source byte count changed: '+name)
        if source.get('fingerprint') and source['fingerprint']!=digest(files):
            raise VersionError('Consumed product source records do not match approved fingerprint')
        if source.get('profile')=='reviewed':
            handoff=read(_plain_path(source_root/'project-handoff.json'));product_ref=handoff['project_version']
            if any(product_ref.get(k)!=execution_ref.get(k) for k in ('project_id','version_id')) or \
               _plain_path(product_ref['registry'])!=_plain_path(execution_ref['registry']) or \
               product_ref.get('snapshot_id')!=receipt.get('upstream_snapshot_id'):
                raise VersionError('Consumed reviewed product belongs to another project/version/upstream receipt')
            declared=ir.get('project_version')
            if not isinstance(declared,dict) or any(declared.get(k)!=product_ref.get(k) for k in ('project_id','version_id','snapshot_id')) or \
               _plain_path(declared['registry'])!=_plain_path(product_ref['registry']):
                raise VersionError('Approved product IR reference differs from consumed reviewed product')
            artifact=validate_product_artifact(source_root,handoff)
            descriptor=source.get('prototype_snapshot')
            if artifact:
                if not isinstance(descriptor,dict) or any(descriptor.get(k)!=artifact.get(k) for k in ('snapshot_id','manifest_sha256','entrypoint')):
                    raise VersionError('Consumed product snapshot differs from approved IR descriptor')
                if not set(artifact['files']).issubset(seen):raise VersionError('Approved IR omits registered product snapshot files')
            elif descriptor is not None:
                raise VersionError('Legacy product handoff cannot claim a registered prototype snapshot')
        return source
    except VersionError:raise
    except (OSError,ValueError,KeyError,TypeError,AttributeError) as error:
        raise VersionError('Consumed product source unavailable or malformed: '+str(error)) from error


def check_package(root):
    root=_plain_path(root);ref=read(_plain_path(root/'execution-authority.json'))
    if ref.get('stage')!='development':raise VersionError('Wrong execution stage')
    receipt=validate_reference(ref,'development')
    _check_consumed_product(receipt,ref)
    manifest=read(root/'manifest.json')
    if manifest.get('status')!='ready_for_development':raise VersionError('Only reviewed development package may execute')
    delivery=version(read(ref['registry']),ref['version_id']).get('deliveries',{}).get(digest(manifest))
    if not delivery or delivery['snapshot_id']!=ref['snapshot_id']:raise VersionError('Package manifest is not a registered approved delivery')
    if not any(item.get('path')=='execution-authority.json' for item in manifest['files']):raise VersionError('Missing hashed execution authority')
    for item in manifest['files']:
        rel=Path(item['path'])
        if not str(rel) or rel.is_absolute() or '..' in rel.parts:raise VersionError('Unsafe package path')
        p=root/rel
        if not p.resolve().is_relative_to(root) or p.is_symlink() or hashlib.sha256(p.read_bytes()).hexdigest()!=item['sha256']:raise VersionError('Package content changed: '+str(rel))
    return {'status':'current','project_id':ref['project_id'],'version_id':ref['version_id'],'snapshot_id':ref['snapshot_id']}


def migration_preview(root,registry,vid):
    root=Path(root).resolve();data=read(registry);version(data,vid)
    log=root/'memory/change-log.md'
    return {'action':'attach-existing-workspace','project_id':data['project_id'],'version_id':vid,
            'root':str(root),'legacy_change_log':{'path':str(log),'sha256':hashlib.sha256(log.read_bytes()).hexdigest()} if log.is_file() else None,
            'approval_migration':'none; old verification and approvals are not promoted',
            'apply_required':True}


def migrate_attach(root,registry,vid):
    preview=migration_preview(root,registry,vid)
    old=reference(root)
    if old:return attach(root,registry,vid)
    log=preview['legacy_change_log']
    if log:
        backup=Path(registry).resolve().parent/'.version-backups'/uuid.uuid4().hex/'change-log.md'
        backup.parent.mkdir(parents=True);shutil.copy2(log['path'],backup)
        with transaction(registry) as data:
            v=version(data,vid)
            v.setdefault('legacy_sources',[]).append({**log,'backup':str(backup),'imported_at':now()})
    return attach(root,registry,vid)


def cli():
 p=argparse.ArgumentParser(description=__doc__);s=p.add_subparsers(dest='command',required=True)
 for cmd in ('init','new-version','change','status'):
  q=s.add_parser(cmd);q.add_argument('registry');q.add_argument('--version-id',required=cmd!='status')
  if cmd=='init':q.add_argument('--project-id',required=True);q.add_argument('--label',required=True)
  if cmd=='new-version':q.add_argument('--label',required=True);q.add_argument('--from-version')
  if cmd=='change':
   q.add_argument('--change-id',required=True);q.add_argument('--stage',choices=STAGES,required=True);q.add_argument('--summary',required=True);q.add_argument('--source',required=True);q.add_argument('--status',choices=('proposed','accepted','implemented','rejected'),default='accepted');q.add_argument('--affects',nargs='+',default=[])
 q=s.add_parser('resolve-change');q.add_argument('registry');q.add_argument('--version-id',required=True);q.add_argument('--change-id',required=True);q.add_argument('--status',choices=('accepted','implemented','rejected'),required=True);q.add_argument('--note',required=True)
 q=s.add_parser('export-product');q.add_argument('root');target=q.add_mutually_exclusive_group(required=True);target.add_argument('--out');target.add_argument('--project-root');q.add_argument('--return-working-href')
 q=s.add_parser('layout');q.add_argument('root');q.add_argument('--project-root',required=True);q.add_argument('--stage',choices=STAGES,required=True);q.add_argument('--snapshot-id')
 q=s.add_parser('export-index');q.add_argument('registry');q.add_argument('--project-root',required=True);q.add_argument('--current-version-id')
 q=s.add_parser('check-package');q.add_argument('root')
 for cmd in ('attach','bind','approve','check'):
  q=s.add_parser(cmd);q.add_argument('root')
  if cmd=='attach':q.add_argument('--registry',required=True);q.add_argument('--version-id',required=True);q.add_argument('--apply',action='store_true')
  else:q.add_argument('--stage',choices=STAGES,required=True)
  if cmd=='approve':q.add_argument('--role',required=True);q.add_argument('--reviewer',required=True);q.add_argument('--evidence',required=True);q.add_argument('--note',required=True)
 a=p.parse_args()
 try:
  if a.command=='init':
   path=Path(a.registry)
   if path.exists():raise VersionError('Ledger exists; no overwrite')
   # exclusive creation prevents a second initialization from replacing data
   data={'schema_version':'1.0','project_id':a.project_id,'versions':{a.version_id:{'label':a.label,'revision':0,'changes':[],'stages':{}}}}
   _labels(data)
   path.parent.mkdir(parents=True,exist_ok=True)
   with path.open('x',encoding='utf-8') as f:json.dump(data,f,ensure_ascii=False,indent=2)
   result=data
  elif a.command=='status':result=read(a.registry)
  elif a.command=='resolve-change':
   with transaction(a.registry) as data:
    v=version(data,a.version_id);c=next((c for c in v['changes'] if c['change_id']==a.change_id),None)
    if not c:raise VersionError('Unknown change ID')
    if not a.note.strip():raise VersionError('Decision evidence/note required')
    old=c['status']
    if old==a.status:result=data
    else:
     if old=='rejected':raise VersionError('Rejected change is historical; append a new linked change')
     c.setdefault('events',[]).append({'from':old,'to':a.status,'note':a.note,'at':now()});c['status']=a.status
     if old=='proposed' and a.status in ('accepted','implemented'):
      v['revision']+=1
      for stage,b in list(v['stages'].items()):
       if STAGES.index(stage)>=STAGES.index(c['stage']):revoke(v,stage,'change accepted '+a.change_id)
       else:b['revision']=v['revision']
     product_root=v.get('workspaces',{}).get('product')
     if product_root:sync_change_log(product_root,data,a.version_id)
     result=data
  elif a.command in ('new-version','change'):
   with transaction(a.registry) as data:
    if a.command=='new-version':
     if a.version_id in data['versions']:raise VersionError('Version exists')
     if a.from_version:version(data,a.from_version)
     data['versions'][a.version_id]={'label':a.label,'from_version':a.from_version,'revision':0,'changes':[],'stages':{}}
     _labels(data)
    else:
     v=version(data,a.version_id)
     record={'change_id':a.change_id,'stage':a.stage,'summary':a.summary,'source':a.source,'status':a.status,'affects':a.affects}
     old=next((c for c in v['changes'] if c['change_id']==a.change_id),None)
     if old:
      if any(old[k]!=val for k,val in record.items()):raise VersionError('Conflicting change ID; append a new linked change')
     else:
      v['changes'].append({**record,'at':now()})
      if a.status in ('accepted','implemented'):
       v['revision']+=1
       # Advance unaffected upstream receipts; all affected/downstream receipts revoked.
       for stage,b in list(v['stages'].items()):
        if STAGES.index(stage)>=STAGES.index(a.stage):revoke(v,stage,'change '+a.change_id)
        else:b['revision']=v['revision']
    product_root=version(data,a.version_id).get('workspaces',{}).get('product')
    if product_root:sync_change_log(product_root,data,a.version_id)
    result=data
  elif a.command=='export-product':result=export_product(a.root,a.out,a.project_root,a.return_working_href)
  elif a.command=='layout':result=layout_preview(a.root,a.project_root,a.stage,a.snapshot_id)
  elif a.command=='export-index':result=publish_version_index(a.registry,a.project_root,a.current_version_id)
  elif a.command=='check-package':result=check_package(a.root)
  elif a.command=='attach':result=migrate_attach(a.root,a.registry,a.version_id) if a.apply else migration_preview(a.root,a.registry,a.version_id)
  elif a.command=='bind':result=bind(a.root,a.stage)
  elif a.command=='approve':result=approve(a.root,a.stage,a.role,a.reviewer,a.evidence,a.note)
  else:result=validate_reference(reference(a.root),a.stage)
  print(json.dumps(result,ensure_ascii=False,indent=2));return 0
 except (VersionError,OSError,ValueError,KeyError,TypeError) as e:print('ERROR: '+str(e),file=sys.stderr);return 2
if __name__=='__main__':sys.exit(cli())
