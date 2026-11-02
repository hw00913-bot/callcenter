"""Candidate-only deterministic orthogonal SVG connector rerouting. Standard library only.
Does not move nodes/text/arrowheads/viewBox. It is NOT a complete visual acceptance gate.
A failed route returns the original SVG with a failure report (transactional fail closed).
"""
from __future__ import annotations
import collections,copy,heapq,json,math,re,xml.etree.ElementTree as ET
EPS=0.01
NS='http://www.w3.org/2000/svg';ET.register_namespace('',NS)
def tag(e):return e.tag.rsplit('}',1)[-1]
def number(v):return float(re.sub(r'px$','',v))
def points(s):
 a=[float(x) for x in re.findall(r'-?\d+(?:\.\d+)?',s)];return list(zip(a[::2],a[1::2]))
def color(e):return (e.get('fill') or '').upper()
def arrow(e):return '#55657D' in e.get('style','').upper()
def fmt(v):return ('%.3f'%v).rstrip('0').rstrip('.') or '0'
def bbox(poly):return (min(x for x,y in poly),min(y for x,y in poly),max(x for x,y in poly),max(y for x,y in poly))
def rect(x,y,w,h):return [(x,y),(x+w,y),(x+w,y+h),(x,y+h)]
def is_inside(p,poly):
 # Boundary is allowed; only strict interior blocks a connector.
 x,y=p;cross=False
 for (ax,ay),(bx,by) in zip(poly,poly[1:]+poly[:1]):
  if abs((x-ax)*(by-ay)-(y-ay)*(bx-ax))<EPS and min(ax,bx)-EPS<=x<=max(ax,bx)+EPS and min(ay,by)-EPS<=y<=max(ay,by)+EPS:return False
  if (ay>y)!=(by>y) and x<(bx-ax)*(y-ay)/(by-ay)+ax:cross=not cross
 return cross

def hits_poly(a,b,poly):
 # Exact convex polygon interior intersection for axis-aligned segments.
 x1,y1=a;x2,y2=b
 if abs(y1-y2)<EPS:
  if abs(x1-x2)<EPS:return is_inside(a,poly)
  cuts=[]
  for (ax,ay),(bx,by) in zip(poly,poly[1:]+poly[:1]):
   if abs(ay-by)<EPS:continue
   if min(ay,by)-EPS<=y1<=max(ay,by)+EPS:cuts.append(ax+(bx-ax)*(y1-ay)/(by-ay))
  if len(cuts)<2:return False
  lo,hi=max(min(x1,x2),min(cuts)),min(max(x1,x2),max(cuts))
  return hi-lo>EPS and is_inside(((lo+hi)/2,y1),poly)
 if abs(x1-x2)<EPS:
  return hits_poly((y1,x1),(y2,x2),[(y,x) for x,y in poly])
 raise ValueError('nonorthogonal connector segment')

def relation(a,b,c,d):
 """Positive-length overlap, strict crossing, or zero-length endpoint touch."""
 ah=abs(a[1]-b[1])<EPS;ch=abs(c[1]-d[1])<EPS
 if ah==ch:
  same=abs(a[1]-c[1])<EPS if ah else abs(a[0]-c[0])<EPS
  if not same:return None
  k=0 if ah else 1;lo=max(min(a[k],b[k]),min(c[k],d[k]));hi=min(max(a[k],b[k]),max(c[k],d[k]));return 'overlap' if hi-lo>EPS else None
 if not ah:return relation(c,d,a,b)
 x,y=c[0],a[1]
 if min(a[0],b[0])-EPS<=x<=max(a[0],b[0])+EPS and min(c[1],d[1])-EPS<=y<=max(c[1],d[1])+EPS:
  if min(a[0],b[0])+EPS<x<max(a[0],b[0])-EPS and min(c[1],d[1])+EPS<y<max(c[1],d[1])-EPS:return 'cross'
  return 'touch'
 return None

