import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { root } from '../scripts/wiki-lib.mjs';
import { createAdminServer } from '../scripts/admin-server.mjs';
import { buildSite } from '../scripts/build.mjs';
import { renderMarkdown } from '../scripts/markdown.mjs';
import { createWorkspace } from '../scripts/workspace.mjs';

export function fixture() {
  const dir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'teawiki-admin-test-'));
  for (const name of ['wiki', 'raw', 'config', 'content', 'sources', 'research', 'docs', 'AGENTS.md']) fs.cpSync(path.join(root, name), path.join(dir, name), { recursive: true });
  return dir;
}
export function cleanFixture(dir) {
  const resolved = fs.realpathSync(dir), base = fs.realpathSync(os.tmpdir());
  assert.equal(path.dirname(resolved).toLowerCase(), base.toLowerCase());
  assert.ok(path.basename(resolved).startsWith('teawiki-admin-test-'));
  fs.rmSync(resolved, { recursive: true, force: true });
}

test('管理 API：封存、草稿、編輯、版本衝突、還原、完成整合與公開輸出', async t => {
  const dir = fixture(), { server, workspace } = createAdminServer({ projectRoot: dir });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => { await new Promise(resolve => server.close(resolve)); cleanFixture(dir); });
  let cookie;
  const api = async (route, body, extra = {}) => {
    const response = await fetch(`${base}/api/${route}`, { method: body === undefined ? 'GET' : 'POST', headers: { ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json', 'X-TeaWiki-Request': '1', Origin: base }), ...extra }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    return { status: response.status, data: await response.json() };
  };
  await t.test('沒有本機工作階段不能讀取資料；拒絕跨來源與原件路徑存取', async () => {
    assert.equal((await api('state')).status, 401);
    const response = await fetch(base); assert.equal(response.status, 200);
    assert.equal((await api('save', { id: 'qingxin-oolong' })).status, 401);
    assert.equal((await api('check', {}, { Origin: 'https://example.com' })).status, 403);
    assert.equal((await fetch(base + '/raw/manifest.json')).status, 404);
    assert.equal((await api('document?id=../../AGENTS')).status, 401);
  });
  await t.test('本人設定與登入：錯密碼、重複設定及已登出工作階段均拒絕', async () => {
    const password = 'fixture-only-password-2026';
    assert.equal((await api('auth/session')).data.configured, false);
    assert.equal((await api('auth/setup', { password: 'short' })).status, 400);
    assert.equal((await api('auth/setup', { password })).status, 201);
    const stored = fs.readFileSync(path.join(dir, '.local/admin-auth.json'), 'utf8');
    assert.ok(!stored.includes(password));
    assert.equal(JSON.parse(stored).algorithm, 'scrypt');
    assert.equal((await api('state')).status, 200);
    assert.equal((await api('document?id=../../AGENTS')).status, 400);
    const oldCookie = cookie;
    assert.equal((await api('auth/logout', {})).status, 200);
    assert.equal((await api('state')).status, 401);
    assert.equal((await api('state', undefined, { Cookie: oldCookie })).status, 401);
    assert.equal((await api('auth/login', { password: 'wrong-password' })).status, 401);
    assert.equal((await api('auth/login', { password })).status, 200);
    assert.equal((await api('auth/setup', { password: 'another-long-password' })).status, 409);
  });
  const upload = { id: 'test-source-one', title: '整合測試來源', filename: 'notes.md', data: Buffer.from('# 測試原始資料\n\n只用於隔離測試，不是茶知識來源。').toString('base64') };
  await t.test('上傳實際保存 bytes、hash、來源草稿與待整理工作', async () => {
    const result = await api('upload', upload); assert.equal(result.status, 201, JSON.stringify(result));
    const bytes = fs.readFileSync(path.join(dir, 'raw/articles/test-source-one-v1.md'));
    assert.equal(bytes.toString(), Buffer.from(upload.data, 'base64').toString());
    const record = JSON.parse(fs.readFileSync(path.join(dir, 'raw/manifest.json'))).records.find(r => r.sourceId === upload.id);
    assert.equal(record.sha256, crypto.createHash('sha256').update(bytes).digest('hex'));
    const download = await fetch(`${base}/api/original?source=${upload.id}`, { headers: { Cookie: cookie } });
    assert.equal(download.status, 200);
    assert.ok(Buffer.from(await download.arrayBuffer()).equals(bytes));
    const state = (await api('state')).data;
    assert.equal(state.pages.find(p => p.id === upload.id).status, 'draft');
    assert.equal(state.jobs.find(j => j.id === upload.id).status, 'pending');
    assert.equal((await api('complete', { id: upload.id })).status, 422);
  });
  await t.test('拒絕重複、非法格式、假 PDF 與超過大小的檔案，沒有半套新資料', async () => {
    assert.equal((await api('upload', { ...upload, id: 'duplicate-upload' })).status, 409);
    assert.equal((await api('upload', { ...upload, id: 'unsupported-upload', filename: 'run.exe' })).status, 400);
    assert.equal((await api('upload', { ...upload, id: 'fake-pdf', filename: 'note.pdf' })).status, 400);
    assert.equal((await api('upload', { ...upload, id: 'large-upload', data: Buffer.alloc(10 * 1024 * 1024 + 1).toString('base64') })).status, 400);
    assert.ok(!(await api('state')).data.pages.some(p => p.id === 'fake-pdf'));
  });
  const doc = (await api('document?id=qingxin-oolong')).data;
  const payload = { ...doc.meta, body: doc.body + '\n\n## 測試維護說明\n\n這是隔離測試的編輯內容。\n', expectedRevision: doc.revision, reviewed: true };
  await t.test('保存能重讀、更新索引與紀錄；舊版本可還原，原件不變', async () => {
    const manifestBefore = fs.readFileSync(path.join(dir, 'raw/manifest.json'));
    assert.equal((await api('save', payload)).status, 200);
    const updated = (await api('document?id=qingxin-oolong')).data;
    assert.match(updated.body, /測試維護說明/);
    assert.notEqual(updated.revision, doc.revision);
    assert.equal((await api('save', payload)).status, 409);
    const versions = (await api('versions?id=qingxin-oolong')).data;
    assert.ok(versions.length > 0);
    assert.equal((await api('restore', { id: doc.id, version: versions[0].id, expectedRevision: updated.revision })).status, 200);
    assert.equal((await api('document?id=qingxin-oolong')).data.body, doc.body);
    assert.ok(fs.readFileSync(path.join(dir, 'raw/manifest.json')).equals(manifestBefore));
  });
  await t.test('失效連結與未複核公開保存會被拒絕，原條目保持不變', async () => {
    const before = (await api('document?id=qingxin-oolong')).data;
    const bad = { ...before.meta, body: before.body + '\n[失效](not-existing.md)\n', expectedRevision: before.revision, reviewed: true };
    assert.equal((await api('save', bad)).status, 422);
    assert.equal((await api('document?id=qingxin-oolong')).data.revision, before.revision);
    assert.equal((await api('save', { ...bad, body: before.body, reviewed: false })).status, 400);
  });
  await t.test('複核來源並整合知識後可完成工作', async () => {
    const source = (await api('document?id=test-source-one')).data;
    assert.equal((await api('save', { ...source.meta, status: 'published', summary: '隔離測試的來源摘要，不是茶知識。', body: source.body.replace('尚未複核，不能當成已確認的茶知識結論。', '已閱讀，用於測試資料整合流程。'), expectedRevision: source.revision, reviewed: true })).status, 200);
    const knowledge = { id: 'test-integrated-entry', create: true, kind: 'concept', categoryId: 'origins', title: '隔離測試條目', summary: '用於測試來源整合。', status: 'published', sources: [upload.id], related: [], body: '# 測試\n\n## 概念\n\n這是測試。\n\n## 例子\n\n不是茶知識。\n\n## 限制\n\n只用於自動測試。\n', reviewed: true };
    assert.equal((await api('save', knowledge)).status, 200);
    assert.equal((await api('complete', { id: upload.id })).status, 200);
    assert.equal((await api('state')).data.jobs.find(j => j.id === upload.id).status, 'complete');
  });
  await t.test('健康檢查與公開建置排除原件、政策、待整理來源及 API', async () => {
    assert.equal((await api('check', {})).data.ok, true);
    // Keep the test-only integrated article private before checking public output.
    const article = (await api('document?id=test-integrated-entry')).data;
    assert.equal((await api('save', { ...article.meta, status: 'draft', body: article.body, expectedRevision: article.revision })).status, 200);
    const source = (await api('document?id=test-source-one')).data;
    assert.equal((await api('save', { ...source.meta, status: 'draft', body: source.body, expectedRevision: source.revision })).status, 200);
    buildSite(dir);
    const data = fs.readFileSync(path.join(dir, 'dist/public-data.json'), 'utf8');
    assert.ok(!data.includes('raw/articles/'));
    assert.ok(!data.includes('user-update-policy'));
    assert.ok(!data.includes('test-source-one'));
    assert.ok(!data.includes('test-integrated-entry'));
    assert.ok(!fs.existsSync(path.join(dir, 'dist/raw')));
    assert.ok(fs.readFileSync(path.join(dir, 'dist/admin/index.html'), 'utf8').includes('data-mode="demo"'));
  });
  await t.test('公開副本缺少私有原件時仍可檢查與建置，嚴格模式保留遺失提醒', () => {
    const originals = path.resolve(dir, 'raw/articles');
    assert.equal(path.dirname(originals), path.resolve(dir, 'raw'));
    if (fs.existsSync(originals)) fs.rmSync(originals, { recursive: true, force: true });
    assert.equal(workspace.check(dir, true).ok, true);
    assert.equal(workspace.check(dir, false).ok, false);
    assert.ok(buildSite(dir).count > 0);
  });
});

test('已退役原件：缺檔不列錯誤，但 hash、連結、狀態與格式仍受檢查', () => {
  const dir = fixture();
  try {
    const workspace = createWorkspace(dir);
    const rawPath = 'raw/articles/user-update-policy-v1.md';
    const manifestFile = path.join(dir, 'raw/manifest.json'), pageFile = path.join(dir, 'wiki/sources/user-update-policy.md');
    const readManifest = () => JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    const writeManifest = m => fs.writeFileSync(manifestFile, JSON.stringify(m, null, 2) + '\n');
    const record = m => m.records.find(r => r.path === rawPath);
    // Put the fixture into the retired state regardless of the current repository state.
    const m0 = readManifest();
    record(m0).retired ??= { date: '2026-11-22', reason: '測試：不再使用' };
    writeManifest(m0);
    fs.writeFileSync(pageFile, fs.readFileSync(pageFile, 'utf8').replace('originalAvailable: true', 'originalAvailable: false').replace(/\[([^\]]+)\]\([^)]*raw\/articles\/user-update-policy-v1\.md\)/g, '$1'));
    fs.rmSync(path.join(dir, rawPath), { force: true });
    const baselineManifest = fs.readFileSync(manifestFile), baselinePage = fs.readFileSync(pageFile);
    const restore = () => { fs.writeFileSync(manifestFile, baselineManifest); fs.writeFileSync(pageFile, baselinePage); fs.rmSync(path.join(dir, rawPath), { force: true }); };

    const strict = workspace.check(dir, false);
    assert.equal(strict.ok, true, strict.errors.join('\n'));
    assert.ok(!strict.warnings.some(w => w.startsWith('user-update-policy:')));
    assert.equal(workspace.check(dir, true).ok, true);
    assert.equal(record(readManifest()).sha256, record(JSON.parse(fs.readFileSync(path.join(root, 'raw/manifest.json'), 'utf8'))).sha256);

    fs.mkdirSync(path.dirname(path.join(dir, rawPath)), { recursive: true });
    fs.writeFileSync(path.join(dir, rawPath), '內容不同的檔案');
    assert.ok(workspace.check(dir, false).errors.some(e => e.includes('raw 封存被修改')));
    restore();

    fs.appendFileSync(pageFile, `\n[原件](../../${rawPath})\n`);
    assert.ok(workspace.check(dir, false).errors.some(e => e.startsWith('user-update-policy: 連結指向已退役原件')));
    restore();

    fs.writeFileSync(pageFile, fs.readFileSync(pageFile, 'utf8').replace('originalAvailable: false', 'originalAvailable: true'));
    assert.ok(workspace.check(dir, false).errors.some(e => e.includes('raw manifest 與來源資訊不一致')));
    restore();

    const badFormat = readManifest();
    record(badFormat).retired = { date: '2026-13-40', reason: '' };
    writeManifest(badFormat);
    assert.ok(workspace.check(dir, false).errors.some(e => e.includes('退役資訊不合法')));
    restore();

    const notRetired = readManifest();
    delete record(notRetired).retired;
    writeManifest(notRetired);
    assert.ok(workspace.check(dir, false).errors.some(e => e.includes(`raw 檔案缺失：${rawPath}`)));
  } finally { cleanFixture(dir); }
});

test('Markdown 預覽不執行原始 HTML、危險連結或圖片事件', () => {
  const rendered = renderMarkdown('<img src=x onerror=alert(1)>\n\n[危險](javascript:alert)\n\n**安全文字**');
  assert.ok(!rendered.includes('<img'));
  assert.ok(!rendered.includes('href="javascript:'));
  assert.match(rendered, /<strong>安全文字<\/strong>/);
});
