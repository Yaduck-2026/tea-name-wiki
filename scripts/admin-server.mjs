import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { root } from './wiki-lib.mjs';
import { createWorkspace, AppError } from './workspace.mjs';
import { createOwnerAuth } from './owner-auth.mjs';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../site');
export function createAdminServer({ projectRoot = root } = {}) {
  const workspace = createWorkspace(projectRoot);
  const auth = createOwnerAuth(projectRoot);
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    const send = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); };
    try {
      const host = req.headers.host;
      const expectedHost = `127.0.0.1:${server.address().port}`;
      if (host !== expectedHost && host !== `localhost:${server.address().port}`) throw new AppError('只接受本機管理連線', 403);
      const origin = `http://${host}`;
      if (req.headers.origin && req.headers.origin !== origin) throw new AppError('拒絕跨來源操作', 403);
      if (req.headers['sec-fetch-site'] === 'cross-site') throw new AppError('拒絕跨網站連線', 403);
      const url = new URL(req.url, origin);
      if (url.pathname.startsWith('/api/')) {
        if (req.method !== 'GET' && (req.headers['x-teawiki-request'] !== '1' || req.headers.origin !== origin)) throw new AppError('寫入需由管理介面發起', 403);
        const authRoute = ['/api/auth/session', '/api/auth/setup', '/api/auth/login', '/api/auth/logout'].includes(url.pathname);
        if (!authRoute && !auth.authenticated(req.headers.cookie)) throw new AppError('請先以管理者密碼登入', 401);
        let input;
        if (req.method === 'POST') {
          if (!String(req.headers['content-type']).startsWith('application/json')) throw new AppError('需要 JSON 格式', 415);
          const chunks = []; let size = 0;
          for await (const chunk of req) { size += chunk.length; if (size > 15 * 1024 * 1024) throw new AppError('請求超過上傳大小限制', 413); chunks.push(chunk); }
          try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new AppError('JSON 格式錯誤'); }
        }
        if (req.method === 'GET' && url.pathname === '/api/auth/session') return send(200, { configured: auth.configured(), authenticated: auth.authenticated(req.headers.cookie) });
        if (req.method === 'POST' && url.pathname === '/api/auth/setup') {
          res.setHeader('Set-Cookie', auth.setup(input.password));
          return send(201, { authenticated: true });
        }
        if (req.method === 'POST' && url.pathname === '/api/auth/login') {
          res.setHeader('Set-Cookie', auth.login(input.password, req.socket.remoteAddress));
          return send(200, { authenticated: true });
        }
        if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
          res.setHeader('Set-Cookie', auth.logout(req.headers.cookie));
          return send(200, { authenticated: false });
        }
        if (req.method === 'GET' && url.pathname === '/api/state') return send(200, workspace.state());
        if (req.method === 'GET' && url.pathname === '/api/document') return send(200, workspace.document(url.searchParams.get('id')));
        if (req.method === 'GET' && url.pathname === '/api/versions') return send(200, workspace.versions(url.searchParams.get('id')));
        if (req.method === 'GET' && url.pathname === '/api/original') {
          const file = workspace.original(url.searchParams.get('source'), Number(url.searchParams.get('record') ?? '0'));
          res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="source-file"; filename*=UTF-8''${encodeURIComponent(file.filename)}` });
          return res.end(file.bytes);
        }
        if (req.method === 'POST' && url.pathname === '/api/save') return send(200, await workspace.save(input));
        if (req.method === 'POST' && url.pathname === '/api/upload') return send(201, await workspace.upload(input));
        if (req.method === 'POST' && url.pathname === '/api/check') return send(200, await workspace.runCheck());
        if (req.method === 'POST' && url.pathname === '/api/build') return send(200, await workspace.buildPublic());
        if (req.method === 'POST' && url.pathname === '/api/complete') return send(200, await workspace.completeJob(input.id));
        if (req.method === 'POST' && url.pathname === '/api/restore') return send(200, await workspace.restore(input.id, input.version, input.expectedRevision));
        if (req.method === 'POST' && url.pathname === '/api/preview') {
          const current = input.id ? workspace.document(input.id) : null;
          return send(200, { html: workspace.preview(String(input.body ?? ''), path.join(workspace.base, current?.path ?? 'wiki/syntheses/preview.md')) });
        }
        return send(404, { error: '找不到這個操作' });
      }
      if (req.method !== 'GET') throw new AppError('不支援此方法', 405);
      if (url.pathname.startsWith('/preview/')) {
        const rel = decodeURIComponent(url.pathname.slice('/preview/'.length));
        const dist = path.join(workspace.base, 'dist');
        let file = path.resolve(dist, rel || 'index.html');
        if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
        const sub = path.relative(dist, file);
        if (sub.startsWith('..') || path.isAbsolute(sub) || !fs.existsSync(file) || fs.lstatSync(file).isSymbolicLink()) throw new AppError('找不到公開預覽，請先產生公開版本', 404);
        const type = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.md': 'text/plain' }[path.extname(file)];
        if (!type) throw new AppError('不提供此檔案', 404);
        res.writeHead(200, { 'Content-Type': type + '; charset=utf-8' }); return res.end(fs.readFileSync(file));
      }
      const routes = { '/': ['admin.html', 'text/html'], '/admin': ['admin.html', 'text/html'], '/admin-app.js': ['admin-app.js', 'text/javascript'], '/admin.css': ['admin.css', 'text/css'], '/markdown.mjs': ['../scripts/markdown.mjs', 'text/javascript'] };
      const route = routes[url.pathname];
      if (!route) throw new AppError('找不到頁面', 404);
      res.writeHead(200, { 'Content-Type': `${route[1]}; charset=utf-8` });
      res.end(fs.readFileSync(path.join(site, route[0])));
    } catch (error) { send(error.status ?? 500, { error: error.status ? error.message : '操作失敗，資料尚未確認保存。請查看本機服務。' }); }
  });
  return { server, workspace };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const portArg = process.argv.find(x => x.startsWith('--port='));
  const port = portArg ? Number(portArg.split('=')[1]) : 4318;
  const { server } = createAdminServer();
  server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? '連接埠已被使用，可加 --port=其他埠號' : error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`TeaWIKI 管理介面 http://127.0.0.1:${server.address().port}\n僅本機存取；上傳、編輯會保存至本專案。Ctrl+C 停止。`));
}
