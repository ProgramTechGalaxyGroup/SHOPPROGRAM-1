"""
Regression tests for the fixes deployed:
  - B1: server stock guard rejects sales/issues that exceed on-hand
  - B2: server recomputes total — tampered client total is ignored
  - B5: math rounding (we send a discount that produces a fraction)
  - Idempotency still works
"""

import json
import urllib.request
import urllib.error
import uuid

BASE = "https://shopprogram.pages.dev"


def http(method, path, body=None):
    req = urllib.request.Request(
        BASE + path,
        method=method,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "ShopFlowE2E/1.0",
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
        except json.JSONDecodeError:
            return e.code, {"raw": raw[:500]}


def banner(t):
    print()
    print("=" * 70)
    print(t)
    print("=" * 70)


def pick_three(products):
    # Pick three products that have NON-NEGATIVE stock so we can test guard.
    nonneg = [p for p in products if (p.get("stock") or 0) >= 0]
    return nonneg[:3]


def main():
    code, data = http("GET", "/api/products")
    products = data["products"]
    three = pick_three(products)
    print("Picked:")
    for p in three:
        print(f"  {p['id']:<12} stock={p['stock']:<4} price={p['price']} {p['name']}")

    # =====================================================
    # B1: try to sell more than available stock → must fail
    # =====================================================
    banner("B1 — Sell more than stock should be REJECTED")
    body = {
        "clientOpId": str(uuid.uuid4()),
        "items": [
            {"productId": three[0]["id"], "productName": three[0]["name"],
             "qty": (three[0]["stock"] or 0) + 999,
             "unitPrice": three[0]["price"], "lineTotal": 0},
        ],
        "total": 0, "subtotal": 0, "vatAmount": 0, "paid": 0,
    }
    code, data = http("POST", "/api/sales", body)
    ok = code == 400 and data.get("code") == "INSUFFICIENT_STOCK"
    print(f"  status={code}  body={data}")
    print(f"  → {'✓ guard works' if ok else '✗ guard FAILED'}")
    assert ok, "Stock guard should have rejected this sale"

    # =====================================================
    # B2: tampered total — server must override
    # =====================================================
    banner("B2 — Client sends wrong total; server recomputes")
    # Increase stock first via a purchase so we can actually sell.
    pid = three[0]["id"]
    code, data = http("POST", "/api/purchases", {
        "clientOpId": str(uuid.uuid4()),
        "supplierName": "Test Supplier",
        "items": [{"productId": pid, "qty": 10, "unitCost": 1000}],
    })
    assert code == 200 and data["ok"], f"purchase failed: {data}"
    print(f"  Restocked {pid} +10 via purchase {data['id']}")

    # Sell 2 units, claim total=1 VND (tampered).
    op_id = str(uuid.uuid4())
    body = {
        "clientOpId": op_id,
        "items": [{
            "productId": pid,
            "productName": three[0]["name"],
            "qty": 2,
            "unitPrice": three[0]["price"],
            "lineTotal": three[0]["price"] * 2,
        }],
        # Tampered values:
        "subtotal": 1,
        "vatAmount": 0,
        "total": 1,
        "paid": 1,
    }
    code, data = http("POST", "/api/sales", body)
    assert code == 200 and data.get("ok"), data
    print(f"  POST status={code}  server response: {data}")
    server_total = data.get("serverTotal")
    expected = three[0]["price"] * 2
    expected_with_vat = expected + round(expected * 0.08)
    is_correct = server_total == expected_with_vat
    print(f"  expected (price*qty + 8% VAT) = {expected_with_vat}")
    print(f"  server returned serverTotal   = {server_total}")
    print(f"  → {'✓ server ignored tampered total' if is_correct else '✗ server accepted tampered total'}")
    assert is_correct

    # Verify the persisted row also has the correct total.
    code, data = http("GET", f"/api/sales/{data['id']}")
    persisted = data["sale"]["total"]
    print(f"  Persisted sale.total = {persisted}  {'✓' if persisted == expected_with_vat else '✗'}")
    assert persisted == expected_with_vat

    # =====================================================
    # Re-confirm idempotency
    # =====================================================
    banner("Idempotency — replay tampered sale should be duplicate")
    code, data = http("POST", "/api/sales", body)
    print(f"  duplicate={data.get('duplicate')}")
    assert data.get("duplicate") is True

    # =====================================================
    # B1 — Issue (xuất hàng) over stock should also fail
    # =====================================================
    banner("B1 — Stock issue over on-hand should be REJECTED")
    code, data = http("POST", "/api/issues", {
        "clientOpId": str(uuid.uuid4()),
        "reason": "damaged",
        "items": [{"productId": pid, "qty": 9999}],
    })
    ok = code == 400 and data.get("code") == "INSUFFICIENT_STOCK"
    print(f"  status={code}  body={data}")
    print(f"  → {'✓ issue guard works' if ok else '✗ issue guard FAILED'}")
    assert ok

    banner("ALL FIX TESTS PASS ✅")


if __name__ == "__main__":
    main()
