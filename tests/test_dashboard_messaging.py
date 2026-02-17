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
    return resp.json()["access_token"], resp.json()["user_id"]

def test_dashboard_messaging():
    print("--- Starting Dashboard Messaging Verification ---")
    
    # 1. Setup Data
    startup_email, startup_pass = create_user("startup_chat")
    st_token, st_id = login(startup_email, startup_pass)
    st_headers = {"Authorization": f"Bearer {st_token}"}
    
    investor_email, investor_pass = create_user("investor_chat")
    inv_token, inv_id = login(investor_email, investor_pass)
    inv_headers = {"Authorization": f"Bearer {inv_token}"}

    # 2. Check Inbox is Empty
    print("Checking initial inbox...")
    resp = requests.get(f"{BASE_URL}/invest/requests", headers=st_headers)
    assert len(resp.json()) == 0, "Inbox should be empty"

    # 3. Send Message
    print("Investor sending message...")
    msg_body = {
        "startupId": st_id,
        "message": "Let's chat about series A."
    }
    resp = requests.post(f"{BASE_URL}/invest/connect", json=msg_body, headers=inv_headers)
    assert resp.status_code == 200
    assert resp.json()["success"] == True
    print("Message sent.")

    # 4. Check Inbox (Polling Simulation)
    print("Startup checking inbox...")
    resp = requests.get(f"{BASE_URL}/invest/requests", headers=st_headers)
    msgs = resp.json()
    assert len(msgs) == 1
    msg = msgs[0]
    print(f"Received message from: {msg['investor_name']} ({msg['investor_email']})")
    assert msg['message'] == "Let's chat about series A."
    assert msg['is_read'] == False
    request_id = msg['id']

    # 5. Mark as Read
    print("Marking as read...")
    resp = requests.post(f"{BASE_URL}/invest/read/{request_id}", headers=st_headers)
    assert resp.json()["success"] == True
    
    # 6. Verify Read Status
    resp = requests.get(f"{BASE_URL}/invest/requests", headers=st_headers)
    msg = resp.json()[0]
    assert msg['is_read'] == True
    print("Message marked read successfully.")

    print("--- Verification PASSED: Internal Messaging Works ---")

if __name__ == "__main__":
    try:
        test_dashboard_messaging()
    except Exception as e:
        print(f"FAILED: {e}")
