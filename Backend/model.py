import json
import os
from werkzeug.security import generate_password_hash, check_password_hash

USERS_FILE = "users.json"
PREDICTIONS_FILE = "predictions.json"  # To store user's prediction history

def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def load_predictions():
    if not os.path.exists(PREDICTIONS_FILE):
        return {}
    with open(PREDICTIONS_FILE, "r") as f:
        return json.load(f)

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

def save_predictions(predictions):
    with open(PREDICTIONS_FILE, "w") as f:
        json.dump(predictions, f, indent=2)

def register_user(username, password, email):
    users = load_users()
    user_id = str(len(users) + 1)  # Generate user ID
    hashed_password = generate_password_hash(password)
    
    users[user_id] = {
        "username": username,
        "email": email,
        "password": hashed_password
    }
    
    save_users(users)
    
    # Initialize empty prediction history for the new user
    predictions = load_predictions()
    predictions[user_id] = []  # Initialize an empty prediction history
    save_predictions(predictions)
    
    return user_id, "User registered successfully"

def get_user_by_username_or_email(email=None, username=None):
    users = load_users()
    for user_id, user_data in users.items():
        if user_data['email'] == email or user_data['username'] == username:
            return user_id, user_data
    return None, None

def check_password(user_id, password):
    users = load_users()
    if user_id in users:
        hashed_password = users[user_id]['password']
        return check_password_hash(hashed_password, password)
    return False
