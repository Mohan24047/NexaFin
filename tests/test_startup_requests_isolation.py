
import requests
import uuid
import time
import sys

BASE_URL = "http://localhost:8000"


def log(msg):
    with open("test_output.log", "a") as f:
        f.write(msg + "\n")
    print(msg)

def create_user(role="job", prefix="user"):
    email = f"{prefix}_{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"
    
    # Signup
    requests.post(f"{BASE_URL}/auth/signup", json={"email": email, "password": password})
    
    # Login
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
    if res.status_code != 200:
        log(f"[ERROR] Login failed for {email}")
        return None, None
        
    data = res.json()
    token = data["access_token"]
    
    # Update Role
    requests.put(f"{BASE_URL}/auth/profile", json={"user_type": role}, headers={"Authorization": f"Bearer {token}"})
    
    return token, email

def create_startup(token, name):
    resp = requests.post(f"{BASE_URL}/startups/", json={
        "name": name,
        "revenue": 100, "burn": 10, "cash": 1000, "growth": 5, "team": 2, "runway": 12, "survival_score": 90
    }, headers={"Authorization": f"Bearer {token}"})
    
    if resp.status_code == 200:
        return resp.json()["id"]
    return None

def send_request(investor_token, startup_id):
    resp = requests.post(f"{BASE_URL}/invest/connect", json={
        "startupId": startup_id,
        "message": "I want to invest"
    }, headers={"Authorization": f"Bearer {investor_token}"})
    log(f"[DEBUG] Send Request Status: {resp.status_code}, Response: {resp.text[:200]}")
    return resp

def get_requests(token):
    resp = requests.get(f"{BASE_URL}/invest/startup/requests", headers={"Authorization": f"Bearer {token}"})
    log(f"[DEBUG] Get Requests Status: {resp.status_code}")
    if resp.status_code != 200:
        log(f"[ERROR] Body: {resp.text[:200]}")
    return resp.json()

def main():
    with open("test_output.log", "w") as f:
        f.write("--- Starting Test ---\n")
        
    log("--- Testing Investor Request Isolation ---")

    # 1. Setup Users
    token_inv, email_inv = create_user("job", "investor")
    token_a, email_a = create_user("startup", "founder_a")
    token_b, email_b = create_user("startup", "founder_b")
    
    log(f"Investor: {email_inv}")
    log(f"Founder A: {email_a}")
    log(f"Founder B: {email_b}")

    # 2. Create Startups
    id_a1 = create_startup(token_a, "Startup A-1")
    id_a2 = create_startup(token_a, "Startup A-2")
    id_b1 = create_startup(token_b, "Startup B-1")
    
    log(f"Created Startups: A1({id_a1}), A2({id_a2}), B1({id_b1})")

    # 3. Investor sends request to A-1
    log("\n[ACTION] Sending request to Startup A-1...")
    send_request(token_inv, id_a1)

    # 4. Verification Round 1
    reqs_a = get_requests(token_a)
    reqs_b = get_requests(token_b)
    
    log(f"Founder A Requests: {len(reqs_a)} (Expected 1)")
    log(f"Founder B Requests: {len(reqs_b)} (Expected 0)")
    
    if len(reqs_a) != 1 or len(reqs_b) != 0:
        log("[FAIL] Isolation check 1 failed")
        sys.exit(1)
        
    if reqs_a[0]["startupName"] != "Startup A-1":
        log(f"[FAIL] Incorrect startup name. Got {reqs_a[0]['startupName']}")
        sys.exit(1)

    # 5. Investor sends request to B-1
    log("\n[ACTION] Sending request to Startup B-1...")
    send_request(token_inv, id_b1)

    # 6. Verification Round 2
    reqs_a = get_requests(token_a)
    reqs_b = get_requests(token_b)
    
    log(f"Founder A Requests: {len(reqs_a)} (Expected 1)")
    log(f"Founder B Requests: {len(reqs_b)} (Expected 1)")
    
    if len(reqs_a) != 1 or len(reqs_b) != 1:
        log("[FAIL] Isolation check 2 failed")
        sys.exit(1)
        
    if reqs_b[0]["startupName"] != "Startup B-1":
        log(f"[FAIL] Incorrect startup name for B. Got {reqs_b[0]['startupName']}")
        sys.exit(1)

    log("\n[SUCCESS] All isolation tests passed!")

if __name__ == "__main__":
    main()
