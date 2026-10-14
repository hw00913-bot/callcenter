#!/usr/bin/env python3
"""04 S8 bounded, synthetic model checks; no backend, network or vendor calls.

This is a derived verification candidate, never a prototype or production input.
Atomic model transitions and trusted identity/reconciliation evidence are explicit
assumptions. They must be proved separately by the actual engineering/provider.
"""
from collections import Counter, deque
from copy import deepcopy
from dataclasses import dataclass, replace
from hashlib import sha256
from itertools import product, permutations
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'runtime/s8-internal-model-validation-20261013.json'

@dataclass(frozen=True)
class State:
    phases: tuple = ('ready', 'ready', 'ready')
    physical_starts: int = 0
    cancellation: int = 0
    paused: bool = False
    stopped: bool = False
    authorized: bool = True
    auto_due: bool = False
    later_main_root: bool = False

def used(s):
    return s.phases.count('started')

def held(s):
    return sum(p in {'reserved', 'intent', 'unknown'} for p in s.phases)

def physical(s):
    return s.physical_starts.bit_count()

def phase(s, i, value, **changes):
    ps = list(s.phases)
    ps[i] = value
    return replace(s, phases=tuple(ps), **changes)

def active(s, i):
    return (s.authorized and not s.paused and not s.stopped
            and not s.cancellation & (1 << i) and (i != 0 or s.auto_due))

def successors(s):
    """3 already trusted failure objects: one due-auto and two confirmed-manual.

    'started' proves local request initiation, not provider acceptance/dialling.
    'unknown' retains a slot even if the physical start was lost across a crash.
    The physical mask is a test oracle unavailable to the production process.
    """
    for i, p in enumerate(s.phases):
        bit = 1 << i
        if p == 'ready' and active(s, i) and used(s) + held(s) < 2:
            yield f'reserve:{i}', phase(s, i, 'reserved')
        if p == 'reserved' and active(s, i):
            yield f'persist_intent:{i}', phase(s, i, 'intent')
        if p == 'intent':
            # Deliberately separate durable intent and external effect.
            yield f'crash_before_physical_start:{i}', phase(s, i, 'unknown')
            if active(s, i) and not s.physical_starts & bit:
                yield f'known_local_start:{i}', phase(
                    s, i, 'started', physical_starts=s.physical_starts | bit)
                yield f'physical_start_then_crash_before_used_save:{i}', phase(
                    s, i, 'unknown', physical_starts=s.physical_starts | bit)
        if s.authorized and p in {'ready', 'reserved'}:
            yield f'authorized_cancel_unstarted:{i}', phase(
                s, i, 'cancelled', cancellation=s.cancellation | bit)
        elif s.authorized and p in {'intent', 'unknown', 'started'} and not s.cancellation & bit:
            # Neither cancellation nor remote deletion releases an unknown/used slot.
            yield f'cancel_intent_keeps_attempt_and_slot:{i}', replace(
                s, cancellation=s.cancellation | bit)
        if p == 'unknown':
            if s.physical_starts & bit:
                yield f'trusted_proof_started_same_attempt:{i}', phase(s, i, 'started')
            else:
                destination = 'cancelled' if s.stopped or s.cancellation & bit else 'ready'
                yield f'trusted_proof_not_started_same_attempt:{i}', phase(s, i, destination)
    if not s.paused and not s.stopped:
        yield 'pause_task', replace(s, paused=True)
    if s.paused and not s.stopped:
        yield 'resume_task_recheck_guards', replace(s, paused=False)
    if not s.stopped:
        ps = tuple('cancelled' if p in {'ready', 'reserved'} else p for p in s.phases)
        yield 'terminate_keeps_started_unknown', replace(
            s, phases=ps, stopped=True, cancellation=7)
    yield 'current_permission_changed_in_model_only', replace(s, authorized=not s.authorized)
    if not s.auto_due:
        yield 'confirmed_failure_time_plus_120_seconds', replace(s, auto_due=True)
    if not s.later_main_root:
        # Budget and all trigger-record snapshots deliberately remain unchanged.
        yield 'later_main_root_does_not_reset_budget', replace(s, later_main_root=True)

def invariants(s):
    assert used(s) + held(s) <= 2, 'reserved plus used exceeds shared additional 2'
    assert physical(s) <= 2, 'more than 2 physical supplementary request starts'
    assert physical(s) <= used(s) + held(s), 'a real start lost its used/unknown slot'
    assert all(not (p == 'started') or s.physical_starts & (1 << i)
               for i, p in enumerate(s.phases)), 'used before actual local request start'
    assert all(not (s.physical_starts & (1 << i)) or p in {'started', 'unknown'}
               for i, p in enumerate(s.phases)), 'sent attempt re-enabled/cancelled as unused'

def transition_invariants(s, label, nxt):
    operation, _, target = label.partition(':')
    if operation in {'reserve', 'persist_intent', 'known_local_start',
                     'physical_start_then_crash_before_used_save'}:
        i = int(target)
        # Independent rule oracle; do not just invoke the producer's active().
        assert s.authorized, 'operation after current permission revoked'
        assert not s.paused, 'operation while task paused'
        assert not s.stopped, 'operation after task terminated'
        assert not s.cancellation & (1 << i), 'operation after precise cancellation'
        assert i != 0 or s.auto_due, 'automatic operation before confirmed-time+120s'
        if operation in {'known_local_start', 'physical_start_then_crash_before_used_save'}:
            assert s.phases[i] == 'intent', 'physical operation without durable intent'
            assert not s.physical_starts & (1 << i), 'second start of same attempt'
            assert physical(nxt) == physical(s) + 1
    if operation in {'authorized_cancel_unstarted', 'cancel_intent_keeps_attempt_and_slot'}:
        assert s.authorized, 'cancel without current task permission'

def explore(successor_function=successors):
    start = State()
    queue = deque([(start, 0)])
    visited = {start}
    edge_count, max_depth = 0, 0
    operation_counts = Counter()
    while queue:
        s, depth = queue.popleft()
        invariants(s)
        max_depth = max(max_depth, depth)
        for label, nxt in successor_function(s):
            if nxt == s:
                continue
            edge_count += 1
            operation_counts[label.split(':')[0]] += 1
            transition_invariants(s, label, nxt)
            invariants(nxt)
            if nxt not in visited:
                visited.add(nxt)
                queue.append((nxt, depth + 1))
    return {'states': len(visited), 'transitions': edge_count,
            'maximum_shortest_path_depth': max_depth,
            'operation_counts': dict(operation_counts), 'invariant_failures': 0}

def classify(association, a, b, c):
    if not association:
        return 'UNKNOWN'
    if False in (a, b, c):
        return 'NOT_SHORT_HANGUP'
    if all(x is True for x in (a, b, c)):
        return 'SHORT_HANGUP'
    return 'UNKNOWN'

def duration_condition(value, unit_trusted):
    if not unit_trusted or value is None or isinstance(value, bool):
        return None
    if not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0:
        return None
    return 0 <= value <= 2

def budget_key(tenant, task, saved_lead, fixed_phone):
    values = (tenant, task, saved_lead, fixed_phone)
    if not all(isinstance(x, str) and x.strip() for x in values):
        return None
    return values

AUTO_REASONS = {'运营商禁呼', '运营商限呼', 'restrict tel'}
MANUAL_REASONS = {'无可用中继', 'bad tel', '真实号码为空', 'no clid', 'bad clid',
                  '无可用中继信息', 'wrong obClidGroup', 'bad timeout range'}

