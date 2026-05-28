import { json, readJson, badRequest } from "../_lib.js";

// POST /api/sync/push
// Body: { ops: [{ endpoint, method, body }] }
// Each op is replayed against this Worker's own /api/* routes so the existing
// idempotency check (sync_log + client_op_id) does the deduplication.
// Returns per-op results in the same order.
export const onRequestPost = async ({ env, request }) => {
  const payload = await readJson(request);
  if (!payload || !Array.isArray(payload.ops)) return badRequest("ops array required");

  const origin = new URL(request.url).origin;
  const results = [];

  for (const op of payload.ops) {
    if (!op || !op.endpoint) {
      results.push({ ok: false, error: "missing endpoint" });
      continue;
    }
    try {
      const target = new URL(op.endpoint, origin).toString();
      const res = await fetch(target, {
        method: op.method || "POST",
        headers: { "Content-Type": "application/json" },
        body: op.body ? JSON.stringify(op.body) : null,
      });
      const data = await res.json().catch(() => ({}));
      results.push({ ok: res.ok, status: res.status, ...data });
    } catch (err) {
      results.push({ ok: false, error: err.message || String(err) });
    }
  }

  return json({ ok: true, results });
};
