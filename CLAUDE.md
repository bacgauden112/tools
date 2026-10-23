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
- QR động dùng `_redirects` (`/go/<slug>  <đích>  302`). Không xoá dòng cũ trong đó trừ khi người dùng yêu cầu.
