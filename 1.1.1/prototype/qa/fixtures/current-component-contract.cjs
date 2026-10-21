/* Explicit current contract for focused component unit fixtures.
 * It supplies declared metadata only; full catalog/call-version behavior is tested with real models elsewhere. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const clone=value=>structuredClone(value);
function install(window,fields,options={}){
 const B=window.BusinessData,M=window.CustomerBusiness;
 const scalar=(key,valueDomain)=>({key,valueType:'string',valueDomain,valueDomainLabel:valueDomain});
 const caps={series:{id:'series',kind:'series',selectionMode:'single',returnFields:[scalar('code','demo.catalog-series-code'),scalar('name','business.series-name'),scalar('type','demo.vehicle-system')],queryConditions:[]},store:{id:'store',kind:'store',selectionMode:'multiple',returnFields:[scalar('code','demo.store-code'),scalar('name','business.store-name'),scalar('type','demo.vehicle-system')],queryConditions:[{key:'seriesCode',sourceKind:'series',sourceCardinality:'single',valueKey:'code',required:false,valueType:'string',valueDomain:'demo.catalog-series-code',valueDomainLabel:'目录车系编码'}]}};
 const previous=B.capability;if(!options.preserveMetadata)B.capability=id=>caps[id]?clone(caps[id]):previous?.(id);
 for(const field of (options.preserveMetadata?[]:fields.filter(row=>row.type==='interface'))){
  if(field.dictionaryId==='series'){field.useQueryConditions=false;field.depends=[];delete field.parameterBinding;}
  if(field.dictionaryId==='store'){
   field.useQueryConditions=true;
   field.parameterBinding={parameterName:'seriesCode',sourceValueKey:'code',required:true};
  }
 }
 const cap=field=>B.capability(B.entry(field.dictionaryId)?.capabilityId);
 M.selectionMode ||= field=>cap(field)?.selectionMode || '';
 M.returnFields ||= field=>clone(cap(field)?.returnFields || []);
 M.queryConditions ||= field=>clone(cap(field)?.queryConditions || []);
 M.usesQueryConditions ||= field=>field.useQueryConditions===true;
 M.activeDependencies ||= field=>field.useQueryConditions===true?field.depends:[];
 M.parameterBinding ||= field=>field.parameterBinding || null;
 M.getField ||= id=>fields.find(field=>field.id===id);
 if(!M.queryBindingCompatibility){
  // Use the production compatibility implementation against the explicitly declared unit capabilities.
  // Loading the module declares functions only; no catalog is read or substituted into this fixture.
  try {vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../js/components/customer-business.js'),'utf8'),{window,structuredClone},{filename:'js/components/customer-business.js'});M.queryBindingCompatibility=window.CustomerBusiness.queryBindingCompatibility;}
  finally {window.CustomerBusiness=M;}
 }
 M.configurationIssue ||= ()=>'';
 M.callForm ||= ()=>({present:true,ok:true,version:{initialIssues:{},repairs:{}}});
 M.callbackSnapshot=values=>({businessType:values.businessType,businessTypeLabel:'组件测试分类',values:clone(values),fields:fields.map(field=>({fieldId:field.id,fieldName:field.label,type:field.type,...(field.type==='interface'?{dictionaryId:field.dictionaryId,interfaceKind:cap(field)?.kind,selectionMode:cap(field)?.selectionMode}:{}),value:clone(values[field.id] ?? ''),selectedOptions:[]}))});
 if(!B.queryOptions)B.queryOptions=(id,params)=>B.entry(id)?.capabilityId==='store'?B.queryStores(id,params.seriesCode):B.querySeries(id);
 window.AppState.isReady ||= ()=>true;
 return {fields};
}
module.exports={install};
