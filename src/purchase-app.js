(function () {
  var state = {
    products: [],
    components: [],
    suppliers: [],
    requests: [],
    selectedRequest: null,
    itemType: "product",
    search: "",
    lines: [],
    saving: false,
  };

  var $ = function (id) { return document.getElementById(id); };
  var formatter = new Intl.NumberFormat("vi-VN");

  function money(value) {
    return formatter.format(Math.round(Number(value) || 0)) + " đ";
  }

  function numberValue(value) {
    var num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }

  function genClientOpId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "purchase-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
  }

  function api(path, opts) {
    if (window.ShopFlowSync && typeof window.ShopFlowSync.api === "function") {
      return window.ShopFlowSync.api(path, opts);
    }
    var init = opts || {};
    return fetch("/api" + path, {
      method: init.method || "GET",
      headers: init.body ? { "Content-Type": "application/json" } : {},
      body: init.body ? JSON.stringify(init.body) : undefined,
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok || data.ok === false) {
          throw new Error((data && data.error) || "Không gọi được API");
        }
        return data;
      });
    });
  }

  function setStatus(text, mode) {
    var el = $("syncStatus");
    el.textContent = text;
    el.classList.toggle("is-error", mode === "error");
  }

  function setMessage(text, mode) {
    var el = $("saveMessage");
    el.textContent = text || "";
    el.classList.toggle("is-success", mode === "success");
    el.classList.toggle("is-error", mode === "error");
  }

  function setRequestMessage(text, mode) {
    var el = $("requestMessage");
    el.textContent = text || "";
    el.classList.toggle("is-success", mode === "success");
    el.classList.toggle("is-error", mode === "error");
  }

  function normalizeProduct(product) {
    return {
      type: "product",
      id: product.id,
      name: product.name || product.id,
      category: product.category || "",
      barcode: product.barcode || "",
      sku: product.skuCode || product.sku_code || product.id,
      unit: product.unit || "cái",
      stock: numberValue(product.stock),
      unitCost: numberValue(product.costPrice || product.cost_price),
      inventoryMode: product.inventoryMode || product.inventory_mode || "",
      icon: product.image || "📦",
    };
  }

  function normalizeComponent(component) {
    return {
      type: "component",
      id: component.id,
      name: component.label || component.name || component.id,
      category: component.item_type || component.category || "component",
      barcode: component.barcode || "",
      sku: component.id,
      unit: component.unit || "unit",
      stock: numberValue(component.stock_qty || component.stockQty),
      unitCost: numberValue(component.cost_per_unit || component.costPerUnit),
      inventoryMode: "component",
      icon: "🥣",
    };
  }

  function activeItems() {
    var list = state.itemType === "component" ? state.components : state.products;
    if (state.itemType === "product") {
      list = list.filter(function (item) { return item.inventoryMode === "stock"; });
    }
    var query = state.search.trim().toLowerCase();
    if (!query) return list.slice(0, 40);
    return list.filter(function (item) {
      return [item.name, item.id, item.barcode, item.sku, item.category]
        .join(" ")
        .toLowerCase()
        .indexOf(query) >= 0;
    }).slice(0, 60);
  }

  function lineKey(item) {
    return item.type + ":" + item.id;
  }

  function addLine(item) {
    var key = lineKey(item);
    var existing = state.lines.find(function (line) { return line.key === key; });
    if (existing) {
      existing.qty += item.type === "component" ? 0.5 : 1;
    } else {
      state.lines.push({
        key: key,
        itemType: item.type,
        itemId: item.id,
        name: item.name,
        unit: item.unit,
        qty: item.type === "component" ? 1 : 1,
        unitCost: item.unitCost || 0,
        meta: (item.type === "component" ? "Thành phần" : "Hàng bán lẻ") + " · Tồn " + formatter.format(item.stock) + " " + item.unit,
      });
    }
    state.search = "";
    $("itemSearch").value = "";
    render();
  }

  function findCatalogItem(itemType, itemId) {
    var list = itemType === "component" ? state.components : state.products;
    return list.find(function (item) { return item.id === itemId; }) || null;
  }

  function setLinesFromRequest(request) {
    state.selectedRequest = request;
    state.lines = (request.items || []).map(function (requestItem) {
      var catalogItem = findCatalogItem(requestItem.itemType, requestItem.itemId);
      var item = catalogItem || {
        id: requestItem.itemId,
        type: requestItem.itemType,
        name: requestItem.name || requestItem.itemId,
        unit: requestItem.unit || "",
        stock: 0,
        unitCost: 0,
      };
      return {
        key: requestItem.itemType + ":" + requestItem.itemId,
        itemType: requestItem.itemType,
        itemId: requestItem.itemId,
        name: requestItem.name || item.name,
        unit: requestItem.unit || item.unit,
        qty: numberValue(requestItem.requestedQty),
        requestedQty: numberValue(requestItem.requestedQty),
        unitCost: item.unitCost || 0,
        meta: "Theo yêu cầu " + request.id + " · Tồn " + formatter.format(numberValue(item.stock)) + " " + (requestItem.unit || item.unit || ""),
      };
    });
    $("purchaseNote").value = request.note ? "Theo yêu cầu " + request.id + ": " + request.note : "Theo yêu cầu " + request.id;
    setMessage("Đã nạp list yêu cầu. Chỉ cần kiểm lại SL nhận và nhập giá.", "success");
    render();
  }

  function removeLine(key) {
    state.lines = state.lines.filter(function (line) { return line.key !== key; });
    render();
  }

  function totals() {
    return state.lines.reduce(function (acc, line) {
      acc.qty += numberValue(line.qty);
      acc.amount += numberValue(line.qty) * numberValue(line.unitCost);
      return acc;
    }, { qty: 0, amount: 0 });
  }

  function renderSuppliers() {
    var select = $("supplierSelect");
    var current = select.value;
    select.innerHTML = '<option value="">Chọn nhà cung cấp hoặc nhập mới</option>';
    state.suppliers.forEach(function (supplier) {
      var option = document.createElement("option");
      option.value = supplier.id;
      option.textContent = supplier.name;
      select.appendChild(option);
    });
    select.value = current;
  }

  function renderRequests() {
    var box = $("requestList");
    box.innerHTML = "";
    box.classList.toggle("empty", state.requests.length === 0);
    if (!state.requests.length) {
      box.textContent = "Chưa có yêu cầu đang mở.";
      return;
    }
    state.requests.forEach(function (request) {
      var itemCount = (request.items || []).length;
      var qty = (request.items || []).reduce(function (sum, item) {
        return sum + numberValue(item.requestedQty);
      }, 0);
      var card = document.createElement("article");
      card.className = "request-item";
      if (state.selectedRequest && state.selectedRequest.id === request.id) {
        card.classList.add("is-active");
      }
      card.innerHTML = [
        '<div class="request-item-main">',
        '<strong></strong>',
        '<small></small>',
        '</div>',
        '<button class="ghost-button" type="button">Nhập phiếu này</button>'
      ].join("");
      card.querySelector("strong").textContent = request.id + " · " + itemCount + " dòng";
      card.querySelector("small").textContent = [
        request.requesterName ? "NV kho: " + request.requesterName : "NV kho",
        "SL yêu cầu " + formatter.format(qty),
        request.note || "",
      ].filter(Boolean).join(" · ");
      card.querySelector("button").addEventListener("click", function () {
        setLinesFromRequest(request);
      });
      box.appendChild(card);
    });
  }

  function renderResults() {
    var box = $("itemResults");
    var template = $("resultTemplate");
    box.innerHTML = "";
    if (state.selectedRequest) {
      var locked = document.createElement("div");
      locked.className = "draft-lines empty";
      locked.textContent = "Đang nhập theo list yêu cầu. Bỏ chọn yêu cầu nếu muốn thêm hàng khác.";
      box.appendChild(locked);
      return;
    }
    var items = activeItems();
    if (!items.length) {
      var empty = document.createElement("div");
      empty.className = "draft-lines empty";
      empty.textContent = "Không tìm thấy hàng phù hợp.";
      box.appendChild(empty);
      return;
    }
    items.forEach(function (item) {
      var node = template.content.firstElementChild.cloneNode(true);
      node.querySelector(".result-icon").textContent = item.icon;
      node.querySelector(".result-name").textContent = item.name;
      node.querySelector(".result-meta").textContent = [
        item.id,
        item.barcode ? "Barcode " + item.barcode : "",
        item.unit ? "Đơn vị " + item.unit : "",
      ].filter(Boolean).join(" · ");
      node.querySelector(".result-stock").textContent = "Tồn " + formatter.format(item.stock);
      node.addEventListener("click", function () { addLine(item); });
      box.appendChild(node);
    });
  }

  function renderLines() {
    var box = $("draftLines");
    var template = $("lineTemplate");
    box.innerHTML = "";
    box.classList.toggle("empty", state.lines.length === 0);
    if (!state.lines.length) {
      box.textContent = "Chọn hàng ở bên trái để tạo phiếu nhập.";
      return;
    }
    state.lines.forEach(function (line) {
      var node = template.content.firstElementChild.cloneNode(true);
      node.querySelector(".line-name").textContent = line.name;
      node.querySelector(".line-meta").textContent = line.meta + " · " + line.unit;
      var qtyInput = node.querySelector(".line-qty");
      var costInput = node.querySelector(".line-cost");
      qtyInput.parentNode.firstChild.nodeValue = state.selectedRequest ? "SL nhận " : "SL yêu cầu/nhận ";
      qtyInput.value = line.qty;
      costInput.value = line.unitCost;
      node.querySelector(".line-subtotal").textContent = money(numberValue(line.qty) * numberValue(line.unitCost));
      qtyInput.addEventListener("input", function () {
        line.qty = Math.max(0, numberValue(qtyInput.value));
        render();
      });
      costInput.addEventListener("input", function () {
        line.unitCost = Math.max(0, Math.round(numberValue(costInput.value)));
        render();
      });
      var removeBtn = node.querySelector(".line-remove");
      if (state.selectedRequest) {
        removeBtn.textContent = "Theo list";
        removeBtn.disabled = true;
      }
      removeBtn.addEventListener("click", function () {
        if (state.selectedRequest) return;
        removeLine(line.key);
      });
      box.appendChild(node);
    });
  }

  function renderTotals() {
    var total = totals();
    $("draftTitle").textContent = state.lines.length ? state.lines.length + " dòng hàng" : "Chưa có dòng hàng";
    $("lineCount").textContent = String(state.lines.length);
    $("qtyTotal").textContent = formatter.format(total.qty);
    $("amountTotal").textContent = money(total.amount);
    $("savePurchaseBtn").disabled = state.saving || !state.lines.length;
  }

  function renderTabs() {
    document.querySelectorAll(".type-tab").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.type === state.itemType);
    });
  }

  function render() {
    renderTabs();
    renderRequests();
    renderSelectedRequest();
    renderResults();
    renderLines();
    renderTotals();
  }

  function renderSelectedRequest() {
    var box = $("selectedRequestBox");
    if (!state.selectedRequest) {
      box.classList.add("is-hidden");
      box.innerHTML = "";
      return;
    }
    box.classList.remove("is-hidden");
    box.innerHTML = [
      '<strong></strong>',
      '<small></small>',
      '<button class="ghost-button" type="button">Bỏ chọn yêu cầu</button>'
    ].join("");
    box.querySelector("strong").textContent = "Đang nhập theo yêu cầu " + state.selectedRequest.id;
    box.querySelector("small").textContent = state.selectedRequest.note || "List đã được nhân viên kho tạo sẵn.";
    box.querySelector("button").addEventListener("click", function () {
      state.selectedRequest = null;
      render();
    });
  }

  function selectedSupplier() {
    var supplierId = $("supplierSelect").value;
    var supplier = state.suppliers.find(function (item) { return item.id === supplierId; });
    var typedName = $("supplierName").value.trim();
    return {
      id: supplier ? supplier.id : "",
      name: typedName || (supplier ? supplier.name : ""),
    };
  }

  function buildPayload() {
    var supplier = selectedSupplier();
    var total = totals();
    return {
      clientOpId: genClientOpId(),
      supplierId: supplier.id || undefined,
      supplierName: supplier.name || undefined,
      paymentMethod: $("paymentMethod").value,
      paidAmount: $("paidAmount").value === "" ? Math.round(total.amount) : Math.round(numberValue($("paidAmount").value)),
      note: $("purchaseNote").value.trim(),
      sourceRequestId: state.selectedRequest ? state.selectedRequest.id : undefined,
      items: state.lines.map(function (line) {
        if (line.itemType === "component") {
          return {
            itemType: "component",
            componentId: line.itemId,
            componentName: line.name,
            qty: numberValue(line.qty),
            unit: line.unit,
            unitCost: Math.round(numberValue(line.unitCost)),
          };
        }
        return {
          itemType: "product",
          productId: line.itemId,
          productName: line.name,
          qty: Math.floor(numberValue(line.qty)),
          unitCost: Math.round(numberValue(line.unitCost)),
        };
      }),
    };
  }

  function validatePayload(payload) {
    if (!payload.paymentMethod) return "Vui lòng chọn phương thức thanh toán.";
    if (!payload.items.length) return "Vui lòng thêm ít nhất một dòng hàng.";
    var invalid = payload.items.find(function (item) {
      return numberValue(item.qty) <= 0 || numberValue(item.unitCost) < 0;
    });
    if (invalid) return "Số lượng phải lớn hơn 0 và giá nhập không được âm.";
    return "";
  }

  function resetDraft() {
    state.lines = [];
    state.selectedRequest = null;
    $("paidAmount").value = "";
    $("purchaseNote").value = "";
    setMessage("");
    render();
  }

  function buildRequestPayload() {
    return {
      requesterName: $("requesterName").value.trim(),
      note: $("requestNote").value.trim(),
      items: state.lines.map(function (line) {
        return {
          itemType: line.itemType,
          itemId: line.itemId,
          name: line.name,
          unit: line.unit,
          requestedQty: numberValue(line.qty),
        };
      }),
    };
  }

  function createPurchaseRequest() {
    var payload = buildRequestPayload();
    if (!payload.items.length) {
      setRequestMessage("Vui lòng thêm hàng vào draft trước khi tạo yêu cầu.", "error");
      return;
    }
    var invalid = payload.items.find(function (item) { return numberValue(item.requestedQty) <= 0; });
    if (invalid) {
      setRequestMessage("Số lượng yêu cầu phải lớn hơn 0.", "error");
      return;
    }
    setRequestMessage("Đang lưu yêu cầu...");
    api("/purchase-requests", { method: "POST", body: payload })
      .then(function (data) {
        setRequestMessage("Đã lưu yêu cầu " + (data.id || "") + ".", "success");
        $("requestNote").value = "";
        state.lines = [];
        return loadRequests();
      })
      .catch(function (err) {
        setRequestMessage((err && err.message) || "Không thể lưu yêu cầu.", "error");
      })
      .finally(render);
  }

  function fulfillSelectedRequest(purchaseId) {
    if (!state.selectedRequest || !purchaseId) return Promise.resolve();
    return api("/purchase-requests", {
      method: "POST",
      body: {
        action: "fulfill",
        id: state.selectedRequest.id,
        purchaseId: purchaseId,
        fulfilledBy: selectedSupplier().name || "purchase-user",
      },
    }).then(loadRequests);
  }

  function savePurchase() {
    if (state.saving) return;
    var payload = buildPayload();
    var error = validatePayload(payload);
    if (error) {
      setMessage(error, "error");
      return;
    }
    state.saving = true;
    setMessage("Đang lưu phiếu nhập...");
    renderTotals();

    api("/purchases", { method: "POST", body: payload })
      .then(function (data) {
        setMessage("Đã lưu phiếu nhập " + (data.id || "") + ". Kho chính đã cập nhật.", "success");
        return fulfillSelectedRequest(data.id).then(function () { return data; });
      })
      .then(function () {
        state.lines = [];
        state.selectedRequest = null;
        $("paidAmount").value = "";
        return loadData(true);
      })
      .catch(function (err) {
        setMessage((err && err.message) || "Không thể lưu phiếu nhập.", "error");
      })
      .finally(function () {
        state.saving = false;
        render();
      });
  }

  function bindEvents() {
    document.querySelectorAll(".type-tab").forEach(function (button) {
      button.addEventListener("click", function () {
        state.itemType = button.dataset.type;
        state.search = "";
        $("itemSearch").value = "";
        render();
      });
    });
    $("itemSearch").addEventListener("input", function (event) {
      state.search = event.target.value;
      renderResults();
    });
    $("clearDraftBtn").addEventListener("click", resetDraft);
    $("savePurchaseBtn").addEventListener("click", savePurchase);
    $("createRequestBtn").addEventListener("click", createPurchaseRequest);
    $("refreshRequestsBtn").addEventListener("click", function () {
      loadRequests().then(render).catch(function (err) {
        setRequestMessage((err && err.message) || "Không tải được yêu cầu.", "error");
      });
    });
    $("supplierSelect").addEventListener("change", function () {
      var supplier = state.suppliers.find(function (item) { return item.id === $("supplierSelect").value; });
      if (supplier && !$("supplierName").value.trim()) $("supplierName").value = supplier.name;
    });
  }

  function loadData(quiet) {
    if (!quiet) setStatus("Đang tải data...");
    return Promise.all([
      api("/products?all=1"),
      api("/components"),
      api("/suppliers"),
      api("/purchase-requests?status=open"),
    ]).then(function (results) {
      state.products = (results[0].products || []).map(normalizeProduct);
      state.components = (results[1].components || []).map(normalizeComponent);
      state.suppliers = results[2].suppliers || [];
      state.requests = results[3].requests || [];
      renderSuppliers();
      setStatus("Đã nối kho chính");
      render();
    }).catch(function (err) {
      setStatus("Lỗi kết nối kho", "error");
      setMessage((err && err.message) || "Không tải được dữ liệu.", "error");
      render();
    });
  }

  function loadRequests() {
    return api("/purchase-requests?status=open").then(function (data) {
      state.requests = data.requests || [];
      if (state.selectedRequest) {
        var stillOpen = state.requests.some(function (request) {
          return request.id === state.selectedRequest.id;
        });
        if (!stillOpen) state.selectedRequest = null;
      }
      return data;
    });
  }

  function init() {
    bindEvents();
    render();
    loadData(false);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