class FailureStore:
    """Only a local abstract reducer; its trusted key is not a supplier field."""
    def __init__(self):
        self.plans = {}

    def observe(self, key, record, reason, confirmed_at, trusted=True):
        identity = budget_key(*(record.get(k) for k in ('tenant', 'task', 'saved_lead', 'fixed_phone')))
        if not trusted or not key or identity is None or not record.get('root'):
            return 'PENDING', None
        if key in self.plans:
            old = self.plans[key]
            if identity != old['budget_key'] or record['root'] != old['record']['root'] or reason != old['reason']:
                return 'PENDING_ASSOCIATION_CONFLICT', old
            return 'DUPLICATE_SAME_PLAN', old
        if reason == '呼叫过频':
            return 'NATIVE_TASK_ONLY', None
        if reason not in AUTO_REASONS | MANUAL_REASONS:
            return 'PENDING_UNKNOWN_REASON', None
        plan = {'record': deepcopy(record), 'budget_key': identity, 'reason': reason,
                'confirmed_at': confirmed_at,
                'due': confirmed_at + 120 if reason in AUTO_REASONS else None,
                'mode': 'auto' if reason in AUTO_REASONS else 'manual_confirmation_required'}
        self.plans[key] = plan
        return 'NEW_PLAN', plan

class BudgetRegistry:
    """History-known is an oracle input, not a default recovered from an empty DB."""
    def __init__(self):
        self.accounts = {}

    def lookup(self, record, history_known):
        key = budget_key(*(record.get(k) for k in ('tenant', 'task', 'saved_lead', 'fixed_phone')))
        if not history_known or key is None:
            return None
        return self.accounts.setdefault(key, {'used': 0, 'held': 0})

class DownloadModel:
    """Trusted success is supplied; no browser/OS success detector is implemented."""
    def __init__(self):
        self.pending = {}
        self.highest_seen = {}
        self.snapshots = {}
        self.receipts = set()
        self.preserved_audit = {'used': 1, 'unknown_held': 1, 'root': 'saved-root-A', 'stopped': True}

    def observe_failure(self, key, trusted_internal_version):
        if trusted_internal_version <= self.highest_seen.get(key, -1):
            return 'DUPLICATE_OR_OLD'
        self.highest_seen[key] = trusted_internal_version
        self.pending[key] = trusted_internal_version
        return 'NEW_OR_TRUSTED_UPDATE'

    def capture(self, snapshot_id):
        self.snapshots[snapshot_id] = {'members': deepcopy(self.pending), 'file': snapshot_id + ':local-file'}

    def finish(self, snapshot_id, trusted_success):
        if not trusted_success or snapshot_id not in self.snapshots:
            return 'RETAINED'
        if snapshot_id in self.receipts:
            return 'DUPLICATE_SUCCESS'
        snapshot = self.snapshots[snapshot_id]
        for key, version in snapshot['members'].items():
            if self.pending.get(key) == version:
                del self.pending[key]
        snapshot['file'] = None
        self.receipts.add(snapshot_id)
        return 'CLEARED_ONLY_THIS_SNAPSHOT'

def verify_examples():
    cases = []
    def record(identifier, name, refs, observations):
        cases.append({'id': identifier, 'name': name, 'source_refs': refs,
                      'result': 'pass_under_stated_model_assumptions', 'observations': observations})

    state = State(auto_due=True)
    state = phase(state, 0, 'intent')  # one durable held slot, no physical start yet
    invariants(state)
    assert used(state) == 0 and held(state) == 1 and physical(state) == 0
    record('MV-01', '预占和持久意图不提前计已用', ['BR-013', 'AC-064', 'ISSUE-038'],
           {'reserved': 1, 'used': 0, 'physical_starts': 0})
    state = phase(state, 0, 'unknown', physical_starts=1)
    invariants(state)
    assert physical(state) == 1 and held(state) == 1
    record('MV-02', '外发后落账前崩溃仍保留同尝试占用', ['BR-013', 'AC-066', 'AC-073', 'ISSUE-038'],
           {'model_oracle_started': True, 'used_not_yet_proven_saved': 0, 'unknown_held': 1,
            'external_truth_is_not_a_production_query': True})
    state = replace(state, cancellation=1, later_main_root=True)
    assert held(state) == 1 and used(state) == 0
    restored = dict(successors(state))['trusted_proof_started_same_attempt:0']
    assert physical(restored) == 1 and used(restored) == 1 and held(restored) == 0
    record('MV-03', '取消、新主批、补证不重发或返还实际次数', ['BR-007', 'BR-012', 'AC-064', 'AC-073'],
           {'same_attempt': True, 'used_after_trusted_start_proof': 1, 'additional_network_starts': 0})
    untouched = State(phases=('unknown', 'ready', 'ready'), cancellation=1)
    done = dict(successors(untouched))['trusted_proof_not_started_same_attempt:0']
    assert done.phases[0] == 'cancelled' and physical(done) == used(done) == held(done) == 0
    record('MV-04', '可信未发起证明才解除未用占用', ['BR-007', 'AC-073', 'ISSUE-038'],
           {'requires_external_trusted_proof': True, 'query_empty_or_delete_success_is_not_proof': True})
    unauthorized_operations = {label.split(':')[0] for label, _ in successors(State(authorized=False))}
    assert not unauthorized_operations & {'reserve', 'persist_intent', 'known_local_start',
                                           'physical_start_then_crash_before_used_save',
                                           'authorized_cancel_unstarted',
                                           'cancel_intent_keeps_attempt_and_slot'}
    intent = State(phases=('intent', 'ready', 'ready'), auto_due=True)
    forbidden_intents = [replace(intent, authorized=False), replace(intent, paused=True),
                         replace(intent, stopped=True), replace(intent, cancellation=1),
                         replace(intent, auto_due=False)]
    for loaded_intent in forbidden_intents:
        operations = {label.split(':')[0] for label, _ in successors(loaded_intent)}
        assert not operations & {'known_local_start', 'physical_start_then_crash_before_used_save'}
    blocked = State(phases=('reserved', 'ready', 'ready'), auto_due=True, paused=True)
    assert 'persist_intent:0' not in dict(successors(blocked))
    blocked = replace(blocked, paused=False, stopped=True)
    assert 'persist_intent:0' not in dict(successors(blocked))
    record('MV-05', '执行前复核权限、暂停、终止与取消', ['BR-016', 'BR-022', 'AC-073', 'AC-078'],
           {'blocked_actions_do_not_start_requests': True, 'actual_account_permissions_not_tested': True})
    base = budget_key('tenant-A', 'task-A', 'saved-lead-A', 'fixed-phone-A')
    assert base is not None
    for i in range(4):
        changed = list(base)
        changed[i] += '-other'
        assert tuple(changed) != base
    assert budget_key('tenant-A', 'task-A', '', 'fixed-phone-A') is None
    origin = {'tenant': 'tenant-A', 'task': 'task-A', 'saved_lead': 'saved-lead-A',
              'fixed_phone': 'fixed-phone-A', 'root': 'saved-root-A', 'priority': 7}
    reducer = FailureStore()
    _, trigger = reducer.observe('verified-original-event', origin, '运营商禁呼', 0)
    ledger = BudgetRegistry()
    original_account = ledger.lookup(origin, history_known=True)
    original_account['used'] = 1  # already-proven start in this example's history
    origin['root'] = 'later-root-B'
    origin['priority'] = 99
    result, same_trigger = reducer.observe('verified-original-event', origin, '运营商禁呼', 30)
    assert result == 'PENDING_ASSOCIATION_CONFLICT' and same_trigger is trigger
    assert trigger['record']['root'] == 'saved-root-A' and trigger['record']['priority'] == 7
    assert ledger.lookup(origin, history_known=True) is original_account
    assert ledger.lookup(origin, history_known=True)['used'] == 1
    assert ledger.lookup(origin, history_known=False) is None
    record('MV-06', '四元组缺失守卫与原root/priority快照', ['BR-002', 'BR-003', 'BR-012', 'AC-064'],
           {'root_not_in_budget_key': True, 'no_new_lead_or_priority_defaults': True,
            'trigger_root_and_priority_unchanged': True})
    record_input = {'tenant': 'tenant-A', 'task': 'task-A', 'saved_lead': 'saved-lead-A',
                    'fixed_phone': 'fixed-phone-A', 'root': 'saved-root-A', 'priority': 7}
    reducer = FailureStore()
    _, first = reducer.observe('verified-event-A', record_input, '运营商禁呼', 0)
    for repeated_at in (30, 119, 120, 180):
        code, same = reducer.observe('verified-event-A', record_input, '运营商禁呼', repeated_at)
        assert code == 'DUPLICATE_SAME_PLAN' and same is first and (same['confirmed_at'], same['due']) == (0, 120)
    assert len(reducer.plans) == 1
    code, native_plan = reducer.observe('verified-frequency-event', record_input, '呼叫过频', 10)
    assert code == 'NATIVE_TASK_ONLY' and native_plan is None and len(reducer.plans) == 1
    code, manual = reducer.observe('verified-manual-event', record_input, 'bad tel', 10)
    assert code == 'NEW_PLAN' and manual['mode'] == 'manual_confirmation_required' and manual['due'] is None
    code, unresolved = reducer.observe('unverified-event', record_input, '运营商禁呼', 10, trusted=False)
    assert code == 'PENDING' and unresolved is None and len(reducer.plans) == 2
    due = first['due']
    record('MV-07', '重复准确事件不新建计划、不重启120秒', ['BR-008', 'BR-009', 'AC-066'],
           {'original_due': due, 'duplicate_receive_times': [30, 119, 120, 180],
            'stable_verified_event_identity_assumed': True, 'frequency_no_platform_plan': True,
            'manual_no_120_second_deadline': True, 'unverified_identity_does_not_plan': True})
    outcomes = Counter()
    for a, b, c in product((True, False, None), repeat=3):
        result = classify(True, a, b, c)
        assert result == ('NOT_SHORT_HANGUP' if False in (a, b, c) else
                          'SHORT_HANGUP' if all(x is True for x in (a, b, c)) else 'UNKNOWN')
        assert classify(False, a, b, c) == 'UNKNOWN'
        outcomes[result] += 1
    assert duration_condition(None, True) is None
    assert duration_condition(-1, True) is None
    assert duration_condition(float('nan'), True) is None
    assert duration_condition(float('inf'), True) is None
    assert duration_condition(0, False) is None
    assert duration_condition(0, True) is True and duration_condition(2, True) is True
    assert duration_condition(3, True) is False
    record('MV-08', '秒挂三态27组合与关联/时长边界', ['BR-010', 'BR-011', 'AC-021', 'AC-022'],
           {'valid_association_combinations': 27, 'invalid_association_combinations': 27,
            'outcomes': dict(outcomes), 'no_plan_or_budget_mutation': True,
            'provider_field_unit_mapping_not_proven': True})
    downloads = DownloadModel()
    for key in ('failure-A', 'failure-B'):
        downloads.observe_failure(key, 1)
    downloads.capture('snapshot-A')
    downloads.observe_failure('failure-A', 2)
    downloads.observe_failure('failure-C', 1)
    downloads.capture('snapshot-B')
    before_failed = deepcopy(downloads.__dict__)
    assert downloads.finish('snapshot-A', trusted_success=False) == 'RETAINED'
    assert downloads.__dict__ == before_failed
    assert downloads.finish('unknown-snapshot', trusted_success=True) == 'RETAINED'
    assert downloads.__dict__ == before_failed
    audit = deepcopy(downloads.preserved_audit)
    second_snapshot = deepcopy(downloads.snapshots['snapshot-B'])
    assert downloads.finish('snapshot-A', trusted_success=True) == 'CLEARED_ONLY_THIS_SNAPSHOT'
    assert downloads.pending == {'failure-A': 2, 'failure-C': 1}
    assert downloads.snapshots['snapshot-A']['file'] is None
    assert downloads.snapshots['snapshot-B'] == second_snapshot
    after_success = deepcopy(downloads.__dict__)
    assert downloads.finish('snapshot-A', trusted_success=True) == 'DUPLICATE_SUCCESS'
    assert downloads.__dict__ == after_success
    assert downloads.observe_failure('failure-B', 1) == 'DUPLICATE_OR_OLD'
    assert 'failure-B' not in downloads.pending
    assert downloads.preserved_audit == audit
    record('MV-09', '下载只清可信成功快照成员版本', ['BR-005', 'BR-019', 'ISSUE-008'],
           {'failed_download_retains_all': True, 'late_or_new_versions_retained': True,
            'budget_audit_unchanged': True, 'trusted_download_completion_source_assumed_not_implemented': True})
    queue = [('task-A', 9, 3), ('task-A', 9, 1), ('task-A', 4, 0)]
    assert sorted(queue, key=lambda x: (-x[1], x[2])) == [queue[1], queue[0], queue[2]]
    record('MV-10', '同任务保存priority优先及同级FIFO', ['BR-021'],
           {'saved_values_only': True, 'no_daily_decay': True, 'actual_vendor_call_order_not_proven': True})
    return cases

