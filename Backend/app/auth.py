import json
import os
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
    
    hashed_password = generate_password_hash(password,  method="pbkdf2:sha256")
    users[username] = hashed_password
    save_users(users)
    return True, "User registered successfully"

def login_user(username, password):
    users = load_users()
    if username not in users:
        return False, "User does not exist"
    
    hashed_password = users[username]
    if not check_password_hash(hashed_password, password):
        return False, "Incorrect password"

    return True, "Login successful"
