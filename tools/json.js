// Làm đẹp / rút gọn / kiểm tra JSON.
const SAMPLE = '{"ten":"Hộp Đồ Nghề","phien_ban":1,"cong_cu":["qr","nen-anh","json"],"chay_offline":true,"tac_gia":{"github":"bacgauden112"}}';

export default function mount(root, { copy, download }) {
  root.innerHTML = `
    <div class="stack">
      <div class="row" style="justify-content:space-between">
        <div class="row">
          <button id="js-pretty" class="btn" type="button">Làm đẹp</button>
          <button id="js-min" class="ghost" type="button">Rút gọn</button>
          <div class="seg" role="group" aria-label="Thụt lề">
            <button type="button" data-ind="2" aria-pressed="true">2 dấu cách</button>
            <button type="button" data-ind="4" aria-pressed="false">4</button>
            <button type="button" data-ind="tab" aria-pressed="false">Tab</button>
          </div>
          <label class="row" style="gap:6px"><input id="js-sort" type="checkbox"> Sắp xếp key</label>
        </div>
        <div class="row">
          <button id="js-copy" class="ghost sm" type="button">Chép</button>
          <button id="js-dl" class="ghost sm" type="button">Tải .json</button>
        </div>
      </div>
      <p id="js-status" class="note mono" style="margin:0"></p>
      <textarea id="js-text" class="textarea" spellcheck="false" style="min-height:420px"></textarea>
    </div>`;

  const $ = (s) => root.querySelector(s);
  const ta = $('#js-text');
  let indent = 2;
  ta.value = SAMPLE;

  const sortKeys = (v) => Array.isArray(v) ? v.map(sortKeys)
    : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v;

  function parse() {
    const status = $('#js-status');
    try {
      let v = JSON.parse(ta.value);
      if ($('#js-sort').checked) v = sortKeys(v);
      status.className = 'note mono ok';
      status.textContent = 'JSON hợp lệ · ' + new Blob([ta.value]).size + ' byte';
      return { ok: true, v };
    } catch (e) {
      const m = /position (\d+)/.exec(e.message);
      let where = '';
      if (m) {
        const before = ta.value.slice(0, +m[1]).split('\n');
        where = ` (dòng ${before.length}, cột ${before.at(-1).length + 1})`;
        ta.focus(); ta.setSelectionRange(+m[1], +m[1] + 1);
      }
      status.className = 'err mono';
      status.textContent = 'Lỗi' + where + ': ' + e.message;
      return { ok: false };
    }
  }

  $('#js-pretty').addEventListener('click', () => { const r = parse(); if (r.ok) ta.value = JSON.stringify(r.v, null, indent === 'tab' ? '\t' : indent); });
  $('#js-min').addEventListener('click', () => { const r = parse(); if (r.ok) ta.value = JSON.stringify(r.v); });
  root.querySelectorAll('[data-ind]').forEach((b) => b.addEventListener('click', () => {
    indent = b.dataset.ind === 'tab' ? 'tab' : +b.dataset.ind;
    root.querySelectorAll('[data-ind]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $('#js-pretty').click();
  }));
  $('#js-copy').addEventListener('click', () => copy(ta.value));
  $('#js-dl').addEventListener('click', () => download(ta.value, 'data.json', 'application/json'));
  let t;
  ta.addEventListener('input', () => { clearTimeout(t); t = setTimeout(parse, 300); });

  $('#js-pretty').click();
}
