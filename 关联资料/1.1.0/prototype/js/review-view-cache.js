/** Give current review views distinct URLs when the existing navigation embeds them. */
(function () {
  'use strict';
  const revision = '20261011-frozen1';
  const currentPaths = new Set([
    'flowcharts/business-process.html',
    'flowcharts/sequence-interaction.html',
    'related-systems/index.html'
  ].map(path => new URL(path, document.baseURI).pathname));
  const observedFrames = new WeakSet();

  function updateFrames() {
    document.querySelectorAll('iframe').forEach(frame => {
      if (!observedFrames.has(frame)) {
        observedFrames.add(frame);
        frame.addEventListener('load', updateFrames);
      }
      const current = frame.dataset.currentUrl || frame.getAttribute('src');
      if (!current) return;
      const url = new URL(current, document.baseURI);
      if (url.origin !== location.origin || !currentPaths.has(url.pathname)) return;
      if (url.searchParams.get('review_revision') === revision) return;
      url.searchParams.set('review_revision', revision);
      if (frame.dataset.currentUrl) {
        frame.dataset.currentUrl = url.href;
        if (window.location.protocol === 'file:') frame.src = url.href;
        else frame.contentWindow.location.replace(url.href);
      } else {
        frame.src = url.href;
      }
    });
  }

  const observer = new MutationObserver(updateFrames);
  observer.observe(document.documentElement, {
    childList: true, subtree: true, attributes: true,
    attributeFilter: ['src', 'data-current-url']
  });
  updateFrames();
}());
