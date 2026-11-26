/* Untouched native AI demo references shipped in this review prototype. */
(() => {
  'use strict';

  const standardTags = {
    "store_db": [{"id":"local_store_db_1","localCode":"LOCAL-STORE-DB-001","name":"高优先级","sort":1},{"id":"local_store_db_2","localCode":"LOCAL-STORE-DB-002","name":"中优先级","sort":2},{"id":"local_store_db_3","localCode":"LOCAL-STORE-DB-003","name":"低优先级","sort":3},{"id":"local_store_db_4","localCode":"LOCAL-STORE-DB-004","name":"无需处理","sort":4},{"id":"local_store_db_5","localCode":"LOCAL-STORE-DB-005","name":"无效客户","sort":5}],
    "store_fw": [{"id":"local_store_fw_1","localCode":"LOCAL-STORE-FW-001","name":"服务满意","sort":1},{"id":"local_store_fw_2","localCode":"LOCAL-STORE-FW-002","name":"需跟进","sort":2},{"id":"local_store_fw_3","localCode":"LOCAL-STORE-FW-003","name":"投诉风险","sort":3},{"id":"local_store_fw_4","localCode":"LOCAL-STORE-FW-004","name":"无效客户","sort":4}],
    "store_hf": [{"id":"local_store_hf_1","localCode":"LOCAL-STORE-HF-001","name":"已确认","sort":1},{"id":"local_store_hf_2","localCode":"LOCAL-STORE-HF-002","name":"待二次回访","sort":2},{"id":"local_store_hf_3","localCode":"LOCAL-STORE-HF-003","name":"无意向","sort":3},{"id":"local_store_hf_4","localCode":"LOCAL-STORE-HF-004","name":"无效客户","sort":4}],
    "store_xxs": [{"id":"local_store_xxs_1","localCode":"LOCAL-STORE-XXS-001","name":"高意向","sort":1},{"id":"local_store_xxs_2","localCode":"LOCAL-STORE-XXS-002","name":"中意向","sort":2},{"id":"local_store_xxs_3","localCode":"LOCAL-STORE-XXS-003","name":"低意向","sort":3},{"id":"local_store_xxs_4","localCode":"LOCAL-STORE-XXS-004","name":"无意向","sort":4},{"id":"local_store_xxs_5","localCode":"LOCAL-STORE-XXS-005","name":"无效客户","sort":5}],
    "store_lxs": [{"id":"local_store_lxs_1","localCode":"LOCAL-STORE-LXS-001","name":"可激活","sort":1},{"id":"local_store_lxs_2","localCode":"LOCAL-STORE-LXS-002","name":"需培育","sort":2},{"id":"local_store_lxs_3","localCode":"LOCAL-STORE-LXS-003","name":"无意向","sort":3},{"id":"local_store_lxs_4","localCode":"LOCAL-STORE-LXS-004","name":"无效客户","sort":4}],
    "headquarters_db": [{"id":"local_headquarters_db_1","localCode":"LOCAL-HQ-DB-001","name":"总部重点跟进","sort":1},{"id":"local_headquarters_db_2","localCode":"LOCAL-HQ-DB-002","name":"区域协同","sort":2},{"id":"local_headquarters_db_3","localCode":"LOCAL-HQ-DB-003","name":"门店自处理","sort":3},{"id":"local_headquarters_db_4","localCode":"LOCAL-HQ-DB-004","name":"无效客户","sort":4}],
    "headquarters_fw": [{"id":"local_headquarters_fw_1","localCode":"LOCAL-HQ-FW-001","name":"服务达标","sort":1},{"id":"local_headquarters_fw_2","localCode":"LOCAL-HQ-FW-002","name":"服务预警","sort":2},{"id":"local_headquarters_fw_3","localCode":"LOCAL-HQ-FW-003","name":"投诉风险","sort":3},{"id":"local_headquarters_fw_4","localCode":"LOCAL-HQ-FW-004","name":"无效客户","sort":4}],
    "headquarters_hf": [{"id":"local_headquarters_hf_1","localCode":"LOCAL-HQ-HF-001","name":"已完成","sort":1},{"id":"local_headquarters_hf_2","localCode":"LOCAL-HQ-HF-002","name":"需复访","sort":2},{"id":"local_headquarters_hf_3","localCode":"LOCAL-HQ-HF-003","name":"无意向","sort":3},{"id":"local_headquarters_hf_4","localCode":"LOCAL-HQ-HF-004","name":"无效客户","sort":4}],
    "headquarters_xxs": [{"id":"local_headquarters_xxs_1","localCode":"LOCAL-HQ-XXS-001","name":"高意向","sort":1},{"id":"local_headquarters_xxs_2","localCode":"LOCAL-HQ-XXS-002","name":"中意向","sort":2},{"id":"local_headquarters_xxs_3","localCode":"LOCAL-HQ-XXS-003","name":"低意向","sort":3},{"id":"local_headquarters_xxs_4","localCode":"LOCAL-HQ-XXS-004","name":"无意向","sort":4},{"id":"local_headquarters_xxs_5","localCode":"LOCAL-HQ-XXS-005","name":"无效客户","sort":5}],
    "headquarters_lxs": [{"id":"local_headquarters_lxs_1","localCode":"LOCAL-HQ-LXS-001","name":"可激活","sort":1},{"id":"local_headquarters_lxs_2","localCode":"LOCAL-HQ-LXS-002","name":"需培育","sort":2},{"id":"local_headquarters_lxs_3","localCode":"LOCAL-HQ-LXS-003","name":"无意向","sort":3},{"id":"local_headquarters_lxs_4","localCode":"LOCAL-HQ-LXS-004","name":"无效客户","sort":4}]
  };
  const supplierConfigs = {
    "kdxf_store_db": {"enabledTagIds":["kdxf_1","kdxf_2","kdxf_3","kdxf_4","kdxf_5"]},
    "kdxf_store_fw": {"enabledTagIds":["kdxf_1","kdxf_2","kdxf_3","kdxf_4","kdxf_5","kdxf_6"]},
    "kdxf_store_hf": {"enabledTagIds":["kdxf_1","kdxf_2","kdxf_3","kdxf_4","kdxf_5","kdxf_6","kdxf_7","kdxf_8"]},
    "kdxf_store_xxs": {"enabledTagIds":["kdxf_1","kdxf_2","kdxf_3","kdxf_4"]},
    "kdxf_store_lxs": {"enabledTagIds":["kdxf_2","kdxf_3","kdxf_4","kdxf_5"]},
    "kdxf_headquarters_db": {"enabledTagIds":["kdxf_1","kdxf_2","kdxf_3","kdxf_4","kdxf_5","kdxf_6","kdxf_7","kdxf_8"]},
    "kdxf_headquarters_hf": {"enabledTagIds":["kdxf_1","kdxf_2","kdxf_3","kdxf_4","kdxf_5","kdxf_6","kdxf_7","kdxf_8"]},
    "kdxf_headquarters_xxs": {"enabledTagIds":["kdxf_1","kdxf_2","kdxf_3","kdxf_4","kdxf_5","kdxf_6"]},
    "blvcp_store_db": {"enabledTagIds":["blvcp_1","blvcp_2","blvcp_3","blvcp_4","blvcp_5","blvcp_6"]},
    "blvcp_store_fw": {"enabledTagIds":["blvcp_1","blvcp_2","blvcp_3","blvcp_4","blvcp_5","blvcp_6","blvcp_7","blvcp_8"]},
    "blvcp_store_hf": {"enabledTagIds":["blvcp_1","blvcp_2","blvcp_3","blvcp_4","blvcp_5","blvcp_6","blvcp_7","blvcp_8","blvcp_9","blvcp_10"]},
    "blvcp_headquarters_db": {"enabledTagIds":["blvcp_1","blvcp_2","blvcp_3","blvcp_4","blvcp_5","blvcp_6","blvcp_7","blvcp_8","blvcp_9","blvcp_10"]},
    "blvcp_headquarters_xxs": {"enabledTagIds":["blvcp_1","blvcp_2","blvcp_3","blvcp_4"]},
    "blvcp_headquarters_lxs": {"enabledTagIds":["blvcp_2","blvcp_3","blvcp_4","blvcp_5"]},
    "bl_store_db": {"enabledTagIds":["bl_1","bl_2","bl_3","bl_4","bl_5","bl_6","bl_7","bl_8"]},
    "bl_store_hf": {"enabledTagIds":["bl_1","bl_2","bl_3","bl_4","bl_5","bl_6","bl_7","bl_8","bl_9","bl_10","bl_11","bl_12"]},
    "bl_store_xxs": {"enabledTagIds":["bl_1","bl_2","bl_3","bl_4","bl_5"]},
    "bl_headquarters_db": {"enabledTagIds":["bl_1","bl_2","bl_3","bl_4","bl_5","bl_6","bl_7","bl_8","bl_9","bl_10","bl_11","bl_12"]},
    "bl_headquarters_fw": {"enabledTagIds":["bl_1","bl_2","bl_3","bl_4","bl_5","bl_6","bl_7","bl_8"]},
    "bl_headquarters_lxs": {"enabledTagIds":["bl_2","bl_3","bl_4","bl_5","bl_6"]},
    "yzzh_store_db": {"enabledTagIds":["yzzh_1","yzzh_2","yzzh_3","yzzh_4","yzzh_5"]},
    "yzzh_store_fw": {"enabledTagIds":["yzzh_1","yzzh_2","yzzh_3","yzzh_4","yzzh_5","yzzh_6","yzzh_7"]},
    "yzzh_store_hf": {"enabledTagIds":["yzzh_1","yzzh_2","yzzh_3","yzzh_4","yzzh_5","yzzh_6","yzzh_7","yzzh_8","yzzh_9"]},
    "yzzh_headquarters_db": {"enabledTagIds":["yzzh_1","yzzh_2","yzzh_3","yzzh_4","yzzh_5","yzzh_6","yzzh_7","yzzh_8","yzzh_9"]},
    "yzzh_headquarters_xxs": {"enabledTagIds":["yzzh_1","yzzh_2","yzzh_3","yzzh_4"]},
    "zkj_store_db": {"enabledTagIds":["zkj_1","zkj_2","zkj_3","zkj_4"]},
    "zkj_store_hf": {"enabledTagIds":["zkj_1","zkj_2","zkj_3","zkj_4","zkj_5","zkj_6"]},
    "zkj_store_xxs": {"enabledTagIds":["zkj_1","zkj_2","zkj_3"]},
    "zkj_headquarters_db": {"enabledTagIds":["zkj_1","zkj_2","zkj_3","zkj_4","zkj_5","zkj_6"]},
    "zkj_headquarters_hf": {"enabledTagIds":["zkj_1","zkj_2","zkj_3","zkj_4","zkj_5","zkj_6"]},
    "zkj_headquarters_xxs": {"enabledTagIds":["zkj_1","zkj_2","zkj_3","zkj_4"]}
  };
  const scenes = [
    {"id":1,"name":"燃油车新线索-一知","sceneId":"2021498427234983938","code":"AI-XXY","category":"新线索","tenant":"东风日产-燃油车","platform":"一知科技","updater":"-","updateTime":"2026-05-19 08:30:10","status":"running"},
    {"id":5,"name":"DCC-一知-N7冷线索","sceneId":"2027729970601218049","code":"DCC-YZ-N7-LXS","category":"冷线索","tenant":"东风日产-燃油车","platform":"一知科技","updater":"-","updateTime":"2026-05-19 08:30:10"},
    {"id":6,"name":"燃油车新线索-中科金","sceneId":"ZKJ20260601001","code":"ZKJ-XXY","category":"新线索","tenant":"东风日产-燃油车","platform":"中科金智能","updater":"-","updateTime":"2026-06-01 09:15:00"},
    {"id":7,"name":"NEV-冷线索-中科金","sceneId":"ZKJ20260602002","code":"ZKJ-LXS","category":"冷线索","tenant":"东风日产-燃油车","platform":"中科金智能","updater":"-","updateTime":"2026-06-02 10:30:00"},
    {"id":8,"name":"DCC-中科金-N7冷线索","sceneId":"ZKJ20260603003","code":"ZKJ-DCC-N7","category":"冷线索","tenant":"东风日产-燃油车","platform":"中科金智能","updater":"-","updateTime":"2026-06-03 14:00:00"},
    {"id":9,"name":"东风日产-新线索-电声","sceneId":"DS-SCENE-001","code":"DS-XXY","category":"新线索","tenant":"东风日产-燃油车","platform":"电声","updater":"-","updateTime":"2026-07-15 09:00:00","strategyCode":"NISSAN_NEW_LEAD_001","robotName":"东风日产新线索机器人"},
    {"id":10,"name":"华东店-冷线索跟进-大众通信","sceneId":"9f6d9a40-2fb3-4c56-8b21-202607140017","taskUuid":"9f6d9a40-2fb3-4c56-8b21-202607140017","code":"DZ-LXS","category":"冷线索","tenant":"东风日产-燃油车","platform":"大众通信","modelType":"大模型","updater":"-","updateTime":"2026-07-14 08:30:00","redialEnabled":true,"redialMode":"scheduled","scheduledRedialTimes":2,"scheduledConfigConfirmed":true,"taskRedialRiskAccepted":false,"redialConfirmedBy":"管理员","redialConfirmedAt":"2026-09-02 15:30:00"},
    {"id":11,"name":"燃油车新线索-冰兰","sceneId":"BL-SCENE-001","code":"BL-XXY","category":"新线索","tenant":"东风日产-燃油车","platform":"冰兰","updater":"-","updateTime":"2026-07-16 09:00:00"},
    {"id":12,"name":"厚朴-新线索首访","sceneId":"HP-SCENE-001","code":"HP-XXY","category":"新线索","tenant":"东风日产-燃油车","platform":"厚朴","modelType":"大模型","updater":"-","updateTime":"2026-07-17 09:00:00","taskName":"HP-DEMO-新线索首访","taskId":"HP-TASK-20260714-001","batchId":"HP-BATCH-20260714-0001","taskStatus":1,"botId":"bot_hp_nissan_001","taskType":"streaming","schedule":{"startTime":"09:00","endTime":"18:00"},"concurrency":50,"redial":true,"uncalledFirst":true,"templateId":"TPL-HP-XXS-001","callbackConfigured":true},
    {"id":13,"name":"厚朴-保客回访","sceneId":"HP-SCENE-002","code":"HP-BKHF","category":"回访","tenant":"东风日产-燃油车","platform":"厚朴","modelType":"大模型","updater":"-","updateTime":"2026-07-13 14:05:00","taskName":"HP-DEMO-保客回访","taskId":"HP-TASK-20260713-001","batchId":"HP-BATCH-20260713-0003","taskStatus":4,"botId":"bot_hp_nissan_002","taskType":"same_day","schedule":null,"concurrency":30,"redial":true,"uncalledFirst":false,"templateId":"TPL-HP-BKHF-002","callbackConfigured":true},
    {"id":14,"name":"厚朴-流失预警","sceneId":"HP-SCENE-003","code":"HP-LSYJ","category":"流失预警","tenant":"东风日产-燃油车","platform":"厚朴","modelType":"大模型","updater":"-","updateTime":"2026-07-15 10:00:00","taskName":"HP-DEMO-流失预警","taskId":"HP-TASK-20260715-001","batchId":"HP-BATCH-20260715-0002","taskStatus":6,"botId":"bot_hp_nissan_003","taskType":"streaming","schedule":{"startTime":"09:00","endTime":"19:00"},"concurrency":60,"redial":false,"uncalledFirst":true,"templateId":"TPL-HP-LSYJ-003","callbackConfigured":true}
  ];
  const assignedDemo = {
    "17": [{"phone":"138****1111","assignedTime":"2026-07-24 09:15:00","waitTime":"排队中（通道 DT-SH-001）"},{"phone":"139****2222","assignedTime":"2026-07-24 09:16:00","waitTime":"排队中（通道 DT-SH-001）"},{"phone":"136****3333","assignedTime":"2026-07-24 09:17:00","waitTime":"排队中（通道 DT-SH-001）"}],
    "18": [{"phone":"150****4444","assignedTime":"2026-07-23 14:00:00","waitTime":"排队中（通道 DT-NJ-001）"}]
  };
  const importedDemo = [
    {"id":1,"sceneId":17,"name":"华东冷线索_0724.csv","total":150,"success":148,"fail":2,"batchId":"DZ-BATCH-20260724-001","validNumberCount":148,"status":"已完成","time":"2026-07-24 09:20:00","op":"超管"},
    {"id":2,"sceneId":14,"name":"保客回访名单.xlsx","total":300,"success":298,"fail":2,"batchId":"ZKJ-BATCH-20260720-001","validNumberCount":298,"status":"已完成","time":"2026-07-20 14:30:00","op":"张三"},
    {"id":3,"sceneId":17,"name":"补充名单_0725.csv","total":80,"success":80,"fail":0,"batchId":"DZ-BATCH-20260725-001","validNumberCount":80,"status":"导入中","time":"2026-07-25 08:00:00","op":"超管"},
    {"id":4,"sceneId":24,"name":"厚朴新线索首访_0714.csv","total":1000,"success":998,"fail":2,"batchId":"HP-BATCH-20260714-0001","validNumberCount":998,"status":"已完成","time":"2026-07-14 09:25:00","op":"超管"}
  ];

  function sameRecord(left,right) {
    if (left===right) return true;
    if (!left || !right || typeof left!=='object' || typeof right!=='object' || Array.isArray(left)!==Array.isArray(right)) {
      return false;
    }
    const keys = Object.keys(left);
    return keys.length===Object.keys(right).length &&
      keys.every(key=>Object.hasOwn(right,key) && sameRecord(left[key],right[key]));
  }

  function hasNonDemoImports(imports,tenantId) {
    if (!imports) return false;
    if (imports.history.some(row=>!importedDemo.some(seed=>sameRecord(row,seed)))) return true;
    return Object.entries(imports.assigned).some(([task,rows])=>{
      if (!Array.isArray(rows)) return true;
      return rows.some(row=>{
        if (!row || typeof row!=='object') return true;
        const {assignmentId,assignmentTenant,assignmentTask,assignmentOrigin,...fields} = row;
        const seeds = Object.hasOwn(assignedDemo,task) ? assignedDemo[task] : [];
        const matches = seeds.findIndex(seed=>sameRecord(fields,seed));
        if (matches<0) return true;
        if (String(assignmentId || '')==='') return Object.keys(row).length!==Object.keys(fields).length;
        return assignmentId!=='AIROW-'+encodeURIComponent(tenantId)+'-'+encodeURIComponent(task)+'-'+matches ||
          assignmentTenant!==tenantId || assignmentTask!==task || assignmentOrigin!=='legacy';
      });
    });
  }

  window.DLegacyAICategoryFixtures = Object.freeze({
    standardTags: (key,rows)=>sameRecord(standardTags[key],rows),
    supplierConfig: (key,config)=>sameRecord(supplierConfigs[key],config),
    scene: row=>scenes.some(seed=>sameRecord(seed,row)),
    hasNonDemoImports
  });
})();