def unsafe_counterexamples():
    # Deliberately wrong policies, evaluated only as synthetic counterexamples.
    wrong = State(phases=('unknown', 'ready', 'ready'), physical_starts=1, auto_due=True)
    wrong = phase(wrong, 0, 'cancelled')  # mutant incorrectly frees an UNKNOWN slot
    for i in (1, 2):
        for operation in ('reserve', 'persist_intent', 'known_local_start'):
            wrong = dict(successors(wrong))[f'{operation}:{i}']
    try:
        invariants(wrong)
        unknown_release_detected = False
    except AssertionError:
        unknown_release_detected = physical(wrong) == 3 and used(wrong) == 2
    fixed_key = budget_key('tenant-A', 'task-A', 'saved-lead-A', 'fixed-phone-A')
    wrong_root_budgets = {fixed_key + ('original-root',): 1,
                          fixed_key + ('later-root',): 0}
    for _ in range(2):
        wrong_key = fixed_key + ('later-root',)
        assert wrong_root_budgets[wrong_key] < 2
        wrong_root_budgets[wrong_key] += 1
    same_four_tuple_count = sum(wrong_root_budgets.values())
    root_reset_detected = same_four_tuple_count > 2 and max(wrong_root_budgets.values()) <= 2
    def omitted_external_guard(s):
        yield from successors(s)
        for i, p in enumerate(s.phases):
            if p == 'intent' and not active(s, i) and not s.physical_starts & (1 << i):
                yield f'known_local_start:{i}', phase(s, i, 'started', physical_starts=s.physical_starts | (1 << i))
    try:
        explore(omitted_external_guard)
        missing_guard_detected = False
        missing_guard_reason = None
    except AssertionError as exc:
        missing_guard_detected = True
        missing_guard_reason = str(exc)
    duplicate_reducer = FailureStore()
    duplicate_record = {'tenant': 'tenant-A', 'task': 'task-A', 'saved_lead': 'saved-lead-A',
                        'fixed_phone': 'fixed-phone-A', 'root': 'saved-root-A', 'priority': 7}
    _, correct_plan = duplicate_reducer.observe('same-event', duplicate_record, '运营商禁呼', 0)
    _, correct_plan = duplicate_reducer.observe('same-event', duplicate_record, '运营商禁呼', 30)
    wrong_duplicate_plan = deepcopy(correct_plan)
    wrong_duplicate_plan.update(confirmed_at=30, due=30 + 120)
    return [
        {'id': 'CE-01', 'wrong_policy': 'UNKNOWN直接释放占用', 'detected': unknown_release_detected,
         'trace': ['A持久意图', 'A实际发起后崩溃', '错误释放A未知占用',
                   'B实际发起并计1', 'C实际发起并计2'],
         'local_used': used(wrong), 'physical_starts': physical(wrong),
         'violation': '首次外实际补提交3次，超过共享上限2', 'source_refs': ['AC-064', 'AC-073']},
        {'id': 'CE-02', 'wrong_policy': '把root加入额度key使新主批获得新额度', 'detected': root_reset_detected,
         'trace': ['原四元组已补1次', '另开主批错误建新额度', '新主批再补2次'],
         'physical_starts_same_confirmed_four_tuple': same_four_tuple_count,
         'violation': '新主批错误重置累计预算', 'source_refs': ['BR-012', 'AC-064']},
        {'id': 'CE-03', 'wrong_policy': '重复事件覆盖首次确认时间',
         'detected': correct_plan['due'] != wrong_duplicate_plan['due'],
         'expected_due': correct_plan['due'], 'wrong_due': wrong_duplicate_plan['due'], 'source_refs': ['AC-066']},
        {'id': 'CE-04', 'wrong_policy': '把缺失客户时长当0秒',
         'detected': classify(True, True, True, duration_condition(None, True)) !=
                     classify(True, True, True, duration_condition(0, True)),
         'expected': 'UNKNOWN', 'wrong': 'SHORT_HANGUP', 'source_refs': ['AC-021']},
        {'id': 'CE-05', 'wrong_policy': '外发前遗漏当前权限/任务状态/取消/到期守卫',
         'detected': missing_guard_detected, 'assertion_reason': missing_guard_reason,
         'source_refs': ['BR-016', 'BR-022', 'AC-073', 'AC-078']}
    ]

