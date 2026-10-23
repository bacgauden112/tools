# Hộp Đồ Nghề

Trang công cụ cá nhân chạy hoàn toàn trong trình duyệt. Không có backend, không có bước build: chỉ là HTML, CSS và JavaScript thuần, deploy lên Cloudflare Pages.

## Công cụ hiện có

| Tool | File | Đường dẫn |
|---|---|---|
| Tạo mã QR (link, văn bản, Wi-Fi) | `tools/qr.js` | `#qr` |
| Nén & đổi cỡ ảnh | `tools/image.js` | `#nen-anh` |
| Định dạng JSON | `tools/json.js` | `#json` |
| Base64 & URL | `tools/encode.js` | `#ma-hoa` |
| Mật khẩu & UUID | `tools/password.js` | `#mat-khau` |
| Đổi Unix timestamp | `tools/timestamp.js` | `#thoi-gian` |

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

## Deploy lên Cloudflare Pages

1. Vào Cloudflare Dashboard → **Workers & Pages** → **Create** → tab **Pages** → **Connect to Git**.
2. Chọn repo `bacgauden112/tools`.
3. Cấu hình build:
   - Framework preset: **None**
   - Build command: *(để trống)*
   - Build output directory: `/`
4. Bấm **Save and Deploy**. Trang sẽ có địa chỉ dạng `tools-xxx.pages.dev`.
5. (Tuỳ chọn) Tab **Custom domains** để gắn tên miền riêng.

Mỗi lần push lên nhánh `main`, Cloudflare tự build lại. Push lên nhánh khác sẽ tạo một link preview riêng để thử trước.

## Cấu trúc

```
index.html          khung trang
assets/app.js       điều hướng, menu, tiện ích dùng chung (copy, download, toast…)
assets/app.css      giao diện, sáng/tối
assets/icons.js     bộ icon
tools/registry.js   DANH MỤC CÔNG CỤ, sửa ở đây khi thêm tool
tools/*.js          mỗi file là một công cụ
_headers            header bảo mật & cache cho Cloudflare Pages
```
