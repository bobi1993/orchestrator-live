#!/bin/bash

# Script to start all orchestrator-live services

echo "Starting orchestrator-live services..."

# Start the main Next.js orchestrator (port 3000)
echo "Starting Next.js orchestrator on port 3000..."
cd /Users/johndoe/face/orchestrator-live
npm run start > orchestrator.log 2>&1 &

# Start VR Video backend (port 3001)
echo "Starting VR Video backend on port 3001..."
cd /Users/johndoe/face/orchestrator-live/backend
node server.js > ../vrvideo-backend.log 2>&1 &

# Start DashCommander (port 8091)
echo "Starting DashCommander on port 8091..."
cd /Users/johndoe/Desktop/DashCommanderView/frontend
npm run dev > ../../dashcommander.log 2>&1 &

# Start Face Recognition API (port 8000) - Docker container
echo "Starting Face Recognition API on port 8000..."
cd /Users/johndoe/face/OpenFace
docker start vr-face-recognition || docker run -d -p 8000:8000 --name vr-face-recognition vrvideo-face-recognition

# Wait a moment for services to start
sleep 5

# Check if services are running
echo "Checking service status..."
if curl -s http://localhost:3000 >/dev/null; then
  echo "✓ Orchestrator (port 3000) is running"
else
  echo "✗ Orchestrator (port 3000) failed to start"
fi

if curl -s http://localhost:3001 >/dev/null; then
  echo "✓ VR Video backend (port 3001) is running"
else
  echo "✗ VR Video backend (port 3001) failed to start"
fi

if curl -s http://localhost:8091 >/dev/null; then
  echo "✓ DashCommander (port 8091) is running"
else
  echo "✗ DashCommander (port 8091) failed to start"
fi

if curl -s http://localhost:8000 >/dev/null; then
  echo "✓ Face Recognition API (port 8000) is running"
else
  echo "✗ Face Recognition API (port 8000) failed to start"
fi

if curl -s http://localhost:11434 >/dev/null; then
  echo "✓ Ollama (port 11434) is running"
else
  echo "✗ Ollama (port 11434) failed to start"
fi

echo "All services started! Access the orchestrator at http://localhost:3000"