import { json } from "../../_lib.js";

export const onRequestGet = async ({ env }) => {
  try {
    const db = env.DB;
    
    // Fetch all sales that are 'held' AND have a PREP status tag in the note
    const { results } = await db.prepare(
      `SELECT 
         s.id, s.order_id, s.created_at, s.customer_name, s.note,
         (
           SELECT json_group_array(
             json_object(
               'id', si.id,
               'productId', si.product_id,
               'name', si.product_name,
               'qty', si.qty,
               'addonsJson', si.addons_json
             )
           )
           FROM sale_items si
           WHERE si.sale_id = s.id
         ) as items_json
       FROM sales s
       WHERE s.order_status = 'held' 
         AND (s.note LIKE '%[PREP:pending]%' OR s.note LIKE '%[PREP:preparing]%')
       ORDER BY s.created_at ASC`
    ).all();

    const orders = (results || []).map(row => {
      let prep_status = 'pending';
      let note = row.note || "";
      if (note.includes('[PREP:')) {
        const match = note.match(/\[PREP:([^\]]+)\]/);
        if (match) {
          prep_status = match[1];
          note = note.replace(/\[PREP:[^\]]+\]/, '').trim();
        }
      }
      
      let items = [];
      if (row.items_json) {
        try { 
          items = JSON.parse(row.items_json); 
        } catch (e) {}
      }

      return {
        id: row.id,
        order_id: row.order_id,
        customer_name: row.customer_name,
        created_at: row.created_at,
        prep_status,
        note,
        items
      };
    });

    return json({ ok: true, orders });
  } catch (err) {
    return json({ ok: false, error: err.message }, { status: 500 });
  }
};