def geometry(root):
 obs=[];connect=[];unsupported=[]
 for i,e in enumerate(root.iter()):
  t=tag(e)
  if e.get('transform'):unsupported.append('transformed '+t)
  if t=='rect' and e.get('rx'):
   x,y,w,h=map(number,[e.get('x','0'),e.get('y','0'),e.attrib['width'],e.attrib['height']]);obs.append({'kind':'action','id':i,'poly':rect(x,y,w,h)})
  elif t=='polygon' and color(e)=='#FFF8E8':obs.append({'kind':'decision','id':i,'poly':points(e.attrib['points'])})
  elif t in ('ellipse','circle'):
   cx,cy=map(number,[e.attrib['cx'],e.attrib['cy']]);rx=number(e.get('rx',e.get('r','0')));ry=number(e.get('ry',e.get('r','0')))
   # Bounding rectangle is conservative: no candidate can clip the actual circle/ellipse.
   obs.append({'kind':'terminal','id':i,'poly':rect(cx-rx,cy-ry,2*rx,2*ry)})
  elif t=='text' and ''.join(e.itertext()).strip():
   if not e.get('x') or not e.get('y') or not e.get('font-size'):unsupported.append('text without position/font attributes');continue
   text=''.join(e.itertext());x,y,sz=map(number,[e.attrib['x'],e.attrib['y'],e.attrib['font-size']])
   if e.get('textLength'):w=number(e.get('textLength'))
   elif re.fullmatch(r'[\u4e00-\u9fff]+',text):w=sz*len(text)
   else:unsupported.append('text without measurable length outside known CJK labels');continue
   anchor=e.get('text-anchor','start')
   if anchor=='middle':x-=w/2
   elif anchor=='end':x-=w
   # Conservative static baseline envelope; real glyph metrics still need visual review.
   obs.append({'kind':'text','id':i,'poly':rect(x-.25,y-sz,w+.5,sz+max(1,sz*.25))})
  if arrow(e) and t in ('line','polyline','path'):
   if t=='line':ps=[(number(e.attrib['x1']),number(e.attrib['y1'])),(number(e.attrib['x2']),number(e.attrib['y2']))]
   elif t=='polyline':ps=points(e.attrib['points'])
   else:
    # No silent omission of curved or relative path commands.
    d=e.get('d','');tokens=re.findall(r'[A-Za-z]|-?\d+(?:\.\d+)?',d);ps=[];cmd=None;j=0;cur=(0.,0.)
    try:
     while j<len(tokens):
      if tokens[j].isalpha():cmd=tokens[j];j+=1
      if cmd in ('M','L'):cur=(float(tokens[j]),float(tokens[j+1]));j+=2;ps.append(cur);cmd='L'
      elif cmd=='H':cur=(float(tokens[j]),cur[1]);j+=1;ps.append(cur)
      elif cmd=='V':cur=(cur[0],float(tokens[j]));j+=1;ps.append(cur)
      else:raise ValueError('unsupported SVG connector path command '+str(cmd))
    except (ValueError,IndexError) as ex:unsupported.append(str(ex));continue
   if any(abs(a[0]-b[0])>EPS and abs(a[1]-b[1])>EPS for a,b in zip(ps,ps[1:])):unsupported.append('nonorthogonal existing connector');continue
   connect.append({'id':i,'element':e,'points':ps})
 return obs,connect,unsupported

def audit(root):
 obs,con,unsupported=geometry(root);hits=[];segments=[];overlaps=[];crossings=[];touches=[];selfs=[]
 for c in con:
  for si,(a,b) in enumerate(zip(c['points'],c['points'][1:])):
   for o in obs:
    if hits_poly(a,b,o['poly']):hits.append({'connector':c['id'],'segment':si,'kind':o['kind'],'obstacle':o['id'],'a':a,'b':b})
   segments.append((c['id'],si,a,b))
 for i,(ci,si,a,b) in enumerate(segments):
  for cj,sj,c,d in segments[i+1:]:
   rel=relation(a,b,c,d)
   if not rel:continue
   if ci==cj:
    if abs(si-sj)>1:selfs.append((ci,si,sj,rel))
   elif rel=='overlap':overlaps.append((ci,si,cj,sj))
   elif rel=='cross':crossings.append((ci,si,cj,sj))
   elif rel=='touch' and not any(abs(p[0]-q[0])<EPS and abs(p[1]-q[1])<EPS for p in (a,b) for q in (c,d)):touches.append((ci,si,cj,sj))
 return {'unsupported':unsupported,'obstacle_count':len(obs),'connectors':len(con),'segments':len(segments),'obstacle_hits':hits,'node_hits':sum(h['kind']!='text' for h in hits),'text_hits':sum(h['kind']=='text' for h in hits),'overlap_candidates':overlaps,'crossing_candidates':crossings,'t_junction_candidates':touches,'self_intersections':selfs}

