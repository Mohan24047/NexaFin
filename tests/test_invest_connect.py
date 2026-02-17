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

def test_invest_connect():
    print("--- Starting Investment Connection Test ---")

    # 1. Create Startup User
    startup_email, startup_pass = create_user("startup")
    startup_token, startup_id = login(startup_email, startup_pass)
    
    # 2. Create Investor User
    investor_email, investor_pass = create_user("investor")
    investor_token, investor_id = login(investor_email, investor_pass)
    
    investor_headers = {"Authorization": f"Bearer {investor_token}"}
    startup_headers = {"Authorization": f"Bearer {startup_token}"}

    # 3. Investor sends connection request
    print(f"\nInvestor ({investor_id}) connecting to Startup ({startup_id})...")
    payload = {
        "startupId": startup_id,
        "message": "I love your pitch deck."
    }
    resp = requests.post(f"{BASE_URL}/invest/connect", json=payload, headers=investor_headers)
    print(f"Connect Response: {resp.json()}")
    
    if resp.status_code == 200 and resp.json()["success"]:
        print("SUCCESS: Connection request sent.")
    else:
        print(f"FAILURE: Could not send request. {resp.text}")
        return

    # 4. Investor sends duplicate request
    print("\nSending duplicate request...")
    resp = requests.post(f"{BASE_URL}/invest/connect", json=payload, headers=investor_headers)
    print(f"Duplicate Response: {resp.json()}")
    
    if not resp.json()["success"] and "already sent" in resp.json()["message"]:
        print("SUCCESS: Duplicate prevented.")
    else:
        print("FAILURE: Duplicate not handled correctly.")

    # 5. Startup checks requests
    print("\nStartup checking requests...")
    resp = requests.get(f"{BASE_URL}/invest/requests", headers=startup_headers)
    requests_data = resp.json()
    print(f"Requests Found: {len(requests_data)}")
    
    found = False
    for req in requests_data:
        if req["investor_user_id"] == investor_id and req["message"] == "I love your pitch deck.":
            found = True
            print(f"SUCCESS: Found request from {investor_id}")
            break
            
    if not found:
        print("FAILURE: Did not find the request.")

if __name__ == "__main__":
    try:
        test_invest_connect()
    except Exception as e:
        print(f"CRASH: {e}")
