"""Render the reviewed exception definitions without changing business rules."""
import json
import re
from build_delivery import DOC, shell, markdown_html, table, heading_id

data = json.loads((DOC / 'exception-definitions.json').read_text())
parts = ['# ' + data['title'], '', '版本 ' + data['version'] + ' · 核对日期 ' + data['date'], '',
         '[下载异常定义表 Excel](通话数据异常与操作审计定义表.xlsx)', '', '## 定义口径', '', data['basis'], '']
parts += ['- ' + text for text in data['summary']]
parts += ['', '## 通话数据异常定义', '',
          'CD-01、CD-02 是当前页面已有的完整异常类型。CD-03 至 CD-11 是已实现的内部校验，尚未自动生成人工异常待办。', '',
          table(data['headers'], data['callDefinitions']), '## 操作审计判定', '',
          '以下按已有操作分支解释正常、失败、未知等情况。当前审计没有这些统一分类字段。成功处理原问题后，应追加审计记录并保留原历史。', '',
          table(data['headers'], data['auditDefinitions']), '## 不直接归为异常的情况', '',
          table(['情况', '判断边界', '依据'], data['exclusions']), '## 通话异常处理状态', '',
          '权限：仅当前供应商账号的超级管理员处理通话数据异常。核对前后工作范围变化时，不应用旧结果。审计查询则允许超级管理员查看当前账号范围、管理员查看本租户，运营无入口。', '',
          table(['状态', '当前含义', '处理规则'], data['states']), '## 当前实现边界与待定义项', '',
          table(['事项', '当前情况', '后续要求'], data['boundaries']), '## 核验依据', '',
          '下列定位供开发核查。功能说明见 [FS-18 通话数据异常](functional-spec.html#FS-18)、[FS-19 操作审计](functional-spec.html#FS-19)；规则见 [附表 B / K / L / M](interaction.html)。', '',
          table(['编号', '材料', '定位'], [[r['id'], '[' + r['name'] + '](../' + r['path'] + ')', '第 ' + str(r['line']) + ' 行起'] for r in data['sources']])]
md = '\n'.join(parts).rstrip() + '\n'
(DOC / 'exception-definitions.md').write_text(md)
nav = [(heading_id(title), title) for title in re.findall(r'^## (.+)$', md, re.M)]
html = shell(data['title'], markdown_html(md), nav, 'exception-definitions.md', 'exceptions')
html = html.replace('</head>', '<style>.doc-exceptions .table-wrap{overflow:auto}.doc-exceptions table{min-width:1120px}.doc-exceptions th,.doc-exceptions td{min-width:130px;vertical-align:top}.doc-exceptions th:first-child,.doc-exceptions td:first-child{min-width:76px}.doc-exceptions td:nth-child(3),.doc-exceptions td:nth-child(5){min-width:230px}</style></head>')
(DOC / 'exception-definitions.html').write_text(html)
# Existing generated pages receive the same catalog entry; future full builds
# obtain it from shell(). Do not regenerate or rewrite their business content.
entry = '<a href="exception-definitions.html">异常定义表</a>'
for page in DOC.glob('*.html'):
    text = page.read_text()
    if 'class="doc-catalog"' in text and entry not in text:
        text = text.replace('<div class="doc-catalog">', '<div class="doc-catalog">' + entry, 1)
        page.write_text(text)
print('Built exception definitions and documentation entry')
