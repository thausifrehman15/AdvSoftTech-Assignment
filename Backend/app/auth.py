import json
import os
import uuid
from pathlib import Path
from typing import Tuple, Dict
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

def register_user(username: str, password: str, email: str) -> Tuple[bool, str, Dict]:
    try:
        # Create users.json if it doesn't exist
        users_file = Path(USERS_FILE)
        if not users_file.exists():
            users_file.write_text('{}')

        # Load existing users
        with open(users_file, 'r') as f:
            users = json.load(f)

        # Check if username already exists
        if username in users:
            return False, "Username already exists", {}

        # Create new user with UUID
        user_id = str(uuid.uuid4())
        users[username] = {
            'id': user_id,
            'username': username,
            'password': password,  # In production, hash this password
            'email': email
        }

        # Save updated users
        with open(users_file, 'w') as f:
            json.dump(users, f, indent=4)

        # Return success with user data
        user_data = {
            'id': user_id,
            'username': username,
            'email': email
        }
        return True, "User registered successfully", user_data

    except Exception as e:
        print(f"Registration error: {str(e)}")
        return False, f"Registration failed: {str(e)}", {}

def login_user(username: str, password: str) -> tuple[bool, str, dict]:
    try:
        with open(USERS_FILE, 'r') as f:
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
