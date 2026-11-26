(() => {
  'use strict';

  const catalog = window.DIntegrationApplications;
  const e = DUI.esc;
  let nextScopeId = 0;

  function selection(tenantId,record,options) {
    const owner = options.tenants.find(tenant=>tenant.id===tenantId);
    return {
      brandIds:record?.brandIds ?? (owner ? [owner.brandId || ''] : []),
      tenantIds:record?.tenantIds ?? (owner ? [owner.id] : [])
    };
  }

  function pickerGroup(brand,tenants,picked,bodyId,expanded) {
    const choices = tenants.map(tenant=>`<label class="integration-scope-tenant">
      <input type="checkbox" name="tenantIds" data-scope-tenant data-brand-id="${e(brand.id)}"
        value="${e(tenant.id)}" data-scope-tenant-name="${e(tenant.name)}"${picked.has(tenant.id)?' checked':''}>
      <span>${e(tenant.name)}</span>
    </label>`).join('');
    return `<div class="integration-scope-group" data-scope-group="${e(brand.id)}">
      <div class="integration-scope-brand">
        <label><input type="checkbox" data-scope-brand-check aria-label="全选${e(brand.name)}租户">
          <span>${e(brand.name)}</span></label>
        <button type="button" class="integration-scope-disclosure" data-scope-disclosure
          aria-label="查看${e(brand.name)}的租户" aria-controls="${bodyId}" aria-expanded="${expanded}">
          <span data-scope-group-count></span><span class="integration-scope-chevron" aria-hidden="true"></span>
        </button>
      </div>
      <div class="integration-scope-tenants" id="${bodyId}" data-scope-group-body${expanded?'':' hidden'}>${choices}</div>
    </div>`;
  }

  function fields(context,tenantId,record) {
    const options = catalog.applicableOptions(context);
    const {tenantIds} = selection(tenantId,record,options);
    const picked = new Set(tenantIds);
    const scopeId = 'integration-scope-'+(++nextScopeId);
    let content = '<p class="field-hint">暂无可选租户。</p>';
    if (options.tenants.length) {
      const groups = options.brands.map((brand,index)=>{
        const tenants = options.tenants.filter(tenant=>(tenant.brandId || '')===brand.id);
        if (!tenants.length) return '';
        const expanded = options.brands.length===1 || tenants.some(tenant=>picked.has(tenant.id));
        return pickerGroup(brand,tenants,picked,scopeId+'-brand-'+index,expanded);
      }).join('');
      content = `<div class="integration-scope-anchor">
        <div class="integration-scope-control" data-scope-control>
          <div class="integration-scope-values" data-scope-value></div>
          <button type="button" class="integration-scope-trigger" data-scope-trigger aria-expanded="false"
            aria-controls="${scopeId}-popup" aria-labelledby="${scopeId}-label">
            <span class="integration-scope-chevron" aria-hidden="true"></span>
          </button>
        </div>
        <div class="integration-scope-popup" data-scope-popup id="${scopeId}-popup" hidden>
          <p class="integration-scope-count" role="status" data-scope-count></p>
          <div class="integration-scope-picker">${groups}</div>
        </div>
      </div>`;
    }
    return `<fieldset class="full integration-scope-fields" data-integration-scope>
      <legend id="${scopeId}-label">适用范围 <span aria-hidden="true">*</span></legend>${content}
    </fieldset>`;
  }

  const selectedTenants = control => Array.from(control.querySelectorAll('[data-scope-tenant]:checked'));

  function read(form) {
    const chosen = selectedTenants(form);
    return {brandIds:[...new Set(chosen.map(input=>input.dataset.brandId))],tenantIds:chosen.map(input=>input.value)};
  }

  function bind(form) {
    const controls = form.querySelector('[data-integration-scope]');
    const field = controls.querySelector('[data-scope-control]');
    if (!field) return;
    const trigger = field.querySelector('[data-scope-trigger]');
    const popup = controls.querySelector('[data-scope-popup]');
    const value = controls.querySelector('[data-scope-value]');
    const picker = controls.querySelector('.integration-scope-picker');
    const summary = controls.querySelector('[data-scope-count]');
    const dialog = form.closest('.d-overlay');
    const boundary = form.closest('.d-dialog-body');
    const groups = Array.from(controls.querySelectorAll('[data-scope-group]'),group=>({
      check:group.querySelector('[data-scope-brand-check]'),
      choices:Array.from(group.querySelectorAll('[data-scope-tenant]')),
      count:group.querySelector('[data-scope-group-count]'),
      toggle:group.querySelector('[data-scope-disclosure]'),
      body:group.querySelector('[data-scope-group-body]')
    }));

    let allowedTenantIds = null;
    const allowed = choice => !allowedTenantIds || allowedTenantIds.has(choice.value);

    function positionPopup() {
      if (popup.hidden) return;
      const bounds = boundary?.getBoundingClientRect();
      const anchor = field.getBoundingClientRect();
      const top = Math.max(0,bounds?.top ?? 0);
      const bottom = Math.min(window.innerHeight,bounds?.bottom ?? window.innerHeight);
      if (anchor.bottom<=top || anchor.top>=bottom) return setOpen(false);
      const below = bottom-anchor.bottom-4;
      const above = anchor.top-top-4;
      const targetHeight = Math.min(picker.scrollHeight+summary.offsetHeight+2,250);
      const up = below<targetHeight && above>below;
      popup.classList.toggle('opens-up',up);
      popup.style.maxHeight = Math.max(0,Math.min(250,up ? above : below))+'px';
    }

    function setOpen(open) {
      popup.hidden = !open;
      trigger.setAttribute('aria-expanded',String(open));
      if (open) positionPopup();
    }

    field.addEventListener('click',event=>{
      const remove = event.target.closest('[data-scope-remove]');
      if (!remove) {
        trigger.focus({preventScroll:true});
        setOpen(popup.hidden);
        return;
      }
      const chosen = selectedTenants(controls);
      const index = chosen.findIndex(input=>input.value===remove.dataset.scopeRemove);
      if (index<0) return;
      chosen[index].checked = false;
      update();
      const remaining = value.querySelectorAll('[data-scope-remove]');
      (remaining[index] || remaining[index-1] || trigger).focus({preventScroll:true});
    });
    trigger.addEventListener('keydown',event=>{
      if (event.key!=='ArrowDown') return;
      event.preventDefault();
      setOpen(true);
      groups[0]?.check.focus();
    });
    controls.addEventListener('keydown',event=>{
      if (event.key!=='Escape' || popup.hidden) return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      trigger.focus();
    });
    controls.addEventListener('focusout',event=>{
      if (event.relatedTarget && !controls.contains(event.relatedTarget)) setOpen(false);
    });
    dialog?.addEventListener('pointerdown',event=>{
      if (!controls.contains(event.target)) setOpen(false);
    });
    boundary?.addEventListener('scroll',positionPopup,{passive:true});
    groups[0]?.check.addEventListener('invalid',()=>{
      field.scrollIntoView({block:'nearest'});
      setOpen(true);
    });

    function update() {
      for (const {check,choices,count} of groups) {
        const eligible = choices.filter(allowed);
        for (const input of choices) {
          input.disabled=!allowed(input) && !input.checked;
          if (!allowed(input)) input.closest('label').title='不在所选百炼接口的适用范围内';
          else input.closest('label').removeAttribute('title');
        }
        const picked = eligible.filter(input=>input.checked).length;
        check.disabled=!eligible.length;
        check.checked = eligible.length>0 && picked===eligible.length;
        check.indeterminate = picked>0 && picked<eligible.length;
        count.textContent = picked+' / '+eligible.length;
      }
      const {brandIds,tenantIds} = read(form);
      for (const {check} of groups) check.setCustomValidity(tenantIds.length || check.disabled ? '' : '请选择至少一个适用租户。');
      summary.textContent = tenantIds.length ? `已选 ${brandIds.length} 个品牌、${tenantIds.length} 个租户` : '请选择适用租户';
      value.innerHTML = selectedTenants(controls).map(input=>`<span class="integration-scope-tag" data-scope-tag>
        <span>${e(input.dataset.scopeTenantName)}</span>
        <button type="button" data-scope-remove="${e(input.value)}" aria-label="移除${e(input.dataset.scopeTenantName)}">×</button>
      </span>`).join('') || '<span class="integration-scope-placeholder">请选择适用租户</span>';
      positionPopup();
    }

    for (const {check,choices,toggle,body} of groups) {
      check.addEventListener('change',()=>{
        for (const choice of choices.filter(allowed)) choice.checked=check.checked;
      });
      toggle.addEventListener('click',()=>{
        body.hidden = !body.hidden;
        toggle.setAttribute('aria-expanded',String(!body.hidden));
        positionPopup();
      });
    }
    controls.addEventListener('change',update);
    update();
    return {restrictTo(ids){allowedTenantIds=ids===null ? null : new Set(ids);update();}};
  }

  function labels(context,tenantId,record) {
    if (!record) return {brandNames:'—',tenantNames:'—'};
    const options = catalog.applicableOptions(context);
    const {brandIds,tenantIds} = selection(tenantId,record,options);
    const brands = options.brands.filter(row=>brandIds.includes(row.id)).map(row=>row.name);
    const tenants = options.tenants.filter(row=>tenantIds.includes(row.id));
    return {brandNames:brands.join('、') || '—',tenantNames:tenants.map(row=>row.name).join('、') || '—'};
  }

  window.DIntegrationScopeUI = Object.freeze({fields,bind,read,labels});
})();
