(() => {
  'use strict';

  const catalog = window.DSkynetConfig;
  const e = DUI.esc;
  const steps = ['来件清洗','培育策略'];
  const kinds = ['rules','nurtureTemplates','deliveryTemplates'];
  const settingsLabel = (kind) => ['分配规则','培育模板','下发模板'][kinds.indexOf(kind)];
  const bindingAction = '送入培育模板';
  const staleMessage = '当前租户资料已在其他页面更新，请刷新后重新编辑分配规则。';
  const isDraft = id => id?.startsWith('draft:');
  const configurationStatus = item => catalog.configurationStatus(item);
  const statusLabel = item => ({enabled:'启用',disabled:'停用',draft:'草稿'})[configurationStatus(item)];
  const option = (value,label,selected) =>
    '<option value="' + e(value) + '"' + (value === selected ? ' selected' : '') + '>' + e(label) + '</option>';
  const numberVersion = item => item?.version ? 'v' + item.version : '';
  const templateLabel = item => item?.name || '未命名模板';
  const allowsNurture = cleaning => [cleaning.onMatch,cleaning.onMismatch].includes('sameNumber');

  function current(view, kind, id) {
    if (!id) return null;
    const item = view.drafts[kind].get(id) || catalog.current(view.book,kind,id);
    return item?.categoryId === view.rule.categoryId ? item : null;
  }

  function editingTemplate(view, kind, id) {
    const item = current(view,kind,id);
    if (!item) return null;
    if (!view.drafts[kind].has(id)) {
      const draft = kind === 'nurtureTemplates' ? catalog.nurtureTemplateForEditing(item) : structuredClone(item);
      view.drafts[kind].set(id,draft);
    }
    return view.drafts[kind].get(id);
  }

  function relationship(view) {
    const {cleaning} = view.rule;
    const enters = allowsNurture(cleaning);
    const nurture = enters ? current(view,'nurtureTemplates',cleaning.nurtureTemplateId) : null;
    const delivery = current(view,'deliveryTemplates',nurture?.deliveryTemplateId);
    return {enters,nurture,delivery};
  }

  function linkedNurtureIds(rule) {
    if (rule.cleaning) return allowsNurture(rule.cleaning) ? [rule.cleaning.nurtureTemplateId] : [];
    return (rule.nodes || []).flatMap(node => Object.values(node.branches))
      .filter(branch => branch.action === bindingAction).map(branch => branch.nurtureTemplateId);
  }

  function workingBook(view) {
    const copy = {...view.book};
    for (const kind of kinds) {
      const drafts = view.drafts[kind];
      copy[kind] = [...view.book[kind].filter(item => !item.isCurrent || !drafts.has(item.id)),
        ...[...drafts.values()].map(item => ({...item,isCurrent:true}))];
    }
    return copy;
  }

  function isChanged(view, kind, draft) {
    const published = catalog.current(view.book,kind,draft.id);
    if (kind === 'rules' && published?.requiresReview) return true;
    if (published === draft) return false;
    let comparable = published;
    if (published && kind === 'rules') comparable = catalog.ruleForEditing(published);
    if (published && kind === 'nurtureTemplates') comparable = catalog.nurtureTemplateForEditing(published);
    return JSON.stringify(comparable) !== JSON.stringify(draft);
  }

  function changedDrafts(view, asDraft = false) {
    const nurtureIds = new Set(linkedNurtureIds(view.rule));
    const deliveryIds = new Set([...nurtureIds].map(id => current(view,'nurtureTemplates',id)?.deliveryTemplateId));
    const needsSaving = (kind,item) => item && (isChanged(view,kind,item) ||
      !asDraft && configurationStatus(item) === 'draft');
    return {
      rules:needsSaving('rules',view.rule) || asDraft && configurationStatus(view.rule) !== 'draft' ? [view.rule] : [],
      nurtureTemplates:[...nurtureIds].map(id => current(view,'nurtureTemplates',id))
        .filter(item => needsSaving('nurtureTemplates',item)),
      deliveryTemplates:[...deliveryIds].map(id => current(view,'deliveryTemplates',id))
        .filter(item => needsSaving('deliveryTemplates',item))
    };
  }

  function dirty(view) {
    return JSON.stringify(view.rule) !== view.originalRule ||
      kinds.slice(1).some(kind => [...view.drafts[kind].values()].some(item => isChanged(view,kind,item)));
  }

  function versionBadge(view, kind, item) {
    if (!item) return '';
    const version = numberVersion(item);
    const edited = isChanged(view,kind,item);
    return '<span class="sf-badge">' + e((edited ? (version ? version + ' · 有修改' : '未保存') : version) +
      (configurationStatus(item) === 'draft' ? ' · 草稿' : configurationStatus(item) === 'disabled' ? ' · 停用' : '')) + '</span>';
  }

  function templateText(view, kind, item) {
    return item ? '<span class="sf-template">' + e(templateLabel(item)) + versionBadge(view,kind,item) + '</span>' :
      '<span class="sf-unset">待选择</span>';
  }

  function overview(view) {
    const {enters,nurture,delivery} = relationship(view);
    const {cleaning} = view.rule;
    const stop = '<span class="sf-muted">流入规则结束本次处理</span>';
    const windowLabel = catalog.sameNumberWindows.find(window => Number(window.value) === cleaning.sameNumber.windowMinutes)?.label;
    return '<div class="sf-chain-card"><span class="sf-chain-label">来件清洗</span>' +
      templateText(view,'rules',view.rule) + '<small>' + e(windowLabel ? '在途过滤 → 同号过滤 · ' + windowLabel : '') +
      '</small></div><span class="sf-chain-arrow" aria-hidden="true">→</span>' +
      '<div class="sf-chain-card"><span class="sf-chain-label">培育策略</span>' +
      (enters ? templateText(view,'nurtureTemplates',nurture) : stop) +
      (nurture ? '<small>选中策略后只编辑这一条。</small>' : '') + '</div>' +
      '<span class="sf-chain-arrow" aria-hidden="true">→</span><div class="sf-chain-card"><span class="sf-chain-label">本轮结束后</span>' +
      (enters ? '<small>先判下发，未命中再判后续培育</small>' : stop) +
      (nurture ? '<small>共享下发模板：' + templateText(view,'deliveryTemplates',delivery) +
        (view.step === 1 ? ' <button type="button" class="btn-link" data-flow-edit-delivery>查看配置</button>' : '') +
        '</small>' : '') + '</div>';
  }

  function referenceSummary(view,kind,item) {
    if (!item) return '';
    const book = workingBook(view);
    if (kind === 'nurtureTemplates') {
      const uses = catalog.list(book,'rules').filter(rule => rule.categoryId === view.rule.categoryId &&
        linkedNurtureIds(rule).includes(item.id));
      return uses.length ? '引用它的分配规则 · ' + uses.map(rule => rule.name).join('、') : '';
    }
    const uses = catalog.list(book,'nurtureTemplates').filter(template =>
      template.categoryId === view.rule.categoryId && template.deliveryTemplateId === item.id);
    return uses.length ? '引用它的培育模板 · ' + uses.map(templateLabel).join('、') : '';
  }

  function editorSlot(kind,label,open = false) {
    return '<details class="sf-detail"' + (open ? ' open' : '') + '><summary>' + e(label) +
      '</summary><div class="sc-modal sf-editor" data-flow-editor="' + e(kind) + '"></div></details>';
  }

  function chooseOptions(view,kind,item) {
    const templates = catalog.activeList(workingBook(view),kind).filter(template => template.categoryId === view.rule.categoryId);
    const resumable = new Map([...view.resumeTemplates[kind]].map(id => [id,current(view,kind,id)]));
    for (const draft of view.drafts[kind].values()) {
      if (isDraft(draft.id)) resumable.set(draft.id,draft);
    }
    for (const draft of resumable.values()) {
      if (draft && configurationStatus(draft) !== 'disabled' && !templates.some(template => template.id === draft.id)) templates.push(draft);
    }
    const selectedId = item?.id || '';
    const placeholder = templates.length ? '请选择' + settingsLabel(kind) : '当前分类暂无可选模板';
    const unavailable = item && configurationStatus(item) === 'disabled' ?
      '<option value="' + e(item.id) + '" selected disabled>' + e(templateLabel(item)) + '（已停用）</option>' : '';
    const first = option('',placeholder,selectedId) + unavailable;
    const renderOption = template => option(template.id,templateLabel(template) +
      (isDraft(template.id) ? '（未保存）' : ' · ' + numberVersion(template) +
        (configurationStatus(template) === 'draft' ? '（草稿，保存时校验并启用）' : '')),selectedId);
    if (kind !== 'nurtureTemplates') return first + templates.map(renderOption).join('');
    const saved = templates.filter(template => !isDraft(template.id));
    const drafts = templates.filter(template => isDraft(template.id));
    return first + (saved.length ? '<optgroup label="已保存模板">' + saved.map(renderOption).join('') + '</optgroup>' : '') +
      (drafts.length ? '<optgroup label="本次草稿">' + drafts.map(renderOption).join('') + '</optgroup>' : '');
  }

  function currentNurture(view,item) {
    if (!item) return '';
    return '<span class="sf-muted">' + (isDraft(item.id) || configurationStatus(item) === 'draft' ? '当前草稿' : '当前引用') +
      '</span>' + templateText(view,'nurtureTemplates',item);
  }

  function templatePicker(view,kind,item,selectLabel,createLabel) {
    return '<div class="sf-pick"><label class="sc-field"><span>' + e(selectLabel) + '</span><select data-flow-choose="' +
      e(kind) + '">' + chooseOptions(view,kind,item) + '</select></label><button type="button" class="btn" data-flow-create="' +
      e(kind) + '">' + e(createLabel) + '</button></div>';
  }

  function nurtureStep(view) {
    const {enters,nurture} = relationship(view);
    if (!enters) {
      return '<p class="sf-notice">当前两种流入结果均结束本次处理。继续配置培育前，请在来件清洗设置至少一种结果进入在途任务过滤。</p>';
    }
    const kind = 'nurtureTemplates';
    const intro = '<div class="sf-policy-intro" data-flow-policy-intro>' + (nurture && !nurture.strategyTree ?
        '<p>当前模板使用旧版平铺规则。可在编辑区转为树形后，按各父策略配置自己的后续规则。</p>' :
        '<details class="sf-policy-help"><summary>查看判定顺序与兜底说明</summary>' +
        '<p>每轮培育结束后，先按培育模板关联的下发模板判断，再检查当前策略的后续规则。</p>' +
        '<p class="sf-muted">同组普通策略均明确未命中时，执行该组已配置的兜底。完成轮次后无后续去向时，任务结束。</p></details>') + '</div>';
    return intro + templatePicker(view,kind,nurture,'引用已有培育模板','创建培育模板') +
      '<p class="sf-current-nurture" data-flow-current-nurture>' + currentNurture(view,nurture) + '</p>' +
      '<p class="sf-reference" data-flow-references="' + kind + '">' + e(referenceSummary(view,kind,nurture)) + '</p>' +
      (nurture ? editorSlot(kind,'查看或编辑培育规则',true) : '');
  }

  function saveSummary(view) {
    const changes = changedDrafts(view);
    const omitted = kinds.flatMap(kind => [...view.drafts[kind].values()].filter(item =>
      isChanged(view,kind,item) && !changes[kind].includes(item)).map(templateLabel));
    const prepared = prepare(view,changes);
    const fixLinks = {
      rules:'<button type="button" class="btn-link" data-flow-step="0">返回来件清洗核对</button>',
      nurtureTemplates:'<button type="button" class="btn-link" data-flow-edit-template>核对培育模板</button>',
      deliveryTemplates:'<button type="button" class="btn-link" data-flow-edit-delivery>核对下发模板</button>'
    };
    let summary = '<p class="sf-muted">当前配置没有修改。</p>';
    if (prepared.error) {
      summary = '<p class="sf-error">' + e(prepared.error) + '</p>' +
        (fixLinks[prepared.kind] || '');
    } else if (prepared.saved.length) {
      summary = '<ul>' + prepared.saved.map(({kind,value}) => '<li>' + e(settingsLabel(kind)) + ' · ' +
        e(value.name) + ' <span class="sf-badge">' + e(numberVersion(value)) + '</span></li>').join('') +
        '</ul><p class="sf-muted">保存后，新任务按匹配结果使用当前版本。在途任务沿用原轮次和已绑定版本。</p>';
    }
    return '<section class="sf-save-preview" data-flow-save-preview><h4>本次将保存</h4>' + summary +
      (omitted.length ? '<p class="sf-notice">以下草稿当前未被分支引用，保存时会跳过。' +
        e(omitted.join('、')) + '。</p>' : '') + '</section>';
  }

  function mountFlowFields(view,host) {
    const kind = host.dataset.flowEditor;
    const draft = kind === 'rules' ? view.rule : editingTemplate(view,kind,relationship(view).nurture?.id);
    if (!draft) return;
    view.mountFields({host,kind,draft,book:workingBook(view),context:view.context,state:view.state,afterTask:true,onChange:() => {
      report(view,'');
      refreshOverview(view);
      const summary = view.body.querySelector('[data-flow-save-preview]');
      if (summary) summary.outerHTML = saveSummary(view);
    }});
  }

  function refreshOverview(view) {
    view.body.querySelector('[data-flow-overview]').innerHTML = overview(view);
    const {nurture,delivery} = relationship(view);
    const current = view.body.querySelector('[data-flow-current-nurture]');
    if (current) current.innerHTML = currentNurture(view,nurture);
    const templates = {nurtureTemplates:nurture,deliveryTemplates:delivery};
    for (const ref of view.body.querySelectorAll('[data-flow-references]')) {
      const kind = ref.dataset.flowReferences;
      ref.textContent = referenceSummary(view,kind,templates[kind]);
    }
    for (const picker of view.body.querySelectorAll('[data-flow-choose]')) {
      const kind = picker.dataset.flowChoose;
      picker.innerHTML = chooseOptions(view,kind,templates[kind]);
    }
  }

  function stepContent(view) {
    if (view.step === 0) return '<div class="sc-modal sf-cleaning-editor" data-flow-editor="rules"></div>';
    return nurtureStep(view) + saveSummary(view);
  }

  function render(view) {
    const step = view.step;
    const notice = view.upgradingLegacy ? '历史节点可在列表中查看。请核对新版流入规则和培育模板，保存后会生成新版本。' :
      view.rule.requiresReview ? '这份副本已停用。请核对新版流入规则和培育模板，保存后再到列表启用。' : '';
    view.body.innerHTML = '<ol class="sf-steps" aria-label="配置步骤">' + steps.map((label,index) =>
      '<li><button type="button" data-flow-step="' + index + '"' + (index === step ? ' aria-current="step"' : '') +
      '><span>' + (index + 1) + '</span>' + e(label) + '</button></li>').join('') +
      '</ol><p class="sf-context" data-flow-business-type><span>二级分类</span><strong>' + e(view.businessTypeLabel) +
      '</strong>' + (isDraft(view.rule.id) ? '' : '<span>分配规则 ID</span><code>' + e(view.rule.id) + '</code>') +
      '</p><p class="sf-muted" data-flow-config-status>当前状态：' + (view.newRule ? '未保存' : e(statusLabel(view.rule))) +
      '。保存草稿可保留未完成的配置，草稿不用于新业务处理。</p>' +
      (notice ? '<p class="sf-notice" data-flow-upgrade-notice>' + e(notice) + '</p>' : '') +
      '<section class="sf-chain" aria-label="当前配置引用关系" data-flow-overview></section>' +
      '<section class="sf-step-content"><h3 class="sf-step-title" tabindex="-1">' + e(steps[step]) + '</h3>' +
      stepContent(view) + '</section>';
    refreshOverview(view);
    view.body.querySelectorAll('[data-flow-editor]').forEach(host => mountFlowFields(view,host));
    view.previousButton.hidden = step === 0;
    view.nextButton.hidden = step === steps.length - 1;
    view.saveButton.hidden = step !== steps.length - 1;
  }

  function active(view) {
    return view.modal.element.isConnected && view.isActive() && catalog.canManage(view.context);
  }

  function setStep(view,index) {
    if (!active(view)) return;
    view.step = Math.max(0,Math.min(steps.length - 1,index));
    report(view,'');
    render(view);
    view.body.querySelector('.sf-step-title').focus();
  }

  function report(view,message) {
    view.feedback.textContent = message;
  }

  function prepare(view,changes = changedDrafts(view), asDraft = false) {
    const result = catalog.prepareFlow(view.state,view.context,changes,{requireDeliveryRouting:true,asDraft});
    if (!result.error) return result;
    const draft = result.kind && view.drafts[result.kind]?.get(result.id);
    const label = draft ? settingsLabel(result.kind) + '「' + (draft.name || '未命名') + '」 · ' : '';
    return {...result,error:label + result.error};
  }

  function linkTemplate(view,kind,id) {
    const {enters,nurture} = relationship(view);
    const selected = id && current(view,kind,id);
    if (!enters || id && (!selected || configurationStatus(selected) === 'disabled' ||
        configurationStatus(selected) === 'draft' && !view.resumeTemplates[kind].has(id) && !isDraft(id))) return;
    if (kind === 'nurtureTemplates') view.rule.cleaning.nurtureTemplateId = id;
    if (kind === 'deliveryTemplates' && nurture) editingTemplate(view,'nurtureTemplates',nurture.id).deliveryTemplateId = id;
    report(view,'');
    render(view);
  }

  function openDeliverySettings(view,trigger) {
    const {nurture} = relationship(view);
    if (!nurture) return;
    const kind = 'deliveryTemplates';
    const contextLabel = trigger.dataset.flowDeliveryContext;
    const groupId = trigger.closest('[data-config-strategy-group]')?.dataset.configStrategyGroup;
    const drafts = new Map();
    let selectedId = nurture.deliveryTemplateId || '';
    const title = '配置下发模板' + (contextLabel ? ' · ' + contextLabel : '');
    const modal = DUI.dialog(title,'<div class="sc-modal sf-modal" data-flow-delivery-dialog></div>',[
      {label:'取消',run:close => close()},
      {label:'暂存草稿',run:() => apply(undefined,true)},
      {label:'应用配置',primary:true,run:() => apply()}
    ],{stack:true,dismissible:true});
    modal.buttons[1].dataset.flowDeliverySaveDraft = '';
    modal.element.querySelector('.d-dialog').classList.add('skynet-config','skynet-config-popup');
    view.containDialogFocus(modal);
    const host = modal.element.querySelector('[data-flow-delivery-dialog]');
    const feedback = document.createElement('p');
    feedback.className = 'sf-error';
    feedback.setAttribute('role','alert');
    modal.element.querySelector('footer').prepend(feedback);

    function apply(newDraft, asDraft = false) {
      if (!active(view) || relationship(view).nurture?.id !== nurture.id) return modal.close();
      if (!DReview21.isLatest(view.state)) {
        feedback.textContent = staleMessage;
        return;
      }
      const id = newDraft?.id || selectedId;
      const draft = newDraft || drafts.get(id);
      const published = current(view,kind,id);
      if ((draft || published) && configurationStatus(draft || published) === 'disabled') {
        feedback.textContent = '请改选已启用的下发模板。';
        return;
      }
      if (!draft && !published) {
        feedback.textContent = '请选择或新建下发模板。';
        return;
      }
      if (draft && JSON.stringify(draft) !== JSON.stringify(published)) {
        const duplicate = catalog.list(workingBook(view),kind).some(item =>
          item.id !== id && item.categoryId === draft.categoryId && item.name === draft.name.trim());
        if (duplicate) {
          feedback.textContent = '当前分类已有同名模板。';
          return;
        }
        const prepared = catalog.prepareFlow(view.state,view.context,{deliveryTemplates:[draft]},
          {requireDeliveryRouting:true,asDraft});
        if (prepared.error) {
          feedback.textContent = prepared.error;
          return;
        }
        view.drafts[kind].set(id,draft);
      }
      modal.close();
      linkTemplate(view,kind,id);
      const group = groupId && view.body.querySelector('[data-config-strategy-group="' + CSS.escape(groupId) + '"]');
      (group?.querySelector(':scope > [data-config-round-delivery] [data-flow-edit-delivery]') ||
        view.body.querySelector('[data-flow-overview] [data-flow-edit-delivery]'))?.focus({preventScroll:true});
    }

    function renderSettings() {
      const selected = current(view,kind,selectedId);
      host.innerHTML = '<p class="sf-muted">本培育模板的各轮共用此下发模板。</p>' +
        templatePicker(view,kind,selected,'引用已有下发模板','新建下发模板') +
        (selected ? editorSlot(kind,'查看或编辑下发模板') : '');
      const picker = host.querySelector('[data-flow-choose]');
      picker.onchange = () => {
        selectedId = picker.value;
        feedback.textContent = '';
        renderSettings();
      };
      host.querySelector('[data-flow-create]').onclick = () => newTemplate(view,kind,apply);
      const editor = host.querySelector('[data-flow-editor]');
      if (editor) {
        const draft = drafts.get(selectedId) || structuredClone(selected);
        drafts.set(selectedId,draft);
        view.mountFields({host:editor,kind,draft,book:workingBook(view),context:view.context,state:view.state,
          onChange:() => {feedback.textContent = '';}});
      }
      picker.focus({preventScroll:true});
    }
    renderSettings();
  }

  function newTemplate(view,kind,onCreated) {
    const isDelivery = kind === 'deliveryTemplates';
    const id = 'draft:' + kind + ':' + (view.sequence + 1);
    const categoryId = view.rule.categoryId;
    const draft = {...view.initialDraft(kind,categoryId),categoryId,id};
    const modal = DUI.dialog('新建' + settingsLabel(kind),'<div class="sc-modal"></div>',[
      {label:'取消',run:close => close()},
      ...(isDelivery ? [{label:'暂存草稿',run:() => apply(true)}] : []),
      {label:'引用此模板',primary:true,run:() => apply()}
    ],{stack:true,dismissible:true});
    if (isDelivery) modal.buttons[1].dataset.flowDeliverySaveDraft = '';
    modal.element.querySelector('.d-dialog').classList.add('skynet-config','skynet-config-popup');
    view.containDialogFocus(modal);
    const host = modal.element.querySelector('.sc-modal');
    const feedback = document.createElement('p');
    feedback.className = 'sf-error';
    feedback.setAttribute('role','alert');
    modal.element.querySelector('footer').prepend(feedback);
    function apply(asDraft = false) {
      if (!active(view)) return modal.close();
      if (!DReview21.isLatest(view.state)) {
        feedback.textContent = staleMessage;
        return;
      }
      draft.name = draft.name.trim();
      if (!draft.name || draft.name.length > 60) {
        feedback.textContent = '请输入 1 至 60 字的模板名称。';
        host.querySelector('[name="name"]')?.focus();
        return;
      }
      if (catalog.list(workingBook(view),kind).some(item => item.categoryId === categoryId && item.name === draft.name)) {
        feedback.textContent = '当前分类已有同名模板。';
        return;
      }
      if (isDelivery) {
        const prepared = catalog.prepareFlow(view.state,view.context,{deliveryTemplates:[draft]},
          {requireDeliveryRouting:true,asDraft});
        if (prepared.error) {
          feedback.textContent = prepared.error;
          return;
        }
      }
      view.sequence++;
      modal.close();
      if (onCreated) {
        onCreated(draft,asDraft);
        return;
      }
      view.drafts[kind].set(id,draft);
      linkTemplate(view,kind,id);
      const focus = isDelivery ? '[data-flow-choose="deliveryTemplates"]' : '[data-config-operation="strategy-add"]';
      view.body.querySelector(focus)?.focus();
    }
    if (isDelivery) {
      view.mountFields({host,kind,draft,book:workingBook(view),context:view.context,state:view.state,
        onChange:() => {feedback.textContent = '';}});
    } else {
      host.innerHTML = '<form novalidate><div class="sc-grid"><label class="sc-field"><span>培育模板名称</span>' +
        '<input name="name" maxlength="60"></label><div class="sc-field"><span>二级分类</span><p class="sc-value">' +
        e(view.businessTypeLabel) + '</p></div></div></form>';
      host.querySelector('form').onsubmit = event => {event.preventDefault(); apply();};
      host.querySelector('[name="name"]').oninput = event => {
        draft.name = event.target.value;
        feedback.textContent = '';
      };
    }
    host.querySelector('[name="name"]')?.focus();
  }

  function bind(view) {
    view.body.addEventListener('click',event => {
      if (!active(view)) return;
      const button = event.target.closest('button');
      if (!button) return;
      const {flowStep,flowCreate,flowEditTemplate,flowEditDelivery} = button.dataset;
      if (flowStep !== undefined) setStep(view,Number(flowStep));
      if (flowEditTemplate !== undefined) {
        setStep(view,1);
        const editor = view.body.querySelector('[data-flow-editor="nurtureTemplates"]')?.closest('details');
        if (editor) {
          editor.open = true;
          editor.scrollIntoView({block:'nearest'});
          (editor.querySelector('[data-config-strategy-select][aria-current="true"]') ||
            editor.querySelector('.sc-workspace-template summary, [name="name"]'))?.focus({preventScroll:true});
        }
      }
      if (flowEditDelivery !== undefined) openDeliverySettings(view,button);
      if (flowCreate) newTemplate(view,flowCreate);
    });
    view.body.addEventListener('change', event => {
      if (!active(view)) return;
      const control = event.target;
      const kind = control.dataset.flowChoose;
      if (!kind) return;
      linkTemplate(view,kind,control.value);
      view.body.querySelector('[data-flow-choose="' + kind + '"]')?.focus({preventScroll:true});
    });
  }

  function closeFlow(view) {
    view.modal.close();
    DApp.setDraftGuard(null);
  }

  function cancel(view) {
    if (!active(view) || !dirty(view)) return closeFlow(view);
    const confirm = DUI.dialog('分配规则尚未保存','<p>关闭弹窗会放弃本次修改。</p>',[
      {label:'继续编辑',run:close => close()},
      {label:'放弃修改',run:close => {close();closeFlow(view);}}
    ],{stack:true,dismissible:true});
    view.containDialogFocus(confirm);
  }

  function save(view, asDraft = false) {
    if (!active(view)) return false;
    if (!DReview21.isLatest(view.state)) {
      report(view,staleMessage);
      return false;
    }
    const prepared = prepare(view,changedDrafts(view,asDraft),asDraft);
    if (prepared.error) {
      report(view,prepared.error);
      return false;
    }
    if (!prepared.saved.length) {
      closeFlow(view);
      DUI.toast(asDraft ? '草稿已保存，当前配置没有修改。' : '当前配置没有修改。');
      return true;
    }
    const previous = view.state.skynetConfig;
    view.state.skynetConfig = prepared.book;
    if (!DReview21.save(view.state)) {
      if (previous === undefined) delete view.state.skynetConfig;
      else view.state.skynetConfig = previous;
      report(view,DReview21.saveFailure(view.state,'保存失败，请重试。'));
      return false;
    }
    closeFlow(view);
    view.onSaved({...prepared,ruleId:prepared.idMap[view.rule.id] || view.rule.id,categoryId:view.rule.categoryId});
    DUI.toast(asDraft ? '流程配置已保存为草稿' : configurationStatus(catalog.current(prepared.book,'rules',prepared.idMap[view.rule.id] || view.rule.id)) === 'disabled' ?
      '流程配置已保存，当前为停用状态' : '流程配置已保存并启用');
    return true;
  }

  function open(config) {
    if (!config.rule || !config.isActive() || !catalog.canManage(config.context)) return;
    const book = catalog.read(config.state);
    const rule = catalog.ruleForFlowEditing(config.rule,book);
    const newRule = isDraft(rule.id);
    const businessTypeLabel = catalog.businessType(config.context,rule.categoryId)?.label || rule.categoryName || rule.categoryId;
    const nurtureIds = linkedNurtureIds(rule).filter(Boolean);
    const deliveryIds = nurtureIds.map(id => catalog.current(book,'nurtureTemplates',id)?.deliveryTemplateId).filter(Boolean);
    const view = {...config,rule,book,
      newRule,businessTypeLabel,upgradingLegacy:!config.rule.cleaning,originalRule:JSON.stringify(rule),
      drafts:{rules:new Map([[rule.id,rule]]),nurtureTemplates:new Map(),deliveryTemplates:new Map()},
      resumeTemplates:{nurtureTemplates:new Set(nurtureIds),deliveryTemplates:new Set(deliveryIds)},
      step:0,sequence:0};
    view.modal = DUI.dialog(newRule ? '新建分配规则' : '编辑分配规则','<div class="sf-modal"></div>',[
      {label:'取消',run:() => cancel(view)},
      {label:'上一步',run:() => setStep(view,view.step - 1)},
      {label:'下一步',primary:true,run:() => setStep(view,view.step + 1)},
      {label:'保存草稿',run:() => save(view,true)},
      {label:configurationStatus(rule) === 'draft' ? '保存并启用' : '保存配置',primary:true,run:() => save(view)}
    ],{drawer:true,stack:true,dismissible:true});
    const [cancelButton,previous,next,saveDraftButton,saveButton] = view.modal.buttons;
    cancelButton.dataset.flowCancel = '';
    previous.dataset.flowPrevious = '';
    next.dataset.flowNext = '';
    saveButton.dataset.flowSave = '';
    saveDraftButton.dataset.flowSaveDraft = '';
    Object.assign(view,{previousButton:previous,nextButton:next,saveButton});
    const dialog = view.modal.element.querySelector('.d-dialog');
    dialog.classList.add('skynet-config','skynet-config-popup','skynet-flow-popup');
    view.body = dialog.querySelector('.sf-modal');
    view.feedback = document.createElement('p');
    view.feedback.className = 'sf-error';
    view.feedback.setAttribute('role','alert');
    dialog.querySelector('footer').prepend(view.feedback);
    view.containDialogFocus(view.modal);
    bind(view);
    render(view);
    view.body.querySelector(newRule ? '[data-flow-editor="rules"] [name="name"]' : '[aria-current="step"]')?.focus();
    DApp.setDraftGuard({isDirty:() => active(view) && dirty(view),discard:() => closeFlow(view),save:() => save(view)});
  }

  window.DSkynetConfigFlow = Object.freeze({open});
})();
