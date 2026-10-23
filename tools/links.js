// Quản lý link động (QR động): xem, tạo, đổi đích, xoá. Dữ liệu lưu trong Cloudflare KV qua /api/links.
import { api, getPassword, setPassword, loginForm, shortUrl, slugify } from '../assets/links-api.js';

export default function mount(root, { copy, toast, escapeHtml }) {
  let links = [];
  let editing = null; // slug đang sửa
  let confirmDel = null; // slug đang chờ xác nhận xoá

  const $ = (s) => root.querySelector(s);
  const fmtDate = (t) => (t ? new Date(t).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '–');
  const validUrl = (u) => /^https?:\/\/\S+\.\S+/.test(u);

  function shell() {
    if (!getPassword()) {
      root.innerHTML = `<div class="panel" style="max-width:520px" id="lk-login"></div>
        <p class="note" style="margin-top:12px;max-width:62ch">Mật khẩu là secret <span class="mono">ADMIN_PASSWORD</span> bạn đặt trong Cloudflare (Worker tools → Settings → Variables and Secrets).</p>`;
      loginForm($('#lk-login'), shell);
      return;
    }
    root.innerHTML = `
      <div class="stack">
        <form id="lk-new" class="panel stack" autocomplete="off">
          <span class="label">Tạo link động mới</span>
          <div style="display:grid;grid-template-columns:minmax(0,200px) minmax(0,1fr);gap:10px" class="lk-new-grid">
            <label class="field"><span>Tên ngắn</span><input id="lk-slug" class="input mono" placeholder="menu" spellcheck="false"></label>
            <label class="field"><span>Link đích</span><input id="lk-url" class="input" type="url" placeholder="https://…"></label>
          </div>
          <label class="field"><span>Ghi chú (tuỳ chọn)</span><input id="lk-note" class="input" maxlength="120" placeholder="VD: QR in trên tờ rơi tháng 10"></label>
          <div class="row" style="justify-content:space-between">
            <span id="lk-preview" class="mono note" style="font-size:12.5px;overflow-wrap:anywhere;min-width:0"></span>
            <button class="btn" type="submit">Tạo link</button>
          </div>
          <p id="lk-new-err" class="err" hidden></p>
        </form>

        <div class="row" style="justify-content:space-between">
          <label class="search" style="flex:1;max-width:360px;min-width:200px">
            <input id="lk-filter" type="search" placeholder="Lọc theo tên, link, ghi chú…">
          </label>
          <div class="row">
            <button id="lk-reload" class="ghost sm" type="button">Tải lại</button>
            <button id="lk-logout" class="ghost sm" type="button">Đăng xuất</button>
          </div>
        </div>
        <p id="lk-count" class="note"></p>
        <div id="lk-list" class="stack" style="gap:8px"><p class="loading">Đang tải danh sách…</p></div>
      </div>
      <style>@media (max-width:640px){.lk-new-grid,.lk-row{grid-template-columns:minmax(0,1fr)!important}.lk-row .row{justify-content:flex-start!important}}</style>`;

    $('#lk-slug').addEventListener('input', preview);
    $('#lk-slug').addEventListener('blur', () => ($('#lk-slug').value = slugify($('#lk-slug').value)));
    $('#lk-new').addEventListener('submit', create);
    $('#lk-filter').addEventListener('input', renderList);
    $('#lk-reload').addEventListener('click', load);
    $('#lk-logout').addEventListener('click', () => { setPassword(''); shell(); });
    $('#lk-list').addEventListener('click', onListClick);
    $('#lk-list').addEventListener('submit', onEditSubmit);
    preview();
    load();
  }

  function preview() {
    const s = slugify($('#lk-slug').value);
    $('#lk-preview').textContent = s ? shortUrl(s) : '';
  }

  function handleAuthError(e) {
    if (e.status === 401) { setPassword(''); toast('Phiên đăng nhập hết hạn'); shell(); return true; }
    return false;
  }

  async function load() {
    try {
      const d = await api('GET');
      links = d.links || [];
      renderList();
    } catch (e) {
      if (handleAuthError(e)) return;
      $('#lk-list').innerHTML = `<p class="err">${escapeHtml(e.message)}</p>`;
    }
  }

  async function create(e) {
    e.preventDefault();
    const err = $('#lk-new-err');
    const slug = slugify($('#lk-slug').value);
    const url = $('#lk-url').value.trim();
    err.hidden = true;
    if (!slug) { err.textContent = 'Đặt một tên ngắn, ví dụ: menu, cv, khuyen-mai.'; err.hidden = false; return; }
    if (!validUrl(url)) { err.textContent = 'Link đích phải bắt đầu bằng http:// hoặc https://'; err.hidden = false; return; }
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      await api('PUT', '/' + slug, { url, note: $('#lk-note').value, createOnly: true });
      toast('Đã tạo ' + slug);
      e.target.reset(); preview();
      await load();
    } catch (ex) {
      if (!handleAuthError(ex)) { err.textContent = ex.message + (ex.status === 409 ? '. Sửa đích của nó trong danh sách bên dưới.' : ''); err.hidden = false; }
    }
    btn.disabled = false;
  }

  function rowHtml(l) {
    const s = escapeHtml(l.slug);
    const short = escapeHtml(shortUrl(l.slug));
    if (editing === l.slug) {
      return `
        <form class="panel stack" data-edit="${s}" style="gap:10px;border-color:var(--accent)">
          <div class="mono" style="font-weight:600">${short}</div>
          <label class="field"><span>Link đích mới</span><input class="input" name="url" type="url" value="${escapeHtml(l.url || '')}"></label>
          <label class="field"><span>Ghi chú</span><input class="input" name="note" maxlength="120" value="${escapeHtml(l.note || '')}"></label>
          <p class="err" hidden></p>
          <div class="row"><button class="btn sm" type="submit">Lưu</button><button class="ghost sm" type="button" data-act="cancel">Huỷ</button></div>
        </form>`;
    }
    const del = confirmDel === l.slug
      ? `<div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-end">
           <span class="err" style="font-size:12.5px">Mọi QR đã in với link này sẽ ngừng hoạt động.</span>
           <button class="btn sm" type="button" data-act="del-yes" data-s="${s}" style="background:var(--bad)">Xoá hẳn</button>
           <button class="ghost sm" type="button" data-act="del-no">Huỷ</button></div>`
      : `<div class="row" style="gap:6px;justify-content:flex-end">
           <button class="ghost sm" type="button" data-act="copy" data-s="${s}">Chép link</button>
           <button class="ghost sm" type="button" data-act="qr" data-s="${s}">QR</button>
           <button class="ghost sm" type="button" data-act="edit" data-s="${s}">Đổi đích</button>
           <button class="ghost sm" type="button" data-act="del" data-s="${s}">Xoá</button></div>`;
    return `
      <div class="panel lk-row" style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px 16px;align-items:center;padding:12px 16px">
        <div style="min-width:0;display:flex;flex-direction:column;gap:2px">
          <div class="mono" style="font-weight:600;overflow-wrap:anywhere">/go/${s}</div>
          <div style="font-size:13.5px;overflow-wrap:anywhere">→ <a href="${escapeHtml(l.url || '')}" target="_blank" rel="noopener">${escapeHtml(l.url || '')}</a></div>
          <div class="note" style="font-size:12.5px">${l.note ? escapeHtml(l.note) + ' · ' : ''}sửa ${fmtDate(l.updated)}</div>
        </div>
        ${del}
      </div>`;
  }

  function renderList() {
    const q = ($('#lk-filter')?.value || '').toLowerCase();
    const shown = links.filter((l) => !q || [l.slug, l.url, l.note].join(' ').toLowerCase().includes(q));
    $('#lk-count').textContent = links.length ? `${links.length} link động${q ? ` · ${shown.length} khớp bộ lọc` : ''}` : '';
    $('#lk-list').innerHTML = shown.length
      ? shown.map(rowHtml).join('')
      : `<div class="panel note" style="text-align:center;padding:28px">${links.length ? 'Không có link nào khớp bộ lọc.' : 'Chưa có link động nào. Tạo link đầu tiên ở khung phía trên, hoặc từ tool Tạo mã QR → Động.'}</div>`;
    const f = $('#lk-list [data-edit] input[name=url]');
    if (f) f.focus();
  }

  async function onListClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const s = b.dataset.s;
    const act = b.dataset.act;
    if (act === 'copy') return copy(shortUrl(s));
    if (act === 'qr') {
      const l = links.find((x) => x.slug === s);
      try { sessionStorage.setItem('qr-prefill', JSON.stringify({ slug: s, url: l?.url })); } catch {}
      location.hash = 'qr';
      return;
    }
    if (act === 'edit') { editing = s; confirmDel = null; return renderList(); }
    if (act === 'cancel') { editing = null; return renderList(); }
    if (act === 'del') { confirmDel = s; editing = null; return renderList(); }
    if (act === 'del-no') { confirmDel = null; return renderList(); }
    if (act === 'del-yes') {
      b.disabled = true;
      try {
        await api('DELETE', '/' + s);
        links = links.filter((x) => x.slug !== s);
        confirmDel = null;
        toast('Đã xoá ' + s);
        renderList();
      } catch (ex) { if (!handleAuthError(ex)) { toast(ex.message); b.disabled = false; } }
    }
  }

  async function onEditSubmit(e) {
    const form = e.target.closest('[data-edit]');
    if (!form) return;
    e.preventDefault();
    const s = form.dataset.edit;
    const url = form.url.value.trim();
    const err = form.querySelector('.err');
    if (!validUrl(url)) { err.textContent = 'Link đích phải bắt đầu bằng http:// hoặc https://'; err.hidden = false; return; }
    form.querySelector('button[type=submit]').disabled = true;
    try {
      const d = await api('PUT', '/' + s, { url, note: form.note.value });
      links = links.map((x) => (x.slug === s ? { slug: s, ...d } : x));
      editing = null;
      toast('Đã đổi đích /go/' + s);
      renderList();
    } catch (ex) {
      if (!handleAuthError(ex)) { err.textContent = ex.message; err.hidden = false; form.querySelector('button[type=submit]').disabled = false; }
    }
  }

  shell();
}
