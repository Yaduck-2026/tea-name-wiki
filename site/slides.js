// Renders dist/slides/deck.json, produced by scripts/build.mjs from the Wiki slide-deck page.
// Slide HTML comes from renderMarkdown, which escapes all text and drops raw HTML.
const stage = document.querySelector('#stage');
const counter = document.querySelector('#counter');
const bar = document.querySelector('#progress');
const prev = document.querySelector('#prev'), next = document.querySelector('#next');
let deck, current = 0;

const clamp = n => Math.min(Math.max(n, 0), deck.slides.length - 1);
const fromHash = () => clamp((parseInt(location.hash.slice(1), 10) || 1) - 1);

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

// Split a slide into heading, body, image and citation areas so CSS can lay them out.
function slideElement(slide) {
  const article = el('article', `slide${slide.cover ? ' cover' : ''}`);
  article.setAttribute('aria-roledescription', '投影片');
  const body = el('div', 'slide-body');
  body.innerHTML = slide.html;
  const head = el('div', 'slide-head');
  if (slide.cover) head.append(el('p', 'eyebrow', '茶名有解 · 教學簡報'));
  const heading = body.querySelector('h1,h2');
  if (heading) head.append(heading);
  const cites = el('div', 'slide-cites');
  for (const p of [...body.querySelectorAll('p')]) if (p.textContent.trim().startsWith('依據：')) { p.classList.add('cite'); cites.append(p); }
  article.append(head);
  if (slide.image) {
    const figure = el('figure', 'slide-figure');
    if (slide.image.missing) {
      const box = el('div', 'placeholder');
      box.setAttribute('role', 'img');
      box.setAttribute('aria-label', `圖片預留：${slide.image.alt}`);
      box.append(el('strong', '', '圖片預留'), el('span', '', slide.image.alt));
      figure.append(box);
    } else {
      const img = el('img');
      Object.assign(img, { src: slide.image.src, alt: slide.image.alt, loading: 'lazy', decoding: 'async' });
      figure.append(img);
      if (slide.image.caption) figure.append(el('figcaption', '', slide.image.caption));
    }
    article.classList.add(body.textContent.trim() ? 'has-image' : 'image-only');
    // Leading paragraphs before a table become a full-width lead above the image and table.
    const first = body.firstElementChild;
    if (first?.tagName === 'P' && body.querySelector('.table-scroll')) {
      const lead = el('div', 'slide-lead');
      while (body.firstElementChild?.tagName === 'P') lead.append(body.firstElementChild);
      article.classList.add('has-lead');
      article.append(lead);
    }
    article.append(figure);
  }
  if (body.textContent.trim()) article.append(body);
  if (cites.childElementCount) article.append(cites);
  return article;
}

// In the two-column lead layout, stretch the table to the image height so both line up.
const wide = matchMedia('(min-width: 761px)');
function alignTable() {
  const article = stage.querySelector('.slide.has-lead');
  const table = article?.querySelector('.slide-body table'), img = article?.querySelector('.slide-figure img');
  if (!table || !img) return;
  table.style.height = '';
  if (wide.matches && img.complete && img.naturalWidth) table.style.height = `${img.getBoundingClientRect().height}px`;
}
addEventListener('resize', alignTable);

// Slide outline sidebar. Desktop: beside the slide, hidden by default, the reader's choice is
// remembered in this browser. Mobile: an overlay drawer that always starts closed.
const toggle = document.querySelector('#outline-toggle');
const outline = document.querySelector('#outline');
const outlineList = document.querySelector('#outline-list');
const backdrop = document.querySelector('#outline-backdrop');
const OUTLINE_KEY = 'teawiki.slides.outline';
const readPreference = () => { try { return localStorage.getItem(OUTLINE_KEY) === 'open'; } catch { return false; } };
const savePreference = open => { try { localStorage.setItem(OUTLINE_KEY, open ? 'open' : 'closed'); } catch { /* storage unavailable: keep default */ } };
let outlineOpen = false, focusToggleAfterJump = false;

