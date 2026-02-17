import requests
import uuid

BASE_URL = "http://127.0.0.1:8000"

def run_debug():
    # 1. Signup a new test user
    email = f"debug_{uuid.uuid4()}@test.com"
    password = "password123"
    print(f"Creating user: {email}")
    
    res = requests.post(f"{BASE_URL}/auth/signup", json={"email": email, "password": password})
    if res.status_code != 200:
        print(f"Signup failed: {res.text}")
        return

    # 2. Login
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        return
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Logged in.")

    # 3. Update Profile (simulate frontend payload)
    payload = {
        "user_type": "job",
        "monthly_income": 5500.0,
        "monthly_expenses": 2000.0,
        "current_savings": 10000.0,
        "risk_tolerance": "high",
        "investment_goal": "wealth_growth"
    }
    print(f"Sending Update: {payload}")
    
    res = requests.put(f"{BASE_URL}/auth/profile", json=payload, headers=headers)
    print(f"Update Response: {res.status_code} {res.text}")
    
    # 4. Fetch Profile to verify
    res = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    data = res.json()
    print("Fetch Result:", data)
    
    user_data = data.get("data", {})
    print(f"Verifying: Income={user_data.get('income')}, Expenses={user_data.get('expenses')}")
    
    if user_data.get('income') == 5500.0:
        print("SUCCESS: Data saved correctly!")
    else:
        print("FAILURE: Data mismatch.")

if __name__ == "__main__":
    try:
        run_debug()
    except Exception as e:
        print(f"Error: {e}")
