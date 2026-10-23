// Sinh mật khẩu và UUID bằng crypto.getRandomValues (ngẫu nhiên an toàn).
const SETS = {
  lower: 'abcdefghijkmnopqrstuvwxyz',
  upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  digits: '23456789',
  symbols: '!@#$%^&*-_=+?',
};
const AMBIG = { lower: 'l', upper: 'IO', digits: '01' };

export default function mount(root, { copy }) {
  root.innerHTML = `
    <div class="split">
      <div class="panel stack">
        <div class="seg" role="group" aria-label="Loại">
          <button type="button" data-kind="pw" aria-pressed="true">Mật khẩu</button>
          <button type="button" data-kind="uuid" aria-pressed="false">UUID v4</button>
        </div>
        <div id="pw-opts" class="stack">
          <label class="field"><span>Độ dài: <b id="pw-len-v" class="mono">20</b> ký tự</span>
            <input id="pw-len" type="range" min="6" max="64" value="20"></label>
          <div class="grid2" style="gap:8px">
            <label class="row" style="gap:8px"><input type="checkbox" data-set="lower" checked> Chữ thường</label>
            <label class="row" style="gap:8px"><input type="checkbox" data-set="upper" checked> Chữ hoa</label>
            <label class="row" style="gap:8px"><input type="checkbox" data-set="digits" checked> Số</label>
            <label class="row" style="gap:8px"><input type="checkbox" data-set="symbols" checked> Ký tự đặc biệt</label>
          </div>
          <label class="row" style="gap:8px"><input id="pw-ambig" type="checkbox" checked> Bỏ ký tự dễ nhầm (l, I, O, 0, 1)</label>
        </div>
        <label class="field"><span>Số lượng</span>
          <select id="pw-count" class="select"><option>1</option><option selected>5</option><option>10</option><option>25</option></select></label>
        <button id="pw-gen" class="btn" type="button">Tạo mới</button>
      </div>
      <div class="panel stack">
        <div class="row" style="justify-content:space-between"><span class="label">Kết quả</span><button id="pw-all" class="ghost sm" type="button">Chép tất cả</button></div>
        <div id="pw-out" class="stack" style="gap:6px"></div>
        <p id="pw-strength" class="note"></p>
      </div>
    </div>`;

  const $ = (s) => root.querySelector(s);
  let kind = 'pw';
  let results = [];

  const rand = (n) => { const a = new Uint32Array(1); const lim = Math.floor(2 ** 32 / n) * n; do crypto.getRandomValues(a); while (a[0] >= lim); return a[0] % n; };

  function password() {
    const len = +$('#pw-len').value;
    const allowAmbig = !$('#pw-ambig').checked;
    const sets = [...root.querySelectorAll('[data-set]:checked')].map((c) => SETS[c.dataset.set] + (allowAmbig ? AMBIG[c.dataset.set] || '' : ''));
    if (!sets.length) return null;
    const chars = [...sets.map((s) => s[rand(s.length)])]; // ít nhất 1 ký tự mỗi nhóm
    const all = sets.join('');
    while (chars.length < len) chars.push(all[rand(all.length)]);
    for (let i = chars.length - 1; i > 0; i--) { const j = rand(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
    return { pw: chars.slice(0, len).join(''), bits: Math.round(len * Math.log2(all.length)) };
  }

  function gen() {
    const n = +$('#pw-count').value;
    $('#pw-opts').hidden = kind !== 'pw';
    results = [];
    let bits = 0;
    for (let i = 0; i < n; i++) {
      if (kind === 'uuid') results.push(crypto.randomUUID());
      else { const r = password(); if (!r) break; results.push(r.pw); bits = r.bits; }
    }
    $('#pw-out').innerHTML = results.length
      ? results.map((r, i) => `<button type="button" class="ghost mono" data-i="${i}" title="Bấm để chép" style="justify-content:flex-start;height:auto;min-height:36px;padding:7px 12px;white-space:normal;word-break:break-all;text-align:left;font-weight:400">${r.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</button>`).join('')
      : '<p class="err">Chọn ít nhất một nhóm ký tự.</p>';
    const label = bits >= 100 ? ['Rất mạnh', 'ok'] : bits >= 70 ? ['Mạnh', 'ok'] : bits >= 50 ? ['Tạm được', ''] : ['Yếu', 'err'];
    $('#pw-strength').innerHTML = kind === 'pw' && results.length ? `Độ mạnh: <b class="${label[1]}">${label[0]}</b> · khoảng ${bits} bit ngẫu nhiên. Bấm vào một dòng để chép.` : kind === 'uuid' ? 'Bấm vào một dòng để chép.' : '';
  }

  root.querySelectorAll('[data-kind]').forEach((b) => b.addEventListener('click', () => {
    kind = b.dataset.kind;
    root.querySelectorAll('[data-kind]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    gen();
  }));
  $('#pw-len').addEventListener('input', (e) => { $('#pw-len-v').textContent = e.target.value; gen(); });
  root.querySelectorAll('[data-set], #pw-ambig, #pw-count').forEach((el) => el.addEventListener('change', gen));
  $('#pw-gen').addEventListener('click', gen);
  $('#pw-out').addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) copy(results[b.dataset.i]); });
  $('#pw-all').addEventListener('click', () => copy(results.join('\n')));
  gen();
}
