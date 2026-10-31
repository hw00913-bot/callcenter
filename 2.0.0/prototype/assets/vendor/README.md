# 本地导入依赖

- JSZip 3.10.1：来自已安装Codex工作区运行时的`node_modules/jszip/dist/jszip.min.js`。按MIT许可使用，许可原文见JSZip-LICENSE.md。
- SAX 1.6.1：来自同一已安装运行时的`node_modules/sax/lib/sax.js`，BlueOak-1.0.0许可原文见SAX-LICENSE.md。

版本与文件SHA登记在memory/reuse-provenance.json的localDependencies。生成期将经典脚本内联到Cloud静态包；运行不安装软件，不连接CDN，也不通过HTTP读取工作簿。仅实现.xlsx（OOXML ZIP/XML）与UTF-8 CSV，旧.xls明确不支持。
