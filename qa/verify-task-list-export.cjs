/* Task-list CSV uses the selected task type and all applied filter results. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../js/pages/cloud-call-tasks.js'), 'utf8');
const downloads = [];
const toasts = [];
const controls = { cloudTaskKeyword: { value: '' }, cloudTaskStatus: { value: '' } };
const own = { tenantId: 'TENANT-A', enterpriseId: 'ENTERPRISE-A' };
const row = (id, type, overrides = {}) => ({ taskId: id, ...own, callType: type, name: '任务' + id, status: '待启动', total: 3, completed: 1, connected: 1, owner: '负责人', updatedAt: '2026-09-20 10:00:00', ...overrides });
const predictive = Array.from({ length: 12 }, (_, index) => row('P' + index, '预外呼'));
predictive[0].name = '=HYPERLINK("x",1)';
predictive[1].name = '项目,"回访"';
predictive[2].status = '已暂停';
const ivr = row('IVR', 'IVR 外呼');
const foreign = row('FOREIGN', '预外呼', { tenantId: 'TENANT-B' });

let failDownload = false;
const context = {
  Blob,
  URL: {
    createObjectURL(blob) {
      if (failDownload) throw Error('download unavailable');
      downloads.push({ blob });
      return 'blob:test-' + downloads.length;
    },
    revokeObjectURL() {}
  },
  document: {
    getElementById(id) { return controls[id] || null; },
    createElement() { return { click() { downloads.at(-1).clicked = true; downloads.at(-1).name = this.download; }, remove() {} }; },
    body: { appendChild() {} }
  },
  PlatformUI: {
    escape: value => String(value ?? ''),
    sortByUpdated: rows => [...rows],
    updatedTimestamp: item => item.updatedAt ? Date.parse(item.updatedAt) : null,
    pageHeader: () => '', journey: () => '', help: () => '', toolbar: primary => primary,
    table: () => '', pagination: () => '', status: value => value
  },
  AppState: { scoped: rows => rows.filter(item => item.tenantId === own.tenantId), canMenu: () => true },
  CloudCallRuntime: { tenant: () => ({ name: '当前组织' }) },
  CloudCallData: { predictiveTasks: [...predictive, foreign], ivrTasks: [ivr], calls: [] },
  CloudTaskWorkspace: { syncAssignedCustomers() {}, listDraftTasks: type => type === '预外呼' ? [row('DRAFT', type, { name: '草稿任务', status: '草稿', isWizardDraft: true })] : [] },
  CustomerTasks: { canImportToTask: () => false },
  showToast(message, tone) { toasts.push({ message, tone }); },
  navigateTo() {},
  setTimeout() {},
  window: null
};
context.window = context;
vm.createContext(context);
vm.runInContext(source, context, { filename: 'cloud-call-tasks.js' });
const page = context.Pages['cloud-call-tasks'];

(async () => {
  assert.match(page.render({ view: 'predictive' }), /exportTasks\('预外呼'\)/);
  assert.match(page.render({ view: 'ivr' }), /exportTasks\('IVR 外呼'\)/);

  page.exportTasks('预外呼');
  assert.equal(downloads.length, 1);
  assert(downloads[0].clicked);
  assert.match(downloads[0].name, /^预外呼任务_\d{4}-\d{2}-\d{2}\.csv$/);
  const all = await downloads[0].blob.text();
  assert.deepEqual([...Buffer.from(await downloads[0].blob.arrayBuffer()).subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.equal(all.split('\r\n').length, 14, '12 tasks plus one draft and the header must export across pages');
  assert(all.includes('"\'=HYPERLINK(""x"",1)"'), 'spreadsheet formulas must be inert');
  assert(all.includes('"项目,""回访"""'), 'commas and quotes must remain a single CSV cell');
  assert(all.includes('"草稿任务","预外呼","草稿"'));
  assert(!all.includes('FOREIGN'));
  assert(!all.includes('"自动外呼"'));

  controls.cloudTaskKeyword.value = '任务P';
  controls.cloudTaskStatus.value = '已暂停';
  page.query('预外呼');
  page.exportTasks('预外呼');
  const filtered = await downloads[1].blob.text();
  assert.equal(filtered.split('\r\n').length, 2);
  assert(filtered.includes('任务P2'));
  assert(!filtered.includes('任务P3'));

  page.exportTasks('IVR 外呼');
  const automatic = await downloads[2].blob.text();
  assert(automatic.includes('"任务IVR","自动外呼"'));
  assert(!automatic.includes('任务P2'));

  controls.cloudTaskKeyword.value = '不存在';
  controls.cloudTaskStatus.value = '';
  page.query('预外呼');
  page.exportTasks('预外呼');
  assert.equal(downloads.length, 3);
  assert.deepEqual(toasts.at(-1), { message: '当前没有可导出的任务', tone: 'warning' });

  controls.cloudTaskKeyword.value = '';
  page.query('预外呼');
  failDownload = true;
  page.exportTasks('预外呼');
  assert.deepEqual(toasts.at(-1), { message: '导出失败，请重新尝试', tone: 'error' });
  assert.equal(toasts.filter(item => item.tone === 'success').length, 3);

  process.stdout.write('task-list CSV export: 5 checks passed\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
