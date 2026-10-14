#!/usr/bin/env python3
"""Independent, fail-closed QA for the proposed PlantUML glyph/canonical routing renderer.
Only reads source facts/SVG; optional reports and deliberate mutations go to --out.
This does NOT certify browser viewports, scrolling, zoom, fullscreen, or workflow gates.
"""
from __future__ import annotations
import argparse, copy, hashlib, json, math, re, subprocess, base64
from pathlib import Path
import xml.etree.ElementTree as ET
from collections import Counter

EPS = 0.16
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
SAFE = str.maketrans({'@':'＠','!':'！',"'":'’','"':'”','|':'｜',':':'：',';':'；','(':'（',')':'）','[':'［',']':'］','{':'｛','}':'｝','<':'＜','>':'＞','#':'＃'})

def tag(e): return e.tag.split('}')[-1]
def display(s): return str(s or '').replace('\\','＼').replace('\r','').replace('\n','').translate(SAFE)
def digest(v): return hashlib.sha256(json.dumps(v, ensure_ascii=False, sort_keys=True, separators=(',',':')).encode()).hexdigest()
def f(e,k,default=None):
    v=e.get(k,default)
    if v is None: raise ValueError('missing numeric '+k)
    if not re.fullmatch(r'[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?(?:px)?',str(v)): raise ValueError('unsupported numeric '+k+'='+str(v))
    return float(str(v).removesuffix('px'))
def nums(s):
    pattern=r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?';value=s or ''
    if re.sub(pattern,'',value).strip(' ,\t\r\n'):raise ValueError('unparsed numeric list '+value)
    return [float(x) for x in re.findall(pattern,value)]
def points(s):
    a=nums(s)
    if len(a)<4 or len(a)%2: raise ValueError('invalid points')
    return list(zip(a[::2],a[1::2]))
def close(a,b): return math.dist(a,b)<=EPS

def translated(e,parent):
    s=e.get('transform','').strip();x,y=parent
    if not s:return x,y
    cursor=0
    for m in re.finditer(r'([a-zA-Z]+)\s*\(([^)]*)\)',s):
        if s[cursor:m.start()].strip(' ,\t\r\n'):raise ValueError('unparsed transform')
        a=nums(m.group(2));kind=m.group(1)
        if kind=='translate' and len(a) in (1,2):x+=a[0];y+=a[1] if len(a)>1 else 0
        elif kind=='matrix' and len(a)==6 and all(abs(v-z)<1e-9 for v,z in zip(a[:4],[1,0,0,1])):x+=a[4];y+=a[5]
        else:raise ValueError('unsupported transform '+s)
        cursor=m.end()
    if s[cursor:].strip(' ,\t\r\n'):raise ValueError('unparsed transform')
    return x,y

def walk(e,parent=(0.,0.),skip_root=False):
    tr=parent if skip_root else translated(e,parent)
    yield e,tr
    for c in e:yield from walk(c,tr)

def shape(e,tr):
    t=tag(e);dx,dy=tr
    if t=='rect':
        x,y,w,h=f(e,'x',0),f(e,'y',0),f(e,'width'),f(e,'height')
        rx=f(e,'rx',e.get('ry',0));ry=f(e,'ry',e.get('rx',0))
        return {'kind':'rounded_rect','box':[x+dx,y+dy,x+w+dx,y+h+dy],'rx':min(rx,w/2),'ry':min(ry,h/2)}
    if t=='polygon':return {'kind':'polygon','points':[[x+dx,y+dy] for x,y in points(e.get('points'))]}
    if t in ('ellipse','circle'):
        cx,cy=f(e,'cx',0)+dx,f(e,'cy',0)+dy;rx=f(e,'r') if t=='circle' else f(e,'rx');ry=rx if t=='circle' else f(e,'ry')
        return {'kind':'ellipse','box':[cx-rx,cy-ry,cx+rx,cy+ry],'rx':rx,'ry':ry}
    return None

def box(s):
    if s['kind']!='polygon':return s['box']
    p=s['points'];return [min(x for x,y in p),min(y for x,y in p),max(x for x,y in p),max(y for x,y in p)]
def dist_segment(p,a,b):
    vx,vy=b[0]-a[0],b[1]-a[1];den=vx*vx+vy*vy
    if not den:return math.dist(p,a)
    t=max(0,min(1,((p[0]-a[0])*vx+(p[1]-a[1])*vy)/den));return math.dist(p,(a[0]+t*vx,a[1]+t*vy))
def extents(s,h,v):
    # Actual filled-shape intersections with an axis-aligned scan line.
    if s['kind']=='polygon':
        pp=s['points'];hits=[]
        for a,b in zip(pp,pp[1:]+pp[:1]):
            av=a[1] if h else a[0];bv=b[1] if h else b[0]
            if (av>v)!=(bv>v):
                q=(v-av)/(bv-av);hits.append((a[0]+q*(b[0]-a[0])) if h else (a[1]+q*(b[1]-a[1])))
        hits.sort();return [(hits[i],hits[i+1]) for i in range(0,len(hits)-1,2)]
    l,t,r,b=s['box'];lo,hi=(t,b) if h else (l,r)
    if not lo<v<hi:return []
    if s['kind']=='ellipse':
        c=(lo+hi)/2;rad=(hi-lo)/2;span=((r-l)/2 if h else (b-t)/2)*math.sqrt(max(0,1-((v-c)/rad)**2));center=(l+r)/2 if h else (t+b)/2
        return [(center-span,center+span)]
    rr=s['ry'] if h else s['rx'];rx=s['rx'] if h else s['ry'];inset=0
    if rr and rx:
        z=max(0,rr-min(v-lo,hi-v));inset=rx*(1-math.sqrt(max(0,1-(z/rr)**2)))
    return [(l+inset,r-inset)] if h else [(t+inset,b-inset)]
def boundary(s,p):
    if s['kind']=='polygon':
        pp=s['points'];return min(dist_segment(p,a,b) for a,b in zip(pp,pp[1:]+pp[:1]))<=EPS
    l,t,r,b=s['box'];x,y=p
    if s['kind']=='ellipse':
        return abs(((x-(l+r)/2)/s['rx'])**2+((y-(t+b)/2)/s['ry'])**2-1)<=EPS/max(s['rx'],s['ry']) * 3
    if x<l-EPS or x>r+EPS or y<t-EPS or y>b+EPS:return False
    rx,ry=s['rx'],s['ry']
    if not rx or not ry:return min(abs(x-l),abs(x-r),abs(y-t),abs(y-b))<=EPS
    if l+rx<=x<=r-rx:return min(abs(y-t),abs(y-b))<=EPS
    if t+ry<=y<=b-ry:return min(abs(x-l),abs(x-r))<=EPS
    cx=l+rx if x<(l+r)/2 else r-rx;cy=t+ry if y<(t+b)/2 else b-ry
    return abs(((x-cx)/rx)**2+((y-cy)/ry)**2-1)<=EPS/min(rx,ry)*3

def path_points(d):
    toks=re.findall(r'[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?',d or '')
    if re.sub(r'[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?|[\s,]','',d or ''):raise ValueError('unparsed path')
    out=[];i=0;cmd=None;cur=(0.,0.)
    while i<len(toks):
        if toks[i].isalpha():cmd=toks[i];i+=1
        if not cmd or cmd.upper() not in ('M','L','H','V'):raise ValueError('unsupported curve/closed/multipath '+str(cmd))
        rel=cmd.islower();up=cmd.upper();n=2 if up in ('M','L') else 1
        if i+n>len(toks) or any(x.isalpha() for x in toks[i:i+n]):raise ValueError('short path command')
        a=list(map(float,toks[i:i+n]));i+=n
        if up in ('M','L'):new=(a[0]+(cur[0] if rel else 0),a[1]+(cur[1] if rel else 0))
        elif up=='H':new=(a[0]+(cur[0] if rel else 0),cur[1])
        else:new=(cur[0],a[0]+(cur[1] if rel else 0))
        if up=='M' and out:raise ValueError('multiple subpaths')
        out.append(new);cur=new
        if up=='M':cmd='l' if rel else 'L'
    if len(out)<2:raise ValueError('short connector path')
    return out

def line_points(e,tr):
    t=tag(e);dx,dy=tr
    if t=='line':p=[(f(e,'x1'),f(e,'y1')),(f(e,'x2'),f(e,'y2'))]
    elif t=='polyline':p=points(e.get('points'))
    elif t=='path':p=path_points(e.get('d'))
    else:return None
    return [[x+dx,y+dy] for x,y in p]

def text_box(e,tr,top_factor=1.05):
    if tag(e)!='text':return None
    if list(e):raise ValueError('tspan text requires explicit bounds adapter; not silently ignored')
    dx,dy=tr;fs=f(e,'font-size');w=f(e,'textLength');x=f(e,'x')+dx;y=f(e,'y')+dy
    anchor=e.get('text-anchor','start')
    if anchor=='middle':x-=w/2
    elif anchor=='end':x-=w
    elif anchor!='start':raise ValueError('unsupported text anchor')
    # Conservative actual SVG x/textLength/font-size envelope; no native 190px cap.
    return [x,y-fs*top_factor,x+w,y+fs*.25]

def visible_text(e,role):
    owners=[x for x in e.iter() if x.get('data-glyph-role')==role]
    texts=[];seen=set()
    for owner in owners:
        for x in owner.iter():
            if tag(x)=='text' and id(x) not in seen:seen.add(id(x));texts.append(''.join(x.itertext()))
    return ''.join(texts)

