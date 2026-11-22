import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { root, wikiRoot, listMarkdown, readPage } from './wiki-lib.mjs';

const errors = [], warnings = [];
const publicCheckout = process.argv.includes('--public');
const fail = message => errors.push(message);
const pages = [];
for (const file of listMarkdown()) {
  try { pages.push(readPage(file)); } catch (e) { fail(e.message); }
}
const ids = new Map(), files = new Map(pages.map(p => [path.resolve(p.file), p]));
const categories = JSON.parse(fs.readFileSync(path.join(root, 'config/categories.json'), 'utf8')).map(c => c.id);
const kinds = ['concept', 'tea-name', 'source', 'synthesis', 'overview', 'index', 'log'];
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'raw/manifest.json'), 'utf8'));
// Retired originals are intentionally no longer kept; their path and hash stay as history.
const retiredPaths = new Set(manifest.records.filter(r => r.retired).map(r => r.path));
for (const p of pages) {
  const m = p.meta, name = path.relative(root, p.file);
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(m.id ?? '') || path.basename(p.file, '.md') !== m.id) fail(`${name}: ID／檔名不符`);
  if (ids.has(m.id)) fail(`${name}: ID 重複 ${m.id}`);
  ids.set(m.id, p);
  if (!kinds.includes(m.kind) || !['draft', 'review', 'published'].includes(m.status)) fail(`${name}: kind／status 不合法`);
  for (const k of ['title', 'summary', 'provenance']) if (typeof m[k] !== 'string' || !m[k].trim()) fail(`${name}: 缺 ${k}`);
  for (const k of ['sources', 'related']) {
    if (!Array.isArray(m[k]) || !m[k].every(x => typeof x === 'string') || new Set(m[k]).size !== m[k].length) fail(`${name}: ${k} 須為不重複字串陣列`);
  }
  if (m.kind === 'concept' && !categories.includes(m.categoryId)) fail(`${name}: 不合法分類`);
  if (m.status === 'published') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(m.updated ?? '') || !Number.isFinite(Date.parse(m.updated + 'T00:00:00Z')) || new Date(m.updated + 'T00:00:00Z').toISOString().slice(0, 10) !== m.updated) fail(`${name}: 日期不合法`);
    if (/待填|REPLACE|replace-topic|replace-source/.test(p.text)) fail(`${name}: 仍有佔位文字`);
    if (['concept', 'tea-name'].includes(m.kind) && !m.sources?.length) fail(`${name}: 缺來源`);
  }
}

