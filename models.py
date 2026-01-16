"""
models.py

Contains SQLAlchemy models for the Pharmacy MVP.
Keep things simple and documented for beginners.
"""
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

# SQLAlchemy object created here and initialized in app.py
db = SQLAlchemy()


class Admin(db.Model):
    """Admin user for login."""
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(30), nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Medicine(db.Model):
    """Medicine inventory record."""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    brand = db.Column(db.String(120))
    cost_price = db.Column(db.Float, nullable=False, default=0)
    price = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    expiry_date = db.Column(db.Date, nullable=True)
    category = db.Column(db.String(80))
    description = db.Column(db.Text)

    def is_expired(self, today=None):
        from datetime import date
        today = today or date.today()
        return self.expiry_date is not None and self.expiry_date < today

    def near_expiry(self, days=30, today=None):
        from datetime import date, timedelta
        today = today or date.today()
        if self.expiry_date is None:
            return False
        return today <= self.expiry_date <= (today + timedelta(days=days))


class Customer(db.Model):
    """Simple customer record (optional info)."""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(30))


class Sale(db.Model):
    """A recorded sale. Stock is reduced when sale is created."""
    id = db.Column(db.Integer, primary_key=True)
    medicine_id = db.Column(db.Integer, db.ForeignKey("medicine.id"), nullable=False)
    medicine = db.relationship("Medicine")
    quantity = db.Column(db.Integer, nullable=False)
    price_per_unit = db.Column(db.Float, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    # Store timestamp in local server time (not UTC)
    timestamp = db.Column(db.DateTime, default=datetime.now)
    customer_id = db.Column(db.Integer, db.ForeignKey("customer.id"), nullable=True)
    customer = db.relationship("Customer")
