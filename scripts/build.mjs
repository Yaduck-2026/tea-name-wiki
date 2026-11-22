import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { root, wikiRoot, listMarkdown, readPage } from './wiki-lib.mjs';
import { renderMarkdown, escapeHTML as e } from './markdown.mjs';
import { createWorkspace } from './workspace.mjs';

export function buildSite(projectRoot = root, output = path.join(projectRoot, 'dist')) {
  const workspace = createWorkspace(projectRoot), check = workspace.check(projectRoot, true);
  if (!check.ok) throw new Error('公開建置檢查未通過：' + check.errors.join('；'));
  const all = listMarkdown(path.join(projectRoot, 'wiki')).map(readPage);
  const allowed = all.filter(p => p.meta.status === 'published' && p.meta.synthesisType !== 'slide-deck' && (['concept', 'tea-name'].includes(p.meta.kind) || (p.meta.kind === 'source' && p.meta.sourceType !== 'user-message') || (p.meta.kind === 'synthesis' && p.meta.evidenceLevel)));
  // The teaching slide deck is published only under slides/, never as a reader article.
  const decks = all.filter(p => p.meta.status === 'published' && p.meta.kind === 'synthesis' && p.meta.synthesisType === 'slide-deck');
  if (decks.length > 1) throw new Error('目前只支援一份教學簡報：' + decks.map(p => p.meta.id).join('、'));
  const allowedIds = new Set(allowed.map(p => p.meta.id));
  const safePages = allowed.map(p => ({ id: p.meta.id, kind: p.meta.kind, title: p.meta.title, summary: p.meta.summary, status: 'published', updated: p.meta.updated, categoryId: p.meta.categoryId, aliases: p.meta.aliases ?? [], originalAvailable: p.meta.kind === 'source' ? p.meta.originalAvailable : undefined, path: path.relative(projectRoot, p.file).split(path.sep).join('/'), sources: (p.meta.sources ?? []).filter(id => allowedIds.has(id)), related: (p.meta.related ?? []).filter(id => allowedIds.has(id)) }));
  const files = new Map(allowed.map(p => [path.resolve(p.file), p.meta.id]));
  const publicBody = p => p.body.replace(/\n## 維護註記\n[^]*/, '\n').replace(/\[([^\]]+)\]\(([^)]+)\)/g, (original, label, href) => {
    if (/^https?:\/\//i.test(href)) return original;
    return files.has(path.resolve(path.dirname(p.file), href.split('#')[0])) ? original : label;
  });
  const htmlFor = p => renderMarkdown(publicBody(p), href => {
    if (/^https?:\/\//i.test(href)) return href;
    const dest = path.resolve(path.dirname(p.file), href.split('#')[0]);
    return files.has(dest) ? `#article/${files.get(dest)}` : null;
  });
  const documents = allowed.map((p, i) => ({ ...safePages[i], body: publicBody(p), html: htmlFor(p) }));
  // Each "## " section is one slide; the text before the first one is the cover.
  const deckFor = p => ({
    id: p.meta.id, title: p.meta.title, summary: p.meta.summary, updated: p.meta.updated,
    slides: publicBody(p).trim().split(/\n(?=## )/).map((section, i) => ({
      title: i ? section.split('\n')[0].replace(/^## /, '').trim() : p.meta.title,
      cover: i === 0,
      html: renderMarkdown(section, href => {
        if (/^https?:\/\//i.test(href)) return href;
        const dest = path.resolve(path.dirname(p.file), href.split('#')[0]);
        return files.has(dest) ? `../#article/${files.get(dest)}` : null;
      })
    }))
  });
  const categories = JSON.parse(fs.readFileSync(path.join(projectRoot, 'config/categories.json'), 'utf8'));
  const sourceDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../site');
  // Clear only known generated output after checking it remains inside the project.
  const resolved = path.resolve(output), within = path.relative(projectRoot, resolved);
  if (within !== 'dist' || (fs.existsSync(resolved) && fs.lstatSync(resolved).isSymbolicLink())) throw new Error('只允許建置至專案內的 dist 實體資料夾');
  if (fs.existsSync(resolved)) fs.rmSync(resolved, { recursive: true, force: true });
  fs.mkdirSync(path.join(resolved, 'admin'), { recursive: true });
  fs.writeFileSync(path.join(resolved, '.nojekyll'), '');
  fs.writeFileSync(path.join(resolved, 'public-data.json'), JSON.stringify({ mode: 'demo', categories, pages: safePages, documents, jobs: [], operations: '## [展示] build | 公開資料唯讀展示\n\n操作紀錄及原始資料僅在本地管理工作區提供。', health: { ok: true, errors: [], warnings: safePages.filter(p => p.kind === 'source' && !p.originalAvailable).map(p => `${p.title}：原文尚未封存。`), output: '公開資料已通過建置檢查；未重新查證外部來源。', checkedAt: new Date().toISOString() } }));
  for (const file of ['admin-app.js', 'admin.css']) fs.copyFileSync(path.join(sourceDir, file), path.join(resolved, 'admin', file));
  fs.copyFileSync(path.join(sourceDir, '../scripts/markdown.mjs'), path.join(resolved, 'admin/markdown.mjs'));
  fs.writeFileSync(path.join(resolved, 'admin/index.html'), fs.readFileSync(path.join(sourceDir, 'admin.html'), 'utf8').replace('data-mode="local"', 'data-mode="demo"'));
  for (const file of ['reader.js', 'reader.css']) fs.copyFileSync(path.join(sourceDir, file), path.join(resolved, file));
  fs.copyFileSync(path.join(sourceDir, 'reader.html'), path.join(resolved, 'index.html'));
  fs.copyFileSync(path.join(projectRoot, 'AGENTS.md'), path.join(resolved, 'AGENTS.md'));
  if (decks.length) {
    fs.mkdirSync(path.join(resolved, 'slides'));
    fs.writeFileSync(path.join(resolved, 'slides/deck.json'), JSON.stringify(deckFor(decks[0])));
    fs.copyFileSync(path.join(sourceDir, 'slides.html'), path.join(resolved, 'slides/index.html'));
    for (const file of ['slides.js', 'slides.css']) fs.copyFileSync(path.join(sourceDir, file), path.join(resolved, 'slides', file));
  }
  console.log(`公開網站已建置：${allowed.length} 頁內容；管理展示為唯讀，不含 raw、草稿或備份。`);
  return { output: resolved, count: allowed.length };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) buildSite();
