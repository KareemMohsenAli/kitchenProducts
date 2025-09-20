#!/usr/bin/env python3
"""
Simple HTTP Server for Eslam Aluminum Orders Application
This script allows you to run the application on any machine without npm or React installation.
"""

import http.server
import socketserver
import os
import sys
import webbrowser
from pathlib import Path

# Configuration
PORT = 8080
HOST = 'localhost'

def find_free_port():
    """Find a free port starting from the default port"""
    port = PORT
    while port < PORT + 100:
        try:
            with socketserver.TCPServer((HOST, port), http.server.SimpleHTTPRequestHandler) as server:
                return port
        except OSError:
            port += 1
    return None

def main():
    """Main function to start the server"""
    print("=" * 60)
    print("إسلام للألوميتال - نظام إدارة الطلبات")
    print("Eslam for Aluminum - Order Management System")
    print("=" * 60)
    
    # Change to the dist directory
    dist_dir = Path(__file__).parent / "dist"
    if not dist_dir.exists():
        print("❌ Error: dist directory not found!")
        print("Please run 'npm run build' first to create the production build.")
        sys.exit(1)
    
    os.chdir(dist_dir)
    print(f"📁 Serving files from: {dist_dir.absolute()}")
    
    # Find a free port
    port = find_free_port()
    if port is None:
        print("❌ Error: Could not find a free port!")
        sys.exit(1)
    
    # Start the server
    try:
        with socketserver.TCPServer((HOST, port), http.server.SimpleHTTPRequestHandler) as httpd:
            print(f"🚀 Server started successfully!")
            print(f"🌐 Application URL: http://{HOST}:{port}")
            print(f"📱 Local network URL: http://0.0.0.0:{port}")
            print("=" * 60)
            print("Press Ctrl+C to stop the server")
            print("=" * 60)
            
            # Try to open the browser automatically
            try:
                webbrowser.open(f"http://{HOST}:{port}")
                print("🌐 Browser opened automatically")
            except:
                print("⚠️  Could not open browser automatically")
                print(f"   Please open: http://{HOST}:{port}")
            
            # Start serving
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
