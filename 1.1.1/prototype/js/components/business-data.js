/** v1.1.1 本地模拟业务数据。无真实网络、凭据或生产接口契约。 */
(function (root) {
  'use strict';
  const storageKey = 'business-data-dictionary-v111-current', storageVersion=1;
  // Integration-owned declarations describe the inputs of each prebuilt capability.
  // Dictionary administrators name and authorize entries; they do not edit adapter configuration.
  const returned = (key,label,valueType,valueDomain,valueDomainLabel) => Object.freeze({key,label,valueType,valueDomain,valueDomainLabel});
  const seriesReturnFields = Object.freeze([
    returned('code','编码','string','demo.catalog-series-code','目录车系编码'),
    returned('name','名称','string','business.series-name','车系名称'),
    returned('type','体系','string','demo.vehicle-system','车辆体系')
  ]);
  const storeReturnFields = Object.freeze([
    returned('code','编码','string','demo.store-code','门店编码'),
    returned('name','名称','string','business.store-name','门店名称'),
    returned('type','体系','string','demo.vehicle-system','车辆体系')
  ]);
  const mappingReturnFields=Object.freeze([
    returned('code','官方ID','string','mapping.official-series-id','Mapping官方车系ID'),
    returned('name','车系名称','string','business.series-name','车系名称'),
    returned('relation_id','原始官方ID','number','mapping.official-series-id','Mapping官方车系ID'),
    returned('car_state','原始状态','number','mapping.car-state','Mapping原始车系状态'),
    returned('media_car_series_id','媒体车系ID','string','mapping.media-series-id','Mapping媒体车系ID')
  ]);
  const capabilities = Object.freeze([
    Object.freeze({id:'series',label:'车系查询',kind:'series',selectionMode:'single',returnFields:seriesReturnFields,queryConditions:Object.freeze([])}),
    Object.freeze({id:'stores',label:'专营店查询',kind:'store',selectionMode:'multiple',returnFields:storeReturnFields,queryConditions:Object.freeze([
      Object.freeze({key:'seriesCode',label:'车系',required:false,sourceKind:'series',sourceCardinality:'single',valueKey:'code',valueType:'string',valueDomain:'demo.catalog-series-code',valueDomainLabel:'目录车系编码',help:'可按关联字段的车系编码查询门店；不使用其他字段时，查询当前租户全部可用门店。'})
    ])}),
    Object.freeze({id:'mapping-series',label:'Mapping车系编码查询',kind:'series',selectionMode:'single',returnFields:mappingReturnFields,queryConditions:Object.freeze([]),defaultParams:Object.freeze({media_id:10,car_state:1})})
  ]);
  const clone = value => JSON.parse(JSON.stringify(value));
  const text = value => String(value == null ? '' : value);
  const unique = values => [...new Set(values)];
  const fail = message => ({ok:false,message});
  const success = (message, row) => ({ok:true,message,...(row ? {row:clone(row)} : {})});
  const env = {query:'normal',saveFail:false};
  let demoSource = 'standard', dccScenario = 'normal', demoSourceEpoch = 0, mappingScenario='normal', mappingEpoch=0;
  // Keep the original source token until a profile is explicitly switched.
  // A monotonic epoch prevents values from reviving after a DCC -> standard round trip.
  Object.defineProperty(env,'source',{enumerable:true,get:()=>demoSource,set:value=>{
    const next = String(value); if(next!==demoSource){demoSource=next;demoSourceEpoch++;}
  }});
  Object.defineProperty(env,'dccScenario',{enumerable:true,get:()=>dccScenario,set:value=>{
    const next=String(value);if(next!==dccScenario){dccScenario=next;if(demoSource==='dcc')demoSourceEpoch++;}
  }});
  Object.defineProperty(env,'mappingScenario',{enumerable:true,get:()=>mappingScenario,set:value=>{
    const next=String(value);if(next!==mappingScenario){mappingScenario=next;mappingEpoch++;}
  }});
  function demoProfile() {
    return demoSource === 'dcc' ? {id:'dcc',label:'DCC v2返回结构模拟（全虚构）',
      missingFields:['group','businessType','status','phone'],
      note:'NEV按车系匹配；ICE返回来源内全部可用门店。真实契约待核验。'} : {id:demoSource};
  }
  function mappingDemoRows() { return (root.MappingSeriesMock?.rows?.() || []).map(row=>({code:String(row.relation_id),name:row.name})); }
  function demoRows(source = demoSource) {
    const retained=source==='dcc' ? [...(root.DccBusinessMock?.series?.() || []),...(root.DccBusinessMock?.stores?.() || [])] : [...seriesSeed,...storeSeed];
    return [...retained,...mappingDemoRows()];
  }

  let lastError = '';
  const seriesSeed = [
    {code:'NEV-A',name:'NEV 演示车系 A',type:'NEV'},
    {code:'NEV-B',name:'NEV 演示车系 B',type:'NEV'},
    {code:'ICE-A',name:'ICE 演示车系 A',type:'ICE'}
  ];
  // Location, contact and organization details are fictional picker examples,
  // not a verified contract for the production store interface.
  const storeSeed = [
    {code:'N01',name:'NEV 演示专营店一',type:'NEV',province:'广东省',city:'广州市',district:'天河区',address:'广州市天河区模拟大道 101 号（虚构）',group:'华南一组',businessType:'零售交付中心',status:'启用',phone:'020-00000001'},
    {code:'N02',name:'NEV 演示专营店二',type:'NEV',province:'广东省',city:'深圳市',district:'南山区',address:'深圳市南山区模拟大道 202 号（虚构）',group:'华南二组',businessType:'专营店',status:'启用',phone:'0755-00000002'},
    {code:'N03',name:'NEV 演示专营店三',type:'NEV',province:'北京市',city:'北京市',district:'朝阳区',address:'北京市朝阳区模拟大道 303 号（虚构）',group:'华北一组',businessType:'零售交付中心',status:'启用',phone:'010-00000003'},
    {code:'I01',name:'ICE 演示专营店一',type:'ICE',province:'广东省',city:'广州市',district:'白云区',address:'广州市白云区模拟大道 401 号（虚构）',group:'华南一组',businessType:'专营店',status:'启用',phone:'020-00000004'}
  ];
  const storeRelations = {'NEV-A':['N01','N02'],'NEV-B':['N02','N03'],'ICE-A':['I01']};
  const upstreamNames = Object.create(null);
  function tenants() {
    const data = root.CloudCallData || {};
    return (data.tenants || []).filter(row => !row.builtIn && row.status === '启用' &&
      (row.capabilitySet || []).includes('CLOUD_CONTACT_CENTER') &&
      (data.instances || []).some(instance => instance.enterpriseId === row.enterpriseId && instance.status === 'RUNNING'))
      .map(row => ({tenantId:row.tenantId,enterpriseId:row.enterpriseId,name:row.name}));
  }
  function canManage() {
    return root.HistorySnapshot?.read_only !== true && root.AppState?.isReady?.() === true &&
      root.AppState?.isSuper?.() === true && root.AppState?.canMenu?.('system.applications') === true;
  }
  function mappingEntry() {return {id:'d-mapping-series',name:'Mapping意向车系',capabilityId:'mapping-series',tenantIds:tenants().map(row=>row.tenantId),enabled:true,sourceRevision:0,tenantRevisions:{}};}
  function defaults() { return {version:storageVersion,revision:0,entries:[mappingEntry()]}; }
  function load() {
    try {
      const raw = root.localStorage.getItem(storageKey);
      const data = raw === null ? defaults() : JSON.parse(raw);
      const ids = new Set(), names = new Set();
      if (!data || data.version !== storageVersion || !Number.isSafeInteger(data.revision) || !Array.isArray(data.entries)) throw Error('invalid');
      for (const row of data.entries) {
        if (!row || !/^d-[a-zA-Z0-9_-]+$/.test(row.id) || ids.has(row.id) ||
          typeof row.name !== 'string' || !row.name.trim() || row.name.length > 60 || names.has(row.name.toLocaleLowerCase()) ||
          !capabilities.some(cap => cap.id === row.capabilityId) || typeof row.enabled !== 'boolean' ||
          !Array.isArray(row.tenantIds) || row.tenantIds.some(id => typeof id !== 'string') || unique(row.tenantIds).length !== row.tenantIds.length ||
          !Number.isSafeInteger(row.sourceRevision) || row.sourceRevision < 0 || !row.tenantRevisions || typeof row.tenantRevisions !== 'object' ||
          Object.values(row.tenantRevisions).some(value => !Number.isSafeInteger(value) || value < 0)) throw Error('invalid');
        ids.add(row.id); names.add(row.name.toLocaleLowerCase());
      }
      lastError = '';
      return {ok:true,data,raw};
    } catch (_) {
      lastError = '业务数据接口配置暂时无法读取，请刷新后重试；已保存的资料不会被覆盖。';
      return fail(lastError);
    }
  }
  function entries() { const saved = load(); return saved.ok ? clone(saved.data.entries) : []; }
  function managementContext() {const s=root.AppState?.get?.()||{},a=root.AppState?.effectiveAccess?.()||{};return JSON.stringify([s.accountId,s.sessionId,s.enterpriseId,s.tenantId,s.activeDomain,a.roleCode,a.valid,root.HistorySnapshot?.read_only===true]);}
  function catalogState() {
    const saved=load(),context=managementContext();
    return saved.ok?{ok:true,explicit:saved.raw!==null,revision:saved.data.revision,entries:clone(saved.data.entries),context}:{ok:false,explicit:null,revision:null,entries:[],context,message:saved.message};
  }
  function entry(id) { return entries().find(row => row.id === id) || null; }
  function capability(id) { const row = capabilities.find(row => row.id === id); return row ? clone(row) : null; }
  function scopeTenant(scope) {
    if (!scope || typeof scope.tenantId !== 'string' || typeof scope.enterpriseId !== 'string') return null;
    return tenants().find(row => row.tenantId === scope.tenantId && row.enterpriseId === scope.enterpriseId) || null;
  }
  function available(id, scope) {
    const row = entry(id), tenant = scopeTenant(scope), app = root.AppState;
    return !!(row?.enabled && tenant && row.tenantIds.includes(tenant.tenantId) &&
      app?.isReady?.() === true && app?.effectiveAccess?.().valid === true &&
      app?.get?.().activeDomain === 'CLOUD_CONTACT_CENTER' && app?.authorizeObject?.('',tenant) === true);
  }
  function sourceVersion(id, scope) {
    const row = entry(id);
    if(row?.capabilityId==='mapping-series')return scopeTenant(scope) ? JSON.stringify([row.id,row.sourceRevision,scope.enterpriseId,scope.tenantId,row.tenantRevisions[scope.tenantId] || 0,'mapping-series',mappingEpoch]) : '';
    return row && scopeTenant(scope) ? JSON.stringify([row.id,row.sourceRevision,scope.enterpriseId,scope.tenantId,row.tenantRevisions[scope.tenantId] || 0,...(demoSourceEpoch || demoSource!=='standard' ? ['demo-source',demoSource,demoSourceEpoch] : [])]) : '';
  }
  function usage(id,scope) {return root.BusinessConfigurationUsage?.inspect?.({kind:'interface',id,scope:scope||null})||{ok:false,canDelete:false,code:'USAGE_UNAVAILABLE',reason:'使用关系尚未就绪，请刷新后重试',refs:[],fingerprint:'',token:null};}
  function capabilityEditReview(id,scope) {
    const actorScope = root.AppState?.get?.() || {};
    const currentScope = root.CustomerBusiness?.canManage?.() === true && scopeTenant(actorScope) ? {enterpriseId:actorScope.enterpriseId,tenantId:actorScope.tenantId} : null;
    return usage(id,scope || currentScope);
  }
  function references(id,scope) {const checked=usage(id,scope);return checked.ok?checked.refs.filter(row=>row.kind==='configuration'&&row.fieldId):[{fieldLabel:'业务字段引用待核对',unknown:true}];}
  function checked(input, current, data, scope) {
    const name = text(input.name ?? current?.name).trim();
    if (!name || name.length > 60) return fail('请填写 60 字以内的接口名称');
    if (data.entries.some(row => row.id !== current?.id && row.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return fail('接口名称已存在，请换一个名称');
    const capabilityId = input.capabilityId ?? current?.capabilityId;
    if (!capability(capabilityId)) return fail('请选择已接入的取数能力');
    const capabilityReview = current && capabilityId !== current.capabilityId ? capabilityEditReview(current.id,scope) : null;
    if (capabilityReview && !capabilityReview.ok) return fail('使用关系暂时无法完整核对，不能更换取数能力；请保留填写并重试');
    if (capabilityReview && !capabilityReview.canDelete) return fail('接口已被引用或保留使用，取数能力固定；请新增接口后调整字段引用');
    const tenantIds = input.tenantIds ?? current?.tenantIds;
    if (!Array.isArray(tenantIds) || tenantIds.some(id => !tenants().some(tenant => tenant.tenantId === id))) return fail('可用租户已变化，请重新选择');
    const enabled = input.enabled ?? current?.enabled ?? true;
    if (typeof enabled !== 'boolean') return fail('请选择接口状态');
    return {ok:true,value:{name,capabilityId,tenantIds:unique(tenantIds),enabled},capabilityReview};
  }
  function commit(saved, message, row, changedTenants, capabilityGuard = null) {
    let bytes = null, written = false;
    try {
      if (!canManage()) return fail('当前身份无权维护业务数据接口字典');
      if (capabilityGuard) {
        const fresh = root.BusinessConfigurationUsage?.verifyFresh?.(capabilityGuard.review.token);
        if (managementContext() !== capabilityGuard.context || !fresh?.ok || !fresh.canDelete) return fail('使用关系或身份已变化，不能更换取数能力；当前填写已保留');
      }
      if (root.localStorage.getItem(storageKey) !== saved.raw) return fail('配置已更新，请刷新后重新操作');
      saved.data.revision += 1;
      bytes = JSON.stringify(saved.data); written = true;
      root.localStorage.setItem(storageKey,bytes);
      if (capabilityGuard) {
        const after = usage(row.id,capabilityGuard.review.token.scope);
        if (root.localStorage.getItem(storageKey) !== bytes || !canManage() || managementContext() !== capabilityGuard.context || !after.ok || !after.canDelete) throw Error('Capability edit was not committed');
      }
      if (changedTenants) root.dispatchEvent(new CustomEvent('business-data-change',{detail:{entryId:row.id,tenantIds:changedTenants}}));
      return success(message,row);
    } catch (_) {
      if (capabilityGuard && written) try {
        if (root.localStorage.getItem(storageKey) === bytes) {
          if (saved.raw === null) root.localStorage.removeItem(storageKey);
          else root.localStorage.setItem(storageKey,saved.raw);
        }
      } catch (_) {}
      return fail(capabilityGuard ? '本地保存未能完整完成，当前填写已保留；请核对使用情况后重试' : '本地保存失败，当前填写已保留，请重试');
    }
  }
  function create(input = {}) {
    if (!canManage()) return fail('仅超级管理员可新增业务数据接口');
    const saved = load(); if (!saved.ok) return saved;
    const check = checked(input,null,saved.data); if (!check.ok) return check;
    const id = 'd-' + (root.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2,8));
    const row = {id,...check.value,sourceRevision:0,tenantRevisions:{}};
    saved.data.entries.push(row);
    return commit(saved,'取数接口已新增',row,row.tenantIds);
  }
  function update(id, input = {}, options = {}) {
    if (!canManage()) return fail('仅超级管理员可维护业务数据接口');
    const saved = load(); if (!saved.ok) return saved;
    const row = saved.data.entries.find(row => row.id === id);
    if (!row) return fail('接口条目不存在，请刷新列表');
    const check = checked(input,row,saved.data,options.scope); if (!check.ok) return check;
    const next = check.value;
    const changedTenants = unique([...row.tenantIds,...next.tenantIds]).filter(id => row.tenantIds.includes(id) !== next.tenantIds.includes(id));
    const sourceChanged = next.enabled !== row.enabled || next.capabilityId !== row.capabilityId;
    if (sourceChanged) row.sourceRevision += 1;
    changedTenants.forEach(id => { row.tenantRevisions[id] = (row.tenantRevisions[id] || 0) + 1; });
    Object.assign(row,next);
    return commit(saved,'业务数据接口已保存',row,sourceChanged ? unique([...tenants().map(row => row.tenantId),...changedTenants]) : changedTenants.length ? changedTenants : null,check.capabilityReview ? {review:check.capabilityReview,context:managementContext()} : null);
  }
  function remove(id,options={}) {
    if(!canManage())return fail('仅超级管理员可删除取数接口');
    const saved=load();if(!saved.ok)return saved;
    const row=saved.data.entries.find(item=>item.id===id);if(!row)return fail('接口条目不存在，请刷新列表');
    const context=managementContext();
    if(options.expectedContext!==undefined&&options.expectedContext!==context || options.expectedRevision!==undefined&&options.expectedRevision!==saved.data.revision)return fail('身份或接口配置已变化，请重新核对后操作');
    const review=usage(id,options.scope);
    if(!review.ok||!review.canDelete)return {ok:false,code:review.code,message:review.reason,usage:review};
    if(options.expectedUsageFingerprint!==undefined&&options.expectedUsageFingerprint!==review.fingerprint)return {ok:false,code:'USAGE_CHANGED',message:'配置或使用关系已变化，请重新核对后删除'};
    const fresh=root.BusinessConfigurationUsage?.verifyFresh?.(review.token);
    if(!fresh?.ok||!fresh.canDelete)return {ok:false,code:fresh?.code||'USAGE_UNAVAILABLE',message:fresh?.reason||'使用关系暂时无法核对'};
    const next=clone(saved.data);next.entries=next.entries.filter(item=>item.id!==id);next.revision++;
    const bytes=JSON.stringify(next);let written=false;
    try {
      if(!canManage()||managementContext()!==context||root.localStorage.getItem(storageKey)!==saved.raw)throw Error('Changed dictionary');
      written=true;root.localStorage.setItem(storageKey,bytes);
      if(root.localStorage.getItem(storageKey)!==bytes||managementContext()!==context||!canManage())throw Error('Dictionary write failed');
      const after=usage(id,options.scope);
      if(after.code!=='UNKNOWN_TARGET'||after.refs.length)throw Error('Usage changed during delete');
    }catch(_){
      if(written)try{if(root.localStorage.getItem(storageKey)===bytes){if(saved.raw===null)root.localStorage.removeItem(storageKey);else root.localStorage.setItem(storageKey,saved.raw);}}catch(_){}
      return {ok:false,code:'DELETE_NOT_COMMITTED',message:'接口删除未能完整保存，原资料仍需核对；请保留当前页面并重试'};
    }
    root.dispatchEvent(new CustomEvent('business-data-change',{detail:{entryId:id,tenantIds:row.tenantIds,deleted:true}}));
    return success('取数接口已删除',{id,deleted:true});
  }
  const rename = (id,name) => update(id,{name});
  const setEnabled = (id,enabled) => update(id,{enabled});
  const setTenants = (id,tenantIds) => update(id,{tenantIds});
  function queryContext() {
    const state = root.AppState?.get?.() || {};
    return JSON.stringify([state.accountId,state.sessionId,state.tenantId,state.enterpriseId,state.activeDomain]);
  }
  async function query(id, kind, scope, params) {
    const startVersion = sourceVersion(id,scope), context = queryContext();
    // DCC has its own pagination scenarios. The retained standard setting must
    // never turn a failed DCC page into a complete empty result (or vice versa).
    const profile = demoSource, scenario = env.dccScenario, mode = profile==='dcc' ? 'normal' : env.query;
    const empty = message => ({ok:false,complete:false,items:[],message});
    const configurationError = (code,message) => ({ok:false,complete:false,items:[],category:'configuration',nonRetryable:true,code,message});
    if (!available(id,scope) || capability(entry(id)?.capabilityId)?.kind !== kind) return empty('来源不可用，请联系管理员检查接口状态与租户授权');
    const isCurrent = () => queryContext()===context && available(id,scope) && sourceVersion(id,scope)===startVersion;
    if(entry(id)?.capabilityId==='mapping-series') {
      if(!root.MappingSeriesAdapter || !root.MappingSeriesMock)return empty('Mapping车系模拟组件未加载，请刷新后重试');
      try {
        const result=await root.MappingSeriesAdapter.query({params,scenario:env.mappingScenario,scope,isCurrent,rename:code=>upstreamNames[code]});
        if(!isCurrent())return empty('来源或当前工作范围已变化，请重新查询');
        return result?.ok===true && result.complete===true && Array.isArray(result.items) ? result : empty(result?.message || 'Mapping车系查询未完成，请重试');
      } catch (_) {return empty('Mapping车系查询未完成，当前填写已保留，请重试');}
    }
    if (!['standard','dcc'].includes(profile)) return empty('模拟数据来源不可用，请重新选择演示设置');
    if (!params || Object.prototype.toString.call(params) !== '[object Object]' ||
      Object.getOwnPropertySymbols(params).length || Object.getOwnPropertyNames(params).some(key => kind !== 'store' || key !== 'seriesCode')) {
      return configurationError('unsupported_parameter','查询入参字段与当前取数接口不匹配，请管理员调整字段配置');
    }
    const seriesCode = Object.prototype.hasOwnProperty.call(params,'seriesCode') ? params.seriesCode : undefined;
    const filtered = kind === 'store' && seriesCode !== undefined && seriesCode !== '';
    if (profile==='dcc' && (!root.DccBusinessMock || !root.DccBusinessAdapter)) return empty('DCC模拟组件未加载，请刷新后重试');
    const catalog = profile==='dcc' ? root.DccBusinessMock.series() : seriesSeed;
    if (filtered && typeof seriesCode !== 'string')return configurationError('value_type_mismatch','当前车系编码与门店接口不兼容，请管理员调整字段配置（门店接口需要文本车系编码）');
    if (filtered && !catalog.some(row=>row.code===seriesCode))return configurationError('unknown_catalog_code','当前车系编码与门店接口不兼容，请管理员调整字段配置（该编码不在当前门店接口目录内）');
    await new Promise(resolve => root.setTimeout(resolve,mode === 'delay' ? 1600 : 180));
    if (!isCurrent()) return empty('来源或当前工作范围已变化，请重新查询');
    if (mode === 'failure') return empty('查询失败，当前填写已保留，请重试');
    if (mode === 'partial') return empty(kind === 'store' ? '门店查询未完成，请重试后再选择门店' : '车系查询未完成，请重试');
    if (profile==='dcc' && kind==='store') {
      try {
        const result = await root.DccBusinessAdapter.query({params,scenario,scope,isCurrent,rename:code=>upstreamNames[code]});
        if (!isCurrent()) return empty('来源或当前工作范围已变化，请重新查询');
        return result && result.ok===true && result.complete===true && Array.isArray(result.items) ? result : empty(result?.message || 'DCC模拟门店查询未完成，请重试');
      } catch (_) { return empty('DCC模拟门店查询未完成，当前填写已保留，请重试'); }
    }
    if (mode === 'empty') return {ok:true,complete:true,items:[],message:kind === 'store' ? (filtered ? '当前查询条件暂无可选门店' : '当前租户暂无可用门店') : '暂无可选车系'};
    if (profile==='dcc') return {ok:true,complete:true,items:catalog.map(row=>({...clone(row),name:upstreamNames[row.code] || row.name})),message:'独立虚构车系目录，不代表平台与DCC真实编码同源'};
    const wanted = filtered ? new Set(storeRelations[seriesCode]) : null;
    const items = (kind === 'store' ? storeSeed.filter(row => !wanted || wanted.has(row.code)) : seriesSeed)
      .map(row => {
        const item = {...row,name:upstreamNames[row.code] || row.name};
        if (kind === 'store') {
          const matchedSeries = seriesSeed.filter(series => filtered ? series.code === seriesCode : storeRelations[series.code].includes(row.code));
          item.seriesCodes = matchedSeries.map(series => series.code);
          item.seriesNames = matchedSeries.map(series => upstreamNames[series.code] || series.name);
        }
        return item;
      });
    return {ok:true,complete:true,items:clone(items),message:''};
  }
  // Shared field-query contract: each prebuilt adapter owns its actual inputs.
  // Adding a future capability does not require field-specific query branches.
  function queryOptions(id,params = {},scope) {
    const kind = capability(entry(id)?.capabilityId)?.kind;
    return query(id,kind,scope,params);
  }
  const querySeries = (id,scope) => query(id,'series',scope,{});
  const queryStores = (id,seriesCode,scope) => query(id,'store',scope,{seriesCode});
  function demoAllowed() { return root.CloudCallData?.demoSwitchEnabled === true && root.AppState?.isReady?.() === true; }
  function openDemo() {
    if (!demoAllowed()) return;
    const ui = root.PlatformUI, esc = ui.escape;
    const cases = root.DccBusinessMock?.scenarios || [{id:'normal',label:'正常分页'}];
    const mappingCases=root.MappingSeriesMock?.scenarios || [{id:'normal',label:'正常映射数组'}];
    const mappingControl='<label class="field"><span>Mapping车系演示场景</span><select id="business-demo-mapping-case">'+mappingCases.map(row=>'<option value="'+esc(row.id)+'"'+(env.mappingScenario===row.id?' selected':'')+'>'+esc(row.label)+'</option>').join('')+'</select><small class="field-hint">仅影响Mapping车系能力，与标准／DCC场景独立；只演示有映射的车系，状态含义和真实覆盖范围待核验。</small></label>';
    ui.openLayer('business-data-demo','<div class="layer-header"><div><h2>接口数据演示</h2><p>仅本地模拟，不请求真实接口</p></div><button aria-label="关闭" onclick="PlatformUI.closeLayer(\'business-data-demo\')">×</button></div><div class="layer-body"><div class="business-data-form">'+
      '<label class="field"><span>模拟数据来源</span><select id="business-demo-source" onchange="BusinessData.previewDemoSource()"><option value="standard"'+(demoSource==='standard'?' selected':'')+'>标准模拟数据</option><option value="dcc"'+(demoSource==='dcc'?' selected':'')+'>DCC v2返回结构模拟（全虚构）</option></select></label>'+
      '<label class="field"><span>DCC v2分页演示场景</span><select id="business-demo-dcc-case"'+(demoSource!=='dcc'?' disabled':'')+'>'+cases.map(row=>'<option value="'+esc(row.id)+'"'+(env.dccScenario===row.id?' selected':'')+'>'+esc(row.label)+'</option>').join('')+'</select><small class="field-hint">每个模拟授权来源须分别读完全部分页；NEV按具体车系匹配，ICE返回来源内全部可用门店。区县支持平台展示筛选；缺少的字段不编造。分页和成功标记仅为本演示约定，真实契约待核验。</small></label>'+
      '<label class="field"><span>通用查询结果</span><select id="business-demo-query" data-standard-value="'+esc(env.query)+'"'+(demoSource==='dcc'?' disabled':'')+'><option id="business-demo-query-dcc-option" value="dcc" disabled'+(demoSource==='dcc'?' selected':' hidden')+'>按DCC场景演示</option>'+[
        ['normal','正常返回'],['empty','查询完整但无结果'],['partial','查询未完成'],['failure','查询失败'],['delay','延迟返回（观察条件变化）']
      ].map(([value,label])=>'<option value="'+value+'"'+(demoSource!=='dcc'&&env.query===value?' selected':'')+'>'+label+'</option>').join('')+'</select><small id="business-demo-query-hint" class="field-hint">'+(demoSource==='dcc'?'DCC模式按上方专属分页场景演示；通用查询结果仅用于标准模拟。':'标准模拟按此处选择返回结果。')+'</small></label>'+
      mappingControl+'<label class="business-data-check"><input id="business-demo-save" type="checkbox"'+(env.saveFail?' checked':'')+'>模拟跟进保存失败</label>'+
      '<div class="business-data-demo-rename"><label class="field"><span>模拟上游名称变化</span><select id="business-demo-code">'+demoRows().map(row=>'<option value="'+esc(row.code)+'">'+esc(row.code+' · '+(upstreamNames[row.code]||row.name))+'</option>').join('')+'</select></label><label class="field"><span>新名称</span><input id="business-demo-name" maxlength="60" placeholder="输入模拟上游新名称"></label><button class="btn" type="button" onclick="BusinessData.renameUpstreamFromDemo()">应用名称变化</button><small class="field-hint">已保存历史仍显示当时名称。切换数据来源请先应用设置，再演示改名。</small></div></div></div><div class="layer-footer"><button class="btn" type="button" onclick="PlatformUI.closeLayer(\'business-data-demo\')">取消</button><button class="btn btn-primary" type="button" onclick="BusinessData.applyDemo()">应用演示设置</button></div>','small');
  }
  function previewDemoSource() {
    if (!demoAllowed()) return;
    const source = root.document.getElementById('business-demo-source')?.value;
    const input = root.document.getElementById('business-demo-dcc-case'); if(input) input.disabled=source!=='dcc';
    const queryInput = root.document.getElementById('business-demo-query');
    if(queryInput){
      queryInput.dataset ||= {};
      if(source==='dcc' && ['normal','empty','partial','failure','delay'].includes(queryInput.value)) queryInput.dataset.standardValue=queryInput.value;
      queryInput.disabled=source==='dcc';
      queryInput.value=source==='dcc'?'dcc':queryInput.dataset.standardValue || env.query;
    }
    const dccOption = root.document.getElementById('business-demo-query-dcc-option');
    if(dccOption) dccOption.hidden=source!=='dcc';
    const hint = root.document.getElementById('business-demo-query-hint');
    if(hint) hint.textContent=source==='dcc'?'DCC模式按上方专属分页场景演示；通用查询结果仅用于标准模拟。':'标准模拟按此处选择返回结果。';
  }
  function applyDemo() {
    if (!demoAllowed()) return false;
    const value = root.document.getElementById('business-demo-query')?.value;
    const source = root.document.getElementById('business-demo-source')?.value || demoSource;
    const scenario = root.document.getElementById('business-demo-dcc-case')?.value || env.dccScenario;
    const mappingCase=root.document.getElementById('business-demo-mapping-case')?.value || env.mappingScenario;
    if(!(root.MappingSeriesMock?.scenarios || [{id:'normal'}]).some(row=>row.id===mappingCase))return false;
    const mappingChanged=mappingCase!==env.mappingScenario;
    if (!['standard','dcc'].includes(source) || source==='standard' && !['normal','empty','partial','failure','delay'].includes(value) ||
      source==='dcc' && !(root.DccBusinessMock?.scenarios || []).some(row=>row.id===scenario)) return false;
    const changed = source!==demoSource || source==='dcc' && scenario!==env.dccScenario;
    env.source=source;env.dccScenario=scenario;env.mappingScenario=mappingCase;
    if(source==='standard') env.query=value;
    env.saveFail=root.document.getElementById('business-demo-save')?.checked===true;
    root.PlatformUI.closeLayer('business-data-demo');
    if(changed) root.dispatchEvent?.(new CustomEvent('business-data-change',{detail:{entryId:'',tenantIds:tenants().map(row=>row.tenantId),demoSourceChanged:true}}));
    if(mappingChanged)root.dispatchEvent?.(new CustomEvent('business-data-change',{detail:{entryId:'d-mapping-series',tenantIds:tenants().map(row=>row.tenantId),mappingScenarioChanged:true}}));
    root.showToast?.(changed||mappingChanged?'模拟数据来源或场景已切换，请重新查询并确认当前车系和门店':'演示设置已应用，请在填写处重新查询','success');
    return true;
  }
  function renameUpstreamFromDemo() {
    if (!demoAllowed()) return false;
    const code = root.document.getElementById('business-demo-code')?.value, name = root.document.getElementById('business-demo-name')?.value.trim();
    if (!demoRows().some(row => row.code === code) || !name || name.length > 60) { root.showToast?.('请填写 60 字以内的新名称','warning'); return false; }
    upstreamNames[code] = name;
    if(mappingDemoRows().some(row=>row.code===code)) {
      mappingEpoch++;
      root.dispatchEvent?.(new CustomEvent('business-data-change',{detail:{entryId:'d-mapping-series',tenantIds:tenants().map(row=>row.tenantId),mappingScenarioChanged:true}}));
    }
    root.showToast?.('模拟上游名称已变化，已保存的历史名称保留','success');
    return true;
  }
  root.BusinessData = Object.freeze({storageKey,storageVersion,capabilities,env,tenants,entries,entry,catalogState,context:managementContext,capability,available,sourceVersion,canManage,create,update,remove,rename,setEnabled,setTenants,references,usage,capabilityEditReview,queryOptions,querySeries,queryStores,demoProfile,openDemo,previewDemoSource,applyDemo,renameUpstreamFromDemo,get error(){return lastError;}});
  root.addEventListener('storage',event => {
    // alicti-storage.js normalizes the isolated browser storage key first.
    if (event.storageArea && event.storageArea !== root.localStorage) return;
    if (event.key !== null && event.key !== storageKey) return;
    root.dispatchEvent(new CustomEvent('business-data-change',{detail:{entryId:'',tenantIds:tenants().map(row=>row.tenantId),external:true}}));
  });
  // Extend the existing demo tool without changing identity or business navigation.
  if (root.DemoSwitch && typeof root.DemoSwitch.open === 'function') {
    const original = root.DemoSwitch.open;
    root.DemoSwitch.open = function () {
      const result = original.apply(this,arguments);
      const footer = root.document.getElementById('demo-accounts')?.querySelector('.layer-footer');
      if (footer && demoAllowed() && !footer.querySelector('[data-business-data-demo]')) {
        const button = root.document.createElement('button');
        button.type = 'button'; button.className = 'btn'; button.dataset.businessDataDemo = ''; button.textContent = '接口数据演示';
        button.onclick = () => { root.PlatformUI.closeLayer('demo-accounts'); openDemo(); };
        footer.insertBefore(button,footer.querySelector('button'));
      }
      return result;
    };
  }
})(window);
