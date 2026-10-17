#!/usr/bin/env python3
"""Deployment and Reproducibility Smoke Check CLI.

Verifies server liveness, subsystem readiness, database connectivity,
canonical schema inspection, dataset readiness reporting, and fail-closed
scientific security gates for Phase 11.
"""

import argparse
import json
import sys
import time
from typing import Any, Dict, List, Tuple


def run_smoke_checks_against_url(base_url: str) -> bool:
    """Runs smoke checks against a live running backend server via HTTP."""
    try:
        import httpx
    except ImportError:
        import urllib.request
        import urllib.error

    print(f"\n=======================================================")
    print(f" FLYASH INTEL - DEPLOYMENT SMOKE CHECK RUNNER")
    print(f" Target URL: {base_url}")
    print(f"=======================================================\n")

    checks: List[Tuple[str, str, int, str, Dict[str, Any]]] = [
        ("Process Liveness", f"{base_url}/api/health", 200, "GET", {}),
        ("Subsystem Readiness", f"{base_url}/api/ready", 200, "GET", {}),
        ("Canonical Schema Metadata", f"{base_url}/api/schema", 200, "GET", {}),
        ("Dataset Readiness Diagnostics", f"{base_url}/api/datasets/readiness", 200, "GET", {}),
        ("Paper Registry Access", f"{base_url}/api/papers", 200, "GET", {}),
        ("Record Registry Access", f"{base_url}/api/records", 200, "GET", {}),
        (
            "Fail-Closed Training Gate",
            f"{base_url}/api/models/train",
            422,
            "POST",
            {"target_property": "compressive_strength_mpa"},
        ),
        (
            "Fail-Closed Prediction Gate",
            f"{base_url}/api/models/predict",
            503,
            "POST",
            {"fly_ash_fraction": 0.5, "lime_fraction": 0.1, "sand_fraction": 0.4},
        ),
        (
            "Fail-Closed Optimization Gate",
            f"{base_url}/api/optimization/run",
            503,
            "POST",
            {
                "material_system": "fly_ash_lime_gypsum_brick",
                "min_compressive_strength_mpa": 10.0,
                "max_water_absorption_pct": 15.0,
            },
        ),
    ]

    all_passed = True

    try:
        import httpx
        with httpx.Client(timeout=10.0) as client:
            for name, url, expected_status, method, payload in checks:
                t0 = time.perf_counter()
                try:
                    if method == "GET":
                        resp = client.get(url)
                    else:
                        resp = client.post(url, json=payload)
                    elapsed_ms = (time.perf_counter() - t0) * 1000.0

                    if resp.status_code == expected_status:
                        print(f" [PASS] {name:<35} Status: {resp.status_code} ({elapsed_ms:.1f}ms)")
                    else:
                        print(f" [FAIL] {name:<35} Expected: {expected_status}, Got: {resp.status_code} ({elapsed_ms:.1f}ms)")
                        all_passed = False
                except Exception as ex:
                    print(f" [FAIL] {name:<35} Connection error: {ex}")
                    all_passed = False

    except ImportError:
        # Fallback to standard library urllib
        import urllib.request
        import urllib.error

        for name, url, expected_status, method, payload in checks:
            t0 = time.perf_counter()
            req = urllib.request.Request(url, method=method)
            if payload:
                data = json.dumps(payload).encode("utf-8")
                req.add_header("Content-Type", "application/json")
            else:
                data = None

            try:
                with urllib.request.urlopen(req, data=data, timeout=10.0) as resp:
                    status = resp.status
            except urllib.error.HTTPError as he:
                status = he.code
            except Exception as ex:
                status = -1
                print(f" [FAIL] {name:<35} Error: {ex}")
                all_passed = False
                continue

            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            if status == expected_status:
                print(f" [PASS] {name:<35} Status: {status} ({elapsed_ms:.1f}ms)")
            else:
                print(f" [FAIL] {name:<35} Expected: {expected_status}, Got: {status} ({elapsed_ms:.1f}ms)")
                all_passed = False

    print("\n-------------------------------------------------------")
    if all_passed:
        print(" ALL DEPLOYMENT SMOKE CHECKS PASSED SUCCESSFULLY.")
        print("-------------------------------------------------------\n")
        return True
    else:
        print(" ONE OR MORE DEPLOYMENT SMOKE CHECKS FAILED.")
        print("-------------------------------------------------------\n")
        return False


def run_smoke_checks_via_testclient() -> bool:
    """Runs smoke checks in-process using FastAPI TestClient."""
    from fastapi.testclient import TestClient
    from backend.app.main import app

    print(f"\n=======================================================")
    print(f" FLYASH INTEL - IN-PROCESS DEPLOYMENT SMOKE CHECK")
    print(f" Engine: FastAPI TestClient")
    print(f"=======================================================\n")

    client = TestClient(app)

    checks = [
        ("Process Liveness", "/api/health", 200, "GET", None),
        ("Subsystem Readiness", "/api/ready", 200, "GET", None),
        ("Canonical Schema Metadata", "/api/schema", 200, "GET", None),
        ("Dataset Readiness Diagnostics", "/api/datasets/readiness", 200, "GET", None),
        ("Paper Registry Access", "/api/papers", 200, "GET", None),
        ("Record Registry Access", "/api/records", 200, "GET", None),
        (
            "Fail-Closed Training Gate",
            "/api/models/train",
            422,
            "POST",
            {"target_property": "compressive_strength_mpa"},
        ),
        (
            "Fail-Closed Prediction Gate",
            "/api/models/predict",
            503,
            "POST",
            {"fly_ash_fraction": 0.5, "lime_fraction": 0.1, "sand_fraction": 0.4},
        ),
        (
            "Fail-Closed Optimization Gate",
            "/api/optimization/run",
            503,
            "POST",
            {
                "material_system": "fly_ash_lime_gypsum_brick",
                "min_compressive_strength_mpa": 10.0,
                "max_water_absorption_pct": 15.0,
            },
        ),
    ]

    all_passed = True
    for name, path, expected_status, method, payload in checks:
        t0 = time.perf_counter()
        if method == "GET":
            resp = client.get(path)
        else:
            resp = client.post(path, json=payload)
        elapsed_ms = (time.perf_counter() - t0) * 1000.0

        if resp.status_code == expected_status:
            print(f" [PASS] {name:<35} Status: {resp.status_code} ({elapsed_ms:.1f}ms)")
        else:
            print(f" [FAIL] {name:<35} Expected: {expected_status}, Got: {resp.status_code} ({elapsed_ms:.1f}ms)")
            all_passed = False

    print("\n-------------------------------------------------------")
    if all_passed:
        print(" ALL IN-PROCESS DEPLOYMENT SMOKE CHECKS PASSED.")
        print("-------------------------------------------------------\n")
        return True
    else:
        print(" ONE OR MORE SMOKE CHECKS FAILED.")
        print("-------------------------------------------------------\n")
        return False


def main():
    parser = argparse.ArgumentParser(description="FlyAsh Intel Deployment Smoke Check Runner")
    parser.add_argument("--url", default=None, help="Base URL of live server (e.g. http://127.0.0.1:8000)")
    parser.add_argument("--client", action="store_true", help="Force in-process TestClient check")
    args = parser.parse_args()

    if args.client or not args.url:
        success = run_smoke_checks_via_testclient()
    else:
        success = run_smoke_checks_against_url(args.url.rstrip("/"))

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
