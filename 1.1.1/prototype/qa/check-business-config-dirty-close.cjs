/* Dirty-close regression using actual PlatformUI, CustomerBusiness and BusinessConfiguration. Only DOM, storage and application identity are represented in memory. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=process.argv[2]?path.resolve(process.argv[2]):path.resolve(__dirname,'..');
let passed=0;
const check=(condition,message)=>{assert.ok(condition,message);passed++;};
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

// Only the browser DOM is represented here. Both PlatformUI and BusinessConfiguration are actual source files.
Object.defineProperty(Element.prototype,'className',{get(){return this.getAttribute('class')||'';},set(value){this.setAttribute('class',value);}});
Element.prototype.prepend=function(child){child.parentElement=this;child.ownerDocument=this.ownerDocument;this.children.unshift(child);};
Element.prototype.click=function(){if(this.disabled)return; if(this.onclick)return this.onclick(); const script=this.getAttribute('onclick');if(script){const targetWindow=this.ownerDocument.window;targetWindow.targetNode=this;return vm.runInContext('(function(){'+script+'}).call(targetNode)',targetWindow);}};
const queryOneSelector=Element.prototype.querySelectorAll;
Element.prototype.querySelectorAll=function(selector){return [...new Set(selector.split(',').flatMap(part=>queryOneSelector.call(this,part)))];};
const priorMatches=Element.prototype.matches;
Element.prototype.matches=function(selector){
 const negatives=[...selector.matchAll(/:not\(([^)]+)\)/g)].map(item=>item[1]);
 if(negatives.some(item=>priorMatches.call(this,item)))return false;
 return priorMatches.call(this,selector.replace(/:not\([^)]+\)/g,''));
};

const realParseHTML=parseHTML;parseHTML=function(html,parent){realParseHTML(html,parent);const visit=node=>{node.classList.add=(...names)=>names.forEach(name=>node.classList.toggle(name,true));node.classList.remove=(...names)=>names.forEach(name=>node.classList.toggle(name,false));node.children.forEach(visit);};visit(parent);};

function harness(){
const scope={enterpriseId:'7522240',tenantId:'TEN-NISSAN-HQ'},state={...scope,accountId:'DIRTY_AUDIT',sessionId:'DIRTY_SESSION',activeDomain:'CLOUD_CONTACT_CENTER'};
const storage=new Map(),session=new Map(),notices=[],events={};let canManage=true;
const document={activeElement:null,addEventListener(name,fn){(events[name]||(events[name]=[])).push(fn);}};
document.body=new Element('body',{},document);
function augment(node){node.classList.add=(...names)=>names.forEach(name=>node.classList.toggle(name,true));node.classList.remove=(...names)=>names.forEach(name=>node.classList.toggle(name,false));return node;}
augment(document.body);
document.createElement=tag=>augment(new Element(tag,{},document));
document.querySelectorAll=selector=>document.body.querySelectorAll(selector);document.querySelector=selector=>document.body.querySelector(selector);document.getElementById=id=>document.body.querySelector('#'+id);
const win={console,structuredClone,Date,Map,Set,JSON,Object,String,Array,Number,Promise,document,
 crypto:require('node:crypto').webcrypto,setTimeout:()=>0,clearTimeout(){},requestAnimationFrame(){},queueMicrotask:fn=>fn(),addEventListener(){},dispatchEvent(){},getComputedStyle:node=>({zIndex:node.style.zIndex||'0'}),
 CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail;}},
 localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)},
 sessionStorage:{getItem:key=>session.get(key)??null,setItem:(key,value)=>session.set(key,String(value)),removeItem:key=>session.delete(key)},
 AppState:{get:()=>state,isReady:()=>true,isSuper:()=>canManage,canMenu:()=>true,effectiveAccess:()=>({roleCode:canManage?'SUPER_ADMIN':'AGENT',valid:canManage}),authorizeObject:(_,object)=>object?.tenantId===scope.tenantId&&object?.enterpriseId===scope.enterpriseId},
 RouteRuntime:{refreshCurrent(){}},showToast:(...args)=>notices.push(args),Pages:{}};
win.window=win;document.window=win;vm.createContext(win);
for(const file of ['mock/data.js','config/customer-intent-profile.js','mock/mapping-series-data.js','js/components/mapping-series-adapter.js','js/components/platform-ui.js','js/components/business-configuration-usage.js','js/components/business-data.js','js/components/customer-business.js','js/pages/business-categories.js'])vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),win,{filename:file});
// Parsed child nodes need normal classList methods too.
const visit=node=>{augment(node);node.children.forEach(visit);};visit(document.body);

const M=win.CustomerBusiness,P=win.BusinessConfiguration,id='qaConfigChoice';
assert.ok(M.saveField({id,label:'普通单选配置',type:'select',businessKey:'',enabled:true,options:[{id:'one',label:'原选项',businessKey:'001'}]},scope).ok,'fixture creates an ordinary current-schema select');
P.render('field');
return {win,document,scope,state,storage,session,notices,M,P,id,permission:value=>{canManage=value;},
 node:id=>document.getElementById(id),layer:()=>document.getElementById('business-configuration-editor'),
 open:()=>{P.open('field',id);return document.getElementById('business-configuration-editor');},
 key:key=>{const event={key,preventDefault(){},target:document.activeElement||document.body};for(const listener of events.keydown||[])listener(event);},
 input:(index=0)=>document.querySelectorAll('#business-field-options input')[index],
 allLayers:()=>document.querySelectorAll('.platform-layer'),
 confirm:()=>document.getElementById('business-config-discard-confirm'),
 confirmButton:()=>document.getElementById('business-config-discard-confirm-confirm')};

}

if(require.main===module){
const triggers={
  close:h=>h.P.close(),
  headerX:h=>h.layer().querySelector('.layer-header .secondary-close').click(),
  escape:h=>h.key('Escape'),
  headerBack:h=>h.layer().querySelector('.layer-header .secondary-back').click(),
  footerCancel:h=>h.layer().querySelector('.layer-footer button').click(),
  backdrop:h=>h.layer().querySelector('.layer-backdrop').onclick()
};
function changeSeries(h,value){const input=h.input();input.value=value;h.P.setOption(0,'label',value);return input;}
for(const [name,trigger] of Object.entries(triggers)){
 const h=harness(),layer=h.open(),original=h.M.getField(h.id,h.scope).options[0].label;
 const input=changeSeries(h,'尚未保存 '+name);input.focus();
 trigger(h);
 check(h.layer()===layer,name+': dirty editor remains present until an explicit discard');
 check(!!h.confirm(),name+': actual PlatformUI confirmation is shown');
 check(!h.node('unsaved-layer-discard-confirm'),name+': backdrop does not add a second generic confirmation');
 check(h.layer()._navigation.isDirty(),name+': draft is still dirty while confirmation is open');
 const confirm=h.confirm();h.P.close();check(h.confirm()===confirm,name+': repeated exit keeps the same confirmation');
 h.confirm().querySelector('.layer-footer button').click();
 check(!h.confirm()&&h.layer()===layer,name+': continue editing closes only the confirmation');
 check(h.document.activeElement===input,name+': continue editing restores the originating field focus');
 check(h.input().value==='尚未保存 '+name,name+': continue editing preserves the typed input');
 trigger(h);h.confirmButton().click();
 check(!h.layer()&&!h.confirm()&&h.allLayers().length===0,name+': confirmed discard removes the editor with no revived layer');
 check(h.M.getField(h.id,h.scope).options[0].label===original,name+': discarded draft never writes the field definition');
}
{
 const h=harness();h.open();const original=h.M.getField(h.id,h.scope).options[0].label;
 changeSeries(h,'临时改名');changeSeries(h,original);h.layer().querySelector('.layer-backdrop').onclick();
 check(!h.layer()&&!h.confirm(),'reverting all changes closes without a false positive from old DOM snapshots');
 h.P.open('field',h.id,true);h.key('Escape');
 check(!h.layer()&&!h.confirm(),'preview closes immediately without a dirty prompt');
 h.open();h.P.close();check(!h.layer()&&!h.confirm(),'an untouched edit closes immediately');
 h.P.open('field','mappingIntendedSeries');h.P.close();check(!h.layer()&&!h.confirm(),'normalizing a conditionless interface does not mark an untouched editor dirty');
}
{
 const h=harness();h.P.render('category');h.P.open('category','lead');
 const original=h.M.get('lead',h.scope).label;h.P.setBasic('label',original+' 分类草稿');
 h.P.openRelated('field');h.node('business-field-label').value='尚未保存的子字段';h.P.setBasic('label','尚未保存的子字段');const child=h.layer();
 h.layer().querySelector('.layer-footer button').click();
 check(!!h.confirm()&&h.layer()===child,'returning from a dirty child asks before discarding that child');
 h.key('Escape');check(!h.confirm()&&h.layer()===child,'Escape on the confirmation continues the same child draft');
 check(h.node('business-field-label').value==='尚未保存的子字段','Escape keeps the typed child label available for continued editing');
 h.P.close();h.confirmButton().click();
 check(!!h.node('business-category-label'),'confirmed child discard returns to the parent category');
 check(h.node('business-category-label').value===original+' 分类草稿','child discard preserves the parent category draft');
 check(h.layer()._navigation.isDirty(),'parent remains dirty after the child is discarded');
 check(!h.M.catalog(h.scope).fields.some(field=>field.label==='尚未保存的子字段'),'discarded child was not saved separately');
 h.P.close();check(!!h.confirm(),'leaving the retained parent draft requires its own confirmation');h.confirmButton().click();
 check(!h.layer()&&h.allLayers().length===0,'discarding the parent does not revive its previous layer');
 check(h.M.get('lead',h.scope).label===original,'discarding the parent leaves its saved category untouched');
}
{
 const h=harness();h.open();changeSeries(h,'保存后的名称');h.P.save();
 check(!h.layer()&&!h.confirm(),'successful standalone save bypasses discard confirmation');
 check(h.M.getField(h.id,h.scope).options[0].label==='保存后的名称','successful standalone save persists the intended definition');
 h.P.render('category');h.P.open('category','lead');h.P.openRelated('field');h.P.setBasic('label','已入库新字段');h.P.save();
 check(!!h.node('business-category-label')&&!h.confirm(),'successful child save returns directly to its parent');
 check(h.M.catalog(h.scope).fields.some(field=>field.label==='已入库新字段'),'child save writes its reusable definition once');
 h.P.save();check(!h.layer()&&!h.confirm()&&h.allLayers().length===0,'successful parent save closes with no prompt or revived draft');
}
{
 const h=harness();h.open();changeSeries(h,'第一次草稿');h.P.close();const stale=h.confirmButton().onclick;
 h.P.open('field',h.id);const next=h.layer();changeSeries(h,'第二次草稿');h.P.close();const currentConfirm=h.confirm();
 check(!!currentConfirm,'a replacement editor can open its own discard confirmation');
 stale();check(h.layer()===next&&h.confirm()===currentConfirm,'stale confirmation cannot close a new editor or its newer confirmation');
 h.confirm().querySelector('.layer-footer button').click();h.P.close();h.confirmButton().click();
 check(!h.layer()&&h.allLayers().length===0,'reopening while confirming creates no previous-layer resurrection');
}
{
 const h=harness();h.open();changeSeries(h,'确认前草稿');h.P.close();const stale=h.confirmButton().onclick,layer=h.layer();
 changeSeries(h,'确认后追加内容');stale();
 check(h.layer()===layer&&!h.confirm(),'a changed draft invalidates an older confirmation and stays open');
 check(h.input().value==='确认后追加内容','a stale confirmation preserves changes made after it opened');
 h.P.close();h.confirmButton().click();check(!h.layer(),'a fresh confirmation can still discard the changed draft');
}
{
 const h=harness();h.P.open('field');h.P.setBasic('label','重绘前草稿');h.P.close();const stale=h.confirmButton().onclick;
 h.P.setBasic('type','select');const current=h.layer();
 check(!h.confirm(),'redrawing the editor removes the now-obsolete discard confirmation');
 stale();check(h.layer()===current,'the old callback cannot close a redrawn editor');
 h.P.close();h.confirmButton().click();check(!h.layer()&&h.allLayers().length===0,'discard after redraw leaves no previous editor behind');
}
for(const kind of ['session','tenant','permission']){
 const h=harness();h.open();changeSeries(h,'失效草稿 '+kind);h.P.close();const stale=h.confirmButton().onclick;
 if(kind==='session')h.state.sessionId='REPLACED_SESSION';
 else if(kind==='tenant')h.state.tenantId='REPLACED_TENANT';
 else h.permission(false);
 h.P.render('field');
 check(!h.layer()&&!h.confirm(),kind+': identity or scope cleanup removes the owned prompt without asking to discard');
 stale();check(!h.layer()&&!h.confirm(),kind+': an invalidated callback cannot restore or close any new scope');
 if(kind!=='permission'){
  h.P.open('field',h.id);const next=h.layer();
  check(!!next,kind+': the refreshed authorized scope can open a new editor');
  changeSeries(h,'新作用域草稿');h.P.close();const newConfirm=h.confirm();stale();
  check(h.layer()===next&&h.confirm()===newConfirm,kind+': the old scope callback leaves the new editor and prompt intact');
  h.confirmButton().click();check(!h.layer()&&h.allLayers().length===0,kind+': new scope discard remains usable');
 }
}
console.log(JSON.stringify({passed,scope:'actual PlatformUI exits, nested drafts, focus restoration, save cleanup and stale discard ownership'}));

}
module.exports={harness};
