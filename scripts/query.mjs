import { listMarkdown, readPage, root } from './wiki-lib.mjs';
import path from 'node:path';
const query = process.argv.slice(2).join(' ').trim();
if (!query) { console.error('用法：npm run query -- 關鍵字；僅搜尋本地 Wiki，不生成 AI 回答。'); process.exitCode = 1; }
else {
  const needle = query.toLocaleLowerCase();
  const hits = listMarkdown().map(readPage).filter(p => p.meta.status === 'published' && !['index', 'log'].includes(p.meta.kind)).map(p => ({ ...p, score: (p.meta.title.toLocaleLowerCase().includes(needle) ? 3 : 0) + ((p.meta.aliases ?? []).some(x => x.toLocaleLowerCase().includes(needle)) ? 2 : 0) + (p.body.toLocaleLowerCase().includes(needle) ? 1 : 0) })).filter(p => p.score).sort((a, b) => b.score - a.score || a.meta.id.localeCompare(b.meta.id));
  console.log(`本地搜尋：${query}，${hits.length} 個結果；未對外連線。`);
  for (const p of hits) console.log(`${path.relative(root, p.file)} | ${p.meta.title}\n${p.meta.summary}`);
}
