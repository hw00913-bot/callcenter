#!/usr/bin/env python3
"""Project-local PlantUML glyph and canonical routing backend. Source JSON stays authoritative; rendering never writes state."""
from __future__ import annotations
from pathlib import Path
from collections import defaultdict,Counter
from copy import deepcopy
import sys,re,json,subprocess,xml.etree.ElementTree as ET,hashlib,math,types,argparse,base64,os,shutil,tempfile
MODULE_DIR=Path(__file__).resolve().parent
SKILL_SCRIPT_DIR=Path(os.environ.get('CODEX_HOME',str(Path.home()/'.codex')))/'skills'/'requirement-analysis-loop'/'scripts'
sys.path.insert(0,str(SKILL_SCRIPT_DIR))
sys.path.insert(0,str(MODULE_DIR))
from plantuml_renderer import _ActivityCompiler,_safe_text,_edge_label,_clean_svg,resolve_plantuml_runtime,LANE_COLORS,PlantUMLRenderError
from canonical_glyph_ports_20261012 import polygon_outline,rounded_rect_outline,polygon_port,rounded_rect_port,on_boundary,outline_contains,port_offsets
from swimlane_model import inspect_swimlane

NS='http://www.w3.org/2000/svg';XL='http://www.w3.org/1999/xlink';ET.register_namespace('',NS)
BACKEND='plantuml-glyph-canonical-routing-v1'
ID_PATTERN=re.compile(r'^[A-Za-z][A-Za-z0-9_-]{0,80}$')
BBOX_METHOD='actual-primitives-and-complete-font-union'
_RUNTIME_INFO={}
def safe_id(value):
 value=str(value)
 if not ID_PATTERN.fullmatch(value):raise CandidateError('invalid controlled anchor id')
 return value
def anchor_markup(anchor,label):return f'[[#{safe_id(anchor)} {label}]]'
class CandidateError(RuntimeError):pass

def tag(e):return e.tag.rsplit('}',1)[-1]
def f(e,k,d=0):return float(e.get(k,d))
def fmt(v):return format(float(v),'.9f').rstrip('0').rstrip('.') or '0'
def pt(p):return ','.join(fmt(v) for v in p)
def poly_points(e):
 p=[float(x) for x in re.findall(r'-?\d+(?:\.\d+)?',e.get('points',''))];return list(zip(p[::2],p[1::2]))
def ebox(e):
 k=tag(e)
 if k=='rect':return [f(e,'x'),f(e,'y'),f(e,'x')+f(e,'width'),f(e,'y')+f(e,'height')]
 if k=='ellipse':return [f(e,'cx')-f(e,'rx'),f(e,'cy')-f(e,'ry'),f(e,'cx')+f(e,'rx'),f(e,'cy')+f(e,'ry')]
 if k=='text':
  if e.get('textLength') is None or e.get('font-size') is None:raise CandidateError('text metrics absent; exact local font measurement required')
  size=f(e,'font-size');return [f(e,'x'),f(e,'y')-1.05*size,f(e,'x')+f(e,'textLength'),f(e,'y')+.25*size]
 if k in ('polygon','polyline'):
  pp=poly_points(e);return [min(x for x,y in pp),min(y for x,y in pp),max(x for x,y in pp),max(y for x,y in pp)]
 if k=='line':return [min(f(e,'x1'),f(e,'x2')),min(f(e,'y1'),f(e,'y2')),max(f(e,'x1'),f(e,'x2')),max(f(e,'y1'),f(e,'y2'))]
 raise CandidateError('unsupported glyph primitive '+k)
def union(boxes):
 boxes=list(boxes)
 return [min(x[0] for x in boxes),min(x[1] for x in boxes),max(x[2] for x in boxes),max(x[3] for x in boxes)]
def contains(a,b,tol=.02):return a[0]-tol<=b[0] and b[2]<=a[2]+tol and a[1]-tol<=b[1] and b[3]<=a[3]+tol

def simplify(points):
 out=[]
 for p in points:
  if out and math.dist(out[-1],p)<1e-7:continue
  out.append(tuple(p))
  while len(out)>2:
   a,b,c=out[-3:];vx,vy=b[0]-a[0],b[1]-a[1];wx,wy=c[0]-b[0],c[1]-b[1]
   if abs(vx*wy-vy*wx)<1e-8 and vx*wx+vy*wy>0:out.pop(-2)
   else:break
 return out

