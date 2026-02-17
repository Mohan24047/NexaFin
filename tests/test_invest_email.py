import requests
import uuid
import time

BASE_URL = "http://localhost:8000"

def create_user(email_prefix, password="password123"):
    email = f"{email_prefix}_{uuid.uuid4()}@example.com"
    resp = requests.post(f"{BASE_URL}/auth/signup", json={"email": email, "password": password})
    if resp.status_code != 200:
        raise Exception(f"Signup failed: {resp.text}")
    print(f"Created user: {email}")
    return email, password

def login(email, password):
    resp = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
    if resp.status_code != 200:
        raise Exception(f"Login failed: {resp.text}")
    return resp.json()["access_token"], resp.json()["user_id"]

def test_invest_email():
    print("--- Starting Investment Email Verification ---")

    # 1. Create Startup User
    startup_email, startup_pass = create_user("startup_mail")
    startup_token, startup_id = login(startup_email, startup_pass)
    
    # 2. Create Investor User
    investor_email, investor_pass = create_user("investor_mail")
    investor_token, investor_id = login(investor_email, investor_pass)
    
    investor_headers = {"Authorization": f"Bearer {investor_token}"}

    # 3. Investor sends connection request
    print(f"\nInvestor ({investor_id}) connecting to Startup ({startup_id})...")
    print("(Check backend console for [MOCK EMAIL] log)")
    
    payload = {
        "startupId": startup_id,
        "message": "Interested in your Series A."
    }
    
    start_time = time.time()
    resp = requests.post(f"{BASE_URL}/invest/connect", json=payload, headers=investor_headers)
    end_time = time.time()
    
    print(f"Connect Response: {resp.json()}")
    print(f"Response Time: {end_time - start_time:.2f}s")
    
    if resp.status_code == 200 and resp.json()["success"]:
        print("SUCCESS: Connection request sent.")
    else:
        print(f"FAILURE: Could not send request. {resp.text}")
        return

    # 4. Verify no hang (Response time should be low)
    if end_time - start_time < 2.0:
        print("SUCCESS: API responded quickly (No hang).")
    else:
        print("WARNING: API took longer than 2s.")

if __name__ == "__main__":
    try:
        test_invest_email()
    except Exception as e:
        print(f"CRASH: {e}")
