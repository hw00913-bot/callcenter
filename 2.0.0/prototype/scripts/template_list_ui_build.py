"""Presentation-only layout for the current template-list filter toolbar."""
from pathlib import Path


def one(code, before, after):
    if code.count(before) != 1:
        raise ValueError('Template list UI source conflict: ' + before[:140])
    return code.replace(before, after, 1)


def transform(kind, path, code):
    if kind != 'cloud' or path != 'js/pages/flow-configuration.js':
        return code
    code = one(code, '<div class="fc-scope"><label class="field">',
               '<section class="fc-scope" aria-label="流转模板筛选"><div class="fc-scope-controls"><label class="field">')
    code = one(code, "label:b.name+' · '+(b.brandId || b.id)", 'label:b.name')
    code = one(code, '<label class="field grow"><span>模板名称</span>',
               '<label class="field fc-scope-name"><span>模板名称</span>')
    code = one(code, 'placeholder="输入名称或标识"', 'placeholder="请输入模板名称"')
    code = one(code, '<button class="btn btn-primary" onclick="FlowConfiguration.query()">查询</button><span class="fc-scope-copy">保存当前配置，已开始运行保持原方案</span></div>',
               '<button type="button" class="btn btn-primary fc-scope-query" onclick="FlowConfiguration.query()">查询</button></div><p class="fc-scope-copy">模板更新用于新运行，已开始运行保持原方案。</p></section>')
    return code


def style_source():
    css = Path(__file__).with_name('template-list-ui.css').read_text()
    return '<style data-template-list-style="1">' + css.replace('</style', '<\\/style') + '</style>'