def body_shapes(node):
    a=[]
    for owner,tr in walk(node):
        if owner.get('data-glyph-role')=='body':
            if shape(owner,tr):a.append(shape(owner,tr))
            else:
                for c,ct in walk(owner,tr,skip_root=True):
                    if c is not owner and shape(c,ct):a.append(shape(c,ct))
    return a


def xml_signature(e):
    return (tag(e),tuple(sorted(e.attrib.items())),e.text or '',tuple(xml_signature(c) for c in e))
def check_inventory(source,r,inventory):
    issues=[];add=lambda code,detail:issues.append({'code':code,'detail':detail})
    invnodes=inventory.get('nodes',{});invlabs=inventory.get('edge_labels',{})
    nodes={e.get('data-source-node-id'):e for e in r.iter() if tag(e)=='g' and e.get('data-source-node-id') is not None}
    edges={e.get('data-source-edge-id'):e for e in r.iter() if tag(e)=='g' and e.get('data-source-edge-id') is not None and e.get('data-from') is not None}
    expected={str(x['id']):x for x in source['flow_diagram']['nodes']}
    if set(invnodes)!=set(expected):add('inventory_node_coverage',{'expected':sorted(expected),'actual':sorted(invnodes)})
    expected_indices={str(i) for i in range(1,len(source['flow_diagram']['edges'])+1)}
    if set(invlabs)!=expected_indices:add('inventory_edge_label_coverage',{'expected':sorted(expected_indices),'actual':sorted(invlabs)})
    for nid,original in invnodes.items():
        if nid not in nodes:continue
        if original.get('raw')!=expected.get(nid):add('inventory_source_node_mismatch',nid)
        try:
            expected_xml=[xml_signature(ET.fromstring(v)) for v in original['elements_xml']]
            actual_xml=[xml_signature(v) for v in nodes[nid]]
            if expected_xml!=actual_xml:add('original_node_glyph_changed',nid)
        except Exception as ex:add('inventory_node_invalid',{'id':nid,'error':str(ex)})
    for idx,original in invlabs.items():
        eid=source['id']+':E'+str(idx).zfill(3)
        if eid not in edges:continue
        try:
            groups=[x for x in edges[eid].iter() if x.get('data-glyph-role')=='edge-label']
            if original['elements_xml']:
                if len(groups)!=1:raise ValueError('one translated edge-label glyph group required')
                owner=groups[0];children=list(owner) if tag(owner)=='g' else [owner]
                if [xml_signature(ET.fromstring(v)) for v in original['elements_xml']]!=[xml_signature(v) for v in children]:add('original_condition_glyph_changed',eid)
            elif groups:add('unexpected_condition_glyph',eid)
        except Exception as ex:add('inventory_condition_invalid',{'id':eid,'error':str(ex)})
    titles=[x for x in r.iter() if x.get('data-glyph-role')=='diagram-title']
    title=inventory.get('diagram_title')
    if title:
        if len(titles)!=1:add('inventory_title_coverage','one engine title wrapper required')
        elif [xml_signature(ET.fromstring(x)) for x in title.get('elements_xml',[])]!=[xml_signature(x) for x in titles[0]]:add('original_title_glyph_changed','title attrs/text differ from inventory')
    elif titles:add('unexpected_diagram_title','title has no original glyph inventory')
    return issues


MEASURE_METHOD='same-PlantUML-JVM-java-awt-SansSerif-advance'
MEASURE_CACHE={}
ENGINE_REPLAY_CACHE={}
ENGINE_REPLAY_TEXT_CACHE={}
def independently_measure_text(e,context):
    if not context or not re.search(r'^\s*skinparam\s+defaultFontName\s+SansSerif\s*$',context.get('puml',''),re.M):raise ValueError('unproved engine defaultFontName')
    java='/opt/homebrew/opt/openjdk/bin/java'
    wrapper=Path('/opt/homebrew/bin/plantuml').read_text()
    if 'exec "'+java+'"' not in wrapper:raise ValueError('installed PlantUML JVM is not the measurement JVM')
    fs=f(e,'font-size');style=(1 if e.get('font-weight','normal') in ('bold','700') else 0)+(2 if e.get('font-style','normal')=='italic' else 0)
    if fs!=int(fs):raise ValueError('float font-size not supported by current measurement proof')
    key=(e.text or '',int(fs),style)
    if key not in MEASURE_CACHE:
        helper=Path(__file__).parent/'IndependentSvgAdvanceQA.java'
        encoded=base64.b64encode((e.text or '').encode()).decode()
        p=subprocess.run([java,'-Djava.awt.headless=true',str(helper),'SansSerif',str(int(fs)),str(style),encoded],capture_output=True,text=True,check=True,timeout=15)
        result=json.loads(p.stdout)
        if result.get('canDisplayUpTo')!=-1 or result.get('fontFamily')!='SansSerif':raise ValueError('font cannot display complete glyph')
        MEASURE_CACHE[key]=result
    return MEASURE_CACHE[key]

FONT_DEFAULTS={'font-family':'serif','font-size':'16','font-weight':'normal','font-style':'normal','lengthAdjust':'spacing','letter-spacing':'normal','word-spacing':'normal'}
def effective_font_map(root,source,raw=False):
    result={};sid=source['id']
    def visit(e,parent,key=None):
        values=dict(parent)
        for k in FONT_DEFAULTS:
            if e.get(k) is not None:values[k]=e.get(k)
        for declaration in e.get('style','').split(';'):
            if ':' in declaration:
                k,v=declaration.split(':',1);k=k.strip()
                if k in FONT_DEFAULTS:values[k]=v.strip()
        if raw and tag(e)=='a':key=e.get('href',e.get('{http://www.w3.org/1999/xlink}href',key))
        elif raw and tag(e)=='g' and e.get('class')=='title':key='#sc_'+sid+'_diagram-title'
        elif not raw:
            if e.get('data-glyph-role')=='diagram-title':key='#sc_'+sid+'_diagram-title'
            elif e.get('data-source-node-id'):key='#sc_'+sid+'_node_'+e.get('data-source-node-id')
            elif e.get('data-source-lane-id'):key='#sc_'+sid+'_lane_'+e.get('data-source-lane-id')
            elif e.get('data-source-edge-id') and e.get('data-from') is not None:
                index=int(e.get('data-source-edge-id').split(':E')[-1])-1;key='#sc_'+sid+'_edge_'+str(index).zfill(3)
        if tag(e)=='text' and key is not None:result.setdefault(key,[]).append({'text':e.text or '',**values})
        for c in e:visit(c,values,key)
    visit(root,FONT_DEFAULTS)
    return result
def check_effective_engine_font(source,actual,anchor_svg):
    raw=effective_font_map(ET.fromstring(anchor_svg),source,True);final=effective_font_map(actual,source);issues=[]
    for key,rows in final.items():
        if rows!=raw.get(key):issues.append({'code':'engine_effective_font_changed','detail':{'anchor':key,'raw':raw.get(key),'final':rows}})
    return issues

def independently_expected_empty_joins(source):
    """Prove the exact number of compiler-only empty branches from source DAG.

    This deliberately does not import or ask the producer/compiler for its join
    decisions.  Each outgoing branch's reachable set includes its own target;
    the nearest common node uses the source's (order, input-index) ordering.
    Only an edge directly to that join needs an empty branch in the structured
    engine input.  These are layout decorations, never canonical source nodes.
    """
    model=source['flow_diagram'];nodes=model['nodes'];edges=model['edges']
    by_id={str(n['id']):n for n in nodes}
    if len(by_id)!=len(nodes):raise ValueError('duplicate source node identities')
    order={}
    for index,n in enumerate(nodes):
        value=n.get('order')
        if isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value) or value<=0:
            raise ValueError('invalid source node order: '+str(n.get('id')))
        order[str(n['id'])]=(float(value),index)
        if re.search(r'(?:^|_)synthetic_empty_\d+$',str(n['id'])):
            raise ValueError('compiler synthetic identity is reserved, not a source business node')
    outgoing={nid:[] for nid in by_id};indegree={nid:0 for nid in by_id}
    for index,e in enumerate(edges):
        start,end=str(e['from']),str(e['to'])
        if start not in by_id or end not in by_id:raise ValueError('unknown source edge endpoint')
        outgoing[start].append((index,end));indegree[end]+=1
    ready=[nid for nid in by_id if not indegree[nid]];topological=[]
    while ready:
        current=ready.pop();topological.append(current)
        for _,target in outgoing[current]:
            indegree[target]-=1
            if not indegree[target]:ready.append(target)
    if len(topological)!=len(nodes):raise ValueError('source is not an acyclic graph')
    reachable={}
    for nid in reversed(topological):
        result={nid}
        for _,target in outgoing[nid]:result.update(reachable[target])
        reachable[nid]=result
    direct=[]
    for nid in sorted(by_id,key=lambda x:order[x]):
        branches=outgoing[nid]
        if len(branches)>1 and by_id[nid].get('type')!='decision':
            raise ValueError('non-decision source branch')
        if by_id[nid].get('type')!='decision':continue
        if len(branches)<2:raise ValueError('decision has no complete source branches')
        common=set.intersection(*(reachable[target] for _,target in branches))
        if not common:continue
        join=min(common,key=lambda x:order[x])
        direct.extend({'decision':nid,'source_edge_index':index,'join':join}
                      for index,target in branches if target==join)
    prefix='#sc_'+str(source['id'])+'_synthetic_empty_'
    return {'count':len(direct),'direct_join_edges':direct,
            'anchors':[prefix+str(i) for i in range(1,len(direct)+1)]}

