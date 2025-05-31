from flask import Flask
from .models import db

def create_app():
    app = Flask(__name__)
    
    # Database configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://sql7782165:dHXjmnpkuc@sql7.freesqldatabase.com/sql7782165'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions
    print("Initializing database...")
    db.init_app(app)
    print("Database initialized.")
    
    return app