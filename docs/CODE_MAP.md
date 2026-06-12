# Code Map

`src/app.js` hiện là file UI chính và khá lớn. Bản đồ này không thay thế code comment, nhưng giúp định vị nhanh vùng cần sửa.

## `src/app.js`

| Vùng gần đúng | Nội dung |
|---|---|
| `1-160` | Bootstrapping, legacy local repair, constants đầu file |
| `161-230` | Normalize payment method, component item type, helper cơ bản |
| `230-816` | Default data, table schema/export definitions, demo seed |
| `817-1042` | Search text, CSV export, order ID, barcode helpers |
| `1043-1300` | Barcode label render, label PNG/PDF/page config |
| `1301-1433` | Language labels, Firebase/Supabase helper values |
| `1434-1894` | Normalize order/sale/product/component/recipe/template |
| `1895-2171` | Receipt print markup, small UI components, sync wrapper helpers |
| `2172-3368` | `App()` state, effects, local persistence, API load/sync setup |
| `3369-3526` | Dashboard ranges, inventory tabs, function command search destinations |
| `3527-4154` | POS interaction: select bill, scan barcode, add/remove item, calculate totals |
| `4155-4565` | Build/save sale payload, retry save, checkout, print/reprint invoice |
| `4566-4757` | Barcode label document/print flow |
| `4758-5604` | Database backup export, Firebase/Supabase seed export helpers |
| `5605-6500` | Product/category/add-on/component/recipe CRUD handlers |
| `6501-7071` | Additional stock/product/template action handlers |
| `7072-7647` | `renderPosView()` |
| `7648-7973` | `renderDashboardView()` |
| `7974-9460` | `renderInventoryView()` and inventory sub-tabs |
| `9461-9936` | Stock operations: combined nhập/xuất, purchases, issues |
| `9937-10084` | Warehouse/legacy stock ledger views |
| `10085-end` | `renderSettingsView()`, app shell, header, final render |

Important anchor functions:

| Function | Purpose |
|---|---|
| `normalizePaymentMethod` | Chuẩn hóa payment method cho dashboard/report |
| `normalizeComponentItemType` | Chuẩn hóa loại item product/component |
| `buildOrderId` | Tạo mã đơn theo ngày + sequence |
| `normalizeBarcode` | Chuẩn hóa barcode |
| `renderBarcodeMarkup` | Render vạch barcode |
| `buildLabelPdfPageConfig` | Cấu hình khổ tem in |
| `buildPrintMarkup` | Markup hóa đơn in |
| `buildInitialState` | State mặc định ban đầu |
| `normalizeProduct` | Chuẩn hóa product |
| `normalizeComponent` | Chuẩn hóa component |
| `normalizeProductionRecipe` | Chuẩn hóa recipe |
| `saveSaleWithOneRetry` | Lưu sale, retry một lần |
| `printWithTemplate` | In/reprint hóa đơn |
| `printBarcodeLabels` | In tem barcode |
| `exportDatabaseBackup` | Export ZIP full database backup |
| `startEditComponent` | Chuyển UI sang tab Thành phần để sửa component |
| `renderPosView` | UI quầy POS |
| `renderDashboardView` | UI tổng quan |
| `renderInventoryView` | UI kho hàng |
| `renderStockOperationsView` | UI kiểm hàng tồn kho |
| `renderPurchasesView` | UI phiếu nhập |
| `renderIssuesView` | UI phiếu xuất |
| `renderSettingsView` | UI setting |

## `src/styles.css`

Use this file for:

- Desktop/mobile responsive layout.
- POS columns, order panel, inventory workspace.
- Buttons, cards, sidebars, tab sticky behavior.
- Print CSS for invoice and barcode labels.

When changing print output, test browser preview and exported/print preview, because screen layout and print layout can differ.

## `src/sync.js`

Use this file for:

- `apiFetch` and API error handling.
- Offline outbox queue.
- Pull/push sync behavior.
- Pending/synced status labels used by UI.

If a completed sale appears in dashboard before server confirmation, check both `src/app.js` checkout logic and this file.

## `functions/api`

| File / folder | Purpose |
|---|---|
| `_supabase_db.js` | Main database adapter for Supabase |
| `_lib.js` | Shared parsing/response helpers |
| `_middleware.js` | Cloudflare Pages Function middleware |
| `sales/index.js` | Create/list sales and payments |
| `sales/[id].js` | Sale detail |
| `reports/summary.js` | Dashboard revenue/order/payment method totals |
| `reports/low-stock.js` | Low stock report |
| `products/index.js` | Product list/upsert |
| `products/[id].js` | Product delete |
| `products/rename.js` | Product rename |
| `components/index.js` | Component list/upsert |
| `inventory/index.js` | Current inventory |
| `inventory/adjust.js` | Stock adjust/count |
| `inventory/convert.js` | Convert product/component inventory |
| `inventory/movements.js` | Inventory ledger |
| `purchases/index.js` | Stock in |
| `issues/index.js` | Stock out |
| `production-recipes/index.js` | Recipe CRUD |
| `production-batches/index.js` | Production batch CRUD |
| `settings/index.js` | Store/template settings |
| `sync/pull.js` | Sync pull |
| `sync/push.js` | Sync push |

## Future Refactor Path

The repo is intentionally no-build right now. If we later want a cleaner physical code tree, the safest path is:

1. Add a lightweight build step or module loader plan.
2. Move pure helpers first: barcode, CSV export, normalization, money/date formatting.
3. Move API client/sync boundaries next.
4. Split UI views after tests/manual checks are stable.
5. Only then update Cloudflare/Vercel build settings.

Until that refactor is scheduled, keep runtime files in place and use this code map for navigation.
