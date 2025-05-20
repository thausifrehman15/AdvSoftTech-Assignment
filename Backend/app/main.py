from flask import Flask, request, jsonify
from app.model_loader import load_model
from app.predictor import predict_sentiment
from app.auth import register_user, login_user
import pandas as pd
import io
import requests  # ✅ For internal API call

app = Flask(__name__)

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

    if not username or not password:
        return jsonify({"error": "Username and Password are Required"}), 400

    success, message = login_user(username, password)
    status = 200 if success else 401
    return jsonify({"message": message}), status

@app.route("/notify", methods=["GET"])
def notify():
    print("📢 Notification: Bulk prediction completed.")
    return jsonify({"message": " File prediction completed successfully."})

@app.route("/bulk_predict", methods=["POST"])
def bulk_predict():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

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

        # ✅ Call /notify internally
        try:
            requests.get("http://127.0.0.1:5000/notify")
        except Exception as e:
            print(f"⚠️ Failed to notify: {e}")

        return csv_buffer.getvalue(), 200, {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=bulk_predictions.csv'
        }

    except Exception as e:
        return jsonify({"error": str(e)}), 500
