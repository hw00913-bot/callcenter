/* A single blacklist entrance reuses the original AI groups and number forms. */
(function(){
  'use strict';
  let position={};
  const policy=()=>window.DContactPolicy;
  function render(context,filters={}){
    position=filters.blacklistPosition||filters.specialPosition||{};
    if(!policy().canSpecial(policy().specialScope()))return '<section class="d-contact-page"><div class="d-page-heading"><h1>呼叫拦截</h1></div><div class="d-page-empty">当前租户没有可访问的黑名单管理范围。</div></section>';
    return '<section class="d-contact-page d-blacklist-page" aria-label="呼叫拦截"><div id="blacklist-slot" class="d-inline-slot"><p class="field-hint">正在读取黑名单分组与号码…</p></div></section>';
  }
  function refresh(next={}){DApp.saveFilters({blacklistPosition:position,...next});return DApp.openPage('PAGE-2007',{initial:true});}
  function init(){
    const slot=document.getElementById('blacklist-slot');if(!slot)return;
    const options={blacklistPosition:position};
    if(!DModuleHost.openInline('ai','scene-block',slot,options))slot.innerHTML='<p class="form-error">黑名单页面暂时无法读取，请重新进入。</p>';
    else slot.replaceChildren();
    DApp.saveFilters({blacklistPosition:position});
  }
  function showBlacklist(){if(!policy().canSpecial(policy().specialScope()))return DUI.toast('没有当前租户的黑名单查看权限。');return DApp.openPage('PAGE-2007');}
  window.DContacts={refresh,showBlacklist,showSpecial:showBlacklist,recheck(){if(DApp.currentPage()==='PAGE-2007'&&!policy().canSpecial(policy().specialScope()))refresh();}};
  window.Pages=window.Pages||{};Pages['PAGE-2007']={render,init};
})();
