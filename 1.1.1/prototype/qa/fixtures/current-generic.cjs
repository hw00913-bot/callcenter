/* Explicit data-only fixture in the current schema. Never loaded by the prototype.
 * The defaults remain Mapping-only; these are additional configured generic capabilities. */
'use strict';
const copy=value=>JSON.parse(JSON.stringify(value));
const ids=Object.freeze({seriesEntryId:'d-fixture-series',storeEntryId:'d-fixture-store',seriesFieldId:'genericSeries',storeFieldId:'genericStore'});
function dictionary(window,options={}){
 const B=window.BusinessData,scope=options.scope||window.AppState.get();
 if(!B?.storageKey||B.storageVersion!==1)throw Error('Current BusinessData schema is required by the fixture');
 const data={version:B.storageVersion,revision:0,entries:copy(B.entries())},tenantIds=options.tenantIds||B.tenants().map(row=>row.tenantId);
 for(const [id,capabilityId,name]of [[ids.seriesEntryId,'series','通用车系查询（测试配置）'],[ids.storeEntryId,'stores','通用门店查询（测试配置）']]){
  if(!data.entries.some(row=>row.id===id))data.entries.push({id,name,capabilityId,tenantIds:[...tenantIds],enabled:true,sourceRevision:0,tenantRevisions:{}});
 }
 window.localStorage.setItem(B.storageKey,JSON.stringify(data));
 return {scope:copy(scope),...ids,dictionaryRaw:window.localStorage.getItem(B.storageKey)};
}
function catalog(window,options={}){
 const M=window.CustomerBusiness,scope=options.scope||window.AppState.get();
 if(!M?.storageKey||M.storageVersion!==1)throw Error('Current CustomerBusiness schema is required by the fixture');
 const current=M.catalog(scope);if(!current.ok)throw Error(current.message);
 const fields=copy(current.fields),rows=copy(current.rows);
 const series={id:ids.seriesFieldId,label:'通用车系',type:'interface',businessKey:'',options:[],enabled:true,dictionaryId:ids.seriesEntryId,useQueryConditions:false,depends:[]};
 const store={id:ids.storeFieldId,label:'通用门店',type:'interface',businessKey:'',options:[],enabled:true,dictionaryId:ids.storeEntryId,useQueryConditions:true,depends:[ids.seriesFieldId],parameterBinding:{parameterName:'seriesCode',sourceValueKey:'code',required:options.required!==false}};
 for(const field of [series,store])if(!fields.some(row=>row.id===field.id))fields.push(field);
 const category=rows.find(row=>row.id==='lead');if(!category)throw Error('Current lead category is required by the fixture');
 category.fields=category.fields.filter(ref=>!window.CustomerBusiness.isMappingSeriesField?.(fields.find(field=>field.id===ref.fieldId)) && ![ids.seriesFieldId,ids.storeFieldId].includes(ref.fieldId));
 category.fields.push({fieldId:ids.seriesFieldId,enabled:true,required:false},{fieldId:ids.storeFieldId,enabled:true,required:false});
 const data={version:M.storageVersion,revision:0,scopes:[{enterpriseId:String(scope.enterpriseId),tenantId:String(scope.tenantId),types:rows,fields}]};
 window.localStorage.setItem(M.storageKey,JSON.stringify(data));
 const checked=M.catalog(scope);if(!checked.ok)throw Error(checked.message);
 return {scope:copy(scope),...ids,catalogRaw:window.localStorage.getItem(M.storageKey)};
}
function install(window,options={}){if(options.tenantId&&!options.scope)options={scope:options};return {...dictionary(window,options),...(window.CustomerBusiness&&!options.dictionaryOnly?catalog(window,options):{})};}
module.exports={...ids,dictionary,catalog,install};
