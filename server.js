// 极简本地静态服务器，仅用于本地预览：node server.js  然后打开 http://localhost:8787
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = __dirname;
const PORT = process.env.PORT || 8787;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(url.parse(req.url).pathname); }
  catch (e) { res.writeHead(400); return res.end('Bad Request'); }
  if (pathname === '/') pathname = '/index.html';
  const fp = path.join(ROOT, pathname);
  if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(fp, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found');
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(fp).pipe(res);
  });
}).listen(PORT, () => console.log('本地预览已启动: http://localhost:' + PORT));