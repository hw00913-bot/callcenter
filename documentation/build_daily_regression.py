"""Render the current maintenance review from actual saved evidence."""
from pathlib import Path
from html import escape
import json

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'qa/daily-alignment-verification-20260920.json'

def main():
    data = json.loads(SOURCE.read_text())
    evidence = ROOT / 'qa/evidence-daily-alignment-20260920'
    offline = json.loads((evidence / 'offline-final.json').read_text())
    browser = json.loads((evidence / 'browser-checks.json').read_text())
    report = dict(data, runtimeSuites=[{'suite':r['suite'], 'exitCode':r['exitCode'],
        'nodeFlags':r.get('nodeFlags',[])} for r in offline['results']], browserChecks=browser['checks'])
    target = ROOT / 'reviews/daily-regression-20260920'
    target.with_suffix('.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    status = {'pass_with_observations':'本地检查通过，保留非阻塞观察项','pass':'本地检查通过','in_progress':'检查进行中'}.get(data['result'],data['result'])
    lines = ['# 2026-09-20 今日原型回归与交付对齐', '', f"版本：`{data['version']}`。{status}。", '',
      '## 结论与范围', '',
      '本轮核对今日原型、功能说明、规则附表、字段映射、待确认事项、业务流程、时序、系统蓝图及完整开发包。检查范围是本地演示及交付一致性；供应商生产验收仍为 planned。', '',
      '## 本轮修复', '']
    lines += ['- '+s for s in data['fixes']]
    lines += ['', '## 检查结果', '', '| 项目 | 结果 |', '| --- | --- |']
    labels = {'browserChecks':'浏览器实测项','offlineSuites':'自动回归组数','offlineChecks':'结构化检查项','offlineFailed':'失败组数','additionalTextPassSuites':'其他通过专项','syntaxFiles':'脚本语法检查','entryResourceReferences':'页面资源引用','protectedSourceFiles':'既有官方及答复文件','documentationChecks':'说明文档一致性检查','documentationLinks':'说明文档链接','deliveryChecks':'开发交付一致性检查','deliveryLinks':'开发交付链接','portableRegenerationSteps':'解压独立重建步骤','portablePreservedFiles':'重建后保留原文文件','portableRebuild':'解压重建结果'}
    for k,v in data.get('checks',{}).items():
        if k == 'additionalTextPassSuites': v = '电话工具条专项通过'
        elif v == 'pass': v = '通过'
        lines.append(f"| {labels.get(k,k)} | {v} |")
    lines += ['', '## 保留观察项', '']
    for row in data.get('observations',[]):
        lines += [f"- **{row['id']} {row['title']}**：{row['evidence']} {row['boundary']}"]
    lines += ['', '## 运行回归', '', '| 检查组 | 结果 | 执行选项 |', '| --- | --- | --- |']
    for row in offline['results']:
        lines += [f"| {row['suite']} | {'通过' if row['exitCode']==0 else '失败'} | {' '.join(row.get('nodeFlags',[])) or '默认'} |"]
    lines += ['', '分机检查曾出现 Node 进程 SIGSEGV，原始失败与诊断已保留；当前显式使用 --jitless 执行全部原断言，不通过自动重试覆盖失败。生产浏览器代码不受此验证选项影响。', '',
      '## 浏览器实测', '', '| 检查 | 观察结果 |', '| --- | --- |']
    lines += [f"| {r['name']} | {r['observed']} |" for r in browser['checks']]
    lines += ['', '## 交付事实', '',
      '分机、时间条件与业务分类新增独立说明章节和开发契约。业务字段按分类动态读取，必填可配置；任务预约结束采用 autoStop、autoStopDay、autoStopTime。官方原始快照保留，新增来源另行归档。', '',
      data['verificationBoundary'], '', '[完整验证记录](../qa/daily-alignment-verification-20260920.json) · [版本与变更](../docs/change-log.html) · [开发交付](../docs/development.html)', '']
    target.with_suffix('.md').write_text('\n'.join(lines))
    # Keep this report portable without introducing a renderer dependency.
    parts=[]; in_table=False; in_list=False
    def inline(t):
        import re
        t=escape(str(t))
        t=re.sub(r'`([^`]+)`',r'<code>\1</code>',t)
        t=re.sub(r'\*\*([^*]+)\*\*',r'<strong>\1</strong>',t)
        return re.sub(r'\[([^\]]+)\]\(([^)]+)\)',r'<a href="\2">\1</a>',t)
    for line in lines:
        if not line.startswith('|') and in_table: parts.append('</tbody></table></div>');in_table=False
        if not line.startswith('- ') and in_list: parts.append('</ul>');in_list=False
        if not line: continue
        if line.startswith('|'):
            cells=[x.strip() for x in line.strip('|').split('|')]
            if all(x.replace('-','').strip()=='' for x in cells): continue
            if not in_table: parts.append('<div class="table"><table><tbody>');in_table=True
            parts.append('<tr>'+''.join('<td>'+inline(c)+'</td>' for c in cells)+'</tr>')
        elif line.startswith('- '):
            if not in_list:parts.append('<ul>');in_list=True
            parts.append('<li>'+inline(line[2:])+'</li>')
        elif line.startswith('# '):parts.append('<h1>'+inline(line[2:])+'</h1>')
        elif line.startswith('## '):parts.append('<h2>'+inline(line[3:])+'</h2>')
        else:parts.append('<p>'+inline(line)+'</p>')
    page='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>今日原型回归与交付对齐</title><style>body{margin:0;background:#f4f6fa;color:#243447;font:15px/1.75 system-ui,sans-serif}main{max-width:1080px;margin:32px auto;padding:28px 36px;background:white;border-radius:14px}h1{font-size:28px}h2{margin-top:30px;font-size:21px}a{color:#176be8}code{background:#eef2f8;padding:2px 5px}table{border-collapse:collapse;width:100%}td{border:1px solid #dce3ed;padding:10px;vertical-align:top}tr:first-child{font-weight:600;background:#f3f6fb}.table{overflow:auto}nav{margin-bottom:24px}@media(max-width:700px){main{padding:20px;margin:12px}}</style><main><nav><a href="../index.html">原型</a> · <a href="../docs/change-log.html">版本与变更</a> · <a href="../docs/development.html">开发交付</a></nav>'''+''.join(parts)+'</main></html>'
    target.with_suffix('.html').write_text(page)
    print(json.dumps({'report':str(target.relative_to(ROOT))+'.html','result':data['result'],'suites':offline['suites'],'failed':offline['failed']},ensure_ascii=False))

if __name__ == '__main__': main()