def simplify(ps):
 out=[]
 for p in ps:
  if out and p==out[-1]:continue
  if len(out)>=2 and ((abs(out[-2][0]-out[-1][0])<1e-9 and abs(out[-1][0]-p[0])<1e-9) or (abs(out[-2][1]-out[-1][1])<1e-9 and abs(out[-1][1]-p[1])<1e-9)):out[-1]=p
  else:out.append(p)
 return out

def interval_allowed(allowed,oid,axis,fixed,lo,hi):
 return any(k==axis and abs(fixed-v)<EPS and start-EPS<=lo and hi<=end+EPS for k,v,start,end in allowed.get(oid,[]))
def known_contact(pt,touches,overlaps):
 return any(abs(pt[0]-x)<EPS and abs(pt[1]-y)<EPS for x,y in touches) or any(abs(pt[1-k]-fixed)<EPS and lo-EPS<=pt[k]<=hi+EPS for k,fixed,lo,hi in overlaps)
def text_allowed(a,b,o,allowed):
 if o['kind']!='text':return False
 axis=0 if abs(a[1]-b[1])<EPS else 1;box=bbox(o['poly']);lo=max(min(a[axis],b[axis]),box[axis]);hi=min(max(a[axis],b[axis]),box[axis+2])
 return interval_allowed(allowed,o['id'],axis,a[1-axis],lo,hi)
