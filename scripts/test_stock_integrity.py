"""
Stock-column integrity audit.

Verifies that across EVERY operation (IN, OUT, SALE, ADJUST) the system
reads and writes the SAME stock column (inventory.qty_on_hand) and that
the sign of qty_change in stock_movements always matches the inventory
delta.

For each operation we:
  1. snapshot current stock
  2. perform the op via its real API
  3. read stock back
  4. check the new stock == snapshot + signed delta
  5. read the new stock_movements row and check qty_change == signed delta

If any sign or column is wrong, this catches it immediately.
"""
import json
import urllib.request
import urllib.error
import uuid

BASE = "https://shopprogram.pages.dev"
PID = "ORIA61003"   # use one stable product

def http(method, path, body=None):
    req = urllib.request.Request(
        BASE + path, method=method,
        headers={"Content-Type": "application/json", "User-Agent": "Audit/1.0"},
        data=json.dumps(body).encode() if body is not None else None,
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())


def stock_now():
    code, data = http("GET", "/api/products")
    p = next(x for x in data["products"] if x["id"] == PID)
    return int(p["stock"])


def latest_movement():
    code, data = http("GET", f"/api/inventory/movements?productId={PID}&limit=1")
    return data["movements"][0] if data["movements"] else None


def check(name, expected, actual):
    ok = expected == actual
    print(f"  [{('OK  ' if ok else 'FAIL')}] {name}  expected={expected}  actual={actual}")
    return ok


def assert_movement(op_label, expected_type, expected_qty_change):
    mv = latest_movement()
    okt = check(f"  movement_type == {expected_type}", expected_type, mv["movement_type"])
    okq = check(f"  qty_change == {expected_qty_change}", expected_qty_change, mv["qty_change"])
    return okt and okq


def section(t):
    print()
    print("=" * 70)
    print(t)
    print("=" * 70)


passed = 0
total = 0


def step(label, fn):
    global passed, total
    total += 1
    if fn():
        passed += 1
    else:
        print(f"  ★ FAILED: {label}")


# Bootstrap: reset to 0
http("POST", "/api/inventory/adjust",
     {"clientOpId": str(uuid.uuid4()), "productId": PID, "newQty": 0})
print(f"Start: {PID} stock = {stock_now()}")


# =====================================================================
section("1. PURCHASE (IN) — +qty into inventory + positive movement")
before = stock_now()
http("POST", "/api/purchases", {
    "clientOpId": str(uuid.uuid4()),
    "supplierName": "Audit",
    "items": [{"productId": PID, "qty": 10, "unitCost": 5000}],
})
after = stock_now()
step("1.1 inventory.qty_on_hand += 10", lambda: check("stock after IN", before + 10, after))
step("1.2 stock_movements IN +10", lambda: assert_movement("IN", "IN", 10))

# =====================================================================
section("2. SALE — -qty out of inventory + negative movement")
before = stock_now()
http("POST", "/api/sales", {
    "clientOpId": str(uuid.uuid4()),
    "items": [{"productId": PID, "productName": "test", "qty": 3,
               "unitPrice": 12000, "lineTotal": 36000}],
    "paid": 40000,
})
after = stock_now()
step("2.1 inventory.qty_on_hand -= 3", lambda: check("stock after SALE", before - 3, after))
step("2.2 stock_movements SALE -3", lambda: assert_movement("SALE", "SALE", -3))

# =====================================================================
section("3. ISSUE (OUT) — -qty out of inventory + negative movement")
before = stock_now()
http("POST", "/api/issues", {
    "clientOpId": str(uuid.uuid4()),
    "reason": "damaged",
    "items": [{"productId": PID, "qty": 2}],
})
after = stock_now()
step("3.1 inventory.qty_on_hand -= 2", lambda: check("stock after OUT", before - 2, after))
step("3.2 stock_movements OUT -2", lambda: assert_movement("OUT", "OUT", -2))

# =====================================================================
section("4. ADJUST UP — absolute newQty creates positive delta")
before = stock_now()
http("POST", "/api/inventory/adjust",
     {"clientOpId": str(uuid.uuid4()), "productId": PID, "newQty": before + 7})
after = stock_now()
step("4.1 inventory.qty_on_hand = newQty", lambda: check("stock after ADJUST+7", before + 7, after))
step("4.2 stock_movements ADJUST +7", lambda: assert_movement("ADJUST", "ADJUST", 7))

# =====================================================================
section("5. ADJUST DOWN — absolute newQty creates negative delta")
before = stock_now()
http("POST", "/api/inventory/adjust",
     {"clientOpId": str(uuid.uuid4()), "productId": PID, "newQty": before - 4})
after = stock_now()
step("5.1 inventory.qty_on_hand = newQty", lambda: check("stock after ADJUST-4", before - 4, after))
step("5.2 stock_movements ADJUST -4", lambda: assert_movement("ADJUST", "ADJUST", -4))

# =====================================================================
section("6. LEDGER INTEGRITY — replaying all movements equals current stock")
code, all_moves = http("GET", f"/api/inventory/movements?productId={PID}&limit=1000")
replay = sum(int(m["qty_change"]) for m in all_moves["movements"])
current = stock_now()
step("6.1 sum(qty_change) == current qty_on_hand",
     lambda: check("ledger sum", current, replay))

# =====================================================================
section("7. NO PHANTOM products.stock COLUMN")
# Verify products endpoint never returns a column other than stock for qty
code, p_data = http("GET", "/api/products")
p = next(x for x in p_data["products"] if x["id"] == PID)
fields = set(p.keys())
step("7.1 'stock' is the ONLY qty-like field in product response",
     lambda: check("qty fields", {"stock", "minStock"}, {f for f in fields if f.lower() in ("stock", "minstock", "qty", "qty_on_hand", "qtyonhand")}))

# Cleanup
http("POST", "/api/inventory/adjust",
     {"clientOpId": str(uuid.uuid4()), "productId": PID, "newQty": 0})

section("SUMMARY")
print(f"  {passed}/{total} PASSED")
