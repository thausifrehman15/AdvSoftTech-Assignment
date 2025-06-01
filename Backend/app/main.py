from flask import Flask, request, jsonify, send_file, current_app
import os
from app.predictor import predict_sentiment
from app.auth import register_user, login_user
from app.email_utils import send_email_with_attachment 
import pandas as pd
import io
import requests
from pathlib import Path
from flask_swagger_ui import get_swaggerui_blueprint
import jwt
from datetime import datetime, timedelta
from flask_cors import CORS
import json

import sys
import os

# Add the parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from Database import create_app
from Database.models import db, User, Subscription
from sqlalchemy import text as sql_text 


app = create_app()

# Add CORS to allow frontend requests
CORS(app)

SWAGGER_URL = '/api/docs'
API_URL = '/static/swagger.yaml'

swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={'app_name': "Sentiment Analysis API"}
)
app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

SECRET_KEY = 'your_secret_key'

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
            # Remove any 'Bearer ' prefix if present
            token = token.replace('Bearer ', '')
            
            decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            
            # Check if token contains required fields
            if not decoded_token.get("username") or not decoded_token.get("user_id"):
                return jsonify({"error": "Invalid token format"}), 403
                
            # Compare usernames case-insensitively
            if decoded_token.get("username").lower() != username.lower():
                return jsonify({"error": "Username mismatch"}), 403
                
            user_id = str(decoded_token.get("user_id"))
            
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        except Exception as e:
            return jsonify({"error": f"Token validation error: {str(e)}"}), 401

        # Get prediction data
        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": "No text provided"}), 400

        text_input = data["text"]
        result = predict_sentiment(text_input)

        # Save prediction to the database
        with app.app_context():
            user = User.query.filter_by(id=user_id).first()
            if not user:
                return jsonify({"error": "User not found"}), 404

            # Convert sentiment scores to string for storage
            sentiment_scores_json = json.dumps(result["sentiment_scores"])

            prediction_entry = {
                "user_id": user.id,
                "text": text_input,
                "final_prediction": result["final_prediction"],
                "confidence": result["confidence"],
                "sentiment_scores": sentiment_scores_json,  # Add this
                "created_at": datetime.utcnow()
            }
            
            db.session.execute(
                sql_text("""
                    INSERT INTO predictions 
                    (user_id, text, final_prediction, confidence, sentiment_scores, created_at) 
                    VALUES 
                    (:user_id, :text, :final_prediction, :confidence, :sentiment_scores, :created_at)
                """),
                prediction_entry
            )
            db.session.commit()

        return jsonify({
            "text": text_input,
            "final_prediction": result["final_prediction"],
            "confidence": result["confidence"],
            "sentiment_scores": result["sentiment_scores"],
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/signup", methods=["POST"])
def signup():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid request"}), 400

        username = data.get("username")
        password = data.get("password")
        email = data.get("email")

        if not all([username, password, email]):
            return jsonify({"error": "Missing required fields"}), 400

        # Ensure app context is active
        from Database import create_app
        app = create_app()
        with app.app_context():
            from app.auth import register_user
            success, message, user_data = register_user(username, password, email)

        if success:
            return jsonify({"message": message, "user": user_data}), 201
        else:
            return jsonify({"error": message}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"error": "Username and Password are required"}), 400

        # Ensure app context is active
        from Database import create_app
        app = create_app()
        with app.app_context():
            from app.auth import login_user
            success, message, user_data = login_user(username, password)

        if success:
            # Generate JWT token
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
        return jsonify({"error": str(e)}), 500


@app.route("/subscribe", methods=["POST"])
def subscribe():
    try:
        data = request.get_json()
        username = data.get("username")

        if not username:
            return jsonify({"error": "Username is required"}), 400

        # Find user
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Update subscription status
        subscription = Subscription.query.filter_by(user_id=user.id).first()
        if not subscription:
            subscription = Subscription(user_id=user.id, subscribed=True)
            db.session.add(subscription)
        else:
            subscription.subscribed = True
            subscription.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({"message": f"User {username} subscribed successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/check-subscription", methods=["GET"])
def check_subscription():
    username = request.args.get("username")

    if not username:
        return jsonify({"error": "Username is required."}), 400

    try:
        # Query the database for the user
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "User not found."}), 404

        # Query the database for the subscription status
        subscription = Subscription.query.filter_by(user_id=user.id).first()
        if not subscription or not subscription.subscribed:
            return jsonify({
                "access": False,
                "message": "Please subscribe to access bulk prediction."
            }), 403

        return jsonify({
            "access": True,
            "message": "You are subscribed!"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/bulk_predict", methods=["POST"])
def bulk_predict():
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
            user_id = str(decoded_token.get("user_id"))  # Convert user_id to string
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        # Check subscription status from the database
        with app.app_context():
            user = User.query.filter_by(id=user_id).first()
            if not user:
                return jsonify({"error": "User not found"}), 404

            subscription = Subscription.query.filter_by(user_id=user.id).first()
            if not subscription or not subscription.subscribed:
                return jsonify({
                    "error": "Subscription required",
                    "message": "Please subscribe to access bulk prediction feature"
                }), 403

        # Check if file is uploaded
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        # Read and process the CSV file
        file = request.files["file"]
        df = pd.read_csv(file)
        
        # Convert original file to string
        file.seek(0)
        original_content = file.read()

        # Process rows and create result DataFrame
        rows = []
        for index, text in enumerate(df['text']):
            if pd.isna(text) or str(text).strip() == '':
                continue
                
            result = predict_sentiment(str(text))
            print(f"Processing row {index + 1}: {text} -> {result}")
            
            # Convert sentiment_scores list to dictionary
            sentiment_dict = {}
            for score_item in result["sentiment_scores"]:
                sentiment_dict[score_item["name"]] = score_item["value"]
            
            row = {
                "text": text,
                "final_prediction": result["final_prediction"],
                "confidence": result["confidence"],
                "Negative": sentiment_dict.get("Negative", 0),
                "Slightly Negative": sentiment_dict.get("Slightly Negative", 0),
                "neutral": sentiment_dict.get("neutral", 0),
                "Slightly Positive": sentiment_dict.get("Slightly Positive", 0),
                "Positive": sentiment_dict.get("Positive", 0),
            }
            rows.append(row)

        # Create processed DataFrame and convert to CSV
        result_df = pd.DataFrame(rows)
        processed_content = result_df.to_csv(index=False).encode('utf-8')

        # Generate unique file ID
        file_id = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{file.filename}"

        # Store in database
        with app.app_context():
            # Insert file metadata
            db.session.execute(
                sql_text("INSERT INTO files (user_id, file_id, filename, status, created_at, updated_at) VALUES (:user_id, :file_id, :filename, :status, :created_at, :updated_at)"),
                {
                    "user_id": user.id,
                    "file_id": file_id,
                    "filename": file.filename,
                    "status": "completed",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            )

            # Insert file content as BLOB
            db.session.execute(
                sql_text("INSERT INTO file_blobs (file_id, user_id, original_content, processed_content, created_at) VALUES (:file_id, :user_id, :original_content, :processed_content, :created_at)"),
                {
                    "file_id": file_id,
                    "user_id": user.id,
                    "original_content": original_content,
                    "processed_content": processed_content,
                    "created_at": datetime.utcnow()
                }
            )
            db.session.commit()

        response_data = {
            "fileId": file_id,
            "name": file.filename,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "completed",
            "totalRows": len(rows),
            "message": "Bulk prediction completed successfully",
            "predictions": rows[:5]  # Return first 5 predictions as sample
        }

        return jsonify(response_data), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    
# 1. Prediction History API
@app.route("/prediction-history/<user_id>", methods=["GET"])
def get_prediction_history(user_id):
    try:
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

        # Fetch prediction history from the database
        with app.app_context():
            predictions_result = db.session.execute(
                sql_text("""
                    SELECT text, final_prediction, confidence, sentiment_scores, created_at 
                    FROM predictions 
                    WHERE user_id = :user_id 
                    ORDER BY created_at DESC
                """),
                {"user_id": user_id}
            ).fetchall()

            predictions = [
                {
                    "text": row.text,
                    "final_prediction": row.final_prediction,
                    "confidence": row.confidence,
                    "sentiment_scores": json.loads(row.sentiment_scores) if row.sentiment_scores else [],
                    "timestamp": row.created_at.isoformat()
                }
                for row in predictions_result
            ]

            return jsonify({
                "predictions": predictions,
                "total_predictions": len(predictions)
            }), 200

    except Exception as e:
        print(f"Error fetching prediction history: {str(e)}")
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
        with app.app_context():
            # Get pending files from database
            result = db.session.execute(
                sql_text("""
                    SELECT file_id, filename, created_at
                    FROM files 
                    WHERE user_id = :user_id AND status = 'pending'
                    ORDER BY created_at DESC
                """),
                {"user_id": user_id}
            ).fetchall()

            pending_files = [{
                "file_id": row.file_id,
                "filename": row.filename,
                "submitted_at": row.created_at.isoformat()
            } for row in result]
            
            return jsonify({
                "pending_files": pending_files,
                "total": len(pending_files)
            }), 200

    except Exception as e:
        print(f"Error getting pending files: {str(e)}")
        return jsonify({"error": str(e)}), 500

# 3. Completed Files API
@app.route("/my-files/<user_id>", methods=["GET"])
def get_completed_files(user_id):

    # Authentication checks...
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

    # Rest of the function remains the same...
    try:
        with app.app_context():
            # Get completed files from database
            result = db.session.execute(
                sql_text("""
                    SELECT f.file_id, f.filename, f.created_at, fb.processed_content 
                    FROM files f 
                    JOIN file_blobs fb ON f.file_id = fb.file_id 
                    WHERE f.user_id = :user_id AND f.status = 'completed'
                    ORDER BY f.created_at DESC
                """),
                {"user_id": user_id}
            ).fetchall()

            completed_files = []
            for row in result:
                # Create DataFrame from processed content
                content = io.StringIO(row.processed_content.decode('utf-8') if isinstance(row.processed_content, bytes) else row.processed_content)
                df = pd.read_csv(content, nrows=5)
                sample_predictions = df.to_dict('records')

                completed_files.append({
                    "file_id": row.file_id,
                    "filename": row.filename,
                    "completed_at": row.created_at.isoformat(),
                    "sample_predictions": sample_predictions
                })

            return jsonify({
                "completed_files": completed_files,
                "total": len(completed_files)
            }), 200

    except Exception as e:
        print(f"Error in get_completed_files: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/user-data/<user_id>", methods=["GET"])
def get_user_data(user_id):
    # Add token validation
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

    # Rest of the function remains the same...
    try:
        with app.app_context():
            # Update SQL query to include sentiment_scores
            predictions_result = db.session.execute(
                sql_text("""
                    SELECT id, text, final_prediction, confidence, sentiment_scores, created_at 
                    FROM predictions 
                    WHERE user_id = :user_id 
                    ORDER BY created_at DESC
                """),
                {"user_id": user_id}
            ).fetchall()

            predictions = [
                {
                    "id": row.id,
                    "text": row.text,
                    "final_prediction": row.final_prediction,
                    "confidence": row.confidence,
                    "sentiment_scores": json.loads(row.sentiment_scores) if row.sentiment_scores else [],
                    "timestamp": row.created_at.isoformat()
                }
                for row in predictions_result
            ]

            # Get completed files from database
            files_result = db.session.execute(
                sql_text("""
                    SELECT f.file_id, f.filename, f.created_at, fb.processed_content 
                    FROM files f 
                    JOIN file_blobs fb ON f.file_id = fb.file_id 
                    WHERE f.user_id = :user_id AND f.status = 'completed'
                    ORDER BY f.created_at DESC
                """),
                {"user_id": user_id}
            ).fetchall()

            completed_files = []
            for row in files_result:
                # Create DataFrame from processed content
                content = io.StringIO(row.processed_content.decode('utf-8') if isinstance(row.processed_content, bytes) else row.processed_content)
                df = pd.read_csv(content, nrows=5)
                sample_predictions = df.to_dict('records')

                completed_files.append({
                    "file_id": row.file_id,
                    "filename": row.filename,
                    "completed_at": row.created_at.isoformat(),
                    "sample_predictions": sample_predictions
                })

            response_data = {
                "user_id": user_id,
                "prediction_history": {
                    "predictions": predictions,
                    "total_predictions": len(predictions)
                },
                "completed_files": {
                    "files": completed_files,
                    "total": len(completed_files)
                }
            }

            return jsonify(response_data), 200

    except Exception as e:
        print(f"Error in get_user_data: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/files/<user_id>/<file_id>", methods=["GET"])
def get_file_data(user_id, file_id):
    # Add token validation
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

    # Rest of the function remains the same...
    try:
        with app.app_context():
            # Get file from database
            result = db.session.execute(
                sql_text("""
                    SELECT f.filename, fb.processed_content 
                    FROM files f 
                    JOIN file_blobs fb ON f.file_id = fb.file_id 
                    WHERE f.file_id = :file_id AND f.user_id = :user_id
                """),
                {"file_id": file_id, "user_id": user_id}
            ).fetchone()

            if not result:
                return jsonify({
                    "error": "File not found",
                    "message": "The requested file does not exist"
                }), 404

            filename, content = result

            # Convert content to DataFrame
            content_str = content.decode('utf-8') if isinstance(content, bytes) else content
            df = pd.read_csv(io.StringIO(content_str), nrows=10)

            file_data = {
                "file_id": file_id,
                "filename": filename,
                "total_rows_shown": len(df),
                "columns": list(df.columns),
                "data": df.to_dict('records')
            }

            return jsonify(file_data), 200

    except Exception as e:
        print(f"Error in get_file_data: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/files/<user_id>/<file_id>/download", methods=["GET"])
def download_file(user_id, file_id):
    try:
        # Get file content from database
        with app.app_context():
            result = db.session.execute(
                sql_text("""
                    SELECT f.filename, fb.processed_content 
                    FROM files f 
                    JOIN file_blobs fb ON f.file_id = fb.file_id 
                    WHERE f.file_id = :file_id AND f.user_id = :user_id
                """),
                {"file_id": file_id, "user_id": user_id}
            ).fetchone()

            if not result:
                return jsonify({
                    "error": "File not found",
                    "message": "The requested file does not exist"
                }), 404

            filename, content = result

            # Create BytesIO object from the content
            file_stream = io.BytesIO(content)

            # Clean filename
            original_filename = Path(filename).stem
            if original_filename.endswith('_completed'):
                original_filename = original_filename[:-10]
            
            clean_filename = original_filename.replace(' ', '_')
            if not clean_filename.endswith('.csv'):
                clean_filename += '.csv'

            return send_file(
                file_stream,
                mimetype='text/csv',
                as_attachment=True,
                download_name=f"predictions_{clean_filename}"
            )

    except Exception as e:
        print(f"Download error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/update-subscription", methods=["POST"])
def update_subscription():
    try:
        data = request.get_json()
        username = data.get("username")
        subscribed = data.get("subscribed", False)

        if not username:
            return jsonify({"error": "Username is required"}), 400

        # Ensure app context is active
        with app.app_context():
            # Find user in the database
            user = User.query.filter_by(username=username).first()
            if not user:
                return jsonify({"error": "User not found"}), 404

            # Update subscription status in the database
            subscription = Subscription.query.filter_by(user_id=user.id).first()
            if not subscription:
                subscription = Subscription(user_id=user.id, subscribed=subscribed)
                db.session.add(subscription)
            else:
                subscription.subscribed = subscribed
                subscription.updated_at = datetime.utcnow()

            db.session.commit()

        return jsonify({
            "success": True,
            "message": f"Subscription updated for {username}",
            "subscribed": subscribed
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

#NEW: Delete File API
@app.route("/files/<user_id>/<file_id>", methods=["DELETE"])
def delete_file(user_id, file_id):
    # Add token validation
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
        with app.app_context():
            # First, delete the file blob
            db.session.execute(
                sql_text("""
                    DELETE FROM file_blobs 
                    WHERE file_id = :file_id AND user_id = :user_id
                """),
                {"file_id": file_id, "user_id": user_id}
            )

            # Then, delete the file metadata
            result = db.session.execute(
                sql_text("""
                    DELETE FROM files 
                    WHERE file_id = :file_id AND user_id = :user_id
                    RETURNING filename
                """),
                {"file_id": file_id, "user_id": user_id}
            )
            
            db.session.commit()

            # Check if file was found and deleted
            deleted_file = result.fetchone()
            if not deleted_file:
                return jsonify({
                    "error": "File not found",
                    "message": "The requested file does not exist or you don't have permission to delete it"
                }), 404

            return jsonify({
                "success": True,
                "message": f"File {deleted_file.filename} deleted successfully",
                "file_id": file_id
            }), 200

    except Exception as e:
        print(f"Error deleting file: {str(e)}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)