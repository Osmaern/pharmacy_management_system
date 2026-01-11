# Pharmacy Management System (MVP)

Simple Pharmacy Management System (MVP) built with Flask and SQLite.

Core features:
- User roles (Admin / Pharmacist) - basic role selection UI
- Medicine inventory: add/update medicines, low-stock and expiry alerts
- Sales & billing: record sales, auto-reduce stock, printable receipt
- Customers: add customer name & phone (optional)
- Reports: daily sales, total sales summary, stock report

Prerequisites
- Python 3.8+
- PowerShell on Windows (instructions below)

Setup (Windows PowerShell)
```powershell
cd "C:\Users\ELVIS\Desktop\hospital"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Open your browser at `http://127.0.0.1:5000`.

Notes
- Database file `pharmacy.db` will be created in the project folder.
- This project is intentionally simple for learning and can be extended.
