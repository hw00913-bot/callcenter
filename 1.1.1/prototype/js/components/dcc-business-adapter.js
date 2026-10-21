/**
 * DCC v2 结构模拟适配器；仅用于已授权的静态演示，无真实外联。
 * 统一内部 seriesCode 只解析受控来源。NEV 读齐后精确筛选；ICE 读齐来源
 * 内全部可用门店，空关系不伪造。独立查询须 NEV+ICE 全部来源分页完整。
 * 生产授权、成功码、分页完整协议及当前快照一致性仍待真实核验。
 */
(function (root) {
  'use strict';
  const pageSize = 2, maximumPages = 100;
  const missingFields = Object.freeze(['group','businessType','status','phone']);
  const allowedSources = Object.freeze(['NEV','ICE']);
  const copy = value => JSON.parse(JSON.stringify(value));
  const has = (object,key) => Object.prototype.hasOwnProperty.call(object,key);
  const nonempty = value => typeof value === 'string' && !!value.trim() && value.trim() === value;
  const plain = value => !!value && Object.prototype.toString.call(value) === '[object Object]';
  async function query(options = {}) {
    let meta = {source:'dcc-structure-mock',namespace:'DCC_DEMO',simulated:true,requestedPages:[],requests:[],requestedSources:[],sourceSummaries:[],pagesRead:0,totalPages:null,
      missingFields:[...missingFields],filterLocation:'local-adapter-after-full-source-pagination',productionContractVerified:false};
    const failure = message => ({ok:false,complete:false,items:[],message,meta:copy(meta)});
    try {
      if (!plain(options)) return failure('DCC 结构模拟：查询选项无效');
      const {params = {},scenario = 'normal',scope,rename} = options;
      const current = options.isCurrent === undefined ? () => true : options.isCurrent;
      if (typeof current !== 'function' || !current()) return failure('来源或当前工作范围已变化，请重新查询');
      if (!plain(scope) || !nonempty(scope.tenantId) || !nonempty(scope.enterpriseId)) return failure('DCC 结构模拟：当前工作范围不完整');
      meta.scope = {tenantId:scope.tenantId,enterpriseId:scope.enterpriseId};
      meta.scenario = scenario;
      if (!plain(params) || Object.getOwnPropertySymbols(params).length || Object.getOwnPropertyNames(params).some(key => key !== 'seriesCode')) {
        return failure('入参字段名与当前取数接口不匹配，请核对配置');
      }
      const seriesCode = has(params,'seriesCode') ? params.seriesCode : undefined;
      const filtered = seriesCode !== undefined && seriesCode !== '';
      meta.filterApplied = filtered;
      const fixture = root.DccBusinessMock;
      if (!fixture || fixture.namespace !== 'DCC_DEMO' || typeof fixture.page !== 'function' || typeof fixture.series !== 'function' || typeof fixture.relations !== 'function') return failure('DCC 结构模拟资料未就绪');
      if (!Array.isArray(fixture.scenarios) || !fixture.scenarios.some(row => row.id === scenario)) return failure('DCC 结构模拟：查询情景无效');
      const catalog = fixture.series(), relations = fixture.relations();
      const byCode = new Map(), bySerialized = new Map();
      if (!Array.isArray(catalog) || !catalog.length || !Array.isArray(relations)) return failure('DCC 结构模拟：车系映射资料无效');
      for (const series of catalog) {
        if (!series || !nonempty(series.code) || !series.code.startsWith('DCC_DEMO_SERIES_') || !nonempty(series.name) || !allowedSources.includes(series.type) || byCode.has(series.code)) return failure('DCC 结构模拟：车系映射资料无效');
        byCode.set(series.code,{...series});
      }
      if (filtered && (typeof seriesCode !== 'string' || !byCode.has(seriesCode))) return failure('请选择一个有效的 DCC 模拟车系编码');
      for (const relation of relations) {
        if (!relation || !nonempty(relation.carSeriesCn) || !nonempty(relation.carSeriesCnCarSeriesCode) || bySerialized.has(relation.carSeriesCnCarSeriesCode) ||
          !Array.isArray(relation.seriesCodes) || !relation.seriesCodes.length || new Set(relation.seriesCodes).size !== relation.seriesCodes.length ||
          relation.type !== 'NEV' || relation.seriesCodes.some(code => !byCode.has(code) || byCode.get(code).type !== 'NEV')) {
          return failure('DCC 结构模拟：NEV 车系映射资料无效');
        }
        bySerialized.set(relation.carSeriesCnCarSeriesCode,relation);
      }
      if (rename !== undefined && typeof rename !== 'function') return failure('DCC 结构模拟：名称覆盖配置无效');
      const renamed = (code,name) => {
        const next = rename ? rename(code) : undefined;
        if (next === undefined || next === null || next === '') return name;
        if (!nonempty(next)) throw Error('invalid-name');
        return next;
      };
      const sources = filtered ? [byCode.get(seriesCode).type] : [...allowedSources];
      meta.requestedSources = [...sources];
      meta.filterMode = filtered ? (sources[0] === 'ICE' ? 'all-available-in-source' : 'exact-nev-series') : 'all-allowed-sources';
      const rows = [], seen = new Set();
      for (const sourceType of sources) {
        let totalPages = 1, totalRecords = null, sourceRows = 0;
        for (let page = 1; page <= totalPages; page += 1) {
          if (!current()) return failure('来源或当前工作范围已变化，请重新查询');
          meta.requestedPages.push(page);
          meta.requests.push({sourceType,page,perPage:pageSize});
          // Scope is local fixture context, never an invented upstream parameter.
          // Do not send internal seriesCode, tenant, county or energyType fields.
          const response = await fixture.page({sourceType,page,perPage:pageSize},scenario,copy(meta.scope));
          if (!current()) return failure('来源或当前工作范围已变化，请重新查询');
          if (!response || response.result !== '1') return failure('DCC 结构模拟：'+sourceType+' 第 '+page+' 页查询失败，结果未查全，请重试');
          if (!Number.isSafeInteger(response.pageindex) || response.pageindex !== page || !Number.isSafeInteger(response.pages) || response.pages < 1 || response.pages > maximumPages ||
            !Number.isSafeInteger(response.records) || response.records < 0 || Math.max(1,Math.ceil(response.records / pageSize)) !== response.pages ||
            (page > 1 && (response.pages !== totalPages || response.records !== totalRecords)) || !Array.isArray(response.rows) ||
            response.rows.length !== Math.min(pageSize,Math.max(0,response.records - (page - 1) * pageSize))) {
            return failure('DCC 结构模拟：'+sourceType+' 分页或总数异常，结果未查全，请重试');
          }
          if (page === 1) {
            totalPages = response.pages;
            totalRecords = response.records;
            meta.totalPages = (meta.totalPages ?? 0) + totalPages;
          }
          // Validate the whole source before any filtering; errors cannot widen it.
          for (const raw of response.rows) {
            if (!raw || !nonempty(raw.dealerCode) || !raw.dealerCode.startsWith('DCC_DEMO_STORE_') || !nonempty(raw.dealerName) || seen.has(raw.dealerCode)) return failure('DCC 结构模拟：门店编码或名称异常，结果未查全');
            let relation = null;
            if (sourceType === 'NEV') {
              relation = bySerialized.get(raw.carSeriesCnCarSeriesCode);
              if (!relation || raw.carSeriesCn !== relation.carSeriesCn) return failure('DCC 结构模拟：NEV 车系编码关系无法核对，请重试或检查映射资料');
            }
            for (const field of ['address','provinceName','cityName','countyName']) if (raw[field] !== undefined && raw[field] !== null && typeof raw[field] !== 'string') return failure('DCC 结构模拟：门店基础字段格式异常');
            seen.add(raw.dealerCode);
            rows.push({raw:copy(raw),relation:relation ? copy(relation) : null,sourceType});
            sourceRows += 1;
          }
          meta.pagesRead += 1;
        }
        if (sourceRows !== totalRecords) return failure('DCC 结构模拟：'+sourceType+' 总数与完整分页不一致，结果未查全');
        meta.sourceSummaries.push({sourceType,pagesRead:totalPages,totalPages,records:totalRecords});
      }
      if (!current()) return failure('来源或当前工作范围已变化，请重新查询');
      const items = rows.filter(row => !filtered || row.sourceType === 'ICE' || row.relation.seriesCodes.includes(seriesCode)).map(({raw,relation,sourceType}) => {
        const matchedCodes = sourceType === 'ICE' ? [] : filtered ? [seriesCode] : [...relation.seriesCodes];
        return {code:raw.dealerCode,name:renamed(raw.dealerCode,raw.dealerName),type:sourceType,
          seriesCodes:matchedCodes,seriesNames:matchedCodes.map(code => renamed(code,byCode.get(code).name)),
          address:raw.address ?? null,province:raw.provinceName ?? null,city:raw.cityName ?? null,district:raw.countyName ?? null,
          group:null,businessType:null,status:null,phone:null,
          missingFields:[...missingFields,...[['address','address'],['province','provinceName'],['city','cityName'],['district','countyName']].filter(([,key]) => !raw[key]).map(([key]) => key)]};
      });
      if (!current()) return failure('来源或当前工作范围已变化，请重新查询');
      return {ok:true,complete:true,items:copy(items),message:items.length ? '' : (filtered ? '当前查询条件暂无可选门店（DCC 结构模拟）' : '当前演示范围暂无门店（DCC 结构模拟）'),meta:copy(meta)};
    } catch (_) {
      return failure('DCC 结构模拟：查询或映射处理失败，结果未查全，请重试');
    }
  }
  root.DccBusinessAdapter = Object.freeze({query});
})(window);
