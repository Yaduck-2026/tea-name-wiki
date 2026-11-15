export const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Text is escaped first; raw HTML and images are never executed.
export function renderMarkdown(text, resolveLink = href => /^https?:\/\//i.test(href) ? href : null) {
  let code = false, codeLines = [], paragraph = [], list = [], table = [], output = [];
  const inline = value => {
    const tokens = [];
    let source = String(value).replace(/`([^`]+)`/g, (_, v) => { tokens.push(`<code>${escapeHTML(v)}</code>`); return `\u0000${tokens.length - 1}\u0000`; });
    source = source.replace(/!?\[([^\]]+)\]\(([^)\s]+)\)/g, (all, label, href) => {
      const target = resolveLink(href);
      const safe = target && !/^(?:javascript|data|vbscript):/i.test(target);
      tokens.push(safe ? `<a href="${escapeHTML(target)}"${/^https?:/i.test(target) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escapeHTML(label)}</a>` : `<span>${escapeHTML(label)}</span>`);
      return `\u0000${tokens.length - 1}\u0000`;
    });
    source = escapeHTML(source).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    return source.replace(/\u0000(\d+)\u0000/g, (_, n) => tokens[Number(n)]);
  };
  const flush = () => {
    if (paragraph.length) { output.push(`<p>${inline(paragraph.join(' '))}</p>`); paragraph = []; }
    if (list.length) { output.push(`<ul>${list.map(x => `<li>${inline(x)}</li>`).join('')}</ul>`); list = []; }
    if (table.length) {
      const rows = table.filter(row => !/^\|?\s*:?-{2,}/.test(row));
      output.push(`<div class="table-scroll"><table>${rows.map((row, i) => `<tr>${row.replace(/^\||\|$/g, '').split('|').map(cell => `<${i ? 'td' : 'th'}>${inline(cell.trim())}</${i ? 'td' : 'th'}>`).join('')}</tr>`).join('')}</table></div>`); table = [];
    }
  };
  for (const line of String(text).replace(/\r/g, '').split('\n')) {
    if (line.startsWith('```')) {
      flush();
      if (code) { output.push(`<pre><code>${escapeHTML(codeLines.join('\n'))}</code></pre>`); codeLines = []; }
      code = !code; continue;
    }
    if (code) { codeLines.push(line); continue; }
    if (!line.trim()) { flush(); continue; }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) { flush(); output.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`); continue; }
    if (/^\s*[-*]\s+/.test(line)) { if (paragraph.length || table.length) flush(); list.push(line.replace(/^\s*[-*]\s+/, '')); continue; }
    if (line.startsWith('|')) { if (paragraph.length || list.length) flush(); table.push(line); continue; }
    if (line.startsWith('> ')) { flush(); output.push(`<blockquote>${inline(line.slice(2))}</blockquote>`); continue; }
    if (list.length || table.length) flush();
    paragraph.push(line);
  }
  flush();
  if (codeLines.length) output.push(`<pre><code>${escapeHTML(codeLines.join('\n'))}</code></pre>`);
  return output.join('\n');
}
