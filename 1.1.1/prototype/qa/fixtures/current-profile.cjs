/* Reusable current-schema DOM/VM fixture; all product modules load the actual Mapping configuration. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(process.argv[2] || path.join(__dirname,'../..'));
const copy=value=>structuredClone(value);
const encode=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const decode=value=>String(value).replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const dataKey=name=>name.slice(5).replace(/-([a-z])/g,(_,char)=>char.toUpperCase());
class Element {
  constructor(tag, attributes = {}, document = null) {
    this.tagName = tag.toUpperCase(); this.attributes = {}; this.dataset = {}; this.children = []; this.parentElement = null;
    this.ownerDocument = document; this.style = {}; this._text = ''; this._hidden = false; this.value = ''; this.disabled = false;
    for (const [name, value] of Object.entries(attributes)) this.setAttribute(name, value);
    this.classList = {contains: name => (this.getAttribute('class') || '').split(/\s+/).includes(name), toggle: (name, force) => {
      const classes = new Set((this.getAttribute('class') || '').split(/\s+/).filter(Boolean));
      if (force === undefined ? !classes.has(name) : force) classes.add(name); else classes.delete(name);
      this.setAttribute('class', [...classes].join(' '));
    }};
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name.startsWith('data-')) this.dataset[dataKey(name)] = String(value);
    if (name === 'hidden') this._hidden = true;
    if (name === 'value') this.value = String(value);
    if (name === 'disabled') this.disabled = true;
    if (name === 'tabindex') this.tabIndex = Number(value);
  }
  getAttribute(name) { if (name === 'hidden') return this.hidden ? '' : null; return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null; }
  hasAttribute(name) { return this.getAttribute(name) !== null; }
  removeAttribute(name) {
    delete this.attributes[name];
    if (name.startsWith('data-')) delete this.dataset[dataKey(name)];
    if (name === 'hidden') this._hidden = false;
    if (name === 'disabled') this.disabled = false;
  }
  get hidden() { return this._hidden; }
  set hidden(value) { this._hidden = !!value; if (value) this.attributes.hidden = ''; else delete this.attributes.hidden; }
  get id() { return this.attributes.id || ''; }
  set id(value) { this.setAttribute('id', value); }
  get isConnected() { return this === this.ownerDocument?.body || !!this.parentElement?.isConnected; }
  appendChild(child) { child.parentElement = this; child.ownerDocument = this.ownerDocument; this.children.push(child); return child; }
  contains(node) { return this === node || this.children.some(child => child.contains(node)); }
  remove() { if (this.parentElement) { const parent = this.parentElement; parent.children.splice(parent.children.indexOf(this), 1); this.parentElement = null; } }
  matches(selector) {
    return selector.split(',').some(part => {
      const text = part.trim();
      const tag = text.match(/^[a-z][\w-]*/i)?.[0];
      if (tag && this.tagName !== tag.toUpperCase()) return false;
      const id = text.match(/#([\w-]+)/)?.[1]; if (id && this.id !== id) return false;
      for (const [, name] of text.matchAll(/\.([\w-]+)/g)) if (!this.classList.contains(name)) return false;
      for (const [, name, double, single, bare] of text.matchAll(/\[([^\s=\]]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\]]+)))?\]/g)) {
        const expected = double ?? single ?? bare;
        if (!this.hasAttribute(name) || expected !== undefined && this.getAttribute(name) !== expected) return false;
      }
      return true;
    });
  }
  closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; }
  querySelectorAll(selector) {
    const parts = selector.trim().split(/\s+(?![^\[]*\])/), last = parts.pop(), result = [];
    const visit = node => { for (const child of node.children) {
      if (child.matches(last)) {
        let ancestor = child.parentElement, index = parts.length - 1;
        while (ancestor && index >= 0) { if (ancestor.matches(parts[index])) index--; ancestor = ancestor.parentElement; }
        if (index < 0) result.push(child);
      }
      visit(child);
    }};
    visit(this); return result;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  focus() { if (!this.closest('[hidden]')) this.ownerDocument.activeElement = this; }
  scrollIntoView() {}
  addEventListener() {}
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  set textContent(value) { this._text = String(value); this.children.forEach(child => { child.parentElement = null; }); this.children = []; }
  set innerHTML(html) { this.children.forEach(child => { child.parentElement = null; }); this.children = []; parseHTML(String(html), this); }
  set outerHTML(html) {
    const parent = this.parentElement; if (!parent) return;
    const holder = new Element('fragment', {}, this.ownerDocument); parseHTML(String(html), holder);
    const index = parent.children.indexOf(this); this.parentElement = null;
    parent.children.splice(index, 1, ...holder.children); holder.children.forEach(child => { child.parentElement = parent; });
  }
}
function parseHTML(html, parent) {
  const stack = [parent], voidTags = new Set(['input','br','hr','img','meta','link','area','base','embed','source','wbr']);
  for (const token of html.match(/<!--[\s\S]*?-->|<[^>]*>|[^<]+/g) || []) {
    if (token.startsWith('<!--')) continue;
    if (token.startsWith('</')) { if (stack.length > 1) stack.pop(); continue; }
    if (token.startsWith('<')) {
      const tag = token.match(/^<([\w-]+)/)?.[1]; if (!tag) continue;
      const attributes = {};
      const text = token.slice(tag.length + 1, -1);
      for (const [, name, double, single, bare] of text.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attributes[name] = decode(double ?? single ?? bare ?? '');
      const node = new Element(tag, attributes, parent.ownerDocument); stack.at(-1).appendChild(node);
      if (!voidTags.has(tag.toLowerCase()) && !token.endsWith('/>')) stack.push(node);
    } else stack.at(-1)._text += decode(token);
  }
}

function harness(options={}){
  const scope={enterpriseId:'7522240',tenantId:'TEN-NISSAN-HQ'},state={...scope,accountId:'CURRENT_FORM_AGENT',sessionId:'CURRENT_FORM_SESSION',activeDomain:'CLOUD_CONTACT_CENTER'};
  const storage=new Map(options.storage || []),session=new Map(options.session || []),notices=[],writes=[],storageReads=[];
  let valid=true,authorized=true,call=null,values=null,layer=null,managerHtml='';
  const document={activeElement:null,addEventListener(){}};document.body=new Element('body',{},document);
  document.createElement=tag=>new Element(tag,{},document);
  document.querySelectorAll=selector=>document.body.querySelectorAll(selector);document.querySelector=selector=>document.body.querySelector(selector);document.getElementById=id=>document.body.querySelector('#'+id);
  const win={console,structuredClone,Date,Map,Set,JSON,Object,String,Array,Number,Promise,document,
    crypto:require('node:crypto').webcrypto,setTimeout:()=>0,clearTimeout(){},requestAnimationFrame(){},addEventListener(){},dispatchEvent(){},
    CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail;}},
    fetch(){throw Error('external network prohibited');},XMLHttpRequest:function(){throw Error('external network prohibited');},
    localStorage:{getItem:key=>{storageReads.push(key);return storage.get(key)??null;},setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)},
    sessionStorage:{getItem:key=>session.get(key)??null,setItem:(key,value)=>session.set(key,String(value)),removeItem:key=>session.delete(key)},
    AppState:{get:()=>state,isReady:()=>true,isSuper:()=>true,canMenu:()=>true,effectiveAccess:()=>({roleCode:'SUPER_ADMIN',valid}),authorizeObject:(_,object)=>authorized&&object?.tenantId===scope.tenantId&&object?.enterpriseId===scope.enterpriseId},
    PlatformUI:{escape:encode,status:()=>'',empty:encode,pageHeader:(title,note)=>'<h1>'+encode(title)+'</h1><p>'+encode(note)+'</p>',toolbar:(left,right)=>left+right,table:()=>'',
      openLayer(id,html){managerHtml=html;this.closeLayer(id);const node=new Element('section',{id,class:'platform-layer'},document);document.body.appendChild(node);node.innerHTML=html;},
      closeLayer(id){document.getElementById(id)?.remove();}},
    CustomerDirectory:{phoneOf:row=>row?.customerPhone,list:()=>[],sync(){}},CallState:{view:row=>({answered:row.answered})},
    RouteRuntime:{refreshCurrent(){}},showToast:(...args)=>notices.push(args),Pages:{'cloud-call-records':{openCall(){}}}};
  win.setTimeout=fn=>{queueMicrotask(fn);return 0;};
  win.window=win;vm.createContext(win);
  const files=['mock/data.js','config/customer-intent-profile.js','mock/mapping-series-data.js','js/components/mapping-series-adapter.js','js/components/business-configuration-usage.js','js/components/business-data.js','js/components/customer-business.js','js/components/business-interface-field.js','js/components/customer-followup.js','js/pages/business-categories.js'];
  for(const file of files)vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),win,{filename:file});
  const C=win.CustomerFollowup,M=win.CustomerBusiness;
  if(options.generic)require('./current-generic.cjs').install(win,{scope});
  if(options.normalChoice){
    const result=M.saveField({id:'qaChoice',label:'普通单选测试项',type:'select',businessKey:'CHOICE_FIELD',enabled:true,options:[{id:'choice-a',label:'原名称甲',businessKey:'CHOICE-001'},{id:'choice-b',label:'原名称乙',businessKey:'CHOICE-002'}]},scope);
    if(!result.ok)throw Error(result.message);
    const category=M.get('lead',scope);category.fields.push({fieldId:'qaChoice',enabled:true,required:false});const saved=M.save(category,scope);if(!saved.ok)throw Error(saved.message);
  }
  win.AgentWorkbench={setFollowup(id,value){const next=C.update(values,call,id,value);if(next){values=next;writes.push([id,value]);}}};
  function mount(next={},initial={},handler='AgentWorkbench.setFollowup'){
    call={...scope,accountId:state.accountId,callId:'current-form-live',customerPhone:'13800000888',externalDocumentId:'CURRENT_FORM_DOC',businessType:'lead',callSource:'NATIVE_WORKBENCH',processingStatus:'待填写',endedAt:'2026-10-19 15:00:00',direction:'呼出',callType:'人工外呼',answered:true,...next};
    if(options.bind!==false && !Object.hasOwn(call,'businessFormVersion')){const bound=C.bindCallForm(call);if(!bound.ok)throw Error(bound.message);}
    if(!win.CloudCallData.calls.some(row=>C.identity(row)===C.identity(call)))win.CloudCallData.calls.push(call);
    values={...C.empty(call),...copy(initial)};
    const html=C.form(values,call,'seat-followup',handler);layer?.remove();layer=new Element('section',{class:'platform-layer'},document);document.body.appendChild(layer);layer.innerHTML=html;return html;
  }
  const form=()=>document.querySelectorAll('[data-followup-tabs]').find(node=>node.dataset.followupPrefix==='seat-followup');
  const button=()=>form()?.querySelector('[data-followup-import-action]');
  const field=()=>options.normalChoice?M.getField('qaChoice',call):M.mappingSeriesField(call,'lead');
  function change(value,id=field().id){const node=document.getElementById('seat-followup-'+id);node.value=value;win.eventNode=node;vm.runInContext('(function(){'+node.getAttribute('onchange')+'}).call(eventNode)',win);delete win.eventNode;}
  function saved(id,raw,time,extra={}){
    const next={...call,...extra,callId:id};delete next.businessFormVersion;delete next.businessFormType;const bound=C.bindCallForm(next);if(!bound.ok)throw Error(bound.message);next.customerFollowup={...C.empty(next),...raw,updatedAt:time};next.customerFollowup.businessFieldSnapshot=M.callbackSnapshot(next.customerFollowup,next);return next;
  }
  mount();
  return {win,C,M,state,scope,storage,session,storageReads,notices,writes,mount,form,button,field,change,saved,document,get call(){return call;},get values(){return values;},get managerHtml(){return managerHtml;},setValid:value=>{valid=value;},setAuthorized:value=>{authorized=value;}};
}

module.exports={harness,copy,encode,Element};
