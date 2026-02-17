import requests
import uuid

BASE_URL = "http://127.0.0.1:8000"

def create_and_update(email, password, income):
    # Signup
    res = requests.post(f"{BASE_URL}/auth/signup", json={"email": email, "password": password})
    # Login
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
    try:
        data = res.json()
        token = data.get("access_token")
        user_id = data.get("user_id") # Verify this is present
        print(f"Logged in {email}. Got UserID: {user_id}")
    except:
        print(f"Login failed for {email}: {res.text}")
        return None, None

    headers = {"Authorization": f"Bearer {token}"}
    
    # Update Profile
    payload = {
        "monthly_income": income,
        "monthly_expenses": 500.0,
        "user_type": "job"
    }
    requests.put(f"{BASE_URL}/auth/profile", json=payload, headers=headers)
    return token, headers

def test_isolation():
    u1_email = f"userA_{uuid.uuid4()}@test.com"
    u2_email = f"userB_{uuid.uuid4()}@test.com"
    pwd = "password123"
    
    print(f"--- Creating User A ({u1_email}) with Income 1000 ---")
    t1, h1 = create_and_update(u1_email, pwd, 1000.0)
    
    print(f"--- Creating User B ({u2_email}) with Income 2000 ---")
    t2, h2 = create_and_update(u2_email, pwd, 2000.0)
    
    print("--- Verifying User A Data ---")
    # Fetch as User A
    res = requests.get(f"{BASE_URL}/auth/me", headers=h1)
    data = res.json().get("data", {})
    inc = data.get("income")
    print(f"User A Income from DB: {inc}")
    
    print("--- Verifying User B Data ---")
    # Fetch as User B
    res = requests.get(f"{BASE_URL}/auth/me", headers=h2)
    data = res.json().get("data", {})
    inc_b = data.get("income")
    print(f"User B Income from DB: {inc_b}")
    
    if inc == 1000.0 and inc_b == 2000.0:
        print("SUCCESS: Data is correctly isolated by User ID.")
    else:
        print("FAILURE: Data leakage or mismatch detected.")

if __name__ == "__main__":
    try:
        test_isolation()
    except Exception as e:
        print(f"Error: {e}")