function setOutline(open, { remember = false } = {}) {
  outlineOpen = open;
  document.body.classList.toggle('outline-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  backdrop.hidden = !(open && !wide.matches);
  if (remember && wide.matches) savePreference(open);
  if (open && !wide.matches) outlineList.querySelector('[aria-current="true"]')?.focus();
  alignTable();
}

function closeDrawer() {
  setOutline(false);
  toggle.focus();
}

function buildOutline() {
  outlineList.replaceChildren(...deck.slides.map((slide, i) => {
    const item = el('li');
    const link = el('a', '', `${i + 1}. ${slide.title}`);
    link.href = `#${i + 1}`;
    item.append(link);
    return item;
  }));
  toggle.addEventListener('click', () => setOutline(!outlineOpen, { remember: true }));
  backdrop.addEventListener('click', closeDrawer);
  outlineList.addEventListener('click', event => {
    if (!event.target.closest('a') || wide.matches) return;
    focusToggleAfterJump = true;
    setOutline(false);
    if (event.target.closest('a').getAttribute('href') === location.hash) { focusToggleAfterJump = false; toggle.focus(); }
  });
  addEventListener('keydown', event => { if (event.key === 'Escape' && outlineOpen && !wide.matches) closeDrawer(); });
  wide.addEventListener('change', event => setOutline(event.matches ? readPreference() : false));
  setOutline(wide.matches ? readPreference() : false);
}

// Mark the current slide in the outline and keep it visible inside the outline's own scroll area.
function markOutline() {
  for (const link of outlineList.querySelectorAll('a')) {
    const isCurrent = link.getAttribute('href') === `#${current + 1}`;
    if (isCurrent) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
    if (isCurrent && outlineOpen) {
      // The outline is sticky (desktop) or fixed (mobile), so it is the links' offsetParent.
      const top = link.offsetTop, bottom = top + link.offsetHeight;
      if (top < outline.scrollTop) outline.scrollTop = top;
      else if (bottom > outline.scrollTop + outline.clientHeight) outline.scrollTop = bottom - outline.clientHeight;
    }
  }
}

function show(index, focus) {
  current = clamp(index);
  const slide = deck.slides[current];
  stage.replaceChildren(slideElement(slide));
  const leadImage = stage.querySelector('.slide.has-lead .slide-figure img');
  if (leadImage) { leadImage.addEventListener('load', alignTable); alignTable(); }
  const total = deck.slides.length;
  counter.textContent = `第 ${current + 1} 張，共 ${total} 張`;
  bar.style.width = `${((current + 1) / total) * 100}%`;
  prev.disabled = current === 0;
  next.disabled = current === total - 1;
  document.title = slide.cover ? `${deck.title}｜茶名有解` : `${slide.title}｜${deck.title}`;
  markOutline();
  if (focusToggleAfterJump) { focusToggleAfterJump = false; toggle.focus(); return; }
  if (focus) {
    const heading = stage.querySelector('h1,h2');
    if (heading) { heading.tabIndex = -1; heading.focus(); }
  }
}

// Update `current` immediately so fast repeated key presses are not lost before hashchange fires.
const go = index => {
  const target = clamp(index);
  if (target === current && location.hash) return;
  current = target;
  location.hash = String(target + 1);
};

try {
  const response = await fetch('./deck.json');
  if (!response.ok) throw new Error(response.status);
  deck = await response.json();
  if (!deck.slides?.length) throw new Error('empty');
  buildOutline();
  show(fromHash(), false);
  addEventListener('hashchange', () => show(fromHash(), true));
  prev.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));
  addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
    const moves = { ArrowRight: current + 1, PageDown: current + 1, ArrowLeft: current - 1, PageUp: current - 1, Home: 0, End: deck.slides.length - 1 };
    if (event.key in moves) { event.preventDefault(); go(moves[event.key]); }
  });
} catch {
  stage.innerHTML = '<p class="error">簡報載入失敗。請回到首頁，或直接閱讀 Wiki 文章。</p>';
  prev.disabled = next.disabled = true;
}