class CompleteAnchorCompiler(_ActivityCompiler):
 def __init__(self,detail):
  super().__init__(detail);self.prefix='sc_'+safe_id(detail['id']);self.edge_indices={id(e):i for i,e in enumerate(self.model['edges'])};self.empty_counter=0
 def _emit_activity(self,node_id,node):
  label=_safe_text(node.get('label',node_id));stereotype=self._node_stereotype(node_id,node)
  self.lines.append(':'+anchor_markup(self.prefix+'_node_'+safe_id(node_id),label)+';'+(f' <<{stereotype}>>' if stereotype else ''))
 def _label(self,edge):return anchor_markup(self.prefix+'_edge_'+str(self.edge_indices[id(edge)]).zfill(3),_edge_label(edge))
 def _emit_decision(self,node_id,node,outer_stop,active):
  edges=self.outgoing[node_id];targets=[str(e['to']) for e in edges];join=self._nearest_join(targets)
  question=anchor_markup(self.prefix+'_node_'+safe_id(node_id),_safe_text(node.get('label',node_id)))
  def branch(target):
   if target==join:self._emit_empty_branch()
   else:self._emit_path(target,join,active)
  if len(edges)==2:
   self.lines.append(f'if ({question}) then ({self._label(edges[0])})');branch(targets[0]);self.lines.append(f'else ({self._label(edges[1])})');branch(targets[1]);self.lines.append('endif')
  else:
   self.lines.append(f'switch ({question})')
   for edge,target in zip(edges,targets):self.lines.append(f'case ({self._label(edge)})');branch(target)
   self.lines.append('endswitch')
  if join and join!=outer_stop:self._emit_path(join,outer_stop,active)
 def _emit_empty_branch(self):
  self.empty_counter+=1;self.lines.append(f':[[#{self.prefix}_synthetic_empty_{self.empty_counter} 直接汇合]]; <<end_label>>')
 def _emit_path(self,node_id,stop_at,active):
  if node_id==stop_at:return
  if node_id in active:raise PlantUMLRenderError('cycle '+node_id)
  if node_id in self.emitted:raise PlantUMLRenderError('non-structured join '+node_id)
  node=self.nodes[node_id];nt=str(node['type']);self.emitted.add(node_id);branch_active=set(active)|{node_id};self._select_lane(node)
  if nt=='start':self.lines.append('start');self._emit_activity(node_id,node)
  elif nt=='end':self._emit_activity(node_id,node);self.lines.append('stop');return
  elif nt=='decision':self._emit_decision(node_id,node,stop_at,branch_active);return
  else:self._emit_activity(node_id,node)
  edges=self.outgoing.get(node_id,[])
  if len(edges)!=1:raise PlantUMLRenderError('nonterminal path edge count '+node_id)
  edge=edges[0]
  if edge.get('label') or edge.get('path_id'):self.lines.append(f'-> {self._label(edge)};')
  self._emit_path(str(edge['to']),stop_at,branch_active)
 def compile(self):
  src=super().compile().replace('!pragma useVerticalIf on','!pragma useVerticalIf on\nskinparam hyperlinkUnderline false')
  for lane in self.model['lanes']:
   lid=str(lane['id']);name=_safe_text(lane.get('name',lid));old=f'|{LANE_COLORS.get(str(lane.get("kind","system")),"#F7F8FA")}|{self.lane_aliases[lid]}| {name}'
   new=old[:-len(name)]+f'[[#{self.prefix}_lane_{safe_id(lid)} {name}]]'
   if src.count(old)!=1:raise CandidateError('lane declaration not uniquely located')
   src=src.replace(old,new)
  return src

