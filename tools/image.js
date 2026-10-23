// Nén & đổi cỡ ảnh bằng canvas của trình duyệt. Ảnh không rời khỏi máy.
export default function mount(root, { download, formatBytes, escapeHtml, toast }) {
  root.innerHTML = `
    <div class="stack">
      <div class="panel">
        <div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">
          <label class="field"><span>Định dạng xuất</span>
            <select id="im-fmt" class="select">
              <option value="image/webp" selected>WebP · nhỏ nhất, web dùng tốt</option>
              <option value="image/jpeg">JPEG · tương thích mọi nơi</option>
              <option value="image/png">PNG · giữ nền trong suốt</option>
              <option value="keep">Giữ định dạng gốc</option>
            </select></label>
          <label class="field"><span>Chất lượng: <b id="im-q-v" class="mono">80</b>%</span>
            <input id="im-q" type="range" min="30" max="100" value="80"></label>
          <label class="field"><span>Cạnh dài tối đa (px)</span>
            <select id="im-max" class="select">
              <option value="0">Giữ nguyên</option>
              <option value="3840">3840 · 4K</option>
              <option value="2560">2560</option>
              <option value="1920" selected>1920 · Full HD</option>
              <option value="1280">1280</option>
              <option value="800">800</option>
              <option value="400">400 · ảnh nhỏ</option>
            </select></label>
        </div>
        <p class="note" style="margin-top:10px">PNG là định dạng không nén mất dữ liệu nên thanh chất lượng không có tác dụng; muốn PNG nhỏ hơn hãy giảm kích thước.</p>
      </div>

      <label id="im-drop" class="panel" style="display:grid;place-items:center;gap:6px;padding:34px 18px;border-style:dashed;border-width:2px;cursor:pointer;text-align:center">
        <input id="im-file" type="file" accept="image/*" multiple hidden>
        <strong style="font-size:16px">Kéo ảnh vào đây, bấm để chọn, hoặc dán (Ctrl+V)</strong>
        <span class="note">JPG, PNG, WebP, GIF (khung đầu), AVIF… chọn nhiều ảnh cùng lúc được</span>
      </label>

      <div id="im-sum" class="row" hidden style="justify-content:space-between">
        <p id="im-total" class="mono" style="margin:0"></p>
        <div class="row">
          <button id="im-clear" class="ghost sm" type="button">Xoá danh sách</button>
          <button id="im-all" class="btn sm" type="button">Tải tất cả</button>
        </div>
      </div>
      <div id="im-list" class="stack" style="gap:8px"></div>
    </div>`;

  const $ = (s) => root.querySelector(s);
  const items = []; // { file, out, outName, w, h, ow, oh, keptOriginal }
  const extOf = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };

  async function process(file) {
    let bmp;
    try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch { bmp = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); }); }
    const ow = bmp.width, oh = bmp.height;
    const max = +$('#im-max').value;
    const scale = max && Math.max(ow, oh) > max ? max / Math.max(ow, oh) : 1;
    const w = Math.round(ow * scale), h = Math.round(oh * scale);

    let type = $('#im-fmt').value;
    if (type === 'keep') type = extOf[file.type] ? file.type : 'image/jpeg';

    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    if (type === 'image/jpeg') { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); }
    g.imageSmoothingQuality = 'high';
    g.drawImage(bmp, 0, 0, w, h);
    if (bmp.close) bmp.close();

    let out = await new Promise((res) => c.toBlob(res, type, +$('#im-q').value / 100));
    let keptOriginal = false;
    // Nếu nén xong còn nặng hơn ảnh gốc mà không đổi kích thước/định dạng, giữ ảnh gốc.
    if (out.size >= file.size && scale === 1 && type === file.type) { out = file; keptOriginal = true; }
    const base = file.name.replace(/\.[^.]+$/, '') || 'anh';
    return { file, out, outName: `${base}.${extOf[out.type] || 'jpg'}`, w, h, ow, oh, keptOriginal };
  }

  function rowHtml(it, i) {
    const saved = 1 - it.out.size / it.file.size;
    const pct = Math.round(saved * 100);
    const tone = pct > 0 ? 'ok' : pct < 0 ? 'err' : 'note';
    return `
      <div class="panel" style="display:grid;grid-template-columns:56px minmax(0,1fr) auto;gap:14px;align-items:center;padding:10px 14px">
        <img src="${it.thumb}" alt="" class="check" style="width:56px;height:56px;object-fit:contain;border-radius:6px">
        <div style="min-width:0">
          <div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(it.outName)}</div>
          <div class="mono note" style="font-size:12.5px">
            ${formatBytes(it.file.size)} → <b>${formatBytes(it.out.size)}</b>
            <span class="${tone}" style="margin-left:6px">${it.keptOriginal ? 'đã tối ưu sẵn, giữ ảnh gốc' : pct >= 0 ? '−' + pct + '%' : '+' + -pct + '%'}</span>
            · ${it.ow}×${it.oh}${it.w !== it.ow ? ' → ' + it.w + '×' + it.h : ''}
          </div>
        </div>
        <button class="ghost sm" type="button" data-dl="${i}">Tải</button>
      </div>`;
  }

  function renderList() {
    $('#im-list').innerHTML = items.map(rowHtml).join('');
    $('#im-sum').hidden = !items.length;
    const a = items.reduce((s, x) => s + x.file.size, 0), b = items.reduce((s, x) => s + x.out.size, 0);
    $('#im-total').innerHTML = `${items.length} ảnh · ${formatBytes(a)} → <b>${formatBytes(b)}</b>` + (a ? ` · tiết kiệm ${Math.max(0, Math.round((1 - b / a) * 100))}%` : '');
  }

  async function add(files) {
    const imgs = [...files].filter((f) => f.type.startsWith('image/'));
    if (!imgs.length) return toast('Không có file ảnh nào');
    $('#im-list').insertAdjacentHTML('afterbegin', `<p class="loading" id="im-busy">Đang xử lý ${imgs.length} ảnh…</p>`);
    for (const f of imgs) {
      try {
        const it = await process(f);
        it.thumb = URL.createObjectURL(it.out);
        items.push(it);
      } catch (e) { console.error(e); toast('Không đọc được ' + f.name); }
    }
    renderList();
  }

  async function reprocess() {
    if (!items.length) return;
    const files = items.map((x) => x.file);
    items.forEach((x) => URL.revokeObjectURL(x.thumb));
    items.length = 0;
    await add(files);
  }

  $('#im-file').addEventListener('change', (e) => { add(e.target.files); e.target.value = ''; });
  const drop = $('#im-drop');
  ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.style.borderColor = 'var(--accent)'; }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, () => (drop.style.borderColor = '')));
  drop.addEventListener('drop', (e) => { e.preventDefault(); add(e.dataTransfer.files); });
  const onPaste = (e) => { if (e.clipboardData?.files?.length) add(e.clipboardData.files); };
  document.addEventListener('paste', onPaste);

  $('#im-q').addEventListener('input', (e) => ($('#im-q-v').textContent = e.target.value));
  let t;
  ['#im-q', '#im-fmt', '#im-max'].forEach((s) => $(s).addEventListener('change', () => { clearTimeout(t); t = setTimeout(reprocess, 150); }));

  $('#im-list').addEventListener('click', (e) => {
    const i = e.target.dataset.dl;
    if (i != null) download(items[i].out, items[i].outName);
  });
  $('#im-all').addEventListener('click', async () => {
    for (const it of items) { download(it.out, it.outName); await new Promise((r) => setTimeout(r, 250)); }
  });
  $('#im-clear').addEventListener('click', () => { items.forEach((x) => URL.revokeObjectURL(x.thumb)); items.length = 0; renderList(); });

  return () => { document.removeEventListener('paste', onPaste); items.forEach((x) => URL.revokeObjectURL(x.thumb)); };
}