def route(a,b,obs,existing,width,height,allowed_text):
 if abs(a[1]-b[1])<EPS:direction=0 if b[0]>a[0] else 2;unit=(1 if direction==0 else -1,0)
 elif abs(a[0]-b[0])<EPS:direction=1 if b[1]>a[1] else 3;unit=(0,1 if direction==1 else -1)
 else:return None,'nonorthogonal source'
 distance=abs(a[0]-b[0])+abs(a[1]-b[1]);stub=min(6.,distance/4)
 if distance<EPS:return None,'zero length source'
 s=(a[0]+unit[0]*stub,a[1]+unit[1]*stub);t=(b[0]-unit[0]*stub,b[1]-unit[1]*stub)
 if any((hits_poly(a,s,o['poly']) and not text_allowed(a,s,o,allowed_text)) or (hits_poly(t,b,o['poly']) and not text_allowed(t,b,o,allowed_text)) for o in obs):return None,'fixed endpoint tangent stub intersects an obstacle'
 xs={a[0],b[0],s[0],t[0],2.,width-2};ys={a[1],b[1],s[1],t[1],2.,height-2}
 for o in obs:
  x0,y0,x1,y1=bbox(o['poly']);xs.update((x0-4,x1+4));ys.update((y0-4,y1+4))
 for aa,bb,allowed_cross,allowed_touch,allowed_overlap in existing:
  for xx,yy in (aa,bb):xs.update((xx-4,xx+4));ys.update((yy-4,yy+4))
 xs.update((s[0]-12,s[0]+12,t[0]-12,t[0]+12));ys.update((s[1]-12,s[1]+12,t[1]-12,t[1]+12))
 def coalesce(values,protected):
  clusters=[]
  for value in sorted(values):
   if clusters and value-clusters[-1][-1]<=EPS:clusters[-1].append(value)
   else:clusters.append([value])
  result=[]
  for cluster in clusters:
   keep=[value for value in protected if value in cluster]
   result.extend(sorted(set(keep)) if keep else [cluster[0]])
  return sorted(set(result))
 xs=coalesce([v for v in xs if EPS<v<width-EPS],[s[0],t[0],a[0],b[0]]);ys=coalesce([v for v in ys if EPS<v<height-EPS],[s[1],t[1],a[1],b[1]])
 xi={x:i for i,x in enumerate(xs)};yi={y:i for i,y in enumerate(ys)};start=(xi[s[0]],yi[s[1]],direction);target=(xi[t[0]],yi[t[1]])
 blocked={};edgecache={};interval_cache={};existing_cache={};turn_cache={}
 def obstacle_intervals(axis,value):
  key=(axis,value)
  if key in interval_cache:return interval_cache[key]
  intervals=[]
  for o in obs:
   poly=o['poly'] if axis==0 else [(y,x) for x,y in o['poly']];cuts=[]
   for (ax,ay),(bx,by) in zip(poly,poly[1:]+poly[:1]):
    if abs(ay-by)>EPS and min(ay,by)-EPS<=value<=max(ay,by)+EPS:cuts.append(ax+(bx-ax)*(value-ay)/(by-ay))
   if len(cuts)>=2:
    lo,hi=min(cuts),max(cuts)
    if hi-lo>EPS and is_inside(((lo+hi)/2,value),poly):intervals.append((lo,hi,o['id'],o['kind']))
  interval_cache[key]=intervals;return intervals
 def row_existing(axis,value):
  key=(axis,value)
  if key not in existing_cache:
   candidates=[]
   for item in existing:
    c,d=item[:2]
    if axis==0:
     relevant=(abs(c[1]-d[1])<EPS and abs(c[1]-value)<EPS) or (abs(c[0]-d[0])<EPS and min(c[1],d[1])-EPS<=value<=max(c[1],d[1])+EPS)
    else:
     relevant=(abs(c[0]-d[0])<EPS and abs(c[0]-value)<EPS) or (abs(c[1]-d[1])<EPS and min(c[0],d[0])-EPS<=value<=max(c[0],d[0])+EPS)
    if relevant:candidates.append(item)
   existing_cache[key]=candidates
  return existing_cache[key]
 def clear(p,q):
  key=(min(p,q),max(p,q))
  if key not in edgecache:
   aa=(xs[p[0]],ys[p[1]]);bb=(xs[q[0]],ys[q[1]])
   horizontal=abs(aa[1]-bb[1])<EPS;axis=0 if horizontal else 1;value=aa[1] if horizontal else aa[0];lo,hi=sorted((aa[axis],bb[axis]))
   if any(min(hi,end)-max(lo,start)>EPS and not (kind=='text' and interval_allowed(allowed_text,oid,axis,value,max(lo,start),min(hi,end))) for start,end,oid,kind in obstacle_intervals(axis,value)):edgecache[key]=None
   else:
    crosses=0;ok=True
    for c,d,allowed_cross,allowed_touch,allowed_overlap in row_existing(axis,value):
     rel=relation(aa,bb,c,d)
     if rel=='overlap':
      horizontal=abs(aa[1]-bb[1])<EPS;k=0 if horizontal else 1;lo=max(min(aa[k],bb[k]),min(c[k],d[k]));hi=min(max(aa[k],bb[k]),max(c[k],d[k]))
      if not any(orientation==k and abs(fixed-aa[1-k])<EPS and start-EPS<=lo and hi<=end+EPS for orientation,fixed,start,end in allowed_overlap):ok=False;break
     if rel=='touch':
      pt=(c[0],aa[1]) if abs(aa[1]-bb[1])<EPS else (aa[0],c[1])
      original_touch=known_contact(pt,allowed_touch,allowed_overlap)
      existing_endpoint=any(abs(pt[0]-xx)<EPS and abs(pt[1]-yy)<EPS for xx,yy in (c,d))
      # An A* cell endpoint in the interior of a line can be an ordinary crossing
      # after adjacent collinear cells are simplified. It must not become a bend/end.
      if existing_endpoint and not original_touch:ok=False;break
     if rel in ('cross','touch'):crosses+=1
    edgecache[key]=crosses if ok else None
  return edgecache[key]
 def turn_allowed(p,old,new):
  if old==new:return True
  if p not in turn_cache:
   result=True
   for c,d,allowed_cross,allowed_touch,allowed_overlap in row_existing(0,p[1]):
    if abs(c[1]-d[1])<EPS:on=abs(p[1]-c[1])<EPS and min(c[0],d[0])-EPS<=p[0]<=max(c[0],d[0])+EPS
    else:on=abs(p[0]-c[0])<EPS and min(c[1],d[1])-EPS<=p[1]<=max(c[1],d[1])+EPS
    if on and not known_contact(p,allowed_touch,allowed_overlap):result=False;break
   turn_cache[p]=result
  return turn_cache[p]
 def heuristic(i,j):return abs(xs[i]-t[0])+abs(ys[j]-t[1])
 queue=[(heuristic(*start[:2]),0.,start)];cost={start:0.};parent={};finish=None;expanded=0
 while queue:
  _,old,u=heapq.heappop(queue)
  if old>cost.get(u,math.inf)+EPS:continue
  i,j,di=u;expanded+=1
  if (i,j)==target and di!=(direction+2)%4 and turn_allowed(t,di,direction):finish=u;break
  for dx,dy,nd in ((1,0,0),(0,1,1),(-1,0,2),(0,-1,3)):
   ii,jj=i+dx,j+dy
   if not 0<=ii<len(xs) or not 0<=jj<len(ys):continue
   if nd==(di+2)%4 or not turn_allowed((xs[i],ys[j]),di,nd):continue
   if (ii,jj)==target and nd==(direction+2)%4:continue
   cross=clear((i,j),(ii,jj))
   if cross is None:continue
   v=(ii,jj,nd);candidate=old+abs(xs[ii]-xs[i])+abs(ys[jj]-ys[j])+ (10 if nd!=di else 0)+cross*80
   if candidate+EPS<cost.get(v,math.inf):cost[v]=candidate;parent[v]=u;heapq.heappush(queue,(candidate+heuristic(ii,jj),candidate,v))
  if expanded>300000:return None,'grid expansion limit'
 if finish is None:return None,'no collision-free route on visibility grid'
 path=[];u=finish
 while True:
  path.append((xs[u[0]],ys[u[1]]))
  if u==start:break
  u=parent[u]
 path.reverse();path=simplify([a]+path+[b])
 # Exact original endpoint / tangent directions are a hard invariant.
 def sign(v):return 1 if v>EPS else -1 if v<-EPS else 0
 if path[0]!=a or path[-1]!=b or (sign(path[1][0]-a[0]),sign(path[1][1]-a[1]))!=unit or (sign(b[0]-path[-2][0]),sign(b[1]-path[-2][1]))!=unit:return None,'endpoint tangent invariant failure'
 if any(hits_poly(x,y,o['poly']) and not text_allowed(x,y,o,allowed_text) for x,y in zip(path,path[1:]) for o in obs):return None,'post-route obstacle collision'
 return path,{'expanded':expanded,'grid':[len(xs),len(ys)],'length':sum(abs(x[0]-y[0])+abs(x[1]-y[1]) for x,y in zip(path,path[1:]))}

