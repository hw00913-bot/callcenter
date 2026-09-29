/** Account-scoped number import history, including persisted imports. */
(function(){
  'use strict';
  const ui=PlatformUI,esc=ui.escape;
  let openedContext='';
  const context=()=>{const s=AppState.get();return [s.accountId,s.sessionId,s.tenantId,s.enterpriseId,s.activeDomain,AppState.effectiveAccess().roleCode].join('|');};
  const can=()=>AppState.isReady()&&AppState.effectiveAccess().valid&&AppState.isSuper()&&AppState.get().activeDomain==='CLOUD_CONTACT_CENTER'&&AppState.canMenu('resources.numbers');
  function records(){
    const enterpriseId=AppState.get().enterpriseId,rows=new Map();
    CloudCallData.phoneNumbers.filter(n=>n.enterpriseId===enterpriseId&&n.importedFrom==='ALICTI').forEach(n=>rows.set(n.numberId,{...n,importedAt:n.importedAt||'—'}));
    (CloudCallData.numberOnboardingBatches||[]).filter(b=>b.enterpriseId===enterpriseId).forEach(b=>(b.items||[]).forEach(item=>{
      const n=CloudCallData.phoneNumbers.find(n=>n.enterpriseId===enterpriseId&&n.numberId===item.numberId);
      if(n&&!rows.has(n.numberId))rows.set(n.numberId,{...n,importedAt:b.createdAt||'—'});
    }));
    const records=[...rows.values()];return ui.sortByUpdated?.(records,['importedAt'])||records;
  }
  function open(key){
    if(!can()||key&&key!==context())return false;
    openedContext=context();
    ui.openLayer('number-import-history',`<div class="layer-header"><h2>号码导入记录</h2><button aria-label="关闭" onclick="NumberImportHistory.close()">×</button></div><div class="layer-body">${ui.table([
      {key:'importedAt',label:'导入时间'},
      {key:'number',label:'号码'},
      {key:'enterpriseId',label:'AliCti 账号 ID'},
      {key:'businessStatus',label:'当前状态',render:v=>ui.status(v)},
      {key:'numberId',label:'操作',render:id=>`<button class="btn-link" onclick="${esc('NumberImportHistory.configure('+JSON.stringify(id)+')')}">查看号码</button>`}
    ],records(),{emptyText:'暂无导入记录'})}</div><div class="layer-footer"><button class="btn" onclick="NumberImportHistory.close()">关闭</button></div>`,'wide');
    return true;
  }
  function configure(id){
    if(!can()||openedContext!==context()||!document.getElementById('number-import-history')||!records().some(n=>n.numberId===id))return false;
    Pages['resource-lines'].openGrant(id,{context:openedContext});return true;
  }
  function close(){openedContext='';ui.closeLayer('number-import-history');}
  window.NumberImportHistory={open,configure,close};
})();
