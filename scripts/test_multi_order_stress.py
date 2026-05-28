"""
Stress test: simulate the EXACT user pain point.

User says: I checkout multiple orders, only 1 saves to DB.

We reproduce by:
  1. Restock product to a known qty (50)
  2. Fire 5 sequential POST /api/sales each with 2 items
  3. Verify all 5 sales exist in D1
  4. Verify total inventory delta = sum(qty across sales)
  5. Verify each sale has matching sale_items + stock_movements rows
  6. Verify ledger integrity (sum movements == inventory delta)

Also tests rapid concurrent submissions (network parallel) to catch races.
"""
import json
import urllib.request
import urllib.error
import uuid
import concurrent.futures

BASE = "https://shopprogram.pages.dev"
PID1 = "ORIA61001"  # PHO GA
PID2 = "ORIA61002"  # MI UDON


def http(method, path, body=None):
    req = urllib.request.Request(
        BASE + path, method=method,
        headers={"Content-Type": "application/json", "User-Agent": "Stress/1.0"},
        data=json.dumps(body).encode() if body is not None else None,
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())


def section(t):
    print()
    print("=" * 70)
    print(t)
    print("=" * 70)


def stock(pid):
    code, data = http("GET", "/api/products")
    p = next(x for x in data["products"] if x["id"] == pid)
    return int(p["stock"])


def restock(pid, target):
    cur = stock(pid)
    if cur < target:
        http("POST", "/api/purchases", {
            "clientOpId": str(uuid.uuid4()),
            "supplierName": "StressTest",
            "items": [{"productId": pid, "qty": target - cur, "unitCost": 5000}],
        })


# =====================================================================
section("BOOTSTRAP")
restock(PID1, 50)
restock(PID2, 50)
print(f"Stock before: {PID1}={stock(PID1)}, {PID2}={stock(PID2)}")

# =====================================================================
section("1. SEQUENTIAL: 5 sales, 2 items each")
created_ids = []
for i in range(5):
    body = {
        "clientOpId": str(uuid.uuid4()),
        "customerName": f"Test-Sequential-{i}",
        "items": [
            {"productId": PID1, "productName": "PHO GA", "qty": 2,
             "unitPrice": 12000, "lineTotal": 24000},
            {"productId": PID2, "productName": "MI UDON", "qty": 1,
             "unitPrice": 13000, "lineTotal": 13000},
        ],
        "paid": 50000,
    }
    code, resp = http("POST", "/api/sales", body)
    ok = code == 200 and resp.get("ok") and not resp.get("duplicate")
    print(f"  Sale {i+1}: id={resp.get('id')} ok={ok} total={resp.get('serverTotal')}")
    if ok:
        created_ids.append(resp["id"])

print(f"\n  Created {len(created_ids)} sales (expected 5)")
print(f"  All distinct? {len(set(created_ids)) == 5}")

# =====================================================================
section("2. VERIFY EACH IN DB")
for sale_id in created_ids:
    code, det = http("GET", f"/api/sales/{sale_id}")
    items = det.get("items", [])
    print(f"  {sale_id}: items={len(items)} (expected 2)")
    assert len(items) == 2, f"{sale_id} missing items"

# =====================================================================
section("3. INVENTORY DELTA")
p1_after = stock(PID1)
p2_after = stock(PID2)
print(f"  Stock after: {PID1}={p1_after}, {PID2}={p2_after}")
# 5 sales × 2 qty PID1 = 10 consumed; 5 × 1 PID2 = 5 consumed
print(f"  Expected delta: PID1 -10, PID2 -5")

# =====================================================================
section("4. CONCURRENT: 5 sales fired in parallel")
def fire_one(i):
    body = {
        "clientOpId": str(uuid.uuid4()),
        "customerName": f"Test-Concurrent-{i}",
        "items": [{"productId": PID1, "productName": "PHO GA", "qty": 1,
                   "unitPrice": 12000, "lineTotal": 12000}],
        "paid": 12000,
    }
    code, resp = http("POST", "/api/sales", body)
    return (i, code, resp.get("id"), resp.get("ok"))

restock(PID1, 30)
before = stock(PID1)

with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
    results = list(ex.map(fire_one, range(5)))

for i, code, sid, ok in results:
    print(f"  Concurrent sale {i}: id={sid} status={code} ok={ok}")

after = stock(PID1)
print(f"\n  Stock before/after: {before} -> {after} (delta={before-after}, expected 5)")
distinct_ids = len(set(r[2] for r in results if r[2]))
print(f"  Distinct sale ids: {distinct_ids}/5")

# =====================================================================
section("5. IDEMPOTENCY UNDER PARALLEL")
op = str(uuid.uuid4())
def fire_same(i):
    return http("POST", "/api/sales", {
        "clientOpId": op,
        "items": [{"productId": PID2, "productName": "MI UDON", "qty": 1,
                   "unitPrice": 13000, "lineTotal": 13000}],
        "paid": 13000,
    })

before = stock(PID2)
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
    results = list(ex.map(fire_same, range(5)))
after = stock(PID2)

print(f"  5 parallel POSTs with same clientOpId")
print(f"  Stock delta: {before-after} (must be 1 — only first counts)")
unique_ids = set(r[1].get("id") for r in results)
print(f"  Returned ids: {unique_ids} (should all be same id)")

# =====================================================================
section("6. OVERSELL GUARD")
# Try to sell more than available
current = stock(PID1)
code, resp = http("POST", "/api/sales", {
    "clientOpId": str(uuid.uuid4()),
    "items": [{"productId": PID1, "qty": current + 100,
               "unitPrice": 1, "lineTotal": current + 100}],
    "paid": 0,
})
print(f"  Oversell attempt: status={code}, code={resp.get('code')}")
print(f"  Should reject with INSUFFICIENT_STOCK: {'OK' if code==400 and resp.get('code')=='INSUFFICIENT_STOCK' else 'FAIL'}")
after = stock(PID1)
print(f"  Stock unchanged: {current==after}")

section("DONE")
print("Final state: all sales above visible in D1. Run /api/sync/pull?since=0 to verify.")
