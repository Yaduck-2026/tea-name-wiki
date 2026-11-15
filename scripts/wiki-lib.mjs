import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = process.env.TEAWIKI_ROOT ? path.resolve(process.env.TEAWIKI_ROOT) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const wikiRoot = path.join(root, 'wiki');

export function listMarkdown(directory = wikiRoot) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(item => {
    const target = path.join(directory, item.name);
    return item.isDirectory() ? listMarkdown(target) : item.name.endsWith('.md') ? [target] : [];
  }).sort();
}

export function readPage(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  if (!text.startsWith('---\n')) throw new Error(`${file}: 缺少 frontmatter`);
  const end = text.indexOf('\n---\n', 4);
  if (end < 0) throw new Error(`${file}: frontmatter 未結束`);
  const meta = {};
  for (const line of text.slice(4, end).split('\n')) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9]*): (.+)$/);
    if (!match || Object.hasOwn(meta, match[1])) throw new Error(`${file}: 欄位格式錯誤或重複: ${line}`);
    try { meta[match[1]] = JSON.parse(match[2]); }
    catch { throw new Error(`${file}: ${match[1]} 請使用 JSON 值寫法`); }
  }
  return { file, meta, body: text.slice(end + 5).replace(/^\n/, ''), text };
}

export function frontmatter(meta) {
  return '---\n' + Object.entries(meta).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n') + '\n---\n\n';
}

export function relative(fromFile, toFile) {
  return path.relative(path.dirname(fromFile), toFile).split(path.sep).join('/');
}

export function taipeiDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
