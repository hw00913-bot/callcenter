/** Isolated AliCti number-pool fixtures. Never mutate CloudCallData with these rows. */
(function (root) {
  'use strict';
  const entries = {
    '7522240': [
      {id:8201,name:'总部默认号码池',comment:'总部主叫号码演示',createTime:'2026-09-18 09:00:00',numbers:'02100006101,02100006202',type:0,isDefault:1},
      {id:8202,name:'总部补充号码池',comment:'补充外显号码演示',createTime:'2026-09-18 09:15:00',numbers:'02100006303',type:0,isDefault:0}
    ],
    '7522241': [
      {id:8211,name:'门店默认号码池',comment:'上海门店号码演示',createTime:'2026-09-18 10:00:00',numbers:'4000000901',type:0,isDefault:1}
    ],
    'DEMO-ENT-003': [
      {id:8221,name:'奕派默认号码池',comment:'待接入号码',createTime:'2026-09-18 11:00:00',numbers:'',type:0,isDefault:1}
    ]
  };
  Object.values(entries).forEach(rows => {
    if (rows.length > 15) throw Error('Number-pool demo limit exceeded');
    rows.forEach(Object.freeze);
    Object.freeze(rows);
  });
  root.AliCtiNumberPoolMock = Object.freeze({entries:Object.freeze(entries),maxPoolsPerEnterprise:15,simulation:true});
})(window);
