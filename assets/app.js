// Khung chính: đọc danh mục công cụ, vẽ menu, điều hướng theo #id trên URL.
import { tools, groups } from '../tools/registry.js';
import { icon } from './icons.js';

const $ = (s, r = document) => r.querySelector(s);
const main = $('#main');
const nav = $('#nav');
const side = $('#side');
const search = $('#search');
let cleanup = null;

/* ---------- Helpers dùng chung cho mọi tool ---------- */
const toastEl = $('#toast');
let toastTimer;
export function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.hidden = true), 1800);
}

export async function copy(text, msg = 'Đã sao chép') {
  try {
    await navigator.clipboard.writeText(text);
    toast(msg);
    return true;
  } catch {
    toast('Trình duyệt chặn sao chép, hãy bôi đen và Ctrl+C');
    return false;
  }
}

export function download(data, filename, type) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: type || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function formatBytes(n) {
  if (!Number.isFinite(n)) return '–';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Tải một thư viện JS từ CDN đúng một lần. */
const loaded = new Map();
export function loadScript(src) {
  if (!loaded.has(src)) {
    loaded.set(src, new Promise((res, rej) => {
      const s = Object.assign(document.createElement('script'), { src, async: true });
      s.onload = res;
      s.onerror = () => { loaded.delete(src); rej(new Error('Không tải được ' + src)); };
      document.head.append(s);
    }));
  }
  return loaded.get(src);
}

const ctx = { toast, copy, download, formatBytes, escapeHtml, loadScript, icon };

/* ---------- Menu ---------- */
function renderNav(filter = '') {
  const q = normalize(filter);
  const match = (t) => !q || normalize([t.name, t.desc, ...(t.keywords || [])].join(' ')).includes(q);
  const current = location.hash.slice(1);
  const html = groups
    .map((g) => {
      const items = tools.filter((t) => t.group === g.id && match(t));
      if (!items.length) return '';
      return `<div class="nav-group"><div class="nav-label">${g.name}</div>${items
        .map((t) => `<a href="#${t.id}" ${t.id === current ? 'aria-current="page"' : ''}>${icon(t.icon)}<span>${t.name}</span></a>`)
        .join('')}</div>`;
    })
    .join('');
  nav.innerHTML = html || `<p class="nav-empty">Không có công cụ nào khớp “${escapeHtml(filter)}”.</p>`;
}

function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
}

/* ---------- Trang chủ ---------- */
function renderHome() {
  document.title = 'Hộp Đồ Nghề';
  main.innerHTML = `
    <section>
      <div class="home-head">
        <h1>Hộp Đồ Nghề</h1>
        <p>${tools.length} công cụ nhỏ dùng hằng ngày. Tất cả chạy ngay trong trình duyệt, file và nội dung của bạn không rời khỏi máy.</p>
      </div>
      ${groups
        .map((g) => {
          const items = tools.filter((t) => t.group === g.id);
          if (!items.length) return '';
          return `<div class="home-section"><h2>${g.name}</h2><div class="cards">${items
            .map((t) => `<a class="card" href="#${t.id}">${icon(t.icon)}<strong>${t.name}</strong><span>${t.desc}</span></a>`)
            .join('')}</div></div>`;
        })
        .join('')}
    </section>`;
}

/* ---------- Điều hướng ---------- */
async function route() {
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  const id = location.hash.slice(1);
  const tool = tools.find((t) => t.id === id);
  renderNav(search.value);
  closeMenu();
  window.scrollTo(0, 0);

  if (!tool) return renderHome();

  document.title = `${tool.name} · Hộp Đồ Nghề`;
  const group = groups.find((g) => g.id === tool.group);
  main.innerHTML = `
    <section>
      <header class="tool-head">
        <span class="crumb">${group ? group.name : ''}</span>
        <h1>${tool.name}</h1>
        <p>${tool.desc}</p>
      </header>
      <div id="tool-root"><p class="loading">Đang tải…</p></div>
    </section>`;
  const root = $('#tool-root');
  try {
    const mod = await tool.load();
    if (location.hash.slice(1) !== id) return; // người dùng đã chuyển trang
    root.innerHTML = '';
    cleanup = (await mod.default(root, ctx)) || null;
  } catch (e) {
    console.error(e);
    root.innerHTML = `<p class="err">Không mở được công cụ này: ${escapeHtml(e.message)}</p>`;
  }
}

/* ---------- Menu trên điện thoại ---------- */
const menuBtn = $('#menu');
function closeMenu() { side.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
menuBtn.addEventListener('click', () => {
  const open = side.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
  if (open) search.focus();
});
document.addEventListener('click', (e) => {
  if (side.classList.contains('open') && !side.contains(e.target) && e.target !== menuBtn) closeMenu();
});

/* ---------- Giao diện sáng/tối ---------- */
const themes = ['', 'light', 'dark'];
const themeNames = { '': 'Theo máy', light: 'Sáng', dark: 'Tối' };
function applyTheme(t) {
  if (t) document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
  $('#theme-label').textContent = themeNames[t];
  try { t ? localStorage.setItem('theme', t) : localStorage.removeItem('theme'); } catch {}
}
applyTheme(document.documentElement.dataset.theme || '');
$('#theme').addEventListener('click', () => {
  const cur = document.documentElement.dataset.theme || '';
  applyTheme(themes[(themes.indexOf(cur) + 1) % themes.length]);
});

/* ---------- Tìm kiếm ---------- */
search.addEventListener('input', () => renderNav(search.value));
search.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const first = nav.querySelector('a');
    if (first) { location.hash = first.getAttribute('href'); search.blur(); }
  }
  if (e.key === 'Escape') { search.value = ''; renderNav(); search.blur(); }
});
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
    e.preventDefault();
    if (matchMedia('(max-width: 820px)').matches) menuBtn.click(); else search.focus();
  }
});

window.addEventListener('hashchange', route);
route();
