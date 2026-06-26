/**
 * OriaFarm POS - Mock API Interceptor for Demo App
 * Intercepts window.fetch calls to mock the backend API server completely in-memory.
 * Enables running the full system with the new shifts & KDS features in a static file.
 * Includes defensive parsing, Request object support, and try-catch fallback.
 */
(function () {
  const SALT = "shopprogram_salt_2026";
  const DEFAULT_ACCOUNTS = {
    "admin@shopprogram.local": { role: "admin", fullName: "System Admin" },
    "manager@shopprogram.local": { role: "manager", fullName: "Store Manager" },
    "cashier@shopprogram.local": { role: "cashier", fullName: "Cashier Shift A" },
    "barista@shopprogram.local": { role: "barista", fullName: "Lead Barista" },
    "inventory@shopprogram.local": { role: "inventory", fullName: "Warehouse Keeper" },
    "accountant@shopprogram.local": { role: "accountant", fullName: "Store Accountant" }
  };

  // Helper for safe JSON parsing to avoid crashing on corrupted localStorage
  function safeParseJSON(str, fallback = null) {
    try {
      if (!str) return fallback;
      return JSON.parse(str);
    } catch (e) {
      console.warn("[MOCK API] JSON parse failed, using fallback:", str, e);
      return fallback;
    }
  }

  // Seed default DB data in localStorage if empty
  if (!localStorage.getItem("demo_db_products")) {
    const defaultProducts = [
      { id: "p-orange-juice", name: "Nước ép Cam Vắt", price: 35000, category: "beverages", unit: "ly", inventory_mode: "recipe", barcode: "8930000001", component_ids: JSON.stringify([{ id: "c-orange", qty: 3, wastePercent: 10 }, { id: "c-cup", qty: 1 }]) },
      { id: "p-avocado", name: "Sinh tố Bơ Sữa", price: 45000, category: "beverages", unit: "ly", inventory_mode: "recipe", barcode: "8930000002", component_ids: JSON.stringify([{ id: "c-avocado-raw", qty: 1, wastePercent: 15 }, { id: "c-condensed-milk", qty: 40 }, { id: "c-cup", qty: 1 }]) },
      { id: "p-chips", name: "Khoai tây chiên túi O'Star", price: 15000, category: "combo", unit: "túi", inventory_mode: "stock", stock: 24, barcode: "8930000003" },
      { id: "p-sunflower", name: "Hạt hướng dương gói", price: 12000, category: "combo", unit: "gói", inventory_mode: "stock", stock: 50, barcode: "8930000004" }
    ];
    localStorage.setItem("demo_db_products", JSON.stringify(defaultProducts));
  }

  if (!localStorage.getItem("demo_db_components")) {
    const defaultComponents = [
      { id: "c-orange", label: "Cam trái (quả)", stock_qty: 120, unit: "quả" },
      { id: "c-avocado-raw", label: "Bơ sáp trái (quả)", stock_qty: 45, unit: "quả" },
      { id: "c-condensed-milk", label: "Sữa đặc (ml)", stock_qty: 2500, unit: "ml" },
      { id: "c-cup", label: "Ly nhựa 500ml (cái)", stock_qty: 300, unit: "cái" }
    ];
    localStorage.setItem("demo_db_components", JSON.stringify(defaultComponents));
  }

  if (!localStorage.getItem("demo_db_categories")) {
    const defaultCategories = [
      { id: "combo", label: "Hàng bán sẵn / Retail", icon: "📦", sort_order: 1, is_active: 1 },
      { id: "beverages", label: "Thức uống pha chế / Prepared", icon: "🍹", sort_order: 2, is_active: 1 }
    ];
    localStorage.setItem("demo_db_categories", JSON.stringify(defaultCategories));
  }

  // Helper to make a Response object
  function makeResponse(data, status = 200, headers = {}) {
    const bodyText = typeof data === "string" ? data : JSON.stringify(data);
    const h = new Headers({
      "Content-Type": "application/json; charset=utf-8",
      ...headers
    });
    return new Response(bodyText, {
      status,
      headers: h
    });
  }

  // Intercept fetch calls
  const originalFetch = window.fetch;
  window.fetch = async function (url, options = {}) {
    try {
      // Support Request objects in window.fetch
      let urlString = "";
      if (typeof url === "string") {
        urlString = url;
      } else if (url && typeof url === "object" && url.url) {
        urlString = url.url;
      } else {
        urlString = String(url);
      }

      const parsedUrl = new URL(urlString, window.location.origin);
      const path = parsedUrl.pathname;
      const method = (options.method || "GET").toUpperCase();

      if (!path.startsWith("/api/")) {
        return originalFetch.apply(this, arguments);
      }

      console.log(`[MOCK API] ${method} ${path}`, options);

      // Delay response slightly for realistic network behavior
      await new Promise(r => setTimeout(r, 200));

      // ─── 1. AUTHENTICATION ───
      if (path === "/api/auth/me") {
        const userJson = localStorage.getItem("demo_session_user");
        if (userJson) {
          const u = safeParseJSON(userJson);
          if (u) {
            return makeResponse({ ok: true, user: u });
          }
        }
        return makeResponse({ ok: false, error: "Unauthorized" }, 401);
      }

      if (path === "/api/auth/login" && method === "POST") {
        const body = safeParseJSON(options.body || "{}", {});
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");

        const acc = DEFAULT_ACCOUNTS[email];
        if (!acc) {
          return makeResponse({ ok: false, error: "Tài khoản không tồn tại. / Account not found." }, 400);
        }

        // Simple password check for demo purposes
        const expectedPassword = email.split("@")[0] + "123";
        if (password !== expectedPassword) {
          return makeResponse({ ok: false, error: "Sai mật khẩu. / Invalid password." }, 400);
        }

        const sessionUser = { email, role: acc.role, fullName: acc.fullName };
        localStorage.setItem("demo_session_user", JSON.stringify(sessionUser));
        return makeResponse({ ok: true, user: sessionUser });
      }

      if (path === "/api/auth/logout" && method === "POST") {
        localStorage.removeItem("demo_session_user");
        return makeResponse({ ok: true });
      }

      // ─── 2. SHIFTS (OPEN/CLOSE REGISTER) ───
      if (path === "/api/shifts/active" && method === "GET") {
        const activeShift = localStorage.getItem("demo_active_shift");
        if (activeShift) {
          const s = safeParseJSON(activeShift);
          if (s) {
            return makeResponse({ ok: true, shift: s });
          }
        }
        return makeResponse({ ok: true, shift: null });
      }

      if (path === "/api/shifts/start" && method === "POST") {
        const body = safeParseJSON(options.body || "{}", {});
        const openingCash = Number(body.openingCash) || 0;
        const user = safeParseJSON(localStorage.getItem("demo_session_user") || "{}", {});

        const newShift = {
          shift_id: "shf_" + Date.now(),
          user_id: user.email || "unknown",
          shift_date: new Date().toISOString().slice(0, 10),
          start_time: new Date().toLocaleTimeString(),
          end_time: null,
          opening_cash: openingCash,
          closing_cash: null,
          expected_cash: openingCash,
          cash_difference: 0,
          status: "active",
          created_at: Date.now()
        };

        localStorage.setItem("demo_active_shift", JSON.stringify(newShift));
        return makeResponse({ ok: true, shift: newShift });
      }

      if (path === "/api/shifts/end" && method === "POST") {
        const body = safeParseJSON(options.body || "{}", {});
        const closingCash = Number(body.closingCash) || 0;
        const note = body.note || "";
        const activeShift = safeParseJSON(localStorage.getItem("demo_active_shift") || "{}", {});

        if (!activeShift.shift_id) {
          return makeResponse({ ok: false, error: "No active shift" }, 400);
        }

        // Calculate expected cash: opening_cash + cash sales during this shift
        const sales = safeParseJSON(localStorage.getItem("demo_db_sales") || "[]", []);
        const shiftSales = sales.filter(s => s.created_at >= activeShift.created_at && s.payment_method === "cash");
        const cashSalesTotal = shiftSales.reduce((sum, s) => sum + (s.total || 0), 0);
        
        const expectedCash = activeShift.opening_cash + cashSalesTotal;
        const diff = closingCash - expectedCash;

        activeShift.end_time = new Date().toLocaleTimeString();
        activeShift.closing_cash = closingCash;
        activeShift.expected_cash = expectedCash;
        activeShift.cash_difference = diff;
        activeShift.status = "closed";
        activeShift.note = note;

        localStorage.removeItem("demo_active_shift");

        // Save to completed shifts log
        const shiftsLog = safeParseJSON(localStorage.getItem("demo_db_shifts_history") || "[]", []);
        shiftsLog.push(activeShift);
        localStorage.setItem("demo_db_shifts_history", JSON.stringify(shiftsLog));

        return makeResponse({ ok: true, shift: activeShift });
      }

      // ─── 3. KITCHEN / BARISTA KDS WORKFLOW ───
      if (path === "/api/kitchen/orders" && method === "GET") {
        const sales = safeParseJSON(localStorage.getItem("demo_db_sales") || "[]", []);
        // Return orders needing prep (pending or preparing)
        const kitchenOrders = sales.filter(s => s.prep_status === "pending" || s.prep_status === "preparing");
        return makeResponse({ ok: true, orders: kitchenOrders });
      }

      if (path.startsWith("/api/kitchen/orders/status") && method === "POST") {
        const body = safeParseJSON(options.body || "{}", {});
        const orderId = body.orderId;
        const newStatus = body.status; // 'preparing', 'ready', 'served'

        const sales = safeParseJSON(localStorage.getItem("demo_db_sales") || "[]", []);
        const order = sales.find(s => s.id === orderId);

        if (order) {
          order.prep_status = newStatus;
          localStorage.setItem("demo_db_sales", JSON.stringify(sales));
          return makeResponse({ ok: true, order });
        }
        return makeResponse({ ok: false, error: "Order not found" }, 404);
      }

      if (path.startsWith("/api/pub/orders/status") && method === "GET") {
        const orderId = parsedUrl.searchParams.get("id");
        const sales = safeParseJSON(localStorage.getItem("demo_db_sales") || "[]", []);
        const order = sales.find(s => s.id === orderId);
        if (order) {
          return makeResponse({ ok: true, id: order.id, orderId: order.order_id, customerName: order.customer_name, prepStatus: order.prep_status });
        }
        return makeResponse({ ok: false, error: "Order not found" }, 404);
      }

      // ─── 4. INVENTORY / PRODUCTS / SALES API ───
      if (path === "/api/sync/pull") {
        const products = safeParseJSON(localStorage.getItem("demo_db_products") || "[]", []);
        const components = safeParseJSON(localStorage.getItem("demo_db_components") || "[]", []);
        const categories = safeParseJSON(localStorage.getItem("demo_db_categories") || "[]", []);
        const sales = safeParseJSON(localStorage.getItem("demo_db_sales") || "[]", []);

        return makeResponse({
          ok: true,
          serverTime: Date.now(),
          categories,
          addOns: [
            { id: "sugar-50", label: "50% đường", price: 0, group_key: "sweetness", is_active: 1 },
            { id: "sugar-0", label: "Không đường", price: 0, group_key: "sweetness", is_active: 1 },
            { id: "ice-less", label: "Ít đá", price: 0, group_key: "ice", is_active: 1 }
          ],
          components,
          products,
          inventory: products.map(p => ({ product_id: p.id, qty_on_hand: p.stock || 0 })),
          settings: { storeName: "OriaFarm Quầy POS", phone: "0909 123 456", brandDisplayName: "OriaFarm" },
          recentSales: sales.slice(-20),
          productionRecipes: [],
          productionBatches: []
        });
      }

      if (path === "/api/sales" && method === "POST") {
        const body = safeParseJSON(options.body || "{}", {});
        const sales = safeParseJSON(localStorage.getItem("demo_db_sales") || "[]", []);
        const products = safeParseJSON(localStorage.getItem("demo_db_products") || "[]", []);
        const components = safeParseJSON(localStorage.getItem("demo_db_components") || "[]", []);

        // Auto generate sale ID and order ID
        const saleId = "HD-" + Date.now();
        const orderId = new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + (sales.length + 1);

        // Check if it contains drink recipes (robust beverage detection)
        let hasRecipeItems = false;
        (body.items || []).forEach(it => {
          const pInfo = products.find(p => p.id === it.productId);
          const name = String(it.productName || it.name || "").toLowerCase();
          const category = String(it.category || (pInfo && pInfo.category) || "").toLowerCase();
          
          const isBeverage = category.includes("beverage") || 
                             (pInfo && pInfo.category_id && String(pInfo.category_id).toLowerCase().includes("beverage")) ||
                             category.includes("juice") || 
                             category.includes("tea") ||
                             category.includes("coffee") ||
                             category.includes("fresh") ||
                             name.includes("nước") ||
                             name.includes("sinh tố") ||
                             name.includes("trà") ||
                             name.includes("cà phê") ||
                             name.includes("milo") ||
                             name.includes("dasani") ||
                             name.includes("juice") ||
                             name.includes("cam") ||
                             name.includes("bơ") ||
                             name.includes("dừa") ||
                             (pInfo && pInfo.inventory_mode === "recipe");

          if (isBeverage) {
            hasRecipeItems = true;
          }

          // Deduct inventory if retail
          if (pInfo && pInfo.inventory_mode === "stock") {
            pInfo.stock = Math.max(0, (pInfo.stock || 0) - (it.qty || 1));
          }

          // Deduct components if recipe and completed
          if (pInfo && pInfo.inventory_mode === "recipe" && pInfo.component_ids) {
            try {
              const comps = safeParseJSON(pInfo.component_ids, []);
              comps.forEach(c => {
                const compObj = components.find(comp => comp.id === c.id);
                if (compObj) {
                  const deduction = (c.qty || 1) * (it.qty || 1);
                  compObj.stock_qty = Math.max(0, (compObj.stock_qty || 0) - deduction);
                }
              });
            } catch (e) { }
          }
        });

        const newSale = {
          id: saleId,
          order_id: orderId,
          customer_name: body.customerName || "Khách lẻ / Walk-in",
          subtotal: body.subtotal,
          vat_amount: body.vatAmount || 0,
          discount: body.discount || 0,
          total: body.total,
          paid: body.paid,
          change_amount: body.changeAmount || 0,
          payment_method: body.paymentMethod || "cash",
          cashier_name: body.cashierName || "Cashier",
          payment_status: "paid",
          order_status: "completed",
          prep_status: hasRecipeItems ? "pending" : "served", // Starts as pending if drinks need to be made
          note: body.note || null,
          created_at: Date.now(),
          items: body.items || []
        };

        sales.push(newSale);
        localStorage.setItem("demo_db_sales", JSON.stringify(sales));
        localStorage.setItem("demo_db_products", JSON.stringify(products));
        localStorage.setItem("demo_db_components", JSON.stringify(components));

        // If active shift exists, update shift cash sales
        const activeShift = safeParseJSON(localStorage.getItem("demo_active_shift") || "{}", {});
        if (activeShift.shift_id && newSale.payment_method === "cash") {
          activeShift.cash_difference = 0;
          activeShift.cashSales = (activeShift.cashSales || 0) + newSale.total;
          localStorage.setItem("demo_active_shift", JSON.stringify(activeShift));
        }

        return makeResponse({ ok: true, id: saleId, orderId });
      }

      // Default fallback
      return originalFetch.apply(this, arguments);
    } catch (err) {
      console.error("[MOCK API INTERCEPTOR ERROR] Fallback to network:", err);
      return originalFetch.apply(this, arguments);
    }
  };
})();
