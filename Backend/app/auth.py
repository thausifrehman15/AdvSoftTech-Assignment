import json
import os
import uuid
import sys
from pathlib import Path
from typing import Tuple, Dict
from werkzeug.security import generate_password_hash, check_password_hash
from flask import current_app


# Add the parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from Database.models import User, db

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
        # Ensure app context is active
        with current_app.app_context():
            # Check if user already exists
            existing_user = User.query.filter_by(username=username).first()
            if existing_user:
                return False, "Username already exists", None

            existing_email = User.query.filter_by(email=email).first()
            if existing_email:
                return False, "Email already exists", None

            # Create new user
            hashed_password = generate_password_hash(password, method="pbkdf2:sha256")
            new_user = User(username=username, email=email, password=hashed_password)
            db.session.add(new_user)
            db.session.commit()

            return True, "User registered successfully", {
                "id": new_user.id,
                "username": new_user.username,
                "email": new_user.email
            }
    except Exception as e:
        return False, f"Error: {str(e)}", None

def login_user(username: str, password: str) -> Tuple[bool, str, Dict]:
    try:
        # Find user by username
        user = User.query.filter_by(username=username).first()
        if not user or not check_password_hash(user.password, password):
            return False, "Invalid username or password", None

        return True, "Login successful", {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    except Exception as e:
        return False, f"Error: {str(e)}", None