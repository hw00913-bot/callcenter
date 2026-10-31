#!/usr/bin/env python3
"""Publish the authorized analysis views without changing diagram geometry."""
from pathlib import Path
import hashlib
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
lock = json.loads((ROOT / 'inputs/design-source-lock.json').read_text())
entries = {entry['relative']: entry for entry in lock['entries']}


def read_locked(relative):
    entry = entries[relative]
    data = Path(entry['path']).read_bytes()
    assert hashlib.sha256(data).hexdigest() == entry['sha256'], relative + ' changed'
    return data.decode(), entry['sha256']


def svg_blocks(text):
    return re.findall(r'<svg\b[\s\S]*?</svg>', text)


def publish(source, target, kind):
    text, digest = read_locked('outputs/' + source)
    before = svg_blocks(text)
    counter = {}

    def marker(name):
        counter[name] = counter.get(name, 0) + 1
        return f' data-{name}="{kind}-{name}-{counter[name]}"'

    if kind == 'business-process':
        for original, name in [('lane-id', 'flow-lane'), ('node-id', 'flow-node'), ('edge-index', 'flow-edge')]:
            text = re.sub(r'data-' + original + r'="[^"]+"', lambda m: m[0] + marker(name), text)
    else:
        # Participant labels and message groups are actual visible source SVG elements.
        text = re.sub(r'<text\b[^>]*\by="45"[^>]*>', lambda m: m[0][:-1] + marker('sequence-participant') + '>', text)
        text = re.sub(r'data-message-index="[^"]+"', lambda m: m[0] + marker('sequence-message'), text)
    after = [re.sub(r' data-(?:flow-(?:lane|node|edge)|sequence-(?:participant|message))="[^"]+"', '', s) for s in svg_blocks(text)]
    assert before == after, 'SVG geometry/content changed'
    text = text.replace('<body ', f'<body data-delivery-diagram="{kind}" data-diagram-state="ready" ', 1)
    text = text.replace('</head>', f'<meta name="analysis-source-sha256" content="{digest}"><meta name="review-status" content="authorized-static-mock;G3-pending"><link rel="stylesheet" href="../assets/css/cloud-ui.css"><link rel="stylesheet" href="../assets/css/diagram-reading.css"></head>', 1)
    text = text.replace('</header>', '<p class="reading-note">本地模拟评审，生产待核事项保留。图集保留分析快照的原文与几何：业务中心与客户中心现共用“业务&amp;客户”入口；原多路径人工选择适用于旧模板。2026-10-28 新保存的 FIRST_MATCH_V1 模板按 IF / ELSEIF 优先级首命中、唯一 ELSE 兜底，来源待核时暂停，仍由人员确认推进。AI 仅使用最终状态和稳定意向标签，云呼叫使用对应状态域及分类导入／培育字段；不自动起呼或转交，历史实例不迁移。</p></header>', 1)
    text = text.replace('</body>', '<script src="../js/delivery-nav.js"></script></body>', 1)
    (ROOT / target).write_text(text)
    return {'source': entries['outputs/' + source]['path'], 'sourceSha256': digest,
            'target': target, 'svgCount': len(before), 'svgGeometryAndTextPreserved': True,
            'markers': counter, 'publication': 'reuse-with-provenance-adapter; authorized finite Mock'}


published = [
    publish('business-scenario-atlas.html', 'flowcharts/business-process.html', 'business-process'),
    publish('interaction-sequence-atlas.html', 'flowcharts/sequence-interaction.html', 'sequence-interaction'),
]
facts, facts_hash = read_locked('memory/project-facts.json')
systems = json.loads(facts)['systems']
systems = [{**s,'description':s['description'].replace('v1.1.0最终功能及','既有')} for s in systems]
cards = ''.join(f'<article data-related-system="system-{i+1}"><h2>{html.escape(s["name"])}</h2><p>{html.escape(s["description"])}</p></article>' for i, s in enumerate(systems))
(ROOT / 'related-systems/index.html').write_text('''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>关联系统 · D联络云</title><link rel="stylesheet" href="../assets/css/reading-views.css"><link rel="stylesheet" href="../assets/css/cloud-ui.css">
<meta name="analysis-source-sha256" content="''' + facts_hash + '''"></head>
<body><main class="reading-page" data-related-systems data-related-systems-state="ready">
<header><p class="eyebrow">D联络云 · v2.0.0</p><h1>关联系统与职责</h1><p>统一入口与公共配置，承接两套系统的原有专业能力。</p></header>
<section class="system-grid">''' + cards + '''</section>
<section class="reading-card"><h2>运营怎样使用</h2>
<dl><dt>业务&amp;客户</dt><dd>业务分类 → 流转规则模板 → 分类路由 → 业务台账中的导入与分配。按已确认规则由人员启动、推进和转交；在同一区域查看客户联系、维护联系限制。入口合并不改变独立权限、数据范围与电话离开保护。</dd>
<dt>呼叫中心</dt><dd>配置 AI、人工、预外呼、IVR 和呼入所需的专业资源；执行、记录与供应商配置沿用原模块。</dd>
<dt>坐席工作台、报表与系统管理</dt><dd>分别承载坐席作业、原有统计、品牌租户及成员权限。品牌关联本身不授予跨租户数据访问权。</dd></dl></section>
<section class="reading-card"><h2>本次评审边界</h2><p>本地模拟演示，不连接真实认证、供应商或电话平台。完整 DCC CRM、自动编排以及新的客户主档不在本轮范围。12 项延期与 14 项工程缺证继续保留，正式需求仍待最终冻结。</p>
<p>业务流程和交互时序直接复用当前分析图集；图页完整不代表外部接口或所有页面动作已通过验收。</p></section>
<p><a href="../index.html" data-delivery-switch="prototype">返回原型</a> · <a href="../flowcharts/business-process.html" data-delivery-switch="business-flow">业务流程</a> · <a href="../flowcharts/sequence-interaction.html" data-delivery-switch="sequence-flow">交互时序</a></p>
</main><script src="../js/delivery-nav.js"></script></body></html>
''')
provenance_path = ROOT / 'memory/reuse-provenance.json'
provenance = json.loads(provenance_path.read_text())
provenance['readingViews'] = published
provenance['relatedSystemsSource'] = {'source': entries['memory/project-facts.json']['path'], 'sha256': facts_hash}
provenance_path.write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'views': published, 'relatedSystems': len(systems)}, ensure_ascii=False, indent=2))
