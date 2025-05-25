from flask import Flask, request, jsonify, send_from_directory
import os
from app.model_loader import load_model
from app.predictor import predict_sentiment
from app.auth import register_user, login_user
from app.email_utils import send_email_with_attachment  # ✅ NEW
import pandas as pd
import io
import requests  # ✅ For internal API call
import json  # For handling JSON files
from flask_swagger_ui import get_swaggerui_blueprint
from flask_cors import CORS  # Import CORS
from flask_jwt_extended import create_access_token, JWTManager


app = Flask(__name__, static_url_path='/static', static_folder='static')
CORS(app)  # Enable CORS for all routes

# --- BEGIN JWT CONFIGURATION ---
app.config["JWT_SECRET_KEY"] = "login-token-test"  # IMPORTANT: Change this to a strong, random secret!
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False  # Disable token expiration for simplicity; adjust as needed
jwt = JWTManager(app) # Initialize Flask-JWT-Extended with your app
# --- END JWT CONFIGURATION ---

# Add these lines after creating the Flask app
SWAGGER_URL = '/api/docs'
API_URL = '/static/swagger.yaml'

swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={
        'app_name': "Sentiment Analysis API"
    }
)

app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

# Load model on startup
tokenizer, model, labels = load_model()

@app.route("/")
def home():
    return "Sentiment Analysis API is running."

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Please provide a 'text' field"}), 400

    result = predict_sentiment(data["text"], tokenizer, model, labels)
    result["text"] = data["text"] 
    return jsonify(result)

@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    email = data.get("email")

    if not username or not password or not email:
        return jsonify({"error": "Username, Password, and Email are Required"}), 400

    success, message = register_user(username, password, email)
    status = 200 if success else 409
    return jsonify({"message": message}), status

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    success, message = login_user(username, password)

    if success:
        # If credentials are valid, create an access token.
        access_token = create_access_token(identity=username)
        return jsonify({
            "message": message, 
            "token": access_token
        }), 200
    else:
        # Credentials invalid
        return jsonify({"message": message}), 401

@app.route("/notify", methods=["GET"])
def notify():
    print("📢 Notification: Bulk prediction completed.")
    return jsonify({"message": "File prediction completed successfully."})

@app.route("/subscribe", methods=["POST"])
def subscribe():
    """
    Subscribe a user to access bulk prediction.
    ---
    parameters:
      - name: username
        in: body
        required: true
        type: string
        description: The username to subscribe
    responses:
      200:
        description: User has been subscribed
      400:
        description: User not found
    """
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
    """
    Check if the user is subscribed.
    ---
    parameters:
      - name: username
        in: query
        required: true
        type: string
        description: The username to check subscription
    responses:
      200:
        description: User subscription status
    """
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
    """
    Predict sentiment for multiple texts from a CSV file.
    ---
    parameters:
      - name: file
        in: formData
        required: true
        type: file
        description: CSV file containing text to predict
      - name: email
        in: formData
        required: true
        type: string
        description: Email to send results
      - name: username
        in: formData
        required: true
        type: string
        description: Username to check subscription status
    responses:
      200:
        description: CSV file with predictions returned
      403:
        description: Access denied, user not subscribed
    """
    # Get the username from form data
    username = request.form.get('username')

    # Check if the user is subscribed
    try:
        response = requests.get(f"http://127.0.0.1:5000/check-subscription?username={username}")
        print(f"DEBUG: Calling internal API: {response}")
        data = response.json()

        if data["access"] == False:
            return jsonify({"error": data["message"]}), 403
    except Exception as e:
        print(f"ERROR: Generic unexpected exception during subscription check for '{username}': {str(e)}")
        import traceback # Make sure this import is here
        traceback.print_exc() # THIS WILL PRINT THE ACTUAL PYTHON ERROR
        return jsonify({"error": "Error checking subscription status"}), 500

    # If the user is subscribed, continue with the bulk prediction
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    email = request.form.get('email')

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    if not email:
        return jsonify({"error": "Email is required in form-data."}), 400

    try:
        df = pd.read_csv(file)

        if 'text' in df.columns:
            text_column = 'text'
        elif 'Text' in df.columns:
            text_column = 'Text'
        else:
            return jsonify({"error": "CSV must contain a 'text' or 'Text' column"}), 400

        rows = []

        for text in df[text_column]:
            result = predict_sentiment(str(text), tokenizer, model, labels)

            row = {
                "text": text,
                "category": result["category"],
                "final_prediction": result["final_prediction"],
                "avg_word_length": result["text_analysis"]["avg_word_length"],
                "has_exclamation": result["text_analysis"]["has_exclamation"],
                "has_question": result["text_analysis"]["has_question"],
                "length": result["text_analysis"]["length"],
                "word_count": result["text_analysis"]["word_count"],
                "Negative": result["sentiment_scores"].get("Negative", 0),
                "Slightly Negative": result["sentiment_scores"].get("Slightly Negative", 0),
                "neutral": result["sentiment_scores"].get("neutral", 0),
                "Slightly Positive": result["sentiment_scores"].get("Slightly Positive", 0),
                "Positive": result["sentiment_scores"].get("Positive", 0),
            }

            rows.append(row)

        result_df = pd.DataFrame(rows)
        csv_buffer = io.StringIO()
        result_df.to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)

        # ✅ Send email
        subject = "Sentiment Analysis Results – Detailed Report Inside"
        body = (
            "Hello Customer,\n\n"
            "Thank you for using our Sentiment Analysis service.\n\n"
            "Please find the attached file containing your predicted results.\n\n"
            "If you have any questions or feedback, feel free to reach out.\n\n"
            "Best regards,\n"
            "Team - SentiTech"
        )

        send_email_with_attachment(
            to_email=email,
            subject=subject,
            body=body,
            attachment_name="bulk_predictions.csv",
            attachment_data=csv_buffer.getvalue().encode("utf-8")
        )

        return csv_buffer.getvalue(), 200, {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=bulk_predictions.csv'
        }

    except Exception as e:
        return jsonify({"error": str(e)}), 500
