/* v1.2.0 login presentation; current session and permission rules remain callbacks. */
(function () {
  'use strict';
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  function showcase(body) {
    return `<section class="auth-gateway auth-showcase" aria-label="D联络云登录"><div class="auth-showcase-shell">
      <header class="auth-showcase-header">
        <div class="auth-brand-mark"><i aria-hidden="true"></i><strong>D联络云</strong><span>产品原型</span></div>
        <div class="auth-showcase-header-note">AliCti 云联络中心</div>
      </header>
      <main class="auth-showcase-main">
        <section class="auth-showcase-panel" aria-label="产品能力展示">
          <div class="auth-showcase-copy">
            <span class="auth-showcase-eyebrow"><i></i> CUSTOMER ENGAGEMENT PLATFORM</span>
            <h2>让每一次客户联络，<br><em>都有清晰的下一步。</em></h2>
            <p>从客户线索、外呼任务和呼入分配，到坐席处理与数据分析，在同一个平台串起完整业务过程。</p>
          </div>
          <div class="auth-product-preview" aria-label="客户联络流程示意">
            <div class="auth-preview-heading"><span><i></i><i></i><i></i></span><strong>客户联络流程</strong><small>产品能力示意</small></div>
            <div class="auth-preview-flow">
              <div class="auth-preview-step"><span>01</span><b>客户线索</b><small>导入与分类</small></div>
              <div class="auth-preview-arrow" aria-hidden="true">→</div>
              <div class="auth-preview-step"><span>02</span><b>任务触达</b><small>预外呼与自动外呼</small></div>
              <div class="auth-preview-arrow" aria-hidden="true">→</div>
              <div class="auth-preview-step"><span>03</span><b>坐席处理</b><small>呼入接听与跟进</small></div>
              <div class="auth-preview-arrow" aria-hidden="true">→</div>
              <div class="auth-preview-step"><span>04</span><b>结果分析</b><small>通话与线索报表</small></div>
            </div>
            <div class="auth-preview-footer"><span>线索 · 任务 · 通话 · 结果</span><strong>业务过程清晰可追踪 <i aria-hidden="true">↗</i></strong></div>
          </div>
          <div class="auth-capability-row">
            <div><span class="auth-capability-icon cloud">呼</span><strong>呼叫服务</strong><small>预外呼、自动外呼与呼入</small></div>
            <div><span class="auth-capability-icon data">席</span><strong>坐席协同</strong><small>客户联络与通话跟进</small></div>
            <div><span class="auth-capability-icon data">数</span><strong>业务分析</strong><small>通话记录与业务报表</small></div>
          </div>
        </section>
        <div class="auth-form-panel">${body}</div>
      </main>
      <footer class="auth-showcase-footer"><span>D联络云 · 产品原型</span><span>账号登录 · 选择租户 · 进入工作区</span></footer>
    </div></section>`;
  }
  function progress(current) {
    return '<div class="auth-progress" aria-label="进入工作区步骤">'+['账号登录','选择租户','进入工作区'].map((label,index)=>(index?'<i aria-hidden="true"></i>':'')+'<span class="'+(index===current?'active':index<current?'done':'')+'">'+(index+1)+' '+label+'</span>').join('')+'</div>';
  }
  function mount(container, callbacks) {
    let mode='password', expectedCaptcha='a8Cq', captchaIndex=0, busy=false, message='';
    const options=callbacks.options();
    const initial=options.find(account=>account.username==='super-product')||options[0]||{};
    let selected=initial.id||'';
    const values={username:initial.username||'',password:initial.password||'',captcha:'a8Cq',mobile:initial.mobile||'',code:'8866'};
    const input=id=>container.querySelector('#'+id);
    const value=id=>input(id)?.value||'';
    function capture() {
      if(mode==='password') { values.username=value('authUsername');values.password=value('authPassword');values.captcha=value('authCaptcha'); }
      else { values.mobile=value('authMobile');values.code=value('authSmsCode'); }
    }
    function controls() {
      // The hint shows only a published demo fixture, never captured form input.
      const fixture=callbacks.options().find(account=>account.id===selected)||initial;
      const status='<p id="login-error" class="auth-error" role="alert"></p><p id="auth-status" class="auth-status" role="status" aria-live="polite">'+esc(message)+'</p>';
      const submit='<button class="auth-primary" id="auth-submit" type="submit">登录</button>';
      if(mode==='mobile') return `<div class="auth-method-form" id="auth-mobile-panel" role="tabpanel" aria-labelledby="auth-mobile-tab">
        <label class="auth-field" for="authMobile"><span>手机号</span><input id="authMobile" name="mobile" inputmode="numeric" value="${esc(values.mobile)}" maxlength="11" autocomplete="tel" placeholder="请输入手机号码"></label>
        <div class="auth-sms-row"><label class="auth-field" for="authSmsCode"><span>短信验证码</span><input id="authSmsCode" name="code" inputmode="numeric" value="${esc(values.code)}" maxlength="6" autocomplete="one-time-code" placeholder="请输入短信验证码"></label><button class="auth-sms-button" id="auth-send-sms" type="button">获取验证码</button></div>
        ${status}${submit}<p class="auth-demo-tip">演示手机号：${esc(fixture.mobile||'未配置')}　验证码：8866</p>
      </div>`;
      const characters=expectedCaptcha.split('').map((letter,index)=>{const tag=['span','b','em','i'][index];return '<'+tag+'>'+esc(letter)+'</'+tag+'>';}).join('');
      return `<div class="auth-method-form" id="auth-password-panel" role="tabpanel" aria-labelledby="auth-password-tab">
        <label class="auth-field" for="authUsername"><span>账号</span><input id="authUsername" name="username" value="${esc(values.username)}" autocomplete="username" placeholder="请输入账号"></label>
        <label class="auth-field" for="authPassword"><span>密码</span><input id="authPassword" name="password" type="password" value="${esc(values.password)}" autocomplete="current-password" placeholder="请输入密码"></label>
        <div class="auth-captcha-row"><label class="auth-field" for="authCaptcha"><span>图形验证码</span><input id="authCaptcha" name="captcha" value="${esc(values.captcha)}" maxlength="4" autocomplete="off" placeholder="请输入图形验证码"></label><button class="auth-captcha-code" id="auth-refresh-captcha" type="button" aria-label="刷新图形验证码，当前为 ${esc(expectedCaptcha)}" title="点击刷新验证码">${characters}</button></div>
        ${status}${submit}<p id="auth-demo-tip" class="auth-demo-tip">演示账号：${esc(fixture.username)}　密码：${esc(fixture.password)}　验证码：${esc(expectedCaptcha)}</p>
      </div>`;
    }
    function render() {
      container.innerHTML=showcase(`<div class="auth-card auth-login-card" aria-labelledby="auth-heading">
        ${progress(0)}
        <div class="auth-card-heading"><span>D联络云</span><h1 id="auth-heading">欢迎登录</h1><p>角色由认证账号在所选租户内的成员关系确定。</p></div>
        <div class="auth-method-tabs" role="tablist" aria-label="登录方式"><button id="auth-password-tab" type="button" role="tab" aria-selected="${mode==='password'}" class="${mode==='password'?'active':''}" data-login-mode="password">账号密码登录</button><button id="auth-mobile-tab" type="button" role="tab" aria-selected="${mode==='mobile'}" class="${mode==='mobile'?'active':''}" data-login-mode="mobile">手机号登录</button></div>
        <form id="demo-login" novalidate>${controls()}</form>
        <details class="demo-login-shortcut"><summary>演示工具 <span>仅原型</span></summary><p>使用已有演示账号，免手工输入账号密码。</p><button id="auth-demo-accounts" type="button" class="btn">演示账号快捷登录</button></details>
        <p class="auth-footnote">静态业务原型，不连接真实账号、AliCti或生产数据。</p>
      </div>`);
      container.querySelectorAll('[data-login-mode]').forEach(button=>{button.onclick=()=>{
        if(mode===button.dataset.loginMode)return;
        capture();mode=button.dataset.loginMode;message='';render();input('auth-'+mode+'-tab').focus();
      };});
      input('demo-login').onsubmit=event=>{
        event.preventDefault();if(busy)return;capture();
        input('login-error').textContent='';input('auth-status').textContent='';
        const button=input('auth-submit');busy=true;button.disabled=true;
        try { callbacks.submit({...values,mode,expectedCaptcha}); }
        catch(error) { const target=input('login-error');if(target)target.textContent=error.message||'登录失败，请核对输入后重试。'; }
        finally { busy=false;if(button.isConnected)button.disabled=false; }
      };
      input('auth-demo-accounts').onclick=openAccounts;
      const refresh=input('auth-refresh-captcha');
      if(refresh)refresh.onclick=()=>{
        capture();expectedCaptcha=['a8Cq','b7Kp','m4Xn'][++captchaIndex%3];
        message='本地演示图形验证码已更新为 '+expectedCaptcha+'，请重新填写。';render();input('authCaptcha').focus();
      };
      const sms=input('auth-send-sms');
      if(sms)sms.onclick=()=>{
        capture();input('login-error').textContent='';
        try { message=callbacks.sendSms(values.mobile);input('auth-status').textContent=message;input('authSmsCode').focus(); }
        catch(error) { input('auth-status').textContent='';input('login-error').textContent=error.message||'无法生成演示验证码，请核对手机号。'; }
      };
    }
    function fillAccount(account) {
      capture();selected=account.id;mode='password';values.username=account.username||'';values.password=account.password||'';values.mobile=account.mobile||'';values.code='8866';values.captcha=expectedCaptcha;
      message='已填入演示账号，请核对后点击登录。';render();input('authUsername').focus();
    }
    function openAccounts() {
      capture();
      const rows=callbacks.options(),opener=input('auth-demo-accounts');
      const layer=document.createElement('div');layer.id='demo-accounts';layer.className='platform-layer open';
      layer.innerHTML='<div class="layer-backdrop" data-close-accounts></div><section class="layer-panel small" role="dialog" aria-modal="true" aria-labelledby="demo-accounts-heading"><header class="layer-header"><div><h2 id="demo-accounts-heading">演示账号快捷登录</h2><p>选择账号填入表单，再点击登录。</p></div><button type="button" aria-label="关闭演示账号" data-close-accounts>×</button></header><div class="layer-body"><div class="demo-account-list">'+rows.map(account=>'<article class="demo-account-card"><header><div><strong>'+esc(account.name||account.username)+'</strong><span>账号：'+esc(account.username)+'</span></div><button type="button" class="btn" data-fill-account="'+esc(account.id)+'" aria-label="填入账号 '+esc(account.username)+'">填入账号</button></header><div class="demo-account-membership"><div class="demo-account-tenant"><strong>'+esc(account.label||'演示身份')+'</strong><span class="demo-account-role">当前授权</span></div>'+(account.mobile?'<p>演示手机号：'+esc(account.mobile)+'</p>':'')+'</div></article>').join('')+'</div></div><footer class="layer-footer"><p class="demo-boundary">仅本地演示，不新增账号或权限。选择只填入凭据，登录后按当前授权进入租户或管理范围。</p><button class="btn" type="button" data-close-accounts>取消</button></footer></section>';
      input('demo-login').closest('.auth-showcase').appendChild(layer);
      const close=()=>{layer.remove();if(opener.isConnected)opener.focus();};
      layer.querySelectorAll('[data-close-accounts]').forEach(button=>{button.onclick=close;});
      layer.querySelectorAll('[data-fill-account]').forEach(button=>{button.onclick=()=>{
        const account=callbacks.options().find(row=>row.id===button.dataset.fillAccount);
        if(!account) { close();input('login-error').textContent='此演示账号已停用或不存在，请重新打开登录页。';return; }
        layer.remove();fillAccount(account);
      };});
      layer.onkeydown=event=>{
        if(event.key==='Escape') { event.preventDefault();close(); }
        if(event.key==='Tab') {
          const buttons=Array.from(layer.querySelectorAll('button:not([disabled])'));
          if(event.shiftKey&&document.activeElement===buttons[0]) {event.preventDefault();buttons[buttons.length-1].focus();}
          else if(!event.shiftKey&&document.activeElement===buttons[buttons.length-1]) {event.preventDefault();buttons[0].focus();}
        }
      };
      layer.querySelector('[aria-label="关闭演示账号"]').focus();
    }
    render();
  }
  function mountScope(container,callbacks) {
    const account=callbacks.account||{},scopes=callbacks.scopes||[];
    container.innerHTML=showcase(`<div class="auth-card auth-choice-card" aria-labelledby="auth-heading">
      ${progress(1)}
      <div class="auth-card-heading"><span>D联络云 · ${esc(account.name)}</span><h1 id="auth-heading">选择本次进入的租户</h1><p>${esc(account.platform?.role==='super'?'选择租户后进入系统，超管身份保持不变。':'请选择本次使用的租户，按已有授权进入系统。')}</p></div>
      <div class="auth-choice-list">${scopes.map(scope=>'<button type="button" class="auth-choice-row" data-login-scope="'+esc(scope.id)+'"><span class="auth-choice-icon">'+(scope.kind==='platform'?'管':scope.tenant?.organization==='总部'?'总':'店')+'</span><div><strong>'+esc(scope.label)+'</strong><small>'+esc(scope.kind==='platform'?'平台管理范围':scope.tenant?.organization||'业务租户')+' · '+esc(scope.kind==='platform'?account.label||'当前管理身份':({admin:'租户管理员',operator:'租户运营',reader:'只读成员',seat:'电话坐席'}[scope.grant?.role]||account.label||'当前成员'))+'</small></div><em>进入平台</em></button>').join('')}</div>
      ${scopes.length?'':'<p>暂无可用租户，请联系管理员。</p>'}
      <p id="scope-error" class="auth-error" role="alert"></p><button class="auth-link" id="switch-account" type="button">返回账号登录</button>
    </div>`);
    const error=()=>container.querySelector('#scope-error');
    container.querySelectorAll('[data-login-scope]').forEach(button=>{button.onclick=()=>{
      error().textContent='';button.disabled=true;
      try {callbacks.choose(button.dataset.loginScope);}
      catch(failure) {if(error())error().textContent=failure.message||'无法进入该租户，请重试。';}
      finally {if(button.isConnected)button.disabled=false;}
    };});
    container.querySelector('#switch-account').onclick=()=>{
      try {callbacks.back();}catch(failure) {if(error())error().textContent=failure.message||'无法返回登录，请重试。';}
    };
  }
  window.DLoginScreen={mount,mountScope};
})();
