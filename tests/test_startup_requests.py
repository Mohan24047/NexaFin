
import requests
import uuid
import time

BASE_URL = "http://localhost:8000"

def create_user(role="job"):
    email = f"{role}_{uuid.uuid4()}@example.com"
    password = "password123"
    print(f"Creating user: {email}")
    # Signup
    res = requests.post(f"{BASE_URL}/auth/signup", json={
        "email": email,
        "password": password,
        "full_name": "Test User",
        "user_type": role
    })
    
    # Login to get token
    res = requests.post(f"{BASE_URL}/auth/login", data={
        "username": email,
        "password": password
    })
    
    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        return None, None
        
    token = res.json()["access_token"]
    user_id = res.json()["user_id"]
    return token, user_id

def run_test():
    print("--- Starting Startup Requests Verification ---")

    # 1. Create Startup
    startup_token, startup_id = create_user("startup")
    if not startup_token: return

    # 2. Create Investor
    investor_token, investor_id = create_user("job") # Investor is a job user
    if not investor_token: return

    # 3. Investor sends request
    print("\nSending connection request...")
    res = requests.post(f"{BASE_URL}/invest/connect", json={
        "startupId": startup_id,
        "message": "I want to invest $50k"
    }, headers={"Authorization": f"Bearer {investor_token}"})
    
    print(f"Connect Response: {res.status_code} - {res.json()}")
    if not res.json().get("success"):
        print("FAILED: Could not send request")
        return

    # 4. Startup fetches requests
    print("\nFetching requests as startup...")
    res = requests.get(f"{BASE_URL}/invest/startup/requests", headers={"Authorization": f"Bearer {startup_token}"})
    requests_list = res.json()
    print(f"Requests found: {len(requests_list)}")
    
    if len(requests_list) == 0:
        print("FAILED: No requests found")
        return

    req_id = requests_list[0]["id"]
    print(f"Request ID: {req_id}, Status: {requests_list[0]['status']}")

    # 5. Startup accepts request
    print("\nAccepting request...")
    res = requests.post(f"{BASE_URL}/invest/startup/requests/update", json={
        "id": req_id,
        "action": "accept"
    }, headers={"Authorization": f"Bearer {startup_token}"})
    
    print(f"Update Response: {res.status_code} - {res.json()}")

    # 6. Verify status update
    print("\nVerifying status update...")
    res = requests.get(f"{BASE_URL}/invest/startup/requests", headers={"Authorization": f"Bearer {startup_token}"})
    updated_req = res.json()[0]
    print(f"New Status: {updated_req['status']}")

    if updated_req['status'] == 'accepted':
        print("\nSUCCESS: Request flow verified!")
    else:
        print("\nFAILED: Status did not update")

if __name__ == "__main__":
    run_test()
