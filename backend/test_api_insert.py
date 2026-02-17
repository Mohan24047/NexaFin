import requests
import uuid

BASE_URL = "http://localhost:8000"

def register_user(email, password, user_type):
    # Try login first
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
        if resp.status_code == 200:
            print(f"Logged in as {email}")
            return resp.json()["access_token"]
    except:
        pass
        
    # Register
    print(f"Registering {email}...")
    resp = requests.post(f"{BASE_URL}/auth/signup", json={
        "email": email, 
        "password": password
    })
    # Ignore user_type in signup for now as it's not in UserCreate, but maybe UserData defaults? 
    # Actually UserCreate only has email/password.
    # The user_type is handled by logic? Or maybe UserData profile update?
    # backend/routers/auth.py: signup takes UserCreate(email, password).
    # It creates UserData(user_id=new_user.id). 
    # To set user_type, we might need to update profile.
    
    if resp.status_code != 200:
        print(f"Registration failed: {resp.text}")
        return None

    # Login
    resp = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
    token = resp.json()["access_token"]
    
    # Update Profile to set user_type
    if user_type:
        # Check if profile update endpoint exists
        # router.put("/profile")
        # schemas.UserProfileUpdate might include user_type? 
        # Actually UserData has user_type but ProfileUpdate might not expose it?
        # Let's check models.UserData has user_type.
        # auth.py update_profile mostly updates financial data.
        # But we need user_type for logic?
        # Actually, let's just proceed. The invest logic checks current_user.
        pass
        
    return token

def test_flow():
    # 1. Setup Startup
    startup_email = f"startup_{uuid.uuid4().hex[:6]}@test.com"
    startup_token = register_user(startup_email, "password123", "startup")
    
    if not startup_token:
        print("Failed to get startup token")
        return

    # Create Startup Profile
    print("Creating Startup Profile...")
    startup_resp = requests.post(f"{BASE_URL}/startups/", 
        json={
            "name": "Test Startup Logic",
            "description": "A test startup",
            "revenue": 100000.0,
            "burn": 5000.0,
            "cash": 50000.0,
            "growth": 0.1,
            "team": 5,
            "runway": 10,
            "survival_score": 80
        },
        headers={"Authorization": f"Bearer {startup_token}"}
    )
    if startup_resp.status_code != 200:
        print(f"Failed to create startup: {startup_resp.text}")
        return
        
    startup_id = startup_resp.json().get("id")
    print(f"Startup Created: {startup_id}")

    # 2. Setup Investor
    investor_email = f"investor_{uuid.uuid4().hex[:6]}@test.com"
    investor_token = register_user(investor_email, "password123", "investor")
    
    if not investor_token:
        print("Failed to get investor token")
        return

    # 3. Send Request
    print("Sending Investment Request...")
    conn_resp = requests.post(f"{BASE_URL}/invest/connect",
        json={
            "startupId": startup_id,
            "message": "I want to invest $1M"
        },
        headers={"Authorization": f"Bearer {investor_token}"}
    )
    
    print(f"Connect Response: {conn_resp.status_code} - {conn_resp.text}")
    
    if conn_resp.status_code == 200 and conn_resp.json().get("success"):
        print("SUCCESS: Request sent via API.")
    else:
        print("FAILURE: Request NOT sent.")
        return

    # 4. Verify Startup Filters
    print("Fetching requests as Startup Owner...")
    fetch_resp = requests.get(f"{BASE_URL}/invest/startup/requests", headers={"Authorization": f"Bearer {startup_token}"})
    
    if fetch_resp.status_code != 200:
        print(f"FETCH FAILED: {fetch_resp.status_code} - {fetch_resp.text}")
        return
        
    requests_data = fetch_resp.json()
    print(f"Requests Found: {len(requests_data)}")
    
    found = False
    for r in requests_data:
        print(f" - Request: {r['id']}, Startup: {r['startupName']}, Investor: {r['senderEmail']}")
        if r['startupName'] == "Test Startup Logic" and r['senderEmail'] == investor_email:
            found = True
            
    if found:
        print("SUCCESS: Startup sees the request!")
    else:
        print("FAILURE: Request NOT visible to startup.")

if __name__ == "__main__":
    test_flow()
