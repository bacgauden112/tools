// Đổi Unix timestamp <-> ngày giờ.
export default function mount(root, { copy }) {
  root.innerHTML = `
    <div class="stack">
      <div class="panel row" style="justify-content:space-between">
        <div><div class="label">Bây giờ (giây)</div><div id="ts-now" class="mono" style="font-size:24px;font-weight:600"></div></div>
        <button id="ts-copy-now" class="ghost sm" type="button">Chép</button>
      </div>
      <div class="grid2">
        <div class="panel stack">
          <label class="field"><span>Timestamp → ngày giờ</span>
            <input id="ts-in" class="input mono" inputmode="numeric" placeholder="1761184800"></label>
          <p class="note">Tự nhận biết giây (10 chữ số) hoặc mili giây (13 chữ số).</p>
          <dl id="ts-out" class="mono" style="margin:0;display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px 14px;font-size:13.5px"></dl>
        </div>
        <div class="panel stack">
          <label class="field"><span>Ngày giờ → timestamp (giờ máy bạn)</span>
            <input id="ts-date" class="input" type="datetime-local" step="1"></label>
          <dl id="ts-out2" class="mono" style="margin:0;display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px 14px;font-size:13.5px"></dl>
        </div>
      </div>
    </div>`;

  const $ = (s) => root.querySelector(s);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const fmt = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full', timeStyle: 'medium' });
  const dl = (rows) => rows.map(([k, v]) => `<dt class="note">${k}</dt><dd style="margin:0;word-break:break-all">${v}</dd>`).join('');

  function rel(ms) {
    const s = Math.round((ms - Date.now()) / 1000);
    const units = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]];
    const [u, n] = units.find(([, n]) => Math.abs(s) >= n) || units.at(-1);
    return new Intl.RelativeTimeFormat('vi', { numeric: 'auto' }).format(Math.round(s / n), u);
  }

  function fromTs() {
    const raw = $('#ts-in').value.trim();
    if (!raw) return ($('#ts-out').innerHTML = '');
    if (!/^-?\d+(\.\d+)?$/.test(raw)) return ($('#ts-out').innerHTML = '<dt class="err">Lỗi</dt><dd class="err" style="margin:0">Chỉ nhập số.</dd>');
    const n = +raw;
    const ms = Math.abs(n) >= 1e11 ? n : n * 1000;
    const d = new Date(ms);
    $('#ts-out').innerHTML = dl([
      ['Đơn vị', Math.abs(n) >= 1e11 ? 'mili giây' : 'giây'],
      ['Giờ máy', `${fmt.format(d)}<br><span class="note">${tz}</span>`],
      ['UTC', d.toISOString()],
      ['Cách đây', rel(ms)],
    ]);
  }

  function fromDate() {
    const v = $('#ts-date').value;
    if (!v) return ($('#ts-out2').innerHTML = '');
    const d = new Date(v);
    $('#ts-out2').innerHTML = dl([
      ['Giây', `<button class="ghost sm mono" type="button" data-c="${Math.floor(d / 1000)}">${Math.floor(d / 1000)}</button>`],
      ['Mili giây', `<button class="ghost sm mono" type="button" data-c="${+d}">${+d}</button>`],
      ['UTC', d.toISOString()],
    ]);
  }

  const tick = () => ($('#ts-now').textContent = Math.floor(Date.now() / 1000));
  tick();
  const timer = setInterval(tick, 1000);

  const now = new Date();
  $('#ts-in').value = Math.floor(now / 1000);
  const local = new Date(now - now.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
  $('#ts-date').value = local;
  $('#ts-in').addEventListener('input', fromTs);
  $('#ts-date').addEventListener('input', fromDate);
  $('#ts-copy-now').addEventListener('click', () => copy($('#ts-now').textContent));
  root.addEventListener('click', (e) => { if (e.target.dataset.c) copy(e.target.dataset.c); });
  fromTs(); fromDate();

  return () => clearInterval(timer);
}
