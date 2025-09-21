#!/bin/bash

# Start FastAPI backend server

echo "Starting Ocean Hazard Detection Backend..."

# Create media directory if it doesn't exist
mkdir -p media

# Install dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
fi

# Start the FastAPI server
echo "Starting FastAPI server on http://localhost:8000"
python main.py