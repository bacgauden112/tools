// Mã hoá / giải mã Base64 và URL (UTF-8, hỗ trợ tiếng Việt).
export default function mount(root, { copy }) {
  root.innerHTML = `
    <div class="stack">
      <div class="row" style="justify-content:space-between">
        <div class="seg" role="group" aria-label="Kiểu mã hoá">
          <button type="button" data-kind="b64" aria-pressed="true">Base64</button>
          <button type="button" data-kind="b64url" aria-pressed="false">Base64 URL-safe</button>
          <button type="button" data-kind="url" aria-pressed="false">URL</button>
        </div>
        <div class="seg" role="group" aria-label="Chiều">
          <button type="button" data-dir="enc" aria-pressed="true">Mã hoá</button>
          <button type="button" data-dir="dec" aria-pressed="false">Giải mã</button>
        </div>
      </div>
      <div class="grid2">
        <label class="field"><span id="en-in-l">Văn bản gốc</span>
          <textarea id="en-in" class="textarea" spellcheck="false">Xin chào, đây là Hộp Đồ Nghề!</textarea></label>
        <div class="field"><span class="row" style="justify-content:space-between"><span id="en-out-l">Kết quả</span>
          <span class="row" style="gap:6px"><button id="en-swap" class="ghost sm" type="button">Đổi chiều ⇄</button><button id="en-copy" class="ghost sm" type="button">Chép</button></span></span>
          <textarea id="en-out" class="textarea" readonly spellcheck="false"></textarea></div>
      </div>
      <p id="en-err" class="err" hidden></p>
    </div>`;

  const $ = (s) => root.querySelector(s);
  let kind = 'b64', dir = 'enc';

  const b64enc = (s) => { const bytes = new TextEncoder().encode(s); let bin = ''; bytes.forEach((b) => (bin += String.fromCharCode(b))); return btoa(bin); };
  const b64dec = (s) => {
    s = s.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)));
  };

  function run() {
    const v = $('#en-in').value;
    const err = $('#en-err');
    err.hidden = true;
    try {
      let out;
      if (kind === 'url') out = dir === 'enc' ? encodeURIComponent(v) : decodeURIComponent(v.replace(/\+/g, ' '));
      else if (dir === 'enc') { out = b64enc(v); if (kind === 'b64url') out = out.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
      else out = b64dec(v);
      $('#en-out').value = out;
    } catch {
      $('#en-out').value = '';
      err.textContent = kind === 'url' ? 'Chuỗi URL không hợp lệ (có thể sai ký tự %).' : 'Đây không phải Base64 hợp lệ, hoặc nội dung giải ra không phải văn bản UTF-8.';
      err.hidden = false;
    }
    $('#en-in-l').textContent = dir === 'enc' ? 'Văn bản gốc' : 'Chuỗi đã mã hoá';
    $('#en-out-l').textContent = dir === 'enc' ? 'Đã mã hoá' : 'Văn bản gốc';
  }

  function setSeg(attr, val) { root.querySelectorAll(`[data-${attr}]`).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset[attr] === val))); }
  root.querySelectorAll('[data-kind]').forEach((b) => b.addEventListener('click', () => { kind = b.dataset.kind; setSeg('kind', kind); run(); }));
  root.querySelectorAll('[data-dir]').forEach((b) => b.addEventListener('click', () => { dir = b.dataset.dir; setSeg('dir', dir); run(); }));
  $('#en-swap').addEventListener('click', () => { $('#en-in').value = $('#en-out').value; dir = dir === 'enc' ? 'dec' : 'enc'; setSeg('dir', dir); run(); });
  $('#en-copy').addEventListener('click', () => copy($('#en-out').value));
  $('#en-in').addEventListener('input', run);
  run();
}
