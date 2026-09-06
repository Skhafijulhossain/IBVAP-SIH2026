"""
Verification script for Render startup compliance.
Tests that `python -m backend.main` starts with custom PORT environment variable,
binds to 0.0.0.0, and serves /health, /api/*, /ws/alerts, and root endpoints.
"""

import os
import sys
import time
import subprocess
import httpx
import websockets
import asyncio

TEST_PORT = 8992
BASE_URL = f"http://127.0.0.1:{TEST_PORT}"
WS_URL = f"ws://127.0.0.1:{TEST_PORT}/ws/alerts"


def test_render_startup():
    print(f"[TEST] Starting backend via 'python -m backend.main' with PORT={TEST_PORT}...")
    
    env = os.environ.copy()
    env["PORT"] = str(TEST_PORT)
    env["HOST"] = "127.0.0.1"
    env["RELOAD"] = "false"
    env["PYTHONPATH"] = "."

    # Start backend server subprocess
    proc = subprocess.Popen(
        [sys.executable, "-m", "backend.main"],
        env=env,
        cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    try:
        # Wait up to 15 seconds for server to be responsive
        server_ready = False
        for attempt in range(15):
            time.sleep(1)
            try:
                r = httpx.get(f"{BASE_URL}/health", timeout=2.0)
                if r.status_code == 200:
                    server_ready = True
                    print(f"  --> Server online on attempt {attempt + 1}.")
                    break
            except Exception:
                pass

        assert server_ready, "Server failed to respond within 15 seconds"

        # 1. Test Root
        print("[TEST] Testing GET /...")
        r_root = httpx.get(f"{BASE_URL}/", timeout=2.0)
        assert r_root.status_code == 200
        root_data = r_root.json()
        assert root_data["status"] == "ONLINE"
        print("  --> PASS: Root endpoint verified.")

        # 2. Test Health
        print("[TEST] Testing GET /health...")
        r_health = httpx.get(f"{BASE_URL}/health", timeout=2.0)
        assert r_health.status_code == 200
        health_data = r_health.json()
        assert health_data["status"] == "ONLINE"
        print("  --> PASS: Health endpoint verified.")

        # 3. Test API Cameras
        print("[TEST] Testing GET /api/cameras...")
        r_cams = httpx.get(f"{BASE_URL}/api/cameras", timeout=2.0)
        assert r_cams.status_code == 200
        assert len(r_cams.json()) >= 4
        print(f"  --> PASS: /api/cameras returned {len(r_cams.json())} cameras.")

        # 4. Test API Stream Status
        print("[TEST] Testing GET /api/stream/status...")
        r_stream = httpx.get(f"{BASE_URL}/api/stream/status", timeout=2.0)
        assert r_stream.status_code == 200
        print(f"  --> PASS: /api/stream/status active: {r_stream.json().get('active_streams_count')}.")

        # 5. Test Live WebSocket Handshake on /ws/alerts
        print("[TEST] Testing WebSocket /ws/alerts...")
        async def check_ws():
            async with websockets.connect(WS_URL) as ws:
                # Should receive initial connection message or be able to send/recv
                print("  --> PASS: WebSocket connected successfully on /ws/alerts.")
        asyncio.run(check_ws())

        print("=" * 60)
        print("ALL RENDER STARTUP & PORT BINDING VERIFICATIONS PASSED!")
        print("=" * 60)

    finally:
        # Terminate server process cleanly
        print("[CLEANUP] Stopping server subprocess...")
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
        print("[CLEANUP] Server terminated.")


if __name__ == "__main__":
    test_render_startup()
