# Hộp Đồ Nghề

Trang công cụ cá nhân chạy hoàn toàn trong trình duyệt. Không có backend, không có bước build: chỉ là HTML, CSS và JavaScript thuần, deploy lên Cloudflare Pages.

## Công cụ hiện có

| Tool | File | Đường dẫn |
|---|---|---|
| Tạo mã QR tĩnh/động (link, văn bản, Wi-Fi) | `tools/qr.js` | `#qr` |
| Nén & đổi cỡ ảnh | `tools/image.js` | `#nen-anh` |
| Định dạng JSON | `tools/json.js` | `#json` |
| Base64 & URL | `tools/encode.js` | `#ma-hoa` |
| Mật khẩu & UUID | `tools/password.js` | `#mat-khau` |
| Đổi Unix timestamp | `tools/timestamp.js` | `#thoi-gian` |

## QR động

QR động chứa link ngắn `https://tools.anhdq1102.workers.dev/go/<tên-ngắn>`. Link này chuyển hướng theo file `_redirects`, nên đổi đích không cần in lại mã.

1. Trong tool QR chọn **Link / văn bản → Động**, đặt tên ngắn và link đích.
2. Bấm **Mở _redirects trên GitHub**, dán dòng tool gợi ý (ví dụ `/go/menu  https://...  302`), rồi Commit.
3. Khoảng 1 phút sau, trạng thái chuyển thành **Đang hoạt động**. Tải ảnh QR về dùng.
4. Muốn đổi đích: sửa link ở dòng đó trong `_redirects`, rồi commit.

Không xoá dòng của mã đã in. QR Wi-Fi luôn là QR tĩnh.
Đổi tên miền: sửa `SITE_URL` trong `assets/config.js`. Nhớ giữ tên miền cũ chạy song song nếu đã in mã với tên miền đó.

## Thêm một tool mới

1. Copy `tools/_template.js` thành `tools/ten-tool.js` và viết giao diện + logic trong hàm `mount`.
2. Thêm một mục vào mảng `tools` trong `tools/registry.js`:

   ```js
   {
     id: 'ten-tool',              // dùng làm đường dẫn: /#ten-tool
     name: 'Tên hiển thị',
     desc: 'Một câu mô tả ngắn',
     group: 'everyday',           // media | dev | everyday (hoặc thêm nhóm mới trong `groups`)
     icon: 'tool',                // tên icon trong assets/icons.js
     keywords: ['tu khoa', 'tim kiem'],
     load: () => import('./ten-tool.js'),
   },
   ```

3. Commit và push. Cloudflare Pages tự deploy lại sau khoảng 1 phút.

Cần thư viện ngoài? Gọi `await ctx.loadScript('https://cdn.jsdelivr.net/npm/ten-thu-vien@x.y.z/file.js')` bên trong tool. Thư viện chỉ được tải khi mở tool đó, nên trang chủ vẫn nhẹ.

## Chạy thử trên máy

Vì dùng ES modules nên cần một web server tĩnh (mở trực tiếp file `index.html` sẽ không chạy):

```bash
npx serve .
# hoặc
python3 -m http.server 8000
```

## Deploy

Trang đang chạy tại **https://tools.anhdq1102.workers.dev**, Cloudflare kết nối thẳng với repo này. Mỗi lần push lên `main`, Cloudflare tự deploy lại. Các file `_headers` và `_redirects` được Cloudflare đọc trực tiếp.

## Cấu trúc

```
index.html          khung trang
assets/app.js       điều hướng, menu, tiện ích dùng chung (copy, download, toast…)
assets/app.css      giao diện, sáng/tối
assets/icons.js     bộ icon
tools/registry.js   DANH MỤC CÔNG CỤ, sửa ở đây khi thêm tool
tools/*.js          mỗi file là một công cụ
assets/config.js    tên miền, repo (dùng cho QR động)
_headers            header bảo mật & cache
_redirects          link ngắn cho QR động (/go/...)
```
