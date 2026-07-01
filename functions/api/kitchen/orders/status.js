import { json, readJson } from "../../../_lib.js";

export const onRequestPost = async ({ request, env }) => {
  try {
    const body = await readJson(request);
    const { orderId, status } = body; // status: "preparing" or "ready"
    
    if (!orderId || !status) {
      return json({ ok: false, error: "Missing orderId or status" }, { status: 400 });
    }

    const db = env.DB;
    
    // Fetch current note
    const existing = await db.prepare("SELECT id, note FROM sales WHERE order_id = ? OR id = ?").bind(orderId, orderId).first();
    if (!existing) {
      return json({ ok: false, error: "Order not found" }, { status: 404 });
    }
    
    let note = existing.note || "";
    // Remove old tag
    note = note.replace(/\[PREP:[^\]]+\]/, '').trim();
    // Add new tag
    note += ` [PREP:${status}]`;

    // Note: since schema.sql for 'sales' has no 'updated_at', we only update the note.
    await db.prepare(
      "UPDATE sales SET note = ? WHERE id = ?"
    ).bind(note, existing.id).run();

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: err.message }, { status: 500 });
  }
};
