import { renderMarkdown, escapeHTML as e } from './markdown.mjs';
const main = document.querySelector('main');
const demo = document.documentElement.dataset.mode === 'demo';
const kinds = { concept: '知識條目', 'tea-name': '茶名拆解', source: '來源摘要', synthesis: '綜合整理', overview: '總覽', index: '索引', log: '操作紀錄' };
const statuses = { published: '可公開', review: '待複核', draft: '草稿' };
const model = { state: null, current: null, dirty: false, filter: '', category: '', status: '', tab: 'recent', file: null, route: 0 };
let toastTimer;
function toast(message, error = false) { const box = document.querySelector('#toast'); box.textContent = message; box.classList.toggle('error', error); box.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => box.hidden = true, error ? 9000 : 4500); }
const disabled = () => demo ? 'disabled' : '';
const label = id => model.state.categories.find(c => c.id === id)?.label ?? '';
const badge = status => `<span class="badge ${e(status)}">${e(statuses[status] ?? status)}</span>`;
const heading = (kicker, title, description, actions = '') => `<div class="page-heading"><div><span class="kicker">${kicker}</span><h1>${title}</h1><p>${description}</p></div><div class="actions">${actions}</div></div>`;
const button = (text, action, cls = '', extra = '') => `<button type="button" class="btn ${cls}" data-action="${action}" ${extra}>${text}</button>`;
const panel = (title, subtitle, body, action = '') => `<section class="panel"><div class="panel-head"><div><h2>${title}</h2><p>${subtitle}</p></div>${action}</div><div class="panel-body">${body}</div></section>`;
const empty = (title, text = '') => `<div class="empty"><span class="empty-symbol" aria-hidden="true">◌</span><h3>${title}</h3><p>${text}</p></div>`;
const operations = () => [...model.state.operations.matchAll(/^## \[([^\]]+)\] ([^|]+)\| (.+)$/gm)].map(x => ({ date: x[1], type: x[2].trim(), title: x[3] })).reverse();
const sourcePages = () => model.state.pages.filter(p => p.kind === 'source');
const knowledgePages = () => model.state.pages.filter(p => ['concept', 'tea-name', 'synthesis'].includes(p.kind));
const openJobs = () => model.state.jobs.filter(j => j.status !== 'complete');
async function api(route, body) {
  const response = await fetch(`/api/${route}`, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-TeaWiki-Request': '1' }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401 && !route.startsWith('auth/')) { model.state = null; model.current = null; model.dirty = false; authPage({ configured: true }); }
    throw new Error(result.error ?? '操作未完成');
  }
  return result;
}
function authPage(auth) {
  model.auth = auth;
  document.body.classList.add('is-locked');
  document.querySelector('#owner-logout').hidden = true;
  document.querySelector('#breadcrumb').textContent = auth.configured ? '管理者登入' : '設定管理者';
  main.innerHTML = `<section class="auth-card panel"><span class="kicker">OWNER ACCESS</span><h1>${auth.configured ? '歡迎回來。' : '先設定你的管理密碼。'}</h1><p>${auth.configured ? '只有登入後，才能上傳、編輯和維護你的 Wiki。' : '第一次使用請在自己的電腦設定密碼。訪客仍可閱讀公開內容。'}</p><form id="auth-form"><div class="field"><label for="owner-password">管理密碼${auth.configured ? '' : '（至少 10 個字元）'}</label><input id="owner-password" type="password" autocomplete="${auth.configured ? 'current-password' : 'new-password'}" required minlength="10" maxlength="128"></div>${auth.configured ? '' : '<div class="field"><label for="owner-confirm">再次輸入密碼</label><input id="owner-confirm" type="password" autocomplete="new-password" required minlength="10" maxlength="128"></div>'}<button type="submit" class="btn">${auth.configured ? '登入管理工作區' : '設定密碼並登入'}</button></form><p class="form-note">密碼僅在本機以加鹽雜湊保存，不會放到公開網頁或 GitHub。原始資料與編輯功能需登入才能存取。</p><a class="btn secondary" href="/preview/">只觀看公開內容 ↗</a></section>`;
}
async function refresh() {
  if (demo) { const response = await fetch('../public-data.json'); if (!response.ok) throw new Error('展示資料讀取失敗'); model.state = await response.json(); }
  else model.state = await api('state');
  document.body.classList.remove('is-locked');
  document.querySelector('#owner-logout').hidden = demo;
  document.querySelector('#pending-count').textContent = openJobs().length;
}
function docRow(p) { return `<a class="doc-row" href="#edit/${e(p.id)}"><span class="doc-icon" aria-hidden="true">${p.kind === 'tea-name' ? '茶' : '▤'}</span><div class="doc-info"><span class="doc-title">${e(p.title)}</span><div class="doc-meta"><span>${e(label(p.categoryId) || kinds[p.kind])}</span><span>·</span><span>${e(p.updated ?? '未設定日期')}</span></div></div>${badge(p.status)}<span class="row-arrow" aria-hidden="true">↗</span></a>`; }
function dashboard() {
  const entries = knowledgePages(), sources = sourcePages(), pending = openJobs(), missing = sources.filter(p => !p.originalAvailable).length;
  const rows = model.tab === 'draft' ? entries.filter(p => p.status !== 'published') : entries;
  const stats = [['知識條目', entries.length, `${entries.filter(p => p.status === 'published').length} 篇可公開`, '持續累積的知識', '▤'], ['資料來源', sources.length, `${sources.filter(p => p.originalAvailable).length} 份原件`, '引用都有跡可循', '▧'], ['待整理資料', pending.length, '手動處理', '等待閱讀與整合', '◷'], ['知識分類', '06', '六條路線', '從茶名認識一杯茶', '◫']];
  const book = panel('知識書架', '整理好的知識，和還在生長的想法', `<div class="tabs" style="margin:0"><button type="button" data-action="tab-recent" class="${model.tab === 'recent' ? 'active' : ''}">最近條目</button><button type="button" data-action="tab-draft" class="${model.tab === 'draft' ? 'active' : ''}">草稿與待複核</button></div>${rows.length ? rows.slice().sort((a, b) => (b.updated ?? '').localeCompare(a.updated ?? '')).slice(0, 5).map(docRow).join('') : empty('書架很整齊', '目前沒有等待複核的草稿。')}`, '<a class="btn text small" href="#articles">查看全部 ↗</a>');
  const upload = panel('下一份知識，從這裡開始', '保留原始資料，再進行整理與查證', '<div class="upload-callout"><span class="upload-symbol" aria-hidden="true">↥</span><div><strong>加入一篇文章、一份筆記，或一份 PDF</strong><p>上傳後先成為待整理來源，保留原件與版本紀錄。</p><a href="#sources" class="btn secondary small">選擇資料檔案 ↗</a></div></div><div class="workflow"><span>01 保存原件</span><b>→</b><span>02 閱讀與查證</span><b>→</b><span>03 更新 Wiki</span><b>→</b><span>04 檢查與記錄</span></div>', '<span class="tag">INGEST</span>');
  const health = panel('維護提醒', '先看見缺口，再慢慢補齊', `<div class="source-progress"><div class="circle">${missing}</div><div><strong>筆來源尚未封存原文</strong><p>保留來源連結及先前查閱紀錄</p></div></div><div class="health-note">${missing ? '下次取得原始資料時，再補上封存。' : '來源已保存，仍需確認內容及適用範圍。'}</div><a href="#health" class="btn text small">開啟健康檢查 →</a>`);
  const jobs = panel('待整理工作', `${pending.length} 份資料等待你的下一步`, pending.length ? pending.slice(0, 3).map(j => `<div class="job"><strong>${e(j.title)}</strong><p>${e(j.filename)}</p><a href="#edit/${e(j.sourceId)}" class="btn secondary small">開啟來源整理</a></div>`).join('') : empty('目前沒有待整理資料', '新的上傳會出現在這裡。'));
  const recent = panel('最近的足跡', '每次更新，都留下一點線索', `<div class="timeline" style="padding:0">${operations().slice(0, 4).map(o => `<div class="timeline-item">${e(o.title)}<time>${e(o.date)} · ${e(o.type)}</time></div>`).join('') || '尚無操作紀錄'}</div>`, '<a href="#history" class="btn text small">全部 ↗</a>');
  main.innerHTML = heading('YOUR KNOWLEDGE GARDEN', '讓茶知識，慢慢成為系統。', '從一份原始資料開始，整理、連結，再讓知識繼續累積。', '<a class="btn secondary" href="#new">＋ 新增條目</a><a class="btn" href="#sources">↥ 上傳資料</a>') + `<section class="stats" aria-label="工作區統計">${stats.map((s, i) => `<div class="stat ${i === 2 ? 'warm' : ''}"><div class="stat-label">${s[0]}<span class="stat-icon" aria-hidden="true">${s[4]}</span></div><div class="stat-number">${s[1]}</div><div class="stat-foot"><em>${s[2]}</em>${s[3]}</div></div>`).join('')}</section><div class="dashboard-grid"><div>${book}${upload}</div><div class="dashboard-right">${health}${jobs}${recent}</div></div>`;
}
function articles() {
  const items = knowledgePages().filter(p => (!model.filter || `${p.title} ${p.summary} ${(p.aliases ?? []).join(' ')}`.toLowerCase().includes(model.filter.toLowerCase())) && (!model.category || p.categoryId === model.category) && (!model.status || p.status === model.status));
  main.innerHTML = heading('KNOWLEDGE LIBRARY', '你的知識書架', '每個條目都是一個入口，透過來源與關聯把它們連起來。', '<a href="#new" class="btn">＋ 新增條目</a>') + `<div class="toolbar"><label class="search-field"><span aria-hidden="true">⌕</span><span class="visually-hidden">搜尋知識</span><input type="search" id="article-search" placeholder="搜尋標題、摘要或別名…" value="${e(model.filter)}"></label><label><span class="visually-hidden">分類篩選</span><select id="category-filter"><option value="">全部分類</option>${model.state.categories.map(c => `<option value="${c.id}" ${model.category === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}</select></label><label><span class="visually-hidden">狀態篩選</span><select id="status-filter"><option value="">全部狀態</option>${Object.entries(statuses).map(([id, title]) => `<option value="${id}" ${model.status === id ? 'selected' : ''}>${title}</option>`).join('')}</select></label></div>` + panel('知識條目', `${items.length} 篇`, items.length ? items.map(docRow).join('') : empty('沒有找到符合的條目', '換個關鍵字，或清除篩選。'));
}
function sources() {
  model.file = null;
  const uploadForm = `<form id="upload-form"><label class="dropzone file-label" id="dropzone"><input type="file" id="source-file" class="visually-hidden" accept=".md,.txt,.pdf,.csv,.json" ${disabled()}><span class="upload-symbol" aria-hidden="true">↥</span><strong>拖放檔案到這裡，或點擊選擇</strong><small>Markdown、TXT、PDF、CSV、JSON · 每份最多 10 MB</small><span id="file-name" class="file-name">尚未選擇檔案</span></label><div class="field"><label for="source-title">資料名稱</label><input type="text" id="source-title" required maxlength="200" placeholder="例如：某篇茶知識文章、課堂筆記" ${disabled()}></div><div class="field"><label for="source-url">來源網址（選填）</label><input type="url" id="source-url" placeholder="https://…" ${disabled()}><small>有原始文章或社群貼文時，保留具體連結。</small></div><details><summary class="count-note">設定來源代號</summary><div class="field"><label for="source-id">代號（小寫英文、數字與連字號）</label><input id="source-id" type="text" value="src-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 7)}" pattern="[a-z][a-z0-9-]*" ${disabled()}></div></details><p class="form-note">PDF 會保留原檔，尚不提供 OCR。閱讀、摘要與查證由管理者或協作 AI 接續完成。</p><button class="btn" type="submit" id="upload-button" ${disabled()}>↥ 保存來源並加入待整理</button></form>`;
  const library = sourcePages().map(p => `<a class="source-name" href="#edit/${e(p.id)}"><div><strong>${e(p.title)}</strong><small>${p.originalAvailable ? '原件已封存' : '僅來源定位紀錄'} · ${e(p.updated ?? '')}</small></div>${badge(p.status)}</a>`).join('');
  const steps = [['保存原始版本', '原件與指紋一起保存，來源摘要另外編輯。'], ['閱讀、摘要與查證', '找出重點，記錄支持的說法、差異與不確定處。'], ['整合到知識頁', '更新既有條目、補上引用與相關連結。'], ['檢查後完成工作', '來源及至少一篇相關知識可公開後，再標示完成。']];
  const jobs = openJobs().map(j => `<div class="job"><strong>${e(j.title)}</strong><p>${e(j.filename)}</p><div class="actions"><a class="btn secondary small" href="#edit/${e(j.sourceId)}">開啟整理</a>${button('完成整合', 'complete-job', 'text small', `data-id="${e(j.id)}" ${disabled()}`)}</div></div>`).join('');
  main.innerHTML = heading('SOURCES & INGEST', '讓新資料，找到它的位置。', '先完整保存，再閱讀與整合。原始資料不會被後續編輯覆寫。') + `<div class="upload-layout"><div>${panel('上傳原始資料', '上傳只保存原件，不會自動生成已查證的知識', uploadForm, '<span class="tag">RAW</span>')}${panel('來源資料庫', `${sourcePages().length} 筆來源`, library)}</div><div>${panel('一份資料的整理旅程', '', `<div class="steps">${steps.map(s => `<div class="step"><div><strong>${s[0]}</strong><p>${s[1]}</p></div></div>`).join('')}</div>`)}${panel('待整理清單', '上傳完成，不等於知識已確認', jobs || empty('還沒有待整理工作', '新增資料後就可以開始。'))}</div></div>`;
}
function editorForm(doc, create = false) {
  model.current = doc;
  const readOnly = demo || ['index', 'log'].includes(doc.kind), off = readOnly ? 'disabled' : '';
  const options = (items, selected) => items.map(p => `<option value="${e(p.id)}" ${selected.includes(p.id) ? 'selected' : ''}>${e(p.title)}</option>`).join('');
  const newFields = create ? `<div class="field-row"><div class="field"><label for="entry-id">條目代號</label><input id="entry-id" type="text" placeholder="例如 tea-water-temperature" required pattern="[a-z][a-z0-9-]*" ${off}></div><div class="field"><label for="entry-category">知識分類</label><select id="entry-category" ${off}>${model.state.categories.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}</select></div></div><div class="field"><label for="entry-kind">內容類型</label><select id="entry-kind" ${off}><option value="concept">知識條目</option><option value="tea-name">茶名拆解</option><option value="synthesis">比較／綜合整理</option></select></div>` : `<div class="status-line"><span class="tag">${e(label(doc.categoryId) || kinds[doc.kind])}</span><span>${e(doc.id)} · ${e(doc.updated ?? '')}</span>${doc.kind === 'source' ? `<span>· ${doc.originalAvailable ? '原件已保存，以下僅編輯摘要' : '原文尚未封存'}</span>` : ''}</div>`;
  main.innerHTML = heading(create ? 'NEW KNOWLEDGE' : 'EDIT & REFINE', create ? '留下一篇新的茶知識。' : '把知識，整理得更清楚。', readOnly ? '唯讀模式：保存與版本操作需在本機工作區開啟。' : '沿用來源，說清楚條件；保存時會檢查檔案並保留前一個版本。', `<a href="#articles" class="btn secondary">← 回到書架</a>${!create && !readOnly ? button('歷史版本', 'versions', 'secondary') : ''}`) + `<form id="editor-form"><section class="panel"><div class="editor-meta"><div class="field-row"><div class="field"><label for="entry-title">標題</label><input id="entry-title" type="text" value="${e(doc.title)}" required maxlength="200" ${off}></div><div class="field"><label for="entry-status">內容狀態</label><select id="entry-status" ${off}>${Object.entries(statuses).map(([id, title]) => `<option value="${id}" ${doc.status === id ? 'selected' : ''}>${title}</option>`).join('')}</select></div></div><div class="field"><label for="entry-summary">一句摘要</label><input id="entry-summary" type="text" value="${e(doc.summary)}" required maxlength="500" ${off}></div>${newFields}</div><div class="editor-grid"><div class="editor-pane"><div class="pane-label"><span>MARKDOWN 編輯</span><span>原件不受影響</span></div><label class="visually-hidden" for="entry-body">Markdown 內容</label><textarea id="entry-body" class="markdown-input" spellcheck="false" ${readOnly ? 'readonly' : ''}>${e(doc.body)}</textarea></div><div class="editor-pane"><div class="pane-label"><span>閱讀預覽</span><span>PREVIEW</span></div><div id="markdown-preview" class="prose"></div></div></div><div class="editor-meta"><div class="field-row"><div class="field"><label for="entry-sources">知識來源</label><select id="entry-sources" multiple ${off}>${options(sourcePages().filter(p => p.id !== doc.id), doc.sources ?? [])}</select><small>可多選；保存時補上來源連結，正文仍需說明引用依據。</small></div><div class="field"><label for="entry-related">相關條目</label><select id="entry-related" multiple ${off}>${options(model.state.pages.filter(p => p.id !== doc.id && !['index', 'log'].includes(p.kind)), doc.related ?? [])}</select><small>可公開內容不能指向尚未公開的草稿。</small></div></div><label class="check-label"><input id="entry-reviewed" type="checkbox" ${off}><span>我已複核來源、例子與適用範圍；「可公開」仍不等於網站已部署。</span></label><p class="form-note">保存不會連外搜尋或自動重寫內容。來源有不同說法時，請保留雙方依據。</p></div><div class="editor-actions"><span id="dirty-label" class="dirty-label">${create ? '尚未保存' : '已載入目前版本'}</span><div class="actions"><a href="#articles" class="btn secondary">返回</a><button type="submit" class="btn" id="save-button" ${off}>保存並更新索引</button></div></div></section></form>`;
  if (!demo && doc.kind === 'source' && doc.originalAvailable) document.querySelector('.page-heading .actions').insertAdjacentHTML('beforeend', `<a class="btn secondary" href="/api/original?source=${encodeURIComponent(doc.id)}">↧ 下載封存原件</a>`);
  updatePreview();
}
function updatePreview() {
  const body = document.querySelector('#entry-body')?.value ?? '';
  const base = new URL(model.current?.path ?? 'wiki/syntheses/preview.md', 'https://local.test/');
  document.querySelector('#markdown-preview').innerHTML = renderMarkdown(body, href => { if (/^https?:\/\//i.test(href)) return href; const match = model.state.pages.find(p => p.path === new URL(href, base).pathname.slice(1)); return match ? `#edit/${match.id}` : null; });
}
function healthPage() {
  const h = model.state.health;
  const report = h ? `<div class="report-summary ${h.ok ? '' : 'error'}"><span class="result-icon" aria-hidden="true">${h.ok ? '✓' : '!'}</span><div><strong>${h.ok ? '檔案結構檢查通過' : '有需要修正的項目'}</strong><p>${h.errors.length} 個錯誤 · ${h.warnings.length} 個維護提醒</p></div></div>${h.errors.map(x => `<div class="issue"><span>!</span><span>${e(x)}</span></div>`).join('')}${h.warnings.map(x => `<div class="issue"><span>◌</span><span>${e(x)}</span></div>`).join('')}<details><summary class="count-note">查看完整檢查輸出</summary><pre class="code-output">${e(h.output)}</pre></details>` : empty('準備好檢查你的 Wiki 了', '按下「執行健康檢查」，只會檢查本地資料。');
  main.innerHTML = heading('WIKI HEALTH', '讓知識，保持清楚與連結。', '檢查檔案、引用與原件完整性。內容是否正確，仍需要閱讀與查證。', button('✓ 執行健康檢查', 'run-check', '', disabled())) + panel('檢查結果', h ? `最近檢查：${e(new Date(h.checkedAt).toLocaleString('zh-TW'))}` : '尚未執行本次工作區檢查', report) + '<div class="hint-box">檢查涵蓋條目格式、分類、連結、來源引用、索引與原件指紋。它不會自動上網確認內容真偽，也不會修改封存原件。</div>';
}
function historyPage() { main.innerHTML = heading('WIKI JOURNAL', '每一步整理，都有紀錄。', '保存資料、修改條目、檢查與整合，依時間累積在同一份日誌。') + panel('操作日誌', `${operations().length} 次紀錄`, `<div class="prose">${renderMarkdown(model.state.operations)}</div>`); }
function guide() {
  const steps = [['上傳來源', '保存原件，建立來源草稿與待整理工作。PDF 僅封存，未提供 OCR。', 'sources'], ['閱讀與整合', '管理者或協作 AI 閱讀、查證並更新既有知識，附來源與不同說法。', 'articles'], ['檢查與維護', '保存前檢查結構，保留舊版，再更新索引與日誌。事實複核另行進行。', 'health']];
  main.innerHTML = heading('A SMALL GUIDE', '把資料，慢慢養成知識。', '這裡管理原始資料與 Markdown Wiki。新搜尋仍由你手動要求。') + `<div class="guide-grid">${steps.map((s, i) => `<section class="panel"><span class="guide-number">0${i + 1}</span><h3>${s[0]}</h3><p>${s[1]}</p><a href="#${s[2]}" class="btn text small">開始操作 →</a></section>`).join('')}</div>` + panel('本機管理與 GitHub 公開網站', '', '<p class="form-note">本機以 <code>npm run admin</code> 啟動，直接保存到專案。GitHub Pages 提供公開閱讀及唯讀管理展示，不能執行本機寫檔服務。管理頁不保存帳號密碼，也不自動上傳 GitHub。</p><h3>交給協作 AI 的整理指令</h3><pre class="code-output">請先讀 AGENTS.md 與索引，整理我上傳的來源。\n先閱讀原件，再更新來源摘要與相關知識，附引用及差異。\n更新索引、追加日誌並執行 check。只處理已有資料，不額外搜尋。</pre><p class="form-note">來源摘要不等於原始文件。封存原件不可在管理介面修改或刪除。</p>');
  main.insertAdjacentHTML('beforeend', panel('準備公開版本', '保存 Wiki 後，再手動產生公開閱讀版本。這個動作不會上傳或部署 GitHub。', `${button('產生公開版本', 'build-site', '', disabled())}<a class="btn secondary" href="${demo ? '../' : '/preview/'}" target="_blank" rel="noopener">開啟公開閱讀 ↗</a>`));
}
async function route() {
  if (!demo && !model.state) return authPage(model.auth ?? { configured: true });
  const serial = ++model.route, parts = (location.hash.slice(1) || 'dashboard').split('/'), page = parts[0];
  model.current = null; model.dirty = false;
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === (['edit', 'new'].includes(page) ? 'articles' : page)));
  document.querySelector('#breadcrumb').textContent = { dashboard: '工作總覽', articles: '知識條目', sources: '來源與匯入', health: '健康檢查', history: '操作紀錄', guide: '使用說明', edit: '編輯條目', new: '新增條目' }[page] ?? '工作總覽';
  try {
    if (page === 'edit') { main.innerHTML = '<div class="loading-state">正在讀取條目…</div>'; const doc = demo ? model.state.documents.find(d => d.id === parts[1]) : await api(`document?id=${encodeURIComponent(parts[1] ?? '')}`); if (serial !== model.route) return; if (!doc) throw new Error('找不到這個條目'); editorForm(doc); }
    else if (page === 'new') editorForm({ id: '', kind: 'concept', title: '', summary: '', status: 'draft', sources: [], related: [], body: '# 知識標題\n\n## 先說白話\n\n\n## 舉個例子\n\n\n## 容易搞混的地方\n\n', create: true }, true);
    else ({ dashboard, articles, sources, health: healthPage, history: historyPage, guide }[page] ?? dashboard)();
  } catch (error) { main.innerHTML = `<div class="error-screen"><h2>暫時無法開啟</h2><p>${e(error.message)}</p><a href="#dashboard" class="btn secondary">返回工作總覽</a></div>`; }
}
function markDirty() { model.dirty = true; const el = document.querySelector('#dirty-label'); if (el) el.textContent = '有尚未保存的修改'; }
function chooseFile(file) { if (!file) return; if (file.size > 10 * 1024 * 1024) return toast('檔案超過 10 MB', true); model.file = file; document.querySelector('#file-name').textContent = file.name; const title = document.querySelector('#source-title'); if (!title.value) title.value = file.name.replace(/\.[^.]+$/, ''); }
document.addEventListener('click', async event => {
  const anchor = event.target.closest('a[href^="#"]');
  if (anchor && model.dirty && !confirm('還有未保存的修改，要離開嗎？')) { event.preventDefault(); return; }
  const btn = event.target.closest('[data-action]'); if (!btn || btn.disabled) return;
  const action = btn.dataset.action;
  if (action === 'logout') {
    if (model.dirty && !confirm('尚有未保存的修改，仍要登出嗎？')) return;
    await api('auth/logout', {}); model.state = null; model.current = null; model.dirty = false; authPage({ configured: true }); return;
  }
  if (action.startsWith('tab-')) { model.tab = action.slice(4); dashboard(); return; }
  if (action === 'close-dialog') { document.querySelector('dialog').close(); return; }
  btn.disabled = true;
  try {
    if (action === 'run-check') { btn.textContent = '正在檢查…'; model.state.health = await api('check', {}); await refresh(); healthPage(); toast(model.state.health.ok ? '結構檢查完成，維護提醒已列出' : '檢查未通過', !model.state.health.ok); }
    if (action === 'build-site') { btn.textContent = '正在檢查與產生…'; const info = await api('build', {}); await refresh(); guide(); toast(`已產生 ${info.count} 頁公開內容；尚未上傳或部署`); }
    if (action === 'complete-job') { await api('complete', { id: btn.dataset.id }); await refresh(); sources(); toast('已標示整理完成'); }
    if (action === 'versions') { const versions = await api(`versions?id=${encodeURIComponent(model.current.id)}`); document.querySelector('#version-list').innerHTML = versions.length ? versions.map(v => `<div class="version-row"><span>${e(new Date(v.savedAt).toLocaleString('zh-TW'))}</span>${button('還原此版本', 'restore', 'secondary small', `data-version="${e(v.id)}"`)}</div>`).join('') : '<p class="form-note">保存後會保留先前的 Markdown 版本。</p>'; document.querySelector('dialog').showModal(); }
    if (action === 'restore' && confirm('還原為這個版本嗎？目前版本也會保留。')) { await api('restore', { id: model.current.id, version: btn.dataset.version, expectedRevision: model.current.revision }); document.querySelector('dialog').close(); model.dirty = false; await refresh(); await route(); toast('歷史版本已還原，原件未變更'); }
  } catch (error) { toast(error.message, true); }
  finally { if (btn.isConnected) btn.disabled = false; }
});
document.addEventListener('input', event => {
  if (event.target.id === 'article-search') { const pos = event.target.selectionStart; model.filter = event.target.value; articles(); const next = document.querySelector('#article-search'); next.focus(); try { next.setSelectionRange(pos, pos); } catch {} return; }
  if (event.target.closest('#editor-form')) { markDirty(); if (event.target.id === 'entry-body') updatePreview(); }
});
document.addEventListener('change', event => { if (event.target.id === 'source-file') chooseFile(event.target.files[0]); if (event.target.id === 'category-filter') { model.category = event.target.value; articles(); } if (event.target.id === 'status-filter') { model.status = event.target.value; articles(); } if (event.target.closest('#editor-form')) markDirty(); });
for (const type of ['dragover', 'dragleave', 'drop']) document.addEventListener(type, event => { const zone = event.target.closest('#dropzone'); if (!zone || demo) return; event.preventDefault(); zone.classList.toggle('dragging', type === 'dragover'); if (type === 'drop') chooseFile(event.dataTransfer.files[0]); });
document.addEventListener('submit', async event => {
  if (!['upload-form', 'editor-form', 'auth-form'].includes(event.target.id)) return;
  event.preventDefault(); if (demo) return;
  const btn = event.target.querySelector('button[type=submit]'), old = btn.textContent; btn.disabled = true; btn.textContent = '正在檢查並保存…';
  try {
    if (event.target.id === 'auth-form') {
      const password = document.querySelector('#owner-password').value;
      if (!model.auth.configured && password !== document.querySelector('#owner-confirm').value) throw new Error('兩次輸入的密碼不一致');
      await api(model.auth.configured ? 'auth/login' : 'auth/setup', { password });
      await refresh(); await route(); toast('已登入管理工作區'); return;
    }
    if (event.target.id === 'upload-form') {
      if (!model.file) throw new Error('請先選擇資料檔案');
      const bytes = new Uint8Array(await model.file.arrayBuffer()); let raw = ''; for (let i = 0; i < bytes.length; i += 8192) raw += String.fromCharCode(...bytes.subarray(i, i + 8192));
      await api('upload', { id: document.querySelector('#source-id').value, title: document.querySelector('#source-title').value, url: document.querySelector('#source-url').value, filename: model.file.name, data: btoa(raw) }); await refresh(); sources(); toast('原始資料已封存，已加入待整理清單');
    } else {
      const create = !!model.current.create, id = create ? document.querySelector('#entry-id').value : model.current.id;
      await api('save', { id, create, kind: create ? document.querySelector('#entry-kind').value : model.current.kind, categoryId: create ? document.querySelector('#entry-category').value : model.current.categoryId, title: document.querySelector('#entry-title').value, summary: document.querySelector('#entry-summary').value, status: document.querySelector('#entry-status').value, body: document.querySelector('#entry-body').value, sources: [...document.querySelector('#entry-sources').selectedOptions].map(x => x.value), related: [...document.querySelector('#entry-related').selectedOptions].map(x => x.value), reviewed: document.querySelector('#entry-reviewed').checked, expectedRevision: model.current.revision });
      model.dirty = false; await refresh(); if (location.hash === `#edit/${id}`) await route(); else location.hash = `edit/${id}`; toast('條目已保存，索引與操作紀錄已更新');
    }
  } catch (error) { toast(error.message, true); }
  finally { if (btn.isConnected) { btn.disabled = false; btn.textContent = old; } }
});
window.addEventListener('beforeunload', event => { if (model.dirty) { event.preventDefault(); event.returnValue = ''; } });
window.addEventListener('hashchange', route);
document.querySelector('#today').textContent = new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());
if (demo) { document.querySelector('#demo-banner').hidden = false; document.querySelector('#public-preview').href = '../'; document.querySelector('#environment').textContent = '公開展示版'; document.querySelector('.workspace-label span').textContent = '展示'; document.querySelector('#connection-label').textContent = '公開資料・唯讀模式'; }
try {
  const auth = demo ? { authenticated: true } : await api('auth/session');
  if (!auth.authenticated) authPage(auth); else { await refresh(); await route(); }
} catch (error) { main.innerHTML = `<div class="error-screen"><h1>還沒連上工作區</h1><p>${e(error.message)}</p><p>請確認本機服務已啟動，再重新整理頁面。</p></div>`; }
