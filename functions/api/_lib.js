// Shared helpers for Pages Functions API routes.

export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}

export function badRequest(message, extra) {
  return json({ ok: false, error: message, ...(extra || {}) }, { status: 400 });
}

export function notFound(message = "Not found") {
  return json({ ok: false, error: message }, { status: 404 });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function now() {
  return Date.now();
}

export function uid(prefix) {
  return (prefix ? prefix + "-" : "") +
    Math.random().toString(36).slice(2, 9) +
    Date.now().toString(36).slice(-5);
}

// YYYYMMDD in shop-local-ish UTC (no TZ adjust; good enough for daily ids)
export function dateKey(ts) {
  const d = new Date(ts || Date.now());
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

// Atomically allocate the next number in doc_sequences for (prefix, dateKey).
// Returns a string like "PN-20260521-001".
export async function nextDocId(db, prefix, ts) {
  const dk = dateKey(ts);
  // SQLite upsert that increments and returns the value.
  // D1 supports RETURNING.
  const row = await db
    .prepare(
      `INSERT INTO doc_sequences (prefix, date_key, last_number)
       VALUES (?, ?, 1)
       ON CONFLICT(prefix, date_key)
         DO UPDATE SET last_number = last_number + 1
       RETURNING last_number`
    )
    .bind(prefix, dk)
    .first();
  const n = (row && row.last_number) || 1;
  return `${prefix}-${dk}-${String(n).padStart(3, "0")}`;
}

// Check whether a client_op_id has already been applied.
// Returns the existing ref_id when duplicate, otherwise null.
export async function isDuplicateOp(db, clientOpId) {
  if (!clientOpId) return null;
  const row = await db
    .prepare("SELECT ref_id FROM sync_log WHERE client_op_id = ?")
    .bind(clientOpId)
    .first();
  return row ? row.ref_id || true : null;
}

// Build the sync_log INSERT used to seal a mutation as "applied" for a given
// clientOpId. We deliberately use plain INSERT (NOT "INSERT OR IGNORE") so the
// statement throws a UNIQUE-constraint failure when another request already
// recorded this clientOpId. Because env.DB.batch() is transactional, that
// failure rolls back the WHOLE batch — meaning duplicate parallel requests
// can no longer leak two sales into the DB.
export function recordOpStmt(db, clientOpId, opType, refId) {
  return db
    .prepare(
      `INSERT INTO sync_log (client_op_id, op_type, ref_id, applied_at)
       VALUES (?, ?, ?, ?)`
    )
    .bind(clientOpId || uid("auto"), opType || "unknown", refId || null, Date.now());
}

// Wrap env.DB.batch() so a duplicate sync_log insert (UNIQUE constraint
// violation) is converted into a friendly { ok: true, duplicate: true } reply
// instead of a 500. Returns:
//   { duplicate: true, refId }   when sync_log already had this clientOpId
//   { duplicate: false }          when the batch committed successfully
// On any OTHER error, re-throws.
export async function runIdempotentBatch(db, batch, clientOpId) {
  try {
    await db.batch(batch);
    return { duplicate: false };
  } catch (err) {
    const msg = String((err && err.message) || err || "");
    const isDup =
      msg.indexOf("UNIQUE constraint failed") !== -1 ||
      msg.indexOf("constraint failed") !== -1 ||
      msg.indexOf("D1_ERROR") !== -1 && msg.indexOf("sync_log") !== -1;
    if (isDup && clientOpId) {
      const existing = await db.prepare(
        `SELECT ref_id FROM sync_log WHERE client_op_id = ?`
      ).bind(clientOpId).first();
      return { duplicate: true, refId: existing ? existing.ref_id : null };
    }
    throw err;
  }
}

// Inventory upsert delta statement.
// qtyDelta may be negative (sale/issue) or positive (purchase/return).
export function inventoryDeltaStmt(db, productId, qtyDelta, ts) {
  return db
    .prepare(
      `INSERT INTO inventory (product_id, qty_on_hand, location, updated_at)
       VALUES (?, ?, 'main', ?)
       ON CONFLICT(product_id) DO UPDATE SET
         qty_on_hand = inventory.qty_on_hand + excluded.qty_on_hand,
         updated_at = excluded.updated_at`
    )
    .bind(productId, qtyDelta, ts || Date.now());
}

// Build a stock_movements INSERT statement.
export function movementStmt(db, params) {
  return db
    .prepare(
      `INSERT INTO stock_movements
         (id, product_id, movement_type, qty_change, unit_cost, ref_type, ref_id, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      params.id || uid("mv"),
      params.productId,
      params.movementType,
      params.qtyChange,
      params.unitCost == null ? null : params.unitCost,
      params.refType || null,
      params.refId || null,
      params.note || null,
      params.createdAt || Date.now()
    );
}

// Pull a product's current cost_price (used as snapshot for OUT/SALE moves).
export async function getProductCost(db, productId) {
  const row = await db
    .prepare("SELECT cost_price FROM products WHERE id = ?")
    .bind(productId)
    .first();
  return row ? Number(row.cost_price) || 0 : 0;
}

export async function getProductName(db, productId) {
  const row = await db
    .prepare("SELECT name FROM products WHERE id = ?")
    .bind(productId)
    .first();
  return row ? row.name : null;
}