def check_synthetic_business_glyphs(source,actual,inventory):
    """Synthetic engine branches may not masquerade as canonical business glyphs."""
    problems=[];prefix='#sc_'+str(source['id'])+'_synthetic_empty_'
    for e in actual.iter():
        for key,value in e.attrib.items():
            if (value.startswith(prefix) or '_synthetic_empty_' in value or
                    key in {'data-source-node-id','data-source-id','id'} and
                    re.search(r'(?:^|_)synthetic_empty_\d+$',value)):
                problems.append({'code':'synthetic_business_glyph_in_final_svg',
                                 'detail':{'tag':tag(e),'attribute':key,'value':value}})
    if inventory is not None:
        for nid,item in inventory.get('nodes',{}).items():
            raw_id=str((item.get('raw') or {}).get('id',''))
            if any(re.search(r'(?:^|_)synthetic_empty_\d+$',str(value)) for value in (nid,raw_id)):
                problems.append({'code':'synthetic_business_glyph_in_inventory','detail':str(nid)})
            for xml in item.get('elements_xml',[]):
                try:elements=ET.fromstring(xml)
                except Exception:continue  # Existing inventory parsing fails closed separately.
                for e in elements.iter():
                    if any(value.startswith(prefix) or '_synthetic_empty_' in value for value in e.attrib.values()):
                        problems.append({'code':'synthetic_business_glyph_in_inventory','detail':str(nid)})
    return problems

def check_synthetic_empty_proof(source,anchors,anchor_elements,puml):
    """Allow only independently derived and exactly declared engine decorations."""
    issues=[];add=lambda code,detail:issues.append({'code':code,'detail':detail})
    try:proof=independently_expected_empty_joins(source)
    except Exception as exc:
        return set(),[{'code':'synthetic_empty_source_graph_unverified','detail':str(exc)}]
    expected=set(proof['anchors']);prefix='#sc_'+str(source['id'])+'_synthetic_empty_'
    # A foreign prefix or malformed suffix is not a second allowed namespace.
    # Every synthetic marker in engine input must belong to this one source.
    actual={key for key in anchors if '_synthetic_empty_' in key}
    if actual!=expected:
        add('synthetic_empty_anchor_coverage',{'expected':sorted(expected),'actual':sorted(actual),
                                             'direct_join_edges':proof['direct_join_edges']})
    for key in sorted(expected):
        # Exactly one anchor element and one literal label; duplicated equal
        # labels or a suffix/prefix cannot be mistaken for a valid decoration.
        if len(anchor_elements.get(key,[]))!=1 or anchors.get(key)!=['直接汇合']:
            add('synthetic_empty_anchor_text',{'anchor':key,'actual':anchors.get(key),
                                               'element_count':len(anchor_elements.get(key,[]))})
    lines=(puml or '').splitlines()
    declarations=[line for line in lines if '_synthetic_empty_' in line]
    wanted=[f':[[{key} 直接汇合]]; <<end_label>>' for key in proof['anchors']]
    if declarations!=wanted:
        add('synthetic_empty_controlled_puml_declaration',{'expected':wanted,'actual':declarations})
    # Failed proofs do not enlarge the allow-list; arbitrary extra anchors still
    # receive the original unknown-anchor rejection in check_engine_anchor.
    return (expected if not issues else set()),issues

def check_engine_anchor(source,inventory,svg,font_context=None):
    issues=[];add=lambda code,detail:issues.append({'code':code,'detail':detail})
    try:r=ET.fromstring(svg)
    except Exception as exc:return [{'code':'invalid_engine_anchor_svg','detail':str(exc)}]
    try:
        if not font_context or not font_context.get('puml'):raise ValueError('missing replayable controlled PlantUML source')
        puml=font_context['puml']
        if re.search(r'^\s*!(?:include|import|theme)\b|%(?:load_json|load_yaml|getenv|file_exists)\s*\(',puml,re.M|re.I):raise ValueError('external or ambient source directives are outside isolated glyph replay')
        key=hashlib.sha256(puml.encode()).hexdigest()
        if key not in ENGINE_REPLAY_CACHE:
            p=subprocess.run(['/opt/homebrew/bin/plantuml','-charset','UTF-8','-tsvg','-pipe'],input=puml,capture_output=True,text=True,check=True,timeout=35)
            ENGINE_REPLAY_CACHE[key]=ET.fromstring(p.stdout)
            ENGINE_REPLAY_TEXT_CACHE[key]=p.stdout
        replay=ENGINE_REPLAY_CACHE[key]
        primitive_tags={'rect','polygon','ellipse','circle','line','polyline','path','text'}
        if Counter(xml_signature(x) for x in r.iter() if tag(x) in primitive_tags)!=Counter(xml_signature(x) for x in replay.iter() if tag(x) in primitive_tags):add('raw_engine_replay_mismatch','Raw anchor primitive attrs/geometry/text differ from independently recompiled local engine output')
        if font_context.get('raw_engine_svg') is not None and font_context['raw_engine_svg']!=ENGINE_REPLAY_TEXT_CACHE[key]:add('raw_engine_bytes_not_replayed','Supplied immutable raw engine bytes differ from independently recompiled controlled source')
    except Exception as exc:add('raw_engine_replay_unverified',str(exc))
    anchors={};anchor_elements={}
    for a in r.iter():
        if tag(a)=='a':
            href=a.get('href',a.get('{http://www.w3.org/1999/xlink}href',''));anchors.setdefault(href,[]).extend(''.join(x.itertext()) for x in a.iter() if tag(x)=='text');anchor_elements.setdefault(href,[]).append(a)
    prefix='#sc_'+source['id']
    for node in source['flow_diagram']['nodes']:
        key=prefix+'_node_'+node['id']
        if ''.join(anchors.get(key,[]))!=display(node['label']):add('raw_engine_node_anchor_mapping',node['id'])
    for index,edge in enumerate(source['flow_diagram']['edges']):
        label=str(edge.get('label',''));pid=str(edge.get('path_id',''));want=label+(' · '+pid if label and pid else pid);key=prefix+'_edge_'+str(index).zfill(3)
        if ''.join(anchors.get(key,[]))!=display(want):add('raw_engine_condition_anchor_mapping',{'edge':index+1,'anchor':key})
    for lane in source['flow_diagram']['lanes']:
        if ''.join(anchors.get(prefix+'_lane_'+lane['id'],[]))!=display(lane['name']):add('raw_engine_lane_anchor_mapping',lane['id'])
    allowed={prefix+'_node_'+x['id'] for x in source['flow_diagram']['nodes']}|{prefix+'_edge_'+str(i).zfill(3) for i in range(len(source['flow_diagram']['edges']))}|{prefix+'_lane_'+x['id'] for x in source['flow_diagram']['lanes']}
    synthetic_allowed,synthetic_problems=check_synthetic_empty_proof(
        source,anchors,anchor_elements,(font_context or {}).get('puml'))
    issues.extend(synthetic_problems);allowed.update(synthetic_allowed)
    # All raw-engine hyperlinks are controlled declarations.  A different
    # namespace is not an escape hatch for unrelated nodes or source links.
    extra=[x for x in anchors if x not in allowed]
    if extra:add('raw_engine_unknown_canonical_anchor',extra)
    puml_targets=re.findall(r'\[\[([^\s\]]+)(?:\s[^\]]*)?\]\]',(font_context or {}).get('puml',''))
    unknown_puml=sorted({target for target in puml_targets if target not in allowed})
    if unknown_puml:add('controlled_puml_unknown_canonical_anchor',unknown_puml)
    fonts=effective_font_map(r,source,True)
    common={k:next(iter(v)) for k in ('font-family','lengthAdjust') if len(v:={row[k] for rows in fonts.values() for row in rows})==1}
    declared=inventory.get('text_inheritance')
    if declared is not None and declared!=common:add('source_effective_font_evidence_mismatch',{'declared':declared,'actual':common})
    inherited_title=(inventory.get('diagram_title') or {}).get('effective_inheritance')
    if inherited_title is not None and inherited_title!=common:add('title_effective_font_evidence_mismatch',{'declared':inherited_title,'actual':common})
    def clean_signature(e):
        z=copy.deepcopy(e)
        for x in z.iter():x.attrib.pop('data-glyph-role',None)
        return xml_signature(z)
    raw=Counter(clean_signature(x) for x in r.iter());wanted=Counter()
    def inventory_primitive(e):
        if e.get('data-font-measure-method') is not None:
            if tag(e)!='text' or e.get('data-font-measure-method')!=MEASURE_METHOD:add('uncontrolled_font_measurement',e.attrib)
            else:
                z=copy.deepcopy(e);z.attrib.pop('data-font-measure-method',None);z.attrib.pop('textLength',None)
                if raw[clean_signature(z)]<1:add('measurement_not_original_missing_textLength',e.text)
                try:
                    result=independently_measure_text(e,font_context)
                    if abs(f(e,'textLength')-result['width'])>0.000001:add('font_advance_measurement_mismatch',{'text':e.text,'declared':e.get('textLength'),'measured':result})
                except Exception as exc:add('font_advance_unverified',str(exc))
                return clean_signature(z)
        return clean_signature(e)
    incoming={x['id']:[] for x in source['flow_diagram']['nodes']}
    for edge in source['flow_diagram']['edges']:incoming[edge['to']].append(edge)
    for nid,item in inventory.get('nodes',{}).items():
        n=item['raw']
        color='#754B00' if n['type']=='decision' else ('#8F1930' if any(e.get('type') in ('error','failure') for e in incoming.get(nid,[])) else '#5D348D' if n['type']=='event' else '#25324A')
        for xml in item['elements_xml']:
            e=ET.fromstring(xml)
            if tag(e)=='text':
                if e.get('fill')!=color:add('controlled_anchor_color_restore',nid)
                e.set('fill','#00F')
            wanted[inventory_primitive(e)]+=1
    for idx,item in inventory.get('edge_labels',{}).items():
        for xml in item['elements_xml']:
            e=ET.fromstring(xml)
            if tag(e)=='text':
                if e.get('fill')!='#344054':add('controlled_anchor_color_restore','edge:'+str(idx))
                e.set('fill','#00F')
            wanted[inventory_primitive(e)]+=1
    for xml in (inventory.get('diagram_title') or {}).get('elements_xml',[]):wanted[inventory_primitive(ET.fromstring(xml))]+=1
    missing=wanted-raw
    if missing:add('glyph_inventory_not_from_engine_svg',{'unmatched_primitives':sum(missing.values()),'examples':[str(x)[:400] for x in list(missing)[:3]]})
    return issues


