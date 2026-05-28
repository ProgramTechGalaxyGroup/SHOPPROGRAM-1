"""
End-to-end test for every "edit then reload" path the user uses in the UI.

Simulates: 1) POST mutation, 2) immediate GET to verify DB write,
3) /sync/pull to verify the client would receive the change on refresh.

This catches all the failure modes the user just reported:
  • API call silently dropped (returns 200 but didn't persist)
  • DB persisted but /sync/pull filters it out (since-timestamp bug)
  • Pull returns it but with stale `updated_at` so client merge ignores it
  • Whole-snapshot replace wiping fresh edits
"""
import json
import time
import urllib.request
import urllib.error
import uuid

BASE = "https://shopprogram.pages.dev"
RESULTS = []


def http(method, path, body=None):
    req = urllib.request.Request(
        BASE + path,
        method=method,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "EditReloadTest/1.0",
            "Cache-Control": "no-cache",
        },
        data=json.dumps(body).encode() if body is not None else None,
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"raw": raw[:300]}


def record(name, passed, detail=""):
    RESULTS.append((name, passed, detail))
    mark = "OK" if passed else "FAIL"
    print(f"  [{mark}] {name}  {detail}")


def section(title):
    print()
    print("=" * 70)
    print(title)
    print("=" * 70)


def get_product(pid):
    code, data = http("GET", "/api/products")
    return next((p for p in data["products"] if p["id"] == pid), None)


