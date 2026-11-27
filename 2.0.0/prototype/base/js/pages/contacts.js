/* A single blacklist entrance reuses the original AI groups and number forms. */
(function(){
  'use strict';
  let position={},pendingPrefill=null;
  const policy=()=>window.DContactPolicy;
  function render(context,filters={}){
    position=filters.blacklistPosition||filters.specialPosition||{};
    pendingPrefill=filters.blacklistPrefill||null;
    if(!policy().canSpecial(policy().specialScope()))return '<section class="d-contact-page"><div class="d-page-heading"><h1>呼叫拦截</h1></div><div class="d-page-empty">当前租户没有可访问的黑名单管理范围。</div></section>';
    return '<section class="d-contact-page d-blacklist-page" aria-label="呼叫拦截"><div id="blacklist-slot" class="d-inline-slot"><p class="field-hint">正在读取黑名单分组与号码…</p></div></section>';
  }
  function refresh(next={}){DApp.saveFilters({blacklistPosition:position,...next});return DApp.openPage('PAGE-2007',{initial:true});}
  function openAIRefusal(prefill={}){
    const c=DSession.context();
    const sourceConfirmation=!!(prefill.sourceCallId&&prefill.platform);
    if(c?.scope.kind!=='tenant'||prefill.tenantId&&prefill.tenantId!==c.scope.id||!(sourceConfirmation?policy().canPublic(c.scope.id,'add'):policy().canSpecial(policy().specialScope(),'record.add')))return DUI.toast('没有当前租户的黑名单新增权限。');
    if(!policy().valid(prefill.phone))return DUI.toast('来源号码不完整，请先核对通话记录。');
    if(sourceConfirmation){try{const matches=policy().aiCalls(c.scope.id).filter(r=>String(r.sessionId)===String(prefill.sourceCallId)&&r.platform===prefill.platform&&policy().normalize(r.phone)===policy().normalize(prefill.phone));if(matches.length!==1)return DUI.toast('来源通话无法准确定位，请重新核对。');}catch(error){return DUI.toast(error.message);}}
    return DApp.openPage('PAGE-2007',{pageFilters:{blacklistPosition:position,blacklistPrefill:{phone:policy().normalize(prefill.phone),reason:prefill.reason||'',addType:'DECLINE',sourceCallId:prefill.sourceCallId||'',platform:prefill.platform||''}}});
  }
  function init(){
    const slot=document.getElementById('blacklist-slot');if(!slot)return;
    const options={blacklistPosition:position,...(pendingPrefill?{blacklistPrefill:pendingPrefill}:{})};
    pendingPrefill=null;
    if(!DModuleHost.openInline('ai','scene-block',slot,options))slot.innerHTML='<p class="form-error">黑名单页面暂时无法读取，请重新进入。</p>';
    else slot.replaceChildren();
    // A source-call shortcut opens the existing number form only once.
    DApp.saveFilters({blacklistPosition:position});
  }
  function showBlacklist(){if(!policy().canSpecial(policy().specialScope()))return DUI.toast('没有当前租户的黑名单查看权限。');return DApp.openPage('PAGE-2007');}
  window.DContacts={openAIRefusal,refresh,showBlacklist,showSpecial:showBlacklist,recheck(){if(DApp.currentPage()==='PAGE-2007'&&!policy().canSpecial(policy().specialScope()))refresh();}};
  window.Pages=window.Pages||{};Pages['PAGE-2007']={render,init};
})();
