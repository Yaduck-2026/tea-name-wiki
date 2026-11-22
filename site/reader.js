const main = document.querySelector('#reader');
const esc = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let data, category = '', query = '';
const categoryName = id => data.categories.find(c => c.id === id)?.label ?? '';
const card = p => `<a class="card" href="#article/${esc(p.id)}"><small>${esc(categoryName(p.categoryId) || (p.kind === 'tea-name' ? '茶名拆解' : p.kind === 'source' ? '知識來源' : '近期觀察'))}</small><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p><span class="arrow">↗</span></a>`;
function route() {
  const [view, id] = (location.hash.slice(1) || 'home').split('/');
  if (view === 'article') {
    const p = data.documents.find(x => x.id === id);
    main.innerHTML = p ? `<article class="article"><a class="back" href="#library">← 回到知識索引</a><p class="muted">更新於 ${esc(p.updated)} · 來源可追溯</p>${p.html}</article>` : '<p>找不到這個公開條目。</p>';
  } else if (view === 'about') main.innerHTML = '<section class="about"><span class="eyebrow">ABOUT THIS WIKI</span><h1>讓每個茶名，<br>都能慢慢讀懂。</h1><p>茶名有解是一份以台灣茶為主的知識 Wiki。從產地、品種、茶類、特色製法、製作風格與沖泡，建立可以互相連結的閱讀路線。</p><h2>AI 協作，保留來源</h2><p>原始資料、Markdown 知識與維護規則分開保存。新資料經閱讀、整理與查證後，才整合進既有頁面；資料不足會留下限制。</p><p>本網站採手動更新，不因開啟網頁自動搜尋。文章的可公開狀態不代表商品鑑定或療效保證。</p><p><a class="button" href="./AGENTS.md">閱讀專案 AGENTS.md ↗</a></p><div class="hint">管理者在本機執行 npm run admin 可上傳資料與保存修改。公開管理介面為唯讀展示，沒有資料寫入權限。</div></section>';
  else if (view === 'library') {
    const items = data.pages.filter(p => p.kind !== 'source' && (!category || p.categoryId === category) && (!query || `${p.title} ${p.summary} ${(p.aliases ?? []).join(' ')}`.includes(query)));
    main.innerHTML = `<span class="eyebrow">THE TEA LIBRARY</span><h1>沿著一個詞，認識一杯茶。</h1><label><span class="muted">搜尋知識</span><input id="reader-search" class="search" type="search" placeholder="輸入茶名、品種或關鍵字…" value="${esc(query)}"></label><div class="categories"><button data-category="" class="${!category ? 'active' : ''}">全部</button>${data.categories.map(c => `<button data-category="${c.id}" class="${category === c.id ? 'active' : ''}">${c.label}</button>`).join('')}</div><div class="cards">${items.map(card).join('')}</div>${items.length ? '' : '<div class="empty">沒有符合的條目，試著換個關鍵字。</div>'}`;
  } else {
    const sample = data.pages.find(p => p.kind === 'tea-name');
    const sampleBody = data.documents.find(p => p.id === sample?.id)?.body ?? '';
    const terms = [...sampleBody.matchAll(/^### (.+?)｜(.+)$/gm)].map(match => [match[1], match[2]]);
    main.innerHTML = `<section class="hero"><div><span class="eyebrow">A LITTLE KNOWLEDGE, ONE CUP AT A TIME</span><h1>從一個茶名，<br>讀懂一杯茶。</h1><p>不急著背下所有名詞。<br>把產地、品種與風格分開看，慢慢找到你的閱讀路線。</p><a class="button" href="#library">開始認識茶 →</a><a class="button ghost" href="./slides/">看教學簡報 →</a></div><div class="tea-seal" aria-hidden="true">茶<small>ORIGIN / CULTIVAR / CRAFT</small></div></section><section class="feature"><span class="eyebrow">READ A TEA NAME</span><h2>${esc(sample?.title ?? '從完整茶名開始')}</h2><p>從完整名稱開始，分開認識每一段資訊；示例性質詳見條目。</p><div class="term-row">${terms.map(t => `<div class="term"><small>${esc(t[1])}</small><strong>${esc(t[0])}</strong></div>`).join('')}</div>${sample ? `<a class="button" href="#article/${esc(sample.id)}">看看每個詞的意思 ↗</a>` : ''}</section><span class="eyebrow">SIX PATHS INTO TEA</span><h2>六個入口，慢慢展開。</h2><div class="cards">${data.pages.filter(p => p.kind === 'concept').map(card).join('')}</div><section class="feature"><span class="eyebrow">RECENT OBSERVATION</span><h2>社群話題，也需要回頭查證。</h2><p>保留實際觀察期間，資料不夠時，不勉強做熱門排名。</p><div class="cards">${data.pages.filter(p => p.kind === 'synthesis').map(card).join('')}</div></section>`;
  }
}
document.addEventListener('click', event => { const btn = event.target.closest('[data-category]'); if (btn) { category = btn.dataset.category; route(); } });
document.addEventListener('input', event => { if (event.target.id === 'reader-search') { const pos = event.target.selectionStart; query = event.target.value; route(); const input = document.querySelector('#reader-search'); input.focus(); try { input.setSelectionRange(pos, pos); } catch {} } });
window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); });
try { const response = await fetch('./public-data.json'); if (!response.ok) throw new Error(); data = await response.json(); route(); } catch { main.textContent = '知識資料暫時無法讀取，請稍後重新整理。'; }
