/** 云联络中心工作台入口。 */
(function () {
  'use strict';

  window.Pages = window.Pages || {};
  window.Pages.home = {
    render(options) {
      if (!AppState.effectiveAccess().valid) return PlatformUI.empty('请先选择有效的工作范围');
      return WorkbenchOverview.render(options);
    },
    init() { AgentWorkbench.updateDock(); }
  };
})();