def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def segment_contacts(a,b,c,d):
    u=(b[0]-a[0],b[1]-a[1]);v=(d[0]-c[0],d[1]-c[1]);w=(c[0]-a[0],c[1]-a[1]);den=cross(u,v)
    if abs(den)>1e-9:
        t=cross(w,v)/den;q=cross(w,u)/den
        if -1e-7<=t<=1+1e-7 and -1e-7<=q<=1+1e-7:return [(a[0]+t*u[0],a[1]+t*u[1])]
        return []
    if abs(cross(w,u))>EPS*max(1,math.hypot(*u)):return []
    return [x for x in (a,b,c,d) if dist_segment(x,a,b)<=EPS and dist_segment(x,c,d)<=EPS]
def strict_inside_polygon(p,pp):
    if min(dist_segment(p,a,b) for a,b in zip(pp,pp[1:]+pp[:1]))<=EPS:return False
    x,y=p;inside=False
    for a,b in zip(pp,pp[1:]+pp[:1]):
        if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:inside=not inside
    return inside
def strict_inside_shape(p,sh):
    if sh['kind']=='polygon':return strict_inside_polygon(p,sh['points'])
    l,t,r,b=sh['box'];x,y=p
    if not l+EPS<x<r-EPS or not t+EPS<y<b-EPS:return False
    if sh['kind']=='ellipse':return ((x-(l+r)/2)/sh['rx'])**2+((y-(t+b)/2)/sh['ry'])**2<1-EPS/max(sh['rx'],sh['ry'])
    rx,ry=sh['rx'],sh['ry']
    if rx and ry and (x<l+rx or x>r-rx) and (y<t+ry or y>b-ry):
        cx=l+rx if x<(l+r)/2 else r-rx;cy=t+ry if y<(t+b)/2 else b-ry
        return ((x-cx)/rx)**2+((y-cy)/ry)**2<1-EPS/max(rx,ry)
    return True
def ellipse_contacts(a,b,cx,cy,rx,ry,quadrant=None):
    ux=(b[0]-a[0])/rx;uy=(b[1]-a[1])/ry;vx=(a[0]-cx)/rx;vy=(a[1]-cy)/ry
    aa=ux*ux+uy*uy;bb=2*(ux*vx+uy*vy);cc=vx*vx+vy*vy-1
    if aa<1e-15:return []
    disc=bb*bb-4*aa*cc
    if disc<-1e-9:return []
    out=[]
    for z in ((-bb-math.sqrt(max(0,disc)))/(2*aa),(-bb+math.sqrt(max(0,disc)))/(2*aa)):
        if -1e-7<=z<=1+1e-7:
            q=(a[0]+z*(b[0]-a[0]),a[1]+z*(b[1]-a[1]))
            if quadrant is None or ((q[0]-cx)*quadrant[0]>=-EPS and (q[1]-cy)*quadrant[1]>=-EPS):out.append(q)
    return out
def shape_contacts(a,b,sh):
    if sh['kind']=='polygon':
        pp=sh['points'];return [q for c,d in zip(pp,pp[1:]+pp[:1]) for q in segment_contacts(a,b,c,d)]
    l,t,r,bb=sh['box'];rx,ry=sh['rx'],sh['ry']
    if sh['kind']=='ellipse':return ellipse_contacts(a,b,(l+r)/2,(t+bb)/2,rx,ry)
    if not rx or not ry:
        pp=[(l,t),(r,t),(r,bb),(l,bb)];return [q for c,d in zip(pp,pp[1:]+pp[:1]) for q in segment_contacts(a,b,c,d)]
    lines=[((l+rx,t),(r-rx,t)),((l+rx,bb),(r-rx,bb)),((l,t+ry),(l,bb-ry)),((r,t+ry),(r,bb-ry))]
    out=[q for c,d in lines for q in segment_contacts(a,b,c,d)]
    for cx,cy,quadrant in [(l+rx,t+ry,(-1,-1)),(r-rx,t+ry,(1,-1)),(r-rx,bb-ry,(1,1)),(l+rx,bb-ry,(-1,1))]:out+=ellipse_contacts(a,b,cx,cy,rx,ry,quadrant)
    return out
def polygon_shape_contact(pp,sh):
    contacts=[q for a,b in zip(pp,pp[1:]+pp[:1]) for q in shape_contacts(a,b,sh)]
    penetrating=any(strict_inside_shape(p,sh) for p in pp)
    samples=sh['points'] if sh['kind']=='polygon' else [(sh['box'][0],sh['box'][1]),(sh['box'][2],sh['box'][1]),(sh['box'][2],sh['box'][3]),(sh['box'][0],sh['box'][3]),((sh['box'][0]+sh['box'][2])/2,(sh['box'][1]+sh['box'][3])/2)]
    penetrating=penetrating or any(strict_inside_shape(p,sh) and strict_inside_polygon(p,pp) for p in samples)
    return penetrating,contacts

