/** Fictional exten/list rows. Tenant allocation is local metadata, never an AliCti field. */
(function(root){
  'use strict';
  const enterpriseId='7522240',hq='TEN-NISSAN-HQ',sh='TEN-NISSAN-SH';
  const row=(id,exten,tenantId,extra={})=>({id:String(id),enterpriseId:tenantId===sh?'7522241':enterpriseId,exten,tenantId,type:2,active:1,callPower:'0',isOb:1,isDirect:1,ibRecord:1,obRecord:1,areaCode:'021',jitterBuffer:0,denoise:0,allow:'alaw,ulaw',bindCno:null,createTime:'2026-09-20 09:00:00',...extra});
  const freeze=value=>{Object.values(value).forEach(child=>{if(child&&typeof child==='object')freeze(child);});return Object.freeze(value);};
  root.AliCtiExtensionFixtures=freeze({
    simulation:true,
    rows:[row(98001,'80000012',hq),row(98002,'80001001',hq),row(98003,'80001201',hq),row(98004,'80002103',hq),row(98005,'80002201',sh),row(98006,'80002202',sh),row(98007,'80002203',sh),row(98008,'80009001',hq),row(98009,'80009002',sh),row(98010,'8101',hq),row(98011,'8102',hq),row(98012,'8201',sh),row(98013,'8202',sh,{active:0}),row(96001,'0012',hq),row(96002,'1018',sh)],
    available:[row(98101,'8301',''),row(98102,'8302',''),row(98103,'008303',''),row(98104,'8304','',{active:0}),row(98105,'8401','',{type:3,allow:'g729'}),row(98301,'8301','',{enterpriseId:'7522241'}),row(98302,'8302','',{enterpriseId:'7522241'}),row(98303,'8303','',{enterpriseId:'7522241',active:0}),row(98201,'8301','',{enterpriseId:'DEMO-ENT-003'})]
  });
})(window);
