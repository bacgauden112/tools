// Tạo mã QR. Thư viện qrcode-generator được tải từ CDN khi mở tool.
const LIB = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';

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
            <label class="field"><span>Nội dung</span>
              <textarea id="qr-text" class="textarea" style="min-height:110px;font-family:var(--font-ui);font-size:15px">https://github.com/bacgauden112/tools</textarea>
            </label>
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

  const wifiEsc = (s) => s.replace(/([\\;,:"])/g, '\\$1');
  function payload() {
    if (mode === 'wifi') {
      const sec = $('#qr-sec').value;
      const pass = sec === 'nopass' ? '' : `P:${wifiEsc($('#qr-pass').value)};`;
      return `WIFI:T:${sec};S:${wifiEsc($('#qr-ssid').value)};${pass}${$('#qr-hidden').checked ? 'H:true;' : ''};`;
    }
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

    if (!text) { err.textContent = 'Nhập nội dung để tạo mã.'; err.hidden = false; return; }
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

  const fname = () => 'qr-' + (mode === 'wifi' ? 'wifi' : 'code');
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
