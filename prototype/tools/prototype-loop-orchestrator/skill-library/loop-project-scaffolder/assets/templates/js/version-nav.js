(function (global, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (!global || !global.document) return;
  global.ProjectVersionNav = api;
  var script = global.document.currentScript;
  var root = script && script.src ? new URL('../', script.src) : new URL('./', global.location.href);
  function start() { api.mount(global.document, global, root); }
  if (global.document.readyState === 'loading') global.document.addEventListener('DOMContentLoaded', start);
  else start();
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  var SCHEMA = 'project-version-index@1';
  var APPROVED = ['approved', 'confirmed'];
  var INVALID = ['stale', 'invalid', 'invalidated', 'expired', 'superseded', 'obsolete'];
  var STATUS = {
    draft: ['草稿', 'neutral'], proposed: ['待确认提案', 'warning'], accepted: ['已纳入变更', 'info'],
    implemented: ['已有本地演示实现', 'info'], pending: ['待处理', 'warning'], pending_approval: ['待批准', 'warning'],
    awaiting_approval: ['待批准', 'warning'], ready: ['已生成 · 待批准', 'warning'],
    completed: ['已完成制作 · 待批准', 'warning'], complete: ['已完成制作 · 待批准', 'warning'],
    in_progress: ['进行中', 'info'], working: ['工作版', 'info'], active: ['工作版', 'info'],
    approved: ['已批准（清单记录）', 'success'], confirmed: ['已确认（清单记录）', 'success'],
    frozen: ['已冻结', 'info'], stale: ['已失效', 'danger'], invalid: ['校验未通过', 'danger'], invalidated: ['已失效', 'danger'],
    expired: ['已失效', 'danger'], superseded: ['已被替代', 'danger'], obsolete: ['已失效', 'danger'],
    blocked: ['已阻断', 'danger'], blocked_upstream: ['上游未确认 · 已阻断', 'danger'],
    current: ['当前快照（批准状态见阶段）', 'info'], historical_reference: ['历史发布基线', 'info'],
    rejected: ['批准未通过', 'danger'], not_started: ['未建立当前确认', 'neutral']
  };
  var STAGES = {requirement: '04 · 需求确认', requirements: '04 · 需求确认', requirement_analysis: '04 · 需求确认',
    analysis: '04 · 需求确认', '04': '04 · 需求确认', prototype: '02 · 产品原型与运营评审',
    prototype_review: '02 · 产品原型与运营评审', product: '02 · 产品原型与运营评审', '02': '02 · 产品原型与运营评审',
    development: '05 · 开发交付', development_handoff: '05 · 开发交付', delivery: '05 · 开发交付', '05': '05 · 开发交付'};

  function text(value, fallback) {
    if (typeof value !== 'string' && typeof value !== 'number') return fallback || '';
    return String(value).trim().slice(0, 1200)
      .replace(/(?:\/(?:Users|Volumes|home|tmp|var)\/[^\s<>"']+|[A-Za-z]:[\\/][^\s<>"']+)/g, '［本地路径已隐藏］') || fallback || '';
  }
  function array(value) { return Array.isArray(value) ? value : []; }
  function isObject(value) { return Boolean(value && typeof value === 'object' && !Array.isArray(value)); }
  function status(value) { return typeof value === 'string' ? value.toLowerCase().trim() : ''; }

  // Only project-relative public links are accepted. Decoding before validation also
  // catches encoded local paths, controls, protocol delimiters and path traversal.
  function safeHref(raw, indexUrl) {
    if (typeof raw !== 'string' || !raw.trim() || raw.length > 4096) return null;
    var candidate = raw.trim();
    var decoded = candidate;
    try {
      for (var i = 0; i < 4; i++) {
        var next = decodeURIComponent(decoded);
        if (next === decoded) break;
        decoded = next;
      }
    } catch (error) { return null; }
    decoded = decoded.trim();
    if (/%(?:2e|2f|5c|3a|25)/i.test(decoded)) return null;
    if (/^[\\/]|^[a-z][a-z0-9+.-]*\s*:|[\\\u0000-\u001f\u007f]/i.test(decoded)) return null;
    if (/(?:^|\/)(?:Users|Volumes|home|tmp|var)\//i.test(decoded)) return null;
    if (decoded.split(/[?#]/)[0].split('/').indexOf('..') >= 0) return null;
    try {
      var base = new URL(indexUrl);
      if (!/^(?:file|https?):$/.test(base.protocol) || base.username || base.password) return null;
      if (base.protocol === 'file:' && base.hostname) return null;
      var projectRoot = new URL('./', base);
      var target = new URL(decoded, base);
      if (target.protocol !== projectRoot.protocol || target.host !== projectRoot.host || !target.pathname.startsWith(projectRoot.pathname)) return null;
      if (target.username || target.password) return null;
      return target.href;
    } catch (error) { return null; }
  }

  function approvalSummary(stage) {
    var source = stage && stage.approvals;
    var values = Array.isArray(source) ? source : isObject(source) ? Object.keys(source).map(function (key) { return source[key]; }) : [];
    var states = values.map(function (value) { return status(isObject(value) ? value.status : value); });
    var approved = states.filter(function (value) { return APPROVED.indexOf(value) >= 0; }).length;
    return { total: states.length, approved: approved, allApproved: states.length > 0 && approved === states.length,
      rejected: states.some(function (value) { return value === 'rejected'; }),
      label: states.length ? '批准状态：' + approved + '/' + states.length + ' 已批准' : '批准状态：未提供，待批准' };
  }

  function indexLocation(value, root, origin) {
    var target = new URL(value, root);
    if (target.origin !== origin || !/^https?:$/.test(target.protocol) || target.username || target.password) throw new Error('INVALID_INDEX_URL');
    var pathname = decodeURIComponent(target.pathname);
    if (/[\\\u0000-\u001f\u007f]/.test(pathname) || /(?:^|\/)(?:Users|Volumes|home|tmp|var)\//i.test(pathname)) throw new Error('INVALID_INDEX_URL');
    return target;
  }

  // The dedicated classic script is the only runtime data source. Its fixed
  // relative URL determines the public project root for file and web hosting.
  function readProjection(document, window) {
    var tags = document.querySelectorAll('script[data-project-version-index]');
    if (tags.length !== 1) throw new Error('VERSION_SCRIPT_TAG_UNAVAILABLE');
    var tag = tags[0];
    var raw = tag.getAttribute('src');
    if (!/^(?:\.\/|\.\.\/)版本清单\.js$/.test(raw || '')) throw new Error('INVALID_VERSION_SCRIPT_URL');
    var page = new URL(window.location.href);
    var source = new URL(raw, page);
    if (!/^(?:file|https?):$/.test(source.protocol) || source.protocol !== page.protocol || source.host !== page.host ||
        source.username || source.password || source.search || source.hash || (source.protocol === 'file:' && source.hostname)) {
      throw new Error('INVALID_VERSION_SCRIPT_URL');
    }
    if (!tag.src || new URL(tag.src, page).href !== source.href) throw new Error('INVALID_VERSION_SCRIPT_URL');
    var projectRoot = new URL('./', source);
    var envelope = window.ProjectVersionIndex;
    if (!isObject(envelope) || envelope.schema !== 'project-version-script@1' || !isObject(envelope.data) ||
        envelope.data.schema !== SCHEMA || !isObject(envelope.data.project) || !text(envelope.data.project.id) ||
        !/^[a-f0-9]{64}$/.test(envelope.content_id || '') || envelope.content_id !== envelope.data.content_id ||
        envelope.projectRoot !== projectRoot.href) throw new Error('INVALID_VERSION_PROJECTION');
    return { data: envelope.data, indexUrl: new URL('版本清单.json', projectRoot).href };
  }

  function stageStatus(stage) {
    var current = status(stage && stage.status);
    var approval = approvalSummary(stage);
    if (INVALID.indexOf(current) >= 0 || current === 'blocked' || current === 'blocked_upstream' || current === 'rejected') return STATUS[current];
    if (approval.rejected) return STATUS.rejected;
    if (APPROVED.indexOf(current) >= 0) {
      if (!approval.allApproved) return ['待批准（确认记录不完整）', 'warning'];
      if (!text(stage.snapshot_id)) return ['待绑定确认快照', 'warning'];
      return ['已确认', 'success'];
    }
    return STATUS[current] || ['状态未提供', 'neutral'];
  }

  function parseIndex(data, indexUrl) {
    if (!isObject(data) || data.schema !== SCHEMA || !isObject(data.project) || !Array.isArray(data.versions)) throw new Error('INVALID_INDEX');
    var seen = Object.create(null);
    var warnings = 0;
    var versions = data.versions.map(function (version) {
      if (!isObject(version) || typeof version.version_id !== 'string' || !version.version_id.trim() || seen[version.version_id]) throw new Error('INVALID_VERSION_ID');
      seen[version.version_id] = true;
      var publicView = isObject(version.public_view) ? version.public_view : {};
      var changeIds = Object.create(null);
      var changes = array(version.changes).filter(isObject).map(function (change) {
        if (typeof change.change_id !== 'string' || !change.change_id.trim() || changeIds[change.change_id]) throw new Error('INVALID_CHANGE_ID');
        changeIds[change.change_id] = true;
        var publicChanges = isObject(publicView.changes) ? publicView.changes : {};
        var pages = array(change.public_pages || publicChanges[change.change_id]).filter(isObject).map(function (page) {
          var href = safeHref(page.href, indexUrl);
          if (!href) { warnings++; return null; }
          return { label: text(page.label, '查看相关页面'), href: href };
        }).filter(Boolean);
        return { change_id: text(change.change_id), summary: text(change.summary, '未提供业务变更说明'),
          impact_ids: array(change.impact_ids).map(function (id) { return text(id); }).filter(Boolean),
          status: status(change.status), pages: pages };
      });
      var snapshots = array(version.snapshots).filter(isObject).map(function (snapshot) {
        var href = snapshot.read_only === true ? safeHref(snapshot.href, indexUrl) : null;
        if (!href || !text(snapshot.snapshot_id)) { warnings++; return null; }
        var target = new URL(href);
        target.searchParams.set('read_only', '1');
        target.searchParams.set('snapshot_id', text(snapshot.snapshot_id));
        target.searchParams.set('version_id', text(version.version_id));
        return { snapshot_id: text(snapshot.snapshot_id), stage: text(snapshot.stage), status: status(snapshot.status), href: target.href };
      }).filter(Boolean);
      var working = safeHref(version.working_href || publicView.working_href, indexUrl);
      if ((version.working_href || publicView.working_href) && !working) warnings++;
      var openItemsRaw = version.open_items_href || publicView.open_items_href;
      var openItemsHref = safeHref(openItemsRaw, indexUrl);
      if (openItemsRaw && !openItemsHref) warnings++;
      var openItemsCount = Number.isInteger(version.open_items_count) ? version.open_items_count : publicView.open_items_count;
      return { version_id: text(version.version_id), label: text(version.label, text(version.version_id)),
        stages: array(version.stages).filter(isObject).map(function (stage) {
          return { name: text(stage.name, '阶段未命名'), status: status(stage.status), snapshot_id: text(stage.snapshot_id), approvals: stage.approvals };
        }), changes: changes, snapshots: snapshots, working_href: working,
        open_items_count: Number.isInteger(openItemsCount) && openItemsCount >= 0 ? openItemsCount : null, open_items_href: openItemsHref };
    });
    return { schema: SCHEMA, project: { id: text(data.project.id), name: text(data.project.name, '当前项目') },
      generated_at: text(data.generated_at), content_id: text(data.content_id), current_version_id: text(data.current_version_id), versions: versions, warnings: warnings };
  }

  function selection(index, hash) {
    var params = new URLSearchParams((hash || '').replace(/^#/, ''));
    var requested = params.get('version');
    var version = index.versions.find(function (item) { return item.version_id === requested; }) ||
      index.versions.find(function (item) { return item.version_id === index.current_version_id; }) || index.versions[0];
    var change = version && version.changes.find(function (item) { return item.change_id === params.get('change'); });
    return { version: version, change_id: change ? change.change_id : '' };
  }

  function element(document, tag, className, content) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }
  function append(parent, child) { parent.appendChild(child); return child; }
  function badge(document, value) { return element(document, 'span', 'version-badge version-badge--' + value[1], value[0]); }
  function link(document, label, href, className) {
    var node = element(document, 'a', className || '', label);
    node.href = href;
    node.target = '_top';
    return node;
  }
  function stageName(name) { return STAGES[name] || text(name, '阶段未命名'); }

  function renderDetail(document, target, version, focusedChange, navigate) {
    target.replaceChildren();
    var overview = append(target, element(document, 'section', 'version-card'));
    var header = append(overview, element(document, 'div', 'version-detail__header'));
    var title = append(header, element(document, 'div'));
    append(title, element(document, 'h2', '', version.label));
    append(title, element(document, 'p', 'version-muted', '版本标识：' + version.version_id));
    if (version.working_href) append(header, link(document, '打开此版本工作版', version.working_href, 'version-button version-button--primary'));
    var summary = append(overview, element(document, 'div', 'version-detail__summary'));
    append(summary, element(document, 'span', '', version.changes.length + ' 项业务变更'));
    append(summary, element(document, 'span', '', version.snapshots.length + ' 份只读快照'));
    append(overview, element(document, 'p', 'version-warning-note', '一个版本可包含多项变更和多次确认。阶段确认必须同时具备批准状态与绑定快照。'));
    if (version.open_items_count || version.open_items_href) {
      var openItems = append(overview, element(document, 'div', 'version-open-items'));
      append(openItems, element(document, 'span', '', version.open_items_count !== null ? version.open_items_count + ' 项待定规则需确认，不能据此进入开发实施。' : '仍有待定规则需确认。'));
      if (version.open_items_href) append(openItems, link(document, '查看待定规则', version.open_items_href));
      else append(openItems, element(document, 'p', 'version-muted', '尚未提供可公开的待定规则链接。'));
    }

    var stageCard = append(target, element(document, 'section', 'version-card'));
    append(stageCard, element(document, 'h3', 'version-section-title', '三阶段状态'));
    var stages = append(stageCard, element(document, 'div', 'version-stages'));
    if (!version.stages.length) append(stages, element(document, 'p', 'version-empty', '尚无阶段状态记录，不能据此认定已确认。'));
    version.stages.forEach(function (stage) {
      var box = append(stages, element(document, 'article', 'version-stage'));
      append(box, element(document, 'h4', '', stageName(stage.name)));
      append(box, badge(document, stageStatus(stage)));
      append(box, element(document, 'p', '', stage.status === 'historical_reference' ? '历史发布来源基线，未迁移为本工具批准' : approvalSummary(stage).label));
      append(box, element(document, 'p', '', stage.snapshot_id ? '绑定快照：' + stage.snapshot_id : '尚未绑定确认快照'));
    });

    var changesCard = append(target, element(document, 'section', 'version-card'));
    append(changesCard, element(document, 'h3', 'version-section-title', '本版本业务变更'));
    var changes = append(changesCard, element(document, 'div', 'version-changes'));
    if (!version.changes.length) append(changes, element(document, 'p', 'version-empty', '此版本尚未登记业务变更。'));
    var focusedNode = null;
    version.changes.forEach(function (change) {
      var row = append(changes, element(document, 'article', 'version-change' + (change.change_id === focusedChange ? ' is-focused' : '')));
      row.setAttribute('data-change-id', change.change_id);
      if (change.change_id === focusedChange) focusedNode = row;
      var changeHeader = append(row, element(document, 'div', 'version-change__header'));
      var changeTitle = append(changeHeader, element(document, 'div'));
      append(changeTitle, element(document, 'p', 'version-change__id', change.change_id));
      append(changeTitle, element(document, 'h4', '', change.summary));
      append(changeHeader, badge(document, STATUS[change.status] || ['状态未提供', 'neutral']));
      var impacts = append(row, element(document, 'div', 'version-impact'));
      change.impact_ids.forEach(function (id) { append(impacts, element(document, 'span', '', id)); });
      var links = append(row, element(document, 'div', 'version-links'));
      var locate = append(links, element(document, 'button', 'version-text-button', '定位此变更'));
      locate.type = 'button';
      locate.addEventListener('click', function () { navigate(version.version_id, change.change_id); });
      change.pages.forEach(function (page) { append(links, link(document, page.label, page.href)); });
      if (!change.pages.length) append(links, element(document, 'span', 'version-muted', '暂无可公开的关联页面'));
    });

    var snapshotCard = append(target, element(document, 'section', 'version-card'));
    append(snapshotCard, element(document, 'h3', 'version-section-title', '历史只读快照'));
    var snapshots = append(snapshotCard, element(document, 'div', 'version-snapshots'));
    if (!version.snapshots.length) append(snapshots, element(document, 'p', 'version-empty', '尚无可浏览的只读快照。工作版不会自动成为确认快照。'));
    version.snapshots.forEach(function (snapshot) {
      var row = append(snapshots, element(document, 'article', 'version-snapshot'));
      var info = append(row, element(document, 'div'));
      append(info, element(document, 'h4', '', snapshot.snapshot_id));
      append(info, element(document, 'p', 'version-muted', stageName(snapshot.stage) + ' · 历史冻结内容 · 只读'));
      append(info, badge(document, STATUS[snapshot.status] || ['批准状态未提供', 'warning']));
      if (INVALID.indexOf(snapshot.status) >= 0) append(info, element(document, 'p', 'version-warning-note', '校验未通过，仅供历史参考，不作为确认或开工依据。'));
      append(row, link(document, '浏览只读快照', snapshot.href, 'version-button'));
    });
    if (focusedNode && typeof focusedNode.scrollIntoView === 'function') focusedNode.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function renderHistory(document, window, host, index) {
    var message = host.querySelector('[data-version-message]');
    var layout = host.querySelector('[data-version-layout]');
    var list = host.querySelector('[data-version-list]');
    var detail = host.querySelector('[data-version-detail]');
    if (!message || !layout || !list || !detail) return;
    var project = host.querySelector('[data-version-project]');
    if (project) project.textContent = index.project.name;
    var generated = host.querySelector('[data-version-generated]');
    if (generated) {
      var time = index.generated_at && new Date(index.generated_at);
      generated.textContent = time && !Number.isNaN(time.getTime()) ? '清单更新时间：' + time.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }) + '（北京时间）' : '清单更新时间未提供';
      if (index.content_id) generated.textContent += '；静态内容 ID：' + index.content_id;
    }
    if (!index.versions.length) {
      message.textContent = '此项目的版本清单暂未登记版本。没有版本记录不代表已经完成确认。';
      return;
    }
    message.hidden = true;
    layout.hidden = false;
    function navigate(versionId, changeId) {
      var url = new URL(window.location.href);
      var params = new URLSearchParams();
      params.set('version', versionId);
      if (changeId) params.set('change', changeId);
      url.hash = params.toString();
      window.history.pushState(null, '', url.href);
      render();
    }
    function render() {
      var selected = selection(index, window.location.hash);
      list.replaceChildren();
      index.versions.forEach(function (version) {
        var button = append(list, element(document, 'button', 'version-option' + (selected.version === version ? ' is-selected' : '')));
        button.type = 'button';
        button.setAttribute('aria-pressed', selected.version === version ? 'true' : 'false');
        button.setAttribute('data-version-id', version.version_id);
        append(button, element(document, 'span', 'version-option__title', version.label));
        append(button, element(document, 'span', 'version-option__meta', version.changes.length + ' 项变更 · ' + version.snapshots.length + ' 份快照'));
        if (version.version_id === index.current_version_id) append(button, element(document, 'span', 'version-option__badge', '当前版本'));
        button.addEventListener('click', function () { navigate(version.version_id, ''); detail.focus({ preventScroll: true }); });
      });
      renderDetail(document, detail, selected.version, selected.change_id, navigate);
      if (index.warnings) append(detail, element(document, 'p', 'version-warning-note', index.warnings + ' 条不符合公开链接或只读快照规则的记录已隐藏。'));
    }
    window.addEventListener('popstate', render);
    window.addEventListener('hashchange', render);
    render();
  }

  function mount(document, window, root) {
    var historyHost = document.querySelector('[data-version-history]');
    var entry = document.querySelector('[data-version-nav]');
    if (!historyHost && !entry) return Promise.resolve(null);
    if (window.HistorySnapshot && window.HistorySnapshot.read_only === true) {
      if (historyHost) {
        var frozenMessage = historyHost.querySelector('[data-version-message]');
        if (frozenMessage) frozenMessage.textContent = '这是历史冻结页面。版本清单请通过“返回工作版”入口查看，历史页面不读取当前工作区状态。';
      }
      if (entry) {
        entry.replaceChildren();
        entry.classList.add('version-entry', 'version-entry--readonly');
        append(entry, element(document, 'strong', '', '历史快照 · 只读浏览'));
        append(entry, element(document, 'span', '', '请通过“返回工作版”入口查看项目版本清单。'));
      }
      return Promise.resolve(null);
    }
    var historyUrl = new URL('version-history.html', root);
    function showUnavailable() {
      if (historyHost) {
        var message = historyHost.querySelector('[data-version-message]');
        if (message) { message.hidden = false; message.textContent = '项目公开版本投影缺失或无效。请核对固定的版本清单.js及生成记录；当前批准状态未知。'; }
        var layout = historyHost.querySelector('[data-version-layout]');
        if (layout) layout.hidden = true;
      }
      if (entry) renderEntry(null);
    }
    function renderEntry(index) {
      entry.replaceChildren();
      entry.classList.add('version-entry');
      var readOnly = new URLSearchParams(window.location.search).get('read_only') === '1' || Boolean(document.querySelector('meta[name="prototype-read-only"][content="true"]'));
      append(entry, element(document, 'strong', '', readOnly ? '历史快照 · 只读浏览' : '版本与变更'));
      var requestedVersion = readOnly && new URLSearchParams(window.location.search).get('version_id');
      var version = index && index.versions.find(function (item) { return item.version_id === (requestedVersion || index.current_version_id); });
      append(entry, element(document, 'span', '', version ? (readOnly ? '历史版本 ' : '当前版本 ') + version.label + ' · ' + version.changes.length + ' 项变更' : '版本清单未就绪 · 批准状态未知'));
      if (readOnly && version) historyUrl.hash = new URLSearchParams({ version: version.version_id }).toString();
      var view = append(entry, link(document, '查看版本与变更', historyUrl.href));
      view.removeAttribute('target');
      view.setAttribute('data-delivery-switch', 'versions');
      if (readOnly) {
        entry.classList.add('version-entry--readonly');
        append(entry, element(document, 'span', 'version-entry__notice', '此处浏览历史冻结内容；批准与失效状态以版本清单为准。浏览界面不提供修改或批准操作。'));
      }
    }
    try {
      var projection = readProjection(document, window);
      var index = parseIndex(projection.data, projection.indexUrl);
      if (historyHost) renderHistory(document, window, historyHost, index);
      if (entry) renderEntry(index);
      return Promise.resolve(index);
    } catch (error) {
      showUnavailable();
      if (window.console && typeof window.console.error === 'function') window.console.error('PROJECT_VERSION_PROJECTION_UNAVAILABLE');
      return Promise.resolve(null);
    }
  }

  return { schema: SCHEMA, safeHref: safeHref, indexLocation: indexLocation, readProjection: readProjection, text: text, approvalSummary: approvalSummary,
    stageStatus: stageStatus, parseIndex: parseIndex, selection: selection, renderDetail: renderDetail,
    renderHistory: renderHistory, mount: mount };
});
