import sys
import os

# Add current directory to sys.path to allow imports like 'from db ...' to work
sys.path.append(os.getcwd())

from fastapi.testclient import TestClient
from main import app
import uuid

client = TestClient(app)

def test_auth_flow():
    # Generate unique email
    email = f"test_{uuid.uuid4()}@example.com"
    password = "securepassword123"

    print(f"Testing with email: {email}")

    # 1. Signup
    print("1. Testing Signup...")
    response = client.post(
        "/auth/signup",
        json={"email": email, "password": password}
    )
    if response.status_code != 200:
        print(f"Signup failed: {response.text}")
        return
    print("Signup successful!")
    user_id = response.json()["id"]

    # 2. Login
    print("2. Testing Login...")
    response = client.post(
        "/auth/login",
        data={"username": email, "password": password}
    )
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return
    print("Login successful!")
    token = response.json()["access_token"]
    token_type = response.json()["token_type"]

    # 3. Get Me (Protected Route)
    print("3. Testing Protected Route (/auth/me)...")
    headers = {"Authorization": f"{token_type} {token}"}
    response = client.get("/auth/me", headers=headers)
    if response.status_code != 200:
        print(f"Get Me failed: {response.text}")
        return
    
    me_data = response.json()
    if me_data["email"] != email:
        print("Email mismatch!")
        return
    print("Protected route accessed successfully!")
    print("\nALL TESTS PASSED")

if __name__ == "__main__":
    test_auth_flow()
