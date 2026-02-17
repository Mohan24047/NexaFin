import requests
import uuid
import time

BASE_URL = "http://localhost:8000"

def create_user(email, password, user_type="startup"):
    # 1. Signup
    print(f"\n[TEST] Creating user {email}...")
    resp = requests.post(f"{BASE_URL}/auth/signup", json={"email": email, "password": password})
    if resp.status_code == 400 and "already registered" in resp.text:
         print("User already exists, logging in...")
    elif resp.status_code != 200:
        print(f"Signup failed: {resp.text}")
        return None

    # 2. Login to get token
    resp = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return None
    
    data = resp.json()
    token = data["access_token"]
    
    # 3. Update profile type
    headers = {"Authorization": f"Bearer {token}"}
    requests.put(f"{BASE_URL}/auth/profile", json={"user_type": user_type}, headers=headers)
    
    return token

def create_startup(token, name):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": name,
        "description": "Test Startup",
        "revenue": 10000,
        "burn": 5000,
        "cash": 50000,
        "growth": 10,
        "team": 5,
        "runway": 10,
        "survival_score": 85
    }
    resp = requests.post(f"{BASE_URL}/startups/", json=payload, headers=headers)
    if resp.status_code == 200:
        print(f"[SUCCESS] Created startup: {name}")
        return resp.json()["id"]
    else:
        print(f"[FAIL] Failed to create startup: {resp.text}")
        return None

def get_my_startups(token):
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/startups/my", headers=headers)
    if resp.status_code == 200:
        return resp.json()
    else:
        print(f"[FAIL] Failed to fetch startups: {resp.text}")
        return []

def main():
    email_a = f"founder_a_{uuid.uuid4().hex[:6]}@example.com"
    email_b = f"founder_b_{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    # 1. Create Users
    token_a = create_user(email_a, password)
    token_b = create_user(email_b, password)

    if not token_a or not token_b:
        print("Failed to create users.")
        return

    # 2. Verify empty initially
    startups_a = get_my_startups(token_a)
    startups_b = get_my_startups(token_b)
    print(f"User A Startups: {len(startups_a)}")
    print(f"User B Startups: {len(startups_b)}")
    assert len(startups_a) == 0
    assert len(startups_b) == 0

    # 3. User A creates Startup A1
    create_startup(token_a, "Startup A1")
    
    # 4. Verify A sees it, B does not
    startups_a = get_my_startups(token_a)
    startups_b = get_my_startups(token_b)
    
    print(f"User A Startups: {len(startups_a)} (Expected 1)")
    print(f"User B Startups: {len(startups_b)} (Expected 0)")
    
    assert len(startups_a) == 1
    assert len(startups_b) == 0
    assert startups_a[0]["name"] == "Startup A1"

    # 5. User B creates Startup B1
    create_startup(token_b, "Startup B1")

    # 6. Verify Isolation
    startups_a = get_my_startups(token_a)
    startups_b = get_my_startups(token_b)

    print(f"User A Startups: {len(startups_a)} (Expected 1)")
    print(f"User B Startups: {len(startups_b)} (Expected 1)")

    assert len(startups_a) == 1
    assert startups_a[0]["name"] == "Startup A1"
    
    assert len(startups_b) == 1
    assert startups_b[0]["name"] == "Startup B1"

    print("\n[PASS] User Isolation Verified Successfully!")

if __name__ == "__main__":
    main()