def qa(source,svg,facts_scope='model',inventory=None,anchor_svg=None,font_context=None):
    problems=[];stats={};add=lambda code,detail:problems.append({'code':code,'detail':detail})
    try:r=ET.fromstring(svg)
    except Exception as ex:return {'pass':False,'problems':[{'code':'invalid_svg','detail':str(ex)}]}
    problems.extend(check_synthetic_business_glyphs(source,r,inventory))
    model=source['flow_diagram'];sid=source['id'];expected_nodes={str(n['id']):n for n in model['nodes']};expected_edges={f'{sid}:E{i:03d}':e for i,e in enumerate(model['edges'],1)};expected_lanes={str(x['id']):x for x in model['lanes']}
    marker=r.get('data-renderer')
    if marker not in ('plantuml-canonical','plantuml'):add('renderer_identity','unknown canonical renderer marker')
    if marker=='plantuml' and r.get('data-plantuml-render')!='pass':add('formal_renderer_status','Formal output must have the verified successful render status')
    if marker=='plantuml' and r.get('data-plantuml-render-method')!='local-glyphs-canonical-routing':add('formal_renderer_provenance','Formal canonical output may not masquerade as stock PlantUML')
    if marker=='plantuml':
        if r.get('data-business-facts-sha256')!=digest(source):add('formal_business_facts_hash','complete source facts not bound')
        saved=r.get('data-business-svg-sha256');copyroot=copy.deepcopy(r);copyroot.attrib.pop('data-business-svg-sha256',None);actual=hashlib.sha256(ET.tostring(copyroot,encoding='utf-8')).hexdigest()
        if saved!=actual:add('formal_business_content_hash','routed SVG content not bound')
        raw_engine=(font_context or {}).get('raw_engine_svg')
        if raw_engine is None or r.get('data-plantuml-glyph-source-sha256')!=hashlib.sha256(raw_engine.encode('utf-8')).hexdigest():add('formal_raw_glyph_source_hash','Formal output must bind the original unsanitized/unmeasured local engine string')
        puml=(font_context or {}).get('puml')
        if r.get('data-plantuml-source-sha256') is not None and (puml is None or r.get('data-plantuml-source-sha256')!=hashlib.sha256(puml.encode('utf-8')).hexdigest()):add('formal_compiled_source_hash','Controlled local engine source is not bound')
    if r.get('data-renderer-backend')!='plantuml-glyph-canonical-routing-v1':add('routing_backend','unknown renderer backend')
    if r.get('data-canonical-facts-sha256')!=digest(source if facts_scope=='detail' else model):add('source_hash_mismatch',facts_scope)
    for x in r.iter():
        if tag(x) in ('script','foreignObject','image','use','object'):add('unsafe_svg',tag(x))
        if x.get('display')=='none' or x.get('visibility') in ('hidden','collapse') or (x.get('opacity') is not None and f(x,'opacity')!=1):add('hidden_canonical_geometry',x.attrib)
        if any(x.get(k) is not None for k in ('clip-path','mask','filter')) or re.search(r'(?:opacity|display|visibility|transform|clip-path|mask|filter|font)\s*:',x.get('style','').lower()):add('unverified_svg_effect',x.attrib)
        for k,v in x.attrib.items():
            if k.lower().startswith('on') or (k.split('}')[-1]=='href' and not v.startswith('#')):add('unsafe_svg_attribute',k)
    nodes=[x for x in r.iter() if tag(x)=='g' and x.get('data-source-node-id') is not None]
    edges=[x for x in r.iter() if tag(x)=='g' and x.get('data-source-edge-id') is not None and (x.get('data-from') is not None or x.get('data-to') is not None)]
    lanes=[x for x in r.iter() if tag(x)=='g' and x.get('data-source-lane-id') is not None]
    for kind,items,attr,expected in [('node',nodes,'data-source-node-id',expected_nodes),('edge',edges,'data-source-edge-id',expected_edges),('lane',lanes,'data-source-lane-id',expected_lanes)]:
        counts=Counter(x.get(attr) for x in items)
        if set(counts)!=set(expected):add(kind+'_coverage',{'missing':sorted(set(expected)-set(counts)),'extra':sorted(set(counts)-set(expected))})
        if any(v!=1 for v in counts.values()):add(kind+'_duplicate',dict(counts))
    try:global_transform={id(e):tr for e,tr in walk(r)}
    except Exception as exc:return {'pass':False,'problems':[{'code':'unsupported_svg_transform','detail':str(exc)}],'counts':{}}
    if inventory is None:add('missing_original_glyph_inventory','Original PlantUML glyph provenance/preservation cannot be checked')
    else:
        problems.extend(check_inventory(source,r,inventory))
        if anchor_svg is None:add('missing_engine_anchor_svg','Cannot independently trace glyph inventory to the local engine SVG')
        else:
            problems.extend(check_engine_anchor(source,inventory,anchor_svg,font_context))
            problems.extend(check_effective_engine_font(source,r,anchor_svg))
    titles=[x for x in r.iter() if x.get('data-glyph-role')=='diagram-title'];title_owned={id(c) for t in titles for c in t.iter()}
    if len(titles)>1:add('duplicate_diagram_title','one optional decoration title')
    if titles and visible_text(titles[0],'diagram-title')!=display(source['id']+' · '+source.get('name','')):add('diagram_title_visible_name',visible_text(titles[0],'diagram-title'))
    lane_bounds={};lane_owned={id(c) for l in lanes for c in l.iter()}
    for lane in lanes:
        lid=lane.get('data-source-lane-id');ex=expected_lanes.get(lid)
        if ex and visible_text(lane,'lane-title')!=display(ex['name']):add('lane_visible_name',lid)
        rects=[shape(x,global_transform[id(x)]) for x in lane.iter() if tag(x)=='rect']
        if len(rects)==1:lane_bounds[lid]=box(rects[0])
        else:add('lane_geometry_unsupported',lid)
    left_order=[lid for lid,bb in sorted(lane_bounds.items(),key=lambda x:x[1][0])]
    if left_order!=[str(x['id']) for x in model['lanes']]:add('lane_source_order',left_order)
    bodies={};obstacles=[];text_obstacles=[];all_owned=set();node_raw=[];actual_glyph_centers={};filled_glyph_bounds={}
    for title in titles:
        for t in title.iter():
            tb=text_box(t,global_transform[id(t)])
            if tb:text_obstacles.append(('diagram-title',tb))
    if len(expected_nodes)!=len(model['nodes']):add('duplicate_source_node_id','Canonical source itself has duplicate node IDs')
    for n in model['nodes']:
        if type(n.get('order')) is not int:add('noninteger_source_order',n['id'])
    for n in nodes:
        nid=n.get('data-source-node-id');ex=expected_nodes.get(nid)
        if not ex:continue
        for key,value in [('data-node-type',ex['type']),('data-lane-id',ex['lane_id']),('data-step-ref','' if ex.get('step_ref') is None else str(ex['step_ref']))]:
            if n.get(key,'')!=str(value):add('node_metadata',{'id':nid,'field':key,'expected':value,'actual':n.get(key)})
        if visible_text(n,'node-label')!=display(ex['label']):add('node_visible_label',nid)
        try:
            bs=[]
            for own in n.iter():
                if own.get('data-glyph-role')=='body':
                    if shape(own,global_transform[id(own)]):bs.append(shape(own,global_transform[id(own)]))
                    else:
                        bs += [shape(c,global_transform[id(c)]) for c in own.iter() if c is not own and shape(c,global_transform[id(c)])]
            if len(bs)!=1:raise ValueError('exactly one actual body outline required, got '+str(len(bs)))
            if (ex['type']=='decision')!=(bs[0]['kind']=='polygon'):add('actual_glyph_type_mismatch',{'node':nid,'source_type':ex['type'],'actual_kind':bs[0]['kind']})
            bodies[nid]=bs[0]
            lb=lane_bounds.get(ex['lane_id']);bb=box(bs[0])
            if not lb or bb[0]<lb[0]-EPS or bb[2]>lb[2]+EPS:add('node_actual_lane_boundary',nid)
            decl=json.loads(n.get('data-body-outline','null'))
            if not same_shape(bs[0],decl):add('actual_outline_mismatch',nid)
            circles=[x for x in n.iter() if x.get('data-glyph-role')=='compound-circle']
            if ex['type'] in ('start','end') and len(circles)!=(1 if ex['type']=='start' else 2):add('missing_start_end_compound',nid)
            if ex['type'] in ('start','end'):
                for role in ('internal-connector','internal-arrow'):
                    if sum(x.get('data-glyph-role')==role for x in n.iter())!=1:add('missing_compound_internal_connection',{'node':nid,'role':role})
                circle_shapes=[shape(x,global_transform[id(x)]) for x in circles];outer=max(circle_shapes,key=lambda s:s['rx'])
                internals=[x for x in n.iter() if x.get('data-glyph-role')=='internal-connector'];ip=line_points(internals[0],global_transform[id(internals[0])]) if len(internals)==1 else []
                if len(ip)!=2 or not (boundary(outer,ip[0]) and boundary(bs[0],ip[1]) if ex['type']=='start' else boundary(bs[0],ip[0]) and boundary(outer,ip[1])):add('compound_connection_not_on_actual_glyph',nid)
                if ex['type']=='end' and any(abs(s['box'][0]+s['box'][2]-outer['box'][0]-outer['box'][2])>EPS or abs(s['box'][1]+s['box'][3]-outer['box'][1]-outer['box'][3])>EPS for s in circle_shapes):add('end_compound_circles_not_concentric',nid)
            if any(not any(tag(c) in ('circle','ellipse') for c in x.iter()) for x in circles):add('invalid_compound_circle',nid)
            actual=[];original=[];bbox_method=n.get('data-glyph-bbox-method','actual-filled-shapes-v1')
            if bbox_method not in ('actual-filled-shapes-v1','actual-shapes-and-full-font-envelope-v1','actual-primitives-and-complete-font-union'):add('unknown_glyph_bbox_method',{'node':nid,'method':bbox_method})
            for c,tr in walk(n,global_transform[id(n)],skip_root=True):
                all_owned.add(id(c));s=shape(c,tr)
                if s:actual.append(box(s));obstacles.append((nid,s))
                if c.get('data-glyph-role')=='internal-connector':
                    ip=line_points(c,tr)
                    if ip:
                        xs=[p[0] for p in ip];ys=[p[1] for p in ip];obstacles.append((nid,{'kind':'rounded_rect','box':[min(xs)-.5,min(ys)-.5,max(xs)+.5,max(ys)+.5],'rx':0.,'ry':0.}))
                tb=text_box(c,tr)
                if tb:
                    text_obstacles.append(('node:'+nid,tb))
                    if bbox_method in ('actual-shapes-and-full-font-envelope-v1','actual-primitives-and-complete-font-union'):actual.append(text_box(c,tr,1.05 if bbox_method=='actual-primitives-and-complete-font-union' else 1.))
            # Actual bodies are independently measured; metadata bbox also cross-checked.
            for c,tr in walk(n,skip_root=True):
                s=shape(c,tr)
                if s:original.append(box(s))
                if bbox_method in ('actual-shapes-and-full-font-envelope-v1','actual-primitives-and-complete-font-union'):
                    tb=text_box(c,tr,1.05 if bbox_method=='actual-primitives-and-complete-font-union' else 1.)
                    if tb:original.append(tb)
            if actual:
                filled_glyph_bounds[nid]=union([box(shape(c,tr)) for c,tr in walk(n,global_transform[id(n)],skip_root=True) if shape(c,tr)])
                actual_glyph_centers[nid]=(union(actual)[1]+union(actual)[3])/2
                if not same_box(union(actual),json.loads(n.get('data-glyph-layout-bbox','null'))):add('actual_layout_bbox_mismatch',nid)
                if not same_box(union(original),json.loads(n.get('data-glyph-original-bbox','null'))):add('actual_original_bbox_mismatch',nid)
        except Exception as exc:add('node_geometry_unsupported',{'id':nid,'error':str(exc)})
    for i,a in enumerate(model['nodes']):
        for b in model['nodes'][i+1:]:
            if a['id'] not in actual_glyph_centers or b['id'] not in actual_glyph_centers:continue
            ay=actual_glyph_centers[a['id']];by=actual_glyph_centers[b['id']]
            if a['order']<b['order'] and ay>=by-EPS or a['order']>b['order'] and ay<=by+EPS:add('source_order_layout_inversion',{'nodes':[a['id'],b['id']],'source_order':[a['order'],b['order']],'actual_y':[ay,by]})
            if a['order']==b['order'] and a['lane_id']==b['lane_id'] and ay>=by-EPS:add('same_lane_order_tie_not_stable',{'nodes':[a['id'],b['id']]})
    routes=[];edge_arrow_count=0;actual_ports=[];arrow_geometries=[]
    for e in edges:
        eid=e.get('data-source-edge-id');ex=expected_edges.get(eid)
        if not ex:continue
        for key,value in [('data-from',ex['from']),('data-to',ex['to']),('data-edge-type',ex.get('type','normal')),('data-label',ex.get('label','')),('data-path-id',ex.get('path_id',''))]:
            if e.get(key,'')!=str(value):add('edge_metadata',{'id':eid,'field':key,'expected':value,'actual':e.get(key)})
        label=str(ex.get('label',''));pid=str(ex.get('path_id',''));want=label+(' · '+pid if label and pid else pid)
        if visible_text(e,'edge-label')!=display(want):add('edge_visible_label',eid)
        try:
            geom=[];arrows=[]
            for c in e.iter():
                all_owned.add(id(c));tr=global_transform[id(c)]
                p=line_points(c,tr)
                if p:geom.append(p)
                if tag(c)=='polygon' and not inside_role(e,c,'edge-label'):arrows.append(shape(c,tr))
                tb=text_box(c,tr)
                if tb:text_obstacles.append(('edge:'+eid,tb))
            if len(geom)!=1:raise ValueError('exactly one independently complete connector required')
            p=geom[0];decl=json.loads(e.get('data-route-points','null'))
            if not same_points(p,decl):add('actual_route_mismatch',eid)
            sp=json.loads(e.get('data-source-port','null'));tp=json.loads(e.get('data-target-port','null'))
            if not close(p[0],sp) or not close(p[-1],tp):add('route_port_mismatch',eid)
            for key,np,side in [('from',p[0],e.get('data-source-side')),('to',p[-1],e.get('data-target-side'))]:
                actual_ports.append((ex[key],eid,key,np))
                sh=bodies.get(ex[key])
                if not sh or not boundary(sh,np):add('port_off_actual_outline',{'edge':eid,'end':key})
                elif not on_side(sh,np,side):add('port_wrong_actual_side',{'edge':eid,'end':key,'side':side})
            if len(arrows)!=1:raise ValueError('one real target arrow polygon required')
            edge_arrow_count+=1
            arrow_geometries.append((eid,ex['to'],arrows[0]['points'],p[-1]))
            tip=p[-1];tail=p[-2];vx,vy=tip[0]-tail[0],tip[1]-tail[1];ln=math.hypot(vx,vy)
            if not ln:raise ValueError('zero arrow terminal segment')
            ap=arrows[0]['points'];other=[q for q in ap if not close(q,tip)]
            if not any(close(q,tip) for q in ap) or not other or any(((q[0]-tip[0])*vx+(q[1]-tip[1])*vy)/ln>EPS for q in other):add('arrow_tip_or_direction',eid)
            for a,b in zip(p,p[1:]):
                if close(a,b):add('zero_route_segment',eid)
                elif abs(a[0]-b[0])>EPS and abs(a[1]-b[1])>EPS:add('nonorthogonal_route',eid)
                routes.append((eid,a,b))
        except Exception as exc:add('edge_geometry_unsupported',{'id':eid,'error':str(exc)})
    for i,(nid,eid,end,pt) in enumerate(actual_ports):
        for other,oid,oend,op in actual_ports[i+1:]:
            if nid==other and eid!=oid and close(pt,op):add('nonindependent_actual_ports',{'node':nid,'edges':[eid,oid]})
    # Reject unowned connector geometry rather than accidentally ignoring it.
    for c in r.iter():
        if tag(c) in ('line','polyline','path') and id(c) not in all_owned:
            # Lane borders are declared inside lane groups, not business edges.
            if not any(c in list(l.iter()) for l in lanes):add('unowned_connector_geometry',tag(c))
        if tag(c) in ('circle','ellipse') and id(c) not in all_owned:add('unmodeled_junction_or_circle',c.attrib)
        if tag(c) in ('rect','polygon','circle','ellipse','text') and id(c) not in all_owned and id(c) not in lane_owned and id(c) not in title_owned:add('unowned_glyph_geometry',{'tag':tag(c),'attrs':c.attrib})
    try:
        view=nums(r.get('viewBox',''))
        if len(view)!=4 or view[2]<=0 or view[3]<=0:raise ValueError('positive complete viewBox required')
        vl,vt,vr,vb=view[0],view[1],view[0]+view[2],view[1]+view[3]
        for c,tr in walk(r):
            sh=shape(c,tr);tb=text_box(c,tr);bounds=box(sh) if sh else tb
            if bounds and (bounds[0]<vl-EPS or bounds[1]<vt-EPS or bounds[2]>vr+EPS or bounds[3]>vb+EPS):add('glyph_clipped_by_viewbox',{'tag':tag(c),'bounds':bounds,'viewBox':view})
    except Exception as exc:add('canvas_geometry_unsupported',str(exc))
    for eid,a,b in routes:
        h=abs(a[1]-b[1])<=EPS;v=(a[1]+b[1])/2 if h else (a[0]+b[0])/2;lo,hi=sorted([a[0],b[0]] if h else [a[1],b[1]])
        for nid,s in obstacles:
            if any(min(hi,z)-max(lo,x)>EPS for x,z in extents(s,h,v) if z-x>EPS):add('connector_node_intersection',{'edge':eid,'node':nid,'segment':[a,b]})
        for owner,tb in text_obstacles:
            cross=(tb[1],tb[3]) if h else (tb[0],tb[2]);along=(tb[0],tb[2]) if h else (tb[1],tb[3])
            if cross[0]+EPS<v<cross[1]-EPS and min(hi,along[1])-max(lo,along[0])>EPS:add('connector_text_intersection',{'edge':eid,'text_owner':owner,'segment':[a,b]})
    unjoined_crossings=[];contact_seen=set()
    for i,(eid,a,b) in enumerate(routes):
        for fid,c,d in routes[i+1:]:
            if eid==fid:continue
            cs=segment_contacts(a,b,c,d)
            for q in cs:
                endpoint_first=close(q,a) or close(q,b);endpoint_second=close(q,c) or close(q,d)
                key=(tuple(sorted((eid,fid))),round(q[0],2),round(q[1],2))
                if key in contact_seen:continue
                contact_seen.add(key)
                if endpoint_first or endpoint_second:add('unmodeled_route_point_contact',{'edges':[eid,fid],'point':q,'type':'T/endpoint contact has no canonical business junction'})
                else:unjoined_crossings.append({'edges':[eid,fid],'point':q,'meaning':'proper H/V crossing without join/dot'})
            ah=abs(a[1]-b[1])<=EPS;ch=abs(c[1]-d[1])<=EPS
            if ah==ch and abs((a[1] if ah else a[0])-(c[1] if ah else c[0]))<=EPS:
                x,y=sorted([a[0],b[0]] if ah else [a[1],b[1]]);u,v=sorted([c[0],d[0]] if ah else [c[1],d[1]])
                if min(y,v)-max(x,u)>EPS:add('connector_collinear_overlap',{'edges':[eid,fid]})
    for eid,target,pp,tip in arrow_geometries:
        for nid,sh in obstacles:
            penetration,contacts=polygon_shape_contact(pp,sh)
            allowed=(nid==target and not penetration and all(close(q,tip) for q in contacts))
            if (penetration or contacts) and not allowed:add('arrow_glyph_intersection',{'edge':eid,'node':nid,'penetrating':penetration,'contacts':contacts[:4]})
        for owner,tb in text_obstacles:
            sh={'kind':'rounded_rect','box':tb,'rx':0.,'ry':0.};penetration,contacts=polygon_shape_contact(pp,sh)
            if penetration or contacts:add('arrow_text_intersection',{'edge':eid,'text_owner':owner})
        sh={'kind':'polygon','points':pp}
        for fid,a,b in routes:
            if fid!=eid and (shape_contacts(a,b,sh) or strict_inside_polygon(a,pp) or strict_inside_polygon(b,pp)):add('arrow_other_connector_intersection',{'arrow_edge':eid,'connector_edge':fid})
    for i,(eid,target,pp,tip) in enumerate(arrow_geometries):
        for fid,other,qq,other_tip in arrow_geometries[i+1:]:
            penetration,contacts=polygon_shape_contact(pp,{'kind':'polygon','points':qq})
            if penetration or contacts:add('arrow_arrow_intersection',{'edges':[eid,fid]})
    for i,(owner,a) in enumerate(text_obstacles):
        for other,b in text_obstacles[i+1:]:
            if min(a[2],b[2])-max(a[0],b[0])>EPS and min(a[3],b[3])-max(a[1],b[1])>EPS and owner!=other:add('glyph_text_overlap',{'text_owners':[owner,other]})
        pp=[(a[0],a[1]),(a[2],a[1]),(a[2],a[3]),(a[0],a[3])]
        for nid,sh in obstacles:
            if owner=='node:'+nid:continue
            penetrating,contacts=polygon_shape_contact(pp,sh)
            if penetrating or contacts:add('text_other_glyph_intersection',{'text_owner':owner,'node':nid})
    for i,nid in enumerate(bodies):
        a=box(bodies[nid])
        for other in list(bodies)[i+1:]:
            b=box(bodies[other])
            if min(a[2],b[2])-max(a[0],b[0])>EPS and min(a[3],b[3])-max(a[1],b[1])>EPS:add('actual_node_body_overlap',{'nodes':[nid,other]})
    for i,nid in enumerate(filled_glyph_bounds):
        a=filled_glyph_bounds[nid]
        for other in list(filled_glyph_bounds)[i+1:]:
            b=filled_glyph_bounds[other]
            if min(a[2],b[2])-max(a[0],b[0])>EPS and min(a[3],b[3])-max(a[1],b[1])>EPS:add('compound_glyph_bounds_overlap',{'nodes':[nid,other]})
    stats.update(unjoined_HV_crossings=len(unjoined_crossings),nodes=len(nodes),edges=len(edges),lanes=len(lanes),actual_body_outlines=len(bodies),segments=len(routes),target_arrows=edge_arrow_count,text_boxes=len(text_obstacles),compound_circles=sum(x.get('data-glyph-role')=='compound-circle' for x in r.iter()),original_glyph_inventory_checked=inventory is not None,raw_engine_glyph_origin_checked=anchor_svg is not None)
    return {'pass':not problems,'problems':problems,'counts':stats,'unjoined_crossings':unjoined_crossings,'facts_scope':facts_scope,'limits':'Offline source/metadata and actual SVG geometry checks only; not browser viewport/zoom/scroll/fullscreen verification and not workflow or gate approval.'}

