import requests
import uuid
import time

BASE_URL = "http://127.0.0.1:8000"
EMAIL = f"portfolio_test_{uuid.uuid4()}@example.com"
PASSWORD = "password123"

def test_flow():
    print(f"--- Testing Portfolio Flow for {EMAIL} ---")
    
    # 1. Signup
    res = requests.post(f"{BASE_URL}/auth/signup", json={"email": EMAIL, "password": PASSWORD})
    assert res.status_code == 200, f"Signup failed: {res.text}"
    print("Signup: OK")
    
    # 2. Login
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": EMAIL, "password": PASSWORD})
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login: OK")
    
    # 3. Update Profile (Triggers Portfolio Gen)
    profile_data = {
        "monthly_income": 8000.0,
        "monthly_expenses": 3000.0,
        "current_savings": 20000.0,
        "risk_tolerance": "high",
        "user_type": "job"
    }
    res = requests.put(f"{BASE_URL}/auth/profile", json=profile_data, headers=headers)
    assert res.status_code == 200, f"Profile update failed: {res.text}"
    print("Profile Update: OK")
    
    # 4. Fetch Portfolio
    res = requests.get(f"{BASE_URL}/portfolio/me", headers=headers)
    if res.status_code == 200:
        data = res.json()
        print("Fetch Portfolio: OK")
        print(f"Monthly Investment: ${data['monthly_investment']}")
        print(f"Allocation: {data['allocation']}")
        
        # Verify correctness
        assert data['monthly_investment'] > 0, "Investment amount should be > 0"
        assert len(data['allocation']) == 3, "Should have 3 assets for High risk"
        print("--- SUCCESS: Auto Portfolio Generation Verified ---")
    else:
        print(f"--- FAILURE: Portfolio not found ({res.status_code}) ---")
        print(res.text)

if __name__ == "__main__":
    try:
        test_flow()
    except Exception as e:
        print(f"Error: {e}")
