import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { frontmatter, readPage, listMarkdown } from './wiki-lib.mjs';
import { renderMarkdown } from './markdown.mjs';

const codeRoot = path.dirname(fileURLToPath(import.meta.url));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const date = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const slug = value => typeof value === 'string' && value.length <= 100 && /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value);
export class AppError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }

export function createWorkspace(projectRoot) {
  const base = path.resolve(projectRoot);
  let tail = Promise.resolve();
  const json = (p, fallback) => fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : fallback;
  const pages = (at = base) => listMarkdown(path.join(at, 'wiki')).map(readPage);
  const safePath = (at, relative) => {
    const result = path.resolve(at, relative), sub = path.relative(at, result);
    if (sub.startsWith('..') || path.isAbsolute(sub)) throw new AppError('路徑超出專案範圍');
    // Do not follow symlinks/reparse points for management writes.
    let current = at;
    for (const part of sub.split(path.sep)) { current = path.join(current, part); if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw new AppError('不支援符號連結路徑'); }
    return result;
  };
  const put = (at, rel, data) => { const p = safePath(at, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, data); };
  const categoryList = () => json(path.join(base, 'config/categories.json'), []);
  const check = (at = base, publicMode = true) => {
    const result = spawnSync(process.execPath, [path.join(codeRoot, 'check.mjs'), ...(publicMode ? ['--public'] : [])], { env: { ...process.env, TEAWIKI_ROOT: at }, encoding: 'utf8', windowsHide: true, timeout: 30000 });
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}${result.error ? result.error.message : ''}`;
    return { ok: result.status === 0, errors: output.split(/\r?\n/).filter(x => x.startsWith('ERROR ')).map(x => x.slice(6)), warnings: output.split(/\r?\n/).filter(x => x.startsWith('WARN ')).map(x => x.slice(5)), output, checkedAt: new Date().toISOString() };
  };
  const index = at => execFileSync(process.execPath, [path.join(codeRoot, 'index.mjs'), '--write'], { env: { ...process.env, TEAWIKI_ROOT: at }, windowsHide: true, timeout: 30000 });
  const log = (at, operation, title, details) => {
    const file = path.join(at, 'wiki/log.md'), p = readPage(file);
    p.meta.updated = date();
    fs.writeFileSync(file, frontmatter(p.meta) + p.body + `\n## [${date()}] ${operation} | ${title.replace(/[\r\n]/g, ' ')}\n\n${details}\n`);
  };
  const queue = operation => { const result = tail.then(operation); tail = result.catch(() => {}); return result; };
  const filesUnder = directory => !fs.existsSync(directory) ? [] : fs.readdirSync(directory, { withFileTypes: true }).flatMap(e => e.isDirectory() ? filesUnder(path.join(directory, e.name)) : [path.join(directory, e.name)]);

  async function transaction(action) {
    const tempBase = path.join(base, '.local/transactions');
    fs.mkdirSync(tempBase, { recursive: true });
    const stage = fs.mkdtempSync(path.join(tempBase, 'edit-'));
    try {
      for (const item of ['wiki', 'raw', 'config', 'content', 'sources', 'research', 'docs', 'AGENTS.md']) {
        if (fs.existsSync(path.join(base, item))) fs.cpSync(path.join(base, item), path.join(stage, item), { recursive: true, filter: src => !fs.lstatSync(src).isSymbolicLink() });
      }
      put(stage, '.local/jobs.json', JSON.stringify(json(path.join(base, '.local/jobs.json'), []), null, 2));
      const baseline = new Map(['wiki', 'raw', '.local/jobs.json'].flatMap(rel => {
        const target = path.join(stage, rel);
        return fs.statSync(target).isDirectory() ? filesUnder(target) : [target];
      }).filter(p => fs.existsSync(path.join(base, path.relative(stage, p)))).map(p => [path.relative(stage, p), hash(fs.readFileSync(p))]));
      const result = await action(stage);
      index(stage);
      const health = check(stage);
      if (!health.ok) throw new AppError('保存未通過檢查：' + (health.errors.join('；') || health.output.slice(-1000)), 422);
      const changes = ['wiki', 'raw', '.local/jobs.json'].flatMap(rel => {
        const target = path.join(stage, rel);
        return fs.statSync(target).isDirectory() ? filesUnder(target) : [target];
      }).map(p => ({ rel: path.relative(stage, p), data: fs.readFileSync(p) })).filter(({ rel, data }) => !fs.existsSync(path.join(base, rel)) || !fs.readFileSync(path.join(base, rel)).equals(data));
      const previous = changes.map(({ rel }) => ({ rel, bytes: fs.existsSync(safePath(base, rel)) ? fs.readFileSync(safePath(base, rel)) : null }));
      for (const old of previous) {
        const current = old.bytes === null ? undefined : hash(old.bytes);
        if (current !== baseline.get(old.rel)) throw new AppError('保存期間檔案已被其他程式修改，請重新載入', 409);
      }
      const versionId = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      // Keep the old Markdown before committing a change.
      for (const old of previous.filter(x => x.bytes && x.rel.startsWith('wiki' + path.sep))) {
        const id = path.basename(old.rel, '.md');
        put(base, `.local/history/${id}/${versionId}.md`, old.bytes);
      }
      try { for (const change of changes) put(base, change.rel, change.data); }
      catch (error) {
        for (const old of previous) { const file = safePath(base, old.rel); if (old.bytes) put(base, old.rel, old.bytes); else if (fs.existsSync(file)) fs.unlinkSync(file); }
        throw error;
      }
      return { ...result, health };
    } finally {
      const resolved = path.resolve(stage);
      if (path.dirname(resolved) !== path.resolve(tempBase) || !path.basename(resolved).startsWith('edit-')) throw new Error('Unsafe transaction cleanup');
      fs.rmSync(resolved, { recursive: true, force: true });
    }
  }

  function document(id) {
    if (!slug(id)) throw new AppError('條目 ID 格式錯誤');
    const p = pages().find(x => x.meta.id === id);
    if (!p) throw new AppError('找不到這個條目', 404);
    return { ...p.meta, meta: p.meta, body: p.body, revision: hash(p.text), path: path.relative(base, p.file).split(path.sep).join('/'), html: preview(p.body, p.file) };
  }
  function preview(body, fromFile) {
    const all = new Map(pages().map(p => [path.resolve(p.file), p.meta.id]));
    return renderMarkdown(body, href => {
      if (/^https?:\/\//i.test(href)) return href;
      const target = path.resolve(path.dirname(fromFile), href.split('#')[0]);
      return all.has(target) ? `#edit/${all.get(target)}` : null;
    });
  }
  function state() {
    const all = pages();
    return { mode: 'local', categories: categoryList(), pages: all.map(p => ({ ...p.meta, path: path.relative(base, p.file).split(path.sep).join('/'), revision: hash(p.text) })), jobs: json(path.join(base, '.local/jobs.json'), []), operations: all.find(p => p.meta.id === 'log')?.body ?? '', health: json(path.join(base, '.local/last-check.json'), null), build: json(path.join(base, '.local/last-build.json'), null) };
  }
  function appendLinks(body, at, from, sourceIds, relatedIds) {
    const all = new Map(pages(at).map(p => [p.meta.id, p]));
    for (const [heading, ids] of [['知識來源', sourceIds], ['相關條目', relatedIds]]) {
      const additions = [];
      for (const id of ids) {
        const target = all.get(id);
        if (!target) throw new AppError(`找不到引用條目：${id}`);
        const rel = path.relative(path.dirname(from), target.file).split(path.sep).join('/');
        if (!body.includes(`](${rel})`)) additions.push(`- [${target.meta.title}](${rel})`);
      }
      if (additions.length) body += `\n\n## ${heading}\n\n${additions.join('\n')}\n`;
    }
    return body;
  }
  function save(input, operation = 'edit') {
    return queue(() => transaction(at => {
      const existing = pages(at).find(p => p.meta.id === input.id);
      if (!slug(input.id)) throw new AppError('ID 請使用小寫英文、數字與連字號');
      if (['index', 'log'].includes(input.id)) throw new AppError('索引及操作紀錄由系統維護，不可覆寫');
      if (input.create && existing) throw new AppError('這個 ID 已存在', 409);
      if (!input.create && !existing) throw new AppError('條目不存在', 404);
      if (existing && input.expectedRevision !== hash(existing.text)) throw new AppError('內容已被其他操作修改，請重新載入再保存', 409);
      const kind = existing?.meta.kind ?? input.kind;
      if (!['concept', 'tea-name', 'synthesis', 'source', 'overview'].includes(kind)) throw new AppError('不支援此內容類型');
      if (!existing && !['concept', 'tea-name', 'synthesis'].includes(kind)) throw new AppError('來源請透過上傳建立');
      const category = existing?.meta.categoryId ?? input.categoryId;
      if (kind === 'concept' && !categoryList().some(c => c.id === category)) throw new AppError('請選擇有效分類');
      const folder = kind === 'concept' ? category : kind === 'tea-name' ? 'tea-names' : 'syntheses';
      const file = existing?.file ?? safePath(at, `wiki/${folder}/${input.id}.md`);
      const title = String(input.title ?? '').trim(), summary = String(input.summary ?? '').trim(), bodyText = String(input.body ?? '');
      if (!title || !summary || title.length > 200 || summary.length > 500 || bodyText.length > 400000) throw new AppError('請填寫標題、摘要與合理長度的內容');
      if (!['draft', 'review', 'published'].includes(input.status)) throw new AppError('狀態不合法');
      const meta = { ...(existing?.meta ?? { id: input.id, kind, provenance: 'admin-editor', sources: [], related: [], ...(kind === 'concept' ? { categoryId: category, aliases: [] } : {}), ...(kind === 'tea-name' ? { exampleType: 'illustrative' } : {}) }), title, summary, status: input.status, updated: date() };
      for (const key of ['sources', 'related']) {
        if (!Array.isArray(input[key]) || input[key].some(x => !slug(x))) throw new AppError(`${key} 格式錯誤`);
        meta[key] = [...new Set(input[key])];
      }
      if (input.status === 'published' && ['concept', 'tea-name', 'source', 'synthesis'].includes(kind) && !input.reviewed) throw new AppError('請確認已複核來源與內容，再標為可公開');
      let body = appendLinks(bodyText, at, file, meta.sources, meta.related);
      if (!body.trim()) throw new AppError('內容不能為空');
      if (kind === 'concept' && input.status === 'published' && (body.match(/^## /gm) ?? []).length < 3) throw new AppError('公開知識條目至少需要三節內容');
      put(at, path.relative(at, file), frontmatter(meta) + body);
      log(at, operation, title, `- 管理者手動${operation === 'restore' ? '還原歷史版本並保存' : '保存'} [${input.id}](${path.relative(path.join(at, 'wiki'), file).split(path.sep).join('/')})，狀態：${input.status}。\n- 更新本地索引；檔案檢查不代表事實已查證。`);
      return { id: input.id };
    }));
  }
  function upload(input) {
    return queue(() => transaction(at => {
      const id = input.id;
      if (!slug(id) || pages(at).some(p => p.meta.id === id)) throw new AppError('來源 ID 無效或已存在', 409);
      const ext = path.extname(String(input.filename ?? '')).toLowerCase();
      if (!['.md', '.txt', '.pdf', '.csv', '.json'].includes(ext)) throw new AppError('支援 Markdown、TXT、PDF、CSV、JSON 檔案');
      if (typeof input.data !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(input.data)) throw new AppError('檔案資料格式錯誤');
      const bytes = Buffer.from(input.data, 'base64');
      if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new AppError('檔案需介於 1 byte 與 10 MB 之間');
      if (ext === '.pdf' && bytes.subarray(0, 5).toString() !== '%PDF-') throw new AppError('PDF 檔頭不正確');
      const title = String(input.title ?? '').trim();
      if (!title || title.length > 200) throw new AppError('請填寫來源名稱');
      if (input.url && !/^https?:\/\//i.test(input.url)) throw new AppError('來源網址需為 http 或 https');
      const manifest = json(path.join(at, 'raw/manifest.json'), { version: 1, records: [] });
      const digest = hash(bytes);
      if (manifest.records.some(r => r.sha256 === digest)) throw new AppError('相同檔案已封存，請使用既有來源', 409);
      const rawRef = `raw/articles/${id}-v1${ext}`;
      put(at, rawRef, bytes);
      manifest.records.push({ path: rawRef, sourceId: id, recordType: 'user-upload', originalAvailable: true, sha256: digest, capturedAt: new Date().toISOString(), originalFilename: path.basename(String(input.filename)) });
      put(at, 'raw/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
      const sourceFile = `wiki/sources/${id}.md`;
      const meta = { id, kind: 'source', title, summary: '已封存原始資料，等待管理者或 AI 整理與查證。', status: 'draft', updated: date(), sources: [], related: [], provenance: 'admin-upload', sourceType: 'user-document', url: input.url || null, originalAvailable: true, rawRefs: [rawRef] };
      const sourceBody = `# ${title}\n\n## 來源資訊\n\n- 管理者於 ${date()} 手動上傳。\n- [本地封存原件](../../${rawRef})。\n${input.url ? `- [來源網址](${input.url})。\n` : ''}\n## 整理狀態\n\n原件已保存，尚未完成摘要、知識查證與跨頁整合。${ext === '.pdf' ? 'PDF 僅封存，本工具未進行文字擷取或 OCR。' : ''}\n\n## 支持哪些說法\n\n尚未複核，不能當成已確認的茶知識結論。\n\n## 差異與待查問題\n\n需閱讀原始資料，並依 AGENTS.md 比對相關 Wiki。\n`;
      put(at, sourceFile, frontmatter(meta) + sourceBody);
      const jobs = json(path.join(at, '.local/jobs.json'), []);
      jobs.push({ id, title, filename: path.basename(String(input.filename)), createdAt: new Date().toISOString(), status: 'pending', sourceId: id });
      put(at, '.local/jobs.json', JSON.stringify(jobs, null, 2));
      log(at, 'upload', title, `- 封存原件並建立來源草稿 [${id}](sources/${id}.md)。\n- 整理工作：待處理；未自動搜尋或生成茶知識結論。`);
      return { id };
    }));
  }
  function completeJob(id) {
    return queue(() => transaction(at => {
      const jobs = json(path.join(at, '.local/jobs.json'), []), job = jobs.find(x => x.id === id);
      if (!job) throw new AppError('找不到整理工作', 404);
      const all = pages(at), source = all.find(p => p.meta.id === job.sourceId);
      if (source?.meta.status !== 'published' || !all.some(p => p.meta.kind !== 'source' && p.meta.status === 'published' && p.meta.sources?.includes(id))) throw new AppError('請先複核來源並設為可公開，且整合至少一篇可公開知識，再完成工作', 422);
      job.status = 'complete'; job.completedAt = new Date().toISOString();
      put(at, '.local/jobs.json', JSON.stringify(jobs, null, 2));
      log(at, 'ingest', job.title, `- 管理者確認已整理來源 [${id}](sources/${id}.md) 並整合至既有 Wiki。`);
      return { id };
    }));
  }
  function versions(id) {
    if (!slug(id)) throw new AppError('ID 錯誤');
    const dir = path.join(base, '.local/history', id);
    return fs.existsSync(dir) ? fs.readdirSync(dir).filter(x => x.endsWith('.md')).sort().reverse().map(x => ({ id: x.slice(0, -3), savedAt: new Date(Number(x.split('-')[0])).toISOString() })) : [];
  }
  function restore(id, version, expectedRevision) {
    if (!slug(id) || !/^[0-9]+-[a-f0-9]+$/.test(version)) throw new AppError('版本格式錯誤');
    const old = safePath(base, `.local/history/${id}/${version}.md`);
    if (!fs.existsSync(old)) throw new AppError('找不到歷史版本', 404);
    const p = readPage(old);
    return save({ ...p.meta, body: p.body, id, expectedRevision, reviewed: true }, 'restore');
  }
  function original(id, recordIndex = 0) {
    const doc = document(id), refs = doc.meta.rawRefs;
    if (doc.kind !== 'source' || !doc.originalAvailable || !Array.isArray(refs) || !Number.isInteger(recordIndex) || recordIndex < 0 || recordIndex >= refs.length) throw new AppError('沒有可下載的封存原件', 404);
    const record = json(path.join(base, 'raw/manifest.json'), { records: [] }).records.find(r => r.path === refs[recordIndex] && r.sourceId === id);
    if (!record) throw new AppError('封存紀錄不存在', 404);
    const file = safePath(base, record.path);
    if (!fs.existsSync(file)) throw new AppError('這個專案副本未包含本地原件，請由管理者還原原件備份', 404);
    const bytes = fs.readFileSync(file);
    if (hash(bytes) !== record.sha256) throw new AppError('原件指紋不符，請先確認封存完整性', 422);
    return { bytes, filename: record.originalFilename ?? path.basename(file) };
  }
  async function runCheck() {
    return queue(() => {
      const health = check();
      put(base, '.local/last-check.json', JSON.stringify(health, null, 2));
      log(base, 'lint', '管理介面手動健康檢查', `- 結果：${health.ok ? '通過' : '未通過'}，${health.errors.length} 個錯誤、${health.warnings.length} 個提醒。\n- 只執行本地結構檢查，不代表茶知識已查證。`);
      return health;
    });
  }
  function buildPublic() {
    return queue(async () => {
      const { buildSite } = await import('./build.mjs');
      const result = buildSite(base);
      const info = { count: result.count, builtAt: new Date().toISOString(), previewUrl: '/preview/' };
      put(base, '.local/last-build.json', JSON.stringify(info, null, 2));
      log(base, 'build', '產生公開閱讀版本', `- 產生 ${result.count} 頁公開內容，尚未上傳 GitHub 或部署。\n- 排除原件、草稿、內部政策與本地備份。`);
      return info;
    });
  }
  return { state, document, preview, save, upload, completeJob, versions, restore, original, runCheck, check, buildPublic, base };
}
