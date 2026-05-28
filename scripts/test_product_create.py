"""
E2E test for product creation + ID editing.

Verifies the full flow that the user just asked about:
  1. POST /api/products with a custom ID stores it as products.id
  2. POST /api/products with a duplicate ID does NOT silently overwrite
     (treats as upsert — but check that name+price update correctly)
  3. Server returns new ID on auto-generation
  4. Inventory row gets created automatically with qty=0
  5. SKU code separate from ID — can update SKU without touching ID
  6. Soft-delete preserves the row
"""
import json
import urllib.request
import urllib.error
import uuid

BASE = "https://shopprogram.pages.dev"
PASSED = []
FAILED = []


def http(method, path, body=None):
    req = urllib.request.Request(
        BASE + path, method=method,
        headers={"Content-Type": "application/json", "User-Agent": "ProdTest/1.0"},
        data=json.dumps(body).encode() if body is not None else None,
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())


def check(name, ok, detail=""):
    if ok:
        print(f"  [OK]   {name}  {detail}")
        PASSED.append(name)
    else:
        print(f"  [FAIL] {name}  {detail}")
        FAILED.append((name, detail))


def section(t):
    print()
    print("=" * 70)
    print(t)
    print("=" * 70)


def get_product(pid):
    code, data = http("GET", "/api/products?all=1")
    return next((p for p in data["products"] if p["id"] == pid), None)


# Test IDs we'll use (idempotent — script can re-run safely)
TEST_ID_1 = "TEST-PRODUCT-001"
TEST_ID_2 = "TEST-PRODUCT-002"
TEST_ID_3 = "ORIA61099"  # ORIA-style custom
ALL_TEST_IDS = [TEST_ID_1, TEST_ID_2, TEST_ID_3]

# Cleanup any leftovers
for pid in ALL_TEST_IDS:
    http("DELETE", f"/api/products/{pid}")


# ===================================================================
section("1. CREATE product with EXPLICIT custom ID")
code, resp = http("POST", "/api/products", {
    "clientOpId": str(uuid.uuid4()),
    "id": TEST_ID_1,
    "name": "Test Sản Phẩm Mới #1",
    "category": "snacks",
    "price": 25000,
    "barcode": "TEST-001",
    "image": "🍪",
    "description": "Test description",
    "minStock": 5,
    "unit": "Gói",
    "skuCode": TEST_ID_1,
})
check("1.1 POST returns 200", code == 200 and resp.get("ok"), f"resp={resp}")
check("1.2 Server uses our custom ID", resp.get("id") == TEST_ID_1, f"got id={resp.get('id')}")

p = get_product(TEST_ID_1)
check("1.3 Product visible in /api/products", p is not None)
check("1.4 Name persisted", p and p["name"] == "Test Sản Phẩm Mới #1")
check("1.5 Price persisted", p and p["price"] == 25000)
check("1.6 minStock persisted", p and p["minStock"] == 5)
check("1.7 unit persisted", p and p["unit"] == "Gói")
check("1.8 SKU code persisted", p and p["skuCode"] == TEST_ID_1)
check("1.9 Inventory row auto-created with qty=0", p and p["stock"] == 0)


# ===================================================================
section("2. UPSERT same ID — updates fields, keeps ID")
code, resp = http("POST", "/api/products", {
    "clientOpId": str(uuid.uuid4()),
    "id": TEST_ID_1,
    "name": "Test Sản Phẩm Mới #1 (đã sửa)",
    "category": "snacks",
    "price": 30000,
    "barcode": "TEST-001",
    "image": "🍪",
    "minStock": 10,
    "unit": "Hộp",
    "skuCode": "NEW-SKU-001",
})
check("2.1 Upsert returns 200", code == 200, f"resp={resp}")

p = get_product(TEST_ID_1)
check("2.2 ID unchanged after upsert", p and p["id"] == TEST_ID_1)
check("2.3 Name updated", p and p["name"] == "Test Sản Phẩm Mới #1 (đã sửa)")
check("2.4 Price updated", p and p["price"] == 30000)
check("2.5 minStock updated", p and p["minStock"] == 10)
check("2.6 unit updated", p and p["unit"] == "Hộp")
check("2.7 SKU code can change independently", p and p["skuCode"] == "NEW-SKU-001")


# ===================================================================
section("3. CREATE product without explicit ID — server auto-generates")
code, resp = http("POST", "/api/products", {
    "clientOpId": str(uuid.uuid4()),
    # no "id"
    "name": "Auto-gen test",
    "category": "snacks",
    "price": 10000,
})
auto_id = resp.get("id")
check("3.1 Server returns generated id", bool(auto_id) and auto_id.startswith("p-"), f"id={auto_id}")
p = get_product(auto_id)
check("3.2 Auto-id product visible", p is not None)

# Cleanup
http("DELETE", f"/api/products/{auto_id}")


# ===================================================================
section("4. CREATE multiple products with different ORIA IDs")
for code_num in [99, 98, 97]:
    pid = f"ORIA610{code_num}"
    http("DELETE", f"/api/products/{pid}")  # cleanup first
    code, resp = http("POST", "/api/products", {
        "clientOpId": str(uuid.uuid4()),
        "id": pid,
        "name": f"Bulk test {code_num}",
        "category": "snacks",
        "price": 1000 * code_num,
        "skuCode": pid,
    })
    check(f"4.{code_num} Created {pid}", code == 200 and resp.get("id") == pid)

# Verify all 3 exist
code, all_data = http("GET", "/api/products?all=1")
created_oria = [p for p in all_data["products"] if p["id"] in ("ORIA61097", "ORIA61098", "ORIA61099")]
check("4.4 All 3 ORIA test products exist", len(created_oria) == 3)


# ===================================================================
section("5. DELETE (soft) — product disappears from default /api/products")
http("DELETE", f"/api/products/{TEST_ID_1}")
code, data = http("GET", "/api/products")
still_visible = next((p for p in data["products"] if p["id"] == TEST_ID_1), None)
check("5.1 Soft-deleted product hidden from /api/products", still_visible is None)
# But should still exist if we ask for all
code, data_all = http("GET", "/api/products?all=1")
still_in_all = next((p for p in data_all["products"] if p["id"] == TEST_ID_1), None)
check("5.2 Still in DB if ?all=1", still_in_all is not None and still_in_all["isActive"] is False)


# ===================================================================
section("6. ID with various character sets")
edge_cases = [
    ("VALID-DASH-001", True),
    ("VALID_UNDER_002", True),
    ("ORIA61234567", True),  # long but valid chars
    ("123ONLY-NUMERIC", True),
]
for pid, should_pass in edge_cases:
    http("DELETE", f"/api/products/{pid}")
    code, resp = http("POST", "/api/products", {
        "clientOpId": str(uuid.uuid4()),
        "id": pid, "name": f"Edge case {pid}", "category": "snacks",
        "price": 1000,
    })
    saved = get_product(pid)
    check(f"6.x ID '{pid}' saved", saved is not None and saved["id"] == pid)
    http("DELETE", f"/api/products/{pid}")


# ===================================================================
section("7. CLEANUP")
for pid in ALL_TEST_IDS + ["ORIA61097", "ORIA61098", "ORIA61099"]:
    http("DELETE", f"/api/products/{pid}")
print("  cleaned up all test products")

# ===================================================================
section("SUMMARY")
print(f"  PASSED: {len(PASSED)}/{len(PASSED) + len(FAILED)}")
if FAILED:
    print()
    print("  FAILURES:")
    for name, det in FAILED:
        print(f"    - {name}  ({det})")
