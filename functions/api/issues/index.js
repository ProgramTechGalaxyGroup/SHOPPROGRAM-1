import {
  json, readJson, badRequest, now, uid,
  isDuplicateOp, recordOpStmt, runIdempotentBatch, nextDocId,
  inventoryDeltaStmt, movementStmt,
  getProductCost, getProductName,
} from "../_lib.js";

const VALID_REASONS = new Set(["damaged", "sample", "internal", "transfer", "other"]);

// GET /api/issues
export const onRequestGet = async ({ env, request }) => {
  const url = new URL(request.url);
  const from = Number(url.searchParams.get("from"));
  const to = Number(url.searchParams.get("to"));
  const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 500);
  const where = [];
  const binds = [];
  if (from) { where.push("si.created_at >= ?"); binds.push(from); }
  if (to)   { where.push("si.created_at <= ?"); binds.push(to); }
  const sql = `
    SELECT si.*, COUNT(sii.id) AS item_count,
           SUM(sii.qty) AS total_qty
    FROM stock_issues si
    LEFT JOIN stock_issue_items sii ON sii.issue_id = si.id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    GROUP BY si.id
    ORDER BY si.created_at DESC
    LIMIT ?
  `;
  binds.push(limit);
  const { results } = await env.DB.prepare(sql).bind(...binds).all();
  return json({ ok: true, issues: results || [] });
};

// POST /api/issues
// Body:
//   {
//     clientOpId,
//     reason: 'damaged'|'sample'|'internal'|'transfer'|'other',
//     note?,
//     items: [{ productId, qty, unitCost? }]
//   }
export const onRequestPost = async ({ env, request }) => {
  const body = await readJson(request);
  if (!body || !VALID_REASONS.has(body.reason)) return badRequest("invalid reason");
  if (!Array.isArray(body.items) || !body.items.length) return badRequest("items required");
  for (let i = 0; i < body.items.length; i++) {
    const it = body.items[i];
    if (!it || !it.productId || typeof it.productId !== "string") {
      return badRequest(`items[${i}].productId required`);
    }
    const q = Number(it.qty);
    if (!Number.isFinite(q) || q <= 0) {
      return badRequest(`items[${i}].qty must be > 0 (got ${it.qty})`);
    }
    it.qty = Math.floor(q);
  }

  if (body.clientOpId) {
    const dup = await isDuplicateOp(env.DB, body.clientOpId);
    if (dup) return json({ ok: true, duplicate: true, id: dup });
  }

  // B1: server stock guard. Stocktake-style flows can opt in with
  // allowNegativeStock=true (used by the kiểm kê UI when actual<system).
  if (!body.allowNegativeStock) {
    const needByProduct = new Map();
    for (const it of body.items) {
      needByProduct.set(it.productId, (needByProduct.get(it.productId) || 0) + (Number(it.qty) || 0));
    }
    const checks = await Promise.all(
      [...needByProduct.keys()].map((pid) =>
        env.DB.prepare(
          `SELECT p.name, COALESCE(i.qty_on_hand, 0) AS stock
           FROM products p LEFT JOIN inventory i ON i.product_id = p.id
           WHERE p.id = ?`
        ).bind(pid).first()
      )
    );
    const insufficient = [];
    [...needByProduct.entries()].forEach(([pid, need], idx) => {
      const row = checks[idx];
      const have = row ? Number(row.stock) || 0 : 0;
      if (have < need) {
        insufficient.push({ productId: pid, name: row ? row.name : pid, available: have, required: need });
      }
    });
    if (insufficient.length) {
      return badRequest("Insufficient stock", { code: "INSUFFICIENT_STOCK", insufficient });
    }
  }

  const ts = now();
  const issueId = body.id || await nextDocId(env.DB, "PX", ts);

  // Snapshot costs + names in parallel.
  const enriched = await Promise.all(body.items.map(async (it) => ({
    ...it,
    productName: it.productName || (await getProductName(env.DB, it.productId)),
    unitCost: it.unitCost != null ? Number(it.unitCost) : await getProductCost(env.DB, it.productId),
  })));

  const stmts = [];
  stmts.push(
    env.DB.prepare(
      `INSERT INTO stock_issues (id, reason, note, status, created_at)
       VALUES (?, ?, ?, 'completed', ?)`
    ).bind(issueId, body.reason, body.note || null, ts)
  );

  enriched.forEach((it) => {
    stmts.push(
      env.DB.prepare(
        `INSERT INTO stock_issue_items (id, issue_id, product_id, product_name, qty, unit_cost)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(uid("sii"), issueId, it.productId, it.productName, Number(it.qty), it.unitCost)
    );
    stmts.push(
      movementStmt(env.DB, {
        productId: it.productId,
        movementType: "OUT",
        qtyChange: -Number(it.qty),
        unitCost: it.unitCost,
        refType: "issue",
        refId: issueId,
        note: body.reason,
        createdAt: ts,
      })
    );
    stmts.push(inventoryDeltaStmt(env.DB, it.productId, -Number(it.qty), ts));
  });

  stmts.push(recordOpStmt(env.DB, body.clientOpId, "issue", issueId));

  const outcome = await runIdempotentBatch(env.DB, stmts, body.clientOpId);
  if (outcome.duplicate) {
    return json({ ok: true, duplicate: true, id: outcome.refId });
  }
  return json({ ok: true, id: issueId });
};
