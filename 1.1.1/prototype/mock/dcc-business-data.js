/**
 * DCC v2 返回结构的本地 fixture。所有名称、编码、关系、体系与范围均为虚构。
 * 模拟接受的 NEV 范围为非黑名单且 ARIYA 授权来源，ICE 为来源内全部可用门店；
 * 这仅落实当前演示业务约定，不证明生产授权、分页或成功码契约。无网络。
 */
(function (root) {
  'use strict';
  const namespace = 'DCC_DEMO';
  const clone = value => JSON.parse(JSON.stringify(value));
  const freeze = value => { Object.freeze(value); Object.values(value).forEach(child => { if (child && typeof child === 'object' && !Object.isFrozen(child)) freeze(child); }); return value; };
  const seriesSeed = freeze([
    {code:'DCC_DEMO_SERIES_N7',name:'DCC 演示车系 N7（虚构）',type:'NEV'},
    {code:'DCC_DEMO_SERIES_N8',name:'DCC 演示车系 N8（虚构）',type:'NEV'},
    {code:'DCC_DEMO_SERIES_ARIYA',name:'DCC 演示车系 ARIYA（虚构）',type:'NEV'},
    {code:'DCC_DEMO_SERIES_ICE_A',name:'DCC 演示燃油车系 A（虚构）',type:'ICE'},
    {code:'DCC_DEMO_SERIES_ICE_B',name:'DCC 演示燃油车系 B（虚构）',type:'ICE'}
  ]);
  // Exact fixture-owned strings, not a parser or production encoding rule.
  // Every NEV store has fictional ARIYA authorization; N7/N8 relations stay exact.
  const relationSeed = freeze([
    {carSeriesCn:'演示N7,演示ARIYA',carSeriesCnCarSeriesCode:'演示N7-DCC_DEMO_SERIES_N7,演示ARIYA-DCC_DEMO_SERIES_ARIYA',seriesCodes:['DCC_DEMO_SERIES_N7','DCC_DEMO_SERIES_ARIYA'],type:'NEV'},
    {carSeriesCn:'演示N7,演示N8,演示ARIYA',carSeriesCnCarSeriesCode:'演示N7-DCC_DEMO_SERIES_N7,演示N8-DCC_DEMO_SERIES_N8,演示ARIYA-DCC_DEMO_SERIES_ARIYA',seriesCodes:['DCC_DEMO_SERIES_N7','DCC_DEMO_SERIES_N8','DCC_DEMO_SERIES_ARIYA'],type:'NEV'},
    {carSeriesCn:'演示N8,演示ARIYA',carSeriesCnCarSeriesCode:'演示N8-DCC_DEMO_SERIES_N8,演示ARIYA-DCC_DEMO_SERIES_ARIYA',seriesCodes:['DCC_DEMO_SERIES_N8','DCC_DEMO_SERIES_ARIYA'],type:'NEV'}
  ]);
  const base = (n,cityName,countyName) => ({
    dealerCode:'DCC_DEMO_STORE_' + String(n).padStart(3,'0'),
    dealerName:'DCC 演示' + (n > 3 ? '燃油' : '') + '门店' + n + '（虚构）',
    address:'演示省' + cityName + countyName + '虚构路 ' + n + ' 号',
    provinceName:'演示省',cityName,countyName,
    tencentLongitude:String(113 + n / 100),tencentLatitude:String(23 + n / 100)
  });
  const nevStoreSeed = freeze([
    {...base(1,'演示市甲','演示区甲'),dlrFullName:'DCC 演示公司一（虚构）',spokenAddress:'演示区甲虚构路一号',carSeriesCn:relationSeed[0].carSeriesCn,carSeriesCnCarSeriesCode:relationSeed[0].carSeriesCnCarSeriesCode,testDriveSeriesCn:relationSeed[0].carSeriesCn,testDriveSeriesCnCode:relationSeed[0].carSeriesCnCarSeriesCode},
    {...base(2,'演示市乙','演示区乙'),dlrFullName:'DCC 演示公司二（虚构）',spokenAddress:'演示区乙虚构路二号',carSeriesCn:relationSeed[1].carSeriesCn,carSeriesCnCarSeriesCode:relationSeed[1].carSeriesCnCarSeriesCode,testDriveSeriesCn:relationSeed[1].carSeriesCn,testDriveSeriesCnCode:relationSeed[1].carSeriesCnCarSeriesCode},
    {...base(3,'演示市乙','演示区丙'),dlrFullName:'DCC 演示公司三（虚构）',spokenAddress:'演示区丙虚构路三号',carSeriesCn:relationSeed[2].carSeriesCn,carSeriesCnCarSeriesCode:relationSeed[2].carSeriesCnCarSeriesCode,testDriveSeriesCn:relationSeed[2].carSeriesCn,testDriveSeriesCnCode:relationSeed[2].carSeriesCnCarSeriesCode}
  ]);
  // ICE has no exact store/series authorization relation. Null is accepted data.
  const iceStoreSeed = freeze([
    {...base(4,'演示市甲','演示区甲'),dlrFullName:null,spokenAddress:null,carSeriesCn:null,carSeriesCnCarSeriesCode:null,testDriveSeriesCn:null,testDriveSeriesCnCode:null},
    {...base(5,'演示市乙','演示区乙'),dlrFullName:null,spokenAddress:null,carSeriesCn:null,carSeriesCnCarSeriesCode:null,testDriveSeriesCn:null,testDriveSeriesCnCode:null},
    {...base(6,'演示市乙','演示区丙'),dlrFullName:null,spokenAddress:null,carSeriesCn:null,carSeriesCnCarSeriesCode:null,testDriveSeriesCn:null,testDriveSeriesCnCode:null}
  ]);
  const scenarios = freeze([
    {id:'normal',label:'完整多页返回'},
    {id:'empty',label:'查询完整但无结果'},
    {id:'page_failure',label:'第二页失败（不提供部分候选）'},
    {id:'page_mismatch',label:'第二页页号异常'},
    {id:'bad_relation',label:'NEV 第二页车系编码关系异常（ICE 不适用）'},
    {id:'delay',label:'延迟分页（观察旧请求失效）'}
  ]);
  const validScope = scope => !!(scope && typeof scope.tenantId === 'string' && scope.tenantId.trim() && typeof scope.enterpriseId === 'string' && scope.enterpriseId.trim());
  function page(input, scenario = 'normal', scope) {
    // Only sourceType is mandatory. Pagination defaults, limits, empty envelope
    // and result codes below are local demo conventions, not production facts.
    // Unknown raw fields (including seriesCode/per_page) have no effect.
    const plain = !!(input && Object.prototype.toString.call(input) === '[object Object]');
    const sourceType = plain && typeof input.sourceType === 'string' ? input.sourceType.toUpperCase() : '';
    const pageindex = plain && input.page !== undefined ? input.page : 1;
    const perPage = plain && input.perPage !== undefined ? input.perPage : 2;
    const validInput = plain && ['NEV','ICE'].includes(sourceType) && Number.isSafeInteger(pageindex) && pageindex > 0 &&
      Number.isSafeInteger(perPage) && perPage > 0 && perPage <= 50 &&
      ['provinceName','cityName'].every(key => input[key] === undefined || typeof input[key] === 'string');
    const selected = scenarios.some(row => row.id === scenario);
    let data = scenario === 'empty' ? [] : clone(sourceType === 'ICE' ? iceStoreSeed : nevStoreSeed);
    // Optional province/city use a local substring simulation of fuzzy matching.
    if (validInput) data = data.filter(row => ['provinceName','cityName'].every(key => !input[key] || row[key].includes(input[key])));
    const records = data.length;
    const pages = validInput ? Math.max(1,Math.ceil(records / perPage)) : 1;
    let response;
    if (!validInput || !selected || !validScope(scope) || pageindex > pages) {
      response = {result:'0',msg:'DCC v2 结构模拟：查询上下文、情景或参数无效',pageindex,pages,records,rows:[]};
    } else {
      const rows = data.slice((pageindex - 1) * perPage,pageindex * perPage);
      if (scenario === 'bad_relation' && sourceType === 'NEV' && pageindex === 2 && rows[0]) rows[0].carSeriesCnCarSeriesCode = '未知演示车系-DCC_DEMO_SERIES_UNKNOWN';
      response = {result:'1',msg:'DCC v2 结构模拟：操作成功',pageindex,pages,records,rows};
      if (scenario === 'page_failure' && pageindex === 2) response = {...response,result:'0',msg:'DCC v2 结构模拟：第二页查询失败',rows:[]};
      if (scenario === 'page_mismatch' && pageindex === 2) response.pageindex = 1;
    }
    return new Promise(resolve => root.setTimeout(() => resolve(clone(response)),scenario === 'delay' ? 650 : 80));
  }
  root.DccBusinessMock = Object.freeze({namespace,scenarios,
    series:() => clone(seriesSeed),
    stores:() => [...nevStoreSeed,...iceStoreSeed].map(row => ({code:row.dealerCode,name:row.dealerName})),
    relations:() => clone(relationSeed),
    page
  });
})(window);
