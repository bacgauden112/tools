// =====================================================================
//  MẪU TOOL MỚI
//  1. Copy file này thành tools/ten-tool.js
//  2. Thêm một mục vào tools/registry.js:
//       { id: 'ten-tool', name: 'Tên hiển thị', desc: 'Mô tả ngắn',
//         group: 'everyday', icon: 'tool', keywords: [],
//         load: () => import('./ten-tool.js') },
//  3. Mở trang tại  #ten-tool  là thấy.
//
//  Hàm mount nhận:
//    root  – thẻ div để bạn vẽ giao diện vào
//    ctx   – các tiện ích dùng chung:
//            copy(text), download(data, filename, mime), toast(msg),
//            formatBytes(n), escapeHtml(s), loadScript(url), icon(name)
//  Trả về một hàm dọn dẹp (tuỳ chọn) nếu tool có setInterval, listener toàn trang…
//
//  Class CSS có sẵn: panel, stack, row, grid2, split, field, input, select,
//  textarea, btn, ghost, sm, seg, note, err, ok, mono, check.
// =====================================================================

export default function mount(root, { copy }) {
  root.innerHTML = `
    <div class="panel stack">
      <label class="field"><span>Nhập gì đó</span>
        <input id="tpl-in" class="input" value="Xin chào"></label>
      <p>Kết quả: <b id="tpl-out" class="mono"></b></p>
      <button id="tpl-copy" class="btn" type="button">Chép kết quả</button>
    </div>`;

  const $ = (s) => root.querySelector(s);
  const run = () => ($('#tpl-out').textContent = $('#tpl-in').value.toUpperCase());
  $('#tpl-in').addEventListener('input', run);
  $('#tpl-copy').addEventListener('click', () => copy($('#tpl-out').textContent));
  run();

  // return () => { /* dọn dẹp nếu cần */ };
}
