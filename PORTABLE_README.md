# إسلام للألوميتال - نظام إدارة الطلبات
# Eslam for Aluminum - Order Management System

## 🚀 How to Run on Any Windows Machine

### Prerequisites
- **Python 3.6+** installed on the target machine
- Download from: https://www.python.org/downloads/
- Make sure to check "Add Python to PATH" during installation

### Setup Instructions

#### Step 1: Prepare the Application
On the development machine (where you have npm):
```bash
# 1. Install dependencies
npm install

# 2. Build the application
npm run build
```

#### Step 2: Copy Files to Target Machine
Copy these files/folders to the target machine:
```
📁 aluminum-orders/
├── 📁 dist/                    # Production build files
├── 📄 START.bat               # Double-click this to run!
├── 📄 run_server.py           # Python server script
└── 📄 README.txt              # Instructions
```

#### Step 3: Run the Application
1. **Double-click `START.bat`**
2. The application will open automatically in your browser
3. Access at: http://localhost:8080

### Features
- ✅ Create new orders
- ✅ View all orders
- ✅ Update existing orders
- ✅ Delete orders
- ✅ Generate PDF invoices
- ✅ Export/Import data (JSON)
- ✅ Arabic/English language support
- ✅ Local data storage (IndexedDB)
- ✅ Responsive design for mobile/tablet

### Troubleshooting

#### Python Not Found
- Install Python from https://www.python.org/downloads/
- Make sure to check "Add Python to PATH" during installation
- Restart command prompt/terminal after installation

#### Application Not Loading
- Make sure the `dist` folder exists and contains files
- Check that all files were copied correctly
- Try accessing the application directly: http://localhost:8080

#### Data Not Saving
- The application uses IndexedDB for local storage
- Data is stored in the browser, not on the server
- Make sure to use the same browser for consistency

### Quick Start
1. **Copy** the entire folder to target machine
2. **Double-click** `START.bat`
3. **Open** the application in your browser
4. **Start** creating orders!

---

**إسلام للألوميتال - نظام إدارة الطلبات**
**Eslam for Aluminum - Order Management System**