/** Manual caller numbers use tenant grants and preview-outcall capability independently of skills. */
(function(){
  function numbers(scope){return scope?CloudCallData.phoneNumbers.filter(n=>n.enterpriseId===scope.enterpriseId&&CloudResourceRules.usableNumber(n,scope.tenantId,'呼出','预览外呼')):[];}
  function render(){
    return AgentWorkbench.render();
  }
  window.ManualSkillAccess={render,numbers};
  // Old internal URLs remain read-only navigation; no old config writes or cache load.
  window.ScenarioCalling={render,openManual(){RouteRuntime.openSecondary('manual-outbound');},saveManual(){showToast('人工外呼不再单独维护配置，请使用坐席技能和号码管理','info');}};
})();
