/* Local model checks for the isolated v1.1.1 demonstration. No production API is exercised. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '..');
const storage = new Map();
const scope = { enterpriseId: 'e1', tenantId: 't1' };
const entries = [
  { id: 'd-series', name: '车系', capabilityId: 'c-series', enabled: true },
  { id: 'd-store', name: '门店', capabilityId: 'c-store', enabled: true },
  { id: 'other-series', name: '未授权车系', capabilityId: 'c-series', enabled: true }
];
const win = {
  localStorage: {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, value)
  },
  AppState: {
    get: () => ({ ...scope, accountId: 'a1', sessionId: 's1', activeDomain: 'CLOUD_CONTACT_CENTER' }),
    effectiveAccess: () => ({ roleCode: 'ADMIN', valid: true }),
    authorizeObject: () => true
  },
  CloudCallData: {
    tenants: [{ ...scope, name: '租户', status: '启用', capabilitySet: ['CLOUD_CONTACT_CENTER'] }]
  },
  BusinessData: {
    entry: id => entries.find(entry => entry.id === id),
    capability: id => [{ id: 'c-series', kind: 'series', queryConditions: [] }, { id: 'c-store', kind: 'store', queryConditions: [{key:'seriesCode',label:'车系',required:true,sourceKind:'series',valueKey:'code',help:'此接口需要根据车系查询门店，请选择提供车系值的字段。'}] }].find(row => row.id === id),
    available: id => entries.some(entry => entry.id === id && entry.enabled && entry.id !== 'other-series')
  }
};
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/components/customer-business.js'), 'utf8'), { window: win });
const model = win.CustomerBusiness;
let passed = 0;
const check = (value, message) => { assert(value, message); passed += 1; };
const catalog = model.catalog(scope);
const lead = catalog.rows.find(row => row.id === 'lead');
check(catalog.ok, 'catalog ready');
check(catalog.fields.filter(field=>field.type==='interface' && model.interfaceKind(field)==='series').length===1 && !catalog.fields.some(field=>field.id==='backupSeries'),'only one intention series field is seeded');
check(lead.fields.length === 8, 'lead retains original six and adds only one series and one store');
check(lead.fields.every(ref => ref.required === false), 'sample refs optional');
check(catalog.fields.find(field => field.id === 'plannedStoreName').type === 'text', 'old planned store remains text');
check(catalog.rows.find(row => row.id === 'activity').fields.length === 3, 'activity unrelated fields untouched');
const series = {
  id: 'newSeries', label: '新车系', type: 'interface', dictionaryId: 'd-series', depends: [],
  businessKey: '', options: [], enabled: true
};
check(model.normalizeField(series).row.dictionaryId === 'd-series', 'normalization preserves dictionary');
check(!model.normalizeField({ ...series, id: 'newStore', dictionaryId: 'd-store', depends: ['intendedSeries', 'intendedSeries'] }).ok, 'duplicate dependency rejected');
check(!model.normalizeField({ ...series, depends: ['newSeries'] }).ok, 'self dependency rejected');
check(!model.saveField({ ...series, dictionaryId: 'other-series' }, scope).ok, 'unauthorized new source rejected');
check(model.saveField(series, scope).ok, 'authorized series saved for use by another category');
const duplicateCategory=model.get('lead',scope);duplicateCategory.fields.push({fieldId:'newSeries',enabled:true,required:false});check(!model.save(duplicateCategory,scope).ok,'second series field in one category rejected');
check(!model.saveField({...series,id:'multiStore',label:'多关联门店',dictionaryId:'d-store',depends:['intendedSeries','newSeries']},scope).ok,'store with multiple series dependencies rejected');
check(!model.saveField({ ...series, id: 'badStore', label: '错误门店', dictionaryId: 'd-store', depends: ['plannedStoreName'] }, scope).ok, 'text dependency rejected');
check(!model.saveField({ ...series, id: 'blankStore', label: '空关联门店', dictionaryId: 'd-store', useQueryConditions:true, depends: [] }, scope).ok, 'enabled condition requires dependency');
check(model.saveField({ ...series, id: 'orphanStore', label: '测试门店', dictionaryId: 'd-store', depends: ['newSeries'] }, scope).ok, 'store series dependency saved');
check(!model.deleteField('newSeries', scope).ok, 'linked series deletion blocked');
check(!model.saveField({ ...model.getField('intendedSeries', scope), type: 'text', options: [] }, scope).ok, 'linked series type switch blocked');
entries[0].enabled = false;
check(model.saveField({ ...model.getField('intendedSeries', scope), label: '保留引用车系' }, scope).ok, 'existing unavailable source retained for edits');
check(!model.saveField({ ...series, id: 'unavailableSeries', label: '停用来源新字段' }, scope).ok, 'new unavailable source blocked');
const category = model.get('lead', scope);
category.fields.find(ref => ref.fieldId === 'intendedStore').required = true;
check(model.save(category, scope).ok, 'category required saved');
check(model.fields('lead', scope).find(field => field.id === 'intendedStore').required === true && !Object.hasOwn(model.getField('intendedStore', scope), 'required'), 'required remains category-level');
check(!model.saveField({ ...model.getField('plannedStoreName', scope), type: 'interface', dictionaryId: 'd-store', depends: ['intendedSeries'] }, scope).ok, 'preset type protected');
const snapshot = model.callbackSnapshot({
  businessType: 'lead',
  intendedStore: { code: '001', name: '历史店名', type: 'NEV', state: 'valid', sourceVersion: 8 }
}, scope);
const savedField = snapshot.fields.find(field => field.fieldId === 'intendedStore');
check(savedField.value.length === 1 && savedField.value[0].code === '001' && savedField.value[0].name === '历史店名' && savedField.businessFieldCode === '', 'code/name snapshot and no invented business mapping');
check(!Object.hasOwn(savedField.value[0], 'state') && !Object.hasOwn(snapshot.values.intendedStore[0], 'sourceVersion') && savedField.selectedOptions.length === 0, 'query state excluded from callback and no false local option');
const multiValues={businessType:'lead',intendedSeries:{code:'NEV-A',name:'保存时车系',type:'NEV',entryId:'d-series',state:'valid',sourceVersion:'series-token'},intendedStore:[{code:'001',name:'历史店名',type:'NEV',entryId:'d-store',state:'valid',sourceVersion:'source-token',verifiedScope:'scope-token'},{code:'002',name:'另一店名',type:'NEV',entryId:'d-store',state:'pending',sourceVersion:'source-token-2',verifiedScope:'scope-token-2'}],plannedStoreName:'原计划门店'};
const multiOriginal=JSON.stringify(multiValues), multiSnapshot=model.callbackSnapshot(multiValues,scope), multiField=multiSnapshot.fields.find(field=>field.fieldId==='intendedStore');
check(multiField.value.length===2 && multiField.value.map(row=>row.code).join(',')==='001,002' && multiField.value.map(row=>row.name).join(',')==='历史店名,另一店名','multi-store callback includes every selected code and its saved name');
check(multiSnapshot.values.intendedStore.length===2 && multiSnapshot.values.intendedStore.every(row=>Object.keys(row).sort().join(',')==='code,name,type') && multiField.value.every(row=>Object.keys(row).sort().join(',')==='code,name,type'),'every store strips source identity, state and query tokens in both callback projections');
check(!JSON.stringify(multiSnapshot).includes('source-token') && !JSON.stringify(multiSnapshot).includes('scope-token') && !JSON.stringify(multiSnapshot).includes('series-token'),'callback metadata cannot leak through array members or series selection');
check(!Array.isArray(multiSnapshot.values.intendedSeries) && multiSnapshot.values.intendedSeries.code==='NEV-A' && multiSnapshot.values.plannedStoreName==='原计划门店','series stays a single object while ordinary values remain intact');
check(JSON.stringify(multiValues)===multiOriginal,'callback projection leaves all draft selections and their validation tokens untouched');
const emptySnapshot=model.callbackSnapshot({businessType:'lead',intendedStore:[]},scope);
check(Array.isArray(emptySnapshot.values.intendedStore) && emptySnapshot.values.intendedStore.length===0 && emptySnapshot.fields.find(field=>field.fieldId==='intendedStore').value.length===0,'empty store remains an empty array in both callback projections');
const absentSnapshot=model.callbackSnapshot({businessType:'lead'},scope);
check(Array.isArray(absentSnapshot.values.intendedStore) && absentSnapshot.values.intendedStore.length===0,'an omitted store callback is normalized to no selections');
const current=model.catalog(scope);
const legacy={version:3,revision:11,scopes:[{...scope,types:JSON.parse(JSON.stringify(current.rows)),fields:JSON.parse(JSON.stringify(current.fields))}]};
legacy.scopes[0].fields.push({id:'backupSeries',label:'备选意向车系',type:'interface',dictionaryId:'d-series',depends:[],businessKey:'',options:[],enabled:true});
legacy.scopes[0].types.find(row=>row.id==='lead').fields.push({fieldId:'backupSeries',enabled:true,required:true});
legacy.scopes[0].fields.find(row=>row.id==='intendedStore').depends=['intendedSeries','backupSeries'];
const legacyRaw=JSON.stringify(legacy);storage.set(model.storageKey,legacyRaw);const migrated=model.catalog(scope);
check(migrated.ok && !migrated.fields.some(field=>field.id==='backupSeries'),'existing mock catalog removes backup field on read');
check(migrated.rows.find(row=>row.id==='lead').fields.every(ref=>ref.fieldId!=='backupSeries'),'existing category no longer renders backup series');
check(migrated.fields.find(field=>field.id==='intendedStore').depends.join(',')==='intendedSeries','existing store dependency narrows to the primary series');
check(storage.get(model.storageKey)===legacyRaw,'read projection leaves old raw configuration untouched');
check(model.fields('lead',scope).filter(field=>model.interfaceKind(field)==='series').length===1,'existing config renders a single series without clearing browser storage');
legacy.scopes[0].fields.find(field=>field.id==='intendedStore').depends=['backupSeries'];storage.set(model.storageKey,JSON.stringify(legacy));const backupOnly=model.catalog(scope);
check(backupOnly.ok && backupOnly.fields.find(field=>field.id==='intendedStore').depends.join(',')==='intendedSeries','old store linked only to backup migrates to the primary field');
legacy.scopes[0].types.find(row=>row.id==='lead').fields=legacy.scopes[0].types.find(row=>row.id==='lead').fields.filter(ref=>ref.fieldId!=='intendedSeries');storage.set(model.storageKey,JSON.stringify(legacy));const backupCategory=model.catalog(scope);
check(backupCategory.ok && backupCategory.rows.find(row=>row.id==='lead').fields.some(ref=>ref.fieldId==='intendedSeries') && !backupCategory.rows.find(row=>row.id==='lead').fields.some(ref=>ref.fieldId==='backupSeries'),'category with only backup receives the single primary reference');
legacy.scopes[0].fields=legacy.scopes[0].fields.filter(field=>field.id!=='intendedSeries');storage.set(model.storageKey,JSON.stringify(legacy));const missingPrimary=model.catalog(scope);
check(missingPrimary.ok && missingPrimary.fields.find(field=>field.id==='intendedSeries').label==='本次意向车系','old backup-only field library has a single main series after projection');
console.log(JSON.stringify({ passed, catalogFields: model.catalog(scope).fields.length }));
