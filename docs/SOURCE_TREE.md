# Source Tree

Bản đồ này giúp biết nên sửa file nào mà không phải mò toàn bộ repo. Project hiện là static no-build app: `index.html` load trực tiếp CSS/JS, Cloudflare Pages Functions xử lý API, Supabase là database live khi env được cấu hình.

```text
SHOPPROGRAM/
├── index.html
├── _headers
├── .assetsignore
├── .vercelignore
├── wrangler.toml
├── vercel.json
├── src/
│   ├── app.js
│   ├── styles.css
│   └── sync.js
├── functions/
│   └── api/
│       ├── _lib.js
│       ├── _middleware.js
│       ├── _supabase_db.js
│       ├── health.js
│       ├── products/
│       ├── categories/
│       ├── addons/
│       ├── components/
│       ├── production-recipes/
│       ├── production-batches/
│       ├── inventory/
│       ├── purchases/
│       ├── issues/
│       ├── sales/
│       ├── suppliers/
│       ├── reports/
│       ├── settings/
│       └── sync/
├── database/
│   ├── cloudflare/
│   │   └── migrations/
│   ├── supabase/
│   │   ├── schema.sql
│   │   ├── rls_policies.sql
│   │   ├── seed.sql
│   │   └── seed.json
│   └── data/
├── scripts/
├── docs/
│   ├── SOURCE_TREE.md
│   ├── CODE_MAP.md
│   ├── deploy/
│   ├── plans/
│   └── assets/
├── logo.png
└── logo-thermal.png
```

## Sửa Theo Nhu Cầu

| Muốn sửa | File chính |
|---|---|
| POS, dashboard, kho, setting, hóa đơn, barcode label | `src/app.js` |
| Màu sắc, spacing, responsive, print CSS | `src/styles.css` |
| Offline outbox, API helper, sync trạng thái | `src/sync.js` |
| API dùng Supabase | `functions/api/*`, nhất là `_supabase_db.js` |
| Schema/seed Supabase | `database/supabase/*` |
| D1 legacy/local | `database/cloudflare/migrations/*` |
| Script import/export/migrate/check | `scripts/*` |
| Hướng dẫn deploy | `docs/deploy/*` |
| Bản đồ file lớn | `docs/CODE_MAP.md` |

## Khu Vực Frontend

`src/app.js` hiện chứa phần lớn logic UI. Vì app đang no-build static, chưa nên tách thành import/export module nếu không đổi cách deploy. Khi cần refactor lớn, ưu tiên tách theo nhánh riêng và verify kỹ trên Cloudflare Pages.

`src/styles.css` chứa cả layout responsive và print style. Các lỗi như panel tràn desktop/mobile, tem barcode, hóa đơn in ra lệch thường nằm ở đây hoặc markup in trong `src/app.js`.

`src/sync.js` là lớp nối UI với API. Các thay đổi liên quan “lưu thành công”, “đang chờ đồng bộ”, “retry”, “outbox”, “online/offline” nên kiểm tra file này cùng API.

## Khu Vực API

| Nhóm | Chức năng |
|---|---|
| `_middleware.js` | Route middleware, shared response handling |
| `_lib.js` | Helper chung cho API |
| `_supabase_db.js` | Adapter đọc/ghi Supabase |
| `products/` | Product CRUD, rename, retail/recipe metadata |
| `categories/` | Category CRUD |
| `addons/` | Add-ons CRUD |
| `components/` | Thành phần/nguyên liệu |
| `production-recipes/` | Công thức sản phẩm pha chế |
| `production-batches/` | Batch sơ chế/thành phẩm |
| `inventory/` | Tồn kho, kiểm kê, chuyển thành phần, movement ledger |
| `purchases/` | Phiếu nhập |
| `issues/` | Phiếu xuất |
| `sales/` | Lưu/lấy hóa đơn, order items, payment method |
| `reports/` | Dashboard summary, low stock |
| `settings/` | Store settings, invoice/template settings |
| `sync/` | Pull/push sync |

## Khu Vực Database

`database/supabase/` là nguồn schema chính cho database live hoặc migrate sang Vercel/Supabase.

`database/cloudflare/migrations/` là D1 legacy/local. Giữ lại để tham khảo, không xem là source database live nếu Cloudflare env Supabase đã được bật.

`database/data/` là dữ liệu nguồn/import/export local. Không nên deploy public các file dump này.

## Deploy Và Ignore

`_headers` được Cloudflare Pages đọc trực tiếp ở root.

`.assetsignore` loại bỏ docs/scripts/database/env khỏi asset upload Cloudflare.

`.vercelignore` loại bỏ tooling/private docs khỏi deploy Vercel static.

`.gitignore` giữ credential local như `.env`, `.env.local`, `.env.vercel.local`, `.env.supabase-upload.local`, `.dev.vars`, `.wrangler/` ngoài Git.

## Ghi Chú An Toàn

- Không commit token Supabase, service role key, database password.
- Không đổi tên `index.html`, `_headers`, `functions/api`, `src/app.js`, `src/styles.css`, `src/sync.js` nếu chưa đổi cấu hình deploy.
- Với lỗi lưu đơn/doanh thu, kiểm tra cùng lúc `src/app.js`, `src/sync.js`, `functions/api/sales/index.js`, `functions/api/reports/summary.js`.
- Với lỗi tồn kho/thành phần, kiểm tra `src/app.js`, `functions/api/inventory/*`, `functions/api/components/index.js`, `functions/api/production-*`.
- Với lỗi in tem/hóa đơn, kiểm tra markup in trong `src/app.js` và `@media print` trong `src/styles.css`.
