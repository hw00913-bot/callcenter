/** Manual calls reference existing skills and number grants; no separate config. */
(function(){
  function numbers(g){return CloudCallData.phoneNumbers.filter(n=>CloudResourceRules.usableNumber(n,g.tenantId,'呼出')&&CloudResourceRules.numberBound(n,g.skillGroupId));}
  function render(){
    return AgentWorkbench.render();
  }
  window.ManualSkillAccess={render,numbers};
  // Old internal URLs remain read-only navigation; no old config writes or cache load.
  window.ScenarioCalling={render,openManual(){navigateTo('manual-outbound');},saveManual(){showToast('人工外呼不再单独维护配置，请使用坐席技能和号码管理','info');}};
})();