def typed_content(value):
    """Local comparison oracle only; never specifies production serialization."""
    if isinstance(value, dict):
        return ('dict', tuple(sorted((k, typed_content(v)) for k, v in value.items())))
    if isinstance(value, list):
        return ('list', tuple(typed_content(v) for v in value))
    return (type(value).__name__, value)

class ManualSaveModel:
    """One abstract atomic commit; no DB transaction or real outbound operation."""
    def __init__(self):
        self.saved = {}
        self.relations = {'record': {}, 'batch': {}, 'root': {}, 'source': {}, 'intent': {}}

    def save(self, identity, content, authorized, abort_before_commit=False):
        if authorized is not True:
            return 'DENIED', None
        if identity in self.saved:
            prior = self.saved[identity]
            return ('REPLAY', prior) if prior['content'] == typed_content(content) else ('CONFLICT', None)
        staged = deepcopy(self.relations)
        bundle = {'record': identity + ':record', 'batch': identity + ':single-phone-batch',
                  'root': identity + ':root', 'source': deepcopy(content), 'intent': identity + ':intent'}
        for field, value in bundle.items():
            staged[field][identity] = value
        if abort_before_commit:
            return 'ABORTED', None
        self.relations = staged
        self.saved[identity] = {'content': typed_content(content), 'mapping': deepcopy(bundle)}
        return 'SAVED', self.saved[identity]

class CommandReplayModel:
    """Trusted target/authority/version are synthetic inputs, not wire protocols."""
    def __init__(self):
        self.commands = {}
        self.target_attempts = {}
        self.held = 0

    def apply(self, action, content, authorized, current_version):
        if authorized is not True:
            return 'DENIED', None
        if action in self.commands:
            prior = self.commands[action]
            return ('REPLAY', prior) if prior['content'] == typed_content(content) else ('CONFLICT', None)
        if content.get('expectedVersion') != current_version:
            return 'VERSION_CONFLICT', None
        if content.get('confirmed') is not True:
            return 'NOT_CONFIRMED', None
        target = content['recordId']
        if target in self.target_attempts:
            return 'ALREADY_PROCESSING', None
        attempt = {'content': typed_content(content), 'attempt': action + ':model-attempt', 'state': 'RESERVED'}
        self.commands[action] = attempt
        self.target_attempts[target] = attempt
        self.held += 1
        return 'NEW', attempt

class ExactDeleteModel:
    """Target-stop and remote deletion are separate; selector uses trusted mapping.

    Explicit skip test values have no production default. All simulated sends
    are appended to a local list. No vendor call/cancel capability is implemented.
    """
    def __init__(self, records):
        self.records = deepcopy(records)
        self.commands = {}
        self.sends = []

    def selector(self, target, exclusive_proven, skip_calling, skip_retry):
        row = self.records[target]
        if exclusive_proven is not True or not row.get('task') or not row.get('file') or not row.get('phone'):
            return None
        matching = [key for key, record in self.records.items()
                    if (record['task'], record['file']) == (row['task'], row['file'])]
        if matching != [target] or row.get('file_member_attempts') != [row['attempt']]:
            return None
        if (type(skip_calling) is not int or type(skip_retry) is not int
                or skip_calling not in (0, 1) or skip_retry not in (0, 1)
                or (skip_calling, skip_retry) == (1, 1)):
            return None
        return {'taskId': row['task'], 'fileId': row['file'],
                'skipCalling': skip_calling, 'skipRetry': skip_retry}

    def request(self, action, target, authorized, exclusive_proven,
                skip_calling, skip_retry, execution_right_proven=True):
        if authorized is not True:
            return 'DENIED', None
        content = typed_content({'target': target, 'skipCalling': skip_calling, 'skipRetry': skip_retry})
        if action in self.commands:
            prior = self.commands[action]
            return ('REPLAY', prior) if prior['content'] == content else ('CONFLICT', None)
        if target not in self.records:
            return 'TARGET_UNKNOWN', None
        if any(prior['target'] == target and prior['remote'] == 'UNKNOWN'
               for prior in self.commands.values()):
            return 'ALREADY_PROCESSING', None
        # Accurate authorized intent stops only this local target, even if the
        # supplier selector/remote execution remains unconfirmed.
        row = self.records[target]
        row['local_stopped'] = True
        if row['phase'] in ('ready', 'reserved') and row['proven_not_started']:
            row['phase'] = 'cancelled'
            row['held'] = 0
        selection = self.selector(target, exclusive_proven, skip_calling, skip_retry)
        attempt = {'content': content, 'target': target, 'selection': selection,
                   'remote': 'NOT_STARTED', 'identity': action + ':delete-attempt'}
        self.commands[action] = attempt
        if selection is None or execution_right_proven is not True:
            attempt['remote'] = 'PENDING'
            return 'PENDING', attempt
        self.sends.append(deepcopy(attempt))
        attempt['remote'] = 'UNKNOWN'
        return 'MODEL_SENT', attempt

    def feedback(self, action, attempt_identity, result, skipped, trusted_exact_response):
        if action not in self.commands:
            return 'PENDING'
        attempt = self.commands[action]
        if (attempt['identity'] != attempt_identity or attempt['selection'] is None
                or not any(x['identity'] == attempt_identity for x in self.sends)
                or trusted_exact_response is not True):
            return 'PENDING'
        row = self.records[attempt['target']]
        # Optional data may be absent when no number was skipped. A trusted
        # canonical response fixture distinguishes absence from malformed data;
        # actual raw Int/string response normalization is still not proved.
        if skipped is None and trusted_exact_response is True:
            skipped = []
        if type(result) is int and result == 0 and isinstance(skipped, list) and row['phone'] in skipped:
            attempt['remote'] = 'SKIPPED'
        elif type(result) is int and result == 0 and isinstance(skipped, list):
            attempt['remote'] = 'DELETED'
        elif type(result) is int and result == -1:
            attempt['remote'] = 'REJECTED'
        else:
            attempt['remote'] = 'UNKNOWN'
        return attempt['remote']

def normalize_failed_rows(raw):
    candidate = raw
    if isinstance(raw, str):
        try:
            candidate = json.loads(raw)
        except (ValueError, TypeError):
            return None
    return deepcopy(candidate) if isinstance(candidate, list) else None

