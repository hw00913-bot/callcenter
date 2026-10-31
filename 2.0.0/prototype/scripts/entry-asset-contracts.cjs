/* Shared static entry proof; standard fixed-URL loaders have explicit contracts. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
module.exports=function verifyEntryAssets(root){
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');let assets=0,scripts=0;
 for(const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"#]+)"[^>]*>/g)){
  const [rel,query]=match[1].split('?'),file=path.resolve(root,rel),bytes=fs.readFileSync(file),digest=crypto.createHash('sha256').update(bytes).digest('hex').slice(0,10);assert(fs.statSync(file).isFile(),rel);assets++;
  if(rel==='js/delivery-nav.js'){assert.equal(query,undefined);assert(match[0].includes('data-content-revision="'+digest+'"'),'navigation current content proof');}
  else if(rel==='../../memory/public/版本清单.js'){
   assert.equal(query,undefined);assert(match[0].includes('data-project-version-index'));assert(fs.readFileSync(path.join(root,'version-history.html'),'utf8').includes('src="../../memory/public/版本清单.js"'));
   const projection=JSON.parse(fs.readFileSync(path.join(path.dirname(file),'版本清单.json'),'utf8'));assert.equal(projection.schema,'project-version-index@1');assert.equal(projection.current_version_id,'v2.0.0');assert(projection.versions.some(v=>v.version_id==='v2.0.0'&&v.working_href==='2.0.0/prototype/index.html'));assert(bytes.toString().includes(projection.content_id));
  }else {assert(file.startsWith(path.resolve(root)+path.sep),'unexpected external entry dependency');assert.equal(query,'v='+digest,rel);}
  if(rel.endsWith('.js')){new vm.Script(bytes.toString(),{filename:rel});scripts++;}
 }
 return {assets,scripts};
};