const incoming = new Map(pages.map(p => [p.meta.id, 0]));
const index = ids.get('index');
const indexed = new Set();
for (const p of pages) {
  const m = p.meta, linkedIds = new Set();
  for (const id of [...(Array.isArray(m.sources) ? m.sources : []), ...(Array.isArray(m.related) ? m.related : [])]) {
    const target = ids.get(id);
    if (!target || id === m.id) fail(`${m.id}: 不存在或自我關聯 ${id}`);
    else if (m.status === 'published' && target.meta.status !== 'published') fail(`${m.id}: 公開頁指向草稿 ${id}`);
  }
  for (const id of Array.isArray(m.sources) ? m.sources : []) if (ids.get(id)?.meta.kind !== 'source') fail(`${m.id}: ${id} 不是來源頁`);
  const linkText = p.body.replace(/```[^]*?```/g, '');
  for (const match of linkText.matchAll(/\]\(([^)]+)\)/g)) {
    let href = match[1];
    if (/^https?:\/\//i.test(href) || href.startsWith('#')) continue;
    if (/^[a-z]+:/i.test(href)) { fail(`${m.id}: 不支援連結 ${href}`); continue; }
    try { href = decodeURIComponent(href.split('#')[0]); } catch { fail(`${m.id}: URL 編碼錯誤`); continue; }
    const targetFile = path.resolve(path.dirname(p.file), href);
    const within = path.relative(root, targetFile);
    if (within.startsWith('..') || path.isAbsolute(within)) { fail(`${m.id}: 連結超出專案 ${href}`); continue; }
    if (retiredPaths.has(within.split(path.sep).join('/'))) {
      // Only the append-only log may keep historical links to retired originals.
      if (m.kind !== 'log') fail(`${m.id}: 連結指向已退役原件 ${href}`);
      continue;
    }
    if (!fs.existsSync(targetFile)) {
      if (publicCheckout && within.startsWith('raw' + path.sep)) continue;
      fail(`${m.id}: 連結不存在 ${href}`); continue;
    }
    const target = files.get(targetFile);
    if (target) {
      linkedIds.add(target.meta.id);
      if (m.kind === 'index') indexed.add(target.meta.id);
      else if (m.id !== target.meta.id) incoming.set(target.meta.id, incoming.get(target.meta.id) + 1);
      if (m.status === 'published' && target.meta.status !== 'published' && !['index', 'log'].includes(m.kind)) fail(`${m.id}: 內文指向草稿 ${target.meta.id}`);
    }
  }
  for (const id of Array.isArray(m.sources) ? m.sources : []) if (!linkedIds.has(id)) fail(`${m.id}: 內文缺來源連結 ${id}`);
  if (m.kind === 'source') {
    if (!Array.isArray(m.rawRefs) || !m.rawRefs.length || typeof m.originalAvailable !== 'boolean') fail(`${m.id}: 缺 rawRefs／originalAvailable`);
    if (!['official', 'social', 'professional', 'research', 'user-message', 'user-document'].includes(m.sourceType)) fail(`${m.id}: 來源類型錯誤`);
    if (!['user-message', 'user-document'].includes(m.sourceType) && !/^https?:\/\//.test(m.url ?? '')) fail(`${m.id}: 缺外部來源網址`);
    const allRetired = Array.isArray(m.rawRefs) && m.rawRefs.length > 0 && m.rawRefs.every(ref => retiredPaths.has(ref));
    if (!m.originalAvailable && !allRetired) warnings.push(`${m.id}: 只有來源定位紀錄，原文未封存。`);
  }
  if (m.evidenceLevel === 'insufficient-data') {
    if (!m.observation?.limitations?.length || !m.observation?.researchFile) fail(`${m.id}: 缺觀察限制`);
  }
  if (m.observation) {
    const o = m.observation;
    if (![o.start, o.end, o.researchedAt].every(x => typeof x === 'string' && x.endsWith('+08:00') && Number.isFinite(Date.parse(x))) || Date.parse(o.end) - Date.parse(o.start) !== 604800000 || o.timezone !== 'Asia/Taipei') fail(`${m.id}: 七天區間不正確`);
    if (!fs.existsSync(path.join(root, o.researchFile ?? ''))) fail(`${m.id}: 研究紀錄不存在`);
  }
}
if (!index) fail('缺 index.md');
for (const p of pages) {
  if (p.meta.kind !== 'index' && !indexed.has(p.meta.id)) fail(`${p.meta.id}: 索引漏頁`);
  if (!['index', 'log', 'overview'].includes(p.meta.kind) && incoming.get(p.meta.id) === 0) warnings.push(`${p.meta.id}: 除索引外沒有入鏈（孤立頁）。`);
}
const rawRecords = new Map();
for (const record of manifest.records) {
  const file = path.resolve(root, record.path);
  if (rawRecords.has(record.path) || !path.relative(root, file).startsWith('raw' + path.sep)) { fail(`raw 路徑重複或不合法：${record.path}`); continue; }
  rawRecords.set(record.path, record);
  if (record.retired !== undefined) {
    const r = record.retired, validDate = typeof r?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && Number.isFinite(Date.parse(r.date + 'T00:00:00Z')) && new Date(r.date + 'T00:00:00Z').toISOString().slice(0, 10) === r.date;
    if (!validDate || typeof r?.reason !== 'string' || !r.reason.trim()) fail(`raw 退役資訊不合法（需 date 與 reason）：${record.path}`);
  }
  if (!fs.existsSync(file)) {
    if (record.retired) continue;
    if (publicCheckout && /^raw\/(articles|social)\//.test(record.path)) { warnings.push(`公開副本未含本地原件：${record.path}`); continue; }
    fail(`raw 檔案缺失：${record.path}`); continue;
  }
  if (crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== record.sha256) fail(`raw 封存被修改：${record.path}`);
}
for (const p of pages.filter(p => p.meta.kind === 'source')) {
  for (const ref of p.meta.rawRefs ?? []) {
    const record = rawRecords.get(ref);
    // originalAvailable on the source page means "currently obtainable"; retired originals are not.
    if (!record || record.sourceId !== p.meta.id || (record.originalAvailable && !record.retired) !== p.meta.originalAvailable) fail(`${p.meta.id}: raw manifest 與來源資訊不一致`);
  }
}
const oldHashes = JSON.parse(fs.readFileSync(path.join(root, 'docs/legacy/json-v1/original-hashes.json'), 'utf8'));
for (const record of oldHashes) if (!fs.existsSync(path.join(root, record.path)) || crypto.createHash('sha256').update(fs.readFileSync(path.join(root, record.path))).digest('hex') !== record.sha256) fail(`舊版備份變動：${record.path}`);
for (const message of warnings) console.log(`WARN ${message}`);
for (const message of errors) console.error(`ERROR ${message}`);
console.log(`${errors.length ? 'FAIL' : 'PASS'} ${pages.length} Wiki pages, ${manifest.records.length} sealed raw records; ${errors.length} errors, ${warnings.length} warnings.`);
console.log('僅檢查本地結構及封存完整性；不判定茶知識真偽，不連外。');
process.exitCode = errors.length ? 1 : 0;