class ImportFragmentModel:
    """Opaque trusted group/file mapping inputs; supplier stable ID still missing.

    Group-complete describes only the declared failure fragments. No whole
    import terminal/zero-failure signal is inferred. Original payloads are kept.
    """
    def __init__(self):
        self.groups = {}
        self.raw_history = []
        self.sync_success_rows = set()
        self.sync_aggregate = None
        self.whole_import_terminal = None

    def sync(self, aggregate, accurately_proven_rows=()):
        self.sync_aggregate = deepcopy(aggregate)
        self.sync_success_rows.update(accurately_proven_rows)

    def observe(self, group, file_identity, index, total, raw, exact_mapping):
        self.raw_history.append(deepcopy({'group': group, 'file': file_identity,
                                         'index': index, 'total': total, 'raw': raw}))
        rows = normalize_failed_rows(raw)
        if (not group or not file_identity or exact_mapping is not True or rows is None
                or type(index) is not int or type(total) is not int
                or not 1 <= index <= total):
            return 'PENDING'
        if group not in self.groups:
            self.groups[group] = {'file': file_identity, 'total': total,
                                  'parts': {}, 'conflict': False, 'complete': False}
        saved = self.groups[group]
        if saved['file'] != file_identity or saved['total'] != total:
            saved['conflict'] = True
            saved['complete'] = False
            return 'CONFLICT'
        if index in saved['parts']:
            if typed_content(saved['parts'][index]) != typed_content(rows):
                saved['conflict'] = True
                saved['complete'] = False
                return 'CONFLICT'
            return 'DUPLICATE'
        saved['parts'][index] = rows
        saved['complete'] = not saved['conflict'] and set(saved['parts']) == set(range(1, total + 1))
        return 'GROUP_COMPLETE_ONLY' if saved['complete'] else 'PARTIAL'

