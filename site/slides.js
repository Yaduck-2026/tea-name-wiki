// Renders dist/slides/deck.json, produced by scripts/build.mjs from the Wiki slide-deck page.
// Slide HTML comes from renderMarkdown, which escapes all text and drops raw HTML.
const stage = document.querySelector('#stage');
const counter = document.querySelector('#counter');
const bar = document.querySelector('#progress');
const prev = document.querySelector('#prev'), next = document.querySelector('#next');
let deck, current = 0;

const clamp = n => Math.min(Math.max(n, 0), deck.slides.length - 1);
const fromHash = () => clamp((parseInt(location.hash.slice(1), 10) || 1) - 1);

function show(index, focus) {
  current = clamp(index);
  const slide = deck.slides[current];
  stage.innerHTML = `<article class="slide${slide.cover ? ' cover' : ''}" aria-roledescription="投影片">${slide.cover ? '<p class="eyebrow">茶名有解 · 教學簡報</p>' : ''}${slide.html}</article>`;
  for (const p of stage.querySelectorAll('p')) if (p.textContent.trim().startsWith('依據：')) p.classList.add('cite');
  const total = deck.slides.length;
  counter.textContent = `第 ${current + 1} 張，共 ${total} 張`;
  bar.style.width = `${((current + 1) / total) * 100}%`;
  prev.disabled = current === 0;
  next.disabled = current === total - 1;
  document.title = slide.cover ? `${deck.title}｜茶名有解` : `${slide.title}｜${deck.title}`;
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
