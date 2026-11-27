(function () {
  "use strict";

  const documents = new WeakMap();
  const toolbarSelector = '[data-review21-cloud="toolbar"]';
  const seatActionSelector = '[data-review21-cloud="seat"]';
  const routes = {
    "PAGE-2210": ["agent-maintenance"]
  };

  function scopeKey(context) {
    return [context?.account?.id, context?.scope?.id].join("|");
  }

  function access(options, doc) {
    const session = window.DSession;
    const context = session?.context();
    const nativeWindow = doc.defaultView;
    if (!context || !routes[options.id] || !options.frame.isConnected || options.frame.hidden ||
        window.DApp?.currentPage() !== options.id || scopeKey(context) !== scopeKey(options.context) ||
        scopeKey(context) !== scopeKey(nativeWindow?.DNativeContext?.context) ||
        context.scope.kind !== "tenant" || !context.scope.tenant?.id ||
        !session.allowed(options.id, context) || !window.DRolePermissions?.moduleEnabled("cloud", context)) return null;

    const role = session.roleKey(context);
    const admin = role === "super" || role.endsWith("_admin");
    const operator = role.endsWith("_ops");
    if (!admin && !operator) return null;

    const position = nativeWindow.RouteRuntime?.snapshot();
    if (position?.key && !routes[options.id].includes(position.key)) return null;
    return {context, admin, operator, session, position};
  }

  function actions(id, access) {
    switch (id) {
      case "PAGE-2210":
        return access.admin ? [["接收量", "seats"], ["排班", "schedule"]] : [];
      default:
        return [];
    }
  }

  function open(options, doc, key, hint) {
    const current = access(options, doc);
    if (!current || !actions(options.id, current).some(([, allowed]) => allowed === key)) return;
    options.openSection(key, hint || {});
  }

  function ensureToolbar(root, doc, options, controls) {
    const target = root.querySelector(".page-title-row:not([data-review21-cloud]) .page-actions, .d-page-heading .page-actions");
    const signature = options.id + "|" + scopeKey(options.context) + "|" + controls.map(([, key]) => key).join(",");
    let toolbar = root.querySelector(toolbarSelector);
    if (toolbar?.dataset.signature !== signature) {
      toolbar?.remove();
      toolbar = doc.createElement("div");
      toolbar.dataset.review21Cloud = "toolbar";
      toolbar.dataset.signature = signature;
      toolbar.className = target ? "page-actions" : "page-title-row";
      const buttons = target ? toolbar : doc.createElement("div");
      if (!target) {
        buttons.className = "page-actions";
        toolbar.appendChild(buttons);
      }
      for (const [label, key] of controls) {
        const button = doc.createElement("button");
        button.type = "button";
        button.className = "btn";
        button.textContent = label;
        button.dataset.section = key;
        buttons.appendChild(button);
      }
      if (target) target.appendChild(toolbar);
      else root.prepend(toolbar);
    } else if (target && toolbar.parentElement !== target && !toolbar.contains(target)) {
      toolbar.remove();
      return ensureToolbar(root, doc, options, controls);
    }
    toolbar.onclick = event => {
      const button = event.target.closest("button[data-section]");
      if (button) open(options, doc, button.dataset.section);
    };
  }

  function seatForAction(host, context, nativeWindow) {
    const trigger = host.querySelector('button[onclick*=".openAgent("]');
    const match = /^window\.Pages\['agent-center'\]\.openAgent\('([^']+)'\)$/.exec(trigger?.getAttribute("onclick") || "");
    const tenant = context.scope.tenant;
    if (!match || !tenant.enterpriseId) return null;
    const candidates = (nativeWindow.CloudCallData?.agents || []).filter(row =>
      row.contactCenterIdentityId === match[1] && row.tenantId === tenant.id &&
      String(row.enterpriseId) === String(tenant.enterpriseId) && row.lifecycleStatus !== "已删除" &&
      nativeWindow.AppState?.authorizeObject("", row));
    const seat = candidates.length === 1 ? candidates[0] : null;
    return seat && typeof seat.agentRecordId === "string" && seat.agentRecordId ? seat : null;
  }

  function ensureSeatActions(root, doc, options, current) {
    for (const host of root.querySelectorAll(".table-actions")) {
      const seat = seatForAction(host, current.context, doc.defaultView);
      let button = host.querySelector(seatActionSelector);
      if (!seat) {
        button?.remove();
        continue;
      }
      if (!button) {
        button = doc.createElement("button");
        button.type = "button";
        button.dataset.review21Cloud = "seat";
        button.textContent = "接收量";
        host.appendChild(button);
      }
      button.onclick = () => {
        const authorized = access(options, doc);
        const confirmed = authorized?.admin && seatForAction(host, authorized.context, doc.defaultView);
        if (confirmed?.agentRecordId === seat.agentRecordId) open(options, doc, "seats", {seatId: confirmed.agentRecordId});
      };
    }
  }

  function reconcile(doc, options) {
    const root = doc.getElementById("page-content");
    if (!root) return;
    const current = access(options, doc);
    const controls = current ? actions(options.id, current) : [];
    if (!controls.length || root.querySelector(":scope > .page-loading")) {
      root.querySelectorAll(`${toolbarSelector}, ${seatActionSelector}`).forEach(node => node.remove());
      return;
    }
    ensureToolbar(root, doc, options, controls);
    if (options.id === "PAGE-2210" && current.admin) {
      if (current.session.roleKey(current.context).endsWith("_admin")) {
        const description = root.querySelector(".agent-page .page-title-row p");
        const text = "当前租户 · " + current.context.scope.tenant.name + "。在此维护坐席、分机、启停、接收量和排班。关联登录账号请前往账号管理。";
        if (description && description.textContent !== text) description.textContent = text;
      }
      ensureSeatActions(root, doc, options, current);
    }
    else root.querySelectorAll(seatActionSelector).forEach(node => node.remove());
  }

  function mount(options) {
    if (!options?.frame || typeof options.openSection !== "function") return;
    let doc;
    try { doc = options.frame.contentDocument; } catch { return; }
    if (!doc?.documentElement) return;
    let entry = documents.get(doc);
    if (!entry) {
      entry = {options, queued: false};
      const observer = new MutationObserver(() => {
        if (entry.queued) return;
        entry.queued = true;
        queueMicrotask(() => {
          entry.queued = false;
          if (entry.options.frame.isConnected) reconcile(doc, entry.options);
          else observer.disconnect();
        });
      });
      observer.observe(doc.documentElement, {subtree: true, childList: true});
      documents.set(doc, entry);
    }
    entry.options = options;
    reconcile(doc, options);
  }

  window.DReview21Cloud = {mount};
})();
