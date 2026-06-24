#!/bin/bash

# Script to stop all orchestrator-live services

echo "Stopping orchestrator-live services..."

# Stop the main Next.js orchestrator (port 3000)
echo "Stopping Next.js orchestrator..."
pkill -f "npm run start"

# Stop VR Video backend (port 3001)
echo "Stopping VR Video backend..."
pkill -f "node server.js"

# Stop DashCommander (port 8091)
echo "Stopping DashCommander..."
pkill -f "npm run dev"

# Stop Face Recognition API (port 8000) - Docker container
echo "Stopping Face Recognition API..."
docker stop vr-face-recognition

# Wait a moment for services to stop
sleep 3

# Verify services are stopped
echo "Checking service status..."
if ! curl -s http://localhost:3000 >/dev/null; then
  echo "✓ Orchestrator (port 3000) is stopped"
else
  echo "✗ Orchestrator (port 3000) is still running"
fi

if ! curl -s http://localhost:3001 >/dev/null; then
  echo "✓ VR Video backend (port 3001) is stopped"
else
  echo "✗ VR Video backend (port 3001) is still running"
fi

if ! curl -s http://localhost:8091 >/dev/null; then
  echo "✓ DashCommander (port 8091) is stopped"
else
  echo "✗ DashCommander (port 8091) is still running"
fi

if ! curl -s http://localhost:8000 >/dev/null; then
  echo "✓ Face Recognition API (port 8000) is stopped"
else
  echo "✗ Face Recognition API (port 8000) is still running"
fi

echo "All services stopped!"