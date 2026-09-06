"""
Verification tests for Supabase Authentication and Role Enforcement in FastAPI.
"""
import os
import time
import jwt
from fastapi.testclient import TestClient

# Set a test JWT secret for validation
TEST_JWT_SECRET = "defense_super_secret_jwt_key_sih2026_test_only"
os.environ["SUPABASE_JWT_SECRET"] = TEST_JWT_SECRET

from backend.main import app
from backend.auth.supabase_auth import verify_supabase_token, AuthenticatedUser

client = TestClient(app)


def generate_test_token(user_id: str, email: str, role: str, full_name: str, exp_sec: int = 3600) -> str:
    """Helper generating standard Supabase JWT."""
    payload = {
        "sub": user_id,
        "email": email,
        "aud": "authenticated",
        "role": "authenticated",
        "exp": int(time.time()) + exp_sec,
        "user_metadata": {
            "full_name": full_name,
            "role": role,
        },
        "app_metadata": {
            "provider": "email",
            "role": role,
        }
    }
    return jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")


def test_supabase_auth():
    print("============================================================")
    print("TESTING SUPABASE JWT AUTHENTICATION & ROLE ENFORCEMENT")
    print("============================================================")

    # 1. Test Commander token
    commander_token = generate_test_token(
        user_id="d3b07384-d113-42e1-8975-f725330e7195",
        email="commander.rathore@defense.ibvap.gov.in",
        role="Commander",
        full_name="Major Vikram Rathore"
    )

    claims = verify_supabase_token(commander_token)
    assert claims["sub"] == "d3b07384-d113-42e1-8975-f725330e7195"
    assert claims["user_metadata"]["role"] == "Commander"
    print("  -> PASS: Commander token verified successfully.")

    # 2. Test Analyst token
    analyst_token = generate_test_token(
        user_id="e5c12345-d113-42e1-8975-f725330e7195",
        email="analyst.sharma@defense.ibvap.gov.in",
        role="Analyst",
        full_name="Capt. Priya Sharma"
    )
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {analyst_token}"})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["role"] == "Analyst"
    assert data["full_name"] == "Capt. Priya Sharma"
    assert data["email"] == "analyst.sharma@defense.ibvap.gov.in"
    print(f"  -> PASS: GET /api/auth/me returned Analyst: {data['full_name']} ({data['role']})")

    # 3. Test Admin token
    admin_token = generate_test_token(
        user_id="a1b2c3d4-d113-42e1-8975-f725330e7195",
        email="admin.verma@defense.ibvap.gov.in",
        role="Admin",
        full_name="Col. Rajesh Verma"
    )
    res_admin = client.get("/api/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    assert res_admin.json()["role"] == "Admin"
    print(f"  -> PASS: GET /api/auth/me returned Admin: {res_admin.json()['full_name']}")

    # 4. Test Invalid token rejection
    invalid_token = commander_token[:-5] + "XXXXX"
    res_invalid = client.get("/api/auth/me", headers={"Authorization": f"Bearer {invalid_token}"})
    assert res_invalid.status_code == 401
    print("  -> PASS: Tampered token was rejected with 401 Unauthorized.")

    # 5. Test Expired token rejection
    expired_token = generate_test_token(
        user_id="expired-user",
        email="expired@test.com",
        role="Analyst",
        full_name="Expired User",
        exp_sec=-10
    )
    res_expired = client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res_expired.status_code == 401
    print("  -> PASS: Expired token was rejected with 401 Unauthorized.")

    # 6. Test fallback when token omitted
    res_fallback = client.get("/api/auth/me")
    assert res_fallback.status_code == 200
    assert res_fallback.json()["role"] == "Commander"
    print("  -> PASS: Default fallback session allows backward-compatible endpoint access.")

    print("\nALL SUPABASE AUTH & ROLE VERIFICATIONS PASSED (100% SUCCESS)!")

if __name__ == "__main__":
    test_supabase_auth()