def verify_extension(save_factory=ManualSaveModel, command_factory=CommandReplayModel,
                     delete_factory=ExactDeleteModel, fragment_factory=ImportFragmentModel):
    cases = []
    def check(identifier, name, group, variant, observations):
        cases.append({'id': identifier, 'name': name, 'candidate_group': group,
                      'candidate_variant': variant, 'result': 'pass_under_stated_model_assumptions',
                      'observations': observations})
    payload = {'businessCode': 'business-A', 'leadCode': 'saved-lead-A',
               'phone': 'fixed-phone-A', 'priority': 7, 'R': None}
    save = save_factory()
    before = deepcopy(save.__dict__)
    assert save.save('confirmation-A', payload, True, abort_before_commit=True) == ('ABORTED', None)
    assert save.__dict__ == before, 'abort left partial record/batch/root/source/intent'
    _, result = save.save('confirmation-A', payload, True)
    assert all(len(values) == 1 for values in save.relations.values())
    check('EX-01', '提交前中断无部分关联，重试一份映射', 'M01', 'precommit_failure', {'relations': 5})
    state = deepcopy(save.__dict__)
    code, replay = save.save('confirmation-A', payload, True)
    assert code == 'REPLAY' and replay is result and save.__dict__ == state
    payload['priority'] = 99
    assert result['mapping']['source']['priority'] == 7
    assert save.save('confirmation-A', payload, True) == ('CONFLICT', None)
    check('EX-02', '响应丢失后同内容复用，异内容不覆盖', 'M01', 'commit_response_lost', {'intents': 1})
    commands = command_factory()
    content = {'recordId': 'failure-A', 'expectedVersion': 3, 'confirmed': True}
    code, attempt = commands.apply('action-A', content, True, 3)
    assert code == 'NEW' and commands.held == 1
    attempt['state'] = 'UNKNOWN'
    state = deepcopy(commands.__dict__)
    code, replay = commands.apply('action-A', content, True, 4)
    assert code == 'REPLAY' and replay is attempt and replay['state'] == 'UNKNOWN'
    assert commands.__dict__ == state
    check('EX-03', '升版后合法重放返原尝试当前态', 'M01', 'replay_after_version_change', {'held': 1})
    assert commands.apply('action-A', content, False, 4) == ('DENIED', None)
    bad_type = {**content, 'confirmed': 1}
    assert commands.apply('action-A', bad_type, True, 4) == ('CONFLICT', None), 'Boolean/numeric conflated'
    assert commands.apply('action-B', content, True, 4) == ('VERSION_CONFLICT', None)
    assert commands.apply('action-C', {**bad_type, 'expectedVersion': 4}, True, 4) == ('NOT_CONFIRMED', None)
    assert commands.apply('action-D', {**content, 'expectedVersion': 4}, True, 4) == ('ALREADY_PROCESSING', None)
    assert commands.__dict__ == state
    check('EX-04', '授权先行，完整内容含类型，旧版本和第二动作拒绝', 'M01',
          'denied_or_conflicting_new_command', {'attempts': 1, 'external_sends': 0})
    def fixtures(phase_a='reserved', held_a=1, used_a=0):
        return {'A': {'task': 'original-task', 'file': 'file-A', 'phone': 'same-phone',
                      'attempt': 'attempt-A', 'file_member_attempts': ['attempt-A'], 'phase': phase_a,
                      'used': used_a, 'held': held_a, 'proven_not_started': phase_a == 'reserved',
                      'local_stopped': False, 'history': ['raw-call', 'saved-root-A']},
                'B': {'task': 'original-task', 'file': 'file-B', 'phone': 'same-phone',
                      'attempt': 'attempt-B', 'file_member_attempts': ['attempt-B'], 'phase': 'ready',
                      'used': 0, 'held': 0, 'proven_not_started': True, 'local_stopped': False,
                      'history': ['saved-root-B']}}
    deletion = delete_factory(fixtures())
    other = deepcopy(deletion.records['B'])
    deletion.request('delete-A', 'A', True, True, 1, 0)
    assert deletion.records['A']['phase'] == 'cancelled' and deletion.records['A']['held'] == 0
    assert deletion.records['B'] == other and deletion.records['A']['history'] == ['raw-call', 'saved-root-A']
    check('EX-05', '定向取消先成立，只释放证明未发的原预占', 'M05',
          'cancel_linearizes_before_dispatch', {'other_same_phone_record_unchanged': True})
    for phase_a, held_a, used_a in [('started', 0, 1), ('unknown', 1, 0), ('intent', 1, 0)]:
        deletion = delete_factory(fixtures(phase_a, held_a, used_a))
        history = deepcopy(deletion.records['A']['history'])
        _, attempt = deletion.request('delete-A', 'A', True, True, 1, 0)
        for result_code in (None, 0):
            deletion.feedback('delete-A', attempt['identity'], result_code, [], True)
            assert (deletion.records['A']['used'], deletion.records['A']['held']) == (used_a, held_a)
            assert deletion.records['A']['phase'] == phase_a and deletion.records['A']['local_stopped']
            assert deletion.records['A']['history'] == history and not deletion.records['B']['local_stopped']
    check('EX-06', '实际发起或UNKNOWN后删除，不退次数或占用', 'M05',
          'dispatch_linearizes_first_or_uncertain', {'phases_checked': ['started', 'unknown', 'intent']})
    deletion = delete_factory(fixtures('started', 0, 2))
    code, attempt = deletion.request('delete-A', 'A', True, True, 1, 0)
    assert code == 'MODEL_SENT' and len(deletion.sends) == 1 and deletion.records['A']['used'] == 2
    check('EX-07', '额度已用完仍能授权定向删除', 'M05', 'quota_exhausted_delete_allowed', {'used': 2})
    state = deepcopy(deletion.__dict__)
    assert deletion.request('delete-A', 'A', True, True, 1, 0)[0] == 'REPLAY'
    assert deletion.request('delete-A', 'A', True, True, True, False) == ('CONFLICT', None)
    assert deletion.request('delete-A', 'B', True, True, 1, 0) == ('CONFLICT', None)
    assert deletion.request('delete-A', 'A', False, True, 1, 0) == ('DENIED', None)
    assert deletion.request('new-action-same-unknown-target', 'A', True, True, 1, 0) == ('ALREADY_PROCESSING', None)
    assert deletion.feedback('delete-A', 'different-attempt', 0, [], True) == 'PENDING'
    assert deletion.__dict__ == state and not deletion.records['B']['local_stopped']
    check('EX-08', '删除未知重放不外发，旧回包不套新目标', 'M05', 'delete_unknown_replay', {'model_sends': 1})
    selector = deletion.sends[0]['selection']
    assert selector == {'taskId': 'original-task', 'fileId': 'file-A', 'skipCalling': 1, 'skipRetry': 0}
    assert 'tels' not in selector and 'fileName' not in selector
    unknown = delete_factory(fixtures())
    assert unknown.request('u', 'A', True, None, 1, 0)[0] == 'PENDING' and not unknown.sends
    check('EX-09', '独占file只发task加file，未知不扩大', 'M06', 'exclusive_file_candidate', {'tels_in_request': False})
    shared = fixtures()
    shared['B']['file'] = 'file-A'
    shared['A']['file_member_attempts'] = ['attempt-A', 'attempt-B']
    shared['B']['file_member_attempts'] = ['attempt-A', 'attempt-B']
    deletion = delete_factory(shared)
    assert deletion.request('shared', 'A', True, True, 1, 0)[0] == 'PENDING'
    assert not deletion.sends and not deletion.records['B']['local_stopped']
    check('EX-10', '共享file和同号多尝试无法隔离时不调用', 'M06', 'shared_file_multiple_attempts', {'model_sends': 0})
    deletion = delete_factory(fixtures('unknown', 1, 0))
    _, attempt = deletion.request('skipped', 'A', True, True, 1, 0)
    assert deletion.feedback('skipped', attempt['identity'], 0, ['same-phone'], True) == 'SKIPPED'
    assert deletion.records['A']['held'] == 1 and not deletion.records['B']['local_stopped']
    assert deletion.feedback('skipped', attempt['identity'], False, [], True) == 'UNKNOWN'
    assert deletion.feedback('skipped', attempt['identity'], '0', [], True) == 'UNKNOWN'
    assert deletion.feedback('skipped', attempt['identity'], 0, None, True) == 'DELETED'
    assert deletion.records['A']['held'] == 1
    check('EX-11', '总体0但目标被跳过仍未删除', 'M06', 'result0_target_skipped', {'remote': 'SKIPPED', 'held': 1})
    deletion = delete_factory(fixtures('started', 0, 1))
    assert deletion.request('invalid', 'A', True, True, 1, 1)[0] == 'PENDING' and not deletion.sends
    assert deletion.request('unset', 'A', True, True, None, None)[0] == 'PENDING' and not deletion.sends
    for i, values in enumerate(((True, False), (1.0, 0.0))):
        assert deletion.request('invalid-type-' + str(i), 'A', True, True, *values)[0] == 'PENDING'
        assert not deletion.sends
    _, attempt = deletion.request('retry-test', 'A', True, True, 0, 1)
    assert deletion.feedback('retry-test', attempt['identity'], 0, [], True) == 'DELETED'
    assert deletion.records['A']['phase'] == 'started' and deletion.records['A']['used'] == 1
    assert 'native_stopped' not in deletion.records['A']
    check('EX-12', '显式skip互斥，无默认；删除不推断原生停止', 'M06', 'skip_retry_and_mutual_exclusion', {'production_skip_default': None})
    rows = [{'tel': 'synthetic-phone-A', 'reason': 'NumFmtErr'}]
    fragments = fragment_factory()
    assert fragments.observe('array-group', 'file-A', 1, 1, rows, True) == 'GROUP_COMPLETE_ONLY'
    assert fragments.observe('encoded-group', 'file-A', 1, 1, json.dumps(rows), True) == 'GROUP_COMPLETE_ONLY'
    assert fragments.groups['array-group']['parts'] == fragments.groups['encoded-group']['parts']
    for malformed in ('{', '{}', {'unapproved': 'object'}, None):
        assert fragments.observe('invalid-group', 'file-A', 1, 1, malformed, True) == 'PENDING'
    assert 'invalid-group' not in fragments.groups
    assert fragments.raw_history[0]['raw'] == rows and isinstance(fragments.raw_history[1]['raw'], str)
    failed = FailureStore()
    origin = {'tenant': 'tenant', 'task': 'task', 'saved_lead': 'lead', 'fixed_phone': 'phone', 'root': 'root'}
    for reason in ('TaskDup', 'BatchDup', 'ReqDup', 'NumFmtErr', 'BlkNum', 'CustNumNil'):
        assert failed.observe('import:' + reason, origin, reason, 0)[0] == 'PENDING_UNKNOWN_REASON'
    assert not failed.plans
    check('EX-13', '53数组和编码数组归一，坏形状不猜，不走呼叫失败计划', 'M10',
          'array_and_encoded_array', {'bad_shapes_checked': 4, 'raw_shape_preserved': True})
    fragments = fragment_factory()
    assert fragments.observe('group-A', 'file-A', 2, 3, rows, True) == 'PARTIAL'
    assert fragments.observe('group-A', 'file-A', 2, 3, json.dumps(rows), True) == 'DUPLICATE'
    assert fragments.observe('group-A', 'file-A', 1, 3, [], True) == 'PARTIAL'
    saved = deepcopy(fragments.groups)
    assert fragments.observe(None, 'file-A', 3, 3, [], True) == 'PENDING'
    assert fragments.observe('group-A', 'file-A', 3, 3, [], None) == 'PENDING'
    assert fragments.groups == saved and len(fragments.groups['group-A']['parts']) == 2
    assert fragments.observe('group-A', 'file-A', 2, 3, [], True) == 'CONFLICT'
    assert not fragments.groups['group-A']['complete']
    check('EX-14', '乱序重复幂等，无组或模糊映射待核，冲突不覆盖', 'M10',
          'out_of_order_duplicates_and_missing_group', {'part_indices': [1, 2]})
    fragments = fragment_factory()
    fragments.sync({'accepted_count': 3})
    assert fragments.sync_success_rows == set() and fragments.whole_import_terminal is None
    fragments.sync({'accepted_count': 3}, accurately_proven_rows=('record-C',))
    for i in (2, 1, 3):
        fragments.observe('group-A', 'file-A', i, 3, rows if i == 2 else [], True)
    assert fragments.groups['group-A']['complete']
    assert fragments.whole_import_terminal is None, 'failure-fragment completion invented whole-import terminal'
    assert fragments.sync_success_rows == {'record-C'}
    no_push = fragment_factory()
    no_push.sync({'accepted_count': 3})
    assert no_push.whole_import_terminal is None and not no_push.sync_success_rows
    check('EX-15', '失败片齐仅组完整，无53不等零失败，保留准确同步行证据', 'M10',
          'declared_fragments_complete_not_whole_import', {'whole_import_terminal': None})
    return cases

