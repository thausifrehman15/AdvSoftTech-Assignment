import json
import os
import uuid
from werkzeug.security import generate_password_hash, check_password_hash

USERS_FILE = "users.json"

def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

def register_user(username, password, email):
    users = load_users()
    if username in users:
        return False, "User already exists"
    
    hashed_password = generate_password_hash(password)
    users[username] = {"password": hashed_password}  # Store password as part of a dictionary
    save_users(users)
    return True, "User registered successfully"

def login_user(username: str, password: str) -> tuple[bool, str, dict]:
    try:
        with open('users.json', 'r') as f:
            users = json.load(f)
        
        if username not in users:
            return False, "User not found", {}
            
        stored_password = users[username]['password']
        if not check_password_hash(stored_password, password):
            return False, "Invalid password", {}
            
        user_data = {
            'id': users[username].get('id', str(uuid.uuid4())),
            'username': username,
            'email': users[username].get('email', '')
        }
        
        return True, "Login successful", user_data
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        return False, "Login failed", {}
