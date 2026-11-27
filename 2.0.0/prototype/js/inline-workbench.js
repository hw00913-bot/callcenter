(function () {
  "use strict";

  const selector = "[data-review21-inline-workbench]";
  const emptyMarker = "data-review21-native-empty";

  function setNativeListHidden(host,hidden) {
    for (let node = host.nextElementSibling; node; node = node.nextElementSibling) {
      node.toggleAttribute(emptyMarker,hidden);
    }
  }

  function removeHost(host) {
    if (!host) return;
    window.DReview21Workbench?.stopWecomReminderCheck?.(host);
    setNativeListHidden(host,false);
    host.remove();
  }

  function unmount(frame) {
    let doc;
    try { doc = frame?.contentDocument; } catch (_) { return; }
    removeHost(doc?.querySelector(selector));
  }

  function mount({id, frame, context, mountSection}) {
    let doc;
    try { doc = frame?.contentDocument; } catch (_) { return; }
    if (!doc) return;
    const existing = doc.querySelector(selector);
    const session = window.DSession;
    const current = session?.context();
    const native = frame.contentWindow?.DNativeContext?.context;
    const sameScope = current?.account?.id === native?.account?.id && current?.scope?.id === native?.scope?.id &&
      current?.account?.id === context?.account?.id && current?.scope?.id === context?.scope?.id;
    const outbound = doc.getElementById("seat-tab-outbound");
    const canMount = id === "PAGE-2202" && !frame.hidden && current?.scope?.kind === "tenant" && sameScope &&
      session.allowed(id, current) && window.DReview21.canUseWorkbench(current) &&
      (!outbound || outbound.getAttribute("aria-selected") === "true");
    const card = canMount && doc.querySelector('#native-seat-workspace #seat-workspace-panel .workbench-domain-block[aria-label="客户联络"] article.panel-card');
    const header = card && card.querySelector(":scope > .panel-header");
    if (!header || typeof mountSection !== "function") {
      removeHost(existing);
      return;
    }
    if (existing?.parentElement === card) {
      mountSection("workbench", existing);
      setNativeListHidden(existing,existing.hasChildNodes());
      return;
    }
    removeHost(existing);
    const host = doc.createElement("div");
    host.setAttribute("data-review21-inline-workbench", "");
    header.insertAdjacentElement("afterend", host);
    mountSection("workbench", host);
    setNativeListHidden(host,host.hasChildNodes());
  }

  window.DReview21InlineWorkbench = {mount, unmount};
})();
