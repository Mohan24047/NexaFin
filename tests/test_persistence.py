import requests
import uuid

BASE_URL = "http://localhost:8000"

def test_investment_persistence():
    # 1. Create unique user
    email = f"test_{uuid.uuid4()}@example.com"
    password = "password123"
    
    print(f"Creating user: {email}")
    
    # Signup
    resp = requests.post(f"{BASE_URL}/auth/signup", json={"email": email, "password": password})
    if resp.status_code != 200:
        print(f"Signup failed: {resp.text}")
        return

    # Login
    resp = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return
        
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print("User authenticated.")

    # 2. Check initial profile
    resp = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    data = resp.json()["data"]
    print(f"Initial Investment: {data.get('monthly_investment')}")

    # 3. Update Investment
    new_amount = 5500.0
    print(f"Updating investment to {new_amount}...")
    resp = requests.put(f"{BASE_URL}/auth/update-investment", 
                        json={"monthly_investment": new_amount}, 
                        headers=headers)
    
    if resp.status_code != 200:
        print(f"Update failed: {resp.status_code} {resp.text}")
        return
        
    print(f"Update response: {resp.json()}")

    # 4. Verify via /auth/me
    resp = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    data = resp.json()["data"]
    current_val = data.get('monthly_investment')
    print(f"Verified Investment via /auth/me: {current_val}")
    
    if float(current_val) == float(new_amount):
        print("SUCCESS: /auth/me reflects the change.")
    else:
        print("FAILURE: /auth/me does not match.")

    # 5. Verify via /finance/me
    resp = requests.get(f"{BASE_URL}/finance/me", headers=headers)
    if resp.status_code == 200:
        fdata = resp.json()
        fin_val = fdata.get("monthly_investment")
        print(f"Verified Investment via /finance/me: {fin_val}")
        
        if float(fin_val) == float(new_amount):
            print("SUCCESS: /finance/me reflects the change.")
        else:
             print("FAILURE: /finance/me does not match.")
    else:
        print(f"Could not fetch finance: {resp.status_code}")

if __name__ == "__main__":
    try:
        test_investment_persistence()
    except Exception as e:
        print(f"Test crashed: {e}")
