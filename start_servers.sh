#!/bin/bash

# Start Python Flask server in the background
echo "Starting Flask server on port 5001..."
python run.py &
FLASK_PID=$!

# Give Flask a moment to start
sleep 2

# Start the Node.js server (will run in the foreground)
echo "Starting Node.js server on port 5000..."
npm run dev

# If Node.js exits, kill the Flask server too
kill $FLASK_PID