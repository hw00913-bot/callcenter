/** Real category configuration, per-call followup and authorized lead-report dimensions. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {harness,copy}=require('./fixtures/current-profile.cjs');
const base=path.resolve(process.argv[2] || path.join(__dirname,'..'));
const dimensions=['leadLevel','intentionLevel','visitIntention','testDriveIntention','plannedVisitAt','plannedStoreName'];
const selects=dimensions.slice(0,4);
const positive={leadLevel:'A级',intentionLevel:'高意向',visitIntention:'有意向',testDriveIntention:'有意向',plannedVisitAt:'2026-10-22T10:30',plannedStoreName:'原版真实门店'};
let passed=0;const check=(value,message)=>{assert.ok(value,message);passed++;};
function setupReport(){
 const h=harness(),w=h.win,d=w.CloudCallData,allowed=new Set([h.scope.tenantId]),catalogReads=[];
 const access=w.AppState.effectiveAccess;let reportsAllowed=true,objectAllowed=true;
 w.AppState.effectiveAccess=()=>({...access(),tenantIds:[...allowed]});
 w.AppState.authorizeObject=(_,row)=>objectAllowed&&row?.enterpriseId===h.state.enterpriseId&&allowed.has(row?.tenantId);
 w.AppState.scoped=rows=>rows.filter(row=>w.AppState.authorizeObject('',row));
 w.AppState.canMenu=menu=>menu!=='reports.cloud'||reportsAllowed;w.AppState.canAction=()=>true;
 w.PlatformUI.callTypeLabel=value=>value;
 w.CustomerBusiness={...h.M,fieldCatalog(source){catalogReads.push({enterpriseId:source.enterpriseId,tenantId:source.tenantId});return h.M.fieldCatalog(source);}};
 for(const key of ['calls','tasks','predictiveTasks','ivrTasks'])d[key]=[];
 h.storage.set('customer-task-batches-v1','[]');
 const files=['js/components/alicti-number-status.js','js/components/alicti-fields.js','js/components/call-state.js','js/components/alicti-report-facts.js','js/components/report-metrics.js','js/pages/customer-tasks.js','js/components/lead-report.js','js/components/report-data.js'];
 for(const file of files)vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),w,{filename:file});
 function mount(id,values={},where=h.scope,code='COHORT-001'){
  const start=Date.parse('2026-10-20T10:00:00')+d.calls.length*120000,end=start+61000;
  h.mount({...where,callId:id,contactId:id,customerPhone:'13900009001',callee:'13900009001',caller:'02100000000',externalDocumentId:code,customerTaskItemId:'ROW-'+code,customerTaskBatchId:'BATCH-'+where.tenantId,businessType:'lead',ringingAt:new Date(start).toISOString(),endedAt:new Date(end).toISOString(),direction:'呼出',callType:'人工外呼',attemptHistoryComplete:true,durationSeconds:60},copy(values));
  w.CallState.start(h.call,{at:start,source:'local-simulation'});
  for(const role of ['agent','customer'])w.CallState.ingest(h.call,{enterpriseId:where.enterpriseId,contactId:id,channelId:id+'-'+role,role,type:'Established',at:start+1000,source:'local-simulation'});
  w.CallState.finish(h.call,{at:end,source:'local-simulation'});return {call:h.call,values:h.values};
 }
 function save(record){
  const result=h.C.save(record.call,record.values,{wrapping:true,expectedVersion:''});if(!result.ok)return result;
  record.call.processingStatus='已完成';record.call.agentDisposition='已完成沟通';
  const batches=JSON.parse(h.storage.get('customer-task-batches-v1')),where={enterpriseId:record.call.enterpriseId,tenantId:record.call.tenantId};
  let batch=batches.find(row=>row.id===record.call.customerTaskBatchId&&row.tenantId===where.tenantId);
  if(!batch){batch={...where,id:record.call.customerTaskBatchId,name:'真实报表测试名单',businessType:'lead',createdAt:'2026-10-19 10:00:00',createdBy:h.state.accountId,rows:[]};batches.push(batch);}
  let item=batch.rows.find(row=>row.id===record.call.customerTaskItemId);
  if(!item){item={id:record.call.customerTaskItemId,businessType:'lead',externalDocumentId:record.call.externalDocumentId,name:'报表测试客户',phone:record.call.customerPhone,ownerId:h.state.accountId,method:'人工外呼',taskId:'',followup:'待继续跟进',calls:[],history:[]};batch.rows.push(item);}
  item.calls.push(copy(record.call));h.storage.set('customer-task-batches-v1',JSON.stringify(batches));return result;
 }
 const model=(filters={})=>w.CloudReportData.getModel('leads',{period:'自定义',startDate:'2026-01-01',endDate:'2026-12-31',tenantId:h.scope.tenantId,...filters});
 return {...h,w,d,allowed,catalogReads,get call(){return h.call;},get values(){return h.values;},mountReport:mount,saveReport:save,model,setReportsAllowed:value=>{reportsAllowed=value;},setObjectAllowed:value=>{objectAllowed=value;}};
}

function run(){
 {
  const h=setupReport(),M=h.M,D=h.w.CloudReportData,original=copy(M.get('lead',h.scope)),library=copy(M.fieldCatalog(h.scope).rows);
  const category=copy(original);category.fields.forEach(ref=>{if(dimensions.includes(ref.fieldId))ref.required=true;});check(M.save(category,h.scope).ok,'administrator independently configures the six original mandatory references before a call starts');
  const old=h.mountReport('REPORT-BOUND-ORIGINAL',positive),version=JSON.stringify(old.call.businessFormVersion);
  check(dimensions.every(id=>h.document.getElementById('seat-followup-'+id)),'actual original form contains all six configured fields');
  const beforeOptions=Object.fromEntries(selects.map(id=>[id,Array.from(D.fieldOptions(id,h.scope.tenantId))]));
  const removed=copy(M.get('lead',h.scope));removed.fields=removed.fields.filter(ref=>!dimensions.includes(ref.fieldId));check(M.save(removed,h.scope).ok,'all six references can actually be removed from the category');
  check(M.catalog(h.scope).ok&&M.get('lead',h.scope).fields.length===1&&M.fields('lead',h.scope)[0].id==='mappingIntendedSeries','saved current category now contains only Mapping without restoring default references');
  check(JSON.stringify(M.fieldCatalog(h.scope).rows)===JSON.stringify(library),'removing category references retains all field-library definitions and stable options');
  for(const id of selects)check(JSON.stringify(Array.from(D.fieldOptions(id,h.scope.tenantId)))===JSON.stringify(beforeOptions[id]),'report '+id+' candidate dimension remains available from the field library');
  check(JSON.stringify(old.call.businessFormVersion)===version&&dimensions.every(id=>M.fields('lead',old.call).some(field=>field.id===id)),'already bound call preserves the original six definitions and requiredness');
  check(!h.C.validate({...old.values,leadLevel:''},old.call).ok,'current administrator removal cannot bypass the original call mandatory rule');
  const oldSave=h.saveReport(old);check(oldSave.ok&&dimensions.every(id=>Object.hasOwn(oldSave.values,id)),'the original bound call really saves its six values after current category removal');
  const fresh=h.mountReport('REPORT-NEW-WITHOUT-DIMENSIONS',positive);
  check(dimensions.every(id=>!h.document.getElementById('seat-followup-'+id)),'new real form omits every removed reporting field');
  check(dimensions.every(id=>h.C.update(fresh.values,fresh.call,id,positive[id])===null),'removed fields cannot be written through the current followup update API');
  const freshSave=h.saveReport(fresh);check(freshSave.ok,'a new call can save without the removed mandatory fields');
  for(const id of dimensions)check(!Object.hasOwn(freshSave.values,id)&&!Object.hasOwn(freshSave.values.businessFieldSnapshot.values,id)&&!freshSave.values.businessFieldSnapshot.fields.some(field=>field.fieldId===id),'actual validated save and callback omit injected raw '+id);
  const empty=h.mountReport('REPORT-NO-PRIOR-VALUES',positive,h.scope,'COHORT-EMPTY');check(h.saveReport(empty).ok,'another lead with no original contributing values saves under the new references');
  let model=h.model();check(!model.error&&model.rows.length===2&&model.calls.length===3,'actual report sources, call facts and cohort association preserve all authorized records');
  const inherited=model.rows.find(row=>row.code==='COHORT-001'),unfilled=model.rows.find(row=>row.code==='COHORT-EMPTY');
  check(dimensions.every(id=>inherited[id]===positive[id]&&inherited.fieldSources[id].callId===old.call.callId),'new omitted fields do not erase genuine previous bound-call contributions');
  check(dimensions.every(id=>unfilled[id]===''&&!unfilled.fieldSources[id]),'new unconfigured dimensions remain empty rather than recording business false or zero');
  check(!unfilled.intentionRecorded&&!unfilled.visitIntended&&!unfilled.testDriveIntended&&!unfilled.plannedVisit,'unconfigured dimensions are never treated as an actual filled or positive observation');
  check(model.summary.intentionRecorded===1&&model.summary.visitIntended===1&&model.summary.testDriveIntended===1&&model.summary.plannedVisit===1,'existing positive counts use the known original values and exclude the empty lead');
  check(model.summary.intentionDistribution.find(row=>row.value==='高意向')?.count===1&&model.summary.intentionDistribution.length===beforeOptions.intentionLevel.length,'intention distribution uses stable library dimensions and still counts the original valid saved value');
  const selected=h.model({intentionLevel:'高意向',visitIntention:'有意向'});check(!selected.error&&selected.rows.length===1&&selected.rows[0].key===inherited.key,'real report normalization and filters still read the saved original intention after category removal');
  check(!D.normalize({period:'自定义',startDate:'2026-01-01',endDate:'2026-12-31',tenantId:h.scope.tenantId,intentionLevel:'高意向'}).error,'report candidates do not depend on the current category showing intentionLevel');
  const aggregate=h.C.aggregate(h.d.calls);check(aggregate.groups.find(group=>group.externalDocumentId==='COHORT-001')?.values.plannedStoreName===positive.plannedStoreName,'ordinary customer aggregation keeps the existing most-recent-nonempty rule');
  const zero=copy(M.get('lead',h.scope));zero.fields=[];check(M.save(zero,h.scope).ok&&M.catalog(h.scope).ok,'zero supplemental references also save as a readable current category');
  const noFields=h.mountReport('REPORT-ZERO-FORM',positive,h.scope,'COHORT-ZERO');check(M.fields('lead',noFields.call).length===0&&h.saveReport(noFields).ok,'actual zero-field form saves without inventing the six original values');
  model=h.model();const zeroRow=model.rows.find(row=>row.code==='COHORT-ZERO');check(dimensions.every(id=>zeroRow[id]==='')&&model.summary.intentionRecorded===1,'zero-field data stays empty and does not inflate filled statistics');
  for(const id of selects)check(D.fieldOptions(id,h.scope.tenantId).length===beforeOptions[id].length,'zero-field category still leaves '+id+' as a report dimension');
  check(M.save(original,h.scope).ok,'administrator can explicitly restore the category references');
  const restored=h.mountReport('REPORT-AFTER-READD',positive,h.scope,'COHORT-RESTORED');check(dimensions.every(id=>h.document.getElementById('seat-followup-'+id))&&h.saveReport(restored).ok,'subsequent real form can use restored references normally');
  model=h.model();check(model.summary.intentionRecorded===2&&model.summary.intentionDistribution.find(row=>row.value==='高意向').count===2,'normal positive counts resume for new saved values after references are restored');
 }
 {
  const h=setupReport(),M=h.M,D=h.w.CloudReportData,other={...h.scope,tenantId:'REPORT-OTHER-TENANT'};
  const tenant=copy(h.d.tenants.find(row=>row.tenantId===h.scope.tenantId));h.d.tenants.push({...tenant,...other,name:'其他租户报表夹具'});h.allowed.add(other.tenantId);
  const own=h.mountReport('REPORT-OWN-SCOPE',positive,h.scope,'OWN-SCOPE');check(h.saveReport(own).ok,'fixture saves an authorized current-tenant lead through the real followup component');
  const foreign=h.mountReport('REPORT-OTHER-SCOPE',positive,other,'OTHER-SCOPE');check(h.saveReport(foreign).ok,'fixture saves an independently authorized tenant lead before access is revoked');
  let model=h.model({tenantId:''});check(model.rows.length===2&&model.summary.intentionRecorded===2,'explicit cross-tenant report only includes the two currently authorized tenants');
  h.catalogReads.length=0;D.fieldOptions('intentionLevel');check(new Set(h.catalogReads.map(row=>row.tenantId)).size===2&&h.catalogReads.every(row=>h.allowed.has(row.tenantId)&&row.enterpriseId===h.scope.enterpriseId),'library candidate lookup is restricted to the same authorized tenant scope');
  h.allowed.delete(other.tenantId);h.catalogReads.length=0;model=h.model({tenantId:''});D.fieldOptions('intentionLevel');
  check(model.rows.length===1&&model.rows[0].code==='OWN-SCOPE'&&model.summary.intentionRecorded===1,'revoked tenant records cannot contribute rows or intention counts');
  check(h.catalogReads.every(row=>row.tenantId===h.scope.tenantId)&&D.fieldOptions('intentionLevel',other.tenantId).length===0,'revoked tenant library options are never queried or exposed');
  check(!!h.model({tenantId:other.tenantId}).error,'explicit revoked-tenant report filters fail authorization normalization');
  h.setReportsAllowed(false);check(D.fieldOptions('intentionLevel').length===0&&!!h.model().error,'report permission revocation blocks candidates and actual models');h.setReportsAllowed(true);
  h.setValid(false);check(D.fieldOptions('intentionLevel').length===0&&!!h.model().error,'account validity remains a live report permission boundary');h.setValid(true);
  h.setObjectAllowed(false);check(D.fieldOptions('intentionLevel').length===0&&h.model({tenantId:''}).rows.length===0,'object authorization loss cannot leak dimensions or lead rows');
 }
 console.log(JSON.stringify({passed,scope:'real current categories, call-version followup save, reporting-library candidates, old saved cohort values, empty dimensions and live tenant/report authorization'}));
}
if(require.main===module)run();
module.exports={setupReport,dimensions,positive};
