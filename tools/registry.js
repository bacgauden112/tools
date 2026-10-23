// ===================================================================
//  DANH MỤC CÔNG CỤ
//  Thêm tool mới = tạo file trong thư mục tools/ (copy _template.js)
//  rồi thêm 1 mục vào mảng `tools` bên dưới. Không cần sửa gì khác.
// ===================================================================

export const groups = [
  { id: 'media', name: 'Ảnh & QR' },
  { id: 'dev', name: 'Lập trình' },
  { id: 'everyday', name: 'Tiện ích' },
];

export const tools = [
  {
    id: 'qr',
    name: 'Tạo mã QR',
    desc: 'Tạo QR tĩnh hoặc động (đổi link sau khi đã in) cho link, văn bản, Wi-Fi. Tải PNG hoặc SVG.',
    group: 'media',
    icon: 'qr',
    keywords: ['qr code', 'wifi', 'ma qr', 'qr dong', 'dynamic', 'link ngan'],
    load: () => import('./qr.js'),
  },
  {
    id: 'nen-anh',
    name: 'Nén & đổi cỡ ảnh',
    desc: 'Giảm dung lượng ảnh, đổi sang WebP/JPEG/PNG, thu nhỏ kích thước. Xử lý nhiều ảnh cùng lúc.',
    group: 'media',
    icon: 'image',
    keywords: ['compress', 'resize', 'webp', 'jpg', 'tinypng'],
    load: () => import('./image.js'),
  },
  {
    id: 'json',
    name: 'Định dạng JSON',
    desc: 'Làm đẹp, rút gọn và kiểm tra lỗi JSON, chỉ ra đúng dòng và cột bị sai.',
    group: 'dev',
    icon: 'braces',
    keywords: ['format', 'prettify', 'minify', 'validate'],
    load: () => import('./json.js'),
  },
  {
    id: 'ma-hoa',
    name: 'Base64 & URL',
    desc: 'Mã hoá và giải mã Base64 hoặc URL, hỗ trợ đầy đủ tiếng Việt có dấu.',
    group: 'dev',
    icon: 'swap',
    keywords: ['encode', 'decode', 'base64', 'urlencode'],
    load: () => import('./encode.js'),
  },
  {
    id: 'mat-khau',
    name: 'Mật khẩu & UUID',
    desc: 'Sinh mật khẩu ngẫu nhiên an toàn và UUID v4, nhiều cái một lúc.',
    group: 'everyday',
    icon: 'key',
    keywords: ['password', 'uuid', 'random', 'guid'],
    load: () => import('./password.js'),
  },
  {
    id: 'thoi-gian',
    name: 'Đổi Unix timestamp',
    desc: 'Chuyển qua lại giữa timestamp (giây hoặc mili giây) và ngày giờ.',
    group: 'dev',
    icon: 'clock',
    keywords: ['epoch', 'date', 'timestamp', 'ngay gio'],
    load: () => import('./timestamp.js'),
  },
];
