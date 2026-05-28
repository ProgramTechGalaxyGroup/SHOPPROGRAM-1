import { json } from "../_lib.js";

// GET /api/reports/summary?from=&to=
// Returns revenue, gross profit, order count, top products,
// and a per-day revenue breakdown for charting.
export const onRequestGet = async ({ env, request }) => {
  const url = new URL(request.url);
  const from = Number(url.searchParams.get("from")) || 0;
  const to = Number(url.searchParams.get("to")) || Date.now();

  const totals = await env.DB.prepare(
    `SELECT COUNT(*) AS order_count,
            COALESCE(SUM(total), 0) AS revenue,
            COALESCE(SUM(vat_amount), 0) AS vat,
            COALESCE(SUM(discount), 0) AS discount
     FROM sales
     WHERE created_at BETWEEN ? AND ?
       AND order_status = 'completed'`
  ).bind(from, to).first();

  const profit = await env.DB.prepare(
    `SELECT COALESCE(SUM(si.line_total - (si.qty * COALESCE(si.unit_cost, 0))), 0) AS gross_profit,
            COALESCE(SUM(si.qty * COALESCE(si.unit_cost, 0)), 0) AS cogs
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     WHERE s.created_at BETWEEN ? AND ?
       AND s.order_status = 'completed'`
  ).bind(from, to).first();

  const { results: topProducts } = await env.DB.prepare(
    `SELECT si.product_id, si.product_name,
            SUM(si.qty) AS qty,
            SUM(si.line_total) AS revenue
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     WHERE s.created_at BETWEEN ? AND ?
       AND s.order_status = 'completed'
     GROUP BY si.product_id, si.product_name
     ORDER BY qty DESC
     LIMIT 10`
  ).bind(from, to).all();

  const { results: byDay } = await env.DB.prepare(
    `SELECT strftime('%Y-%m-%d', created_at/1000, 'unixepoch') AS day,
            COUNT(*) AS orders,
            COALESCE(SUM(total), 0) AS revenue
     FROM sales
     WHERE created_at BETWEEN ? AND ?
       AND order_status = 'completed'
     GROUP BY day
     ORDER BY day`
  ).bind(from, to).all();

  return json({
    ok: true,
    range: { from, to },
    totals: {
      orderCount: Number(totals.order_count) || 0,
      revenue:    Number(totals.revenue)     || 0,
      vat:        Number(totals.vat)         || 0,
      discount:   Number(totals.discount)    || 0,
      grossProfit: Number(profit.gross_profit) || 0,
      cogs:        Number(profit.cogs)         || 0,
    },
    topProducts: topProducts || [],
    byDay: byDay || [],
  });
};
