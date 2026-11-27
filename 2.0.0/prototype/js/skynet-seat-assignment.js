(() => {
  'use strict';

  const manual = '人工外呼';
  const defaultWorkHours = Object.freeze(['09:00','20:55']);
  const shanghaiTime = new Intl.DateTimeFormat('en-GB',{
    timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  });

  function validWorkHours(range) {
    return Array.isArray(range) && range.length===2 && [range[0],range[1]].every(value=>
      typeof value==='string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) && range[0]<range[1];
  }

  function workHours(state) {
    const range = state && Object.hasOwn(state,'manualAssignmentWorkHours')
      ? state.manualAssignmentWorkHours : defaultWorkHours;
    return validWorkHours(range) ? [...range] : null;
  }

  function workWindow(state, triggeredAt=Date.now()) {
    const hours = workHours(state);
    const time = Number.isFinite(triggeredAt) && Math.abs(triggeredAt)<=8.64e15 ? shanghaiTime.format(triggeredAt) : '';
    const status = !hours || !time ? 'unavailable' : time>=hours[0] && time<=hours[1] ? 'open' : 'closed';
    return {status,time,hours};
  }
  const finished = new Set(['已完成','已归档','已结案','已撤回','已取消','已结束']);
  const strategies = {
    leastLoad:{label:'当前负载最少',metric:'当前负载'},
    leastDaily:{label:'当日接待量最少',metric:'当日成功分配轮次'},
    roundRobin:{label:'轮询',metric:'轮询顺序'},
    highestScore:{label:'按坐席评分',metric:'坐席评分'}
  };
  const filters = {
    leastLoad:strategies.leastLoad,leastDaily:strategies.leastDaily,
    highestScore:{label:'评分最高',metric:'坐席评分'}
  };
  const sharedScoreLabels = {manual:'坐席评分（人工维护）',algorithm:'坐席评分（算法）'};

  function calculateMetrics(state, task, seats) {
    const counters = new Map(seats.map(seat => [seat.id,{load:new Set(),daily:new Set()}]));
    const dayPrefix = state.today + '|';
    for (const row of state.records || []) {
      const method = row.skynet?.processing?.method || row.requiredMode || row.callMode;
      if (row.tenant !== task.tenant || row.brandId && row.brandId !== task.brandId ||
          method !== manual && row.callMode !== manual) continue;
      const round = row.skynet?.roundId || row.roundId || row.taskId;
      if (!round) continue;
      const owner = counters.get(row.ownerId);
      if (owner && method === manual && !finished.has(row.taskStatus)) owner.load.add(round);
      const ledger = row.dailyCounts || {};
      for (const [entry,count] of Object.entries(ledger)) {
        if (entry.startsWith(dayPrefix) && count?.kind === 'new' && !count.refunded) {
          counters.get(entry.slice(dayPrefix.length))?.daily.add(round);
        }
      }
      if (owner && row.assignedOn === state.today && !Object.hasOwn(ledger,dayPrefix + row.ownerId)) {
        owner.daily.add(round);
      }
    }
    return counters;
  }

  function rotate(candidates, seatOrder, cursor) {
    const start = seatOrder.findIndex(seat => seat.id === cursor) + 1;
    const order = [...seatOrder.slice(start),...seatOrder.slice(0,start)];
    const byId = new Map(candidates.map(candidate => [candidate.seatId,candidate]));
    return order.flatMap(seat => byId.has(seat.id) ? [byId.get(seat.id)] : []);
  }

  function rank(candidates, seats, strategy, cursor) {
    if (strategy === 'roundRobin') return {ranked:rotate(candidates,seats,cursor),tieBreak:'轮询'};
    const direction = strategy === 'highestScore' ? -1 : 1;
    const sorted = [...candidates].sort((left,right) => direction * (left.value - right.value));
    const tied = sorted.filter(item => item.value === sorted[0].value);
    if (tied.length < 2) return {ranked:sorted,tieBreak:'指标'};
    if (tied[0].priority != null) return {ranked:sorted,tieBreak:'优先级'};
    return {ranked:[...rotate(tied,seats,cursor),...sorted.slice(tied.length)],tieBreak:'轮询'};
  }

  function metricFor(seatId,strategy,metrics) {
    const {load,daily} = metrics.get(seatId);
    return strategy === 'leastLoad' ? load.size : daily.size;
  }

  function seatScore(state,context,seatId,legacyScores) {
    const recorded = window.DSkynetSeatScores?.record?.(state,context,seatId);
    if (recorded) {
      return {
        score:Number.isFinite(recorded.score) ? recorded.score : null,
        scoreSource:recorded.source,
        scoreSourceLabel:sharedScoreLabels[recorded.source] || '坐席评分',
        ...(recorded.updatedAt ? {scoreUpdatedAt:recorded.updatedAt} : {}),
        ...(recorded.score === null ? {scoreCleared:true} : {})
      };
    }
    const legacy = legacyScores[seatId];
    return Number.isFinite(legacy) ? {score:legacy,scoreSource:'legacy',scoreSourceLabel:'历史模板评分'} : {score:null};
  }

  function scoreEvidence(candidate) {
    const {score,scoreSource,scoreSourceLabel,scoreUpdatedAt} = candidate;
    if (!scoreSourceLabel) return {};
    return {score,scoreSource,scoreSourceLabel,...(scoreUpdatedAt ? {scoreUpdatedAt} : {})};
  }

  function unavailableScore(candidate) {
    return candidate.scoreCleared ? '坐席评分已清空' : '未配置评分';
  }

  function filterCandidates(eligible,steps,state,context,metrics,scores) {
    const stages = [];
    let remaining = eligible;
    for (const step of steps) {
      if (!remaining.length) break;
      const {label} = filters[step];
      const input = remaining;
      for (const candidate of input) {
        if (step === 'highestScore') {
          const score = seatScore(state,context,candidate.seatId,scores);
          Object.assign(candidate,score,{value:score.score});
        } else {
          candidate.value = metricFor(candidate.seatId,step,metrics);
        }
      }
      const values = input.map(candidate => candidate.value).filter(value => value !== null);
      const target = step === 'highestScore' ? Math.max(...values) : Math.min(...values);
      remaining = input.filter(candidate => candidate.value === target);
      for (const candidate of input) {
        if (candidate.value === target) continue;
        candidate.eligible = false;
        candidate.reason = step === 'highestScore' && candidate.value === null ?
          unavailableScore(candidate) : '未通过「' + label + '」筛选';
      }
      stages.push({
        step,label,inputCount:input.length,
        remaining:remaining.map(candidate => {
          const {seatId,seatName,value} = candidate;
          return {seatId,seatName,value,...(step === 'highestScore' ? scoreEvidence(candidate) : {})};
        })
      });
    }
    return {remaining,stages};
  }

  function randomSelection(candidates) {
    if (candidates.length === 1) return {ranked:candidates,tieBreak:'唯一候选'};
    const index = Math.floor(Math.random() * candidates.length);
    return {ranked:[candidates[index],...candidates.filter((_,i)=>i!==index)],tieBreak:'随机分配'};
  }

  function apply(state, context, task, config, ruleNumber, previewState) {
    const {prioritySeatIds = [],scores = {}} = config;
    const chained = Array.isArray(config.filterSteps);
    const random = chained && config.filterSteps.includes('random');
    const filterSteps = chained ? config.filterSteps.filter(step => step !== 'online' && step !== 'random') : [];
    const strategy = chained ? 'filterSteps' : config.strategy;
    const definition = chained ? {label:'逐级过滤',metric:'轮询顺序'} : strategies[strategy];
    if (!definition) return null;
    const source = previewState || state;
    const preview = Boolean(previewState);
    const actor = window.DSession.context();
    const operations = window.DReview21Operations;
    const workbench = window.DReview21Workbench;
    const result = {
      strategy,strategyLabel:definition.label,metricLabel:definition.metric,
      outcome:'pending',status:'待分配',reason:'',tieBreak:'',candidates:[],
      ...(chained ? {filterStages:[]} : {}),
      ...(preview ? {preview:true} : {})
    };
    function pending(reason) {
      result.reason = reason;
      return result;
    }
    if (task.requiredMode !== manual || !actor || actor.account.id !== context?.account?.id || actor.scope.id !== task.tenant ||
        !source.today || !operations?.canManage(actor) || !operations.canAssign(source,task) ||
        !preview && (!source.records.includes(task) || !workbench?.assign ||
          !window.DReview21?.isLatest(source))) {
      return pending('当前状态不可自动分配，请由管理员指派。');
    }

    const windowAtTrigger = workWindow(source);
    if (windowAtTrigger.status !== 'open') {
      result.workWindow = windowAtTrigger;
      return pending(windowAtTrigger.status==='closed'
        ? '非工作时间（北京时间 '+windowAtTrigger.time+'，工作时间 '+windowAtTrigger.hours.join('–')+'），等待管理员分配。'
        : '工作时间配置无法核对，等待管理员分配。');
    }

    const priority = new Map(chained ? [] : prioritySeatIds.map((id,index) => [id,index + 1]));
    const seats = (source.seats || []).filter(seat => seat.tenant === task.tenant &&
      (!seat.brandId || seat.brandId === task.brandId)).sort((left,right) =>
      (priority.get(left.id) ?? Infinity) - (priority.get(right.id) ?? Infinity) ||
      left.id.localeCompare(right.id,'en',{numeric:true}));
    const metrics = calculateMetrics(source,task,seats);
    const candidates = seats.map((seat,index) => {
      const eligibility = operations.eligibility(source,task,seat);
      const score = strategy === 'highestScore' && !eligibility ? seatScore(source,actor,seat.id,scores) : null;
      const value = chained || strategy === 'roundRobin' ? index + 1 :
        strategy === 'highestScore' ? score?.score ?? null : metricFor(seat.id,strategy,metrics);
      const reason = eligibility || (value === null ? unavailableScore(score) : '');
      return {seatId:seat.id,seatName:seat.name,eligible:!reason,reason,value,priority:priority.get(seat.id) ?? null,rank:null,
        ...(chained ? {baseEligible:!reason} : {}),...score};
    });
    let eligible = candidates.filter(candidate => candidate.eligible);
    if (chained) {
      const {remaining,stages} = filterCandidates(eligible,filterSteps,source,actor,metrics,scores);
      eligible = remaining;
      result.filterStages = stages;
      if (stages.length) result.metricLabel = filters[stages.at(-1).step].metric;
    }
    if (!eligible.length) {
      result.candidates = candidates;
      if (!seats.some(seat => source.seatModes?.[seat.id] === manual)) {
        return pending('暂无坐席登录人工外呼，任务等待符合条件的坐席上线。');
      }
      const last = result.filterStages?.at(-1);
      return pending(last ? '「' + last.label + '」筛选后没有剩余坐席，等待管理员指派。' :
        '当前没有符合策略的在线人工外呼坐席，等待管理员指派。');
    }
    const key = JSON.stringify([task.brandId,task.skynet.nurtureTemplateId,task.skynet.nurtureTemplateVersion,ruleNumber]);
    const cursor = source.skynetSeatRotation?.[key];
    const {ranked,tieBreak} = random ?
      randomSelection(eligible) : chained ?
        {ranked:rotate(eligible,seats,cursor),tieBreak:eligible.length > 1 || !filterSteps.length ? '轮询' : '唯一候选'} :
        rank(eligible,seats,strategy,cursor);
    if (random && eligible.length > 1) {
      const {seatId,seatName} = ranked[0];
      result.filterStages.push({step:'random',label:'随机分配',inputCount:eligible.length,remaining:[{seatId,seatName}]});
    }
    ranked.forEach((candidate,index) => { candidate.rank = index + 1; });
    result.candidates = [...ranked,...candidates.filter(candidate => !candidate.eligible)];
    const selected = ranked[0];
    const seat = seats.find(item => item.id === selected.seatId);
    result.tieBreak = tieBreak;
    if (!preview) {
      if (!window.DReview21.isLatest(source) || !operations.canAssign(source,task) ||
          operations.eligibility(source,task,seat)) {
        return pending('目标坐席的可分配状态已变化，任务仍待分配。');
      }
      workbench.assign(source,task,seat);
      const at = new Date().toISOString();
      task.lastCheckedAt = at;
      task.assignmentType = '自动分配';
      task.skynet.assignment = {
        roundId:task.skynet.roundId, seatId:seat.id, operatorId:actor.account.id,
        operatorName:'系统自动分配',at,mode:'automatic',strategy,
        ...(random ? {tieBreak} : {}),...scoreEvidence(selected)
      };
      if (!random) (source.skynetSeatRotation ||= {})[key] = seat.id;
    }
    return {...result,seatId:seat.id,seatName:seat.name,outcome:'assigned',status:'已自动分配',...scoreEvidence(selected),
      reason:(preview ? '预计按' : '按') + definition.label + (tieBreak === '随机分配' ? '后随机' : chained ? '结果' : '') + '分配给' + seat.name + '。'};
  }

  window.DSkynetSeatAssignment = Object.freeze({apply,workHours,validWorkHours,workWindow});
})();
