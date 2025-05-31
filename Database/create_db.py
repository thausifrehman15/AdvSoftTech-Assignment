from flask import Flask, jsonify
from Database import create_app
from models import db
import logging
import pymysql

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def test_connection():
    try:
        connection = pymysql.connect( 
            host='sql7.freesqldatabase.com',
            user='sql7782165',
            password='dHXjmnpkuc',
            database='sql7782165',
            port=3306
        )
        connection.close()
        return True, "Connection test successful"
    except Exception as e:
        return False, str(e)

def init_db():
    try:
        # Test raw connection first
        connection_success, message = test_connection()
        if not connection_success:
            return False, f"Connection test failed: {message}"

        # Create Flask app using factory
        app = create_app()
        
        with app.app_context():
            db.create_all()
            logger.info("Database tables created successfully")
            return True, "✅ Database created and connected successfully!"
            
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        return False, f"❌ Database creation failed: {str(e)}"


if __name__ == "__main__":
    # Initialize the database
    success, message = init_db()
    if success:
        logger.info(message)
    else:
        logger.error(message)
    
    # Start the Flask application
    app = create_app()
    app.run(debug=True, port=5000)