def inside_role(parent,child,role):
    return any(child in list(x.iter()) for x in parent.iter() if x.get('data-glyph-role')==role)
def same_box(a,b):return isinstance(b,list) and len(b)==4 and all(abs(float(x)-float(y))<=EPS for x,y in zip(a,b))
def union(a):return [min(x[0] for x in a),min(x[1] for x in a),max(x[2] for x in a),max(x[3] for x in a)]
def same_points(a,b):return isinstance(b,list) and len(a)==len(b) and all(close(x,y) for x,y in zip(a,b))
def same_shape(a,b):
    if not isinstance(b,dict) or a['kind']!=b.get('kind'):return False
    if a['kind']=='polygon':
        aa=list(a['points']);bb=list(b.get('points',[]))
        if len(aa)>1 and close(aa[0],aa[-1]):aa.pop()
        if len(bb)>1 and close(bb[0],bb[-1]):bb.pop()
        return same_points(aa,bb)
    return same_box(a['box'],b.get('box')) and all(abs(float(a[k])-float(b.get(k,-999)))<=EPS for k in ('rx','ry'))
def on_side(sh,p,side):
    if side not in ('top','bottom','left','right'):return False
    h=side in ('left','right');v=p[1] if h else p[0];ranges=extents(sh,h,v)
    if not ranges:
        # exact polygon extrema/rounded corner contacts can be endpoints of scan intervals.
        l,t,r,b=box(sh);return abs((p[1] if side in ('top','bottom') else p[0])-({'top':t,'bottom':b,'left':l,'right':r}[side]))<=EPS
    q=min(x for x,z in ranges) if side in ('top','left') else max(z for x,z in ranges)
    return abs((p[0] if h else p[1])-q)<=EPS

