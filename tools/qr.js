// Tạo mã QR tĩnh hoặc động. Thư viện qrcode-generator được tải từ CDN khi mở tool.
// QR động = QR chứa link ngắn SITE_URL/go/<tên>, chuyển hướng qua file _redirects.
import { SITE_URL, REPO, BRANCH, SHORT_PREFIX } from '../assets/config.js';

const LIB = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';

const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
    .replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '');

export default async function mount(root, { loadScript, download, copy, toast, escapeHtml }) {
  root.innerHTML = `
    <div class="split">
      <div class="stack">
        <div class="panel stack">
          <div class="seg" role="group" aria-label="Loại nội dung">
            <button type="button" data-mode="text" aria-pressed="true">Link / văn bản</button>
            <button type="button" data-mode="wifi" aria-pressed="false">Wi-Fi</button>
          </div>
          <div data-pane="text" class="stack">
            <div class="row" style="justify-content:space-between">
              <span class="label">Kiểu mã</span>
              <div class="seg" role="group" aria-label="Kiểu mã">
                <button type="button" data-type="static" aria-pressed="true">Tĩnh</button>
                <button type="button" data-type="dynamic" aria-pressed="false">Động</button>
              </div>
            </div>
            <p id="qr-type-note" class="note"></p>

            <div data-type-pane="static" class="stack">
              <label class="field"><span>Nội dung</span>
                <textarea id="qr-text" class="textarea" style="min-height:110px;font-family:var(--font-ui);font-size:15px">https://github.com/bacgauden112/tools</textarea>
              </label>
            </div>

            <div data-type-pane="dynamic" class="stack" hidden>
              <label class="field"><span>Tên ngắn</span>
                <div style="display:flex;align-items:stretch;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--panel)">
                  <span class="mono note" style="display:flex;align-items:center;padding:0 10px;background:var(--sunk);border-right:1px solid var(--line);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(SHORT_PREFIX)}</span>
                  <input id="qr-slug" class="input mono" style="border:0;border-radius:0;height:36px" value="github" autocomplete="off" spellcheck="false">
                </div>
              </label>
              <label class="field"><span>Link đích (có thể đổi sau này)</span>
                <input id="qr-target" class="input" type="url" value="https://github.com/bacgauden112/tools" placeholder="https://…"></label>
              <p id="qr-dyn-err" class="err" hidden></p>

              <div class="stack" style="gap:8px;background:var(--sunk);border-radius:8px;padding:12px 14px">
                <div class="row" style="justify-content:space-between">
                  <span class="label">Mã QR sẽ chứa link</span>
                  <span id="qr-status" class="note" style="font-size:12.5px"></span>
                </div>
                <div class="row" style="gap:8px;flex-wrap:nowrap">
                  <code id="qr-short" class="mono" style="flex:1;min-width:0;overflow-wrap:anywhere;font-size:13px"></code>
                  <button id="qr-copy-short" class="ghost sm" type="button">Chép</button>
                </div>
                <span class="label" style="margin-top:6px">Dòng cần có trong file <span class="mono">_redirects</span></span>
                <div class="row" style="gap:8px;flex-wrap:nowrap">
                  <code id="qr-line" class="mono" style="flex:1;min-width:0;overflow-wrap:anywhere;font-size:13px"></code>
                  <button id="qr-copy-line" class="ghost sm" type="button">Chép</button>
                </div>
                <div class="row" style="margin-top:4px">
                  <a id="qr-edit" class="btn sm" target="_blank" rel="noopener">Mở _redirects trên GitHub</a>
                  <button id="qr-check" class="ghost sm" type="button">Kiểm tra lại</button>
                </div>
                <p class="note" style="font-size:12.5px">Thêm dòng trên (hoặc sửa link đích ở dòng cũ) rồi bấm Commit. Khoảng 1 phút sau link ngắn hoạt động. Muốn đổi đích về sau, chỉ cần sửa dòng đó, không cần in lại QR.</p>
              </div>
            </div>
          </div>
          <div data-pane="wifi" class="stack" hidden>
            <div class="grid2">
              <label class="field"><span>Tên mạng (SSID)</span><input id="qr-ssid" class="input" value="Nha Minh"></label>
              <label class="field"><span>Mật khẩu</span><input id="qr-pass" class="input" value="matkhau123"></label>
            </div>
            <div class="row">
              <label class="field" style="flex:1"><span>Bảo mật</span>
                <select id="qr-sec" class="select"><option value="WPA">WPA/WPA2/WPA3</option><option value="WEP">WEP</option><option value="nopass">Không mật khẩu</option></select>
              </label>
              <label class="row" style="margin-top:22px"><input id="qr-hidden" type="checkbox"> Mạng ẩn</label>
            </div>
            <p class="note">Quét mã này bằng camera điện thoại để vào Wi-Fi mà không cần gõ mật khẩu.</p>
          </div>
        </div>

        <div class="panel stack">
          <div class="grid2">
            <label class="field"><span>Kích thước ảnh: <b id="qr-size-v" class="mono">512</b> px</span>
              <input id="qr-size" type="range" min="128" max="2048" step="64" value="512"></label>
            <label class="field"><span>Viền trắng: <b id="qr-margin-v" class="mono">4</b> ô</span>
              <input id="qr-margin" type="range" min="0" max="10" value="4"></label>
          </div>
          <div class="row" style="gap:18px">
            <label class="field"><span>Màu mã</span><input id="qr-fg" type="color" value="#111827"></label>
            <label class="field"><span>Màu nền</span><input id="qr-bg" type="color" value="#ffffff"></label>
            <label class="field" style="flex:1;min-width:180px"><span>Mức chịu lỗi</span>
              <select id="qr-ecc" class="select">
                <option value="L">Thấp (7%) · mã gọn nhất</option>
                <option value="M" selected>Vừa (15%)</option>
                <option value="Q">Khá (25%)</option>
                <option value="H">Cao (30%) · khi in hoặc chèn logo</option>
              </select></label>
          </div>
        </div>
      </div>

      <div class="panel stack" style="position:sticky;top:16px">
        <div class="check" style="border-radius:8px;padding:16px;display:grid;place-items:center">
          <canvas id="qr-canvas" width="512" height="512" style="width:100%;max-width:300px;height:auto;image-rendering:pixelated"></canvas>
        </div>
        <p id="qr-info" class="note mono"></p>
        <p id="qr-err" class="err" hidden></p>
        <div class="row">
          <button id="qr-png" class="btn" type="button">Tải PNG</button>
          <button id="qr-svg" class="ghost" type="button">Tải SVG</button>
          <button id="qr-copy" class="ghost" type="button">Chép ảnh</button>
        </div>
      </div>
    </div>`;

  const $ = (s) => root.querySelector(s);
  let mode = 'text';
  let lastSvg = '';

  root.querySelectorAll('[data-mode]').forEach((b) =>
    b.addEventListener('click', () => {
      mode = b.dataset.mode;
      root.querySelectorAll('[data-mode]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      root.querySelectorAll('[data-pane]').forEach((p) => (p.hidden = p.dataset.pane !== mode));
      render();
    })
  );

  await loadScript(LIB);
  const qrcode = window.qrcode;
  qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];

  /* ---------- Tĩnh / Động ---------- */
  let type = 'static';
  const notes = {
    static: 'Nội dung nằm thẳng trong mã. Đổi link thì phải tạo và in mã mới.',
    dynamic: 'Mã chứa một link ngắn của bạn. Sau này đổi link đích thì mã đã in vẫn dùng được.',
  };
  root.querySelectorAll('[data-type]').forEach((b) =>
    b.addEventListener('click', () => {
      type = b.dataset.type;
      root.querySelectorAll('[data-type]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      root.querySelectorAll('[data-type-pane]').forEach((p) => (p.hidden = p.dataset.typePane !== type));
      $('#qr-type-note').textContent = notes[type];
      render();
      if (type === 'dynamic') checkLater(0);
    })
  );
  $('#qr-type-note').textContent = notes.static;

  const slug = () => slugify($('#qr-slug').value);
  const shortUrl = () => SITE_URL + SHORT_PREFIX + slug();

  function updateDynamic() {
    const s = slug();
    const target = $('#qr-target').value.trim();
    const err = $('#qr-dyn-err');
    let msg = '';
    if (!s) msg = 'Đặt một tên ngắn, ví dụ: menu, cv, khuyen-mai.';
    else if (!/^https?:\/\/\S+\.\S+/.test(target)) msg = 'Link đích phải bắt đầu bằng http:// hoặc https://';
    err.textContent = msg;
    err.hidden = !msg;
    $('#qr-short').textContent = s ? shortUrl() : '–';
    $('#qr-line').textContent = s && !msg ? `${SHORT_PREFIX}${s}   ${target}   302` : '–';
    $('#qr-edit').href = `https://github.com/${REPO}/edit/${BRANCH}/_redirects`;
    return !msg;
  }

  // Kiểm tra link ngắn đã có trong _redirects chưa (chỉ chạy được khi trang mở trên chính tên miền đó).
  let checkTimer, checkSeq = 0;
  function checkLater(ms = 600) { clearTimeout(checkTimer); checkTimer = setTimeout(check, ms); }
  async function check() {
    const st = $('#qr-status');
    const s = slug();
    if (!s) { st.textContent = ''; return; }
    if (location.origin !== SITE_URL) { st.textContent = 'Kiểm tra được khi mở trang trên ' + SITE_URL.replace(/^https?:\/\//, ''); st.className = 'note'; return; }
    const seq = ++checkSeq;
    st.textContent = 'Đang kiểm tra…'; st.className = 'note';
    try {
      const r = await fetch(shortUrl(), { redirect: 'manual', cache: 'no-store' });
      if (seq !== checkSeq) return;
      if (r.type === 'opaqueredirect' || (r.status >= 300 && r.status < 400)) { st.textContent = '● Đang hoạt động'; st.className = 'ok'; }
      else { st.textContent = '○ Chưa có trong _redirects'; st.className = 'err'; }
    } catch {
      if (seq === checkSeq) { st.textContent = 'Không kiểm tra được'; st.className = 'note'; }
    }
    st.style.fontSize = '12.5px';
  }

  $('#qr-slug').addEventListener('input', () => checkLater());
  $('#qr-slug').addEventListener('blur', () => { $('#qr-slug').value = slug(); render(); });
  $('#qr-check').addEventListener('click', () => checkLater(0));
  $('#qr-copy-short').addEventListener('click', () => copy(shortUrl()));
  $('#qr-copy-line').addEventListener('click', () => copy($('#qr-line').textContent, 'Đã chép dòng _redirects'));

  const wifiEsc = (s) => s.replace(/([\\;,:"])/g, '\\$1');
  function payload() {
    if (mode === 'wifi') {
      const sec = $('#qr-sec').value;
      const pass = sec === 'nopass' ? '' : `P:${wifiEsc($('#qr-pass').value)};`;
      return `WIFI:T:${sec};S:${wifiEsc($('#qr-ssid').value)};${pass}${$('#qr-hidden').checked ? 'H:true;' : ''};`;
    }
    if (type === 'dynamic') return updateDynamic() ? shortUrl() : '';
    return $('#qr-text').value;
  }

  function render() {
    const text = payload();
    const size = +$('#qr-size').value;
    const margin = +$('#qr-margin').value;
    const fg = $('#qr-fg').value;
    const bg = $('#qr-bg').value;
    $('#qr-size-v').textContent = size;
    $('#qr-margin-v').textContent = margin;
    const err = $('#qr-err');
    err.hidden = true;

    if (!text) {
      if (!(mode === 'text' && type === 'dynamic')) { err.textContent = 'Nhập nội dung để tạo mã.'; err.hidden = false; }
      return;
    }
    let qr;
    try {
      qr = qrcode(0, $('#qr-ecc').value);
      qr.addData(text, 'Byte');
      qr.make();
    } catch {
      err.textContent = 'Nội dung quá dài cho một mã QR. Hãy rút gọn hoặc chọn mức chịu lỗi thấp hơn.';
      err.hidden = false;
      return;
    }
    const n = qr.getModuleCount();
    const total = n + margin * 2;
    const cell = size / total;
    const c = $('#qr-canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, size, size);
    g.fillStyle = fg;
    let path = '';
    for (let r = 0; r < n; r++)
      for (let col = 0; col < n; col++)
        if (qr.isDark(r, col)) {
          const x = Math.floor((col + margin) * cell), y = Math.floor((r + margin) * cell);
          g.fillRect(x, y, Math.ceil((col + margin + 1) * cell) - x, Math.ceil((r + margin + 1) * cell) - y);
          path += `M${col + margin} ${r + margin}h1v1h-1z`;
        }
    lastSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${size}" height="${size}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${bg}"/><path d="${path}" fill="${fg}"/></svg>`;
    $('#qr-info').textContent = `${n}×${n} ô · ${new TextEncoder().encode(text).length} byte`;
  }

  root.addEventListener('input', render);
  root.addEventListener('change', render);

  const fname = () => 'qr-' + (mode === 'wifi' ? 'wifi' : type === 'dynamic' ? slug() || 'dong' : 'code');
  $('#qr-png').addEventListener('click', () => $('#qr-canvas').toBlob((b) => download(b, fname() + '.png')));
  $('#qr-svg').addEventListener('click', () => download(lastSvg, fname() + '.svg', 'image/svg+xml'));
  $('#qr-copy').addEventListener('click', () => {
    $('#qr-canvas').toBlob(async (b) => {
      try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]); toast('Đã chép ảnh QR'); }
      catch { toast('Trình duyệt không cho chép ảnh, hãy dùng Tải PNG'); }
    });
  });

  render();
}
