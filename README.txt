إسلام للألوميتال - نظام إدارة الطلبات
Eslam for Aluminum - Order Management System
===============================================

HOW TO RUN ON ANY WINDOWS MACHINE
=================================

STEP 1: INSTALL PYTHON
======================
1. Go to: https://www.python.org/downloads/
2. Download Python for Windows
3. During installation, check "Add Python to PATH"
4. Restart your computer

STEP 2: RUN THE APPLICATION
===========================
1. Copy this entire folder to the target machine
2. Double-click "START.bat"
3. The application will open in your browser at: http://localhost:8080

FILES NEEDED:
=============
📁 aluminum-orders/
├── 📁 dist/                    # Application files (created by npm run build)
├── 📄 START.bat               # Double-click this to run!
├── 📄 run_server.py           # Python server script
└── 📄 README.txt              # This file

THAT'S IT! NO OTHER SOFTWARE NEEDED!

The application will work perfectly with all features:
- Create, update, delete orders
- PDF generation
- Data export/import
- Arabic/English support
- Local data storage

If you have any issues:
- Make sure Python is installed and in PATH
- Make sure the "dist" folder exists
- Try running "python --version" in command prompt
