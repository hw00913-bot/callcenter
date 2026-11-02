/* Real host session restore contracts with isolated synthetic accounts/storage. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8'),plain=value=>JSON.parse(JSON.stringify(value)),results=[];
const pages=['PAGE-2003','PAGE-2204','PAGE-2226','PAGE-2227'];
function memory(){const values=new Map();return {getItem:key=>values.has(key)?values.get(key):null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key),dump:()=>Object.fromEntries(values)};}
function fixture(){
 const membership=tenantId=>({tenantId,role:'admin',enabled:true,modules:['cloud'],pages:pages.slice(),landing:'PAGE-2204'});
 const seed={accounts:[{id:'POSITION-A',name:'合成管理员甲',enabled:true,memberships:[membership('POSITION-HQ'),membership('POSITION-STORE')]},{id:'POSITION-B',name:'合成管理员乙',enabled:true,memberships:[membership('POSITION-HQ')]}],brands:[{id:'POSITION-BRAND',name:'合成测试品牌'}],tenants:[{id:'POSITION-HQ',name:'合成总部',enabled:true,organization:'总部',brandId:'POSITION-BRAND',enterpriseId:'POSITION-E',modules:{ai:false,cloud:true}},{id:'POSITION-STORE',name:'合成门店',enabled:true,organization:'门店',brandId:'POSITION-BRAND',enterpriseId:'POSITION-E',modules:{ai:false,cloud:true}}],rolePages:{cloud:{admin:pages.slice()},publicAdmin:['PAGE-2003']}};
 const persistent=memory(),transient=memory(),box={console,Date,localStorage:persistent,sessionStorage:transient,DSeed:seed};box.window=box;vm.createContext(box);
 for(const file of ['js/nav.js','js/components/role-permissions.js','js/components/session-store.js'])vm.runInContext(read(file),box,{filename:file});
 assert.equal(box.DSessionError,null);
 const fresh=()=>box.createDSessionStore(seed,box.DNav,persistent,transient),session=fresh();session.login('POSITION-A');session.selectScope('POSITION-HQ');
 return {session,fresh,seed,persistent,transient,position:(account='POSITION-A',tenant='POSITION-HQ')=>JSON.parse(persistent.getItem(session.prefix+'positions')).accounts[account]?.positions?.[tenant]};
}
function test(name,run){try{run();results.push({name,status:'pass'});}catch(error){results.push({name,status:'fail',error:error.stack||error.message});}}
test('independent business-list menu position restores without a batch and does not borrow the old import batch',()=>{
 const f=fixture(),old={batchId:'OLD-AI-BATCH',batchKey:'OLD-AI-KEY',batchDetail:true,originBatch:{batchId:'OLD-AI-BATCH'}};f.session.remember('PAGE-2204',old);f.session.remember('PAGE-2226',{});
 const restored=f.fresh(),state=restored.restore();assert.equal(state.pageId,'PAGE-2226');assert.equal(restored.canResume('PAGE-2226'),true);assert.equal(restored.areaLanding('业务&客户'),'PAGE-2226');assert.deepEqual(plain(restored.filters('PAGE-2226')),{});assert.deepEqual(plain(restored.filters('PAGE-2204')),old);
});
test('business detail still requires its exact record identity and a valid record position remains resumable',()=>{
 const f=fixture();f.session.remember('PAGE-2227',{});let restored=f.fresh(),state=restored.restore();assert.equal(state.pageId,'PAGE-2204');assert.equal(restored.canResume('PAGE-2227'),false);
 f.session.remember('PAGE-2227',{recordId:'POSITION-RECORD-A'});restored=f.fresh();state=restored.restore();assert.equal(state.pageId,'PAGE-2227');assert.equal(restored.canResume('PAGE-2227'),true);assert.equal(restored.filters('PAGE-2227').recordId,'POSITION-RECORD-A');
});
test('existing legal business batch and import-batch positions keep their exact saved filters without migration',()=>{
 for(const pageId of ['PAGE-2226','PAGE-2204']){const f=fixture(),filters={batchKey:'LEGACY-KEY',batchId:'LEGACY-BATCH',assignmentView:'all',originBatch:{batchKey:'LEGACY-KEY',batchId:'LEGACY-BATCH'},batchDetail:true};f.session.remember(pageId,filters);const before=JSON.stringify(f.persistent.dump()),restored=f.fresh();assert.equal(restored.restore().pageId,pageId);assert.deepEqual(plain(restored.filters(pageId)),filters);assert.equal(JSON.stringify(f.persistent.dump()),before);}
});
test('revoked page availability, Cloud membership or account cannot restore a formerly allowed business-list position',()=>{
 for(const mode of ['page','module','account']){const f=fixture();f.session.remember('PAGE-2226',{keyword:'SAVED-PRIVATE'});const originalPosition=plain(f.position());
  if(mode==='module')f.seed.accounts[0].memberships[0].modules=[];if(mode==='account')f.seed.accounts[0].enabled=false;
  const restored=f.fresh();if(mode==='page')restored.setPageAvailability(id=>id!=='PAGE-2226');const state=restored.restore();assert.notEqual(state.pageId,'PAGE-2226',mode);assert.equal(restored.allowed('PAGE-2226'),false,mode);assert.equal(restored.canResume('PAGE-2226'),false,mode);assert.deepEqual(plain(f.position()),originalPosition,'revocation must not delete or migrate the old saved position');
 }
});
test('another account never inherits a business-list position or its filters from the prior account',()=>{
 const f=fixture();f.session.remember('PAGE-2226',{keyword:'ACCOUNT-A-ONLY'});const originalPosition=plain(f.position());f.session.login('POSITION-B');const restored=f.fresh(),state=restored.restore();assert.equal(restored.context().account.id,'POSITION-B');assert.equal(state.pageId,'PAGE-2204');assert.deepEqual(plain(restored.filters('PAGE-2226')),{});assert.deepEqual(plain(f.position()),originalPosition);f.session.login('POSITION-A');f.session.selectScope('POSITION-HQ');assert.equal(f.fresh().restore().pageId,'PAGE-2226');
});
test('switching tenants keeps independent positions and cannot carry the previous tenant batch or record filters',()=>{
 const f=fixture();f.session.remember('PAGE-2226',{keyword:'HQ-ONLY'});const originalPosition=plain(f.position());f.session.selectScope('POSITION-STORE');let restored=f.fresh(),state=restored.restore();assert.equal(restored.context().scope.id,'POSITION-STORE');assert.equal(state.pageId,'PAGE-2204');assert.deepEqual(plain(restored.filters('PAGE-2226')),{});assert.deepEqual(plain(f.position()),originalPosition);
 f.session.remember('PAGE-2226',{keyword:'STORE-ONLY'});f.session.selectScope('POSITION-HQ');restored=f.fresh();state=restored.restore();assert.equal(state.pageId,'PAGE-2226');assert.equal(restored.filters('PAGE-2226').keyword,'HQ-ONLY');assert.equal(f.position('POSITION-A','POSITION-STORE').filters.keyword,'STORE-ONLY');
});
const report={schema:'workspace-position@1',at:new Date().toISOString(),scope:'complete current host session factory, role policy and navigation with isolated synthetic account/tenant storage; no browser or production storage access',sourceSha256:crypto.createHash('sha256').update(read('js/components/session-store.js')).digest('hex'),passed:results.filter(x=>x.status==='pass').length,failed:results.filter(x=>x.status==='fail').length,tests:results};
const output=process.argv.indexOf('--output');if(output>=0)fs.writeFileSync(path.resolve(process.argv[output+1]),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
