#!/bin/zsh
cd -- "${0:A:h}" || exit 1
python3 - <<'PYTHON'
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import subprocess
project_root = Path.cwd()
archive_root = project_root / '归档'

class ProjectHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        normalized = Path(super().translate_path(path))
        try:
            relative = normalized.relative_to(project_root / '归档')
        except ValueError:
            return str(normalized)
        # Preserve historical archive URLs without duplicating the archive folder.
        return str(archive_root / relative)

server = ThreadingHTTPServer(('127.0.0.1', 8773), ProjectHandler)
subprocess.run(['open', 'http://127.0.0.1:8773/prototype/'], check=False)
print('原型已启动。关闭此窗口即可停止。')
try:
    server.serve_forever()
except KeyboardInterrupt:
    server.server_close()
PYTHON