def mutate(source,svg,kind):
    r=ET.fromstring(svg);parents={id(c):p for p in r.iter() for c in p};ng=[e for e in r.iter() if tag(e)=='g' and e.get('data-source-node-id')];eg=[e for e in r.iter() if tag(e)=='g' and e.get('data-from') is not None and e.get('data-source-edge-id')]
    if kind=='forged_formal_stock':r.set('data-renderer','plantuml');r.set('data-plantuml-render','pass');r.set('data-plantuml-render-method','stock')
    elif kind=='formal_without_backend':r.set('data-renderer','plantuml');r.set('data-plantuml-render','pass');r.set('data-plantuml-render-method','local-glyphs-canonical-routing');r.attrib.pop('data-renderer-backend',None)
    elif kind=='hidden_wrapper':ng[0].set('opacity','0')
    elif kind=='lost_font_inheritance':
        for x in r.iter():x.attrib.pop('font-family',None)
    elif kind=='clipped_canvas':r.set('viewBox','0 0 20 20')
    elif kind=='extra_glyph_overlay':ET.SubElement(r,'{'+NS+'}rect',{'x':'20','y':'20','width':'120','height':'120','fill':'#FFF'})
    elif kind=='missing_edge':parents[id(eg[0])].remove(eg[0])
    elif kind=='missing_compound_circle':
        c=next(x for n in ng for x in n.iter() if x.get('data-glyph-role')=='compound-circle');parents[id(c)].remove(c)
    elif kind=='wrong_from':
        e=eg[0];e.set('data-from',next(n.get('data-source-node-id') for n in ng if n.get('data-source-node-id')!=e.get('data-from')))
    elif kind=='wrong_lane':
        n=ng[0];n.set('data-lane-id',next((x['id'] for x in source['flow_diagram']['lanes'] if x['id']!=n.get('data-lane-id')),'qa-wrong-lane'))
    elif kind=='truncated_visible_label':
        owners=[x for x in r.iter() if x.get('data-glyph-role') in ('node-label','edge-label')];tx=next(t for o in owners for t in o.iter() if tag(t)=='text' and t.text and t.text.strip());tx.text=tx.text[:-1]
    elif kind=='route_T_contact':
        e=next(x for x in eg if len(json.loads(x.get('data-route-points','[]')))>=4)
        other=next(x for x in eg if x is not e and len(json.loads(x.get('data-route-points','[]')))>=4)
        p=json.loads(e.get('data-route-points'));op=json.loads(other.get('data-route-points'));a,b=op[1:3];q=[(a[0]+b[0])/2,(a[1]+b[1])/2];stub=p[1]
        if abs(a[1]-b[1])<=EPS:
            inserted=[[q[0],stub[1]],q,[q[0]+7,q[1]],[q[0]+7,stub[1]],stub]
        else:inserted=[[stub[0],q[1]],q,[q[0],q[1]+7],[stub[0],q[1]+7],stub]
        p=p[:2]+inserted+p[2:];e.set('data-route-points',json.dumps(p));conn=next(x for x in e.iter() if tag(x) in ('polyline','path','line'))
        conn.tag='{'+NS+'}polyline'
        for k in ('x1','x2','y1','y2','d'):conn.attrib.pop(k,None)
        conn.set('points',' '.join(f'{x},{y}' for x,y in p))
    elif kind in ('arrow_arrow_contact','arrow_text_contact','arrow_glyph_contact'):
        arrows=[x for e in eg for x in e.iter() if x.get('data-glyph-role')=='canonical-arrow'];a=arrows[0]
        if kind=='arrow_arrow_contact':a.set('points',arrows[1].get('points'))
        else:
            gt={id(x):tr for x,tr in walk(r)}
            if kind=='arrow_text_contact':
                tx=next(x for x in r.iter() if tag(x)=='text' and x.get('data-glyph-role') in ('node-label','edge-label-text'));l,t,rr,b=text_box(tx,gt[id(tx)])
            else:l,t,rr,b=box(json.loads(ng[-1].get('data-body-outline')))
            x,y=(l+rr)/2,(t+b)/2;a.set('points',f'{x-2},{y-2} {x+2},{y-2} {x},{y+2}')
    elif kind=='glyph_label_overlap':
        groups=[x for e in eg for x in e.iter() if x.get('data-glyph-role')=='edge-label' and tag(x)=='g'];a,b=groups[:2];gt={id(x):tr for x,tr in walk(r)}
        ta=next(x for x in a.iter() if tag(x)=='text');tb=next(x for x in b.iter() if tag(x)=='text');aa=text_box(ta,gt[id(ta)]);bb=text_box(tb,gt[id(tb)]);dx,dy=translated(a,(0.,0.));a.set('transform',f'translate({dx+bb[0]-aa[0]},{dy+bb[1]-aa[1]})')
    elif kind=='label_other_glyph_contact':
        a=next(x for e in eg for x in e.iter() if x.get('data-glyph-role')=='edge-label' and tag(x)=='g');gt={id(x):tr for x,tr in walk(r)};tx=next(x for x in a.iter() if tag(x)=='text');aa=text_box(tx,gt[id(tx)]);bb=box(json.loads(ng[-1].get('data-body-outline')));dx,dy=translated(a,(0.,0.));a.set('transform',f'translate({dx+(bb[0]+bb[2]-aa[0]-aa[2])/2},{dy+(bb[1]+bb[3]-aa[1]-aa[3])/2})')
    elif kind=='unmodeled_join_dot':E=ET.SubElement(r,'{'+NS+'}circle',{'cx':'40','cy':'40','r':'3','fill':'#344054'})
    elif kind=='arrow_connector_contact':
        e=next(x for x in eg if len(json.loads(x.get('data-route-points','[]')))>=4);other=next(x for x in eg if x is not e);ar=next(x for x in other.iter() if x.get('data-glyph-role')=='canonical-arrow');pp=points(ar.get('points'));x=sum(z[0] for z in pp)/len(pp);y=sum(z[1] for z in pp)/len(pp);p=json.loads(e.get('data-route-points'));q=p[1];p=p[:2]+[[x,q[1]],[x,y],[x+1,y],[x+1,q[1]],q]+p[2:];e.set('data-route-points',json.dumps(p));conn=next(x for x in e.iter() if tag(x) in ('line','polyline','path'));conn.tag='{'+NS+'}polyline'
        for k in ('x1','x2','y1','y2','d'):conn.attrib.pop(k,None)
        conn.set('points',' '.join(f'{a},{b}' for a,b in p))
    elif kind=='actual_nodes_overlap':
        a,b=ng[:2];gt={id(x):tr for x,tr in walk(r)};aa=box(json.loads(a.get('data-body-outline')));bb=box(json.loads(b.get('data-body-outline')));dx,dy=translated(a,(0.,0.));a.set('transform',f'translate({dx+(bb[0]+bb[2]-aa[0]-aa[2])/2},{dy+(bb[1]+bb[3]-aa[1]-aa[3])/2})')
    elif kind in ('port_drift','middle_through_frame'):
        e=next((x for x in eg if len(json.loads(x.get('data-route-points','[]')))>=4),eg[0]) if kind=='middle_through_frame' else eg[0];conn=next(x for x in e.iter() if tag(x) in ('polyline','path','line'));p=json.loads(e.get('data-route-points'))
        if kind=='port_drift':
            a,b=p[:2];ln=math.dist(a,b);p[0]=[a[0]+9*(b[0]-a[0])/ln,a[1]+9*(b[1]-a[1])/ln];e.set('data-source-port',json.dumps(p[0]))
        else:
            target=next((n for n in ng if n.get('data-source-node-id') not in (e.get('data-from'),e.get('data-to'))),ng[-1]);sh=json.loads(target.get('data-body-outline'));l,t,rr,b=box(sh);x,y=(l+rr)/2,(t+b)/2;q=p[1];p=p[:2]+[[x,q[1]],[x,y],[x+2,y],[x+2,q[1]],q]+p[2:]
        e.set('data-route-points',json.dumps(p))
        if tag(conn)=='polyline':conn.set('points',' '.join(f'{x},{y}' for x,y in p))
        elif tag(conn)=='path':conn.set('d','M '+' L '.join(f'{x},{y}' for x,y in p))
        else:
            conn.tag='{'+NS+'}polyline'
            for k in ('x1','y1','x2','y2'):conn.attrib.pop(k,None)
            conn.set('points',' '.join(f'{x},{y}' for x,y in p))
    else:raise ValueError(kind)
    # Keep overall binding valid on purpose: each semantic/geometric checker must reject.
    r.attrib.pop('data-business-svg-sha256',None)
    if r.get('data-renderer')=='plantuml':
        r.set('data-business-facts-sha256',digest(source));r.set('data-business-svg-sha256',hashlib.sha256(ET.tostring(r,encoding='utf-8')).hexdigest())
    return ET.tostring(r,encoding='unicode')

