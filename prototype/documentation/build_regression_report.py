"""Render the 2026-09-20 maintenance report from fresh recorded local evidence.

The report is not a supplier integration, full-button end-to-end, or Loop-stage
acceptance claim. Previous dated reports and evidence are left untouched.
"""
from pathlib import Path
from html import escape
import hashlib
import json
import shutil
from build_delivery import markdown_html, table
from functional_content import VERSION, DATE

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'reviews'
STAMP = '20260920'
SOURCE_EVIDENCE = ROOT / 'qa' / f'evidence-regression-delivery-{STAMP}'
EVIDENCE = OUT / f'evidence-{STAMP}'
AGGREGATE_PATH = f'qa/regression-delivery-verification-{STAMP}.json'
REPORT_NAME = f'full-regression-{STAMP}'


def load(path):
    return json.loads(path.read_text())


FIXES = [
    {
        'id': 'REG-20260920-01',
        'area': '预测话单号码识别与上下文校验',
        'before': '号码识别读取未完整核对话单类型、账号与供应商通话身份；本地通话/会话 contactId 若被当作供应商 mainUniqueId，会误拒绝本通合法话单。现有字典还保留异步语义待确认的旧说明。',
        'after': '按真实字段归属核对类型、账号及已明确的供应商通话标识；本地通话/会话 contactId 不参与供应商主通话 ID 比较。预测话单 0 表示同步、1 表示结果已异步写回 sipCause；未知标识和未识别结果原样保留。不以标识判断接通、不设置两分钟必完成时限，读取不产生新话单或重呼。',
        'references': 'D-053 / SRC-083；FA-070、FA-071；号码识别、通话记录与统计',
    },
    {
        'id': 'REG-20260920-02',
        'area': 'FA-071 字段目录追溯',
        'before': '应用最新字段映射后，接口字段目录的 mappingIds 与 adoption 未同步重算，sipCauseAsyncUpdateFlag 的采用关系落后于 FA-071。',
        'after': '以当前字段映射统一重算目录关联；API-318 的 sipCauseAsyncUpdateFlag 明确关联 FA-071。供应商原文字段类型、描述及官方快照保持原样；本轮更新采用规则和追溯关系。',
        'references': 'API-318 / FA-071；字段对齐、接口契约、交付核验',
    },
]


def suite_summary(runtime):
    """Use actual suite output, not historical or hard-coded check counts."""
    result = []
    for item in runtime['results']:
        parsed = json.loads(item['output'])
        count = parsed.get('count', parsed.get('passed'))
        if not isinstance(count, int) or isinstance(count, bool):
            checks = parsed.get('checks', [])
            if not isinstance(checks, list):
                raise ValueError(f'Cannot determine declared checks: {item["suite"]}')
            count = len(checks)
        result.append({
            'suite': item['suite'], 'declaredChecks': count,
            'exitCode': item['exitCode'],
            'passed': item['exitCode'] == 0,
        })
    return result


def copy_evidence():
    """Make the report readable within an extracted development package."""
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    copied = []
    for source in sorted(SOURCE_EVIDENCE.glob('*.json')):
        target = EVIDENCE / source.name
        shutil.copy2(source, target)
        copied.append({
            'path': str(target.relative_to(ROOT)),
            'sourcePath': str(source.relative_to(ROOT)),
            'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
        })
    return copied