def runtime_provenance(runtime):
 key=tuple(runtime.command)
 if key in _RUNTIME_INFO:return _RUNTIME_INFO[key]
 proc=subprocess.run([*runtime.command,'-version'],stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=15,check=True)
 version=proc.stdout.decode(errors='replace').strip()
 java=None
 executable=Path(runtime.command[0])
 if executable.name.lower() in ('java','java.exe'):java=str(executable)
 else:
  try:
   wrapper=executable.read_text();match=re.search(r'exec\s+"([^"\n]+/java)"',wrapper)
   if match:java=match.group(1)
  except (OSError,UnicodeError):pass
 java_version_match=re.search(r'Java Version:\s*([^\s]+)',version)
 java_output=None
 if java:
  jproc=subprocess.run([java,'-version'],stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=15,check=True);java_output=(jproc.stdout+jproc.stderr).decode(errors='replace').strip()
  if java_version_match is None:java_version_match=re.search(r'(?:openjdk|java) version \"([^\"]+)\"',java_output)
 info={'command':list(runtime.command),'description':runtime.description,'plantuml_version_output':version,'java_version':java_version_match.group(1) if java_version_match else None,'same_java_executable':java,'same_java_version_output':java_output,'renderer_module_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'port_helper_sha256':hashlib.sha256((MODULE_DIR/'canonical_glyph_ports_20261012.py').read_bytes()).hexdigest()}
 _RUNTIME_INFO[key]=info;return info

def render_anchor_svg(detail,out=None):
 compiler=CompleteAnchorCompiler(detail);source=compiler.compile();runtime=resolve_plantuml_runtime();info=runtime_provenance(runtime)
 proc=subprocess.run([*runtime.command,'-charset','UTF-8','-tsvg','-pipe'],input=source.encode(),stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=runtime.timeout_seconds)
 if proc.returncode:raise CandidateError('local PlantUML error '+proc.stderr.decode()[:600])
 immutable_raw=proc.stdout.decode();clean=_clean_svg(immutable_raw,detail);r=ET.fromstring(clean)
 if any(not e.get('{'+XL+'}href',e.get('href','')).startswith('#') for e in r.iter() if tag(e)=='a'):raise CandidateError('external link')
 r.attrib.pop('data-business-svg-sha256',None);r.set('data-plantuml-render','diagnostic-only');r.set('data-diagnostic-status','candidate-glyph-input-not-formal')
 original_anchor=ET.tostring(r,encoding='unicode')
 if out is not None:out.with_suffix('.anchor.svg').write_text(original_anchor)
 return r,compiler,{'raw_engine_svg':immutable_raw,'raw_engine_sha256':hashlib.sha256(immutable_raw.encode()).hexdigest(),'original_anchor_svg':original_anchor,'compiled_source':source,'runtime':info}

def source_text_inheritance(root):
 parents={child:parent for parent in root.iter() for child in parent}
 seen={key:set() for key in ('font-family','lengthAdjust')}
 for text in root.iter():
  if tag(text)!='text':continue
  for key in seen:
   cur=text;value=None
   while cur is not None:
    if cur.get(key) is not None:value=cur.get(key);break
    cur=parents.get(cur)
   if value is None:raise CandidateError('actual engine text inheritance absent '+key)
   seen[key].add(value)
 if any(len(values)!=1 for values in seen.values()):raise CandidateError('mixed effective text inheritance needs per-glyph preservation')
 return {key:next(iter(values)) for key,values in seen.items()}

def ensure_text_metrics(root,runtime_info):
 evidence=[]
 linked_text_ids={id(t) for a in root.iter() if tag(a)=='a' for t in a.iter() if tag(t)=='text'}
 for t in root.iter():
  if tag(t)!='text' or t.get('textLength') is not None or id(t) not in linked_text_ids:continue
  if t.get('font-size') is None:raise CandidateError('actual engine text lacks font-size')
  fs=f(t,'font-size');style=(1 if t.get('font-weight') in ('bold','700') else 0)|(2 if t.get('font-style')=='italic' else 0)
  if fs!=int(fs):raise CandidateError('fractional font needs exact unrounded measurer')
  content=''.join(t.itertext());token=base64.b64encode(content.encode()).decode()
  java=runtime_info.get('same_java_executable');helper=str(MODULE_DIR/'PlantUMLTextAdvance_20261012.java')
  if not java or not Path(java).is_file():raise CandidateError('same PlantUML JVM not unambiguously resolved for missing text metric')
  measured=json.loads(subprocess.run([java,'-Djava.awt.headless=true',helper,'SansSerif',str(int(fs)),str(style),token],stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True,timeout=20).stdout)
  if runtime_info.get('java_version') and measured['javaVersion']!=runtime_info['java_version']:raise CandidateError('font JVM version differs from local PlantUML')
  if measured['canDisplayUpTo']!=-1 or not math.isfinite(measured['width']) or measured['width']<=0:raise CandidateError('actual JVM cannot measure complete glyph')
  t.set('textLength',fmt(measured['width']));t.set('data-font-measure-method','same-PlantUML-JVM-java-awt-SansSerif-advance')
  evidence.append({'text':content,'font-size':fs,'style':style,'measured':measured,'java':java,'helper_sha256':hashlib.sha256(Path(helper).read_bytes()).hexdigest(),'defaultFontName':'SansSerif','raw_engine_missing_textLength':True})
 return evidence

def extract_glyphs(detail,r,compiler,runtime_info):
 r=deepcopy(r)  # Never mutate the immutable raw/sanitized engine input while adding proven font metrics.
 inheritance=source_text_inheritance(r)
 title_groups=[g for g in r.iter() if tag(g)=='g' and g.get('class')=='title']
 if len(title_groups)!=1:raise CandidateError('actual diagram title not uniquely captured')
 title_elements=[deepcopy(t) for t in title_groups[0].iter() if tag(t)=='text']
 expected_title=_safe_text(str(detail['id'])+' · '+str(detail.get('name','业务场景'))).replace('\\n','\n')
 if ''.join(''.join(t.itertext()) for t in title_elements)!=expected_title:raise CandidateError('diagram title incomplete')
 context={'text_inheritance':inheritance,'diagram_title':{'elements':title_elements,'original_bbox':union(ebox(t) for t in title_elements)}}
 metrics=ensure_text_metrics(r,runtime_info)
 texts=defaultdict(list)
 for a in r.iter():
  if tag(a)=='a':
   href=a.get('{'+XL+'}href',a.get('href'))
   for t in a.iter():
    if tag(t)=='text':texts[href].append(t)
 shapes=[e for e in r.iter() if tag(e)=='rect' and f(e,'rx')>0 or tag(e)=='polygon' and e.get('fill')=='#FFF8E8']
 all_elements=list(r.iter());glyphs={};owned=set();compound_owned=set()
 for n in detail['flow_diagram']['nodes']:
  nid=str(n['id']);tt=texts['#'+compiler.prefix+'_node_'+nid]
  expected=_safe_text(n.get('label',nid)).replace('\\n','\n').split('\n');actual=[''.join(t.itertext()) for t in sorted(tt,key=lambda t:(f(t,'y'),f(t,'x')))]
  if actual!=expected:raise CandidateError('node label incomplete '+nid+' '+repr(actual))
  # Anchor identity is authoritative; ownership uses full horizontal extent and actual engine baseline.
  # Conservative font bounds may legitimately overhang a multi-line polygon by <1px, and remain obstacles later.
  owners=[s for s in shapes if tt and tag(s)==('polygon' if n['type']=='decision' else 'rect') and all(contains(ebox(s),[f(t,'x'),f(t,'y'),f(t,'x')+f(t,'textLength'),f(t,'y')]) for t in tt)]
  if len(owners)!=1 or id(owners[0]) in owned:raise CandidateError('ambiguous/double actual glyph '+nid)
  body=owners[0];owned.add(id(body));elements=[deepcopy(body)];elements[0].set('data-glyph-role','body')
  color='#754B00' if n['type']=='decision' else {'failure':'#8F1930','event':'#5D348D'}.get(compiler._node_stereotype(nid,n),'#25324A')
  for t in tt:
   t=deepcopy(t);t.set('fill',color);t.set('data-glyph-role','node-label');elements.append(t)
  bbox=ebox(body);route_bbox=bbox[:];circles=[];internal=[]
  if n['type'] in ('start','end'):
   cx=(bbox[0]+bbox[2])/2
   circles=[e for e in r.iter() if tag(e)=='ellipse' and abs(f(e,'cx')-cx)<.02 and ((0<bbox[1]-f(e,'cy')<60) if n['type']=='start' else (0<f(e,'cy')-bbox[3]<60))]
   if len(circles)!=(1 if n['type']=='start' else 2):raise CandidateError('ambiguous true compound '+nid)
   outer=max(circles,key=lambda e:f(e,'rx'))
   p=(cx,f(outer,'cy')+f(outer,'ry')) if n['type']=='start' else (cx,bbox[3]);q=(cx,bbox[1]) if n['type']=='start' else (cx,f(outer,'cy')-f(outer,'ry'))
   lines=[e for e in r.iter() if tag(e)=='line' and '#55657D' in e.get('style','') and math.dist((f(e,'x1'),f(e,'y1')),p)<.002 and math.dist((f(e,'x2'),f(e,'y2')),q)<.002]
   if len(lines)!=1:raise CandidateError('compound connector not unique '+nid)
   line=lines[0];ix=all_elements.index(line);arrow=all_elements[ix+1]
   if tag(arrow)!='polygon' or arrow.get('fill')!='#55657D' or math.dist(poly_points(arrow)[1],(f(line,'x2'),f(line,'y2')))>.002:raise CandidateError('compound arrow provenance lost '+nid)
   for e in circles:
    if id(e) in compound_owned:raise CandidateError('shared true compound circle')
    compound_owned.add(id(e));c=deepcopy(e);c.set('data-glyph-role','compound-circle');elements.append(c)
   for e,role in [(line,'internal-connector'),(arrow,'internal-arrow')]:
    if id(e) in compound_owned:raise CandidateError('shared compound internal connector')
    compound_owned.add(id(e));c=deepcopy(e);c.set('data-glyph-role',role);elements.append(c)
   internal=[dict(e.attrib) for e in lines]
  full=union(ebox(e) for e in elements)
  outline=polygon_outline(poly_points(body)) if tag(body)=='polygon' else rounded_rect_outline(bbox,f(body,'rx'),f(body,'ry') or f(body,'rx'))
  glyphs[nid]={'raw':n,'elements':elements,'original_bbox':full,'route_bbox':route_bbox,'outline':outline,'width':full[2]-full[0],'height':full[3]-full[1],'body_width':bbox[2]-bbox[0],'body_height':bbox[3]-bbox[1],'internal':internal}
 edge_labels={}
 for i,e in enumerate(detail['flow_diagram']['edges']):
  tt=texts.get('#'+compiler.prefix+'_edge_'+str(i).zfill(3),[])
  has=bool(e.get('label') or e.get('path_id'));expected=_edge_label(e).replace('\\n','\n').split('\n') if has else []
  actual=[''.join(t.itertext()) for t in sorted(tt,key=lambda t:(f(t,'y'),f(t,'x')))]
  if expected!=actual:raise CandidateError('edge label missing/incomplete '+str(i)+' '+repr((expected,actual)))
  copies=[]
  for t in tt:
   t=deepcopy(t);t.set('fill','#344054');t.set('data-glyph-role','edge-label-text');copies.append(t)
  edge_labels[i+1]={'elements':copies,'original_bbox':union(ebox(t) for t in tt) if tt else None,'visible_text':actual,'width':max(f(t,'textLength') for t in tt) if tt else 0,'height':(union(ebox(t) for t in tt)[3]-union(ebox(t) for t in tt)[1]) if tt else 0}
 lane_glyphs={}
 for lane in detail['flow_diagram']['lanes']:
  tt=texts.get('#'+compiler.prefix+'_lane_'+str(lane['id']),[])
  if [''.join(t.itertext()) for t in tt]!=[_safe_text(lane.get('name',lane['id']))]:raise CandidateError('lane title mapping failed')
  title=deepcopy(tt[0]);title.set('fill','#344054');title.set('data-glyph-role','lane-title')
  title_box=ebox(title);title_center=((title_box[0]+title_box[2])/2,(title_box[1]+title_box[3])/2)
  backgrounds=[e for e in r.iter() if tag(e)=='rect' and f(e,'rx')==0 and e.get('fill')==LANE_COLORS.get(lane.get('kind','system'),'#F7F8FA') and f(e,'height')>150 and contains(ebox(e),[title_center[0],title_center[1],title_center[0],title_center[1]])]
  if len(backgrounds)!=1:raise CandidateError('lane background not unique '+str(lane['id']))
  lane_glyphs[str(lane['id'])]={'title':title,'background':deepcopy(backgrounds[0])}
 if len(glyphs)!=len(detail['flow_diagram']['nodes']):raise CandidateError('canonical glyph count')
 return glyphs,edge_labels,lane_glyphs,{'canonical_nodes':len(glyphs),'canonical_edges':len(edge_labels),'labeled_edges':sum(bool(x['elements']) for x in edge_labels.values()),'synthetic_merge_shape_count':len(shapes)-len(owned),'true_compound_circle_count':sum(tag(e)=='ellipse' for g in glyphs.values() for e in g['elements']),'font_measurements':metrics,'source_effective_text_inheritance':inheritance},context

def outline_json(o):
 return {'kind':'polygon','points':o.points,'box':o.box} if hasattr(o,'points') else {'kind':'rounded_rect','box':o.box,'rx':o.rx,'ry':o.ry}

def json_default(o):
 if hasattr(o,'box'):return outline_json(o)
 raise TypeError('cannot serialize '+type(o).__name__)

def translate_outline(outline,dx,dy):
 if hasattr(outline,'points'):return polygon_outline([(x+dx,y+dy) for x,y in outline.points])
 b=outline.box;return rounded_rect_outline((b[0]+dx,b[1]+dy,b[2]+dx,b[3]+dy),outline.rx,outline.ry)

def glyph_anchor(glyph,node,offset,side):
 b=glyph['original_bbox'];dx=float(node['x'])-(b[0]+b[2])/2;dy=float(node['y'])-(b[1]+b[3])/2
 o=translate_outline(glyph['outline'],dx,dy)
 if hasattr(o,'points'):return polygon_port(o,side,offset)
 return rounded_rect_port(o.box,o.rx,o.ry,side,offset)

def normalized_layout_model(model):
 m=deepcopy(model);groups=defaultdict(list)
 for n in m['nodes']:groups[(float(n['order']),str(n['lane_id']))].append(n)
 # Model facts stay original. Only auxiliary layout order splits otherwise colliding same-lane rows.
 maxdup=max(len(v) for v in groups.values());orders=sorted({float(n['order']) for n in m['nodes']});rank={o:i for i,o in enumerate(orders)}
 for grp in groups.values():
  for j,n in enumerate(grp):n['order']=rank[float(n['order'])]*maxdup+j
 return m

def real_port_allocation(nodes,edge_meta,adjacency,colors,glyphs):
 byidx={e['index']:e for e in edge_meta};owners={}
 for e in edge_meta:
  owners[(e['index'],'source')]=(e['source_id'],e['source_side'])
  owners[(e['index'],'target')]=(e['target_id'],e['target_side'])
 domains={}
 for endpoint,(nid,side) in owners.items():
  g=glyphs[nid];o=g['outline'];l,t,r,b=o.box;half=(r-l)/2;rawport=polygon_port if hasattr(o,'points') else None
  offsets=[(-half+1)+.5*i for i in range(max(0,int((2*half-2)/.5)+1))]
  preferred=0 if colors.get(endpoint,0)==0 else (-1 if colors[endpoint]%2 else 1)*((colors[endpoint]+1)//2)*6
  candidates=[]
  for off in offsets+[preferred]:
   try:p=polygon_port(o,side,off) if rawport else rounded_rect_port(o.box,o.rx,o.ry,side,off)
   except ValueError:continue
   outside=(p[0],g['original_bbox'][1]-12) if side=='top' else (p[0],g['original_bbox'][3]+12)
   texts=[ebox(el) for el in g['elements'] if tag(el)=='text']
   if any(hitbox(p,outside,box) for box in texts):continue
   # Incoming arrow must also stay outside all conservative text boxes.
   if endpoint[1]=='target':
    approach=(p[0],p[1]-8 if side=='top' else p[1]+8);arr=make_arrow(approach,p);ab=union([[x,y,x,y] for x,y in arr])
    if any(min(ab[2],q[2])-max(ab[0],q[0])>.01 and min(ab[3],q[3])-max(ab[1],q[1])>.01 for q in texts):continue
   candidates.append(off)
  domains[endpoint]=sorted(set(candidates),key=lambda x:(abs(x-preferred),abs(x),x))
  if not domains[endpoint]:raise CandidateError('no real-outline/text-safe port domain '+str(endpoint)+' '+nid)
 assigned={}
 for endpoint in sorted(owners,key=lambda ep:(len(domains[ep]),-len(adjacency.get(ep,set())),ep)):
  nid,side=owners[endpoint];selected=None
  for offset in domains[endpoint]:
   okay=True
   for neighbor in adjacency.get(endpoint,set()):
    if neighbor not in assigned:continue
    distance=6 if owners[neighbor]==owners[endpoint] else 1
    if abs(offset-assigned[neighbor])<distance-1e-7:okay=False;break
   if okay:selected=offset;break
  if selected is None:raise CandidateError('immutable actual glyph cannot fit independent safe ports '+nid+' '+side)
  assigned[endpoint]=selected
 return assigned

def reference_layout(detail,glyphs,labels):
 path=SKILL_SCRIPT_DIR/'swimlane_layout.py';source=path.read_text()
 sizes={nid:(g['width'],g['height']) for nid,g in glyphs.items()};max_label_width=max(x['width'] for x in labels.values());max_label_height=max(x['height'] for x in labels.values())
 patches=[]
 def patch(old,new):
  nonlocal source
  count=source.count(old)
  if count!=1:raise CandidateError('reference-layout patch must match exactly once: '+old+' actual='+str(count))
  patches.append({'old':old,'count':count});source=source.replace(old,new)
 patch('width, height = NODE_SIZES.get(node_type, NODE_SIZES["action"])','width, height = ACTUAL_SIZES[node_id]')
 patch('node["width"] = max(float(node["width"]), 2 * (max(offsets) + 30.0))','pass  # Actual glyph dimensions are immutable.')
 patch('PORT_SPACING = 14.0','PORT_SPACING = 6.0')
 patch('TRACK_SPACING = 24.0',f'TRACK_SPACING = {max(36,max_label_height+14)}')
 patch('BASE_GAP = 54.0','BASE_GAP = 72.0')
 patch('lane_width = max(236.0, maximum_node_width + 2 * (max_internal_offset + NODE_CLEARANCE))',f'maximum_port_offset = max(abs(e[role+"_offset"]) for e in edge_meta for role in ("source","target"))\n    lane_width = max(360.0, maximum_node_width + 2 * (max_internal_offset + NODE_CLEARANCE), 2 * ({max_label_width}+maximum_port_offset+40+max_internal_offset))')
 # All labeled edges get two tracks so a full actual condition glyph can sit above the source horizontal support.
 patch('if target_row == source_row + 1 and same_lane and isolated_ports:', 'if False:  # Text-safe real ports may differ even for isolated adjacent nodes.')
 patch('elif target_row == source_row + 1:', 'elif target_row == source_row + 1 and not edge["raw"].get("label") and not edge["raw"].get("path_id"):')
 old_offsets='for edge in edge_meta:\n        edge["source_offset"] = _port_color_offset(colors.get((int(edge["index"]), "source"), 0))\n        edge["target_offset"] = _port_color_offset(colors.get((int(edge["index"]), "target"), 0))'
 new_offsets='real_offsets = REAL_PORT_ALLOC(nodes, edge_meta, adjacency, colors)\n    for edge in edge_meta:\n        edge["source_offset"] = real_offsets[(edge["index"], "source")]\n        edge["target_offset"] = real_offsets[(edge["index"], "target")]'
 patch(old_offsets,new_offsets)
 mod=types.ModuleType('tmp_actual_glyph_reference_layout');mod.ACTUAL_SIZES=sizes;mod.REAL_PORT_ALLOC=lambda n,e,a,c:real_port_allocation(n,e,a,c,glyphs);exec(compile(source,str(path)+'#actual-glyph-candidate','exec'),mod.__dict__)
 mod._simplify=simplify;mod._node_anchor=lambda n,o,s:glyph_anchor(glyphs[n['id']],n,o,s)
 layout=mod.build_swimlane_layout(normalized_layout_model(detail['flow_diagram']))
 for n in layout['nodes'].values():
  g=glyphs[n['id']];b=g['original_bbox'];dx=n['x']-(b[0]+b[2])/2;dy=n['y']-(b[1]+b[3])/2
  n['dx']=dx;n['dy']=dy;n['actual_outline']=translate_outline(g['outline'],dx,dy);n['body_bbox']=[g['route_bbox'][0]+dx,g['route_bbox'][1]+dy,g['route_bbox'][2]+dx,g['route_bbox'][3]+dy]
 layout['reference_layout_module_sha256']=hashlib.sha256(path.read_bytes()).hexdigest();layout['controlled_patch_hits']=patches
 max_port_offset=max(abs(e[role+'_offset']) for e in layout['edges'] for role in ('source','target'))
 for e in layout['edges']:
  lab=labels[e['index']];e['label_bbox']=None;e['label_offset']=None
  if lab['elements']:
   pairs=list(zip(e['points'],e['points'][1:]));horiz=[(a,b) for a,b in pairs if abs(a[1]-b[1])<1e-7 and abs(a[0]-b[0])>lab['width']+12]
   if not horiz:raise CandidateError('no full horizontal support for actual edge label '+str(e['index']))
   # First horizontal run is the source support; placing toward its corridor leaves central node port stems unobscured.
   a,b=horiz[0];direction=1 if b[0]>a[0] else -1
   source_center=layout['nodes'][e['source_id']]['x']
   lx=source_center+max_port_offset+18 if direction>0 else source_center-max_port_offset-18-lab['width']
   target_top=a[1]-lab['height']-6;bb=lab['original_bbox'];ly=target_top
   if lx<min(a[0],b[0])+4 or lx+lab['width']>max(a[0],b[0])-4:raise CandidateError('condition glyph cannot fit fixed source-lane safe support '+str(e['index']))
   e['label_bbox']={'left':lx,'top':ly,'right':lx+lab['width'],'bottom':ly+lab['height']};e['label_offset']=(lx-bb[0],ly-bb[1])
 return layout

def make_arrow(start,end,half=2.5,length=7):
 dx,dy=end[0]-start[0],end[1]-start[1];norm=math.hypot(dx,dy)
 if norm<length+.1:raise CandidateError('terminal segment too short for independent arrow')
 ux,uy=dx/norm,dy/norm;base=(end[0]-ux*length,end[1]-uy*length)
 return [(base[0]-uy*half,base[1]+ux*half),end,(base[0]+uy*half,base[1]-ux*half)]

def segments(pp):return [(a,b) for a,b in zip(pp,pp[1:])]
def axis(a,b):
 if abs(a[1]-b[1])<1e-6:return 'h'
 if abs(a[0]-b[0])<1e-6:return 'v'
 return 'd'
def hitbox(a,b,box,tol=.02):
 o=axis(a,b);l,t,r,bt=box
 return t+tol<a[1]<bt-tol and min(max(a[0],b[0]),r)-max(min(a[0],b[0]),l)>.02 if o=='h' else (l+tol<a[0]<r-tol and min(max(a[1],b[1]),bt)-max(min(a[1],b[1]),t)>.02 if o=='v' else True)
def line_overlap(a,b,c,d):
 o=axis(a,b)
 if o!=axis(c,d):return 0
 if o=='h' and abs(a[1]-c[1])<.01:return min(max(a[0],b[0]),max(c[0],d[0]))-max(min(a[0],b[0]),min(c[0],d[0]))
 if o=='v' and abs(a[0]-c[0])<.01:return min(max(a[1],b[1]),max(c[1],d[1]))-max(min(a[1],b[1]),min(c[1],d[1]))
 return 0

def audit_layout(detail,glyphs,labels,layout):
 problems=[];nodes=layout['nodes'];edges=layout['edges'];alllabels=[e for e in edges if e['label_bbox']]
 if set(nodes)!=set(glyphs):problems.append('node identity coverage')
 if len(edges)!=len(detail['flow_diagram']['edges']):problems.append('edge identity coverage')
 for nid,n in nodes.items():
  g=glyphs[nid]
  if abs(n['width']-g['width'])>1e-7 or abs(n['height']-g['height'])>1e-7:problems.append('actual glyph resized '+nid)
  for oid,o in nodes.items():
   if oid<=nid:continue
   a=n['bbox'];b=o['bbox']
   if min(a['right'],b['right'])-max(a['left'],b['left'])>.01 and min(a['bottom'],b['bottom'])-max(a['top'],b['top'])>.01:problems.append('node overlap '+nid+'/'+oid)
 node_texts=[]
 for nid,n in nodes.items():
  for element in glyphs[nid]['elements']:
   if tag(element)=='text':
    q=ebox(element);node_texts.append((nid,[q[0]+n['dx'],q[1]+n['dy'],q[2]+n['dx'],q[3]+n['dy']]))
 endpoint=[];arrowboxes=[]
 for e in edges:
  src=nodes[e['source_id']];tgt=nodes[e['target_id']]
  for p,n,side,offset,which in [(e['points'][0],src,e['source_side'],e['source_offset'],'source'),(e['points'][-1],tgt,e['target_side'],e['target_offset'],'target')]:
   expected=glyph_anchor(glyphs[n['id']],n,offset,side)
   if math.dist(expected,p)>1e-6 or not on_boundary(n['actual_outline'],p):problems.append('actual port outside/moved '+str(e['index'])+'/'+which)
   endpoint.append((e['index'],which,p))
  for si,(a,b) in enumerate(segments(e['points'])):
   if axis(a,b)=='d':problems.append('nonorthogonal '+str(e['index']))
   for nid,n in nodes.items():
    if nid==e['source_id'] and si==0 or nid==e['target_id'] and si==len(e['points'])-2:continue
    bb=n['bbox'];box=[bb[k] for k in ['left','top','right','bottom']]
    if hitbox(a,b,box):problems.append('line through glyph '+str(e['index'])+'/'+nid)
   for nid,tbox in node_texts:
    if hitbox(a,b,tbox):problems.append('line through actual glyph text '+str(e['index'])+'/'+nid)
   for le in alllabels:
    bb=le['label_bbox'];box=[bb[k] for k in ['left','top','right','bottom']]
    if hitbox(a,b,box):problems.append('line through label '+str(e['index'])+'/'+str(le['index']))
  if e['label_bbox']:
   bb=e['label_bbox'];box=[bb[k] for k in ['left','top','right','bottom']]
   for nid,n in nodes.items():
    nb=n['bbox'];nbox=[nb[k] for k in ['left','top','right','bottom']]
    if min(box[2],nbox[2])-max(box[0],nbox[0])>.01 and min(box[3],nbox[3])-max(box[1],nbox[1])>.01:problems.append('label through glyph '+str(e['index'])+'/'+nid)
  arrow=make_arrow(e['points'][-2],e['points'][-1]);arrowboxes.append((e['index'],union([[x,y,x,y] for x,y in arrow])))
 for j,left in enumerate(edges):
  for right in edges[j+1:]:
   if any(line_overlap(a,b,c,d)>.02 for a,b in segments(left['points']) for c,d in segments(right['points'])):problems.append('edge overlap '+str(left['index'])+'/'+str(right['index']))
 for j,(i,wh,p) in enumerate(endpoint):
  for k,wq,q in endpoint[j+1:]:
   if math.dist(p,q)<.01:problems.append('shared endpoint '+str(i)+'/'+str(k))
 for j,(i,a) in enumerate(arrowboxes):
  for k,b in arrowboxes[j+1:]:
   if min(a[2],b[2])-max(a[0],b[0])>.01 and min(a[3],b[3])-max(a[1],b[1])>.01:problems.append('arrowheads overlap '+str(i)+'/'+str(k))
 for j,a in enumerate(alllabels):
  for b in alllabels[j+1:]:
   aa=a['label_bbox'];bb=b['label_bbox']
   if min(aa['right'],bb['right'])-max(aa['left'],bb['left'])>.01 and min(aa['bottom'],bb['bottom'])-max(aa['top'],bb['top'])>.01:problems.append('labels overlap '+str(a['index'])+'/'+str(b['index']))
 return list(dict.fromkeys(problems))

def build_svg(detail,glyphs,labels,lanes,layout,context):
 model=detail['flow_diagram'];facthash=hashlib.sha256(json.dumps(model,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
 root=ET.Element('{'+NS+'}svg',{'width':fmt(layout['width'])+'px','height':fmt(layout['height'])+'px','viewBox':'0 0 '+fmt(layout['width'])+' '+fmt(layout['height']),'font-family':context['text_inheritance']['font-family'],'lengthAdjust':context['text_inheritance']['lengthAdjust'],'data-text-inheritance-source':'actual-local-PlantUML-ancestor','data-renderer':'plantuml-canonical','data-renderer-backend':BACKEND,'data-canonical-facts-sha256':facthash,'data-source-id':detail['id'],'data-diagnostic-status':'temporary-candidate-no-formal-pass','role':'img','aria-label':str(detail.get('name',detail['id']))})
 title=context['diagram_title'];tb=title['original_bbox'];twidth=tb[2]-tb[0];dx=layout['width']/2-(tb[0]+tb[2])/2;baseline=max(f(t,'y') for t in title['elements']);dy=21-baseline
 tg=ET.SubElement(root,'{'+NS+'}g',{'data-glyph-role':'diagram-title','transform':f'translate({fmt(dx)} {fmt(dy)})'})
 for element in title['elements']:tg.append(deepcopy(element))
 for i,l in enumerate(model['lanes']):
  lid=str(l['id']);g=ET.SubElement(root,'{'+NS+'}g',{'data-source-lane-id':lid});bg=deepcopy(lanes[lid]['background']);bg.set('x',fmt(layout['lane_left'][lid]));bg.set('y',fmt(layout['lane_top']));bg.set('width',fmt(layout['lane_width']));bg.set('height',fmt(layout['lane_bottom']-layout['lane_top']));g.append(bg)
  title=deepcopy(lanes[lid]['title']);title.set('x',fmt(layout['lane_left'][lid]+layout['lane_width']/2-f(title,'textLength')/2));title.set('y',fmt(layout['lane_top']+30));g.append(title)
 # Edges first; actual business glyphs above them, while geometry gate rejects hidden crossings.
 for e in layout['edges']:
  raw=detail['flow_diagram']['edges'][e['index']-1];eid=detail['id']+':E'+str(e['index']).zfill(3)
  eg=ET.SubElement(root,'{'+NS+'}g',{'data-source-edge-id':eid,'data-from':str(raw['from']),'data-to':str(raw['to']),'data-edge-type':str(raw.get('type','normal')),'data-label':str(raw.get('label','')),'data-path-id':str(raw.get('path_id','')),'data-route-points':json.dumps(e['points']),'data-source-port':json.dumps(e['source_port']),'data-target-port':json.dumps(e['target_port']),'data-source-side':e['source_side'],'data-target-side':e['target_side']})
  ET.SubElement(eg,'{'+NS+'}polyline',{'points':' '.join(pt(p) for p in e['points']),'fill':'none','stroke':'#55657D','stroke-width':'1','data-glyph-role':'canonical-connector'})
  ET.SubElement(eg,'{'+NS+'}polygon',{'points':' '.join(pt(p) for p in make_arrow(e['points'][-2],e['points'][-1])),'fill':'#55657D','stroke':'#55657D','stroke-width':'1','data-glyph-role':'canonical-arrow','data-arrow-tip':json.dumps(e['points'][-1]),'data-arrow-half-width':'2.5','data-arrow-length':'7'})
  if labels[e['index']]['elements']:
   dx,dy=e['label_offset'];lg=ET.SubElement(eg,'{'+NS+'}g',{'data-glyph-role':'edge-label','data-label-complete':'true','transform':f'translate({fmt(dx)} {fmt(dy)})'})
   for t in labels[e['index']]['elements']:lg.append(deepcopy(t))
 for nid,n in layout['nodes'].items():
  raw=glyphs[nid]['raw'];o=n['actual_outline'];outline_meta=outline_json(o)
  bb=n['bbox'];ng=ET.SubElement(root,'{'+NS+'}g',{'data-source-node-id':nid,'data-node-type':str(raw.get('type','action')),'data-lane-id':str(raw['lane_id']),'data-step-ref':str(raw.get('step_ref','')),'data-glyph-bbox-method':BBOX_METHOD,'data-glyph-original-bbox':json.dumps(glyphs[nid]['original_bbox']),'data-glyph-layout-bbox':json.dumps([bb[k] for k in ['left','top','right','bottom']]),'data-body-outline':json.dumps(outline_meta),'transform':f'translate({fmt(n["dx"])} {fmt(n["dy"])})'})
  for elem in glyphs[nid]['elements']:ng.append(deepcopy(elem))
 return root

def inventory(glyphs,labels,context):
 return {'text_inheritance':context['text_inheritance'],'diagram_title':{'elements_xml':[ET.tostring(t,encoding='unicode') for t in context['diagram_title']['elements']],'original_bbox':context['diagram_title']['original_bbox']},'nodes':{nid:{'raw':g['raw'],'bbox_method':BBOX_METHOD,'original_bbox':g['original_bbox'],'route_bbox':g['route_bbox'],'actual_outline':g['outline'],'elements_xml':[ET.tostring(e,encoding='unicode') for e in g['elements']]} for nid,g in glyphs.items()},'edge_labels':{str(i):{'original_bbox':l['original_bbox'],'visible_text':l['visible_text'],'width':l['width'],'height':l['height'],'elements_xml':[ET.tostring(e,encoding='unicode') for e in l['elements']]} for i,l in labels.items()}}

def render_canonical_svg(detail):
 """Return actual local PlantUML glyph SVG, immutable engine input, inventory, layout and diagnostics.

 This API never writes source probes, Puml or final output. Own geometry failures raise
 before a caller can publish; final independent QA and browser review remain mandatory.
 """
 problems=inspect_swimlane(detail)
 if problems:raise CandidateError('source graph invalid '+repr(problems))
 engine,compiler,provenance=render_anchor_svg(detail)
 glyphs,labels,lanes,coverage,context=extract_glyphs(detail,engine,compiler,provenance['runtime'])
 layout=reference_layout(detail,glyphs,labels);problems=audit_layout(detail,glyphs,labels,layout)
 if problems:raise CandidateError('canonical geometry failed: '+repr(problems))
 root=build_svg(detail,glyphs,labels,lanes,layout,context);data=ET.tostring(root,encoding='unicode')
 report={'scenario_id':detail['id'],'backend':BACKEND,'formal_pass':False,'shared_or_installed_written':False,'metadata_coverage':coverage,'geometry_problems':problems,'geometry_candidate_pass':True,'width':layout['width'],'height':layout['height'],'glyph_sizes_unchanged':True,'canonical_edge_count':len(layout['edges']),'actual_outline_ports_verified':True,'bbox_method':BBOX_METHOD,'runtime_provenance':provenance['runtime'],'reference_layout_module_sha256':layout['reference_layout_module_sha256'],'controlled_patch_hits':layout['controlled_patch_hits'],'raw_engine_sha256':provenance['raw_engine_sha256'],'source_glyph_text_attribute_extensions':['controlled link fill restoration to original compiler palette','only raw-missing textLength supplied by same-JVM font measurement with explicit evidence']}
 inv=json.loads(json.dumps(inventory(glyphs,labels,context),ensure_ascii=False,default=json_default))
 return {'svg':data,'inventory':inv,'report':report,'layout':json.loads(json.dumps(layout,ensure_ascii=False,default=json_default)),'raw_engine_svg':provenance['raw_engine_svg'],'original_anchor_svg':provenance['original_anchor_svg'],'compiled_source':provenance['compiled_source']}

def render_candidate(detail,out_dir,debug_sources=False):
 out_dir=Path(out_dir);out_dir.mkdir(parents=True,exist_ok=True);sid=safe_id(detail['id']);base=out_dir/sid
 (out_dir/'source-facts.json').write_text(json.dumps(detail,ensure_ascii=False,indent=2)+'\n')
 try:
  result=render_canonical_svg(detail);data=result['svg'];report=result['report']
  base.with_suffix('.candidate.svg').write_text(data)
  base.with_suffix('.candidate.png').write_bytes(subprocess.run(['/opt/homebrew/bin/rsvg-convert'],input=data.encode(),stdout=subprocess.PIPE,check=True).stdout)
  # Caller explicitly requested diagnostics; immutable engine proof is separate from measured working glyphs.
  base.with_suffix('.anchor.svg').write_text(result['original_anchor_svg'])
  base.with_suffix('.engine.svg').write_text(result['raw_engine_svg'])
  if debug_sources:base.with_suffix('.puml').write_text(result['compiled_source'])
  (out_dir/'glyph-inventory.json').write_text(json.dumps(result['inventory'],ensure_ascii=False,indent=2)+'\n')
  (out_dir/'layout.json').write_text(json.dumps(result['layout'],ensure_ascii=False,indent=2)+'\n')
  report.update(candidate_svg=str(base.with_suffix('.candidate.svg')),candidate_png=str(base.with_suffix('.candidate.png')))
 except Exception as exc:report={'scenario_id':sid,'backend':BACKEND,'formal_pass':False,'shared_or_installed_written':False,'geometry_candidate_pass':False,'error':type(exc).__name__+': '+str(exc)}
 base.with_suffix('.report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False),flush=True);return report

def high_indegree():
 nodes=[{'id':'S','lane_id':'actor','type':'start','order':1,'label':'验证十四条独立路径'},{'id':'D','lane_id':'actor','type':'decision','order':2,'label':'选择十四个有完整条件和身份的分支，所有原路径均保留'}]
 edges=[{'from':'S','to':'D'}]
 for i in range(14):
  nid='A'+str(i+1).zfill(2);nodes.append({'id':nid,'lane_id':'system','type':'action','order':3+i,'label':'处理独立来源 '+str(i+1)});edges.extend([{'from':'D','to':nid,'label':'明确条件 '+str(i+1),'path_id':'ALT-'+str(i+1).zfill(3)},{'from':nid,'to':'E'}])
 nodes.append({'id':'E','lane_id':'system','type':'end','order':18,'label':'归并十四条独立路径，完整保留全部来源与条件'})
 return {'id':'SC-HIGH','name':'真实glyph十四路汇入','main_flow':[],'alternate_flows':[{'id':'ALT-'+str(i+1).zfill(3)} for i in range(14)],'flow_diagram':{'lanes':[{'id':'actor','name':'测试人员','kind':'actor'},{'id':'system','name':'测试平台','kind':'system'}],'nodes':nodes,'edges':edges}}

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--model',action='append');ap.add_argument('--out',required=True);ap.add_argument('--high-indegree',action='store_true');ap.add_argument('--debug-sources',action='store_true');args=ap.parse_args()
 for path in args.model or []:
  d=json.loads(Path(path).read_text());render_candidate(d,Path(args.out)/d['id'],args.debug_sources)
 if args.high_indegree:render_candidate(high_indegree(),Path(args.out)/'SC-HIGH',args.debug_sources)
