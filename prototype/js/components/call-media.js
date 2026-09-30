/** Recording review UI. Audio time comes only from HTMLMediaElement, never a demo timer. */
(function () {
  'use strict';
  const esc = value => PlatformUI.escape(value == null ? '' : String(value));
  let active = null;
  const time = value => {
    const seconds = Math.max(0, Math.floor(Number(value) || 0));
    return Math.floor(seconds / 60).toString().padStart(2, '0') + ':' + (seconds % 60).toString().padStart(2, '0');
  };
  function allowed(call) {
    return !!call && AppState.get().activeDomain === 'CLOUD_CONTACT_CENTER' && AppState.authorizeObject('', call);
  }
  function safeUrl(value) {
    if (!value || typeof value !== 'string') return '';
    // Prototype assets and explicitly supplied HTTPS URLs only; no placeholder hosts.
    if (/^assets\/audio\/[\w.-]+\.(wav|mp3|ogg|m4a)$/i.test(value)) return value;
    try {
      const url = new URL(value);
      if (url.protocol === 'https:' && !url.username && !url.password && !/(^|\.)example(\.|$)/i.test(url.hostname)) return url.href;
    } catch (_) { /* unavailable URL */ }
    return '';
  }
  function resolve(call) {
    const empty = (status, note) => ({ status, note, url: '', segments: [], transcriptStatus: '暂无通话文本' });
    if (!allowed(call)) return empty('无权查看', '当前工作范围不可查看本次通话。');
    if (call.directoryMeta?.legacyOnly) return empty('未提供录音', '历史联系记录未包含录音或转写文本，原始结果与备注保留。');
    window.CloudCallDemoTranscripts?.register(call);
    const fixture = window.CloudCallMediaFixtures?.[call.callId];
    const sample = fixture?.demo && fixture.callId === call.callId && fixture.tenantId === call.tenantId && fixture.enterpriseId === call.enterpriseId ? fixture : null;
    const simulated=call.simulation || ['NATIVE_WORKBENCH', 'LOCAL_TASK_SIMULATION'].includes(call.callSource);
    if(simulated&&!sample?.transcriptOnly)return {...empty('演示无录音', '本次本地模拟没有实际音频，也未进行语音转写。'),transcriptionGate:call.transcriptionGate||null};
    const hasResponse=Object.prototype.hasOwnProperty.call(call,'alictiRasr');
    const query=AliCtiFields.rasrRequest(call.enterpriseId,(!hasResponse&&sample?.transcriptOnly?sample.uniqueId:null)??call.uniqueId??call.alictiCdr?.raw?.uniqueId??sample?.uniqueId);
    const rawTranscript=hasResponse?call.alictiRasr:sample?.rasr;
    const transcript=!hasResponse&&rawTranscript===undefined?{status:'暂无通话文本',segments:[],raw:undefined}:query.pending.length?{status:'文本数据待核对',segments:[],issues:query.pending,raw:rawTranscript}:AliCtiFields.rasrFields(rawTranscript,{enterpriseId:call.enterpriseId,uniqueId:query.fields.uniqueId});
    const segments=transcript.segments;
    const gate=call.transcriptionGate||(sample?.transcriptionConditions?AliCtiFields.previewTranscriptionGate(sample.transcriptionConditions):null);
    const result = { url:'',status:'未提供录音',note:'尚未取得可用录音地址。',demo:!!sample&&!sample.transcriptOnly,scope:sample?.scope||call.recordingScope||'未记录',segments,transcriptStatus:transcript.status,transcript,transcriptDemo:hasResponse?call.alictiRasrMock===true:!!sample,transcriptionGate:gate,transcriptRequest:query,canRefreshTranscript:!!sample&&!sample.transcriptOnly&&!query.pending.length };
    if (simulated) return {...result,status:'演示无录音',note:''};
    if (sample&&!sample.transcriptOnly) return { ...result, url: safeUrl(sample.url), status: '演示音频', note: '合成语音与文本仅用于演示交互，不是本次真实录音；片段时长与通话时长分别展示。' };
    if (call.alictiRecording) {
      const expiresAt=call.recordingUrlExpiresAt?Date.parse(call.recordingUrlExpiresAt.replace(' ','T')):null;
      const recording=AliCtiFields.recordingFields(call.alictiRecording,{expiresAt});
      const url=safeUrl(recording.url);
      return {...result,url,status:recording.url&&!url?'录音地址待确认':recording.status==='链接已过期'?'录音链接已过期':recording.status,note:recording.expiryRule};
    }
    if (call.recordingApplicability === 'NOT_APPLICABLE_PURE_IVR') return {...result,status:'录音适用性待确认',note:'纯IVR是否提供录音以实际话单与录音接口结果为准，播放轨迹不等于转写文本。'};
    if (call.recordingApplicability === '待判定') return { ...result, status: '录音待判定', note: '录音适用范围尚未确认，请等待通话资料更新。' };
    if (['生成中', '待生成', '处理中'].includes(call.recordingStatus)) return { ...result, status: '录音生成中', note: '音频尚未就绪；文本状态独立展示。' };
    if (call.recordingStatus === '生成失败') return { ...result, status: '录音生成失败', note: '暂不能播放，请稍后重新查看。' };
    const expiry = call.recordingUrlExpiresAt ? Date.parse(call.recordingUrlExpiresAt.replace(' ', 'T')) : NaN;
    if (Number.isFinite(expiry) && expiry <= Date.now()) return { ...result, status: '录音链接已过期', note: '需取得新的有效地址后播放；本地原型不模拟获取成功。' };
    if (call.recordingStatus === '可播放') result.url = safeUrl(call.recordingUrl);
    if (result.url) return { ...result, status: '可播放', note: '' };
    return result;
  }
  function render(call) {
    const model = resolve(call);
    const transcriptLabel = (model.transcriptDemo ? '演示 · ' : '') + model.transcriptStatus;
    const transcriptReason = model.transcriptStatus === '文本获取失败'
      ? '本次查询失败，已清除上次展示；可继续收听可用录音。'
      : ['文本状态待核对','文本数据待核对'].includes(model.transcriptStatus)
        ? '本次返回暂不可用，已清除上次展示；请核对结果后重试。' : '';
    return `<section class="call-media" aria-label="录音与通话文本">
      <div class="call-media-top"><h3>通话录音</h3><span class="call-media-badge${model.demo ? ' demo' : ''}">${esc(model.status)}</span></div>
      ${model.url ? `<div class="call-media-scope">${esc(model.scope || '未记录')} ${PlatformUI.help('录音和通话文本分别展示，可播放录音、查看对话。录音覆盖范围以返回资料为准。', '录音与文本说明')}</div>
      <div class="call-media-player">
        <audio preload="metadata"${model.demo ? '' : ` src="${esc(model.url)}"`}></audio>
        <div class="call-media-main"><button type="button" class="call-media-play" aria-label="播放录音">▶</button><span class="call-media-clock"><span data-media-current>00:00</span> / <span data-media-duration>--:--</span></span><input class="call-media-seek" type="range" aria-label="录音进度" min="0" max="1" step="0.1" value="0" disabled></div>
        <div class="call-media-options"><label>倍速 <select aria-label="播放倍速"><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label><label class="call-media-volume">音量 <input type="range" aria-label="录音音量" min="0" max="1" step="0.1" value="1"></label><button type="button" class="btn-link" data-media-download disabled>下载${model.demo ? '样例' : '录音'}</button></div>
      </div><div class="call-media-feedback" role="status"><span data-media-feedback>点击播放收听</span><button type="button" class="btn-link" data-media-retry hidden>重新加载</button></div>` : ''}
      ${model.note && !model.demo && model.status !== '演示无录音' ? `<p class="call-media-note">${esc(model.note)}</p>` : ''}
      <div class="call-transcript-region"><div class="call-transcript-head"><h3>通话文本</h3>${model.segments.length ? `<span>${esc(transcriptLabel)}</span>` : ''}${model.canRefreshTranscript ? `<button type="button" class="btn-link" onclick="CloudCallMedia.refreshTranscript('${esc(call.callId)}')">刷新通话文本</button>` : ''}</div>
      ${model.transcriptionGate?'<p class="call-media-note">本通转写：'+esc(model.transcriptionGate.label)+' · '+esc(model.transcriptionGate.reason)+'</p>':''}
      <div class="call-transcript-list" aria-label="对话记录">${model.segments.length ? model.segments.map((segment, index) => {
        const speaker={'客户':['customer','客'],'坐席':['agent','席'],'机器人':['robot','机']}[segment.role]||['unknown','?'];
        return `<div class="call-transcript-row ${speaker[0]}" data-segment="${index}"><span class="call-transcript-avatar" aria-hidden="true">${speaker[1]}</span><div class="call-transcript-message"><div class="call-transcript-meta"><strong>${esc(segment.role)}</strong></div><p class="call-transcript-bubble">${esc(segment.text)}</p></div></div>`;
      }).join('') : `<div class="call-media-empty"><strong>${esc(transcriptLabel)}</strong>${transcriptReason ? `<p>${esc(transcriptReason)}</p>` : ''}</div>`}</div></div>
    </section>`;
  }
  function refreshTranscript(id){
    const call=CloudCallRuntime.call(id);if(!allowed(call))return;
    const result=AliCtiAdapter.queryRasr(call);
    if(!result.ok)return showToast(result.message,'warning');
    CloudCallMedia.lastTranscriptQuery=result;
    const parent=active?.root;
    if(parent?.isConnected&&active.call.callId===id){const old=parent.querySelector('.call-transcript-region'),template=document.createElement('template');template.innerHTML=render(call);const next=template.content.querySelector('.call-transcript-region');if(old&&next)old.replaceWith(next);}
    return result;
  }
  function destroy() {
    if (!active) return;
    const old = active; active = null;
    old.observer?.disconnect();
    old.controller?.abort();
    old.root.removeEventListener('keydown', old.keydown);
    if (old.audio) { old.audio.pause(); old.audio.removeAttribute('src'); old.audio.load(); }
    if (old.objectUrl) URL.revokeObjectURL(old.objectUrl);
  }
  function mount(root, call) {
    destroy();
    if (!root || !allowed(call)) return;
    const host = root.querySelector('.call-media');
    if (!host) return;
    const model = resolve(call), audio = host.querySelector('audio');
    const context = { root, audio, call, accountId: AppState.get().accountId, model };
    active = context;
    const valid = () => active === context && root.isConnected && allowed(call) && AppState.get().accountId === context.accountId;
    const keydown = event => { if (event.key === 'Escape') { destroy(); PlatformUI.closeLayer('cloud-call-detail'); } };
    context.keydown = keydown;
    root.addEventListener('keydown', keydown);
    if (typeof MutationObserver !== 'undefined') {
      context.observer = new MutationObserver(() => { if (!root.isConnected) destroy(); });
      context.observer.observe(document.body, { childList: true });
    }
    if (!audio) return;
    const play = host.querySelector('.call-media-play'), seek = host.querySelector('.call-media-seek');
    const feedback = host.querySelector('[data-media-feedback]'), retry = host.querySelector('[data-media-retry]');
    const download = host.querySelector('[data-media-download]');
    const loadSample = async () => {
      context.controller?.abort();
      context.controller = new AbortController();
      play.disabled = true; feedback.textContent = '正在加载演示音频…';
      try {
        // Buffer this small local sample so seeking also works on simple HTTP servers without Range support.
        const response = await fetch(model.url, { signal: context.controller.signal });
        if (!response.ok) throw new Error('sample unavailable');
        const blob = await response.blob();
        if (!valid()) return;
        if (context.objectUrl) URL.revokeObjectURL(context.objectUrl);
        context.objectUrl = URL.createObjectURL(blob); audio.src = context.objectUrl; audio.load();
        play.disabled = false; feedback.textContent = '点击播放收听';
      } catch (error) {
        if (!valid() || error.name === 'AbortError') return;
        feedback.textContent = '音频加载失败，请检查文件后重试。'; retry.hidden = false;
      }
    };
    const duration = () => Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
    const update = () => {
      if (!valid()) return;
      const total = duration(), current = audio.currentTime || 0;
      host.querySelector('[data-media-current]').textContent = time(current);
      host.querySelector('[data-media-duration]').textContent = total ? time(total) : '--:--';
      seek.max = String(total || 1); seek.value = String(current); seek.disabled = !total || !!audio.error;
      seek.setAttribute('aria-valuetext', `${time(current)} / ${time(total)}`);
      play.textContent = audio.paused ? '▶' : 'Ⅱ'; play.setAttribute('aria-label', audio.paused ? '播放录音' : '暂停录音');
      download.disabled = !total || !!audio.error;
    };
    ['loadedmetadata', 'durationchange', 'timeupdate', 'seeked', 'play', 'pause', 'ended'].forEach(name => audio.addEventListener(name, update));
    audio.addEventListener('play', () => { if (!valid()) { destroy(); return; } feedback.textContent = '正在播放'; });
    audio.addEventListener('pause', () => { if (valid() && !audio.error) feedback.textContent = audio.ended ? '播放完毕' : '已暂停'; });
    audio.addEventListener('ended', () => { if (valid()) feedback.textContent = '播放完毕'; });
    audio.addEventListener('waiting', () => { if (valid()) feedback.textContent = '正在加载音频…'; });
    audio.addEventListener('error', () => {
      if (!valid()) return;
      audio.pause(); play.disabled = true; seek.disabled = true; download.disabled = true;
      feedback.textContent = '音频加载失败，请检查文件或有效地址后重试。'; retry.hidden = false;
    });
    play.addEventListener('click', async () => {
      if (!valid()) { destroy(); return; }
      if (!audio.paused) { audio.pause(); return; }
      try { if (audio.ended) audio.currentTime = 0; await audio.play(); if (!valid()) audio.pause(); }
      catch (_) { if (valid()) { feedback.textContent = '暂时无法播放，请点击重试。'; retry.hidden = false; update(); } }
    });
    retry.addEventListener('click', () => {
      if (!valid()) return;
      if (model.demo) { retry.hidden = true; audio.pause(); loadSample(); return; }
      audio.pause(); audio.load(); play.disabled = false; retry.hidden = true;
      feedback.textContent = '已重新加载，请点击播放'; update();
    });
    seek.addEventListener('input', () => { if (valid() && duration()) { audio.currentTime = Math.min(duration(), Math.max(0, Number(seek.value))); update(); } });
    host.querySelector('[aria-label="播放倍速"]').addEventListener('change', event => { if (valid()) audio.playbackRate = Number(event.target.value); });
    host.querySelector('[aria-label="录音音量"]').addEventListener('input', event => { if (valid()) audio.volume = Number(event.target.value); });
    download.addEventListener('click', () => {
      if (!valid() || download.disabled) return;
      const link = document.createElement('a'); link.href = model.url;
      link.download = model.demo ? '合成语音样例.wav' : `通话录音-${call.callId}`;
      link.rel = 'noopener'; link.click();
    });
    update();
    if (model.demo) loadSample();
  }
  AppState.subscribe(() => {
    if (active && (!allowed(active.call) || AppState.get().accountId !== active.accountId)) { destroy(); PlatformUI.closeLayer('cloud-call-detail'); }
  });
  window.addEventListener('pagehide', destroy);
  window.CloudCallMedia = { resolve, render, mount, destroy, time,refreshTranscript };
})();
