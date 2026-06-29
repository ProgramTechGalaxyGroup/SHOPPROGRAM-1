import { json } from "../_lib.js";

export const onRequestGet = async ({ env }) => {
  try {
    const db = env.DB;
    
    // Add 10 mock categories
    const categories = [
      { id: "cat-101", label: "Trà sữa / Milk Tea / 奶茶", sort_order: 1 },
      { id: "cat-102", label: "Cà phê / Coffee / 咖啡", sort_order: 2 },
      { id: "cat-103", label: "Nước ép / Juice / 果汁", sort_order: 3 },
      { id: "cat-104", label: "Sinh tố / Smoothie / 冰沙", sort_order: 4 },
      { id: "cat-105", label: "Đồ ăn vặt / Snacks / 零食", sort_order: 5 },
      { id: "cat-106", label: "Bánh ngọt / Pastry / 糕点", sort_order: 6 },
      { id: "cat-107", label: "Combo Giảm Giá / Discount Combo / 折扣套餐", sort_order: 7 },
      { id: "cat-108", label: "Món Mới / New Arrivals / 新品", sort_order: 8 },
      { id: "cat-109", label: "Sữa chua / Yogurt / 酸奶", sort_order: 9 },
      { id: "cat-110", label: "Trà trái cây / Fruit Tea / 水果茶", sort_order: 10 }
    ];

    for (const c of categories) {
      await db.prepare("INSERT OR REPLACE INTO categories (id, label, icon, sort_order, is_active, updated_at) VALUES (?, ?, '🍹', ?, 1, CURRENT_TIMESTAMP)")
        .bind(c.id, c.label, c.sort_order).run();
    }

    // Add 40 mock products (4 per category)
    const products = [];
    let pCount = 1;
    for (const c of categories) {
      const cParts = c.label.split(" / ");
      for (let i = 1; i <= 4; i++) {
        const pId = "prod-" + pCount;
        const viName = (cParts[0] || "Món") + " Loại " + i;
        const enName = (cParts[1] || "Item") + " Type " + i;
        const zhName = (cParts[2] || "产品") + " 类型 " + i;
        products.push({
          id: pId,
          name: viName + " / " + enName + " / " + zhName,
          category_id: c.id,
          price: 25000 + (i * 5000),
          stock: (i % 3 === 0) ? 0 : 50, // Some are sold out
          inventory_mode: "stock"
        });
        pCount++;
      }
    }

    for (const p of products) {
      await db.prepare("INSERT OR REPLACE INTO products (id, name, category_id, price, image, description, is_active, inventory_mode, updated_at) VALUES (?, ?, ?, ?, 'https://picsum.photos/200', 'Mô tả hấp dẫn cho sản phẩm này', 1, ?, CURRENT_TIMESTAMP)")
        .bind(p.id, p.name, p.category_id, p.price, p.inventory_mode).run();
      
      await db.prepare("INSERT OR REPLACE INTO inventory (product_id, qty_on_hand, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)")
        .bind(p.id, p.stock).run();
    }

    return json({ ok: true, message: "Mock data injected successfully" });
  } catch (err) {
    return json({ ok: false, error: err.message }, { status: 500 });
  }
};
