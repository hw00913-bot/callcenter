/* Extend the native catalog transaction with first-level category definitions. */
(() => {
    "use strict";

    function adapt(html) {
        function replace(before, after) {
            const at = html.indexOf(before);
            if (at < 0 || html.indexOf(before, at + before.length) >= 0) {
                throw new Error("无法定位一级分类业务目录配置。");
            }
            html = html.slice(0, at) + after + html.slice(at + before.length);
        }

        replace("  function businessFamilyLocks(id, source = {}) {", `  const defaultFamilies = [
    {id:'LEAD',label:'线索'},
    {id:'ORDINARY',label:'普通业务'}
  ];
  const familyRows = bundle => bundle.categoryFamilies ?? defaultFamilies;
  const familyNameKey = label => label.trim().toLocaleLowerCase();
  function validFamilyLabel(label) {
    return typeof label === 'string' && label === label.trim() &&
      label.length > 0 && label.length <= 40 && familyNameKey(label) !== '全部分类';
  }
  function familyId(category) {
    if (['lead','lxs'].includes(canonicalType(category?.id))) return 'LEAD';
    return safeId(category?.familyId) ? category.familyId : businessFamily(category);
  }
  function familyName(category, definitions = defaultFamilies) {
    const id = familyId(category);
    return definitions.find(row => row.id === id)?.label || '一级分类待核';
  }
  function families(source = {}) {
    const data = catalog(source);
    if (!data.ok) return data;
    const canEdit = data.scope?.legacy
      ? canManage() && allowed(scopeOf(source))
      : canManageBrand(data.scope?.brandId);
    const canCreate = canEdit && !superUser();
    const ids = new Set(data.rows.map(familyId));
    return {
      ok:true, scope:data.scope, revision:data.revision, context:data.context,
      canCreate, canEdit, canDelete:canCreate,
      rows:(data.categoryFamilies ?? defaultFamilies).map(row => ({...row,hasChildren:ids.has(row.id)}))
    };
  }
  function saveFamily(input, source = {}, options = {}) {
    const label = text(input?.label).trim(), id = input?.id;
    if (!validFamilyLabel(label)) return fail('请输入 1 至 40 字的一级分类名称，“全部分类”用于列表汇总。');
    if (id !== undefined && id !== '' && !safeId(id)) return fail('一级分类标识无效，请重新打开。');
    return mutate(source,options,target => {
      const rows = clone(familyRows(target));
      const previous = rows.find(row => row.id === id);
      if (id && !previous) return fail('该一级分类已删除或不在当前目录。');
      if (!previous && superUser()) return fail('超级管理员仅可编辑已有一级分类。');
      if (rows.some(row => row.id !== id && familyNameKey(row.label) === familyNameKey(label))) {
        return fail('当前目录已有同名一级分类。');
      }
      const row = {id:previous?.id || newId('family'),label};
      if (previous) rows[rows.indexOf(previous)] = row;
      else rows.push(row);
      target.categoryFamilies = rows;
      return {ok:true,row:clone(row),message:'一级分类已保存'};
    });
  }
  function removeFamily(id, source = {}, options = {}) {
    if (!safeId(id)) return fail('一级分类标识无效，请重新打开。');
    if (superUser()) return fail('超级管理员仅可编辑已有一级分类。');
    return mutate(source,options,target => {
      const rows = familyRows(target);
      if (!rows.some(row => row.id === id)) return fail('该一级分类已删除或不在当前目录。');
      if (target.types.some(row => familyId(row) === id)) {
        return fail('此一级分类下仍有二级分类，请先处理后再删除。');
      }
      target.categoryFamilies = rows.filter(row => row.id !== id);
      return {ok:true,message:'一级分类已删除'};
    });
  }

  function businessFamilyLocks(id, source = {}) {`);

        replace("    if(input.businessFamily!==undefined&&!['LEAD','ORDINARY'].includes(input.businessFamily))",
            "    if(input.familyId!==undefined&&!safeId(input.familyId))return fail('请选择有效的一级分类');\n" +
            "    if(input.businessFamily!==undefined&&!['LEAD','ORDINARY'].includes(input.businessFamily))");
        replace("...(input.businessFamily!==undefined?{businessFamily:input.businessFamily}:{}),...(importFields!==undefined?",
            "...(input.businessFamily!==undefined?{businessFamily:input.businessFamily}:{}),...(input.familyId!==undefined?{familyId:input.familyId}:{}),...(importFields!==undefined?");
        replace("    const types = new Set(), typeNames = new Set();", `    const definitions=familyRows(scope);
    if(!Array.isArray(definitions))return false;
    const familyIds=new Set(),familyLabels=new Set();
    for(const row of definitions){
      if(!object(row)||!safeId(row.id)||!validFamilyLabel(row.label)||familyIds.has(row.id)||familyLabels.has(familyNameKey(row.label)))return false;
      familyIds.add(row.id);familyLabels.add(familyNameKey(row.label));
    }
    const types = new Set(), typeNames = new Set();`);
        replace("      const category = checked.row;\n      if (types.has(category.id)",
            "      const category = checked.row;\n      if(!familyIds.has(familyId(row))||businessFamily(row)!==(familyId(row)==='LEAD'?'LEAD':'ORDINARY'))return false;\n      if (types.has(category.id)");

        replace("rows:clone(bundle.types),fields:clone(bundle.fields),scope:{...scope,legacy:true}",
            "rows:clone(bundle.types),fields:clone(bundle.fields),categoryFamilies:clone(familyRows(bundle)),scope:{...scope,legacy:true}");
        replace("rows:clone(bundle.types),fields:clone(bundle.fields),scope:{...physical.scope,brandId:id}",
            "rows:clone(bundle.types),fields:clone(bundle.fields),categoryFamilies:clone(familyRows(bundle)),scope:{...physical.scope,brandId:id}");

        replace("      const desiredFamily=input.businessFamily===undefined?businessFamily(priorCategory||input):input.businessFamily;\n" +
                "      if(!priorCategory&&desiredFamily==='LEAD'&&!target.brandId)return fail('请先进入明确品牌，再创建线索业务分类');\n" +
                "      if(priorCategory&&businessFamily(priorCategory)!==desiredFamily){const lock=businessFamilyLocks(priorCategory.id,source);if(lock.locked)return fail(lock.reason);}\n" +
                "      row.businessFamily=desiredFamily;",
            `      const previousFamilyId=priorCategory?familyId(priorCategory):'';
      const requestedFamilyId=input.familyId ?? (
        input.businessFamily===undefined || priorCategory&&businessFamily(priorCategory)===input.businessFamily
          ? previousFamilyId||businessFamily(input)
          : input.businessFamily);
      if(!familyRows(target).some(item=>item.id===requestedFamilyId))return fail('一级分类不存在，请重新选择。');
      if(['lead','lxs'].includes(row.id)&&requestedFamilyId!=='LEAD')return fail('预置线索分类固定属于原线索一级分类。');
      const desiredFamily=requestedFamilyId==='LEAD'?'LEAD':'ORDINARY';
      if(!priorCategory&&desiredFamily==='LEAD'&&!target.brandId)return fail('请先进入明确品牌，再创建线索业务分类');
      if(priorCategory&&previousFamilyId!==requestedFamilyId){
        if(!target.brandId)return fail('旧租户目录保留二级分类原归属。');
        const lock=businessFamilyLocks(priorCategory.id,source);
        if(lock.locked)return fail(lock.reason);
      }
      row.businessFamily=desiredFamily;
      if(requestedFamilyId!==desiredFamily)row.familyId=requestedFamilyId;
      else delete row.familyId;`);

        replace("root.CustomerBusiness = Object.freeze({", "root.CustomerBusiness = Object.freeze({families,saveFamily,removeFamily,familyId,familyName,");
        return html;
    }

    window.DReview21BusinessFamilies = {adapt};
})();
