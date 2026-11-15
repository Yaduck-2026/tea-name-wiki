import fs from 'node:fs';
import path from 'node:path';
import { root, wikiRoot, listMarkdown, readPage, frontmatter, relative, taipeiDate } from './wiki-lib.mjs';

if (!process.argv.includes('--write')) throw new Error('需要 --write 才寫入索引；不會對外搜尋。');
const file = path.join(wikiRoot, 'index.md');
const categories = JSON.parse(fs.readFileSync(path.join(root, 'config/categories.json'), 'utf8'));
const pages = listMarkdown().filter(p => p !== file).map(readPage);
const groups = [
  ['總覽與操作紀錄', p => ['overview', 'log'].includes(p.meta.kind)],
  ...categories.map(c => [c.label, p => p.meta.kind === 'concept' && p.meta.categoryId === c.id]),
  ['完整茶名拆解', p => p.meta.kind === 'tea-name'],
  ['綜合整理與問答', p => p.meta.kind === 'synthesis'],
  ['來源摘要', p => p.meta.kind === 'source']
];
const meta = { id: 'index', kind: 'index', title: 'TeaWIKI 知識索引', summary: '所有 Wiki 頁面的一句摘要與分類入口。', status: 'published', updated: taipeiDate(), sources: [], related: [], provenance: 'local-index' };
let body = '# TeaWIKI 知識索引\n\n先讀索引找相關頁，再閱讀知識及來源；草稿標示狀態，並非公開內容。\n\n';
const covered = new Set();
for (const [title, predicate] of groups) {
  body += `## ${title}\n\n`;
  const selected = pages.filter(predicate);
  for (const p of selected) {
    covered.add(p.meta.id);
    body += `- [${p.meta.title}](${relative(file, p.file)})：${p.meta.summary}${p.meta.status === 'published' ? '' : `（${p.meta.status}）`}\n`;
  }
  if (!selected.length) body += '目前尚無條目。\n';
  body += '\n';
}
if (covered.size !== pages.length) throw new Error('有頁面不屬於任何索引分組，停止寫入。');
fs.writeFileSync(file, frontmatter(meta) + body, 'utf8');
console.log(`索引已更新：${pages.length} 頁；僅使用本地 Wiki。`);
