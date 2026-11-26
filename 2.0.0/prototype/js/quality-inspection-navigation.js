(() => {
  'use strict';

  const libraryPages = [['PAGE-21023','外呼敏感词库'],['PAGE-21024','客户问句']];
  const administratorPages = new Set(libraryPages.map(([id])=>id));
  const pages = [['PAGE-21017','质检看板'],['PAGE-21018','质检申诉'],['PAGE-21019','质检明细'],...libraryPages];
  const ids = new Set(pages.map(([id])=>id));
  for (const [id,name] of pages) {
    DNav.pages.push({id,name,area:'呼叫中心',group:'质检管理',route:'',menu:true,module:'public',phoneDomain:'outside'});
  }

  const pagePolicy = DRolePermissions.page;
  DRolePermissions.page = (id,context,seat) => {
    if (administratorPages.has(id)) return Boolean(DQualityModelConfig.access(context));
    return ids.has(id) ? Boolean(DQualityInspection.access(context)) : pagePolicy(id,context,seat);
  };

  const writePolicy = DRolePermissions.writable;
  DRolePermissions.writable = (id,context,seat) => {
    if (administratorPages.has(id)) return Boolean(DQualityModelConfig.access(context));
    if (!ids.has(id)) return writePolicy(id,context,seat);
    const access = DQualityInspection.access(context);
    return Boolean(access?.canReview || access?.canAppeal && id !== 'PAGE-21017');
  };
})();
