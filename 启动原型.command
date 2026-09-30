#!/bin/zsh
cd -- "${0:A:h}" || exit 1
python3 - <<'PYTHON'
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import subprocess
server = ThreadingHTTPServer(('127.0.0.1', 8773), SimpleHTTPRequestHandler)
subprocess.run(['open', 'http://127.0.0.1:8773/prototype/'], check=False)
print('原型已启动。关闭此窗口即可停止。')
try:
    server.serve_forever()
except KeyboardInterrupt:
    server.server_close()
PYTHON