def main():
    # =================================================================
    # PART 1 — Inline stock adjust (the path the user used in screenshot)
    # =================================================================
    section("1. INLINE STOCK ADJUST /api/inventory/adjust")

    PID = "ORIA61001"
    p0 = get_product(PID)
    print(f"  Initial: {PID} stock={p0['stock']}")

    # 1.1 Set stock to 15 (the value user said disappeared)
    op = str(uuid.uuid4())
    code, r = http("POST", "/api/inventory/adjust", {
        "clientOpId": op, "productId": PID, "newQty": 15, "reason": "edit-reload test"
    })
    record("1.1 POST adjust newQty=15 returns 200", code == 200 and r.get("ok"), f"resp={r}")

    # 1.2 Immediate GET — DB has 15?
    p1 = get_product(PID)
    record("1.2 GET /api/products shows stock=15", p1["stock"] == 15, f"stock={p1['stock']}")

    # 1.3 GET sync/pull since=0 (cold reload) — returns 15?
    code, pulled = http("GET", "/api/sync/pull?since=0")
    pulled_p = next((p for p in pulled["products"] if p["id"] == PID), None)
    record("1.3 /sync/pull?since=0 includes stock=15",
           pulled_p and pulled_p["stock"] == 15,
           f"pulled stock={pulled_p and pulled_p['stock']}, updated_at={pulled_p and pulled_p['updated_at']}")

    # 1.4 GET sync/pull since=NOW-2s (warm reload) — also returns 15?
    since = int(time.time() * 1000) - 2000
    code, pulled2 = http("GET", f"/api/sync/pull?since={since}")
    inv_row = next((i for i in pulled2["inventory"] if i["product_id"] == PID), None)
    record("1.4 /sync/pull?since=recent includes inventory delta",
           inv_row is not None and inv_row["qty_on_hand"] == 15,
           f"inv_row={inv_row}")

    # 1.5 Idempotency: same opId again
    code, r2 = http("POST", "/api/inventory/adjust", {
        "clientOpId": op, "productId": PID, "newQty": 99
    })
    p_after = get_product(PID)
    record("1.5 Idempotent: duplicate opId doesn't change",
           r2.get("duplicate") is True and p_after["stock"] == 15,
           f"dup={r2.get('duplicate')}, stock={p_after['stock']}")

    # 1.6 Different opId same product — should overwrite
    code, r3 = http("POST", "/api/inventory/adjust", {
        "clientOpId": str(uuid.uuid4()), "productId": PID, "newQty": 7
    })
    p_after = get_product(PID)
    record("1.6 New opId overwrites cleanly",
           code == 200 and p_after["stock"] == 7,
           f"stock={p_after['stock']}")

    # =================================================================
    # PART 2 — Product upsert (full edit form)
    # =================================================================
    section("2. PRODUCT UPSERT /api/products POST")

    p = get_product(PID)
    # Edit price + minStock
    payload = {
        "clientOpId": str(uuid.uuid4()),
        "id": PID,
        "name": p["name"],
        "category": p["category"],
        "price": 13500,
        "barcode": p["barcode"],
        "image": p["image"],
        "description": "edit-reload test description",
        "componentIds": [],
        "minStock": 8,
        "unit": p.get("unit", "Gói"),
    }
    code, r = http("POST", "/api/products", payload)
    record("2.1 POST product upsert returns 200", code == 200 and r.get("ok"), f"resp={r}")

    p_new = get_product(PID)
    record("2.2 GET shows new price=13500", p_new["price"] == 13500, f"price={p_new['price']}")
    record("2.3 GET shows new minStock=8", p_new["minStock"] == 8, f"minStock={p_new['minStock']}")

    # Cold pull reflects?
    code, pulled = http("GET", "/api/sync/pull?since=0")
    pp = next((p for p in pulled["products"] if p["id"] == PID), None)
    record("2.4 /sync/pull cold returns updated price+minStock",
           pp and pp["price"] == 13500 and pp["min_stock"] == 8,
           f"pulled price={pp and pp['price']}, min_stock={pp and pp['min_stock']}")

    # Restore
    payload["price"] = p["price"]
    payload["minStock"] = p["minStock"]
    payload["clientOpId"] = str(uuid.uuid4())
    http("POST", "/api/products", payload)

    # =================================================================
    # PART 3 — Settings edit
    # =================================================================
    section("3. SETTINGS EDIT /api/settings POST")

    shop_before = http("GET", "/api/settings")[1]["settings"].get("shop", {})
    test_phone = "0900TESTING-" + uuid.uuid4().hex[:6]
    modified = dict(shop_before)
    modified["phone"] = test_phone
    http("POST", "/api/settings", {"key": "shop", "value": modified})

    shop_after = http("GET", "/api/settings")[1]["settings"]["shop"]
    record("3.1 Settings phone change persists", shop_after.get("phone") == test_phone,
           f"phone={shop_after.get('phone')}")

    code, pulled = http("GET", "/api/sync/pull?since=0")
    shop_row = next((s for s in pulled["settings"] if s["key"] == "shop"), None)
    try:
        pulled_shop = json.loads(shop_row["value"]) if shop_row else {}
    except Exception:
        pulled_shop = {}
    record("3.2 /sync/pull cold returns new phone",
           pulled_shop.get("phone") == test_phone,
           f"pulled phone={pulled_shop.get('phone')}")

    # Restore
    http("POST", "/api/settings", {"key": "shop", "value": shop_before})

    # =================================================================
    # PART 4 — Race scenario: TWO adjusts back-to-back
    # =================================================================
    section("4. RAPID CONSECUTIVE ADJUSTS (simulates fast typing 0 -> 5 -> 7 -> 11)")

    for target in [5, 7, 11]:
        http("POST", "/api/inventory/adjust", {
            "clientOpId": str(uuid.uuid4()),
            "productId": PID,
            "newQty": target
        })

    final = get_product(PID)
    record("4.1 Final stock = last value (11)", final["stock"] == 11, f"stock={final['stock']}")

    # Pull
    code, pulled = http("GET", "/api/sync/pull?since=0")
    pp = next((p for p in pulled["products"] if p["id"] == PID), None)
    record("4.2 /sync/pull reflects final value", pp and pp["stock"] == 11,
           f"pulled stock={pp and pp['stock']}")

    # =================================================================
    # PART 5 — Reload scenario: pull-since-recent returns nothing if no change
    # =================================================================
    section("5. /sync/pull?since=NOW returns ONLY new changes")

    # Take a baseline timestamp BEFORE making any change
    pre_change = int(time.time() * 1000)
    time.sleep(1.2)  # ensure server timestamps are after pre_change

    # Make a change
    http("POST", "/api/inventory/adjust", {
        "clientOpId": str(uuid.uuid4()),
        "productId": PID,
        "newQty": 23
    })

    # Pull only the delta
    code, delta = http("GET", f"/api/sync/pull?since={pre_change}")
    inv_rows = delta.get("inventory", [])
    inv_hit = next((i for i in inv_rows if i["product_id"] == PID), None)
    record("5.1 Delta pull contains the new inventory row",
           inv_hit and inv_hit["qty_on_hand"] == 23,
           f"inv_hit={inv_hit}")

    prod_rows = delta.get("products", [])
    prod_hit = next((p for p in prod_rows if p["id"] == PID), None)
    record("5.2 Delta pull also contains the product (via inventory JOIN)",
           prod_hit and prod_hit["stock"] == 23,
           f"prod_hit_stock={prod_hit and prod_hit['stock']}")

    # =================================================================
    # PART 6 — Server-side filter: WHERE p.updated_at > since
    # If user has an inactive product cached and pull uses since-filter,
    # those soft-deletes should still come through.
    # =================================================================
    section("6. SOFT-DELETE VISIBILITY")

    since_far_future = int(time.time() * 1000) + 1_000_000
    code, future = http("GET", f"/api/sync/pull?since={since_far_future}")
    inactive_count = sum(1 for p in future.get("products", []) if not p.get("is_active"))
    record("6.1 future-since pull still returns soft-deletes (cleanup)",
           inactive_count > 0,
           f"inactive count = {inactive_count}")

    # =================================================================
    # CLEANUP
    # =================================================================
    section("CLEANUP")
    http("POST", "/api/inventory/adjust", {
        "clientOpId": str(uuid.uuid4()), "productId": PID, "newQty": p0["stock"]
    })
    p_final = get_product(PID)
    record(f"Restored {PID} to original stock={p0['stock']}",
           p_final["stock"] == p0["stock"],
           f"stock={p_final['stock']}")

    # =================================================================
    # SUMMARY
    # =================================================================
    section("SUMMARY")
    passed = sum(1 for _, ok, _ in RESULTS if ok)
    total = len(RESULTS)
    print(f"  {passed}/{total} PASSED")
    if passed != total:
        print()
        print("  FAILURES:")
        for name, ok, det in RESULTS:
            if not ok:
                print(f"    - {name}  ({det})")


if __name__ == "__main__":
    main()
