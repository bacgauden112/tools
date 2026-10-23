// Gọi API link động (/api/links) của Worker. Mật khẩu chỉ lưu trong trình duyệt này.
import { SITE_URL, SHORT_PREFIX } from './config.js';

const KEY = 'links-admin-password';

export const apiBase = () => (location.origin === SITE_URL || /^https?:\/\/(localhost|127\.0\.0\.1)/.test(location.origin) ? '' : SITE_URL);
export const shortUrl = (slug) => SITE_URL + SHORT_PREFIX + slug;

export function getPassword() {
  try { return localStorage.getItem(KEY) || sessionStorage.getItem(KEY) || ''; } catch { return ''; }
}
export function setPassword(pw, remember = true) {
  try {
    localStorage.removeItem(KEY); sessionStorage.removeItem(KEY);
    if (pw) (remember ? localStorage : sessionStorage).setItem(KEY, pw);
  } catch {}
}

export class ApiError extends Error {
  constructor(msg, status, data) { super(msg); this.status = status; this.data = data; }
}

export async function api(method, path = '', body, pw = getPassword()) {
  let r;
  try {
    r = await fetch(apiBase() + '/api/links' + path, {
      method,
      headers: { Authorization: 'Bearer ' + pw, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('Không kết nối được tới máy chủ. Kiểm tra mạng rồi thử lại.', 0);
  }
  let data = {};
  try { data = await r.json(); } catch {}
  if (!r.ok) throw new ApiError(data.error || (r.status === 404 ? 'Máy chủ chưa có API link động (Worker chưa được deploy?).' : 'Lỗi ' + r.status), r.status, data);
  return data;
}

/** Kiểm tra mật khẩu. Trả về true/false, ném lỗi nếu máy chủ có vấn đề khác. */
export async function login(pw) {
  try {
    const r = await fetch(apiBase() + '/api/ping', { headers: { Authorization: 'Bearer ' + pw }, cache: 'no-store' });
    if (r.status === 401) return false;
    if (!r.ok) {
      let d = {}; try { d = await r.json(); } catch {}
      throw new ApiError(d.error || (r.status === 404 ? 'Máy chủ chưa có API link động (Worker chưa được deploy?).' : 'Lỗi ' + r.status), r.status);
    }
    return true;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError('Không kết nối được tới máy chủ.', 0);
  }
}

export const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
    .replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '').slice(0, 64);

/** Khung đăng nhập dùng chung. Gọi onOk() sau khi đăng nhập đúng. */
export function loginForm(el, onOk, { title = 'Đăng nhập để quản lý link động' } = {}) {
  el.innerHTML = `
    <form class="stack" style="gap:10px" autocomplete="on">
      <span class="label">${title}</span>
      <div class="row" style="flex-wrap:nowrap">
        <input id="lk-pw" class="input" type="password" autocomplete="current-password" placeholder="Mật khẩu ADMIN_PASSWORD" style="flex:1">
        <button class="btn" type="submit">Đăng nhập</button>
      </div>
      <label class="row note" style="gap:6px"><input id="lk-remember" type="checkbox" checked> Ghi nhớ trên trình duyệt này</label>
      <p class="err" hidden></p>
    </form>`;
  const form = el.querySelector('form');
  const err = el.querySelector('.err');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = el.querySelector('#lk-pw').value;
    const btn = form.querySelector('button');
    if (!pw) return;
    btn.disabled = true; err.hidden = true;
    try {
      if (await login(pw)) { setPassword(pw, el.querySelector('#lk-remember').checked); onOk(); }
      else { err.textContent = 'Sai mật khẩu.'; err.hidden = false; }
    } catch (ex) { err.textContent = ex.message; err.hidden = false; }
    btn.disabled = false;
  });
}