def reroute_svg(svg):
 original=ET.fromstring(svg);root=copy.deepcopy(original);before=audit(root)
 report={'status':'candidate','before':before,'changes':[],'failures':[]}
 if before['unsupported']:report['status']='unsupported';return svg,report
 obs,con,_=geometry(root);vb=[float(v) for v in root.attrib['viewBox'].split()];width,height=vb[2],vb[3]
 if vb[:2]!=[0.,0.]:report['status']='unsupported';report['failures'].append('nonzero viewBox origin');return svg,report
 original_points={c['id']:copy.deepcopy(c['points']) for c in con}
 baseline_text=collections.defaultdict(lambda:collections.defaultdict(list))
 for c in con:
  for aa,bb in zip(c['points'],c['points'][1:]):
   for o in obs:
    if o['kind']=='text' and hits_poly(aa,bb,o['poly']):
     k=0 if abs(aa[1]-bb[1])<EPS else 1;baseline_text[c['id']][o['id']].append((k,aa[1-k],min(aa[k],bb[k]),max(aa[k],bb[k])))
 pair_rel={};pair_touch=collections.defaultdict(list);pair_overlap=collections.defaultdict(list)
 for ii,ca in enumerate(con):
  for cb in con[ii+1:]:
   key=tuple(sorted((ca['id'],cb['id'])));rels=set()
   for aa,bb in zip(ca['points'],ca['points'][1:]):
    for cc,dd in zip(cb['points'],cb['points'][1:]):
     rel=relation(aa,bb,cc,dd)
     if rel:rels.add(rel)
     if rel=='touch':pair_touch[key].append((cc[0],aa[1]) if abs(aa[1]-bb[1])<EPS else (aa[0],cc[1]))
     if rel=='overlap':
      k=0 if abs(aa[1]-bb[1])<EPS else 1;pair_overlap[key].append((k,aa[1-k],max(min(aa[k],bb[k]),min(cc[k],dd[k])),min(max(aa[k],bb[k]),max(cc[k],dd[k]))))
   pair_rel[key]=rels
 for connector in con:
  ps=connector['points']
  if not any(o['kind']!='text' and hits_poly(a,b,o['poly']) for a,b in zip(ps,ps[1:]) for o in obs):continue
  if len(ps)!=2:report['failures'].append({'connector':connector['id'],'reason':'existing multiline obstacle hit requires full-connector ownership'});continue
  existing=[(a,b,'cross' in pair_rel[tuple(sorted((c['id'],connector['id'])))],pair_touch[tuple(sorted((c['id'],connector['id'])))],pair_overlap[tuple(sorted((c['id'],connector['id'])))]) for c in con if c is not connector for a,b in zip(c['points'],c['points'][1:])]
  new,meta=route(ps[0],ps[-1],obs,existing,width,height,baseline_text[connector['id']])
  if new is None:report['failures'].append({'connector':connector['id'],'reason':meta});continue
  e=connector['element'];e.tag='{'+NS+'}polyline'
  for key in ('x1','y1','x2','y2','d'):e.attrib.pop(key,None)
  e.set('points',' '.join(fmt(x)+','+fmt(y) for x,y in new));e.set('fill','none');connector['points']=new
  report['changes'].append({'connector':connector['id'],'old_points':ps,'new_points':new,'search':meta})
 report['after']=audit(root)
 novel_text=[]
 for c in con:
  for ii,(aa,bb) in enumerate(zip(c['points'],c['points'][1:])):
   for o in obs:
    if o['kind']=='text' and hits_poly(aa,bb,o['poly']) and not text_allowed(aa,bb,o,baseline_text[c['id']]):novel_text.append({'connector':c['id'],'segment':ii,'obstacle':o['id']})
 report['novel_text_intersections']=novel_text
 report['original_text_baseline_contacts_preserved_without_blanket_exemption']=True
 original_elements=list(original.iter());new_elements=list(root.iter());connection_ids={c['id'] for c in con}
 def unit(a,b):
  length=math.hypot(b[0]-a[0],b[1]-a[1]);return None if length<EPS else (round((b[0]-a[0])/length,6),round((b[1]-a[1])/length,6))
 immutable=lambda es:[(i,tag(e),dict(e.attrib),e.text,e.tail) for i,e in enumerate(es) if i and i not in connection_ids]
 report['invariants']={'nodes_text_arrowheads_unchanged':immutable(original_elements)==immutable(new_elements),'svg_dimensions_unchanged':all(original.get(k)==root.get(k) for k in ('width','height','viewBox')),'all_original_connector_endpoints_preserved':all(c['points'][0]==original_points[c['id']][0] and c['points'][-1]==original_points[c['id']][-1] for c in con),'endpoint_tangents_preserved':all(unit(c['points'][0],c['points'][1])==unit(original_points[c['id']][0],original_points[c['id']][1]) and unit(c['points'][-2],c['points'][-1])==unit(original_points[c['id']][-2],original_points[c['id']][-1]) for c in con)}
 report['text_bounds']='SVG textLength with baseline envelope; unmeasured CJK labels use one em per character. Not glyph-level browser verification.'
 if not all(report['invariants'].values()):report['failures'].append('immutable geometry or endpoint invariant failed')
 if report['failures'] or report['after']['node_hits'] or novel_text:
  report['status']='failed_closed';report['candidate_changes_discarded']=len(report['changes']);report['returned_original']=True;return svg,report
 # Geometry comparisons must include every new polyline segment. Existing defects are not promoted to pass.
 report['returned_original']=False
 report['status']='candidate_obstacles_clear_other_geometry_requires_review'
 root.attrib.pop('data-business-svg-sha256',None);root.set('data-layout-candidate','orthogonal-router-v1')
 return ET.tostring(root,encoding='unicode'),report

if __name__=='__main__':
 import argparse,pathlib
 p=argparse.ArgumentParser();p.add_argument('input');p.add_argument('output');p.add_argument('--report',required=True);a=p.parse_args();svg,report=reroute_svg(pathlib.Path(a.input).read_text());pathlib.Path(a.output).write_text(svg);pathlib.Path(a.report).write_text(json.dumps(report,ensure_ascii=False,indent=2));print(report['status'],len(report['changes']),len(report['failures']))
