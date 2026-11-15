import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { root } from './wiki-lib.mjs';
import { createAdminServer } from './admin-server.mjs';

if (typeof WebSocket === 'undefined') throw new Error('瀏覽器驗證需 Node.js 22 以上提供的 WebSocket；管理服務本身支援 Node.js 20。');
const browser = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
if (!browser) throw new Error('未找到本機 Chrome 或 Edge，未執行瀏覽器驗證。');
const tempBase = fs.realpathSync(os.tmpdir()), dir = fs.mkdtempSync(path.join(tempBase, 'teawiki-browser-'));
const project = path.join(dir, 'project'), profile = path.join(dir, 'chrome-profile');
fs.mkdirSync(project); fs.mkdirSync(profile);
for (const name of ['wiki', 'raw', 'config', 'content', 'sources', 'research', 'docs', 'AGENTS.md']) fs.cpSync(path.join(root, name), path.join(project, name), { recursive: true });
const file = path.join(dir, 'browser-fixture.md'); fs.writeFileSync(file, '# Browser upload fixture\n\nThis file is only for an isolated browser test.\n');
const { server } = createAdminServer({ projectRoot: project });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}`;
const child = spawn(browser, ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-extensions', `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let socket; const errors = [];
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn, description, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) { const value = await fn(); if (value) return value; await pause(70); }
  throw new Error('Timed out: ' + description);
}
try {
  console.log('Browser test: waiting for CDP');
  const portFile = path.join(profile, 'DevToolsActivePort');
  await until(() => fs.existsSync(portFile), 'Chrome CDP ready');
  const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
  console.log('Browser test: connecting to page');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(8000) })).json();
  console.log('Browser test: target list received');
  socket = new WebSocket(targets.find(x => x.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('CDP WebSocket did not open')), 8000); socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true }); socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP WebSocket connection failed')); }, { once: true }); });
  console.log('Browser test: WebSocket opened');
  let serial = 0; const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) { const item = pending.get(message.id); if (item) { pending.delete(message.id); message.error ? item.reject(new Error(JSON.stringify(message.error))) : item.resolve(message.result); } }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text + ': ' + (message.params.exceptionDetails.exception?.description ?? ''));
    if (message.method === 'Page.javascriptDialogOpening') send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
  });
  function send(method, params = {}) { const id = ++serial; return new Promise((resolve, reject) => { const timer = setTimeout(() => { pending.delete(id); reject(new Error('CDP timeout: ' + method)); }, 15000); pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } }); socket.send(JSON.stringify({ id, method, params })); }); }
  async function evaluate(expression) { const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text); return result.result.value; }
  async function waitSelector(selector) { await until(() => evaluate(`!!document.querySelector(${JSON.stringify(selector)})`), selector); }
  await send('Page.enable'); await send('Runtime.enable'); await send('DOM.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });
  await waitSelector('#auth-form');
  assert.ok(await evaluate('document.body.textContent.includes("先設定你的管理密碼")'));
  await evaluate('document.querySelector("#owner-password").value="browser-fixture-password";document.querySelector("#owner-confirm").value="browser-fixture-password";document.querySelector("#auth-form").requestSubmit()');
  console.log('Browser test: checking dashboard');
  await waitSelector('.stats');
  assert.equal(await evaluate('document.querySelectorAll(".stat").length'), 4);
  await evaluate('document.querySelector("#owner-logout").click()'); await waitSelector('#auth-form');
  assert.ok(await evaluate('document.body.textContent.includes("歡迎回來")'));
  await evaluate('document.querySelector("#owner-password").value="not-the-password";document.querySelector("#auth-form").requestSubmit()');
  await until(() => evaluate('document.querySelector("#toast").textContent.includes("密碼不正確")'), 'wrong password rejected');
  await evaluate('document.querySelector("#owner-password").value="browser-fixture-password";document.querySelector("#auth-form").requestSubmit()');
  await waitSelector('.stats');
  const artifacts = path.join(root, '.local/browser-tests'); fs.mkdirSync(artifacts, { recursive: true });
  const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(artifacts, 'dashboard-desktop.png'), Buffer.from(screenshot.data, 'base64'));
  console.log('Browser test: search and upload');
  await evaluate('location.hash="articles"'); await waitSelector('#article-search');
  await evaluate('document.querySelector("#article-search").value="青心烏龍";document.querySelector("#article-search").dispatchEvent(new Event("input",{bubbles:true}))');
  assert.ok(await evaluate('document.querySelectorAll(".doc-row").length>0'));
  await evaluate('location.hash="sources"'); await waitSelector('#source-file');
  const doc = await send('DOM.getDocument'), node = await send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#source-file' });
  await send('DOM.setFileInputFiles', { nodeId: node.nodeId, files: [file] });
  await until(() => evaluate('document.querySelector("#file-name").textContent.includes("browser-fixture")'), 'file selected');
  await evaluate('document.querySelector("#source-id").value="browser-test-source";document.querySelector("#source-title").value="Browser upload test";document.querySelector("#upload-form").requestSubmit()');
  await until(() => evaluate('document.body.textContent.includes("Browser upload test") && document.querySelector("#toast").textContent.includes("已封存")'), 'upload succeeds');
  assert.ok(fs.existsSync(path.join(project, 'raw/articles/browser-test-source-v1.md')));
  console.log('Browser test: editor persistence and preview');
  await evaluate('location.hash="new"'); await waitSelector('#entry-id');
  await evaluate('document.querySelector("#entry-id").value="browser-test-note";document.querySelector("#entry-title").value="Browser draft test";document.querySelector("#entry-summary").value="Browser persistence check";document.querySelector("#entry-body").value=' + JSON.stringify('# Browser draft\n\nThis is an isolated test.') + ';document.querySelector("#entry-body").dispatchEvent(new Event("input",{bubbles:true}));document.querySelector("#editor-form").requestSubmit()');
  await until(() => evaluate('location.hash==="#edit/browser-test-note" && document.querySelector("#entry-title")?.value==="Browser draft test"'), 'draft saved and reopened');
  assert.ok(fs.existsSync(path.join(project, 'wiki/origins/browser-test-note.md')));
  const editorShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(artifacts, 'editor-desktop.png'), Buffer.from(editorShot.data, 'base64'));
  await evaluate('document.querySelector("#entry-body").value=' + JSON.stringify('<img src=x onerror=alert(1)>\n\n**preview works**') + ';document.querySelector("#entry-body").dispatchEvent(new Event("input",{bubbles:true}))');
  assert.equal(await evaluate('document.querySelector("#markdown-preview img")===null'), true);
  assert.ok(await evaluate('document.querySelector("#markdown-preview strong").textContent==="preview works"'));
  // Discard the unsaved XSS fixture before switching routes.
  await evaluate('location.hash="health"'); await waitSelector('[data-action="run-check"]');
  await evaluate('document.querySelector("[data-action=run-check]").click()');
  await until(() => evaluate('document.querySelector(".report-summary")?.textContent.includes("通過")'), 'health report');
  console.log('Browser test: mobile layout');
  await evaluate('location.hash="dashboard"'); await waitSelector('.stats');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await pause(150);
  assert.ok(await evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'), 'mobile layout must not overflow horizontally');
  const mobile = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(artifacts, 'dashboard-mobile.png'), Buffer.from(mobile.data, 'base64'));
  console.log('Browser test: public build, reader and read-only management demo');
  await evaluate('location.hash="guide"'); await waitSelector('[data-action="build-site"]');
  await evaluate('document.querySelector("[data-action=build-site]").click()');
  await until(() => evaluate('document.querySelector("#toast").textContent.includes("已產生")'), 'public build');
  await send('Page.navigate', { url: url + '/preview/' });
  await waitSelector('.hero');
  const readerShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(artifacts, 'reader-mobile.png'), Buffer.from(readerShot.data, 'base64'));
  assert.ok(await evaluate('document.body.textContent.includes("從一個茶名")'));
  await evaluate('location.hash="library"'); await waitSelector('#reader-search');
  await evaluate('document.querySelector("#reader-search").value="青心烏龍";document.querySelector("#reader-search").dispatchEvent(new Event("input",{bubbles:true}))');
  assert.ok(await evaluate('document.querySelectorAll(".card").length>0'));
  await evaluate('location.hash="article/qingxin-oolong"'); await waitSelector('.article');
  assert.ok(await evaluate('document.querySelector(".article").textContent.includes("品種")'));
  assert.ok(await evaluate('![...document.querySelectorAll("a")].some(a=>a.getAttribute("href")?.includes("raw/"))'));
  await send('Page.navigate', { url: url + '/preview/admin/' }); await waitSelector('.stats');
  assert.equal(await evaluate('document.querySelector("#demo-banner").hidden'), false);
  await evaluate('location.hash="sources"'); await waitSelector('#upload-button');
  assert.equal(await evaluate('document.querySelector("#upload-button").disabled'), true);
  await evaluate('location.hash="edit/qingxin-oolong"'); await waitSelector('#save-button');
  assert.equal(await evaluate('document.querySelector("#save-button").disabled'), true);
  assert.deepEqual(errors, []);
  const report = { passed: true, browser: path.basename(browser), viewport: ['1440x1000', '390x844'], checks: ['owner-setup', 'owner-login-and-wrong-password', 'logout', 'dashboard', 'search', 'upload-to-raw', 'save-and-reopen-draft', 'safe-preview', 'health-check', 'mobile-overflow', 'public-build-button', 'public-reader', 'read-only-demo'], runtimeErrors: errors, screenshots: ['dashboard-desktop.png', 'dashboard-mobile.png', 'editor-desktop.png', 'reader-mobile.png'] };
  fs.writeFileSync(path.join(artifacts, 'result.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (socket?.readyState === 1) socket.send(JSON.stringify({ id: 99999, method: 'Browser.close' }));
  socket?.close(); child.kill();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  await pause(700);
  const resolved = path.resolve(dir);
  if (path.dirname(resolved).toLowerCase() !== tempBase.toLowerCase() || !path.basename(resolved).startsWith('teawiki-browser-')) throw new Error('Unsafe browser fixture cleanup');
  try { fs.rmSync(resolved, { recursive: true, force: true }); } catch { console.log('Chrome 暫存設定檔仍被系統使用，保留於測試暫存目錄。'); }
}
