/** 新分钟账户的本地演示数据；不迁移或折算旧金额账，不代表真实付款。 */
(function () {
  'use strict';
  window.AiBillingMock = {
    products: {
      trial_package: {
        code: 'trial_package', name: '试用套餐', unitPrice: 0, unit: '个',
        defaultDurationDays: 30, defaultCreditMinutes: 500,
        usageRule: '仅试用租户可开通，默认 0 元、开始后 30 天、500 分钟。价格、开始/结束时间及入账分钟均可手工编辑；成功即入统一分钟池，开始前不可新外呼。'
      },
      standard_annual: {
        code: 'standard_annual', name: '标准版年包', unitPrice: 5000, unit: '店',
        defaultDurationDays: 365, defaultCreditMinutes: 10000,
        serviceItems: ['系统平台使用', '外呼线路/号码', '外呼场景话术设计', '流程搭建', '效果调优', '数据看板', '运营/运维服务'],
        scriptAllowance: 2,
        scriptChangeRule: '修改幅度高于 50% 按新话术场景处理，低于 50% 免费维护；正好 50% 需人工确认。'
      },
      call_credit_pack: {
        code: 'call_credit_pack', name: '话费充值包', unitPrice: 1000, unit: '包',
        defaultDurationMode: 'remaining_service_period', defaultCreditMinutesPerPack: 3500,
        usageRule: '仅有效商用服务可购买，支持多包、多次叠加。开始仅作配置记录，结束跟随租户到期，不延长服务；提交成功即入统一分钟池。'
      }
    },
    // 仅这两个随包固定租户有新规则演示期初余额。姓名、角色、租户关系仍取当前项目。
    openingAccounts: {
      'TEN-NISSAN-HQ': {
        instanceId: 'CCC-NISSAN', provenance: 'local-minute-demo-opening-balance', demoLabel: '新规则本地模拟期初账户',
        entitlement: { productType: 'standard_annual', effectiveAt: '2026-09-01 00:00', expiresAt: '2027-09-01 00:00', durationDays: 365 },
        unifiedMinutePool: { availableMinutes: 8200, frozenMinutes: 400, consumedMinutes: 1400, accountVersion: 'AI-MINUTE-SEED-HQ-V1' }
      },
      'TEN-NISSAN-SH': {
        instanceId: 'CCC-NISSAN', provenance: 'local-minute-demo-opening-balance', demoLabel: '新规则本地模拟期初账户',
        entitlement: { productType: 'standard_annual', effectiveAt: '2026-09-01 00:00', expiresAt: '2027-09-01 00:00', durationDays: 365 },
        unifiedMinutePool: { availableMinutes: 6200, frozenMinutes: 0, consumedMinutes: 3800, accountVersion: 'AI-MINUTE-SEED-SH-V1' }
      }
    }
  };
})();
