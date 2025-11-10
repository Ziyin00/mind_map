#!/bin/bash
# Stop script for the backend server
# Kills all processes using port 8000

echo "🛑 Stopping backend server..."

PIDS=$(lsof -ti:8000)

if [ -z "$PIDS" ]; then
    echo "✅ No server running on port 8000"
else
    echo "Found processes: $PIDS"
    kill -9 $PIDS 2>/dev/null
    sleep 1
    
    # Verify
    if lsof -ti:8000 > /dev/null 2>&1; then
        echo "⚠️  Some processes may still be running"
    else
        echo "✅ Server stopped successfully"
    fi
fi





