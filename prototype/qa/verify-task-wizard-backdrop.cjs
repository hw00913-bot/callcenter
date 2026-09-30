/* Closing a task wizard from its backdrop is an explicit discard, never a draft save. */
'use strict';
const assert = require('node:assert/strict');
const { setup, create } = require('./verify-predictive-strategy.cjs');

const checks = [];
const nextTurn = () => new Promise(resolve => setImmediate(resolve));
async function check(name, test) {
  await test();
  checks.push(name);
}
function fixture(type) {
  const c = setup();
  let confirmation;
  c.PlatformUI.confirm = options => { confirmation = options; };
  const w = c.CloudTaskWorkspace;
  assert.equal(w.start(type), true);
  assert.equal(c.RouteRuntime.snapshot()?.key, 'cloud-task-create');
  return { c, w, confirmation: () => confirmation };
}
function clickBackdrop(f) {
  const handler = f.c.RouteRuntime.snapshot()?.options?.onBackdropClick;
  assert.equal(typeof handler, 'function');
  handler();
  const confirmation = f.confirmation();
  assert.equal(confirmation?.title, '关闭当前弹窗？');
  assert.equal(confirmation?.cancelText, '继续填写');
  assert.equal(confirmation?.confirmText, '关闭弹窗');
  assert.equal(typeof confirmation?.onConfirm, 'function');
  return confirmation;
}
function taskCount(c) {
  return c.CloudCallData.tasks.length + c.CloudCallData.predictiveTasks.length + c.CloudCallData.ivrTasks.length;
}

(async () => {
  for (const type of ['预外呼', 'IVR 外呼']) {
    await check(`${type}：空白向导点击遮罩也先确认，不生成草稿`, async () => {
      const f = fixture(type);
      clickBackdrop(f).onConfirm();
      await nextTurn();
      assert.equal(f.c.RouteRuntime.snapshot(), null);
      assert.equal(f.c.drafts().length, 0);
      assert.equal(f.w.listDraftTasks(type).length, 0);
      assert.equal(taskCount(f.c), 0);
    });

    await check(`${type}：点击遮罩先询问，继续填写保留输入`, async () => {
      const f = fixture(type);
      f.w.update('name', '仍在填写的任务');
      clickBackdrop(f);
      assert.equal(f.c.RouteRuntime.snapshot()?.key, 'cloud-task-create');
      assert.equal(f.c.active()?.values.name, '仍在填写的任务');
      assert.equal(f.w.listDraftTasks(type).length, 0);
      assert.equal(taskCount(f.c), 0);
    });

    await check(`${type}：确认关闭丢弃未保存内容，不新增草稿或任务`, async () => {
      const f = fixture(type);
      f.w.update('name', '应被丢弃的任务');
      const confirmation = clickBackdrop(f);
      confirmation.onConfirm();
      await nextTurn();
      assert.equal(f.c.RouteRuntime.snapshot(), null);
      assert.equal(f.c.active(), undefined);
      assert.equal(f.c.drafts().length, 0);
      assert.equal(f.w.listDraftTasks(type).length, 0);
      assert.equal(taskCount(f.c), 0);
      assert.equal(f.c.storage.get('cloud-task-created-v1'), undefined);
    });

    await check(`${type}：已保存草稿保留，关闭只放弃后续修改`, async () => {
      const f = fixture(type);
      f.w.update('name', '已保存的名字');
      assert.equal(f.w.saveDraft(), true);
      const draftId = f.c.active().draftId;
      assert.equal(f.w.listDraftTasks(type).length, 1);
      f.w.update('name', '尚未保存的名字');
      assert.equal(f.c.active()?.values.name, '尚未保存的名字');
      clickBackdrop(f).onConfirm();
      await nextTurn();
      assert.equal(f.c.RouteRuntime.snapshot(), null);
      assert.equal(f.c.drafts().length, 1);
      assert.equal(f.w.listDraftTasks(type).length, 1);
      assert.equal(f.c.drafts()[0].values.name, '已保存的名字');
      assert.equal(taskCount(f.c), 0);
      assert.equal(f.w.start(type, draftId), true);
      assert.equal(f.c.active()?.values.name, '已保存的名字');
    });
  }
  await check('编辑任务点击遮罩后确认关闭，不更改原任务', async () => {
    const c = setup();
    let confirmation;
    c.PlatformUI.confirm = options => { confirmation = options; };
    const row = create(c, '2');
    const before = JSON.stringify(row);
    const count = taskCount(c);
    const draftsBefore = c.drafts().length;
    assert.equal(c.CloudTaskWorkspace.editTask(row.taskId), true);
    c.CloudTaskWorkspace.update('name', '尚未提交的新任务名');
    clickBackdrop({ c, confirmation: () => confirmation }).onConfirm();
    await nextTurn();
    assert.equal(c.RouteRuntime.snapshot(), null);
    assert.equal(JSON.stringify(row), before);
    assert.equal(taskCount(c), count);
    assert.equal(c.drafts().length, draftsBefore);
  });
  console.log(JSON.stringify({ result: 'pass', count: checks.length, checks }, null, 2));
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
