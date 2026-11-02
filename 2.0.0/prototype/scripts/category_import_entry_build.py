"""Attach the authorized category-owned import launcher to the existing category table."""
def transform(kind,path,code):
    if kind!='cloud' or path!='js/pages/business-categories.js':return code
    helper="""  function categoryImportAction(row){
    const scope=currentScope();if(scope.legacy||row.enabled===false||!parent.DModuleHost?.canImportCategory?.(row.id,scope.brandId))return '';
    return '<button data-action="import-category-customers" onclick="'+action('openCategoryImport',row.id)+'">导入名单</button>';
  }
  function openCategoryImport(categoryId){const scope=currentScope();if(scope.legacy)return false;return parent.DModuleHost.openCategoryImport(categoryId,scope.brandId);}
"""
    old='  function rowActions(kind,row,data) {'
    if code.count(old)!=1:raise ValueError('Category import action anchor changed')
    code=code.replace(old,helper+old,1)
    old='return `<div class="table-actions"><button onclick="${action(\'open\',kind,row.id)}">编辑</button>'
    new='return `<div class="table-actions">${kind===\'category\'?categoryImportAction(row):\'\'}<button onclick="${action(\'open\',kind,row.id)}">编辑</button>'
    if code.count(old)!=1:raise ValueError('Category table action markup changed')
    code=code.replace(old,new,1)
    code=code.replace('window.BusinessConfiguration={','window.BusinessConfiguration={openCategoryImport,',1)
    return code
