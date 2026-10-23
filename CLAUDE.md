# Hộp Đồ Nghề – ghi chú cho coding agent

Trang công cụ cá nhân, HTML/CSS/JS thuần, không build, deploy Cloudflare từ nhánh `main`.

Khi người dùng muốn thêm tool mới:
- Tạo `tools/<id>.js` theo mẫu `tools/_template.js` (export default `mount(root, ctx)`).
- Đăng ký trong `tools/registry.js` (id, name, desc, group, icon, keywords, load).
- Nếu cần icon mới, thêm path vào `assets/icons.js`.
- Giao diện tiếng Việt, dùng class/token CSS sẵn có trong `assets/app.css`, không thêm framework.
- Mọi xử lý chạy trong trình duyệt; không gửi dữ liệu người dùng ra ngoài.
- Thư viện ngoài: `ctx.loadScript()` từ jsDelivr, ghim đúng phiên bản.
- Cập nhật bảng công cụ trong README.md.
- Site chạy tại https://tools.anhdq1102.workers.dev (Cloudflare, nối Git). Tên miền nằm trong `assets/config.js`.
- QR động: đích lưu trong KV (binding `LINKS`), API ở `worker/index.js` (`/go/<slug>`, `/api/links`, mật khẩu secret `ADMIN_PASSWORD`). `_redirects` là cách cũ, vẫn được ưu tiên trước KV; không xoá dòng trong đó trừ khi người dùng yêu cầu.
- Không thể chạy wrangler ở đây; test Worker bằng cách import `worker/index.js` trong Node với KV giả.
