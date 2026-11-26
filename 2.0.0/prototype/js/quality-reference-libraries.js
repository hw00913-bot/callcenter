(() => {
  'use strict';

  const e = DUI.esc;
  const sharedUi = () => window.DQualityInspectionDetail;
  const access = context => window.DQualityModelConfig?.access(context);
  const day = new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'});
  const fail = error => ({ok:false,error});
  const trim = value => typeof value==='string' ? value.trim() : '';
  const range = value => Number.isInteger(value) && value>=1 && value<=100;
  const categories = ['不尊重客户','推卸责任/消极应对','不专业表述','不耐烦/催促/打断','挑衅/对立/威胁','否定/质疑客户','其他违规'];
  const sensitiveExamples = [
    ['BZZK','您自己不会吗 / 怎么还不明白',10,null],
    ['TXZR','找我也没用 / 不归我管',15,15],
    ['BZYBS','系统不会出错 / 软件不是我做的',5,5],
    ['BNF','您快一点 / 听不明白吗',10,10],
    ['TXDW','我就这态度 / 有本事就投诉',20,20],
    ['FDZY','您不懂 / 刚才已经说过了',10,10],
    ['QTWG','我不能告诉您 / 这和我没有关系',10,null]
  ];
  const questionExamples = [
    '这款车现在落地多少钱？', '实际续航能到多少公里？', '最快什么时候可以提车？', '贷款首付最低多少？',
    '这款车和同级车型有什么区别？', '各配置版本的区别是什么？', '多久需要做一次保养？', '周末可以预约试驾吗？',
    '买车送充电桩吗？', '有哪些车身颜色可以选？', '首年保险费用大概多少？', '旧车置换可以拿到什么补贴？',
    '动力电池的质保期有多长？', '购置税减免怎么计算？', '这款车支持哪些辅助驾驶功能？'
  ];
  const definitions = {
    sensitive:{id:'PAGE-21023',label:'外呼敏感词库',item:'敏感词',search:'搜索敏感词、类别编码或类别名称',
      columns:['序号','类别编码','类别名称','关键词/句式','扣分','最高扣分限制','操作']},
    faq:{id:'PAGE-21024',label:'客户问句',item:'问句',search:'搜索问句内容或编码',
      columns:['问句内容编码','问句内容','录入时间','操作']}
  };

  function samples(kind) {
    if (kind==='sensitive') return sensitiveExamples.map(([code,keywords,score,cap],index)=>
      ({id:'seed-'+code,code,category:categories[index],keywords,score,cap}));
    return questionExamples.map((question,index)=>{
      const code = 'Q'+String(index+1).padStart(3,'0');
      return {id:'seed-'+code,code,question,date:'2026-06-'+String(index+1).padStart(2,'0')};
    });
  }

  function validate(kind,input,previous) {
    const code = trim(input?.code);
    if (!code || code.length>20) return fail('请输入 1 至 20 字的编码。');
    if (kind==='faq') {
      const question = trim(input?.question);
      if (!question || question.length>100) return fail('请输入 1 至 100 字的问句。');
      return {ok:true,fields:{code,question,date:previous?.date || day.format(new Date())}};
    }

    const category = trim(input?.category);
    if (!categories.includes(category)) return fail('请选择类别名称。');
    const keywords = [...new Set(trim(input?.keywords).split(/[\/／\r\n]+/).map(trim).filter(Boolean))].join(' / ');
    if (!keywords || keywords.length>1000) return fail('请输入 1 至 1000 字的关键词或句式。');
    const score = Number(input?.score);
    if (!range(score)) return fail('扣分须为 1 至 100 的整数。');
    const cap = input?.limited ? Number(input.cap) : null;
    if (cap!==null && !range(cap)) return fail('最高扣分限制须为 1 至 100 的整数。');
    return {ok:true,fields:{code,category,keywords,score,cap}};
  }

  function validRow(kind,row) {
    if (!row || !trim(row.id)) return false;
    if (kind==='faq' && !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) return false;
    return validate(kind,{...row,limited:row.cap!==null},row).ok;
  }

  function load(kind,scope) {
    if (!Object.hasOwn(definitions,kind) || !scope) return fail('当前账号没有此质检配置的权限。');
    const key = 'd-contact-cloud-v210-review:quality-reference-v1:'+JSON.stringify([scope.brandId,scope.tenantId,kind]);
    try {
      const original = localStorage.getItem(key);
      const data = original===null ? {version:1,revision:0,rows:samples(kind)} : JSON.parse(original);
      if (data?.version!==1 || !Number.isSafeInteger(data.revision) || data.revision<0 ||
          !Array.isArray(data.rows) || !data.rows.every(row=>validRow(kind,row)) ||
          new Set(data.rows.map(row=>row.id)).size!==data.rows.length) {
        return fail('本地质检配置无法读取，请刷新后重试。');
      }
      return {ok:true,key,original,data};
    } catch (_) {
      return fail('本地质检配置无法读取，请刷新后重试。');
    }
  }

  function list(kind,context) {
    const result = load(kind,access(context));
    return result.ok ? {ok:true,rows:result.data.rows,revision:result.data.revision} : result;
  }

  function change(kind,input,context) {
    const result = load(kind,access(context));
    if (!result.ok) return result;
    const {key,original,data} = result;
    if (data.revision!==input?.revision) return fail('配置已更新，请重新打开页面后操作。');
    const rows = data.rows;
    const index = input.id ? rows.findIndex(row=>row.id===input.id) : -1;
    if (input.id && index<0) return fail('未找到这条记录，请刷新后重试。');
    if (input.remove) {
      if (index<0) return fail('请选择要删除的记录。');
      rows.splice(index,1);
    } else {
      const checked = validate(kind,input,rows[index]);
      if (!checked.ok) return checked;
      if (kind==='faq' && rows.some((row,i)=>i!==index && row.code.toUpperCase()===checked.fields.code.toUpperCase())) {
        return fail('该问句编码已存在。');
      }
      const row = {id:input.id || crypto.randomUUID(),...checked.fields};
      if (index<0) rows.unshift(row);
      else rows[index] = row;
    }

    try {
      if (localStorage.getItem(key)!==original) return fail('配置已更新，请重新打开页面后操作。');
      localStorage.setItem(key,JSON.stringify({...data,revision:data.revision+1}));
      return {ok:true};
    } catch (_) {
      return fail('无法保存本地质检配置，请重试。');
    }
  }

  function optionList(values,selection) {
    return values.map(value=>'<option value="'+e(value)+'"'+(value===selection?' selected':'')+'>'+e(value)+'</option>').join('');
  }

  function fields(kind,row) {
    if (kind==='sensitive') {
      return `<label class="field"><span>类别编码 *</span><input name="code" maxlength="20" value="${e(row?.code || '')}" required></label>
        <label class="field"><span>类别名称 *</span><select name="category" required>
          <option value="">请选择</option>${optionList(categories,row?.category)}</select></label>
        <label class="field full"><span>关键词/句式 *</span><textarea name="keywords" maxlength="1000" rows="3"
          placeholder="多个词句用 / 分隔" required>${e(row?.keywords || '')}</textarea></label>
        <label class="field"><span>扣分（分） *</span><input type="number" name="score" min="1" max="100" step="1"
          value="${e(row?.score || '')}" required></label>
        <label class="field" data-qrl-cap-field${row?.cap==null?' hidden':''}><span>最高扣分（分） *</span>
          <input type="number" name="cap" min="1" max="100" step="1" value="${e(row?.cap || '')}"${row?.cap==null?' disabled':' required'}></label>
        <div class="checkbox-row full"><label><input type="checkbox" name="limited"${row?.cap!=null?' checked':''}>
          设置最高扣分限制</label></div>`;
    }
    return `<label class="field"><span>问句内容编码 *</span><input name="code" maxlength="20" value="${e(row?.code || '')}" required></label>
      <label class="field"><span>录入时间</span><input type="date" value="${e(row?.date || day.format(new Date()))}" readonly></label>
      <label class="field full"><span>问句内容 *</span><textarea name="question" maxlength="100" rows="3"
        required>${e(row?.question || '')}</textarea><small class="field-hint" data-qrl-question-length></small></label>`;
  }

  function showError(dialog,message) {
    const target = dialog.element.querySelector('[data-qrl-error]');
    target.textContent = message;
    target.hidden = false;
  }

  function edit(kind,row,allow,refresh,revision) {
    const {item} = definitions[kind];
    const dialog = DUI.dialog((row?'编辑':'新增')+item,`<form class="form-grid">${fields(kind,row)}
      <p class="form-error full" data-qrl-error role="alert" hidden></p></form>`,[
      {label:'取消',run:close=>close()},
      {label:'保存',primary:true,run:close=>{
        if (!allow()) return showError(dialog,'页面或租户已切换，请重新操作。');
        if (!form.reportValidity()) return;
        const values = Object.fromEntries(new FormData(form));
        const result = change(kind,{...values,id:row?.id,revision});
        if (!result.ok) return showError(dialog,result.error);
        close();
        refresh();
        DUI.toast(item+'已保存。');
      }}
    ],{stack:true,dismissible:true});

    const form = dialog.element.querySelector('form');
    form.addEventListener('submit',event=>{event.preventDefault();dialog.buttons.at(-1)?.click();});
    if (kind==='sensitive') {
      const cap = form.elements.cap;
      const limited = form.elements.limited;
      limited.addEventListener('change',()=>{
        cap.closest('[data-qrl-cap-field]').hidden = !limited.checked;
        cap.disabled = !limited.checked;
        cap.required = limited.checked;
      });
    } else {
      const question = form.elements.question;
      const length = form.querySelector('[data-qrl-question-length]');
      const update = ()=>{length.textContent=question.value.length+'/100';};
      question.addEventListener('input',update);
      update();
    }
  }

  function confirmRemoval(kind,row,allow,refresh,revision) {
    const {item} = definitions[kind];
    const label = kind==='faq' ? row.question : row.category;
    const dialog = DUI.dialog('删除'+item,'<p>确定删除「'+e(label)+'」吗？</p>'+
      '<p class="form-error" data-qrl-error role="alert" hidden></p>',[
      {label:'取消',run:close=>close()},
      {label:'删除',primary:true,run:close=>{
        if (!allow()) return showError(dialog,'页面或租户已切换，请重新操作。');
        const result = change(kind,{id:row.id,revision,remove:true});
        if (!result.ok) return showError(dialog,result.error);
        close();
        refresh();
        DUI.toast(item+'已删除。');
      }}
    ],{stack:true,dismissible:true});
  }

  function searchable(row,kind) {
    return (kind==='faq'?[row.code,row.question]:[row.code,row.category,row.keywords]).join(' ').toLocaleLowerCase('zh-CN');
  }

  function rowMarkup(row,kind,index) {
    const cells = kind==='faq' ? [row.code,row.question,row.date] :
      [index,row.code,row.category,row.keywords,row.score+' 分',row.cap==null?'—':row.cap+' 分'];
    return '<tr>'+cells.map(cell=>'<td>'+e(cell)+'</td>').join('')+'<td><div class="table-actions">'+
      '<button type="button" data-qrl-edit="'+e(row.id)+'">编辑</button>'+
      '<button type="button" data-qrl-delete="'+e(row.id)+'">删除</button></div></td></tr>';
  }

  function init(kind,context) {
    const {id,item,search,columns} = definitions[kind];
    const scope = access(context);
    const root = document.querySelector('[data-qrl-page="'+kind+'"]');
    if (!scope || !root) return;
    const form = root.querySelector('form');
    const results = root.querySelector('[data-qrl-results]');
    const view = {page:1,size:10};
    const allow = () => root.isConnected && DApp.currentPage()===id && Boolean(access(context));
    let loaded;

    function draw() {
      if (!allow()) return;
      loaded = list(kind,context);
      if (!loaded.ok) {
        results.innerHTML = '<p class="form-error" role="alert">'+e(loaded.error)+'</p>';
        return;
      }
      const keyword = form.elements.keyword.value.trim().toLocaleLowerCase('zh-CN');
      const rows = loaded.rows.filter(row=>searchable(row,kind).includes(keyword));
      const navigation = sharedUi().pagination(rows.length,view);
      const from = (view.page-1)*view.size;
      results.innerHTML = `<div class="table-scroll" data-rtl-region="table" tabindex="0" aria-label="${e(item)}列表">
        <table class="platform-table"><thead><tr>${columns.map(label=>'<th scope="col">'+e(label)+'</th>').join('')}</tr></thead>
        <tbody>${rows.slice(from,from+view.size).map((row,index)=>rowMarkup(row,kind,from+index+1)).join('') ||
          '<tr><td colspan="'+columns.length+'" class="qi-empty">暂无符合条件的记录。</td></tr>'}</tbody></table>
        </div>${navigation}`;
      sharedUi().bindPagination(results,view,draw);
    }

    const filter = ()=>{view.page=1;draw();};
    form.elements.keyword.placeholder = search;
    form.addEventListener('submit',event=>{event.preventDefault();filter();});
    form.addEventListener('input',filter);
    form.addEventListener('reset',event=>{
      event.preventDefault();
      form.elements.keyword.value = '';
      filter();
    });
    root.addEventListener('click',event=>{
      if (!allow() || !loaded?.ok) return;
      const control = event.target.closest('[data-qrl-create],[data-qrl-edit],[data-qrl-delete]');
      if (!control) return;
      const rowId = control.dataset.qrlEdit || control.dataset.qrlDelete;
      const row = loaded.rows.find(entry=>entry.id===rowId);
      if (control.hasAttribute('data-qrl-create')) return edit(kind,null,allow,draw,loaded.revision);
      if (!row) return;
      if (control.hasAttribute('data-qrl-delete')) confirmRemoval(kind,row,allow,draw,loaded.revision);
      else edit(kind,row,allow,draw,loaded.revision);
    });
    draw();
  }

  window.DQualityReferenceLibraries = Object.freeze({access,list});
  window.Pages ||= {};
  for (const [kind,{id,label,item}] of Object.entries(definitions)) {
    Pages[id] = {
      render:()=>`<section class="platform-page" data-qrl-page="${kind}" data-rtl-page-type="list">
        <header class="d-page-heading" data-rtl-region="page-header"><h1>${e(label)}</h1></header>
        <form class="filter-panel" data-rtl-region="filters" aria-label="${e(label)}筛选">
          <label class="field"><span>关键词</span><input type="search" name="keyword"></label>
          <button type="reset" class="btn">重置</button>
        </form>
        <section class="table-card">
          <div class="list-toolbar" data-rtl-region="toolbar"><h2>${e(item)}列表</h2>
            <button type="button" class="btn btn-primary" data-qrl-create>新增${e(item)}</button></div>
          <div data-qrl-results></div>
        </section>
      </section>`,
      init:context=>init(kind,context)
    };
  }
})();