def main():
    runtime = load(SOURCE_EVIDENCE / 'offline-checks.json')
    integrity = load(SOURCE_EVIDENCE / 'source-integrity.json')
    browser = load(SOURCE_EVIDENCE / 'browser-checks.json')
    if browser['version'] != VERSION:
        # This dated report belongs to the version actually exercised. Later
        # supplier clarifications must not relabel old browser evidence.
        paths = [OUT / (REPORT_NAME + suffix) for suffix in ['.json', '.md', '.html']]
        if not all(path.is_file() for path in paths):
            raise ValueError('Historical report is missing; do not rebuild it from newer product facts')
        print(json.dumps({'report': str(paths[-1].relative_to(ROOT)),
                          'result': 'preserved_historical_report',
                          'evidenceVersion': browser['version'], 'currentVersion': VERSION}, ensure_ascii=False))
        return
    pending = load(ROOT / 'docs/remaining-confirmations.json')
    suites = suite_summary(runtime)
    if runtime['suites'] != len(suites):
        raise ValueError('Runtime suite total does not match recorded suite results')
    failed_suites = sum(not row['passed'] for row in suites)
    if runtime['failed'] != failed_suites:
        raise ValueError('Runtime failure total does not match recorded suite results')
    checks = sum(row['declaredChecks'] for row in suites)
    browser_checks = browser['checks']
    browser_failures = sum(not row['pass'] for row in browser_checks)
    missing = integrity['missing']
    syntax_failures = integrity['syntaxFailures']
    passed = not (failed_suites or browser_failures or missing or syntax_failures)
    copied = copy_evidence()
    report = {
        'version': VERSION, 'date': DATE,
        'scope': 'local_prototype_maintenance_regression_not_live_supplier_integration',
        'result': 'pass' if passed else 'fail',
        'runtimeSuites': len(suites), 'runtimeChecks': checks,
        'runtimeCheckCountMeaning': 'sum of checks declared in actual suite output; nested assertions are not separately counted',
        'failedSuites': failed_suites, 'suiteResults': suites,
        'sourceIntegrity': {
            key: integrity[key] for key in
            ['scope', 'checkedReferences', 'missing', 'syntaxFiles', 'syntaxFailures']
        },
        'browserCheckCount': len(browser_checks),
        'browserFailedChecks': browser_failures, 'browserChecks': browser_checks,
        'browserObservations': browser.get('runtimeConsoleErrors', []),
        'browserLimitations': browser.get('limitations', []),
        'localTestData': browser.get('localTestData', ''),
        'fixes': FIXES, 'copiedEvidence': copied,
        'confirmationTopics': len(pending['items']),
        'preparationTypes': len(pending['preparations']),
        'aggregateVerificationPath': AGGREGATE_PATH,
        'supplierIntegration': 'not_executed',
        'productionAcceptance': 'planned_not_executed',
        'allButtonsEndToEnd': 'not_claimed',
        'loopS8Gate': 'not_claimed',
        'gitlabPush': 'not_requested_this_turn',
    }
    browser_observations = browser.get('runtimeConsoleErrors', [])
    observation_text = ('本轮浏览器记录中未捕获控制台 error/warn。' if not browser_observations else
                        '本轮浏览器观察项：' + json.dumps(browser_observations, ensure_ascii=False))
    md = '\n'.join([
        '# 原型回归与开发包更新报告', '',
        f'版本：`{VERSION}` · 日期：{DATE}。', '',
        '本轮围绕当前原型和 D-046–D-053 已确认规则执行本地回归，并修复号码识别读取与字段目录追溯两类问题。既有历史报告独立保留，不覆盖或改写其结果。', '',
        f'**回归结果：{"通过" if passed else "存在失败，详见证据"}。** '
        f'离线检查 {len(suites)} 组、{checks} 个声明检查项，失败 {failed_suites} 组；'
        f'{integrity["syntaxFiles"]} 个 JS 文件语法检查，失败 {len(syntax_failures)} 个；'
        f'{integrity["checkedReferences"]} 处本地资源引用检查，缺失 {len(missing)} 处。', '',
        f'另记录 {len(browser_checks)} 项本机浏览器检查，失败 {browser_failures} 项。检查项按各组真实输出计数，不把循环内断言另行累计。', '',
        '## 本轮修复', '',
        table(['范围', '回归发现', '修复后的规则', '关联内容'],
              [(x['area'], x['before'], x['after'], x['references']) for x in FIXES]),
        '## 本地自动回归', '',
        '覆盖任务创建与重呼、暂停与结束、号码授权与启停、坐席分机与配置、技能与队列、班长管理、通话中记录、线索统计、删除重建及断线恢复等现有套件；新增预测话单号码识别专项。完整明细见各组实际检查名称。', '',
        table(['检查组', '声明检查项', '结果'],
              [(x['suite'], str(x['declaredChecks']), '通过' if x['passed'] else '未通过') for x in suites]),
        '## 浏览器检查', '',
        '使用本机静态原型和演示账号执行。页面、菜单和抽屉的检查范围以本表为准；没有将这些冒烟检查写成所有按钮的浏览器端到端验收。', '',
        table(['检查', '结果'], [(x['check'], '通过' if x['pass'] else '未通过') for x in browser_checks]),
        observation_text, '', browser.get('localTestData', ''), '',
        '## 开发资料与交付核验', '',
        '当前功能说明、附表、字段映射、流程与时序、系统蓝图以及开发契约按本轮规则同步。开发任务和生产验收用例继续用于后续实现，不能用本地演示检查替代真实接入验收。', '',
        '- [完整功能说明](../docs/functional-spec.html) · [规则附表](../docs/interaction.html) · [字段对齐](../docs/field-alignment.html)。',
        '- [业务流程](../flowcharts/business-process.html) · [交互时序](../flowcharts/sequence-interaction.html) · [系统蓝图](../related-systems/index.html)。',
        '- [开发阅读指引](../docs/development.html) · [版本与变更记录](../docs/change-log.html)。',
        f'- [本轮检查总表](../{AGGREGATE_PATH})：最终文档一致性、开发包完整性及解压重建结果以该表所引用的证据为准。', '',
        '## 待确认与验证边界', '',
        f'保留 {len(pending["items"])} 个供应商确认主题及 {len(pending["preparations"])} 类接入准备，主题数与待确认字段数分开统计。', '',
        table(['编号', '主题'], [(x['id'], x['topic']) for x in pending['items']]),
        'CF-13 中预测话单异步标识已经明确，自动外呼与呼入的识别字段覆盖和编码对应仍单独保留；不把 1–2 分钟描述成固定完成时限。', '',
        '- 仅验证本地原型、演示数据、源码与交付资料，未执行真实供应商接口、电话媒体、生产并发或生产安全验收。',
        '- 没有声明所有按钮均完成浏览器端到端操作，也没有声明 Loop S8 阶段门禁通过。',
        '- 资源检查覆盖入口页、脚本中的固定资源路径和 CSS URL；语法检查不替代所有运行时路径检查。',
        '- 本轮没有请求 GitLab 提交；交付更新保存在当前本地项目。', '',
        '## 可独立阅读的证据', '',
        f'- [离线检查明细](evidence-{STAMP}/offline-checks.json)。',
        f'- [源码语法与资源引用](evidence-{STAMP}/source-integrity.json)。',
        f'- [浏览器检查事实](evidence-{STAMP}/browser-checks.json)。',
        f'- [检查总表](../{AGGREGATE_PATH})。', '',
    ])
    OUT.mkdir(exist_ok=True)
    (OUT / f'{REPORT_NAME}.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    (OUT / f'{REPORT_NAME}.md').write_text(md)
    html = ('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>原型回归与开发包更新报告</title><style>body{margin:0;background:#f3f5f9;color:#243247;font:15px/1.8 system-ui,sans-serif}main{max-width:1180px;margin:30px auto;padding:36px;background:#fff;border-radius:12px}h1{font-size:28px}h2{margin-top:32px;font-size:20px}a{color:#1765d1}table{border-collapse:collapse;width:100%;font-size:14px}th,td{padding:12px;border:1px solid #dce2e9;text-align:left;vertical-align:top}th{background:#f0f4fa}.table-wrap{overflow:auto}code{background:#f0f3f8;padding:2px 4px}</style><main>'
            f'<a href="../index.html">返回原型</a> · <a href="{escape(REPORT_NAME)}.md">Markdown</a>'
            + markdown_html(md) + '</main></html>')
    (OUT / f'{REPORT_NAME}.html').write_text(html)
    print(json.dumps({'report': f'reviews/{REPORT_NAME}.html', 'result': report['result'],
                      'suites': len(suites), 'checks': checks,
                      'browserChecks': len(browser_checks), 'copiedEvidence': len(copied)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