def extension_mutation_tests():
    """Run the same executable assertions with deliberately unsafe reducers."""
    class PartialSave(ManualSaveModel):
        def save(self, identity, content, authorized, abort_before_commit=False):
            code, result = super().save(identity, content, authorized, abort_before_commit)
            if code == 'ABORTED':
                self.relations['record'][identity] = 'partial-record'
            return code, result
    class AuthAfterReplay(CommandReplayModel):
        def apply(self, action, content, authorized, current_version):
            if action in self.commands:
                return super().apply(action, content, True, current_version)
            return super().apply(action, content, authorized, current_version)
    class UntypedCommand(CommandReplayModel):
        def apply(self, action, content, authorized, current_version):
            coerced = {**content, 'confirmed': bool(content.get('confirmed'))}
            return super().apply(action, coerced, authorized, current_version)
    class SharedFileSelector(ExactDeleteModel):
        def selector(self, target, exclusive_proven, skip_calling, skip_retry):
            selection = super().selector(target, exclusive_proven, skip_calling, skip_retry)
            if selection is None and exclusive_proven is True and (skip_calling, skip_retry) == (1, 0):
                row = self.records[target]
                return {'taskId': row['task'], 'fileId': row['file'], 'tels': row['phone'],
                        'skipCalling': skip_calling, 'skipRetry': skip_retry}
            return selection
    class SkipAsSuccess(ExactDeleteModel):
        def feedback(self, action, attempt_identity, result, skipped, trusted_exact_response):
            return super().feedback(action, attempt_identity, result, [], trusted_exact_response)
    class DeleteRefund(ExactDeleteModel):
        def feedback(self, action, attempt_identity, result, skipped, trusted_exact_response):
            status = super().feedback(action, attempt_identity, result, skipped, trusted_exact_response)
            if status == 'DELETED':
                row = self.records[self.commands[action]['target']]
                row['used'] = row['held'] = 0
            return status
    class FragmentAsTerminal(ImportFragmentModel):
        def observe(self, *args, **kwargs):
            code = super().observe(*args, **kwargs)
            if code == 'GROUP_COMPLETE_ONLY':
                self.whole_import_terminal = 'SUCCESS'
            return code
    class GuessGroup(ImportFragmentModel):
        def observe(self, group, file_identity, index, total, raw, exact_mapping):
            return super().observe(group or 'group-A', file_identity, index, total, raw, True)
    variants = [('MX-01', '提交中断留下部分记录', {'save_factory': PartialSave}),
                ('MX-02', '重放跳过当前授权', {'command_factory': AuthAfterReplay}),
                ('MX-03', 'Boolean与数字隐式转换', {'command_factory': UntypedCommand}),
                ('MX-04', '共享file加tels假装交集', {'delete_factory': SharedFileSelector}),
                ('MX-05', 'result0忽略目标跳过', {'delete_factory': SkipAsSuccess}),
                ('MX-06', '远端删除返还已用或未知占用', {'delete_factory': DeleteRefund}),
                ('MX-07', '53片齐等整个导入成功', {'fragment_factory': FragmentAsTerminal}),
                ('MX-08', '缺组身份或模糊file猜配', {'fragment_factory': GuessGroup})]
    results = []
    for identifier, policy, factory in variants:
        try:
            verify_extension(**factory)
        except AssertionError as exc:
            results.append({'id': identifier, 'unsafe_policy': policy, 'detected': True,
                            'assertion': str(exc) or 'executable expected-value assertion'})
        else:
            raise AssertionError('Mutation survived: ' + policy)
    return results


UNKNOWN = "UNKNOWN"
SHORT = "SHORT_HANGUP"
NOT_SHORT = "NOT_SHORT_HANGUP"
EMPTY = (None, None, None)


@dataclass(frozen=True)
class CallFixture:
    label: str
    trusted: bool
    binding: str = "same"  # oracle: same / unknown / different / conflict
    kind: str = "call"     # local evidence category, not a supplier event type
    facts: tuple = EMPTY  # answered, customer_active_hangup, effective_0_to_2s
    raw_status: str | None = None
    raw_sip: str | None = None

    def __post_init__(self):
        if type(self.label) is not str or not self.label or type(self.trusted) is not bool:
            raise ValueError("fixture label and explicit trust are required")
        if self.binding not in {"same", "unknown", "different", "conflict"}:
            raise ValueError("unknown fixture binding")
        if self.kind not in {"call", "sip"} or type(self.facts) is not tuple or len(self.facts) != 3:
            raise ValueError("three already-normalized facts are required")
        if any(v is not True and v is not False and v is not None for v in self.facts):
            raise ValueError("no implicit conversion of fixture truth values")
        if self.kind == "sip" and self.facts != EMPTY:
            raise ValueError("pure SIP cannot fabricate customer facts")
        if any(v is not None and type(v) is not str for v in (self.raw_status, self.raw_sip)):
            raise ValueError("raw fixture fragments must be immutable strings")


@dataclass(frozen=True)
class CallEvidenceState:
    object_key: str = "MODEL_CALL_A"  # an existing fixture object, not allocation
    context: str = "customer"  # already resolved: customer / non_customer / unknown
    accepted: tuple = ()
    weak: tuple = ()
    unresolved: tuple = ()

    def __post_init__(self):
        if type(self.object_key) is not str or not self.object_key:
            raise ValueError("an existing fixture object is required")
        if self.context not in {"customer", "non_customer", "unknown"}:
            raise ValueError("context must be independently resolved")
        if any(type(items) is not tuple or any(type(e) is not CallFixture for e in items)
               for items in (self.accepted, self.weak, self.unresolved)):
            raise ValueError("immutable fixture collections are required")


def _retain(items, evidence):
    # Canonical collection makes semantic reduction independent of arrival order.
    return tuple(sorted(items + (evidence,), key=repr))


def reduce_same_call(state, evidence):
    """Return a new immutable state; never create another call or a command."""
    if evidence in state.accepted + state.weak + state.unresolved:
        return state
    if not evidence.trusted:
        return CallEvidenceState(state.object_key, state.context, state.accepted,
                     _retain(state.weak, evidence), state.unresolved)
    if state.context != "customer" or evidence.binding != "same":
        return CallEvidenceState(state.object_key, state.context, state.accepted, state.weak,
                     _retain(state.unresolved, evidence))
    return CallEvidenceState(state.object_key, state.context,
                 _retain(state.accepted, evidence), state.weak, state.unresolved)


def view(state):
    """Preserve conflict precedence; raw status/SIP never become implied facts."""
    values = [set() for _ in range(3)]
    for evidence in state.accepted:
        if evidence.kind == "call":
            for index, value in enumerate(evidence.facts):
                if value is not None:
                    values[index].add(value)
    fact_conflict = any(len(value) > 1 for value in values)
    association_conflict = any(e.trusted and e.binding == "conflict"
                               for e in state.unresolved)
    normalized = tuple(next(iter(v)) if len(v) == 1 else None for v in values)
    if state.context != "customer" or fact_conflict or association_conflict:
        classification = UNKNOWN
    elif any(value is False for value in normalized):
        classification = NOT_SHORT
    elif all(value is True for value in normalized):
        classification = SHORT
    else:
        classification = UNKNOWN
    return {"classification": classification, "facts": normalized,
            "fact_conflict": fact_conflict,
            "association_conflict": association_conflict,
            "raw_status_evidence": tuple((e.label, e.raw_status) for e in state.accepted
                                         if e.raw_status is not None),
            "raw_sip_evidence": tuple((e.label, e.raw_sip) for e in state.accepted
                                      if e.raw_sip is not None),
            "weak_isolated": len(state.weak),
            "unresolved_binding": len(state.unresolved),
            "domain_actions": ()}


def fixture_duration_truth(value, *, seconds_and_precision_verified=False,
                           customer_effective_field_verified=False):
    """Only fixture arithmetic: no real field mapping, conversion or rounding."""
    if not seconds_and_precision_verified or not customer_effective_field_verified:
        return None
    if type(value) not in (int, float) or not math.isfinite(value) or value < 0:
        return None
    return value <= 2


def fold(fixtures, initial=CallEvidenceState()):
    state = initial
    for evidence in fixtures:
        state = reduce_same_call(state, evidence)
    return state


