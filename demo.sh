#!/bin/bash
# Run the comprehensive demo

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo ""
echo "========================================"
echo " Sigment Language Constructor - Demo"
echo "========================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Running comprehensive demo..."
echo ""

node examples/demo.js

echo ""
echo "Demo complete!"
echo "Press Enter to continue..."
read