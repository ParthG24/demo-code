import subprocess
import sys
import os
from pathlib import Path

def main():
    """Start the FastAPI server"""
    print("Starting Ocean Hazard Detection Backend...")
    
    # Create media directory if it doesn't exist
    media_dir = Path("media")
    media_dir.mkdir(exist_ok=True)
    
    # Install dependencies
    print("Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("Dependencies installed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"Error installing dependencies: {e}")
        print("Please install dependencies manually: pip install -r requirements.txt")
    
    # Start the FastAPI server
    print("Starting FastAPI server on http://localhost:8000")
    try:
        subprocess.check_call([sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"])
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"Error starting server: {e}")
        print("Make sure uvicorn is installed: pip install uvicorn")

if __name__ == "__main__":
    main()