from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

password = "securepassword123"
print(f"Password length: {len(password)}")

try:
    hashed = pwd_context.hash(password)
    print(f"Hashed: {hashed}")
    
    verify = pwd_context.verify(password, hashed)
    print(f"Verify: {verify}")
except Exception as e:
    print(f"Error: {e}")
