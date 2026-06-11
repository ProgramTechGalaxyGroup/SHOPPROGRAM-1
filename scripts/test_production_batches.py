#!/usr/bin/env python3
"""Manual smoke tests for Production/Prep Batch.

Usage:
  RUN_PRODUCTION_BATCH_TEST=1 BASE_URL=https://shopprogram.pages.dev python3 scripts/test_production_batches.py

The guard env var is intentional: this test creates test components,
production recipes, and production batches in the target database.
"""

import json
import os
import time
import urllib.error
import urllib.request


BASE_URL = os.environ.get("BASE_URL", "http://localhost:8788").rstrip("/")


def request(path, method="GET", payload=None):
    data = None
    headers = {}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(BASE_URL + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        body = err.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = {"error": body}
        return err.code, parsed


def assert_ok(path, method="GET", payload=None):
    status, body = request(path, method, payload)
    assert status < 300 and body.get("ok") is True, (path, status, body)
    return body


def main():
    if os.environ.get("RUN_PRODUCTION_BATCH_TEST") != "1":
        raise SystemExit("Set RUN_PRODUCTION_BATCH_TEST=1 to run because this creates database rows.")

    suffix = str(int(time.time()))
    sugar_raw = f"TEST_SUGAR_RAW_{suffix}"
    sugar_syrup = f"TEST_SUGAR_SYRUP_{suffix}"
    recipe_id = f"TEST_SYRUP_RECIPE_{suffix}"

    assert_ok("/api/components", "POST", {
        "id": sugar_raw,
        "label": "Test Raw Sugar",
        "unit": "gram",
        "itemType": "raw_material",
        "stockQty": 1000,
        "costPerUnit": 10,
        "minStock": 0,
    })
    assert_ok("/api/components", "POST", {
        "id": sugar_syrup,
        "label": "Test Sugar Syrup",
        "unit": "ml",
        "itemType": "semi_finished",
        "stockQty": 0,
        "costPerUnit": 0,
        "minStock": 0,
    })
    assert_ok("/api/production-recipes", "POST", {
        "id": recipe_id,
        "name": "Test Sugar Syrup",
        "outputComponentId": sugar_syrup,
        "plannedOutputQty": 1600,
        "outputUnit": "ml",
        "inputs": [{"componentId": sugar_raw, "qty": 1000, "unit": "gram"}],
    })
    batch = assert_ok("/api/production-batches", "POST", {
        "productionRecipeId": recipe_id,
        "actualOutputQuantity": 1600,
        "note": "manual smoke test",
        "clientOpId": f"test-production-{suffix}",
    })
    assert batch["actualOutputQty"] == 1600
    assert batch["totalInputCost"] == 10000
    assert batch["actualCostPerUnit"] == 6

    status, insufficient = request("/api/production-batches", "POST", {
        "productionRecipeId": recipe_id,
        "actualOutputQuantity": 1600,
        "note": "should fail, raw sugar consumed",
        "clientOpId": f"test-production-fail-{suffix}",
    })
    assert status == 400 and insufficient.get("code") == "INSUFFICIENT_COMPONENT_STOCK", insufficient
    print(json.dumps({"ok": True, "batchId": batch["id"], "failedAsExpected": True}, ensure_ascii=False))


if __name__ == "__main__":
    main()
