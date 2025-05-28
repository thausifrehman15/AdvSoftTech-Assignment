from flask import Flask, request, jsonify
import os
from app.predictor import predict_sentiment
from app.auth import register_user, login_user
from app.email_utils import send_email_with_attachment  # ✅ NEW
import pandas as pd
import io
import requests  # ✅ For internal API call
import json
from flask_swagger_ui import get_swaggerui_blueprint
import jwt
from datetime import datetime, timedelta
from pathlib import Path
from flask_cors import CORS  # Add CORS support

# Initialize the app and load model
app = Flask(__name__)

# Add CORS to allow frontend requests
CORS(app)

# Add these lines after creating the Flask app
SWAGGER_URL = '/api/docs'
API_URL = '/static/swagger.yaml'

swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={'app_name': "Sentiment Analysis API"}
)
app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

SECRET_KEY = 'your_secret_key'  # This should be securely stored in your config

HISTORY_FILE = "prediction_history.json"
USER_FILES_DIR = Path("user_files")

# Create directory if it doesn't exist
USER_FILES_DIR.mkdir(exist_ok=True)

# Helper function to generate JWT token
def create_token(user_id, username, email):
    expiration_time = datetime.utcnow() + timedelta(hours=1)  # Token expires in 1 hour
    payload = {
        'user_id': user_id,
        'username': username,
        'email': email,
        'exp': expiration_time
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    return token

@app.route("/predict", methods=["POST"])
def predict():
    try:
        # Get token and user info from headers
        token = request.headers.get("authToken")
        username = request.headers.get("username")

        if not token or not username:
            return jsonify({"error": "Authorization required"}), 401

        # Verify token
        try:
            decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            if decoded_token.get("username") != username:
                return jsonify({"error": "Invalid token"}), 403
            user_id = decoded_token.get("user_id")
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        # Get prediction data
        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": "No text provided"}), 400

        text = data["text"]
        result = predict_sentiment(text)

        # Create user directory if it doesn't exist
        user_dir = USER_FILES_DIR / user_id
        user_dir.mkdir(exist_ok=True)
        
        history_file = user_dir / HISTORY_FILE

        # Load existing predictions
        try:
            with open(history_file, "r") as f:
                predictions = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            predictions = []

        # Add new prediction to user's history
        predictions.insert(0, result)

        # Save updated predictions
        with open(history_file, "w") as f:
            json.dump(predictions, f, indent=4)

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/signup", methods=["POST"])
def signup():
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "message": "No data provided"
            }), 400

        username = data.get("username")
        password = data.get("password")
        email = data.get("email")

        if not all([username, password, email]):
            return jsonify({
                "success": False,
                "message": "Email, Username, and Password are required"
            }), 400

        success, message, user_data = register_user(username, password, email)

        if success:
            response = {
                "success": True,
                "message": message,
                "user": user_data
            }
            status_code = 200
        else:
            response = {
                "success": False,
                "message": message
            }
            status_code = 409

        return jsonify(response), status_code

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Server error: {str(e)}"
        }), 500

@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        username = data.get("username")
        password = data.get("password")

        # Add debug logging
        print(f"Login attempt for username: {username}")
        print(f"Request data: {data}")

        if not username or not password:
            return jsonify({"error": "Username and Password are required"}), 400

        success, message, user_data = login_user(username, password)

        if success:
            # Generate token
            token = create_token(user_data['id'], username, user_data['email'])
            
            return jsonify({
                "token": token,
                "user": {
                    "id": user_data['id'],
                    "username": username,
                    "email": user_data['email']
                },
                "message": "Login successful"
            }), 200
        else:
            return jsonify({"error": message}), 401

    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/subscribe", methods=["POST"])
def subscribe():
    data = request.get_json()
    username = data.get("username")

    # Load users data from JSON file
    with open("users.json", "r") as f:
        users = json.load(f)

    if username not in users:
        return jsonify({"error": "User not found"}), 404

    # Update the subscription status
    with open("subscriptions.json", "r") as f:
        subscriptions = json.load(f)

    subscriptions[username] = True

    # Save the updated subscription data
    with open("subscriptions.json", "w") as f:
        json.dump(subscriptions, f, indent=4)

    return jsonify({"message": f"User {username} subscribed successfully!"}), 200

