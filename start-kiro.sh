#!/bin/bash

echo "Starting KiroAware..."

# Check if binaries exist, if not, tell user to download them
if [ ! -d "mcp-server/dist/binaries" ]; then
    echo "Error: Standalone binaries not found. Please download them from the releases page."
    exit 1
fi

# Detect OS
OS="linux"
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    OS="win.exe"
fi

BINARY="mcp-server/dist/binaries/kiroaware-mcp-server-$OS"

echo "Detected OS: $OS"
echo "Starting Backend..."
nohup ./"$BINARY" > backend.log 2>&1 &

echo "Starting Dashboard Preview..."
# Note: For a true SaaS experience, the dashboard should be served by the bridge or hosted on a CDN.
# For now, we use the local build.
cd demo-dashboard && npm run preview -- --port 4173 --host
