# ShopFlow POS / OriaFarm

Ứng dụng POS song ngữ Việt/Anh cho cửa hàng nước ép, smoothie, trái cây cắt sẵn và hàng bán lẻ. App hiện chạy kiểu static no-build trên Cloudflare Pages, dùng React + htm trực tiếp từ CDN và gọi Cloudflare Pages Functions cho API.

## Trạng thái hiện tại

- **Frontend**: `index.html` load trực tiếp `src/styles.css`, `src/sync.js`, `src/app.js`.
- **Runtime API**: Cloudflare Pages Functions trong `functions/api/`.
- **Database live**: Supabase thông qua adapter `functions/api/_supabase_db.js` khi Cloudflare có đủ biến môi trường Supabase.
- **D1 legacy/local**: migrations trong `database/cloudflare/migrations/` vẫn được giữ để tham khảo hoặc chạy local cũ.
- **Offline cache**: `LocalStorage` + outbox trong `src/sync.js`.
- **Deploy chính**: Cloudflare Pages tại `https://shopprogram.pages.dev`.
- **Chuẩn bị phụ**: có cấu hình Vercel/Supabase để migrate hoặc mirror sau này.

## Tính năng chính

- **Quầy POS**: nhiều bill đang mở, quét barcode bằng máy scan hoặc camera, add-ons, thanh toán, in lại hóa đơn.
- **Kiểm soát lưu đơn**: đơn chỉ ghi nhận doanh thu khi API lưu thành công; đơn lỗi giữ lại ở màn hình bán hàng để xử lý.
- **Kho hàng**: kiểm hàng tồn kho, phiếu nhập/xuất chung, kiểm kê, sổ cái/chuyển động kho.
- **Thành phần**: thêm/sửa nguyên liệu, chuyển thành phần, hỗ trợ sản phẩm bán lẻ và sản phẩm pha chế/recipe.
- **Sản phẩm**: thêm/sửa sản phẩm, barcode EAN-13, phân loại retail/recipe, giá, tồn kho, active/inactive.
- **Danh mục và add-ons**: quản lý danh mục, add-ons và lựa chọn custom cho sản phẩm.
- **Hóa đơn và tem**: chỉnh template hóa đơn, preview/in hóa đơn, preview/in tem barcode.
- **Dashboard**: doanh thu, số đơn, doanh thu theo phương thức thanh toán, top bán chạy, lịch sử thanh toán.
- **Export backup**: xuất full database backup dạng ZIP nhiều CSV + `schema.json` + `export_log.json`.

## Cây source nhanh

Xem bản đồ chi tiết tại [docs/SOURCE_TREE.md](./docs/SOURCE_TREE.md) và bản đồ file lớn tại [docs/CODE_MAP.md](./docs/CODE_MAP.md).

```text
SHOPPROGRAM/
├── index.html                 # Entry static app
├── _headers                   # Header/cache cho Cloudflare Pages
├── src/
│   ├── app.js                 # Toàn bộ UI + state chính
│   ├── styles.css             # Layout, responsive, print CSS
│   └── sync.js                # API helper, offline outbox, sync state
├── functions/api/             # Cloudflare Pages Functions REST API
├── database/
│   ├── cloudflare/            # D1 migrations legacy/local
│   ├── supabase/              # Supabase schema/seed/RLS
│   └── data/                  # Data import/export local
├── scripts/                   # Script migrate, seed, verify, tools
├── docs/                      # Deploy docs, plans, source maps
├── logo.png
├── logo-thermal.png
├── wrangler.toml
└── vercel.json
```

## Chạy local

Chạy static nhanh, không có API server:

```bash
python3 -m http.server 8080
```

Mở `http://localhost:8080`. Khi không có API, app dùng LocalStorage và outbox.

Chạy gần giống Cloudflare hơn:

```bash
npx wrangler pages dev .
```

Nếu cần D1 local legacy:

```bash
npx wrangler d1 execute shopflow-db --local --file=./database/cloudflare/migrations/0001_init.sql
npx wrangler d1 execute shopflow-db --local --file=./database/cloudflare/migrations/0002_seed.sql
npx wrangler pages dev . --d1=DB=shopflow-db
```

## Deploy

Cloudflare Pages đang được nối GitHub. Khi push lên branch production (`main`), Cloudflare sẽ build/deploy theo cấu hình Pages hiện tại.

Các file private như `.env*`, `.wrangler/`, `node_modules/`, data dump local đã được ignore. Không commit token Supabase, service role key, database password hoặc file `.env.*.local`.

## Supabase

Runtime Supabase nằm sau Cloudflare Functions, không gọi service role key trực tiếp từ browser.

File quan trọng:

- [database/supabase/schema.sql](./database/supabase/schema.sql)
- [database/supabase/rls_policies.sql](./database/supabase/rls_policies.sql)
- [database/supabase/seed.sql](./database/supabase/seed.sql)
- [database/supabase/seed.json](./database/supabase/seed.json)
- [functions/api/_supabase_db.js](./functions/api/_supabase_db.js)

Biến môi trường Cloudflare cần có tên đúng theo adapter hiện tại. Xem chi tiết trong [docs/deploy/VERCEL_SUPABASE_SETUP.md](./docs/deploy/VERCEL_SUPABASE_SETUP.md).

## API tóm tắt

| Endpoint | Mô tả |
|---|---|
| `GET /api/health` | Kiểm tra runtime/API |
| `GET/POST /api/products` | Danh sách/upsert sản phẩm |
| `DELETE /api/products/:id` | Soft delete sản phẩm |
| `POST /api/products/rename` | Đổi tên sản phẩm |
| `GET/POST /api/categories` | Danh mục |
| `GET/POST /api/addons` | Add-ons |
| `GET/POST /api/components` | Thành phần/nguyên liệu |
| `GET/POST /api/production-recipes` | Recipe pha chế |
| `GET/POST /api/production-batches` | Phiếu sơ chế/batch |
| `GET/POST /api/suppliers` | Nhà cung cấp |
| `GET/POST /api/purchases` | Phiếu nhập |
| `GET /api/purchases/:id` | Chi tiết phiếu nhập |
| `GET/POST /api/issues` | Phiếu xuất |
| `GET /api/issues/:id` | Chi tiết phiếu xuất |
| `GET /api/inventory` | Tồn hiện tại |
| `POST /api/inventory/adjust` | Kiểm kê/điều chỉnh tồn |
| `POST /api/inventory/convert` | Chuyển thành phần |
| `GET /api/inventory/movements` | Sổ cái/chuyển động kho |
| `GET/POST /api/sales` | Lưu/lấy hóa đơn |
| `GET /api/sales/:id` | Chi tiết hóa đơn |
| `GET /api/reports/summary?from&to` | Dashboard tổng quan |
| `GET /api/reports/low-stock` | Sắp hết hàng |
| `GET/POST /api/settings` | Cấu hình cửa hàng/template |
| `GET /api/sync/pull?since=` | Đồng bộ xuống |
| `POST /api/sync/push` | Đẩy outbox |

Mọi mutation quan trọng nên kèm `clientOpId` để chống ghi trùng khi retry.

## Quy ước sửa code

- Không tách `src/app.js` thành module import nếu chưa đổi cách build/deploy, vì app hiện là no-build static.
- Nếu cần refactor lớn, nên làm theo từng bước: tách helper thuần trước, thêm test/verify, rồi mới đổi runtime.
- Sửa UI trong `src/app.js` + `src/styles.css`; sửa lưu dữ liệu trong `functions/api/*` và `src/sync.js`.
- Trước khi push, chạy ít nhất `node --check src/app.js` nếu có đụng JS runtime.
