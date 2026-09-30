"""Read public AliCti pages for the field audit; no business API calls."""
import concurrent.futures
import hashlib
import json
import re
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote
import requests

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).resolve().parent / 'sources'

class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.skip=0; self.body=False; self.text=[]; self.tables=[]; self.table=None; self.row=None; self.cell=None; self.heading=None; self.heading_text=[]; self.section=''
    def handle_starttag(self, tag, attrs):
        if tag=='body': self.body=True
        if tag in ('script','style','head'): self.skip+=1
        if not self.body or self.skip: return
        if re.fullmatch('h[1-6]', tag): self.heading=tag; self.heading_text=[]
        if tag=='table': self.table={'section':self.section,'rows':[]}
        if tag=='tr': self.row=[]
        if tag in ('th','td'): self.cell=[]
        if tag in ('br','p','div','pre','li','tr','table') or re.fullmatch('h[1-6]',tag): self.text.append('\n')
        if tag=='br' and self.cell is not None: self.cell.append(' ')
    def handle_endtag(self, tag):
        if tag in ('script','style','head'): self.skip=max(0,self.skip-1)
        if not self.body or self.skip: return
        if tag==self.heading: self.section=''.join(self.heading_text).strip(); self.heading=None
        if tag in ('th','td') and self.cell is not None:
            if self.row is not None: self.row.append(re.sub(r'\s+',' ',''.join(self.cell)).strip())
            self.cell=None; self.text.append(' | ')
        if tag=='tr' and self.row is not None:
            if self.table is not None:self.table['rows'].append(self.row)
            self.row=None
        if tag=='table' and self.table is not None:self.tables.append(self.table); self.table=None
        if tag in ('p','div','pre','li','tr','table') or re.fullmatch('h[1-6]',tag):self.text.append('\n')
        if tag=='body':self.body=False
    def handle_data(self,data):
        if self.body and not self.skip:
            self.text.append(data)
            if self.cell is not None:self.cell.append(data)
            if self.heading:self.heading_text.append(data)

def fetch(row):
    url=row['source_refs'][0]; r=requests.get(quote(url,safe=':/?=&%'),timeout=25);r.raise_for_status();r.encoding='utf-8'
    parser=Page();parser.feed(r.text)
    content=re.sub(r'\n[ \t]*\n+', '\n\n', ''.join(parser.text)).strip()
    if not content or not parser.tables and row['id'].startswith('API-3') and len(content)<50:raise ValueError('Empty document')
    (OUT/(row['id']+'.html')).write_text(r.text)
    (OUT/(row['id']+'.txt')).write_text(content+'\n')
    (OUT/(row['id']+'.json')).write_text(json.dumps(parser.tables,ensure_ascii=False,indent=2)+'\n')
    return {'id':row['id'],'name':row['name'],'url':url,'status':r.status_code,'retrievedAt':datetime.now(timezone.utc).isoformat(),'sha256':hashlib.sha256(r.content).hexdigest(),'tables':len(parser.tables),'characters':len(content)}

if __name__=='__main__':
    OUT.mkdir(parents=True,exist_ok=True)
    index=json.loads((ROOT/'interfaces/interface-index.json').read_text())
    rows=index if isinstance(index,list) else index['interfaces']
    rows=[r for r in rows if r['source_refs'][0].startswith('https://')]
    # Keep the additional official pages discovered during the field review.
    manifest=OUT.parent/'source-manifest.json'
    known={r['id'] for r in rows}
    if manifest.exists():
        for source in json.loads(manifest.read_text()):
            if source['id'] not in known and source['url'].startswith('https://wiki.alicti.cn/'):
                rows.append({'id':source['id'],'name':source['name'],'source_refs':[source['url']]})
                known.add(source['id'])
    results=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(fetch,rows):results.append(result);print(result['id'],result['status'],result['tables'],result['characters'],flush=True)
    (OUT.parent/'source-manifest.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