def verify_call_evidence_examples():
    """Executable local assertions. No module/file state or supplier operations."""
    counts = {SHORT: 0, NOT_SHORT: 0, UNKNOWN: 0}
    for facts in product((True, False, None), repeat=3):
        result = view(fold([CallFixture("truth", True, facts=facts)]))
        expected = NOT_SHORT if False in facts else SHORT if facts == (True,) * 3 else UNKNOWN
        assert result["classification"] == expected and result["domain_actions"] == ()
        counts[expected] += 1
    assert counts == {SHORT: 1, NOT_SHORT: 19, UNKNOWN: 7}

    base = CallFixture("base", True, facts=(True, None, None), raw_status="RAW_BASE")
    supplement = CallFixture("supplement", True, facts=(None, True, True), raw_status="RAW_SUPPLEMENT")
    weak_sip = CallFixture("weak-sip", False, kind="sip", raw_sip="RAW_WEAK")
    trusted_sip = CallFixture("trusted-sip", True, kind="sip", raw_sip="RAW_TRUSTED")
    partial = fold([base])
    assert reduce_same_call(partial, base) is partial  # known fixture replay is a no-op
    assert view(fold([base, weak_sip]))["facts"] == (True, None, None)
    final = fold([base, supplement, weak_sip, trusted_sip])
    assert view(final)["classification"] == SHORT
    assert view(final)["raw_status_evidence"] == (("base", "RAW_BASE"), ("supplement", "RAW_SUPPLEMENT"))
    assert view(final)["raw_sip_evidence"] == (("trusted-sip", "RAW_TRUSTED"),)
    assert final.weak == (weak_sip,) and reduce_same_call(final, weak_sip) is final
    for ordering in permutations((base, supplement, weak_sip, trusted_sip)):
        assert fold(ordering) == final  # 24 orders: no arrival-order precedence

    opposite = CallFixture("opposite", True, facts=(False, None, None), raw_status="RAW_OPPOSITE")
    for ordering in permutations((base, supplement, opposite)):
        result = view(fold(ordering))
        assert result["classification"] == UNKNOWN and result["fact_conflict"]
        assert len(result["raw_status_evidence"]) == 3 and result["domain_actions"] == ()
    false_only = CallFixture("false", True, facts=(False, None, None))
    assert view(fold([false_only, weak_sip]))["classification"] == NOT_SHORT
    # Failed scheduling/unknown execution is outside this reducer, so cannot erase false.
    binding_conflict = CallFixture("binding-conflict", True, binding="conflict")
    for ordering in permutations((false_only, binding_conflict)):
        assert view(fold(ordering))["classification"] == UNKNOWN  # overall conflict first
    for binding in ("unknown", "different"):
        unresolved = CallFixture(binding, True, binding=binding, facts=(False, False, False))
        assert fold([unresolved], final).accepted == final.accepted
        assert view(fold([unresolved], final))["classification"] == SHORT
    for context in ("non_customer", "unknown"):
        state = fold([base, supplement], CallEvidenceState(context=context))
        assert not state.accepted and view(state)["classification"] == UNKNOWN
        assert state.object_key == "MODEL_CALL_A" and view(state)["domain_actions"] == ()

    verified = {"seconds_and_precision_verified": True, "customer_effective_field_verified": True}
    assert [fixture_duration_truth(x, **verified) for x in (0, 1, 2, 3)] == [True, True, True, False]
    for invalid in (None, -1, True, "0", float("nan"), float("inf")):
        assert fixture_duration_truth(invalid, **verified) is None
    assert fixture_duration_truth(0, customer_effective_field_verified=True) is None
    assert fixture_duration_truth(0, seconds_and_precision_verified=True) is None
    for invalid_fixture in ({"kind": "sip", "facts": (True, True, True)},
                            {"facts": [True, None, None]}, {"raw_status": {"mutable": True}}):
        try:
            CallFixture("invalid", True, **invalid_fixture)
        except ValueError:
            pass
        else:
            raise AssertionError("unresolved or mutable input unexpectedly accepted")
    return {"candidate": "M08_same_call_reference_reducer", "truth_cases": 27,
            "arrival_permutations": 24, "trusted_conflict_permutations": 6,
            "association_conflict_permutations": 2,
            "checks": "local assertions only", "production_protocol_proved": False,
            "persistent_versioning_proved": False, "network_or_project_writes": False,
            "issues_closed": False, "G3_approved": False}


def main():
    paths = [ROOT / p for p in ('memory/business-rules.json', 'memory/normalized-user-stories.json',
                               'interfaces/interface-index.json', 'runtime/g2-user-approval-wiki-20261013.json',
                               'runtime/open-items.json')]
    before = {str(p.relative_to(ROOT)): sha256(p.read_bytes()).hexdigest() for p in paths}
    rules = json.loads(paths[0].read_text())['business_rules']
    stories = json.loads(paths[1].read_text())['user_stories']
    approval = json.loads(paths[3].read_text())
    ids = {x['id'] for x in rules} | {a['id'] for s in stories for a in s['acceptance_criteria']}
    ids |= {x['id'] for x in json.loads(paths[4].read_text())['items']}
    assert approval['actual_answer'] == '批准 G2，保留缺口重验 S5～S7'
    result = explore()
    cases = verify_examples()
    negatives = unsafe_counterexamples()
    extension_cases = verify_extension()
    extension_mutants = extension_mutation_tests()
    call_evidence_result = verify_call_evidence_examples()
    outline = json.loads((ROOT / 'runtime/s8-verification-case-pack-20261013.json').read_text())['prepared_internal_case_outline']
    groups = {x['id']: x for x in outline['candidate_cases']}
    for case in extension_cases:
        group = groups[case['candidate_group']]
        assert case['candidate_variant'] in {v['variant'] for v in group['variants']}
        case['source_refs'] = group['source_refs']
        case['issue_ids'] = group['issue_ids']
    assert all(x['detected'] for x in negatives)
    for case in cases + negatives:
        assert all(ref in ids for ref in case['source_refs'])
    assert before == {str(p.relative_to(ROOT)): sha256(p.read_bytes()).hexdigest() for p in paths}
    payload = {'schema_version': '1.0', 'date': '2026-10-13',
               'kind': '04_S8_derived_internal_model_validation_candidate',
               'status': 'passed_under_explicit_model_assumptions', 'model': result,
               'cases': cases, 'unsafe_policy_counterexamples': negatives,
               'extension_cases': extension_cases, 'extension_mutation_tests': extension_mutants,
               'call_evidence_examples': call_evidence_result,
               'candidate_outline_sha256': sha256(json.dumps(outline, ensure_ascii=False, sort_keys=True,
                                                             separators=(',', ':')).encode()).hexdigest(),
               'source_sha256': before, 'script_sha256': sha256(Path(__file__).read_bytes()).hexdigest(),
               'model_assumptions': ['准确事件/原记录/四元组/root与权限/供应商执行权输入来自可信证据，模型不生成或验证这些证据。',
                                     '每个模型操作作为抽象原子步；真实跨实例事务/持久化与网络边界仍需工程证明。',
                                     'physical_starts位图仅测试oracle；生产不能据本地UNKNOWN或查询为空得出该真相。',
                                     '可信已发起/未发起及下载成功证明由外部提供；模型未实现核查端点或浏览器真实下载完成。',
                                     '删除响应测试使用可信准确目标的canonical Int结果；字符串0示例与实际原始报文归一仍待验证，无生产skip默认。',
                                     '53组身份/精确file映射、1～3分片索引均为合成fixture；不是供应商已承诺的稳定字段或编号规则。',
                                     '同call样本label/信任/绑定已由外部oracle给定，补证只合并无矛盾事实；可信更正/版本/身份规则未实现。'],
               'cannot_prove': ['后端实现或生产部署正确', '供应商同号受理/唯一拨打/轮次与在途',
                                '52/53稳定身份/鉴权/重放', '实际导航降级与120秒生效',
                                '客户有效时长单位或挂断方映射', '实际供应商精准删除',
                                '真实账号权限或真实下载完成', '供应商正常三天五呼的配置/计数'],
               'production_calls': 0, 'prototype_changes': 0, 'formal_05_started': False,
               'production_issues_closed': [], 'production_risk_accepted': False, 'G3_approved': False,
               'consumer_rules': {'prototype_input': False, 'formal_backend_design': False,
                                  'verification_candidate_only': True}}
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'status': payload['status'], **result, 'case_groups': len(cases),
                      'unsafe_policies_detected': len(negatives),
                      'extension_cases': len(extension_cases), 'extension_mutants_rejected': len(extension_mutants),
                      'call_update_checks': call_evidence_result,
                      'output': str(OUTPUT)}, ensure_ascii=False))

if __name__ == '__main__':
    main()
