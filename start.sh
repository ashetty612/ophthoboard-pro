#!/bin/bash
# OphthoBoard Pro - Startup Script
# Run this to start the ophthalmology oral boards study tool

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORK_DIR="/tmp/ophthalmology-boards"

echo "================================================"
echo "  OphthoBoard Pro - Ophthalmology Oral Boards"
echo "  Interactive Study Tool"
echo "================================================"
echo ""

# Sync project to /tmp to avoid path-with-spaces issues
echo "Preparing application..."
rsync -aq --exclude .next "$SCRIPT_DIR/" "$WORK_DIR/"

cd "$WORK_DIR" || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies (first run only)..."
  npm install --silent 2>&1 | tail -3
fi

echo ""
echo "Starting OphthoBoard Pro..."
echo "Open your browser to: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npx next dev -p 3000
