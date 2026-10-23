// Cloudflare Worker cho Hộp Đồ Nghề.
// - File tĩnh (index.html, tools/…, _redirects) do Cloudflare phục vụ trước; chỉ request
//   không khớp file nào mới tới đây.
// - /go/<tên>        : chuyển hướng theo link lưu trong KV (QR động).
// - /api/links[/…]   : thêm / sửa / xoá link động, cần mật khẩu ADMIN_PASSWORD.
//
// Binding: LINKS (KV namespace). Secret: ADMIN_PASSWORD.

const PREFIX = 'l:';
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const MAX_URL = 800; // giữ gọn trong metadata của KV (giới hạn 1024 byte)
const MAX_NOTE = 120;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith('/go/')) return go(path.slice(4), env);
    if (path === '/api/links' || path.startsWith('/api/links/')) return api(request, env, path.slice('/api/links'.length));
    if (path === '/api/ping') return ping(request, env);

    return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not found', { status: 404 });
  },
};

/* ---------------- Chuyển hướng ---------------- */
async function go(rawSlug, env) {
  const slug = decodeURIComponent(rawSlug).replace(/\/+$/, '').toLowerCase();
  const target = SLUG_RE.test(slug) && env.LINKS ? await env.LINKS.get(PREFIX + slug) : null;
  if (target) {
    return new Response(null, {
      status: 302,
      headers: { Location: target, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
    });
  }
  return new Response(notFoundPage(slug), {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/* ---------------- API quản lý ---------------- */
async function ping(request, env) {
  const denied = await checkAuth(request, env);
  return denied || json({ ok: true });
}

async function api(request, env, rest) {
  const denied = await checkAuth(request, env);
  if (denied) return denied;
  if (!env.LINKS) return json({ error: 'Chưa gắn kho KV (binding LINKS) cho Worker.' }, 500);

  const method = request.method;
  const slug = rest.replace(/^\//, '').toLowerCase();

  // Danh sách
  if (!slug) {
    if (method !== 'GET') return json({ error: 'Phương thức không hỗ trợ' }, 405);
    const links = [];
    let cursor;
    do {
      const page = await env.LINKS.list({ prefix: PREFIX, cursor });
      for (const k of page.keys) links.push({ slug: k.name.slice(PREFIX.length), ...(k.metadata || {}) });
      cursor = page.list_complete ? null : page.cursor;
    } while (cursor);
    links.sort((a, b) => (b.updated || 0) - (a.updated || 0));
    return json({ links });
  }

  if (!SLUG_RE.test(slug)) return json({ error: 'Tên ngắn chỉ gồm chữ thường không dấu, số và dấu gạch ngang (tối đa 64 ký tự).' }, 400);
  const key = PREFIX + slug;

  if (method === 'GET') {
    const r = await env.LINKS.getWithMetadata(key);
    if (r.value == null) return json({ error: 'Chưa có link này' }, 404);
    return json({ slug, ...(r.metadata || {}), url: r.value });
  }

  if (method === 'PUT') {
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Dữ liệu gửi lên không phải JSON' }, 400); }
    const target = String(body.url || '').trim();
    const note = String(body.note || '').trim().slice(0, MAX_NOTE);
    let parsed;
    try { parsed = new URL(target); } catch {}
    if (!parsed || !/^https?:$/.test(parsed.protocol)) return json({ error: 'Link đích phải bắt đầu bằng http:// hoặc https://' }, 400);
    if (target.length > MAX_URL) return json({ error: `Link đích dài quá ${MAX_URL} ký tự` }, 400);

    const old = await env.LINKS.getWithMetadata(key);
    if (body.createOnly && old.value != null) return json({ error: `Tên ngắn “${slug}” đã được dùng`, exists: true }, 409);
    const now = Date.now();
    const created = old.metadata?.created || now;
    const metadata = { url: target, note, created, updated: now };
    await env.LINKS.put(key, target, { metadata });
    return json({ slug, ...metadata, isNew: old.value == null });
  }

  if (method === 'DELETE') {
    await env.LINKS.delete(key);
    return json({ ok: true });
  }

  return json({ error: 'Phương thức không hỗ trợ' }, 405);
}

/* ---------------- Xác thực ---------------- */
async function checkAuth(request, env) {
  if (!env.ADMIN_PASSWORD) return json({ error: 'Chưa đặt mật khẩu ADMIN_PASSWORD cho Worker.' }, 503);
  const header = request.headers.get('Authorization') || '';
  const given = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (given && (await safeEqual(given, env.ADMIN_PASSWORD))) return null;
  await new Promise((r) => setTimeout(r, 700)); // làm chậm việc dò mật khẩu
  return json({ error: 'Sai mật khẩu' }, 401);
}

async function safeEqual(a, b) {
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
  const ax = new Uint8Array(x), ay = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < ax.length; i++) diff |= ax[i] ^ ay[i];
  return diff === 0;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function notFoundPage(slug) {
  const s = String(slug).replace(/[&<>"']/g, '');
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Link không tồn tại</title>
<style>
:root{--bg:#f3f5f8;--fg:#15202d;--muted:#5b6878;--accent:#1f4fd1}
@media (prefers-color-scheme:dark){:root{--bg:#0f141b;--fg:#e6ebf2;--muted:#93a0b2;--accent:#7c9cff}}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--fg);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:24px;box-sizing:border-box}
main{max-width:440px;text-align:center}h1{font-size:24px;margin:0 0 8px}p{color:var(--muted);margin:0 0 16px}code{font-family:ui-monospace,Menlo,Consolas,monospace}a{color:var(--accent)}
</style></head><body><main><h1>Link này chưa được gắn đích</h1>
<p>Mã QR bạn vừa quét trỏ tới <code>/go/${s}</code>, nhưng link đó chưa có hoặc đã bị gỡ.</p>
<p>Nếu đây là mã của bạn, hãy vào <a href="/#link-dong">Quản lý link động</a> để gắn lại.</p></main></body></html>`;
}
