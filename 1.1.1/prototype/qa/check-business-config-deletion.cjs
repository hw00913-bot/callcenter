/** Real CB/BC/CF, shared usage inspector and actual PlatformUI delete confirmations. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {harness,copy}=require('./fixtures/current-profile.cjs'),{harness:editorHarness}=require('./check-business-config-dirty-close.cjs');
const base=path.resolve(process.argv[2]||path.join(__dirname,'..')),preset=['leadLevel','intentionLevel','visitIntention','testDriveIntention','plannedVisitAt','plannedStoreName'];
let passed=0;const check=(value,message)=>{assert.ok(value,message);passed++;};
const field=id=>({id,label:'未使用 '+id,type:'text',businessKey:'',enabled:true,options:[]});
function emptyUsage(h){for(const key of ['calls','tasks','predictiveTasks','ivrTasks'])h.win.CloudCallData[key]=[];h.session.clear();}
function reload(h){vm.runInContext(fs.readFileSync(path.join(base,'js/components/customer-business.js'),'utf8'),h.win);return h.win.CustomerBusiness;}
function category(h,id,fields=[]){return h.M.save({id,label:'分类 '+id,codeLabel:'业务编码',prefix:'TEST',enabled:true,fields:fields.map(fieldId=>({fieldId,enabled:true,required:false}))},h.scope);}
{
 const h=harness();emptyUsage(h);const M=h.M,lead=M.get('lead',h.scope);lead.fields=[];check(M.save(lead,h.scope).ok,'remove all current lead references without removing definitions');
 for(const id of preset){const original=M.getField(id,h.scope);check(!M.saveField({...original,type:'number'},h.scope).ok,id+': stable existing preset input type remains protected');check(M.usage('field',id,h.scope).canDelete,id+': preset identity alone is not use');check(M.deleteField(id,h.scope).ok,id+': unused preset definition can be deleted');check(!M.getField(id,h.scope),id+': deleted definition stays absent');}
 check(M.deleteField('mappingIntendedSeries',h.scope).ok,'an unused Mapping preset is also deletable');
 const bytes=h.storage.get(M.storageKey),R=reload(h);check(R.catalog(h.scope).ok&&R.get('lead',h.scope).fields.length===0&&preset.every(id=>!R.getField(id,h.scope))&&!R.getField('mappingIntendedSeries',h.scope),'module reload accepts missing presets and never restores deleted definitions');
 check(h.storage.get(M.storageKey)===bytes,'reload never rewrites the persisted empty references');
}
{
 const h=harness();emptyUsage(h);const M=h.M,library=JSON.stringify(M.catalog(h.scope).fields),dictionary=JSON.stringify(h.win.BusinessData.catalogState().entries);
 for(const id of ['lead','aftersales','activity'])check(M.deleteCategory(id,h.scope).ok,id+': unused default category may be deleted');
 check(M.catalog(h.scope).rows.length===0&&JSON.stringify(M.catalog(h.scope).fields)===library,'deleting every category keeps its field library');
 check(JSON.stringify(h.win.BusinessData.catalogState().entries)===dictionary,'category deletion never removes interface entries');
 check(reload(h).catalog(h.scope).rows.length===0,'persisted empty category list survives module reload');
}
{
 const h=harness();emptyUsage(h);const M=h.M;check(M.saveField(field('blockedField'),h.scope).ok&&category(h,'hiddenUse',['blockedField']).ok,'configure a real category reference');
 const hidden=M.get('hiddenUse',h.scope);hidden.enabled=false;hidden.fields[0].enabled=false;check(M.save(hidden,h.scope).ok,'hidden/disabled category references remain real');
 const bytes=h.storage.get(M.storageKey),used=M.usage('field','blockedField',h.scope);check(!used.canDelete&&used.refs.some(ref=>ref.kind==='configuration'),'configuration use gives exact reference rows');
 check(!M.deleteField('blockedField',h.scope).ok&&h.storage.get(M.storageKey)===bytes,'referenced field deletion fails without a write');
 const other={...h.scope,tenantId:'NOT_AUTHORIZED'};check(!M.deleteCategory('hiddenUse',other).ok,'cross-tenant delete is rejected');
 h.win.CloudCallData.calls.push({...h.scope,callId:'savedUse',accountId:h.state.accountId,customerPhone:'13800000911',businessType:'hiddenUse',processingStatus:'已完成'});
 check(M.deleteCategory('hiddenUse',h.scope).ok&&M.typeLabel(h.win.CloudCallData.calls.at(-1))===hidden.label&&!M.get('hiddenUse',h.scope),'actual completed business usage permits logical category removal and retains its name');
}
{
 const h=harness({generic:true});emptyUsage(h);const M=h.M,lead=M.get('lead',h.scope);lead.fields=[];check(M.save(lead,h.scope).ok,'remove display references but keep interface dependency definitions');
 check(!M.deleteField('genericSeries',h.scope).ok&&M.usage('field','genericSeries',h.scope).refs.length>0,'other interface depends remains a real use even when not displayed');
}
{
 const h=harness(),M=h.M;h.win.CloudCallData.calls=[h.call];h.win.AgentWorkbench.setFollowup('leadLevel','A级');const original=JSON.stringify(h.call.businessFormVersion),lead=M.get('lead',h.scope);lead.fields=lead.fields.filter(ref=>ref.fieldId!=='leadLevel');check(M.save(lead,h.scope).ok,'live category may stop referencing the active call field');
 check(M.usage('field','leadLevel',h.scope).refs.some(ref=>ref.kind==='active_form'&&ref.blocking===false)&&M.deleteField('leadLevel',h.scope).ok,'typed current snapshot does not block library deletion after live ref removal');
 const saved=h.C.save(h.call,h.values,{wrapping:true,expectedVersion:''});check(saved.ok&&saved.values.leadLevel==='A级'&&JSON.stringify(h.call.businessFormVersion)===original,'successful field cleanup preserves original call version and normal save');
 check(saved.values.businessFieldSnapshot.fields.some(row=>row.fieldId==='leadLevel')&&M.deleteCategory('lead',h.scope).ok&&M.get('lead',h.call).label==='线索类','logical category removal preserves the exact saved field manifest and original bound business type');
}
{
 const h=harness();emptyUsage(h);const M=h.M;check(M.saveField(field('fingerprinted'),h.scope).ok,'create unused target for stale-confirm checks');const usage=M.usage('field','fingerprinted',h.scope);check(usage.ok&&usage.canDelete&&Object.isFrozen(usage.token),'real inspector gives an unused target and an immutable confirmation token');
 check(category(h,'newUse',['fingerprinted']).ok,'a new reference arrives after inspection');const before=h.storage.get(M.storageKey);check(!M.deleteField('fingerprinted',h.scope,{expectedUsageFingerprint:usage.fingerprint}).ok&&h.storage.get(M.storageKey)===before,'fresh check rejects an old unused fingerprint after a real reference is added');
}
for(const mode of ['throw-before','throw-after','new-reference']){
 const h=harness();emptyUsage(h);const M=h.M;M.saveField(field('transactionTarget'),h.scope);const before=h.storage.get(M.storageKey),set=h.win.localStorage.setItem;let fired=false;
 h.win.localStorage.setItem=(key,value)=>{if(key===M.storageKey&&!fired){fired=true;if(mode==='throw-before')throw Error('write denied');set(key,value);if(mode==='throw-after')throw Error('write completed before exception');h.win.CloudCallData.calls.push({...h.scope,callId:'postwrite-use',accountId:h.state.accountId,customerPhone:'13800000913',businessType:'lead',processingStatus:'待填写',customerFollowup:{businessType:'lead',transactionTarget:'快照尚不完整的当前填写'}});return;}return set(key,value);};
 check(!M.deleteField('transactionTarget',h.scope).ok,mode+': failed or newly referenced deletion never reports success');check(h.storage.get(M.storageKey)===before&&M.getField('transactionTarget',h.scope),mode+': rollback restores exact previous config bytes');
}
{
 const h=harness();emptyUsage(h);const M=h.M,BD=h.win.BusinessData;const lead=M.get('lead',h.scope);lead.fields=[];check(M.save(lead,h.scope).ok&&M.deleteField('mappingIntendedSeries',h.scope).ok,'explicitly remove default Mapping ref and definition before its source');
 const removed=BD.remove('d-mapping-series');check(removed.ok&&BD.catalogState().explicit,'unused default entry deletion is persisted explicitly');
 const current=JSON.stringify(M.catalog(h.scope));const stored=JSON.parse(h.storage.get(M.storageKey));stored.scopes=[];h.storage.set(M.storageKey,JSON.stringify(stored));
 check(M.catalog(h.scope).ok&&!M.mappingSeriesField(h.scope)&&M.get('lead',h.scope).fields.length===6,'fresh factory omits the clearly deleted default source and no dangling field/ref is generated');
 const dictionaryBytes=h.storage.get(BD.storageKey);h.storage.delete(BD.storageKey);check(M.mappingSeriesField(h.scope),'no explicit dictionary persistence retains the initial Mapping factory');
 BD.setEnabled('d-mapping-series',false);check(M.mappingSeriesField(h.scope),'source disabled is not projected as deleted');BD.setEnabled('d-mapping-series',true);BD.setTenants('d-mapping-series',[]);check(M.mappingSeriesField(h.scope),'tenant authorization revocation is not deletion');
 h.storage.set(BD.storageKey,'broken-json');check(M.mappingSeriesField(h.scope),'an unreadable dictionary never means deleted defaults');h.storage.set(BD.storageKey,dictionaryBytes);check(current.includes('"ok":true'),'the previously persisted scope was readable before fresh-scope checks');
}
{
 const h=editorHarness(),M=h.M,P=h.P;P.render('field');let html=P.render('field');check(html.includes('BusinessConfiguration.remove')&&!html.includes('查看引用'),'field rows expose deletion without a redundant standalone reference action');check(P.render('category').includes('BusinessConfiguration.remove')&&!P.render('category').includes('查看引用'),'category rows expose deletion without a standalone reference action');
 P.render('field');check(P.remove('field',h.id)===true&&h.node('business-config-delete-confirm'),'actual PlatformUI opens a delete confirmation for the unused field');h.node('business-config-delete-confirm').querySelector('.layer-footer button').click();check(M.getField(h.id,h.scope),'cancelling actual confirmation keeps the definition');
 P.remove('field',h.id);h.node('business-config-delete-confirm-confirm').click();check(!M.getField(h.id,h.scope)&&!h.node('business-config-delete-confirm'),'actual confirm callback deletes the target and closes only its own prompt');
 M.saveField(field('uiBlocked'),h.scope);category(h,'uiUse',['uiBlocked']);P.remove('field','uiBlocked');check(h.node('business-config-references')?.textContent.includes('uiUse')&&!h.node('business-config-delete-confirm'),'used target opens real readable reference locations instead of a false delete confirmation');
 M.saveField(field('uiStale'),h.scope);P.render('field');P.remove('field','uiStale');const old=h.node('business-config-delete-confirm-confirm');M.saveField(field('otherWrite'),h.scope);old.click();check(M.getField('uiStale',h.scope)&&h.node('business-config-delete-error')?.textContent,'new configuration invalidates the old UI confirmation without losing the object');
 h.win.PlatformUI.closeLayer('business-config-delete-confirm');P.remove('field','uiStale');const newer=h.node('business-config-delete-confirm');old.click();check(h.node('business-config-delete-confirm')===newer&&M.getField('uiStale',h.scope),'detached old confirmation cannot delete or close a newer prompt');h.node('business-config-delete-confirm-confirm').click();check(!M.getField('uiStale',h.scope),'the new genuine confirmation remains usable');
}
{
 const h=editorHarness(),P=h.P;vm.runInContext(fs.readFileSync(path.join(base,'js/pages/business-data-dictionary.js'),'utf8'),h.win);let opened='';h.win.RouteRuntime.openPrimary=key=>{opened=key;return true;};
 let html=P.render('category');check(html.includes('取数接口字典')&&P.selectKind('dictionary')===true&&opened==='business-data-dictionary','super switches to the embedded dictionary through its actual authorized route');html=P.render();check(html.includes('data-business-config-kind="dictionary"')&&html.includes('接口名称'),'dictionary Tab invokes the actual dictionary page controller');
 P.selectKind('field');check(opened==='business-fields','returning to fields navigates its own permission-preserving route');
 const oldMenus=h.win.AppState.canMenu;h.win.AppState.canMenu=key=>key==='system.applications';check(!h.M.canManage()&&h.win.BusinessData.canManage(),'dictionary-only super does not gain category model edit permission');html=P.render('category');check(html.includes('data-business-config-kind="dictionary"')&&!html.includes("selectKind('field')"),'dictionary-only super sees only its permitted Tab');check(P.selectKind('category')===false&&!h.M.saveField(field('forbiddenRole'),h.scope).ok,'category Tab and direct model mutations are refused without settings.business');
 h.win.AppState.canMenu=oldMenus;h.win.AppState.isSuper=()=>false;h.win.AppState.effectiveAccess=()=>({roleCode:'ADMIN',valid:true});html=P.render('category');check(!html.includes('取数接口字典')&&P.selectKind('dictionary')===false,'tenant administrator retains two configuration Tabs and cannot enter the global dictionary');
 h.win.AppState.effectiveAccess=()=>({roleCode:'AGENT',valid:true});check(!h.M.canManage()&&!P.render().includes('data-business-config-kind="dictionary"'),'operator has no configuration maintenance');
}
console.log(JSON.stringify({ok:true,assertions:passed,scope:'unused preset/custom/category deletion, real usage/CAS/rollback, empty persistence/fresh source absence, old-call preservation, actual PlatformUI confirmations/references and embedded dictionary permissions'}));