NEGATIVE_CODES={'forged_formal_stock':'formal_renderer_provenance','formal_without_backend':'routing_backend','missing_edge':'edge_coverage','wrong_from':'edge_metadata','wrong_lane':'node_metadata','truncated_visible_label':'node_visible_label','port_drift':'port_off_actual_outline','middle_through_frame':'connector_node_intersection','route_T_contact':'unmodeled_route_point_contact','arrow_arrow_contact':'arrow_arrow_intersection','arrow_text_contact':'arrow_text_intersection','arrow_glyph_contact':'arrow_glyph_intersection','glyph_label_overlap':'glyph_text_overlap','actual_nodes_overlap':'actual_node_body_overlap','arrow_connector_contact':'arrow_other_connector_intersection','label_other_glyph_contact':'text_other_glyph_intersection','unmodeled_join_dot':'unmodeled_junction_or_circle'}
NEGATIVE_CODES.update(hidden_wrapper='hidden_canonical_geometry',clipped_canvas='glyph_clipped_by_viewbox',extra_glyph_overlay='unowned_glyph_geometry')
NEGATIVE_CODES.update(lost_font_inheritance='engine_effective_font_changed')
NEGATIVE_CODES.update(missing_compound_circle='missing_start_end_compound')
def negative_tests(source,svg,out,facts_scope,inventory,anchor_svg,font_context=None):
    base=qa(source,svg,facts_scope,inventory,anchor_svg,font_context)
    if not base['pass']:return {'pass':False,'not_run':'baseline failed independent QA','baseline':base}
    out.mkdir(parents=True,exist_ok=True);results={}
    for kind,expected in NEGATIVE_CODES.items():
        bad=mutate(source,svg,kind);(out/(kind+'.svg')).write_text(bad);v=qa(source,bad,facts_scope,inventory,anchor_svg,font_context);codes=[x['code'] for x in v['problems']]
        # Truncation may hit an edge label depending on fixture ownership.
        hit=expected in codes or (kind=='truncated_visible_label' and 'edge_visible_label' in codes)
        results[kind]={'rejected':not v['pass'],'expected_checker_triggered':hit,'codes':sorted(set(codes))}
    # Coordinate SVG+inventory corruption so an inventory mismatch cannot be the sole
    # reason for rejecting the measured advance extension.
    badinv=copy.deepcopy(inventory);modified=None
    for section in ('nodes','edge_labels'):
        for item in badinv.get(section,{}).values():
            for index,xml in enumerate(item.get('elements_xml',[])):
                x=ET.fromstring(xml)
                if x.get('data-font-measure-method')==MEASURE_METHOD:
                    x.set('textLength',str(f(x,'textLength')+3));item['elements_xml'][index]=ET.tostring(x,encoding='unicode');modified=x;break
            if modified is not None:break
        if modified is not None:break
    if modified is not None:
        root=ET.fromstring(svg)
        for x in root.iter():
            if tag(x)=='text' and x.get('data-font-measure-method')==MEASURE_METHOD and x.text==modified.text and x.get('x')==modified.get('x') and x.get('y')==modified.get('y'):x.set('textLength',modified.get('textLength'))
        root.attrib.pop('data-business-svg-sha256',None)
        if root.get('data-renderer')=='plantuml':root.set('data-business-svg-sha256',hashlib.sha256(ET.tostring(root,encoding='utf-8')).hexdigest())
        bad=ET.tostring(root,encoding='unicode');(out/'corrupt_measured_advance.svg').write_text(bad);(out/'corrupt_measured_advance.inventory.json').write_text(json.dumps(badinv,ensure_ascii=False,indent=2));v=qa(source,bad,facts_scope,badinv,anchor_svg,font_context);codes=[x['code'] for x in v['problems']];results['corrupt_measured_advance']={'rejected':not v['pass'],'expected_checker_triggered':'font_advance_measurement_mismatch' in codes,'codes':sorted(set(codes))}
    return {'pass':all(x['rejected'] and x['expected_checker_triggered'] for x in results.values()),'tests':results,'limits':'Deliberate DOM mutations; original source facts and gate states are not changed.'}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('source',type=Path);ap.add_argument('svg',type=Path);ap.add_argument('--facts-scope',choices=('detail','model'),default='model');ap.add_argument('--inventory',type=Path);ap.add_argument('--anchor',type=Path);ap.add_argument('--puml',type=Path);ap.add_argument('--engine',type=Path);ap.add_argument('--negative-tests',action='store_true');ap.add_argument('--out',type=Path,required=True);a=ap.parse_args();source=json.loads(a.source.read_text());svg=a.svg.read_text();ip=a.inventory or a.svg.parent/'glyph-inventory.json';inventory=json.loads(ip.read_text()) if ip.is_file() else None;apath=a.anchor or a.svg.parent/(source['id']+'.anchor.svg');anchor_svg=apath.read_text() if apath.is_file() else None;pp=a.puml or a.svg.parent/(source['id']+'.puml');ep=a.engine or a.svg.parent/(source['id']+'.engine.svg');font_context={'puml':pp.read_text(),'raw_engine_svg':ep.read_text() if ep.is_file() else None} if pp.is_file() else None;report=qa(source,svg,a.facts_scope,inventory,anchor_svg,font_context);report['input_sha256']={'source':hashlib.sha256(a.source.read_bytes()).hexdigest(),'svg':hashlib.sha256(a.svg.read_bytes()).hexdigest()};a.out.mkdir(parents=True,exist_ok=True)
    if a.negative_tests:report['negative_tests']=negative_tests(source,svg,a.out/'negative-fixtures',a.facts_scope,inventory,anchor_svg,font_context)
    report['qa_evidence']={'qa_script_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'plantuml_wrapper_sha256':hashlib.sha256(Path('/opt/homebrew/bin/plantuml').read_bytes()).hexdigest(),'puml_sha256':hashlib.sha256(pp.read_bytes()).hexdigest() if pp.is_file() else None,'anchor_sha256':hashlib.sha256(apath.read_bytes()).hexdigest() if apath.is_file() else None,'original_engine_sha256':hashlib.sha256(ep.read_bytes()).hexdigest() if ep.is_file() else None,'inventory_sha256':hashlib.sha256(ip.read_bytes()).hexdigest() if ip.is_file() else None,'independent_font_helper_sha256':hashlib.sha256((Path(__file__).parent/'IndependentSvgAdvanceQA.java').read_bytes()).hexdigest(),'independently_replayed_font_metrics':[{'text':k[0],'font_size':k[1],'style':k[2],'result':v} for k,v in MEASURE_CACHE.items()]}
    (a.out/'qa-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'pass':report['pass'],'problem_count':len(report['problems']),'negative_tests_pass':report.get('negative_tests',{}).get('pass'),'report':str(a.out/'qa-report.json')},ensure_ascii=False));return 0 if report['pass'] and report.get('negative_tests',{'pass':True})['pass'] else 2
if __name__=='__main__':raise SystemExit(main())
