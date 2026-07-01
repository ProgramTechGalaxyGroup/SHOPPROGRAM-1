import { json, readJson } from "../_lib.js";

export const onRequestPost = async ({ request, env }) => {
  try {
    const body = await readJson(request);
    if (!body || !body.items || body.items.length === 0) {
      return json({ ok: false, error: "Empty order" }, { status: 400 });
    }

    const {
      clientOpId,
      id,
      customerName,
      customerPhone,
      deliveryAddress,
      orderType,
      subtotal,
      total,
      paymentMethod,
      items
    } = body;

    // Validate basic requirements
    if (!customerName) return json({ ok: false, error: "Missing customer name" }, { status: 400 });
    if (orderType === "delivery" && !deliveryAddress) {
      return json({ ok: false, error: "Missing delivery address" }, { status: 400 });
    }

    const createdAt = Date.now();
    
    // Construct customer note with prep status encoded
    let fullNote = "";
    if (orderType === "delivery") {
      fullNote = `Giao hàng (Ship đi)\nSĐT: ${customerPhone || "Không có"}\nĐịa chỉ: ${deliveryAddress}`;
    } else {
      fullNote = `Lấy tại quán\nSĐT: ${customerPhone || "Không có"}`;
    }
    
    // Add the magic tag for prep_status parsing in sync/pull
    fullNote += " [PREP:pending]";

    const db = env.DB;
    
    // Generate a human-readable order ID
    const dateObj = new Date(createdAt);
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = dateObj.getFullYear();
    const shortId = id.substring(0, 4).toUpperCase();
    const orderId = `${dd}/${mm}/${yyyy}-${shortId}-KIOSK`;

    // Insert into sales table
    // We set order_status='held' and payment_status='pending' so it appears on POS/Kitchen as an incoming order to be confirmed.
    await db.prepare(
      `INSERT INTO sales 
       (id, order_id, customer_name, subtotal, vat_amount, discount, total, paid, change_amount, payment_method, cashier_name, payment_status, order_status, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      orderId,
      customerName,
      subtotal || total,
      0, // vat_amount
      0, // discount
      total,
      0, // paid
      0, // change_amount
      paymentMethod || "cash",
      "Online Kiosk", // cashier_name
      "pending", // payment_status
      "held", // order_status
      fullNote,
      createdAt
    ).run();

    // Insert sale_items
    const stmt = db.prepare(
      `INSERT INTO sale_items 
       (id, sale_id, product_id, product_name, qty, unit_price, addons_json, addons_total, line_total, unit_cost)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const batch = [];
    for (const item of items) {
      const lineTotal = (item.price || 0) * (item.qty || 1);
      batch.push(
        stmt.bind(
          item.id || crypto.randomUUID(),
          id,
          item.productId,
          item.productName,
          item.qty,
          item.price || 0,
          JSON.stringify(item.options || []),
          0, // addons_total (handled in base price for kiosk currently)
          lineTotal,
          null // unit_cost
        )
      );
    }
    
    if (batch.length > 0) {
      await db.batch(batch);
    }

    return json({ ok: true, orderId: id });
  } catch (err) {
    return json({ ok: false, error: err.message }, { status: 500 });
  }
};
