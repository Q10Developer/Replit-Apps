#!/bin/bash

# Start Node.js server (React frontend + API) in background
echo "Starting Node.js server..."
npm run dev &
NODE_PID=$!

# Wait a bit for Node.js server to start
sleep 2

# Start Flask server (Python backend)
echo "Starting Flask server..."
python run.py &
FLASK_PID=$!

# Handle graceful shutdown on script termination
trap "echo 'Stopping servers...'; kill $NODE_PID $FLASK_PID; exit" INT TERM EXIT

# Wait for both processes
wait