@app.route("/check-subscription", methods=["GET"])
def check_subscription():
    username = request.args.get("username")

    if not username:
        return jsonify({"error": "Username is required."}), 400

    # Load subscriptions data
    with open("subscriptions.json", "r") as f:
        subscriptions = json.load(f)

    if username not in subscriptions:
        return jsonify({"error": "User not found."}), 404

    # Check subscription status
    is_subscribed = subscriptions[username]

    if is_subscribed:
        return jsonify({"access": True, "message": "✅ You are subscribed!"}), 200
    else:
        return jsonify({"access": False, "message": "❌ Please subscribe to access bulk prediction."}), 403


@app.route("/bulk_predict", methods=["POST"])
def bulk_predict():
    try:
        # Check authentication
        token = request.headers.get("authToken")
        username = request.headers.get("username")

        if not token or not username:
            return jsonify({"error": "Authorization required"}), 401

        # Verify token
        try:
            decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            if decoded_token.get("username") != username:
                return jsonify({"error": "Invalid token"}), 403
            user_id = decoded_token.get("user_id")
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        # Check subscription status
        try:
            with open("subscriptions.json", "r") as f:
                subscriptions = json.load(f)
        except FileNotFoundError:
            subscriptions = {}

        if username not in subscriptions or not subscriptions[username]:
            return jsonify({
                "error": "Subscription required", 
                "message": "Please subscribe to access bulk prediction feature"
            }), 403

        # Check if file is uploaded
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        # Check file type
        if not file.filename.lower().endswith('.csv'):
            return jsonify({"error": "Only CSV files are allowed"}), 400

        # Read and validate CSV
        try:
            df = pd.read_csv(file)
        except Exception as e:
            return jsonify({"error": f"Invalid CSV file: {str(e)}"}), 400

        if 'text' not in df.columns:
            return jsonify({"error": "CSV must contain a 'text' column"}), 400

        if df.empty:
            return jsonify({"error": "CSV file is empty"}), 400

        # Process predictions
        rows = []
        for index, text in enumerate(df['text']):
            if pd.isna(text) or str(text).strip() == '':
                continue  # Skip empty rows
                
            result = predict_sentiment(str(text))
            
            row = {
                "text": text,
                "final_prediction": result["final_prediction"],
                "Negative": result["sentiment_scores"].get("Negative", 0),
                "Slightly Negative": result["sentiment_scores"].get("Slightly Negative", 0),
                "neutral": result["sentiment_scores"].get("neutral", 0),
                "Slightly Positive": result["sentiment_scores"].get("Slightly Positive", 0),
                "Positive": result["sentiment_scores"].get("Positive", 0),
            }
            rows.append(row)

        if not rows:
            return jsonify({"error": "No valid text data found in CSV"}), 400

        # Save results to user directory
        user_dir = USER_FILES_DIR / user_id
        user_dir.mkdir(exist_ok=True)
        
        # Generate unique filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        result_filename = f"bulk_predictions_{timestamp}_completed.csv"
        result_filepath = user_dir / result_filename
        
        result_df = pd.DataFrame(rows)
        result_df.to_csv(result_filepath, index=False)

        return jsonify({
            "message": "Bulk prediction completed successfully",
            "predictions": rows,
            "total_processed": len(rows),
            "file_saved": result_filename
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 1. Prediction History API
@app.route("/prediction-history/<user_id>", methods=["GET"])
def get_prediction_history(user_id):
    # Extract token and username from headers
    token = request.headers.get("authToken")
    username = request.headers.get("username")

    if not token or not username:
        return jsonify({"error": "Authorization token and Username are required"}), 401

    # Verify the token
    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        if decoded_token.get("username") != username:
            return jsonify({"error": "Invalid token or username mismatch"}), 403
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

    try:
        user_dir = USER_FILES_DIR / user_id
        history_file = user_dir / "prediction_history.json"

        if not history_file.exists():
            return jsonify({
                "user_id": user_id,
                "predictions": [],
                "total_predictions": 0
            }), 200

        with open(history_file, 'r') as f:
            predictions = json.load(f)
        
        response = {
            "user_id": user_id,
            "predictions": predictions,
            "total_predictions": len(predictions)
        }
        
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 2. Pending Files API
@app.route("/pending-files/<user_id>", methods=["GET"])
def get_pending_files(user_id):
    # Extract token and username from headers
    token = request.headers.get("authToken")
    username = request.headers.get("username")

    if not token or not username:
        return jsonify({"error": "Authorization token and Username are required"}), 401

    # Verify the token
    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        if decoded_token.get("username") != username:
            return jsonify({"error": "Invalid token or username mismatch"}), 403
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

    try:
        user_dir = USER_FILES_DIR / user_id
        if not user_dir.exists():
            return jsonify({"pending_files": [], "total": 0}), 200
            
        pending_files = []
        for file_path in user_dir.glob("*_pending.csv"):
            pending_files.append({
                "file_id": file_path.stem.replace("_pending", ""),
                "filename": file_path.name,
                "submitted_at": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
            })
            
        return jsonify({
            "pending_files": sorted(pending_files, key=lambda x: x["submitted_at"], reverse=True),
            "total": len(pending_files)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 3. Completed Files API
@app.route("/my-files/<user_id>", methods=["GET"])
def get_completed_files(user_id):
    # Extract token and username from headers
    token = request.headers.get("authToken")
    username = request.headers.get("username")

    if not token or not username:
        return jsonify({"error": "Authorization token and Username are required"}), 401

    # Verify the token
    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        if decoded_token.get("username") != username:
            return jsonify({"error": "Invalid token or username mismatch"}), 403
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

    try:
        user_dir = USER_FILES_DIR / user_id
        if not user_dir.exists():
            return jsonify({"completed_files": [], "total": 0}), 200
            
        completed_files = []
        for file_path in user_dir.glob("*_completed.csv"):
            with open(file_path, 'r') as f:
                df = pd.read_csv(f, nrows=5)
                sample_predictions = df.to_dict('records')
            
            completed_files.append({
                "file_id": file_path.stem.replace("_completed", ""),
                "filename": file_path.name,
                "completed_at": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat(),
                "sample_predictions": sample_predictions
            })
            
        return jsonify({
            "completed_files": sorted(completed_files, key=lambda x: x["completed_at"], reverse=True),
            "total": len(completed_files)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/user-data/<user_id>", methods=["GET"])
def get_user_data(user_id):
    # Extract token and username from headers
    token = request.headers.get("authToken")
    username = request.headers.get("username")

    if not token or not username:
        return jsonify({"error": "Authorization token and Username are required"}), 401

    # Verify the token
    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        if decoded_token.get("username") != username:
            return jsonify({"error": "Invalid token or username mismatch"}), 403
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

    try:
        user_dir = USER_FILES_DIR / user_id
        response_data = {
            "user_id": user_id,
            "prediction_history": {
                "predictions": [],
                "total_predictions": 0
            },
            "pending_files": {
                "files": [],
                "total": 0
            },
            "completed_files": {
                "files": [],
                "total": 0
            }
        }

        # Get prediction history
        history_file = user_dir / HISTORY_FILE
        if history_file.exists():
            with open(history_file, 'r') as f:
                predictions = json.load(f)
                response_data["prediction_history"] = {
                    "predictions": predictions,
                    "total_predictions": len(predictions)
                }

        # Get pending files
        pending_files = []
        for file_path in user_dir.glob("*_pending.csv"):
            pending_files.append({
                "file_id": file_path.stem.replace("_pending", ""),
                "filename": file_path.name,
                "submitted_at": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
            })
        response_data["pending_files"] = {
            "files": sorted(pending_files, key=lambda x: x["submitted_at"], reverse=True),
            "total": len(pending_files)
        }

        # Get completed files
        completed_files = []
        for file_path in user_dir.glob("*_completed.csv"):
            with open(file_path, 'r') as f:
                df = pd.read_csv(f, nrows=5)
                sample_predictions = df.to_dict('records')
            
            completed_files.append({
                "file_id": file_path.stem.replace("_completed", ""),
                "filename": file_path.name,
                "completed_at": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat(),
                "sample_predictions": sample_predictions
            })
        response_data["completed_files"] = {
            "files": sorted(completed_files, key=lambda x: x["completed_at"], reverse=True),
            "total": len(completed_files)
        }

        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)