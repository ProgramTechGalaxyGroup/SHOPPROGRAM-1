-- Supabase RLS policies for ShopFlow POS.
--
-- Supabase exposes the public schema through PostgREST, so each public table
-- must have row level security enabled. Browser clients can read only the
-- safe catalog/config data needed to render the POS. Sensitive writes should
-- be handled by server-side code using the service role key.

alter table public.categories enable row level security;
alter table public.add_ons enable row level security;
alter table public.components enable row level security;
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.stock_movements enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.purchase_component_items enable row level security;
alter table public.component_stock_movements enable row level security;
alter table public.stock_issues enable row level security;
alter table public.stock_issue_items enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.settings enable row level security;
alter table public.sync_log enable row level security;
alter table public.doc_sequences enable row level security;

alter table public.components add column if not exists stock_qty integer not null default 0;
alter table public.components add column if not exists min_stock integer not null default 0;
alter table public.components add column if not exists is_active integer not null default 1;
alter table public.products add column if not exists inventory_mode text;

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.add_ons, public.components, public.products, public.inventory, public.settings to anon, authenticated;
grant select on public.suppliers, public.sales, public.sale_items, public.purchase_orders, public.purchase_order_items, public.purchase_component_items, public.stock_issues, public.stock_issue_items, public.stock_movements, public.component_stock_movements to authenticated;

drop policy if exists "catalog_select_active_categories" on public.categories;
create policy "catalog_select_active_categories"
on public.categories for select
to anon, authenticated
using (is_active = 1);

drop policy if exists "catalog_select_active_add_ons" on public.add_ons;
create policy "catalog_select_active_add_ons"
on public.add_ons for select
to anon, authenticated
using (is_active = 1);

drop policy if exists "catalog_select_active_components" on public.components;
create policy "catalog_select_active_components"
on public.components for select
to anon, authenticated
using (is_active = 1);

drop policy if exists "catalog_select_active_products" on public.products;
create policy "catalog_select_active_products"
on public.products for select
to anon, authenticated
using (is_active = 1);

drop policy if exists "catalog_select_active_inventory" on public.inventory;
create policy "catalog_select_active_inventory"
on public.inventory for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = inventory.product_id
      and products.is_active = 1
  )
);

drop policy if exists "settings_select_public_app_config" on public.settings;
create policy "settings_select_public_app_config"
on public.settings for select
to anon, authenticated
using (
  key in (
    'shop',
    'invoice_templates',
    'barcode_templates',
    'selected_invoice_template_id',
    'selected_barcode_template_id'
  )
);

drop policy if exists "staff_select_suppliers" on public.suppliers;
create policy "staff_select_suppliers"
on public.suppliers for select
to authenticated
using (true);

drop policy if exists "staff_select_sales" on public.sales;
create policy "staff_select_sales"
on public.sales for select
to authenticated
using (true);

drop policy if exists "staff_select_sale_items" on public.sale_items;
create policy "staff_select_sale_items"
on public.sale_items for select
to authenticated
using (true);

drop policy if exists "staff_select_purchase_orders" on public.purchase_orders;
create policy "staff_select_purchase_orders"
on public.purchase_orders for select
to authenticated
using (true);

drop policy if exists "staff_select_purchase_order_items" on public.purchase_order_items;
create policy "staff_select_purchase_order_items"
on public.purchase_order_items for select
to authenticated
using (true);

drop policy if exists "staff_select_purchase_component_items" on public.purchase_component_items;
create policy "staff_select_purchase_component_items"
on public.purchase_component_items for select
to authenticated
using (true);

drop policy if exists "staff_select_component_stock_movements" on public.component_stock_movements;
create policy "staff_select_component_stock_movements"
on public.component_stock_movements for select
to authenticated
using (true);

drop policy if exists "staff_select_stock_issues" on public.stock_issues;
create policy "staff_select_stock_issues"
on public.stock_issues for select
to authenticated
using (true);

drop policy if exists "staff_select_stock_issue_items" on public.stock_issue_items;
create policy "staff_select_stock_issue_items"
on public.stock_issue_items for select
to authenticated
using (true);

drop policy if exists "staff_select_stock_movements" on public.stock_movements;
create policy "staff_select_stock_movements"
on public.stock_movements for select
to authenticated
using (true);
